# VM-launcher — User Guide

**Companion to:** [`VM-MASTER-PLAN.md`](./VM-MASTER-PLAN.md) · [`vm-product-hunt-checklist.md`](./vm-product-hunt-checklist.md)
**Agent definition:** [`.claude/agents/vm-launcher.md`](../../.claude/agents/vm-launcher.md)
**Strategic source:** [`../15-directory-submissions-launch-plan.md`](../15-directory-submissions-launch-plan.md)
**MCP server:** [`jaipandya/producthunt-mcp-server`](https://github.com/jaipandya/producthunt-mcp-server) (already installed globally for aiCMO; re-used here)
**Anchor day:** _D-LAUNCH-DATE TBD — see VM-MASTER-PLAN §3.2_
**Last updated:** 2026-05-15 (forked from `aicmo-uk/docs/launch/ph-launcher-guide.md`)

---

## 0. TL;DR

VM-launcher is a Claude Code subagent that executes the Visa Master launch defined in `VM-MASTER-PLAN.md`. It:

- **Reads** the master plan as its source of truth and edits it as TODOs flip and decisions resolve.
- **Orients by date** — every session opens with a `Day -N · Phase X` status frame.
- **Connects to Product Hunt** via the installed MCP server for read-only observability.
- **Delegates** to specialized agents (`Explore`, `feature-dev:code-architect`, `geo-*`) for heavy work.
- **Loads skills** (`copywriting`, `schema`, `competitors`, `geo-citability`, etc.) as playbooks for specific tasks.
- **Honors the trust boundary** — refuses any code or copy that widens the Free-tier "never reads your password" promise.
- **Never** triggers anti-manipulation behaviour (no programmatic upvotes, no "ask for upvotes" framing).

**Critical constraint to internalize**: VM-launcher *monitors and prepares*; **Jason executes** the irreversible actions (hit "Launch", post comments, cast upvotes). The Product Hunt API has no write mutations for these — by design, to prevent abuse. VM-launcher refuses any request to automate them.

---

## 1. How to invoke it

### 1.1 Explicit invocation (always works)

| Pattern | Example |
|---|---|
| `@vm-launcher <task>` | `@vm-launcher status check` |
| `VM-launcher, <task>` | `VM-launcher, what's the next critical-path item?` |
| `/vm-launcher <task>` | `/vm-launcher run the Phase 0 audit` |

### 1.2 Proactive triggers (auto-routing)

Claude Code's subagent router will hand off to VM-launcher when the user mentions any of these in a launch-context conversation:

- "Visa Master Product Hunt launch", "VM launch", "VM-MASTER-PLAN"
- "Phase 0 / 1 / 2 / 3 / 4 / 5" of the launch
- "the critical path", "CP-1 / CP-2 / CP-3 / CP-4 / CP-5 / CP-6 / CP-7"
- "decisions D1..D5", "D-LAUNCH-DATE / D-HUNTER / D-COMMENTER / D-TRUSTPILOT / D-ZH-TRANSLATOR"
- "/alternatives/visadar" or "/visa-master/vs-*" pages
- "Variant A vs Variant B copy"
- "r/SchengenVisa post", "Xiaohongshu / Zhihu / RedNote"
- "schengenvisainfo.com forum"
- "PH gallery for Visa Master", "demo video clip"
- "what's next" / "where are we" / "execute the next step" *in a launch context*

### 1.3 Opening status frame

Every session, VM-launcher opens with this exact frame (≤5 lines):

```
VM-launcher · Day -N · Phase X · Status: <colour>
Next critical milestone: CP-N — <description> — due YYYY-MM-DD (in M days)
Open decisions due ≤7 days: <list or "none">
Today's recommended action: <single highest-leverage item>
```

If you've said "execute" or "continue" in the prompt, VM-launcher proceeds with the recommended action. Otherwise it asks what you want to work on.

---

## 2. The MCP server — already installed

The Product Hunt MCP server is installed globally at `~/.claude/.mcp.json` (originally for aiCMO). The same registration serves Visa Master sessions automatically.

Verify once after first session:

```
@vm-launcher run check_server_status and get_viewer
```

Should return your `@dukewood` profile and a healthy rate-limit count. If tools aren't bound, see `aicmo-uk/docs/launch/ph-launcher-guide.md` §2.5 for the binding-gotcha fix (most common: Claude Code session predates the MCP install — quit ⌘Q and reopen).

11 read-only tools are available (`get_post_details`, `get_post_comments`, `get_user`, `get_viewer`, etc. — full list in ph-launcher guide §2.1). The PH V2 GraphQL API has **no write mutations** for posts/comments/votes — this is policy, not oversight.

### What VM-launcher does on launch day (real example)

09:14 BST on D-Day (hour +1 of launch). VM-launcher's loop:

1. **Every 5 minutes** — `get_post_details(slug: "visa-master")`. Log to `docs/launch/launch-day-log-<DATE>.md`.
2. **Every 5 minutes** — `get_post_comments(post_id, after: <last_seen_id>)`. Diff against previous tick.
3. **For each new comment**:
   - `get_user(username)` to fetch commenter profile (followers, past PH activity).
   - Read the comment text.
   - Draft a 2–4 sentence reply in maker voice, feedback-framed, never "thanks for the upvote".
   - Surface to you with full context for paste-and-edit within 30 seconds.
4. **Every hour at :00** — `Hour N · Rank #M · Votes V · Comments C · Reply latency p50 X min`.

You stay in your inbox / Twitter / coffee mug. VM-launcher does the watching.

---

## 3. Equipped capabilities — quick reference

Tools (per agent §3): `Read, Write, Edit, Glob, Grep, Bash, WebFetch, WebSearch, TodoWrite, Agent, Skill`.

Skills mapped to phases (per agent §7) — call via `Skill(skill: "<name>")`:

**Phase 0 — Foundation**
- `competitor-profiling` — research before writing vs-* pages
- `competitors` — alt-page playbook
- `schema` — FAQPage / BreadcrumbList / Product / SoftwareApplication / Organization JSON-LD
- `seo-audit` — landing-page audit
- `geo-audit` — full GEO+SEO score
- `copywriting` — landing hero, alt-page TL;DRs, FAQ answers
- `copy-editing` — listing description polish, maker comment polish, recap blog

**Phase 2 — Pre-launch**
- `cold-email` — Tier 6 listicle outreach
- `community-marketing` — Reddit 90/10 warm-up
- `social` — Xiaohongshu carousel, Zhihu Q&A, Twitter, LinkedIn
- `marketing-psychology` — Variant A framing under feedback-ask rule

**Phase 3 — Launch day**
- `social` — Twitter / LinkedIn day-of
- `community-marketing` — Indie Hackers / r/SaaS day-of and day +1
- `launch` — real-time pivots if filter fires or reply latency drops

**Phase 4 + 5 — Post-launch**
- `geo-citability`, `geo-brand-mentions`, `geo-content`, `geo-schema` — AI-citations KPI
- `landing-report` — recap structuring
- `marketing-ideas` — day-30/90 channel ideation

**Strategic / process**
- `office-hours` — validate launch motion if reality shifts
- `charlie` — Socratic exploration of two-valid-paths decisions
- `investigate` — root-cause build / deploy / indexing failures
- `ship` — actual deploy after CP-2/CP-3 lands
- `devjournal Schengen-visa` — session continuity log

**Skills VM-launcher AVOIDS** (per agent §7.7):
- `pricing` — D2 locked (£19 success fee, refundable 24h)
- `ad-creative`, `ads` — D5 excludes paid amplification
- AI-framing copy — would dilute trust story (D3)
- Anything that captures TLS credentials in Free tier — CLAUDE.md violation

Sub-agents (per agent §9):

| Need | Sub-agent |
|---|---|
| Deep codebase exploration in cross-repo torlyAI | `Explore` or `feature-dev:code-explorer` |
| Architecture for `app/visa-master/[page]` routes | `feature-dev:code-architect` |
| Pre-merge review of CP-2/CP-3 code | `feature-dev:code-reviewer`, `pr-review-toolkit:code-reviewer` |
| Full GEO+SEO audit (multi-step, heavy) | `geo-ai-visibility` |
| Strategic Socratic exploration | `charlie` |

---

## 4. Common workflows — copy-pasteable starting prompts

### 4.1 "Where are we?" (open every session)

```
@vm-launcher status check
```

### 4.2 Lock the launch date (D-LAUNCH-DATE — first decision to resolve)

```
@vm-launcher help me lock D-LAUNCH-DATE. Constraints: must be Tue/Wed/Thu,
≥14 days after Chrome Web Store approval, ≥7 days after CP-5 (Premium
booking validation). Pull the next 4 weeks of PH featured launches via
the MCP server and surface any AI-marketing or travel-tool heavyweights
to avoid clashing with.
```

### 4.3 Build the first alternative page (CP-3)

```
@vm-launcher start CP-3. Build /visa-master/vs-visadar in the torlyAI
repo. Use the competitors skill for structure and the schema skill for
JSON-LD. Source competitor research from docs/08-vs-alternatives.md.
Open a PR; remember the [deploy] token in the squash-merge.
```

### 4.4 Daily PH account-warmup verification (Phase 0+ ongoing)

```
@vm-launcher verify today's PH warmup. Call the MCP server's get_viewer
then list my comments from today. Confirm 3+ thoughtful comments on
launching products. Update VM-MASTER-PLAN Phase 0 daily checklist.
```

### 4.5 Competitive launch-day scan (Phase 2 from D-7)

```
@vm-launcher run a competitive scan for D-Day. Pull featured posts
scheduled for that day. Flag anything that looks like a travel tool,
visa tool, productivity Chrome extension, or YC-class brand. If a
heavyweight is on the calendar, propose whether to slip by 1 week.
```

### 4.6 Day-of: real-time monitoring (Phase 3, D-Day)

```
@vm-launcher launch day. Start the 5-min poll on the visa-master listing.
Maintain the log at docs/launch/launch-day-log-<DATE>.md. For every new
comment, draft a reply in maker voice (feedback-framed, never thanks-
for-upvote) and surface it to me within 30 seconds. Emit hourly
milestone summaries on the hour.
```

### 4.7 Day +1: launch recap

```
@vm-launcher fill the launch recap. Pull final stats from the MCP server:
votes, comments, final rank. Cross-reference with CWS install delta and
Premium activations. Save the post at torly.ai/blog/visa-master-product-
hunt-launch-recap-2026 (PR against torlyAI). Use the copy-editing skill
on the final draft.
```

### 4.8 Day +1 to +7: vertical-channel ignition

```
@vm-launcher start the vertical-channel ignition per docs/15-* Week 3
schedule. Specifically: the r/SchengenVisa post (Variant B copy from
docs/15-* §6.2, NOT Variant A — will be auto-removed otherwise),
schengenvisainfo.com forum post, and the first Xiaohongshu carousel.
For Xiaohongshu, flag if D-ZH-TRANSLATOR isn't resolved.
```

### 4.9 Day 30 / 60 / 90: KPI checkpoint

```
@vm-launcher run the day-30 KPI checkpoint. Pull current numbers for
every metric in VM-MASTER-PLAN §5. Compare against day-30 targets. For
any metric <70% of target, root-cause it in writing before recommending
more directory submissions.
```

---

## 5. Things VM-launcher will refuse

| Request | Why refused |
|---|---|
| "Auto-upvote my own listing" | Anti-manipulation filter nukes the listing. PH API doesn't expose vote creation; even if it did, this hides launches |
| "Auto-post the maker comment at 00:01" | Same — manual step is a feature. VM-launcher prepares the comment; you paste it |
| "Auto-reply to every PH comment" | The 30-min reply SLA is the *user-quality* signal PH algorithm rewards. Auto-replies degrade signal |
| "DM strangers to ask for upvotes" | Three Absolute Rules #2 (checklist §5) — existing relationships only |
| "Frame the listing as an upvote ask" | Three Absolute Rules #1 — feedback framing only |
| "Push directly to main" | Project rule (CLAUDE.md global) — always via PR with branch prefix |
| "Add a feature that captures TLS password in Free tier" | D3 / CLAUDE.md trust boundary violation — would destroy the brand's only moat |
| "Add a coupon to add launch urgency" | D2 — pricing model IS the offer; coupon would dilute success-fee positioning |
| "Frame Visa Master as an AI tool" | D5 — no AI-marketed copy until/unless an AI feature ships; would dilute trust story (D3) and confuse vertical audience |
| "Submit to TAAFT / Futurepedia / G2" | D5 excludes these |
| "Ship Variant A copy to r/SchengenVisa or Trustpilot" | Routing table (`docs/15-*` §6.3) mandates Variant B in trust-sensitive channels — Variant A gets auto-removed |
| "Push the torlyAI cross-repo merge without `[deploy]` token" | CLAUDE.md cross-repo deploy gate — silently un-deploys the change |

---

## 6. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `mcp__product-hunt__*` tools not visible | Current Claude Code session predates the MCP install | Quit Claude Code completely (⌘Q), reopen. See `aicmo-uk/docs/launch/ph-launcher-guide.md` §2.5 |
| `claude mcp list` doesn't show product-hunt | Malformed `~/.claude/.mcp.json` | `python3 -m json.tool ~/.claude/.mcp.json` to validate. A missing comma drops every server below it |
| MCP tools return "unauthorized" | Keychain entry missing or token expired | `security find-generic-password -s 'aiCMO MCP Local' -a 'developer_token'` should return non-empty metadata. If missing or expired, re-issue token and re-add |
| VM-launcher tries to apply aiCMO decisions to Visa Master | Agent definition wasn't read this session, or you accidentally invoked `@ph-launcher` instead | Use `@vm-launcher` explicitly. Confirm `.claude/agents/vm-launcher.md` exists in this project root |
| VM-launcher proposes Variant A copy for r/SchengenVisa | Agent didn't read `docs/15-*` §6.3 routing table | Reopen with: `read docs/15-* §6.3 routing table — what variant goes to r/SchengenVisa?` |
| Status frame says "🟡 Phase X" but you expected ✅ | A CP milestone slipped | Read VM-MASTER-PLAN §4 critical-path table; investigate the specific CP-N. Don't push harder — root-cause first |

---

## 7. Differences from ph-launcher (the aiCMO version)

For future-you: this agent was forked from `aicmo-uk/.claude/agents/ph-launcher.md` v1 on 2026-05-15. The deltas:

| Area | aiCMO ph-launcher | Visa Master vm-launcher |
|---|---|---|
| Source-of-truth doc | `docs/launch/MASTER-PLAN.md` | `docs/launch/VM-MASTER-PLAN.md` |
| Strategic plan | `aicmo-uk-directory-submissions-launch-plan.md` | `docs/15-directory-submissions-launch-plan.md` |
| Critical path | CP-1..CP-7 anchored to 2026-06-03 | CP-1..CP-7 anchored to TBD (D-LAUNCH-DATE open) |
| CP-1 | Baseline metrics captured | Chrome Web Store approval — external dependency |
| Pricing model | Subscription with `PHLAUNCH50` 50%-off coupon | Success-fee £19/booking, refundable 24h, NO coupon |
| Brand decision (locked) | Maggie/coral palette (decision 6.6) | Visa Master brand TBD; trust language is the differentiator (D3) |
| Destination pages | 4 alts (HubSpot/Surfer/Jasper/Clay) + 4 audiences (agencies/SaaS-founders/consultants/sales-teams) | TBD competitor list (Visadar known; 2-3 more TBD) + visa applicants are the only audience |
| Vertical channels | Generic SaaS/Marketing | r/SchengenVisa, schengenvisainfo.com, Xiaohongshu (zh-CN), Zhihu (zh-CN), expat forums — NOT in ph-launcher |
| Positioning variants | Single voice | Variant A (Premium-led, ~70%) + Variant B (privacy-first, ~30%) — routed per channel |
| Cross-repo deploy gate | aiCMO-internal | torlyAI `[deploy]` token gate — easy to forget, silently un-deploys |
| Trust boundary | n/a | D3 + CLAUDE.md — load-bearing brand promise; cannot widen Free-tier claim |
| MCP server config | Same global registration in `~/.claude/.mcp.json` (Keychain pattern) — re-used here | Same |
| Refusals | aiCMO design re-litigation, generic anti-manipulation | Adds Variant A → trust-sensitive channel block, Free-tier credential capture block, AI-framing block |

---

## 8. Maintenance protocol

This guide stays useful only if it tracks reality. Update whenever:

- The MCP server gets a version bump with new tools — extend §2.
- A new skill becomes worth using — add to §3.
- A new common workflow emerges run more than 3 times — codify as §4 entry.
- A new refusal becomes load-bearing — add to §5.
- A new troubleshooting pattern is solved — add to §6.

**Suggested cadence:** same as VM-MASTER-PLAN — Monday mornings through D+90.

---

*Last updated: 2026-05-15 · companion to `.claude/agents/vm-launcher.md` v1 · forked from `aicmo-uk/docs/launch/ph-launcher-guide.md`*
