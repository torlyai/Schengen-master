#!/usr/bin/env node
// Mints a synthetic Premium licence JWT for local dev testing.
//
// The extension's license.ts performs *structural* validation only
// (aud + iss + exp + JSON shape) — no signature check. So we can mint a
// JWT here that the extension will accept, with no backend or Stripe
// involvement. This is safe for dev because:
//   - backend webhooks still gate all real money flows
//   - this token never works against a real torly.ai endpoint
//   - the signature segment is the literal string "dev-mode-no-signature"
//     so any forensic audit can grep for tokens that bypassed Stripe
//
// Usage:
//   node scripts/make-dev-license.mjs            # 1-year token, premium
//   node scripts/make-dev-license.mjs --hours 2  # 2-hour token (test expiry)
//   node scripts/make-dev-license.mjs --tier cancelled
//
// Then in Chrome:
//   1. chrome://extensions → click "service worker" on Visa Master card
//      → opens SW DevTools.
//   2. Paste the printed snippet into the console.
//   3. Click the extension icon. Popup should jump to PREMIUM_PREFLIGHT.

const args = process.argv.slice(2);
const argMap = Object.fromEntries(
  args
    .map((a, i) => (a.startsWith('--') ? [a.replace(/^--/, ''), args[i + 1]] : null))
    .filter(Boolean),
);

const tier = argMap.tier ?? 'premium';
const hours = Number(argMap.hours ?? 24 * 365); // default 1 year
const installId = argMap.installId ?? '00000000-0000-4000-8000-000000000001';
const email = argMap.email ?? 'dev@torly.ai';

const now = Date.now();
const expMs = now + hours * 60 * 60 * 1000;

const header = { alg: 'RS256', typ: 'JWT' };
const claims = {
  aud: 'visa-master-extension',
  iss: 'https://torly.ai',
  sub: installId,
  tier,
  stripe_email: email,
  iat: Math.floor(now / 1000),
  exp: Math.floor(expMs / 1000),
};

const b64url = (obj) =>
  Buffer.from(JSON.stringify(obj))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const jwt = `${b64url(header)}.${b64url(claims)}.dev-mode-no-signature`;

const snippet = `(async () => {
  const r = await chrome.runtime.sendMessage({
    type: 'PREMIUM_INSTALL_LICENSE',
    licenseToken: ${JSON.stringify(jwt)},
  });
  console.log('install result:', r);
})();`;

const clearSnippet = `(async () => {
  await chrome.storage.local.remove(['licenseToken', 'state']);
  await chrome.runtime.sendMessage({ type: 'PREMIUM_CANCEL' });
  console.log('cleared — restart popup');
})();`;

console.log('────────────────────────────────────────────────────────────');
console.log(`Minted ${tier} JWT — expires in ${hours}h (${new Date(expMs).toISOString()})`);
console.log(`installId: ${installId}`);
console.log(`stripe_email: ${email}`);
console.log('────────────────────────────────────────────────────────────');
console.log('\nINSTALL — paste into popup DevTools console (right-click popup → Inspect):\n');
console.log(snippet);
console.log('\nUNINSTALL — paste into the same console to revert to Free:\n');
console.log(clearSnippet);
console.log('\nRaw JWT (for testing /api/visa-master/license/* endpoints):');
console.log(jwt);
