# Usage Plan: vm-launcher Agent for the Visa Master Launch

**Document:** 16-vm-launcher-usage-plan.md
**Version:** 1.0
**Date:** 2026-05-15
**Owner:** Duke Harewood (Torly AI)
**Reading time:** ~10 min
**Companion docs:**
- Agent definition: `.claude/agents/vm-launcher.md` (the WHAT — capabilities, refusals)
- Reference guide: `docs/launch/vm-launcher-guide.md` (the HOW — alphabetical capability reference)
- This doc: the WHEN — chronological runbook for actually using the agent week by week
- Master plan: `docs/launch/VM-MASTER-PLAN.md` (the WHEN — phase + critical path)
- Strategic plan: `docs/15-directory-submissions-launch-plan.md` (the strategy this all executes)

---

## 1. Why this doc exists

`vm-launcher-guide.md` is the **reference manual** — alphabetical capability listing, refusals, troubleshooting. It tells you *what's possible*.

This doc is the **runbook** — a chronological sequence of "do this, then that" usage instructions, with copy-pasteable prompts for every recurring moment. It tells you *what to actually do, in what order, with the agent*.

Read this once at the start of the launch window. Re-read the relevant phase section at the start of each phase. Don't re-read it every session.

---

## 2. One-time setup (do this today, ~10 minutes)

These steps unblock everything else. Skip nothing.

### 2.1 Restart Claude Code

The vm-launcher agent file lives at `.claude/agents/vm-launcher.md`. Agent files **bind at session start**, not config-save time. If you keep using the current session, Claude Code won't see the new agent.

```
⌘Q (Cmd-Q) to quit Claude Code completely — not just close the window.
Reopen in this project directory.
```

Also restart for the PH MCP server tools to bind (`mcp__product-hunt__*`). Same gotcha as ph-launcher — see `vm-launcher-guide.md` §6 if it doesn't work first try.

### 2.2 Smoke-test the agent

In the new session, type:

```
@vm-launcher status check
```

You should get the 5-line opening frame:

```
VM-launcher · Day -N · Phase 0 · Status: 🟡
Next critical milestone: CP-1 — Chrome Web Store approval — due TBD (external)
Open decisions due ≤7 days: D-LAUNCH-DATE (depends on CP-1)
Today's recommended action: <some Phase 0 work>
```

If you get an aiCMO-flavored response or a generic "I don't know what you mean", the agent didn't load — verify `.claude/agents/vm-launcher.md` exists in this project root.

### 2.3 Smoke-test the PH MCP server

```
@vm-launcher run check_server_status and get_viewer
```

Should return `@dukewood` profile + healthy rate-limit count. If "unauthorized" → check Keychain entry per `vm-launcher-guide.md` §6.

### 2.4 Fill the 5 outstanding TODOs in master plan §3.2

Before the agent can do anything date-anchored, you need to resolve at least **D-LAUNCH-DATE**. The other 4 (D-HUNTER, D-COMMENTER, D-TRUSTPILOT, D-ZH-TRANSLATOR) can resolve later but each unblocks specific work.

Use the agent for D-LAUNCH-DATE:

```
@vm-launcher help me lock D-LAUNCH-DATE. Constraints in VM-MASTER-PLAN
§3.2. Pull featured PH launches for the next 4 candidate Wednesdays via
the MCP server and surface any heavyweight Travel / Productivity /
Chrome Extension launches I'd be clashing with. Recommend a date and
its backup.
```

Do the other 4 manually — they're judgment calls, not research calls.

### 2.5 Capture KPI baselines (15 min)

Before any directory submission ships, lock the baseline numbers in `VM-MASTER-PLAN.md` §5. Otherwise day-30 / day-90 deltas are meaningless.

```
@vm-launcher capture KPI baselines for VM-MASTER-PLAN §5. Use Ahrefs
(or whatever's accessible), Search Console, the Chrome Web Store
Developer Dashboard, and a manual ChatGPT/Claude/Perplexity citation
check. Save findings to docs/launch/baseline-metrics-2026-05-15.md and
update the §5 _TBD_ slots in master plan.
```

---

## 3. Daily / session rhythm during the launch window

### 3.1 Open every session with one prompt

```
@vm-launcher status check
```

That's it. The agent reads `VM-MASTER-PLAN.md`, computes days-to-launch, identifies the active phase, surfaces the closest CP milestone and any open decisions due in ≤7 days, and recommends today's highest-leverage action.

### 3.2 Close every session with one prompt

```
@vm-launcher update master plan with what we did today and run
devjournal Schengen-visa.
```

The first half persists progress (TODOs flipped, decisions resolved, KPIs updated). The second half writes a session log so future-you (or future-Claude) can pick up cold.

### 3.3 Mid-session pattern

You don't need to invoke the agent for every keystroke. Use the agent when:
- Something needs to be **anchored to a date** (status check, slip decision, deadline reminder)
- Something needs to **cross-reference multiple docs** (does this copy violate D3? does this PR need the [deploy] token? what variant goes to this channel?)
- Something needs **PH MCP data** (vote count, comment poll, competitive scan)
- You're about to do **launch-day execution** (every comment routes through the agent)

You don't need it for: writing code inline, single-file edits, normal git/test workflows.

---

## 4. Phase-by-phase usage

Each phase below has: the goal, the prompts you'll use most, and the handoff pattern (agent vs human).

### Phase 0 — Foundation (D-21 → D-14)

**Goal:** CWS approval lands (CP-1, external) + landing page + first alt page indexed (CP-2, CP-3).

**Use the agent for:**
- Daily status check (3.1)
- Building `torly.ai/visa-master` and `/visa-master/vs-visadar` in the cross-repo torlyAI workspace
- Schema validation
- PH account warmup tracking

**Prompts:**

```
@vm-launcher start CP-2. Build torly.ai/visa-master in the torlyAI repo
following the per-page non-negotiables in vm-launcher.md §5.2. Use the
copywriting skill for hero, the schema skill for JSON-LD, and reference
docs/15-* §6 for Variant A copy. Open a PR; remember the [deploy] token.
```

```
@vm-launcher start CP-3. Build /visa-master/vs-visadar following the
competitors skill playbook. Source from docs/08-vs-alternatives.md.
Per-page non-negotiables apply. Open a PR.
```

```
@vm-launcher verify today's PH warmup. Call get_viewer then list my
recent comments. Confirm 3+ thoughtful comments on launching products
today. Update master plan Phase 0 daily checklist.
```

**Handoff:**
- **Agent does:** writes pages, runs schema/SEO audit, drafts copy, runs MCP scans
- **You do:** review and merge PRs (incl. `[deploy]` token), the actual PH commenting (manual — no automation), CWS responses if Google asks for clarification

### Phase 1 — Asset production (D-14 → D-7)

**Goal:** All PH assets ready (CP-4) + customer commenter confirmed (CP-5).

**Use the agent for:**
- Demo video PH-cut export (the agent can drive the Remotion build via Bash)
- Gallery image production from the PH-checklist §3.3 narrative
- Maker first comment polish (after you write the draft)

**Prompts:**

```
@vm-launcher cut the PH demo video. Source is marketing/video/out/
visa-master-promo-narrated.mp4 (75s). PH wants ≤90s and we're already
under, so verify resolution is 1920×1080 and re-encode if needed.
Upload to YouTube unlisted. Update master plan CP-4.
```

```
@vm-launcher I've drafted the maker first comment (paste below). Run
copy-editing skill on it. Critical constraints from vm-product-hunt-
checklist.md §3.1: feedback-framed (not upvote-ask), trust-boundary
honest (D3), Variant A tone, 800-1200 chars. Don't add em-dashes.

[paste your draft]
```

**Handoff:**
- **Agent does:** image production, video processing, copy polish, draft customer comment frames
- **You do:** identify the customer commenters (relationship work), confirm Premium booking validation against real TLS slot (CP-5)

### Phase 2 — Pre-launch warm-up (D-14 → D-1)

**Goal:** Audience primed (Upcoming page subscribers, Reddit history, listicle outreach).

**Use the agent for:**
- Reddit 90/10 warm-up tracking — has the agent count your last-14-days helpful comments in r/SchengenVisa
- Tier 6 listicle outreach via the cold-email skill
- Competitive PH launch scans starting D-7

**Prompts:**

```
@vm-launcher run a competitive scan for D-Day. Pull featured PH posts
scheduled for that day via get_posts. Flag anything that's a Travel
tool, visa tool, productivity Chrome extension, or YC-class brand. If
a heavyweight is on the calendar, propose whether to slip 1 week.
```

```
@vm-launcher draft the Tier 6 outreach. Find the 5 blog posts ranking
on Google for "Schengen appointment booking tips 2026" and "TLScontact
appointment hack". Use the cold-email skill. Goal: get included in
their next refresh as a recommended tool. Personalised per recipient.
```

```
@vm-launcher how's my r/SchengenVisa warmup looking? Comment count
last 14 days, helpful vs promo ratio. Per docs/15-* §5.3 we need
≥10 helpful comments before posting our own announcement.
```

**Handoff:**
- **Agent does:** drafts cold emails, runs MCP competitive scans, tracks Reddit comment count
- **You do:** actually post the Reddit comments (your account, your voice), send the cold emails after review

### Phase 3 — Launch day (D-Day, 24h window)

**Goal:** Survive the 24-hour window with 30-min reply latency, ranked top-10 by midnight.

This is the agent's highest-value phase. **Set it up at 23:45 BST D-1, then keep your laptop near you for 24 hours.**

**Prompts:**

23:45 BST D-1 (pre-flight):
```
@vm-launcher pre-flight check. Run §10 of vm-product-hunt-checklist.md.
Confirm every checkbox or list what's not ready. Set my alarm for
07:30 BST D-Day.
```

08:01 BST D-Day (launch window opens — start the monitoring loop):
```
@vm-launcher launch day. Start the 5-min poll on the visa-master PH
listing. Maintain the log at docs/launch/launch-day-log-<DATE>.md.
For every new comment: pull commenter's profile, draft a reply in
maker voice (feedback-framed, never thanks-for-upvote), surface to me
within 30 seconds. Emit hourly milestone summaries on the hour.
```

After launch goes live (08:05 BST), confirm maker comment posted:
```
@vm-launcher confirm the maker comment is live on the listing. Read it
back to me to verify it's the version from §3.1 of the checklist (not
an old draft).
```

Throughout the day — when a milestone summary arrives, no action needed unless something's off:
- Reply latency p50 > 30 min → take a break and reset
- Rank dropping rapidly → check for a competing heavyweight launch
- Comments drying up after hour 4 → push to email list / LinkedIn earlier

End of launch day (23:59 PT / 07:59 BST D+1):
```
@vm-launcher final reply pass. Pull all comments from the last hour I
might have missed. Surface drafts. Then capture the final stats and
prep the launch recap outline for tomorrow.
```

**Handoff (this is the most important phase to get right):**
- **Agent does:** PH MCP polling, comment detection, reply drafting, milestone tracking, log maintenance
- **You do:** EVERY actual post and reply (manual), DM existing relationships only, hit the breaks, sleep 22:00–06:00 BST if no rotation backup

The agent will refuse to auto-post anything (see `vm-launcher-guide.md` §5). This is intentional — auto-posting nukes the listing.

### Phase 4 — Day +1 to +7 (vertical-channel ignition)

**Goal:** Recap blog + the high-ROI vertical channels (r/SchengenVisa, Xiaohongshu, Zhihu, schengenvisainfo.com) per `docs/15-*` Week 3 schedule.

**Prompts:**

```
@vm-launcher write the launch recap. Pull final PH stats via MCP.
Cross-reference with CWS install delta and Premium activations from
the dashboard. Use the landing-report skill for structure and the
copy-editing skill on the final draft. Save as a PR against torlyAI:
torly.ai/blog/visa-master-product-hunt-launch-recap-2026.
```

```
@vm-launcher start the vertical-channel ignition per docs/15-* Week 3.
Specifically: the r/SchengenVisa post (Variant B copy from docs/15-*
§6.2 — NOT Variant A, will be auto-removed), schengenvisainfo.com
forum post, and the first Xiaohongshu carousel. For Xiaohongshu, flag
if D-ZH-TRANSLATOR is unresolved.
```

```
@vm-launcher draft 2 Zhihu answers. Find existing questions under
申根签 / TLScontact tags from the last 90 days that have <50 answers
and high view count. Variant B copy in zh-CN. Long-form, evidence-
driven. Surface the question URLs first so I can confirm fit before
you draft.
```

**Handoff:**
- **Agent does:** drafts every piece of content, finds the right Zhihu questions to answer
- **You do:** post from your accounts (Reddit, Xiaohongshu, Zhihu — never from the agent), confirm zh-CN copy is human-translated not machine

### Phase 5 — Post-launch (Day +30 / +60 / +90 KPI checkpoints)

**Goal:** Measure, root-cause underperformance, decide next-channel investment.

**Prompts (run on D+30, D+60, D+90):**

```
@vm-launcher run the day-30 KPI checkpoint. Pull current numbers for
every metric in VM-MASTER-PLAN §5. Compare against day-30 targets.
For any metric <70% of target, root-cause it in writing using the
investigate skill BEFORE recommending more directory submissions.
Save findings to docs/launch/kpi-checkpoint-day-30.md and update the
master plan §5 actuals.
```

```
@vm-launcher manual GEO citation check. Ask ChatGPT, Claude,
Perplexity, and Gemini "best Schengen visa appointment tools" and
"how to get a TLScontact appointment faster" — log whether Visa Master
is mentioned and in what position. Compare to baseline. If not cited,
use the geo-citability skill to diagnose.
```

**Handoff:**
- **Agent does:** all measurement, all root-cause investigation, drafts the checkpoint doc
- **You do:** decide what to invest in next based on the data (channel investment is a strategic call)

---

## 5. Handoff discipline — what only you can do

The single most important rule with vm-launcher: **the agent prepares; you execute the irreversible.** Re-read this table before launch day:

| Action | Agent or human? | Why |
|---|---|---|
| Hit "Launch" on PH | **You, in PH UI** | PH API has no write mutation; auto-launch would nuke the listing |
| Post the maker first comment | **You, paste from prep** | Same — agent drafts, you paste |
| Reply to PH comments | **You** | 30-min latency is measured; agent drafts, you paste/edit/post |
| Cast PH upvote | **You + your network, manually** | Anti-manipulation filter |
| Send launch-day emails | **You, after agent draft** | Agent has no email-send capability and shouldn't |
| Post to Reddit / Xiaohongshu / Zhihu | **You** | Account integrity — never post from an agent's voice |
| Push to GitHub `main` | **You, never agent** | CLAUDE.md global rule |
| Confirm CWS submission | **You** | Google's review process needs human responses |
| Confirm `[deploy]` token on torlyAI merge | **You** | Forgotten = silently un-deployed |
| Validate Premium auto-book against real TLS slot | **You** | CP-5 — agent can't book a real visa appointment |
| Lock D-LAUNCH-DATE | **You, with agent's competitive-scan input** | Strategic call, not a mechanical one |
| DM strangers on PH | **Neither — don't do it** | Anti-manipulation filter; rule #2 |

| Action | Agent or human? | Why |
|---|---|---|
| Schema/SEO audit | **Agent** | Mechanical, deterministic |
| Copy drafting (any channel) | **Agent drafts, you finalize** | Speed advantage with human voice gate |
| PH comment monitoring | **Agent** | 5-min poll cadence, diff detection |
| Comment-reply drafting | **Agent** | Personalisation per commenter profile |
| Competitive PH scan | **Agent** | MCP server is the right tool |
| Hourly milestone summary | **Agent** | Removes refresh anxiety |
| KPI capture | **Agent** | Mechanical — pulls from APIs and dashboards |
| Root-cause analysis on KPI miss | **Agent** | Uses `investigate` skill |
| Master plan updates | **Agent** | Mechanical — TODO flips, decision moves, KPI updates |
| Cross-doc consistency checks | **Agent** | Reads multiple files at once; you don't |

**If you're ever unsure who should do something, default to "you" and ask the agent to verify after.** The agent will refuse irreversibles anyway, but the discipline saves time.

---

## 6. Prompt library — copy-paste recipes

Quick index of every prompt in this doc, organised by trigger moment:

| When you need to... | Prompt section |
|---|---|
| Open any session | §3.1 (`@vm-launcher status check`) |
| Close any session | §3.2 (master plan update + devjournal) |
| Lock D-LAUNCH-DATE | §2.4 |
| Capture KPI baselines | §2.5 |
| Build a landing page (CP-2/CP-3) | §4 Phase 0 |
| Track PH account warmup | §4 Phase 0 |
| Cut the PH demo video | §4 Phase 1 |
| Polish a piece of copy | §4 Phase 1 |
| Run competitive PH scan | §4 Phase 2 |
| Cold-email listicle outreach | §4 Phase 2 |
| Check Reddit warmup status | §4 Phase 2 |
| Pre-flight 23:45 BST D-1 | §4 Phase 3 |
| Start launch-day monitoring loop | §4 Phase 3 |
| Confirm maker comment live | §4 Phase 3 |
| End-of-launch-day final pass | §4 Phase 3 |
| Write launch recap | §4 Phase 4 |
| Start vertical-channel ignition | §4 Phase 4 |
| Draft Zhihu answers | §4 Phase 4 |
| Day-30/60/90 KPI checkpoint | §4 Phase 5 |
| Manual AI citation check | §4 Phase 5 |

If you find yourself running the same prompt 3+ times, codify it as a slash command at `~/.claude/commands/vm-<name>.md` so future-you doesn't retype it.

---

## 7. Escalation — when to NOT use the agent

Knowing when to NOT use the agent is part of the plan. Don't use vm-launcher when:

- **You're making a strategic call.** D-LAUNCH-DATE, D-COMMENTER, "should we slip?", "should we skip Trustpilot?" — use `Skill(skill: "charlie")` for Socratic exploration, then YOU decide. The agent surfaces options; it doesn't pick.
- **You're writing in your voice.** Maker first comment, LinkedIn launch post, the recap blog — agent polishes, but the first draft is yours. Otherwise the copy reads as AI-generated and PH commenters spot it.
- **You're talking to a real human.** Email replies, DMs, Discord — agent shouldn't ghost-write your relationships.
- **You're debugging the extension itself.** Use regular Claude Code skills (`investigate`, `feature-dev:*`). vm-launcher is for the launch motion, not the product.
- **The decision is reversible and low-stakes.** Just do it inline — don't burn cycles routing through the agent.

The agent's value compounds when used at the right moments. Forcing every interaction through it is more friction than help.

---

## 8. Anti-patterns to avoid

Common ways teams misuse launch agents (don't do these):

| Anti-pattern | What goes wrong | Do instead |
|---|---|---|
| "The agent will handle launch day" | You assume autonomy where the API has no write mutations; you sleep through the 30-min reply window | Treat launch day as 24h of *paired* work — agent monitors, you execute |
| Writing the maker comment in the agent's voice | Reads as AI-generated, kills credibility on PH | Write the first draft in your own voice; agent polishes |
| Auto-translating Variant B to zh-CN | Trust signals dead on Xiaohongshu/Zhihu — Chinese audiences spot machine translation instantly | D-ZH-TRANSLATOR must be a real human; agent flags this gap |
| Submitting to channels not in `docs/15-*` because they're "easy" | Spam directories hurt DR; off-strategy submissions waste time | Stick to the tier triage; if a new channel emerges, add it to the strategic plan first |
| Skipping the §3.2 close-session prompt | Master plan goes stale; next session starts confused | Always close with the master-plan update + devjournal |
| Asking the agent to push code to `main` | Project rule violation (CLAUDE.md global) | Always via PR with branch prefix |
| Asking the agent to bypass `[deploy]` token on torlyAI | Silent un-deploy of landing page | Verify `vercel ls torlyai --prod \| head -5` after every torlyAI merge |
| Letting Variant A copy reach r/SchengenVisa | Auto-removed; loses biggest vertical channel | Routing table in `docs/15-*` §6.3 — agent enforces but only if you ask it to |
| Repeating the same KPI checkpoint without root-causing | Submitting more directories when the destination page is the bottleneck | Day-30 KPI rule (§4 Phase 5): root-cause underperformance BEFORE adding more channels |

---

## 9. Done-ness for this usage plan

You've successfully used vm-launcher when:

1. ✅ All 7 critical-path milestones in `VM-MASTER-PLAN.md` §4 are flipped to ✅
2. ✅ Day-30, Day-60, Day-90 KPI snapshots captured
3. ✅ The launch recap blog is live and starting to be cited by AI engines
4. ✅ At least 3 of the 5 vertical channels (r/SchengenVisa, schengenvisainfo, Xiaohongshu, Zhihu, expat forums) have driven measurable inbound traffic
5. ✅ Premium → CWS install conversion measurable; not a black box

Until then, every session ends with: **what's the next single-highest-leverage action and when is its deadline?**

---

## 10. Maintenance

Update this doc when:
- A prompt in §6 stops working or needs refinement (commit the better version)
- A new common workflow emerges that's run more than 3 times (add to §4 of the relevant phase)
- An anti-pattern bites you in real launch execution (add to §8 with what went wrong)
- You ship a slash-command codification of a frequent prompt (note in §6)

Suggested cadence: review at end of each phase. Big rewrite at D+30 retrospective.

---

## 11. Cross-references

- **Agent definition** → `.claude/agents/vm-launcher.md` (the WHAT)
- **Reference guide** → `docs/launch/vm-launcher-guide.md` (capability reference)
- **Master plan** → `docs/launch/VM-MASTER-PLAN.md` (phases + CP + decisions + KPIs)
- **PH checklist** → `docs/launch/vm-product-hunt-checklist.md` (PH form fields, copy slots, day-of timeline)
- **Strategic plan** → `docs/15-directory-submissions-launch-plan.md` (tier triage, positioning, vertical channels)
- **Tracker** → `docs/15-directory-submissions-tracker.csv`
- **Origin agent** (for reference) → `/Users/Jason-uk/AI/AI_Coding/Repositories/aicmo-uk/.claude/agents/ph-launcher.md`
