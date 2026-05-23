# Changelog

All notable changes to the Schengen-master skills toolkit. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning follows [SemVer](https://semver.org/).

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

## [Planned for v0.2+]
- 26 more skills filling the 36-skill catalog: trip-planning skills, accommodation/translation/apostille, employment-letter, bank-statement-check, more minor skills (birth-cert, school-letter, parent-docs), France-Visas + TLScontact form walkthroughs, booking + appointment-prep + appointment-day, mock interview, recovery skills (track, refusal, first-trip), meta utility (learn, audit-log, vstack-upgrade)
- `countries/france/` knowledge base — fees, centres, consulate-specific details

## [0.1.0] — TBD

First public release. 10 MVP skills covering Schengen-for-France applications, with depth on family-trip scenarios (minor applicants + spouse-sponsored applicants) and the highest-leverage compliance checks (photo, insurance, cover letter, application audit).
