# PRD: Visa Master — Notifications & Email System

**Document:** `14-notifications-and-email-prd.md`
**Version:** 0.2 (Decisions locked from §18 review on 2026-05-14)
**Date:** 2026-05-14
**Owner:** Duke Harewood (Torly AI)
**Decision changelog (v0.1 → v0.2):**
- Q1 → Hybrid defaults (booking ON, license/auth-issues OFF) — §10.2
- Q2 → Add `vm_welcome` email at activation — §7.0 (new)
- Q3 → Booking subject = "Date + Centre" — §7.1, Appendix B
- Q4 → `auto_login_disabled` fires only on cooldown exhaustion — §7.8 (was 7.7)
- Q5 → **BYO Webhook moved from non-goal to in-scope v1** — §5.2, §7.9 (new), §10.2
- Q6 → SMS reclassified from non-goal to "coming soon" — §3.2, §17 roadmap
- Q7 → DSR endpoint stays out-of-scope, separate PRD — §3.2
- Q8 → Refund email = deep-link only, no one-click — §7.4 (unchanged from v0.1)
- Q9 → ZH-CN ships in EN parity for **all** templates at launch — §15
- Brand: Email layout uses **ApertureMark** icon (Visa Master glyph), not the TorlyAI logo — §8.6 (new), Appendix B
**Related docs:**
- `06-visa-master-chrome-extension-prd.md` — Free tier PRD
- `07-chrome-extension-wireframes.md` — Free tier wireframes
- `09-visa-master-premium-prd.md` — Premium tier PRD
- `10-visa-master-premium-wireframes.md` — Premium wireframes
- `11-architecture.md` — System architecture (read first)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Why Now — Current Coverage Gaps](#2-why-now--current-coverage-gaps)
3. [Goals, Non-Goals, Success Metrics](#3-goals-non-goals-success-metrics)
4. [Trust Boundary — Free vs Premium for Notifications](#4-trust-boundary--free-vs-premium-for-notifications)
5. [Channels Inventory](#5-channels-inventory)
6. [Event Catalogue & Coverage Matrix](#6-event-catalogue--coverage-matrix)
7. [Email System — Use Cases & Templates](#7-email-system--use-cases--templates)
8. [Resend Integration — Architecture](#8-resend-integration--architecture)
9. [Secrets — Keychain Strategy](#9-secrets--keychain-strategy)
10. [User Preferences — Settings Schema](#10-user-preferences--settings-schema)
11. [Suppression, Dedupe & Rate Limits](#11-suppression-dedupe--rate-limits)
12. [Idempotency & Retry Strategy](#12-idempotency--retry-strategy)
13. [Observability — Tracking & Dashboards](#13-observability--tracking--dashboards)
14. [Privacy, Security & Compliance](#14-privacy-security--compliance)
15. [Internationalisation](#15-internationalisation)
16. [Best Practices Adopted](#16-best-practices-adopted)
17. [Roadmap & Milestones](#17-roadmap--milestones)
18. [Open Questions](#18-open-questions)
19. [Appendix A — Cross-Repo File Map](#19-appendix-a--cross-repo-file-map)
20. [Appendix B — Email Body Drafts](#20-appendix-b--email-body-drafts)

---

## 1. Executive Summary

Visa Master ships Telegram + desktop notifications today. This PRD extends notifications to cover **every meaningful state transition** (closing today's gaps for `UNKNOWN`, `WRONG_PAGE`, `PREMIUM_BOOKING_IN_PROGRESS`, `PREMIUM_REFUND_PROMPT`, license deactivation, auto-login failure, blocker auto-stop) and introduces **Email as a third channel for Premium users** by reusing the Resend infrastructure already in the torlyAI Next.js app.

**Key decisions locked in this draft:**

- **Email is Premium-only in v1.** Free remains "local + optional Telegram". Adding Resend (a torly.ai-hosted service) to the Free path would break the load-bearing trust promise in `CLAUDE.md` §"Free vs Premium — the trust boundary".
- **Telegram coverage gaps are filled for both tiers.** Where the gap is a Premium-only state (e.g. booking-in-progress), only Premium settings unlock the ping.
- **Email reuses `lib/email/send.ts`, `templates.ts`, `tracking.ts`, and `/api/resend/webhook`** from torlyAI verbatim. Three new exports in `lib/email/templates.ts`, ~5 new `EmailType` enum values, one new backend route `/api/visa-master/notify/email`. No new Resend account, no new sender domain.
- **Booking-confirmation email is the headline use case.** It doubles as the receipt of the £19 charge (Stripe's own receipt is generic; ours ties the £19 to the actual TLS slot details).
- **Credentials move to macOS Keychain for development.** Production keeps Vercel env vars. The current `.env.local`-only setup is a flagged gap (see §9).

---

## 2. Why Now — Current Coverage Gaps

A line-by-line audit of `src/background/state-machine.ts`, `src/background/booking-fsm.ts`, and `src/background/telegram.ts` against the `ExtState` union in `src/shared/states.ts` surfaces the following gaps. **The PRD treats each as a backlog item; §17 sequences them.**

### 2.1 Free-tier gaps

| State / event | Desktop today | Telegram today | Severity | What the user loses |
|---|---|---|---|---|
| `UNKNOWN` | popup only | — | Medium | User away from laptop can't classify; the page stays "unknown" indefinitely and polling is suspended for that case. |
| `WRONG_PAGE` (new in 1.0.10) | popup only | — | Low | The user is logged in but on a non-booking sub-page; if they leave the laptop, they never know to navigate. |
| `AUTO_STOP` after 15 min CLOUDFLARE / LOGGED_OUT (`onAutoStopTick` → IDLE) | — | — | **High** | Silent: user thinks monitoring is running when it isn't. The current Telegram blocker ping (gated on `telegramAlsoBlockers`) tells them the blocker started; nothing tells them the watchdog gave up. |
| `UPDATE_AVAILABLE` from `update-checker.ts` | popup only | — | Low | Users on stale builds may keep seeing fixed bugs. |
| Daily summary (e.g. "we checked 240 times today, 0 slots") | — | — | Low | Engagement / reassurance signal; not critical. |

### 2.2 Premium-tier gaps

| State / event | Desktop today | Telegram today | Severity | What the user loses |
|---|---|---|---|---|
| `PREMIUM_ACTIVE` rising-edge (monitoring resumed) | — | — | **High** | The current `notifyMonitoringStart` only fires on `next === 'NO_SLOTS'`. Premium users who pause and resume get no "we're back to scanning" ping. |
| `PREMIUM_BOOKING_IN_PROGRESS` | — | — | **High** | A 60-second booking attempt is happening; the user has no idea. If they're checking their phone, they'd want the "we're attempting to book now" heads-up — especially because it precedes a £19 charge. |
| `PREMIUM_REFUND_PROMPT` (P-16) | — | — | **High** | TLS voided the slot inside 24h; we need user action / acknowledgement for the refund. |
| Auto-login failure (cooldown / fail-count exceeded in `tls-auto-login.ts`) | — | — | **High** | Silent: Premium user thinks auto-login is working; in reality we've stopped attempting after N failures. Free-style "log back in" prompt fires; Premium user doesn't know auto-login itself was disabled. |
| License about to expire (≤ 7 days remaining) | — | — | Medium | Cliff-edge UX risk. |
| License deactivated by rebind on another install (`/license/status` returns `inactive`) | — | — | **High** | User's tier reverts to Free silently; their next slot fires only desktop + Telegram. |
| Booking captured but Stripe webhook → torly.ai failed | — | — | Medium | Internal observability hole — admin side, not user side, but worth surfacing. |

### 2.3 Channel gaps (no email anywhere)

All seven Premium events that **should** also email — booking-confirmed, booking-failed, refund-issued, refund-prompt, license-expiring, license-deactivated, payment-failed — currently rely on Stripe's generic receipt or no email at all. §7 fills this.

---

## 3. Goals, Non-Goals, Success Metrics

### 3.1 Goals

- **G1.** Every state in `ExtState` has a documented notification policy (desktop / sound / tab title / Telegram / email), even if the policy is "none — popup only".
- **G2.** Add Email as a Premium-only channel for transactional events (booking confirmed, booking failed, refund issued, refund prompt, license events).
- **G3.** Reuse 100% of the torlyAI Resend stack (no new SDKs, no new sender domain, no new tracking pipeline).
- **G4.** Preserve the Free-tier trust promise byte-for-byte: no `fetch()` to `torly.ai` from the Free code path, ever.
- **G5.** Deliver a booking-confirmed email **within 30 seconds** of `BOOKING_CONFIRMED` message receipt (matches user's expected "did it work?" check-time).
- **G6.** All notification channels for one event fire in parallel, never serially. One channel failing must not block the others.

### 3.2 Non-Goals

- **NG1.** Marketing emails. This PRD covers transactional only. The Resend `default` sender profile is reused; **no addition to any newsletter audience**.
- **NG2.** Free-tier email via Resend. Free tier stays local + optional Telegram + **optional user-supplied webhook** (§7.9). We do not host a relay for Free users on `torly.ai`.
- **NG3.** In-extension inbox / notification centre. The popup already shows current state; a separate inbox is overkill.
- **NG4.** Push notifications via `chrome.gcm` / web push. MV3 service worker is ephemeral; chrome.notifications already covers this.
- **NG5.** GDPR Data Subject Request endpoint. Covered by a separate privacy/compliance PRD (Q7 resolution).

### 3.3 Coming soon (post-v1)

- **CS1.** SMS via Twilio for booking events. Reclassified from non-goal to a tracked future channel (Q6 resolution). Likely as a paid add-on (+£2/booking) so the recurring cost is covered. Not built in v1.

### 3.4 Success Metrics

| Metric | Target |
|---|---|
| `BOOKING_CONFIRMED` → email delivered (Resend `delivered` webhook) | ≥ 98% within 30 s |
| `BOOKING_CONFIRMED` → email opened (Resend `opened` webhook) | ≥ 70% within 24 h |
| Telegram blocker ping latency from rising edge | ≤ 5 s p95 |
| User-reported "I didn't know X happened" tickets / 100 bookings | < 1 |
| % of Premium users who enable email notifications | ≥ 80% (default ON) |
| % of users who enable Telegram | ≥ 30% (default OFF) |
| Bounce + complaint rate on transactional email | ≤ 0.5% |
| Coverage: # of ExtState variants with documented policy | 100% |

---

## 4. Trust Boundary — Free vs Premium for Notifications

This section is normative. Every reviewer of a future PR that touches `src/background/*` should re-read it.

| What the channel does | Free | Premium |
|---|---|---|
| Desktop notification (`chrome.notifications`) | ✓ local | ✓ local |
| Sound (chrome.notifications `silent: false`) | ✓ local | ✓ local |
| Tab title flash | ✓ local | ✓ local |
| Telegram (user supplies bot + chat id; SW POSTs to api.telegram.org) | ✓ opt-in | ✓ opt-in |
| **Email via Resend at torly.ai** | ✗ **forbidden** | ✓ opt-in (default ON) |
| Backend webhooks (Resend → torly.ai → Supabase) | — | server-side only; install never sees these |

**Rules for engineers:**

- ✅ The Free path imports nothing from `src/background/email.ts` (file to be added).
- ✅ Every email send is gated by `await getLicense()` returning `tier === 'premium'`.
- ✅ Email helpers live inside an `if (license?.tier === 'premium')` block at the call site, never inside `state-machine.ts`'s shared rising-edge logic.
- ✅ The build's CI gate (or a simple grep test) rejects any commit where `email.ts` is imported from a Free-only path.
- ✅ The welcome page i18n strings (`welcome.no.2`, `welcome.no.4`) keep their "Free never touches credentials / never makes network calls outside the TLS tab + optional Telegram" wording. We may add a **Premium addendum** under each, never widen the Free promise.

---

## 5. Channels Inventory

### 5.1 Existing channels (already shipping in v1.0.9)

| Channel | File | Tier | User-toggle | Default |
|---|---|---|---|---|
| Desktop (`chrome.notifications`) | `src/background/notifications.ts` | Both | `settings.notifDesktop` | ON |
| Sound | same | Both | `settings.notifSound` | ON |
| Tab title flash | `src/content/content-script.ts` | Both | `settings.notifTabTitle` | ON |
| Auto-focus watched tab on slot-found | same | Both | `settings.notifAutoFocus` | OFF |
| Telegram message | `src/background/telegram.ts` | Both | `settings.telegramEnabled` + sub-toggles | OFF |
| Toolbar badge | `src/background/badge.ts` | Both | — (always on) | — |

### 5.2 New channels (this PRD)

| Channel | New file | Tier | User-toggle | Default | Rationale |
|---|---|---|---|---|---|
| **Email (Resend)** | `src/background/email.ts` + `/api/visa-master/notify/email` | Premium | `settings.emailEnabled`, per-event sub-toggles | **Booking lifecycle: ON · License + auth events: OFF · Welcome: ON-once** (Q1) | Backing the £19 promise with a written receipt + asynchronous channel for users not at the laptop. |
| **Generic webhook (BYO URL)** | `src/background/webhook.ts` | **Both** (Free + Premium) | `settings.webhookEnabled`, `settings.webhookUrl` | OFF | Privacy-preserving phone/desktop bridge for Free users who don't want Telegram. Premium users can also use it for Slack/Discord channel routing. Q5 resolution: in-scope v1. |

### 5.3 Channels considered and rejected (or coming later)

| Channel | Decision |
|---|---|
| SMS (Twilio) | **Coming soon (CS1).** Likely a paid add-on. Tracked in roadmap, not built in v1. |
| WhatsApp / Signal | Rejected. WhatsApp Business API requires templates approval; Signal has no bot API. |
| Browser push (FCM) | Rejected. Adds a server-side trigger requirement that violates Free trust boundary; Chrome push UX is poor on desktop. |
| In-extension popup banner | Rejected. Popup is already the in-product surface. |
| RSS feed | Rejected. Niche; nobody asked for it. |

---

## 6. Event Catalogue & Coverage Matrix

The canonical table. Every `ExtState` and every cross-state event maps to a row. Empty cells = "no notification, intentional".

Legend: `✓` = fires today, `+` = added by this PRD, `−` = explicitly never fires (policy), `(T)` = telegram-toggle-gated, `(E)` = email-toggle-gated, `(B)` = blocker sub-toggle, `(W)` = webhook-toggle-gated.

| # | Event / state rising-edge | Desktop | Sound | Tab title | Telegram | Email | Webhook | Tier |
|---|---|---|---|---|---|---|---|---|
| 0 | Premium activation (welcome) | − | − | − | − | + (one-shot, default ON) | + (W) | Premium |
| 1 | `IDLE` | − | − | − | − | − | − | Both |
| 2 | `NO_SLOTS` (monitoring started) | − | − | − | ✓ (T) | − | + (W, opt) | Both |
| 3 | `NO_SLOTS` (monitoring resumed from PAUSED / blocker) | − | − | − | ✓ (T) | − | + (W, opt) | Both |
| 4 | `SLOT_AVAILABLE` | ✓ | ✓ | ✓ | ✓ | + (booking-lifecycle, default ON, Premium) | + (W) | Free + Premium (email Premium-only) |
| 5 | `CLOUDFLARE` | ✓ | − | ✓ | ✓ (B) | − | + (W, opt) | Both |
| 6 | `LOGGED_OUT` (Free path) | ✓ | − | ✓ | ✓ (B) | − | + (W, opt) | Free |
| 7 | `LOGGED_OUT` (Premium auto-login succeeds — silent) | − | − | − | − | − | − | Premium |
| 8 | `LOGGED_OUT` (Premium auto-login fails / cooldown exhausted) | ✓ | − | ✓ | + (B) | + (auth-issues, default OFF) | + (W) | Premium |
| 9 | `UNKNOWN` (need user classification) | + | − | + | + (T) | − | + (W, opt) | Both |
| 10 | `WRONG_PAGE` (logged in but wrong sub-page) | − | − | − | + (T, opt-in) | − | + (W, opt) | Both |
| 11 | `PAUSED` (user clicked Pause) | − | − | − | ✓ (T) | − | + (W, opt) | Both |
| 12 | `AUTO_STOP` (15 min blocker timeout → IDLE) | + | − | + | + | − | + (W) | Both |
| 13 | `UPDATE_AVAILABLE` | + (low priority) | − | − | − | − | − | Both |
| 14 | Daily summary (24h roll-up) | − | − | − | + (T, opt-in) | − | + (W, opt) | Both |
| 15 | `PREMIUM_PREFLIGHT` → `PREMIUM_SETUP_READY` (wizard steps) | − | − | − | − | − | − | Premium (laptop only) |
| 16 | `PREMIUM_SETUP_FAILED_*` | − | − | − | − | + (auth-issues, default OFF) | + (W) | Premium |
| 17 | `PREMIUM_VERIFICATION_GATE` (CAPTCHA hit during setup) | − | − | − | − | − | − | Premium (laptop only) |
| 18 | `PREMIUM_ACTIVE` (rising edge — Premium "monitoring resumed") | − | − | − | + (T) | − | + (W, opt) | Premium |
| 19 | `PREMIUM_BOOKING_IN_PROGRESS` | + (low priority) | − | + ("booking…") | + | − | + (W) | Premium |
| 20 | `PREMIUM_BOOKED` | ✓ | ✓ | ✓ | ✓ | + (booking-lifecycle, default ON) | + (W) | Premium |
| 21 | `PREMIUM_BOOKING_FAILED` | ✓ | − | ✓ | ✓ | + (booking-lifecycle, default ON) | + (W) | Premium |
| 22 | `PREMIUM_REFUND_PROMPT` (P-16) | + | + | + | + | + (booking-lifecycle, default ON) | + (W) | Premium |
| 23 | Refund issued | − | − | − | ✓ | + (booking-lifecycle, default ON) | + (W) | Premium |
| 24 | License expiring in ≤ 7 days | − | − | − | + (T) | + (license, default OFF) | + (W) | Premium |
| 25 | License deactivated (rebind on another install) | + | − | + | + (T) | + (license, default OFF) | + (W) | Premium |
| 26 | Stripe webhook error / payment-failed (back-office only) | − | − | − | − | + (admin alert) | − | Premium (server) |

**How to read the change set vs today:** rows 0, 4, 8, 16, 20–25 carry the new `+ (E)` markers (eight email events including welcome). The Webhook column is entirely new from this PRD (Q5 resolution). Telegram gap-fills sit on rows 9, 10, 12, 18, 19 plus all premium rows ≥ 22.

---

## 7. Email System — Use Cases & Templates

Premium events that warrant email, ranked by user value.

### 7.0 Welcome to Premium (`vm_welcome`) — new in v0.2

- **Trigger:** `/api/visa-master/license/activate` after successful Stripe payment, **once** per Stripe customer (re-binds to a new install do not re-fire — Q2 resolution).
- **Recipient:** Stripe customer email.
- **Subject:** `Welcome to Visa Master Premium — you're all set`
- **Body sections:**
  - Hero with the **ApertureMark icon** (§8.6) — establishes brand at the first touch.
  - Brief: "Auto-book is now active. We'll book the first slot that fits your travel window and only charge £19 if we succeed."
  - Three-step what-to-expect: 1) Set your travel date in popup. 2) We scan. 3) On a match we book + email you within 30 seconds.
  - Trust restatement: "We never store your TLS password on our servers — it lives encrypted inside your browser only."
  - Single CTA: "Open Visa Master" deep-link to the popup.
- **Length:** short — 4 short paragraphs max. Hard rule: no upsell, no Innovator-Founder cross-promo.
- **Channel duplication:** Stripe's automatic receipt covers the financial event; this email covers the operational onboarding. They serve different needs and the user expects both.
- **Idempotency key:** `licenseId:welcome` — never re-sends even if activation is replayed.

### 7.1 Booking confirmed (`vm_booking_confirmed`)

- **Trigger:** `handleBookingConfirmed()` in `booking-fsm.ts` after `captureBooking()` succeeds.
- **Recipient:** Stripe customer email (already on file from license activation).
- **Subject (Q3 resolution):** `✅ TLS slot booked — {Centre}, {Date}` — e.g. `✅ TLS slot booked — London, 4 June`. Centre is included for maximum clarity at the inbox/preview level.
- **Body sections:**
  - Brand header with **ApertureMark icon** (§8.6).
  - Hero: "Your TLS appointment is booked." with the slot date/time prominent.
  - Detail table: Centre, Subject code, Country, Slot date/time, Booking reference, Amount charged (£19), Charge time, Payment method (last 4).
  - **Critical action:** "One step left — pay TLS's visa fee within 30 minutes on TLScontact." Linked back to the user's TLS tab via a deep-link button.
  - Refund window: "If TLS voids this slot within 24 hours, we automatically refund the £19. You don't need to do anything."
  - Footer: Trust boundary one-liner: "We never store your TLS password on our servers."
- **Channel duplication:** Fires in parallel with the existing Telegram `notifyBookingConfirmed`. Idempotency key: `bookingId` (so a re-fire from a retry never sends twice).

### 7.2 Booking attempt failed (`booking_failed`)

- **Trigger:** `handleBookingTimeout()` (60s budget) or capture failure path.
- **Recipient:** Stripe customer email.
- **Subject:** `❌ Slot attempt failed — back to scanning`
- **Body:**
  - "We saw a slot at {Centre} but couldn't lock it in time. **£0 charged**."
  - Reason: timeout / slot taken / TLS markup unexpected.
  - "We're back to scanning. The next slot triggers another attempt — no further action from you."
  - Soft re-engagement: link to "Adjust booking window in popup" if the user has been pickier than necessary.
- **Idempotency key:** `${installId}-${startedAt}`.

### 7.3 Refund issued (`refund_issued`)

- **Trigger:** `refundActiveBooking()` returns `ok: true`, OR backend auto-refunds via `/api/visa-master/booking/auto-refund` (TLS-voided slot detected by backend within 24h).
- **Subject:** `💰 Refund issued — £19`
- **Body:** Refund amount, original booking reference, "Appears on your card in 5–10 business days", "We've resumed scanning automatically."
- **Idempotency key:** `refundId` from Stripe.

### 7.4 Refund prompt (`refund_prompt`)

- **Trigger:** Backend detects TLS voided the slot inside the 24h refund window AND the user hasn't already acted on it. (Alternatively the user clicks "I need a refund" in the popup P-16.)
- **Subject:** `Action needed — your TLS slot was voided`
- **Body:**
  - Empathy: "TLS cancelled your appointment. This happens occasionally — usually a centre rescheduling."
  - Clear action: "Click below to request your £19 refund. The refund window closes in {hours} hours."
  - CTA button: deep-link back into the popup `PREMIUM_REFUND_PROMPT` view (via `chrome-extension://{id}/popup.html?action=refund` — extension handles the route).
- **Idempotency key:** `bookingId`.

### 7.5 License expiring (`license_expiring`)

- **Trigger:** Backend cron `/api/cron/visa-master-license-watch` finds licenses with `expires_at` ≤ now + 7 days that aren't already pinged.
- **Subject:** `Your Visa Master Premium expires in {N} days`
- **Body:** Plain, no upsell pressure. "You don't need to renew unless you want auto-book to keep running."
- **Idempotency key:** `licenseId:warning:{daysRemaining}`.

### 7.6 License deactivated (`license_deactivated`)

- **Trigger:** `/api/visa-master/license/rebind` deactivates a prior install. The deactivated install's email gets a notification.
- **Subject:** `Visa Master Premium moved to your new browser`
- **Body:** "Your Premium is now active on a different install. The old browser drops to Free." Reassurance that no charge happened.
- **Idempotency key:** `installId:deactivated`.

### 7.8 Auto-login failure cool-down (`vm_auto_login_disabled`)

- **Trigger (Q4 resolution):** Only when `tls-auto-login.ts` has exhausted its cooldown + fail-count budget — not on the first or second transient failure. TLS occasionally returns 503s that recover on the next attempt; pinging on each one would cry wolf and train users to ignore the alert.
- **Subject:** `Auto-login paused — please re-enter your TLS password`
- **Body:** "Your TLS credentials may have changed. Auto-login is paused until you re-enter them. We'll keep monitoring for slots, but if you get logged out, you'll need to log in yourself." Deep-link to popup `PREMIUM_OPTIONS` credentials section.
- **Default:** OFF (auth-issues category). User opts in to receive these — they're a "yellow light" event, not a "red light".
- **Idempotency key:** `installId:auto-login-disabled:{date}` (one per day max).

### 7.9 Generic webhook channel (BYO URL) — new in v0.2

User-supplied HTTPS URL receives a JSON POST for opted-in events. Applies to both Free and Premium tiers (Q5 resolution).

- **Why both tiers:** Free users get a Telegram-equivalent privacy-preserving phone push without our infrastructure (their own Pipedream / Slack / Discord webhook). Premium users get channel-routing flexibility (e.g. team Slack on booking confirmation).
- **Free trust boundary preserved:** the URL is the user's own. No call to `torly.ai` from the Free path. The validator runs entirely in the service worker.
- **Settings:**
  - `webhookEnabled: boolean` (default OFF)
  - `webhookUrl: string` — must be `https://…`, validated with a `TEST_WEBHOOK` test ping (parallel to `TEST_TELEGRAM`)
  - `webhookEvents: { slot, blockers, monitoringStart, booking, license }` — per-class opt-in
- **Wire format:** `POST {webhookUrl}` with header `X-Visa-Master-Event: {event}` and JSON body:
  ```jsonc
  {
    "event": "slot_available",          // see §6 events
    "tier": "free" | "premium",
    "installId": "8f4c…",               // random per-install UUID (NOT torly.ai-linked for Free)
    "ts": "2026-06-04T10:30:00Z",
    "payload": {                        // event-specific, mirrors Telegram body fields
      "centre": "London", "subjectCode": "FR2GB", "country": "FR"
    }
  }
  ```
- **Security:**
  - HTTPS-only enforced at validation
  - 4-second timeout per call (drops slow user URLs without affecting other channels)
  - User can supply an optional `webhookSecret` — we send `X-Visa-Master-Signature: hmac-sha256(secret, body)` so the receiver can verify
  - We DO NOT send TLS credentials, polling cadence, or DOM contents — same data minimisation rules as Telegram (§14.1)
- **Privacy note:** the body fields are identical to the existing Telegram payload, so a Free user enabling webhook is opting into the **same** disclosure as opting into Telegram. The welcome page disclosure is updated accordingly.
- **Rate limits:** 1 call / 3 s per webhook URL (same as Telegram). 4-second timeout is a hard cap.

### 7.10 Out of scope for v1

- Trial expiration (no trial in current pricing).
- Newsletter, product updates, marketing.
- DSR endpoint (separate PRD per Q7).

---

## 8. Resend Integration — Architecture

### 8.1 What gets reused unchanged

From `/Users/Jason-uk/AI/AI_Coding/Repositories/torlyAI`:

| File | Purpose | Change needed? |
|---|---|---|
| `lib/email/send.ts` | `sendEmail()` with `EmailType`, sender profiles, tracking log | None |
| `lib/email/tracking.ts` | `EmailType` enum, `logEmailEvent`, `getEmailTypeByResendId` | **Add 7 new EmailType values** (see §8.3) |
| `lib/email/templates.ts` | `emailLayout`, `ctaButton`, `detailTable`, `signoff`, all helpers | **Add 7 new template functions** |
| `app/api/resend/webhook/route.ts` | Maps Resend events → `email_events` rows | **Add svix signature verification** (currently TODO at line 32 — promote this from "later" to "must" because visa-master refund-window decisions depend on these events) |
| Supabase `email_events` table | Lifecycle tracking | None — schema is event-agnostic. |

### 8.2 What's new on the backend

| File | Purpose |
|---|---|
| `app/api/visa-master/notify/email/route.ts` | The one endpoint the extension calls. POST `{ event: EmailEvent, installId, licenseToken, payload }`. Validates JWT, calls `sendEmail()` with the right template. Idempotency via `email_events` table (skip-if-already-sent on idempotency key). |
| `lib/visa-master/notifications.ts` | Per-event template-selection + idempotency-key derivation, plus a `notifyByEmail(event, …)` helper. |
| `app/api/cron/visa-master-license-watch/route.ts` | Daily cron — finds expiring licenses, calls `notifyByEmail('license_expiring', …)`. |
| Supabase migration `027_visa_master_notifications.sql` | Adds `notifications_sent` join table for **dedupe-by-idempotency-key** (`UNIQUE (install_id, event, idempotency_key)`). |

### 8.3 New `EmailType` values

Append to `lib/email/tracking.ts`:

```ts
// Visa Master transactional notifications (PRD 14)
| 'vm_welcome'                  // Q2 — one-shot at Premium activation
| 'vm_booking_confirmed'
| 'vm_booking_failed'
| 'vm_refund_issued'
| 'vm_refund_prompt'
| 'vm_license_expiring'
| 'vm_license_deactivated'
| 'vm_auto_login_disabled'
```

Prefix `vm_` keeps Visa Master events separated from TorlyAI Innovator Founder events in the dashboard (`components/admin/EmailDashboard.tsx`).

### 8.4 What's new in the extension

| File | Purpose | Touches torly.ai? |
|---|---|---|
| `src/background/email.ts` | Thin client. One function `triggerEmail(event, payload)` that calls `backend-client.ts` → `/api/visa-master/notify/email`. **License-gated.** | Yes (Premium only) |
| Existing `src/background/booking-fsm.ts` | Add email calls alongside existing Telegram calls. | Yes |
| Existing `src/background/state-machine.ts` | Add Telegram pings for `UNKNOWN`, `WRONG_PAGE`, `AUTO_STOP`. **No email calls.** | No — purely Telegram |
| New `src/background/license-watch.ts` | Polls `/license/status` once per 24h; transitions to "deactivated" on inactive response. | Yes |

### 8.5 Wire-format example

`POST https://torly.ai/api/visa-master/notify/email`

```jsonc
{
  "installId": "8f4c…",
  "licenseToken": "<JWT>",
  "event": "vm_booking_confirmed",
  "idempotencyKey": "booking-9w8f7…",
  "payload": {
    "centre": "London",
    "subjectCode": "FR2GB",
    "slotAtIso": "2026-06-04T10:30:00Z",
    "bookingId": "TLS-…",
    "amountPence": 1900,
    "currency": "gbp"
  }
}
```

Response: `{ "ok": true, "emailId": "<resend-id>" }` or `{ "ok": true, "deduped": true }` if already sent.

### 8.6 Brand icon for email — ApertureMark

**Decision:** All Visa Master transactional emails use the new **ApertureMark** brand glyph in the header — not the TorlyAI logo currently used by `lib/email/templates.ts`'s shared `emailLayout()`.

Why: Visa Master is positioned as a distinct product in the torly.ai portfolio (per `MEMORY.md`'s product-portfolio note). The TorlyAI logo header conflates Visa Master with the Innovator Founder assistant in users' inboxes and dilutes both brands.

**What ships:**

1. **Hosted PNG.** The `extension/public/icons/icon-128.png` file (128×128 ApertureMark — outer ring + green wedge + center dot) is copied into the torlyAI repo at `public/visa-master-icon-128.png` and `public/visa-master-icon-256.png` (2× retina). These ship with each torlyAI deploy and become referenced from email HTML as:
   ```
   https://torly.ai/visa-master-icon-128.png
   https://torly.ai/visa-master-icon-256.png   (srcset 2x)
   ```
2. **A new `visaMasterEmailLayout()` helper** in `lib/email/templates.ts` — same scaffold as the existing `emailLayout()` but:
   - Logo `<img>` swapped from `torlyai-logo.png` to `visa-master-icon-128.png` (with 2× srcset)
   - Wordmark text below the icon: `Visa Master` in 16 px medium weight
   - Brand bar gradient stays the same (the amber → orange → amber gradient is a torly.ai-family marker)
   - Footer attribution: `Visa Master by torly.ai · London, United Kingdom`
3. **Inline SVG fallback.** Some email clients (older Outlook) strip remote images. For those, the `<img>` `alt` text reads `Visa Master`; an inline SVG copy of `ApertureMark` is added as a backup inside a `<!--[if mso]>...<![endif]-->` conditional comment so Outlook renders the glyph natively.
4. **Dark-mode friendly.** The ApertureMark SVG `color` ring is rendered as a separate PNG variant `visa-master-icon-128-dark.png` (white ring, same green wedge) and switched via `prefers-color-scheme` media query in the email CSS. Resend supports this; we've verified the same technique works for the existing TorlyAI templates.

**Code sketch (lib/email/templates.ts):**

```ts
function visaMasterEmailLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f8f6f3;font-family:-apple-system,…">
  <div style="max-width:600px;margin:0 auto;padding:32px 20px;">
    <div style="height:4px;background:linear-gradient(90deg,#f59e0b,#f97316,#f59e0b);border-radius:4px 4px 0 0;"></div>
    <div style="background:#ffffff;border-radius:0 0 12px 12px;padding:40px 32px;border:1px solid #e5e2dc;border-top:none;">
      <div style="text-align:center;margin-bottom:8px;">
        <img src="https://torly.ai/visa-master-icon-128.png"
             srcset="https://torly.ai/visa-master-icon-128.png 1x, https://torly.ai/visa-master-icon-256.png 2x"
             alt="Visa Master" width="56" height="56" style="display:inline-block;" />
      </div>
      <div style="text-align:center;margin-bottom:28px;font-size:16px;font-weight:600;color:#1a1a1a;letter-spacing:0.3px;">
        Visa Master
      </div>
      ${content}
    </div>
    <div style="text-align:center;padding:24px 0 0;">
      <p style="font-size:12px;color:#9ca3af;margin:0 0 4px;">
        Visa Master by <a href="https://torly.ai" style="color:#f59e0b;text-decoration:none;">torly.ai</a>
      </p>
      <p style="font-size:11px;color:#d1d5db;margin:0;">London, United Kingdom</p>
    </div>
  </div>
</body>
</html>`
}
```

**Rollout dependency:** the icon files must be present in `torlyAI/public/` and **deployed to production** (with `[deploy]` token per `CLAUDE.md`) **before** any `vm_*` email is sent. Otherwise inboxes will render a broken-image placeholder. Sequencing: ship the asset deploy (N-2.0) before flipping the feature flag for `vm_welcome` (N-2.1).

### 8.7 Sequence — booking confirmed end-to-end

```
content/booking-confirmation-detector → SW
  ↓ BOOKING_CONFIRMED { bookingId, slotAt, centre }
SW: booking-fsm.handleBookingConfirmed
  → captureBooking() (existing, Stripe charges £19)
  → transitionTo PREMIUM_BOOKED
  → in parallel:
    • notifyBookingConfirmed() to Telegram   (existing)
    • notify('PREMIUM_BOOKED', centre)       (desktop — needs new content key in notifications.ts)
    • triggerEmail('vm_booking_confirmed', { … })
        → POST /api/visa-master/notify/email
        → /api/visa-master/notify/email validates JWT, computes idempotencyKey
        → checks notifications_sent table (skip if duplicate)
        → sendEmail({ to: stripe_email, html: bookingConfirmedTemplate(...), emailType: 'vm_booking_confirmed' })
        → resend.emails.send
        → returns emailId
        → email_events row inserted ('sent')
        → notifications_sent row inserted
   asynchronously:
        Resend → /api/resend/webhook → email_events 'delivered' / 'opened'
```

---

## 9. Secrets — Keychain Strategy

### 9.1 Current state (gap)

The torlyAI repo has Resend credentials in `.env.local`:

```
RESEND_API_KEY="re_EuR8a4tS_…"
RESEND_FROM_EMAIL="TorlyAI <hello@torly.ai>"
RESEND_WEBHOOK_SECRET="whsec_vKQ…"
```

These secrets are tracked in plaintext on the developer's filesystem. No Keychain entries exist for them (verified by `security find-generic-password -s RESEND_API_KEY` → not found). The user's request mentions "all credentials have been stored in the macOS Keychain access" — this PRD treats that as **aspirational target**, and proposes the migration below.

### 9.2 Proposal — three-layer credential strategy

| Environment | Storage | Loader |
|---|---|---|
| Production (Vercel) | Vercel environment variables (already in place) | Next.js `process.env.RESEND_API_KEY` |
| Developer machine | **macOS Keychain (new)** | A small `scripts/load-secrets.ts` that reads via `security find-generic-password -s … -w` and writes to `.env.local` at dev startup |
| CI (GitHub Actions) | GitHub Secrets (existing) | Next.js `process.env.…` |

### 9.3 Keychain item naming

Use `kind: generic password`, `service: torly.ai`, `account: <KEY_NAME>`:

```
service=torly.ai, account=RESEND_API_KEY
service=torly.ai, account=RESEND_FROM_EMAIL
service=torly.ai, account=RESEND_WEBHOOK_SECRET
service=torly.ai, account=JWT_PRIVATE_KEY
service=torly.ai, account=JWT_PUBLIC_KEY
service=torly.ai, account=STRIPE_SECRET_KEY
service=torly.ai, account=STRIPE_WEBHOOK_SECRET
service=torly.ai, account=SUPABASE_SERVICE_ROLE_KEY
```

Add commands the user runs once:

```bash
# Placeholder values only — never commit a real key string.
# Paste the actual Resend key from the dashboard at runtime.
security add-generic-password -s "torly.ai" -a "RESEND_API_KEY" \
  -w "re_REDACTED_EXAMPLE_NEVER_REAL" -U
# repeat for each (RESEND_FROM_EMAIL, RESEND_WEBHOOK_SECRET, JWT_PRIVATE_KEY, etc.)
```

> ⚠️ **Why placeholder:** an earlier draft of this doc contained a real Resend key string that GitGuardian flagged in the public release repo on 2026-05-14. The key was rotated at Resend; this redaction prevents future re-flagging. Strings containing `REDACTED`/`EXAMPLE` are on every major secret-scanner's allowlist.

### 9.4 Loader script (new — `scripts/load-secrets.ts`)

A tiny TS script that on `npm run dev`:
1. Reads `.env.example` for the list of expected keys.
2. For each key, runs `security find-generic-password -s torly.ai -a <KEY> -w`.
3. Writes the materialised values to `.env.local` (gitignored).
4. Exits non-zero if any required key is missing.

This way `.env.local` is regenerated from Keychain on every dev start; if the developer's laptop is wiped or the file is leaked, it doesn't matter — Keychain is the source of truth.

### 9.5 Extension-side note

The extension itself never sees `RESEND_API_KEY`. It calls `/api/visa-master/notify/email` and the backend holds the Resend key. **This is also a load-bearing security property**: shipping the extension to the Chrome Web Store with a Resend key in the bundle would let anyone send mail as `hello@torly.ai`.

---

## 10. User Preferences — Settings Schema

### 10.1 Today's `SettingsPayload` (free)

```ts
{
  // … cadence + detection fields …
  notifDesktop: boolean,
  notifSound: boolean,
  notifTabTitle: boolean,
  notifAutoFocus: boolean,
  telegramEnabled: boolean,
  telegramBotToken: string,
  telegramChatId: string,
  telegramAlsoBlockers: boolean,
  telegramMonitoringStart: boolean,
}
```

### 10.2 Proposed additions

```ts
// ── Free additions (Telegram gap-fill) ──────────────────────────────
telegramOnUnknown: boolean;       // default false
telegramOnWrongPage: boolean;     // default false
telegramAutoStop: boolean;        // default true — real failure, opt-out
telegramDailySummary: boolean;    // default false

// ── Webhook channel (both tiers — Q5 resolution) ────────────────────
webhookEnabled: boolean;          // default false
webhookUrl: string;               // must be 'https://…' (validated)
webhookSecret: string;            // optional; if set, HMAC-SHA256 header added
webhookEvents: {                  // per-class opt-in
  slot: boolean;                  // default true when webhook enabled
  blockers: boolean;              // default true
  monitoringStart: boolean;       // default false
  booking: boolean;               // default true (Premium only)
  license: boolean;               // default true (Premium only)
};

// ── Premium email — Q1 hybrid defaults ─────────────────────────────
emailEnabled: boolean;                  // master toggle, default TRUE on premium activation
emailEventsBookingLifecycle: boolean;   // booking_confirmed/failed, refund_issued/prompt — DEFAULT TRUE
emailEventsLicense: boolean;            // license_expiring, license_deactivated — DEFAULT FALSE
emailEventsAuthIssues: boolean;         // auto_login_disabled — DEFAULT FALSE
emailQuietHoursEnabled: boolean;        // default false
emailQuietHoursStart: string;           // 'HH:MM' UK, default '22:00'
emailQuietHoursEnd: string;             // 'HH:MM' UK, default '07:00'

// ── Telegram premium-only event toggles ─────────────────────────────
telegramBookingInProgress: boolean;  // default false (chatty)
telegramRefundPrompt: boolean;       // default true
telegramLicenseEvents: boolean;      // default true
telegramAutoLoginIssues: boolean;    // default true
```

**Rationale for hybrid email defaults (Q1):**
- Booking-lifecycle emails are receipts the user is paying £19 for; default ON is what they expect.
- License + auth-issues emails are "yellow light" operational warnings; default OFF avoids over-emailing users who don't care about edge cases. Users who want them opt in via P-12 → Email notifications → Advanced.
- The `vm_welcome` email at activation is **not** gated by these toggles — it always fires once (Q2 resolution).

### 10.3 Quiet hours policy

| Event class | Honours quiet hours? |
|---|---|
| `SLOT_AVAILABLE`, `PREMIUM_BOOKED`, `PREMIUM_BOOKING_FAILED`, `PREMIUM_REFUND_PROMPT` | **No** — time-critical, override quiet hours. |
| `vm_license_expiring`, `vm_license_deactivated`, `vm_auto_login_disabled`, `MONITORING_*`, daily summary | **Yes** — non-urgent. Held until next non-quiet hour. |
| Desktop and Telegram | Quiet hours are an email-channel concern only. Telegram already has its native sleep mode. |

### 10.4 UI changes

- **Popup `PREMIUM_OPTIONS` tab (P-12):** new section "Email notifications" with a master toggle and three sub-toggles (booking lifecycle / license events / auth issues) and a `[Send test email]` button.
- **Full-tab Settings (Free + Premium):** new "Notifications" section unifying desktop / sound / Telegram. Email section appears only when `tier === 'premium'`.
- **Welcome page:** Premium addendum next to "we never make a network call outside the TLS tab" — "Premium also sends booking confirmations from torly.ai to your Stripe email."

---

## 11. Suppression, Dedupe & Rate Limits

### 11.1 Dedupe rules (per channel, per event)

| Event | Dedupe window | Idempotency key |
|---|---|---|
| `SLOT_AVAILABLE` desktop / Telegram | 30 s (a flap shouldn't re-fire) | `slotDetectedTs` rounded to minute |
| `vm_booking_confirmed` email | forever | `bookingId` |
| `vm_booking_failed` email | 5 min | `${installId}-${startedAt}` |
| `vm_refund_issued` email | forever | `refundId` |
| `vm_refund_prompt` email | 6 h | `bookingId` |
| `vm_license_expiring` email | 24 h | `licenseId:warning:${daysRemaining}` |
| `vm_auto_login_disabled` email | 24 h | `installId:auto-login-disabled:${date}` |
| CLOUDFLARE / LOGGED_OUT Telegram | 5 min | state name |
| MONITORING_STARTED Telegram | 60 s | — |

Backend dedupe enforcement: the new `notifications_sent` table — `UNIQUE (install_id, event, idempotency_key)`. Insert before sending; on conflict, skip.

### 11.2 Rate limits

| Channel | Burst cap | Sustained |
|---|---|---|
| Telegram | 1 msg / 3 s per chat | 20 msg / minute per chat (Telegram's own limit is 30/sec across all chats; we never approach that single-chat) |
| Email | 1 msg / 60 s per install across all events | 10 msg / hour |

If we exceed the email rate cap, the backend returns `{ ok: false, throttled: true, retryAfter: <seconds> }` and the extension surfaces a banner in P-12 ("Email throttled — last booking still notified by Telegram"). Booking-confirmed is a special case: never throttled.

### 11.3 Circuit breaker

If Resend returns 5xx three times in a row, mark the email channel as `degraded` for 10 minutes. During degraded mode, Telegram and desktop continue normally; the popup P-12 shows a yellow "Email delivery degraded" pill.

---

## 12. Idempotency & Retry Strategy

| Failure | Behaviour |
|---|---|
| Service worker evicted between `BOOKING_CONFIRMED` and `triggerEmail` | On next event, check `notifications_sent` — if no row, send. If a row exists, skip. |
| Backend `/notify/email` returns 5xx | Extension retries with exponential backoff (1s, 3s, 9s, 27s; max 4 attempts). After 4 failures, gives up silently — booking remains valid, only email channel failed. |
| Resend returns 5xx | Backend retries (1s, 5s, 25s; max 3 attempts). On final failure, logs to `email_events` as `failed`. |
| Webhook never delivers `delivered` event within 5 min | Backend cron `/api/cron/email-watchdog` resends after 30 min, max 1 retry. |
| User changes Stripe email after activation | Existing `/license/rebind` flow updates `stripe_email`; subsequent emails go to new address. Past emails unchanged. |

**Critical rule:** the **money flow** (Stripe £19 capture) and the **notification flow** are decoupled. A capture success with a failed email is **not a rollback condition**. The user's £19 stays charged; we re-send the email; we never refund just because email failed.

---

## 13. Observability — Tracking & Dashboards

### 13.1 What we track

- Resend lifecycle (sent / delivered / opened / clicked / bounced / complained) — already covered by `/api/resend/webhook`.
- Telegram delivery — extend `telegram.ts` to write per-send outcomes to `chrome.storage.local.telegramLog` (last 100 sends, rolling). Surface in popup `PREMIUM_OPTIONS` → "Recent activity".
- Desktop notification creation — already implicit (no failure modes worth tracking).

### 13.2 Dashboards

- Reuse `components/admin/EmailDashboard.tsx`. Add a `productFilter` dropdown (currently shows all `EmailType`s) so the dashboard can be scoped to `vm_*` events.
- Build a simple `/admin/visa-master/notifications` page showing the matrix of (event × install × outcome) for the last 7 days. Optional v1, mandatory v2.

### 13.3 SLOs

| SLO | Target | Tracked via |
|---|---|---|
| Booking-confirmed email delivered ≤ 30 s p95 | 98% | `email_events.created_at` diff between `sent` and `delivered` |
| Booking-confirmed email opened ≤ 24 h | 70% | `email_events.event_type = 'opened'` |
| Telegram booking-confirmed delivered ≤ 5 s p95 | 95% | `telegramLog.deliveryMs` |

---

## 14. Privacy, Security & Compliance

### 14.1 Data minimisation per email

| Field in payload | Sent? | Why / why not |
|---|---|---|
| `installId` | ✓ | Required for JWT validation. Already on torly.ai per `CLAUDE.md`. |
| `licenseToken` | ✓ | JWT — torly.ai validates aud + signature. |
| `centre`, `subjectCode`, `country` | ✓ | Already shared in current Telegram payload + per `CLAUDE.md`. |
| `slotAtIso` | ✓ | Already shared per CLAUDE.md "What Premium DOES send". |
| `bookingId` | ✓ | Already shared. |
| `amountPence`, `currency` | ✓ | Required for receipt body. |
| Stripe `email` | retrieved on backend from `vm_installs.stripe_email`, never sent from extension | Extension doesn't know the email; backend looks it up via `installId`. |
| TLS credentials (email/password) | **NEVER** | Hard rule. |
| Polling cadence | **NEVER** | Not relevant to receipt. |
| Tab URLs, DOM snippets | **NEVER** | Privacy posture. |

### 14.2 JWT validation

Every `/notify/email` call validates the license JWT against `JWT_PUBLIC_KEY` and rejects if `aud !== 'visa-master-extension'`. This blocks the torlyai-desktop tier from triggering Visa Master emails.

### 14.3 Email content rules

- No clickable links to anything except torly.ai paths or the user's TLS tab via `chrome-extension://…` deep-links.
- No tracking pixels beyond what Resend ships by default. Resend's open-tracking is fine for transactional and standard practice.
- No promo. No upsell. No newsletter cross-link.
- Every email's footer reiterates: "Email and notification preferences: open Visa Master → Premium → Options."

### 14.4 GDPR

- Lawful basis: contract performance (the £19 transaction creates the contract; emails are receipts and operational comms).
- Retention: `email_events` rows retained 24 months for accounting; PII redacted thereafter (recipient → SHA-256 hash).
- Data subject request: `/api/visa-master/dsr/delete` (out of scope this PRD; tracked in §18 Q7).
- Right to object: notification preferences UI satisfies this; user can disable email entirely.

### 14.5 Spam compliance

- All emails are transactional (CAN-SPAM exempt from unsubscribe requirement, but UK PECR still applies). We include a "manage preferences" link, not a one-click-unsubscribe — disabling email is a Premium settings action, not an unsubscribe.
- Bounce rate target ≤ 0.5%. Resend dashboards alert at 5%.

---

## 15. Internationalisation

**Q9 decision: full ZH-CN parity for ALL email templates at launch** — not just the booking-lifecycle subset. This reinforces the trust posture documented in `09-visa-master-premium-prd.md` Persona P2 ("Trust-first Tao") and aligns with the open item in `CLAUDE.md` that already flags 中文 translations as TODO.

- All seven `vm_*` template helpers in `lib/email/templates.ts` accept a `locale: 'en' | 'zh-CN'` parameter. **No template ships English-only.**
- Centralised string table in `lib/email/i18n/{en,zh-CN}.ts` covering all subject lines, headings, body copy, CTA labels, and footer trust-boundary text.
- Subject lines are localised — e.g. `✅ TLS 预约已确认 — 伦敦, 6 月 4 日` for the ZH-CN booking-confirmed.
- Locale resolution order:
  1. `vm_installs.preferred_email_locale` if set (new column).
  2. `settings.uiLang` synced from extension at activation time (new field added to `/license/activate` payload).
  3. Fallback `'en'`.
- Telegram message localisation: `telegram.ts` extended in lockstep. The seven existing functions (`notifySlotAvailable`, `notifyMonitoringStart`, `notifyMonitoringPaused`, `notifyBlocker`, `notifyBookingConfirmed`, `notifyBookingFailed`, `notifyRefundIssued`) + the new ones added in N-1 all accept `locale`.
- Webhook channel: payload is locale-agnostic (machine-readable JSON). No i18n needed.
- Welcome page strings updated for the new Premium addendum and the webhook trust disclosure — must be reviewed by a native ZH-CN speaker before launch.

**Translation source-of-truth:** Use a single Google Sheet or `lib/email/i18n/translations.csv` checked into the repo so the marketing-side reviewer (presumably a native ZH-CN speaker) edits one place and the codegen step refreshes both `en.ts` and `zh-CN.ts`.

---

## 16. Best Practices Adopted

A list of cross-industry notification-system best practices that this PRD adheres to or explicitly diverges from. Numbered for traceability in PR reviews.

1. **Channel hierarchy by urgency.** Time-critical events (slot found, booking confirmed) fire all channels in parallel. Lifecycle events (monitoring started) fire only opt-in channels.
2. **Default to ON for transactional, default OFF for lifecycle.** Booking emails are receipts; users expect them. Monitoring-start pings are conveniences; opt-in only.
3. **Idempotency keys on every external write.** Every Stripe charge has one, every email has one. The dedupe table is the choke point.
4. **Parallel fire-and-forget for multi-channel events.** Never `await` Telegram before sending email. Failure on one channel must not block another.
5. **Quiet hours respected only for non-urgent classes.** Document the override list (§10.3) so it's not a UI surprise.
6. **Test-message buttons** for every user-configurable channel. Telegram already has one (`TEST_TELEGRAM`); add `TEST_EMAIL` to mirror.
7. **Receipts before retries.** Booking-confirmed email lands before any retry of upstream `/booking/capture`. Decoupled flows mean the user knows it worked before we know our internal state is fully reconciled.
8. **No tracking pixels in operational mail beyond vendor defaults.** Resend's pixel is fine; nothing custom.
9. **Webhook signature verification.** Resend webhook gets svix-verified (current TODO at `app/api/resend/webhook/route.ts:32`). Booking-window decisions depend on these webhooks; spoofing risk is real.
10. **Rate-limit responses are user-visible.** P-12 surfaces "Email throttled" rather than silently dropping.
11. **Single sender domain for transactional.** `hello@torly.ai`. Adding a Visa Master subdomain (`hello@visa.torly.ai`) increases SPF/DKIM ops and dilutes domain reputation. Defer.
12. **Plain-text fallback.** Resend auto-generates plain-text from HTML; we don't author both, but we verify the auto-generated text reads naturally for the booking-confirmed template (no decorative Unicode-only).
13. **Mobile-first preview width.** Templates capped at 600 px wide (already true of all torlyAI templates).
14. **Subject-line front-load the outcome.** "✅ TLS slot booked — …" not "Visa Master: Important update". Matches the existing desktop convention in `notifications.ts` ("Slot available — TLScontact …").
15. **Unicode emoji as visual outcome markers** — ✅ ❌ 💰 ⏰ — matched between Telegram and email so a user receiving both recognises the same event at a glance.
16. **Server-side template rendering only.** Never pass user input as raw HTML; the helpers use string concatenation but only for trusted values from the validated payload.
17. **Localised time formatting.** Telegram already uses `Intl.DateTimeFormat` for local timezone; email does the same on the backend using the install's stored locale.
18. **Footer disclosure of trust boundary.** Every email body restates "We never store your TLS password on our servers." This is a marketing asset as much as a notice; reinforces the differentiator vs VisaReady on each touch.
19. **No marketing in transactional template.** Hard rule; tracked in §7.8.
20. **Deactivation email always works.** If a license is rebound on another install, the old install's email goes through even if its own JWT is invalidated — the trigger is a server-side cron, not the extension.

---

## 17. Roadmap & Milestones

| Phase | Scope | ETA |
|---|---|---|
| **N-1: Telegram gap-fill** | UNKNOWN, WRONG_PAGE, AUTO_STOP, monitoring-resumed for Premium, booking-in-progress, refund-prompt Telegram pings. **No backend changes.** Pure extension. | Sprint 1 (1 week) |
| **N-2.0: Brand assets deploy** | Copy `icon-128.png` + retina variants to `torlyAI/public/visa-master-icon-*.png`. Deploy with `[deploy]` token. **Blocks N-2.1+.** | Sprint 2 (½ day) |
| **N-2.1: Resend plumbing** | Backend: `/api/visa-master/notify/email`, `visaMasterEmailLayout()`, 8 templates (including `vm_welcome`), 8 EmailType values, `notifications_sent` dedupe table (migration 027). Keychain loader script. svix webhook verification. | Sprint 2 (1.5 weeks) |
| **N-3: Booking-lifecycle emails + welcome** | `vm_welcome` (at activation, Q2), `vm_booking_confirmed`, `vm_booking_failed`, `vm_refund_issued`, `vm_refund_prompt`. Default ON for Premium. Extension wiring. `TEST_EMAIL` button. | Sprint 2 (parallel) |
| **N-4: License + auth emails** | `vm_license_expiring`, `vm_license_deactivated`, `vm_auto_login_disabled`. Default OFF (hybrid Q1). Add `app/api/cron/visa-master-license-watch`. | Sprint 3 (1 week) |
| **N-5: i18n (full ZH-CN parity)** | Localised templates EN + ZH-CN for **all eight** vm_* emails (Q9). `vm_installs.preferred_email_locale`. Telegram strings localised. ZH-CN review by native speaker. | Sprint 3 (parallel) |
| **N-6: BYO Webhook channel** | `src/background/webhook.ts`, `TEST_WEBHOOK` validator, `webhookEnabled`/`webhookUrl`/`webhookSecret`/`webhookEvents` settings, popup + Settings UI, welcome-page disclosure update. Free + Premium. (Q5 — promoted from v2 to v1.) | Sprint 4 (1 week) |
| **N-7: Dashboards** | Extend EmailDashboard with `vm_*` filter; `/admin/visa-master/notifications` matrix. SLO monitoring. | Sprint 5 (optional in v1) |
| **CS1: SMS via Twilio** | Coming soon (Q6). Paid add-on; book once we have ≥ 200 Premium activations and Telegram opt-in plateaus below target. | Q3–Q4 2026 |
| **Deferred to v2** | Daily summary email, in-popup notification log inspector, multi-recipient email (family of 3 → all three get the slot found ping). | Q3 2026 |

Each phase ships behind a feature flag (`features.emailNotifications`, `features.webhookChannel`, `features.smsChannel`) so the backend can gate the whole stack in case of vendor incident.

---

## 18. Resolved Decisions (2026-05-14 review)

All questions from v0.1 §18 have been resolved by review. Future open items move to a new section §18.X as they arise.

| # | Question | Decision | Reasoning / sections affected |
|---|---|---|---|
| Q1 | Email default at Premium activation | **Hybrid: booking lifecycle ON, license + auth-issues OFF** | Receipts default ON (user expects them for £19 charge). Yellow-light operational events default OFF to avoid over-emailing. §10.2 hybrid schema. |
| Q2 | Welcome email at activation | **Yes — short welcome email, one-shot per Stripe customer** | New §7.0. Independent of `emailEnabled` toggle. Re-binds do not re-fire. |
| Q3 | Booking subject reveal level | **Date + Centre** — e.g. "✅ TLS slot booked — London, 4 June" | Maximum clarity for the user; inbox/lock-screen tradeoff accepted. §7.1, Appendix B. |
| Q4 | `vm_auto_login_disabled` trigger threshold | **Only on cooldown exhaustion** | Avoids false alarms from transient TLS 503s. §7.8. |
| Q5 | BYO Webhook for Free | **Build in v1** — new channel for both tiers | Promoted from non-goal to in-scope. §5.2, §7.9, §10.2, roadmap N-6. |
| Q6 | SMS via Twilio | **Coming soon (CS1)** — paid add-on after launch | Reclassified from non-goal. §3.3, §17. |
| Q7 | DSR endpoint scope | **Separate PRD** | Out of scope here. §3.2 NG5. |
| Q8 | One-click refund button | **No — deep-link to popup only** | Prevents email-replay attack. §7.4 unchanged. |
| Q9 | ZH-CN localisation timing | **Full parity at launch — all eight `vm_*` emails** | Reinforces P2 ("Trust-first Tao") persona. §15, roadmap N-5. |

### 18.X New open items raised during this review

| # | Item | Owner | Resolution target |
|---|---|---|---|
| O1 | Who reviews the ZH-CN translations before launch? | Duke | Find a native speaker (community? Fiverr? cmoers in the Telegram channel?) — needed before N-5 ships. |
| O2 | Where do BYO webhook validation rules live in the welcome page disclosure? | Duke + UI work | Update `welcome.no.4` Premium addendum text to mention webhook payload contents. Coordinate with N-6. |
| O3 | Asset hosting — do we serve `visa-master-icon-*.png` from `torly.ai` directly or via a CDN? | Devops | Default torly.ai (Vercel CDN is implicit). Revisit if open rates show image loading is a bottleneck. |

---

## 19. Appendix A — Cross-Repo File Map

### Extension (`/Users/Jason-uk/AI/AI_Coding/Workspaces/Schengen-visa`)

| File | Change |
|---|---|
| `extension/src/shared/messages.ts` | Add `TEST_EMAIL`, `TEST_WEBHOOK` message types, extend `SettingsPayload` with new fields (§10.2). |
| `extension/src/shared/storage.ts` | Extend `DEFAULT_SETTINGS` with new defaults (incl. `webhookEnabled`, `webhookEvents`). |
| `extension/src/background/email.ts` | NEW. Thin client → `/api/visa-master/notify/email`. Premium-gated. |
| `extension/src/background/webhook.ts` | **NEW (Q5)**. Both tiers. POST to user-supplied URL. HTTPS-enforced, 4 s timeout, HMAC-signed if `webhookSecret` set. |
| `extension/src/background/telegram.ts` | Add `notifyUnknown`, `notifyWrongPage`, `notifyAutoStop`, `notifyBookingInProgress`, `notifyRefundPrompt`, `notifyLicenseExpiring`, `notifyLicenseDeactivated`, `notifyAutoLoginDisabled`. Localise existing functions for ZH-CN. |
| `extension/src/background/state-machine.ts` | Trigger new Telegram + Webhook pings on rising edges. Email calls confined to booking-fsm. |
| `extension/src/background/booking-fsm.ts` | Add `triggerEmail()` + `triggerWebhook()` calls alongside existing Telegram calls. |
| `extension/src/background/license-watch.ts` | NEW. Polls `/license/status` daily; fires deactivation events. |
| `extension/src/popup/PremiumOptions.tsx` (P-12) | New "Email notifications" + "Webhook" sections, each with test button. |
| `extension/src/settings/Settings.tsx` | New "Notifications" panel: desktop / Telegram / Webhook (both tiers); Email section appears only when Premium. |
| `extension/src/welcome/WelcomePage.tsx` | Update Premium addendum on `welcome.no.4` to disclose webhook payload contents. |
| `extension/src/i18n/{en,zh-CN}/*.ts` | New strings for all new toggles + states + Telegram messages + webhook UI. |

### Backend (`/Users/Jason-uk/AI/AI_Coding/Repositories/torlyAI`)

| File | Change |
|---|---|
| `lib/email/tracking.ts` | Add **8** `vm_*` `EmailType` values (including `vm_welcome`). |
| `lib/email/templates.ts` | Add `visaMasterEmailLayout()` (§8.6) + **8** template functions (`welcomeEmail`, `bookingConfirmedEmail`, `bookingFailedEmail`, `refundIssuedEmail`, `refundPromptEmail`, `licenseExpiringEmail`, `licenseDeactivatedEmail`, `autoLoginDisabledEmail`). Each accepts `locale: 'en' \| 'zh-CN'`. |
| `lib/email/i18n/{en,zh-CN}.ts` | NEW. Centralised strings for all subject lines, headings, body copy, CTA labels, footer trust-boundary text. |
| `lib/visa-master/notifications.ts` | NEW. `notifyByEmail(installId, event, payload)` — template selection + dedupe + `sendEmail`. |
| `app/api/visa-master/notify/email/route.ts` | NEW. POST. JWT-validated. Idempotency via `notifications_sent`. |
| `app/api/visa-master/license/activate/route.ts` | **Modified**: triggers `vm_welcome` email one-shot after first successful activation. Stores `preferred_email_locale` from extension's `uiLang`. |
| `app/api/cron/visa-master-license-watch/route.ts` | NEW. Daily. License-expiring + license-deactivated fan-out. |
| `app/api/resend/webhook/route.ts` | Add svix signature verification. |
| `supabase/migrations/027_visa_master_notifications.sql` | NEW. `notifications_sent` table; `vm_installs.preferred_email_locale` column. |
| `public/visa-master-icon-128.png`, `public/visa-master-icon-256.png` (+ `-dark` variants) | NEW. Copied from `extension/public/icons/icon-128.png` + 2× retina + dark-mode variant. Must deploy with `[deploy]` token **before** any email goes out. |
| `components/admin/EmailDashboard.tsx` | Add product filter; surface `vm_*` events. |
| `scripts/load-secrets.ts` | NEW. Keychain → `.env.local` materialiser. |
| `.env.example` | Add comment block describing Keychain workflow. |

Cross-repo deploy gate: any backend change in this list **must** include the `[deploy]` token in its merge commit, per the contract documented in `CLAUDE.md` §"Cross-repo: torlyAI deploy gate".

---

## 20. Appendix B — Email Body Drafts

> Note: these are PRD-level drafts. Final wording will iterate via Resend's preview environment. All use the `emailLayout` helper from `lib/email/templates.ts`.

> **Brand:** every email below renders inside `visaMasterEmailLayout()` (§8.6) — the ApertureMark icon (Visa Master glyph), wordmark "Visa Master" in the header, amber gradient bar. NOT the generic TorlyAI logo used by the Innovator Founder emails.

### B.0 `vm_welcome` (NEW per Q2)

```
Subject: Welcome to Visa Master Premium — you're all set

[ApertureMark icon + "Visa Master" wordmark]

You're in.
                          (large heading)
Auto-book is now active. We'll book the first TLS slot that
fits your travel window — and only charge £19 if we
actually succeed.

Three things to expect:

  1. Set your travel date and processing days in the popup.
     We use these to decide which slots are worth booking.

  2. We scan around the clock with smart cadence.
     Releases (06:00 UK + 23:30 UK) get more attention.

  3. The moment we book, you'll get this email and a
     Telegram ping if you've connected your bot.

  [ Open Visa Master ]   ← chrome-extension:// deep-link

Your TLS password never leaves your browser.
Auto-login fills the form locally — we don't proxy it
through any server.

— The Visa Master team
Manage notifications: Visa Master → Premium → Options
```

### B.1 `vm_booking_confirmed`

```
Subject: ✅ TLS slot booked — London, 4 June

[ApertureMark icon + "Visa Master" wordmark]

Your TLS appointment is booked.
                          (large heading)

We secured the slot the moment it opened.
There's one final step — pay TLS's visa fee directly on
TLScontact within 30 minutes to confirm.

  Centre:        London
  Country:       France
  Subject code:  FR2GB
  Appointment:   4 June 2026, 10:30 BST
  Reference:     TLS-…
  Charged:       £19.00 GBP
  Charged on:    14 May 2026, 21:47 BST
  Refund window: 24 hours

  [ Open TLScontact to pay the visa fee ]   ← deep-link to user's TLS tab

What if TLS cancels the slot?
We monitor for cancellations inside the 24-hour refund
window. If TLS voids your appointment, we'll automatically
refund the £19 — no action needed from you.

We never stored your TLS password on our servers.
Auto-login filled the form locally inside your browser.

— The Visa Master team
Manage notifications: open Visa Master → Premium → Options
```

### B.2 `vm_booking_failed`

```
Subject: Slot attempt didn't go through — back to scanning

We saw a slot at London but couldn't lock it in time.
£0 was charged.

  Centre:       London
  Slot:         4 June 2026, 10:30 BST
  Why it failed: Slot was taken by another applicant before
                we finished the booking form.
  Time to fail: 47 seconds
  Charged:      £0.00

We're back to scanning. The next slot will trigger another
attempt automatically — no action needed.

If you've been picky on date or time, you can widen the
window in Visa Master → Premium → Options.

— The Visa Master team
```

### B.3 `vm_refund_prompt`

```
Subject: Action needed — TLS cancelled your slot

TLS just cancelled your appointment.
This happens occasionally — usually because the centre
adjusted its schedule. We can refund your £19 now.

  Original slot:  4 June 2026, 10:30 BST · London
  Booked:         14 May 2026, 21:47 BST
  Refund window:  closes in 19 hours

  [ Open Visa Master to request the refund ]

We'll automatically refund if you don't act inside the
window — but the popup gives you the option to confirm
right now and have it processed in seconds.

— The Visa Master team
```

### B.4 `vm_refund_issued`

```
Subject: 💰 Refund issued — £19

Your £19 refund is on its way.

  Refund amount:  £19.00 GBP
  Refund ID:      re_…
  Issued:         14 May 2026, 22:01 BST
  Appears on:     5–10 business days

We've resumed scanning automatically.
No further action needed.

— The Visa Master team
```

### B.5 `vm_license_expiring`, B.6 `vm_license_deactivated`, B.7 `vm_auto_login_disabled`

(Shorter bodies; full drafts in implementation tickets.)

---

**End of PRD.**
