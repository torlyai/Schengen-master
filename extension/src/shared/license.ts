// Tier detection + license storage.
//
// PRD §9 / §11 + open-question Q6 resolution: the extension reads a signed
// JWT from chrome.storage.local. If absent/expired/invalid, we run in Free
// mode. Premium states + auto-booking are gated on isPremium() returning
// true.
//
// PHASE 1 (this session): license stub only. The backend at api.torly.ai
// that signs real JWTs is not built yet. Until it ships:
//   - getLicense() returns { tier: 'free' } in production
//   - QA can flip to premium via DevTools:
//       chrome.storage.local.set({ licenseToken: { tier: 'premium',
//         installId: 'dev-install', stripeEmail: 'qa@example.com',
//         issuedAt: Date.now(), expiresAt: Date.now() + 86400000,
//         sig: 'dev-mode-no-signature' } })
//   - JWT signature verification is a TODO; PHASE 3 wires it to ES256.
//
// All Premium UI code paths MUST go through isPremium() so a single change
// here gates the entire feature.

export type Tier = 'free' | 'premium' | 'cancelled';

/**
 * The structured license info we expose to the rest of the extension.
 * It is derived from the raw JWT (the actual bytes signed by
 * api.torly.ai with RS256). We keep both around in storage:
 *   - `jwt`  : the signed token, sent unchanged to /booking/capture
 *              and /booking/refund. Source of truth for tier.
 *   - the decoded fields, for fast UI access without re-parsing.
 *
 * PRD docs/09 §11.
 */
export interface LicenseToken {
  tier: Tier;
  installId: string;        // sub claim (UUID, generated at first install)
  stripeEmail: string;      // captured at Stripe Checkout
  issuedAt: number;         // ms epoch (iat * 1000)
  expiresAt: number;        // ms epoch (exp * 1000)
  jwt: string;              // the signed JWT — sent verbatim to the backend
}

const STORAGE_KEY = 'licenseToken';
const INSTALL_ID_KEY = 'installId';

/**
 * Decode the JWT payload without verifying. RS256 signature verification
 * lives in the backend; the extension trusts the JWT it received from
 * the activated landing page (which itself got it from a verified
 * /license/activate response). PHASE 4 may add embedded-public-key
 * verification here for stronger offline defence, but it is not
 * load-bearing — without server access an attacker cannot mint a
 * valid Stripe customer anyway.
 */
function decodeJwtPayload(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    // base64url → base64
    const payload = parts[1]!.replace(/-/g, '+').replace(/_/g, '/');
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function isJwtStructurallyValid(jwt: string): boolean {
  const claims = decodeJwtPayload(jwt);
  if (!claims) return false;
  if (claims.aud !== 'visa-master-extension') return false;
  if (claims.iss !== 'https://torly.ai') return false;
  if (typeof claims.exp !== 'number' || claims.exp * 1000 < Date.now()) return false;
  return true;
}

/**
 * Persist a JWT received from the backend (either via the activated
 * landing page postMessage relay, or via the manual paste fallback in
 * the popup Help tab). Decodes once and stores the structured token.
 */
export async function installLicenseFromJwt(jwt: string): Promise<LicenseToken | null> {
  if (!isJwtStructurallyValid(jwt)) return null;
  const claims = decodeJwtPayload(jwt);
  const token: LicenseToken = {
    tier: claims.tier as Tier,
    installId: claims.sub,
    stripeEmail: claims.stripe_email ?? '',
    issuedAt: claims.iat * 1000,
    expiresAt: claims.exp * 1000,
    jwt,
  };
  await setLicense(token);
  return token;
}

/**
 * The extension generates a stable installId on first install. This is
 * the public identifier sent to /license/activate and stored as the
 * JWT's `sub` claim. We persist it so reinstall→rebind preserves the
 * same identity if the user picks "Rebind to existing email" in the
 * Premium setup wizard.
 *
 * Note: chrome.runtime.id is per-install (changes when the user clicks
 * "Load unpacked" again) so we need our own UUID for stability.
 */
export async function getOrCreateInstallId(): Promise<string> {
  const raw = await chrome.storage.local.get(INSTALL_ID_KEY);
  const existing = raw[INSTALL_ID_KEY] as string | undefined;
  if (existing && /^[0-9a-f-]{36}$/i.test(existing)) return existing;
  const fresh = crypto.randomUUID();
  await chrome.storage.local.set({ [INSTALL_ID_KEY]: fresh });
  return fresh;
}

export async function getLicense(): Promise<LicenseToken | null> {
  const raw = await chrome.storage.local.get(STORAGE_KEY);
  const token = raw[STORAGE_KEY] as LicenseToken | undefined;
  if (!token) return null;
  // Defensive re-check: the stored JWT must still parse + not be expired.
  if (!token.jwt || !isJwtStructurallyValid(token.jwt)) return null;
  if (token.expiresAt && Date.now() > token.expiresAt) return null;
  return token;
}

export async function setLicense(token: LicenseToken): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: token });
}

export async function clearLicense(): Promise<void> {
  await chrome.storage.local.remove(STORAGE_KEY);
}

export async function getTier(): Promise<Tier> {
  const t = await getLicense();
  return t?.tier ?? 'free';
}

export async function isPremium(): Promise<boolean> {
  return (await getTier()) === 'premium';
}

// Sync helper for components that already have the license in hand
// (avoids redundant storage reads in render).
export function tierOf(token: LicenseToken | null): Tier {
  if (!token) return 'free';
  if (token.expiresAt && Date.now() > token.expiresAt) return 'free';
  return token.tier;
}
