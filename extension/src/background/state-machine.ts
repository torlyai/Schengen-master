// State machine — the brain that decides what happens when a detection
// result arrives or when the user takes an action.
//
// Implements wireframes §13. Transitions:
//
//   IDLE ↔ NO_SLOTS (when target page binds / unbinds)
//   NO_SLOTS → SLOT_AVAILABLE → (NOTIFY path)
//   * → CLOUDFLARE / LOGGED_OUT (auto-stop after 15 min unresolved)
//   * → UNKNOWN (await user classification)
//   * → PAUSED (user-initiated)

import type { ExtState } from '../shared/states';
import {
  getState,
  setState,
  getTarget,
  incrementStat,
  type PersistedState,
} from '../shared/storage';
import { parseTlsUrl } from '../shared/target';
import { setBadgeForState } from './badge';
import { notify, clearNotification, notifyAutoStopDesktop } from './notifications';
import {
  schedule,
  clear as clearSchedule,
  applyResolvedCadence,
  scheduleAutoStop,
  clearAutoStop,
  stateAllowsPolling,
} from './scheduler';
import {
  notifySlotAvailable as tgSlot,
  notifyBlocker as tgBlocker,
  notifyMonitoringStart as tgMonStart,
  notifyMonitoringPaused as tgMonPaused,
  notifyUnknown as tgUnknown,
  notifyWrongPage as tgWrongPage,
  notifyAutoStop as tgAutoStop,
} from './telegram';
import { notifyWebhook } from './webhook';
import { maybeAutoLoginToTls } from './tls-auto-login';
import { getTier } from '../shared/license';

// 15 min auto-stop window for CLOUDFLARE and LOGGED_OUT, per wireframes §5/§13.
const AUTOSTOP_MIN = 15;

// ---------- Public transitions ----------

/**
 * Apply a new detection result coming from the content script.
 * This is the main entry point from the SW message router.
 */
export async function applyDetection(
  detectedState: ExtState,
  evidence: string[],
  url: string,
): Promise<void> {
  const persisted = await getState();
  const prev = persisted.state;

  // Every detection is a check. pollOnce already stamps lastCheckTs + bumps
  // the counter right before triggering the tab reload, so if that timestamp
  // is <3s old we're inside a scheduled poll and skip the bookkeeping.
  // Otherwise this is an out-of-band detection (bootstrap adopt, manual page
  // refresh, etc.) — count it.
  const now = Date.now();
  const isFreshFromPoll =
    persisted.lastCheckTs !== null && now - persisted.lastCheckTs < 3000;
  if (!isFreshFromPoll) {
    await setState({ lastCheckTs: now });
    await incrementStat('checks', 1);
  }

  // Save / refresh target from the URL.
  const parsed = parseTlsUrl(url);
  if (parsed) {
    // We only commit a target when the URL looks like a real workflow page.
    // (Random TLS pages shouldn't change our centre.)
    const existing = await getTarget();
    if (!existing || existing.subjectCode !== parsed.subjectCode) {
      await chrome.storage.local.set({
        target: { url, ...parsed },
      });
    } else {
      // Keep the latest URL but preserve the centre/subjectCode.
      await chrome.storage.local.set({
        target: { ...existing, url },
      });
    }
  }

  // PAUSED state overrides incoming detections — they're informational only
  // until the user resumes.
  if (prev === 'PAUSED') {
    return;
  }

  // P1-6: setup-wizard and booking-FSM states are user-driven flows that
  // must not be knocked out by background detections. A user mid-wizard
  // could have a TLS tab open reporting LOGGED_OUT — without this guard,
  // the wizard would be replaced by the Free LOGGED_OUT screen.
  // PREMIUM_ACTIVE is intentionally NOT sticky — it's the Premium
  // equivalent of NO_SLOTS and needs to transition to SLOT_AVAILABLE
  // (which booking-fsm listens for) when a slot is detected.
  const STICKY_PREMIUM = new Set<ExtState>([
    'PREMIUM_PREFLIGHT',
    'PREMIUM_SETUP_CREDENTIALS',
    'PREMIUM_SETUP_SIGNING_IN',
    'PREMIUM_SETUP_BOOKING_WINDOW',
    'PREMIUM_SETUP_READY',
    'PREMIUM_VERIFICATION_GATE',
    'PREMIUM_SETUP_FAILED_RETRY',
    'PREMIUM_SETUP_FAILED_STALE',
    'PREMIUM_OPTIONS',
    'PREMIUM_BOOKING_IN_PROGRESS',
    'PREMIUM_BOOKED',
    'PREMIUM_BOOKING_FAILED',
    'PREMIUM_REFUND_PROMPT',
  ]);
  if (STICKY_PREMIUM.has(prev)) {
    return;
  }

  await transitionTo(detectedState, { evidence, prev });
}

interface TransitionCtx {
  evidence?: string[];
  prev?: ExtState;
  // For SLOT_AVAILABLE only: when set, skip the notification (used by
  // CLASSIFY_UNKNOWN so the user isn't re-notified by their own classification).
  skipNotify?: boolean;
}

/**
 * Core transition function. Idempotent for same-state transitions, but still
 * recomputes badges and scheduling.
 */
export async function transitionTo(next: ExtState, ctx: TransitionCtx = {}): Promise<void> {
  const persisted = await getState();
  const prev = ctx.prev ?? persisted.state;

  // Compute slotDetectedTs.
  let slotDetectedTs = persisted.slotDetectedTs;
  if (next === 'SLOT_AVAILABLE' && prev !== 'SLOT_AVAILABLE') {
    slotDetectedTs = Date.now();
  } else if (next !== 'SLOT_AVAILABLE') {
    slotDetectedTs = null;
  }

  // Auto-stop timer for blocker states.
  let blockerStartedTs = persisted.blockerStartedTs;
  if (next === 'CLOUDFLARE' || next === 'LOGGED_OUT') {
    if (blockerStartedTs === null || prev !== next) {
      blockerStartedTs = Date.now();
      await scheduleAutoStop(AUTOSTOP_MIN);
    }
  } else {
    if (blockerStartedTs !== null) {
      blockerStartedTs = null;
      await clearAutoStop();
    }
  }

  await setState({
    state: next,
    evidence: ctx.evidence ?? persisted.evidence,
    slotDetectedTs,
    blockerStartedTs,
  });

  // Side effects.
  await setBadgeForState(next);

  // Scheduling.
  if (stateAllowsPolling(next)) {
    if (prev === 'PAUSED' || prev === 'IDLE' || !stateAllowsPolling(prev)) {
      await applyResolvedCadence();
    }
  } else {
    await clearSchedule();
  }

  // Notifications, only on rising edge.
  if (next === 'SLOT_AVAILABLE' && prev !== 'SLOT_AVAILABLE' && !ctx.skipNotify) {
    await onSlotFound(persisted);
  }

  if (next === 'CLOUDFLARE' && prev !== 'CLOUDFLARE') {
    const target = await getTarget();
    await notify('CLOUDFLARE', target?.centre ?? null);
    tgBlocker('CLOUDFLARE', target).catch(() => { /* silent */ });
    notifyWebhook('blocker_cloudflare', {
      centre: target?.centre ?? null,
      subjectCode: target?.subjectCode ?? null,
      country: target?.country ?? null,
    }).catch(() => { /* fire-and-forget */ });
  }

  if (next === 'LOGGED_OUT' && prev !== 'LOGGED_OUT') {
    const target = await getTarget();
    // Premium auto-login bridge — PRD §11.3. If the install has a
    // licence + saved credentials, try filling the login form
    // first. The auto-login runs async; if it succeeds, the content
    // script's detection on the post-login redirect transitions us
    // out of LOGGED_OUT. If it declines (no creds, cooldown,
    // fail-count exceeded), the normal notification path runs.
    maybeAutoLoginToTls().then((attempted) => {
      if (!attempted) {
        // Free tier (or Premium without creds) — surface the
        // standard "log back in" prompt.
        notify('LOGGED_OUT', target?.centre ?? null).catch(() => {});
        tgBlocker('LOGGED_OUT', target).catch(() => {});
        notifyWebhook('blocker_logged_out', {
          centre: target?.centre ?? null,
          subjectCode: target?.subjectCode ?? null,
          country: target?.country ?? null,
        }).catch(() => {});
      }
    }).catch(() => {
      // Auto-login crashed — still surface the notification.
      notify('LOGGED_OUT', target?.centre ?? null).catch(() => {});
      tgBlocker('LOGGED_OUT', target).catch(() => {});
      notifyWebhook('blocker_logged_out', {
        centre: target?.centre ?? null,
        subjectCode: target?.subjectCode ?? null,
        country: target?.country ?? null,
      }).catch(() => {});
    });
  }

  // Monitoring started/resumed — fire on any rising edge into NO_SLOTS or
  // PREMIUM_ACTIVE from a non-monitoring precursor. skipNotify suppresses
  // user-driven paths (ackSlot, classifyUnknown) where the user is
  // already at the laptop.
  // PRD 14 §6 row 18: closes the Premium-side gap where resume from
  // PAUSED/CLOUDFLARE/LOGGED_OUT into PREMIUM_ACTIVE never pinged.
  if (
    (next === 'NO_SLOTS' || next === 'PREMIUM_ACTIVE') &&
    !ctx.skipNotify &&
    (prev === 'IDLE' ||
      prev === 'PAUSED' ||
      prev === 'UNKNOWN' ||
      prev === 'CLOUDFLARE' ||
      prev === 'LOGGED_OUT')
  ) {
    const target = await getTarget();
    const isResume = prev === 'PAUSED' || prev === 'CLOUDFLARE' || prev === 'LOGGED_OUT';
    tgMonStart(target, isResume ? 'resumed' : 'started').catch(() => { /* silent */ });
    notifyWebhook(isResume ? 'monitoring_resumed' : 'monitoring_started', {
      centre: target?.centre ?? null,
      subjectCode: target?.subjectCode ?? null,
      country: target?.country ?? null,
    }).catch(() => { /* fire-and-forget */ });
  }

  // Monitoring paused — fire on rising edge into PAUSED (user clicked the
  // Pause button in the popup). Same opt-in toggle as start/resume.
  if (next === 'PAUSED' && prev !== 'PAUSED') {
    const target = await getTarget();
    tgMonPaused(target).catch(() => { /* silent */ });
    notifyWebhook('monitoring_paused', {
      centre: target?.centre ?? null,
      subjectCode: target?.subjectCode ?? null,
      country: target?.country ?? null,
    }).catch(() => { /* fire-and-forget */ });
  }

  // PRD 14 §6 row 9 — UNKNOWN rising edge. Desktop + Telegram (both opt-in
  // / default-off respectively). Without this, an away-from-laptop user
  // never knows the page stopped classifying and polling was suspended.
  if (next === 'UNKNOWN' && prev !== 'UNKNOWN' && !ctx.skipNotify) {
    const target = await getTarget();
    notify('UNKNOWN', target?.centre ?? null).catch(() => {});
    tgUnknown(target).catch(() => { /* silent */ });
    notifyWebhook('unknown_page', {
      centre: target?.centre ?? null,
      subjectCode: target?.subjectCode ?? null,
      country: target?.country ?? null,
    }).catch(() => { /* fire-and-forget */ });
  }

  // PRD 14 §6 row 10 — WRONG_PAGE rising edge. Telegram-only by default
  // (desktop ping is opt-in per coverage matrix — desktop only fires if
  // notifDesktop is on AND user navigates the popup). We surface both so
  // the existing notifDesktop master toggle still gates desktop.
  if (next === 'WRONG_PAGE' && prev !== 'WRONG_PAGE' && !ctx.skipNotify) {
    const target = await getTarget();
    notify('WRONG_PAGE', target?.centre ?? null).catch(() => {});
    tgWrongPage(target).catch(() => { /* silent */ });
    notifyWebhook('wrong_page', {
      centre: target?.centre ?? null,
      subjectCode: target?.subjectCode ?? null,
      country: target?.country ?? null,
    }).catch(() => { /* fire-and-forget */ });
  }

  // Tell the content script to clear/apply the tab affordance.
  await applyTabAffordance(next);
}

async function onSlotFound(_prevState: PersistedState): Promise<void> {
  const target = await getTarget();

  await incrementStat('slots', 1);
  await notify('SLOT_AVAILABLE', target?.centre ?? null);

  // Telegram phone notification — full no-op when disabled.
  try {
    await tgSlot(target);
  } catch {
    /* Telegram failures must never crash the SW */
  }

  // Webhook (PRD 14 §6 row 4) — same payload fields as Telegram. No
  // URL, no DOM contents; data-minimisation guard in webhook.ts strips
  // any credential-shaped keys defensively.
  notifyWebhook('slot_available', {
    centre: target?.centre ?? null,
    subjectCode: target?.subjectCode ?? null,
    country: target?.country ?? null,
  }).catch(() => { /* fire-and-forget */ });
}

async function applyTabAffordance(state: ExtState): Promise<void> {
  const persisted = await getState();
  if (persisted.watchedTabId === null) return;

  try {
    if (state === 'SLOT_AVAILABLE') {
      await chrome.tabs.sendMessage(persisted.watchedTabId, { type: 'APPLY_SLOT_AFFORDANCE' });
    } else {
      await chrome.tabs.sendMessage(persisted.watchedTabId, { type: 'CLEAR_SLOT_AFFORDANCE' });
    }
  } catch {
    /* content script not loaded yet — that's fine */
  }
}

// ---------- User-initiated actions ----------

export async function pause(): Promise<void> {
  await transitionTo('PAUSED');
  await clearSchedule();
  await clearAutoStop();
  await clearNotification('SLOT_AVAILABLE');
}

export async function resume(): Promise<void> {
  // After resume, we don't know the state until the next detection.
  // Tier-aware holding state: Premium users return to PREMIUM_ACTIVE
  // (so the popup keeps Premium chrome); Free users go to NO_SLOTS.
  // Both states allow polling via stateAllowsPolling().
  const tier = await getTier();
  await transitionTo(tier === 'premium' ? 'PREMIUM_ACTIVE' : 'NO_SLOTS');
}

export async function ackSlot(): Promise<void> {
  // Keep watching — drop the SLOT_AVAILABLE state, clear the notification.
  await clearNotification('SLOT_AVAILABLE');
  await transitionTo('NO_SLOTS', { skipNotify: true });
}

export async function stopBooking(): Promise<void> {
  // Auto-stop: user is booking now. Go IDLE.
  await clearNotification('SLOT_AVAILABLE');
  await transitionTo('IDLE');
  await clearSchedule();
}

export async function classifyUnknown(resolution: ExtState): Promise<void> {
  // Apply the user's classification as if it were a normal detection,
  // but skip the SLOT_AVAILABLE notification — the user already saw the slot
  // (they're sitting in front of the popup).
  await transitionTo(resolution, { skipNotify: true });
}

/**
 * Called from chrome.alarms.onAlarm when AUTOSTOP_ALARM fires.
 * If we're still stuck in CLOUDFLARE / LOGGED_OUT after 15 min, fall to IDLE.
 *
 * PRD 14 §2.1 / §6 row 12 — also surface a desktop + Telegram ping so
 * the away-from-laptop user knows the watchdog gave up. Without these
 * the user thinks monitoring is running when it isn't (silent failure).
 */
export async function onAutoStopTick(): Promise<void> {
  const persisted = await getState();
  if (persisted.state === 'CLOUDFLARE' || persisted.state === 'LOGGED_OUT') {
    const blockerKind = persisted.state;
    const target = await getTarget();
    await transitionTo('IDLE');
    notifyAutoStopDesktop(blockerKind, target?.centre ?? null).catch(() => {});
    tgAutoStop(blockerKind, target).catch(() => { /* silent */ });
    notifyWebhook('auto_stop', {
      reason: blockerKind,
      centre: target?.centre ?? null,
      subjectCode: target?.subjectCode ?? null,
      country: target?.country ?? null,
    }).catch(() => { /* fire-and-forget */ });
  }
}
