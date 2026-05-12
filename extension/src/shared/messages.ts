// Typed message contract between popup/welcome/settings (UI) and the
// service worker. The UI agent imports types and the Msg discriminated union
// to send/receive structured messages over chrome.runtime.sendMessage.
//
// IMPORTANT: This is the wire contract — keep stable. If you must add a new
// message type, ADD a variant, don't change an existing one.

import type { ExtState, CadenceMode } from './states';

export interface StatusPayload {
  state: ExtState;
  lastCheckTs: number | null;
  nextCheckTs: number | null;
  cadenceMin: number;
  cadenceMode: CadenceMode;
  target: { url: string; centre: string; subjectCode: string; country: string } | null;
  todayChecks: number;
  todaySlots: number;
  evidence: string[];           // for SLOT_AVAILABLE / UNKNOWN
  slotDetectedTs: number | null;
  notif: 'ON' | 'OFF';
  openClaw: 'Connected' | 'Disconnected' | 'Disabled';
  uiLang: string;
  detectionLang: string;
}

export interface SettingsPayload {
  cadenceMode: CadenceMode;
  cadenceMinutes: number;
  releaseWindowsEnabled: boolean;
  releaseWindows: { startUk: string; endUk: string; pollMin: number }[];
  notifDesktop: boolean;
  notifSound: boolean;
  notifTabTitle: boolean;
  notifAutoFocus: boolean;
  uiLang: string;
  detectionLang: string;
  telemetry: boolean;
  openClawEncrypt: boolean;
  // Telegram phone notifications — see PRD Appendix A.
  telegramEnabled: boolean;
  telegramBotToken: string;
  telegramChatId: string;
  telegramAlsoBlockers: boolean;
  telegramMonitoringStart: boolean;
}

// Discriminated union of every message the SW expects to receive,
// plus the typed responses that come back (STATUS, SETTINGS).
export type Msg =
  | { type: 'GET_STATUS' }
  | { type: 'STATUS'; payload: StatusPayload }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'CHECK_NOW' }
  | { type: 'OPEN_TLS_TAB' }
  | { type: 'ACK_SLOT' }
  | { type: 'STOP_BOOKING' }
  | { type: 'SET_CADENCE'; minutes?: number; mode: CadenceMode }
  | { type: 'CLASSIFY_UNKNOWN'; resolution: ExtState }
  | { type: 'CONSENT_GRANTED'; uiLang: string }
  | { type: 'GET_SETTINGS' }
  | { type: 'SETTINGS'; payload: SettingsPayload }
  | { type: 'UPDATE_SETTINGS'; patch: Partial<SettingsPayload> }
  | { type: 'PAIR_OPENCLAW'; gateway: string; token: string; passphrase?: string }
  | { type: 'UNPAIR_OPENCLAW' }
  | { type: 'TEST_OPENCLAW' }
  | { type: 'TEST_TELEGRAM' }
  // From content script
  | { type: 'DETECTION_RESULT'; state: ExtState; evidence: string[]; url: string };

// Small helper alias — most senders only care about *requests* that expect a
// response. Useful for typing chrome.runtime.sendMessage calls in the UI.
export type MsgResponse =
  | { ok: true; data?: unknown }
  | { ok: false; error: string };
