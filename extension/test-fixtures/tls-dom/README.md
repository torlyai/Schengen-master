# TLS DOM Fixtures — virtual-environment workflow

This folder is the **mock TLScontact environment** for dev iteration on the Premium booking automation. It exists because:

1. TLScontact has aggressive anti-bot defences (Cloudflare Turnstile, IP rate limits, account lockouts after a few failed sign-ins).
2. Repeated dev runs against the real site risk locking the developer's real visa-application account.
3. We need a way to test detector, auto-login, and booking-FSM logic deterministically.

The strategy: **capture once, iterate offline forever.**

---

## How it works — Chrome DevTools "Local Overrides"

Chrome's DevTools can intercept HTTP responses from any URL and serve them from a local folder instead. Once configured, you can visit `https://*.tlscontact.com/...` in your browser and Chrome serves *your local copy* of the page — but the URL bar still says `tlscontact.com`, so the extension's content-script matcher (`*.tlscontact.com/*` in `manifest.json`) still fires.

No code changes needed. No `localhost` permission to add. Zero risk to your TLS account once the captures are done.

### Setup (one-time, ~5 min)

1. Open Chrome → DevTools (Cmd+Opt+I).
2. **Sources** tab → left sidebar → **Overrides** → **+ Select folder for overrides**.
3. Pick this folder: `extension/test-fixtures/tls-dom/`.
4. Chrome will ask permission — Allow.
5. The "Enable Local Overrides" checkbox should be ticked.

### Capture (one-time per page, ~10 min total)

For each page you want to mock:

1. Navigate to the real TLS page in Chrome (e.g. `https://uk.tlscontact.com/visa/fr/manchester/login`).
2. With DevTools open, **Sources** → right-click the page in the file tree → **Save for overrides**.
3. Chrome writes the response (HTML + headers) into this folder, mirroring the URL path.
4. Edit the saved file to redact personal data (name, passport number, group ID, email, application reference). A regex sweep + manual review.

Repeat for the four critical page types:

| Page | URL pattern (varies by country) | What it powers |
|---|---|---|
| Login | `/login` or `/auth/login` | `tls-auto-login.ts` selectors (P0-4) |
| Slot list | `/appointment/booking` or `/groups/{id}/slots` | `detector.ts` slot detection |
| Slot confirm | `/appointment/confirm` | `booking-fsm.ts` `driveBookingFlow()` (P0-1) |
| Confirmation | `/appointment/confirmed/{ref}` | `booking-confirmation-detector.ts` |

### Iterate (every dev session)

1. Open DevTools → Overrides → **Enable Local Overrides** still ticked.
2. Visit any captured TLS URL — Chrome serves your local copy.
3. Edit the file in any editor; refresh the page; instant.
4. The extension's content script runs against the served HTML as if it were the real site.

### When you're done

Just **uncheck "Enable Local Overrides"** in DevTools to let real TLS responses through again. Your fixture files stay in this folder for next session.

---

## What's NOT covered by Local Overrides

- **Real Cloudflare Turnstile challenges** — captures are static HTML; you can hand-craft a `cloudflare-challenge.html` fixture to test P1-1 detection logic, but can't simulate a real Turnstile widget interactively.
- **Real form submissions** — when auto-login clicks Submit on the captured login page, the form will POST to the real `tlscontact.com` (because that's what the captured form's `action=` says). To avoid this, either:
  - Edit the captured HTML to point `action=` at a `data:` URL or a non-existent path, OR
  - Use the `chrome.webRequest` API in a dev-only build to block outbound TLS requests during testing.
- **Dynamic state** (e.g. clicking a slot button → fetching slot detail) — captures are response-by-response, so the slot-detail XHR returns whatever you saved for that URL.

For the things Local Overrides can't do — and for CI — see Tier 3 (Playwright harness, not built yet; tracked as a follow-up).

---

## Quick-start: skip TLS entirely (Tier 1, today)

If you only need to test the **wizard** (PREFLIGHT → CREDENTIALS → BOOKING_WINDOW → READY → ACTIVE) and don't need TLS at all yet, use the dev-license script — no fixtures needed:

```bash
cd extension
node scripts/make-dev-license.mjs
```

It prints a JWT-install snippet you paste into the extension popup's DevTools console. The extension jumps straight to PREMIUM_PREFLIGHT without going through Stripe Checkout. See the script's header comment for full usage.

---

## Folder layout

```
test-fixtures/tls-dom/
├── README.md                    ← this file
├── SELECTORS.md                 ← (you create) summary of selectors found
├── uk-manchester/
│   └── .keep                    ← preserves dir, real captures gitignored
├── uk-london/
│   └── .keep
└── fr-paris/
    └── .keep
```

The captures themselves are gitignored (see `.gitignore` in the parent) — they may contain personal data even after redaction, and they must not leak into the public release repo at `torlyai/Schengen-master`.
