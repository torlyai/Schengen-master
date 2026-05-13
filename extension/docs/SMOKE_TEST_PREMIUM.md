# Smoke test — Premium UI (PHASE 1 build)

**Status:** UI port complete. Backend, Stripe, auto-booking, and TLS
auto-login are NOT wired yet (PHASE 3+). This doc covers how to verify
each new popup state renders correctly with mocked data.

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

## What is NOT testable end-to-end yet

| Flow | Status | Wired by |
|---|---|---|
| Free → Stripe → Premium activation | NO backend yet | PHASE 3 |
| Auto-booking when slot found | NO booking FSM yet | PHASE 4 |
| Auto-login on TLS session expiry | NO crypto module yet | PHASE 4 |
| Email / Telegram on booking | NO transactional email | PHASE 5 |
| Refund Stripe round-trip | NO Stripe Refunds wired | PHASE 6 |
| 中文 Premium translations | English strings hardcoded | PHASE 7 |

Visual rendering and message wiring is all that should pass in this
build. Functional booking is not in scope until PHASE 4.
