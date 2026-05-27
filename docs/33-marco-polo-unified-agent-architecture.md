# Marco Polo — Unified Agent Architecture Design

**Document:** 33-marco-polo-unified-agent-architecture.md
**Date:** 2026-05-27
**Status:** Design approved — pre-spec
**Owner:** Duke Harewood (Torly AI)
**Related docs:**
- `32-marco-polo-managed-agent-prd.md` — Original PRD (dual-path MCP Gateway + Hosted Chat)
- `11-architecture.md` — System architecture (extension + backend)
- `skills/ETHOS.md` — 12 behavioral principles
- `skills/countries/france/KNOWLEDGE.md` — France factual ground truth

---

## Table of Contents

1. [Unified Architecture Overview](#1-unified-architecture-overview)
2. [Path C — OpenClaw Router (Deep Dive)](#2-path-c--openclaw-router-deep-dive)
3. [Path B — Managed Agents Web Chat UI (Future Deep Dive)](#3-path-b--managed-agents-web-chat-ui-future-deep-dive)
4. [Shared Agent Core](#4-shared-agent-core)
5. [Cost Model](#5-cost-model)

---

## 1. Unified Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                        MARCO POLO — UNIFIED AGENT ARCHITECTURE                        │
│                                                                                       │
│  ┌────────────────────────────────────────────────────────────────────────────────┐   │
│  │                         SHARED AGENT CORE                                      │   │
│  │                                                                                │   │
│  │  System prompt (one canonical version)                                         │   │
│  │  Tool definitions (24 tools, typed schemas)                                    │   │
│  │  Content layer: skills/ (x37) · ETHOS.md · KNOWLEDGE.md · consulate files (x4) │   │
│  │  i18n: EN + zh-CN                                                              │   │
│  └────────────────────────────────┬───────────────────────────────────────────────┘   │
│                                   │                                                   │
│                    ┌──────────────┼──────────────────┐                                │
│                    ▼              ▼                   ▼                                │
│              PATH A          PATH C              PATH B                               │
│           MCP Gateway     OpenClaw Router     Managed Agent                           │
│                                                                                       │
│  ┌──────────────────┐  ┌────────────────────┐  ┌───────────────────┐                 │
│  │ torly.ai/mcp/     │  │ Self-hosted        │  │ Anthropic Managed │                 │
│  │ visa-master       │  │ OpenClaw daemon    │  │ Agents API        │                 │
│  │                   │  │                    │  │                   │                 │
│  │ 24 MCP tools      │  │ Messages API +    │  │ Agent + Environ-  │                 │
│  │ OAuth + Stripe    │  │ tool execution    │  │ ment + Session    │                 │
│  │ Rate limiting     │  │ Channel routing   │  │ SSE streaming     │                 │
│  │ Usage logging     │  │                    │  │ Sandbox (files,   │                 │
│  │                   │  │                    │  │ bash, web search) │                 │
│  └────────┬─────────┘  └────────┬───────────┘  └────────┬──────────┘                 │
│           ▼                     ▼                        ▼                             │
│  ┌──────────────────┐  ┌────────────────────┐  ┌───────────────────┐                 │
│  │ Claude.ai        │  │ WhatsApp           │  │ torly.ai/marco-   │                 │
│  │ (user's own sub) │  │ Telegram           │  │ polo/app          │                 │
│  │                   │  │ Slack / Discord    │  │ (React chat UI)   │                 │
│  │ LIVE             │  │ NEXT TO BUILD      │  │ FUTURE            │                 │
│  └──────────────────┘  └────────────────────┘  └───────────────────┘                 │
│                                                                                       │
│  WHO ORCHESTRATES:                                                                    │
│  Path A: Claude.ai (Anthropic's harness)                                             │
│  Path C: OpenClaw + Messages API (your agent loop)                                   │
│  Path B: Managed Agents (Anthropic's hosted agent loop)                              │
│                                                                                       │
│  WHO PAYS FOR LLM:                                                                    │
│  Path A: User (their Claude sub)          -> you charge £9/mo for tools              │
│  Path C: You (Anthropic API key)          -> you charge £19-29/app                   │
│  Path B: You (Anthropic API key)          -> you charge £19-29/app                   │
│                                                                                       │
│  BUILD ORDER:                                                                         │
│  Path A: MCP Gateway -> Claude.ai           LIVE                                     │
│  Path C: OpenClaw -> WhatsApp/Telegram      NEXT TO BUILD                            │
│  Path B: Managed Agents -> Web Chat UI      FUTURE                                   │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

**Key design principle:** The Shared Agent Core is a *repo artifact* — a directory in Schengen-master containing the canonical system prompt, tool schemas, and skill content. Each path *consumes* it differently but never forks it.

**Build order:** A (done) -> C (next) -> B (future). Each path ships independently.

**Why C before B:** The primary persona ("I've never applied for a visa before") is on WhatsApp, not browsing developer tools. OpenClaw routing to WhatsApp/Telegram gets a working agent in front of real users faster than building a custom web chat — and validates the agent's conversational flow before investing in the full Managed Agents sandbox.

---

## 2. Path C — OpenClaw Router (Deep Dive)

### 2.1 What OpenClaw does in this architecture

OpenClaw acts as a **message router + agent loop**, not a UI. It:
1. Receives messages from WhatsApp/Telegram/Slack/Discord
2. Routes them to an Anthropic Messages API call with the shared system prompt + tools
3. Executes tool calls locally (reading skill files, generating documents)
4. Sends responses back to the originating channel

```
User (WhatsApp)
    │
    ▼
┌──────────────────────────────────┐
│          OpenClaw Gateway         │
│                                   │
│  Channel adapter (WhatsApp)       │
│          ▼                        │
│  Session manager                  │
│  (per-user conversation state)    │
│          ▼                        │
│  Agent loop                       │
│  ┌─────────────────────────────┐ │
│  │ System prompt (from core)   │ │
│  │ 24 tool definitions         │ │
│  │ Anthropic Messages API      │ │
│  │ Tool execution (local)      │ │
│  └─────────────────────────────┘ │
│          ▼                        │
│  Response -> WhatsApp adapter     │
└──────────────────────────────────┘
```

### 2.2 Channel priority

| Channel | Priority | Why |
|---|---|---|
| **WhatsApp** | P0 — ship first | Primary persona lives here. 2B+ users globally. Highest reach for non-technical visa applicants. |
| **Telegram** | P1 — ship alongside or shortly after | Already wired for Visa Master notifications. Users in the ecosystem. |
| **Slack / Discord** | P2 — future | Developer/community channels. Lower priority for visa applicants. |

### 2.3 Conversation flow in WhatsApp

```
User: "Hi, I need a France Schengen visa"

OpenClaw -> Anthropic API (system prompt + visa_start_here tool)

Agent: "I can help with that! Let me ask a few questions to
        personalise your roadmap.

        1. Where are you applying from? (e.g. UK, China, India)
        2. How many people are travelling?
        3. Are any travellers under 18?"

User: "UK, me and my wife, no kids"

Agent: [calls visa_plan_trip, visa_document_checklist]
       "Here's your personalised roadmap:
        ✅ Trip plan: 2 adults, tourism, UK -> France
        📋 Documents needed: 12 items
        ⏱ Timeline: ~3 weeks before travel

        Shall I start with the cover letter, or would you
        prefer to go through the document checklist first?"
```

### 2.4 Key design decisions for Path C

| Decision | Choice | Rationale |
|---|---|---|
| **LLM provider** | Anthropic Messages API (Claude Sonnet) | Shared with Path A. Sonnet balances cost vs quality for chat-speed responses. |
| **Agent loop** | OpenClaw's built-in agent loop | No need to build your own. OpenClaw handles message -> LLM -> tool -> response. |
| **Tool execution** | Local (OpenClaw reads `skills/` from disk) | Skills are markdown files — no sandbox needed for reading. Document *generation* (cover letters) happens as LLM text output, not file writes. |
| **Session state** | OpenClaw's per-user session manager | Conversations persist across messages. User can pick up where they left off. |
| **File delivery** | WhatsApp document messages | Generated PDFs/docs sent as WhatsApp attachments via the channel adapter. |
| **Deployment** | VPS or Railway (self-hosted daemon) | OpenClaw runs as a Node.js service. Needs a persistent process, not serverless. |
| **Auth / payment** | Stripe payment link sent in-chat | User pays via link before the agent proceeds past the free tier (e.g., first 2 tools free, full 24 requires payment). |

### 2.5 What OpenClaw does NOT do (vs Managed Agents)

| Capability | OpenClaw (Path C) | Managed Agents (Path B, future) |
|---|---|---|
| Sandboxed file execution | No — tool output is LLM text | Yes — writes files, runs scripts in container |
| Long-running async tasks | Limited — responds per-message | Yes — sessions run for hours |
| Web search built-in | No — you'd add via MCP or tool | Yes — built-in tool |
| Container state | No | Yes — persistent filesystem |

This is fine for the visa use case: cover letters and checklists are text the LLM generates in the response. You don't need a sandbox to produce them.

---

## 3. Path B — Managed Agents Web Chat UI (Future Deep Dive)

### 3.1 What Managed Agents adds over Path C

Path B is the premium surface — when you need capabilities that OpenClaw can't provide:

| Capability | Why it matters for visa applications |
|---|---|
| **Sandboxed file generation** | Agent writes actual `.docx` cover letters, fills PDF forms, generates formatted checklists — user downloads real files, not copy-paste text |
| **Bash execution** | Agent can run validation scripts (e.g., check photo dimensions, verify insurance PDF dates) |
| **Persistent filesystem** | Multi-session workflow — user uploads passport scan in session 1, agent references it in session 5 |
| **Long-running execution** | Full 8-step workflow runs autonomously for hours — agent doesn't stop between messages |
| **Web search + fetch** | Agent pulls live data (consulate hours, TLScontact slot availability, France-Visas form updates) |

### 3.2 Architecture

```
User (browser)
    │
    ▼
┌─────────────────────────────────────────────────┐
│  torly.ai/marco-polo/app                         │
│  (React chat UI — vercel/ai-chatbot fork)        │
│                                                   │
│  Chat interface + file upload/download            │
│  Progress sidebar (8-step tracker)                │
│  Session resume (pick up where you left off)      │
└────────────────────┬──────────────────────────────┘
                     │ REST / SSE
                     ▼
┌─────────────────────────────────────────────────┐
│  torly.ai/api/marco-polo/chat                    │
│  (Next.js API route — thin proxy)                │
│                                                   │
│  Auth (Stripe subscription check)                 │
│  Create/resume Managed Agent session              │
│  Forward user messages as events                  │
│  Proxy SSE stream back to frontend                │
│  Usage logging (Supabase)                         │
└────────────────────┬──────────────────────────────┘
                     │ Anthropic Managed Agents API
                     ▼
┌─────────────────────────────────────────────────┐
│  Anthropic Managed Agents                        │
│                                                   │
│  Agent: marco-polo-visa-advisor                   │
│    model: claude-sonnet-4-6                       │
│    system: shared agent core system prompt         │
│    tools: agent_toolset_20260401 + MCP servers    │
│                                                   │
│  Environment: cloud container                     │
│    networking: unrestricted (TLS + France-Visas)  │
│    files: skills/ mounted at /workspace/skills    │
│                                                   │
│  Session: per-user, persistent                    │
│    streams SSE events back to your proxy          │
└──────────────────────────────────────────────────┘
```

### 3.3 Session lifecycle

```
1. User visits torly.ai/marco-polo/app
2. Signs in (or creates account) -> Stripe subscription verified
3. Frontend calls POST /api/marco-polo/chat/session
   -> Backend creates Managed Agent session (or resumes existing)
   -> Returns session_id
4. Frontend opens SSE stream to /api/marco-polo/chat/stream?session={id}
   -> Backend proxies from Anthropic SSE endpoint
5. User types message -> POST /api/marco-polo/chat/message
   -> Backend sends user.message event to session
   -> Agent processes, streams agent.message + agent.tool_use events
6. Agent generates file -> agent.tool_use (write) event
   -> Backend captures file -> serves via /api/marco-polo/chat/files/{id}
   -> Frontend shows download button
7. session.status_idle -> agent done, waiting for user
8. User can close browser, return later -> session resumes from last state
```

### 3.4 Key design decisions for Path B

| Decision | Choice | Rationale |
|---|---|---|
| **Frontend** | Fork of `vercel/ai-chatbot` | Battle-tested chat UI. Streaming, file upload, message history. Matches Vercel stack. |
| **Backend proxy** | Next.js API route at torly.ai | Thin layer: auth + session management + SSE proxy. No agent logic — Managed Agents handles that. |
| **Model** | Claude Sonnet 4.6 | Best cost/quality ratio for conversational agent. Upgrade to Opus for complex audit steps if needed. |
| **File generation** | Agent writes to sandbox filesystem | Real `.docx`/`.pdf` files. Proxy extracts them and serves to frontend. |
| **Session persistence** | Managed Agents built-in | Sessions survive browser close. User resumes with full context. |
| **Cost control** | Per-session token budget | Set max tokens per session to cap costs. Alert user at 80% threshold. |

### 3.5 What's deferred until Path B ships

These capabilities are **not available in Path C** and wait for Path B:

- File upload (user uploads passport photo, insurance PDF -> agent analyses in sandbox)
- Automated form-filling (agent writes France-Visas form data as structured output)
- Multi-day workflows (user works on application across a week, session remembers everything)
- Progress sidebar UI (visual 8-step tracker)

---

## 4. Shared Agent Core

This is the piece that makes the three paths consistent.

### 4.1 Repository layout

```
Schengen-master/
├── agent-core/                    <-- NEW directory
│   ├── SYSTEM_PROMPT.md           <-- One canonical system prompt
│   ├── tools/                     <-- 24 tool definitions (JSON Schema)
│   │   ├── visa_start_here.json
│   │   ├── visa_plan_trip.json
│   │   ├── visa_document_checklist.json
│   │   └── ... (24 total)
│   ├── config/
│   │   ├── path-a.mcp.json        <-- MCP server tool registration
│   │   ├── path-b.managed.json    <-- Managed Agents agent definition
│   │   └── path-c.openclaw.yaml   <-- OpenClaw agent config
│   └── README.md                  <-- How each path consumes the core
├── skills/                        <-- Existing (unchanged)
│   ├── start-here/SKILL.md
│   ├── plan-trip/SKILL.md
│   └── ... (37 total)
├── .claude-plugin/                <-- Existing (unchanged)
└── extension/                     <-- Existing (unchanged)
```

### 4.2 How each path consumes the core

| | System prompt | Tool definitions | Skills content | Tool execution |
|---|---|---|---|---|
| **Path A (MCP)** | Embedded in MCP server handler | MCP tool schemas (generated from `tools/*.json`) | Read from `skills/` at request time | MCP server handler (your code) |
| **Path C (OpenClaw)** | Loaded into OpenClaw agent config | Anthropic tool_use definitions (generated from `tools/*.json`) | Read from disk by OpenClaw daemon | OpenClaw agent loop (local) |
| **Path B (Managed)** | Passed to `POST /v1/agents` `system` field | `agent_toolset_20260401` + MCP server pointing to your tools | Mounted in sandbox at `/workspace/skills` | Anthropic's sandbox |

### 4.3 Single-update propagation

When a skill is updated (e.g., `skills/cover-letter/SKILL.md` gets a new template):

- **Path A:** Next MCP tool call reads the updated file -> immediate
- **Path C:** OpenClaw daemon reads from disk -> immediate (or after restart if cached)
- **Path B:** Next session creation mounts updated `skills/` -> immediate for new sessions

No redeployment needed for content updates. The shared content layer is **read at runtime, not compiled in**.

---

## 5. Cost Model

| | Path A (MCP) | Path C (OpenClaw) | Path B (Managed Agents) |
|---|---|---|---|
| **Who pays LLM** | User (their Claude sub) | You (API key) | You (API key) |
| **Your LLM cost** | £0 | ~£0.50-1.50/application (Sonnet) | ~£1.50-3.00/application (Sonnet + sandbox) |
| **Your infra cost** | Vercel (existing) | VPS ~£5-10/mo (OpenClaw daemon) | Vercel (existing) + Managed Agents session fees |
| **User price** | £9/mo or £19/app | £19-29/app | £19-29/app |
| **Margin** | ~100% (no LLM cost) | ~85-95% | ~75-90% |

---

## Research Sources

- [Claude Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview)
- [Get started with Claude Managed Agents](https://platform.claude.com/docs/en/managed-agents/quickstart)
- [OpenClaw GitHub](https://github.com/openclaw/openclaw)
- [Anthropic Agent SDK overview](https://code.claude.com/docs/en/agent-sdk/overview)
