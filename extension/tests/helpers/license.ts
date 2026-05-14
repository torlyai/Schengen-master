import type { Page } from '@playwright/test';

// Minting logic mirrors scripts/make-dev-license.mjs. Kept duplicated
// here (rather than imported) because the .mjs file is a CLI entry
// point and the duplication is ~15 lines. If the JWT claim shape
// changes in shared/license.ts, update both places.

interface MintOpts {
  tier?: 'free' | 'premium' | 'cancelled';
  hoursValid?: number;
  installId?: string;
  email?: string;
}

function b64url(obj: object): string {
  return Buffer.from(JSON.stringify(obj))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function mintDevJwt(opts: MintOpts = {}): string {
  const tier = opts.tier ?? 'premium';
  const hoursValid = opts.hoursValid ?? 24;
  const installId = opts.installId ?? '00000000-0000-4000-8000-000000000001';
  const email = opts.email ?? 'dev@torly.ai';

  const now = Date.now();
  const header = { alg: 'RS256', typ: 'JWT' };
  const claims = {
    aud: 'visa-master-extension',
    iss: 'https://torly.ai',
    sub: installId,
    tier,
    stripe_email: email,
    iat: Math.floor(now / 1000),
    exp: Math.floor((now + hoursValid * 3600 * 1000) / 1000),
  };
  return `${b64url(header)}.${b64url(claims)}.dev-mode-no-signature`;
}

/**
 * Install a synthetic licence via the SW's PREMIUM_INSTALL_LICENSE
 * handler. `page` must be in extension context (popup, welcome, settings)
 * so `chrome.runtime` is exposed.
 *
 * Reloads the page after install. PREMIUM_INSTALL_LICENSE is fired from
 * a content script (license-relay on torly.ai) in production, not the
 * popup — so its handler returns `{ok, data: {tier}}` rather than a
 * StatusPayload. In tests we keep the popup open across the call, so we
 * reload to pick up the post-install state via GET_STATUS on mount.
 */
export async function installDevLicense(
  page: Page,
  opts: MintOpts = {},
): Promise<void> {
  const jwt = mintDevJwt(opts);
  const result = await page.evaluate(async (token) => {
    return chrome.runtime.sendMessage({
      type: 'PREMIUM_INSTALL_LICENSE',
      licenseToken: token,
    });
  }, jwt);

  if (!result || typeof result !== 'object' || !('ok' in result) || !result.ok) {
    throw new Error(
      `installDevLicense failed: ${JSON.stringify(result)}. ` +
        `Check that license.ts:isJwtStructurallyValid still accepts ` +
        `aud='visa-master-extension', iss='https://torly.ai'.`,
    );
  }

  await page.reload();
  await page.waitForLoadState('domcontentloaded');
}
