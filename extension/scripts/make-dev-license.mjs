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

// --mode picks what to print so output is *only* paste-ready JS for
// the install/uninstall paths. Default (`--mode info`) prints all three
// sections with prose headers — friendly for first-time read, but the
// prose itself is not valid JS, so pasting the whole transcript fails.
// Use `--mode install | --copy` to get exactly one paste-safe block.
const mode = argMap.mode ?? 'info';
const copyToClipboard = args.includes('--copy');

async function maybeCopy(payload) {
  if (!copyToClipboard) return false;
  // macOS: pbcopy. Linux: xclip/xsel. Windows: clip. Use whichever is on PATH.
  const { spawn } = await import('node:child_process');
  const candidates = [
    ['pbcopy', []],
    ['xclip', ['-selection', 'clipboard']],
    ['xsel', ['--clipboard', '--input']],
    ['clip', []],
  ];
  for (const [cmd, cmdArgs] of candidates) {
    try {
      await new Promise((resolve, reject) => {
        const p = spawn(cmd, cmdArgs, { stdio: ['pipe', 'ignore', 'ignore'] });
        p.on('error', reject);
        p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
        p.stdin.end(payload);
      });
      return true;
    } catch {
      /* try next clipboard tool */
    }
  }
  return false;
}

const blocks = {
  install: snippet,
  uninstall: clearSnippet,
  jwt: jwt,
};

if (mode === 'install' || mode === 'uninstall' || mode === 'jwt') {
  const out = blocks[mode];
  if (await maybeCopy(out)) {
    console.error(`✓ ${mode} payload copied to clipboard (${out.length} chars)`);
  } else if (copyToClipboard) {
    console.error('⚠ no clipboard tool found (tried pbcopy/xclip/xsel/clip) — printing instead');
    process.stdout.write(out);
  } else {
    process.stdout.write(out);
  }
  process.exit(0);
}

console.log('────────────────────────────────────────────────────────────');
console.log(`Minted ${tier} JWT — expires in ${hours}h (${new Date(expMs).toISOString()})`);
console.log(`installId: ${installId}`);
console.log(`stripe_email: ${email}`);
console.log('────────────────────────────────────────────────────────────');
console.log('\nTip: avoid this 3-section dump and just pipe one block to your');
console.log('clipboard:\n');
console.log('  node scripts/make-dev-license.mjs --mode install --copy');
console.log('  node scripts/make-dev-license.mjs --mode uninstall --copy');
console.log('  node scripts/make-dev-license.mjs --mode jwt --copy');
console.log('');
console.log('============ INSTALL (copy ↓↓↓ ONLY these lines ↓↓↓) ============');
console.log(snippet);
console.log('============ END INSTALL ============\n');
console.log('============ UNINSTALL (copy ↓↓↓ ONLY these lines ↓↓↓) ============');
console.log(clearSnippet);
console.log('============ END UNINSTALL ============\n');
console.log('============ RAW JWT (for /api/visa-master/license/* endpoints) ============');
console.log(jwt);
console.log('============ END RAW JWT ============');
