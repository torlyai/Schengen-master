# Premium Tier — Issues Backlog

**Generated:** 2026-05-13
**Sources:** PRD §17 known stubs + bugs surfaced during in-dev dogfooding (`v1.0.9` local build, Premium tier WIP commit `5e6b903`).

This is a living document. When you fix something, move it from the open list to **Done — this branch**. When you discover something, add it with a P-tag and a repro.

---

## Priority legend

| Tag | Meaning |
|---|---|
| **P0** | Release-blocker. Premium cannot ship to Chrome Web Store without this fixed. |
| **P1** | Should-fix before public Premium launch. Workarounds exist; UX is degraded without. |
| **P2** | Polish / nice-to-have. Doesn't block v1.1.0 ship but worth a follow-up. |

## Status legend

| Tag | Meaning |
|---|---|
| 🟥 Open | Not started |
| 🟨 In progress | Someone is working on it |
| 🟦 Blocked | Waiting on external (real TLS markup, Stripe credentials, etc.) |
| 🟩 Done | Fixed; see commit ref |

---

## P0 — Release-blockers

### P0-1 🟦 `driveBookingFlow()` is a no-op stub
**File:** `extension/src/background/booking-fsm.ts:202`
**PRD ref:** §17 risk #1.
**Behavior today:** When a slot is detected that matches the booking window, the FSM transitions to `PREMIUM_BOOKING_IN_PROGRESS` but `driveBookingFlow()` returns immediately without clicking anything. The 60s timeout then fires `PREMIUM_BOOKING_FAILED` with no charge.
**Why it blocks release:** This IS the £19 feature. Users would pay for "we book it for you" and never get a booking. Fails safe (no charge) but is fraudulent-feeling marketing.
**Blocked on:** Real TLScontact booking-page markup. We need DOM observations of the actual confirm/continue flow to author the click sequence responsibly.
**Acceptance:**
- Function clicks the slot button matching `slotAt`
- Clicks the Confirm/Continue button on the next page
- `activeBooking.step` updates 1→2→3 so the popup progress bar reflects reality
- Aborts cleanly on any missing selector (don't lock the user's session)
- Manual test: trigger an SLOT_AVAILABLE state against a real TLS booking page; verify the full chain through to `BOOKING_CONFIRMED`.

---

### P0-4 🟦 `injectedFill()` selectors are best-guess
**File:** `extension/src/background/tls-auto-login.ts:78-141`
**PRD ref:** §17 risk #2.
**Behavior today:** Auto-login uses generic selectors (`input[type="email"]`, `input[type="password"]`, `form button[type="submit"]`). Fails-fast if any are missing. May fill into wrong fields on TLS variations.
**Why it blocks release (downgrade to P1 candidate):** Auto-login is a Premium feature. If selectors are wrong on common TLS variants, Premium users get repeated failed logins → cooldown lockouts (3 fails/hour) → bad UX. Could argue P1 if Free-tier baseline still works manually, but Premium specifically promises this works.
**Blocked on:** Real TLS login page markup observations across centres (London, Manchester, etc. may differ).
**Acceptance:**
- Validated selectors against at least 3 TLS country/centre variants
- Test plan in `extension/docs/SMOKE_TEST_PREMIUM.md` updated with selector verification steps

---

## P1 — Should-fix before public launch

### P1-1 🟥 `detectChallengePage()` returns false always
**File:** `extension/src/background/tls-auto-login.ts` (bottom of `injectedFill`)
**Behavior today:** Cloudflare Turnstile / reCAPTCHA pre-flight check is scaffolded but returns `{ challenge: false }` — so auto-login will happily submit creds into a challenge page, burning rate-limit budget.
**Acceptance:**
- Combines 2-3 high-confidence signals (`iframe[src*="challenges.cloudflare.com"]`, `.cf-turnstile`, `document.title` ~ "Just a moment", URL pattern `/cdn-cgi/challenge`)
- Biases toward false-positives (decline submit > burn attempt)
- Returns `{ challenge: true, signal: '<short-label>' }` for popup nudge
- Manual test: simulate by injecting a `cf-turnstile` div on a TLS page; verify auto-login declines without recording a fail.

---

### P1-4 🟦 Cross-repo: license JWT activation handshake not tested end-to-end
**Files:**
- `torlyAI/app/visa-master/activated/ActivatedClient.tsx` (calls `/api/visa-master/license/activate`)
- `extension/src/content/license-relay.ts` (postMessage bridge)
- `extension/src/background/service-worker.ts:441` (`PREMIUM_INSTALL_LICENSE` handler)

**Behavior today:** Each step is implemented but the full chain has not been exercised against a real Stripe Setup Intent redirect.
**Blocked on:** P0-3 (Stripe env vars). Cannot test until checkout works.
**Acceptance:**
- Full flow: 开始设置 → Stripe test card (`4242 4242 4242 4242`) → activated page → license JWT installed → SW state = `PREMIUM_PREFLIGHT` → popup renders Preflight.
- Verify license signature against torlyAI's `JWT_PUBLIC_KEY` (audience must be `'visa-master-extension'`).
- Verify the encrypted token survives SW restart (`chrome.storage.local` persistence).

---

### P1-5 🟥 zh-CN translations for new banner / Premium states — audit pass
**Files:** `extension/src/i18n/zh.json`
**Behavior today:** PRD §17 originally flagged this as TODO. As of `c503743`, audit shows most keys are translated; banner keys added this session. But:
- 20 string values still match English (mostly brand names like "WhatsApp", "TLScontact" — correct to keep)
- No native-speaker review has happened
- Some wizard copy may read awkwardly (especially error states, refund prompt copy)
**Acceptance:**
- Native zh-CN speaker reviews `i18n/zh.json` for `premium.*` keys
- Particular attention to: refund flow (legal-adjacent), credentials wizard (security-adjacent), error messages.

---

## P2 — Polish

### P2-2 🟥 Activated page lacks safety-net copy
**File:** `torlyAI/app/visa-master/activated/page.tsx`
**Behavior today:** After Stripe redirect, the activated page shows a centered card confirming activation. No copy reassures the user "you can disable Premium anytime and your card won't be charged unless we book a slot."
**Acceptance:**
- Add a single reassurance line below the activation confirmation.
- Manual test: visually inspect on torly.ai/visa-master/activated.

---

### P2-3 🟥 Reorder `/schengen` — move `LpPremiumPitch` to after `LpInstall`
**File:** `torlyAI/app/schengen/SchengenPageClient.tsx` (around line 50, the JSX composition)
**Behavior today:** The Premium pitch section renders between `LpOpenSource` and `LpInstall`. PM-strategy argument from session: Install should be the first commitment; Premium is the upgrade you think about *after* using Free for a week.
**Acceptance:**
- Swap render order: `LpInstall` before `LpPremiumPitch`
- Update any in-page anchor links that point at `#install` or `#premium` to verify they still scroll correctly.
- A/B test in a separate experiment ideally, but a clean swap is acceptable for v1.

---

### P2-4 🟥 Funnel analytics events
**Behavior today:** No instrumented events for:
- `/schengen` → `/schengen/premium` CTR
- Extension-popup → `/schengen/premium` referrer share
- `/schengen/premium` → checkout start rate
- Checkout start → activation success rate
- Refund rate within 24h

**Why P2:** Without these we can't iterate on the funnel data-driven.
**Acceptance:**
- Plausible custom events fired at each transition.
- Dashboard view in Plausible for the Premium funnel.

---

### P2-5 🟥 Smoke test doc needs Stripe path
**File:** `extension/docs/SMOKE_TEST_PREMIUM.md`
**Behavior today:** Doc exists but doesn't reflect the corrected payment-before-wizard flow.
**Acceptance:**
- Section "Premium activation smoke test" updated to:
  1. Click 开始设置 on intro page
  2. Stripe Checkout opens (test card `4242…`)
  3. Redirect to `/visa-master/activated`
  4. License relay fires, popup shows Preflight
  5. Walk through wizard end-to-end
  6. Trigger a fake SLOT_AVAILABLE and verify booking-fsm transitions

---

## Done — this branch (audit trail)

Fixed during 2026-05-13 → 2026-05-14 dogfooding sessions. Listed for context. Items reference commits where available; the rest are uncommitted on the working tree as of 2026-05-14.

| ID | What | Where |
|---|---|---|
| ✅ | Canonical Torly.AI brand + nav on `/schengen`, `/schengen/premium`, `/visa-master/activated` | torlyAI commit `c503743` |
| ✅ | Cross-tier nav links between Schengen Free + Premium pages | torlyAI commit `1340ab3` |
| ✅ | CSS gap: `.nav__*` classes ported to extension `styles.css` | extension uncommitted, in `styles.css` |
| ✅ | CSS gap: `.final*` classes ported to extension `styles.css` | extension uncommitted |
| ✅ | Premium intro page all four "开始设置" buttons fire `onStart` (previously only 1 of 4) | extension uncommitted, in `PremiumLandingPage.tsx` |
| ✅ | Click feedback banner on Premium intro page (sending / sent / error states) | extension uncommitted |
| ✅ | Flow architecture: payment before wizard (was inverted) | extension uncommitted, in `service-worker.ts` `START_PREMIUM_SETUP` + `PREMIUM_INSTALL_LICENSE` |
| ✅ | Banner i18n keys added (en + zh) | extension uncommitted |
| ✅ | `tls-auto-login.ts` Cloudflare challenge scaffolding + Promise type lie fixed | extension uncommitted |
| ✅ | **P0-3** Stripe live verification — `POST /api/visa-master/checkout` returned a working `cs_live_…` Setup Intent session (2026-05-14 session). Implies prod env vars (`STRIPE_SECRET_KEY`) are configured | torlyAI uncommitted, `app/api/visa-master/checkout/route.ts` |
| ✅ | **P0-2** Wizard step transitions wired — `PREMIUM_SETUP_NEXT/BACK/RESET` + `PREMIUM_SAVE_CREDENTIALS`/`_BOOKING_WINDOW` now transition state; `SetupReadyToActivate` fires `PREMIUM_SETUP_NEXT` (was the stale `PREMIUM_ACTIVATE`). Lazy credential validation chosen — see code comment for rationale | extension uncommitted, `service-worker.ts` + `SetupReadyToActivate.tsx` |
| ✅ | Stripe Setup Intent page now shows reassurance copy (`custom_text.submit.message`): "You won't be charged today. £19 is only taken when we successfully book an appointment for you — fully refundable for 24h after." | torlyAI commit `1b22580`, `app/api/visa-master/checkout/route.ts` |
| ✅ | Various PREMIUM UI bugs caught during 2026-05-14 manual testing: Edit options dead, Back to Active dead, Pause dropped to Free, Next-scan stuck at —, duplicate calendar icon, resume() not tier-aware. All have StatusPayload-return / tier-aware fixes. | extension uncommitted, `service-worker.ts`, `state-machine.ts`, `App.tsx`, `PremiumActive.tsx`, `PremiumPaused.tsx`, `PremiumOptions.tsx`, `SetupBookingWindow.tsx` |
| ✅ | New `PremiumPaused` component — Premium users keep the tier badge + monitoring chrome when paused, instead of dropping to Free-tier `Paused.tsx`. Routed via new `tier` field on StatusPayload. | extension uncommitted, `popup/states/premium/PremiumPaused.tsx` + `App.tsx` |
| ✅ | Booking Window UX upgrades: Group ID input (8-digit numeric), Visa Centre read-only display, Min Days Notice input + hint, Processing Days hint, live-update Accepting range as user types, Trip+buffer line in PremiumActive. | extension uncommitted, `PremiumOptions.tsx` + `PremiumActive.tsx` + i18n |
| ✅ | Cancel/Manage card tucked behind `▸ Manage subscription` disclosure. | extension uncommitted, `PremiumOptions.tsx` |
| ✅ | "Keep Visa Master scanning" reminder block at bottom of PREMIUM_ACTIVE (pinned tab, same desktop, plugged in). | extension uncommitted, `PremiumActive.tsx` + i18n |
| ✅ | Booked page review prompt: 5 stars + "Helped you book?" copy + "Leave a review on the Chrome Web Store" CTA + dismissibility persisted via `chrome.storage.local.vmReviewDismissed`. Web Store URL configurable via `VITE_CHROME_WEB_STORE_REVIEW_URL`. | extension uncommitted, `Booked.tsx` + i18n |
| ✅ | Settings → Support section: textarea + Attach debug info checkbox + Install ID with copy button. Send via `mailto:support@torly.ai` until backend ticket endpoint exists. | extension uncommitted, `SettingsPage.tsx` + i18n |
| ✅ | **P1-6** `applyDetection` guard: setup wizard + booking-FSM + options states are sticky against out-of-band detections. Regression test added. | extension uncommitted, `state-machine.ts` + `tests/specs/wizard.spec.ts` |
| ✅ | **P1-2** `PREMIUM_ACTIVATE` removed (functionally identical to `START_PREMIUM_SETUP`). Msg union shrunk; one canonical activation path. | extension uncommitted, `service-worker.ts` + `messages.ts` |
| ✅ | **P1-3** "Skip for now →" link on Preflight + Credentials + BookingWindow. New `PREMIUM_SETUP_SKIP` message → transitions to `PREMIUM_ACTIVE` (Premium is paid; user can finish setup later via Options). Regression test added. | extension uncommitted, 3× wizard components + `service-worker.ts` + `messages.ts` + i18n |
| ✅ | **P2-1** `chrome.tabs.create` calls in `UPGRADE_TO_PREMIUM` and `START_PREMIUM_SETUP` now pass `active: true` so the user lands on the opened tab. | extension uncommitted, `service-worker.ts` |
| ✅ | "Recent detections" empty-state copy: "Waiting for first scan" → "Waiting for any appointment slots available." | extension uncommitted, `i18n/{en,zh}.json` |

Most P1/P2 fixes from this session are still on the working tree uncommitted (manifest stays at v1.0.9). The Playwright suite is green (5/5) so a single follow-up commit `feat(extension): premium tier UX polish — wizard guards, Pause/Resume tier-awareness, Options field upgrades, Booked review prompt, Support form` is safe to ship.

---

## Unblock checklist: TLS DOM captures needed for P0-1 / P0-4

Both blocked items need empirical markup from real TLScontact pages. Until someone with a real TLS account (with an active group / application) captures these, we can't author selectors responsibly. Capture once, unblock both.

### What to capture

Capture from **at least 3 centres** (different countries / centres show different markup variants). Minimum set: London + Manchester + one continental EU centre.

#### For P0-4 (`tls-auto-login.ts` selectors — login page)

1. **Full HTML of the login page** (View Source, save as `login-{centre}.html`). DOM-rendered HTML — open DevTools → Elements → right-click `<html>` → "Copy outerHTML" — *not* the source-view, since the page is JS-rendered.
2. **Selector hints**, captured as a small note alongside:
   - Email/username input: exact `name=`, `id=`, `class=`, and the form's parent selector
   - Password input: same
   - Submit button: same; note whether it's `<button>` or `<input type="submit">`
   - Any "remember me" / "stay logged in" checkbox (we want to NOT tick this)
3. **Network capture of a successful login** (DevTools Network → Preserve Log → save as HAR). Lets us see whether login is form-POST or JSON-fetch, and what success looks like.

#### For P0-1 (`booking-fsm.ts` `driveBookingFlow()` — booking page)

4. **Full HTML of the slot-selection page** when slots are visible (the page that lists available appointment times).
5. **Selector hints**:
   - Slot button — the clickable element representing one time slot. Exact selector + how `slotAt` (date/time) is encoded (in `data-*` attribute? text content? `value=`?).
   - Confirm / Continue button on the page that appears *after* clicking a slot.
   - Any "Are you sure?" modal markup (we need to dismiss it programmatically or detect and abort).
6. **Full HTML of the confirmation page** — the post-book "Your appointment is confirmed" page. Needed for `booking-confirmation-detector.ts`. Capture the booking reference format (e.g. `TLS-MAN-26445690-0042`).
7. **Screencast (5-10 min)** of the full happy path: login → pick country → pick centre → see slots → click slot → confirm → confirmation page. Lets us see DOM mutations + page transitions we'd otherwise miss.

### How to capture safely

- **Use a real TLS account but DON'T submit a booking** — the slot-picking page is enough; back out before the final Confirm step. (For P0-1 confirmation-page markup we have one existing real screenshot referenced in `booking-confirmation-detector.ts` test fixtures; if that's insufficient, we may need one real test booking with a refund.)
- Strip personal data from the HTML before committing: passport numbers, full names, emails, group IDs. A regex sweep + manual review.
- Commit captures to `extension/test-fixtures/tls-dom/{centre}/` (gitignored from public release repo `torlyai/Schengen-master` — these are dev-only).

### What "done" looks like

- `extension/test-fixtures/tls-dom/` populated with at least 3 centres × 4 page types (login, slot-pick, post-slot, confirmation).
- A 1-page `extension/test-fixtures/tls-dom/SELECTORS.md` summarising selector choices + variant notes.
- P0-1 and P0-4 can both be implemented against these fixtures with confidence.

---

## How to use this doc

- **Picking up work cold:** read the issue, follow the file:line refs, check `git log <file>` for context, run the Acceptance criteria manually.
- **Adding new issues:** append at the bottom of the appropriate P-section, follow the same format (file ref, behavior today, acceptance criteria, repro/test plan).
- **Marking done:** move from open list to the **Done — this branch** table with a commit ref. Keep at most ~20 entries in Done before splitting into `12-premium-backlog.archive.md`.
- **Status changes:** flip the 🟥/🟨/🟦/🟩 marker. Don't lose the history — if a 🟨 turns back to 🟥, note why in the issue body.
