// State enums shared between background, content script, and UI.
// Other agent (UI) imports from here — DO NOT change shapes without coordinating.

export type ExtState =
  | 'IDLE'
  | 'NO_SLOTS'
  | 'SLOT_AVAILABLE'
  | 'CLOUDFLARE'
  | 'LOGGED_OUT'
  | 'UNKNOWN'
  | 'PAUSED';

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
};

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
