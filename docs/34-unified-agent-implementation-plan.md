# Implementation Plan: Marco Polo Unified Agent Architecture

**Document:** 34-unified-agent-implementation-plan.md
**Date:** 2026-05-27
**Status:** Ready for execution
**Spec:** `docs/superpowers/specs/2026-05-27-unified-agent-architecture-spec.md`
**Design:** `docs/33-marco-polo-unified-agent-architecture.md`

---

## Codebase reality check

Before planning, here's what exists today:

**Path A (MCP Gateway) — LIVE:**
- `lib/marco-polo/mcp-server.ts` — MCP server with `registerVisaTools()`
- `lib/marco-polo/mcp-tools/` — 5 of 24 tools implemented:
  - `visa-start-here.ts` (routing + 6 questions)
  - `visa-knowledge.ts` (France facts database)
  - `visa-document-checklist.ts` (personalised doc list)
  - `visa-draft-cover-letter.ts` (30-second-skimmable format)
  - `visa-audit-application.ts` (5-layer pre-submit audit)
- `lib/marco-polo/skill-loader.ts` — reads skill markdown from content/
- `lib/marco-polo/knowledge-loader.ts` — reads knowledge base + consulate files
- `lib/marco-polo/content/` — **complete**: 37 skill files + zh-CN translations + 4 consulate files + ethos.md + knowledge.md
- `lib/marco-polo/mcp-logger.ts` — Supabase usage logging
- `lib/marco-polo/state-manager.ts` — session state
- `app/api/mcp/visa-master/route.ts` — HTTP endpoint

**What does NOT exist yet:**
- `agent-core/` directory (system prompt + tool schemas as standalone artifacts)
- OpenClaw configuration or deployment
- Remaining 19 of 24 tool implementations
- WhatsApp Business API integration
- Managed Agents setup (Path B — future, not in this plan)

---

## Build order

```
Phase 1: Shared Agent Core         ~2-3 sessions
Phase 2: Expand tools (5 → 12)    ~3-4 sessions
Phase 3: OpenClaw MVP (Telegram)   ~2-3 sessions
Phase 4: WhatsApp channel          ~1-2 sessions (mostly API approval wait)
Phase 5: Paywall + monitoring      ~1-2 sessions
```

Total: ~10-14 sessions. Path B (Managed Agents) is explicitly out of scope.

---

## Phase 1: Shared Agent Core

**Goal:** Extract the canonical agent definition from the MCP server into a standalone `agent-core/` directory that all three paths consume.

### Step 1.1: Create agent-core directory structure

**Repo:** Schengen-master (the public skills repo)

```
agent-core/
├── SYSTEM_PROMPT.md
├── tools/
│   ├── visa_start_here.json
│   ├── visa_knowledge.json
│   ├── visa_document_checklist.json
│   ├── visa_draft_cover_letter.json
│   ├── visa_audit_application.json
│   └── (more added in Phase 2)
├── config/
│   ├── path-a.mcp.json
│   └── path-c.openclaw.yaml
└── README.md
```

**Work:**
- [ ] Write `SYSTEM_PROMPT.md` — extract from the implicit system prompt currently embedded across the MCP tool descriptions in `mcp-server.ts`. This becomes the single canonical version.
- [ ] Create `tools/*.json` — one JSON Schema file per tool, extracted from the Zod schemas in `mcp-tools/*.ts`. Each file contains: `name`, `description`, `input_schema`, `skill_path`.
- [ ] Write `config/path-a.mcp.json` — documents how Path A currently consumes the core (reference, not executable).
- [ ] Write `config/path-c.openclaw.yaml` — OpenClaw agent config template.
- [ ] Write `README.md` — explains the agent-core contract and how each path consumes it.

### Step 1.2: Refactor Path A to consume from agent-core

**Repo:** torlyAI

**Work:**
- [ ] Update `mcp-server.ts` `registerVisaTools()` to read tool metadata (name, description) from `agent-core/tools/*.json` instead of inline strings. Tool handler functions stay in `mcp-tools/*.ts`.
- [ ] Load system prompt from `agent-core/SYSTEM_PROMPT.md` instead of embedding it across tool descriptions.
- [ ] Verify: MCP Gateway still works identically after refactor (test via Claude.ai connector).

**Acceptance:** Path A behaviour unchanged. Tool descriptions now sourced from JSON files.

---

## Phase 2: Expand tool implementations (5 → 12)

**Goal:** Implement the highest-value tools needed for a useful WhatsApp conversation. Not all 24 — just enough for the core visa workflow.

### Priority tool set for Path C MVP

| Tool | Why needed for WhatsApp MVP | Skill source |
|---|---|---|
| `visa_plan_trip` | First tool after start_here — trip planning | `plan-trip.md` |
| `visa_check_photo` | Users ask about photo requirements constantly | `photo-check.md` |
| `visa_check_insurance` | Common question, high refusal risk | `insurance-check.md` |
| `visa_check_finances` | Bank statement review | `bank-statement-check.md` |
| `visa_draft_employer_letter` | Employment letter template | `employment-letter.md` |
| `visa_france_visas_form` | Form-filling guidance (the most confusing step) | `france-visas-form.md` |
| `visa_refusal_appeal` | Recovery advisor for refused applicants | `refusal-appeal.md` |

**Work:**
- [ ] Implement `visa_plan_trip` — read `plan-trip.md`, route based on travel dates + group composition
- [ ] Implement `visa_check_photo` — read `photo-check.md`, return 35x45mm spec + common rejection reasons
- [ ] Implement `visa_check_insurance` — read `insurance-check.md`, verify Schengen coverage requirements
- [ ] Implement `visa_check_finances` — read `bank-statement-check.md`, return per-applicant thresholds
- [ ] Implement `visa_draft_employer_letter` — read `employment-letter.md`, generate template
- [ ] Implement `visa_france_visas_form` — read `france-visas-form.md`, 10-section walkthrough
- [ ] Implement `visa_refusal_appeal` — read `refusal-appeal.md`, interpret codes 1-9
- [ ] Add JSON schemas to `agent-core/tools/` for each new tool
- [ ] Register all 12 tools in `mcp-server.ts`
- [ ] Test via Claude.ai MCP connector

**Acceptance:** 12 tools registered and working in Path A. JSON schemas match implementations.

---

## Phase 3: OpenClaw MVP (Telegram first)

**Goal:** Get the visa agent responding to messages in Telegram. Telegram first because: no Business API approval needed (just a bot token), and you already have Telegram infrastructure from Visa Master notifications.

### Step 3.1: OpenClaw installation and config (on MacBook M1 Pro in study)

**Prerequisite:** Complete Appendix A (M1 Pro dev environment setup) first. This gives you: Node.js 24, OpenClaw installed + daemon running, repos cloned, Telegram bot created, Tailscale tunnel active.

**Work (on the M1 Pro):**
- [ ] Complete Appendix A steps A.1–A.10 (full machine setup)
- [ ] Configure OpenClaw to use the shared agent core from the cloned repos:
  - System prompt: `~/AI/AI_Coding/Workspaces/Schengen-visa/agent-core/SYSTEM_PROMPT.md`
  - Tool schemas: `~/AI/AI_Coding/Workspaces/Schengen-visa/agent-core/tools/*.json`
  - Skills content: `~/AI/AI_Coding/Repositories/torlyAI/lib/marco-polo/content/`
- [ ] Configure tool definitions from `agent-core/tools/*.json` (12 tools)
- [ ] Test: send a message locally, verify OpenClaw calls Anthropic API with the shared system prompt

### Step 3.2: Implement tool execution in OpenClaw

**Work:**
- [ ] Write tool executor that maps tool calls to skill file reads — when the LLM calls `visa_start_here`, the executor reads `content/skills/start-here.md` and returns the content
- [ ] For generation tools (cover letter, employer letter): return LLM-generated text directly (no sandbox needed)
- [ ] For lookup tools (knowledge, photo check, insurance): read the relevant markdown and return it
- [ ] Test: send message to OpenClaw locally, verify it calls Anthropic API and returns a structured response

### Step 3.3: Wire Telegram channel

**Work:**
- [ ] Create a Telegram bot via @BotFather (e.g. `@MarcoPolo_VisaBot`)
- [ ] Configure OpenClaw Telegram channel adapter with bot token
- [ ] Test end-to-end: send "I need a France Schengen visa" in Telegram → agent responds with routing questions → follow-up messages work
- [ ] Verify session persistence: close Telegram, reopen, send follow-up → agent remembers context
- [ ] Test bilingual: send message in Chinese → agent responds in Chinese

### Step 3.4: Deploy (native local → Dockerize → production)

**Dev/dogfood on M1 Pro (Phase 3):**
- [ ] OpenClaw running natively via `launchd` on MacBook M1 Pro (Appendix A)
- [ ] Tailscale Funnel or Cloudflare Tunnel active for webhook ingress
- [ ] Verify Telegram bot works from a phone (not just desktop)
- [ ] Set up basic monitoring: log conversations to Supabase `marco_polo_openclaw_events` table

**Dockerize (Phase 4 — after Telegram is validated):**
- [ ] Create `lib/marco-polo/openclaw/Dockerfile` — captures the working native setup
- [ ] Create `lib/marco-polo/openclaw/docker-compose.yml` — env vars, volume mounts for content
- [ ] Verify: `docker compose up` on M1 Pro produces identical behaviour to native install
- [ ] Content layer as volume mount — edit skills on host, live in container

**Production migration (Phase 5, when paying users arrive):**
- [ ] Push Docker image to container registry (Docker Hub or GitHub Container Registry)
- [ ] Deploy to Railway or Fly.io
- [ ] Update Telegram/WhatsApp webhook URLs to production URL
- [ ] Verify identical behaviour in production
- [ ] M1 Pro continues as staging/dogfood; production runs on Railway/Fly.io

**Acceptance:** Telegram bot responds to visa questions using 12 tools. Sessions persist. Bilingual works.

---

## Phase 4: WhatsApp channel

**Goal:** Add WhatsApp as the primary channel. This is mostly a business process (Meta approval) with some technical wiring.

### Step 4.1: WhatsApp Business API setup

**Work:**
- [ ] Create Meta Business account (if not already)
- [ ] Apply for WhatsApp Business API access
- [ ] Set up a WhatsApp Business phone number
- [ ] Configure message templates (required for business-initiated messages)
- [ ] Wait for approval (typically 1-2 weeks)

### Step 4.2: Wire WhatsApp channel in OpenClaw

**Work:**
- [ ] Configure OpenClaw WhatsApp channel adapter with Business API credentials
- [ ] Test end-to-end: WhatsApp message → agent response
- [ ] Handle WhatsApp-specific constraints:
  - Message length limits (4096 chars) — split long responses
  - Media messages — send generated documents as PDF attachments
  - 24-hour messaging window — template messages for re-engagement
- [ ] Test from multiple devices

**Acceptance:** WhatsApp bot works end-to-end. Long responses split correctly. Documents delivered as attachments.

---

## Phase 5: Paywall + monitoring

**Goal:** Add payment gating and operational visibility.

### Step 5.1: Paywall

**Work:**
- [ ] Define free tier boundary: `visa_start_here` + `visa_knowledge` only, 10 calls/day
- [ ] When user hits a gated tool, agent sends a Stripe payment link in-chat
- [ ] Stripe webhook handler: on payment success, mark user session as paid in Supabase
- [ ] Agent checks payment status before executing gated tools
- [ ] Test: unpaid user hits paywall → pays → conversation continues seamlessly

### Step 5.2: Monitoring dashboard

**Work:**
- [ ] Log all OpenClaw conversations to Supabase:
  - `user_id` (channel + phone/telegram ID hash)
  - `channel` (telegram/whatsapp)
  - `tool_name`, `duration_ms`, `tokens_used`
  - `payment_status` (free/paid)
- [ ] Extend existing ops dashboard (`/admin/ops`) with OpenClaw tab:
  - Conversations per day
  - Tool usage distribution
  - Conversion rate (free → paid)
  - Cost per conversation
- [ ] Set up alerts: cost per conversation > £2 threshold

**Acceptance:** Paywall blocks gated tools for free users. Dashboard shows conversation metrics.

---

## What's NOT in this plan

| Item | Why deferred |
|---|---|
| Path B (Managed Agents web chat) | Future phase — OpenClaw validates the agent first |
| Tools 13-24 | Build incrementally based on user demand from Path C conversations |
| Slack / Discord channels | P2 — add after WhatsApp/Telegram are validated |
| File upload (user sends photo for review) | Requires Managed Agents sandbox (Path B) |
| Progress sidebar UI | Web-only (Path B) |
| Multi-country support | France first, Italy + Germany after validation |

---

## Dependencies and blockers

| Dependency | Blocks | Lead time | Action |
|---|---|---|---|
| M1 Pro dev environment setup | Phase 3 | ~1-2 hours | Follow Appendix A before starting Phase 3 |
| Tailscale account + Funnel | Phase 3 | ~15 min | Set up during Appendix A step A.7 |
| Telegram bot token (@BotFather) | Phase 3 | ~5 min | Set up during Appendix A step A.6 |
| WhatsApp Business API approval | Phase 4 | 1-2 weeks | Start application at beginning of Phase 3 so it's ready when needed |
| Docker (for production migration) | Phase 4-5 | ~10 min | `brew install docker` on M1 Pro when needed |
| Railway / Fly.io account | Phase 5 | < 1 hour | Set up when paying users arrive |
| OpenClaw stability | Phase 3-5 | Ongoing | Pin version, monitor releases |
| Stripe payment links | Phase 5 | Already have Stripe (Visa Master) | Reuse existing Stripe account |

---

## Verification checkpoints

| After phase | Verify |
|---|---|
| Phase 1 | Path A MCP Gateway works identically; tool descriptions sourced from JSON |
| Phase 2 | 12 tools work in Claude.ai; JSON schemas match implementations |
| Phase 3 | Telegram bot: full conversation flow, session persistence, bilingual |
| Phase 4 | WhatsApp bot: same as Telegram + message splitting + document attachments |
| Phase 5 | Paywall: free→paid upgrade works; dashboard: metrics visible |

---

## Session estimates

| Phase | Sessions | Calendar (1 session/day) |
|---|---|---|
| Phase 1: Shared Agent Core | 2-3 | Week 1 |
| Phase 2: Expand tools (5→12) | 3-4 | Week 1-2 |
| Phase 3: OpenClaw + Telegram | 2-3 | Week 2-3 |
| Phase 4: WhatsApp channel | 1-2 | Week 3 (plus approval wait) |
| Phase 5: Paywall + monitoring | 1-2 | Week 3-4 |
| **Total** | **10-14** | **~4 weeks** |

---

## Two-machine development model

| | Primary dev machine (current) | MacBook M1 Pro (study) |
|---|---|---|
| **Role** | Extension, torlyAI backend, skills authoring, MCP Gateway, docs | OpenClaw daemon, Telegram/WhatsApp bot, dogfood testing |
| **Repos** | `Schengen-visa` + `torlyAI` (source of truth) | Clones of both (pull to sync) |
| **What runs here** | Vercel dev server, extension dev, Claude Code sessions | OpenClaw daemon (always-on), Tailscale/Cloudflare tunnel |
| **What gets edited here** | `agent-core/`, `skills/`, `lib/marco-polo/mcp-tools/`, `lib/marco-polo/content/`, docs | `lib/marco-polo/openclaw/` (OpenClaw config, tool executor, channel wiring) |
| **Sync method** | `git push` | `git pull` (OpenClaw reads content from disk — changes are live after pull) |

**Rule:** Each machine owns its files. Don't edit `agent-core/` on the M1 Pro or `openclaw/` config on the primary machine. Git is the sync mechanism.

---

## Appendix A: MacBook M1 Pro — Full Dev Environment Setup

This appendix covers setting up the M1 Pro from a fresh macOS install to a working OpenClaw dev/dogfood machine.

### A.1 macOS system setup

```bash
# 1. Accept Xcode command-line tools (will prompt on first git/dev tool use)
xcode-select --install

# 2. Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 3. Add Homebrew to PATH (Apple Silicon default location)
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"

# 4. Install essentials
brew install git node@24 pnpm gh

# 5. Verify
node --version    # should be v24.x
pnpm --version
git --version
gh --version
```

### A.2 Git and GitHub setup

```bash
# Configure git identity
git config --global user.name "Jason-uk"
git config --global user.email "dukeharewood@gmail.com"

# Authenticate GitHub CLI
gh auth login
# Follow prompts: GitHub.com → HTTPS → authenticate via browser

# Verify
gh auth status
```

### A.3 Clone repositories

```bash
# Create workspace structure matching the primary machine
mkdir -p ~/AI/AI_Coding/Workspaces
mkdir -p ~/AI/AI_Coding/Repositories

# Clone Schengen-visa (skills, agent-core, extension, docs)
cd ~/AI/AI_Coding/Workspaces
gh repo clone DukeWood/Schengen-visa
# This is also mirrored as torlyai/Schengen-master (public)

# Clone torlyAI (backend, MCP server, content layer)
cd ~/AI/AI_Coding/Repositories
gh repo clone DukeWood/torlyAI

# Verify both repos
cd ~/AI/AI_Coding/Workspaces/Schengen-visa && git status
cd ~/AI/AI_Coding/Repositories/torlyAI && git status
```

### A.4 Install OpenClaw

```bash
# Method 1: Installer script (recommended — handles Node.js, PATH, daemon)
curl -fsSL https://openclaw.ai/install.sh | bash

# Method 2: npm global install (if you prefer manual control)
npm install -g openclaw@latest

# Run onboarding wizard + install as launchd daemon
openclaw onboard --install-daemon

# Verify installation
openclaw --version
openclaw doctor          # checks dependencies, permissions, config
openclaw gateway status  # should show "running" after onboard
```

### A.5 Configure Anthropic as LLM provider

During `openclaw onboard`, you'll be prompted for an LLM provider. Choose Anthropic and paste your API key.

If configuring manually, edit `~/.openclaw/openclaw.json`:

```json
{
  "agent": {
    "model": "anthropic/claude-sonnet-4-6"
  }
}
```

Set the API key as an environment variable (add to `~/.zprofile` for persistence):

```bash
echo 'export ANTHROPIC_API_KEY="sk-ant-your-key-here"' >> ~/.zprofile
source ~/.zprofile
```

### A.6 Configure Telegram channel

```bash
# 1. Create a Telegram bot:
#    - Open Telegram, message @BotFather
#    - Send /newbot
#    - Name: "Marco Polo Visa Advisor"
#    - Username: MarcoPolo_VisaBot (or similar available name)
#    - Copy the bot token

# 2. Add Telegram channel in OpenClaw config (~/.openclaw/openclaw.json):
```

Add to your `openclaw.json`:

```json
{
  "agent": {
    "model": "anthropic/claude-sonnet-4-6"
  },
  "channels": {
    "telegram": {
      "bot_token": "YOUR_TELEGRAM_BOT_TOKEN"
    }
  }
}
```

```bash
# 3. Restart the gateway to pick up the new channel
openclaw gateway restart

# 4. Test: message your bot in Telegram
#    Send: "Hello, can you help me with a France Schengen visa?"
#    The bot should respond using the default OpenClaw agent
```

### A.7 Set up network ingress (Tailscale or Cloudflare Tunnel)

Telegram sends webhook callbacks to your machine. You need a public URL pointing to the OpenClaw gateway port (default: 18789).

**Option A: Tailscale (recommended — zero config, encrypted)**

```bash
# Install Tailscale
brew install tailscale

# Start and authenticate
# (Opens browser for Tailscale account login)
sudo tailscale up

# Enable Tailscale Funnel (exposes a local port to the internet)
tailscale funnel 18789

# This gives you a URL like: https://your-machine-name.tail1234.ts.net/
# Use this as the Telegram webhook URL
```

**Option B: Cloudflare Tunnel (alternative)**

```bash
# Install cloudflared
brew install cloudflared

# Create a tunnel (requires Cloudflare account)
cloudflared tunnel login
cloudflared tunnel create marco-polo
cloudflared tunnel route dns marco-polo openclaw.torly.ai

# Run the tunnel
cloudflared tunnel run --url http://localhost:18789 marco-polo
```

### A.8 macOS always-on settings

The M1 Pro needs to stay awake for the bot to respond 24/7:

```
System Settings → Energy:
  ☑ Prevent automatic sleeping when the display is off
  ☑ Wake for network access

System Settings → Lock Screen:
  Set "Turn display off" to a reasonable time (10-30 min)
  (Display sleeps but machine stays awake)

System Settings → General → Software Update:
  ☐ Automatic updates OFF (or schedule for a specific maintenance window)
  (Prevent surprise reboots that kill the daemon)
```

OpenClaw's `launchd` service auto-restarts after a reboot. Verify with:

```bash
# After a reboot:
openclaw gateway status  # should show "running"
```

### A.9 Sync workflow (daily routine)

```bash
# On the M1 Pro — pull latest changes from primary dev machine
cd ~/AI/AI_Coding/Workspaces/Schengen-visa && git pull
cd ~/AI/AI_Coding/Repositories/torlyAI && git pull

# OpenClaw reads content from disk at runtime, so:
# - Skill updates: live immediately after pull
# - Tool schema changes: may need gateway restart
# - OpenClaw config changes: need gateway restart

openclaw gateway restart  # only if tool schemas or config changed
```

### A.10 Verification checklist

After completing setup, verify everything works:

- [ ] `node --version` returns v24.x
- [ ] `openclaw --version` returns latest
- [ ] `openclaw doctor` passes all checks
- [ ] `openclaw gateway status` shows "running"
- [ ] Both repos cloned and `git pull` works
- [ ] Telegram bot responds to a test message
- [ ] Tailscale/Cloudflare tunnel is active (webhook ingress working)
- [ ] macOS energy settings: machine doesn't sleep when lid is closed (if using external display) or display is off
- [ ] After a reboot: `openclaw gateway status` shows "running" (launchd auto-restart works)
