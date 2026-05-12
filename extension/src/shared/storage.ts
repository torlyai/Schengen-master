// Thin, typed wrappers around chrome.storage.local.
//
// Keys (must remain stable — UI agent reads from these too):
//   settings   : SettingsPayload
//   state      : { state: ExtState; lastCheckTs; nextCheckTs; evidence; slotDetectedTs }
//   target     : { url, centre, subjectCode, country }
//   stats      : { date: 'YYYY-MM-DD', checks: number, slots: number }
//   consent    : { tsGranted: number, version: string }
//   openclaw   : { gateway: string; encryptedToken?: string; passphraseHint?: string }

import type { SettingsPayload } from './messages';
import type { ExtState } from './states';

export interface PersistedState {
  state: ExtState;
  lastCheckTs: number | null;
  nextCheckTs: number | null;
  evidence: string[];
  slotDetectedTs: number | null;
  // Tab id of the watched TLS tab. Persisted so the SW can recover after eviction.
  watchedTabId: number | null;
  // For Cloudflare / Logged-out auto-stop timers.
  blockerStartedTs: number | null;
}

export interface PersistedTarget {
  url: string;
  centre: string;
  subjectCode: string;
  country: string;
}

export interface PersistedStats {
  date: string; // YYYY-MM-DD in user's local timezone
  checks: number;
  slots: number;
}

export interface PersistedConsent {
  tsGranted: number;
  version: string;
}

export interface PersistedOpenClaw {
  gateway: string;
  encryptedToken?: string;     // AES-GCM blob, base64
  iv?: string;                 // base64 IV used during encryption
  salt?: string;               // base64 PBKDF2 salt
  passphraseHint?: string;
  // When openClawEncrypt is FALSE, store the raw token directly (still local-only).
  plainToken?: string;
}

export const DEFAULT_SETTINGS: SettingsPayload = {
  cadenceMode: 'smart',
  cadenceMinutes: 4,
  releaseWindowsEnabled: true,
  releaseWindows: [
    { startUk: '06:00', endUk: '09:30', pollMin: 2 },
    { startUk: '23:30', endUk: '00:30', pollMin: 2 },
  ],
  notifDesktop: true,
  notifSound: true,
  notifTabTitle: true,
  notifAutoFocus: false,
  uiLang: 'en',
  detectionLang: 'en',
  telemetry: false,
  openClawEncrypt: true,
  telegramEnabled: false,
  telegramBotToken: '',
  telegramChatId: '',
  telegramAlsoBlockers: false,
  telegramMonitoringStart: false,
};

export const DEFAULT_STATE: PersistedState = {
  state: 'IDLE',
  lastCheckTs: null,
  nextCheckTs: null,
  evidence: [],
  slotDetectedTs: null,
  watchedTabId: null,
  blockerStartedTs: null,
};

// ---------- generic helpers ----------

async function getRaw<T>(key: string): Promise<T | undefined> {
  const v = await chrome.storage.local.get(key);
  return v[key] as T | undefined;
}

async function setRaw(key: string, value: unknown): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}

// ---------- settings ----------

export async function getSettings(): Promise<SettingsPayload> {
  const s = await getRaw<SettingsPayload>('settings');
  if (!s) {
    await setRaw('settings', DEFAULT_SETTINGS);
    return { ...DEFAULT_SETTINGS };
  }
  // Merge defaults so new fields added later don't crash existing installs.
  return { ...DEFAULT_SETTINGS, ...s };
}

export async function setSettings(patch: Partial<SettingsPayload>): Promise<SettingsPayload> {
  const current = await getSettings();
  const merged = { ...current, ...patch };
  await setRaw('settings', merged);
  return merged;
}

// ---------- state ----------

export async function getState(): Promise<PersistedState> {
  const s = await getRaw<PersistedState>('state');
  if (!s) return { ...DEFAULT_STATE };
  return { ...DEFAULT_STATE, ...s };
}

export async function setState(patch: Partial<PersistedState>): Promise<PersistedState> {
  const current = await getState();
  const merged = { ...current, ...patch };
  await setRaw('state', merged);
  return merged;
}

// ---------- target ----------

export async function getTarget(): Promise<PersistedTarget | null> {
  return (await getRaw<PersistedTarget>('target')) ?? null;
}

export async function setTarget(t: PersistedTarget | null): Promise<void> {
  if (t === null) {
    await chrome.storage.local.remove('target');
  } else {
    await setRaw('target', t);
  }
}

// ---------- stats ----------

function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function getStats(): Promise<PersistedStats> {
  const s = await getRaw<PersistedStats>('stats');
  const today = todayKey();
  if (!s || s.date !== today) {
    const fresh: PersistedStats = { date: today, checks: 0, slots: 0 };
    await setRaw('stats', fresh);
    return fresh;
  }
  return s;
}

export async function incrementStat(field: 'checks' | 'slots', by = 1): Promise<PersistedStats> {
  const current = await getStats();
  current[field] += by;
  await setRaw('stats', current);
  return current;
}

// ---------- consent ----------

export async function getConsent(): Promise<PersistedConsent | null> {
  return (await getRaw<PersistedConsent>('consent')) ?? null;
}

export async function setConsent(c: PersistedConsent): Promise<void> {
  await setRaw('consent', c);
}

// ---------- openclaw ----------

export async function getOpenClaw(): Promise<PersistedOpenClaw | null> {
  return (await getRaw<PersistedOpenClaw>('openclaw')) ?? null;
}

export async function setOpenClaw(v: PersistedOpenClaw | null): Promise<void> {
  if (v === null) {
    await chrome.storage.local.remove('openclaw');
  } else {
    await setRaw('openclaw', v);
  }
}

// ---------- subscribe ----------

// Convenience for the UI: react to a key changing.
export function onStorageChange<T>(
  key: string,
  cb: (newValue: T | undefined, oldValue: T | undefined) => void,
): () => void {
  const handler = (
    changes: { [k: string]: chrome.storage.StorageChange },
    areaName: chrome.storage.AreaName,
  ): void => {
    if (areaName !== 'local') return;
    if (!(key in changes)) return;
    const c = changes[key];
    if (!c) return;
    cb(c.newValue as T | undefined, c.oldValue as T | undefined);
  };
  chrome.storage.onChanged.addListener(handler);
  return () => chrome.storage.onChanged.removeListener(handler);
}
