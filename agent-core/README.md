# agent-core — Marco Polo Shared Agent Core

The single source of truth for the Marco Polo visa advisor agent. Three runtime paths consume this directory; none fork it.

## What this directory is

`agent-core/` contains the **canonical agent definition** — the system prompt, tool schemas, and per-path configuration templates. Skill content lives adjacent in `skills/` and `lib/marco-polo/content/` (torlyAI repo). Each runtime path reads from these files at runtime; no compiled-in copies.

## Directory structure

```
agent-core/
├── SYSTEM_PROMPT.md        One canonical system prompt for all three paths
├── tools/                  Tool definitions — one JSON Schema file per tool
│   ├── visa_start_here.json
│   ├── visa_knowledge.json
│   ├── visa_document_checklist.json
│   ├── visa_draft_cover_letter.json
│   ├── visa_audit_application.json
│   └── (more added in Phase 2)
├── config/
│   ├── path-a.mcp.json         Reference: how Path A (MCP Gateway) consumes the core
│   └── path-c.openclaw.yaml    OpenClaw agent config template for Path C
└── README.md               This file
```

Each `tools/*.json` file has four fields: `name`, `description`, `input_schema` (JSON Schema), `skill_path` (points into `skills/`), `content_path` (points into `lib/marco-polo/content/`).

## The three runtime paths

| | Path A — MCP Gateway | Path C — OpenClaw Router | Path B — Managed Agents |
|---|---|---|---|
| **Status** | LIVE | Next to build (Phase 3) | Future |
| **Where it runs** | torly.ai Vercel (primary dev machine) | MacBook M1 Pro, always-on daemon | Anthropic cloud |
| **User surface** | claude.ai MCP connector | WhatsApp / Telegram | torly.ai/marco-polo/app |
| **Who pays LLM** | User (their Claude sub) | You (Anthropic API key) | You (Anthropic API key) |
| **System prompt** | Loaded at MCP server startup from `SYSTEM_PROMPT.md` | Loaded into OpenClaw agent config from `SYSTEM_PROMPT.md` | Passed to `POST /v1/agents` system field |
| **Tool definitions** | MCP tool schemas from `tools/*.json`; handler functions in `lib/marco-polo/mcp-tools/*.ts` | Anthropic tool_use definitions from `tools/*.json`; executor in `lib/marco-polo/openclaw/tool-executor.ts` | `agent_toolset_20260401` + MCP server pointing at your tools |
| **Skills content** | Read from disk at request time via `skill-loader.ts` | Read from disk by OpenClaw daemon | Mounted in Anthropic sandbox at `/workspace/skills` |
| **Tool execution** | MCP server handler (your code in torlyAI) | OpenClaw agent loop (local, reads markdown) | Anthropic's sandbox |
| **Config file** | `config/path-a.mcp.json` (reference) | `config/path-c.openclaw.yaml` (template) | `config/path-b.managed.json` (future) |

## How each path consumes the core

**Path A (MCP Gateway):** `mcp-server.ts` calls `registerVisaTools()`, which reads tool metadata from `tools/*.json` at startup. Handler functions in `mcp-tools/*.ts` execute tool calls by reading skill content via `skill-loader.ts`. The `SYSTEM_PROMPT.md` is embedded in the MCP tool handler context.

**Path C (OpenClaw):** OpenClaw daemon on the M1 Pro loads `SYSTEM_PROMPT.md` and `tools/*.json` at startup. When a user message arrives via Telegram/WhatsApp, OpenClaw calls the Anthropic Messages API with the system prompt + tool definitions, then executes the returned tool call locally via `tool-executor.ts` (reads skill markdown from disk). Responses go back through the channel adapter.

**Path B (Managed Agents, future):** The `SYSTEM_PROMPT.md` is passed verbatim to the Anthropic Agents API `system` field on agent creation. The `skills/` directory is mounted in the agent's sandbox filesystem. Tool schemas from `tools/*.json` are registered as agent tools.

## Updating content — single propagation

When a skill is updated (e.g. `skills/cover-letter/SKILL.md` gets a revised template):

| Path | How update reaches it | Delay |
|---|---|---|
| Path A (MCP) | Next tool call reads updated file | Immediate |
| Path C (OpenClaw) | OpenClaw reads from disk at runtime | Immediate after `git pull` on M1 Pro |
| Path B (Managed) | Next session creation mounts updated `skills/` | Immediate for new sessions |

No redeployment needed for skill/content changes. Tool schema changes (`tools/*.json`) require a gateway restart on the M1 Pro.

## Authoring rule — two-machine model

`agent-core/` is authored **on the primary dev machine only**. The M1 Pro consumes it via `git pull`.

```
Primary dev machine            MacBook M1 Pro (study)
  git push                  ->   git pull
  Edits agent-core/              OpenClaw reads from disk (live)
  Edits skills/                  Never edits agent-core/
  Edits lib/marco-polo/          Owns lib/marco-polo/openclaw/ only
```

The M1 Pro owns `lib/marco-polo/openclaw/` (channel config, tool executor, deployment config). The primary machine does not edit those files. Git is the sync mechanism — there is no shared filesystem.

## Related docs

- `docs/33-marco-polo-unified-agent-architecture.md` — Architecture design (the three paths, cost model, two-machine model)
- `docs/34-unified-agent-implementation-plan.md` — Phase-by-phase implementation plan + M1 Pro setup (Appendix A)
- `docs/32-marco-polo-managed-agent-prd.md` — Original PRD (MCP Gateway + Hosted Chat)
