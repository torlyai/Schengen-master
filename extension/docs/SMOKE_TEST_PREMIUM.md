# Smoke test — Premium

**Status (2026-05-14):** Backend + Stripe live verified (`cs_live_…` Setup
Intent sessions returning from `POST /api/visa-master/checkout`). Wizard
step transitions wired. Booking FSM (`driveBookingFlow()`) and TLS
auto-login selectors remain unvalidated against real TLS markup (PRD §17,
backlog P0-1 / P0-4).

This doc covers two distinct test paths:

1. **Premium activation smoke test (Stripe live)** — payment-before-wizard
   end-to-end flow against a real `cs_live_…` Stripe session. This is the
   path a real Premium user takes; run it before every release.
2. **Force-each-state preview** — paste state JSON into the SW DevTools
   console to render any of the 14 Premium popup states in isolation
   without backend round-trips. Useful for UI changes.

## Premium activation smoke test (Stripe live)

Run this end-to-end before shipping any change that touches the wizard,
`service-worker.ts` `START_PREMIUM_SETUP` / `PREMIUM_INSTALL_LICENSE`,
`license-relay.ts`, or the torlyAI `/api/visa-master/checkout` /
`/visa-master/activated` surfaces.

### Pre-requisites
- Production extension build loaded unpacked from `dist/`.
- `chrome://extensions` → service worker DevTools console open (the SW
  logs the activation handshake here).
- A Stripe **test-mode** publishable key configured on torlyAI's
  `/api/visa-master/checkout` endpoint (one-time check; the live `cs_live_…`
  sessions accept test card `4242 4242 4242 4242` because Stripe Checkout
  treats Setup Intents with no charge as `mode=setup`).
- No existing license — clear via `chrome.storage.local.remove('vmLicense')`
  in the SW console.

### Steps

1. **Open the Premium intro page.** Click the Upgrade nudge in the popup
   (or call `chrome.tabs.create({url: 'premium.html'})` from the SW
   console). Verify the tab opens as the **active** tab (P2-1 fix —
   `active: true`).
2. **Click any of the four `开始设置` buttons.** All four should fire
   `START_PREMIUM_SETUP` (PremiumLandingPage.tsx — previously only the
   first button was wired). Watch for the click-feedback banner cycling
   `sending → sent`.
3. **Stripe Checkout opens.** The session URL pattern should be
   `https://checkout.stripe.com/c/pay/cs_live_…`. Verify the page shows
   the reassurance copy in `custom_text.submit.message`:
   > "You won't be charged today. £19 is only taken when we successfully
   > book an appointment for you — fully refundable for 24h after."
4. **Pay with test card.** Enter `4242 4242 4242 4242`, any future
   expiry, any 3-digit CVC, any postcode. Click *Set up*.
5. **Redirect to `/visa-master/activated`.** torlyAI's `ActivatedClient`
   calls `POST /api/visa-master/license/activate` and on success posts
   the license JWT via `window.postMessage` (license-relay.ts content
   script).
6. **License relay → SW handshake.** The SW console should log a
   `PREMIUM_INSTALL_LICENSE` message followed by a state transition.
   Verify: `chrome.storage.local.get('vmLicense')` returns a non-null
   object with `tier: 'premium'`, `aud: 'visa-master-extension'`,
   `iss: 'torly.ai'`. The activation tab should auto-close (or show
   "You can close this tab").
7. **Popup shows Preflight (P-3).** Open the popup. State should be
   `PREMIUM_PREFLIGHT`. The wizard's first step renders.
8. **Walk through the wizard end-to-end.** Preflight → Credentials →
   BookingWindow → ReadyToActivate. Verify:
   - Each step's *Next* button fires `PREMIUM_SETUP_NEXT` and advances.
   - *Back* fires `PREMIUM_SETUP_BACK` and rewinds.
   - *Skip for now →* (P1-3) transitions directly to `PREMIUM_ACTIVE`.
   - Credentials submit fires `PREMIUM_SAVE_CREDENTIALS` and the AES-GCM
     `tlsCreds` blob lands in `chrome.storage.local`.
   - BookingWindow submit fires `PREMIUM_SAVE_BOOKING_WINDOW`.
   - ReadyToActivate's *Activate* fires `PREMIUM_SETUP_NEXT` (was the
     stale `PREMIUM_ACTIVATE` pre-P0-2).
9. **Trigger a fake `SLOT_AVAILABLE`.** From the SW console:
   ```js
   chrome.runtime.sendMessage({
     type: 'DETECTION_RESULT',
     detection: { state: 'SLOT_AVAILABLE', evidence: [{ kind: 'text', value: 'Available' }], slotAt: Date.now() + 7*86400000, centre: 'MAN' }
   });
   ```
   Verify the booking FSM transitions: `PREMIUM_ACTIVE` →
   `PREMIUM_BOOKING_IN_PROGRESS`. **Known limitation (P0-1):**
   `driveBookingFlow()` is a stub — it will time out and transition to
   `PREMIUM_BOOKING_FAILED` after 60s. This is expected until real TLS
   booking markup is captured.

### Pass criteria
- Steps 1-7 complete without console errors.
- Step 8: every wizard transition is reflected in `chrome.storage.local.state`.
- Step 9: FSM enters `PREMIUM_BOOKING_IN_PROGRESS` (fail-safe to
  `PREMIUM_BOOKING_FAILED` is expected with the current stub).

### Failure modes worth catching
- Activated page shows but popup never updates → license relay or
  `PREMIUM_INSTALL_LICENSE` handler regression.
- License lands but popup stays on Free → JWT structural validation
  failing (check `aud`, `iss`, `exp` in the SW console).
- Wizard step doesn't advance → `service-worker.ts` switch missing the
  new state in its exhaustive handler.

---

## Force-each-state preview (UI-only testing)

This path stays useful for UI changes — it bypasses the backend and
Stripe entirely.

## Setup

1. `npm run build` from the extension folder.
2. Load `dist/` into Chrome via `chrome://extensions` → Load unpacked.
3. Open `chrome://extensions`, find Visa Master, click the **service worker**
   link to open the SW DevTools console.

## Quick: fake a Premium licence in chrome.storage.local

Paste this into the SW DevTools console:

```js
chrome.storage.local.set({
  licenseToken: {
    tier: 'premium',
    installId: 'dev-install-' + Math.random().toString(36).slice(2),
    stripeEmail: 'qa@example.com',
    issuedAt: Date.now(),
    expiresAt: Date.now() + 86400000,   // 1 day
    sig: 'dev-mode-no-signature'
  }
});
```

After this, the popup will treat you as a Premium user. UpsellCard and
UpgradeLine will NOT render on Free states. The header `⋯ More` button
will dispatch `OPEN_PREMIUM_OPTIONS` instead of opening the full-tab
Settings page (PRD §15 / wireframe note).

To go back to Free: `chrome.storage.local.remove('licenseToken')`.

## Force each Premium state into view

The SW only enters Premium states when the booking FSM transitions to
them, which isn't wired yet. To preview each Premium screen, set the
`state` key manually:

```js
// P-3 Preflight
chrome.storage.local.set({ state: { state: 'PREMIUM_PREFLIGHT',
  lastCheckTs: null, nextCheckTs: null, evidence: [], slotDetectedTs: null,
  watchedTabId: null, blockerStartedTs: null }});

// P-4 Setup step 1 — credentials
chrome.storage.local.set({ state: { state: 'PREMIUM_SETUP_CREDENTIALS',
  lastCheckTs: null, nextCheckTs: null, evidence: [], slotDetectedTs: null,
  watchedTabId: null, blockerStartedTs: null }});

// P-5 Signing in
chrome.storage.local.set({ state: { state: 'PREMIUM_SETUP_SIGNING_IN',
  lastCheckTs: null, nextCheckTs: null, evidence: [], slotDetectedTs: null,
  watchedTabId: null, blockerStartedTs: null }});

// P-6 Booking window
chrome.storage.local.set({ state: { state: 'PREMIUM_SETUP_BOOKING_WINDOW',
  lastCheckTs: null, nextCheckTs: null, evidence: [], slotDetectedTs: null,
  watchedTabId: null, blockerStartedTs: null }});

// P-7 Ready to activate
chrome.storage.local.set({ state: { state: 'PREMIUM_SETUP_READY',
  lastCheckTs: null, nextCheckTs: null, evidence: [], slotDetectedTs: null,
  watchedTabId: null, blockerStartedTs: null }});

// P-8 Verification gate
chrome.storage.local.set({ state: { state: 'PREMIUM_VERIFICATION_GATE',
  lastCheckTs: Date.now(), nextCheckTs: null, evidence: [],
  slotDetectedTs: null, watchedTabId: null, blockerStartedTs: null }});

// P-9 Setup failed — retry
chrome.storage.local.set({ state: { state: 'PREMIUM_SETUP_FAILED_RETRY',
  lastCheckTs: Date.now(), nextCheckTs: null, evidence: [],
  slotDetectedTs: null, watchedTabId: null, blockerStartedTs: null }});

// P-10 Setup failed — stale session
chrome.storage.local.set({ state: { state: 'PREMIUM_SETUP_FAILED_STALE',
  lastCheckTs: null, nextCheckTs: null, evidence: [], slotDetectedTs: null,
  watchedTabId: null, blockerStartedTs: null }});

// P-11 Premium active
chrome.storage.local.set({ state: { state: 'PREMIUM_ACTIVE',
  lastCheckTs: Date.now() - 5*60_000, nextCheckTs: Date.now() + 2*60_000,
  evidence: [], slotDetectedTs: null,
  watchedTabId: null, blockerStartedTs: null }});

// P-12 Premium options
chrome.storage.local.set({ state: { state: 'PREMIUM_OPTIONS',
  lastCheckTs: null, nextCheckTs: null, evidence: [], slotDetectedTs: null,
  watchedTabId: null, blockerStartedTs: null }});

// P-13 Booking in progress
chrome.storage.local.set({ state: { state: 'PREMIUM_BOOKING_IN_PROGRESS',
  lastCheckTs: Date.now(), nextCheckTs: null, evidence: [],
  slotDetectedTs: Date.now() - 2100, watchedTabId: null,
  blockerStartedTs: null }});

// P-14 Booked
chrome.storage.local.set({ state: { state: 'PREMIUM_BOOKED',
  lastCheckTs: Date.now(), nextCheckTs: null, evidence: [],
  slotDetectedTs: Date.now(), watchedTabId: null, blockerStartedTs: null }});

// P-15 Booking failed
chrome.storage.local.set({ state: { state: 'PREMIUM_BOOKING_FAILED',
  lastCheckTs: Date.now(), nextCheckTs: null, evidence: [],
  slotDetectedTs: Date.now() - 10_000, watchedTabId: null,
  blockerStartedTs: null }});

// P-16 Refund prompt
chrome.storage.local.set({ state: { state: 'PREMIUM_REFUND_PROMPT',
  lastCheckTs: Date.now() - 3*60*60*1000, nextCheckTs: null, evidence: [],
  slotDetectedTs: null, watchedTabId: null, blockerStartedTs: null }});
```

After each `set` call, **close and reopen the popup** to force a re-render.

## Verify Free-state nudges

1. `chrome.storage.local.remove('licenseToken')` to ensure Free tier.
2. Set the state to NO_SLOTS or SLOT_AVAILABLE.
3. Open the popup.
4. **NO_SLOTS** should show the quiet "Tired of racing for it?" UpgradeLine
   above the footer.
5. **SLOT_AVAILABLE** should show the boxed UpsellCard ("Premium would
   have booked this for you") *below* the primary "Open TLS tab" button.
6. Switch to Premium: paste the licence token block above, reopen the
   popup. The nudges should disappear.

## Click the upsell — what happens (PHASE 1)

Clicking the upsell sends `UPGRADE_TO_PREMIUM` to the SW. PHASE 1 only
logs the message:

```
[Premium] message received, handler not yet implemented: UPGRADE_TO_PREMIUM
```

This is expected. PHASE 2 wires the click to open the Premium intro page
(`/premium.html`). For now, the visual nudge confirms the click reached
the SW.

## What is testable end-to-end as of 2026-05-14

| Flow | Status | Notes |
|---|---|---|
| Free → Stripe Checkout → license install → Preflight | ✅ Wired | See "Premium activation smoke test" above |
| Wizard step transitions (Preflight → Credentials → BookingWindow → Active) | ✅ Wired | P0-2 fix |
| Auto-login script injection (selectors) | ⚠️ Best-guess | P0-4 — needs real TLS markup capture |
| Cloudflare / captcha challenge detection (pre-fill) | ✅ Wired | P1-1 — multi-signal heuristic in `tls-auto-login.ts` |
| Auto-booking on slot detected | ⚠️ Stub | P0-1 — `driveBookingFlow()` returns immediately; fails-safe to `BOOKING_FAILED` |
| `BOOKING_CONFIRMED` detection on post-book page | ✅ Implemented | `booking-confirmation-detector.ts` ready; awaits a real booking to exercise |
| Stripe Refund within 24h | ⚠️ Endpoint exists | Not exercised end-to-end yet |
| 中文 Premium copy | ⚠️ Mostly translated | P1-5 — needs native-speaker review pass |

The Stripe live path and wizard transitions are the high-confidence
surface. The P0 stubs (`driveBookingFlow`, `injectedFill` selectors) are
the remaining unknown — both blocked on capturing real TLScontact
markup.
