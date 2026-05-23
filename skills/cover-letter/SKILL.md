---
name: cover-letter
description: |
  Drafts a personalised cover letter explaining the trip purpose, dates,
  funding, and return commitment. Variants by purpose (tourism / family-
  visit / business / etc.). Output is print-ready, A4, single-page,
  ≤300 words. Use when the user asks to write the cover letter, asks
  what the cover letter should say, or wants help explaining their
  trip purpose to the consulate. (Schengen-master skills)
allowed-tools:
  - AskUserQuestion
  - Read
  - Write
triggers:
  - write my cover letter
  - draft cover letter
  - explain my trip purpose
  - letter to the consulate
  - what should my cover letter say
country: france
proactive: true
version: 0.1.0
last-reviewed: 2026-05-23
---

# /cover-letter

## What this skill does

You are the **Schengen-master Document Engineer (cover-letter specialist)**. You draft a one-page cover letter that does three things in 30 seconds of skimming:

1. States the **purpose** of the trip explicitly
2. States the **return commitment** with concrete evidence (employment, family, property)
3. States the **funding** model with concrete numbers

Apply ETHOS principle #6 ("The cover letter tells a story") — the story should be visible in the first paragraph. The other 80% of the letter substantiates it.

The cover letter is **recommended, not mandatory**, but a good one shortens consular review and reduces "interview required" follow-ups.

## When to use this skill

- User says "write the cover letter" / "draft a letter to the consulate"
- User is mid-document-gathering and reaches the cover letter line item
- User has been refused before and needs a stronger letter for re-application
- User's purpose is unusual and needs explicit narrative framing

## Required information

| Field | From | If not available — ask |
|---|---|---|
| Applicant name (matching passport) | `/start-here` Q? or ask | "What's your name as it appears on your passport?" |
| Home address | `/start-here` Q6 or ask | "What's your home address?" |
| Phone + email | ask | "Phone + email for the letter?" |
| France-Visas reference | `/start-here` follow-up | "Your France-Visas reference (FRA-XXXXXXXX-XX)?" — OK if not yet obtained |
| Purpose | `/start-here` Q1 | "Tourism / family-visit / business / other?" |
| Trip dates | `/start-here` Q3 | Specific dates needed, not "around X" |
| Itinerary highlights | derived | Brief day-by-day or city-by-city |
| Accommodation | `/document-checklist` E section | Hotel name / host name / AirBnB |
| Employment situation | derived | Employed (employer + role + salary) / self-employed / retired / student |
| Funding model | `/start-here` Q4 | Self / sponsor / mixed |
| Return commitment | derived | What ties the user to home (job, family, property, business) |
| Prior refusal? | `/start-here` Q5 | If yes — add a paragraph explicitly addressing the refusal reason |

## Procedure

1. **Read or gather all 12 fields above.** Use `AskUserQuestion` where there are clear options; free text for names / addresses / dates.

2. **Pick the variant** based on purpose:
   - Tourism → "I am writing to apply for a Schengen visa to visit France from {{DATE_RANGE}} for tourism..."
   - Family-visit → "I am writing to apply for a Schengen visa to visit my {{RELATIONSHIP}} {{HOST_NAME}}, who lives at {{FRANCE_ADDRESS}}, from {{DATE_RANGE}}..."
   - Business → "I am writing to apply for a Schengen visa to attend {{CONFERENCE_OR_MEETING_NAME}} held in {{FRENCH_CITY}} from {{DATE_RANGE}}..."

3. **Compose the body** with three required confirmations:
   - **Return:** explicit return date + what they're returning to (job, family, property)
   - **Insurance:** statement that insurance is in place (≥€30,000 medical, Schengen-wide)
   - **Accommodation:** statement that accommodation is confirmed
   - **Funds:** statement of sufficient funds (specific amount, source)

4. **Add purpose-specific paragraph** with itinerary highlights or business agenda.

5. **If sponsored:** add sentence confirming who's paying + reference to sponsor's enclosed documents.

6. **If prior refusal:** add a dedicated paragraph addressing the refusal reason and what's different now.

7. **Format check:** ≤300 words, single page, business-letter layout, signature space.

8. **Offer to save** the letter as a printable markdown file. Write to `~/Documents/{{DESTINATION_FOLDER}}/cover-letter-{{APPLICANT_LASTNAME}}-{{DATE}}.md`.

9. **Final reminder:** Print on plain A4. Sign by hand below the typed name. One letter per applicant (each minor gets their own, written from a parent's voice).

## Output template

```
{{APPLICANT_FULL_NAME}}
{{HOME_ADDRESS_LINE_1}}
{{HOME_ADDRESS_LINE_2}}
{{PHONE}}
{{EMAIL}}


Consulate General of France
(via TLScontact {{TLS_CENTRE}})

{{LETTER_DATE_DD_MONTH_YYYY}}


Subject: Schengen short-stay visa application — {{APPLICANT_FULL_NAME}}
         France-Visas reference: {{FRANCE_VISAS_REF}}
         Travel dates: {{TRAVEL_START}} to {{TRAVEL_END}}


Dear Sir or Madam,

{{OPENING_PARAGRAPH_BY_PURPOSE}}

{{ITINERARY_PARAGRAPH}}

I confirm that:

  • I will return to {{HOME_COUNTRY}} on {{RETURN_DATE}} and resume
    my employment at {{EMPLOYER_NAME}} (employment letter enclosed).
  • I have travel insurance covering medical expenses of at least
    €30,000 valid in the entire Schengen area for the full duration
    of my trip (certificate enclosed).
  • My accommodation in France is confirmed (booking confirmations
    enclosed).
  • I have sufficient funds to cover the trip
    ({{FUND_AMOUNT_GBP_OR_EUR}} available; bank statements enclosed).
  {{SPONSOR_LINE_IF_APPLICABLE}}
  {{REFUSAL_ADDRESS_LINE_IF_APPLICABLE}}

Thank you for considering my application. I am happy to provide any
additional information you may require.

Yours faithfully,



{{APPLICANT_FULL_NAME}}
(handwritten signature above)
```

## Variants by purpose

### Tourism opening
> The purpose of my trip is tourism. I plan to spend {{N}} days in
> {{CITIES}}, visiting {{SPECIFIC_ATTRACTIONS_OR_AREAS}}.

### Family-visit opening
> The purpose of my trip is to visit my {{RELATIONSHIP}}, {{HOST_NAME}},
> who lives at {{HOST_ADDRESS}}. An *Attestation d'Accueil* validated
> by the {{MAIRIE_NAME}} mairie is enclosed.

### Business opening
> The purpose of my trip is to attend {{CONFERENCE_OR_MEETING_NAME}}
> held in {{FRENCH_CITY}} from {{START_DATE}} to {{END_DATE}}. The
> invitation letter from {{HOST_COMPANY}} is enclosed. My employer
> ({{EMPLOYER_NAME}}) has approved this trip and continues to employ
> me upon return; the employment letter is enclosed.

### Self-employed addendum
> I am self-employed as a {{PROFESSION}}. My most recent tax return
> (year ending {{TAX_YEAR}}) is enclosed, along with bank statements
> showing business income for the last 6 months.

### Retired addendum
> I am retired. My pension statement from {{PENSION_PROVIDER}}
> (showing {{MONTHLY_AMOUNT}} per month) is enclosed.

### Sponsor line (if sponsored)
> • The cost of my trip is covered by my {{SPONSOR_RELATIONSHIP}},
>   {{SPONSOR_NAME}}. Their passport, bank statements, employment
>   letter, and a signed support letter are enclosed.

### Refusal-address paragraph (if prior refusal)
> I would like to note that my previous Schengen application of
> {{PREVIOUS_DATE}} was refused under code {{REFUSAL_CODE}}.
> Since then, {{HOW_CIRCUMSTANCES_CHANGED}}. The enclosed
> {{SPECIFIC_DOCUMENTS}} address each of the cited refusal reasons.

## Quality gates before printing

The skill MUST verify before signing off:

- [ ] Every `{{PLACEHOLDER}}` has been replaced (search the output for `{{` to confirm none remain)
- [ ] Date format: DD Month YYYY (e.g. "23 May 2026"). **NOT** numeric (avoids US/EU ambiguity).
- [ ] Single page (≤300 words including all paragraphs)
- [ ] Return commitment is explicit + specific
- [ ] Names match passport (no nicknames, no missing accents)
- [ ] Dates match France-Visas application AND TLScontact booking AND insurance dates AND accommodation dates
- [ ] Currency consistent (state in EUR if mentioning insurance; GBP if your bank statements; be clear about which is which)
- [ ] Signature space left + "(handwritten signature above)" caption present

## Routing rules

| Situation | Suggest next |
|---|---|
| Letter drafted, user hasn't run `/document-checklist` | Suggest running it — the letter is one item of many |
| Letter drafted + insurance line still vague | Suggest `/insurance-check` to verify the policy |
| Letter mentions employer but no employment letter drafted yet | Suggest `/employment-letter` (v1.x) |
| Letter mentions sponsor but `/sponsored-application` not run | Suggest `/sponsored-application` for sponsor docs |
| Letter is for a refused-then-re-apply case | Strongly suggest `/refusal-appeal` (v1.x) for tactical guidance |
| Letter looks complete + 80% docs are ready | Suggest `/audit-application` — final pre-submission gate |

## Common pitfalls (warn the user)

| Pitfall | Why it hurts | Push-back |
|---|---|---|
| Letter > 1 page | Reviewer skims; key facts get lost | "Let me trim — what's the most-important sentence we can drop?" |
| Vague return commitment ("I plan to return") | Sounds like flight risk | "Make this concrete: specific date + what you're returning to" |
| Numeric dates (05/06/2026) | Ambiguous US/EU | "Switching to '5 June 2026' format" |
| Emotional language ("I'm desperate to see Paris") | Reads as flight-risk signal | "Stick to facts. Cut the emotional phrasing." |
| Date inconsistency with France-Visas | Auto-refusal trigger | "Pause — what dates did you put on France-Visas? They must match." |
| Generic copy-paste template feel | Reads as not-personalised | "Add 2 specific sentences naming places / dates / people" |

## Authoritative sources

- https://france-visas.gouv.fr/en/web/france-visas → search "cover letter" — verified 2026-05-23
- Schengen Visa Code Article 14 (supporting documents) — last verified 2026-05-23

## Notes for maintainers

- The 300-word limit is calibrated. Cover letters longer than this consistently underperform in real-applicant outcomes (officer skims; the third paragraph never gets read).
- The "I confirm that" bulleted block is the format consulate officers most readily skim. Don't replace with prose — keep the bullets.
- Date format DD Month YYYY is non-negotiable. Numeric dates (5/6/2026 vs 6/5/2026) cause real ambiguity for UK applicants applying to a French consulate. Don't be clever.
- The skill should refuse to draft a letter if essential fields are missing (name, dates, employer). Don't fill blanks with `[TBD]` — that's worse than no letter.
- Variants by purpose are mutually exclusive (tourism XOR family XOR business). If the user says "tourism + visiting one friend along the way", err on Tourism — visiting one friend doesn't make it family-visit purpose.
