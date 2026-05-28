# PRD: Visa Master Catcher — GitHub Actions Slot Monitor

**Document:** `35-vm-catcher-prd.md`
**Version:** 0.1 (Draft)
**Date:** 2026-05-26
**Owner:** Duke Harewood (Torly AI)
**Related docs:**
- `06-visa-master-chrome-extension-prd.md` — Free tier PRD
- `08-vs-alternatives.md` §9.5 — Inspiration (HarkunwarS/schengen-tracker)
- `08-vs-alternatives.md` §0.2–0.3 — Competitive context (Visa Catcher, VisaBot)
- `11-architecture.md` — System architecture
- `14-notifications-and-email-prd.md` — Notification channels
- `30-tls-slot-release-windows-research.md` — Release window research

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Competitive Context](#3-competitive-context)
4. [Product Definition](#4-product-definition)
5. [Architecture](#5-architecture)
6. [Detection Method](#6-detection-method)
7. [Notification Design](#7-notification-design)
8. [Configuration](#8-configuration)
9. [Setup Flow](#9-setup-flow)
10. [Smart Alert Suppression](#10-smart-alert-suppression)
11. [File Layout](#11-file-layout)
12. [Wireframes](#12-wireframes)
13. [Scope Boundaries](#13-scope-boundaries)
14. [Trust & Privacy](#14-trust--privacy)
15. [Risks & Mitigations](#15-risks--mitigations)
16. [Success Metrics](#16-success-metrics)
17. [Roadmap](#17-roadmap)

---

## 1. Executive Summary

**Visa Master Catcher** is a GitHub Actions workflow that monitors TLScontact public pages for changes while the user's browser is closed. It complements the Visa Master Chrome extension — the extension is the fire inspector (detailed slot detection), the Catcher is the smoke detector (page-change alarm).

Users fork the `torlyai/Schengen-master` repo, configure their Telegram bot token, and enable Actions. The workflow polls TLS pages every 15 minutes (configurable), hashes the HTML content, and alerts via Telegram + email when a change is detected. The user then opens Chrome and lets the extension handle the rest.

**Cost to users:** £0 (GitHub Actions is free for public repo forks).
**Cost to us:** £0 (runs on the user's fork, not our infrastructure).
**Credentials required:** None. No TLS login, no password, no personal data.

---

## 2. Problem Statement

Visa Master's extension monitors TLScontact only while Chrome is open. Three scenarios leave users unprotected:

| Scenario | Impact |
|---|---|
| Laptop closed overnight | Misses 00:00–04:00 overnight batch releases |
| User away from computer | Misses morning (06:00–11:00) and afternoon (14:00–16:30) windows |
| Chrome not running | Extension service worker cannot fire alarms |

Our release window research (`docs/30-tls-slot-release-windows-research.md`) shows slots disappear within 2–5 minutes. Missing a window because your laptop was closed is the #1 user complaint that Visa Master cannot currently solve.

The server-side competitors solve this at high cost:

| Service | Always-on monitoring | Price | Credential risk |
|---|---|---|---|
| Visa Catcher | ✅ (their servers) | £30–100/applicant | Credentials surrendered |
| VisaBot | ✅ (their servers) | £35–200/applicant | Passport data surrendered |
| **Visa Master Catcher** | ✅ (user's GitHub fork) | **£0** | **None** |

---

## 3. Competitive Context

### 3.1 Why not just run a server?

Running our own monitoring server would:
- Add infrastructure cost (~£20–50/mo for a VPS polling every 15 min)
- Require users to trust us with their notification credentials
- Move us away from the local-first brand promise
- Create a single point of failure (our server goes down, everyone loses monitoring)

GitHub Actions on a public repo fork gives each user their own free, independent, zero-trust monitoring infrastructure.

### 3.2 Prior art: HarkunwarS/schengen-tracker

This product is directly inspired by `github.com/HarkunwarS/schengen-tracker` (documented in `docs/08-vs-alternatives.md` §7.5 and §9.5). Key lessons adopted:

| HarkunwarS pattern | Catcher adoption |
|---|---|
| Content-hash change detection | ✅ SHA-256 of normalized HTML |
| GitHub Actions as infrastructure | ✅ Single cron workflow |
| State as committed JSON | ✅ `monitor/state.json` |
| Smart alert filtering (baseline, recovery, suppress) | ✅ Same 4-mode system |
| No login required | ✅ Public pages only |
| Multi-portal support (VFS, TLS, BLS) | ❌ TLS only at MVP |

---

## 4. Product Definition

### 4.1 One-liner

Stop missing slots when your laptop is closed. Free, zero-credential background monitoring via GitHub Actions.

### 4.2 Relationship to the extension

```
                    ┌───────────────────────┐
                    │    User's goal:       │
                    │  "Don't miss a slot"  │
                    └──────────┬────────────┘
                               │
                 ┌─────────────┴─────────────┐
                 │                           │
        Chrome is open              Chrome is closed
                 │                           │
    ┌────────────▼────────────┐  ┌───────────▼───────────┐
    │   Visa Master Extension │  │  Visa Master Catcher  │
    │                         │  │                       │
    │  • DOM-based detection  │  │  • Content-hash diff  │
    │  • Actual slot status   │  │  • "Something changed"│
    │  • Auto-book (Premium)  │  │  • Opens the door     │
    │  • Full state machine   │  │  • User opens Chrome  │
    └─────────────────────────┘  └───────────────────────┘
```

**The Catcher does NOT:**
- Detect actual slot availability (it detects page changes, not slot status)
- Replace the extension (users still need it for detailed detection + booking)
- Auto-book anything
- Store or transmit any credentials

**The Catcher DOES:**
- Run 24/7 independent of the user's browser
- Alert when a TLS page changes (likely indicating new slot availability)
- Complement the extension as a backup alarm
- Cost nothing to run

### 4.3 Target user

Existing Visa Master extension users who want background monitoring. The setup requires a GitHub account and 5 minutes of configuration. This is a power-user feature, not a mainstream one — but the setup guide is written for non-developers.

---

## 5. Architecture

### 5.1 System diagram

```
┌─────────────────────────────────────────────────────┐
│  User's fork of torlyai/Schengen-master             │
│                                                     │
│  .github/workflows/catcher.yml                      │
│  ┌───────────────────────────────────────────────┐  │
│  │  Cron trigger (*/15 * * * *)                  │  │
│  │                                               │  │
│  │  1. Read monitor/config.yml                   │  │
│  │  2. For each enabled page:                    │  │
│  │     a. Fetch via curl                         │  │
│  │     b. Normalize HTML                         │  │
│  │     c. SHA-256 hash                           │  │
│  │     d. Compare with monitor/state.json        │  │
│  │  3. If any page changed:                      │  │
│  │     ├─ Send Telegram message                  │  │
│  │     ├─ Send email (if configured)             │  │
│  │     └─ Commit updated state.json              │  │
│  │  4. If nothing changed: exit silently         │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  monitor/                                           │
│  ├── state.json        ← auto-committed hashes      │
│  ├── config.yml        ← user configuration         │
│  └── README.md         ← setup guide                │
└─────────────────────────────────────────────────────┘
         │                           │
         ▼                           ▼
   ┌──────────┐              ┌──────────────┐
   │ Telegram │              │ Email (SMTP) │
   │ Bot API  │              │              │
   └──────────┘              └──────────────┘
```

### 5.2 Why a single workflow

Alternatives considered:

| Approach | Pros | Cons | Verdict |
|---|---|---|---|
| **A. Single workflow, state-in-repo** | Simplest. Fork and go. One file. | Commits clutter git history. | **Chosen** |
| B. Multi-workflow with artifacts | Clean git history. | Artifacts expire 90 days. Complex. | Rejected |
| C. Reusable composite action | Users don't fork. Reusable. | Two repos. More engineering. | Deferred to v2 |

The git history clutter is a non-issue for a fork dedicated to monitoring. Users who care can configure a dedicated branch for state commits.

### 5.3 Technology constraints

- **No dependencies:** The workflow uses only `bash`, `curl`, `sha256sum`, `jq`, and `git` — all pre-installed on GitHub Actions runners.
- **No Docker:** Adds ~30s of overhead per run for image pull. Not worth it for a curl + hash operation.
- **No npm/Node:** The extension is TypeScript, but the Catcher is pure shell. This keeps the workflow self-contained and auditable.
- **No secrets in committed files:** Telegram bot token, chat ID, and SMTP credentials go in GitHub Secrets only.

---

## 6. Detection Method

### 6.1 Content-hash change detection

The Catcher uses SHA-256 hashing of normalized HTML to detect page changes. This is the same approach proven by HarkunwarS/schengen-tracker.

```bash
# Pseudocode for one page check
PAGE_HTML=$(curl -sL "$URL")
NORMALIZED=$(echo "$PAGE_HTML" | normalize_html)
HASH=$(echo "$NORMALIZED" | sha256sum | cut -d' ' -f1)

if [ "$HASH" != "$PREVIOUS_HASH" ]; then
  notify "Page changed"
  update_state "$HASH"
fi
```

### 6.2 HTML normalization

TLScontact pages include volatile elements that change on every request. Without normalization, every poll would trigger a false "change" alert.

**Elements stripped during normalization:**

| Element | Why it changes | Strip method |
|---|---|---|
| CSRF tokens | New token per request | Regex: `name="csrf[^"]*" value="[^"]*"` |
| Nonce attributes | CSP nonce rotates | Regex: `nonce="[^"]*"` |
| Session-specific `<script>` blocks | Inline session data | Remove `<script>` blocks matching known patterns |
| Cloudflare challenge tokens | CF injects per-request | Regex: `cf-[a-z]+-[a-z]+="[^"]*"` |
| Timestamp/date footers | Page render time | Regex for common date formats in footer region |
| `Set-Cookie` response headers | Session rotation | Not included (we hash body only) |

**Normalization is the riskiest part of the design.** If we strip too much, we miss real changes. If we strip too little, we get false positives on every poll. The initial normalization regex set will be conservative (strip only known-volatile elements) and can be tuned based on real-world false positive rates.

### 6.3 What this can and cannot detect

| Signal | Can detect? | Notes |
|---|---|---|
| New appointment slots released | **Likely yes** | Page HTML changes when slot availability changes |
| Slots taken by others | **Likely yes** | Same mechanism — page content updates |
| TLS system maintenance banner | **Yes** | Banner adds/removes HTML |
| TLS page redesign | **Yes** | (false positive — not a slot event) |
| Cosmetic CSS changes | **No** | We hash HTML body, not CSS |
| Slots appearing and disappearing between polls | **No** | 15-min polling can miss 2–5 min slot windows |
| Actual slot count or dates | **No** | Content-hash is binary (changed/unchanged) |

### 6.4 Public page selection

The Catcher monitors **public-facing** TLS pages only — pages accessible without authentication. Candidate URLs per country:

| Country | Public page | What changes indicate |
|---|---|---|
| France (London) | `visas-fr.tlscontact.com/gb/LON/page/application-timeline` | Appointment availability status |
| France (Manchester) | `visas-fr.tlscontact.com/gb/MAN/page/application-timeline` | Same |
| France (Edinburgh) | `visas-fr.tlscontact.com/gb/EDI/page/application-timeline` | Same |
| Germany (London) | `visas-de.tlscontact.com/gb/LON/page/application-timeline` | Same |
| Italy (London) | `visas-it.tlscontact.com/gb/LON/page/application-timeline` | Same |

**Important:** These URLs must be validated empirically before MVP. TLScontact may require authentication even for timeline/status pages, in which case the Catcher would monitor only truly public pages (e.g., the centre landing page or announcement pages). If no public page meaningfully changes with slot availability, this product has limited value — this is the primary validation risk (see §15).

---

## 7. Notification Design

### 7.1 Telegram — change detected

```
🔔 Visa Master Catcher — Page Change Detected

📍 France (London)
🕐 2026-05-26 06:02 UTC
📊 Change #3 since monitoring started

The TLScontact page content has changed.
This may indicate new appointment slots.

👉 Open your browser and check with Visa Master extension.

🔗 https://visas-fr.tlscontact.com/gb/LON/page/application-timeline
```

### 7.2 Telegram — page recovered after downtime

```
🟢 Visa Master Catcher — Page Recovered

📍 France (London)
🕐 2026-05-26 14:30 UTC
⏱️ Was unreachable for ~45 min

The TLScontact page is back online.
Content may have changed during the outage.

👉 Open your browser and check with Visa Master extension.
```

### 7.3 Telegram — daily heartbeat (optional, off by default)

```
💚 Visa Master Catcher — All Quiet

📍 Monitoring 1 page
🕐 Last check: 2026-05-26 23:45 UTC
📊 No changes in last 24h
⏱️ Next check in ~15 min
```

The heartbeat is opt-in (`heartbeat_enabled: true` in config) and fires once per day at a configurable hour. Its purpose is reassurance — "yes, the Catcher is still running."

### 7.4 Email — change detected

- **Subject:** `[Visa Master Catcher] France (London) — Page changed`
- **Body:** Same content as §7.1 Telegram message, plain-text format
- **Footer:** `To stop these emails, remove SMTP secrets from your GitHub repo Settings.`
- **Sent via:** User-configured SMTP (e.g., Gmail app password, Mailgun, etc.)

### 7.5 Email — no SMTP fallback

If no SMTP secrets are configured but email is enabled in `config.yml`, the workflow logs a warning but does not fail. Telegram is the primary channel; email is supplementary.

---

## 8. Configuration

### 8.1 `monitor/config.yml`

```yaml
# Visa Master Catcher — Configuration
# Edit this file in your fork to customize monitoring.
# Secrets (tokens, passwords) go in GitHub repo Settings → Secrets, NOT here.

# ── Pages to monitor ──────────────────────────────────
# Enable/disable pages by setting enabled: true/false.
# Add new TLS country URLs following the same pattern.
pages:
  - name: "France (London)"
    url: "https://visas-fr.tlscontact.com/gb/LON/page/application-timeline"
    enabled: true

  - name: "France (Manchester)"
    url: "https://visas-fr.tlscontact.com/gb/MAN/page/application-timeline"
    enabled: false

  - name: "France (Edinburgh)"
    url: "https://visas-fr.tlscontact.com/gb/EDI/page/application-timeline"
    enabled: false

  - name: "Germany (London)"
    url: "https://visas-de.tlscontact.com/gb/LON/page/application-timeline"
    enabled: false

  - name: "Italy (London)"
    url: "https://visas-it.tlscontact.com/gb/LON/page/application-timeline"
    enabled: false

# ── Polling interval ──────────────────────────────────
# How often to check (in minutes). GitHub Actions cron minimum is 5 min.
# Default: 15. Lower = more responsive but more GH Actions usage.
poll_interval_minutes: 15

# ── Notifications ─────────────────────────────────────
notifications:
  telegram:
    enabled: true
    # Set these in GitHub Secrets (not here):
    #   TELEGRAM_BOT_TOKEN — your Telegram bot token
    #   TELEGRAM_CHAT_ID   — your chat/group ID

  email:
    enabled: false
    # Set these in GitHub Secrets (not here):
    #   SMTP_HOST — e.g. smtp.gmail.com
    #   SMTP_PORT — e.g. 587
    #   SMTP_USER — e.g. you@gmail.com
    #   SMTP_PASS — e.g. Gmail app password
    #   EMAIL_TO  — recipient address

# ── Heartbeat (optional) ─────────────────────────────
# Daily "still alive" message. Off by default.
heartbeat:
  enabled: false
  hour_utc: 22  # Send heartbeat at this UTC hour (0-23)

# ── Advanced ──────────────────────────────────────────
# State branch: commit state.json to this branch (default: current branch).
# Set to a dedicated branch to keep your main branch clean.
state_branch: ""

# Flap protection: suppress repeated alerts for the same page within this
# many minutes. Prevents notification storms from flapping pages.
flap_suppress_minutes: 60

# Request timeout in seconds for each page fetch.
request_timeout_seconds: 30

# User-Agent header for requests.
user_agent: "Visa-Master-Catcher/1.0 (github.com/torlyai/Schengen-master)"
```

### 8.2 GitHub Secrets (required)

| Secret | Required? | Description |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | Yes (if Telegram enabled) | Bot token from @BotFather |
| `TELEGRAM_CHAT_ID` | Yes (if Telegram enabled) | Your private chat or group ID |
| `SMTP_HOST` | Only if email enabled | SMTP server hostname |
| `SMTP_PORT` | Only if email enabled | SMTP port (typically 587) |
| `SMTP_USER` | Only if email enabled | SMTP username |
| `SMTP_PASS` | Only if email enabled | SMTP password or app password |
| `EMAIL_TO` | Only if email enabled | Recipient email address |

### 8.3 Poll interval and cron

The `poll_interval_minutes` value in `config.yml` determines the cron schedule in the workflow. The workflow file itself uses a fixed cron expression. Users who want to change the interval must edit the cron line in `.github/workflows/catcher.yml`:

```yaml
on:
  schedule:
    - cron: '*/15 * * * *'  # Every 15 minutes — edit to match your config
  workflow_dispatch: {}      # Manual trigger for testing
```

**Note:** GitHub Actions cron has a minimum granularity of 5 minutes and does not guarantee exact timing — runs may be delayed by 1–15 minutes during periods of high GitHub load. This is acceptable for a backup monitor.

---

## 9. Setup Flow

### 9.1 Prerequisites

- GitHub account (free tier is sufficient)
- Telegram account + bot token (if using Telegram — same one the extension uses)
- ~5 minutes

### 9.2 Steps

**Step 1: Fork the repository**

Navigate to `github.com/torlyai/Schengen-master` and click **Fork**. This creates your own copy with the workflow pre-configured.

**Step 2: Enable GitHub Actions**

GitHub disables workflows on forks by default. Go to your fork → **Actions** tab → click **"I understand my workflows, go ahead and enable them"**.

**Step 3: Add secrets**

Your fork → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.

Add `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` (same values you use in the Visa Master extension Settings → Telegram).

Optionally add SMTP secrets if you want email notifications.

**Step 4: Configure pages**

Edit `monitor/config.yml` in your fork. Enable the pages you want to monitor. The default (France London) is pre-enabled.

**Step 5: Test**

Go to **Actions** tab → select **"Visa Master Catcher"** workflow → click **"Run workflow"**. The first run captures a baseline and does NOT send an alert. On the next run where the page has changed, you'll receive a Telegram/email notification.

### 9.3 Reusing extension Telegram credentials

The Visa Master extension already guides users through Telegram bot setup. The Catcher reuses the same bot token and chat ID. The setup guide (`monitor/README.md`) should reference the extension's Telegram setup wizard and explain: "If you already have Telegram working in the extension, use the same bot token and chat ID here."

---

## 10. Smart Alert Suppression

The Catcher uses four alert modes to prevent false positives and notification noise:

| Scenario | Behavior | Why |
|---|---|---|
| **First observation** (no previous hash in `state.json`) | Silent — capture baseline, no alert | Every fork starts with no state; the first fetch is a baseline, not a change |
| **Genuine change** (hash differs from previous, page is reachable) | **Alert** — send Telegram + email | This is the primary use case |
| **Recovery** (page was unreachable last run, now reachable again) | **Alert** with "page recovered" label | Content may have changed during the outage; user should check |
| **Transient downtime** (single failed fetch) | **Suppress** — mark as unreachable, retry next cycle | Don't alert on network blips or GH Actions runner issues |
| **Repeated changes within flap window** (same page changes again within `flap_suppress_minutes`) | **Suppress** — update state silently | Prevent notification storms from pages that toggle rapidly |
| **Persistent downtime** (unreachable for 3+ consecutive checks) | **Alert** with "page may be down" label | Sustained downtime is worth reporting |

### 10.1 State transitions

```
                    ┌──────────┐
     first run ──→  │ BASELINE │
                    └────┬─────┘
                         │ next run
                         ▼
                    ┌──────────┐
              ┌──── │ WATCHING │ ◄─── unchanged ───┐
              │     └────┬─────┘                    │
              │          │ hash changed             │
              │          ▼                          │
              │     ┌──────────┐                    │
              │     │ CHANGED  │ ── alert sent ─────┘
              │     └──────────┘
              │
              │ fetch failed
              ▼
         ┌──────────┐
         │   DOWN   │ ── retry next cycle
         └────┬─────┘
              │ fetch succeeds
              ▼
         ┌──────────┐
         │ RECOVERED│ ── alert sent ──→ WATCHING
         └──────────┘
```

---

## 11. File Layout

```
Schengen-master/                          (user's fork)
├── .github/
│   └── workflows/
│       └── catcher.yml                   ← The single workflow file
├── monitor/
│   ├── README.md                         ← Setup guide with screenshots
│   ├── config.yml                        ← User configuration (committed, edited by user)
│   └── state.json                        ← Auto-committed by workflow (hashes + timestamps)
├── extension/                            ← Existing extension (unchanged)
└── docs/
    └── 32-vm-catcher-prd.md              ← This PRD
```

**File ownership:**

| File | Who edits | When |
|---|---|---|
| `catcher.yml` | User (poll interval) | Once during setup |
| `config.yml` | User (pages, notifications) | Setup + when adding pages |
| `state.json` | Workflow (auto-commit) | Every run where state changes |
| `README.md` | Us (maintenance) | When setup process changes |

---

## 12. Wireframes

### 12.1 Setup flow

```
┌─────────────────────────────────────────────────────────┐
│                  SETUP FLOW (5 min)                     │
│                                                         │
│  Step 1: Fork                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │  github.com/torlyai/Schengen-master               │  │
│  │  [⑂ Fork] ──→ github.com/you/Schengen-master     │  │
│  └───────────────────────────────────────────────────┘  │
│                         │                               │
│  Step 2: Enable Actions │                               │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Your fork → Actions tab                          │  │
│  │  [I understand my workflows, go ahead and         │  │
│  │   enable them]                                    │  │
│  └───────────────────────────────────────────────────┘  │
│                         │                               │
│  Step 3: Add Secrets    │                               │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Your fork → Settings → Secrets → Actions         │  │
│  │                                                   │  │
│  │  Required (if Telegram enabled):                  │  │
│  │  ┌──────────────────┬─────────────────────────┐   │  │
│  │  │ TELEGRAM_BOT_TOKEN│ 123456:ABC-DEF...       │   │  │
│  │  │ TELEGRAM_CHAT_ID │ -100123456789            │   │  │
│  │  └──────────────────┴─────────────────────────┘   │  │
│  │                                                   │  │
│  │  Optional (if email enabled):                     │  │
│  │  ┌──────────────────┬─────────────────────────┐   │  │
│  │  │ SMTP_HOST        │ smtp.gmail.com           │   │  │
│  │  │ SMTP_PORT        │ 587                      │   │  │
│  │  │ SMTP_USER        │ you@gmail.com            │   │  │
│  │  │ SMTP_PASS        │ app-password             │   │  │
│  │  │ EMAIL_TO         │ you@gmail.com            │   │  │
│  │  └──────────────────┴─────────────────────────┘   │  │
│  └───────────────────────────────────────────────────┘  │
│                         │                               │
│  Step 4: Configure      │                               │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Edit monitor/config.yml in your fork:            │  │
│  │  - Enable/disable pages                           │  │
│  │  - Set poll_interval_minutes                      │  │
│  │  - Toggle notification channels                   │  │
│  └───────────────────────────────────────────────────┘  │
│                         │                               │
│  Step 5: Verify         │                               │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Actions tab → "Visa Master Catcher" workflow     │  │
│  │  [Run workflow ▾] → Run manually                  │  │
│  │  ✅ First run captures baseline (no alert)        │  │
│  │  ✅ Telegram/email arrives on next real change     │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 12.2 Extension Settings integration (future, NOT MVP)

```
┌─────────────────────────────────────────────────────┐
│  ■ VISA MASTER CATCHER                    [Setup ↗] │
│                                                     │
│  Backup monitoring when Chrome is closed.           │
│  Runs on GitHub Actions — free, no credentials.     │
│                                                     │
│  Status: Not configured                             │
│  [Set up Catcher →]  (opens GitHub fork guide)      │
│                                                     │
│  ─ ─ ─ ─ ─ ─ after setup ─ ─ ─ ─ ─ ─ ─ ─ ─ ─     │
│                                                     │
│  Status: ✅ Active (last check 3 min ago)           │
│  Monitoring: France (London)                        │
│  Changes detected: 3 (last: today 06:02)            │
│                                                     │
│  [View on GitHub ↗]  [Disable]                      │
└─────────────────────────────────────────────────────┘
```

This wireframe is for future reference only. MVP is GitHub-only — no extension UI changes.

### 12.3 Telegram notification flow

```
┌───────────────────────────────────┐
│  User's Telegram                  │
│                                   │
│  ┌─────────────────────────────┐  │
│  │ 🔔 Visa Master Catcher     │  │
│  │                             │  │
│  │ 📍 France (London)          │  │
│  │ 🕐 06:02 UTC                │  │
│  │ 📊 Change #3                │  │
│  │                             │  │
│  │ Page content has changed.   │  │
│  │ May indicate new slots.     │  │
│  │                             │  │
│  │ 👉 Open browser + check     │  │
│  │ 🔗 [link]                   │  │
│  └─────────────────────────────┘  │
│         │                         │
│         ▼ User opens Chrome       │
│                                   │
│  ┌─────────────────────────────┐  │
│  │ 🟢 Visa Master Extension   │  │
│  │                             │  │
│  │ ⚠ SLOT AVAILABLE           │  │
│  │ 📍 France (London)          │  │
│  │ 📅 3 slots found            │  │
│  │                             │  │
│  │ [Book now →]                │  │
│  └─────────────────────────────┘  │
└───────────────────────────────────┘
```

---

## 13. Scope Boundaries

### 13.1 In scope (MVP)

- Single workflow file (`.github/workflows/catcher.yml`)
- `monitor/config.yml` for user configuration
- `monitor/state.json` for auto-committed state
- `monitor/README.md` with setup guide
- Content-hash detection with HTML normalization
- Telegram + SMTP email notifications
- Smart alert suppression (§10)
- Manual workflow trigger (`workflow_dispatch`) for testing
- Pre-configured pages: France (London enabled, others commented out)
- Heartbeat message (optional, off by default)
- Flap protection (configurable suppress window)

### 13.2 Out of scope (future iterations)

| Feature | Why deferred | Potential PRD |
|---|---|---|
| Extension Settings UI integration (§12.2) | Requires extension ↔ GitHub API bridge | Future PRD |
| Headless browser / Playwright detection | Changes trust model, adds complexity | Separate PRD if content-hash proves insufficient |
| Login-gated calendar checking | Requires storing TLS credentials in GH Secrets | Against trust model |
| Multi-portal support (VFS Global, BLS) | Different URL patterns, different normalization | Combine with §9.4 multi-portal PRD |
| Webhook notification channel | Nice-to-have, low demand | Add to existing webhook infrastructure (PRD 14) |
| Auto-sync config between extension and Catcher | Complex; uncertain value | Future PRD |
| Reusable composite action (Approach C) | Premature optimization | Refactor if adoption warrants |
| Diff reporting (what changed, not just that it changed) | Requires parsing TLS page structure | v2 enhancement |

### 13.3 Non-goals

- **Replacing the extension.** The Catcher cannot detect actual slot availability.
- **Storing or transmitting TLS credentials.** Ever. In any form.
- **Auto-booking.** The Catcher is a notification system, not an agent.
- **Competing with Visa Catcher/VisaBot.** We are not building a cloud service. Users run their own infrastructure.

---

## 14. Trust & Privacy

### 14.1 What the Catcher accesses

| Data | Where it goes | Who can see it |
|---|---|---|
| Public TLS page HTML | Fetched by `curl` on GH Actions runner, discarded after hashing | GitHub Actions runner (ephemeral) |
| SHA-256 hash of page content | Committed to `monitor/state.json` in user's fork | Anyone (public fork) — but a hash is not reversible to content |
| Telegram bot token | GitHub Secrets → passed to `curl` at runtime | GitHub (encrypted at rest), Telegram API |
| SMTP credentials | GitHub Secrets → passed to notification script | GitHub (encrypted at rest), SMTP server |

### 14.2 What the Catcher NEVER accesses

- TLS login credentials (email, password)
- Authenticated TLS pages (calendar, personal data)
- User's personal information
- Extension state (`chrome.storage.local`)
- Slot details (dates, times, centre specifics)

### 14.3 Privacy considerations for public forks

Because the fork is public, `monitor/state.json` is publicly visible. This file contains only:
- Page hashes (SHA-256, not reversible)
- Timestamps of when changes were detected
- Change counts

None of this is personally identifiable. However, the commit history reveals the user's monitoring schedule. Users who want privacy should use a **private fork** (free on GitHub, but Actions minutes are capped at 2,000/month for private repos — sufficient for 15-min polling of a few pages).

---

## 15. Risks & Mitigations

### 15.1 Primary risk: public pages may not change with slot availability

**Risk:** TLScontact public pages (accessible without login) may not meaningfully change when new appointment slots are released. The appointment calendar is behind authentication — public pages may only show generic information.

**Mitigation:**
1. Empirical validation before MVP: manually check public TLS URLs over 1–2 weeks, noting whether page content correlates with known slot releases.
2. If public pages don't correlate, pivot to monitoring the **login page** itself (e.g., does TLS show a maintenance banner? Is the login form available?) — this still provides value even without slot-specific detection.
3. Document this limitation honestly in the README: "The Catcher detects page changes, not slot availability. It works best as a backup alarm alongside the extension."

**Decision gate:** If empirical validation shows zero correlation between public page changes and slot availability, this PRD should be deprioritised in favour of §9.1 (notification dedup) or §9.3 (content-hash as an extension feature rather than a standalone Action).

### 15.2 HTML normalization false positives

**Risk:** Normalization regex may not strip all volatile elements, causing false alerts on every poll.

**Mitigation:** Start with a conservative normalization set. Add a `false_positive_count` to state.json. If a page triggers alerts on every poll for 24h, auto-disable it and alert the user to check normalization.

### 15.3 GitHub Actions reliability

**Risk:** GH Actions cron is not guaranteed to run on time. Delays of 1–15 minutes are common during peak usage.

**Mitigation:** This is a backup monitor, not a primary one. 15-minute ± 15-minute jitter is acceptable. Document this: "The Catcher is not real-time. For instant notifications, use the extension."

### 15.4 Rate limiting by TLScontact

**Risk:** Repeated `curl` requests from GitHub Actions IPs may be blocked by TLScontact's WAF.

**Mitigation:**
1. 15-minute default interval is well below aggressive thresholds.
2. Use a descriptive `User-Agent` header (`Visa-Master-Catcher/1.0`).
3. Respect `Retry-After` headers if returned.
4. If blocked, surface the error as a "page unreachable" state (§10 transient downtime handling).

---

## 16. Success Metrics

### 16.1 Adoption (first 90 days post-launch)

| Metric | Target | How to measure |
|---|---|---|
| Forks with Actions enabled | 50+ | GitHub API: forks count + Actions usage |
| Setup completion rate | >60% of forks | Proxy: forks with `state.json` committed |
| README page views | 500+ | GitHub traffic analytics |

### 16.2 Quality

| Metric | Target | How to measure |
|---|---|---|
| False positive rate | <20% of alerts | User feedback + manual correlation |
| True positive correlation | >50% of page changes correlate with slot events | Empirical validation during beta |
| Mean time to notification | <20 min from page change | Timestamp delta: page change → Telegram message |

### 16.3 Retention

| Metric | Target | How to measure |
|---|---|---|
| Active forks after 30 days | >30% of initial forks | Forks with workflow runs in last 7 days |

---

## 17. Roadmap

### 17.1 Phase 1 — Validation (before building)

- [ ] Empirically validate public TLS page correlation with slot releases (1–2 weeks of manual observation)
- [ ] Identify the best public URL per country that changes with availability
- [ ] Test HTML normalization against 50+ fetches to measure false positive rate
- [ ] Decision gate: proceed only if public pages show meaningful correlation

### 17.2 Phase 2 — MVP build

- [ ] Write `catcher.yml` workflow
- [ ] Write `monitor/config.yml` with defaults
- [ ] Write normalization script (bash)
- [ ] Write Telegram notification script (curl)
- [ ] Write SMTP email notification script
- [ ] Write `monitor/README.md` setup guide with screenshots
- [ ] Test on a real fork for 48h
- [ ] Merge to `torlyai/Schengen-master`

### 17.3 Phase 3 — Post-launch

- [ ] Monitor adoption (fork count, Actions usage)
- [ ] Collect false positive feedback, tune normalization
- [ ] Add more country URLs as validated
- [ ] Consider Extension Settings integration (§12.2) if adoption warrants

### 17.4 Phase 4 — Future (separate PRDs)

- Diff reporting ("what changed" not just "it changed")
- Reusable composite action (Approach C)
- Multi-portal support (VFS Global, BLS) — combine with §9.4 PRD
