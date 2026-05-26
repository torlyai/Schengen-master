# PRD: Marco Polo — AI Visa Advisor (MCP Gateway + Hosted UI)

**Document:** 32-marco-polo-managed-agent-prd.md
**Version:** 0.2
**Date:** 2026-05-26
**Status:** Draft — architecture exploration (revised: dual-path architecture)
**Owner:** Duke Harewood (Torly AI)
**Related docs:**
- `27-plugin-marketplace-prd.md` — Claude Code Plugin Marketplace distribution (Surface 2)
- `09-visa-master-premium-prd.md` — Chrome extension Premium tier (Surface 1)
- `11-architecture.md` — System architecture (extension + backend)
- `skills/ETHOS.md` — 12 behavioral principles
- `skills/countries/france/KNOWLEDGE.md` — France factual ground truth

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Why Build This Now](#2-why-build-this-now)
3. [Goals, Non-Goals, and Success Metrics](#3-goals-non-goals-and-success-metrics)
4. [Personas](#4-personas)
5. [Product Positioning — Four Surfaces](#5-product-positioning--four-surfaces)
6. [Dual-Path Architecture](#6-dual-path-architecture)
7. [Path A: MCP Gateway (Primary)](#7-path-a-mcp-gateway-primary)
8. [Path B: Hosted Chat UI (Secondary)](#8-path-b-hosted-chat-ui-secondary)
9. [Managed Agent Internals (Shared by Both Paths)](#9-managed-agent-internals-shared-by-both-paths)
10. [Skill Distribution Strategy](#10-skill-distribution-strategy)
11. [Workflow Diagrams](#11-workflow-diagrams)
12. [Wireframes](#12-wireframes)
13. [API Surface](#13-api-surface)
14. [Cross-Repo Code Layout](#14-cross-repo-code-layout)
15. [Decisions Log](#15-decisions-log)
16. [Phased Implementation](#16-phased-implementation)
17. [Cost Model](#17-cost-model)
18. [Risks and Mitigations](#18-risks-and-mitigations)
19. [Open Questions](#19-open-questions)
20. [Verification Criteria](#20-verification-criteria)

---

## 1. Executive Summary

Marco Polo is an **AI-powered Schengen visa advisor** that turns the existing 37 skills into an end-to-end conversational agent. Instead of users invoking skills one-by-one in Claude Code, the agent drives the full application lifecycle — from "I want a visa" to "your appointment is booked."

**Dual-path architecture:**

- **Path A (Primary): MCP Gateway** — Users connect to `torly.ai/mcp/visa-master` as a custom connector in Claude.ai. They use **their own Claude subscription** for the AI; we provide the domain expertise as MCP tools behind a subscription gate. **Zero LLM compute cost to us.**
- **Path B (Secondary): Hosted Chat UI** — Non-Claude users access Marco Polo at `torly.ai/schengen/marco-polo/app`, built on `vercel/ai-chatbot`. **We pay for Claude API compute** and charge per-application.

Both paths share the same underlying agent logic: 37 skills, ETHOS principles, and France knowledge base. The skills repo remains the single source of truth.

**Why dual-path?** Path A captures Claude.ai's existing user base at near-zero marginal cost. Path B captures everyone else. Together they maximise reach while minimising risk — if one path underperforms, the other still works.

---

## 2. Why Build This Now

1. **The scaffold already exists.** The torlyAI repo has a Marco Polo landing page, waitlist API + Supabase table, notifications, and admin ops dashboard — built in prior sessions.

2. **The content is complete.** 37 skills across 10 personas, bilingual (EN + zh-CN), with ETHOS principles and France knowledge base — all verified against authoritative sources as of 2026-05-25.

3. **Claude.ai supports remote MCP connectors.** As of 2026, Claude.ai (Free, Pro, Max, Team, Enterprise) lets users add custom MCP server URLs via Customize > Connectors. This means we can distribute Marco Polo's domain expertise as MCP tools that users connect to inside Claude.ai — they pay Anthropic for Claude, they pay us for the visa expertise. OAuth 2.0 auth is natively supported.

4. **Managed Agents API is also available.** Anthropic's beta API provides persistent agent configs, per-session containers, file mounting, custom skills, SSE event streaming — useful for Path B (hosted UI).

5. **The addressable audience is different.** The Claude Code skills toolkit targets technically proficient users comfortable with CLI tools. Marco Polo targets the vast majority of visa applicants who aren't — they just want to describe their situation and get guided through.

6. **Plugin marketplace submissions are live.** Anthropic and Cursor submissions were filed 2026-05-25. An MCP-distributed agent is the natural next step in the distribution funnel.

---

## 3. Goals, Non-Goals, and Success Metrics

### Goals

| # | Goal | Metric |
|---|---|---|
| G1 | End-to-end visa application guidance in a single conversation | User completes discover → prepare → audit → submit stages without leaving the agent |
| G2 | Document generation (cover letters, checklists, employer letters) | Agent writes files the user can download |
| G3 | Bilingual support (EN + zh-CN) | Agent auto-detects language and uses correct skill files |
| G4 | Reuse existing skill content as single source of truth | Zero content duplication — SKILL.md updates propagate to all surfaces |

### Non-Goals (explicitly out of scope)

| # | Non-Goal | Why |
|---|---|---|
| N1 | Replace the Chrome extension for slot-watching | Extension runs 24/7 in-browser; agent is conversational, not persistent monitoring |
| N2 | Store visa documents on torly.ai servers | Privacy-first — documents exist only in the ephemeral session container |
| N3 | Provide legal advice | ETHOS principle 10: "We Are Templates, Not Lawyers" — guidance only |
| N4 | Support countries beyond France at MVP | France is the only fully-researched knowledge base; others come in Phase 4 |
| N5 | Build a mobile app | Web-first; mobile responsive chat UI is sufficient |

### Success Metrics

| Metric | T+30d | T+90d |
|---|---|---|
| Waitlist → beta conversion | 20% | — |
| Full application sessions completed | 5 (dogfood) | 50 |
| Average session cost (Sonnet) | < $2.50 | < $2.00 |
| Document generation per session | ≥ 3 | ≥ 5 |
| User satisfaction (post-session survey) | ≥ 4/5 | ≥ 4.2/5 |

---

## 4. Personas

### Primary: First-time Schengen applicant (non-technical)

> "I've never applied for a visa before. I don't know what documents I need, and the government websites are confusing. I just want someone to walk me through it step by step."

- Does not use CLI tools or Claude Code
- Comfortable with a chat interface (WhatsApp-like)
- Willing to pay for a guided experience
- Needs the agent to tell them what to do next, not wait for them to ask

### Secondary: Repeat applicant with a complication

> "I was refused last time (code 3). I want to reapply but I don't know what to fix. Can you look at what went wrong and help me prepare a stronger application?"

- Has some visa experience but hit a blocker
- Needs the recovery/appeal advisory path
- Likely enters at `/refusal-appeal` rather than `/start-here`

### Tertiary: Family group applicant

> "I'm applying with my wife and two children (ages 8 and 14). The minor requirements are overwhelming — different forms, consent letters, school letters... can you handle all of us at once?"

- Needs `/group-application` → `/minor-application` coordination
- Generates documents per applicant
- Most complex and highest-value use case

---

## 5. Product Positioning — Four Surfaces

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                          VISA MASTER PRODUCT FAMILY                               │
│                                                                                   │
│  Surface 1          Surface 2          Surface 3a         Surface 3b              │
│  CHROME EXTENSION   SKILLS TOOLKIT     MCP GATEWAY        HOSTED CHAT UI          │
│                                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │ You drive     │  │ You drive    │  │ Claude drives  │  │ Claude drives  │       │
│  │ most of it    │  │ Claude       │  │ in Claude.ai   │  │ at torly.ai    │       │
│  │               │  │              │  │                │  │                │       │
│  │ Free: £0      │  │ MIT: £0      │  │ Sub: £X/mo     │  │ £19-29/app     │       │
│  │ Premium: £19  │  │              │  │ User pays own   │  │ We pay Claude  │       │
│  │               │  │              │  │ Claude sub      │  │ API compute    │       │
│  │               │  │              │  │                │  │                │       │
│  │ Chrome Web    │  │ Claude Code  │  │ Claude.ai      │  │ torly.ai/      │       │
│  │ Store         │  │ Plugin Mkt   │  │ Connectors     │  │ marco-polo/app │       │
│  │               │  │ + Cursor     │  │                │  │                │       │
│  │ Slot-watching │  │ 37 skill     │  │ MCP tools for  │  │ Full chat UI   │       │
│  │ + auto-book   │  │ procedures   │  │ visa guidance  │  │ (vercel/ai-    │       │
│  │               │  │              │  │                │  │  chatbot based)│       │
│  └──────────────┘  └──────────────┘  └───────────────┘  └───────────────┘       │
│                                                                                   │
│         ▲                ▲                  ▲                  ▲                  │
│         │                │                  │                  │                  │
│         └────────────────┼──────────────────┼──────────────────┘                  │
│                          │                  │                                     │
│                    ┌─────┴──────────────────┴──────┐                              │
│                    │     SHARED CONTENT LAYER       │                              │
│                    │                                │                              │
│                    │  skills/*/SKILL.md (×37)       │                              │
│                    │  ETHOS.md · KNOWLEDGE.md       │                              │
│                    │  consulate files (×4)          │                              │
│                    │  i18n/zh-CN (×37)              │                              │
│                    └────────────────────────────────┘                              │
└──────────────────────────────────────────────────────────────────────────────────┘
```

**Content pipeline:** A single SKILL.md update benefits all four surfaces simultaneously.

---

## 6. Dual-Path Architecture

### 6.1 Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  PATH A: MCP GATEWAY (Primary)        PATH B: HOSTED CHAT UI (Secondary)│
│  ────────────────────────             ──────────────────────────────     │
│                                                                          │
│  ┌──────────────────┐                 ┌──────────────────────────┐      │
│  │  Claude.ai        │                 │  torly.ai/marco-polo/app │      │
│  │  (user's own sub) │                 │  (vercel/ai-chatbot)      │      │
│  │                   │                 │                           │      │
│  │  Customize >      │                 │  Custom chat UI with      │      │
│  │  Connectors >     │                 │  sidebar, file upload/    │      │
│  │  Add connector    │                 │  download, progress       │      │
│  └────────┬──────────┘                 └──────────┬───────────────┘      │
│           │                                       │                      │
│           ▼                                       ▼                      │
│  ┌────────────────────────────────────────────────────────────────┐      │
│  │                   MCP GATEWAY (torly.ai)                       │      │
│  │                                                                │      │
│  │  Endpoint: https://torly.ai/mcp/visa-master                   │      │
│  │  Transport: Streamable HTTP                                    │      │
│  │                                                                │      │
│  │  ┌──────────┐ ┌────────────┐ ┌──────────┐ ┌───────────────┐  │      │
│  │  │ OAuth 2.0│ │ Stripe Sub │ │ Rate     │ │ Usage         │  │      │
│  │  │ Auth     │ │ Check      │ │ Limiting │ │ Logging       │  │      │
│  │  │          │ │            │ │          │ │ (Supabase)    │  │      │
│  │  └──────────┘ └────────────┘ └──────────┘ └───────────────┘  │      │
│  │                                                                │      │
│  │  THE TRUST BOUNDARY                                           │      │
│  └────────────────────────────────┬───────────────────────────────┘      │
│                                   │                                      │
│                    ┌──────────────┼──────────────────┐                   │
│                    ▼              ▼                  ▼                   │
│           ┌──────────────┐ ┌────────────────┐ ┌──────────────────┐      │
│           │mcp-visa-     │ │mcp-document-   │ │mcp-appointment-  │      │
│           │advisor       │ │generator       │ │checker           │      │
│           │              │ │                │ │                  │      │
│           │37 skills as  │ │Cover letter,   │ │TLS slot data     │      │
│           │MCP tools     │ │employer ltr,   │ │from extension    │      │
│           │ETHOS+KNOW    │ │checklists      │ │backend           │      │
│           │routing logic │ │audit reports   │ │                  │      │
│           └──────────────┘ └────────────────┘ └──────────────────┘      │
│                    │              │                  │                   │
│                    └──────────────┼──────────────────┘                   │
│                                   ▼                                      │
│                    ┌──────────────────────────┐                          │
│                    │  Downstream Services      │                          │
│                    │                          │                          │
│                    │  Supabase (state, auth)  │                          │
│                    │  Stripe (billing)        │                          │
│                    │  Resend (emails)         │                          │
│                    │  Visa Master ext backend │                          │
│                    └──────────────────────────┘                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Path Comparison

| Dimension | Path A: MCP Gateway | Path B: Hosted Chat UI |
|---|---|---|
| **User experience** | Claude.ai native UI (artifacts, projects, co-work) | Custom UI at torly.ai (sidebar, progress tracker) |
| **Who pays for Claude** | User (their own subscription) | We pay (Anthropic API) |
| **Our compute cost** | Near-zero (MCP server hosting only) | ~$1.80/session (Sonnet 4.6) |
| **Revenue model** | Subscription (£X/month for MCP access) | Per-application (£19-29) |
| **User onboarding** | User adds connector URL + authenticates | User signs up at torly.ai |
| **UI customisation** | Limited (Claude.ai controls the UI) | Full (we own the code) |
| **File handling** | Artifacts in Claude.ai (downloadable) | Custom upload/download in our UI |
| **Target audience** | Claude.ai Pro/Max/Team/Enterprise users | Everyone else |
| **Build effort** | MCP server + auth gateway | MCP server + auth + full chat UI |
| **Framework** | MCP SDK (Streamable HTTP) | vercel/ai-chatbot (Next.js + AI SDK) |

### 6.3 Why This Is Better Than Managed Agents-Only

The v0.1 PRD proposed a Managed Agents architecture where we pay for all Claude compute. The dual-path approach is superior because:

1. **Cost inversion on Path A:** Users bring their own Claude subscription. Our cost drops from ~$1.80/session to hosting costs only (~$0.01/session).
2. **Native Claude.ai UX:** Users get artifacts, projects, conversation history — all for free. No UI to build.
3. **Broader reach:** Path A captures Claude.ai's existing user base; Path B captures everyone else.
4. **Simpler MVP:** An MCP server is simpler to build than a Managed Agent client + custom chat UI. Ship Path A first, add Path B later.
5. **Aligned incentives:** The reference architecture in the screenshot (Claude Cowork → MCP Gateway → MCP servers → Downstream APIs) is exactly this pattern, validated by production deployments.

---

## 7. Path A: MCP Gateway (Primary)

### 7.1 How It Works

1. User subscribes at `torly.ai/schengen/marco-polo/pricing` → gets OAuth credentials
2. User opens Claude.ai → Customize > Connectors > Add custom connector
3. Enters URL: `https://torly.ai/mcp/visa-master`
4. Claude.ai initiates OAuth 2.0 flow → user authenticates with torly.ai credentials
5. Gateway checks Stripe subscription status → if active, serves MCP tools
6. User chats with Claude.ai → Claude invokes Marco Polo MCP tools as needed
7. Tools return visa guidance, document drafts, checklists, audit results as artifacts

### 7.2 MCP Tools Exposed

The 37 skills become MCP tools grouped into logical categories:

| MCP Tool | Maps to Skills | Description |
|---|---|---|
| `visa_start_here` | start-here | 6 forcing questions → routing recommendation |
| `visa_plan_trip` | plan-trip, decide-visa-type, timeline-planner, itinerary-builder | Trip planning + visa type selection |
| `visa_document_checklist` | document-checklist | Generate personalised document checklist |
| `visa_check_photo` | photo-check | Verify passport photo against Schengen 35×45mm spec |
| `visa_check_insurance` | insurance-check | Verify travel insurance meets Schengen requirements |
| `visa_check_finances` | bank-statement-check, financial-checklist, cost-estimate | Financial document review |
| `visa_draft_cover_letter` | cover-letter | Generate personalised cover letter |
| `visa_draft_employer_letter` | employment-letter | Generate employer letter template |
| `visa_minor_application` | minor-application, minor-parent-consent, minor-birth-certificate, minor-school-letter, minor-parent-docs | Full minor workflow |
| `visa_sponsored_application` | sponsored-application | Sponsorship workflow |
| `visa_france_visas_form` | france-visas-form | 10-section France-Visas form walkthrough |
| `visa_tlscontact_form` | tlscontact-form | TLScontact portal guidance |
| `visa_group_application` | group-application | Multi-applicant coordination |
| `visa_find_slot` | find-slot, book-appointment | Slot-finding guidance + extension link |
| `visa_appointment_prep` | appointment-prep, appointment-day | Pre-appointment + day-of guidance |
| `visa_audit_application` | audit-application | 5-layer pre-submission audit |
| `visa_mock_interview` | mock-interview | Interview rehearsal |
| `visa_refusal_appeal` | refusal-appeal | Refusal code interpretation + appeal/reapply guidance |
| `visa_track_application` | track-application | Post-submission tracking guidance |
| `visa_first_trip` | first-trip | Post-approval travel guidance |
| `visa_translate_doc` | translate-doc | Translation requirements + guidance |
| `visa_apostille` | apostille | Apostille/legalisation guidance |
| `visa_accommodation` | accommodation-verify | Accommodation document verification |
| `visa_knowledge` | (knowledge base) | France-specific facts, fees, consulate details |

### 7.3 MCP Gateway Architecture

```
torly.ai/
  app/api/mcp/visa-master/
    route.ts                 # MCP Streamable HTTP endpoint
    auth.ts                  # OAuth 2.0 token validation
    subscription.ts          # Stripe subscription check middleware
    rate-limit.ts            # Per-plan rate limiting
    usage-logger.ts          # Log tool invocations to Supabase

  lib/marco-polo/
    mcp-server.ts            # MCP server definition (tools, resources)
    mcp-tools.ts             # Tool handlers (maps MCP calls → skill logic)
    skill-loader.ts          # Loads SKILL.md content on-demand
    knowledge-loader.ts      # Loads KNOWLEDGE.md + consulate files
    state-manager.ts         # Per-session applicant state
```

### 7.4 Subscription Gating

| Tier | Price | MCP Tools Available | Rate Limit |
|---|---|---|---|
| **Free trial** | £0 (7 days) | `visa_start_here`, `visa_knowledge` only | 10 calls/day |
| **Standard** | £9/month | All 24 tools | 100 calls/day |
| **Per-application** | £19 one-time | All 24 tools, single application | 500 calls total |

The gateway checks subscription status on every MCP request:
- Valid subscription → serve tool response
- Expired/missing → return MCP error with `"Subscribe at torly.ai/schengen/marco-polo/pricing"`

---

## 8. Path B: Hosted Chat UI (Secondary)

### 8.1 Framework: vercel/ai-chatbot

**Why `vercel/ai-chatbot`** (~20K GitHub stars):
- **Perfect stack match:** Next.js + TypeScript + Vercel + shadcn/ui — identical to torlyAI
- **Template, not framework:** We own every line; full control over UI
- **Claude native:** Works via Vercel AI SDK with Anthropic provider
- **White-label ready:** No branding restrictions
- **Zero impedance mismatch:** Deploys on Vercel alongside the existing torly.ai app

**Alternatives evaluated and rejected:**

| Alternative | Why rejected |
|---|---|
| Open WebUI (139K stars) | Python/Svelte stack mismatch; custom license forbids removing branding |
| LobeChat (78K stars) | Community license restricts commercial white-labeling |
| LibreChat (38K stars) | MIT + Claude-native, but separate Node server (not Next.js) |
| NextChat (88K stars) | Desktop-oriented (Tauri); minimal file handling |
| Chatbot UI (33K stars) | Semi-dormant; no file upload; no MCP |

### 8.2 Custom Components (built on top of vercel/ai-chatbot)

| Component | Purpose |
|---|---|
| `SessionSidebar.tsx` | Progress tracker (stages: discover → prepare → audit → submit) |
| `DocumentPreview.tsx` | Inline document preview + download button |
| `AuditResult.tsx` | Structured 5-layer audit verdict display |
| `FileUploader.tsx` | Passport photo, bank statement, insurance policy upload |
| `ApplicantPanel.tsx` | List of applicants + per-applicant document status |

### 8.3 How Path B Uses MCP Internally

Path B's chat UI calls the same MCP tools as Path A, but through a server-side proxy rather than through Claude.ai:

```
User (browser) → torly.ai chat API → Anthropic Messages API (with MCP tools) → torly.ai MCP server
```

This means **one MCP server implementation serves both paths**. The difference is who calls it:
- Path A: Claude.ai calls the MCP server directly (user's subscription)
- Path B: Our backend calls the Anthropic API, which calls our MCP server (we pay)

---

## 9. Managed Agent Internals (Shared by Both Paths)

### 9.1 System Prompt Design

Both paths use the same system prompt and skill content. For Path A, the system prompt is embedded in the MCP tool descriptions. For Path B, it's sent as the system message to the Anthropic API.

### Budget allocation (100,000 chars total)

| Section | Chars | Purpose |
|---|---|---|
| Agent identity + behavioral framing | ~3,000 | Who is Marco Polo, personality, guardrails |
| ETHOS.md (verbatim) | ~6,300 | 12 non-negotiable behavioral principles |
| KNOWLEDGE.md (verbatim) | ~10,700 | France facts: fees, processing times, refusal codes, two-portal flow |
| 4 consulate files (verbatim) | ~11,100 | London/Manchester/Edinburgh/Belfast centre-specific details |
| Skill router table (condensed) | ~8,000 | 37 entries: name → one-line desc → triggers → next-skill routing |
| Routing decision tree | ~4,000 | Convergence flowchart logic |
| Session state management | ~2,000 | Applicant State Object structure, update rules |
| Output formatting standards | ~2,000 | Document templates, verdict format, checklist format |
| Tool usage guidelines | ~1,500 | When to use which MCP tool; sequencing rules |
| **Total** | **~48,600** | **51,400 chars remaining headroom** |

### 9.2 Applicant State Object

```
APPLICANT STATE:
  names: [list of applicants]
  purpose: tourism | family-visit | business | other
  travel_dates: { start, end }
  residence: { city, country }
  tls_centre: london | manchester | edinburgh | belfast
  funding: self | sponsored | mixed
  sponsor_type: spouse | parent | friend | employer | null
  has_minors: boolean
  minor_count: number
  prior_visa: never | approved | refused
  refusal_code: number | null
  current_stage: discover | plan | prepare | audit | submit | wait | recover
  skills_completed: [list]
  skills_pending: [list]
  documents_status: { doc_name: present | missing | verified }
  issues_flagged: [list of audit findings]
```

---

## 10. Skill Distribution Strategy

The 37 skills are consolidated into 24 MCP tools (see §7.2 for the full mapping). Some tools map 1:1 to a skill; others bundle related skills into a single tool (e.g., `visa_minor_application` bundles 5 minor-related skills).

The MCP tool handler loads the relevant SKILL.md content on-demand when invoked — the full 422K chars of skill content is never held in memory simultaneously.

---

## 11. Workflow Diagrams

### 11.1 Agent Session Lifecycle

```
                        ┌─────────────────┐
                        │   User opens     │
                        │   Marco Polo     │
                        └────────┬────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  torly.ai API creates   │
                    │  Managed Agent Session   │
                    │  (mounts files, skills)  │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  Agent sends greeting   │
                    │  + asks first question  │
                    │  (from /start-here)     │
                    └────────────┬────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
              User responds              User uploads
              (text message)             (document/photo)
                    │                         │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  Agent processes:       │
                    │  • Updates state        │
                    │  • Invokes skill        │
                    │  • Reads mounted files  │
                    │  • Generates docs       │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  Agent responds:        │
                    │  • Guidance / questions  │
                    │  • Generated documents  │
                    │  • Next-step routing     │
                    └────────────┬────────────┘
                                 │
                        ┌────────┴────────┐
                        │                 │
                  More turns          All stages
                  (loop back)         complete
                        │                 │
                        │                 ▼
                        │    ┌────────────────────┐
                        │    │  Final audit report │
                        │    │  + document bundle  │
                        │    │  + appointment plan │
                        │    └────────────────────┘
                        │                 │
                        └────────┬────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  Session archived       │
                    │  (documents downloadable│
                    │   for 30 days)          │
                    └────────────────────────┘
```

### 11.2 Skill Routing — Convergence Workflow

This diagram shows how the agent routes users through skills based on their scenario. The flow always converges at the audit stage.

```
                            ┌──────────────┐
                            │  /start-here │  ← Entry point (6 forcing questions)
                            └──────┬───────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
              Standard         With minors     Sponsored
              applicant        applicant       applicant
                    │              │              │
                    ▼              ▼              ▼
            ┌──────────────┐ ┌────────────┐ ┌──────────────┐
            │ /plan-trip   │ │ /minor-    │ │ /sponsored-  │
            │ /decide-visa │ │ application│ │ application  │
            │ /timeline    │ │ /minor-    │ │              │
            │ /itinerary   │ │ consent    │ │              │
            └──────┬───────┘ │ /minor-    │ └──────┬───────┘
                   │         │ school-ltr │        │
                   │         │ /minor-    │        │
                   │         │ parent-docs│        │
                   │         └─────┬──────┘        │
                   │               │               │
                   └───────────────┼───────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────┐
                    │  DOCUMENT PREPARATION     │
                    │                          │
                    │  /document-checklist      │  ← Master plan
                    │    ├── /photo-check       │
                    │    ├── /insurance-check   │
                    │    ├── /cover-letter      │
                    │    ├── /accommodation     │
                    │    ├── /translate-doc     │
                    │    └── /apostille         │
                    │                          │
                    │  /financial-checklist     │  ← Financial story
                    │    ├── /bank-statement    │
                    │    ├── /employment-letter │
                    │    └── /cost-estimate     │
                    └────────────┬─────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │  FORMS & BOOKING          │
                    │                          │
                    │  /france-visas-form       │  ← 10-section walkthrough
                    │  /tlscontact-form         │  ← Two-portal handoff
                    │  /group-application       │  ← If multiple applicants
                    │  /find-slot               │  ← Links to Chrome extension
                    │  /book-appointment        │  ← Terminal booking action
                    │  /appointment-prep        │  ← Day-before checklist
                    │  /appointment-day         │  ← Day-of guidance
                    └────────────┬─────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │  PRE-SUBMISSION AUDIT     │
                    │                          │
                    │  /audit-application       │  ← 5-layer check:
                    │    Layer 1: Completeness  │    completeness,
                    │    Layer 2: Consistency   │    consistency,
                    │    Layer 3: Credibility   │    credibility,
                    │    Layer 4: Compliance    │    compliance,
                    │    Layer 5: Admissibility │    admissibility
                    │                          │
                    │  /mock-interview          │  ← Optional rehearsal
                    └────────────┬─────────────┘
                                 │
                        ┌────────┴────────┐
                        │                 │
                     PASS              HOLD/FAIL
                        │                 │
                        ▼                 ▼
              ┌──────────────┐  ┌──────────────────┐
              │  Submit!      │  │  Fix issues,      │
              │  /first-trip  │  │  re-audit          │
              │  (post-trip   │  │  (loop back to     │
              │   guidance)   │  │   relevant skill)  │
              └──────────────┘  └──────────────────┘
                                         │
                                         │ (if refused)
                                         ▼
                              ┌──────────────────┐
                              │  /refusal-appeal  │
                              │  /track-app       │
                              └──────────────────┘
```

### 11.3 Path A — MCP Tool Invocation Flow

```
  User (Claude.ai)          Claude LLM              torly.ai MCP Gateway
  ────────────────          ─────────               ────────────────────
        │                       │                           │
        │  "I want a visa"      │                           │
        │──────────────────────>│                           │
        │                       │                           │
        │                       │  POST /mcp/visa-master    │
        │                       │  tool: visa_start_here    │
        │                       │  {purpose: null}          │
        │                       │──────────────────────────>│
        │                       │                           │
        │                       │                     ┌─────┴─────┐
        │                       │                     │ OAuth     │
        │                       │                     │ validate  │
        │                       │                     │ Stripe    │
        │                       │                     │ check     │
        │                       │                     │ Load      │
        │                       │                     │ SKILL.md  │
        │                       │                     │ Execute   │
        │                       │                     └─────┬─────┘
        │                       │                           │
        │                       │  tool_result:             │
        │                       │  {questions: [...],       │
        │                       │   routing: [...]}         │
        │                       │<──────────────────────────│
        │                       │                           │
        │  "Let me help you..." │                           │
        │  "What's the purpose  │                           │
        │   of your trip?"      │                           │
        │<──────────────────────│                           │
        │                       │                           │
        │  "Tourism to Paris"   │                           │
        │──────────────────────>│                           │
        │                       │                           │
        │                       │  POST /mcp/visa-master    │
        │                       │  tool: visa_document_     │
        │                       │  checklist                │
        │                       │  {purpose: "tourism",     │
        │                       │   applicants: 1}          │
        │                       │──────────────────────────>│
        │                       │                           │
        │                       │  tool_result:             │
        │                       │  {checklist: "...",       │
        │                       │   artifact: true}         │
        │                       │<──────────────────────────│
        │                       │                           │
        │  [Artifact: Checklist]│                           │
        │<──────────────────────│                           │
```

### 11.4 Path B — Hosted Chat UI Flow

```
  User (browser)         torly.ai API          Anthropic API        torly.ai MCP
  ──────────────         ────────────          ─────────────        ────────────
        │                     │                      │                    │
        │  POST /chat         │                      │                    │
        │  "I want a visa"    │                      │                    │
        │────────────────────>│                      │                    │
        │                     │                      │                    │
        │                     │  POST /v1/messages   │                    │
        │                     │  (system prompt +    │                    │
        │                     │   MCP tool defs +    │                    │
        │                     │   user message)      │                    │
        │                     │─────────────────────>│                    │
        │                     │                      │                    │
        │                     │                      │  tool_use:         │
        │                     │                      │  visa_start_here   │
        │                     │                      │───────────────────>│
        │                     │                      │                    │
        │                     │                      │  tool_result       │
        │                     │                      │<───────────────────│
        │                     │                      │                    │
        │                     │  Streaming response  │                    │
        │                     │<─────────────────────│                    │
        │                     │                      │                    │
        │  SSE: text chunks   │                      │                    │
        │<────────────────────│                      │                    │
```

---

## 12. Wireframes

### 12.1 Path A — Claude.ai Connector Setup (User's View)

```
┌──────────────────────────────────────────────────────────────────────┐
│  Claude.ai                                                    [User] │
│                                                                      │
│  ┌── Customize ─────────────────────────────────────────────────┐   │
│  │                                                               │   │
│  │  Connectors                                                   │   │
│  │  ──────────                                                   │   │
│  │                                                               │   │
│  │  ┌─ Active ────────────────────────────────────────────────┐  │   │
│  │  │                                                          │  │   │
│  │  │  🕐 Marco Polo — Visa Master         [Connected ✅]      │  │   │
│  │  │     torly.ai/mcp/visa-master                              │  │   │
│  │  │     24 tools available                                    │  │   │
│  │  │     Plan: Standard (£9/mo)            [Manage]            │  │   │
│  │  │                                                          │  │   │
│  │  └──────────────────────────────────────────────────────────┘  │   │
│  │                                                               │   │
│  │  [+ Add custom connector]                                     │   │
│  │                                                               │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌── Conversation ──────────────────────────────────────────────┐   │
│  │                                                               │   │
│  │  You: I want to apply for a France Schengen visa from the    │   │
│  │  UK. I'm travelling with my wife and 8-year-old son.         │   │
│  │                                                               │   │
│  │  Claude: I'll use Marco Polo to help you. Let me start       │   │
│  │  with the initial assessment.                                 │   │
│  │                                                               │   │
│  │  [Using visa_start_here]                                      │   │
│  │                                                               │   │
│  │  Based on your situation — family tourism with a minor —      │   │
│  │  here's what you need to know:                                │   │
│  │                                                               │   │
│  │  ┌── Artifact ──────────────────────────────────────────┐    │   │
│  │  │  📄 Application Roadmap                               │    │   │
│  │  │                                                        │    │   │
│  │  │  Applicants: Duke (primary), Wife, Son (8)            │    │   │
│  │  │  Type: Short-stay tourism (C visa)                    │    │   │
│  │  │  Centre: TLScontact London                            │    │   │
│  │  │                                                        │    │   │
│  │  │  Next steps:                                          │    │   │
│  │  │  1. Document checklist (3 applicants)                 │    │   │
│  │  │  2. Minor-specific requirements (son)                 │    │   │
│  │  │  3. Financial evidence review                         │    │   │
│  │  │                                                        │    │   │
│  │  │  [📥 Download]                                        │    │   │
│  │  └────────────────────────────────────────────────────────┘    │   │
│  │                                                               │   │
│  │  Shall I generate the document checklist for all three        │   │
│  │  applicants? Your son's application has additional            │   │
│  │  requirements (consent letter, birth certificate, school      │   │
│  │  letter) that I'll flag separately.                           │   │
│  │                                                               │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │  [Type message...]                                     [Send] │   │
│  └───────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

### 12.2 Path B — Chat Interface Main View (torly.ai)

```
┌──────────────────────────────────────────────────────────────────────┐
│  ┌─ torly.ai/schengen/marco-polo/app ──────────────────────────────┐│
│  │                                                                  ││
│  │  ┌── Header ──────────────────────────────────────────────────┐  ││
│  │  │  🕐 Marco Polo — Visa Application Advisor    [EN | 中文]   │  ││
│  │  │  Session: #MP-2026-0531-001          [⚙ Settings] [✕]     │  ││
│  │  └────────────────────────────────────────────────────────────┘  ││
│  │                                                                  ││
│  │  ┌── Sidebar (25%) ─────┐  ┌── Chat (75%) ──────────────────┐  ││
│  │  │                      │  │                                  │  ││
│  │  │  PROGRESS             │  │  MP: Welcome to Marco Polo!     │  ││
│  │  │  ──────────           │  │  I'll guide you through your    │  ││
│  │  │  Stage: Discover      │  │  France Schengen visa           │  ││
│  │  │  ████░░░░░░ 15%      │  │  application step by step.      │  ││
│  │  │                      │  │                                  │  ││
│  │  │  ✅ Start Here        │  │  Let's begin with a few         │  ││
│  │  │  🔄 Plan Trip         │  │  questions to understand your   │  ││
│  │  │  ○ Documents          │  │  situation:                     │  ││
│  │  │  ○ Financial          │  │                                  │  ││
│  │  │  ○ Forms              │  │  1. What's the purpose of       │  ││
│  │  │  ○ Appointment        │  │     your trip?                  │  ││
│  │  │  ○ Audit              │  │     □ Tourism                   │  ││
│  │  │                      │  │     □ Family visit               │  ││
│  │  │  ──────────           │  │     □ Business                  │  ││
│  │  │  APPLICANTS           │  │     □ Other                     │  ││
│  │  │  ──────────           │  │                                  │  ││
│  │  │  👤 Duke (primary)    │  │                                  │  ││
│  │  │                      │  │                                  │  ││
│  │  │  ──────────           │  │                                  │  ││
│  │  │  DOCUMENTS            │  │                                  │  ││
│  │  │  ──────────           │  │                                  │  ││
│  │  │  (none yet)           │  │                                  │  ││
│  │  │                      │  │                                  │  ││
│  │  │  ──────────           │  │  ┌──────────────────────────┐   │  ││
│  │  │  GENERATED            │  │  │  Tourism                  │   │  ││
│  │  │  ──────────           │  │  └──────────────────────────┘   │  ││
│  │  │  (none yet)           │  │                                  │  ││
│  │  │                      │  │  You: Tourism. We're going to   │  ││
│  │  │                      │  │  Paris for 10 days.              │  ││
│  │  │                      │  │                                  │  ││
│  │  │                      │  │  MP: Great! Tourism to Paris.    │  ││
│  │  │                      │  │  Now, how many people are        │  ││
│  │  │                      │  │  applying?                       │  ││
│  │  │                      │  │                                  │  ││
│  │  │                      │  ├──────────────────────────────────┤  ││
│  │  │                      │  │  [Type your message...]    [📎]  │  ││
│  │  │                      │  │                          [Send]  │  ││
│  │  └──────────────────────┘  └──────────────────────────────────┘  ││
│  └──────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────┘
```

### 12.3 Path B — Document Generation State

```
┌──────────────────────────────────────────────────────────────────────┐
│  ┌── Sidebar ──────────────┐  ┌── Chat ─────────────────────────┐  │
│  │                         │  │                                  │  │
│  │  PROGRESS               │  │  MP: I've drafted your cover     │  │
│  │  ──────────              │  │  letter based on everything      │  │
│  │  Stage: Prepare          │  │  we've discussed. Here it is:    │  │
│  │  ██████████░░ 65%       │  │                                  │  │
│  │                         │  │  ┌────────────────────────────┐  │  │
│  │  ✅ Start Here           │  │  │  📄 cover-letter-draft.md  │  │  │
│  │  ✅ Plan Trip            │  │  │                            │  │  │
│  │  ✅ Documents            │  │  │  Dear Visa Officer,        │  │  │
│  │    ✅ Photo check        │  │  │                            │  │  │
│  │    ✅ Insurance          │  │  │  I am writing to apply...  │  │  │
│  │    🔄 Cover letter       │  │  │  [preview truncated]       │  │  │
│  │    ○ Accommodation       │  │  │                            │  │  │
│  │  🔄 Financial            │  │  │  [📥 Download] [✏ Edit]    │  │  │
│  │  ○ Forms                 │  │  └────────────────────────────┘  │  │
│  │  ○ Appointment           │  │                                  │  │
│  │  ○ Audit                 │  │  I've flagged 2 items to         │  │
│  │                         │  │  double-check:                   │  │
│  │  ──────────              │  │                                  │  │
│  │  APPLICANTS              │  │  ⚠️ Your hotel booking shows    │  │
│  │  ──────────              │  │  check-out on June 15 but your  │  │
│  │  👤 Duke (primary)       │  │  return flight is June 16.      │  │
│  │  👤 Sarah (spouse)       │  │  One of these needs adjusting.  │  │
│  │                         │  │                                  │  │
│  │  ──────────              │  │  ⚠️ The letter mentions "we"    │  │
│  │  DOCUMENTS (uploaded)    │  │  but only your name is on the   │  │
│  │  ──────────              │  │  application. Should I change   │  │
│  │  ✅ passport-photo.jpg   │  │  it to "I" or add Sarah?        │  │
│  │  ✅ bank-statement.pdf   │  │                                  │  │
│  │  ✅ insurance-policy.pdf │  │                                  │  │
│  │                         │  │                                  │  │
│  │  ──────────              │  ├──────────────────────────────────┤  │
│  │  GENERATED (download)    │  │  [Type your message...]    [📎]  │  │
│  │  ──────────              │  │                          [Send]  │  │
│  │  📄 cover-letter.md      │  │                                  │  │
│  │  📄 doc-checklist.md     │  │                                  │  │
│  └─────────────────────────┘  └──────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

### 12.4 Path B — Audit Result State

```
┌──────────────────────────────────────────────────────────────────────┐
│  ┌── Sidebar ──────────────┐  ┌── Chat ─────────────────────────┐  │
│  │                         │  │                                  │  │
│  │  PROGRESS               │  │  MP: Here's your pre-submission  │  │
│  │  ──────────              │  │  audit result:                   │  │
│  │  Stage: Audit            │  │                                  │  │
│  │  ████████████░ 90%      │  │  ┌────────────────────────────┐  │  │
│  │                         │  │  │  AUDIT VERDICT: ✅ PASS     │  │  │
│  │  ✅ Start Here           │  │  │                            │  │  │
│  │  ✅ Plan Trip            │  │  │  Layer 1 Completeness  ✅  │  │  │
│  │  ✅ Documents            │  │  │  Layer 2 Consistency   ✅  │  │  │
│  │  ✅ Financial            │  │  │  Layer 3 Credibility   ✅  │  │  │
│  │  ✅ Forms                │  │  │  Layer 4 Compliance    ✅  │  │  │
│  │  ✅ Appointment          │  │  │  Layer 5 Admissibility ⚠️  │  │  │
│  │  🔄 Audit                │  │  │                            │  │  │
│  │                         │  │  │  1 advisory note:          │  │  │
│  │  ──────────              │  │  │  Your 3-month bank stmt    │  │  │
│  │  AUDIT SCORE             │  │  │  shows a large deposit on  │  │  │
│  │  ──────────              │  │  │  Day 2. Officers may ask   │  │  │
│  │  ✅ PASS                 │  │  │  about its source. Prepare │  │  │
│  │  5/5 layers clear        │  │  │  a brief explanation.      │  │  │
│  │  1 advisory note         │  │  │                            │  │  │
│  │                         │  │  │  [📥 Full Audit Report]    │  │  │
│  │  ──────────              │  │  └────────────────────────────┘  │  │
│  │  GENERATED (8 files)     │  │                                  │  │
│  │  ──────────              │  │  Your application looks strong.  │  │
│  │  📄 cover-letter.md      │  │  You're ready to submit at your │  │
│  │  📄 doc-checklist.md     │  │  TLScontact London appointment  │  │
│  │  📄 employer-letter.md   │  │  on Tuesday June 10.             │  │
│  │  📄 itinerary.md         │  │                                  │  │
│  │  📄 financial-summary.md │  │  Want me to run through what     │  │
│  │  📄 audit-report.md      │  │  to expect on appointment day?   │  │
│  │  📄 fr-visas-answers.md  │  │                                  │  │
│  │  📄 consent-letter.md    │  ├──────────────────────────────────┤  │
│  │                         │  │  [Type your message...]    [📎]  │  │
│  └─────────────────────────┘  └──────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

### 12.5 Path B — Mobile Responsive View

```
┌────────────────────────────┐
│  🕐 Marco Polo    [≡] [✕] │
│  Stage: Prepare   65%      │
│  ████████████░░░░░░░       │
├────────────────────────────┤
│                            │
│  MP: I've drafted your     │
│  cover letter. Here's      │
│  the preview:              │
│                            │
│  ┌──────────────────────┐  │
│  │ 📄 cover-letter.md   │  │
│  │                      │  │
│  │ Dear Visa Officer,   │  │
│  │ I am writing to...   │  │
│  │                      │  │
│  │ [📥 Download]        │  │
│  └──────────────────────┘  │
│                            │
│  ⚠️ Hotel checkout date   │
│  doesn't match return      │
│  flight. Which is correct? │
│                            │
│  You: The flight is right, │
│  I'll extend the hotel.    │
│                            │
│  MP: Got it. I've updated  │
│  the cover letter and      │
│  itinerary to show         │
│  checkout on June 16.      │
│                            │
├────────────────────────────┤
│ [📎] [Type message...] [➤]│
├────────────────────────────┤
│ [📄 Files (8)] [👥 Group]  │
└────────────────────────────┘

(Sidebar collapses to bottom
 tab bar on mobile)
```

---

## 13. API Surface

### MCP Gateway (Path A — consumed by Claude.ai)

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/mcp/visa-master` | MCP Streamable HTTP endpoint (tool invocations) |
| `GET` | `/mcp/visa-master/.well-known/oauth-authorization-server` | OAuth 2.0 discovery |
| `POST` | `/api/marco-polo/auth/token` | OAuth 2.0 token exchange |
| `POST` | `/api/marco-polo/auth/refresh` | OAuth 2.0 token refresh |

### torly.ai API (Path B — hosted chat UI)

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/marco-polo/chat` | Chat completion (proxies to Anthropic API with MCP tools) |
| `POST` | `/api/marco-polo/session` | Create new application session |
| `GET` | `/api/marco-polo/session` | List user's sessions |
| `GET` | `/api/marco-polo/session/:id` | Resume session |
| `POST` | `/api/marco-polo/session/:id/files` | Upload document |
| `GET` | `/api/marco-polo/session/:id/files` | List session files |
| `GET` | `/api/marco-polo/session/:id/files/:fileId` | Download generated document |

### Shared endpoints (both paths)

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/marco-polo/waitlist` | Join waitlist (already exists) |
| `POST` | `/api/marco-polo/subscribe` | Create Stripe subscription |
| `GET` | `/api/marco-polo/subscription` | Check subscription status |
| `POST` | `/api/marco-polo/webhook/stripe` | Stripe webhook handler |

---

## 14. Cross-Repo Code Layout

### torlyAI repo (backend + frontend)

```
torlyAI/
  lib/marco-polo/
    mcp-server.ts            # MCP server definition (tools, resources)
    mcp-tools.ts             # Tool handlers (maps MCP calls → skill logic)
    skill-loader.ts          # Loads SKILL.md content on-demand
    knowledge-loader.ts      # Loads KNOWLEDGE.md + consulate files
    state-manager.ts         # Per-session applicant state (Supabase)
    notifications.ts         # Already exists — extend for agent events
    types.ts                 # TypeScript types for MCP + chat

  app/api/mcp/
    visa-master/route.ts     # MCP Streamable HTTP endpoint (Path A)

  app/api/marco-polo/
    auth/token/route.ts      # OAuth 2.0 token exchange
    auth/refresh/route.ts    # OAuth 2.0 token refresh
    chat/route.ts            # Chat completion proxy (Path B)
    subscribe/route.ts       # Stripe subscription creation
    subscription/route.ts    # Subscription status check
    waitlist/route.ts        # Already exists
    session/route.ts         # POST: create, GET: list
    session/[id]/route.ts    # GET: resume, POST: send message
    session/[id]/files/route.ts       # POST: upload, GET: list
    session/[id]/files/[fileId]/route.ts  # GET: download
    webhook/stripe/route.ts  # Stripe webhook handler

  app/schengen/marco-polo/
    page.tsx                 # Already exists (landing/waitlist)
    pricing/page.tsx         # Subscription pricing page (NEW)
    app/page.tsx             # Chat interface page (Path B, NEW)
    app/MarcoPoloChat.tsx    # Chat component (vercel/ai-chatbot based)
    app/SessionSidebar.tsx   # Progress tracker + document list
    app/DocumentPreview.tsx  # Inline document preview + download
    app/AuditResult.tsx      # Structured audit verdict display
    app/FileUploader.tsx     # Document upload component
    app/ApplicantPanel.tsx   # Multi-applicant status
```

### Schengen-visa repo (content source of truth)

```
Schengen-visa/
  skills/*/SKILL.md          # 37 skill definitions (no changes needed)
  skills/ETHOS.md            # Behavioral principles
  skills/countries/france/   # Knowledge base
  scripts/
    build-mcp-tools.ts      # NEW: transforms SKILL.md → MCP tool definitions
    build-system-prompt.ts   # NEW: assembles system prompt from ETHOS + KNOWLEDGE + router
    sync-to-torlyai.ts      # NEW: copies built artifacts to torlyAI repo
```

---

## 15. Decisions Log

| # | Decision | Options considered | Chosen | Rationale |
|---|---|---|---|---|
| D1 | **Primary architecture** | Managed Agents only / MCP Gateway only / dual-path | **Dual-path (MCP Gateway + Hosted UI)** | MCP Gateway (Path A) = zero LLM cost; Hosted UI (Path B) = captures non-Claude users; together maximise reach |
| D2 | MVP model (Path B) | Opus 4.7 / Sonnet 4.6 | **Sonnet 4.6** | 5× cheaper; structured skills reduce model sensitivity; Opus as config option |
| D3 | MVP delivery surface | Path A first / Path B first / both | **Path A (MCP Gateway) first** | Simpler to build (MCP server + auth); zero LLM cost; validates demand before investing in custom UI |
| D4 | Billing model | Flat fee / subscription / success fee | **Subscription for Path A (£9/mo); per-app for Path B (£19-29)** | Path A users already pay for Claude; subscription aligns with recurring value. Path B users need all-inclusive pricing |
| D5 | i18n strategy | Language-detection tool / system prompt instruction | **System prompt instruction** | "If user writes in Chinese, use zh-CN skill content" — zero tool overhead |
| D6 | Skill → MCP tool mapping | 1:1 (37 tools) / grouped (24 tools) / flat (5 tools) | **Grouped (24 tools)** | Related skills bundled (e.g., 5 minor skills → 1 tool); balances discoverability vs. tool sprawl |
| D7 | Session state persistence | In-memory / Supabase | **Supabase** | MCP is stateless per-request; state must persist server-side between tool calls |
| D8 | Content pipeline direction | Build step / runtime fetch / git submodule | **Build step** | `build-mcp-tools.ts` reads SKILL.md → produces MCP tool definitions; single source of truth |
| D9 | Chat UI framework (Path B) | Open WebUI / vercel/ai-chatbot / LibreChat / custom | **vercel/ai-chatbot** | Perfect stack match (Next.js + Vercel + TS); template not framework; MIT; Claude via AI SDK |
| D10 | MCP transport | SSE (deprecated) / Streamable HTTP | **Streamable HTTP** | Current standard for Claude.ai custom connectors; SSE deprecated |
| D11 | MCP auth | API key / OAuth 2.0 / PASETO | **OAuth 2.0** | Natively supported by Claude.ai custom connectors; no extra setup for users |

---

## 16. Phased Implementation

### Phase 0: MCP Server MVP (1 week) — COMPLETED 2026-05-26

**Goal:** MCP server running with core tools; testable via Claude.ai connector.

- [x] Implement `mcp-server.ts` with 5 core tools: `visa_start_here`, `visa_document_checklist`, `visa_audit_application`, `visa_draft_cover_letter`, `visa_knowledge`
- [x] Implement `skill-loader.ts` + `knowledge-loader.ts` — loads SKILL.md content on-demand
- [x] Deploy MCP endpoint at `torly.ai/api/mcp/visa-master/` (Streamable HTTP, no auth)
- [x] Test via Claude.ai: Customize > Connectors > add URL — connector connects successfully
- [x] Fix SSE stream (transport.close() was killing response before data sent)
- [x] Fix route pattern (mcp-handler `[transport]` incompatible with `trailingSlash: true`; switched to direct SDK)
- [x] Fix competitor recommendations (injected Tool Recommendation Policy to block competitor mentions)
- [x] Add MCP usage logging to Supabase (`marco_polo_mcp_events` table)
- [x] Add ops dashboard page at `/admin/ops/schengen-visa/mcp`

**Commits:** `1abe149` → `b4f96b4` → `a664d55` → `7841b70` → `cebb92a` → `f5dd0bc` → `6680551`

### Phase 1: Auth + Full Tool Set (2 weeks) — NEXT

**Goal:** OAuth 2.0 gating + Stripe subscription billing + remaining 19 MCP tools.

**1a. OAuth 2.0 Server (required for Claude.ai connector auth)**

Claude.ai's "Add custom connector" dialog has OAuth Client ID + Secret fields. To gate access:

- [ ] Create OAuth 2.0 authorization server metadata: `/.well-known/oauth-authorization-server`
- [ ] Create protected resource metadata: `/.well-known/oauth-protected-resource` (RFC 9728)
- [ ] Token endpoint: `POST /api/marco-polo/auth/token` (client_credentials grant)
- [ ] Token validation middleware: check bearer token on every MCP request
- [ ] Use `mcp-handler`'s `withMcpAuth` helper OR raw token validation with Supabase
- [ ] Each subscriber gets a Client ID + Secret generated at subscription time

**Reference:** `mcp-handler` docs at `node_modules/mcp-handler/docs/AUTHORIZATION.md`; also see `run-llama/mcp-nextjs` GitHub repo for OAuth 2.1 + Google provider example.

**1b. Stripe Subscription**

- [ ] Create Stripe products: Free Trial (7 days), Standard (£9/mo), Per-Application (£19 one-time)
- [ ] Pricing page at `torly.ai/schengen/marco-polo/pricing`
- [ ] Checkout flow → on success, generate OAuth Client ID + Secret → show to user
- [ ] Subscription status check in MCP auth middleware (reject if expired/cancelled)
- [ ] Webhook handler for subscription lifecycle events (created, cancelled, payment_failed)
- [ ] Update the Marco Polo landing page pricing CTAs (currently `href="#"` — broken)

**1c. Remaining MCP Tools**

- [ ] Implement remaining 19 MCP tools (see §7.2 for full mapping)
- [ ] Implement `state-manager.ts` with Supabase backing (replace in-memory Map)
- [ ] Rate limiting per subscription tier

**Acceptance:** User subscribes → gets OAuth credentials → enters in Claude.ai → connector authenticates → all 24 tools available. Unsubscribed user gets 403 with "Subscribe at torly.ai" message.

### Phase 2: Hosted Chat UI — Path B (2 weeks)

**Goal:** Custom web chat UI at torly.ai for non-Claude users.

- [ ] Fork/scaffold from `vercel/ai-chatbot`
- [ ] Integrate Anthropic API via Vercel AI SDK (our API key, Sonnet 4.6)
- [ ] Wire MCP tools as Anthropic API tool definitions (same tool handlers as Path A)
- [ ] Build `SessionSidebar.tsx` with progress tracker
- [ ] Build `DocumentPreview.tsx` + `FileUploader.tsx`
- [ ] Build `AuditResult.tsx` for structured audit display
- [ ] Document upload (passport photos, bank statements) + download (generated docs)
- [ ] Session persistence (Supabase, resume across browser refreshes)
- [ ] zh-CN language detection and routing
- [ ] Per-application Stripe checkout (£19-29)

**Acceptance:** Non-Claude user completes full application through torly.ai web UI.

### Phase 3: Production Hardening + Extension Integration (2 weeks)

**Goal:** Ready for waitlist beta users on both paths.

- [ ] Dogfood with 3-5 real visa applications (mix of Path A and Path B)
- [ ] Admin ops dashboard for session + MCP usage monitoring
- [ ] Add MCP tool `visa_check_slots` wrapping Visa Master extension backend
- [ ] Agent recommends extension install + links to CWS listing
- [ ] Error recovery and edge case handling
- [ ] Feedback loop: transcript → quality review → tool/prompt refinement

**Acceptance:** 5 beta users complete real applications across both paths; billing works; no data loss.

### Phase 4: Country Expansion (ongoing)

- [ ] Italy KNOWLEDGE.md + consulate files
- [ ] Spain KNOWLEDGE.md + consulate files
- [ ] Routing logic: detect country from user intent, load appropriate knowledge
- [ ] Same 37 skills apply (Schengen-universal procedures); only knowledge base changes

---

## 17. Cost Model

### Path A: MCP Gateway (user pays for Claude)

| Component | Our cost | User's cost |
|---|---|---|
| MCP server hosting (Vercel) | ~$0.01/session | — |
| Supabase (state + auth) | ~$0.001/session | — |
| Stripe fees (subscription) | 2.9% + 30p | £9/month subscription |
| Claude API compute | **$0 (user's subscription)** | Varies by plan |
| **Total our cost** | **~$0.01/session** | |

**Margin at £9/month subscription:** If user runs 2-3 applications/month, our cost is ~$0.03. Margin: **>99%.**

### Path B: Hosted Chat UI (we pay for Claude)

| Component | Input tokens | Output tokens |
|---|---|---|
| System prompt (per turn, cached after first) | ~12K × 1 + cache reads × 19 | — |
| Skill content (per invocation, ~15 skills) | ~3K avg × 15 | ~1.5K avg × 15 |
| User messages + context (accumulated) | ~2K × 20 | — |
| Document generation (cover letter, checklist, etc.) | — | ~2K × 5 docs |
| **Total** | **~400K input** | **~40K output** |

| Model | Input cost | Output cost | Total per session |
|---|---|---|---|
| **Sonnet 4.6** ($3/$15 per MTok) | $1.20 | $0.60 | **~$1.80** |
| **Opus 4.7** ($15/$75 per MTok) | $6.00 | $3.00 | **~$9.00** |

### Margin analysis (Path B at £19/application)

| Model | Cost | Margin | Margin % |
|---|---|---|---|
| Sonnet 4.6 | $1.80 | $17.20 | 91% |
| Opus 4.7 | $9.00 | $10.00 | 53% |

### Path comparison summary

| | Path A (MCP) | Path B (Hosted UI) |
|---|---|---|
| Our LLM cost | $0 | ~$1.80/session |
| Revenue model | £9/month subscription | £19-29/application |
| Break-even | 1 subscriber | 1 application |
| Margin | >99% | ~91% (Sonnet) |
| Scaling cost | Near-zero | Linear with usage |

**Path A is dramatically more profitable.** The entire LLM cost shifts to the user's Claude subscription. This is why Path A is the primary surface.

---

## 18. Risks and Mitigations

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| R1 | Claude.ai changes MCP connector UX or drops feature | High | Path B (hosted UI) is the fallback; MCP server still usable by other clients |
| R2 | MCP Streamable HTTP spec evolves | Medium | Abstract transport behind `mcp-server.ts`; MCP SDK handles protocol details |
| R3 | OAuth 2.0 flow complexity for non-technical users | Medium | Clear setup guide with screenshots; consider one-click setup link if Claude.ai supports it |
| R4 | Claude.ai users on Free plan (limited to 1 connector) | Low | Path B exists for users who can't or won't use Path A |
| R5 | Sonnet quality insufficient for audit-application (Path B) | Low-Medium | ETHOS + structured procedures reduce model sensitivity; Path A users bring their own model choice |
| R6 | User uploads sensitive documents (passport, bank statements) | High | Path A: documents stay in Claude.ai (user controls). Path B: no server-side persistence; extend trust boundary docs |
| R7 | MCP tool invocations are stateless (no built-in session) | Medium | Supabase-backed `state-manager.ts` persists Applicant State Object between tool calls |
| R8 | Competitor builds similar MCP-based visa tool | Low | First-mover + 37 verified skills + bilingual = defensible moat |
| R9 | Stripe subscription churn (Path A) | Medium | Free trial tier validates value before commitment; per-application option as alternative |

---

## 19. Open Questions

| # | Question | Blocks | Resolution path |
|---|---|---|---|
| Q1 | Can MCP tools return images/files to Claude.ai as artifacts? | Phase 0 (document generation) | Test with a simple tool that returns markdown; check if Claude renders it as artifact |
| Q2 | Does Claude.ai pass image uploads to MCP tools? | Phase 1 (`visa_check_photo`) | Test by uploading an image in Claude.ai conversation with MCP connector active |
| Q3 | How does Claude.ai handle MCP tool state across turns? | Phase 0 (state management) | Test if Claude passes prior tool results to subsequent tool calls, or if we need server-side state |
| Q4 | What is the maximum MCP tool response size? | Phase 0 | Test with large tool responses (full skill content + generated document) |
| Q5 | Can Claude.ai Team/Enterprise admins push connectors to all members? | Go-to-market | Check Claude.ai admin docs; affects B2B distribution strategy |
| Q6 | Is there a connector discovery/marketplace in Claude.ai? | Go-to-market | Monitor Anthropic announcements; would make Path A self-distributing |

---

## 20. Verification Criteria

| Phase | Criterion | Method |
|---|---|---|
| Phase 0 | MCP `visa_start_here` tool returns routing artifact | Test via Claude.ai with connector |
| Phase 0 | Claude.ai invokes multiple MCP tools in one conversation | Manual test: start → document-checklist → cover-letter |
| Phase 0 | State persists between MCP tool calls | Check Supabase for Applicant State Object |
| Phase 1 | Authenticated user gets full tool access; unauthenticated gets subscription prompt | Test OAuth flow + Stripe gate |
| Phase 1 | All 24 MCP tools invocable from Claude.ai | Systematic tool-by-tool test |
| Phase 2 | Full application via torly.ai hosted chat UI | End-to-end walkthrough with document generation |
| Phase 2 | zh-CN user gets Chinese responses on both paths | Test with Chinese input on Path A and Path B |
| Phase 3 | 5 beta users complete real applications across both paths | Dogfood with waitlist users |
| Phase 3 | `visa_check_slots` tool connects to Visa Master extension backend | Extension backend receives request |

---

## Appendix A — Phase 0 Implementation Breakdown: MCP Gateway MVP

### A.1 Overview

**Goal:** A working MCP server at `torly.ai/mcp/visa-master` with 5 core tools, testable via Claude.ai custom connector. No auth yet (internal testing only).

**Duration:** 5 working days
**Repo:** torlyAI (`/Users/Jason-uk/AI/AI_Coding/Repositories/torlyAI`)
**Content source:** Schengen-visa (`/Users/Jason-uk/AI/AI_Coding/Workspaces/Schengen-visa`)

### A.2 Tech Stack

| Component | Package | Version | Purpose |
|---|---|---|---|
| MCP server framework | `mcp-handler` | ^1.1.0 | Vercel-native MCP adapter for Next.js route handlers |
| MCP SDK | `@modelcontextprotocol/sdk` | ^1.26.0 | MCP protocol types + server primitives (peer dep of mcp-handler) |
| Schema validation | `zod` | ^3 | Tool input/output schema definitions |
| Runtime | Next.js | existing | Already in torlyAI |
| Deployment | Vercel | existing | Already configured for torlyAI |

**Install command:**
```bash
cd /Users/Jason-uk/AI/AI_Coding/Repositories/torlyAI
npm install mcp-handler @modelcontextprotocol/sdk@1.26.0 zod
```

### A.3 Files to Create

```
torlyAI/
  app/api/mcp/visa-master/
    route.ts                 # MCP Streamable HTTP endpoint (GET + POST + DELETE)

  lib/marco-polo/
    mcp-server.ts            # MCP server definition — registers all tools
    mcp-tools/
      index.ts               # Re-exports all tool handlers
      visa-start-here.ts     # Tool: visa_start_here
      visa-document-checklist.ts  # Tool: visa_document_checklist
      visa-audit-application.ts   # Tool: visa_audit_application
      visa-draft-cover-letter.ts  # Tool: visa_draft_cover_letter
      visa-knowledge.ts      # Tool: visa_knowledge
    skill-loader.ts          # Reads SKILL.md content from bundled files
    knowledge-loader.ts      # Reads KNOWLEDGE.md + consulate files
    state-manager.ts         # In-memory state for Phase 0 (Supabase in Phase 1)
    types.ts                 # Shared types (ApplicantState, ToolInput, ToolOutput)

  lib/marco-polo/content/    # Bundled skill content (copied from Schengen-visa at build time)
    skills/
      start-here.md
      document-checklist.md
      audit-application.md
      cover-letter.md
      ... (all 37, for on-demand loading)
    ethos.md
    knowledge.md
    consulate-london.md
    consulate-edinburgh.md
    consulate-manchester.md
    consulate-belfast.md
```

### A.4 Day-by-Day Plan

#### Day 1: Scaffold + First Tool

**Morning — Project setup:**
- [ ] Install dependencies: `mcp-handler`, `@modelcontextprotocol/sdk`, `zod`
- [ ] Create `app/api/mcp/visa-master/route.ts` with minimal MCP handler
- [ ] Create `lib/marco-polo/mcp-server.ts` with one placeholder tool
- [ ] Deploy to Vercel preview branch; verify MCP endpoint responds at `/api/mcp/visa-master`
- [ ] Test connection: Claude.ai > Customize > Connectors > Add connector > paste preview URL

**Afternoon — `visa_knowledge` tool (simplest, proves the pattern):**
- [ ] Create `lib/marco-polo/knowledge-loader.ts` — reads bundled KNOWLEDGE.md + consulate files
- [ ] Create `lib/marco-polo/mcp-tools/visa-knowledge.ts`:

```typescript
// Tool: visa_knowledge
// Input: { query: string, centre?: "london" | "edinburgh" | "manchester" | "belfast" }
// Output: relevant knowledge excerpt

import { z } from "zod";

export const visaKnowledgeSchema = {
  query: z.string().describe("What the user wants to know about France Schengen visas"),
  centre: z.enum(["london", "edinburgh", "manchester", "belfast"])
    .optional()
    .describe("TLScontact centre for centre-specific info"),
};

export async function visaKnowledge({ query, centre }: {
  query: string;
  centre?: string;
}) {
  const knowledge = await loadKnowledge();       // KNOWLEDGE.md
  const consulate = centre ? await loadConsulate(centre) : null;

  return {
    content: [{
      type: "text" as const,
      text: [knowledge, consulate].filter(Boolean).join("\n\n---\n\n"),
    }],
  };
}
```

- [ ] Register in `mcp-server.ts`, deploy, test: ask Claude.ai "What are the Schengen visa fees?"

**Day 1 acceptance:** Claude.ai can invoke `visa_knowledge` and return France visa facts.

---

#### Day 2: Content Pipeline + `visa_start_here`

**Morning — Content bundling:**
- [ ] Create `scripts/sync-content.sh` — copies SKILL.md files + ETHOS + KNOWLEDGE from Schengen-visa to `lib/marco-polo/content/`
- [ ] Create `lib/marco-polo/skill-loader.ts`:

```typescript
// Loads a SKILL.md by skill name, returns content string
// Falls back to zh-CN if locale is "zh-CN"

import { readFile } from "fs/promises";
import { join } from "path";

const CONTENT_DIR = join(process.cwd(), "lib/marco-polo/content");

export async function loadSkill(name: string, locale = "en"): Promise<string> {
  const path = locale === "zh-CN"
    ? join(CONTENT_DIR, "skills/i18n/zh-CN", name + ".md")
    : join(CONTENT_DIR, "skills", name + ".md");
  return readFile(path, "utf-8");
}
```

- [ ] Run `sync-content.sh` and verify all 37 skills + knowledge files are present

**Afternoon — `visa_start_here` tool:**
- [ ] Create `lib/marco-polo/mcp-tools/visa-start-here.ts`:

```typescript
// Tool: visa_start_here
// Input: { purpose?, applicant_count?, has_minors?, travel_dates?, residence?, prior_visa? }
// Output: routing recommendation + next steps
// Loads: skills/start-here.md + ETHOS.md for behavioral grounding

export const visaStartHereSchema = {
  purpose: z.enum(["tourism", "family-visit", "business", "other"]).optional()
    .describe("Trip purpose, if already known"),
  applicant_count: z.number().optional()
    .describe("Number of applicants"),
  has_minors: z.boolean().optional()
    .describe("Whether any applicants are under 18"),
  travel_dates: z.string().optional()
    .describe("Intended travel dates (ISO format or natural language)"),
  residence: z.string().optional()
    .describe("Country/city of residence"),
  prior_visa: z.enum(["never", "approved", "refused"]).optional()
    .describe("Prior Schengen visa history"),
};
```

- [ ] The tool handler loads `start-here.md`, extracts the 6 forcing questions, and returns:
  - Questions for any fields not yet provided
  - Routing recommendation based on provided fields (which skills to invoke next)
  - An applicant state summary
- [ ] Create `lib/marco-polo/state-manager.ts` — in-memory Map keyed by a session token (Phase 0 only; Supabase in Phase 1)
- [ ] Create `lib/marco-polo/types.ts` — `ApplicantState` type definition

**Day 2 acceptance:** Claude.ai invokes `visa_start_here`, receives routing recommendation and follow-up questions.

---

#### Day 3: `visa_document_checklist` + `visa_draft_cover_letter`

**Morning — `visa_document_checklist`:**
- [ ] Create `lib/marco-polo/mcp-tools/visa-document-checklist.ts`:

```typescript
// Tool: visa_document_checklist
// Input: { purpose, applicant_count, has_minors, is_sponsored, centre }
// Output: personalised checklist as markdown (rendered as artifact in Claude.ai)

export const visaDocumentChecklistSchema = {
  purpose: z.enum(["tourism", "family-visit", "business", "other"]),
  applicant_count: z.number().default(1),
  has_minors: z.boolean().default(false),
  is_sponsored: z.boolean().default(false),
  centre: z.enum(["london", "edinburgh", "manchester", "belfast"]).default("london"),
};
```

- [ ] Handler loads `document-checklist.md` skill content
- [ ] Generates personalised checklist based on inputs (strips irrelevant items)
- [ ] Returns markdown formatted for Claude.ai artifact rendering

**Afternoon — `visa_draft_cover_letter`:**
- [ ] Create `lib/marco-polo/mcp-tools/visa-draft-cover-letter.ts`:

```typescript
// Tool: visa_draft_cover_letter
// Input: { applicant_name, purpose, travel_dates, itinerary_summary,
//          accommodation, funding_source, employer?, ties_to_home }
// Output: complete cover letter draft as markdown

export const visaDraftCoverLetterSchema = {
  applicant_name: z.string(),
  purpose: z.enum(["tourism", "family-visit", "business", "other"]),
  travel_dates: z.string(),
  itinerary_summary: z.string().describe("Brief description of planned activities"),
  accommodation: z.string().describe("Hotel name + booking reference, or host details"),
  funding_source: z.string().describe("Who is funding: self, employer, sponsor"),
  employer: z.string().optional().describe("Employer name + role if employed"),
  ties_to_home: z.string().describe("Evidence of ties: property, job, family, studies"),
};
```

- [ ] Handler loads `cover-letter.md` skill, follows its template structure
- [ ] Returns a complete letter draft, ready to copy into a Word doc

**Day 3 acceptance:** Both tools invocable from Claude.ai; cover letter generates a complete draft; checklist personalises based on scenario.

---

#### Day 4: `visa_audit_application` + Integration Testing

**Morning — `visa_audit_application`:**
- [ ] Create `lib/marco-polo/mcp-tools/visa-audit-application.ts`:

```typescript
// Tool: visa_audit_application
// Input: { documents_present: string[], purpose, applicant_count, has_minors,
//          is_sponsored, travel_dates, cover_letter_drafted: boolean,
//          financial_evidence: string, insurance_verified: boolean }
// Output: 5-layer audit verdict (PASS / HOLD / FAIL per layer) + specific fixes

export const visaAuditApplicationSchema = {
  documents_present: z.array(z.string())
    .describe("List of documents the applicant has prepared"),
  purpose: z.enum(["tourism", "family-visit", "business", "other"]),
  applicant_count: z.number().default(1),
  has_minors: z.boolean().default(false),
  is_sponsored: z.boolean().default(false),
  travel_dates: z.string(),
  cover_letter_drafted: z.boolean().default(false),
  financial_evidence: z.string().describe("Summary of financial documents"),
  insurance_verified: z.boolean().default(false),
};
```

- [ ] Handler loads `audit-application.md` skill
- [ ] Runs the 5-layer check: completeness → consistency → credibility → compliance → admissibility
- [ ] Returns structured verdict with per-layer status + specific fixes for any HOLD/FAIL

**Afternoon — Integration testing:**
- [ ] Full end-to-end test via Claude.ai connector:
  1. "I want to apply for a France Schengen visa" → `visa_start_here`
  2. "Generate my document checklist" → `visa_document_checklist`
  3. "Draft my cover letter" → `visa_draft_cover_letter`
  4. "Am I ready to submit?" → `visa_audit_application`
  5. "What's the visa fee?" → `visa_knowledge`
- [ ] Verify state persists across tool calls (applicant context carries forward)
- [ ] Verify zh-CN: test with Chinese input, check if tools return Chinese content
- [ ] Test error cases: missing required fields, invalid enum values, large responses

**Day 4 acceptance:** All 5 tools work in sequence; Claude.ai renders artifacts correctly; state carries across turns.

---

#### Day 5: Deploy + Document + Validate Open Questions

**Morning — Production deploy:**
- [ ] Merge to main with `[deploy]` token (required by torlyAI Vercel gate)
- [ ] Verify MCP endpoint live at `https://torly.ai/api/mcp/visa-master`
- [ ] Test Claude.ai connector with production URL (not preview)
- [ ] Verify `vercel ls torlyai --prod | head -5` shows `Ready`

**Afternoon — Validate open questions + document findings:**
- [ ] **Q1: Artifacts** — Do tool responses render as downloadable artifacts in Claude.ai? Record: yes/no + workaround if no
- [ ] **Q3: State** — Does Claude pass prior tool results to subsequent calls? Or do we need server-side state for all cross-turn context? Record: behaviour observed
- [ ] **Q4: Response size** — Test with the largest skill (`sponsored-application.md`, 14.6K chars) as tool output. Does Claude truncate? Record: max observed size
- [ ] Update PRD §19 (Open Questions) with findings
- [ ] Write setup instructions for Phase 1 team: how to add a new MCP tool (template + registration steps)

**Day 5 acceptance:** Production MCP endpoint live; open questions answered; Phase 1 ready to start.

---

### A.5 MCP Route Handler (Reference Implementation)

```typescript
// app/api/mcp/visa-master/route.ts

import { createMcpHandler } from "mcp-handler";
import { registerVisaTools } from "@/lib/marco-polo/mcp-server";

const handler = createMcpHandler(
  (server) => {
    registerVisaTools(server);
  },
  {
    name: "Marco Polo — Visa Master",
    version: "0.1.0",
  },
  {
    basePath: "/api/mcp/visa-master",
    maxDuration: 60,
    verboseLogs: process.env.NODE_ENV === "development",
  }
);

export { handler as GET, handler as POST, handler as DELETE };
```

```typescript
// lib/marco-polo/mcp-server.ts

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { visaStartHere, visaStartHereSchema } from "./mcp-tools/visa-start-here";
import { visaDocumentChecklist, visaDocumentChecklistSchema } from "./mcp-tools/visa-document-checklist";
import { visaAuditApplication, visaAuditApplicationSchema } from "./mcp-tools/visa-audit-application";
import { visaDraftCoverLetter, visaDraftCoverLetterSchema } from "./mcp-tools/visa-draft-cover-letter";
import { visaKnowledge, visaKnowledgeSchema } from "./mcp-tools/visa-knowledge";

export function registerVisaTools(server: McpServer) {
  server.tool(
    "visa_start_here",
    "Start a Schengen visa application. Asks 6 key questions (purpose, applicants, dates, residence, funding, prior history) and returns a personalised routing plan.",
    visaStartHereSchema,
    visaStartHere
  );

  server.tool(
    "visa_document_checklist",
    "Generate a personalised document checklist for a France Schengen visa application based on the applicant's scenario.",
    visaDocumentChecklistSchema,
    visaDocumentChecklist
  );

  server.tool(
    "visa_audit_application",
    "Run a 5-layer pre-submission audit (completeness, consistency, credibility, compliance, admissibility) and return PASS/HOLD/FAIL with specific fixes.",
    visaAuditApplicationSchema,
    visaAuditApplication
  );

  server.tool(
    "visa_draft_cover_letter",
    "Draft a personalised cover letter for a France Schengen visa application following the 30-second-skimmable format.",
    visaDraftCoverLetterSchema,
    visaDraftCoverLetter
  );

  server.tool(
    "visa_knowledge",
    "Look up France Schengen visa facts: fees, processing times, refusal codes, biometric rules, consulate-specific details.",
    visaKnowledgeSchema,
    visaKnowledge
  );
}
```

### A.6 Content Sync Script

```bash
#!/bin/bash
# scripts/sync-content.sh
# Copies skill content from Schengen-visa repo to torlyAI for MCP tool loading

SRC="/Users/Jason-uk/AI/AI_Coding/Workspaces/Schengen-visa"
DST="/Users/Jason-uk/AI/AI_Coding/Repositories/torlyAI/lib/marco-polo/content"

mkdir -p "$DST/skills" "$DST/skills/i18n/zh-CN"

# Copy all 37 SKILL.md files (flatten to name.md)
for skill_dir in "$SRC"/skills/*/; do
  name=$(basename "$skill_dir")
  [ -f "$skill_dir/SKILL.md" ] && cp "$skill_dir/SKILL.md" "$DST/skills/$name.md"
done

# Copy zh-CN translations
for skill_dir in "$SRC"/skills/i18n/zh-CN/*/; do
  name=$(basename "$skill_dir")
  [ -f "$skill_dir/SKILL.md" ] && cp "$skill_dir/SKILL.md" "$DST/skills/i18n/zh-CN/$name.md"
done

# Copy knowledge files
cp "$SRC/skills/ETHOS.md" "$DST/ethos.md"
cp "$SRC/skills/countries/france/KNOWLEDGE.md" "$DST/knowledge.md"
for f in "$SRC"/skills/countries/france/consulate-*.md; do
  cp "$f" "$DST/$(basename "$f")"
done

echo "Synced $(find "$DST" -name "*.md" | wc -l | tr -d ' ') files to $DST"
```

### A.7 Phase 0 Definition of Done

| # | Criterion | How to verify |
|---|---|---|
| 1 | MCP endpoint responds at `torly.ai/api/mcp/visa-master` | `curl -X POST https://torly.ai/api/mcp/visa-master` returns MCP protocol response |
| 2 | Claude.ai can add as custom connector | Customize > Connectors > Add > paste URL > "Connected" |
| 3 | `visa_start_here` returns routing recommendation | Ask "I want a Schengen visa"; verify 6 questions + routing |
| 4 | `visa_document_checklist` generates personalised checklist | Ask for checklist with minors; verify minor-specific items appear |
| 5 | `visa_draft_cover_letter` generates complete letter | Provide applicant details; verify letter follows ETHOS principle 6 (30-second skimmable) |
| 6 | `visa_audit_application` returns 5-layer verdict | Provide incomplete scenario; verify HOLD/FAIL with specific fixes |
| 7 | `visa_knowledge` returns France-specific facts | Ask "What's the visa fee?"; verify €90 adult / €45 child 6-12 |
| 8 | Multi-tool conversation works | Complete all 5 tools in sequence in one Claude.ai conversation |
| 9 | Open questions Q1, Q3, Q4 answered | Findings documented in PRD §19 |
| 10 | Phase 1 setup instructions written | New developer can add a tool by following the template |
