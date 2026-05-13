// Thin, typed wrappers around chrome.storage.local.
//
// Keys (must remain stable — UI agent reads from these too):
//   settings        : SettingsPayload
//   state           : { state: ExtState; lastCheckTs; nextCheckTs; evidence; slotDetectedTs }
//   target          : { url, centre, subjectCode, country }
//   stats           : { date: 'YYYY-MM-DD', checks: number, slots: number }
//   consent         : { tsGranted: number, version: string }
//   bookingWindow   : { travelDate, visaProcessingDays, minDaysNotice, includePrimeTime, groupId }
//                     — Premium only (PRD docs/09 §8.4)

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
  telegramEnabled: false,
  telegramBotToken: '',
  telegramChatId: '',
  telegramAlsoBlockers: false,
  telegramMonitoringStart: false,
  monthCyclingEnabled: false,
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

// ---------- booking window (Premium) ----------
//
// PRD docs/09 §8.4. Determines whether a detected slot is auto-booked:
//   acceptingFrom = today + minDaysNotice
//   acceptingTo   = travelDate - visaProcessingDays
// A slot at time T is bookable iff acceptingFrom <= T <= acceptingTo
// AND (includePrimeTime OR slot is non-prime).

export interface PersistedBookingWindow {
  travelDate: string | null;          // 'YYYY-MM-DD'
  visaProcessingDays: number;         // default 21
  minDaysNotice: number;              // default 0
  includePrimeTime: boolean;          // default false
  groupId: string | null;             // 8-digit TLS group id, e.g. '26445690'
}

export const DEFAULT_BOOKING_WINDOW: PersistedBookingWindow = {
  travelDate: null,
  visaProcessingDays: 21,
  minDaysNotice: 0,
  includePrimeTime: false,
  groupId: null,
};

export async function getBookingWindow(): Promise<PersistedBookingWindow> {
  const v = await getRaw<PersistedBookingWindow>('bookingWindow');
  if (!v) return { ...DEFAULT_BOOKING_WINDOW };
  return { ...DEFAULT_BOOKING_WINDOW, ...v };
}

export async function setBookingWindow(
  patch: Partial<PersistedBookingWindow>,
): Promise<PersistedBookingWindow> {
  const current = await getBookingWindow();
  const merged = { ...current, ...patch };
  await setRaw('bookingWindow', merged);
  return merged;
}

/**
 * Derive `acceptingFrom` / `acceptingTo` from the stored window. Returns
 * { from: null, to: null } if `travelDate` is unset — Premium-active
 * users without a travel date see "Set travel date" CTA and don't
 * auto-book any slot.
 */
export function deriveAcceptingRange(w: PersistedBookingWindow): {
  from: string | null;
  to: string | null;
} {
  if (!w.travelDate) return { from: null, to: null };
  const today = new Date();
  const yyyy = today.getUTCFullYear();
  const mm = String(today.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(today.getUTCDate()).padStart(2, '0');
  const fromMs = Date.parse(`${yyyy}-${mm}-${dd}T00:00:00Z`) + w.minDaysNotice * 86_400_000;
  const toMs = Date.parse(`${w.travelDate}T00:00:00Z`) - w.visaProcessingDays * 86_400_000;
  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs) || toMs < fromMs) {
    return { from: null, to: null };
  }
  return {
    from: new Date(fromMs).toISOString().slice(0, 10),
    to: new Date(toMs).toISOString().slice(0, 10),
  };
}

// ---------- TLS credentials (Premium) ----------
//
// Encrypted at-rest under chrome.storage.local.tlsCreds. The
// AES-GCM key is derived from a per-installation salt — see
// src/shared/crypto.ts and PRD docs/09 §11.
//
// Threat model: local-only obfuscation. NOT user-passphrase strong.
// Defends against DevTools inspection, cross-extension reads, and
// profile-folder copy without the salt. Does NOT defend against
// arbitrary code execution on the user's machine.

import { encryptString, decryptString, wipeCryptoState } from './crypto';

interface EncryptedTlsCreds {
  emailCipher: string;     // base64(IV || ciphertext)
  passwordCipher: string;
  storedAt: number;        // ms epoch
}

export interface PlaintextTlsCreds {
  email: string;
  password: string;
}

const TLS_CREDS_KEY = 'tlsCreds';

export async function setTlsCredentials(c: PlaintextTlsCreds): Promise<void> {
  // Encrypt both fields independently — losing one doesn't expose the
  // other if storage is partially corrupted. Storage layout is two
  // base64 strings + a timestamp; no plaintext present at rest.
  const [emailCipher, passwordCipher] = await Promise.all([
    encryptString(c.email),
    encryptString(c.password),
  ]);
  const envelope: EncryptedTlsCreds = {
    emailCipher,
    passwordCipher,
    storedAt: Date.now(),
  };
  await setRaw(TLS_CREDS_KEY, envelope);
}

export async function getTlsCredentials(): Promise<PlaintextTlsCreds | null> {
  const envelope = await getRaw<EncryptedTlsCreds>(TLS_CREDS_KEY);
  if (!envelope) return null;
  const [email, password] = await Promise.all([
    decryptString(envelope.emailCipher),
    decryptString(envelope.passwordCipher),
  ]);
  if (email === null || password === null) return null;
  return { email, password };
}

export async function hasTlsCredentials(): Promise<boolean> {
  const envelope = await getRaw<EncryptedTlsCreds>(TLS_CREDS_KEY);
  return !!envelope?.emailCipher && !!envelope?.passwordCipher;
}

/**
 * Wipes the encrypted creds AND the crypto salt — any other
 * previously-encrypted data also becomes unrecoverable. That's
 * intentional: PRD §11.4 "Forget TLS credentials" is the user's
 * single button to nuke all Premium-side persisted secrets.
 *
 * Premium itself remains active — the license token stays valid;
 * only auto-login + booking can't run until the user re-enters
 * credentials in the popup Options tab (P-12).
 */
export async function forgetTlsCredentials(): Promise<void> {
  await chrome.storage.local.remove(TLS_CREDS_KEY);
  await wipeCryptoState();
}

// ---------- consent ----------

export async function getConsent(): Promise<PersistedConsent | null> {
  return (await getRaw<PersistedConsent>('consent')) ?? null;
}

export async function setConsent(c: PersistedConsent): Promise<void> {
  await setRaw('consent', c);
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
