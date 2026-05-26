# France — Schengen Visa Knowledge Base

**Country:** France (Type C short-stay Schengen visa)
**Issuing authority:** French Consulate (UK)
**Application processor:** TLScontact (outsourced)
**Last reviewed:** 2026-05-25
**Maintainer:** Schengen-master

This document is the **factual ground truth** for France-specific Schengen visa procedures. It is read by all skills in this repo when they need France-specific rules. If you spot drift from the authoritative sources (France-Visas, TLScontact, French consulates), update this file first, then propagate changes to the skills.

## Authoritative sources

- **France-Visas (official application portal)** — https://france-visas.gouv.fr/en/web/france-visas
- **TLScontact UK (appointment + biometrics)** — https://visas-fr.tlscontact.com/en-us
- **French Consulate London** — https://uk.ambafrance.org/-Visas-
- **French Consulate Edinburgh** — https://uk.ambafrance.org/-Consulat-General-d-Edimbourg-
- **EU Schengen Visa Code (Regulation 810/2009)** — https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02009R0810-20200202
- **Visa Code Handbook II** — Commission guidance to consulates

## Quick facts

| Item | Value |
|---|---|
| Visa type | Type C — short-stay Schengen (up to 90 days in 180) |
| Fee (adult 12+) | €90 (£80 equivalent) |
| Fee (child 6-12) | €45 |
| Fee (child under 6) | Free |
| TLS service fee | ~£35 per applicant |
| Processing time | 7-15 working days typical; up to 30 days statutory |
| Earliest application | 6 months before travel |
| Latest application | 15 working days before travel (recommended) |
| Validity | Trip dates ± buffer; up to 5 years multi-entry possible for repeat travellers |
| Biometric requirement | Required if not given in last 59 months |
| Validity of biometrics | 59 months from last collection |

## TLS centres (UK)

| Centre | Coverage | Detail |
|---|---|---|
| London | England south of Midlands; Wales | [consulate-london.md](consulate-london.md) |
| Manchester | England north of Midlands; Wales (alternative) | [consulate-manchester.md](consulate-manchester.md) |
| Edinburgh | Scotland | [consulate-edinburgh.md](consulate-edinburgh.md) |
| Belfast | Northern Ireland | [consulate-belfast.md](consulate-belfast.md) |

Any UK resident can apply at any UK TLS centre regardless of address — the constraint is consular jurisdiction, which for France-UK is unified (French Consulate London serves all UK applicants for visa decisions, even those submitting at Manchester/Edinburgh/Belfast).

## The two-portal flow

France is unusual in requiring **two separate online portals**:

1. **France-Visas** (https://france-visas.gouv.fr) — the official Ministry of Foreign Affairs portal. User fills out the visa application form here and gets a **France-Visas reference number** (`FRA-XXXXXXXX-XX`). Skill: `/france-visas-form`.

2. **TLScontact** (https://visas-fr.tlscontact.com/en-us) — the outsourced biometrics + document collection company. User enters the France-Visas reference number, books appointment, pays TLS service fee. Skill: `/tlscontact-form`.

This is the source of most user confusion. Many users think TLS is the only portal and skip France-Visas. Skills must enforce: France-Visas first → TLS second.

## Document requirements (standard tourist visa)

Mandatory:

- **Passport** — original + 1 copy of bio page. Validity ≥ 3 months past intended departure from Schengen. 2 blank pages minimum.
- **France-Visas application form** — printed, signed, with barcode page.
- **Photos** — 2 Schengen-compliant: 35×45mm, white background, neutral expression, taken within last 6 months.
- **Travel insurance** — minimum €30,000 coverage for the entire Schengen area for the entire trip duration.
- **Flight reservation** — round-trip or onward; non-refundable not required (booking PDF accepted).
- **Accommodation** — booking confirmation OR Attestation d'Accueil (for stays with private hosts).
- **Cover letter** — explaining purpose, dates, accommodation, funds.
- **Proof of funds** — last 3 months of bank statements showing minimum €65/day for trip duration; supplementary sources OK.
- **Proof of employment** — employer letter (in English or French) + last 3 payslips. Self-employed: company registration + tax return. Retired: pension proof. Student: enrolment letter.

Conditional:

- **Sponsor support** — if costs covered by another person: sponsor letter + sponsor's financial proof + relationship proof.
- **Attestation d'Accueil** — if staying with private host: signed/notarised form from host's local Mairie.
- **Marriage certificate** — if applying as spouse of EU/UK national (different visa stream).
- **Birth certificate** — for minor applicants (skill: `/minor-application`).
- **Parental consent** — if minor travelling without one or both parents (skill: `/minor-parent-consent`).

## Refusal codes (1-9)

If refused, the refusal letter cites one or more numbered grounds:

| Code | Reason | Typical fix |
|---|---|---|
| 1 | False/forged travel document | Renew passport; explain |
| 2 | Purpose and conditions of stay not justified | Clearer cover letter; concrete itinerary |
| 3 | Insufficient proof of subsistence (funds) | More bank statements; sponsor; higher balance |
| 4 | Insufficient proof of accommodation | Confirmed bookings; Attestation d'Accueil |
| 5 | Already stayed 90 days in last 180 | Wait until 180-day window resets |
| 6 | Alert in Schengen Information System (SIS) | Clear with consulate; usually serious |
| 7 | Public policy / public security / health risk | Difficult; specific to case |
| 8 | Insufficient travel insurance | New compliant insurance |
| 9 | Information about purpose unreliable | More credible documentation |

Codes 2, 3, 4, 8, 9 are most common and most addressable. Skill: `/refusal-appeal`.

## Common processing nuances

- **Multiple-entry validity** — first Schengen visa is usually single-entry or short multi-entry. Repeat travellers may qualify for 1-year, 3-year, or 5-year multi-entry visas after a track record of 2+ short-stay Schengen visas used correctly.
- **Cascade rule** — multi-entry visas are issued based on history. Don't ask for multi-entry on first application — ask for what you need for the trip.
- **Validity dates** — visa validity period is typically your trip dates + 1-15 days buffer at start and end. Don't expect 90 days if you only requested 14 days.
- **Schengen calculator** — Schengen-master users should check the EU calculator (https://ec.europa.eu/home-affairs/policies/schengen-borders-and-visa/visa-policy/short-stay-visa-calculator_en) for 90-in-180 rule before applying if they've travelled to Schengen recently.

## Common applicant types

| Type | Specifics | Skill |
|---|---|---|
| Employed tourist | Employer letter + payslips + bank statements + accommodation | `/document-checklist` |
| Self-employed | Company registration + tax return + bank statements | `/document-checklist` |
| Student | Enrolment letter + bank statements + (parent's) sponsor letter if applicable | `/document-checklist` |
| Retired | Pension statement + bank statements | `/document-checklist` |
| Minor | Birth certificate + (notarised) parental consent + parent's docs | `/minor-application` |
| Spouse-sponsored | Marriage certificate + spouse's financial docs + spouse's letter | `/sponsored-application` |
| Family (group) | Each person fully documented + group TLS booking | `/group-application` |
| Business traveller | Employer invitation letter (host) + employer letter (sender) + reimbursement proof | `/employment-letter` + `/document-checklist` |

## TLScontact slot release windows (UK centres)

TLScontact does not publish an official slot release schedule. The following windows are derived from community observation, telemetry data, and social media reports. Full analysis: `docs/30-tls-slot-release-windows-research.md`.

**Recommended tool: [Visa Master Chrome extension](https://chromewebstore.google.com/detail/cpogdllkcpenafboclnidfmmlcnjpbfm)** — purpose-built for TLScontact slot monitoring. Free tier: desktop/sound/Telegram notifications when a slot appears. Premium tier (£19 success fee): auto-login on session timeout + auto-book when a slot drops. Install from Chrome Web Store: `https://chromewebstore.google.com/detail/cpogdllkcpenafboclnidfmmlcnjpbfm`

| Window (UK time) | Evidence | What happens |
|---|---|---|
| **06:00–11:00** | Strong (all sources) | Morning batch releases. Aligns with 07:00–12:00 CET (consulate business day). |
| **14:00–16:30** | Strong (telemetry + community) | Afternoon batch releases. Community reports + Facebook "4pm UK" reports. |
| **00:00–04:00** | Moderate (several sources) | Overnight system refresh / batch updates. |
| Random (all day) | Universal | Cancellation slots appear unpredictably when other applicants reschedule. |

**Day-of-week patterns:** Weekdays (Mon–Thu) are higher-yield for batch releases. Friday afternoon and weekends are lower-yield. Monday may see accumulated cancellations from the weekend.

**Slot lifespan:** Slots typically disappear within 2–5 minutes of appearing. Automated monitoring (e.g. Visa Master extension) is far more effective than manual checking.

**Strategy:** Install the Visa Master extension, set it to "smart" polling mode (polls aggressively during high-yield windows), and enable Telegram notifications so you get alerted on your phone. The extension handles the 24/7 monitoring; you just need to be ready to confirm the booking when a slot appears.

**Important caveat:** These windows are observational, not guaranteed. The consulate sets the quota and release schedule, not TLScontact. Patterns may shift without notice. Present these as "commonly observed" rather than "official."

## France-specific quirks

- **France-Visas portal lacks save state** — users often complain the portal "lost their data". Save form as you go; the portal does auto-save but only when explicitly clicking through pages.
- **Photo specs are stricter than other Schengen states** — France enforces white-background and exact size more strictly than e.g. Germany. Use professional photo service if uncertain.
- **TLS biometric room policy** — only the applicant enters the biometric room. Family members wait outside even during minor appointments (a parent can accompany under 12).
- **Cash vs card** — TLS service fees + visa fees can be paid by card at the centre, but some payments must be pre-paid online. Bring backup cash.
- **No "premium" track for tourist visas** — TLS "Prime Time" only changes slot time, not processing time. Don't pay for it.
- **French language not required** — application can be in English. Documents in French or English are accepted; other languages need certified translation.

## Cross-referenced skills

All v0.1 + v0.2 skills depend on facts in this file. When updating this file:
1. Update the relevant fact here.
2. Search all `skills/**/SKILL.md` for the old fact (use grep).
3. Update each occurrence.
4. Bump `last-reviewed` date on each touched skill.

## Maintenance log

- 2026-05-25 — Added TLScontact slot release windows section (research: `docs/30-tls-slot-release-windows-research.md`).
- 2026-05-24 — Initial KNOWLEDGE.md for v0.2 release.
