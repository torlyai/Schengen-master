# PRD: Visa Master Premium — Auto-Book Tier

**Document:** 09-visa-master-premium-prd.md
**Version:** 1.0
**Date:** 2026-05-13
**Status:** Draft for review
**Owner:** Duke Harewood (Torly AI)
**Related docs:**
- `06-visa-master-chrome-extension-prd.md` — Free tier PRD (slot detection + notification only)
- `07-chrome-extension-wireframes.md` — Free tier wireframes
- `08-vs-alternatives.md` — Competitive landscape (VisaReady, TLSContact Appointment Booker)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Why Add a Premium Tier Now](#2-why-add-a-premium-tier-now)
3. [Goals, Non-Goals, and Success Metrics](#3-goals-non-goals-and-success-metrics)
4. [Personas](#4-personas)
5. [Tier Comparison — Free vs Premium](#5-tier-comparison--free-vs-premium)
6. [Pricing Model](#6-pricing-model)
7. [End-to-End User Flow](#7-end-to-end-user-flow)
8. [Functional Requirements](#8-functional-requirements)
9. [Architecture — Hybrid (Local Scan + Local Book + Server Billing)](#9-architecture--hybrid-local-scan--local-book--server-billing)
10. [Backend Service — Licensing and Billing](#10-backend-service--licensing-and-billing)
11. [Credentials, Auto-Login, and Session Recovery](#11-credentials-auto-login-and-session-recovery)
12. [Auto-Booking State Machine](#12-auto-booking-state-machine)
13. [Privacy, Security, and Data Handling](#13-privacy-security-and-data-handling)
14. [Compliance and ToS Posture (Premium-Specific)](#14-compliance-and-tos-posture-premium-specific)
15. [Wireframes](#15-wireframes)
16. [Non-Functional Requirements](#16-non-functional-requirements)
17. [Risks, Mitigations, and Open Questions](#17-risks-mitigations-and-open-questions)
18. [Roadmap and Milestones](#18-roadmap-and-milestones)
19. [Appendix A — Reference: VisaReady Flow Analysis](#19-appendix-a--reference-visaready-flow-analysis)

---

## 1. Executive Summary

Visa Master v1.0.9 (the Free tier) ships as a privacy-first slot-notification extension. PRD `06` explicitly defers auto-booking with the reasoning: "Form-fill, auto-attach, and auto-booking are explicitly deferred (see §17 for the rationale)." This document **reverses** that deferral for a paid Premium tier while preserving the Free tier's existing promise and architecture intact.

**Premium ships as the same extension** (single Chrome Web Store listing, same codebase, same MIT-licensed source). Users upgrade in-app via Stripe Checkout. A signed license token in `chrome.storage` unlocks the auto-book code path. Free users see no behavioural change; their version continues to notify-and-stop.

**Premium pricing: £19 success fee, charged only when we successfully book a TLScontact slot.** £0 if no slot is booked. This is intentionally £10 below VisaReady's £29 — the comparison page (`08-vs-alternatives.md`) becomes the marketing.

**Architecture: hybrid.** Scanning and the booking transaction both run locally in the user's browser, exactly like the Free tier. The only server component is a small licensing backend (`api.torly.ai`) that issues signed JWT tokens after Stripe payment and is queried once on activation. There is **no shared scanning network**, **no server-side scrape of TLScontact**, and **no user data transits our servers** beyond what Stripe captures for billing. This is the load-bearing competitive difference from VisaReady.

**UI placement.** Premium configuration lives in a new **"Options" tab inside the popup**, visible only when Premium is active. The existing full-tab Settings page (`src/settings/settings.html`, opened from `chrome://extensions`) is unchanged — it continues to hold general extension config (notification channels, polling cadence, language, debug). The popup keeps its existing two tabs for Free users (`Status` and `Help`); Premium activation adds the `Options` tab between them. There is intentionally no naming collision with the existing Settings page.

**Login: encrypted credential storage with auto-relogin.** Premium does store the user's TLScontact email + password in `chrome.storage.local`, AES-encrypted with a key derived from a per-installation salt. This is a meaningful change from the Free tier's "we never touch credentials" promise; §11 details how the promise is restated for Premium without breaking Free.

**Booking behaviour: fully automatic.** When a slot matching the user's criteria is detected, the content script drives the TLScontact booking flow without user confirmation. The user is informed by desktop + Telegram notification within seconds. They then have ~30 minutes to pay the TLS service + consulate fee on TLS's own site.

---

## 2. Why Add a Premium Tier Now

Three trends in the competitive landscape make this the right quarter to ship Premium:

1. **VisaReady launched 2026-05-13** with the £29 success-fee auto-book model and 26 users at this writing. Their listing went live the same day we shipped 1.0.9. The "I want auto-book" market segment is now actively being captured by a closed-source, server-coordinated competitor — leaving the auditable, local-only auto-book niche unclaimed.

2. **TLSContact Appointment Booker has 6,000 users at 3.2★** (`08-vs-alternatives.md` §2.2). The 3.2★ rating tells the story: there is real demand for auto-booking but the existing options are dissatisfying. Both incumbents are 173 KiB thin clients dependent on a server pool — neither offers the trust posture our Free user base already values.

3. **Free user funnel maturity.** Free users who hit `SLOT_AVAILABLE` already have to scramble to the tab and book within seconds. The conversion event for Premium is obvious: every slot-missed event in the Free tier is a Premium activation opportunity. This justifies adding an "Upgrade to Premium" CTA on the slot-found popup state.

---

## 3. Goals, Non-Goals, and Success Metrics

### 3.1 Goals

- **G1.** Add an auto-booking capability that completes the booking transaction inside the user's authenticated TLScontact session, with no user click after the slot is detected.
- **G2.** Preserve the Free tier's "never touches credentials, never books for you" promise unchanged. Free behaviour, settings, and wire format identical to v1.0.9.
- **G3.** Activate Premium via Stripe Checkout in under 90 seconds from "I want to upgrade" click to "VERIFIED" status.
- **G4.** Stay architecturally pure: no shared scanning network, no server-side scrape, no user content on our servers beyond what Stripe billing requires.
- **G5.** Ship a tier-comparison page on the Chrome Web Store listing so any user can immediately see Free vs Premium differences and the trust-posture difference vs VisaReady.

### 3.2 Non-Goals

- **NG1.** No multi-applicant per-extension booking in v1 (one TLS account ↔ one extension install). Family of 3 → 3 installs on 3 browser profiles.
- **NG2.** No applicant form auto-fill (passport details, photos, etc.). Premium books the appointment slot; the user still completes the application themselves.
- **NG3.** No support for VFS Global, BLS, or any non-TLScontact provider. France/Germany/Belgium/Netherlands/Spain/Italy through TLScontact only.
- **NG4.** No mobile app. Chrome desktop only. (Telegram bot remains the phone-notification path.)
- **NG5.** No coordinated/shared scanning across multiple Premium users. Each install scans alone.

### 3.3 Success Metrics

| Metric | Target (90 days post-launch) |
|---|---|
| Premium activations | ≥ 200 |
| Booking success rate (booked / activations that saw a matching slot) | ≥ 75% |
| Free → Premium conversion rate | ≥ 3% of MAU |
| Refund rate | ≤ 5% of charges |
| Median time from `SLOT_AVAILABLE` to `BOOKING_CONFIRMED` | < 8 s |
| Median time from Stripe payment to "VERIFIED" status | < 60 s |
| Customer support tickets per booking | < 0.3 |

---

## 4. Personas

### 4.1 P1: "Catch-the-slot Carla" (existing Free user — Premium target)

- Already uses Visa Master Free. Has been notified of two slots but missed both because she was away from her laptop.
- Travel date locked; submission window is ≤ 4 weeks.
- £19 is much less painful than missing the trip.
- **Trust threshold:** must believe her credentials don't leave the browser and that the £19 only fires on success.

### 4.2 P2: "Trust-first Tao" (Chinese-speaking applicant who chose Free because of trust posture)

- Specifically chose Visa Master over VisaReady/TLSContact Booker because the README is in 中文 and the source is on GitHub.
- Will only upgrade if Premium preserves the trust story.
- **Trust threshold:** must read in 中文 exactly what changes about credential handling vs Free.

### 4.3 P3: "Already-bought-VisaReady Vanessa" (competitor refund candidate)

- Paid VisaReady, got a slot that TLS cancelled within 24h, got a refund per their policy, but never got a second slot.
- Open to trying another tool. Sensitive to price and to feeling "tricked" by upfront language.
- **Trust threshold:** crystal-clear "£0 now, £19 only on a confirmed booking" with the booking definition (slot held + TLS booking confirmation email received) written in the Stripe receipt.

---

## 5. Tier Comparison — Free vs Premium

| Capability | Free (1.0.9, ships today) | Premium (this PRD) |
|---|---|---|
| Detect slot availability | ✅ | ✅ |
| Desktop notification | ✅ | ✅ |
| Telegram notification | ✅ | ✅ |
| Email notification | ❌ | ✅ (Stripe-validated email) |
| Smart polling windows (UK release hours) | ✅ | ✅ (inherited) |
| Tab-reload polling (Cloudflare-friendly) | ✅ | ✅ (inherited) |
| Multi-month cycling | ✅ (opt-in) | ✅ (default on) |
| Pause / resume | ✅ | ✅ |
| **Auto-book the slot** | ❌ | ✅ |
| **Auto-login when TLS session expires** | ❌ | ✅ (opt-in toggle) |
| **Stored TLS credentials** | None | Encrypted in `chrome.storage.local` |
| **Popup "Options" tab** (booking window, credentials, group ID) | Hidden | ✅ Visible |
| **Booking window settings** (travel date, processing days, min notice) | n/a | ✅ (popup Options tab) |
| **Prime Time slot opt-in** | n/a | ✅ (popup Options tab) |
| **Full-tab Settings page** (notifications, polling, language) | ✅ unchanged | ✅ unchanged + Premium status card |
| Bilingual UI (EN / 中文) | ✅ | ✅ |
| Source code | MIT, public | MIT, public (license-gate is signed JWT, code is open) |
| Cost | £0 | £0 install · £19 on confirmed book |
| Account / sign-in required | ❌ | ❌ (email captured at Stripe Checkout) |
| Server dependencies | None (optional GitHub Releases check only) | `api.torly.ai` for license validation + Stripe |

---

## 6. Pricing Model

### 6.1 The charge rules

The pricing model has exactly three events that can trigger a charge or a refund. There is no fourth event.

| Event | Outcome |
|---|---|
| **No slot is ever found** that fits the booking window | £0 charged. Ever. We keep scanning until the user cancels or we book. |
| **User cancels Premium from the popup** before we have booked a slot | £0 charged. Scanning stops immediately. |
| **We book a slot and TLS confirms it** | £19 captured via Stripe. |
| **TLS voids the booked slot within 24h of confirmation** | £19 refunded automatically. After 24h, the slot is the user's and the fee stands. |

### 6.2 What counts as "booked"

The content script observes the TLScontact post-booking confirmation page — either by URL pattern (`*/appointment/confirmation*`) or by matching the localised "Your appointment is confirmed" string. Only after that observation does the SW call `POST /booking/capture` with the Stripe customer ID. The detection contract lives in `src/content/booking-confirmation-detector.ts` and is the only code path that can trigger a £19 charge.

### 6.3 Currency and display

- **Billing currency:** GBP only on day 1. Stripe handles card-side conversion automatically for non-UK cards.
- **Display:** always £19 everywhere — intro tab, Stripe Checkout, Settings, Options tab, comparison page, marketing site. No geo-detected localisation. One price string, one promise. If we add EUR/USD billing later, the display surfaces gain a currency picker; until then there is one number.

### 6.4 Cancellation

A single "Cancel Premium" button lives in the popup `Options` tab (W-18a) and in the full Settings page (W-18b). One click:
- Sets `licenseToken.tier` to `cancelled` and stops auto-booking immediately.
- Leaves Free-tier notification behaviour intact.
- Does not detach the Stripe card (the card stays on file until the user clicks "Manage card in Stripe").
- Captures cancellation reason via an optional one-line text field for product feedback (skippable).

If a booking succeeds in the moments between the user clicking Cancel and the FSM acknowledging the cancel, the booking still counts and £19 is captured. The Cancel button is **not** an emergency stop on an in-flight booking; the booking FSM has a 60-second budget and is uncancellable mid-flight. This is intentional — once we've claimed a slot we cannot cleanly release it.

### 6.5 Refund flow specifics

- **Trigger:** TLS voids the confirmed slot within 24h. The user clicks "Slot was cancelled by TLS" in the popup (W-17). Refund issued immediately via Stripe Refund API.
- **No support ticket required** for this case. One click. The refund is automatic.
- **After 24h post-confirmation:** the slot is the user's responsibility. If TLS cancels later, that's between the user and TLS; we have done our job.
- **TLS account locks (account-level, not slot-level):** Premium pauses scanning. No automatic refund — a TLS account lock is not the same as a voided slot. The user can still seek refund via support if a booking has not yet happened; if it has happened, the booking stands.

### 6.6 Pricing FAQ (committed copy for marketing surfaces)

These are the exact phrasings to use on the intro tab (W-2), the Chrome Web Store description, and the comparison page. Single source of truth lives here.

> **What if you never find me a slot?**
> The £19 success fee never charges. You owe nothing — we keep scanning until you cancel or we successfully book.
>
> **Can I cancel any time?**
> Yes — from the extension popup. We stop scanning immediately. No charges happen unless we've already booked a slot for you.
>
> **What if a slot opens but TLS doesn't confirm the booking?**
> No charge. The £19 is only captured when TLS confirms the appointment.
>
> **What if TLS cancels the slot you booked?**
> We refund the £19 if TLS voids the booking within 24 hours of confirmation. After that, the slot is yours and the success fee stands.
>
> **What if my TLScontact account gets locked?**
> Premium pauses. We won't keep trying. If we haven't booked anything yet, you owe nothing. If we have already booked, the fee stands — the booking happened.

---

## 7. End-to-End User Flow

The flow below uses the screen IDs from §15 (Wireframes). Each step references the wireframe that depicts it.

```
                    FREE TIER (1.0.9, unchanged)
                    ────────────────────────────
                    Install → Welcome → Settings → Active monitoring
                                                          │
                                                          │ user clicks "Upgrade"
                                                          ▼
                    PREMIUM TIER (this PRD)
                    ───────────────────────
       (W-1) Upgrade prompt in popup
                    │
                    │ "Tell me more"
                    ▼
       (W-2) Premium intro page (opens in new tab)
                    │
                    │ "Start setup"
                    ▼
       (W-3) Pre-flight: pin tab, plug in laptop, confirm logged in
                    │
                    │ "Continue to setup"
                    ▼
       (W-4) Setup wizard — Step 1/4: Visa centre + TLS credentials
                    │
                    ├── verification gate detected → (W-5) Wait for Cloudflare → retry
                    │
                    ▼
       (W-6) Setup wizard — Step 2/4: Signing in (extension drives TLS tab)
                    │
                    ├── stale session → (W-7) Setup couldn't finish — retry / start over
                    ├── another user logged in → (W-8) Manual logout instruction → retry
                    │
                    ▼
       (W-9) Setup wizard — Step 3/4: Booking window
                    │
                    ▼
       (W-10) Setup wizard — Step 4/4: Ready to activate (Stripe Setup Intent)
                    │
                    │ "Activate — £0 now, £19 only on a booking"
                    ▼
       (W-11) Stripe Checkout (hosted on torly.ai)
                    │
                    │ card saved → license JWT issued → extension polls
                    ▼
       (W-12) Activated landing page (torly.ai)
                    │
                    ▼
       (W-13) Premium Status panel — ACTIVE, watching for slots
                    │
                    │ slot detected and matches window
                    ▼
       (W-14) Auto-booking in progress (banner over Status panel)
                    │
                    ├── booked successfully → (W-15) Booked! + Stripe £19 captured
                    └── booking failed → (W-16) Booking failed, resume scanning
                    │
                    ▼
       User pays TLS visa/service fees on TLS's own confirmation page.
       Refund flow available if TLS cancels (W-17).
```

---

## 8. Functional Requirements

### 8.1 Tier detection

- **FR-1.** On every service-worker boot, the extension reads `licenseToken` from `chrome.storage.local`. If present and not expired, it validates the signature against the embedded public key and unlocks Premium code paths.
- **FR-2.** If `licenseToken` is absent, malformed, expired, or signature-invalid, the extension runs in Free mode. No Premium features are exposed in the UI.
- **FR-3.** License validation is **offline** after activation. The signed JWT contains `installId`, `tier`, `expiresAt`, and `purchasedAt`. No network round-trip is needed to determine tier.

### 8.2 Free → Premium upgrade prompts

- **FR-4.** When the popup is on the `SLOT_AVAILABLE` state in Free mode, an "Upgrade — never miss the next one" banner appears below the slot details. (Wireframe W-1.)
- **FR-5.** A persistent "Upgrade to Premium" entry exists in the popup footer in all Free states.
- **FR-6.** Clicking either entry opens the Premium intro tab (`extension_url/premium.html`, wireframe W-2).

### 8.3 Premium activation

- **FR-7.** Activation requires: visa centre selection, TLScontact email + password, travel date, Stripe Setup Intent confirmed.
- **FR-8.** Until `licenseToken` is in `chrome.storage.local`, the extension cannot auto-book regardless of any other state. Defence in depth.
- **FR-9.** Activation can be reversed at any time via Settings → "Cancel Premium". Cancellation is immediate (license token deleted locally) but cannot un-charge a booking that already triggered Stripe capture. Future bookings stop.

### 8.4 Booking window

- **FR-10.** User configures `travelDate` (required) and `visaProcessingDays` (default 21). The valid booking window is `[today + minDaysNotice, travelDate - visaProcessingDays]`.
- **FR-11.** Detected slots outside the window are notified (desktop only) but NOT auto-booked. The popup status reads "Slot detected but outside window — not booked."
- **FR-12.** `includePrimeTime` toggle defaults to OFF. If OFF, Premium skips slots marked Prime Time or Premium on TLScontact (per-slot per-locale string match).

### 8.5 Slot matching → auto-book

- **FR-13.** When the content script reports `SLOT_AVAILABLE` and the matching slot date falls inside the booking window AND respects the Prime Time toggle, the booking state machine (§12) enters `BOOKING_IN_PROGRESS`.
- **FR-14.** The content script clicks the slot, confirms, and proceeds through TLS's booking flow. Each step has a 5-second timeout and a single retry. The full flow has a 60-second budget.
- **FR-15.** On reaching the TLS confirmation page (URL pattern OR confirmation string match), the SW calls `POST /booking/capture` against `api.torly.ai` with `{installId, licenseToken, bookingId, centre, dateBooked}` to trigger Stripe payment capture.
- **FR-16.** On confirmation, desktop + Telegram + email notifications fire with a deep link to the TLS payment page.

### 8.6 Auto-login

- **FR-17.** When the content script detects a TLS logout (URL pattern `*/login*` or presence of the login form on a previously-authenticated centre), the SW initiates auto-login using stored encrypted credentials.
- **FR-18.** Auto-login has a hard cap of 3 attempts per hour to avoid lockout. After cap, extension enters `LOGIN_FAILED` and prompts the user. No further auto-attempts.
- **FR-19.** Auto-login can be toggled off in Settings. Default: ON for Premium activations.

### 8.7 Refund

- **FR-20.** In Status panel, a "Slot was cancelled by TLS" button appears for 24h after a successful booking. Clicking it sends a refund request to `api.torly.ai`, which calls Stripe Refunds with `reason: 'requested_by_customer'`.
- **FR-21.** Refund eligibility is enforced server-side using Stripe charge metadata (timestamp + bookingId). The extension UI gives optimistic feedback but the source of truth is Stripe.

---

## 9. Architecture — Hybrid (Local Scan + Local Book + Server Billing)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│   USER'S BROWSER (the entire scanning + booking machine)                 │
│                                                                          │
│   ┌─────────────────┐                                                    │
│   │ Content script  │  detect slot                                       │
│   │ (TLS tab)       │  click through booking                             │
│   └────────┬────────┘                                                    │
│            │ DETECTION_RESULT / BOOKING_RESULT                           │
│            ▼                                                             │
│   ┌─────────────────┐         ┌──────────────────────┐                   │
│   │ Service worker  │ ◄─────► │ chrome.storage.local │                   │
│   │ - scheduler     │         │ - settings           │                   │
│   │ - state machine │         │ - licenseToken (JWT) │                   │
│   │ - booking FSM   │         │ - tlsCreds (AES-GCM) │                   │
│   │ - notifications │         └──────────────────────┘                   │
│   └────────┬────────┘                                                    │
│            │                                                             │
└────────────┼─────────────────────────────────────────────────────────────┘
             │  HTTPS — only these endpoints
             │  • POST /license/activate     (Setup Intent ID → license JWT)
             │  • POST /booking/capture      (after booking confirmed)
             │  • POST /booking/refund       (TLS cancelled slot)
             │  • GET  /license/status       (verify JWT not revoked)
             ▼
┌──────────────────────────────────────────────────────────────────────────┐
│   api.torly.ai  (small Node service)                                     │
│                                                                          │
│   - Validates Stripe Setup Intent / PaymentIntent                        │
│   - Signs license JWTs with private key (ES256)                          │
│   - Stores: installId → stripeCustomerId, license history, refund log    │
│   - Stores ZERO TLS credentials. Zero scan data. Zero slot data.         │
└──────────────────────────────────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────────────────────┐
│   stripe.com  (PCI scope is theirs, not ours)                            │
│                                                                          │
│   - Saves card via Setup Intent during activation                        │
│   - Captures £19 on booking confirmation                                 │
│   - Issues refund on TLS-cancelled slots                                 │
└──────────────────────────────────────────────────────────────────────────┘
```

### Critical architectural invariants

| Invariant | Enforced by |
|---|---|
| TLS credentials never leave the browser | No backend endpoint accepts them. Reviewed in CI. |
| Slot data never leaves the browser | No backend endpoint accepts slot data. Reviewed in CI. |
| The extension can be airgapped after activation | License is offline-verifiable; only `booking/capture` and `booking/refund` need network. |
| Server has no scraping capability | The backend has no headless browser, no TLS code path, no slot ingest. By design. |

---

## 10. Backend Service — Licensing and Billing

**Hosting:** `api.torly.ai` on Vercel Functions or Cloudflare Workers. ≤ 5 endpoints, ≤ 500 LOC.

**Endpoints:**

- `POST /license/activate` — body `{installId, setupIntentId}`. Validates Setup Intent with Stripe, persists `installId ↔ stripeCustomerId`, returns signed JWT with `tier=premium`, `expiresAt = now + 18 months`.
- `POST /license/rebind` — body `{stripeEmail, newInstallId}`. Re-binds a previously-activated license to a fresh `installId` (uninstall/reinstall path, per Q6 resolution). Validates that the email has an active license, deactivates any previous `installId` for that customer, issues a fresh JWT bound to `newInstallId`. Rate-limited to 3 rebinds per email per 30 days to prevent abuse.
- `POST /booking/capture` — body `{installId, licenseToken, bookingMeta}`. Validates JWT, creates Stripe PaymentIntent for £19, captures immediately. Idempotent on `(installId, bookingMeta.bookingId)`.
- `POST /booking/refund` — body `{installId, bookingId}`. Validates booking exists, ≤ 24h old, no prior refund. Issues Stripe refund.
- `GET /license/status` — query `?installId=...`. Returns `{active: bool, expiresAt, lastBookingAt}`. Used by extension for periodic revalidation (once per 24h).
- `POST /webhook/stripe` — Stripe webhook for `charge.refunded`, `customer.deleted`. Updates license server-side; pushes nothing to extension (extension re-fetches on next status check).

**Database:** SQLite (Turso) or Postgres (Neon) with three tables — `installs`, `licenses`, `bookings`. Total cardinality at 200 Premium users in 90 days: < 5,000 rows.

**Secrets:** ES256 private key for JWT signing (env var); Stripe restricted API keys (env var). No production data on developer laptops.

---

## 11. Credentials, Auto-Login, and Session Recovery

### 11.1 Storage

TLS credentials are stored in `chrome.storage.local` under key `tlsCreds`:

```json
{
  "email": "AES-GCM(plaintext, key)",
  "password": "AES-GCM(plaintext, key)",
  "nonce": "<base64 random>",
  "createdAt": "2026-05-13T08:42:00Z"
}
```

The encryption key is derived via PBKDF2 from a per-installation salt stored under `chrome.storage.local.installSalt`. The salt is generated at first install with `crypto.getRandomValues(32 bytes)`.

This is **not** end-to-end-encrypted against a determined attacker with code-execution on the device — Chrome's extension sandbox is the security boundary, and an attacker with that access has already won. The encryption defends against:
- Casual inspection of `chrome.storage.local` via DevTools.
- Cross-extension reads (other extensions cannot access another extension's storage in MV3).
- Backup leakage if the user's profile is copied without the install salt.

### 11.2 Brand-promise restatement

The Free tier README says: *"never touches your credentials"*. Premium changes this. The updated wording for Premium docs:

> **Free version** — never touches credentials. Doesn't ask, doesn't store, doesn't read.
>
> **Premium** — stores your TLS email and password locally on your machine, AES-GCM encrypted, so we can re-log you in when TLS expires your session. The credentials never leave your browser; our servers never see them. The encryption source is `src/shared/crypto.ts` — you can read it.

The README and the Chrome Web Store listing **must** explicitly call out this difference. Trust whiplash is the failure mode.

### 11.3 Auto-login flow

1. Content script detects logout (URL or DOM signal).
2. Service worker reads `tlsCreds`, decrypts in-memory.
3. Service worker injects a script into the TLS tab that fills `#email`, `#password`, clicks submit.
4. Content script observes success (URL change OR session cookie present) within 10s OR reports failure.
5. After 3 consecutive failures within an hour, auto-login disables itself and prompts the user (W-7).

### 11.4 Forgetting credentials

A single Settings button: "**Forget TLS credentials**". One click. Deletes `tlsCreds` and `installSalt`. Confirmed via Chrome's own permission prompt UI ("delete extension data"). Premium remains active — only auto-login stops.

---

## 12. Auto-Booking State Machine

Augments the Free-tier state machine in `src/background/state-machine.ts` with three new states.

```
                                  (existing Free states)
                                  ┌─────────────────────┐
                                  │   NO_SLOTS          │
                                  │   SLOT_AVAILABLE    │  ← when matching window & licensed
                                  │   CLOUDFLARE        │  ← then PREMIUM transitions begin
                                  │   LOGGED_OUT        │
                                  │   PAUSED  IDLE      │
                                  │   UNKNOWN           │
                                  └──────────┬──────────┘
                                             │
                                  matched + licensed
                                             ▼
                            ┌─────────────────────────────────┐
                            │   BOOKING_IN_PROGRESS           │
                            │   (T+0)                         │
                            │   - clicking slot               │
                            │   - confirming applicant        │
                            │   - reading confirmation page   │
                            └────┬────────────────────────┬───┘
                                 │ confirmation observed  │ timeout/failure
                                 ▼                        ▼
                            ┌──────────────┐        ┌──────────────────┐
                            │ BOOKING_OK   │        │ BOOKING_FAILED   │
                            │ - capture £19│        │ - revert to      │
                            │ - notify all │        │   SLOT_AVAILABLE │
                            │ - 30-min pay │        │ - log reason     │
                            │   timer      │        │ - retry only on  │
                            └──────┬───────┘        │   next detection │
                                   │                └──────────────────┘
                                   │ 24h elapsed
                                   ▼
                            ┌──────────────────┐
                            │ BOOKING_CLOSED   │
                            │ refund window    │
                            │ closes; status   │
                            │ returns to       │
                            │ NO_SLOTS         │
                            └──────────────────┘
```

State transitions are guarded by the license check. If `licenseToken` disappears mid-flight (revoked, expired), `BOOKING_IN_PROGRESS` aborts and reverts to `SLOT_AVAILABLE`. The £19 is never captured without a confirmation observation.

---

## 13. Privacy, Security, and Data Handling

### 13.1 What data exists where

| Data | Location | Encryption | Retention |
|---|---|---|---|
| TLS credentials | `chrome.storage.local` only | AES-GCM | Until user clicks "Forget" or uninstalls |
| Booking window settings | `chrome.storage.local` only | None | Until uninstall |
| License JWT | `chrome.storage.local` only | Signed (not encrypted; not secret) | Until expiry or revocation |
| Slot detection results | In-memory in SW; never persisted | n/a | SW eviction |
| `installId` (random UUID) | `chrome.storage.local` + sent to backend | None (it's a random ID) | Until uninstall |
| Stripe customer ID | Backend DB | At rest | Until manual deletion request |
| Booking metadata (centre, date booked, bookingId) | Backend DB | At rest | 24 months (refund/dispute window) |
| Stripe card details | Stripe vault | PCI-compliant | Stripe's terms |
| User email | Backend DB (from Stripe Checkout) | At rest | Until deletion request |

### 13.2 Data the backend never sees

- TLS email or password
- Slot dates or times before booking
- Page content from TLScontact
- Detection results
- Polling cadence or behaviour
- Browser fingerprint, IP beyond what Stripe collects for fraud screening on the payment

### 13.3 GDPR posture

UK GDPR data controller is Torly AI Ltd. Lawful basis for the backend personal data (email + Stripe ID): contract (the user is buying a service). Data subject rights:
- Access: GET `/license/status` already returns it; expanded endpoint can return full record.
- Erasure: one-click "Delete my account" in Settings; backend deletes records + revokes JWT.
- Portability: JSON export from same Settings page.

### 13.4 Audit trail

The license verification logic, the booking trigger code path, and the capture call live in:
- `src/shared/license.ts`
- `src/background/booking-fsm.ts`
- `src/background/backend-client.ts`

A reviewer can read these three files to verify the £19 is captured only on a real confirmation observation. The tier-comparison page on the Chrome Web Store listing links directly to those files in the public GitHub repository.

---

## 14. Compliance and ToS Posture (Premium-Specific)

The Free tier's ToS posture (PRD `06` §12) rests on: "we don't bypass any anti-bot measure; we just automate the same poll a user would do manually." Premium is a stronger claim because we now **act** (auto-book), not just **observe**.

### 14.1 The honest framing

Premium **does** automate form submission inside the user's TLScontact session. This is technically prohibited by TLScontact's terms of service. We are explicit about this in:

- The Premium intro tab (W-2) carries a notice: "TLScontact does not permit automated interactions. By activating Premium, you are choosing to use automation against TLScontact's terms. We disclose this so you can decide."
- The Stripe Checkout success page repeats the disclosure.
- The Settings page has a permanent "Read about ToS exposure" link.

This is the same disclosure standard a competent legal counsel would require, and it is the line that the closed-source competitors fail to cross. Honesty is the moat.

### 14.2 Limits we keep

- **Single-applicant**: one install books one slot per booking event. No multi-account fan-out.
- **One booking per 24 hours per install**: enforced in the FSM. Defends against runaway loops if TLS shows the same slot twice.
- **Respect user release windows**: Premium only polls aggressively (every 2 min) inside the configured UK release windows, same cadence as Free. No 5-second hammering.

### 14.3 What we still don't do

- No CAPTCHA solving (we wait for Cloudflare to clear, same as Free).
- No proxy rotation or IP cycling.
- No coordinated multi-user attack on TLS (no "VisaReady network" equivalent).
- No form-fill for the visa application itself — Premium books the slot, not the application content.

---

## 15. Wireframes

ASCII low-fidelity, popup width ≈ 360 px (the actual constraint is Chrome's popup max), settings page width = 720 px, full-tab pages = 1200 px.

**Popup tab-strip conventions used below:**

| User tier | Popup tab-strip | Notes |
|---|---|---|
| Free (any state) | `Status   Help` | Plus a `⚙ open Settings` link in the header that opens the existing full-tab Settings page. No "Options" tab. |
| Premium (active) | `Status   Options   Help` | "Options" is the booking config surface — Premium-only. Settings page link still in header. |
| Setup wizard (mid-activation) | `Status   Help` | Premium not yet active; wizard occupies the Status tab. "Options" appears only after Premium is verified. |

The full-tab Settings page (`src/settings/settings.html`) is **not** a tab inside the popup — it opens in its own browser tab via `chrome.runtime.openOptionsPage()`. Premium adds a status card to it but does not move any existing controls.

| Wireframe | Surface | Tier scope |
|---|---|---|
| W-1 | Popup — Free with upgrade banner | Free |
| W-2 | Premium intro tab (`/premium.html`) | Free → Premium |
| W-3 | Popup — pre-flight checklist | Free → activating |
| W-4 | Popup — setup step 1/4 (centre + creds) | Activating |
| W-5 | Popup — verification gate | Any |
| W-6 | Popup — setup step 2/4 (signing in) | Activating |
| W-7 | Popup — setup failure: generic retry | Activating |
| W-8 | Popup — setup failure: stale session | Activating |
| W-9 | Popup — setup step 3/4 (booking window) | Activating |
| W-10 | Popup — setup step 4/4 (Stripe Setup Intent) | Activating |
| W-11 | Stripe Checkout (hosted, `torly.ai`) | Activating |
| W-12 | Activated landing (`torly.ai/activated`) | Activating → Premium |
| W-13 | Popup — ACTIVE Premium status | Premium |
| W-14 | Popup — auto-booking in progress | Premium |
| W-15 | Popup — booking succeeded | Premium |
| W-16 | Popup — booking failed | Premium |
| W-17 | Popup — refund flow | Premium |
| **W-18a** | **Popup → Options tab** (booking config) | **Premium only** |
| **W-18b** | **Full-tab Settings page** (notifications + general) | **Free + Premium** |
| W-19 | Popup → Help tab | Free + Premium |

### W-1. Free popup with upgrade banner on `SLOT_AVAILABLE`

```
┌──────────────────────────────────────────────────────────────┐
│ [VM] Visa Master                        ● ACTIVE        ✕    │
├──────────────────────────────────────────────────────────────┤
│  Status   Help                       [ ⚙ open Settings ]     │
│  ─────                                                       │
│                                                              │
│  🚨 SLOT FOUND                                               │
│  London → France — 4 Jun 2026, 10:30                         │
│  Detected 14 seconds ago                                     │
│                                                              │
│  [ Open the TLS tab and book now ]                           │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  ★ Premium would have booked this for you.             │  │
│  │     £0 now. £19 only if we actually book.              │  │
│  │     [ Tell me more ]                                   │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ───────────── Visa Master · v1.0.9 · MIT ─────────────      │
└──────────────────────────────────────────────────────────────┘
```

### W-2. Premium intro tab (`/premium.html`, full-tab)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [VM] Visa Master                                                  ✕    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Catch your TLS slot — and let us book it for you.                     │
│                                                                         │
│   ┌─────────────────────────┐  ┌─────────────────────────┐              │
│   │ FREE  (you have this)   │  │ PREMIUM                 │              │
│   │                         │  │                         │              │
│   │ • Detect slots          │  │ • Detect slots          │              │
│   │ • Desktop + Telegram    │  │ • Desktop + Telegram    │              │
│   │ • You book manually     │  │ • Email notification    │              │
│   │                         │  │ • Auto-book the slot    │              │
│   │ £0                      │  │ • Auto-login when TLS   │              │
│   │                         │  │   logs you out          │              │
│   │                         │  │                         │              │
│   │                         │  │ £0 now                  │              │
│   │                         │  │ £19 only if we book     │              │
│   └─────────────────────────┘  └─────────────────────────┘              │
│                                                                         │
│   How it works                                                          │
│   1.  You sign into TLScontact normally.                                │
│   2.  We watch your tab (locally — no servers, no network).             │
│   3.  When a slot opens that fits your travel date, we book it.         │
│   4.  Stripe charges £19 — only after the booking is confirmed.         │
│   5.  You pay TLS's visa fee on their site to finalise.                 │
│                                                                         │
│   ⚠  TLScontact does not permit automated interactions. Premium uses    │
│      automation against their terms. We disclose this so you can decide.│
│                                                                         │
│   What changes vs Free?                                                 │
│   • TLS email + password stored locally, AES-GCM encrypted              │
│     (Free: nothing stored)                                              │
│   • Card on file with Stripe (Free: no billing)                         │
│   • A small licensing API call to api.torly.ai (Free: no servers)       │
│                                                                         │
│   [ Start setup — £0 today ]      [ Stay on Free ]                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### W-3. Pre-flight checklist

```
┌──────────────────────────────────────────────────────────────┐
│ [VM] Visa Master                                       ✕     │
├──────────────────────────────────────────────────────────────┤
│  Status   Help                       [ ⚙ open Settings ]     │
│                                                              │
│  BEFORE YOU START                                            │
│                                                              │
│  • Pin this tab. Right-click the tab → Pin tab. It will      │
│    survive browser restarts and won't be closed by accident. │
│                                                              │
│  • Keep your laptop plugged in. Monitoring pauses when your  │
│    computer sleeps. We can keep the device awake while       │
│    watching, but the battery still drains and macOS sleeps   │
│    when you close the lid.                                   │
│                                                              │
│  • Be logged in to TLScontact in this browser, on this tab.  │
│    Open https://visas-fr.tlscontact.com (or your centre) and │
│    confirm you can see your profile icon top-right.          │
│                                                              │
│  [ Continue to setup ]                                       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### W-4. Setup wizard — Step 1/4: visa centre + credentials

```
┌──────────────────────────────────────────────────────────────┐
│ [VM] Visa Master                                       ✕     │
├──────────────────────────────────────────────────────────────┤
│  SETUP · STEP 1 OF 4                                         │
│  Pick your centre and tell us your TLS login.                │
│                                                              │
│  Visa centre                                                 │
│  [ Manchester → France                                  ▼ ]  │
│  London / Edinburgh / Manchester · FR / DE / BE / NL         │
│                                                              │
│  TLScontact email                                            │
│  [                                                        ]  │
│                                                              │
│  TLScontact password                                         │
│  [ •••••••••••                                       👁  ]  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ ⓘ  STORED ON YOUR MACHINE — NEVER UPLOADED.            │  │
│  │    Your email + password live in this extension's      │  │
│  │    encrypted Chrome storage (AES-GCM). They never      │  │
│  │    leave your browser; our servers never see them.     │  │
│  │    Encryption source: src/shared/crypto.ts             │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  [ Continue ]                                                │
└──────────────────────────────────────────────────────────────┘
```

### W-5. Verification gate (Cloudflare) — quick check needed

```
┌──────────────────────────────────────────────────────────────┐
│ [VM] Visa Master                                       ✕     │
├──────────────────────────────────────────────────────────────┤
│  Status   Help                       [ ⚙ open Settings ]     │
│                                                              │
│  QUICK CHECK NEEDED                                          │
│                                                              │
│  TLScontact is showing a verification gate. Wait for it to   │
│  clear (usually 20–30 seconds), then tap Continue.           │
│                                                              │
│  [ Continue ]                                                │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### W-6. Setup wizard — Step 2/4: signing you in

```
┌──────────────────────────────────────────────────────────────┐
│ [VM] Visa Master                                       ✕     │
├──────────────────────────────────────────────────────────────┤
│  SETUP · STEP 2 OF 4                                         │
│  ⏳  Signing you in to TLScontact…                            │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ ⚠  HANDS OFF THE TLS TAB                                │  │
│  │    Visa Master is driving the TLScontact tab right now.│  │
│  │    Don't click, type, or close it until setup finishes.│  │
│  │    Interfering will break the flow and you'll have to  │  │
│  │    start over.                                         │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### W-7. Setup failure — generic retry

```
┌──────────────────────────────────────────────────────────────┐
│ [VM] Visa Master                                       ✕     │
├──────────────────────────────────────────────────────────────┤
│  Status   Help                       [ ⚙ open Settings ]     │
│                                                              │
│  SETUP COULDN'T FINISH                                       │
│                                                              │
│  We couldn't complete sign-in on the first pass. TLScontact  │
│  often asks for a fresh login when an existing session is    │
│  still cached. "Try again" usually clears it. If it keeps    │
│  failing, "Start over" to re-check your details.             │
│                                                              │
│  [ Try again ]   [ Start over ]                              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### W-8. Setup failure — another user signed in

```
┌──────────────────────────────────────────────────────────────┐
│ [VM] Visa Master                                       ✕     │
├──────────────────────────────────────────────────────────────┤
│  SETUP COULDN'T FINISH                                       │
│                                                              │
│  TLScontact already has someone signed in on this browser,   │
│  and our auto-logout couldn't clear it. Open the TLS tab,    │
│  click the profile icon top-right, choose LOG OUT, then      │
│  click Try again here.                                       │
│                                                              │
│  [ Try again ]   [ Start over ]                              │
└──────────────────────────────────────────────────────────────┘
```

### W-9. Setup wizard — Step 3/4: booking window

```
┌──────────────────────────────────────────────────────────────┐
│ [VM] Visa Master                                       ✕     │
├──────────────────────────────────────────────────────────────┤
│  SETUP · STEP 3 OF 4                                         │
│  When are you travelling? We'll book the earliest slot that  │
│  leaves enough buffer for your visa to process.              │
│                                                              │
│  Travel date                                                 │
│  [ 15 / 08 / 2026                                        📅 ] │
│                                                              │
│  Visa processing days before travel                          │
│  [ 21                                                     ]  │
│  Default 21. Most visas finish in ~14 days; the extra week   │
│  is a buffer. Lower this only if you've confirmed a faster   │
│  turnaround for your visa type.                              │
│                                                              │
│  Min days notice                                             │
│  [ 0                                                      ]  │
│  Don't book anything sooner than this many days from today.  │
│  Default 0 — earliest is fine.                               │
│                                                              │
│  ☐  Include Prime Time and Premium slots                     │
│     TLScontact charges ~£60 surcharge for Prime Time. By     │
│     default we only book standard slots.                     │
│                                                              │
│  ✓ We'll accept slots between 2026-05-13 and 2026-07-25.     │
│                                                              │
│  [ Continue ]                                                │
└──────────────────────────────────────────────────────────────┘
```

### W-10. Setup wizard — Step 4/4: ready to activate

```
┌──────────────────────────────────────────────────────────────┐
│ [VM] Visa Master                              ● VERIFIED  ✕  │
├──────────────────────────────────────────────────────────────┤
│  SETUP · STEP 4 OF 4 — Ready to activate                     │
│                                                              │
│  Setup complete for Manchester → France (group 26445690).    │
│  £0 now — we only charge £19 if we actually book a slot.     │
│  No subscription, no charge if no slot is found.             │
│                                                              │
│  For comparison: VisaReady is £29; TLSContact Booker is      │
│  £19.99 / 2 weeks regardless of outcome.                     │
│                                                              │
│  From here, we do the work                                   │
│  • 24/7 auto-booking — we watch TLScontact continuously and  │
│    grab the first slot that fits your window.                │
│  • Email + Telegram the moment we book. Your card is only    │
│    charged then.                                             │
│  • One last step on your side: pay TLS's visa fee on their   │
│    site to confirm.                                          │
│                                                              │
│  [ Activate — £0 now, £19 only on a booking ]                │
│                                                              │
│  Stripe saves your card so we can charge £19 if we book —    │
│  nothing is taken today. By activating you accept our        │
│  Terms and Privacy Policy.                                   │
│                                                              │
│  Already paid? [ Recheck payment status ]                    │
└──────────────────────────────────────────────────────────────┘
```

### W-11. Stripe Checkout (hosted, opens in a new tab on `torly.ai`)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ←  [VM] Visa Master                                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Enter payment details                                                 │
│                                                                         │
│   Email                                                                 │
│   [ you@example.com                                                  ]  │
│                                                                         │
│   Save payment information                                              │
│   ┌──────────────────────────────────────────────────────────────────┐  │
│   │  💳 Card                                                          │  │
│   │  [ 1234 1234 1234 1234              ][ MM/YY ][ CVC ]            │  │
│   │  Cardholder name                                                  │  │
│   │  [                                                          ]    │  │
│   │  Country  [ United Kingdom                              ▼ ]      │  │
│   │  Postal code [                                              ]    │  │
│   └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│   ☐  I agree to Visa Master's Terms of Service and Privacy Policy       │
│                                                                         │
│   [             Save — £0 today              ]                          │
│                                                                         │
│   By saving your card, you allow Visa Master to charge £19 only if      │
│   we book a TLS slot for you. Nothing is taken today.                   │
│                                                                         │
│   Powered by Stripe         Terms · Privacy                             │
└─────────────────────────────────────────────────────────────────────────┘
```

### W-12. Activated landing page on `torly.ai/activated`

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [VM] Visa Master       How it works · Pricing · Trust · FAQ · About    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                                                                         │
│                              ✓                                          │
│                       Premium activated.                                │
│                                                                         │
│       Visa Master is now scanning your TLS tab. You can close this      │
│       tab and return to TLScontact.                                     │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  PRODUCT       UK ROUTES               COMPANY                          │
│  How it works  UK → France  ● live     About                            │
│  Pricing       UK → Germany   soon     Privacy                          │
│  Trust         UK → Belgium   soon     Terms                            │
│  FAQ           UK → Netherlands soon   contact@torly.ai                 │
│                                                                         │
│  © 2026 Torly AI Ltd. Not affiliated with TLScontact, the French        │
│  government, or any consulate.                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### W-13. Premium status panel — ACTIVE

```
┌──────────────────────────────────────────────────────────────┐
│ [VM] Visa Master                              ● ACTIVE   ✕   │
├──────────────────────────────────────────────────────────────┤
│  Status   Options   Help             [ ⚙ open Settings ]     │
│  ─────                                                       │
│                                                              │
│  ACTIVE — WATCHING FOR SLOTS                                 │
│  Manchester → France · group 26445690                        │
│                                                              │
│  [ Pause scanning ]                                          │
│  ☑  Keep device awake while monitoring                       │
│                                                              │
│  SCAN LOOP                                                   │
│  Next scan in 4m 35s                                         │
│  3 scans attempted today · 11 this week                      │
│                                                              │
│  BOOKING WINDOW                                              │
│  Accepting slots between 2026-05-13 and 2026-07-25           │
│  Include Prime Time slots: OFF                               │
│  [ Edit booking window ]                                     │
│                                                              │
│  RECENT DETECTIONS                                           │
│  • 09:42  No slots                                           │
│  • 09:36  No slots                                           │
│  • 09:30  No slots                                           │
│                                                              │
│  ───────────── Visa Master Premium · v1.1.0 ──────────────   │
└──────────────────────────────────────────────────────────────┘
```

### W-14. Auto-booking in progress (popup state)

```
┌──────────────────────────────────────────────────────────────┐
│ [VM] Visa Master                       ● BOOKING…       ✕    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ⚡  AUTO-BOOKING IN PROGRESS                                 │
│  4 Jun 2026 · 10:30 · Manchester → France                    │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ ⚠  HANDS OFF THE TLS TAB                                │  │
│  │    Visa Master is driving the booking right now.       │  │
│  │    Don't click, type, or close the TLS tab.            │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  Step 1 of 3 · Selecting slot…           ●●○ 2.1 s           │
│                                                              │
│  Budget: 60 s · Elapsed: 2.1 s                               │
└──────────────────────────────────────────────────────────────┘
```

### W-15. Booking succeeded

```
┌──────────────────────────────────────────────────────────────┐
│ [VM] Visa Master                       ● BOOKED         ✕    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  🎉  SLOT BOOKED                                             │
│  4 Jun 2026 · 10:30 · Manchester → France                    │
│  Confirmation: TLS-MAN-26445690-0042                         │
│                                                              │
│  £19 captured. Receipt emailed to you@example.com.           │
│                                                              │
│  ⏰  ONE STEP LEFT — pay TLScontact within 30 minutes        │
│      [ Open TLS payment page ]                               │
│                                                              │
│  If TLS cancels this slot within 24h, we'll refund £19.      │
│  [ Slot was cancelled by TLS ]                               │
└──────────────────────────────────────────────────────────────┘
```

### W-16. Booking failed

```
┌──────────────────────────────────────────────────────────────┐
│ [VM] Visa Master                          ● ACTIVE      ✕    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  BOOKING ATTEMPT FAILED                                      │
│  4 Jun 2026 · 10:30 — slot was taken before we could         │
│  confirm.                                                    │
│                                                              │
│  £0 charged. We're back to scanning for the next slot.       │
│                                                              │
│  Reason: TLS returned "Slot no longer available" at step 2.  │
│  Total attempt time: 7.3 s.                                  │
│                                                              │
│  [ Keep scanning ]   [ Pause ]                               │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### W-17. Refund flow (after a booked slot is cancelled by TLS)

```
┌──────────────────────────────────────────────────────────────┐
│ [VM] Visa Master                                       ✕     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  REFUND £19?                                                 │
│                                                              │
│  We charged £19 for the booking at 09:42 on 2026-05-14.      │
│  If TLScontact has cancelled or refused this slot, we'll     │
│  refund you in full and resume scanning for a new slot.      │
│                                                              │
│  Why was the slot cancelled?                                 │
│  ○  TLS released it (no reason given)                        │
│  ○  TLS asked for documents I don't have yet                 │
│  ○  Other                                                    │
│                                                              │
│  [ Request refund ]   [ Never mind ]                         │
│                                                              │
│  Refunds take 5–10 business days to appear on your card.     │
└──────────────────────────────────────────────────────────────┘
```

### W-18a. Popup "Options" tab — Premium-only

Lives inside the popup itself, so users can edit booking criteria without leaving their TLS workflow. Hidden entirely for Free users — the tab strip shows only `Status   Help` until Premium is active. There is intentionally **no** notification/language/polling-cadence config here; those live in the full-tab Settings page (W-18b) which is unchanged from the existing v1.0.9 build.

```
┌──────────────────────────────────────────────────────────────┐
│ [VM] Visa Master                              ● ACTIVE   ✕   │
├──────────────────────────────────────────────────────────────┤
│  Status   Options   Help             [ ⚙ open Settings ]     │
│           ───────                                            │
│                                                              │
│  ── TIER ──────────────────────────────────────              │
│  ● PREMIUM ACTIVE — £19 success fee on next booking          │
│  [ Cancel Premium ]   [ Manage card in Stripe ]              │
│                                                              │
│  ── BOOKING WINDOW ────────────────────────────              │
│  Travel date      [ 15/08/2026                       📅  ]   │
│  Processing days  [ 21                                   ]   │
│  Min days notice  [ 0                                    ]   │
│  We'll accept slots between 2026-05-13 and 2026-07-25.       │
│                                                              │
│  ── BOOKING PREFERENCES ───────────────────────              │
│  ☐  Include Prime Time and Premium slots                     │
│  ☑  Auto-login when TLS expires my session                   │
│  ☑  Keep device awake while monitoring                       │
│                                                              │
│  ── TLSCONTACT CREDENTIALS ────────────────────              │
│  Email      [ jasonxu20@icloud.com                       ]   │
│  Password   [ •••••••••••                           👁  ]    │
│  Stored locally, AES-GCM.                                    │
│  Encryption source: src/shared/crypto.ts                     │
│  [ Forget TLS credentials ]                                  │
│                                                              │
│  ── APPLICATION GROUP ID ──────────────────────              │
│  Group ID   [ 26445690                                   ]   │
│  The 8-digit number in your TLS URL (/26091062/).            │
│                                                              │
│  ── VISA CENTRE ───────────────────────────────              │
│  Manchester → France (gbMAN2fr)                              │
│  To change the centre, reset setup from the Status tab.      │
│                                                              │
│  For notifications, polling cadence and language,            │
│  open the full Settings page — [ ⚙ open Settings ]           │
└──────────────────────────────────────────────────────────────┘
```

**Implementation notes for the UI agent (W-18a):**
- This tab is a sibling of `Status` and `Help` in the popup's tab-strip component. Conditionally rendered based on `licenseToken.tier === 'premium'`.
- Form state is debounced and persisted to `chrome.storage.local` on edit. No "Save" button — every field is auto-saved.
- `[ ⚙ open Settings ]` in the header opens `chrome.runtime.openOptionsPage()` in a new tab — same affordance Free users see in their popup footer.

### W-18b. Full Settings page (`settings.html`, unchanged surface, with Premium status card)

This is the existing full-tab `options_page` registered in `manifest.json`. **It is identical to the v1.0.9 Settings page for Free users** — only Premium adds the "Tier status" card at the top. Notification/polling/language config lives here, not in W-18a.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  [VM] Visa Master — Settings                                       ✕     │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ── TIER STATUS ── (Premium users only; hidden for Free) ────            │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  ● PREMIUM ACTIVE — £19 success fee on next booking                │  │
│  │  Activated 2026-05-13. Card ending 4242 on file via Stripe.        │  │
│  │  For booking window + TLS credentials, open the popup → Options.   │  │
│  │  [ Manage card in Stripe ]   [ Cancel Premium ]                    │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ── NOTIFICATIONS ─────────────────────────────────                      │
│  ☑  Desktop notifications                                                │
│  ☑  Sound on slot-found                                                  │
│  ☑  Telegram bot — Bot token [ •••••••• ]   Chat ID [        ]           │
│      [ Send test message ]                                               │
│  ☑  Email notifications  — Stripe email: you@example.com                 │
│     (Premium only; Free users see this row disabled.)                    │
│                                                                          │
│  ── POLLING CADENCE ───────────────────────────────                      │
│  ●  Smart  — 2 min inside release windows, 6 min outside                 │
│  ○  Aggressive — every 2 min always                                      │
│  ○  Conservative — every 10 min always                                   │
│                                                                          │
│  Release windows (UK local)                                              │
│  Window 1: [ 06:00 ] – [ 09:30 ]                                         │
│  Window 2: [ 23:30 ] – [ 00:30 ]                                         │
│  [ + Add window ]                                                        │
│                                                                          │
│  ── LANGUAGE ──────────────────────────────────────                      │
│  ●  English      ○  中文 (Simplified)                                    │
│                                                                          │
│  ── DETECTION TUNING (advanced) ──────────────────                       │
│  ☑  Multi-month cycling — probe April, May, June automatically           │
│  Manual classification prompt: [ Always · Once · Never ]                 │
│                                                                          │
│  ── ABOUT ─────────────────────────────────────────                      │
│  Visa Master v1.1.0 · MIT · github.com/torlyai/Schengen-master           │
│  [ Check for updates ]   [ View changelog ]                              │
│                                                                          │
│  ── DEBUG ─────────────────────────────────────────                      │
│  [ Export logs ]   [ Reset state ]                                       │
│  Install ID: 35dee5ee-34cc-46d5-a1fb-17a9fb8370fd  [ copy ]              │
│                                                                          │
│  ── DANGER ZONE (Premium only) ────────────────────                      │
│  [ Delete my account ] — wipes server records + cancels Premium          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Implementation notes for the UI agent (W-18b):**
- This is the **existing** `src/settings/settings.html` page. Premium adds ONE thing at the top: the "Tier status" card. Everything below it already exists in v1.0.9.
- The "Email notifications" row is disabled for Free users (no Stripe email captured).
- The "Danger zone" row is only rendered when `tier === 'premium'`.
- Critical: do **not** duplicate booking-window or credential fields here. Those live exclusively in W-18a. One source of truth per setting.

### W-19. Help tab with debug bundle and install ID

```
┌──────────────────────────────────────────────────────────────┐
│ [VM] Visa Master                              ● ACTIVE   ✕   │
├──────────────────────────────────────────────────────────────┤
│  Status   Options   Help             [ ⚙ open Settings ]     │
│  ─────                                                       │
│                                                              │
│  KEEP VISA MASTER SCANNING                                   │
│  • Leave the pinned TLS tab alone.                           │
│  • Keep the laptop plugged in.                               │
│  • Don't close the browser window with the pinned tab.       │
│                                                              │
│  NEED HELP?                                                  │
│  Tell us what's wrong. We typically reply within 24 hours    │
│  on weekdays.                                                │
│                                                              │
│  [                                                       ]   │
│  [                                                       ]   │
│  [                                                       ]   │
│                                                              │
│  ☑  Attach debug info  (page URL, recent logs, state)        │
│  ☐  Include a screenshot of the active tab                   │
│                                                              │
│  Stored on our private servers; auto-deleted after 90 days.  │
│                                                              │
│  [ Send ]                                                    │
│                                                              │
│  Install: 35dee5ee-34cc-46d5-a1fb-17a9fb8370fd  [ copy ]     │
└──────────────────────────────────────────────────────────────┘
```

---

## 16. Non-Functional Requirements

| NFR | Target |
|---|---|
| End-to-end booking latency (`SLOT_AVAILABLE` → `BOOKING_OK`) | p50 < 6 s, p95 < 12 s |
| License activation latency (Stripe success → `VERIFIED`) | p50 < 30 s, p95 < 60 s |
| Stripe webhook → license revalidation | < 2 min |
| Extension cold-start (SW boot → ready) | p50 < 800 ms |
| Backend uptime | 99.5% (1 outage of < 1h per quarter acceptable) |
| Extension memory footprint | < 30 MB resident |
| Extension package size | < 500 KiB (versus competitors' 173 KiB thin clients; we're heavier because we don't have a server doing the work) |
| Auto-login false positive rate | < 1% of session-active states misclassified as logged-out |

---

## 17. Risks, Mitigations, and Open Questions

### 17.1 Risks

| Risk | Severity | Mitigation |
|---|---|---|
| TLScontact identifies and blocks the booking automation | High | Single-applicant cadence; 60s timeout; user-driven session (we don't login at scale); honest disclosure on intro screen |
| User's machine sleeps and we miss the slot | Medium | "Keep device awake" toggle + clear in-app messaging |
| User's TLS session expires mid-scan, auto-login fails 3x | Medium | UI prompt asks for re-entry; fall back to Free-mode notification |
| Stripe Setup Intent succeeds but license API fails | Medium | Idempotent endpoint; "Recheck payment status" button on activation screen |
| Booking succeeds but capture call fails (network drop) | Medium | Background retry queue with exponential backoff; in-extension banner shows "Booking captured locally; syncing with billing" |
| User charges back £19 because they "didn't realise it would charge" | Medium | Triple disclosure: intro screen, Stripe Checkout, post-booking email; signed Terms acceptance at activation |
| Open-source code → competitors clone and undercut | Low | Brand + bilingual community + audit trail > raw code; the moat is trust, not algorithms |
| Refund volume exceeds projection | Medium | Cap automatic refunds at 1 per 30 days per install; require support ticket beyond that |
| TLScontact sends a cease-and-desist | Medium-High | Pre-cleared disclosure language; willingness to switch to "alert only" overnight; Free tier remains untouched as a fallback product |

### 17.2 Resolutions (locked 2026-05-13)

The six open questions have been resolved. Each row below is committed for v1.0 and changes require a PRD amendment.

| # | Question | Decision | Notes |
|---|---|---|---|
| Q1 | Currency on day 1 | **GBP only** | Stripe UK; non-UK cards convert at card-issuer rate. Multi-currency revisited when EUR/USD routes launch. |
| Q2 | TLS account lock policy | **Pause Premium, no automatic refund** | A TLS account lock is not a voided slot. If no booking yet → no charge, no refund needed. If booking already captured → fee stands; user can seek support for edge cases. |
| Q3 | Price display | **Always £19 everywhere — no localisation** | One price string on intro tab, Stripe Checkout, Settings, Options, comparison page. Stripe handles card-side currency conversion automatically. |
| Q4 | Refund logic | **Three-event model — see §6.1** | (a) No slot found → no charge. (b) User cancels before booking → no charge. (c) Booking confirmed → £19. (d) TLS voids within 24h of confirmation → automatic refund. After 24h, slot is the user's and fee stands. |
| Q5 | Premium notification priority | **Same latency as Free in v1** | Single shared Telegram bot. Premium's value is auto-booking, not faster alerts. Revisit only if data shows notification latency is the bottleneck. |
| Q6 | Reinstall license transfer | **Auto-rebind by Stripe email** | User reinstalls → enters Stripe email in setup → backend rebinds license to new `installId`. Only one active install per email at a time; activating a new install deactivates the old one. |

These decisions shape several downstream artefacts:
- The pricing FAQ in §6.6 is the **only** approved marketing copy. Chrome Web Store description, intro tab, comparison page must all use these phrasings verbatim.
- The "Cancel Premium" button in W-18a / W-18b is now in-scope for M3 (setup wizard milestone), not M5.
- The reinstall flow (Q6) needs a backend endpoint `POST /license/rebind` taking `{stripeEmail, newInstallId}` — added to §10 endpoint list as a follow-up edit.

---

## 18. Roadmap and Milestones

| Milestone | Target date | Deliverable |
|---|---|---|
| **M1.** Backend skeleton | 2026-05-20 | `api.torly.ai` deployed with 4 endpoints, Stripe sandbox, JWT signing |
| **M2.** Premium feature flag in extension | 2026-05-27 | Tier detection working; Free unchanged; "Upgrade" CTA wired to W-2 |
| **M3.** Setup wizard W-3 → W-10 | 2026-06-03 | Steps 1–4 functional; credential encryption live; license JWT consumed |
| **M4.** Auto-booking FSM | 2026-06-10 | Content script booking flow against Manchester → France; W-13–W-16 functional |
| **M5.** Refund flow | 2026-06-17 | W-17 wired to Stripe Refunds; backend webhook handlers |
| **M6.** Bilingual EN/中文 audit | 2026-06-24 | All Premium screens translated; trust-promise restatement reviewed by a native zh-CN reviewer |
| **M7.** Closed beta (50 users) | 2026-07-01 | Invite-only; £19 → £1 for beta; metrics dashboard live |
| **M8.** Public launch | 2026-07-15 | Chrome Web Store listing updated; landing page on torly.ai; comparison page published |

---

## 19. Appendix A — Reference: VisaReady Flow Analysis

This appendix records what the VisaReady extension does, screen by screen, so future contributors can trace which patterns we adopted, adapted, or rejected. Captured 2026-05-13 from the install-id welcome flow at `visaready.ai/welcome?install_id=…`.

### A.1 VisaReady screens observed

| # | VisaReady screen | What it does | Our equivalent |
|---|---|---|---|
| 1 | Setup popup with visa centre dropdown + TLS email/password + "Stored on your machine — never uploaded" disclosure | Captures credentials at install | W-4 (we adopted the disclosure language; localised it to "AES-GCM" specifics) |
| 2 | Settings tab (popup) with travel date, processing days (default 21), min notice (default 0), Prime Time toggle, TLS credentials, group ID readout | Configuration surface | W-9 + W-18a (we adopted the booking window concept verbatim but renamed the popup tab from "Settings" to "Options" — Visa Master already has a separate full-tab Settings page from v1.0.9 and we wanted no naming collision. The "Default 21" reasoning copy is unusually well-written and we mirrored it.) |
| 3 | Help tab with debug-info checkbox, screenshot checkbox, support text area, install-id copy field | Support channel | W-19 (we adopted the install-id pattern; debug bundle goes to a Torly-hosted endpoint instead) |
| 4 | "Quick check needed — TLSContact is showing a verification gate, wait 20–30s then tap Continue" | Cloudflare/JS-challenge handler | W-5 (we re-used this language; it's the right user-facing description of a Cloudflare interstitial) |
| 5 | "Setup · Step 2 of 4 — Signing you in to TLSContact" with "HANDS OFF THE TLS TAB" warning | Auto-login progress | W-6 (we mirrored the "hands off" warning; this is excellent UX for a flow where one stray click breaks the state) |
| 6 | "Setup couldn't finish — first-pass sign-in failed, try again or start over" | Auto-login retry | W-7 (one of two failure variants we cover) |
| 7 | "Setup couldn't finish — another user signed in, manually log them out" | Cached-session collision | W-8 (the other failure variant) |
| 8 | "Before you start — pin this tab, keep laptop plugged in" | Pre-flight checklist | W-3 (we mirrored both items; the "macOS sleeps when you close the lid" line is good copy) |
| 9 | "Ready to activate" panel — group ID readout, "£0 now — £29 only if we book", "23 slots secured in the last 7 days", "Activate" button | Stripe Setup Intent trigger | W-10 (we mirrored the structure; replaced £29 with £19; we'll only show "X slots secured" once we have honest data; the comparison phrase "other auto-booking services charge £60–150 upfront" is misleading puff — we replaced with concrete competitor names) |
| 10 | Stripe-hosted Checkout — email, card, country, postal, "save my information for faster checkout", ToS checkbox | Stripe Checkout | W-11 (Stripe-hosted; we control the post-success redirect to `torly.ai/activated`) |
| 11 | `/activated` page on visaready.ai — "VisaReady is now scanning. You can close this tab" + nav (How it works / Pricing / Trust & safety / FAQ / About) + UK routes footer | Activation success landing | W-12 (we mirrored the structure; UK routes block is honest about "live vs soon") |
| 12 | Active status panel — "ACTIVE — Watching for slots", "Manchester → France · group 26445690", Pause button, "Keep device awake" toggle, scan-loop counter, "External slot notifications: receiving slot alerts from the network", booking window prompt, recent detections list | Steady-state UI | W-13 (we mirrored most of it but **omitted** the "receiving slot alerts from the network" line — that's the server-coordinated scanning feature, which we deliberately don't have. Removing this line is the load-bearing UX difference between us and them) |

### A.2 What we explicitly did not copy

- **"Receiving slot alerts from the network"** — VisaReady's status panel claims your browser receives alerts from other users' scans. That's the coordinated-network feature; we don't have it and don't want it.
- **"23 slots secured in the last 7 days"** — possibly true, possibly puff. We won't show this number until we have at least 90 days of honest telemetry and a clear definition (booked AND TLS-confirmed AND not refunded).
- **The "£60–150 upfront" comparison** — vague and misleading. Our equivalent line names specific competitors with sourced numbers.
- **A separate marketing site at a new domain** — we activate on `torly.ai/activated`, not a new domain. One brand, one trust surface.

### A.3 What we adopted

- Default values: `processingDays = 21`, `minDaysNotice = 0`, `includePrimeTime = OFF`. These match real applicant behaviour.
- The "HANDS OFF THE TLS TAB" UX pattern during automation. It's the right call for any flow where a stray click breaks state.
- The four-step setup wizard structure. Splits cognitive load well.
- The verification-gate "Quick check needed" copy. Honest about Cloudflare without scaring users.
- The install-id copy-paste field in Help. Critical for support without requiring an account.

---

**End of document.**
