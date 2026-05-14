# Premium Tier — Issues Backlog

**Generated:** 2026-05-13 · **Last updated:** 2026-05-14 (Evening session — P1-1 Cloudflare detection + P2-2/P2-3/P2-4/P2-5 cleared)
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

### P1-4 🟥 Cross-repo: license JWT activation handshake not tested end-to-end
**Files:**
- `torlyAI/app/visa-master/activated/ActivatedClient.tsx` (calls `/api/visa-master/license/activate`)
- `extension/src/content/license-relay.ts` (postMessage bridge)
- `extension/src/background/service-worker.ts:441` (`PREMIUM_INSTALL_LICENSE` handler)

**Behavior today:** Each step is implemented but the full chain has not been exercised against a real Stripe Setup Intent redirect.
**Previously blocked on:** P0-3 (Stripe env vars). **Unblocked 2026-05-14** — `POST /api/visa-master/checkout` now returns working `cs_live_…` Setup Intent sessions in production. Next manual test session can drive a real end-to-end run with Stripe test card `4242 4242 4242 4242`.
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

*All open P2s were cleared in the 2026-05-14 session — see Done table below.*

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
| ✅ | **2026-05-14 PM** — `torly.ai/schengen/premium` hero now replicates the in-extension Premium intro: PremiumActive (back, tilted left) + Booked (front, tilted right) replace the single static booked card. Static React mocks built on existing `schengen.css` tokens — no `chrome.*` dependency. `.p-hero__stack` widened to 540×580 matching extension offsets (`-100/-18` back, `96/46` front), with 980 px + 560 px responsive shrinks. | torlyAI PR #22 → squash commit `b16e6e4`; deployed via trigger commit `1431dfc` |
| ✅ | **2026-05-14 PM** — Product dropdown "Schengen extension" item under `lib/nav-config.ts` now points at `/schengen/premium` (was `/schengen`). Free tier still reachable via the in-page header link. | torlyAI same PR #22 |
| ✅ | **2026-05-14 PM** — `ApertureMark` brand glyph extracted to `extension/src/components/ApertureMark.tsx` as the single source of truth. Settings header now shows the aperture mark instead of the legacy black-square "v" letter (CSS variant `.mark-glyph--aperture` overrides the chip background). Welcome + Premium intro pages dedupe their inline SVG copies and import the shared component; Vite emits one ~520 B shared chunk. | extension commit `bf4e7ec` |
| ✅ | **P2-6** torlyAI `[deploy]` gate documented in root `CLAUDE.md`. New section "Cross-repo: torlyAI deploy gate (`[deploy]` token)" between Release workflow and Backend contract explains Vercel's inverted exit-code semantics (`exit 1` = proceed), the GitHub-PR check-status trap (cancel renders as ✅), the two-step recovery procedure (edit squash message before merge, or push `chore(deploy): trigger [deploy]` empty commit), and the verification command (`vercel ls torlyai --prod` should show `● Ready`). Verified the actual `ignoreCommand` in `torlyAI/vercel.json:7` before writing. Optional GitHub Action auto-append deferred. | Schengen-visa uncommitted, `CLAUDE.md` |
| ✅ | **P1-1** Cloudflare challenge detection — `detectChallengePage()` in `tls-auto-login.ts` replaced with a multi-signal heuristic (Turnstile widget / iframe, page title "Just a moment" / "Checking your browser" / "Attention Required", `/cdn-cgi/challenge` URL, reCAPTCHA, hCaptcha, plus a last-resort "Ray ID footer + no password input" signal). Biases toward false positives — declining a real login is recoverable, burning a 3/h slot into a challenge is not. Returns `{ challenge: true, signal: '<short-label>' }`. | extension uncommitted, `src/background/tls-auto-login.ts` |
| ✅ | **P2-5** `SMOKE_TEST_PREMIUM.md` rewritten to lead with a real end-to-end "Premium activation smoke test (Stripe live)" path (9-step walkthrough from popup nudge → `cs_live_…` Stripe Checkout → `/visa-master/activated` → license install → wizard transitions → faked SLOT_AVAILABLE). Force-each-state preview retained as a second-class UI-only path. Trailing "what's NOT testable" table replaced with a status table that reflects current backlog state (P0-1 / P0-4 stubs called out explicitly). | extension uncommitted, `docs/SMOKE_TEST_PREMIUM.md` |
| ✅ | **P2-2** Activated-page safety-net copy added — single italic line "You can disable Premium anytime in Settings — your card is never charged unless we successfully book an appointment for you." sits between the main paragraph and the BridgeToExtension card. Tuned size (13.5px) + muted color (`#6e6962`) so it reads as a footnote rather than a competing headline. | torlyAI uncommitted, `app/visa-master/activated/ActivatedClient.tsx` |
| ✅ | **P2-3** `/schengen` section order swapped — `LpInstall` now renders before `LpPremiumPitch`. Install is the cheapest commitment; Premium surfaces to users who finished Install and are still scrolling. Anchor IDs unchanged (`#install` on `LpInstall`), so the header `Install free` button still scrolls correctly. Stale "Sits between LpOpenSource and LpInstall" comment on `LpPremiumPitch` rewritten to match the new position. | torlyAI uncommitted, `app/schengen/SchengenPageClient.tsx` |
| ✅ | **P2-4** Schengen Premium funnel events scaffolded into the existing GA4 helper (`lib/analytics.ts`) — `schengenPremiumCtaClicked('see_premium' \| 'header_premium')` on `/schengen` Premium links; `schengenPremiumInstallClicked('hero' \| 'compare' \| 'final')` on the three CTAs on `/schengen/premium`; `schengenPremiumActivated()` + `schengenPremiumActivationFailed(reason)` on `/visa-master/activated`. **Deviation from acceptance:** used GA4 instead of Plausible because the existing analytics infrastructure is GA4 (Plausible is only preconnected, not loaded). Server-side events (refund within 24h) deferred — would need POST-to-GA-Measurement-Protocol from `/api/visa-master/refund`. | torlyAI uncommitted, `lib/analytics.ts` + `app/schengen/SchengenPageClient.tsx` + `app/schengen/premium/SchengenPremiumClient.tsx` + `app/visa-master/activated/ActivatedClient.tsx` |

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
