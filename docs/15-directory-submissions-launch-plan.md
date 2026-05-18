# PRD: Visa Master — Directory Submissions & Launch Distribution Plan

**Document:** 15-directory-submissions-launch-plan.md
**Version:** 1.0 (Draft)
**Date:** 2026-05-14
**Status:** Plan locked on positioning frame; awaiting Phase 0 destination-page work
**Owner:** Duke Harewood (Torly AI)
**Related docs:**
- `06-visa-master-chrome-extension-prd.md` — Free tier PRD
- `09-visa-master-premium-prd.md` — Premium tier PRD
- `08-vs-alternatives.md` — Internal competitor research (to be turned into public alternative pages)
- `13-chrome-web-store-submission-prd.md` — CWS submission (the *primary* distribution channel)

---

## 1. Executive Summary

This document plans **off-Chrome-Web-Store distribution** for Visa Master: which directories, forums, and communities to submit to; in what order; with which copy variants; and against which KPIs.

**Critical framing:** the Chrome Web Store *is* Visa Master's primary distribution channel — most installs will originate there, not from external directories. External submissions exist to:

1. **Pass dofollow backlinks** to `torly.ai/visa-master` so the landing page ranks for queries like "TLScontact appointment alert," "Schengen visa slot bot," "申根签证预约提醒".
2. **Drive in-market discovery** in vertical visa/expat communities where intent is sharply defined.
3. **Get cited by AI engines** (ChatGPT, Claude, Perplexity) when users ask "how do I get a Schengen appointment faster".

**The positioning frame is Premium-led** (auto-book as the headline) on neutral-audience directories, with a **softened "free slot watcher with optional auto-book" variant** on trust-sensitive vertical channels (r/SchengenVisa, expat forums, Trustpilot) where the bare "auto-book" framing triggers scam-filter heuristics and gets auto-removed.

**This plan is gated by Phase 0 destination-page work** (§3). Submitting directories before destination pages exist wastes the first-submission advantage.

---

## 2. Why This Document Exists

The `/directory-submissions` skill provides a 700-entry catalog spanning startup, SaaS, AI, no-code, agent/MCP, and 13 vertical tiers. Naively running that catalog against Visa Master would burn weeks of effort on directories whose audiences do not match — Visa Master is not a generic SaaS. It is:

- A **niche vertical Chrome extension** (Schengen visa applicants, primarily UK + China)
- With a **trust-sensitive category** (visa booking bots have a poor reputation due to )
- Distributed primarily via the **Chrome Web Store**, not via web app
- With **two languages** (English + 中文 zh-CN) and **two distinct primary geographies**

This plan triages the catalog to only the tiers that fit, adds the off-catalog vertical channels that actually convert (visa subreddits, expat forums, Xiaohongshu, Zhihu), and sequences the work behind a hard prerequisite: a real public landing page with FAQ schema and at least one alternative page.

---

## 3. Phase 0 — Destination-Page Prerequisites (Hard Block)

**No directory submissions until these ship.** Directories pass link equity into landing pages; without a destination, the equity is wasted on a 301 redirect.

### 3.1 Required pages on `torly.ai`

| Page | Status | Notes |
|---|---|---|
| `/visa-master` (main landing) | ❓ Verify | Must be a real marketing page — H1, demo video embed, Free vs Premium comparison, FAQ schema, Org + SoftwareApplication JSON-LD |
| `/visa-master/pricing` (or section) | ❓ Verify | "Free £0" + "Premium £19 success fee, refundable 24h" |
| `/visa-master/privacy` | ❓ Verify | Required by Chrome Web Store; needed by directories |
| `/visa-master/terms` | ❓ Verify | As above |
| `/visa-master/vs-visadar` (or similar) | ❌ Build | First public alternative page — turn `docs/08-vs-alternatives.md` into a public, indexable page with comparison table, "when to choose X," FAQ |
| `/visa-master/vs-cita-previa-bot` | 🟡 Phase 1 stretch | Second alternative page — improves "[competitor] alternative" coverage |
| `/visa-master/zh` (or zh-CN equivalent) | ❌ Build | Mirror landing page in Chinese — required for Xiaohongshu / Zhihu submissions to land somewhere meaningful |

### 3.2 Required asset variants

| Asset | Format | Status | Used by |
|---|---|---|---|
| Square logo 1024×1024 | PNG | ✅ `extension/screenshots/v1.1.0/store-icon-128.png` exists; verify 1024px master | All directories |
| Logo 512×512 transparent | PNG | ⚠️ Confirm | TAAFT, Futurepedia, AI directories |
| Logo SVG | SVG | ⚠️ Confirm | AlternativeTo, SaaSHub |
| Favicon | ICO/PNG | ⚠️ Confirm | Landing page |
| Screenshots 1280×800 | PNG ×5 | ✅ CWS variants exist | CWS, Product Hunt, listicles |
| Demo video 60–90s | MP4 | ✅ `marketing/video/out/visa-master-promo-narrated.mp4` | Product Hunt, landing page embed |
| Demo video YouTube upload | URL | ❌ Upload | Required for most directories that don't accept MP4 |
| Tagline (≤10 words) | Text | Below §6 | All |
| Short description (60 chars) | Text | Below §6 | CWS, AlternativeTo |
| Long description (150 words) | Text | Below §6, two variants | All |
| Founder story (2–3 sentences) | Text | Below §6 | Product Hunt first comment |

### 3.3 GEO requirements on landing page (non-negotiable)

Per the `/directory-submissions` skill:
- **Single `<h1>`** + sequential heading hierarchy (`h2` → `h3`, never skip levels). 2.8× higher AI citation rate.
- **FAQ schema** — `FAQPage` JSON-LD with 6–10 real questions. AI engines heavily weight this for answer extraction.
- **Structured data** — `Organization`, `SoftwareApplication` (with `applicationCategory: "BrowserApplication"`), `Offer` (Free £0 + Premium £19).
- **Comparison table** between Free and Premium that's HTML-extractable (not an image).
- **First-100-words "what it is" paragraph** that explicitly says: "Visa Master is a Chrome extension that monitors TLScontact for Schengen visa appointment slots."

---

## 4. Tier Selection — What Fits, What to Skip

The skill's catalog has 13 tiers. Triaged for a niche Chrome extension:

| Tier | Verdict | Action |
|---|---|---|
| **Chrome Web Store** | ✅ PRIMARY | Already covered by PRD 13 — not in scope of this doc |
| **Tier 1 — Flagship launch (Product Hunt, BetaList, HN, Fazier, DevHunt)** | ✅ Anchor | Product Hunt is the launch event; BetaList + HN Show HN as cross-posts |
| **Tier 2 — SaaS directories** | ⚠️ Selective | AlternativeTo, SaaSHub, Crunchbase only. Skip F6S, Capterra, G2 (wrong audience for a free Chrome extension; also G2's value is locked behind 10+ reviews which we won't get from extension users) |
| **Tier 3 — AI directories** | ❌ Mostly skip | Visa Master isn't AI-marketed. Forcing an AI angle dilutes the honest story. **Exception:** if/when smart cadence becomes a real ML feature, revisit TAAFT |
| **Tier 4 — Agent/MCP** | ❌ Skip | N/A |
| **Tier 5 — No-code** | ❌ Skip | N/A |
| **Tier 6 — "Best of" listicles** | ✅ HIGH ROI | Cold-pitch the 5–10 blog posts that already rank for "TLScontact appointment hack" / "Schengen visa booking tips 2026" / "如何快速预约申根签证" |
| **Tier 7 — Integration marketplaces** | ❌ Skip | N/A (no integrations to surface) |
| **Tier 8 — Profile platforms** | ✅ Selective | GitHub (already there as `torlyai/Schengen-master`), Crunchbase (Torly AI as company), LinkedIn company page, Wikidata stub |
| **Tier 9 — Local business** | ❌ Skip | N/A |
| **Tier 10 — Forums & communities** | ✅ HIGHEST ROI | This is where Visa Master wins or loses — see §5 |
| **Tier 11 — Press release** | ❌ Skip | Burns trust in this niche |
| **Tier 12 — Social bookmarking** | ⚠️ Optional | Scoop.it / Diigo for backlink only; ~5 minutes total effort |
| **Tier 13 — Niche vertical** | ✅ CRITICAL | Off-catalog: visa/travel/expat — see §5 |

---

## 5. Off-Catalog Vertical Channels (Where Conversion Actually Happens)

The `/directory-submissions` catalog has no travel/visa vertical. These channels are domain-specific and will out-convert generic directories ~10:1.

### 5.1 English-speaking communities

| Channel | Type | Members | Submission notes |
|---|---|---|---|
| **r/SchengenVisa** | Reddit | ~80K | Use SOFT variant (§6). Comment usefully on 10+ existing threads first or post will be auto-removed |
| **r/IWantOut** | Reddit | ~600K | Soft variant. Frame as "tool for the appointment-booking step" |
| **r/UKVisa** | Reddit | ~40K | UK-applicants angle |
| **r/expats** | Reddit | ~200K | Cross-post with regional flair |
| **r/digitalnomad** | Reddit | ~2M | Light-touch — only if the post is about the broader travel-prep workflow |
| **schengenvisainfo.com forum** | Forum | DR 60+ | Highest backlink value in the vertical |
| **VisaJourney forums** | Forum | Established | Niche but trustworthy |
| **Trustpilot** | Reviews | High DR | Soft variant only — explicit "free tier never reads password" framing |
| **Facebook groups** | Social | Many | "Schengen Visa Help UK", "Italians in London", "France visa appointment" — manual outreach, group-by-group |
| **Telegram groups** | Messaging | Many | Search "TLScontact" / "Schengen appointment" — invite-only groups exist for each consulate |

### 5.2 Chinese-speaking communities (zh-CN required)

| Channel | Type | Notes |
|---|---|---|
| **小红书 Xiaohongshu (RedNote)** | Social | UK-based Chinese students live here. Search "申根签证预约". Image-first format — repurpose CWS screenshots with Chinese captions. **Highest priority** zh-CN channel. |
| **知乎 Zhihu** | Q&A | Answer existing questions under tags 申根签 / TLScontact / 法国签证 / 意大利签证. Long-form, evidence-driven |
| **微信公众号 WeChat** | Newsletter | Cold-outreach to UK-based Chinese student bloggers (DR 50+ ones); offer them the tool to recommend |
| **豆瓣 Douban** | Forums | Groups: 留学英国, 自由行, 申根 |
| **即刻 Jike** | Social | Tech-aware Chinese audience; better fit if you frame the privacy angle |

### 5.3 Submission cadence rule

**Reddit 90/10 rule applies doubly here.** Visa subreddits are heavily moderated against promo spam. Before posting a Visa Master announcement to r/SchengenVisa, comment helpfully on at least 10 existing threads over a 2-week window. Same for Zhihu and Xiaohongshu — engagement history matters for algorithm distribution.

---

## 6. Positioning — Two Variants, Per-Channel Routing

Per CLAUDE.md, the brand promise is **local-first, never reads credentials (Free) / opt-in capture with explicit consent (Premium)**. Both variants below honor that constraint.

### 6.1 Variant A: Premium-led (PRIMARY, ~70% of submissions)

**Use on:** Product Hunt, BetaList, AlternativeTo, SaaSHub, Crunchbase, "best of" listicles, GitHub README, LinkedIn launch post, neutral AI/SaaS directories.

**Tagline (≤10 words):**
> Auto-books your Schengen visa slot the instant one drops.

**Short description (60 chars):**
> Schengen slot detector + auto-book on TLScontact

**Long description (150 words):**
> Visa Master is a Chrome extension that detects Schengen visa appointment slots on TLScontact and books them automatically. Pay only when you successfully secure an appointment — £19, refundable for 24 hours.
>
> The Free tier provides slot notifications: desktop alerts, sound, optional Telegram push the second a slot opens. 100% local — no account, no data leaves your browser, your TLS password is never read.
>
> Premium (£19 per successful booking) adds auto-login on session timeout and full auto-book on slot detection. Premium captures only the booking confirmation and your Stripe email — never your TLS credentials, never your slot data.
>
> Built by a UK applicant who got tired of refreshing the page at 6am. Works for France, Italy, Spain, Germany, and 20+ Schengen consulates accessed via TLScontact.

**Founder story (2–3 sentences for Product Hunt first comment):**
> I spent six weeks last year refreshing tlscontact.com every ten minutes trying to book a France visa appointment for my family. The slot I eventually got opened at 11:47pm on a Tuesday — I was lucky to be at my laptop. Visa Master is the tool I wish I'd had: it watches TLScontact for you, pings you the second a slot opens, and (if you opt into Premium) books it automatically while you sleep.

### 6.2 Variant B: Soft / privacy-first (~30% of submissions)

**Use on:** r/SchengenVisa, r/UKVisa, expat forums, Trustpilot, schengenvisainfo.com, Xiaohongshu, Zhihu, WeChat outreach. **Necessary** because these audiences auto-reject "auto-book" framing as scam-adjacent.

**Tagline (≤10 words):**
> Free Schengen slot watcher. Never reads your password.

**Short description (60 chars):**
> Free TLScontact slot alert. Optional auto-book add-on.

**Long description (150 words):**
> Visa Master is a free Chrome extension that watches TLScontact for Schengen visa appointment slots and pings you the second one opens — desktop alert, sound, optional Telegram push to your phone.
>
> The Free tier runs 100% locally in your browser. No account, no signup, no server. Your TLS email and password are never read or stored. The extension only contacts tlscontact.com (where you're already logged in) and, if you enable it, your own Telegram bot. Nothing else leaves your machine.
>
> An optional Premium upgrade (£19, charged only on a successful booking and refundable for 24 hours) adds auto-login on session timeout and auto-book — useful if you can't sit at your laptop when the slot drops. Premium is opt-in with full disclosure of what data is shared.
>
> Open development at github.com/torlyai/Schengen-master.

**Chinese variant (zh-CN, for Xiaohongshu/Zhihu) — placeholder:**
> [TODO: translate Variant B; leverage existing welcome.no.2 / welcome.no.4 i18n strings as the trust language baseline]

### 6.3 Routing table (which channel gets which variant)

| Channel | Variant | Reason |
|---|---|---|
| Chrome Web Store | A (Premium-led) | Audience expects feature-led copy |
| Product Hunt | A | Maker audience rewards bold framing |
| BetaList | A | Same |
| AlternativeTo | A | Comparison context — feature parity matters |
| SaaSHub | A | Same |
| Crunchbase / LinkedIn | A | Investor/B2B framing |
| GitHub README | A (top fold) + B (in detail section) | Mix |
| "Best of" listicle outreach | A | Editor wants the strongest hook |
| r/SchengenVisa | B | Soft framing required to avoid auto-removal |
| r/UKVisa, r/expats | B | Same |
| schengenvisainfo.com | B | Trust-sensitive vertical |
| Trustpilot | B | Trust is the entire signal |
| Xiaohongshu | B (zh-CN) | Privacy framing is the differentiator vs Chinese visa scalpers |
| Zhihu | B (zh-CN) | Long-form Q&A — privacy claim is verifiable |
| WeChat 公众号 outreach | B (zh-CN) | Same |
| TAAFT / AI directories (if used) | A | Neutral audience |

---

## 7. 3-Week Submission Schedule

Calendar dates assume Product Hunt launch Wednesday **2026-05-27** (placeholder — adjust to actual launch day).

### Week 1 (2026-05-15 to 2026-05-21) — Foundation + Profile Submissions

**Goal:** Phase 0 destination pages live + indexed; first batch of high-DR profile submissions in flight.

- [ ] **Mon-Tue:** Land `torly.ai/visa-master` with FAQ schema, video embed, Free vs Premium comparison
- [ ] **Tue-Wed:** Publish `/visa-master/vs-visadar` alternative page (turn `docs/08-vs-alternatives.md` into public copy)
- [ ] **Wed:** Publish `/visa-master/zh` (Chinese landing page mirror)
- [ ] **Wed:** Submit Crunchbase company profile (Torly AI) + Visa Master product entry
- [ ] **Thu:** Submit AlternativeTo, SaaSHub
- [ ] **Thu:** Claim/update LinkedIn Company Page for Torly AI; first launch teaser post
- [ ] **Fri:** Create Wikidata stub for Visa Master (feeds AI training corpora)
- [ ] **Fri:** Verify all 4 listings indexed via `site:` operator + dofollow check (`curl -sIL <listing-url> | grep -i rel=`)

### Week 2 (2026-05-22 to 2026-05-28) — Anchor Event (Product Hunt)

**Goal:** Product Hunt launch + cross-post + maximum day-one signal.

- [ ] **Mon-Tue (PH prep):** Final asset check — gallery images 1270×760, tagline, 260-char description, first comment, 3 prepared customer comments
- [ ] **Tue evening:** Email warm list ("we launch tomorrow")
- [ ] **Wed 12:01am PT:** Product Hunt launch goes live — post first maker comment immediately
- [ ] **Wed:** Cross-post to BetaList, Indie Hackers (build-in-public thread), r/SideProject
- [ ] **Wed:** Twitter/X thread; LinkedIn long-form launch post
- [ ] **Wed-Thu:** Reply to every PH comment within 30 minutes
- [ ] **Thu:** Show HN submission ONLY if a technical angle is ready (FSM design, MV3 service-worker patterns) — generic "we launched" gets flagged
- [ ] **Fri:** Launch recap blog post on `torly.ai/blog` with honest numbers + lessons
- [ ] **Fri:** Cross-post recap to Indie Hackers + r/SaaS

### Week 3 (2026-05-29 to 2026-06-04) — Vertical Ignition

**Goal:** Where the actual installs come from — visa/expat/Chinese-language communities.

- [ ] **Mon-Wed:** Reddit warm-up — comment helpfully on 10+ recent threads in r/SchengenVisa + r/UKVisa (90/10 rule)
- [ ] **Wed:** First post to r/SchengenVisa using Variant B copy + screenshots (NOT Variant A — will be removed)
- [ ] **Wed-Thu:** Schengenvisainfo.com forum post
- [ ] **Thu:** First Xiaohongshu post (zh-CN, image-first, 5-image carousel from CWS screenshots)
- [ ] **Thu:** Answer 2 existing Zhihu questions under 申根签 tag
- [ ] **Fri:** Cold-pitch outreach to 5 "best of" listicle blog posts ranking for "Schengen appointment booking tips 2026"
- [ ] **Fri:** Submit Trustpilot listing (Variant B)
- [ ] **Fri:** Submit Diigo + Scoop.it (low-effort backlinks)

### Week 4+ — Rolling Maintenance

- [ ] Weekly: 1 Reddit comment in r/SchengenVisa (helpful, not promo); 1 Zhihu answer
- [ ] Weekly: Monitor PH listing for late comments; reply
- [ ] Monthly: Re-pitch listicle bloggers with new data ("3 months in, here's what we learned")
- [ ] Monthly: Manual GEO citation check — ask ChatGPT/Claude/Perplexity "best Schengen visa appointment tools"; log mentions
- [ ] Quarterly: Refresh top-3 directory listings if product has shipped material new features

---

## 8. KPIs & Tracking

Tracker lives at `docs/15-directory-submissions-tracker.csv` (companion file).

| Metric | Day 0 (now) | Day 30 (post-launch) | Day 90 |
|---|---|---|---|
| `torly.ai/visa-master` Domain Rating | TBD baseline | +5 | +15 |
| Referring domains to landing page | TBD baseline | 25 | 60 |
| Indexed pages on `torly.ai/visa-master/*` | ~1 | 8 | 20 |
| Directory/forum listings live | 0 | 25 | 45 |
| Chrome Web Store installs | TBD baseline | +500 | +3,000 |
| Free → Premium conversion (Premium activations) | 0 | 5 | 30 |
| AI engine citations (manual quarterly check) | 0 | 1–2 | 5+ |
| Reddit / Xiaohongshu / Zhihu inbound clicks | 0 | 200 | 1,500 |

**KPI investigation rule:** if a number isn't moving by Day 30, the answer is rarely "submit to more directories" — investigate whether the destination page is converting (heatmaps, scroll depth) or whether the positioning copy is getting auto-rejected by community moderators.

---

## 9. What This Plan Deliberately Excludes

To avoid distraction and wasted effort:

- **No Tier 3 AI directory submissions** unless/until Visa Master ships an AI-marketed feature (smart cadence ML, slot prediction). Forcing AI framing dilutes the honest privacy story and burns trust with the vertical audience.
- **No paid directory submission services.** The free tier listings cover everything that matters; paid packages list to spam directories that hurt Domain Rating.
- **No G2 / Capterra review drives.** A free Chrome extension's user base is not the right population for B2B review platforms; trying to hit 10 reviews wastes weeks.
- **No press release distribution (Tier 11).** The visa niche is allergic to PR-style announcements; trust is built through community participation, not press wires.
- **No Tier 9 local business directories.** Visa Master is not a local business.
- **No premature scaling.** This plan caps at ~45 active listings by Day 90. Beyond that, marginal directories return less than the time costs to maintain.

---

## 10. Open Questions

1. **Landing page status** — does `torly.ai/visa-master` exist as a real marketing page, or is it currently a redirect to the GitHub repo? This determines whether Phase 0 is a 3-day or a 10-day workstream.
2. **Chinese landing page** — is there an existing `torly.ai/zh-CN/visa-master` template to mirror, or does this require fresh design? Affects Week 1 schedule.
3. **Product Hunt launch date** — needs to be locked. Wednesday 2026-05-27 used as placeholder; if shifted, Week 2 schedule moves with it.
4. **Hunter** — book one (trade a feature/shoutout) or skip? +15% day-one lift; not required.
5. **First-comment customer voices** — do we have 3 beta users willing to leave the first 3 substantive PH comments on launch day? This is the single highest-leverage prep item for PH.
6. **Variant B Chinese translation** — needs human translation, not machine. Who owns this?
7. **Trustpilot** — are we OK with a public 1-star risk if a Premium booking fails before §17 stub work in PRD 09 is completed? May want to defer Trustpilot until booking automation is empirically validated.

---

## 11. Cross-References to Other Docs

- **Trust boundary** — see CLAUDE.md "Free vs Premium" section. Both positioning variants honor it; do not soften the "Free never reads your password" claim under marketing pressure.
- **Premium WIP risks** — `docs/12-premium-backlog.md` lists known stubs (`driveBookingFlow()`, `injectedFill()` selectors). Variant A's "auto-book" claim depends on these being validated against a real TLS booking page; if they aren't, defer Variant A submissions until they are.
- **CWS submission** — `docs/13-chrome-web-store-submission-prd.md` is the prerequisite for everything in this plan. Nothing here ships before CWS approval.
- **Notifications PRD** — `docs/14-notifications-and-email-prd.md` enables the Telegram + email promise in both copy variants.
