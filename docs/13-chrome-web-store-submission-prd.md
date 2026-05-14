# PRD: Visa Master — Chrome Web Store Submission

**Document:** 13-chrome-web-store-submission-prd.md
**Version:** 1.0
**Date:** 2026-05-14
**Status:** Draft for review — submission scope is the load-bearing open question (§3)
**Owner:** Duke Harewood (Torly AI)
**Related docs:**
- `06-visa-master-chrome-extension-prd.md` — Free tier PRD
- `09-visa-master-premium-prd.md` — Premium tier PRD
- `11-architecture.md` — System architecture (Free vs Premium trust boundary)
- `12-premium-backlog.md` — Open WIP items blocking a full Premium launch

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Why Now — Submission Triggers](#2-why-now--submission-triggers)
3. [Release Scope — The Decision This Doc Forces](#3-release-scope--the-decision-this-doc-forces)
4. [Goals, Non-Goals, and Success Metrics](#4-goals-non-goals-and-success-metrics)
5. [Listing Metadata](#5-listing-metadata)
6. [Single-Purpose Statement](#6-single-purpose-statement)
7. [Permissions Justifications](#7-permissions-justifications)
8. [Privacy Practices Disclosure](#8-privacy-practices-disclosure)
9. [Listing Assets — What We Need](#9-listing-assets--what-we-need)
10. [Build & Package Workflow](#10-build--package-workflow)
11. [Pre-Submission Checklist](#11-pre-submission-checklist)
12. [Submission Workflow — Step by Step](#12-submission-workflow--step-by-step)
13. [Review Risks and Mitigations](#13-review-risks-and-mitigations)
14. [Post-Publish Operations](#14-post-publish-operations)
15. [Open Questions](#15-open-questions)

---

## 1. Executive Summary

Visa Master has been built, dogfooded, and is functionally ready for public distribution via the Chrome Web Store. This document covers the **submission itself** — the listing inputs, permission justifications, privacy disclosures, and operational workflow Google requires — independent of what the extension *does*, which is covered exhaustively by PRDs 06 and 09.

The Chrome Web Store review process for an extension with our permission set (`tabs` + `scripting` + cross-origin `host_permissions` for both `tlscontact.com` and `torly.ai`) is non-trivial. Google's reviewer reads the listing copy, runs the extension, checks that every permission has a stated justification, verifies that the "single purpose" is honoured, and that the privacy practices disclosure matches the manifest. First submissions are typically reviewed within 1–3 business days; updates take hours-to-days unless reviewer attention is triggered (new host permission, new permission, change in single-purpose statement).

The load-bearing open question is **release scope** (§3): we can ship the Free tier as a v1.0.10 patch (Premium hidden behind a build flag, zero net-new review risk), ship Premium as a "Beta" v1.1.0 with a clear warning (medium review risk + a hard dependency on deploying `torly.ai/visa-master/cancelled` first), or wait until the Premium WIP punch list in PRD §17 is cleared. **Default recommendation: Free-only v1.0.10**, then iterate Premium under a separate submission once the booking automation is validated against a real TLS slot.

The submission itself is a one-person job that takes ~2 hours assuming assets exist. Most of the time is in producing screenshots and promo tiles that read well at thumbnail size — not in the upload mechanics.

---

## 2. Why Now — Submission Triggers

The trigger for this PRD is not a calendar date but a confluence of three signals:

1. **Free tier feature-completeness.** Slot detection, evidence display, Telegram phone alerts, smart polling cadence, release-window windows, anonymous detection-classification feedback, update-checking against GitHub Releases. PRD 06 v1 scope is fully delivered as of `5e6b903` (excluding the unrelated Premium WIP additions in that commit).

2. **Stable Free codebase.** The Free path has had no regression-grade bug reports in the dogfooding period. The only reason 1.0.9 has not been submitted is that the development team has been working on Premium in parallel.

3. **Premium not yet ready for prime time.** PRD 09 §17 plus `docs/12-premium-backlog.md` list three open items that block Premium's public debut: `driveBookingFlow()` is a stub, `injectedFill()` selectors are best-guess, and the Premium popup states + intro page lack zh-CN translations. Holding the Free release hostage to Premium completion is a self-inflicted launch delay.

The right move is to **decouple**: ship Free to the Web Store now; iterate Premium under the same listing later when it earns its rollout.

---

## 3. Release Scope — The Decision This Doc Forces

Three viable scopes for the v1.x.y submission. The scope chosen here drives version bump, listing copy, asset requirements, and whether torly.ai needs a pre-deploy.

### Option A — Free-only patch (v1.0.10) — **RECOMMENDED**

- **What ships visible:** Free tier as it is today, plus the bug fixes and quality-of-life additions from this development cycle (start-setup wiring, settings TOC, scheduler self-heal, update-check button).
- **What ships hidden:** The Premium code (license module, booking FSM, auto-login, backend client) stays in the bundle but gated behind a build flag (default off in production builds, default on in dev builds). The popup never shows the `UPGRADE_TO_PREMIUM` nudge in prod.
- **Listing copy:** Single-purpose statement reads "monitors a TLScontact appointment booking page and notifies you when slots open". `host_permissions` for `torly.ai` is removed from the production manifest entirely (so no permission to justify and no privacy disclosure for torly.ai data flow).
- **torly.ai dependency:** None. `/visa-master/cancelled` does not need to be deployed because no user can reach Stripe Checkout from the production build.
- **Review risk:** Very low. Single-purpose statement is unambiguous; permission surface matches what the user can do.
- **Effort:** ~1 day. Most time goes to listing assets (screenshots, promo tile) and verifying the build-flag gates work.
- **Premium roadmap impact:** Premium re-enters via a v1.1.0 update later, with the WIP punch list cleared. The Web Store review for v1.1.0 will be a new-permission + new-host review (because `torly.ai` reappears) — that's a known event we can plan for.

### Option B — Premium Beta (v1.1.0)

- **What ships visible:** Full Free tier plus the Premium intro page, the upgrade flow, Stripe checkout integration, and the booking FSM as a "Beta" with a clear user-facing warning ("Auto-book is in public Beta. We monitor every Beta booking by hand and refund on failure within 24h.").
- **What ships hidden:** Nothing — the bundle ships everything in `src/`.
- **Listing copy:** Single-purpose statement reads "monitors a TLScontact appointment booking page, notifies you when slots open, and optionally auto-books on your behalf with a paid Premium upgrade". Permissions justifications include `torly.ai` host permission (license verification + £19 success-fee billing).
- **torly.ai dependency:** **Hard blocker.** `/visa-master/cancelled` must be deployed before submission so that Stripe's Back-to-merchant link doesn't 404 (the issue we just hit in this session).
- **Review risk:** Medium. Reviewers will exercise the Premium upgrade flow if the listing advertises it. Any user-facing crash or 404 during the activation flow will likely fail review. The `tabs` + `scripting` + cross-origin host pair will get extra scrutiny because the extension now performs an automated action on a third-party site.
- **Effort:** ~3–4 days. WIP punch list (driveBookingFlow validation, injectedFill selectors, zh-CN Premium copy) must be at least *defensible* under reviewer testing, even if not yet fully validated against a real TLS slot.
- **Strategic upside:** Starts collecting real Stripe SetupIntents from early adopters and surfaces real-world bugs faster than dogfooding can.

### Option C — Premium full (v1.1.0) — defer submission

- **What ships:** Same as Option B, but with the PRD 09 §17 punch list cleared and the booking FSM validated against a real TLS slot at least once.
- **Timeline:** 1–2 weeks of focused work before submission.
- **Risk profile:** Lowest user-facing risk, highest opportunity cost (Free tier sits in private dogfooding while Premium is finished).

**Recommendation: Option A.** The premise of the Free tier is *value without trust cost*. Shipping it now starts the install count and the review history — both compound. Premium can ride a separate submission whose review risk we shoulder when we're ready, not now.

---

## 4. Goals, Non-Goals, and Success Metrics

### Goals
- Get Visa Master onto the Chrome Web Store with a listing that survives review on first attempt.
- Produce a listing that converts the "what is this and should I trust it" reader into an installer in under 30 seconds.
- Establish operational baselines: review timing, install velocity, uninstall reason codes, store-rating signal.

### Non-Goals
- Ranking-optimisation against generic "TLS appointment" queries on the Web Store. The store search is a thin surface; install growth will come from torly.ai, GitHub README, and the comparison page (`docs/08-vs-alternatives.md`).
- Premium activation traffic during the Free-only launch. If we ship Option A, Premium is intentionally invisible.
- Paid Web Store promotion (Google removed paid extension distribution years ago; there is no paid placement to buy).

### Success Metrics (4 weeks post-publish)
| Metric | Threshold | Method |
|---|---|---|
| Time-to-approval | ≤ 7 calendar days | Dashboard timestamp |
| Listing rating | ≥ 4.4 / 5 (n≥5) | Web Store dashboard |
| Uninstall rate (first 7 days) | ≤ 35% | Dashboard cohort retention chart |
| Permission-prompt drop rate | < 5% | `chrome.runtime.onInstalled` → `welcome.html` view event |
| Crash signal (background SW error) | 0 surfaced via support email | Inbound support email volume |

We deliberately do **not** track installs via any telemetry the extension itself emits. The Free tier promise is no-network; the install count comes from the Web Store dashboard.

---

## 5. Listing Metadata

These exact strings go into the Web Store dashboard's listing form. Keep them stable across versions where possible — Google does *not* require re-review on every cosmetic listing-copy change, but they do flag major rewrites.

### Extension name
`Visa Master — Schengen Visa Slot Watcher (TLScontact)`

(53 chars — well under the Web Store's 75-char limit.)

Rationale: three keyword bands compressed into one scannable line:
1. **Brand first** — `Visa Master` keeps the listing recognisable to anyone arriving from torly.ai, GitHub, or the comparison page.
2. **Intent keyword second** — `Schengen Visa Slot Watcher` is what real users type into the Web Store search bar. "Schengen visa" is the *job-to-be-done* phrasing; "TLScontact" is an implementation detail most applicants don't know by name until they're deep in the process.
3. **Service qualifier in parentheses** — `(TLScontact)` reassures the reader who *does* know they need the TLS portal that this extension targets their tool, without diluting the intent keywords at the front. Parentheses scan as "secondary info" in search results.

We considered `Visa Master — TLScontact Slot Watcher` (the earlier draft of this section) and rejected it: it required the reader to already know what TLScontact is, which excludes the early-funnel "I need a Schengen visa, what tools exist" searcher. We also considered `Visa Master — Schengen Appointment Watcher` and rejected it: too generic; loses the specificity that signals "this is the right tool, not a generic calendar".

### Short description (max 132 chars — single line shown beneath the name)
`Watches your TLScontact tab for Schengen visa appointment slots. Desktop + phone alerts. 100% local. Open source, MIT.`

(118 chars — well under the 132-char limit. Headroom kept deliberately so we can add a region tag like "(UK & EU)" without rewriting.)

Rationale: keyword density first. The first sentence carries both `TLScontact` and `Schengen visa appointment` — the two terms a prospective user might search for, depending on where they are in their visa journey. The trailing four-comma list (Desktop + phone alerts. 100% local. Open source, MIT.) is the trust signal the reader scans *after* the keyword match registers.

We considered the more polished `Polite background watcher for Schengen visa slots on TLScontact…` and rejected it: starting with an adjective ("Polite") reads as marketing-spin in the Web Store sidebar; starting with a verb ("Watches") reads as a functional description.

### Category
**Primary:** Productivity
**Secondary (if available):** Workflow & Planning

Rationale: "Productivity" is the catch-all the Web Store gives to single-purpose utilities. We rejected "Tools" (more crowded, no semantic improvement) and "Accessibility" (a stretch). Note that the Web Store category is **not** the primary discovery surface — the listing is found via search (where keywords in the name and short description dominate) and via direct links from torly.ai. Category is mostly a hygiene field.

### Search-discovery target terms

The listing is optimised to surface on these queries (rough priority order):
1. `schengen visa appointment` — the highest-intent query; user knows they need a visa and is looking for any tool to help.
2. `tlscontact` / `tls contact` — user already knows the service name and is looking for adjacent tooling.
3. `tlscontact appointment` — combined-intent query, highest conversion likely.
4. `schengen visa slot` / `schengen appointment slot` — slot-specific phrasing, lower volume but very high intent.
5. `france visa appointment` / `italy visa appointment` / etc. — country-specific. We do not target these in the name (would be misleading — we cover all TLS-managed Schengen destinations); the detailed description mentions them by example.

Web Store search weights the name ~5× more than the short description and the short description ~3× more than the detailed description. The name carrying both `Schengen Visa` and `TLScontact` is the highest-leverage edit in this entire PRD.

### Language(s)
Submit in English (`en`) as the canonical listing; add a Chinese (`zh_CN`) translation of the listing once review is complete (separate dashboard form, not a re-submission).

### Detailed description (~2000 chars, ASCII text + line breaks only — no HTML)

```
Visa Master watches your TLScontact Schengen visa appointment booking page so
you don't have to. When a slot opens, you get a desktop notification, an
optional sound, and — if you've set it up — a Telegram push to your phone.

Built for applicants chasing scarce Schengen visa slots (France, Italy, Spain,
Germany, Netherlands, Greece, Portugal, and every other TLScontact-managed
destination). One install, all centres.

WHAT IT DOES (Free tier — what's in this download)

• Watches the TLScontact tab you have open. Polls on a polite cadence (every
  2 to 15 minutes, default four).
• Detects open Schengen visa appointment slots through DOM inspection — no
  screen-scraping of personal data, no automation of clicks.
• Notifies you the moment a slot appears, with the evidence used to make the
  call so you can sanity-check before booking.
• Optional Telegram bridge for phone notifications when you're away from
  the laptop.
• Release windows: schedule tighter polling during known TLS release times
  (e.g. 12:00 UK), backing off the rest of the day.

WHAT IT DOES NOT DO

• Does NOT read your TLScontact password, passport number, or any form field.
• Does NOT book the Schengen visa slot for you. You always click the Book
  button yourself.
• Does NOT bypass Cloudflare or any anti-bot measure. If a security check
  appears, the extension politely waits for you to clear it.
• Does NOT send anything to any server. Polling happens inside your own
  browser tab; the only network traffic is what your browser would already
  make when you load the page yourself.
• Does NOT track you or collect analytics. There is no telemetry endpoint.

OPEN SOURCE

Every line of code running on your machine is in our public GitHub
repository under the MIT license. You can audit, fork, or compile from
source: https://github.com/torlyai/Schengen-master

WHY THIS APPROACH

We built Visa Master after watching friends miss Schengen visa appointments
because TLScontact release windows are short and unpredictable. Server-side
scrapers (the kind some commercial booking tools use) fight against
Cloudflare's bot protection — and lose. Running the watcher inside your own
browser session sidesteps the entire bot-detection problem: the browser is
already authenticated, already trusted by Cloudflare, and already authorised
to view the page. The extension just refreshes it on a steady cadence and
shouts when something opens.

Who it's for: anyone applying for a Schengen visa from the UK (or any other
country where the destination's visas are handled by TLScontact) who has
exhausted their own page-refresh patience.

SUPPORT

GitHub Issues: https://github.com/torlyai/Schengen-master/issues
Email: contact@torly.ai
```

(`Schengen visa` appears 5 times across the description. This is keyword *frequency* not stuffing — every mention is in a sentence that would read naturally without it, but each one anchors the listing for a slightly different query phrasing.)

(Final version after review will be locked in `docs/release-notes/v1.0.10-store-listing.md`.)

### Homepage URL
`https://torly.ai/visa-master`

(Currently this is a redirect to the public release repo; before submission, we should publish a real product page at this URL. See §11 checklist.)

### Support URL
`https://github.com/torlyai/Schengen-master/issues`

### Privacy policy URL
`https://torly.ai/privacy/visa-master`

(Required because we request `host_permissions`. Must exist and be reachable at submission time — see §11.)

---

## 6. Single-Purpose Statement

Google requires every extension to declare a single primary purpose. The reviewer reads this verbatim and compares it against the manifest, listing description, and actual behaviour.

**For Option A (Free-only):**

> Visa Master is a single-purpose extension that monitors a TLScontact Schengen visa appointment booking page open in the user's browser and notifies the user when an appointment slot becomes available.

**For Option B/C (Premium included):**

> Visa Master is a single-purpose extension that monitors a TLScontact Schengen visa appointment booking page open in the user's browser, notifies the user when an appointment slot becomes available, and — for users who have upgraded to the optional Premium tier — books the slot on the user's behalf using credentials the user has explicitly provided.

Note: adding "Schengen visa" to the single-purpose statement *narrows* the scope reviewers will hold the extension to. This is a feature, not a bug — narrower single-purpose statements are easier to defend in review. The extension genuinely only monitors TLS Schengen visa flows (the manifest's host_permissions are scoped to `*.tlscontact.com`); narrowing the statement to match reality is the strict reading reviewers reward.

The Premium variant is borderline-bi-purpose ("monitor and book"). The wording above frames booking as a strict downstream extension of monitoring (you cannot Premium-book without first monitoring), which is the defensible reading. Reviewers have historically accepted this framing for similar workflow tools; rejection is possible and would require a re-submission as two extensions (which we won't do).

---

## 7. Permissions Justifications

Every permission requested in `manifest.json` requires a typed justification in the Web Store dashboard. Reviewers cross-reference these against the manifest and actual code. Vague or copy-paste justifications are a common rejection reason.

Current manifest:
```json
"permissions": ["alarms", "storage", "notifications", "tabs", "scripting"],
"host_permissions": ["https://*.tlscontact.com/*", "https://torly.ai/*", "https://*.torly.ai/*"]
```

### `alarms`
> Used to schedule polling of the open TLScontact tab on a user-configurable cadence (every 2–15 minutes). `chrome.alarms` is the only reliable scheduling mechanism in Manifest V3 service workers, which are evicted when idle.

### `storage`
> Used to persist user settings (polling cadence, notification preferences, language, release windows) and the current monitoring state across service worker restarts. All data is stored locally via `chrome.storage.local`. No data is synced to any server.

### `notifications`
> Used to alert the user via the system notification surface when a TLScontact slot is detected. The user can disable notifications in the extension's settings page.

### `tabs`
> Used to find the open TLScontact tab so the extension can read its title, send a `chrome.scripting` injection to it, and (optionally) focus it when a slot is detected. The extension does not enumerate tabs from other sites; it filters by `https://*.tlscontact.com/*` URL pattern at every call.

### `scripting`
> Used to inject a small content script (`src/content/content-script.ts`) into the user's open TLScontact tab. The injected script reads DOM state to detect open slots and reports back to the service worker. The script does not modify the page, does not read form fields, and does not send any data outside the user's browser.

### `host_permissions: https://*.tlscontact.com/*`
> Required to inject the slot-detection content script into the user's open TLScontact tab. Without this permission the extension cannot perform its primary function.

### `host_permissions: https://torly.ai/*` and `https://*.torly.ai/*` (Premium scope only)
> Required to communicate with our licensing backend (`torly.ai/api/visa-master/*`) for Premium users only. Free users never trigger a network call to torly.ai. The endpoints are: `/api/visa-master/checkout` (Stripe Checkout session creation for the £19 success-fee Premium tier) and `/api/visa-master/license/status` (license validity polling, once per 24h). No personal data, TLScontact credentials, or booking content is sent to torly.ai.

(**Option A removes both `torly.ai` host permissions from the manifest before submission**, eliminating these two justifications.)

### `optional_host_permissions: https://api.github.com/*`
> Requested on user click of the Settings → "Check for updates" button. Used to fetch the latest tagged release from `github.com/torlyai/Schengen-master` to inform the user whether a newer extension version is available. Not requested on install. Not required for the extension to function.

---

## 8. Privacy Practices Disclosure

Google requires every developer to fill out a "Privacy practices" form in the dashboard. Lying here is the fastest path to a permanent suspension. The form has three sub-sections:

### Data the extension collects
For Option A: **None.** The Free tier has no telemetry, no analytics, no error reporting, no install pings. This is the singular trust claim of the extension and matches PRD §11.

For Option B/C: **The following data is sent to torly.ai for Premium users only**:
- Anonymous install UUID (generated locally on first run, never tied to identity)
- Stripe customer email (collected by Stripe during checkout, not by the extension)
- Booking confirmation ID (TLS-format string, on successful auto-book only)
- Booked slot date/time and centre (for receipt + Telegram echo)

### Data the extension does NOT collect (for both options)
- TLScontact credentials (password is encrypted at rest with AES-GCM and never leaves the browser)
- Slot data prior to booking
- Polling cadence or schedule
- DOM contents of the TLS page
- Telegram bot tokens
- Any browsing history outside `*.tlscontact.com`

### Required certifications (Google's form)
- ✅ "I do not use or transfer user data for purposes unrelated to my item's single purpose"
- ✅ "I do not use or transfer user data to determine creditworthiness or for lending purposes"
- ✅ "I do not sell user data to third parties"

### Remote code policy
**Critical for Manifest V3.** Google's policy requires all executable code to be bundled in the extension package — no dynamic code execution, no remote script loading, no JIT-compiled code from a remote source. Visa Master complies: all code lives in `extension/dist/` and is bundled into the ZIP. Verify by searching the bundle for dynamic-code constructs (the JavaScript `Function` constructor invoked with a string argument, the global `eval` function invoked anywhere, and any dynamic `import()` of a remote URL) before submission.

---

## 9. Listing Assets — What We Need

The Web Store form requires the following media. Specs are Google's, current as of 2026-05. Failing to upload at the required dimensions blocks publish.

| Asset | Spec | Status | Notes |
|---|---|---|---|
| Extension icon | 128 × 128 PNG | ✅ Exists (`extension/public/icons/icon-128.png`) | Used in store listing thumbnail and browser toolbar |
| Screenshots | 1280 × 800 OR 640 × 400 PNG/JPEG (1–5 of them, at least 1 required) | ❌ TODO | The single most-clicked element of the listing; produce these last after the UI is final |
| Small promo tile | 440 × 280 PNG/JPEG | ❌ TODO | Required for featured placement; not strictly needed to publish |
| Marquee promo tile | 1400 × 560 PNG/JPEG | ❌ Optional | Only relevant if pursuing editorial featuring; we are not |
| Promo video | YouTube link, 30s–5min | ❌ Optional | Skip for v1.0.10 |

### Screenshot plan (5 images, 1280 × 800)

1. **Hero** — popup mid-watch on a Manchester→France subject, evidence panel expanded. The single image that has to "land" — every other listing asset is downstream of this one.
2. **Slot found** — popup in `SLOT_AVAILABLE` state, evidence visible, "Open TLScontact tab" CTA prominent.
3. **Settings + sidebar TOC** — the new settings page (this session's work) showcasing the sticky TOC and a couple of section heads. Demonstrates the configurability without overwhelming.
4. **Telegram setup wizard** — step 3 or 4 of the in-popup wizard. Conveys "phone notifications without installing yet another thing" in one image.
5. **Open source** — the Welcome page tier-comparison table showing Free vs Premium with the "you're installing this" pill on Free. Bakes the £0 / open-source / no-server message into the listing without requiring readers to load text.

### Promo tile plan (440 × 280)
Single image: the "v" Visa Master glyph + "TLScontact slot watcher" headline + "Free · Open source · MIT" eyebrow. Production-quality not required at v1 — this slot is for featured placement we're not pursuing.

### Production approach
Generate at 2× density (2560 × 1600) and downscale for Retina-clarity. Use the live extension in a clean Chrome profile against a real TLS page. Annotation overlay (subtle arrow + 1-line caption) per screenshot, kept legible at thumbnail size — assume the reader sees the listing in the 300px-wide store sidebar before the full page.

---

## 10. Build & Package Workflow

Per CLAUDE.md release workflow, with explicit version targets:

```bash
# 1. Bump version. Option A → 1.0.10; Option B/C → 1.1.0.
$EDITOR extension/manifest.json    # version field

# 2. Type-check and build.
cd extension
npm run typecheck                  # must pass
npm run build                      # writes dist/

# 3. Smoke-test as unpacked.
#    chrome://extensions → Developer mode → Load unpacked → select dist/
#    Verify popup, Settings, Welcome on first run, slot-found path.

# 4. Package as ZIP.
npm run package                    # produces visa-master-v<version>.zip
#    (or: (cd dist && zip -r ../visa-master-v1.0.10.zip .))

# 5. Tag in the public release repo.
cd /path/to/public/Schengen-master-clone
git tag v1.0.10
git push origin v1.0.10

# 6. Attach the ZIP to the GitHub Release at github.com/torlyai/Schengen-master/releases.
gh release create v1.0.10 visa-master-v1.0.10.zip --title "v1.0.10 — …" --notes-file …
```

**Option-A-specific:** the build flag that hides Premium needs to be set at step 2. Vite reads `VITE_VM_PREMIUM_ENABLED` from `.env.production` (file to be created). Default to `false` for production builds, `true` for dev. The popup nudge and the Premium intro page are conditional on `import.meta.env.VITE_VM_PREMIUM_ENABLED === 'true'`. Verify by searching the built bundle for "PREMIUM_LANDING" / "UPGRADE_TO_PREMIUM" — if they're present in the production ZIP after the build flag is off, the gate is leaky.

---

## 11. Pre-Submission Checklist

Each item is a hard gate. The submission is queued only when every box is checked.

### Code
- [ ] `manifest.json` version bumped to the target (1.0.10 for Option A; 1.1.0 for B/C)
- [ ] `npm run typecheck` passes
- [ ] `npm run build` passes
- [ ] Unpacked smoke-test passes on a clean Chrome profile (popup, Settings, Welcome, slot-found path, optional Telegram setup if visible)
- [ ] No `console.log` of PII (TLS credentials, install UUID, license JWT) — grep before zipping
- [ ] No dynamic-code constructs in the built bundle (per §8 remote code policy)
- [ ] Option A only: Premium build flag confirmed off, bundle does not contain `PREMIUM_LANDING` / `UPGRADE_TO_PREMIUM` strings

### Listing copy
- [ ] Extension name (§5) finalised in the dashboard form
- [ ] Short description (§5) finalised, character count ≤ 132
- [ ] Detailed description (§5) finalised, copy-checked for typos
- [ ] Single-purpose statement (§6) matches the manifest + behaviour
- [ ] Every requested permission has a justification (§7) saved in the dashboard

### Assets
- [ ] 128 × 128 extension icon present in build
- [ ] At least 1 screenshot at 1280 × 800 (5 ideal — see §9)
- [ ] Optional 440 × 280 promo tile (skip is okay for v1)

### Pages on torly.ai
- [ ] `torly.ai/visa-master` (homepage URL) returns a real product page, not a redirect
- [ ] `torly.ai/privacy/visa-master` (privacy policy URL) exists and matches the privacy disclosure (§8)
- [ ] Option B/C only: `torly.ai/visa-master/cancelled` deployed (Stripe cancel_url; we just fixed this in code, still need to deploy)

### Privacy & legal
- [ ] Privacy practices form (§8) completed with truthful answers
- [ ] All three required certifications ticked
- [ ] Single-purpose declaration matches §6
- [ ] Remote code policy declaration: "no remote code"

### Account
- [ ] Chrome Web Store developer account active ($5 one-time fee paid)
- [ ] Two-factor authentication enabled on the Google account (Google requires this for publishers as of 2023)
- [ ] Group publisher? — if Torly AI is publishing under a group, group membership verified

---

## 12. Submission Workflow — Step by Step

Assumes Option A, Chrome Web Store Developer Console URL: `https://chrome.google.com/webstore/devconsole/`.

1. **Log in** to the developer console with the publishing Google account.
2. If a Visa Master listing does **not** exist: click "New item" → upload `visa-master-v1.0.10.zip`. If it does exist: open the existing listing → "Package" → "Upload new package" → upload the ZIP.
3. The dashboard auto-parses the manifest. Confirm version, permissions, and host permissions match expectations.
4. **Store listing** tab:
   - Paste extension name, short description, detailed description from §5
   - Upload icon (auto-filled from `manifest.json`), screenshots (§9)
   - Set category to "Productivity"
   - Add homepage + support + privacy policy URLs (§5)
5. **Privacy practices** tab:
   - Single-purpose statement (§6) — paste verbatim
   - Permission justifications (§7) — paste each into its row
   - Data collection answers (§8) — answer truthfully
   - Tick all three required certifications
6. **Distribution** tab:
   - Visibility: **Public** (for the v1 launch) or **Unlisted** (for soft-launch via direct link). Recommend **Public** since the install count compounds and the listing is review-gated either way.
   - Regions: All regions, unless a specific country is intentionally excluded (we aren't).
   - Pricing: Free.
7. Click **Submit for review** at the top.
8. Confirm submission. The status changes to "Pending review". Expected: 1–3 business days for first submission, hours for subsequent updates.

### What to do while waiting for review
- Do not touch the listing. Any save to the form sometimes resets the review queue position.
- Set up a Google Group / shared inbox alias for `contact@torly.ai` so review-rejection emails are visible to the team.
- Prep the v1.0.11 hot-fix branch in case review surfaces something.

### What happens on approval
- Listing goes live within ~15 minutes of approval.
- Direct install URL: `https://chrome.google.com/webstore/detail/<slug>/<extension-id>`.
- The Update workflow becomes available — new ZIPs uploaded to the same listing go through a faster review (hours, sometimes minutes).

### What happens on rejection
- Reviewer's email cites the specific policy section that triggered the rejection.
- Fix → re-upload ZIP → re-submit. There is no penalty for re-submission; the review history is opaque to users.

---

## 13. Review Risks and Mitigations

The risks below are ranked by likelihood × impact for a typical first submission with our permission surface.

### High likelihood
- **Permission justification too vague.** Mitigation: §7 of this doc is the source of truth — paste those strings, don't improvise.
- **Single-purpose statement contradicts behaviour.** Mitigation: §6 takes the strictest defensible reading; for Option A we eliminate the bi-purpose ambiguity entirely by removing `torly.ai` host perms.
- **Privacy disclosure mismatches manifest.** Mitigation: §8 lines up with the manifest field by field. Cross-check at submission time.

### Medium likelihood
- **Screenshot quality flagged as low effort.** Mitigation: §9 production plan. At minimum, do not submit with cropped browser chrome or watermarks.
- **Privacy policy URL 404.** Mitigation: §11 checklist explicitly gates on the URL being reachable.
- **Code obfuscation flagged.** Vite output is minified, which is allowed, but heavy minification can trigger automated tooling. Mitigation: build with esbuild minification (Vite default) and avoid uglifier-grade name-mangling.

### Lower likelihood, higher impact
- **Trademark concern on "TLScontact".** TLS is a trademark of TLScontact (Teleperformance Group). We do not use the logo, we do not claim affiliation, and the listing copy explicitly frames the extension as a third-party watcher. Mitigation: keep all references descriptive ("watches your TLScontact tab", not "TLScontact watcher" used as a product name). If challenged, fallback name is "Visa Master — Schengen Slot Watcher".
- **Cloudflare / anti-bot wording triggers an automation-policy concern.** Mitigation: §5 detailed description deliberately uses "polite cadence", "does not bypass any anti-bot measure", "you always click the Book button yourself" — these are the exact phrases that defuse this concern. Do not edit them to be more "exciting" before submission.
- **Premium-tier confusion (Option B/C only).** Reviewers may worry that auto-booking violates TLScontact's terms. Mitigation: PRD 09 §14 documents the compliance posture in detail; quote from it in the Premium permission justification if needed.

---

## 14. Post-Publish Operations

### Day 0 (publish day)
- Verify the direct install URL works in an Incognito window (no Google account context).
- Pin the listing to torly.ai/visa-master.
- Update the GitHub README with the Web Store install button.
- Tweet from `@torlyai` with the install link and a 30-second video walkthrough.

### Week 1
- Monitor uninstall reason codes daily (Web Store dashboard → Stats → Uninstalls). Common early reasons: permission anxiety, "doesn't work" (often a TLS DOM change on user's side), "not what I expected".
- Respond to every store review within 24h. Review responses are public and signal active maintenance.

### Week 2–4
- Cohort retention chart (Day 7, Day 14, Day 28 retention). Target: ≥ 65% Day 7 (these are users with an active visa appointment problem — retention should be high during their window, then drop sharply once their appointment is booked, which is fine).
- If a regression is reported: hot-fix branch → version bump → re-submit. Plan for at least one hot-fix in the first month.

### Permanent
- Quarterly listing review: screenshots stale? Description out of date? Permissions changed?
- Six-monthly Privacy Practices re-attestation (Google's policy).

---

## 15. Open Questions

These need answers before the submission queue can start. Each links to the section in this doc that depends on it.

1. **Release scope (§3).** Option A / B / C? Default recommendation: A.
2. **Existing Web Store listing?** If yes, the workflow is "upload new package to existing listing". If no, the workflow is "create new item" — which also means we lose the option of soft-launching as Unlisted.
3. **Publishing account.** Is the Chrome Web Store developer account in Duke Harewood's personal name, or a Torly AI group account? Affects support email + legal entity in the listing footer.
4. **torly.ai product page.** `torly.ai/visa-master` and `torly.ai/privacy/visa-master` need to exist before submission (§11). Build effort estimated separately from this PRD.
5. **Screenshot production.** §9 calls for 5 screenshots — who produces them and against what test data? Recommend: produce against the Manchester→France subject (`gbMNC2fr`) since the dogfooding data is already there.
6. **Submission timing.** Targeting which calendar week? Google reviewers move slower around Western holidays; budget +3 days if submitting in late December or mid-August.

---

## Appendix A — Quick Reference: Web Store policy URLs

- Developer Program Policies: https://developer.chrome.com/docs/webstore/program-policies/
- User Data FAQ: https://developer.chrome.com/docs/webstore/user-data-faq/
- Permission warnings reference: https://developer.chrome.com/docs/extensions/develop/concepts/permission-warnings
- Single-purpose policy: https://developer.chrome.com/docs/webstore/program-policies/single-purpose/

## Appendix B — Decision log (to be updated as decisions land)

| Date | Decision | Decided by | Notes |
|---|---|---|---|
| 2026-05-14 | PRD drafted, Option A recommended | Duke Harewood | This document |
| | Release scope confirmed | | Pending |
| | Publishing account confirmed | | Pending |
| | Submission week confirmed | | Pending |

---

*End of PRD.*
