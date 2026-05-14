// BYO Webhook channel — PRD 14 §7.9.
//
// User-supplied HTTPS URL receives a JSON POST for opted-in events.
// Available on BOTH tiers — Free preserves its trust boundary because
// the URL is the user's own (no call to torly.ai from this path).
//
// Wire contract:
//   POST {settings.webhookUrl}
//   headers:
//     content-type: application/json
//     X-Visa-Master-Event: ${event}
//     X-Visa-Master-Signature: sha256=${hex}   // only when webhookSecret is non-empty
//   body: {
//     event: WebhookEvent,
//     tier: 'free' | 'premium',
//     installId: string,                       // anonymous UUID for Free
//     ts: ISO-8601,
//     payload: Record<string, unknown>         // event-specific, minimised
//   }
//
// Privacy posture: identical disclosure to the Telegram payload. We
// NEVER send TLS credentials, polling cadence, DOM contents, or full
// URLs. The dispatcher additionally strips any field whose key matches
// credential-shaped patterns as a defence-in-depth guard against
// accidental caller misuse.

import { getSettings } from '../shared/storage';
import { getLicense } from '../shared/license';

const REQUEST_TIMEOUT_MS = 4000;

// Storage key for the webhook-only anonymous install ID. INTENTIONALLY
// distinct from the Premium `installId` (license.ts) so Free users
// enabling webhook never reveal the same identifier we use server-side
// for Premium. Random, persisted on first webhook use only.
const WEBHOOK_INSTALL_ID_KEY = 'webhookInstallId';

// ──────────────────────────────────────────────────────────
// Public types
// ──────────────────────────────────────────────────────────

export type WebhookEvent =
  | 'slot_available'
  | 'monitoring_started'
  | 'monitoring_resumed'
  | 'monitoring_paused'
  | 'blocker_cloudflare'
  | 'blocker_logged_out'
  | 'unknown_page'
  | 'wrong_page'
  | 'auto_stop'
  | 'booking_in_progress'
  | 'booked'
  | 'booking_failed'
  | 'refund_prompt'
  | 'refund_issued'
  | 'license_expiring'
  | 'license_deactivated'
  | 'auto_login_disabled'
  // Probe event fired only by testWebhookConnection(). Distinct from
  // every real event so receivers can hard-filter test traffic out of
  // their main webhook handler (e.g. a Slack channel route).
  | 'webhook_test';

export interface WebhookPayload {
  event: WebhookEvent;
  tier: 'free' | 'premium';
  installId: string;
  ts: string;
  payload: Record<string, unknown>;
}

// ──────────────────────────────────────────────────────────
// Event → settings.webhookEvents class mapping
// ──────────────────────────────────────────────────────────

type EventClass = 'slot' | 'blockers' | 'monitoringStart' | 'booking' | 'license';

function classify(event: WebhookEvent): EventClass {
  switch (event) {
    case 'slot_available':
      return 'slot';
    case 'monitoring_started':
    case 'monitoring_resumed':
    case 'monitoring_paused':
      return 'monitoringStart';
    case 'blocker_cloudflare':
    case 'blocker_logged_out':
    case 'unknown_page':
    case 'wrong_page':
    case 'auto_stop':
      return 'blockers';
    case 'booking_in_progress':
    case 'booked':
    case 'booking_failed':
    case 'refund_prompt':
    case 'refund_issued':
      return 'booking';
    case 'license_expiring':
    case 'license_deactivated':
    case 'auto_login_disabled':
      return 'license';
    case 'webhook_test':
      // Test pings are user-initiated; they bypass the per-class
      // sub-toggles in testWebhookConnection(). This classification
      // exists only to satisfy the exhaustive switch — it's never
      // consulted in the gating path.
      return 'slot';
  }
}

// ──────────────────────────────────────────────────────────
// Validation
// ──────────────────────────────────────────────────────────

/** True iff `url` is well-formed AND uses the https scheme. */
function urlLooksValid(url: string): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === 'https:';
  } catch {
    return false;
  }
}

// ──────────────────────────────────────────────────────────
// Data-minimisation guard (PRD §14.1)
// ──────────────────────────────────────────────────────────

// Reject any field whose key matches a credential-shaped pattern.
// Defence-in-depth: callers should already only pass safe fields, but
// this guard guarantees nothing dangerous slips out via misuse.
const FORBIDDEN_KEY_RE = /email|password|token|cred|secret|cookie/i;

function stripSensitive(input: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (FORBIDDEN_KEY_RE.test(key)) continue;
    out[key] = value;
  }
  return out;
}

// ──────────────────────────────────────────────────────────
// Anonymous install ID for Free users
// ──────────────────────────────────────────────────────────

async function getOrCreateWebhookInstallId(): Promise<string> {
  const raw = await chrome.storage.local.get(WEBHOOK_INSTALL_ID_KEY);
  const existing = raw[WEBHOOK_INSTALL_ID_KEY] as string | undefined;
  if (existing && /^[0-9a-f-]{36}$/i.test(existing)) return existing;
  const fresh = crypto.randomUUID();
  await chrome.storage.local.set({ [WEBHOOK_INSTALL_ID_KEY]: fresh });
  return fresh;
}

// ──────────────────────────────────────────────────────────
// HMAC-SHA256 signing (Web Crypto API — SW supports subtle)
// ──────────────────────────────────────────────────────────

/**
 * Compute HMAC-SHA256 of `body` using `secret` (UTF-8). Returns a
 * lowercase hex string (no `sha256=` prefix). The caller adds the
 * algorithm prefix when assembling the header value.
 *
 * Uses crypto.subtle (Web Crypto) — explicitly NOT a node crypto
 * import; service workers don't have node built-ins.
 */
async function signBodyHmacSha256(secret: string, body: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(body));
  const bytes = new Uint8Array(sig);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

// ──────────────────────────────────────────────────────────
// Result type + low-level POST
// ──────────────────────────────────────────────────────────

interface DispatchResult {
  ok: boolean;
  status?: number;
  error?: string;
}

async function dispatch(
  url: string,
  event: WebhookEvent,
  body: string,
  secret: string,
): Promise<DispatchResult> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);

  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'X-Visa-Master-Event': event,
  };

  if (secret) {
    try {
      const hex = await signBodyHmacSha256(secret, body);
      headers['X-Visa-Master-Signature'] = `sha256=${hex}`;
    } catch {
      // Signing failure is non-fatal — drop the header rather than the
      // whole request. The receiver will reject the unsigned body if
      // they require signatures, which is the correct outcome.
    }
  }

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers,
      body,
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!resp.ok) {
      return { ok: false, status: resp.status, error: `HTTP ${resp.status}` };
    }
    return { ok: true, status: resp.status };
  } catch (e) {
    clearTimeout(timer);
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

// ──────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────

/**
 * Fire-and-forget webhook dispatch. Reads settings, gates on
 * `webhookEnabled` + the relevant `webhookEvents.{class}` sub-toggle,
 * minimises the payload, dispatches with a 4-second hard cap, and
 * never throws — failures are swallowed so notification channels
 * remain independent.
 *
 * The CALLERS are expected to pass only safe fields (centre,
 * subjectCode, country, slotAtIso, bookingId, amountPence, currency,
 * etc.). `stripSensitive` is a defence-in-depth guard against
 * accidental misuse — never rely on it as your primary scrub.
 */
export async function notifyWebhook(
  event: WebhookEvent,
  payloadFields: Record<string, unknown>,
): Promise<void> {
  let settings;
  try {
    settings = await getSettings();
  } catch {
    return;
  }

  if (!settings.webhookEnabled) return;
  if (!urlLooksValid(settings.webhookUrl)) return;

  const eventClass = classify(event);
  if (!settings.webhookEvents?.[eventClass]) return;

  const license = await getLicense().catch(() => null);
  const tier: 'free' | 'premium' = license?.tier === 'premium' ? 'premium' : 'free';

  // Free installs use a random per-install UUID that is intentionally
  // distinct from the Premium installId — so a Free user enabling
  // webhook never reveals an identifier we (torly.ai) can correlate
  // with anything else.
  const installId =
    tier === 'premium' && license?.installId
      ? license.installId
      : await getOrCreateWebhookInstallId();

  const safePayload = stripSensitive(payloadFields ?? {});

  const envelope: WebhookPayload = {
    event,
    tier,
    installId,
    ts: new Date().toISOString(),
    payload: safePayload,
  };

  const body = JSON.stringify(envelope);

  try {
    await dispatch(settings.webhookUrl, event, body, settings.webhookSecret ?? '');
  } catch {
    /* fire-and-forget; webhook failures must never crash the SW */
  }
}

/**
 * Send a probe `webhook_test` event so the user can verify their
 * receiver. Returns `{ ok, error? }` the UI can render directly,
 * mirroring `testConnection` in telegram.ts.
 *
 * The probe goes out as the dedicated `webhook_test` event (distinct
 * from `slot_available`) so receivers can hard-filter test traffic out
 * of their main handler — e.g. a Slack channel route that drops events
 * whose X-Visa-Master-Event header equals `webhook_test`.
 */
export async function testWebhookConnection(): Promise<DispatchResult> {
  let settings;
  try {
    settings = await getSettings();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }

  if (!settings.webhookEnabled) {
    return { ok: false, error: 'Webhook is disabled. Enable it first.' };
  }
  if (!settings.webhookUrl) {
    return { ok: false, error: 'Webhook URL is empty.' };
  }
  if (!urlLooksValid(settings.webhookUrl)) {
    return { ok: false, error: 'Webhook URL must be https://…' };
  }

  const license = await getLicense().catch(() => null);
  const tier: 'free' | 'premium' = license?.tier === 'premium' ? 'premium' : 'free';
  const installId =
    tier === 'premium' && license?.installId
      ? license.installId
      : await getOrCreateWebhookInstallId();

  const envelope: WebhookPayload = {
    event: 'webhook_test',
    tier,
    installId,
    ts: new Date().toISOString(),
    payload: { test: true, source: 'visa-master-extension' },
  };

  const body = JSON.stringify(envelope);

  // Treat as an explicit user-triggered call — surface failures.
  return dispatch(settings.webhookUrl, 'webhook_test', body, settings.webhookSecret ?? '');
}
