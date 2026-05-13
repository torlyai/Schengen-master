# Visa Master vs Alternatives — Three Schengen Booking Extensions Compared

> Read this in: **English** · [中文](./08-vs-alternatives.zh-CN.md)
>
> **Research date:** 2026-05-13
> **Scope:** Three Chrome extensions targeting the TLScontact Schengen visa appointment problem.
> **Method:** Public Chrome Web Store listings + each vendor's marketing site. All claims are sourced; verbatim quotes are in "double quotes".

This document compares Visa Master with the two paid commercial extensions currently shipping in the same space. It is intended for end users deciding which tool to install, and for contributors who need a defensible factual basis when describing how Visa Master differs.

The numbers reflect each listing on the research date above. Web Store metadata (versions, user counts, ratings) drifts; re-check before quoting in marketing.

---

## Table of Contents

1. [At-a-glance](#1-at-a-glance)
2. [Per-extension factual cards](#2-per-extension-factual-cards)
3. [Side-by-side feature matrix](#3-side-by-side-feature-matrix)
4. [How each extension actually works](#4-how-each-extension-actually-works)
5. [Where Visa Master differs (positioning)](#5-where-visa-master-differs-positioning)
6. [What our Premium tier will do differently](#6-what-our-premium-tier-will-do-differently)
7. [Sources](#7-sources)

---

## 1. At-a-glance

| | **VisaReady** | **TLSContact Appointment Booker** | **Visa Master (ours)** |
|---|---|---|---|
| **One-liner** | "Free to install. £29 only when we book." | "Automatically books Schengen visa appointments on TLScontact when they become available." | "Stop refreshing TLScontact. Get a phone + desktop ping the second a slot opens. Local-only, no servers." |
| **What it does** | **Auto-books** the slot | **Auto-books** the slot | **Alerts you** — you book manually |
| **Pricing** | £0 install + **£29 per confirmed booking** (success fee) | "Free + in-app purchases" (marketing site lists **£19.99 / 2 weeks**) | **Free forever** (MIT open source) |
| **Account / sign-in** | Required | Required (in-app purchase) | None |
| **Credentials given to the tool** | TLScontact password + Stripe card on file | TLScontact session (implied) | **None** |
| **Coverage today** | UK → France (London) | France, Switzerland, Germany, Morocco "and Beyond" | Any TLScontact host (`*.tlscontact.com`) |
| **Source code** | Closed | Closed | **MIT open source** |
| **Server dependency** | Yes — "VisaReady network" coordinated scanning | Yes — implied by 173 KiB shell + "above 300s to avoid blocks" admission | **None** — runs entirely in your browser |
| **Last updated** | 2026-05-13 | 2026-05-12 | 2026-05-12 (v1.0.9) |
| **Users** | 26 | 6,000 | n/a (side-load only) |
| **Rating** | 5.0 (1 review) | 3.2 (34 reviews) | n/a |

---

## 2. Per-extension factual cards

### 2.1 VisaReady — Auto-Book Your TLSContact Visa Appointment

| Field | Value |
|---|---|
| Web Store ID | `plplpdeonhhgbcakkfkpapbonmngjecn` |
| Version | 1.0.8 |
| Last updated | 13 May 2026 |
| Size | 173 KiB |
| Users | 26 |
| Rating | 5.0 ★ (1 review) |
| Publisher | VisaReady |
| Address | 16A Baldwin's Gardens, London EC1N 7RJ, GB |
| Website | https://visaready.ai |
| Support | support@visaready.ai |
| Privacy policy | https://visaready.ai/privacy |
| Pricing | Free install · **£29 success fee** per confirmed TLS booking |
| Refund | "Yes — if TLS cancels the slot within 24h" |
| Languages | English |

**Coverage:** UK → France (London) live. Roadmap: UK → Germany, Belgium, Netherlands, Italy, Spain, US B1/B2.

**What's included (per `visaready.ai/pricing`):** auto-login with continuous 24/7 session management; real-time slot scanning "across VisaReady network"; auto-booking with 30-minute payment window; email + SMS notifications; pause/cancel controls; priority support during booking window.

**Trust claims:** "Password encrypted in browser local storage, not stored server-side"; "no server-side scraping of TLSContact"; "anonymised slot data only; no personal data shared between users"; Stripe-managed payments.

### 2.2 TLSContact Appointment Booker for Schengen Visa

| Field | Value |
|---|---|
| Web Store ID | `cbkiaocamdmihicmjkpoefhlgiioipmb` |
| Version | 1.2.12 |
| Last updated | 12 May 2026 |
| Size | 173 KiB |
| Users | **6,000** |
| Rating | 3.2 ★ (34 reviews) |
| Publisher | Visa Agent |
| Address | 120 London Wall, London EC2Y 5ET, GB |
| Website | https://tlscontact.contact |
| Support | support@tlscontact.contact |
| Privacy policy | https://yanzhongsu.github.io/privatepolicy/ (third-party host) |
| Pricing | "Free + in-app purchases" · marketing site lists **£19.99 / 2 weeks** |
| Refund | Not shown |
| Languages | English, with Arabic and Chinese mentioned in description |
| Badges | "Created by the owner of the listed website. The publisher has a good record with no history of violations." |

**Coverage:** France, Switzerland, Germany, Morocco "and Beyond".

**Operating instructions (verbatim from listing):** "1. Visit the TLSContact Appointment Page … 2. Set your preferred date range. Uncheck 'include prime slot' to skip premium slots and save money. 3. **Choose a refresh interval above 300 seconds to avoid blocks. For Germany visa, it can be 60+ seconds.** 4. Click 'Start Monitoring' in the extension popup. 5. Enable email notifications on your phone to know when a slot is booked. 6. **Pay within 30 minutes of the email, or the slot will be released.**"

**Note on the brand name.** The product is called "TLSContact Appointment Booker" and the marketing site lives at `tlscontact.contact`. It is **not** operated by or affiliated with TLScontact (TLS itself uses domains under `tlscontact.com`). This naming choice creates brand confusion that affects user trust — see §5.

### 2.3 Visa Master — Appointment Watcher (this repository)

| Field | Value |
|---|---|
| Distribution | GitHub Releases ZIP (side-load); Chrome Web Store listing not live yet |
| Version | 1.0.9 |
| Last updated | 12 May 2026 |
| Source size | ~3,133 lines of TypeScript across `src/{background,content,shared,popup,settings,welcome,i18n,hooks}/**` |
| Publisher | Torly AI |
| Repository | https://github.com/torlyai/Schengen-master |
| Licence | MIT |
| Pricing | **Free** |
| Account / sign-in | None |
| Languages | English + 中文 (bilingual UI + README) |

**Coverage:** All TLScontact hosts (`https://*.tlscontact.com/*` is the only host permission in `extension/manifest.json`). Detector heuristics are tuned for the French TLScontact workflow first; Germany/Italy/etc. work the moment a user installs because the matching rule is signal-based, not URL-based.

**Permissions requested** (verbatim from `extension/manifest.json`):

```json
"permissions": ["alarms", "storage", "notifications", "tabs", "scripting"],
"host_permissions": ["https://*.tlscontact.com/*"],
"optional_host_permissions": ["https://api.github.com/*"]
```

The `api.github.com` permission is opt-in and only used by the "Check for updates" button against GitHub Releases — no telemetry, no analytics.

**Notification channels:** desktop notifications via `chrome.notifications` + phone notifications via Telegram bot (configure in Settings → Telegram).

---

## 3. Side-by-side feature matrix

| Capability | VisaReady | TLSContact Booker | Visa Master |
|---|---|---|---|
| Detect slot availability | ✅ | ✅ | ✅ |
| Desktop notification | ✅ (implied) | ✅ (via email) | ✅ |
| Email notification | ✅ | ✅ | ❌ |
| SMS notification | ✅ | ❌ | ❌ |
| Telegram notification | ❌ | ❌ | ✅ |
| **Auto-book on your behalf** | ✅ | ✅ | ❌ (by design) |
| Auto-fill applicant form | ❌ (booking only) | ❌ (booking only) | ❌ |
| Multi-month cycling | ❌ (not advertised) | ❌ (not advertised) | ✅ (opt-in) |
| Pause / resume | ✅ | ✅ (Start Monitoring) | ✅ |
| Multi-applicant | Not shown | Not shown | n/a (you book) |
| Works while you sleep / tab closed | ✅ (server pool) | ✅ (server pool) | ✅ (service worker) |
| Bilingual EN / 中文 | ❌ (EN) | Partial (description mentions AR/ZH) | ✅ |
| No-account install | ❌ | ❌ | ✅ |
| No card on file | ❌ | ❌ | ✅ |
| Doesn't see your TLS password | ❌ (stored locally per them) | Not shown | ✅ (never touched) |
| Open source / auditable | ❌ | ❌ | ✅ MIT |
| Cloudflare-aware polling | Not shown | Not shown — admits "300+ seconds to avoid blocks" | ✅ `chrome.tabs.reload()` preserves cookies + Cloudflare clearance (PRD Appendix C, empirically verified 2026-05-12) |
| Smart polling windows | Not shown | Not shown | ✅ 2 min inside UK release windows (`06:00–09:30`, `23:30–00:30`), 6 min outside |

---

## 4. How each extension actually works

The 173 KiB extension size is the same for both VisaReady and TLSContact Appointment Booker — this is a strong indicator that both are **thin clients** doing the actual scanning and booking work on a remote server. Visa Master is ~3,100 LOC of TypeScript that fits entirely in the browser, with no server dependency.

### 4.1 VisaReady (server-coordinated booking pool)

From `visaready.ai`:
1. Install the extension and sign into TLSContact normally.
2. "VisaReady verifies account health, confirms TLS loads, then activates with card on file."
3. "Browser joins staggered network scanning; auto-books when slot detected."

The "VisaReady network" phrasing — combined with the tiny extension size — means many users' browsers act as a **coordinated polling pool**. When the pool detects a slot, the system selects a user, executes the booking with the stored TLS credentials, and you have 30 minutes to pay TLS's consulate fee. The £29 is then charged only on confirmation.

### 4.2 TLSContact Appointment Booker (single-tab monitor + server billing)

From the listing description: the extension monitors the active TLScontact tab at a configured interval ("**above 300 seconds to avoid blocks**, for Germany 60+ seconds"). When a slot is detected and the user has paid in-app, it books and sends an email. The user has 30 minutes to pay TLS or "the slot will be released."

The explicit "300+ seconds to avoid blocks" guidance is significant: it admits the polling method (likely XHR/fetch interception) is detected and rate-limited by TLScontact's WAF when polling more aggressively.

### 4.3 Visa Master (passive tab reload + local state machine)

From `extension/`:
1. Content script (`src/content/detector.ts`) runs a 3-signal classifier on every page load and DOM mutation: `bookEnabled`, `slotCount>0`, `noSlotsTextAbsent`. Two or more positives = `SLOT_AVAILABLE`.
2. Service worker (`src/background/scheduler.ts`) drives polling via `chrome.alarms` — inside the UK release window every 2 min, outside every 6 min.
3. Polling uses `chrome.tabs.reload()` against the user's already-authenticated tab. This preserves session cookies and Cloudflare clearance, so the request looks like a normal user refresh.
4. State persists in `chrome.storage.local`. The state machine is rehydrated after service-worker eviction; the recent `e0cbf5d` commit adds self-healing for lost alarms.
5. On `SLOT_AVAILABLE`, the user is notified via desktop + (optionally) Telegram. The user navigates to the tab and books manually.

The extension never reads or stores the user's TLS password and never submits forms on the user's behalf. It is, by design, a notifier.

---

## 5. Where Visa Master differs (positioning)

This section is the editorial counterpart to the factual tables above. The five differences below are the ones that matter for a user choosing between these tools.

### 5.1 Trust model

VisaReady and TLSContact Appointment Booker both require the user to authorise an automated agent to act inside their TLScontact session. VisaReady additionally stores a Stripe card and an encrypted TLS password locally. Both are closed-source.

Visa Master never touches credentials, never submits forms, and is MIT-licensed and auditable. The trust contract is the source tree — anyone can read `src/content/detector.ts` and `src/background/scheduler.ts` and confirm the extension does only what it claims.

For users who have been warned by France-Visas itself about unauthorised intermediaries (the portal explicitly cautions about scams), or for the Chinese-speaking audience that has been repeatedly burned by visa intermediaries, this is the difference that matters most. The Chinese-language README exists specifically for that audience.

### 5.2 Cost structure

VisaReady's £29-only-on-success is the cleanest paid model, but the user still pays TLS service + consulate fees on top, and must commit to the booking within 30 minutes of a phone notification — an awkward UX if the alert arrives mid-meeting or in the middle of the night.

TLSContact Appointment Booker's £19.99 / 2 weeks is a flat subscription regardless of outcome.

Visa Master is free forever. The cost is that the user does the booking themselves — which most users would do anyway in front of the consulate fee step.

### 5.3 ToS and account-risk exposure

Both auto-booking extensions submit forms inside a TLScontact session. TLScontact's terms of service prohibit automated agents; users whose accounts are flagged for automation can be locked out — exactly when they most need the slot.

Visa Master polls by reloading the user's own tab at intervals indistinguishable from a user pressing F5. There is no form submission, no header forgery, no scripted click. This is the lowest-risk monitoring approach available to a Chrome extension.

### 5.4 Coverage breadth

VisaReady covers UK → France only at launch (planned: DE, BE, NL, IT, ES, US). TLSContact Booker covers FR/CH/DE/MA "and Beyond". Both depend on each consulate's workflow being explicitly supported by the vendor.

Visa Master's host permission is `*.tlscontact.com/*`, and the detection rule is a generic 3-signal classifier rather than per-country logic. New consulates added by TLScontact tend to work out of the box; only the strings used in the no-slots phrase need updating.

### 5.5 Architecture and resilience

Both competitors are 173 KiB thin clients dependent on a remote service. If their server goes down, you don't get notified.

Visa Master is fully local. The only remote call is the optional GitHub Releases check for new versions. There is no server to go down, no business that can fail, no privacy policy to change.

---

## 6. What our Premium tier will do differently

The Free tier compared above is the **notify-only** version of Visa Master. We are also building a **Premium tier** that does the booking transaction for you — the same job VisaReady and TLSContact Booker do today, but on the trust posture of the Free tier rather than theirs.

The full specification lives in [`09-visa-master-premium-prd.md`](./09-visa-master-premium-prd.md). The summary that matters for this comparison page:

| Question | VisaReady | TLSContact Booker | **Visa Master Premium (planned)** |
|---|---|---|---|
| Auto-books for you? | ✅ | ✅ | ✅ |
| Pricing | £29 success fee | £19.99 / 2 weeks (subscription) | **£19 success fee** |
| Refund if TLS cancels within 24h | ✅ | Not shown | ✅ (one-click in the popup) |
| Scanning architecture | Server-coordinated user pool | Server-backed thin client | **Local-only** — your browser, your scan, no shared network |
| TLS credentials | Stored locally, used for auto-login | Not disclosed | Stored locally (AES-GCM), used for auto-login — disclosed up-front in the activation flow |
| Server data on you | Stripe billing + their pool | Stripe billing + their scan service | Stripe billing only — license JWT issued once, no slot/scan data ever leaves your browser |
| Source code | Closed | Closed | **MIT — same repo as Free** |
| Free tier remains available | n/a (paid only) | "Free + IAP" but core features are paid | **Yes — Free notify-only stays free forever** |

**Three honest framings:**

1. **Trust whiplash is real.** Premium asks the user to store their TLS password locally. Free has always said "never touches credentials". The PRD addresses this head-on by [restating the promise per tier](./09-visa-master-premium-prd.md#112-brand-promise-restatement) — the Free tier's promise does not change, and the Premium tier's promise is differently worded and visibly disclosed at activation. We don't want users to feel they've been "upsold" out of a stronger promise.

2. **We auto-book against TLScontact's terms of service.** This is true of all three products. We say so out loud on the Premium intro tab; the competitors do not. See [PRD §14](./09-visa-master-premium-prd.md#14-compliance-and-tos-posture-premium-specific).

3. **£19 undercuts VisaReady by £10.** That is a deliberate positioning choice, not an unsustainable promotion. The arithmetic works because our Free tier costs us almost nothing to run (no servers), so the Premium margin can absorb a lower price point.

**Status of the Premium PRD:** Draft for review as of 2026-05-13. Milestone schedule lives in [PRD §18](./09-visa-master-premium-prd.md#18-roadmap-and-milestones). Public launch target: **2026-07-15**. Closed beta begins **2026-07-01**.

If you are reading this and want to be notified at beta opens, the simplest signal is to file an issue on the [GitHub repository](https://github.com/torlyai/Schengen-master/issues) — we have no email list yet.

---

## 7. Sources

| Source | Verified |
|---|---|
| VisaReady Chrome Web Store listing — `chromewebstore.google.com/detail/visaready-auto-book-your/plplpdeonhhgbcakkfkpapbonmngjecn` | 2026-05-13 |
| VisaReady homepage — `visaready.ai` | 2026-05-13 |
| VisaReady pricing — `visaready.ai/pricing` | 2026-05-13 |
| TLSContact Appointment Booker for Schengen Visa — `chromewebstore.google.com/detail/tlscontact-appointment-bo/cbkiaocamdmihicmjkpoefhlgiioipmb` | 2026-05-13 |
| TLSContact Booker marketing site — `tlscontact.contact` | 2026-05-13 |
| Visa Master source — `extension/manifest.json`, `extension/README.md`, `src/background/scheduler.ts`, `src/content/detector.ts`, PRD Appendix C in `docs/06-visa-master-chrome-extension-prd.md` | 2026-05-13 |

Web Store metadata changes frequently. If you cite this document in a public post, re-verify the user counts, ratings, and versions on the day of publication.
