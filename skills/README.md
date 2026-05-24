# Schengen-master skills

> Read this in: **English** · [中文](README.zh-CN.md)
>
> A Schengen visa application is a lot of paperwork, a lot of small rules, and very little forgiveness. Get the photo wrong, get refused. Insurance €20k short of €30k, refused. Bank statement with one suspicious deposit, refused. Cover letter contradicts the France-Visas form, refused. Show up at TLScontact without a printed barcode, sent home.
>
> I refused to memorise it all and learn it twice. So I built a team of nine specialists to do it for me.

This is a Claude Code skills toolkit for **Schengen short-stay visa applications**, starting with France from the UK. It turns Claude Code into nine virtual experts who walk you through the entire journey — a trip planner who interrogates your scenario, a document engineer who builds your file pack, an accountant who audits your finances, a forms specialist who walks you through France-Visas and TLScontact line by line, a minor specialist for kids, a sponsor specialist for spouse/parent/employer support, an appointment coordinator who hunts slots, an application auditor who runs a final pre-submission check, and a recovery advisor for when things go wrong.

**20 skills at v0.2.0**, all Markdown, all free, MIT-licensed. Designed for France at v0.x; other Schengen countries land in v1.x. Each skill is bilingual (English + Simplified Chinese) so a family applying together can each work in their preferred language.

**Who this is for:**

- **First-time tourist applicants** — you've never done a Schengen visa and don't know where to start
- **Family travellers** — kids, parents, spouses all on the same trip — different docs for each
- **Sponsored applicants** — your spouse, parent, friend, or employer is paying — you need their docs assembled cleanly
- **Refused applicants** — you got a refusal letter and need to decide between appeal and re-application
- **Business travellers** — invitation letters, employer letters, reimbursement evidence
- **Anyone who hates filling forms twice** — the skills enforce one source of truth across every document

## Quick start

1. Install the skills (30 seconds — see below)
2. Run `/start-here` — answer 6 forcing questions about your trip
3. Run `/document-checklist` — get a personalised printable checklist
4. Run `/audit-application` when you think you're ready
5. Stop there. You'll know if this is for you.

## Install — 30 seconds

**Requirements:** [Claude Code](https://docs.anthropic.com/en/docs/claude-code), [Git](https://git-scm.com/)

Open Claude Code and paste this. Claude does the rest.

```bash
curl -sSL https://raw.githubusercontent.com/torlyai/Schengen-master/main/skills/install.sh | sh
```

That's it. In your next Claude Code session, run `/start-here`.

**Re-run the same command** any time to update to the latest version. The install is idempotent, sparse-checkout, and fast.

**Custom install location:**

```bash
SCHENGEN_SKILLS_DEST=~/some/other/path curl -sSL https://raw.githubusercontent.com/torlyai/Schengen-master/main/skills/install.sh | sh
```

## See it work

```
You:    I want to apply for a Schengen visa to France next month.
You:    /start-here

Claude: Six forcing questions before I route you to the right skills.

        1. Country: France ✓
        2. Purpose: tourism, business, family visit, study, transit?
        3. Travelling with: alone, spouse, kids?
        4. Sponsorship: paying yourself or someone paying for you?
        5. Trip dates: when, how long?
        6. Country of residence: UK?

You:    Tourism, with my wife and 8-year-old son, paying ourselves,
        15-22 July, UK resident.

Claude: OK — this is a group application with one minor. I'm routing you to:
          → /minor-application (for your son)
          → /group-application (for the family booking flow)
          → /document-checklist (for each adult)
        Run them in that order. Want me to start with the first?

You:    Yes.
        [/minor-application walks through birth cert + school letter
         + parental consent because both parents are travelling, so
         the consent question gets auto-answered: no consent letter
         needed for this case.]

You:    /group-application

Claude: Group rule: each applicant needs their own France-Visas
        reference number, but you share one TLScontact team ID
        and one appointment slot. Here's your applicant matrix...

You:    /france-visas-form

Claude: Page-by-page walkthrough. I'll flag the typos that cause
        TLS to reject your reference number...

You:    /audit-application

Claude: Cross-applicant audit. Found 3 issues:
        - Wife's insurance certificate doesn't list son
        - Cover letter mentions Paris, accommodation booking is in Nice
        - Bank statement has a £4,200 deposit on the 18th — explain it
        Fix these and re-run.

You:    [fixes them]
        /book-appointment

Claude: London is booked 4 weeks out. Edinburgh has Tue + Thu slots
        next week. Day-trip cost ~£140 return on LNER, vs paying
        £80 for Premium Time in London that wouldn't help anyway.
        Recommend Edinburgh.
```

You said "I want a Schengen visa." The toolkit said "you're a family of three with one minor, applying as a group, here's the actual sequence." That's not a chatbot. That's a team.

## The visa journey

These skills aren't a random pile of utilities. They're sequenced to the way a real visa application actually unfolds.

**Discover → Plan → Prepare → Audit → Submit → Wait → Recover**

Each stage feeds into the next. `/start-here` figures out your scenario and routes you. `/document-checklist` produces the list that `/cover-letter` + `/employment-letter` + `/bank-statement-check` + `/insurance-check` populate. `/audit-application` reads all of it before you book the appointment. `/track-application` waits with you. `/refusal-appeal` is there if it goes wrong.

| Stage | What happens | Skills |
|---|---|---|
| **Discover** | Figure out your scenario and which skills you need | `/start-here` |
| **Plan** | Personalise the document list for your situation | `/document-checklist`, `/minor-application`, `/sponsored-application`, `/group-application` |
| **Prepare** | Build each document — letters, financials, photos, insurance | `/cover-letter`, `/employment-letter`, `/bank-statement-check`, `/cost-estimate`, `/financial-checklist`, `/photo-check`, `/insurance-check`, `/minor-parent-consent` |
| **Audit** | Pre-submission cross-check — consistency, gaps, weak points | `/audit-application` |
| **Submit** | Fill the portals, book the slot, attend the appointment | `/france-visas-form`, `/tlscontact-form`, `/find-slot`, `/book-appointment` |
| **Wait** | Decode the tracker, set realistic expectations, escalate when needed | `/track-application` |
| **Recover** | Refusal? Appeal or re-apply — let's decide | `/refusal-appeal` |

## The 20 skills — your virtual visa team

Each skill is a persona. You don't think "what skill do I need?" — you think "which expert do I want to talk to?"

### Trip Planner — *the first person you talk to*

Like a smart travel agent who interrogates your scenario before recommending anything. Sets the agenda for everything that follows.

| Skill | What it does |
|---|---|
| `/start-here` | Six forcing questions (country, purpose, group, sponsorship, dates, residence) that decide which other skills you actually need. Routes you to the right next 2-3 skills based on your answers. Always run this first. |

### Document Engineer — *the perfectionist who builds your file pack*

Knows every Schengen rule by heart: photo dimensions, insurance minimums, cover letter conventions. Catches the things consular officers reject for.

| Skill | What it does |
|---|---|
| `/document-checklist` | Personalised printable checklist based on your purpose + family composition + sponsor situation + UK-resident specifics. Overlays the right requirements automatically. |
| `/photo-check` | Vision-enabled passport-photo compliance check. Attach your photo, get a verdict against the Schengen standard (35×45mm, white background, no glasses, neutral expression, ≤6 months old). |
| `/insurance-check` | Travel-insurance certificate audit. Verifies €30k+ coverage in EUR, repatriation, full trip duration, full Schengen area coverage. Tells you exactly what's missing. |
| `/cover-letter` | Drafts a personalised cover letter under 300 words. Variants for tourism, business, family visit. Explains purpose + return commitment + ties to your country of residence. |

### Accountant (visa-only) — *the meticulous money person* — **new in v0.2**

Audits your financial story the way a consular officer would. Catches the deposits that look suspicious, the salary that doesn't match your trip cost, the employer letter that forgot to mention leave approval.

| Skill | What it does |
|---|---|
| `/employment-letter` | Drafts a compliant employer letter (UK or multinational template). Flags missing fields: salary, role, contract type, leave-approval clause, return-to-work guarantee. |
| `/bank-statement-check` | Audits your 3-month statement against the €65/day rule. Flags suspicious deposits that need explanation. Checks the name on the statement matches your application. |
| `/cost-estimate` | Itemised trip-cost breakdown (flights, accommodation, daily spend, insurance, visa fees, contingency). Generates the number you'll cite in the cover letter. |
| `/financial-checklist` | Consolidated financial-evidence kit. Routes you through the three skills above in the right order for your scenario (employed / self-employed / retired / student / sponsored). |

### Minor Specialist — *the one who knows the rules for kids*

Travel with children is its own visa subspecialty. Birth certificates, parental consent, school letters, the parent's full doc pack alongside the child's.

| Skill | What it does |
|---|---|
| `/minor-application` | Entry-point for child applicants. Walks through birth cert + parent consent + school letter + parent docs requirements. Branches based on which parents are travelling. |
| `/minor-parent-consent` | Drafts the notarised parental consent letter when one or both parents are NOT travelling. Includes the legal phrasing consulates expect. |

### Sponsor Specialist — *for when someone else is paying*

Spouse, parent, friend, employer — all handled. The sponsor's documents (bank statements, employer letter, ID) need to be assembled cleanly with the right relationship proof.

| Skill | What it does |
|---|---|
| `/sponsored-application` | Generic sponsor handler. Adapts to sponsor type (spouse / parent / friend / employer). Drafts the sponsor support letter, lists the sponsor's required docs, ensures the relationship is documented. |

### Forms Specialist — *the patient one who reads the small print* — **new in v0.2**

The France-Visas portal and TLScontact aren't friendly. Field names are cryptic, the order is unintuitive, and one typo on the reference number means TLS rejects you. This persona reads the small print so you don't have to.

| Skill | What it does |
|---|---|
| `/france-visas-form` | Page-by-page walkthrough of the France-Visas portal. Warns about the typos that cause TLS to reject your reference number. Saves your progress as you go. |
| `/tlscontact-form` | TLScontact account creation + reference number linkage + appointment flow setup. Handles the awkward two-portal handoff. |
| `/group-application` | Family/group structural rules (1 France-Visas per person, 1 TLS team ID, 1 appointment slot). Walks the team leader through joining everyone to the same booking. |

### Appointment Coordinator — *the one who finds you a slot*

TLScontact slots are scarce, especially London May-August. This persona knows where to look, when to look, and how to combine `/find-slot` with the Visa Master Chrome extension to catch ad-hoc releases.

| Skill | What it does |
|---|---|
| `/find-slot` | Strategy for when no slots are available. Recommends the [Visa Master extension](https://chromewebstore.google.com/detail/cpogdllkcpenafboclnidfmmlcnjpbfm) for slot-watching, centre-shopping advice (Edinburgh + Belfast often have slots when London doesn't), and last-resort options. |
| `/book-appointment` | **New in v0.2.** Full booking-mechanics walkthrough once slots exist. Centre comparison, slot-time strategy, add-on advice (decline almost all upsells), and the on-the-day checklist. |

### Application Auditor — *the second pair of eyes before you commit*

The most important persona. Reads everything before you submit and flags the inconsistencies a consular officer will catch.

| Skill | What it does |
|---|---|
| `/audit-application` | Five-layer pre-submission audit: completeness (do you have all docs?), consistency (do dates/names/addresses match across docs?), credibility (does your financial story add up?), compliance (insurance + photo + cover letter against Schengen spec), and admissibility (do you meet visa eligibility?). PASS / HOLD / FAIL verdict + recommended fixes. |

### Recovery Advisor — *for when things go wrong* — **new in v0.2**

When the TLS tracker stays silent for two weeks, or the refusal letter arrives, this is who you talk to. Reads the situation, sets expectations, recommends action.

| Skill | What it does |
|---|---|
| `/track-application` | TLS tracker status decoder. Translates "Documents in transit" → "this is normal, just transit." Sets realistic timelines (7-15 working days for France from UK). Flags when to actually be concerned vs when to just wait. |
| `/refusal-appeal` | Interprets refusal codes 1-9, identifies which are fixable and which aren't. Drafts the appeal letter when appeal is viable. Recommends re-application (cheaper, faster) when appeal isn't. |

## Which skill should I use?

| You're at this point | Run this | Why |
|---|---|---|
| Just starting | `/start-here` | Always — it routes everything else |
| Have a list, need docs | `/document-checklist` | Personalised printable |
| Travelling with kids | `/minor-application` | Don't skip — kids need separate handling |
| Someone else paying | `/sponsored-application` | Sponsor docs are their own thing |
| 3+ people applying | `/group-application` | Group flow is structurally different |
| Stuck on a form | `/france-visas-form` or `/tlscontact-form` | Walks you page by page |
| Worried about money | `/financial-checklist` | Routes you to the right financial skills |
| Ready to submit? | `/audit-application` | The pre-flight check — don't skip |
| No appointment slots | `/find-slot` | Strategy, not just frustration |
| Time to book | `/book-appointment` | Centre + slot + add-on advice |
| Waiting on a decision | `/track-application` | Decode the tracker, set expectations |
| Got refused | `/refusal-appeal` | Decide between appeal and re-apply |

## France knowledge base — **new in v0.2**

`countries/france/KNOWLEDGE.md` is the single source of truth for France-specific facts: visa fees, processing times, refusal codes 1-9, document requirements, common quirks. Skills read it so they never quote a stale rule.

Per-consulate detail for each UK TLScontact centre:

| File | What's inside |
|---|---|
| `countries/france/consulate-london.md` | Holborn centre — address, hours, slot patterns, peak-season strategy |
| `countries/france/consulate-manchester.md` | Trafford Park centre — best for Midlands + North West |
| `countries/france/consulate-edinburgh.md` | Atholl Crescent centre — least competitive in the UK |
| `countries/france/consulate-belfast.md` | Donegall Square centre — Tue + Thu only, plan ahead |

## Power tools — the Visa Master Chrome extension

These skills are the **preparation** side. The Visa Master Chrome extension is the **runtime** side — once you've prepared everything, it watches TLScontact for an open slot and (Premium tier) auto-books it.

| Product | Tier | What it does | Cost |
|---|---|---|---|
| **Visa Master Free** | Free | Notifies you (desktop + sound + optional Telegram) when a TLS slot opens | £0 |
| **Visa Master Premium** | Premium | Free + auto-login + auto-book when a slot opens; 24h refund window | £19 per successful booking |

Install: [Chrome Web Store](https://chromewebstore.google.com/detail/cpogdllkcpenafboclnidfmmlcnjpbfm) · Source + privacy: https://github.com/torlyai/Schengen-master

Skills know about it: `/find-slot` recommends the Free tier for slot-watching, `/book-appointment` explains how it complements manual booking, and the wider ETHOS treats Premium as opt-in with a clear trust boundary (the Free tier never sends anything to torly.ai).

## Templates — print-ready files

`docs/templates/visa-application/` in the public repo holds the printable templates the skills reference: cover letter templates, document checklist PDFs, photo spec card, employer letter samples, sponsor letter samples. The skills generate personalised content; the templates give you the layout.

## Philosophy — the ETHOS

These skills are built on the **[Schengen-master Ethos](ETHOS.md)** — 12 principles that shape how every skill thinks, recommends, and advises. Read it if you're contributing or want to understand why a skill made a specific call.

Key principles:

- **The application is the audit trail.** Be ruthlessly consistent across documents.
- **The cheapest effort is the one you don't repeat.** Front-load the audit.
- **The boring documents matter most.** Bank statements + insurance + employer letter > cover letter polish.
- **Don't lie. Ever.** The VIS database cross-references everything.
- **We are templates, not lawyers.** Always confirm against official sources.

## What's coming next (v0.3 → v1.0)

16 more skills to reach the full 36-skill catalogue:

- **Trip planning:** `/plan-trip`, `/itinerary-builder`, `/decide-visa-type`, `/timeline-planner`
- **More documents:** `/accommodation-verify`, `/translate-doc`, `/apostille`
- **More minor skills:** `/minor-birth-certificate`, `/minor-school-letter`, `/minor-parent-docs`
- **Appointment-day prep:** `/appointment-prep`, `/appointment-day`, `/mock-interview`
- **Post-decision:** `/first-trip`
- **Meta-utility:** `/learn` (memory), `/audit-log`, `/vstack-upgrade`

Plus more `countries/*` knowledge bases — Germany, Italy, Spain, Netherlands.

See [CHANGELOG.md](CHANGELOG.md) for what shipped when.

## Updating + uninstalling

| Action | Command |
|---|---|
| Update to latest | Re-run the install one-liner, OR `cd ~/.claude/skills/schengen-master && git pull` |
| Check installed version | `cat ~/.claude/skills/schengen-master/VERSION` |
| Uninstall | `rm -rf ~/.claude/skills/schengen-master` |

## Contributing

If you spot a skill that's wrong, outdated, or could be better — file an issue at https://github.com/torlyai/Schengen-master/issues. Visa rules change; community-sourced corrections are how we keep up.

If you want to add a new skill: copy `SKILL.md.tmpl`, follow the format, and open a PR. Read `ETHOS.md` first — your skill should embody these principles.

If you want to translate a skill to another language: copy `<skill>/SKILL.md` to `i18n/<locale>/<skill>/SKILL.md` and translate. We currently ship English + Simplified Chinese; happy to add more.

## License

MIT. Fork it. Improve it. Make it yours. If it helps you get your visa, that's the win.

---

**Inspired by** [garrytan/gstack](https://github.com/garrytan/gstack) — the gold standard for opinionated AI skill toolkits. We borrowed the architecture (directory-per-skill + ETHOS injection + persona framing + sprint metaphor); the domain (visa applications) is ours.
