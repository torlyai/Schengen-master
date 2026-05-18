// Thin typed wrapper around api.torly.ai/api/visa-master/*.
//
// All calls are made from the service worker (NOT the content script —
// the SW has the licence token + install ID in storage and is the
// authoritative state-machine owner). Errors are returned as
// discriminated unions so callers can match on the success/failure
// shape without try/catch noise.
//
// PRD docs/09 §10.
//
// v1.2.0 additions (PRD 17 §7.4):
//   - collectInstallMetadata()  — extension version, browser, OS
//   - activateLicense()         — now spreads metadata + attribution fields
//   - refreshLicenseStatusWithMetadata() — POST variant of /license/status
//     that refreshes install metadata on each daily poll (falls back to GET
//     gracefully if Stream A's backend hasn't deployed the POST variant yet)

// ─── Install metadata (v1.2.0) ─────────────────────────────

/**
 * Collect lightweight, non-PII install metadata for the ops dashboard.
 *
 * Uses navigator.userAgentData (Chrome 90+, the high-entropy-free subset) to
 * identify the browser brand and OS. For older UA-string-only environments,
 * falls back to a simple regex helper.
 *
 * Trust boundary: PREMIUM ONLY. This function is only called from
 * activateLicense() and refreshLicenseStatusWithMetadata(), both of which
 * are gated behind a valid installId (i.e. the user has started Premium
 * setup). The Free FSM never calls this.
 */
export interface InstallMetadata {
  extensionVersion: string;   // e.g. "1.2.0"
  browserName: string;        // e.g. "Google Chrome", "Microsoft Edge", "Brave"
  browserVersion: string;     // major version string, e.g. "130"
  os: string;                 // e.g. "macOS", "Windows", "Linux"
}

/** Infer OS from the classic User-Agent string for browsers without userAgentData. */
function inferOsFromUA(ua: string): string {
  if (/windows/i.test(ua)) return 'Windows';
  if (/macintosh|mac os x/i.test(ua)) return 'macOS';
  if (/android/i.test(ua)) return 'Android';
  if (/iphone|ipad/i.test(ua)) return 'iOS';
  if (/linux/i.test(ua)) return 'Linux';
  return 'Unknown';
}

export function collectInstallMetadata(): InstallMetadata {
  const extensionVersion = chrome.runtime.getManifest().version;

  // navigator.userAgentData is available in Chrome 90+ (all Chromium-based).
  // Cast needed because TypeScript's lib.dom.d.ts may not yet include it.
  const uad = (navigator as any).userAgentData as
    | {
        brands?: Array<{ brand: string; version: string }>;
        platform?: string;
      }
    | undefined;

  // The "real" browser brand is whichever brand is not Chromium or the
  // "Not.*Brand" decoys that all Chromium browsers include to prevent
  // simple UA-brand sniffing.
  const NOT_BRANDS = new Set([
    'Chromium',
    'Not.A/Brand',
    'Not_A Brand',
    'Not(A:Brand',
    'Not A;Brand',
  ]);
  const browserBrand = uad?.brands?.find((b) => !NOT_BRANDS.has(b.brand));

  const browserName = browserBrand?.brand ?? 'Chrome';
  const browserVersion = browserBrand?.version ?? '';
  const os = uad?.platform ?? inferOsFromUA(navigator.userAgent);

  return { extensionVersion, browserName, browserVersion, os };
}

// ─────────────────────────────────────────────────────────────

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

/**
 * Optional attribution + metadata fields sent in the /license/activate body.
 * All fields are optional on the server for backward compat — older backend
 * versions simply ignore unknown fields.
 */
export interface ActivateMetadataPayload {
  extensionVersion?: string;
  browserName?: string;
  browserVersion?: string;
  os?: string;
  /** Self-reported acquisition channel — from storage.attributionSource. */
  attributionSource?: string | null;
  /** Free-text detail for 'other' source — from storage.attributionDetail. */
  attributionDetail?: string | null;
}

export async function activateLicense(
  installId: string,
  setupIntentId: string,
  attribution?: ActivateMetadataPayload,
): Promise<ApiResult<LicenseResp>> {
  const metadata = collectInstallMetadata();
  const body: Record<string, unknown> = {
    installId,
    setupIntentId,
    // Spread install metadata — always collected at activation time.
    extensionVersion: metadata.extensionVersion,
    browserName: metadata.browserName,
    browserVersion: metadata.browserVersion,
    os: metadata.os,
  };
  // Attribution fields are only included if the caller supplies them (i.e.
  // attributionAsked === true in storage). This keeps the body identical to
  // the pre-1.2.0 shape for users who activate before the Premium intro page
  // has been visited.
  if (attribution) {
    if (attribution.attributionSource !== undefined) {
      body.attributionSource = attribution.attributionSource;
    }
    if (attribution.attributionDetail !== undefined) {
      body.attributionDetail = attribution.attributionDetail;
    }
  }
  return postJson<LicenseResp>('/license/activate', body);
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

/**
 * POST /license/status — refreshes install metadata (version, browser, OS)
 * on each daily poll tick so the ops dashboard always shows current values
 * even when the user upgrades the extension without re-activating.
 *
 * The backend Stream A adds a POST variant of /license/status that accepts
 * the same metadata fields as /license/activate. If the endpoint returns
 * 405 (method not allowed — older backend deployment), we silently fall back
 * to the original GET so polling is never disrupted.
 *
 * Trust boundary: PREMIUM ONLY — called from the daily polling tick in the
 * service worker, which is already gated behind a valid license token.
 */
export async function refreshLicenseStatusWithMetadata(
  installId: string,
): Promise<ApiResult<LicenseStatusResp>> {
  const metadata = collectInstallMetadata();
  const result = await postJson<LicenseStatusResp>('/license/status', {
    installId,
    ...metadata,
  });
  // Graceful degradation: 405 means the backend hasn't deployed the POST
  // variant yet. Fall back to the original GET — data freshness is maintained,
  // just metadata columns won't update until the backend ships.
  if (!result.ok && result.status === 405) {
    return getJson<LicenseStatusResp>(
      `/license/status?installId=${encodeURIComponent(installId)}`,
    );
  }
  return result;
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
  // PRD 20 (N-8): user-supplied description of what TLS told them.
  // Required by the popup UI (≥20 chars), optional at the API layer
  // so admin-initiated refunds can bypass.
  evidenceText?: string;
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
