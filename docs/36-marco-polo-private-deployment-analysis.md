# Marco Polo — Private Deployment (Customer-Hosted) Analysis

**Document:** 36-marco-polo-private-deployment-analysis.md
**Date:** 2026-05-28
**Status:** Strategic analysis — not yet a product commitment
**Owner:** Duke Harewood (Torly AI)
**Related docs:**
- `33-marco-polo-unified-agent-architecture.md` — Three-path agent architecture (A/B/C)
- `34-unified-agent-implementation-plan.md` — 5-phase implementation
- `35-marco-polo-multi-project-multi-machine-architecture.md` — Multi-tenant + multi-machine topology (your home cluster)

---

## Purpose

Docs 33–35 assume the agent runs on infrastructure *you* control — your home Mac Mini cluster today, your Railway/Fly.io tenancy later. This document analyses a third commercial pattern: **installing the agent on the customer's own hardware** (typically a Mac Mini they own) so that all conversations, state, and content stay on their machine.

This is *not* a deployment topology variant. It's a different product wrapped around the same core. The architecture survives the move (with small additions), but the **commercial model, support model, update mechanism, and IP protection** all change.

The output of this analysis is: should Torly AI offer private deployment, to whom, at what price point, and what work is required to ship it cleanly.

---

## What "private deployment" means concretely

```
┌─────────────────────────────────────────────────────────────────────┐
│  CUSTOMER PREMISES (their office, their staff member's home, etc.)  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Customer-owned Mac Mini M4 (or equivalent Apple Silicon)   │   │
│  │                                                             │   │
│  │  • OpenClaw daemon (installed via your installer)           │   │
│  │  • Marco Polo agent-core/ (delivered + signed by you)       │   │
│  │  • Skills + content layer (updated by your auto-updater)    │   │
│  │  • Customer's Anthropic API key (their bill, their key)     │   │
│  │  • Customer's Telegram/WhatsApp bot credentials             │   │
│  │  • Conversation state / logs (stays on this machine)        │   │
│  │  • License JWT signed by torly.ai (validated at startup)    │   │
│  └────────────────────────┬────────────────────────────────────┘   │
│                           │                                         │
│                           │ Outbound HTTPS only:                    │
│                           │   • api.anthropic.com (LLM)             │
│                           │   • telegram.org (channel)              │
│                           │   • license.torly.ai (validation)       │
│                           │   • updates.torly.ai (skill updates)    │
└───────────────────────────┼─────────────────────────────────────────┘
                            │
                            ▼
                    (No customer data flows to you
                     beyond anonymous license pings
                     and opt-in telemetry)
```

The key contrast with your existing Marco Polo SaaS path: **you do not see the customer's conversations.** They live entirely on the customer's hardware. You see only:
- License heartbeats (machine ID, version, last-seen timestamp)
- Opt-in crash reports
- Opt-in usage counts (no content)
- Optional remote support sessions (with explicit consent)

---

## Who would buy this

| Buyer type | Why they want it | Willingness to pay |
|---|---|---|
| **Immigration law firms** | Client confidentiality; SRA / Bar association rules on data location; want to extend agent to their proprietary case data | High — £10k–50k/year |
| **Visa agencies handling high volumes** | Per-application pricing doesn't scale; want flat-rate; want to customise the agent for their workflow | High — £5k–25k/year |
| **Corporate HR / global mobility teams** | Employee PII can't go to a third-party SaaS; multi-country procurement compliance | Medium-High — £15k–40k/year |
| **High net worth individuals / family offices** | Don't want their travel patterns in a SaaS provider's logs | Medium — £2k–5k/year for personal use |
| **Embassies / consular service providers** | Sovereign data requirements; specific national regulations | Very High — but slow sales cycle |
| **White-label resellers** (other visa-related businesses) | Want to run "their" agent under their brand; need control | Variable — revenue share or licensing |

**The thing they're really buying:** *not* a better visa agent — they can get that as SaaS. They're buying **data residency, customisation rights, predictable costs, and ownership.** The agent is the delivery vehicle for those four properties.

---

## Why the existing architecture is mostly ready for this

The Phase 1 work shipped this week is, by accident, exactly what private deployment needs:

| Existing architecture choice | Why it matters for private deployment |
|---|---|
| `agent-core/` is a directory, not compiled-in | Can be delivered as a signed bundle to customer machines |
| Content read from disk at runtime | Customer can swap content (with care) for customisation |
| OpenClaw is portable (npm install or Docker) | Runs on customer's Mac Mini identically to your own |
| Tool executor reads paths from env vars (`SKILLS_DIR`, `CONTENT_DIR`, `AGENT_CORE_DIR`) | Customer can choose where files live on their machine |
| LLM API key is configurable per-deployment | Customer brings their own key — clean billing separation |
| Channel adapters (Telegram/WhatsApp) are config, not code | Customer provides their own bot tokens — no shared identity |

The structural building blocks are done. What's missing is the *productisation layer* around them — installer, license validation, auto-updater, customer-friendly config UI. Those are real work, but they're conventional software engineering, not novel architecture.

---

## What needs to be added for private deployment

These are the new components specifically required for customer-hosted installs. None of them required for SaaS.

### 1. Installer

```
~ £30 (or free) ─────────────────────────────────────────────────────────
   |
   ▼
┌──────────────────────────────────────────────┐
│  Marco-Polo-Private-1.0.0.pkg               │
│  (Apple Developer ID signed + notarised)     │
│                                              │
│  Bundles:                                    │
│  • Node.js runtime (pinned version)          │
│  • OpenClaw daemon (pinned version)          │
│  • agent-core/ (signed + verified at start)  │
│  • Skills + content layer (signed)           │
│  • launchd plist (auto-start at boot)        │
│  • Configuration GUI (Electron or Tauri)     │
│  • Auto-updater (Sparkle framework)          │
└──────────────────────────────────────────────┘
```

A signed, notarised macOS `.pkg` installer is the table-stakes deliverable. It handles:
- Pre-flight checks (macOS version, Apple Silicon, free disk)
- Service installation (`/Library/LaunchDaemons/ai.torly.marco-polo.plist`)
- File placement (`/Applications/Marco Polo/`, `/usr/local/marco-polo/agent-core/`)
- First-run wizard (license key, Anthropic API key, Telegram bot token, etc.)
- Uninstaller

Apple Developer ID + notarisation is non-negotiable post-Catalina. Unsigned `.pkg` files trigger Gatekeeper warnings and erode customer trust. Annual cost: $99 for the developer programme.

### 2. License validation system

Reuse the JWT pattern from Visa Master Premium (`extension/src/shared/license.ts` + backend `lib/visa-master/jwt.ts`). New audience: `marco-polo-private`. Differences:

| Property | Visa Master Premium | Marco Polo Private |
|---|---|---|
| Audience claim | `visa-master-extension` | `marco-polo-private` |
| Validation location | Extension service worker | OpenClaw daemon at startup + every N hours |
| Bound to | `installId` (UUID) | Machine ID (Mac hardware serial via `ioreg`) |
| Seats per license | 1 | Configurable (1, 5, 25) |
| Offline tolerance | N/A (always online) | 14 days (allow brief disconnections) |
| Revocation check | Periodic | Daily; refuse to start if >14 days stale |

This requires a new endpoint on `torly.ai`:
- `POST /api/marco-polo-private/license/validate` — issues + validates JWTs
- `GET /api/marco-polo-private/license/status?machineId=…` — checks revocation

Add a Supabase migration: `marco_polo_private_licenses` table with columns for license key, customer email, seat count, machines bound, expiration, revocation flag.

### 3. Auto-updater

Two update streams, decoupled:

**Runtime updates (OpenClaw + Marco Polo Private app):**
- Sparkle framework for macOS apps
- Signed update bundles served from `updates.torly.ai`
- Customer-configurable update window ("daily at 03:00 local" by default)
- Versioned channels: `stable`, `beta` (let early adopters opt in)
- Rollback button in the config GUI for the previous N versions

**Content updates (skills + knowledge.md + consulate files):**
- Separate, faster cadence — content changes weekly, runtime changes monthly
- Pulled as signed tarballs from `content.torly.ai/marco-polo/v1/`
- Cryptographically verified before unpacking
- Customer can pin to a content version if they're conservative
- Stale content warning: if content > 30 days old, agent prepends a banner to responses encouraging the operator to update

### 4. Configuration GUI

A small Electron or Tauri app the customer launches to configure the daemon:

```
┌─ Marco Polo Private — Configuration ─────────────────────┐
│                                                          │
│  License key:        [████████████████████████]  ✓ Valid │
│  Customer:           Smith Immigration LLP              │
│  Seats:              5 (4 in use)                       │
│  Expires:            2027-05-28                         │
│                                                          │
│  ─── LLM provider ──────────────────────────────         │
│  Anthropic API key:  [sk-ant-•••••••••••••]  ✓ OK       │
│  Model:              Claude Sonnet 4.6  ▼               │
│  Spend today:        £4.23 / £50.00 daily cap           │
│                                                          │
│  ─── Channels ──────────────────────────────────         │
│  [✓] Telegram   Bot: @SmithImmig_VisaBot   ✓ Connected  │
│  [ ] WhatsApp   (not configured)                        │
│                                                          │
│  ─── Updates ───────────────────────────────────         │
│  Runtime channel:    Stable  ▼                          │
│  Content version:    2026-05-21 (4 days old)            │
│  [✓] Auto-update at 03:00 local time                    │
│                                                          │
│  ─── Status ────────────────────────────────────         │
│  Daemon:             Running (uptime 4d 12h)            │
│  Conversations today: 47                                 │
│  [View logs]  [Restart]  [Open data folder]             │
│                                                          │
│                              [Save]  [Quit]              │
└──────────────────────────────────────────────────────────┘
```

This is what makes the difference between "we sold them a Node.js daemon" and "we sold them a product." For enterprise customers, the GUI is what their IT person uses; the daemon is what runs underneath.

### 5. Remote support tooling

For paid support tier — the customer can grant a time-bounded support session that lets you SSH in:

- "Generate support session" button in the GUI → creates a one-hour Tailscale-backed access token
- You connect via your own Tailscale tailnet (separate from your home cluster)
- Customer can revoke at any time
- All actions logged to a session transcript visible to the customer

This avoids the awful enterprise pattern of permanent vendor backdoors while still giving you a way to debug.

### 6. Telemetry (opt-in only)

Three tiers, customer chooses:

| Tier | What you see | Default |
|---|---|---|
| **None** | License heartbeat only (machine ID, version, last-seen) | Recommended default; cleanest from privacy standpoint |
| **Anonymous usage** | Counts: conversations/day, tools used, average response time. **No content.** | Off by default; opt-in via GUI |
| **Crash reports** | Stack traces, no user content, sanitised | On by default; can be disabled |

This matters for product improvement — without any telemetry you're flying blind on what to build next. Opt-in anonymous counts is a fair compromise.

---

## Commercial models

Three pricing structures that fit different buyer profiles:

### Model A — Annual licence (traditional enterprise)

```
£8,000–£25,000 / year, depending on:
  • Seat count (1–5 / 6–25 / 26+)
  • Support tier (community / business / 24x7)
  • Customisation rights (standard / extended)

Includes:
  • Auto-updates (runtime + content)
  • Up to N hours of remote support
  • Skill content updates as they ship
  • One major version upgrade per year
```

**Best for:** Law firms, agencies, corporate HR. Slow sales cycle (months), high ACV, predictable renewals. Procurement-friendly.

### Model B — Perpetual licence + annual maintenance (legacy enterprise)

```
Year 1:   £15,000–£60,000 perpetual licence
Year 2+:  £3,000–£12,000 / year maintenance (20% of licence)

Without maintenance:
  • Software keeps working forever (no kill switch)
  • No updates, no support
  • Content goes stale → agent quality degrades

With maintenance:
  • Continuous updates
  • Support included
```

**Best for:** Customers in industries that hate subscriptions (defence, government, parts of finance). Capex-friendly. Worse for cash flow but higher headline number.

### Model C — Pay-per-installation (consumer-grade)

```
£499 one-time installation fee
+ £29/month maintenance for updates + support
+ Customer pays their own Anthropic costs (~£0.50/conversation)
```

**Best for:** High net worth individuals, small consultancies (1–2 person shops). Self-serve. Lower margin per customer but larger market.

### My recommended starting point

**Model A, single tier, £12,000/year for up to 5 seats**, manually concierge-installed, for the first 3 customers. Why:

- Forces enterprise sales discipline (the right customer profile for this offering)
- High enough price to invest in proper installation + support
- 3 paying customers funds the productisation work for self-serve later
- One year of revenue per customer = £36k, enough to justify the build

Once you have 3 paying enterprise customers, you'll know:
- What they actually customise
- What support burden looks like in practice
- Whether Model C (consumer grade) has demand worth productising

---

## What can stay simple at first vs what must be done day one

Most failures of this product pattern come from over-engineering the installer/updater before there are paying customers. Here's a sharp prioritisation:

### Must exist before first customer signs (Day 0)

| Component | Why required |
|---|---|
| License key generation + validation endpoint | Without it, no commercial control |
| `marco_polo_private_licenses` Supabase table | Persistent record of who's paid |
| Step-by-step install guide (concierge, not self-serve) | You'll do the first installs by hand — that's fine, just write it down |
| Apple Developer ID + notarised binary | Required for any macOS install in 2026; non-negotiable |
| Manual update process documented | Even if customer runs it themselves |
| Data Processing Agreement (DPA) template | Enterprise customers will require this — get a UK solicitor template (~£500) |
| Support SLA in writing | "Response within 1 business day for paid tier" — manage expectations early |

### Defer until customer #3+ (Day 90+)

| Component | Why defer |
|---|---|
| Polished Electron/Tauri config GUI | First few customers tolerate a `marco-polo-config` CLI tool |
| Sparkle auto-updater | First customers tolerate emailed update notifications + manual install |
| Remote support tooling | First customers tolerate scheduled screen-share sessions |
| Self-serve license activation flow | First customers tolerate licence key emailed by hand |
| White-label / reseller features | Wait until a reseller actually asks |
| Per-customer skill customisation tooling | Wait until a customer pays extra for it |

The thing that kills early-stage private deployment offerings is building the polished installer + GUI + auto-updater *before* knowing what the first three customers actually need. Manual concierge ops for the first three customers is a feature, not a bug — you learn what's important from doing it by hand.

---

## Risks and how to defuse them

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **License key sharing / piracy** | Medium | Low — your market is enterprise; reputational damage of pirated use is real for buyers | Bind licence to machine serial; limit reactivations to N/year; legal language in EULA |
| **Customer modifies content, breaks agent, blames you** | High | Medium | Integrity hash on all skill files at startup; agent refuses to run on modified content unless `--allow-modifications` flag is set; this flag makes the install "unsupported" |
| **Stale content drift** (knowledge.md says €80, real fee is €90) | High over years | High — wrong advice damages your brand even if you didn't deploy it | Content auto-update enabled by default; banner warning when content > 30 days old; refuse to start if content > 180 days old |
| **Customer's Anthropic key leaks** | Medium | Low — their problem, but reputational | Document keychain storage best practices; never log the key; configure GUI to mask it |
| **Anthropic API outage** | Low | High — agent down across all private deployments | Same as SaaS; document fallback ("retry in 5 min") in customer-facing copy |
| **Customer's Mac hardware fails** | Medium | Low — they restore from backup; not your problem | Recommend Time Machine; document restore procedure |
| **You ship a bad update that breaks all customers simultaneously** | Low | Catastrophic | Two-channel update system (stable / beta); 7-day cohort rollout for stable releases; instant rollback button in GUI |
| **Support load creep** ("can you fix my Wi-Fi?") | High | Medium | Written SLA boundaries; tiered support pricing; "outside the daemon = not us" clause |
| **GDPR / compliance shift** — customer breaches with software you sold | Medium | High — legal exposure | DPA template clarifies you are processor, not controller; customer responsibilities listed explicitly; carry errors-and-omissions insurance if revenue justifies (~£500/year for low-revenue tier) |
| **You shut down Torly AI someday and licences stop validating** | Low for years | High if it happens | Build in a "perpetual fallback" — if license server unreachable for >90 days, the daemon continues to work but cannot receive updates. Document this guarantee in the EULA. |
| **IP leakage** (skills are visible markdown on customer's disk) | Certain | Low — skills are already public on `torlyai/Schengen-master` | Accept it. Your moat is the *system* (agent-core + skills + content updates + support), not any single file |
| **Customer churns and asks for refund mid-year** | Medium | Low — clear annual licence terms | Pro-rated refund policy in EULA; suspend license validation on refund |

---

## How this fits your home cluster

Private deployment **does not replace** the home cluster — it's a separate product line. Here's how they coexist:

| | Home cluster (Mini #A + #B) | Private deployment |
|---|---|---|
| Who runs it | You | Customer |
| Who pays Anthropic | You | Customer |
| Pricing model | Per-application or subscription | Annual licence |
| Target customer | Individual applicants (B2C) | Agencies, law firms, HR (B2B) |
| Sales motion | Self-serve, Chrome Web Store, Telegram | Outbound + inbound enterprise sales |
| Margin | ~85-95% | ~95%+ but smaller customer count |
| Operational load | High (you run the infra) | Medium (you build the installer + support tier) |
| Volume potential | Thousands of customers | Tens of customers |

The home cluster (Mini #A in particular) serves a **second** purpose in the private deployment story: it's where you **develop and validate** the customer-facing builds. The flow:

```
1. Develop on M1 Pro
2. Deploy to Mini #B (STAGING) as a test "customer environment"
3. Run an end-to-end install of the .pkg on Mini #B as if you were the customer
4. Validate license activation, auto-updates, GUI flows
5. Cut a release; publish .pkg to updates.torly.ai
6. Customer installs on their hardware
7. Mini #A (PROD) keeps serving B2C; private installs run independently
```

Mini #B effectively becomes the **customer simulator** as well as the dogfood environment. Same machine, two roles, no architectural changes.

---

## Decision criteria — should you pursue this?

A simple gating test, three questions:

### 1. Has at least one prospective customer asked for it?

If no inbound interest exists, **don't build it yet.** The minimum viable signal is one written email saying "I want to install this on my own infrastructure, what would that cost?" Without that, you're betting on a market that may not exist.

If yes, **probably worth scoping further.** One inbound inquiry usually means three more in the next year — enterprise buyers tend to surface in clusters.

### 2. Is your B2C path (home cluster + cloud) working?

Private deployment is a **second** product. Building it before the first product (SaaS Marco Polo) has paying customers fragments your attention. The right sequence is:

```
Phase A: Ship Marco Polo SaaS via home cluster (docs 33–35)
         → 10+ paying B2C users → confidence the product works

Phase B: Take the first inbound enterprise inquiry seriously
         → concierge install for £12k → learn what they need

Phase C: After 3 enterprise customers, decide whether to productise
         → invest in installer, GUI, auto-updater
         → list on a software directory
         → enterprise marketing
```

Skipping Phase A weakens your enterprise sales conversation — buyers want to see live B2C usage as social proof.

### 3. Are you prepared for B2B sales motion?

B2B enterprise sales is genuinely different work from B2C. Concretely:
- Sales cycles of 2–6 months
- Procurement + legal + IT all involved
- Custom contracts (NDA, MSA, SOW, DPA)
- Annual renewal conversations
- Reference calls between prospective and existing customers
- Possibly an account management function

If you don't enjoy this work or don't have time for it, the offering still might exist but it'll be a side project at best. Be honest with yourself about this.

### Recommended decision posture

> **Don't build the productised private deployment yet. But say "yes, we offer that" to any inbound enterprise inquiry, and do the first install by hand at £12k.** Three concierge installs will teach you whether to invest in the polished version. Two architectural pieces are worth doing now even before the first sale: the license JWT pattern (cheap to add, useful for the SaaS tier anyway) and the agent-core/ content integrity check (cheap, defensible). Everything else waits for paying signal.

---

## Tactical work items if you decide to proceed

Concrete checklist, ordered by sequence:

### Pre-sale (do once, before first customer conversation)

- [ ] Draft a one-page "Marco Polo Private" prospectus (problem / solution / price / FAQ)
- [ ] Have a UK solicitor draft a DPA template + EULA for the £8k–25k/year tier (~£500–1500 one-time legal cost)
- [ ] Add a `marco-polo-private` audience to the JWT signing infrastructure (small change to `lib/visa-master/jwt.ts`)
- [ ] Create the `marco_polo_private_licenses` Supabase table + simple admin UI to issue licences
- [ ] Apple Developer ID enrolment if not already done ($99/year)

### First customer (do for customer #1 by hand)

- [ ] Document the manual install procedure as you do it (this becomes the SOP)
- [ ] Set up customer's Mac Mini via screen share or in-person (charge for time)
- [ ] Issue a license JWT, bind to their machine serial
- [ ] Configure their Anthropic key + Telegram bot
- [ ] Establish weekly check-in for first month, then quarterly
- [ ] Update the doc with anything you learned

### Customers #2–#3 (refine the process)

- [ ] Build a `marco-polo-private install` CLI tool that automates the manual steps
- [ ] Build a simple `marco-polo-private status` CLI for customer self-diagnosis
- [ ] Notarise the install bundle
- [ ] Write a customer-facing operations runbook

### Customers #4+ (productise)

- [ ] Build the Sparkle-based auto-updater
- [ ] Build the Electron/Tauri config GUI
- [ ] Build the content auto-update pipeline (signed tarballs, `content.torly.ai`)
- [ ] Build the remote support session tooling
- [ ] Stand up `updates.torly.ai` + `content.torly.ai` as separate services
- [ ] Consider listing on a B2B directory (Capterra, G2) for inbound demand

---

## Open questions

- **Do you want this to be a Torly AI offering, or a separate product brand?** If Torly AI is a "consumer visa-tech" brand, a B2B enterprise offering might benefit from a different name to avoid confusion. Alternatively, the same brand reinforces both lines.
- **Will you offer customisation services?** "We'll tune the agent for your firm's voice and add your case management workflow" is a high-margin services add-on but requires consulting capacity.
- **What's the hardware story you tell customers?** Recommend they buy a Mac Mini M4 (16 GB, 512 GB, ~£900) themselves; or pre-configure Minis and ship them as "Torly AI Appliance" (~£1,500 retail, ~£600 margin per unit). The latter is a hardware business — different ops profile.
- **International deployment.** Customers outside the UK will have similar requests. Does your skill content need country-specific variants (France-Visas is UK-applicant-specific currently)? This is the right time to think about it.
- **Support hours and timezone.** A US East Coast customer expects support during their business hours. Are you prepared to staff this or only sell to UK/EU initially?
- **Compliance certifications.** SOC2 / ISO 27001 are non-trivial. Some enterprise customers will ask. Most early adopters will tolerate "in progress" or "small business, no formal cert" — but past a certain size of customer this becomes a hard gate.

---

## Related work (downstream)

If/when this offering ships:

- `docs/11-architecture.md` — add a section on Marco Polo Private as a distinct deployment path alongside the existing SaaS surfaces
- `CLAUDE.md` — document `marco-polo-private` JWT audience alongside `visa-master-extension` and `torlyai-desktop`
- `lib/visa-master/jwt.ts` — add audience handling for `marco-polo-private`
- New Supabase migration: `marco_polo_private_licenses` table
- `app/api/marco-polo-private/*` — license validation + management endpoints
- `docs/17-ops-dashboard-prd.md` — extend ops dashboard with private deployment metrics (licences issued, machines bound, last-seen timestamps, churn)
- New repo or directory: `marco-polo-private/` — installer source, packaging scripts, configuration GUI

The architectural lift is small. The work is mostly productisation and commercial process.
