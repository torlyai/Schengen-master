# Schengen-master skills

> Read this in: **English** · [中文](README.zh-CN.md)
>
> Apply for a Schengen visa with a virtual team of nine specialists — trip
> planner, document engineer, accountant, forms specialist, minor
> specialist, sponsor specialist, appointment coordinator, application
> auditor, recovery advisor. All Claude Code slash-commands. All markdown.
> Free, open source, MIT.

**20 skills at v0.2.0** (working towards a 36-skill catalog at v1.0). Designed for **France Schengen short-stay applicants** at v0.x; other Schengen countries land in v1.x.

---

## Install (30 seconds)

Open Claude Code and paste this — Claude does the rest:

```bash
curl -sSL https://raw.githubusercontent.com/torlyai/Schengen-master/main/skills/install.sh | sh
```

That's it. In your next Claude Code session, run `/start-here`.

**Re-run the same command** any time to update to the latest version. The install is idempotent and fast.

**Custom install location:**
```bash
SCHENGEN_SKILLS_DEST=~/some/other/path curl -sSL ...install.sh | sh
```

## Quick start

| You say | Skill runs |
|---|---|
| "I want to apply for a France Schengen visa" | `/start-here` |
| "What documents do I need?" | `/document-checklist` |
| "Check if my photo is OK" | `/photo-check` *(uses vision when you attach an image)* |
| "Is my travel insurance Schengen-compliant?" | `/insurance-check` |
| "Help me write the cover letter" | `/cover-letter` |
| "Draft my employer letter" | `/employment-letter` |
| "Audit my bank statement" | `/bank-statement-check` |
| "Estimate my trip cost" | `/cost-estimate` |
| "I'm applying with my kids" | `/minor-application` |
| "My spouse will sponsor me" | `/sponsored-application` |
| "Help me fill the France-Visas form" | `/france-visas-form` |
| "Walk me through TLScontact" | `/tlscontact-form` |
| "We're a family of 4" | `/group-application` |
| "Am I ready to submit?" | `/audit-application` |
| "I can't find a TLS appointment slot" | `/find-slot` |
| "Help me book the appointment" | `/book-appointment` |
| "What does my TLS status mean?" | `/track-application` |
| "I got refused — what now?" | `/refusal-appeal` |

## The 20 skills (v0.2)

### Trip Planner
| Skill | What it does |
|---|---|
| `/start-here` | Entry-point with 6 forcing questions; routes you to the next skill |

### Document Engineer
| Skill | What it does |
|---|---|
| `/document-checklist` | Personalised document list based on your purpose + family + sponsor situation |
| `/photo-check` | Vision-enabled passport-photo compliance check |
| `/insurance-check` | Travel-insurance certificate compliance against Schengen requirements (€30k+, full cover, repatriation) |
| `/cover-letter` | Drafts a personalised cover letter explaining purpose + return commitment |

### Accountant (visa-only) — *new in v0.2*
| Skill | What it does |
|---|---|
| `/employment-letter` | Drafts compliant employer letter; flags missing fields (salary, role, leave approval) |
| `/bank-statement-check` | Audits 3-month statement against €65/day rule; flags suspicious deposits |
| `/cost-estimate` | Itemised trip-cost breakdown (flights, accommodation, daily spend, insurance, fees) |
| `/financial-checklist` | Consolidated financial-evidence kit; routes to one or more of the above |

### Minor Specialist
| Skill | What it does |
|---|---|
| `/minor-application` | Entry-point for child applicants — birth certs, parent consent, school letters, parent docs |
| `/minor-parent-consent` | Consent letter when one or both parents are NOT travelling |

### Sponsor Specialist
| Skill | What it does |
|---|---|
| `/sponsored-application` | Spouse / parent / friend / employer sponsorship — adapts to sponsor type |

### Forms Specialist — *new in v0.2*
| Skill | What it does |
|---|---|
| `/france-visas-form` | Page-by-page walkthrough of the France-Visas portal |
| `/tlscontact-form` | TLScontact account creation + reference number linkage + appointment flow setup |
| `/group-application` | Family/group structural rules (1 France-Visas per person, 1 TLS team ID, 1 slot) |

### Appointment Coordinator
| Skill | What it does |
|---|---|
| `/find-slot` | TLScontact slot-finding strategy + integration with the [Visa Master extension](https://chromewebstore.google.com/detail/cpogdllkcpenafboclnidfmmlcnjpbfm) |
| `/book-appointment` | Full booking-mechanics walkthrough; centre selection, slot tips, add-on advice, on-the-day checklist — *new in v0.2* |

### Application Auditor
| Skill | What it does |
|---|---|
| `/audit-application` | Pre-submission audit; reads everything, flags inconsistencies + gaps + weak points |

### Recovery Advisor — *new in v0.2*
| Skill | What it does |
|---|---|
| `/track-application` | TLS tracker status decoder + realistic timeline + escalation triggers |
| `/refusal-appeal` | Interprets refusal codes 1-9; drafts appeal letter or recommends re-application |

## France knowledge base — *new in v0.2*

`countries/france/` contains the single source of truth for France-specific facts (fees, processing time, refusal codes, common quirks) plus per-consulate detail for London, Manchester, Edinburgh and Belfast.

## What's coming next (v0.3 → v1.0)

16 more skills to reach the full 36-skill catalog: trip-planning (`/plan-trip`, `/itinerary-builder`, `/decide-visa-type`, `/timeline-planner`), more document skills (`/accommodation-verify`, `/translate-doc`, `/apostille`), more minor skills (`/minor-birth-certificate`, `/minor-school-letter`, `/minor-parent-docs`), appointment-day prep (`/appointment-prep`, `/appointment-day`, `/mock-interview`), post-decision (`/first-trip`), and meta-utility (`/learn`, `/audit-log`, `/vstack-upgrade`). Plus additional `countries/*` knowledge bases for Germany, Italy, Spain, Netherlands.

See [CHANGELOG.md](CHANGELOG.md).

## Related products

| Product | Role | Where |
|---|---|---|
| **Visa Master Chrome extension** | Watches TLScontact for an open appointment slot — Free tier notifies you, Premium tier auto-books. | [Chrome Web Store](https://chromewebstore.google.com/detail/cpogdllkcpenafboclnidfmmlcnjpbfm) |
| **Schengen-master public repo** | This repo — distribution channel for the extension + the application templates + these skills | github.com/torlyai/Schengen-master |
| **Visa-application templates** | Print-ready templates the skills reference (cover letter, document checklist, photo spec, etc.) | [`docs/templates/visa-application/`](../docs/templates/visa-application/) |

## Philosophy

These skills are built on the **[Schengen-master Ethos](ETHOS.md)** — 12 principles that shape how every skill thinks, recommends, and advises. Read it if you're contributing or want to understand why a skill made a specific recommendation.

Key principles:
- **The application is the audit trail.** Be ruthlessly consistent across documents.
- **The cheapest effort is the one you don't repeat.** Front-load the audit.
- **The boring documents matter most.** Bank statements + insurance + employment letter > cover letter polish.
- **Don't lie. Ever.** The VIS database cross-references everything.
- **We are templates, not lawyers.** Always confirm against official sources.

## Updating + uninstalling

| Action | Command |
|---|---|
| Update to latest | Re-run the install one-liner, OR `cd ~/.claude/skills/schengen-master && git pull` |
| Check installed version | `cat ~/.claude/skills/schengen-master/VERSION` |
| Uninstall | `rm -rf ~/.claude/skills/schengen-master` |

## Contributing

If you spot a skill that's wrong, outdated, or could be better — file an issue at https://github.com/torlyai/Schengen-master/issues. Visa rules change; community-sourced corrections are how we keep up.

If you want to add a new skill: copy `SKILL.md.tmpl`, follow the format, and open a PR. Read `ETHOS.md` first — your skill should embody these principles.

## License

MIT. Fork it. Improve it. Make it yours. If it helps you get your visa, that's the win.

---

**Inspired by** [garrytan/gstack](https://github.com/garrytan/gstack) — the gold standard for opinionated AI skill toolkits. We borrowed the architecture; the domain (visa applications) is ours.
