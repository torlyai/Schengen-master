// Polling scheduler. Uses chrome.alarms (NOT setTimeout) so polling survives
// MV3 service-worker eviction.
//
// Public API:
//   schedule(cadenceMin)   — (re)create the alarm with the given cadence
//   clear()                — stop polling entirely
//   checkNow()             — rate-limited, manually-triggered reload
//   resolveCadence()       — figure out the right cadence in minutes from
//                            current settings + clock time (smart-mode aware)
//   handleAlarm()           — must be called from chrome.alarms.onAlarm

import type { CadenceMode, ExtState } from '../shared/states';
import { CADENCE_PRESET_MIN, SMART_DEFAULTS } from '../shared/states';
import { getSettings, getState, setState, incrementStat } from '../shared/storage';
import { isTlsUrl } from '../shared/target';

export const POLL_ALARM = 'poll';
export const AUTOSTOP_ALARM = 'autostop';

// chrome.alarms enforces a minimum periodInMinutes of 1 (in unpacked dev
// it's also 0.5, but we don't rely on that). Anything we resolve below 1
// gets clamped.
const MIN_PERIOD_MIN = 1;

// CHECK_NOW rate limit — once per 30 seconds.
const CHECK_NOW_COOLDOWN_MS = 30_000;
let lastCheckNowTs = 0;

// ---------- Smart-mode time-window resolution ----------

function nowInUkMinutes(): number {
  // Convert "now" to minutes-since-midnight in UK local time (Europe/London).
  // Approach: format current Date via Intl using the London zone, then parse.
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = fmt.formatToParts(new Date());
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const m = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  return h * 60 + m;
}

function parseHhMmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map((n) => Number(n));
  return (h ?? 0) * 60 + (m ?? 0);
}

function isInWindow(nowMin: number, startMin: number, endMin: number): boolean {
  // Windows can wrap midnight (e.g. 23:30 → 00:30).
  if (startMin <= endMin) {
    return nowMin >= startMin && nowMin <= endMin;
  }
  return nowMin >= startMin || nowMin <= endMin;
}

/**
 * Resolve the cadence (in minutes) we should currently be polling at, based
 * on the user's settings, the cadence mode, and the current UK time.
 */
export async function resolveCadence(): Promise<{ minutes: number; mode: CadenceMode }> {
  const settings = await getSettings();
  const mode: CadenceMode = settings.cadenceMode;

  if (mode === 'custom') {
    return { minutes: Math.max(MIN_PERIOD_MIN, settings.cadenceMinutes || 4), mode };
  }
  if (mode === 'aggressive') {
    return { minutes: CADENCE_PRESET_MIN.aggressive, mode };
  }
  if (mode === 'gentle') {
    return { minutes: CADENCE_PRESET_MIN.gentle, mode };
  }

  // Smart mode — look at the release windows and current UK time.
  const windows =
    settings.releaseWindowsEnabled && settings.releaseWindows.length > 0
      ? settings.releaseWindows
      : SMART_DEFAULTS.releaseWindows;

  const nowMin = nowInUkMinutes();
  for (const w of windows) {
    if (isInWindow(nowMin, parseHhMmToMinutes(w.startUk), parseHhMmToMinutes(w.endUk))) {
      return { minutes: Math.max(MIN_PERIOD_MIN, w.pollMin), mode };
    }
  }
  return { minutes: SMART_DEFAULTS.offWindowMin, mode };
}

// ---------- Alarm lifecycle ----------

export async function schedule(cadenceMin: number): Promise<void> {
  const period = Math.max(MIN_PERIOD_MIN, cadenceMin);
  await chrome.alarms.clear(POLL_ALARM);
  await chrome.alarms.create(POLL_ALARM, {
    delayInMinutes: period,
    periodInMinutes: period,
  });
  await setState({ nextCheckTs: Date.now() + period * 60_000 });
}

export async function clear(): Promise<void> {
  await chrome.alarms.clear(POLL_ALARM);
  await setState({ nextCheckTs: null });
}

export async function scheduleAutoStop(minutesFromNow: number): Promise<void> {
  await chrome.alarms.clear(AUTOSTOP_ALARM);
  await chrome.alarms.create(AUTOSTOP_ALARM, {
    delayInMinutes: Math.max(MIN_PERIOD_MIN, minutesFromNow),
  });
}

export async function clearAutoStop(): Promise<void> {
  await chrome.alarms.clear(AUTOSTOP_ALARM);
}

// ---------- Poll execution ----------

/**
 * Find the TLS tab we should reload. Preference order:
 *   1. The persisted watchedTabId (if it still points at a TLS page).
 *   2. The first matching tab by URL pattern.
 * Returns null if no TLS tab is open.
 */
async function findWatchedTab(): Promise<chrome.tabs.Tab | null> {
  const persisted = await getState();

  if (persisted.watchedTabId !== null && persisted.watchedTabId !== undefined) {
    try {
      const t = await chrome.tabs.get(persisted.watchedTabId);
      if (t && isTlsUrl(t.url)) return t;
    } catch {
      /* tab gone */
    }
  }

  // Fallback — first matching TLS tab.
  const tabs = await chrome.tabs.query({ url: 'https://*.tlscontact.com/*' });
  if (tabs.length === 0) return null;
  const tab = tabs[0];

  // Cache for next time.
  if (tab && tab.id !== undefined) {
    await setState({ watchedTabId: tab.id });
  }
  return tab ?? null;
}

/**
 * Trigger one poll — reload the watched tab so the content script re-runs.
 * Idempotent and safe to call from alarms or CHECK_NOW.
 */
export async function pollOnce(): Promise<void> {
  const tab = await findWatchedTab();
  if (!tab || tab.id === undefined) {
    // No TLS tab — drop the watchedTabId so the next open page re-binds.
    await setState({ watchedTabId: null });
    return;
  }

  try {
    await chrome.tabs.reload(tab.id, { bypassCache: false });
    await setState({ lastCheckTs: Date.now() });
    await incrementStat('checks', 1);
  } catch {
    /* tab might have been closed mid-poll */
  }
}

export async function checkNow(): Promise<{ ok: boolean; reason?: string }> {
  const now = Date.now();
  if (now - lastCheckNowTs < CHECK_NOW_COOLDOWN_MS) {
    const waitS = Math.ceil((CHECK_NOW_COOLDOWN_MS - (now - lastCheckNowTs)) / 1000);
    return { ok: false, reason: `Rate limited (wait ${waitS}s)` };
  }
  lastCheckNowTs = now;
  await pollOnce();
  return { ok: true };
}

// ---------- Re-scheduling on cadence change ----------

/**
 * Convenience: re-resolve cadence from settings and reschedule. Should be
 * called after settings change, after RESUME, and inside the alarm handler
 * (so smart-mode can hop between windows over time).
 */
export async function applyResolvedCadence(): Promise<{ minutes: number; mode: CadenceMode }> {
  const resolved = await resolveCadence();
  await schedule(resolved.minutes);
  return resolved;
}

/**
 * Should we be polling right now, given the current state?
 * Some states (CLOUDFLARE, LOGGED_OUT, UNKNOWN, PAUSED, IDLE) suppress polling.
 */
export function stateAllowsPolling(state: ExtState): boolean {
  return state === 'NO_SLOTS' || state === 'SLOT_AVAILABLE';
}
