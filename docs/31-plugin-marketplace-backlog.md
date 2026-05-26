# Plugin Marketplace — Submission backlog & monitoring

**Date:** 2026-05-25
**Status:** Both submissions filed; awaiting review
**Companion docs:** [29-submission-package](./29-plugin-marketplace-submission.md) · [27-prd](./27-plugin-marketplace-prd.md) · [26-research](./26-plugin-marketplace-research.md)

---

## 1. Submission log

| Marketplace | Submitted | Portal | Status | Approved | Notes |
|---|---|---|---|---|---|
| **Anthropic (Claude Code)** | 2026-05-25 | claude.ai/settings/plugins/submit | Pending review | — | Marketplace ID: `visa-schengen` |
| **Cursor** | 2026-05-25 | cursor.com/marketplace | Pending review | — | Org handle: `@torly` |

Update this table as statuses change. Record any confirmation numbers or email replies below.

### Correspondence

<!-- Paste reviewer feedback, approval emails, or change requests here -->

---

## 2. Review checkpoints

Neither marketplace publishes a review SLA. Check these milestones:

### Week 1 (T+0 to T+7) — 2026-05-25 to 2026-06-01

- [ ] Confirmation email received (Anthropic)
- [ ] Confirmation email received (Cursor)
- [ ] Self-hosted install still works: `/plugin marketplace add torlyai/Schengen-master`
- [ ] GitHub repo public and tag `skills-v1.3.0` accessible
- [ ] Check if `visa-schengen` appears in `/plugin marketplace list` (Anthropic)
- [ ] Check if plugin appears in Cursor marketplace search

### Week 2 (T+7 to T+14) — 2026-06-01 to 2026-06-08

- [ ] If no response: send follow-up email to marketplace-publishing@cursor.com
- [ ] If no response (Anthropic): check anthropics/claude-plugins-community for new commits
- [ ] Review GitHub Insights → Traffic for referrer changes
- [ ] Check GitHub stars delta since submission

### Week 4 (T+14 to T+28) — 2026-06-08 to 2026-06-22

- [ ] If still pending: escalate (email again, or raise in Anthropic community/Discord)
- [ ] If approved: complete post-approval tasks (see §4)
- [ ] If rejected: log reasons and create follow-up PRD (docs/32-* or similar)

### Ongoing (monthly after approval)

- [ ] Monthly analytics check (see §3)
- [ ] Update marketplace listing if new skills ship (bump tag, re-submit if needed)
- [ ] Review and respond to any user issues filed mentioning marketplace install

---

## 3. Analytics & monitoring

Neither marketplace exposes download/install counts to publishers. Monitor via proxy signals.

### GitHub proxy signals (check monthly)

| Signal | How to check | Baseline (2026-05-25) | Latest |
|---|---|---|---|
| **Stars** | `gh api repos/torlyai/Schengen-master --jq .stargazers_count` | ___ | |
| **Forks** | `gh api repos/torlyai/Schengen-master --jq .forks_count` | ___ | |
| **Traffic — views (14d)** | `gh api repos/torlyai/Schengen-master/traffic/views --jq .count` | ___ | |
| **Traffic — clones (14d)** | `gh api repos/torlyai/Schengen-master/traffic/clones --jq .count` | ___ | |
| **Traffic — referrers** | `gh api repos/torlyai/Schengen-master/traffic/popular/referrers` | ___ | |
| **Issues mentioning skills** | `gh issue list --repo torlyai/Schengen-master --search "skill OR plugin OR marketplace"` | 0 | |

### Marketplace-specific checks

| Check | Command / action | Frequency |
|---|---|---|
| **Anthropic listing live** | In Claude Code: `/plugin marketplace list` → search for `visa-schengen` | Weekly until approved, then monthly |
| **Anthropic pinned SHA** | `gh api repos/anthropics/claude-plugins-community/commits --jq '.[0].commit.message'` — look for `visa-schengen` | After approval |
| **Cursor listing live** | Visit cursor.com/marketplace and search "visa" or "schengen" | Weekly until approved, then monthly |
| **Install smoke test** | Fresh Claude Code session: `/plugin marketplace add torlyai/Schengen-master` → `/plugin install trip-planner@visa-schengen` → run `/trip-planner:start-here` | After each tag bump |

### Referrer tracking (look for these after approval)

When the marketplace starts sending traffic, these referrers should appear in GitHub Traffic:

- `claude.ai` or `code.claude.com` — Anthropic marketplace
- `cursor.com` — Cursor marketplace
- `raw.githubusercontent.com` — logo fetches (indirect signal)

### What "success" looks like

| Timeframe | Signal | Target |
|---|---|---|
| **T+30d** | At least one marketplace approved | 1 of 2 |
| **T+60d** | GitHub referrer traffic from marketplace domain | Any non-zero |
| **T+90d** | Issues or discussions filed by marketplace-discovered users | >= 1 |
| **T+90d** | Stars delta attributable to marketplace | +10 |

---

## 4. Post-approval tasks

### Anthropic

- [ ] Update doc 29 with approval date and pinned SHA
- [ ] Verify `/plugin marketplace list` shows `visa-schengen`
- [ ] Run full install smoke test (all 10 personas)
- [ ] Add "Available on Claude Code Plugin Marketplace" badge to skills/README.md
- [ ] Announce in relevant channels (GitHub Release notes, README, torly.ai)
- [ ] Update `docs/marketplaces/README.md` status to "Approved"

### Cursor

- [ ] Update doc 29 Appendix A with approval date
- [ ] Verify listing appears in Cursor marketplace search
- [ ] Test install flow from Cursor IDE
- [ ] Confirm `SKILL.md` files load correctly (or note if `.cursor/rules/` adaptation was needed)
- [ ] Add "Available on Cursor Marketplace" badge to skills/README.md
- [ ] Update `docs/marketplaces/README.md` — add Cursor row

---

## 5. If changes requested

Common reviewer asks and pre-prepared responses:

| Ask | Response | Effort |
|---|---|---|
| **Polish skill frontmatter descriptions** | 5 rewrites already prepared in [docs/28](./28-skill-description-audit.md) | < 1h |
| **Add more metadata to marketplace.json** | Add fields per reviewer request, bump tag | < 30min |
| **Rename marketplace identifier** | Update `marketplace.json` `name` field + all docs | < 1h |
| **Adapt to Cursor's plugin format** | May need `.cursor/rules/` wrappers around `SKILL.md` files | 2-4h |
| **Add screenshots** | Generate via browser automation (noted in doc 29 §Screenshots) | < 1h |
| **Security/privacy concern** | All skills are read-only markdown with no network calls, no secrets, no file writes | Clarification only |

---

## 6. Future marketplace submissions

Other registries to consider after the first two are approved:

| Registry | URL | Format | Priority | Notes |
|---|---|---|---|---|
| **ClaudeSkills.info** | claudeskills.info | Curated listing | Medium | 658+ skills, low-friction submission |
| **LobeHub Skills** | lobehub.com/skills | Community | Low | 10K+ indexed, broad audience |
| **Skills.sh / npx skills** | vercel-labs/skills | npm-style | Low | Codex CLI users |
| **MCP registries** | smithery.ai, glama.ai, registry.modelcontextprotocol.io | MCP server | Deferred | Would require wrapping skills as MCP server — different engineering effort |
