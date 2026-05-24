# Changelog

All notable changes to the Schengen-master skills toolkit. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning follows [SemVer](https://semver.org/).

## [1.0.0] — 2026-05-24

**Major release. The full 36-skill catalogue is complete.** All 9 personas have their full skill complement plus the France country knowledge base. EN + zh-CN parallel for every skill.

### Added — 12 new skills (each EN + zh-CN parallel)

**Document Engineer — 3 new skills**
- `/accommodation-verify` — night-by-night accommodation audit; flags gap nights, name mismatches, Attestation-needed cases
- `/translate-doc` — certified-translation requirements + recommended translators (ATC, ITI, NRPSI) + cost/time expectations
- `/apostille` — UK FCDO + foreign apostille processes; Hague vs non-Hague handling; ordering with translation

**Minor Specialist — 3 new skills**
- `/minor-birth-certificate` — long-form vs short-form; foreign-issued cert handling; adopted-child special cases
- `/minor-school-letter` — UK school absence-letter template + verification checklist
- `/minor-parent-docs` — accompanying parent's passport + UK status + financial evidence audit; cross-document consistency check

**Appointment Coordinator — 2 new skills**
- `/appointment-prep` — 24-hour-before checklist (documents printed + photos physical + payment cards + transport planned)
- `/appointment-day` — brief morning-of sanity sweep + during-appointment guidance + post-appointment steps

**Application Auditor — 1 new skill**
- `/mock-interview` — practice consular interview with question bank (purpose, ties, financial, sponsor, refusal-reapp) + framing principles

**Recovery Advisor — 1 new skill**
- `/first-trip` — post-approval first-Schengen-entry guidance; visa sticker verification, border-control prep, 90/180 rule, clean-record building

**Meta Utility — 3 new skills (new persona)**
- `/learn` — opt-in cross-session memory; privacy-first local JSON; user controls what's saved + can delete
- `/audit-log` — session-local action history; "where are we?" digest
- `/vstack-upgrade` — self-update toolkit; idempotent git-pull-based

### Catalogue summary

| Persona | Skill count | Status |
|---|---|---|
| Trip Planner | 5 | Complete |
| Document Engineer | 7 | Complete |
| Accountant (visa-only) | 4 | Complete |
| Minor Specialist | 5 | Complete |
| Sponsor Specialist | 1 | Complete |
| Forms Specialist | 3 | Complete |
| Appointment Coordinator | 4 | Complete |
| Application Auditor | 2 | Complete |
| Recovery Advisor | 3 | Complete |
| Meta Utility | 3 | Complete |
| **Total** | **36 skills** | **v1.0** |

### Changed
- README + README.zh-CN updated to reflect full catalogue
- Skill count badge updated 24 → 36
- v1.x roadmap shifts focus from "skill catalogue completion" to "country expansion" and "real-applicant validation"

### Migration from 0.3.0
Re-run the install one-liner — sparse-checkout picks up the new skills automatically:
```bash
curl -sSL https://raw.githubusercontent.com/torlyai/Schengen-master/main/skills/install.sh | sh
```
No breaking changes to existing skills.

### What's next (v1.x — beyond catalogue)
- **Country expansion** — Italy, Spain, Germany, Netherlands (each a copy of France with country-specific KNOWLEDGE.md + per-consulate detail)
- **Real-applicant validation** — dogfood + community feedback to refine skill outputs
- **`/vstack-doctor`** — sanity-check script that validates every skill's frontmatter, routes, external links
- **Quarterly review cadence** — re-verify each skill against authoritative sources every 3 months
- **Native zh-CN reviewer** — validate Chinese translations for natural phrasing

## [0.3.0] — 2026-05-24

Third public release. Completes the Trip Planner persona with the remaining 4 skills. Total: **24 skills** (EN + zh-CN parallel). README restructured with marketingskills-style architecture diagram showing how skills relate.

### Added — 4 new skills (each EN + zh-CN parallel)

**Trip Planner — completes the persona (4 new skills + existing /start-here)**
- `/plan-trip` — iterative trip-planning wizard (destinations, dates, group composition, budget) with consular-credibility checks built in
- `/itinerary-builder` — day-by-day itinerary generator with accommodation cross-check, season + group + pace validation; output attachable to France-Visas
- `/decide-visa-type` — Type A/C/D + single/multi-entry + purpose + responsible-consulate decision tree
- `/timeline-planner` — backwards-planner from trip date; computes critical path (apostille / Attestation / passport renewal lead times); GO / TIGHT / NO-GO verdict

### Changed
- README.md + README.zh-CN.md restructured with **"What are skills?"** + **"How skills work together"** sections including an ASCII architecture diagram (inspired by [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills)) showing `/start-here` as foundation and 8 persona branches converging on `/audit-application`
- 24-skill catalogue index now grouped by persona with cross-reference legend

### Migration from 0.2.0
Re-run the install one-liner — sparse-checkout picks up the new skills automatically:
```bash
curl -sSL https://raw.githubusercontent.com/torlyai/Schengen-master/main/skills/install.sh | sh
```
No breaking changes to v0.1 or v0.2 skills.

## [0.2.0] — 2026-05-24

Second public release. Adds 10 more skills covering Accountant, Forms Specialist, Recovery Advisor personas and extends the Appointment Coordinator. Total: **20 skills** (EN + zh-CN parallel). Adds the `countries/france/` knowledge base.

### Added — 10 new skills (each EN + zh-CN parallel)

**Accountant (visa-only) — 4 skills**
- `/employment-letter` — drafts compliant employer letter (UK + multinational templates); flags missing salary/role/leave-approval
- `/bank-statement-check` — audits 3-month statement for €65/day rule, suspicious deposits, name match
- `/cost-estimate` — itemised trip-cost breakdown (flights, accommodation, daily spend, insurance, visa fees)
- `/financial-checklist` — consolidated financial-evidence kit; routes to one or more of the above

**Forms Specialist — 3 skills**
- `/france-visas-form` — page-by-page walkthrough of the France-Visas portal; warns about common typos that cause TLS mismatch
- `/tlscontact-form` — TLScontact account creation + reference number linkage + appointment flow setup
- `/group-application` — family/group structural rules (1 France-Visas per person, 1 TLS team ID, 1 slot)

**Recovery Advisor — 2 skills**
- `/refusal-appeal` — interprets refusal codes 1-9; drafts appeal letter or recommends re-application
- `/track-application` — TLS tracker status decoder + realistic timeline + escalation triggers

**Appointment Coordinator — 1 skill (extends v0.1's `/find-slot`)**
- `/book-appointment` — full booking-mechanics walkthrough; centre selection, slot tips, add-on advice, on-the-day checklist

### Added — France knowledge base
- `countries/france/KNOWLEDGE.md` — single source of truth for France-specific facts (fees, processing time, refusal codes, common quirks)
- `countries/france/consulate-london.md` — TLS London centre detail (hours, address, slot patterns, logistics)
- `countries/france/consulate-manchester.md` — TLS Manchester centre detail
- `countries/france/consulate-edinburgh.md` — TLS Edinburgh centre detail
- `countries/france/consulate-belfast.md` — TLS Belfast centre detail

### Changed
- README + README.zh-CN updated to reflect 20-skill catalog and 4 new personas/extensions

### Migration from 0.1.0
Re-run the install one-liner — sparse-checkout will pick up the new skills automatically:
```bash
curl -sSL https://raw.githubusercontent.com/torlyai/Schengen-master/main/skills/install.sh | sh
```
No breaking changes to v0.1 skills.

## [0.1.0] — 2026-05-24

First public release. The full 10-skill MVP catalog for France Schengen short-stay visa applications.

### Foundation
- `ETHOS.md` — 12 principles every skill embodies
- `SKILL.md.tmpl` — boilerplate for new skills
- `install.sh` — sparse-checkout install script
- `VERSION`, `CHANGELOG.md`, `README.md`, `README.zh-CN.md`

### 10 MVP skills (each EN + zh-CN parallel)

**Trip Planner**
- `/start-here` — 6-forcing-question entry-point; routes to next 3 skills based on scenario

**Document Engineer**
- `/document-checklist` — personalised printable checklist with purpose/sponsor/minor/UK-resident overlays
- `/photo-check` — vision-enabled passport photo compliance (35×45mm, white bg, no glasses, ≤6mo)
- `/insurance-check` — Schengen insurance certificate compliance (€30k+, EUR, repatriation, full duration)
- `/cover-letter` — drafts personalised cover letter ≤300 words; variants by purpose

**Minor Specialist**
- `/minor-application` — entry-point for child applicants; covers birth cert, parent docs, school letter
- `/minor-parent-consent` — drafts notarised consent letter when one/both parents not travelling

**Sponsor Specialist**
- `/sponsored-application` — generic sponsor handler (spouse/parent/friend/employer); drafts support letter

**Application Auditor**
- `/audit-application` — 5-layer pre-submission gate; PASS/HOLD/FAIL verdict + recommended fixes

**Appointment Coordinator**
- `/find-slot` — slot-finding strategy; recommends Visa Master extension; centre-shopping advice

### Personas (9)
Trip Planner · Document Engineer · Accountant (visa-only) · Minor Specialist · Sponsor Specialist · Forms Specialist · Appointment Coordinator · Application Auditor · Recovery Advisor

### Languages
English (default) + Simplified Chinese (zh-CN) parallel files at `i18n/zh-CN/<skill>/SKILL.md`

### Install
```bash
curl -sSL https://raw.githubusercontent.com/torlyai/Schengen-master/main/skills/install.sh | sh
```

## [Planned for v0.3+]
- 16 more skills filling the 36-skill catalog: trip-planning skills (`/plan-trip`, `/itinerary-builder`, `/decide-visa-type`, `/timeline-planner`), more document skills (`/accommodation-verify`, `/translate-doc`, `/apostille`), more minor skills (`/minor-birth-certificate`, `/minor-school-letter`, `/minor-parent-docs`), appointment-day prep (`/appointment-prep`, `/appointment-day`, `/mock-interview`), post-decision (`/first-trip`), and meta-utility (`/learn`, `/audit-log`, `/vstack-upgrade`)
- More `countries/*` knowledge bases — Germany, Italy, Spain, Netherlands
