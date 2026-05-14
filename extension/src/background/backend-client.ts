// Thin typed wrapper around api.torly.ai/api/visa-master/*.
//
// All calls are made from the service worker (NOT the content script —
// the SW has the licence token + install ID in storage and is the
// authoritative state-machine owner). Errors are returned as
// discriminated unions so callers can match on the success/failure
// shape without try/catch noise.
//
// PRD docs/09 §10.

const BASE_URL =
  // Build-time override: set VITE_VM_BACKEND_BASE in the dev env to
  // point at a Vercel preview deployment or localhost during development.
  // Default: production torly.ai.
  (import.meta as any).env?.VITE_VM_BACKEND_BASE ||
  'https://torly.ai/api/visa-master';

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string; detail?: string };

async function postJson<T>(path: string, body: unknown): Promise<ApiResult<T>> {
  try {
    const r = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const text = await r.text();
    let parsed: any = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      /* non-JSON response */
    }
    if (!r.ok) {
      return {
        ok: false,
        status: r.status,
        error: parsed?.error ?? `HTTP ${r.status}`,
        detail: parsed?.detail,
      };
    }
    return { ok: true, data: parsed as T };
  } catch (err: any) {
    return { ok: false, status: 0, error: 'Network error', detail: String(err?.message ?? err) };
  }
}

async function getJson<T>(path: string): Promise<ApiResult<T>> {
  try {
    const r = await fetch(`${BASE_URL}${path}`);
    const text = await r.text();
    const parsed = text ? JSON.parse(text) : null;
    if (!r.ok) {
      return { ok: false, status: r.status, error: parsed?.error ?? `HTTP ${r.status}` };
    }
    return { ok: true, data: parsed as T };
  } catch (err: any) {
    return { ok: false, status: 0, error: 'Network error', detail: String(err?.message ?? err) };
  }
}

// ─── Activation / license ──────────────────────────────────

export interface CheckoutResp {
  checkoutUrl: string;
  sessionId: string;
}
export async function startCheckout(installId: string): Promise<ApiResult<CheckoutResp>> {
  return postJson<CheckoutResp>('/checkout', { installId });
}

export interface LicenseResp {
  licenseToken: string;
  tier: 'free' | 'premium' | 'cancelled';
  expiresAt: number;
  stripeEmail: string;
  installId: string;
}
export async function activateLicense(
  installId: string,
  setupIntentId: string,
  uiLang?: 'en' | 'zh-CN',
): Promise<ApiResult<LicenseResp>> {
  // uiLang is forwarded so the backend can store it as
  // vm_installs.preferred_email_locale (PRD 14 §15 / N-3a). Backend
  // defaults to 'en' if absent — older extension builds work unchanged.
  return postJson<LicenseResp>('/license/activate', {
    installId,
    setupIntentId,
    ...(uiLang ? { uiLang } : {}),
  });
}

export async function rebindLicense(
  stripeEmail: string,
  newInstallId: string,
): Promise<ApiResult<LicenseResp>> {
  return postJson<LicenseResp>('/license/rebind', { stripeEmail, newInstallId });
}

export interface LicenseStatusResp {
  active: boolean;
  status: 'pending' | 'active' | 'cancelled' | 'revoked' | 'unknown';
  lastBookingAt: string | null;
  activatedAt: string | null;
}
export async function fetchLicenseStatus(installId: string): Promise<ApiResult<LicenseStatusResp>> {
  return getJson<LicenseStatusResp>(`/license/status?installId=${encodeURIComponent(installId)}`);
}

// ─── Booking ───────────────────────────────────────────────

export interface CaptureBody {
  installId: string;
  licenseToken: string;
  bookingMeta: {
    bookingId: string;
    centre?: string;
    subjectCode?: string;
    slotAt?: string;
  };
}
export interface CaptureResp {
  bookingDbId: string | null;
  stripePaymentIntentId: string;
  stripeChargeId: string | null;
  status: 'captured';
  capturedAt: string;
  amountPence: number;
  currency: string;
  idempotent?: boolean;
}
export async function captureBooking(body: CaptureBody): Promise<ApiResult<CaptureResp>> {
  return postJson<CaptureResp>('/booking/capture', body);
}

export interface RefundBody {
  installId: string;
  licenseToken: string;
  bookingDbId?: string;
  stripePaymentIntentId?: string;
  reason: string;
}
export interface RefundResp {
  refundId: string;
  status: string;
  amountPence: number;
  refundedAt: string;
}
export async function requestRefund(body: RefundBody): Promise<ApiResult<RefundResp>> {
  return postJson<RefundResp>('/booking/refund', body);
}
