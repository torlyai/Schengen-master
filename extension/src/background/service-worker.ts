// Service worker — the brain of the extension.
//
// Responsibilities:
//  - Wire up chrome.runtime.onInstalled (open welcome tab).
//  - Wire up chrome.alarms (polling + auto-stop).
//  - Wire up chrome.runtime.onMessage (UI ↔ SW + content script).
//  - Wire up chrome.notifications.onClicked (focus TLS tab).
//  - Wire up chrome.tabs.onRemoved (clear watched tab if it disappears).

import type { Msg, StatusPayload } from '../shared/messages';
import type { ExtState } from '../shared/states';
import {
  getSettings,
  setSettings,
  getState,
  setState,
  getTarget,
  getStats,
  setConsent,
  getConsent,
  DEFAULT_STATE,
  getBookingWindow,
  setBookingWindow,
  deriveAcceptingRange,
  setTlsCredentials,
  forgetTlsCredentials,
} from '../shared/storage';
import { parseTlsUrl, isTlsUrl } from '../shared/target';

import { setBadgeForState } from './badge';
import { installNotificationClickHandler } from './notifications';
import {
  POLL_ALARM,
  AUTOSTOP_ALARM,
  pollOnce,
  checkNow,
  applyResolvedCadence,
  resolveCadence,
  clear as clearSchedule,
  schedule,
  stateAllowsPolling,
  healPollAlarm,
} from './scheduler';
import {
  applyDetection,
  pause,
  resume,
  ackSlot,
  stopBooking,
  classifyUnknown,
  onAutoStopTick,
  transitionTo,
} from './state-machine';
import { testConnection as testTelegram } from './telegram';
import { checkForUpdate } from './update-checker';
import {
  getLicense,
  getTier,
  clearLicense,
  installLicenseFromJwt,
  getOrCreateInstallId,
} from '../shared/license';
import {
  startCheckout,
  fetchLicenseStatus,
} from './backend-client';
import {
  maybeStartBookingOnSlot,
  handleBookingConfirmed,
  handleBookingTimeout,
  refundActiveBooking,
} from './booking-fsm';

// ---------- Install / startup ----------

chrome.runtime.onInstalled.addListener(async (details) => {
  // Seed defaults so any subsequent read works.
  await getSettings();

  if (details.reason === 'install') {
    // Open welcome tab on first install.
    try {
      const welcomeUrl = chrome.runtime.getURL('src/welcome/welcome.html');
      await chrome.tabs.create({ url: welcomeUrl });
    } catch {
      /* ignore — welcome can be opened later via settings */
    }
  }

  // Restore badge from persisted state (cold start sees nothing on the icon).
  const s = await getState();
  await setBadgeForState(s.state);
});

chrome.runtime.onStartup?.addListener(async () => {
  const s = await getState();
  await setBadgeForState(s.state);
});

// Some SW lifecycles don't fire onStartup; do a best-effort bootstrap on
// every cold start of this module.
(async () => {
  try {
    const s = await getState();
    await setBadgeForState(s.state);
    await adoptExistingTlsTab();
    // After cold start, the chrome.alarms persistence layer can sometimes
    // have dropped the POLL_ALARM (sleep/wake on macOS in particular).
    // If state still expects polling, ensure the alarm is registered.
    await healPollAlarm();
  } catch {
    /* ignore */
  }
})();

// On cold start the SW missed any tabs that were already loaded. Look for one
// and bind it, then inject the content script so detection runs immediately.
async function adoptExistingTlsTab(): Promise<void> {
  try {
    const tabs = await chrome.tabs.query({ url: 'https://*.tlscontact.com/*' });
    if (tabs.length === 0) return;
    // Prefer a tab whose URL parses as a workflow target.
    const candidate =
      tabs.find((t) => t.url && parseTlsUrl(t.url)) ?? tabs[0];
    if (!candidate?.id || !candidate.url) return;

    const s = await getState();
    if (s.watchedTabId === null) {
      await setState({ watchedTabId: candidate.id });
    }
    const parsed = parseTlsUrl(candidate.url);
    if (parsed) {
      await chrome.storage.local.set({
        target: { url: candidate.url, ...parsed },
      });
      const cur = await getState();
      if (cur.state === 'IDLE') {
        await transitionTo('NO_SLOTS');
      }
    }
    // Force a fresh detection. The tab was already loaded when the SW woke
    // up, so the content script (declared in manifest.content_scripts) didn't
    // get a chance to inject. Reloading the tab triggers normal injection at
    // document_idle, which then emits DETECTION_RESULT.
    try {
      await chrome.tabs.reload(candidate.id);
    } catch {
      /* ignore */
    }
  } catch {
    /* ignore */
  }
}

// ---------- Alarms ----------

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === POLL_ALARM) {
    const s = await getState();
    if (s.state === 'NO_SLOTS' || s.state === 'SLOT_AVAILABLE') {
      // For smart mode, the resolved cadence may have changed since the alarm
      // was first scheduled (e.g. we just crossed a release-window boundary).
      // Only call schedule() — which clears + recreates the alarm — when the
      // cadence actually changed. Recreating on every fire is the canonical
      // way chrome.alarms.create can race with its own dispatch and lose the
      // next tick; sticking with the existing repeating alarm avoids that.
      const resolved = await resolveCadence();
      const existing = await chrome.alarms.get(POLL_ALARM);
      const sameCadence =
        existing && Math.abs((existing.periodInMinutes ?? 0) - resolved.minutes) < 0.01;
      if (!sameCadence) {
        await schedule(resolved.minutes);
      } else {
        // Refresh the countdown anchor for the popup's "next check in" display.
        await setState({ nextCheckTs: Date.now() + resolved.minutes * 60_000 });
      }
      await pollOnce();
    } else {
      // We shouldn't be polling in this state — clear the alarm defensively.
      await clearSchedule();
    }
    return;
  }

  if (alarm.name === AUTOSTOP_ALARM) {
    await onAutoStopTick();
    return;
  }

  if (alarm.name === 'VM_BOOKING_TIMEOUT') {
    // Premium auto-booking exceeded its 60s budget without seeing
    // a BOOKING_CONFIRMED message. Fail the attempt cleanly with
    // no charge (PRD §12).
    await handleBookingTimeout();
    return;
  }
});

// ---------- Tab lifecycle ----------

chrome.tabs.onRemoved.addListener(async (tabId) => {
  const s = await getState();
  if (s.watchedTabId === tabId) {
    await setState({ watchedTabId: null });
    // If the user closed the TLS tab, go IDLE.
    if (s.state !== 'IDLE' && s.state !== 'PAUSED') {
      await transitionTo('IDLE');
    }
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') return;
  if (!tab.url || !isTlsUrl(tab.url)) return;

  // Bind this tab as the watched tab if we don't have one yet.
  const s = await getState();
  if (s.watchedTabId === null) {
    await setState({ watchedTabId: tabId });
  }

  // If this is a workflow URL, set the target.
  const parsed = parseTlsUrl(tab.url);
  if (parsed) {
    await chrome.storage.local.set({ target: { url: tab.url, ...parsed } });
    // If we're IDLE and a workflow page just appeared, start monitoring.
    if (s.state === 'IDLE') {
      await transitionTo('NO_SLOTS');
    }
  }
});

// ---------- Notifications ----------

installNotificationClickHandler();

// ---------- Message router ----------

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const msg = message as Msg | { type: string };

  // We always return true (async response). The actual response is sent
  // from within handle().
  (async () => {
    try {
      const result = await handle(msg as Msg);
      sendResponse({ ok: true, data: result });
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      sendResponse({ ok: false, error: err });
    }
  })();

  return true;
});

async function handle(msg: Msg): Promise<unknown> {
  switch (msg.type) {
    case 'GET_STATUS':
      // Opportunistically heal the poll alarm whenever the popup asks for
      // status — guarantees that simply opening the popup re-arms polling
      // after a missed alarm.
      await healPollAlarm();
      return buildStatusPayload();

    case 'STATUS':
      // Outbound shape — should not arrive at SW. Ignore.
      return null;

    case 'PAUSE':
      await pause();
      return buildStatusPayload();

    case 'RESUME':
      await resume();
      return buildStatusPayload();

    case 'CHECK_NOW': {
      const r = await checkNow();
      return r;
    }

    case 'OPEN_TLS_TAB': {
      const s = await getState();
      if (s.watchedTabId !== null) {
        try {
          const t = await chrome.tabs.get(s.watchedTabId);
          if (t.windowId !== undefined) {
            await chrome.windows.update(t.windowId, { focused: true });
          }
          await chrome.tabs.update(s.watchedTabId, { active: true });
          return { ok: true };
        } catch {
          /* fall through */
        }
      }
      // Fallback: open the stored target URL if we have one.
      const t = await getTarget();
      if (t?.url) {
        const created = await chrome.tabs.create({ url: t.url, active: true });
        if (created.id !== undefined) {
          await setState({ watchedTabId: created.id });
        }
        return { ok: true };
      }
      return { ok: false, error: 'No TLS tab and no stored target URL' };
    }

    case 'ACK_SLOT':
      await ackSlot();
      return buildStatusPayload();

    case 'STOP_BOOKING':
      await stopBooking();
      return buildStatusPayload();

    case 'SET_CADENCE': {
      await setSettings({
        cadenceMode: msg.mode,
        ...(msg.minutes !== undefined ? { cadenceMinutes: msg.minutes } : {}),
      });
      // Re-apply if we're currently polling.
      const s = await getState();
      if (s.state === 'NO_SLOTS' || s.state === 'SLOT_AVAILABLE') {
        await applyResolvedCadence();
      }
      return buildStatusPayload();
    }

    case 'CLASSIFY_UNKNOWN':
      await classifyUnknown(msg.resolution);
      return buildStatusPayload();

    case 'CONSENT_GRANTED': {
      const existing = await getConsent();
      if (!existing) {
        await setConsent({ tsGranted: Date.now(), version: '1.0.0' });
      }
      await setSettings({ uiLang: msg.uiLang });
      return { ok: true };
    }

    case 'GET_SETTINGS':
      return await getSettings();

    case 'SETTINGS':
      // Outbound shape — should not arrive at SW. Ignore.
      return null;

    case 'UPDATE_SETTINGS': {
      const merged = await setSettings(msg.patch);
      // If cadence-related changed and we're polling, re-apply.
      if (
        msg.patch.cadenceMode !== undefined ||
        msg.patch.cadenceMinutes !== undefined ||
        msg.patch.releaseWindowsEnabled !== undefined ||
        msg.patch.releaseWindows !== undefined
      ) {
        const s = await getState();
        if (s.state === 'NO_SLOTS' || s.state === 'SLOT_AVAILABLE') {
          await applyResolvedCadence();
        }
      }
      return merged;
    }

    case 'CHECK_UPDATE':
      return await checkForUpdate();

    case 'TEST_TELEGRAM':
      return await testTelegram();

    case 'DETECTION_RESULT': {
      await applyDetection(msg.state, msg.evidence, msg.url);

      // Premium auto-book bridge: if the detection that just landed is
      // SLOT_AVAILABLE and this install is Premium with a slot that
      // fits the booking window, take over with the booking FSM. The
      // FSM transitions the state to PREMIUM_BOOKING_IN_PROGRESS
      // immediately; the brief SLOT_AVAILABLE flash + Free-tier
      // notification still fire but are quickly superseded — by design.
      if (msg.state === 'SLOT_AVAILABLE') {
        const status = await buildStatusPayload();
        await maybeStartBookingOnSlot(status);
      }
      return { ok: true };
    }

    case 'BOOKING_CONFIRMED': {
      // Premium-only path. The booking FSM verifies tier + active
      // booking + idempotency before calling the backend capture.
      // Free-tier installs without an active booking get { ok: false }
      // which is swallowed by the content script (no UX impact).
      const result = await handleBookingConfirmed({
        bookingId: msg.bookingId,
        slotAt: msg.slotAt,
        centre: msg.centre,
      });
      return result;
    }

    // ── Premium message handlers (PRD docs/09) ──
    // PHASE 2 partial wiring: UPGRADE_TO_PREMIUM + START_PREMIUM_SETUP +
    // OPEN/CLOSE_PREMIUM_OPTIONS are now wired. Setup-wizard transitions,
    // Stripe activation, refund, and booking-FSM message handlers still
    // log-and-stub — they need backend (PHASE 3) and booking automation
    // (PHASE 4) to actually do anything.

    case 'UPGRADE_TO_PREMIUM': {
      // Free-tier nudge clicked. Open the in-extension Premium intro
      // page in a new tab and focus it. PRD docs/09 §7 / wireframes
      // docs/10 P-17.
      const url = chrome.runtime.getURL('src/premium/premium.html');
      try {
        await chrome.tabs.create({ url, active: true });
      } catch {
        /* SW may not have tabs permission on some Chromium variants */
      }
      return { ok: true };
    }

    case 'PREMIUM_INSTALL_LICENSE': {
      // The content script on torly.ai/visa-master/activated relayed
      // the JWT to us. Persist it (license.ts will refuse malformed or
      // expired tokens). Then transition to PREMIUM_PREFLIGHT so the
      // in-popup setup wizard runs (TLS creds + booking window) — the
      // user is now a paid Premium tier but hasn't configured automation.
      // The wizard's final step transitions to PREMIUM_ACTIVE.
      const installed = await installLicenseFromJwt(msg.licenseToken);
      if (!installed) {
        return { ok: false, error: 'Invalid licence token' };
      }
      await transitionTo('PREMIUM_PREFLIGHT', {});
      return { ok: true, data: { tier: installed.tier } };
    }

    case 'PREMIUM_CANCEL': {
      // User clicked "Cancel Premium" in P-12 Options. Wipe the
      // license token locally — scanning falls back to Free. The
      // Stripe card stays on file (user can re-activate later).
      // Backend will sync via /webhook on customer-side actions.
      await clearLicense();
      await transitionTo('IDLE', {});
      return { ok: true };
    }

    case 'START_PREMIUM_SETUP': {
      // User clicked "Start setup" on the intro page. The £19 success-fee
      // model commits the user via Stripe FIRST (Setup Intent — £0 today,
      // card on file), then the in-popup wizard runs post-payment.
      //
      // Flow:
      //   1. POST /api/visa-master/checkout to get the Stripe Checkout URL.
      //   2. Open it in a new tab.
      //   3. After Stripe success → torly.ai/visa-master/activated →
      //      license-relay → PREMIUM_INSTALL_LICENSE → wizard starts.
      //
      // We deliberately DO NOT transition to PREMIUM_PREFLIGHT here —
      // doing so before payment would let users enter TLS creds without
      // ever committing financially.
      const installId = await getOrCreateInstallId();
      const result = await startCheckout(installId);
      if (!result.ok) {
        console.error('[Premium] checkout failed', result);
        return { ok: false, error: result.error };
      }
      try {
        // active:true so the user lands on the Stripe tab immediately —
        // without this they have to hunt for it in the tab bar (P2-1).
        await chrome.tabs.create({ url: result.data.checkoutUrl, active: true });
      } catch {
        /* SW may not have tabs permission on some Chromium variants */
      }
      return { ok: true, data: { url: result.data.checkoutUrl } };
    }

    case 'OPEN_PREMIUM_OPTIONS': {
      // Header More button on PREMIUM_ACTIVE → swap to PREMIUM_OPTIONS.
      // StatusPayload return mirrors the wizard handlers — useStatus.send()
      // needs a payload-shaped response to re-render the popup.
      await transitionTo('PREMIUM_OPTIONS', {});
      return buildStatusPayload();
    }

    case 'CLOSE_PREMIUM_OPTIONS': {
      // Body Back link or "Never mind" on RefundPrompt → return to ACTIVE.
      await transitionTo('PREMIUM_ACTIVE', {});
      return buildStatusPayload();
    }

    case 'PREMIUM_REQUEST_REFUND': {
      // PRD §6.5. PHASE 4: booking-fsm.ts persists the booking IDs at
      // capture time, so we can refund without a server lookup.
      // Backend enforces the 24h window — if elapsed, we surface the
      // backend's 409 response back to the popup.
      const result = await refundActiveBooking(msg.reason);
      return result;
    }

    case 'PREMIUM_SAVE_BOOKING_WINDOW': {
      // P-6 setup step 3 — travel date + buffer + Prime Time toggle.
      // Persisted to chrome.storage.local under 'bookingWindow'.
      // The derived acceptingFrom/To range is recomputed on every
      // status read, so changes are picked up immediately by the
      // auto-book FSM.
      await setBookingWindow({
        travelDate: msg.travelDate,
        visaProcessingDays: msg.visaProcessingDays,
        minDaysNotice: msg.minDaysNotice,
        includePrimeTime: msg.includePrimeTime,
        // groupId is optional on the message because the wizard's step 3
        // doesn't collect it (that field is surfaced in PremiumOptions
        // post-setup). Pass through only if the sender supplied it.
        ...(msg.groupId !== undefined ? { groupId: msg.groupId } : {}),
      });
      // From the wizard step 3 we should advance to READY. From the
      // Options page we should stay on OPTIONS — don't ratchet state
      // backwards into the wizard.
      const cur = (await getState()).state;
      if (cur === 'PREMIUM_SETUP_BOOKING_WINDOW') {
        await transitionTo('PREMIUM_SETUP_READY', {});
      }
      return buildStatusPayload();
    }

    case 'PREMIUM_SAVE_CREDENTIALS': {
      // P-4 setup step 1. AES-GCM encrypted at rest via
      // src/shared/crypto.ts. Never transmitted to torly.ai or any
      // other server — PRD §11.1 invariant.
      //
      // Lazy validation: we don't probe TLS during setup (would need
      // an open TLS tab + working auto-login selectors — P0-4). Real
      // creds get tested the first time a LOGGED_OUT state arises.
      await setTlsCredentials({ email: msg.email, password: msg.password });
      await transitionTo('PREMIUM_SETUP_BOOKING_WINDOW', {});
      return buildStatusPayload();
    }

    case 'PREMIUM_FORGET_CREDENTIALS': {
      // P-12 danger button. Wipes the encrypted creds AND the crypto
      // salt — any future encryption uses a fresh salt + key.
      // Premium itself stays active (license token survives).
      await forgetTlsCredentials();
      return { ok: true };
    }

    case 'PREMIUM_SETUP_NEXT': {
      // Two transitions are NEXT-driven (steps with no input to save):
      //   PREFLIGHT → CREDENTIALS    (Preflight checklist → step 1 form)
      //   READY     → ACTIVE         (final wizard CTA — see SetupReadyToActivate)
      // CREDENTIALS→BOOKING_WINDOW and BOOKING_WINDOW→READY are driven by
      // their respective SAVE messages, not NEXT.
      // Returns StatusPayload so useStatus.send() re-renders the popup
      // — without that, the wizard would advance in storage but the
      // popup React tree would stay on the previous step.
      const { state } = await getState();
      if (state === 'PREMIUM_PREFLIGHT') {
        await transitionTo('PREMIUM_SETUP_CREDENTIALS', {});
      } else if (state === 'PREMIUM_SETUP_READY') {
        await transitionTo('PREMIUM_ACTIVE', {});
      }
      return buildStatusPayload();
    }

    case 'PREMIUM_SETUP_BACK': {
      const { state } = await getState();
      if (state === 'PREMIUM_SETUP_CREDENTIALS') {
        await transitionTo('PREMIUM_PREFLIGHT', {});
      } else if (state === 'PREMIUM_SETUP_BOOKING_WINDOW') {
        await transitionTo('PREMIUM_SETUP_CREDENTIALS', {});
      } else if (state === 'PREMIUM_SETUP_READY') {
        await transitionTo('PREMIUM_SETUP_BOOKING_WINDOW', {});
      }
      return buildStatusPayload();
    }

    case 'PREMIUM_SETUP_RESET': {
      await transitionTo('PREMIUM_PREFLIGHT', {});
      return buildStatusPayload();
    }

    case 'PREMIUM_SETUP_SKIP': {
      // P1-3: user bails out of the wizard. Premium is already paid for
      // (Stripe Setup Intent ran before the wizard), so we drop them on
      // PREMIUM_ACTIVE rather than IDLE. They can finish setup later via
      // PREMIUM_OPTIONS. Auto-login won't work until credentials are
      // saved; slot-window filtering won't apply until booking window
      // is set — both degraded but valid.
      await transitionTo('PREMIUM_ACTIVE', {});
      return buildStatusPayload();
    }

    default: {
      const exhaustive: never = msg;
      throw new Error(`Unknown message type: ${(exhaustive as { type: string }).type}`);
    }
  }
}

// ---------- Status payload assembly ----------

async function buildStatusPayload(): Promise<StatusPayload> {
  const [settings, state, target, stats, bookingWindow, tier] = await Promise.all([
    getSettings(),
    getState(),
    getTarget(),
    getStats(),
    getBookingWindow(),
    getTier(),
  ]);

  // Resolve current cadence minutes (smart mode may differ from settings.cadenceMinutes).
  const cadence = await resolveCadence();
  // Derive Premium booking-window range.
  const range = deriveAcceptingRange(bookingWindow);

  return {
    state: state.state,
    tier,
    lastCheckTs: state.lastCheckTs,
    nextCheckTs: state.nextCheckTs,
    cadenceMin: cadence.minutes,
    cadenceMode: cadence.mode,
    target: target
      ? {
          url: target.url,
          centre: target.centre,
          subjectCode: target.subjectCode,
          country: target.country,
        }
      : null,
    todayChecks: stats.checks,
    todaySlots: stats.slots,
    evidence: state.evidence,
    slotDetectedTs: state.slotDetectedTs,
    notif: settings.notifDesktop ? 'ON' : 'OFF',
    uiLang: settings.uiLang,
    detectionLang: settings.detectionLang,
    // Premium fields (PRD docs/09 §8.4). All optional in StatusPayload;
    // popup states ignore them when license tier is 'free'.
    travelDate: bookingWindow.travelDate,
    visaProcessingDays: bookingWindow.visaProcessingDays,
    minDaysNotice: bookingWindow.minDaysNotice,
    includePrimeTime: bookingWindow.includePrimeTime,
    groupId: bookingWindow.groupId,
    acceptingFrom: range.from,
    acceptingTo: range.to,
  };
}

// Defensive: if persisted state references a stale watchedTabId at SW
// startup, fix it.
(async () => {
  try {
    const s = await getState();
    if (s.watchedTabId !== null) {
      try {
        await chrome.tabs.get(s.watchedTabId);
      } catch {
        await setState({ ...DEFAULT_STATE, ...s, watchedTabId: null });
      }
    }
  } catch {
    /* ignore */
  }
})();

// Avoid unused import warnings in some configurations.
export type { ExtState };
