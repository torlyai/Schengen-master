# PRD: Visa Master Chrome Extension — Client-Side Appointment Watcher

**Document:** 06-visa-master-chrome-extension-prd.md
**Version:** 1.0
**Date:** 2026-05-12
**Status:** Draft for review
**Owner:** Duke Harewood
**Related docs:**
- `/docs/07-chrome-extension-wireframes.md` — wireframes for every major screen and flow
- `/platform/architecture/02-system-architecture.md` — multi-agent platform architecture (Appointment Agent → §2.2)
- `/platform/research/01-competitive-landscape.md` — competitor scan (§2.4 Visa Warden is the closest analogue)
- `/platform/integrations/03-openclaw-channels.md` — OpenClaw gateway design
- `/platform/privacy/04-privacy-compliance.md` — data tiering and IAA/UPL compliance

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem & Context](#2-problem--context)
3. [Goals, Non-Goals, and Success Metrics](#3-goals-non-goals-and-success-metrics)
4. [Personas and Jobs-To-Be-Done](#4-personas-and-jobs-to-be-done)
5. [Scope: V1 Feature Set](#5-scope-v1-feature-set)
6. [User Stories and Key Flows](#6-user-stories-and-key-flows)
7. [Functional Requirements](#7-functional-requirements)
8. [Non-Functional Requirements](#8-non-functional-requirements)
9. [System Architecture and OpenClaw Integration](#9-system-architecture-and-openclaw-integration)
10. [Detection Strategy](#10-detection-strategy)
11. [Privacy, Security, and Data Handling](#11-privacy-security-and-data-handling)
12. [Compliance, ToS, and Ethical Posture](#12-compliance-tos-and-ethical-posture)
13. [Open-Source Strategy](#13-open-source-strategy)
14. [Reference Implementations and Build-vs-Fork Decision](#14-reference-implementations-and-build-vs-fork-decision)
15. [Technical Stack and Tooling](#15-technical-stack-and-tooling)
16. [Distribution and Release Plan](#16-distribution-and-release-plan)
17. [Risks, Mitigations, and Open Questions](#17-risks-mitigations-and-open-questions)
18. [Roadmap and Milestones](#18-roadmap-and-milestones)
19. [Appendices](#19-appendices)

---

## 1. Executive Summary

The Visa Master platform (see `02-system-architecture.md`) is designed as a multi-agent Schengen visa assistant operating through WhatsApp and Slack via the OpenClaw gateway. The Appointment Agent component is currently specified to use server-side Playwright/Selenium to monitor TLScontact and VFS Global for appointment slots. Empirical evidence — including the slot-monitor we built on 2026-05-12 against TLScontact Manchester — shows that this approach fights against the very thing that makes it work: TLScontact and VFS sit behind Cloudflare bot protection, enforce aggressive rate limits (TLScontact's own customer service tells applicants to refresh "no more than three times per day" to avoid being blocked), and have explicit anti-automation T&Cs.

This document proposes a complementary component: a **privacy-first, open-source Chrome extension** that performs the appointment monitoring **inside the user's already-logged-in browser session**. The extension reports availability events back to the Visa Master agent runtime through the OpenClaw gateway, treating the user's browser as another channel/node in the existing architecture. The extension does not handle credentials, does not auto-book, and does not bypass any anti-bot measure — it simply automates what an applicant would otherwise do manually (refresh the page on a polite cadence and shout when something appears).

V1 scope is intentionally narrow: **slot detection and notification only**. Form-fill, auto-attach, and auto-booking are explicitly deferred (see §17 for the rationale). The extension is released under an MIT/Apache 2.0 license to maximize trust through auditability — a deliberate echo of Visa Warden's positioning in the competitive landscape (`01-competitive-landscape.md` §2.4) and an explicit rejection of the closed-source, payment-handling extensions that have shown mixed safety signals on the Chrome Web Store.

The headline insight: a Chrome extension running in the user's real browser is not merely a privacy upgrade over server-side scraping — it is a *reliability* upgrade. The user's browser already passes Cloudflare's bot fingerprinting, already holds the authenticated session, and already has the correct CAPTCHA history. The extension does not have to defeat anti-bot measures; it simply has to politely participate in a flow that the user is already authorized to do.

---

## 2. Problem & Context

### 2.1 The appointment booking bottleneck

The Schengen visa appointment market is dominated by two outsourced service providers: VFS Global and TLScontact. For UK-resident applicants applying for a French visa (the prototypical user case for V1), appointments are issued exclusively through TLScontact's UK centres (Manchester, London, Edinburgh). Slot availability is the binding constraint on the entire visa journey: a perfectly prepared application is worthless without an appointment, and slots release in unpredictable batches that are typically consumed within seconds.

From the 2026-05-12 monitoring session and corroborating community reports:

- TLScontact UK slot releases concentrate in **06:00–09:00 UK time** and around **23:30–00:30 UK time**, plus cancellation-driven drops at unpredictable times.
- Slots typically disappear in **under 60 seconds** during peak season.
- Manual refresh frequencies above ~3 per day trigger Cloudflare-backed temporary blocks lasting several hours.
- TLScontact has publicly stated that **15% of inbound traffic is auto-blocked as bot/malicious** (see `01-competitive-landscape.md` §2.4 and TLScontact's own security disclosures).

### 2.2 Why client-side monitoring beats server-side scraping for this domain

The Visa Master architecture (`02-system-architecture.md` §2.2) specifies the Appointment Agent as a server-side worker using Playwright + Celery beat, with provisions for CAPTCHA-solving APIs, proxy rotation, and IP blocking mitigation. This approach inherits four structural problems:

| Problem | Server-side scraping | Client-side extension |
|---|---|---|
| Cloudflare fingerprinting | Has to defeat it on every poll | Already passed by the user's real browser |
| Session/cookie management | Has to receive and refresh user's session tokens (high-risk credential surface) | Uses the session that's already in the user's browser, never copied |
| IP reputation | One IP serving many users — gets flagged | Each user is one IP — indistinguishable from a regular visitor |
| ToS exposure | Operating a "bot" against TLScontact at scale | Each user is automating their own already-permitted access |

The client-side approach is also operationally cheaper: no proxy pools, no CAPTCHA solver subscriptions, no dedicated scraping nodes. It does not replace the server-side path — there are legitimate use cases for centralized monitoring (e.g., users who can't keep a browser open) — but it should be the **default path** for users who can install a browser extension.

### 2.3 The opportunity inside the Visa Master roadmap

`01-competitive-landscape.md` §12 (Gap Analysis) explicitly identifies the missing piece as an **end-to-end Schengen assistant** that combines appointment booking with document preparation, review, and tracking. Today, those are two separate ecosystems. Visa Warden is the only competitor approaching the client-side model, but it operates standalone with no integration into a broader agent platform. A Chrome extension that is **architecturally a node of the Visa Master agent runtime** is differentiated: users get a real conversational visa copilot (via WhatsApp/Slack), with the slot-monitoring component doing the dirty work locally in their browser, all within one product.

---

## 3. Goals, Non-Goals, and Success Metrics

### 3.1 Goals

1. **Detect TLScontact slot availability** with median detection latency under 5 minutes from when a slot becomes visible to a human refreshing the same page.
2. **Respect Cloudflare rate limits**: stay below the threshold that triggers temporary blocks (empirical target: max 1 page-refresh per 3 minutes, lower outside release windows).
3. **Zero credential handover** to the Visa Master backend, OpenClaw gateway, or any third party.
4. **Integrate with OpenClaw as a first-class node** so the broader agent runtime can subscribe to slot events without owning the scraping problem.
5. **Open-source under MIT or Apache 2.0** with reproducible builds, so technical users can audit before installing.
6. **Ship to Chrome Web Store** with a passing Manifest V3 review.
7. **Multilingual detection**: Chinese, English, French, Arabic, Hindi (matching the highest-volume Schengen applicant populations per `01-competitive-landscape.md` §1).

### 3.2 Non-Goals (V1)

1. **No auto-booking.** The extension never clicks "Book" or submits any form. Detection only.
2. **No form auto-fill.** Form filling lives in a separate V2 component with its own risk profile.
3. **No CAPTCHA solving.** If Cloudflare escalates to an interactive challenge, the extension surfaces it to the user and pauses; it does not call any CAPTCHA-solving API.
4. **No proxy or IP rotation.** The user's own IP is the IP. Period.
5. **No multi-account support.** One user, one TLS account, one browser.
6. **No payment handling.** The extension never touches credit card data, ever.
7. **No VFS Global support in V1.** France via TLScontact is the focused beachhead. VFS comes in V1.1.
8. **No Firefox/Safari/Edge build in V1.** Chromium-only initially.

### 3.3 Success metrics

| Metric | V1 target | How measured |
|---|---|---|
| Detection latency (median) | < 5 minutes vs. ground truth | Synthetic test slots + user reports |
| False positive rate (claims slot exists when none) | < 1% of alerts | User-reported false alerts via in-extension feedback |
| False negative rate (misses a slot that was real) | < 5% per release window | Cross-check with manual observers during release windows |
| Cloudflare block rate (% of polling sessions hitting a CF challenge) | < 5% | Extension telemetry (counted, no PII) |
| Active user retention (D7) | > 40% | Anonymous installation telemetry |
| Star rating on Chrome Web Store | ≥ 4.5 | After 50+ reviews |
| GitHub stars | 100+ within 90 days | Repo metrics |
| Reported account suspensions caused by the extension | 0 | User reports + GitHub issues |

---

## 4. Personas and Jobs-To-Be-Done

### 4.1 Primary persona: the urgent applicant

- 25–55 years old, applying for a Schengen visa (typically France, Italy, Germany, Spain) from the UK.
- Has a tight travel timeline (job interview, family event, conference, holiday booked).
- Already logged into TLScontact and stuck on the "no slots available" page.
- Tech-comfortable enough to install a browser extension but not technical.
- Speaks one of: English, Chinese, Arabic, Hindi, French, Spanish, Portuguese.
- Anxious — has potentially already tried other bots or paid services and been burned or scared off.

**JTBD:** *When I am locked out of appointment slots, I want the moment a slot opens to find me wherever I am, so I can book it in under a minute without sitting at my laptop refreshing manually for 8 hours a day.*

### 4.2 Secondary persona: the Visa Master power user

- Already an active Visa Master user via WhatsApp or Slack.
- Has completed document collection and is in the "monitoring" phase.
- Wants the monitoring to be invisible — they live in WhatsApp, not in their browser.

**JTBD:** *When my Visa Master agent is helping me through my whole application, I want appointment monitoring to be just another thing the agent quietly handles, not a separate tool I have to manage.*

### 4.3 Tertiary persona: the immigration consultant (future)

- Helps several clients at once.
- Wants to install the extension on each client's browser and route alerts to a shared channel.
- Out of scope for V1; design must not foreclose this.

---

## 5. Scope: V1 Feature Set

V1 ships exactly the following capabilities, no more:

1. **Manifest V3 Chrome extension** for Chromium-based browsers (Chrome, Edge, Brave, Arc, Opera).
2. **TLScontact UK France-visa appointment page detection** for the three UK centres (Manchester, London, Edinburgh) — auto-detected from the page URL.
3. **Polite polling** of the booking page on a configurable cadence (default 4 min, adjustable 2–15 min, with smart cadence around known release windows).
4. **Multilingual slot detection** by parsing the page DOM and text for known empty-state strings in EN, ZH, FR, AR, HI, ES, PT (initial set, extensible via locale files).
5. **In-extension UI** showing: current monitoring status, last check time, next check time, history of checks (last 24 h, no PII), pause/resume button.
6. **Local notifications** (browser Notification API + sound) on slot detection.
7. **Optional OpenClaw integration**: extension can be paired to an OpenClaw gateway via QR code or device token; slot events are emitted as OpenClaw events for downstream agents to consume.
8. **Logout detection**: if the user gets logged out, the extension stops polling, surfaces a clear "you need to log back in" notification, and waits.
9. **Cloudflare escalation handling**: if an interactive challenge appears, the extension stops polling and surfaces a notification asking the user to handle the challenge once, then resume.
10. **Telemetry opt-in**: anonymous aggregate stats (no URLs, no PII) for debugging — strictly opt-in.

Everything else (auto-fill, document upload, multi-provider, multi-account, Firefox build) is out of V1.

---

## 6. User Stories and Key Flows

### 6.1 First-run installation and pairing

```
Story: As a new user, I want to install the extension and start monitoring my open
TLScontact booking page in under 2 minutes.

Acceptance:
  1. User installs from Chrome Web Store.
  2. On install, a welcome page opens explaining what the extension does and the rules
     (it does not enter credentials; it does not book; it runs in your browser).
  3. User explicitly accepts a one-screen consent that lists exactly what data is
     read from the page (no raw HTML transmitted off-device unless OpenClaw is paired
     and user opts in).
  4. User navigates to https://visas-fr.tlscontact.com/workflow/appointment-booking/...
     while logged in.
  5. Extension auto-detects the page, badges its icon "MONITORING", and starts polling.
  6. Total elapsed time from install to first poll: < 60 seconds.
```

### 6.2 Slot detected — local-only mode

```
Story: As a user not connected to OpenClaw, I want to be notified the instant a slot
opens, regardless of which app I'm in.

Acceptance:
  1. Extension detects state change: empty-state text gone, book button enabled,
     slot DOM elements present.
  2. Extension fires:
     a. Desktop notification: "TLScontact slot detected — click to view"
     b. Optional sound (user setting)
     c. Tab bell-ringing (favicon swap + tab title change)
  3. Clicking the notification focuses the already-open TLS tab — does NOT navigate
     anywhere, does NOT click anything.
  4. Extension continues polling; if user books the slot, the next poll will see the
     normal post-booking state and the extension stops polling.
```

### 6.3 Slot detected — OpenClaw-paired mode

```
Story: As a Visa Master user, I want a slot-detected event to flow through OpenClaw
to my WhatsApp/Slack so my agent can react.

Acceptance:
  1. Same local detection as 6.2.
  2. In addition: extension emits an OpenClaw event:
     {
       "type": "event",
       "event": "appointment.slot.available",
       "payload": {
         "provider": "tlscontact",
         "centre_code": "gbMNC2fr",
         "detected_at_utc": "2026-05-12T07:13:42Z",
         "snapshot_hash": "sha256:…",
         "evidence": {
           "no_slots_text_present": false,
           "book_button_enabled": true,
           "slot_count": 3
         }
       }
     }
  3. Visa Master agent receives the event, sends a templated WhatsApp message or
     Slack DM to the user.
  4. The page URL is included as plain text; no auth tokens or cookies are ever sent.
```

### 6.4 Cloudflare challenge appears mid-poll

```
Story: As a user, I want to know immediately if Cloudflare is challenging me so I
can handle it once and resume.

Acceptance:
  1. Extension detects either: page title "Just a moment...", body text
     "Performing security verification", or known CF challenge selectors.
  2. Extension pauses all polling.
  3. Extension surfaces a non-dismissible badge: "Cloudflare challenge — please
     interact with the tab to clear it."
  4. Extension resumes polling once the page resolves to the booking workflow URL.
  5. If user does not resolve within 15 minutes, extension stops fully and emails/
     notifies via OpenClaw if paired.
```

### 6.5 User logged out

```
Story: As a user, I should never poll a logged-out page (it produces false negatives
and wastes Cloudflare budget).

Acceptance:
  1. Extension detects URL redirect to public homepage, presence of login form,
     or any of the localized strings for "Sign In" / "登录" / "Connexion" /
     "تسجيل الدخول" / etc.
  2. Extension stops polling immediately.
  3. Extension fires a notification: "You're logged out of TLScontact — log back
     in to resume monitoring."
  4. Extension auto-resumes on next page load if it detects an authenticated session.
```

---

## 7. Functional Requirements

### 7.1 Page identification (FR-1)

The extension MUST identify the user's intent to monitor a specific booking page by URL pattern matching against the TLScontact appointment-booking workflow:

```
https://visas-fr.tlscontact.com/workflow/appointment-booking/{centreCode}/{caseId}
```

Where `centreCode` matches `gbMNC2fr|gbLON2fr|gbEDI2fr` (Manchester / London / Edinburgh, France visa). Other Schengen-country variants (e.g., `…2it` for Italy) should be detected but routed through a flag so V1 only acts on France. The extension MUST NOT activate on any non-matching URL.

### 7.2 Polling cadence (FR-2)

Default polling cadence: every 4 minutes. The cadence is **dynamic**:

| Window (UK local time) | Cadence |
|---|---|
| 05:30 – 09:30 (morning release window) | 2 min |
| 23:30 – 00:30 (midnight release window) | 2 min |
| All other times | 6 min |
| After 3 consecutive errors | 15 min backoff |
| After 1 Cloudflare challenge | stop; await user |

User can override the default with a min of 2 min and a max of 30 min. Refresh is performed via `chrome.tabs.reload()` on the monitored tab (preserves cookies and CF clearance), **not** a full navigation.

### 7.3 Detection signals (FR-3)

For each poll, the content script MUST evaluate the following signals and combine them into a single state classification:

```
State := SLOT_AVAILABLE
       | NO_SLOTS
       | CLOUDFLARE_CHALLENGE
       | LOGGED_OUT
       | UNKNOWN
```

Decision logic:

```
if (cloudflare detected) → CLOUDFLARE_CHALLENGE
else if (logged out detected) → LOGGED_OUT
else if (no_slots_text present) AND (book_button disabled) → NO_SLOTS
else if (book_button enabled) OR (slot_count > 0) → SLOT_AVAILABLE
else → UNKNOWN  // surfaces in extension UI for user verification
```

`no_slots_text` is matched against a locale dictionary (see §10 for the initial dictionary).

### 7.4 Notification (FR-4)

On `NO_SLOTS → SLOT_AVAILABLE` transition, the extension MUST:

1. Fire a Chrome desktop notification with title "Slot available — TLScontact <centre>" and body "Detected at HH:MM. Click to open."
2. Play an optional sound (user setting, default ON).
3. Change favicon and tab title on the monitored tab.
4. If paired to OpenClaw, emit `appointment.slot.available` event (per §6.3).
5. Log the event to the extension's local history (no off-device transmission unless paired).

Notifications MUST NOT fire on `UNKNOWN → SLOT_AVAILABLE` without user confirmation in the extension popup, to avoid false-positive notification fatigue from layout changes.

### 7.5 Pairing with OpenClaw (FR-5)

Pairing is optional and explicit. The pairing flow:

1. User clicks "Pair with OpenClaw" in extension settings.
2. Extension prompts for: gateway URL (default `ws://127.0.0.1:18789`) and a one-time pairing token.
3. Extension performs an OpenClaw handshake (per `03-openclaw-channels.md`) with the role `Node` and capability declaration `appointment-watcher`.
4. On successful pairing, the extension stores the device fingerprint + token in `chrome.storage.local` (encrypted using a key derived from a user-set passphrase via WebCrypto).
5. Subsequent connections reuse the stored credentials; user can unpair at any time.

### 7.6 Telemetry (FR-6)

Telemetry is OFF by default. If enabled, the extension transmits the following — and only the following — to a Visa Master telemetry endpoint:

- Anonymous install ID (random UUID, regenerable, never tied to any account)
- Extension version
- Browser version (coarse: "Chrome 124+", not full UA string)
- Aggregate count of polls, slot detections, Cloudflare hits, and errors **per 24-hour window**
- No URLs, no page content, no detected dates, no user identifiers

### 7.7 Settings UI (FR-7)

The extension popup MUST surface, at minimum:

- Current monitoring status (active, paused, error, logged out, CF blocked)
- Last check time and result
- Next check time
- Pause / resume button
- Open monitored tab button
- Link to settings page (cadence, sound, OpenClaw pairing, telemetry, language)
- Link to GitHub repo and feedback

---

## 8. Non-Functional Requirements

### 8.1 Performance

- Extension idle memory footprint: < 30 MB.
- Polling adds < 100 ms latency to the user's normal page load.
- Service worker wake-up time: < 200 ms median.

### 8.2 Reliability

- Extension MUST survive service worker eviction (Manifest V3 quirk) without losing schedule state.
- All scheduled polls are backed by `chrome.alarms` not `setTimeout`, so eviction doesn't drop them.
- State persists in `chrome.storage.local` and is restored on service worker spin-up.

### 8.3 Compatibility

- Chromium ≥ 120 (Manifest V3).
- macOS, Windows, Linux. Same code, no platform-specific paths.

### 8.4 Internationalization

- All extension UI strings localized via Chrome's `_locales/` mechanism.
- Detection dictionary localized in a separate `detection-locales/` directory, hot-reloadable so new locales can ship via remote config without a Chrome Web Store re-review.

### 8.5 Accessibility

- Keyboard-navigable popup.
- Screen-reader compatible (ARIA labels on status badges).
- High-contrast mode support.

### 8.6 Security

- Content Security Policy (Manifest V3 default + strict-dynamic).
- No `unsafe-eval`, no `unsafe-inline`.
- All network requests pinned to known hosts (TLScontact domains, configured OpenClaw gateway, configured telemetry endpoint if opted in).

### 8.7 Compliance with privacy framework

The extension MUST adhere to the data tier classifications in `04-privacy-compliance.md`:

- **Tier 1 data** (passport numbers, payment data, etc.) — **the extension never reads or transmits these.** It does not access form fields on the TLScontact page.
- **Tier 2 data** (names, DOBs, etc.) — same, never read.
- **Tier 3 data** (appointment status, dates) — stored locally only; transmitted to OpenClaw only when paired and user-permitted.
- **Tier 4 data** (booking URL, centre code) — fine to transmit and log.

---

## 9. System Architecture and OpenClaw Integration

### 9.1 Topology

```
+----------------------------------------------------------+
|                User's Chrome browser                     |
|                                                          |
|  +----------------------+      +---------------------+   |
|  | TLScontact tab       |◄────►| Content Script      |   |
|  | (authenticated)      |      | (DOM polling,       |   |
|  +----------------------+      |  state detection)   |   |
|                                +----------┬----------+   |
|                                           │              |
|                                +----------▼----------+   |
|                                | Service Worker      |   |
|                                | - chrome.alarms     |   |
|                                | - state machine     |   |
|                                | - notification      |   |
|                                | - OpenClaw client   |   |
|                                +----------┬----------+   |
+-------------------------------------------┼--------------+
                                            │ WebSocket
                                            │ (optional)
                                            ▼
                              +---------------------------+
                              |   OpenClaw Gateway        |
                              |   (per 03-openclaw-       |
                              |    channels.md)           |
                              +-------------┬-------------+
                                            │
                              +-------------▼-------------+
                              |   Visa Master Agent       |
                              |   Runtime (Appointment    |
                              |   Agent + others)         |
                              +---------------------------+
                                            │
                              +-------------▼-------------+
                              |   WhatsApp / Slack        |
                              |   (user notification)     |
                              +---------------------------+
```

The Chrome extension is a peer of WhatsApp and Slack in the OpenClaw model — it is a *node* that emits events and accepts a small surface of inbound commands.

### 9.2 OpenClaw role and capabilities

Per `03-openclaw-channels.md` and the OpenClaw protocol:

- **Role:** `Node`
- **Capability declaration:** `appointment-watcher`
- **Tools exposed (inbound from agent → extension):**
  - `start_monitor(url, cadence?)` — begin watching a specific URL
  - `stop_monitor()` — pause
  - `set_cadence(seconds)` — adjust polling
  - `get_status()` — return current state machine snapshot
  - `request_screenshot()` — capture a screenshot of the monitored tab (only with user prompt — never silent)
- **Events emitted (outbound from extension → agent):**
  - `appointment.slot.available`
  - `appointment.slot.unavailable`
  - `appointment.session.expired`
  - `appointment.cloudflare.challenge`
  - `appointment.error`

### 9.3 Trust boundary

The OpenClaw gateway and Visa Master backend are **untrusted from the extension's perspective**. The extension authenticates the gateway via the pairing token and verifies the host against a user-configured allowlist. Inbound commands from the gateway are scoped to the small tool surface above — there is no general `execute_javascript` or `navigate_to_arbitrary_url` tool. This is by design: even a compromised gateway cannot exfiltrate user data through the extension.

### 9.4 Failure modes and graceful degradation

| Failure | Extension behavior |
|---|---|
| OpenClaw gateway unreachable | Continue polling and notifying locally; queue events for retry on reconnect (max 100 queued, FIFO). |
| Gateway authentication fails | Disable OpenClaw mode, surface error to user, continue local monitoring. |
| Monitored tab closed | Pause polling, surface notification, auto-resume if user reopens the URL within 1 hour. |
| Service worker evicted | Re-spin on next alarm; state restored from `chrome.storage.local`. |
| Telemetry endpoint down | Silently drop telemetry batches (do not retry forever). |

---

## 10. Detection Strategy

### 10.1 Multi-signal classification

Detection is **not** a single string match. Five independent signals are evaluated per poll:

1. **Empty-state text presence**, matched against the locale dictionary.
2. **Book button state**: presence and `disabled` attribute on the localized "Book" / "预约" / "Réserver" / "Reservar" / "حجز" button.
3. **Slot element count**: count of DOM elements matching common slot CSS class patterns (`[class*="slot"]`, `[class*="appointment-time"]`, etc.) minus known no-op patterns (`[class*="no-slot"]`, `[class*="empty"]`).
4. **Calendar widget state**: presence of a calendar widget with at least one enabled date cell.
5. **Network signal**: in browsers that allow it, monitor outgoing XHR/fetch for the availability endpoint and inspect the response — but only as a *confirmation* signal, never the sole signal, because endpoint shapes can change.

State is classified by the combination, not any single signal. This is robust against TLScontact UI changes and avoids false positives from minor DOM tweaks.

### 10.2 Initial locale dictionary

Located at `src/detection/locales/`, one file per language:

| Locale | Empty-state phrase fragment | Book button text |
|---|---|---|
| en-GB | "no more available appointment slots" / "no appointments available" | "Book" / "Reserve" |
| zh-CN | "我们目前没有更多可用的预约时段" / "目前没有可预约的名额" | "预约" |
| fr-FR | "aucun créneau" / "aucune disponibilité" | "Réserver" |
| es-ES | "no hay citas disponibles" | "Reservar" |
| pt-PT | "sem horários disponíveis" | "Marcar" |
| ar-SA | "لا توجد مواعيد متاحة" | "حجز" |
| hi-IN | "कोई स्लॉट उपलब्ध नहीं" | "बुक" |

Locales are stored as JSON, can be patched without re-shipping the extension via a signed remote-config blob (see §16 for the trust model around remote config).

### 10.3 Anti-fragility

- Each locale entry has multiple candidate phrases — match if any.
- A signal that has been wrong (false positive) more than 3 times in a 24-hour window is automatically de-weighted.
- Snapshot hashes are stored locally so users can compare "what the page looked like when the extension said X" if a false positive is reported.

---

## 11. Privacy, Security, and Data Handling

### 11.1 Data flow audit

| Data | Where it lives | Where it leaves the device |
|---|---|---|
| Page DOM | Read by content script, in-memory only | Never |
| Authentication cookies | Owned by Chrome, never read by extension | Never |
| Form field values | Not read by extension | Never |
| Detection result (state classification) | `chrome.storage.local` | Only to OpenClaw if paired, only as structured event |
| Booking page URL | Local storage | Only to OpenClaw if paired |
| Centre code, locale, cadence settings | Local storage | Never (or to OpenClaw if paired) |
| Telemetry counters | In-memory + buffered to telemetry endpoint | Only if telemetry opt-in is ON |

### 11.2 Permissions justification (Manifest V3)

```json
{
  "permissions": [
    "alarms",          // Scheduled polling
    "notifications",   // Desktop notifications on slot detection
    "storage",         // Local settings and state
    "tabs"             // Reload the monitored tab (scoped via host_permissions)
  ],
  "host_permissions": [
    "https://visas-fr.tlscontact.com/*"
  ],
  "optional_host_permissions": [
    "ws://localhost:18789/*",
    "wss://*.openclaw.ai/*"
  ]
}
```

The host permission is **narrow** — only the TLS France-visa domain. Adding more centres or providers will require a new permission grant, which we surface clearly. This is a deliberate friction to avoid permission creep.

### 11.3 No third-party requests

- No analytics SDKs (Google Analytics, Mixpanel, etc.).
- No CDN-loaded fonts or scripts.
- All assets bundled at build time.
- The extension's network surface is exactly: TLScontact polling (via the existing tab, not new fetches), optionally OpenClaw gateway, optionally telemetry endpoint.

### 11.4 Encrypted at rest

- Pairing tokens and OpenClaw config are encrypted with a key derived from a user-set passphrase via WebCrypto (`PBKDF2 → AES-GCM`). If no passphrase is set, the extension operates without OpenClaw pairing (local-only mode).

### 11.5 Alignment with `04-privacy-compliance.md`

- The extension is **not** a data controller of Tier 1 or Tier 2 PII because it never reads or transmits any.
- For users in OpenClaw-paired mode where slot events flow to the Visa Master backend, the controller is the existing Visa Master entity — already DPIA'd and ICO-registered.
- A short DPIA addendum covering the extension specifically should be authored (see §17).

---

## 12. Compliance, ToS, and Ethical Posture

### 12.1 TLScontact T&Cs

TLScontact's terms prohibit automated access. The extension takes the following positions:

1. **The extension is automating the user's own access**, not third-party access. Each instance corresponds to one applicant on one device.
2. **Polling cadence is well below the threshold** TLScontact's own customer service describes as acceptable for manual users (we cap at 2 minutes minimum; their guidance is "no more than 3/day", which we exceed, but with a single legitimate-application context per device rather than a botnet).
3. **No CAPTCHA bypass, no anti-fingerprinting, no IP rotation, no session injection.** The extension only does what an applicant could do by holding F5.

We acknowledge that strict reading of T&Cs could classify the extension as prohibited automation. The extension surfaces this clearly in the install dialog:

> *"This extension automates the act of refreshing your TLScontact appointment page. TLScontact's terms of service may classify any automation as prohibited. By using this extension, you accept the small risk that TLScontact could suspend your account if they choose to enforce strictly. We minimize that risk by polling no more often than a polite human would. Use at your own risk."*

### 12.2 Cloudflare ToS

We do not bypass Cloudflare. If Cloudflare presents a challenge, we stop and ask the user. This is the explicit difference between "automation" (which Cloudflare blocks) and "scheduled human-equivalent refresh" (which Cloudflare tolerates).

### 12.3 IAA / UPL compliance

Per `04-privacy-compliance.md` §6, the platform must avoid "immigration advice." The Chrome extension provides **no advice** — it only reports the binary state of a webpage. There is no risk of UPL drift because the extension does not parse content, summarize, or recommend.

### 12.4 Chrome Web Store policies

Manifest V3, minimal permissions, narrow host permissions, clear privacy disclosure in the listing, screenshots showing exactly what it does, no payment handling. We expect to pass review on first submission.

### 12.5 Open-source ethical disclosure

The README will explicitly state:

- What the extension does and does not do.
- The ToS risk and how we mitigate it.
- That users should not use it to violate any law.
- That maintainers are not liable for misuse.

---

## 13. Open-Source Strategy

### 13.1 License

**MIT.** Permissive, well-understood, compatible with the rest of the Visa Master stack. Apache 2.0 is acceptable if the patent grant is preferred; MIT keeps the bar low for contributors.

### 13.2 Repository

- GitHub org: `visa-master` (to be created) — repo `visa-master/chrome-extension`.
- Public from day 1.
- CODEOWNERS file with maintainer rotation.
- CONTRIBUTING.md with a clear contributor flow and locale-contribution shortcut (locales are the easiest first PR).

### 13.3 Governance

V1: benevolent dictator model with Duke Harewood as initial maintainer. V2+: form a small steering committee if external contributors emerge with sustained quality.

### 13.4 Marketing and trust positioning

Compared to Visa Warden (the closest analogue per `01-competitive-landscape.md` §2.4), the differentiator is:

1. **Open-source** (Visa Warden is closed).
2. **No payment handling**, ever (some competitors handle TLS payment).
3. **Architectural integration** with a broader visa AI agent platform, not just a one-off tool.
4. **Multilingual from day 1**.

These are explicit talking points in launch comms.

---

## 14. Reference Implementations and Build-vs-Fork Decision

### 14.1 Existing open-source / public references

| Repo / Product | Language / Tech | Useful as | Risk |
|---|---|---|---|
| [s4m111h/Booking-Appointment-in-TLScontact](https://github.com/s4m111h/Booking-Appointment-in-TLScontact) | Python + Selenium | Reference for detection signals and CSS selectors on TLScontact | Server-side; license unclear |
| [israr-ulhaq/tls_contact_visaBot](https://github.com/israr-ulhaq/tls_contact_visaBot) | Python + Selenium | Same | Same |
| [bilaltosungit/schengen-visa-appointment-bot](https://github.com/bilaltosungit/schengen-visa-appointment-bot) | Python + Selenium | Detection logic across multiple providers | Server-side architecture, not directly portable |
| [Ed1123/us-visa-bot](https://github.com/Ed1123/us-visa-bot) | Python + Telegram | Notification pattern for Telegram | Not the same provider, just the pattern |
| [Visa Warden](https://visawarden.com/) | Chrome extension, closed-source | Design reference — UX, permission model, value proposition | Cannot fork; can only learn from |
| [TLSContact Appointment Booker](https://chromewebstore.google.com/detail/cbkiaocamdmihicmjkpoefhlgiioipmb) | Chrome extension, closed-source | Anti-pattern — has mixed safety signals, payment handling, do NOT model after | Avoid mimicking |
| [VFS Appointment Monitor](https://chromewebstore.google.com/detail/khpgjolmmmmjglkjjeidgillmidlbkje) | Chrome extension | Pattern for VFS (relevant in V1.1) | Closed-source |
| [Plasmo](https://plasmo.com/) | Framework | MV3 boilerplate | None — recommend adopting |
| [WXT](https://wxt.dev/) | Framework | MV3 boilerplate | None — recommend evaluating |

### 14.2 Recommendation: build fresh, reference Python repos for selectors

There is no Chrome MV3 OSS extension that's both (a) clean enough to fork and (b) license-compatible with MIT distribution. The Python Selenium repos are useful for selectors and detection logic but the architecture is wrong (server-side, full browser automation). The closed-source Chrome extensions teach UX patterns but cannot be forked.

**Build fresh on WXT or Plasmo**, with the following code-borrowed-from-references:

1. Selectors and locale dictionary inspired by the Python repos (license-respecting: re-derived rather than copy-pasted, and credited in the LICENSE if any code is reused verbatim).
2. UX patterns inspired by Visa Warden's badge-driven popup model (no code reuse — visual inspiration only).
3. Manifest V3 patterns from official Chrome documentation (public, well-licensed).

### 14.3 Estimated build effort

| Phase | Duration | Comment |
|---|---|---|
| Scaffold + Manifest V3 + popup UI | 1 week | WXT or Plasmo accelerates this |
| Detection content script + locale dictionary (3 locales) | 1 week | Reuse signals from our 2026-05-12 prototype |
| Polling + alarms + state machine + notifications | 1 week | |
| OpenClaw client integration | 1 week | Depends on stable OpenClaw protocol spec |
| Settings page, telemetry, i18n full locale set (7 locales) | 1 week | Locales are the long tail; community contribution path |
| Hardening, automated tests, Chrome Web Store submission | 1 week | |
| **Total** | **~6 weeks, 1 developer** | |

This compares favorably to the 3-week server-side appointment agent estimate in `02-system-architecture.md` §3.6, with the upside that this work also eliminates the need for the proxy / CAPTCHA / IP-management work in that estimate.

---

## 15. Technical Stack and Tooling

| Concern | Choice | Rationale |
|---|---|---|
| Framework | WXT (preferred) or Plasmo | Manifest V3 boilerplate, HMR, TS-first |
| Language | TypeScript (strict) | Type safety on a small surface |
| UI | React + Tailwind | Standard, fast, lots of contributor familiarity |
| State | Zustand or Redux Toolkit | Light, persistent via `chrome.storage.local` |
| Testing | Vitest + Playwright (for integration tests against a fixture TLS page) | Standard |
| Linting | Biome | Faster than ESLint; replaces ESLint + Prettier |
| CI | GitHub Actions | Build, test, lint, type-check, package |
| Release | GitHub Releases + Chrome Web Store API for auto-publishing | |
| Telemetry endpoint (if opted in) | Plausible or a self-hosted Umami instance — both privacy-first | No Google Analytics |
| Locale management | Crowdin or simple JSON files in repo | Crowdin if we get community contributors |

---

## 16. Distribution and Release Plan

### 16.1 Channels

- **Chrome Web Store** — primary distribution. Public listing once V1 passes review.
- **GitHub Releases** — `.crx` packages for sideload, signed with extension key for reproducibility.
- **Edge Add-ons** — same artifact, second submission.

### 16.2 Versioning

Semantic versioning. V1.0.0 is the public release. Locale-only patches ship as 1.0.x. Detection-logic changes as 1.x.0.

### 16.3 Remote config

Locale dictionary and detection-signal weights are fetched on extension startup from a signed JSON blob hosted at a fixed URL (e.g. `https://visa-master.org/config/detection-v1.json`), signed with an Ed25519 key whose public counterpart is bundled in the extension. This lets us roll out new locales and detection tweaks without re-shipping. The signing scheme is what makes this safe — without the matching signature, the extension refuses the config.

### 16.4 Beta program

Pre-release versions distributed to opted-in users via GitHub Releases for two weeks before each Chrome Web Store push.

---

## 17. Risks, Mitigations, and Open Questions

### 17.1 Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| TLScontact changes DOM and breaks detection | High | High | Multi-signal classifier (§10), remote-configurable locale dictionary, snapshot hash for community-reported false positives |
| Cloudflare escalates to interactive challenges every poll | Medium | High | Stop-and-notify behavior (§7.4), conservative default cadence |
| TLScontact suspends accounts using the extension | Low–Medium | Very High | Polite cadence, clear user disclosure, no fingerprint masking, single-user-per-IP model |
| Chrome Web Store rejects on first submission | Medium | Medium | Narrow permissions, clear privacy disclosure, demo screencast in submission |
| Manifest V3 service worker eviction breaks scheduled polls | Medium | Medium | Use `chrome.alarms`, persist all state in storage |
| Open-source fork by bad actor that adds malicious payload | Low | High | Reproducible builds, signed releases, prominent badge linking to verified Web Store listing |
| User confused about what the extension does vs. does not do | High | Medium | Welcome-page onboarding, narrow popup UI, README clarity |
| Competitor (Visa Warden) clones the OpenClaw integration | Low | Low | Embrace — the open-source posture *invites* this; differentiator is the integrated platform |

### 17.2 Open questions for product/engineering review

1. Should V1 support multiple TLS centres at once (Manchester + London + Edinburgh) or strictly one at a time? (Recommendation: one at a time; user can change.)
2. What's the exact OpenClaw event schema for `appointment.slot.available`? Needs alignment with the Appointment Agent's expected input schema.
3. Should locales be in-repo or in remote config from day 1? (Recommendation: in-repo for V1.0, migrate to remote config for V1.1 once we have signing infra.)
4. What's the policy on accepting community PRs that add new providers (e.g., VFS Global)? Need to define a quality bar before V1.1.
5. Should the extension support running while the tab is in the background only, or always-foreground? (Recommendation: background-OK; the user shouldn't have to keep the tab visible.)

### 17.3 V2 considerations (out of scope but flagged)

- Form auto-fill from the user's Visa Master profile (high value, high ToS risk).
- VFS Global support.
- Firefox and Safari builds.
- Multi-account ("monitor for me + my family of 4 in one extension").
- Calendar integration ("only alert if the slot falls within these dates").

---

## 18. Roadmap and Milestones

### 18.1 V1.0 — Public release (target: T+8 weeks from PRD approval)

- Week 1: Scaffold, settings UI, manifest, branding.
- Week 2: Detection content script + 3 locales (en-GB, zh-CN, fr-FR).
- Week 3: Polling, alarms, state machine, local notifications.
- Week 4: OpenClaw client (stub if gateway spec not stable yet).
- Week 5: Internationalization to full 7-locale set; telemetry; opt-in flows.
- Week 6: Hardening, fuzz tests against snapshot fixtures, accessibility pass.
- Week 7: Chrome Web Store submission, README, contributor docs, beta to ~20 users.
- Week 8: Address review feedback, public release.

### 18.2 V1.1 — VFS Global support (T+12 weeks)

- Add `vfs-global.com` host permission (separate manifest update, user re-grants).
- Add VFS detection signals.
- Add `gbVFS*` URL routing.

### 18.3 V2.0 — Form auto-fill (T+24 weeks)

- Profile sync from Visa Master agent.
- Auto-fill on TLS booking forms (with explicit per-field consent).
- Strict UPL/IAA review before any "recommended" copy.

### 18.4 V2.x — Firefox/Safari (T+30 weeks)

- WebExtension polyfills, browser-specific manifest variants.

---

## 19. Appendices

### Appendix A: Glossary

| Term | Definition |
|---|---|
| **TLScontact** | Outsourced visa application centre operator; runs France-visa centres for UK applicants among others |
| **VFS Global** | Competing outsourced visa application centre operator |
| **CF (Cloudflare)** | Bot protection layer in front of TLS and VFS sites |
| **MV3 (Manifest V3)** | Current Chrome extension manifest standard |
| **OpenClaw** | The multi-channel gateway specified in `03-openclaw-channels.md` |
| **Visa Master** | Working name for the platform specified in `02-system-architecture.md` |
| **Node** (OpenClaw) | An OpenClaw client that exposes capabilities to the agent runtime |
| **Centre code** | TLS internal code for an application centre (e.g., `gbMNC2fr` = GB, Manchester, France) |
| **IAA** | Immigration Advice Authority (UK; formerly OISC) |
| **UPL** | Unauthorized Practice of Law |

### Appendix B: Reference URLs

- TLScontact UK France-visa booking workflow: `https://visas-fr.tlscontact.com/workflow/appointment-booking/{centre}/{caseId}`
- Visa Warden (design reference, closed-source): https://visawarden.com/
- WXT framework: https://wxt.dev/
- Plasmo framework: https://plasmo.com/
- Chrome Manifest V3 docs: https://developer.chrome.com/docs/extensions/mv3/intro/
- OpenClaw repo: https://github.com/openclaw/openclaw

### Appendix C: Empirical observations from 2026-05-12 prototype

From the slot-monitor we built and validated against the user's logged-in TLS Manchester session on 2026-05-12:

- A `location.reload()` on the booking page does NOT retrigger the Cloudflare challenge once authenticated (confirmed at 2026-05-12 12:27 UTC).
- The empty-state Chinese phrase `我们目前没有更多可用的预约时段` is reliably present when no slots exist.
- The book button (text `预约`) has `disabled=true` when no slots exist; `disabled=false` is a strong (though not sole) signal of availability.
- Slot DOM elements count zero when the empty-state message is showing.
- The user's session held a 283.98 GBP cart total with 6 items at the time of the snapshot.

These observations validate the multi-signal approach in §10.1 and are the lowest-friction starting point for the detection content script.

### Appendix D: Comparison to the `02-system-architecture.md` Appointment Agent

| Concern | Server-side (current arch) | Chrome extension (this PRD) |
|---|---|---|
| Cloudflare/captcha | Active fight | Sidestepped |
| Credentials | User must hand over TLS session | Never copied |
| IP reputation | Shared infra IP, prone to flags | User's own IP |
| Cost at 10 users | ~$135–215/mo | ~$0 (self-distributed) |
| Cost at 1,000 users | ~$5,400–9,400/mo | ~$0 + Web Store distribution |
| Browser must stay open | No | Yes |
| Works on mobile | Yes | No (V1) |
| ToS exposure | High (centralized scraping) | Lower (per-user automation) |
| Time-to-MVP | ~3 weeks | ~6 weeks |

**Recommendation:** ship both. The Chrome extension is the default; the server-side path is a fallback for users who can't keep a browser open. The Visa Master agent transparently chooses based on user preference.

---

## Sources

- `/platform/architecture/02-system-architecture.md`
- `/platform/research/01-competitive-landscape.md`
- `/platform/integrations/03-openclaw-channels.md`
- `/platform/privacy/04-privacy-compliance.md`
- Empirical TLScontact Manchester monitor session, 2026-05-12, recorded in `~/Documents/Claude/Scheduled/tlscontact-manchester-slot-watch/SKILL.md`
- [Visa Warden](https://visawarden.com/) — competitive reference, design only
- [Chrome Extension MV3 docs](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [WXT framework](https://wxt.dev/)
- [Plasmo framework](https://plasmo.com/)
- [s4m111h/Booking-Appointment-in-TLScontact](https://github.com/s4m111h/Booking-Appointment-in-TLScontact)
- [israr-ulhaq/tls_contact_visaBot](https://github.com/israr-ulhaq/tls_contact_visaBot)
- [bilaltosungit/schengen-visa-appointment-bot](https://github.com/bilaltosungit/schengen-visa-appointment-bot)
