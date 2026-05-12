// Browser-action badge management.
//
// Wireframes §11:
//   IDLE              → no badge text, grey
//   NO_SLOTS          → "●" green
//   SLOT_AVAILABLE    → "!" red (animated pulse for first 60s)
//   CLOUDFLARE        → "⚠" amber
//   LOGGED_OUT        → "⚠" amber
//   UNKNOWN           → "⚠" amber
//   PAUSED            → "‖" grey

import type { ExtState } from '../shared/states';

const COLORS = {
  green: '#1e6f4a',
  red: '#9b2a2a',
  amber: '#a86a1e',
  grey: '#5a5a5a',
} as const;

interface BadgeConfig {
  text: string;
  color: string;
  title: string;
}

const CONFIG: Record<ExtState, BadgeConfig> = {
  IDLE: { text: '', color: COLORS.grey, title: 'Visa Master — idle (open a TLS booking page)' },
  NO_SLOTS: { text: '●', color: COLORS.green, title: 'Visa Master — monitoring (no slots)' },
  SLOT_AVAILABLE: { text: '!', color: COLORS.red, title: 'Visa Master — SLOT FOUND' },
  CLOUDFLARE: { text: '⚠', color: COLORS.amber, title: 'Visa Master — Cloudflare check needed' },
  LOGGED_OUT: { text: '⚠', color: COLORS.amber, title: 'Visa Master — logged out of TLScontact' },
  UNKNOWN: { text: '⚠', color: COLORS.amber, title: 'Visa Master — help classify this page' },
  PAUSED: { text: '‖', color: COLORS.grey, title: 'Visa Master — paused' },
};

// Pulse animation for SLOT_AVAILABLE — switches color every 500ms for up to 60s.
let pulseTimer: ReturnType<typeof setInterval> | null = null;
let pulseStartedAt = 0;
const PULSE_DURATION_MS = 60_000;
const PULSE_INTERVAL_MS = 500;

function stopPulse(): void {
  if (pulseTimer !== null) {
    clearInterval(pulseTimer);
    pulseTimer = null;
  }
}

async function startPulse(): Promise<void> {
  stopPulse();
  pulseStartedAt = Date.now();
  let alt = false;
  pulseTimer = setInterval(() => {
    if (Date.now() - pulseStartedAt > PULSE_DURATION_MS) {
      stopPulse();
      chrome.action.setBadgeBackgroundColor({ color: COLORS.red }).catch(() => {});
      return;
    }
    alt = !alt;
    chrome.action
      .setBadgeBackgroundColor({ color: alt ? COLORS.red : '#ff5252' })
      .catch(() => {});
  }, PULSE_INTERVAL_MS);
}

export async function setBadgeForState(state: ExtState): Promise<void> {
  const cfg = CONFIG[state];

  try {
    await chrome.action.setBadgeText({ text: cfg.text });
    await chrome.action.setBadgeBackgroundColor({ color: cfg.color });
    await chrome.action.setTitle({ title: cfg.title });
  } catch {
    /* tab closed / SW invalidated — ignore */
  }

  if (state === 'SLOT_AVAILABLE') {
    await startPulse();
  } else {
    stopPulse();
  }
}

export async function setTooltip(text: string): Promise<void> {
  try {
    await chrome.action.setTitle({ title: text });
  } catch {
    /* ignore */
  }
}
