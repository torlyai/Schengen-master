# Multi-marketplace distribution convention

This repo distributes its skills across **multiple AI ecosystems**. Each ecosystem requires its plugin/marketplace manifest at an ecosystem-specific path — there is no shared standard. This document maps where each manifest lives (and why some are absent).

## Why this file exists

Visitors who want to understand "how is this repo distributed?" often expect a single manifest file. The reality is more fragmented — each AI tool defines its own plugin spec and requires its own manifest at its own path. Rather than scattering this knowledge across ecosystem-specific READMEs, we keep one index here.

## Current state

| Ecosystem | Manifest location | Status | How users install |
|---|---|---|---|
| **Claude Code (Anthropic)** | [`/.claude-plugin/marketplace.json`](../../.claude-plugin/marketplace.json) | ✅ Live (v1.3.0) | `/plugin marketplace add torlyai/Schengen-master`, then `/plugin install <persona>@visa-schengen` |
| **Standalone (no ecosystem)** | [`/skills/install.sh`](../../skills/install.sh) | ✅ Live (v0.1.0+) | `curl -sSL https://raw.githubusercontent.com/torlyai/Schengen-master/main/skills/install.sh \| sh` — sparse-checkout to `~/.claude/skills/schengen-master/` |
| **OpenAI Codex CLI** | — | Not yet shipped | Codex consumes skills via `npx skills add torlyai/Schengen-master` reading `skills/<name>/SKILL.md` directly. No second manifest file needed. |
| **Cursor** | — | Not planned | Cursor's plugin model is `.cursor/rules/` — different shape from Anthropic's `SKILL.md` standard. Would require a separate authoring effort, not a config addition. |
| **OpenCode** | — | Not planned | Similar to Cursor — different shape from `SKILL.md`. |
| **ChatGPT (GPT Store)** | — | N/A | The GPT Store is a hosted UI for sharing GPTs, not a repo-based distribution channel. There's no manifest-file equivalent to add. |

## Why paths are ecosystem-specific (not unified)

Each AI tool's plugin command (`/plugin marketplace add ...` in Claude Code, equivalent commands elsewhere) auto-discovers the manifest at a tool-specific path. The tool decides that path; the repo can't override it without breaking the zero-friction install flow.

We considered using a unified `marketplaces/<ecosystem>/manifest.json` structure for symmetry. We chose not to because:

1. **Claude Code's `/plugin marketplace add owner/repo` looks at `.claude-plugin/marketplace.json` only** — moving the file elsewhere would silently break the install flow
2. **No other ecosystem requires a second manifest today** — Codex consumes skill folders directly, ChatGPT doesn't use repos, Cursor uses a different format
3. **A unified folder would be premature optimization** — when a future ecosystem ships a marketplace spec, it will require its own fixed path, not a folder we chose

This index file gives us the **organisational benefit** (one place to read about all distribution channels) without breaking any tool's required paths.

## Adding a new marketplace

When a new AI ecosystem ships a plugin marketplace spec:

1. Add the manifest at the path **that ecosystem requires** (don't relocate to a unified folder)
2. Update the table above with a new row
3. Add an "Install via [Ecosystem]" section to [`skills/README.md`](../../skills/README.md)
4. Tag a new release and submit to the ecosystem's discovery channel (if it has one)

## References

- **Claude Code plugins:** [code.claude.com/docs/en/plugins](https://code.claude.com/docs/en/plugins)
- **Claude Code plugin marketplaces:** [code.claude.com/docs/en/plugin-marketplaces](https://code.claude.com/docs/en/plugin-marketplaces)
- **Concrete Anthropic example:** [anthropics/skills marketplace.json](https://github.com/anthropics/skills/blob/main/.claude-plugin/marketplace.json)
- **Agent Skills standard:** [agentskills.io](https://agentskills.io)
- **`npx skills`** (used by Codex and others): [github.com/vercel-labs/skills](https://github.com/vercel-labs/skills)
