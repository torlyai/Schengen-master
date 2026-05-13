// State enums shared between background, content script, and UI.
// Other agent (UI) imports from here — DO NOT change shapes without coordinating.

export type ExtState =
  // ── Free states (v1.0.9) ────────────────────────────────
  | 'IDLE'
  | 'NO_SLOTS'
  | 'SLOT_AVAILABLE'
  | 'CLOUDFLARE'
  | 'LOGGED_OUT'
  | 'UNKNOWN'
  | 'PAUSED'
  // WRONG_PAGE: logged in to TLScontact, but on a sub-page that isn't the
  // appointment-booking workflow page (e.g. /travel-groups,
  // /applications, /profile). The popup offers a CTA to navigate to the
  // booking page. Added 2026-05-13 to fix a UX bug where these pages
  // were misclassified as UNKNOWN and presented a useless classification
  // prompt.
  | 'WRONG_PAGE'
  // ── Premium states (PRD docs/09 §12, wireframes docs/10) ─
  // Setup wizard
  | 'PREMIUM_PREFLIGHT'              // P-3
  | 'PREMIUM_SETUP_CREDENTIALS'      // P-4
  | 'PREMIUM_SETUP_SIGNING_IN'       // P-5
  | 'PREMIUM_SETUP_BOOKING_WINDOW'   // P-6
  | 'PREMIUM_SETUP_READY'            // P-7
  // Setup error / recovery
  | 'PREMIUM_VERIFICATION_GATE'      // P-8
  | 'PREMIUM_SETUP_FAILED_RETRY'     // P-9
  | 'PREMIUM_SETUP_FAILED_STALE'     // P-10
  // Active operation
  | 'PREMIUM_ACTIVE'                 // P-11 — replaces NO_SLOTS when licensed
  | 'PREMIUM_OPTIONS'                // P-12 — body-swap from More button
  | 'PREMIUM_BOOKING_IN_PROGRESS'    // P-13 — ephemeral, 60s budget
  | 'PREMIUM_BOOKED'                 // P-14 — success, 24h refund window
  | 'PREMIUM_BOOKING_FAILED'         // P-15 — back to scanning
  | 'PREMIUM_REFUND_PROMPT';         // P-16

export type CadenceMode = 'aggressive' | 'smart' | 'gentle' | 'custom';

// Helpful constants for UI tooltips and analytics.
export const STATE_LABELS: Record<ExtState, string> = {
  IDLE: 'Idle',
  NO_SLOTS: 'Monitoring',
  SLOT_AVAILABLE: 'Slot found',
  CLOUDFLARE: 'Security check needed',
  LOGGED_OUT: 'Logged out',
  UNKNOWN: 'Help me classify',
  PAUSED: 'Paused',
  WRONG_PAGE: 'Wrong page',
  PREMIUM_PREFLIGHT: 'Setup · before you start',
  PREMIUM_SETUP_CREDENTIALS: 'Setup · step 1 of 4',
  PREMIUM_SETUP_SIGNING_IN: 'Setup · step 2 of 4',
  PREMIUM_SETUP_BOOKING_WINDOW: 'Setup · step 3 of 4',
  PREMIUM_SETUP_READY: 'Ready to activate',
  PREMIUM_VERIFICATION_GATE: 'Quick check needed',
  PREMIUM_SETUP_FAILED_RETRY: "Setup couldn't finish",
  PREMIUM_SETUP_FAILED_STALE: "Setup couldn't finish",
  PREMIUM_ACTIVE: 'Active',
  PREMIUM_OPTIONS: 'Active · options',
  PREMIUM_BOOKING_IN_PROGRESS: 'Booking…',
  PREMIUM_BOOKED: 'Booked',
  PREMIUM_BOOKING_FAILED: 'Booking failed',
  PREMIUM_REFUND_PROMPT: 'Refund',
};

// Helper: states where the Free→Premium upsell should NOT render.
export const PREMIUM_STATES: readonly ExtState[] = [
  'PREMIUM_PREFLIGHT',
  'PREMIUM_SETUP_CREDENTIALS',
  'PREMIUM_SETUP_SIGNING_IN',
  'PREMIUM_SETUP_BOOKING_WINDOW',
  'PREMIUM_SETUP_READY',
  'PREMIUM_VERIFICATION_GATE',
  'PREMIUM_SETUP_FAILED_RETRY',
  'PREMIUM_SETUP_FAILED_STALE',
  'PREMIUM_ACTIVE',
  'PREMIUM_OPTIONS',
  'PREMIUM_BOOKING_IN_PROGRESS',
  'PREMIUM_BOOKED',
  'PREMIUM_BOOKING_FAILED',
  'PREMIUM_REFUND_PROMPT',
] as const;

// Cadence presets in minutes — the resolver in scheduler.ts uses these
// unless mode === 'custom'.
export const CADENCE_PRESET_MIN: Record<Exclude<CadenceMode, 'custom' | 'smart'>, number> = {
  aggressive: 2,
  gentle: 10,
};

// Smart mode defaults (UK time windows).
export const SMART_DEFAULTS = {
  releaseWindows: [
    { startUk: '06:00', endUk: '09:30', pollMin: 2 },
    { startUk: '23:30', endUk: '00:30', pollMin: 2 },
  ],
  offWindowMin: 6,
} as const;
