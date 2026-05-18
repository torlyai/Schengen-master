// Email notification client (Premium-only).
//
// Thin POST wrapper around /api/visa-master/notify/email. Every call is
// licence-gated AND tier-gated — the Free path must never import this
// module. Fire-and-forget by convention: callers wrap the promise in
// .catch(() => {}) so a Resend failure on one channel never blocks the
// others.
//
// PRD 14 §8 + impl plan §3.
//
// CRITICAL — Free-tier trust boundary:
//   This file must never be reachable from a Free-only code path.
//   The triggerEmail() function early-returns when getLicense() returns
//   non-premium, but the call site SHOULD still be gated explicitly so
//   the import tree is clean and grep-auditable.

import { getLicense } from '../shared/license';

const BASE_URL =
  (import.meta as any).env?.VITE_VM_BACKEND_BASE ||
  'https://torly.ai/api/visa-master';

const REQUEST_TIMEOUT_MS = 8000;

// Events the extension can trigger via the backend. vm_welcome is NOT
// in this list — it fires server-side only from /license/activate.
export type ExtensionTriggerableEmailEvent =
  | 'vm_booking_confirmed'
  | 'vm_booking_failed'
  | 'vm_refund_issued'
  | 'vm_refund_prompt'
  | 'vm_license_expiring'
  | 'vm_license_deactivated'
  | 'vm_auto_login_disabled';

export interface TriggerEmailResult {
  ok: boolean;
  status?: number;
  emailId?: string;
  deduped?: boolean;
  throttled?: boolean;
  error?: string;
}

/**
 * POST /api/visa-master/notify/email. Premium-gated; silently no-ops
 * for Free installs. Never throws.
 *
 * `payload` shape is event-specific — see backend Zod schemas in
 * app/api/visa-master/notify/email/route.ts for required fields.
 */
export async function triggerEmail(
  event: ExtensionTriggerableEmailEvent,
  payload: Record<string, unknown>,
): Promise<TriggerEmailResult> {
  const license = await getLicense().catch(() => null);
  if (!license || license.tier !== 'premium' || !license.installId) {
    return { ok: false, error: 'No premium licence' };
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);

  try {
    const r = await fetch(`${BASE_URL}/notify/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        installId: license.installId,
        licenseToken: license.jwt,
        event,
        payload,
      }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);

    const text = await r.text();
    let parsed: any = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      /* non-JSON response — fall through */
    }

    if (!r.ok) {
      return {
        ok: false,
        status: r.status,
        error: parsed?.error ?? `HTTP ${r.status}`,
      };
    }
    // 200 may still carry { ok: false, throttled } per the route contract.
    if (parsed?.ok === false) {
      return {
        ok: false,
        status: r.status,
        throttled: parsed.throttled,
        error: parsed.error ?? 'Backend reported failure',
      };
    }
    return {
      ok: true,
      status: r.status,
      emailId: parsed?.emailId,
      deduped: parsed?.deduped,
    };
  } catch (err: any) {
    clearTimeout(timer);
    return {
      ok: false,
      error: err?.name === 'AbortError' ? 'Email request timed out' : String(err?.message ?? err),
    };
  }
}

/**
 * Probe ping for the popup's "Send test email" button (P-12 Options
 * → Email notifications). Triggers vm_booking_failed with a synthetic
 * payload — that event has the most forgiving required-field set
 * (centre + slotAtIso + startedAtEpochSeconds) and clearly reads as
 * a test to the recipient.
 *
 * Returns { ok, error? } the UI can render directly, mirroring
 * testConnection() in telegram.ts.
 */
export async function testEmailConnection(): Promise<{
  ok: boolean;
  error?: string;
  emailId?: string;
}> {
  const license = await getLicense().catch(() => null);
  if (!license || license.tier !== 'premium') {
    return { ok: false, error: 'Premium licence required for email notifications.' };
  }

  // Using vm_booking_failed with a synthetic payload. Subject line
  // explicitly carries "TEST" so the recipient understands.
  const result = await triggerEmail('vm_booking_failed', {
    centre: 'TEST',
    slotAtIso: new Date().toISOString(),
    bookingFailedReason: '[Test email — your email notification channel is configured correctly]',
    startedAtEpochSeconds: Math.floor(Date.now() / 1000),
  });

  if (result.ok) {
    return { ok: true, emailId: result.emailId };
  }
  return { ok: false, error: result.error ?? 'Unknown error' };
}
