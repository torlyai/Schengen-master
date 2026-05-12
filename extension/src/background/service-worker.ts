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
      // For smart mode, the resolved cadence may have changed since last tick.
      await applyResolvedCadence();
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
      return { ok: true };
    }

    default: {
      const exhaustive: never = msg;
      throw new Error(`Unknown message type: ${(exhaustive as { type: string }).type}`);
    }
  }
}

// ---------- Status payload assembly ----------

async function buildStatusPayload(): Promise<StatusPayload> {
  const [settings, state, target, stats] = await Promise.all([
    getSettings(),
    getState(),
    getTarget(),
    getStats(),
  ]);

  // Resolve current cadence minutes (smart mode may differ from settings.cadenceMinutes).
  const cadence = await resolveCadence();

  return {
    state: state.state,
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
