// Typed message contract between popup/welcome/settings (UI) and the
// service worker. The UI agent imports types and the Msg discriminated union
// to send/receive structured messages over chrome.runtime.sendMessage.
//
// IMPORTANT: This is the wire contract — keep stable. If you must add a new
// message type, ADD a variant, don't change an existing one.

import type { ExtState, CadenceMode } from './states';
import type { Tier } from './license';

export interface StatusPayload {
  state: ExtState;
  // Tier of the installed licence. Lets the popup router make
  // tier-aware decisions (e.g. PAUSED → render Premium-aware paused
  // UI vs Free-tier Paused.tsx).
  tier: Tier;
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
  uiLang: string;
  detectionLang: string;
  // ── Premium (PRD docs/09 §6, §12) ──
  // Booking window — set during Premium setup wizard (P-6).
  travelDate?: string | null;        // YYYY-MM-DD
  visaProcessingDays?: number;       // default 21
  minDaysNotice?: number;            // default 0
  includePrimeTime?: boolean;        // default false
  acceptingFrom?: string | null;     // YYYY-MM-DD — derived
  acceptingTo?: string | null;       // YYYY-MM-DD — derived
  groupId?: string | null;           // TLS 8-digit group id
  weekScans?: number;                // 7-day scan count for P-11
  // Booking in flight — only set during BOOKING_IN_PROGRESS / BOOKED.
  bookingStep?: 1 | 2 | 3 | null;
  bookingElapsedMs?: number;
  bookingConfirmation?: string | null;
  bookingFailReason?: string | null;
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
  // Telegram phone notifications — see PRD Appendix A.
  telegramEnabled: boolean;
  telegramBotToken: string;
  telegramChatId: string;
  telegramAlsoBlockers: boolean;
  telegramMonitoringStart: boolean;
  // Month-tab cycling — opt-in. When ON, the content script clicks through
  // visible month tabs after a NO_SLOTS scan to cover months other than the
  // page's default. Off by default to preserve the passive, scanner-only
  // posture; see src/content/month-cycler.ts for the policy.
  monthCyclingEnabled: boolean;
  // PRD 14 §7.9 — BYO Webhook channel (both tiers)
  webhookEnabled: boolean;
  webhookUrl: string;
  webhookSecret: string;  // optional; empty = no HMAC signing
  webhookEvents: {
    slot: boolean;
    blockers: boolean;
    monitoringStart: boolean;
    booking: boolean;
    license: boolean;
  };
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
  | { type: 'TEST_TELEGRAM' }
  | { type: 'TEST_WEBHOOK' }
  | { type: 'CHECK_UPDATE' }
  // From content script
  | { type: 'DETECTION_RESULT'; state: ExtState; evidence: string[]; url: string }
  // From content script: TLS post-booking confirmation page detected.
  // This is the ONLY message that can trigger a £19 charge — SW handler
  // requires Premium licence + active booking-FSM state + idempotency
  // on bookingId. See booking-confirmation-detector.ts.
  | {
      type: 'BOOKING_CONFIRMED';
      bookingId: string | null;
      slotAt: string | null;
      centre: string | null;
      evidence: string[];
      url: string;
    }
  // ── Premium (PRD docs/09 §7, §12) ──
  | { type: 'UPGRADE_TO_PREMIUM' }                       // P-1/P-2 CTA → open intro tab
  | { type: 'START_PREMIUM_SETUP' }                      // Pre-flight → wizard
  | { type: 'PREMIUM_SETUP_NEXT' }                       // wizard step forward
  | { type: 'PREMIUM_SETUP_BACK' }                       // wizard step back
  | { type: 'PREMIUM_SETUP_RESET' }                      // Start over
  | { type: 'PREMIUM_SETUP_SKIP' }                       // "Skip for now" → ACTIVE
  | { type: 'PREMIUM_SAVE_CREDENTIALS'; email: string; password: string }
  | { type: 'PREMIUM_SAVE_BOOKING_WINDOW';
      travelDate: string;
      visaProcessingDays: number;
      minDaysNotice: number;
      includePrimeTime: boolean;
      groupId?: string | null }
  | { type: 'PREMIUM_CANCEL' }                           // popup Cancel button
  | { type: 'OPEN_PREMIUM_OPTIONS' }                     // header More → P-12
  | { type: 'CLOSE_PREMIUM_OPTIONS' }                    // P-12 ← Back
  | { type: 'PREMIUM_REQUEST_REFUND'; reason: string }   // P-16
  | { type: 'PREMIUM_FORGET_CREDENTIALS' }               // P-12 danger button
  // From license-relay content script (torly.ai/visa-master/activated)
  | { type: 'PREMIUM_INSTALL_LICENSE'; licenseToken: string };

// Small helper alias — most senders only care about *requests* that expect a
// response. Useful for typing chrome.runtime.sendMessage calls in the UI.
export type MsgResponse =
  | { ok: true; data?: unknown }
  | { ok: false; error: string };
