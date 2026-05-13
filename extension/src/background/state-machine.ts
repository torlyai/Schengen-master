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
import { notify, clearNotification } from './notifications';
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
} from './telegram';
import { maybeAutoLoginToTls } from './tls-auto-login';

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
      }
    }).catch(() => {
      // Auto-login crashed — still surface the notification.
      notify('LOGGED_OUT', target?.centre ?? null).catch(() => {});
      tgBlocker('LOGGED_OUT', target).catch(() => {});
    });
  }

  // Monitoring started/resumed — fire on any rising edge into NO_SLOTS from
  // a non-monitoring precursor. skipNotify suppresses user-driven paths
  // (ackSlot, classifyUnknown) where the user is already at the laptop.
  if (
    next === 'NO_SLOTS' &&
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
  }

  // Monitoring paused — fire on rising edge into PAUSED (user clicked the
  // Pause button in the popup). Same opt-in toggle as start/resume.
  if (next === 'PAUSED' && prev !== 'PAUSED') {
    const target = await getTarget();
    tgMonPaused(target).catch(() => { /* silent */ });
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
  // After resume, we don't know the state until the next detection. Reload
  // the watched tab to get a fresh signal; we go to NO_SLOTS as a polling-
  // permitted holding state.
  await transitionTo('NO_SLOTS');
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
 */
export async function onAutoStopTick(): Promise<void> {
  const persisted = await getState();
  if (persisted.state === 'CLOUDFLARE' || persisted.state === 'LOGGED_OUT') {
    await transitionTo('IDLE');
  }
}
