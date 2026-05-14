# Playwright E2E tests

End-to-end tests that load the built extension into Chromium and drive the popup as a user would. The point of this harness is **testing the Premium wizard + (eventually) detector behaviour against captured TLS pages, without burning a real TLS account**.

## Run

```bash
# One-time install (downloads ~120MB Chromium)
npm install
npx playwright install chromium

# Every run
npm run test:e2e            # builds + runs tests, headed (default)
npm run test:e2e:ui         # interactive UI mode
npm run test:e2e:headless   # for CI
```

`test:e2e` runs `npm run build` first — tests run against `dist/`, not `src/`, so stale builds will fail in confusing ways.

## What's covered now

`specs/wizard.spec.ts` — three tests:

1. **Happy path**: inject synthetic licence → walk Preflight → Credentials → BookingWindow → Ready → Active
2. **SETUP_BACK**: from Credentials, sending `PREMIUM_SETUP_BACK` returns to Preflight
3. **SETUP_RESET**: from deep in the wizard, `PREMIUM_SETUP_RESET` returns to Preflight

These verify the P0-2 fix (wizard step transitions) without touching Stripe or TLS.

## What's NOT covered yet

| Area | Blocker |
|---|---|
| Detector behaviour on real TLS DOM | Need fixtures in `extension/test-fixtures/tls-dom/` — see that folder's README for capture workflow. The `helpers/tls-mock.ts` interceptor is ready. |
| Auto-login flow | P0-4 — selectors are best-guess until real markup captured |
| Booking-FSM end-to-end | P0-1 — `driveBookingFlow()` is still a stub |
| Refund flow | Needs both a real licence and a real backend round-trip — likely will stay manual |

## Architecture

| File | Role |
|---|---|
| `../playwright.config.ts` | Runner config (testDir, timeouts, headed vs headless) |
| `fixtures/extension.ts` | Custom `test` with `context` + `extensionId` fixtures — loads `dist/` into a fresh persistent Chromium |
| `helpers/license.ts` | Mints structurally-valid JWT, installs via `PREMIUM_INSTALL_LICENSE` |
| `helpers/popup.ts` | Opens popup as a tab, polls `chrome.storage.local` for state |
| `helpers/storage.ts` | Generic `chrome.storage.local` I/O |
| `helpers/tls-mock.ts` | Intercepts `*.tlscontact.com` → serves files from `test-fixtures/tls-dom/` |
| `specs/*.spec.ts` | The tests themselves |

## Why headed mode

Old Chrome headless doesn't load MV3 service workers reliably — extensions silently fail to register. New headless (`--headless=new`) works on Chromium ≥120 but doesn't surface errors as clearly when something goes wrong. Default is headed; flip to headless for CI once tests are stable.

## How to write a new test

```ts
import { test, expect } from '../fixtures/extension';
import { installDevLicense } from '../helpers/license';
import { openPopup, waitForState, clearStorage } from '../helpers/popup';
import { mockTlsRoute } from '../helpers/tls-mock';

test('your new test', async ({ context, extensionId }) => {
  // Optional: serve TLS responses from local fixtures
  await mockTlsRoute(context, '../../test-fixtures/tls-dom');

  const popup = await openPopup(context, extensionId);
  await clearStorage(popup);
  await installDevLicense(popup); // skip Stripe

  // ... drive the popup, assert state transitions
});
```

## Common gotchas

- **Rebuild between code changes.** Tests run against `dist/`, not `src/`. The `test:e2e` script handles this.
- **Extension ID is randomised per `userDataDir`.** The fixture rediscovers it via service worker URL — don't hard-code.
- **SW eviction.** The service worker evicts after ~30s idle. Tests wake it by sending messages from the popup tab; if you see "no service workers", the SW probably evicted between fixture init and your first message.
- **Storage isolation.** `beforeEach` clears `chrome.storage.local`. Don't assume state across tests.
- **i18n.** Tests use CSS class selectors (`.btn--primary`) not button-text matching, so they pass in both `en` and `zh-CN` locales.
