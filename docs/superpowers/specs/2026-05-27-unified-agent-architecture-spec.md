# Spec: Marco Polo Unified Agent Architecture

**Date:** 2026-05-27
**Status:** Approved
**Design doc:** `docs/33-marco-polo-unified-agent-architecture.md`
**Scope:** Three-path client surface architecture for the Marco Polo visa advisor agent

---

## 1. What we're building

A unified architecture where one Shared Agent Core (system prompt, 24 tool definitions, 37 skills) serves three client surfaces:

| Path | Surface | Backend | Status |
|---|---|---|---|
| A | Claude.ai (MCP connector) | MCP Gateway at torly.ai | Live |
| C | WhatsApp / Telegram | OpenClaw daemon + Anthropic Messages API | Next to build |
| B | Web chat at torly.ai | Anthropic Managed Agents API | Future |

Build order: A (done) -> C (next) -> B (future).

---

## 2. Shared Agent Core

### 2.1 New directory: `agent-core/`

```
agent-core/
├── SYSTEM_PROMPT.md            # One canonical system prompt for all paths
├── tools/                      # 24 tool definitions as JSON Schema
│   ├── visa_start_here.json
│   ├── visa_plan_trip.json
│   ├── visa_document_checklist.json
│   ├── visa_check_photo.json
│   ├── visa_check_insurance.json
│   ├── visa_check_finances.json
│   ├── visa_draft_cover_letter.json
│   ├── visa_draft_employer_letter.json
│   ├── visa_translate_doc.json
│   ├── visa_apostille.json
│   ├── visa_accommodation.json
│   ├── visa_minor_application.json
│   ├── visa_sponsored_application.json
│   ├── visa_group_application.json
│   ├── visa_france_visas_form.json
│   ├── visa_tlscontact_form.json
│   ├── visa_find_slot.json
│   ├── visa_appointment_prep.json
│   ├── visa_appointment_day.json
│   ├── visa_audit_application.json
│   ├── visa_mock_interview.json
│   ├── visa_refusal_appeal.json
│   ├── visa_track_application.json
│   └── visa_first_trip.json
├── config/
│   ├── path-a.mcp.json         # MCP server tool registration
│   ├── path-b.managed.json     # Managed Agents agent definition
│   └── path-c.openclaw.yaml    # OpenClaw agent config
└── README.md
```

### 2.2 System prompt contract

`SYSTEM_PROMPT.md` is Markdown read at runtime by each path. It references:
- `skills/` for procedure content (relative paths)
- `skills/ETHOS.md` for behavioral guardrails
- `skills/countries/france/KNOWLEDGE.md` for factual ground truth

Each path is responsible for resolving these paths to their own filesystem layout.

### 2.3 Tool definition contract

Each `tools/*.json` file is a JSON Schema object defining:
- `name`: tool name (e.g. `visa_start_here`)
- `description`: what the tool does
- `input_schema`: JSON Schema for parameters
- `skill_path`: relative path to the SKILL.md this tool wraps (e.g. `skills/start-here/SKILL.md`)

Path-specific adapters generate the right format:
- Path A: MCP `tools/list` response
- Path B: Managed Agents tool definition (or MCP server reference)
- Path C: Anthropic Messages API `tools` array

### 2.4 Update propagation

Content updates to `skills/` propagate without redeployment:
- Path A: Next MCP tool call reads updated file (immediate)
- Path C: OpenClaw reads from disk (immediate, or after daemon restart if cached)
- Path B: Next new session mounts updated skills (immediate for new sessions)

---

## 3. Path C — OpenClaw (next to build)

### 3.1 Overview

OpenClaw is a self-hosted Node.js daemon that routes messages between chat platforms and an LLM agent loop. It handles session state, channel adapters, and tool execution locally.

### 3.2 Components

| Component | Implementation |
|---|---|
| **Runtime** | OpenClaw daemon (Node.js 24+) |
| **LLM** | Anthropic Messages API, Claude Sonnet 4.6 |
| **System prompt** | Loaded from `agent-core/SYSTEM_PROMPT.md` |
| **Tool definitions** | Generated from `agent-core/tools/*.json` into Anthropic `tools` format |
| **Tool execution** | Local: reads `skills/` from disk, returns content to LLM |
| **Session state** | OpenClaw built-in per-user session manager |
| **Channels** | WhatsApp (P0), Telegram (P1), Slack/Discord (P2) |
| **Deployment** | VPS or Railway (persistent Node.js process) |
| **Payment** | Stripe payment link sent in-chat at paywall boundary |

### 3.3 Channel priority

| Priority | Channel | Rationale |
|---|---|---|
| P0 | WhatsApp | Primary persona, highest global reach |
| P1 | Telegram | Already in the Visa Master notification ecosystem |
| P2 | Slack / Discord | Developer community, lower priority for visa applicants |

### 3.4 Agent loop flow

```
1. User sends message via WhatsApp
2. OpenClaw channel adapter receives message
3. Session manager loads/creates conversation state for this user
4. Agent loop:
   a. Build Messages API request (system prompt + history + tools)
   b. Send to Anthropic API
   c. If response contains tool_use:
      - Execute tool locally (read skill file, generate text)
      - Append tool_result to conversation
      - Loop back to (a)
   d. If response is text-only: send to user via channel adapter
5. Session manager persists updated conversation state
```

### 3.5 Paywall boundary

- **Free tier:** First 2 tools (`visa_start_here`, `visa_knowledge`) with 10 calls/day
- **Paid tier:** All 24 tools, triggered when the agent would invoke a gated tool
- **Mechanism:** Agent sends a Stripe payment link as a WhatsApp message. After payment confirmation (webhook), the session is upgraded and the agent continues.

### 3.6 File delivery

Cover letters, checklists, and other generated documents are LLM text output (not sandbox files). For WhatsApp delivery:
- Short documents: sent as formatted text messages
- Long documents: converted to PDF server-side, sent as WhatsApp document attachment

### 3.7 Deployment

| Aspect | Choice |
|---|---|
| **Host** | Railway or VPS (e.g. Hetzner) |
| **Process** | systemd user service or Railway persistent process |
| **Repo** | Directory in torlyAI monorepo at `lib/marco-polo/openclaw/` (co-located with existing Marco Polo backend code) |
| **Secrets** | `ANTHROPIC_API_KEY`, WhatsApp Business API credentials, Telegram bot token, Stripe webhook secret |
| **Monitoring** | OpenClaw built-in logs + Supabase usage table |

### 3.8 Limitations (accepted)

- No sandboxed file execution (cover letters are LLM text, not `.docx` files)
- No file upload from user (no image analysis of passport photos)
- No long-running autonomous execution (responds per-message)
- No web search (no live consulate data lookup)

These are acceptable for MVP. Path B addresses all of them.

---

## 4. Path B — Managed Agents (future)

### 4.1 Overview

Anthropic's Managed Agents API provides a hosted agent loop with sandboxed container, file operations, bash execution, and SSE streaming. Path B wraps this with a React chat UI at `torly.ai/marco-polo/app`.

### 4.2 Components

| Component | Implementation |
|---|---|
| **Frontend** | Fork of `vercel/ai-chatbot` (React, Next.js) |
| **Backend proxy** | Next.js API route at `torly.ai/api/marco-polo/chat` |
| **Agent runtime** | Anthropic Managed Agents API |
| **Model** | Claude Sonnet 4.6 (Opus for audit steps if needed) |
| **System prompt** | Passed to `POST /v1/agents` from `agent-core/SYSTEM_PROMPT.md` |
| **Tools** | `agent_toolset_20260401` + MCP server reference for visa tools |
| **Environment** | Cloud container, unrestricted networking |
| **Skills** | Mounted at `/workspace/skills` in sandbox |
| **Auth** | Stripe subscription check in backend proxy |
| **Streaming** | SSE from Managed Agents -> backend proxy -> frontend |

### 4.3 Session lifecycle

1. User visits `torly.ai/marco-polo/app`, signs in
2. Backend creates Managed Agent session (or resumes existing)
3. Frontend opens SSE stream via backend proxy
4. User messages forwarded as `user.message` events
5. Agent streams `agent.message` + `agent.tool_use` events back
6. File generation: agent writes to sandbox -> backend serves via download API
7. `session.status_idle` = agent waiting for user input
8. Sessions persist across browser sessions

### 4.4 Capabilities unlocked (vs Path C)

- File upload and analysis (passport photos, insurance PDFs)
- Real file generation (`.docx` cover letters, formatted checklists)
- Bash execution (photo dimension validation, PDF parsing)
- Multi-day persistent sessions
- Web search for live consulate data
- Progress sidebar UI (8-step visual tracker)

### 4.5 Backend proxy responsibilities

The Next.js API route is a thin layer:
- Authenticate user (Stripe subscription status)
- Create/resume Managed Agent sessions (map user_id -> session_id in Supabase)
- Forward `user.message` events to Anthropic
- Proxy SSE stream back to frontend
- Intercept `agent.tool_use` (write) events to capture generated files
- Log usage to Supabase (tokens, tools called, session duration)
- Enforce per-session token budget (alert at 80%, hard cap at 100%)

---

## 5. Cost model

| | Path A (MCP) | Path C (OpenClaw) | Path B (Managed Agents) |
|---|---|---|---|
| **Who pays LLM** | User (their Claude sub) | You (API key) | You (API key) |
| **Your LLM cost** | £0 | ~£0.50-1.50/app (Sonnet) | ~£1.50-3.00/app (Sonnet + sandbox) |
| **Your infra cost** | Vercel (existing) | VPS ~£5-10/mo | Vercel + MA session fees |
| **User price** | £9/mo or £19/app | £19-29/app | £19-29/app |
| **Margin** | ~100% | ~85-95% | ~75-90% |

---

## 6. Implementation phases

### Phase 1: Shared Agent Core (prerequisite for C and B)
- Create `agent-core/` directory
- Extract canonical system prompt from existing MCP server handler
- Define 24 tool schemas as JSON files
- Create path-specific config templates
- Refactor Path A (MCP server) to consume from `agent-core/` instead of inline definitions

### Phase 2: Path C — OpenClaw MVP
- Set up OpenClaw daemon with Anthropic provider
- Configure WhatsApp Business API channel
- Load system prompt and tools from `agent-core/`
- Implement tool execution (skill file reading)
- Wire Stripe payment link for paywall
- Deploy to VPS/Railway
- Add Telegram channel (P1)

### Phase 3: Path B — Managed Agents (future)
- Fork `vercel/ai-chatbot` for frontend
- Build backend proxy API routes
- Create Managed Agent + Environment via API
- Implement session management (Supabase user -> session mapping)
- Wire SSE streaming through proxy
- Build file download pipeline
- Build progress sidebar UI

---

## 7. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| OpenClaw is young (Jan 2026) — breaking changes | Path C instability | Pin OpenClaw version. Wrap channel adapters so replacement is isolated. |
| WhatsApp Business API approval takes weeks | Delays P0 channel | Start approval process immediately. Ship Telegram first if WhatsApp is blocked. |
| Managed Agents is beta — API changes | Path B instability | Path B is future; API will stabilize by then. Pin beta header version. |
| LLM cost overrun on Path C | Negative margins | Per-session token budget. Monitor cost/app in Supabase. Adjust pricing if needed. |
| Agent quality diverges across paths | Inconsistent user experience | Shared Agent Core enforces one system prompt + one tool set. Content tests validate all paths read from the same source. |

---

## 8. Success criteria

| Metric | Path C (T+30d) | Path B (when built) |
|---|---|---|
| WhatsApp conversations started | 20+ | N/A |
| Full application workflows completed | 5 (dogfood) | 10 |
| Average LLM cost per application | < £1.50 | < £3.00 |
| User satisfaction (post-session) | >= 4/5 | >= 4/5 |
| Shared Agent Core: single-update propagation verified | All 3 paths | All 3 paths |
