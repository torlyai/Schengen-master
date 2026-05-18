# Visa Master — Product Hunt Launch Checklist & Asset Guideline

**Anchor launch day:** **Thu 2026-06-04** · 12:01 AM PT / 08:01 BST (locked 2026-05-18)
**Owner:** Duke Harewood / Torly AI
**Companion docs:** `VM-MASTER-PLAN.md` · `../15-directory-submissions-launch-plan.md`
**Source skill:** `~/.claude/skills/directory-submissions/SKILL.md` (v1.0.0) — Product Hunt Deep Dive section
**Generated:** 2026-05-15 (forked from `aicmo-uk/docs/launch/product-hunt-launch-checklist.md`)

> Product Hunt is the **single highest-leverage submission** in the directory tier. It is also the most easily wasted. This doc turns the launch-day window into compounding distribution rather than a one-day spike.

---

## 0. Why this doc exists (the three failure modes it prevents)

The 2026 PH algorithm weights **comment quality** over upvote count. 80% of failed PH launches fail for one of three reasons:

1. **Launched without a warm audience.** No email list, no Upcoming-page subscribers, no community priming → no day-one traction → algorithm filters it out by hour 4.
2. **Asked for upvotes instead of feedback.** Triggers the anti-manipulation filter, posts get hidden.
3. **Maker stopped replying after hour 2.** PH measures maker responsiveness directly; sub-30-minute reply latency keeps you in the live ranking.

Front-loaded audience prep (§4), scripted launch-day copy (§3), 24-hour responsiveness rotation (§7).

---

## 1. Submission form — field-by-field with filled copy

### 1.1 Core fields — Variant A (Premium-led, per D1)

| Field | Spec | Filled value (use verbatim) |
|---|---|---|
| **Name** | Max 40 chars | `Visa Master` |
| **Tagline** | Max 60 chars | `Auto-books your Schengen visa slot the instant one drops` *(56 chars)* |
| **Description** | 260 char max | `Visa Master is a Chrome extension that detects Schengen visa appointment slots on TLScontact and books them automatically. Free tier sends desktop + Telegram alerts. Premium auto-books — pay £19 only on success, refundable 24h.` *(245 chars)* |
| **Topics** (up to 4) | PH-controlled vocab | `Travel`, `Productivity`, `Chrome Extensions`, `Browser Extensions` *(verify exact PH topic names; substitute closest matches)* |
| **Product URL** | Live URL | `https://torly.ai/visa-master` *(NOT the Chrome Web Store URL — the marketing page; CWS link goes in the gallery / first comment)* |
| **Pricing** | One of: Free / Freemium / Paid / Free trial / Free options | `Freemium` (Free tier is genuinely free; Premium £19/successful booking) |
| **Launch day** | YYYY-MM-DD | `_TBD per D-LAUNCH-DATE_` |
| **Maker** | PH profile | `@dukewood` |
| **Hunter** | PH profile (optional) | _Per D-HUNTER decision; default self-hunt_ |
| **Built with** (optional) | Tech tags | `Chrome Extension`, `Manifest V3`, `TypeScript`, `Vite`, `Next.js`, `Stripe`, `Supabase` |

### 1.2 No promo offer

Unlike a subscription product, Visa Master's pricing model IS the offer: £19 only on successful booking, refundable 24h. Per VM-launcher §5.5, do NOT invent a coupon to "add launch urgency" — it would undermine the success-fee positioning.

If a PH-only sweetener becomes desirable later, the option that doesn't dilute the model is: **first 100 PH-referred Premium bookings get the refund window extended from 24h to 72h.** Treat this as a stretch decision, not a default.

### 1.3 Extra fields PH may ask for

- **"Where can people give feedback?"** → `https://torly.ai/visa-master/feedback` (create a simple Tally/Typeform if not live by D-7)
- **"What problem does it solve?"** → `Schengen visa appointment slots open and disappear in minutes. Refreshing TLScontact every 10 minutes for weeks is the current "solution". Visa Master watches for you and (optionally) books for you.`
- **"What makes you different?"** → `Most "visa booking bots" require your TLS email and password upfront. Visa Master's Free tier never reads your password — it runs 100% locally in your browser. Premium adds auto-book only with explicit consent and a 24h refund window.`

---

## 2. Asset specifications & status checklist

### 2.1 Tier-A — required for submission

| Asset | Spec | Format | Status | Owner |
|---|---|---|---|---|
| **Logo** | 240×240 px square. Solid or transparent background. No drop shadow. Logo fills ≥80% of canvas. | PNG with transparency | ⬜ | Verify `extension/screenshots/v1.1.0/store-icon-128.png` upscales cleanly to 240; otherwise re-export from source |
| **Thumbnail (square)** | 240×240 px. Often same as logo but can include a tagline overlay if logo is wordmark-light. | PNG | ⬜ | |
| **Gallery image #1** | 1270×760 px (16:9.5). Doubles as OG image. Must be readable as a 240×240 thumbnail (text large, contrast high). | PNG or JPG, <2MB | ⬜ | Hero shot — extension popup mid-detection on TLScontact |
| **Gallery images #2–8** | 1270×760 px each. Up to 7 more. | PNG or JPG, <2MB each | ⬜ | See §3.3 narrative arc |
| **Tagline** | ≤60 chars | Plain text (see §1.1) | ✅ | Filled above |
| **Description** | ≤260 chars | Plain text (see §1.1) | ✅ | Filled above |
| **Product URL** | Public, no password wall, indexable | URL | ⬜ | `torly.ai/visa-master` must be live (CP-2) |
| **Maker first comment** | 800–1200 chars | Plain text (see §3.1) | ⬜ TODO | Needs Jason's voice; placeholder below |

### 2.2 Tier-B — optional but high-leverage

| Asset | Spec | Notes | Status | Owner |
|---|---|---|---|---|
| **Demo video** | 60–90 seconds, ≤512MB, MP4 or MOV, 1920×1080 | **Use existing** at `marketing/video/out/visa-master-promo-narrated.mp4` (75s narrated promo). Confirm length ≤90s; if longer, cut. Upload to YouTube unlisted by D-6; Loom backup by D-4. | ⬜ | Founder |
| **Hunter** | Existing PH user with 500+ followers | Per D-HUNTER (default self-hunt). Trade only — never pay cash. | ⬜ | _Per D-HUNTER_ |
| **Maker bio** | 300 chars | Brief story, why you built Visa Master. | ⬜ | Founder |
| **Customer first comment** | 400–600 chars | A real beta user posting honest experience within first 2 hours. Per D-COMMENTER. | ⬜ | Founder + 2 beta users |

### 2.3 Asset prep deadlines (anchored to Thu 2026-06-04 launch)

| Asset | Deadline | Days before launch |
|---|---|---|
| Logo + thumbnail finalised | **2026-05-21 Thu** | -14 |
| Gallery images #1–4 done | **2026-05-24 Sun** | -11 |
| Gallery images #5–8 done | **2026-05-28 Thu** | -7 |
| Demo video PH-cut selected (≤90s) | **2026-05-24 Sun** | -11 |
| Demo video uploaded to YouTube unlisted | **2026-05-29 Fri** | -6 |
| Loom backup uploaded | **2026-05-31 Sun** | -4 |
| Maker first comment finalised | **2026-05-28 Thu** | -7 |
| Customer first commenter confirmed | **2026-05-31 Sun** | -4 |
| All assets dry-run in PH preview | **2026-06-03 Wed** | -1 |

---

## 3. Filled copy slots — paste-ready content

### 3.1 Maker first comment — TODO: Jason's voice required

> ⚠️ **TODO:** This is the single highest-leverage piece of copy in the entire launch. The aiCMO version was written in Jason's voice over multiple sessions. Below is a structural placeholder that hits the right beats — Jason needs to rewrite it in his own voice before D-7. It must NOT read like AI-generated marketing copy; PH commenters can spot that and it kills credibility.
>
> **Beats to hit (in order):**
> 1. Personal hook — your real Schengen-visa story. The one slot you got at 11:47pm on a Tuesday or whatever. Be specific.
> 2. The 30-second "what it is" — "Free Chrome extension that watches TLScontact, optional Premium adds auto-book"
> 3. The trust differentiator — "Free tier never reads your password. Premium captures only what's needed for the booking, with a 24h refund window."
> 4. The honest "what's beta" caveat — Premium booking automation is new; what you'd love feedback on
> 5. Three feedback questions (NOT support asks). Examples below.
> 6. Sign-off: "I'm replying to every comment for the next 24h."

**Structural placeholder (rewrite before D-7):**

> Hi PH 👋
>
> [TODO: 2-sentence personal Schengen-visa story — the moment you decided to build this]
>
> **The 30-second version:** Visa Master is a Chrome extension that watches TLScontact for Schengen visa appointment slots and pings you the second one opens — desktop alert, sound, optional Telegram push. Optional Premium (£19, charged only on a successful booking, refundable 24h) auto-logs-in if your session times out and auto-books the slot when it appears.
>
> **The trust thing:** every other "visa booking bot" in this category asks for your TLS email and password upfront. Free tier doesn't read either — runs 100% locally in your browser, talks only to tlscontact.com (where you're already logged in) and your own Telegram bot. Premium captures only the booking confirmation and your Stripe email.
>
> **Honest caveat:** the auto-book flow has been validated against real TLS booking pages but the variation across 20+ Schengen consulates is large. Free-tier slot detection is rock-solid; Premium auto-book is the new beta surface I'd most love eyes on.
>
> **What I'd love your honest feedback on:**
> 1. Does the "free tier never reads your password" claim land as differentiating, or read as weird/defensive?
> 2. Where in the flow did you bounce when you tried the extension?
> 3. For UK/EU travellers — what's the *one* feature missing that would make you keep it installed after your trip?
>
> Brutally honest take welcome — I'm replying to every comment for the next 24h.

> **Rule:** Do NOT change `What I'd love your honest feedback on:` to anything like "support us" or "would love your vote". Feedback framing converts 3× better and doesn't trip the algorithm.

### 3.2 Customer first comment — TODO: real beta user, written by them

> ⚠️ Must be written by an actual beta customer in their own voice. Sample frame below; do NOT post this as-is — get a real human to write theirs. Sockpuppet customer comments get the entire listing hidden.

**Sample frame (for the customer to adapt):**

> Used Visa Master for ~[N] weeks getting my [country] visa.
>
> Two honest reactions:
>
> 1. The notification fired at [time] on a [day] when I was [doing thing]. Without it I'd still be refreshing TLScontact.
> 2. [Either: "Premium auto-book worked first try" OR "I stayed on Free and just sprinted to my laptop when it pinged"].
>
> Not perfect: [one honest niggle — slot detection had a 30s delay, the Telegram bot setup took 5 mins, etc.].
>
> Worth a look if you're trying to get a Schengen slot and TLScontact is showing zero availability for weeks.

### 3.3 Gallery image captions

| # | Image content | Caption |
|---|---|---|
| 1 | Hero — extension toolbar badge in `SLOT_AVAILABLE` state, TLScontact in background | `Pings you the second a Schengen slot opens.` |
| 2 | Settings page showing Free vs Premium tiers | `Free forever. Premium £19 only on successful booking.` |
| 3 | Welcome page showing the 4 trust promises (`welcome.no.1` through `welcome.no.4`) | `Free tier never reads your TLS password. Ever.` |
| 4 | Telegram notification on a phone | `Optional phone push via your own Telegram bot.` |
| 5 | Premium auto-book confirmation modal (post-booking) | `Optional auto-book. Pay only when the slot is yours.` |
| 6 | Settings page showing scheduler options (smart / fixed / release-window) | `Smart cadence — heavier polling near consulate release windows.` |
| 7 | Multi-consulate target picker (France, Italy, Spain, Germany, …) | `Works for 20+ Schengen consulates on TLScontact.` |
| 8 | "Refund within 24h" Premium guarantee panel | `Premium £19 refundable for 24h. No subscription.` |

> **Narrative arc:** 1 (the moment) → 2 (model) → 3 (trust) → 4 (channel coverage) → 5–6 (Premium proof) → 7 (breadth) → 8 (refund close). Random ordering wastes 60% of the gallery's persuasion budget.

### 3.4 Twitter / X launch-day thread (post at 12:05 AM PT, then again at 09:00 PT)

**TODO (Variant A; rewrite in Jason's voice):**

> 🧵 We just launched Visa Master on @ProductHunt — a Chrome extension that watches TLScontact for Schengen visa slots and (optionally) auto-books them.
>
> Here's what's different (and what I'd love your honest take on):
>
> 1/ Every other tool in this category wants your TLS password on day one. Free tier of Visa Master never reads it — runs 100% locally in your browser. Premium adds auto-book *only* with explicit consent.
>
> 2/ Premium pricing is £19 *only* when you successfully book a slot, refundable for 24h. No subscription, no upfront charge. The success-fee model means our incentive and yours are the same.
>
> 3/ Built for UK and Chinese travellers booking France, Italy, Spain, Germany, and 20+ Schengen consulates via TLScontact.
>
> 4/ Where I want your feedback → [PH listing link]
>
> Brutally honest comments most welcome. Replying to all of them today.

### 3.5 LinkedIn long-form post (publish 06:00 PT launch day)

**TODO (Jason's voice):**

> Launching Visa Master on Product Hunt today.
>
> The build-in-public truth: I spent six weeks last year refreshing tlscontact.com every ten minutes trying to book a Schengen visa slot for my family. The category is dominated by tools that demand your TLS password on day one — and there's no shortage of stories of those credentials being misused.
>
> So we built two things:
>
> 1/ A Free Chrome extension that watches TLScontact for slots and pings you the moment one opens. Runs 100% locally — never reads your password, never sends data anywhere.
>
> 2/ An optional Premium upgrade that auto-books the slot for you. Pay £19 only when it works, refundable for 24h. No subscription, no upfront charge.
>
> The thing I'd love your feedback on: does the "Free tier never reads your password" promise land as differentiating, or as defensive against a non-existent worry?
>
> PH link in first comment. Brutally honest reactions welcome.

### 3.6 Email list announcement (send 09:00 BST launch day)

> Subject: We're live on Product Hunt today
>
> Hi {first name} —
>
> Visa Master launched on Product Hunt this morning. If you've been on the waitlist or in the Free-tier beta, this is the moment we asked you to be ready for.
>
> Two things I'd love (in this order):
> 1. **Honest feedback** on the listing copy and demo — does it represent the extension you've actually used? Reply to this email if anything's off.
> 2. **Try the new Premium auto-book** at torly.ai/visa-master/premium and tell me whether the £19/successful-booking model feels honest to you.
>
> If you want to support the launch publicly, the PH listing is here: [link]. I'm replying to every comment today.
>
> No upvote asks. Just feedback.
>
> — Jason

### 3.7 Indie Hackers + r/SaaS post (day +1, not launch day)

Cross-post the launch recap (see §8) — NOT the listing itself. Indie Hackers and r/SaaS users punish self-promo; reward honest post-mortems with numbers.

### 3.8 Vertical-channel posts (Phase 4, day +1 to +7) — VARIANT B

**These are NOT covered in aiCMO's checklist** — they are Visa Master-specific, sourced from `docs/15-*` §5. Use Variant B copy from `docs/15-*` §6.2.

| Channel | Post type | Variant | Key constraint |
|---|---|---|---|
| r/SchengenVisa | Long-form post with screenshots | B | 90/10 rule — must have ≥10 prior helpful comments in past 14 days |
| r/UKVisa | Cross-post | B | UK-applicant angle |
| schengenvisainfo.com forum | Forum post | B | Highest backlink value in vertical (DR 60+) |
| Xiaohongshu | Image-first 5-image carousel | B (zh-CN) | Search 申根签证预约 first; format must be image-led |
| Zhihu | Long-form answer to existing 申根签 question | B (zh-CN) | Don't ask new question; answer 2 existing ones |

---

## 4. Prep timeline (anchored to Thu 2026-06-04 launch)

### Week minus-3 (2026-05-14 → 2026-05-20) — CWS approval window + audience warming

- [x] CP-1: Chrome Web Store approval (2026-05-18 ✅ — public listing live)
- [ ] Confirm PH maker account (`@dukewood`) history is in good standing
- [ ] Begin PH account warmup: upvote + thoughtful comment on **3 launches/day**
- [ ] Follow 100 active makers in Marketing / AI / Travel categories
- [ ] Create the PH **Upcoming** page — even minimal copy is fine
- [ ] Drive traffic to the Upcoming page from email list + LinkedIn → collect "notify on launch" subscribers. **Target: 200+ by launch day**
- [ ] CP-2: `torly.ai/visa-master` landing page live + indexed
- [ ] **Day 0 baseline KPIs captured** (CWS installs, DR, referring domains, Google indexed pages) — do today, not later

### Week minus-2 (2026-05-21 → 2026-05-27) — Asset production + alt-page

- [ ] CP-2 (2026-05-21 Thu): `torly.ai/visa-master` landing page live + indexed with FAQ schema
- [ ] CP-3 (2026-05-21 Thu): First alternative page (`/visa-master/vs-visadar`) live + indexed
- [ ] Logo + thumbnail finalised (2026-05-21 Thu)
- [ ] Demo video PH-cut selected from `marketing/video/out/visa-master-promo-narrated.mp4` (2026-05-24 Sun)
- [ ] Gallery images #1–4 produced + reviewed (2026-05-24 Sun)
- [ ] D-HUNTER decision locked (default: self-hunt)
- [ ] Begin warming the customer-commenter pool — same beta cohort that fed CWS feedback

### Week minus-1 (2026-05-28 → 2026-06-03) — Final assembly

- [ ] 2026-05-28 Thu (D-7): Maker first comment finalised (rewrite §3.1 in Jason's voice). Gallery images #5–8 done. CP-4 ✅. D-ZH-TRANSLATOR resolved (or accept zh-CN slip). CP-5-VALIDATION confirmed (or fall back to Variant B everywhere)
- [ ] 2026-05-29 Fri (D-6): Demo video uploaded to YouTube unlisted as the PH-ready cut
- [ ] 2026-05-31 Sun (D-4): Customer first commenter confirmed in writing. Loom backup uploaded. CP-5 ✅
- [ ] 2026-06-01 Mon (D-3): Email list warm-up sent: "We launch Thursday. Here's what to expect. Reply if you want a heads-up"
- [ ] 2026-06-02 Tue (D-2): Twitter / LinkedIn / Indie Hackers / Discord pre-launch posts scheduled
- [ ] 2026-06-03 Wed 22:00 BST (D-1, CP-6): Dry run — submit listing as "Draft" or use PH preview. Walk every screenshot, every link, every CTA. Final QA: `torly.ai/visa-master` works in incognito, demo video autoplays in modal, signup CTA goes to the right place, PH preview thumbnail looks right at 240×240

### Launch day (Thu 2026-06-04, D-Day)

| Time (PT) | Time (BST) | Action |
|---|---|---|
| 00:00 | 08:00 | Maker hits "Launch" in PH UI |
| 00:01 | 08:01 | Maker posts first comment (§3.1) |
| 00:02 | 08:02 | Twitter thread #1 (§3.4) |
| 00:05 | 08:05 | DM the 10 closest power-users with PH link (NOT generic outreach) |
| 00:15 | 08:15 | Customer first comment posted (§3.2) |
| 00:30 | 08:30 | First milestone check: 30+ supporters? If yes → algorithm distribution kicks in. If no → push email list 1h early. |
| 01:00 | 09:00 | Email list launch announcement sent (§3.6) |
| 02:00 | 10:00 | LinkedIn long-form (§3.5) — peak BST attention window |
| 04:00 | 12:00 | Indie Hackers build-in-public thread (NOT a launch promo) |
| 06:00 | 14:00 | First batch of replies done. **Take a 1-hour break** — the 24-hour grind kills decision-making by hour 16 |
| Hourly | Hourly | Reply to every new comment within 30 minutes |
| 09:00 | 17:00 | Twitter thread #2 (US PM window) |
| 14:00 | 22:00 | Maker check-in post — "12 hours in, here's what I'm learning". Drives second-wind engagement |
| 23:59 | 07:59+1 | Final reply pass before listing locks ranking |

### Day +1 (Fri 2026-06-05)

- [ ] Write the **launch recap blog post** (see §8). Aim for publish by 14:00 BST.
- [ ] Cross-post recap to Indie Hackers + r/SaaS + LinkedIn (NOT r/Entrepreneur — punishes recaps).
- [ ] Submit to **BetaList**, **Fazier** per `docs/15-*` Tier 1.
- [ ] Reply to any remaining PH comments — responsiveness still tracked for 48h.
- [ ] **Day +1 to +7 vertical-channel ignition** per `docs/15-*` Week 3 schedule — see §3.8 above.

---

## 5. The Three Absolute Rules (read these daily during launch week)

### Rule 1 — Ask for feedback, never upvotes
> ✅ "Would love your honest take on the positioning."
> ❌ "Please support us by upvoting!"

### Rule 2 — Do not DM strangers
> Only DM people you have a real prior relationship with. The community flags cold "please check out my launch" DMs to moderators.

### Rule 3 — Reply within 30 minutes
> PH measures maker reply latency directly. Solo founders burn out by hour 14 — assign a 24-hour reply rotation (§7).

---

## 6. Decisions log

See `VM-MASTER-PLAN.md` §3 — decisions live there as the single source of truth, not duplicated here.

---

## 7. 24-hour responsiveness rotation

| Time block (BST) | Coverage |
|---|---|
| 08:00 → 14:00 (launch + first 6h) | Founder + 1 backup |
| 14:00 → 20:00 (BST evening) | Founder, supported by 1 beta user |
| 20:00 → 02:00 (US PM peak — high comment volume) | Founder |
| 02:00 → 08:00 (rest window) | 1 trusted teammate flags critical comments to founder by SMS |

> **If no backup is possible:** set Slack/Discord push notifications for the PH email address; reply within 30 min from phone. Sleep 22:00–06:00 BST and accept the algorithmic penalty for those 8 hours — better than the burnout penalty across the full 24.

---

## 8. Launch recap (day +1) — outline

Write a 1000–1500 word honest recap. Publish on `torly.ai/blog/visa-master-product-hunt-launch-recap-2026` (or equivalent). This is the asset that **gets cited by AI engines in future "best Schengen visa tools 2026" queries** — make it citation-quality.

Required sections:
1. **Headline numbers** — upvotes, comments, CWS installs delta, Premium activations, signups — with screenshots
2. **What worked.** 3 specific tactics with evidence
3. **What didn't.** 2 honest misses
4. **Hour-by-hour traffic chart**
5. **The 3 most useful pieces of feedback** received in comments — and how Visa Master is responding
6. **What's next.** Specific next 30-day milestones — link to `docs/15-*` §7 Week 3 vertical-channel schedule

**Tone:** honest > celebratory. Recap pages that get cited are the ones that say "we hit X, missed Y, here's what we learned" — not "AMAZING DAY 🎉🚀".

---

## 9. What happens if something goes wrong

| Situation | Action |
|---|---|
| Listing hidden by moderators | Email support@producthunt.com immediately with the URL and a clear "what happened" — do NOT argue with moderators publicly. Most accidental hides resolve within 24h |
| Demo video stops working | Pre-uploaded Loom URL is the backup (D-4) |
| `torly.ai/visa-master` goes down | Maker comment edited within 5 min: "Quick note — landing page is back at [backup CWS URL]". Don't pretend nothing happened |
| TLScontact site changes selectors mid-launch (Premium auto-book breaks) | Pull Variant A copy immediately if Premium is now non-functional. Edit maker comment to soften the "auto-book" claim. Ship a hotfix to the extension within 48h |
| Hunter pulls out at -3 | Launch self-hunted, no public mention of the change |
| Conversion rate far below expectation | Do NOT change pricing or copy mid-launch. Note the gap in recap (§8) |

---

## 10. Pre-flight final checklist (run at 22:00 BST Wed 2026-06-03)

- [ ] PH listing draft loads correctly in preview mode
- [ ] All 8 gallery images render at correct dimensions, in correct order
- [ ] Logo crisp at 240×240
- [ ] Demo video plays in modal, ≤90 seconds, autoplays muted
- [ ] Tagline reads correctly in the listing card
- [ ] Description fits in 260 chars in the listing card
- [ ] Product URL `torly.ai/visa-master` works in fresh incognito
- [ ] Chrome Web Store install link works from the landing page
- [ ] Premium signup CTA on `torly.ai/visa-master/premium` leads to functioning Stripe checkout
- [ ] Maker first comment (§3.1) finalised in Jason's voice + copied into Notes for fast posting
- [ ] Customer first commenter confirmed available for 00:15–01:00 PT window
- [ ] Twitter, LinkedIn, IH, email drafts in scheduling tools or Notes
- [ ] Reply rotation owners notified for their shift
- [ ] Phone push notifications enabled for PH email + Slack
- [ ] CP-5 status: Premium booking validated against real TLS slot in last 7 days (if NO → fall back to Variant B everywhere, edit maker comment to remove "auto-book" claim)
- [ ] 0.5L water bottle filled. Coffee ready. Alarm set for 23:45 BST.

---

## 11. Cross-references

- **Master plan** → `VM-MASTER-PLAN.md` — phases, CP, decisions, KPIs
- **Strategic plan** → `../15-directory-submissions-launch-plan.md` — tier triage, positioning variants, vertical channels
- **Tracker** → `../15-directory-submissions-tracker.csv`
- **CWS submission** → `../13-chrome-web-store-submission-prd.md` — CP-1 gate
- **Premium backlog** → `../12-premium-backlog.md` — `driveBookingFlow()` + `injectedFill()` validation status (gates CP-5)
- **Free PRD** → `../06-visa-master-chrome-extension-prd.md`
- **Premium PRD** → `../09-visa-master-premium-prd.md`
- **Trust boundary** → `../../CLAUDE.md` "Free vs Premium — the trust boundary"
- **Source skill** → `~/.claude/skills/directory-submissions/SKILL.md` (Product Hunt Deep Dive section)

---

## 12. Out of scope for this checklist

- HN Show HN submission — defer to day +2; only if Visa Master's MV3 service-worker or trust-boundary architecture is genuinely novel enough for HN.
- TAAFT / Futurepedia / Toolify AI directory submissions — explicitly **excluded** by D5 (no AI directories until/unless an AI-marketed feature ships).
- G2 / Capterra review drive — **excluded** by D5.
- Paid ads / retargeting / press outreach — **excluded** by D5 within launch window.
