# VM-MASTER-PLAN — Visa Master Launch Execution

**Owner:** Duke Harewood (Torly AI)
**Status:** CP-1 ✅ · D-LAUNCH-DATE locked to **Thu 2026-06-04** · Phase 0 → Phase 1 transition this week (D-14 = 2026-05-21)
**Last updated:** 2026-05-18
**Companion docs:**
- Strategic plan: `docs/15-directory-submissions-launch-plan.md` (the WHAT — tier triage, positioning, vertical channels)
- This doc: the WHEN — phases, critical path, decisions register, KPI snapshot
- Asset checklist: `docs/launch/vm-product-hunt-checklist.md` (the HOW — PH form fields, copy slots, launch-day timeline)
- User guide: `docs/launch/vm-launcher-guide.md` (how to invoke the agent)

---

## 1. Why this doc exists

`docs/15-directory-submissions-launch-plan.md` is the strategic launch plan — it defines tiers, positioning variants, vertical channels, KPIs. This doc is the **execution counterpart**: phases anchored to dates, a critical-path table the `vm-launcher` agent reads each session, and a decisions register that tracks what's resolved vs open.

Splitting strategy from execution lets each evolve independently. The strategic plan is approved and stable; this execution plan gets edited every session as TODOs flip and decisions resolve.

---

## 2. Phases (date-anchored to D-LAUNCH-DATE)

D-LAUNCH-DATE = **Thu 2026-06-04** (locked 2026-05-18; see §3.1).

| Phase | Window | Goal | Exit criteria |
|---|---|---|---|
| Phase 0 — Foundation | 2026-05-14 → 2026-05-21 | CWS approval + landing page live + first alt page indexed | CP-1 ✅, CP-2 ✅, CP-3 ✅ |
| Phase 1 — Asset production | 2026-05-21 → 2026-05-28 | PH gallery + demo cut + maker copy + customer commenter confirmed | CP-4 ✅, CP-5 ✅ |
| Phase 2 — Pre-launch warm-up | 2026-05-21 → 2026-06-03 | PH account warmup, Reddit 90/10 history, Upcoming page subscribers, listicle outreach | Master-plan §4 checklist clear |
| Phase 3 — Launch day | 2026-06-04 | Execute the 24-hour PH window | CP-6 ✅, CP-7 ✅, launch-day log complete |
| Phase 4 — Day +1 to +7 | 2026-06-05 → 2026-06-11 | Recap blog, vertical-channel ignition (r/SchengenVisa, RedNote, Zhihu) | Strategic plan §7 Week 3 checklist clear |
| Phase 5 — Post-launch (30/60/90) | 2026-06-12 → 2026-09-02 | KPI snapshots at +30 (2026-07-04), +60 (2026-08-03), +90 (2026-09-02) | KPI captures logged; next-channel investment decided |

**Hard prerequisite:** Phases 0+ cannot start until **CWS approval is in hand** (CP-1). The Chrome Web Store IS the primary distribution surface; nothing in this plan ships before CWS approval per `docs/13-*` §3.

---

## 3. Decisions register

### 3.1 Resolved (do not re-litigate)

| # | Decision | Resolution | Date | Source |
|---|---|---|---|---|
| D1 | Positioning frame | Variant A (Premium-led) on neutral audiences ~70%; Variant B (privacy-first) on trust-sensitive vertical ~30% | 2026-05-14 | `docs/15-*` §6, user selection |
| D2 | Premium pricing | £19 per successful booking, refundable 24h. No discount codes, no PH coupon — success-fee model is the offer | 2026-05-14 | `docs/09-*` |
| D3 | Trust boundary | Free tier never reads TLS password, never sends data to torly.ai. Premium adds opt-in capture only with explicit consent | 2026-05-14 | `CLAUDE.md` "Free vs Premium — the trust boundary" |
| D4 | Submission scope | Free-tier v1.0.x ships first via CWS. Premium "Beta" follows once §17 stub-validation in PRD 09 is complete. Single CWS listing, not two | 2026-05-14 | `docs/13-*` §3 default recommendation |
| D5 | Excluded channels | No G2/Capterra review drives, no press release, no paid ads in launch window, no AI directory submissions until/unless an AI-marketed feature ships | 2026-05-14 | `docs/15-*` §9 |
| D-LAUNCH-DATE | Locked PH launch date | **Thu 2026-06-04** · 12:01 AM PT / 08:01 BST. Chosen over Tue 2026-06-02 (too tight) and Tue 2026-06-09 (momentum decay; 5 extra days post-CWS-approval). Avoids Wed 2026-06-03 aiCMO PH launch clash | 2026-05-18 | User decision post-CWS-approval |

### 3.2 Open (push for resolution; defaults below)

| # | Decision | Default if undecided | Deadline (relative) | Owner |
|---|---|---|---|---|
| D-HUNTER | Self-hunt or external hunter trade | Self-hunt — no external dependency, no -7d outreach deadline, accepts ~15% lift trade-off | 2026-05-28 (D-7) | Duke |
| D-COMMENTER | Customer first commenter for PH launch (must post from own account, not sockpuppet) | 2 confirmed beta users with 4+ weeks Premium usage; both willing to comment within first 2h | 2026-05-31 (D-4) | Duke + beta cohort |
| D-TRUSTPILOT | Submit Trustpilot listing pre- or post-Premium-validation | Defer until CP-5 confirmed — Variant A booking automation must work before opening a public review surface | 2026-06-04 (D-Day) | Duke |
| D-ZH-TRANSLATOR | Owner for human translation of Variant B into zh-CN | Required for Xiaohongshu/Zhihu/WeChat. Leverage existing welcome.no.2 / welcome.no.4 i18n strings as trust-language baseline | 2026-05-28 (D-7) | TBD |
| CP-5-VALIDATION | Confirm Premium booking validated against real TLS slot, not just code review (gates Variant A "auto-book" copy) | If unconfirmed by D-7: fall back to Variant B everywhere, edit maker comment to soften "auto-book" claim | 2026-05-28 (D-7) | Duke |

### 3.3 History
*(append-only log of decisions reopened / major status changes)*

- **2026-05-18** — D-LAUNCH-DATE locked to **Thu 2026-06-04** (08:01 BST / 00:01 PT). Chosen over Tue 2026-06-02 (too tight, 15 days exactly) and Tue 2026-06-09 (5 days of post-approval momentum decay). Hard-avoided Wed 2026-06-03 (aiCMO PH launch — same week, overlapping AI-marketing / productivity audience). All phase windows in §2 and CP deadlines in §4 now absolute.
- **2026-05-18** — CP-1 cleared. Chrome Web Store approved v1.1.0 (Option C — full Premium in public listing). Submitted 2026-05-14 Thu; approved 2026-05-18 Mon (~2 business days). Public listing live at https://chromewebstore.google.com/detail/cpogdllkcpenafboclnidfmmlcnjpbfm.
- **2026-05-14** — Submission scope changed: Option A (Free-only) → Option C (full Premium in public listing). Per PRD 13 Appendix C: "Premium WIP items confirmed resolved before submission." Implication for CP-5: may already be ✅ — pending confirmation that resolution included real-TLS-slot validation, not just code review.

---

## 4. Critical path (CP-1..CP-7)

The vm-launcher agent reads this table every session. Status colours: ⬜ pending · 🟡 in progress · ✅ done · 🔴 slipped.

| # | Milestone | Status | Deadline | If slipping |
|---|---|---|---|---|
| CP-1 | Chrome Web Store approval (v1.1.0 Option C — full Premium in public listing) | ✅ 2026-05-18 | Submitted 2026-05-14; approved ~2 business days later. Public listing: https://chromewebstore.google.com/detail/cpogdllkcpenafboclnidfmmlcnjpbfm | — |
| CP-2 | `torly.ai/visa-master` landing page live + indexed with FAQ schema, Org + SoftwareApplication JSON-LD, video embed, Free-vs-Premium comparison | ⬜ | **2026-05-21 (D-14)** | Slip launch by 1 week → Thu 2026-06-11 |
| CP-3 | First alternative page (`torly.ai/visa-master/vs-visadar`) live + indexed with comparison table + FAQ schema | ⬜ | **2026-05-21 (D-14)** | Slip launch by 1 week — directory equity has nowhere meaningful to land |
| CP-4 | PH assets ready: 240×240 logo, 8× 1270×760 gallery, demo video PH-cut uploaded to YouTube unlisted, Loom backup | ⬜ | **2026-05-28 (D-7)** | Cut Frankenstein from existing `marketing/video/out/visa-master-promo-narrated.mp4` frames |
| CP-5 | Customer commenter confirmed in writing AND Premium booking validated against real TLS slot (gates Variant A "auto-book" claim per PRD 12 backlog: `driveBookingFlow()` + `injectedFill()` selectors) | ❓ Verify | **2026-05-31 (D-4)** | If Premium not validated: drop Variant A, ship Variant B everywhere, defer Premium-led narrative to v2 launch. Note: PRD 13 Appendix C 2026-05-14 entry claims "Premium WIP items confirmed resolved" — pending confirmation this means *real-slot validation* and not just code review |
| CP-6 | Final QA pass — all listings dry-run, PH preview walkthrough, alarms set | ⬜ | **2026-06-03 22:00 BST (D-1)** | Sleep is optional, QA is not |
| CP-7 | Launch execution — PH listing live at 00:01 PT, maker comment posted within 60s, customer comment within 2h | ⬜ | **2026-06-04 00:01 PT / 08:01 BST (D-Day)** | No retry — alarm at 2026-06-03 23:45 BST |

**CP-1 special note:** unlike aiCMO's launch where everything was in our control, Visa Master's CP-1 depends on Google's CWS reviewer queue (typically 1–3 business days for first submission per `docs/13-*` §1). Use the wait productively on CP-2 + CP-3.

---

## 5. KPI snapshot

Targets from `docs/15-*` §8. Baselines TBD; capture during CP-1 wait window.

| Metric | Day 0 baseline | Day +30 target | Day +90 target | Day +30 actual | Day +90 actual |
|---|---|---|---|---|---|
| `torly.ai/visa-master` Domain Rating | _TBD_ | +5 | +15 | _TBD_ | _TBD_ |
| Referring domains to landing page | _TBD_ | 25 | 60 | _TBD_ | _TBD_ |
| Indexed pages on `torly.ai/visa-master/*` | _TBD_ (~1) | 8 | 20 | _TBD_ | _TBD_ |
| Directory/forum listings live | 0 | 25 | 45 | _TBD_ | _TBD_ |
| Chrome Web Store installs | _TBD_ | +500 | +3,000 | _TBD_ | _TBD_ |
| Free → Premium activations | 0 | 5 | 30 | _TBD_ | _TBD_ |
| AI engine citations (manual quarterly check) | 0 | 1–2 | 5+ | _TBD_ | _TBD_ |
| Reddit / Xiaohongshu / Zhihu inbound clicks | 0 | 200 | 1,500 | _TBD_ | _TBD_ |

**KPI investigation rule (from `docs/15-*` §8):** if a number isn't moving by Day +30, the answer is rarely "submit to more directories" — investigate destination-page conversion (heatmaps, scroll depth) or whether copy is auto-rejected by community moderators.

---

## 6. Risk register

| # | Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|---|
| R1 | Destination pages slip past D-14 | Launch slips 1 week | Medium | Start CP-2/CP-3 during CWS-review wait window; don't gate on CP-1 |
| R2 | Variant A "auto-book" copy ships before booking automation validated | 1-star reviews, trust burn in vertical communities | Medium-High | Hard gate Variant A on CP-5; have Variant B ready as fallback for everything |
| R3 | Free-tier promise widened in marketing copy under launch pressure | Trust boundary breach → losing brand's only moat | Medium | Re-read CLAUDE.md trust boundary before writing copy; vm-launcher §11 R3 enforces |
| R4 | PH anti-manipulation filter (upvote-ask, DM spam, sockpuppet customer comment) | Listing hidden → launch nuked | Low if disciplined | Three Absolute Rules in checklist §5; refuse upvote framing |
| R5 | Reply latency past 30 min after hour 12 on launch day | Algorithm de-prioritises → drops out of top 10 | Medium | Phone push notifications enabled; 24h reply rotation in checklist §7 |
| R6 | Cross-repo `[deploy]` token forgotten on torlyAI merge | Landing page change silently un-deployed; directory submissions land on stale page | Medium | `vercel ls torlyai --prod \| head -5` verification after every merge per CLAUDE.md |
| R7 | r/SchengenVisa post auto-removed for "auto-book" framing | Loses biggest vertical channel | High if Variant A used there | Routing table in `docs/15-*` §6.3 mandates Variant B; vm-launcher §5.3 enforces |
| R8 | zh-CN translation never done | Loses Xiaohongshu/Zhihu/WeChat — biggest in-market visa applicant audience globally | Medium | D-ZH-TRANSLATOR is open decision; default to deferring zh-CN channels until owned, don't mass-machine-translate |

---

## 7. Slip protocol

If a CP slips:

1. **Acknowledge in writing** — flip the CP to 🔴 here, append reason in §8 incident log.
2. **Compute downstream impact** — does the slip cascade to D-LAUNCH-DATE?
3. **Default response is to slip launch by exactly 1 week**, not to push harder. The PH launch window is recoverable; a half-baked launch is not.
4. **Use `Skill(skill: "charlie")`** for slip decisions where two valid paths exist (e.g., "ship Variant B everywhere and skip Premium narrative" vs "slip 1 week and ship Variant A properly").
5. **Update the master plan** — slip the dates, log the reason, notify any beta-customer commenters of the new D-LAUNCH-DATE.

---

## 8. Incident / slip log
*(append-only; empty at start)*

---

## 9. Cross-references

- **Strategic plan:** `docs/15-directory-submissions-launch-plan.md` — tier triage, positioning variants, vertical channels, KPIs source
- **Tracker:** `docs/15-directory-submissions-tracker.csv` — per-directory submission log
- **CWS submission:** `docs/13-chrome-web-store-submission-prd.md` — CP-1 gate
- **Premium backlog:** `docs/12-premium-backlog.md` — `driveBookingFlow()` + `injectedFill()` validation status (gates CP-5)
- **Free PRD:** `docs/06-visa-master-chrome-extension-prd.md`
- **Premium PRD:** `docs/09-visa-master-premium-prd.md`
- **Trust boundary:** `CLAUDE.md` "Free vs Premium — the trust boundary"
- **Cross-repo deploy gate:** `CLAUDE.md` "Cross-repo: torlyAI deploy gate ([deploy] token)"
- **PH MCP server:** registered globally at `~/.claude/.mcp.json`; agent definition references it in §8
