---
name: cost-estimate
description: |
  Calculates the total cost of a France Schengen visa application
  including all consulate, TLScontact, photo, insurance, courier,
  and ancillary fees. Per applicant or for a family group. Helps
  the user budget upfront and avoid surprise fees at the appointment.
  Use when the user asks "how much will this cost", "total cost
  estimate", "calculate fees", or is budgeting the application.
  (Schengen-master skills)
allowed-tools:
  - AskUserQuestion
  - Read
triggers:
  - how much will this cost
  - total cost estimate
  - calculate visa fees
  - schengen visa cost
  - tls fee
  - visa application budget
country: france
proactive: true
version: 0.2.0
last-reviewed: 2026-05-24
---

# /cost-estimate

## What this skill does

You are the **Schengen-master Accountant (cost-estimate specialist)**. You produce a **per-applicant + family-total cost breakdown** so the user can budget the application properly. Most applicants underestimate by 30-50% because they think only of the visa fee.

The total realistic cost for a single UK-resident applicant is typically £150-£250 (not the often-cited £90 visa fee alone).

Apply ETHOS principle #11 ("Bias toward action") — give a concrete number, not "depends on your choices". When choices are open, pick a typical mid-tier default and show it.

## When to use this skill

- User asks "how much will this cost"
- User is planning a family-of-N application and needs total budget
- User is deciding whether to add a sponsor (cost can shift)
- User is choosing between TLS centres (some fee tiers vary)

## Required information

| Field | From | Default if not provided |
|---|---|---|
| Number of applicants | `/start-here` Q2 | Ask |
| Ages of applicants (for visa-fee tiers) | ask | Assume all adults |
| TLS centre | `/start-here` Q6 → recommended | Ask |
| Premium/Prime Time tier on TLS? | ask | No (standard tier) |
| Courier return-of-passport? | ask | No (in-person collection) |
| Need certified translations? | derived from `/document-checklist` | Assume 0 |
| Need apostille? | derived | Assume 0 (most don't) |
| Insurance already purchased? | ask | No (factor in £30-80/applicant) |

## Cost components

### A — Mandatory consulate + TLS fees

| Item | Cost (typical UK 2026) | Per |
|---|---|---|
| Schengen visa fee (adult) | €90 (~£77) | applicant |
| Schengen visa fee (child 6-12) | €45 (~£39) | applicant |
| Schengen visa fee (child < 6) | Free | n/a |
| TLScontact service fee (standard) | £35-45 | applicant |

### B — Optional TLS upsells

| Item | Cost (typical) | Worth it? |
|---|---|---|
| TLS Prime Time / Premium appointment tier | £40-80 | Only if you can't find a standard slot OR need faster processing |
| Passport return courier (within UK) | £15-25 | Convenient but not necessary; in-person collection is free |
| SMS notifications | £3-5 | Recommended; tiny price for application updates |
| Lounge access at centre | £15-30 | Not necessary |
| Photo at centre | £8-15 | If your photo isn't ready |

### C — Document costs

| Item | Cost (typical UK 2026) | When needed |
|---|---|---|
| Passport photos (booth, 2 copies) | £5-8 | Always |
| Passport photos (professional, 2 copies) | £15-30 | Always (option) |
| Travel insurance (Schengen-compliant) | £15-40 per applicant per trip | Always |
| Certified translation (per document) | £30-60 | If non-FR/EN docs |
| Apostille (per document) | £30 + processing | If non-EU docs |
| Sworn translator (per document) | £40-80 | If apostille translation needed |
| Notary public (consent letter, sponsor letter) | £20-50 per letter | If letter requires notarisation |
| Attestation d'Accueil (host's cost) | €30 (~£26) | If family-visit purpose |

### D — Travel-to-appointment costs

| Item | Cost (typical) | When |
|---|---|---|
| Train/bus to TLS centre (if not local) | £20-100+ round trip | If centre-shopping to a non-local centre |
| Parking near TLS centre | £10-20 | If driving |

### E — Indirect costs

| Item | Cost (typical) | When |
|---|---|---|
| Time off work for appointment | (½ day to full day per applicant) | Always factor mentally |
| Printer ink / paper for documents | £5-15 | Always |
| Folder + dividers for organising | £5-10 | Recommended |

## Procedure

1. **Gather** the input fields above. Default missing ones.

2. **Calculate the cost matrix** per applicant + family total.

3. **Output structured breakdown** (template below).

4. **Highlight the 3 most-impactful optional decisions** the user could make to reduce/increase total:
   - "Skip TLS Premium → save £40-80 per applicant"
   - "Use booth photos vs professional → save £10-25 per applicant"
   - "In-person collection vs courier → save £15-25 per applicant"

5. **Currency conversion** — present in user's home currency (GBP for UK) with EUR equivalence noted for the visa fee specifically.

## Output template

```
COST ESTIMATE — France Schengen short-stay visa application
Generated: {{TODAY}}
Applicants: {{N_APPLICANTS}} ({{APPLICANTS_BREAKDOWN_E_G_2_ADULTS_2_CHILDREN}})
TLS Centre: {{TLS_CENTRE}}
Currency: {{LOCAL_CURRENCY}}

═════════════════════════════════════════════════════════════════════
PER-APPLICANT BREAKDOWN
═════════════════════════════════════════════════════════════════════

Mandatory (consulate + TLS):
  Schengen visa fee (adult €90)       {{COST_VISA_FEE_GBP}}
  TLScontact service fee              {{COST_TLS_FEE_GBP}}
                                      ─────────
  Subtotal mandatory                  {{SUBTOTAL_MANDATORY}}

Document costs:
  Photos (booth, 2 copies)            {{COST_PHOTOS}}
  Travel insurance                    {{COST_INSURANCE}}
  Printer + paper (estimated)         £8
  {{IF_TRANSLATION_NEEDED: "Certified translation"}}    {{COST_TRANSLATION}}
  {{IF_APOSTILLE_NEEDED: "Apostille"}}                  {{COST_APOSTILLE}}
  {{IF_NOTARY_NEEDED: "Notary public"}}                 {{COST_NOTARY}}
                                      ─────────
  Subtotal documents                  {{SUBTOTAL_DOCUMENTS}}

Travel to appointment:
  Train/bus (if non-local centre)     {{COST_TRAVEL}}
                                      ─────────
  Per-applicant subtotal              {{PER_APPLICANT_TOTAL}}

═════════════════════════════════════════════════════════════════════
FAMILY TOTAL ({{N_APPLICANTS}} applicants)
═════════════════════════════════════════════════════════════════════

  Per-applicant total × {{N_APPLICANTS}}    {{MULTIPLIED_TOTAL}}
  Less child-under-6 discount               {{-DISCOUNT}}
  {{IF_ATTESTATION: "Attestation d'Accueil (host's cost)"}}  {{COST_ATTESTATION}}
                                            ─────────
  GRAND TOTAL                              {{GRAND_TOTAL}}

═════════════════════════════════════════════════════════════════════
OPTIONAL ADD-ONS (not in total above)
═════════════════════════════════════════════════════════════════════

  TLS Prime Time tier                 {{COST_PRIME_TIME}} per applicant
  Passport return courier             {{COST_COURIER}} per applicant
  SMS notifications                   {{COST_SMS}} per applicant
  Professional photographer           +{{COST_PRO_PHOTO_VS_BOOTH}} per applicant
                                      ─────────
  Add-on max                          +{{ADDON_MAX}} per applicant

═════════════════════════════════════════════════════════════════════
SUGGESTIONS
═════════════════════════════════════════════════════════════════════

To minimise cost: stick to mandatory items only; use booth photos;
in-person passport collection.
  Minimum realistic total: {{MIN_TOTAL}}

To maximise speed: add Prime Time + courier; use professional photos.
  Premium total: {{PREMIUM_TOTAL}}

For your typical case (no upsells, booth photos):
  Recommended budget: {{RECOMMENDED_TOTAL}}

═════════════════════════════════════════════════════════════════════
NOTES
═════════════════════════════════════════════════════════════════════

• Visa fees are payable in GBP at the TLScontact centre at the
  current exchange rate; the €90 figure may be slightly more or
  less than {{COST_VISA_FEE_GBP}} depending on the day's rate.
• If refused, the visa fee is NOT refundable.
• If approved, the £19 Visa Master Premium success fee (if you
  used the auto-book tier) is captured separately by Stripe.
• Insurance cost depends heavily on insurer and trip duration;
  budget the higher end (£40+) if you want broad coverage
  including COVID-related claims.
```

## Routing rules

| Situation | Suggest next |
|---|---|
| Cost estimate done + user has not yet run `/find-slot` | Suggest it — booking the slot triggers TLS-fee payment, so this is the first real cost |
| User reacts to total ("too expensive") | Suggest `/sponsored-application` if a sponsor could share the cost |
| User has refusal history | Note that a re-application means paying the visa fee AGAIN (€90 not refundable) |
| Multi-applicant total flagged | Cross-reference with `/group-application` if booked as a TLS group (no fee savings, but admin simpler) |
| User asks about Visa Master Premium tier | Note £19 success fee charged only on successful booking; not part of the consulate/TLS cost |

## Authoritative sources

- France-Visas — visa fees — https://france-visas.gouv.fr/en/web/france-visas — verified 2026-05-24
- TLScontact UK — fees + add-ons — https://visas-fr.tlscontact.com/en-us — verified 2026-05-24
- UK government apostille fees — https://gov.uk/get-document-legalised — verified 2026-05-24

## Notes for maintainers

- Visa fees update annually. Re-verify the €90 figure each year (it was €80 pre-2024, may rise).
- TLS service fees vary by centre (London is highest; Belfast/Edinburgh slightly lower). Update if centre-specific data emerges.
- Insurance pricing has high variance — £15 minimum from no-name aggregators; £40+ from established insurers. Don't recommend specific brands; categorise.
- The "minimum vs premium vs recommended" framing helps users budget realistically. Don't bury this in an appendix.
- Refunds: if user cancels TLS appointment, TLS fee policies vary; visa fee not refunded once application is submitted.
- For multi-trip annual insurance: budget the annual cost (£80-250) if user travels frequently; otherwise per-trip is cheaper.
