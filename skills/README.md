# Schengen-master skills

> Read this in: **English** · [中文](README.zh-CN.md)
>
> Apply for a Schengen visa with a virtual team of nine specialists — trip
> planner, document engineer, accountant, forms specialist, minor
> specialist, sponsor specialist, appointment coordinator, application
> auditor, recovery advisor. All Claude Code slash-commands. All markdown.
> Free, open source, MIT.

10 skills at v0.1.0 (working towards a 36-skill catalog at v1.0). Designed for **France Schengen short-stay applicants** at v0.1; other Schengen countries land in v1.x.

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
| "I'm applying with my kids" | `/minor-application` |
| "My spouse will sponsor me" | `/sponsored-application` |
| "Am I ready to submit?" | `/audit-application` |
| "I can't find a TLS appointment slot" | `/find-slot` |

## The 10 skills (v0.1)

| Skill | Persona | What it does |
|---|---|---|
| `/start-here` | Trip Planner | Entry-point with 6 forcing questions; routes you to the next skill |
| `/document-checklist` | Document Engineer | Personalised document list based on your purpose + family + sponsor situation |
| `/photo-check` | Document Engineer | Vision-enabled passport-photo compliance check |
| `/insurance-check` | Document Engineer | Travel-insurance certificate compliance against Schengen requirements (€30k+, full cover, repatriation) |
| `/cover-letter` | Document Engineer | Drafts a personalised cover letter explaining purpose + return commitment |
| `/minor-application` | Minor Specialist | Entry-point for child applicants — birth certs, parent consent, school letters, parent docs |
| `/minor-parent-consent` | Minor Specialist | Consent letter when one or both parents are NOT travelling |
| `/sponsored-application` | Sponsor Specialist | Spouse / parent / friend / employer sponsorship — adapts to sponsor type |
| `/audit-application` | Application Auditor | Pre-submission audit; reads everything, flags inconsistencies + gaps + weak points |
| `/find-slot` | Appointment Coordinator | TLScontact slot-finding strategy + integration with the [Visa Master extension](https://chromewebstore.google.com/detail/cpogdllkcpenafboclnidfmmlcnjpbfm) |

## What's coming next (v1.0)

26 more skills filling out the full 36-skill catalog: trip-planning skills (`/plan-trip`, `/itinerary-builder`, `/decide-visa-type`, `/timeline-planner`), more document skills (`/accommodation-verify`, `/translate-doc`, `/apostille`), financial-evidence skills (`/employment-letter`, `/bank-statement-check`, `/cost-estimate`), more minor skills (`/minor-birth-certificate`, `/minor-school-letter`, `/minor-parent-docs`), forms walkthroughs (`/france-visas-form`, `/tlscontact-form`, `/group-application`), appointment-day prep (`/book-appointment`, `/appointment-prep`, `/appointment-day`), audit + mock interview (`/mock-interview`), recovery (`/track-application`, `/refusal-appeal`, `/first-trip`), and meta-utility (`/learn`, `/audit-log`).

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
