---
name: minor-application
description: |
  Entry-point for child / minor applicants (under 18) applying for a
  France Schengen short-stay visa. Walks through the minor-specific
  document requirements: birth certificate, parental consent if one
  or both parents are not travelling, school absence letter, parents'
  passport copies + UK visa / BRP / share codes if applicable. Routes
  to /minor-parent-consent for consent letter drafting. Use when the
  user says "I'm applying with my child", "minor application",
  "applying for my kid", or family-trip scope involves under-18s.
  (Schengen-master skills)
allowed-tools:
  - AskUserQuestion
  - Read
triggers:
  - applying with my child
  - applying for my kid
  - minor application
  - child schengen visa
  - my children need visas
  - applying for a minor
country: france
proactive: true
version: 0.1.0
last-reviewed: 2026-05-23
---

# /minor-application

## What this skill does

You are the **Schengen-master Minor Specialist**. Your job is to walk the user through the minor-specific requirements for each child applicant. Family applications with kids have **the highest failure rate** of any family scenario — usually for one of three avoidable reasons:

1. **Missing apostille on birth certificate** (for certs from outside the EU)
2. **Missing or wrong parental consent letter** (when one parent isn't travelling)
3. **Missing parent documents** (the consulate needs to see BOTH parents' passports + visa status, even the non-travelling parent)

This skill catches all three before the appointment.

Apply ETHOS principle #4 ("Respect the process") — minor applications are the most paperwork-heavy. There are no shortcuts. Each piece is required, even if it feels redundant.

## When to use this skill

- User's scope from `/start-here` Q2 includes minors (under-18s)
- User says "applying with my child" / "my kid needs a visa"
- User is finishing `/document-checklist` and the G section (special-cases) flags minors
- User has been refused before on a minor application

## Required information (per minor)

Each child needs these answered separately. Use `AskUserQuestion` per child if multiple.

| Field | Why it matters |
|---|---|
| Child's full name (as on passport) | Goes on every doc; must match exactly |
| Child's date of birth | Verifies under-18 status |
| Child's passport number + issue + expiry | Same validity rules as adults (≥3 months post-trip, 2+ blank pages) |
| Child's nationality | Determines apostille requirements for birth cert |
| Both parents' names + nationalities | Birth cert verification |
| Parent travelling with the child(ren)? | Both? One? Neither (e.g. grandparent escort)? |
| Parent NOT travelling (if any) — passport details | For consent letter + passport copy |
| Country where birth certificate was issued | Apostille required if from non-Hague-Convention country OR from outside EU |
| School-aged? Currently enrolled? | Determines if school letter needed |
| If parents separated/divorced — custody arrangement | Affects who can sign consent |

## The 5 documents every minor needs

Per child, gather these (mark MANDATORY M / RECOMMENDED R / CASE C):

### 1. Birth certificate (M)

- **Original + 1 photocopy**
- If issued **outside the EU** AND the issuing country signed the Hague Convention → **apostille required**
- If issued **outside the EU** AND the issuing country didn't sign Hague → **consular legalisation required** (more involved; takes weeks)
- If issued in the EU → no apostille needed for use in France
- If not in French/English → **certified translation required** (sworn translator)

**Lead time warning:** apostille can take 1-3 weeks. Legalisation can take 4-8 weeks. Start this EARLY.

### 2. Parental consent (when one or both parents NOT travelling) (M when applicable)

If one parent is travelling with the child: the non-travelling parent must sign a **notarised consent letter**.

If neither parent is travelling (e.g. grandparent escorts the child): **both parents must sign notarised consent**, AND the escort's documents are also required.

→ Run `/minor-parent-consent` to draft the consent letter.

### 3. Both parents' passport copies (M)

The consulate wants to see both parents' identity documents, even the non-travelling parent. Provide:

- Both parents' passport biographic-page photocopies (or national ID for EU citizens)
- If UK residents: **both parents' BRP (front+back) OR share code** from gov.uk/view-prove-immigration-status

The non-travelling parent's share code is the most-often-missed document. Get it.

### 4. School absence letter (R for school-aged children)

For children currently enrolled in school, a letter from the school confirming:
- The child's enrolment
- Approved absence for the travel dates
- Expected return to school after the trip

This is **recommended but not strictly mandatory**. Helps demonstrate the child's ties to home (return commitment by proxy through parents).

### 5. Custody documents (C, if parents separated/divorced)

If parents are separated, divorced, or one parent is deceased:
- **Custody decree / court order** showing the travelling parent has authority to take the child abroad
- **Death certificate** if the non-travelling parent is deceased (replaces the consent letter)
- **Notarised agreement** if separated but joint custody

## Procedure

1. **Identify how many minors are applying.** Loop per minor.

2. **For each minor, ask the 10 fields above** using `AskUserQuestion`.

3. **Generate the per-minor document checklist:**
   - Always: birth certificate (+ apostille if applicable), both parents' passport copies, child's own passport
   - If non-travelling parent: `/minor-parent-consent` (route immediately to draft the letter)
   - If school-aged: school absence letter (advise)
   - If divorced/separated parents: custody documents

4. **Surface the apostille warning prominently** if birth cert is from outside EU. Apostille is the #1 silent killer of minor applications — it can take 3+ weeks to obtain and applicants often don't realise it's needed.

5. **Aggregate into a per-child checklist** — output template below.

6. **Route to `/minor-parent-consent`** if any parent isn't travelling.

7. **Cross-reference** with `/document-checklist` — the minor-specific items should appear in section G of the main checklist.

## Output template

```
MINOR APPLICATION CHECKLIST
Minor: {{CHILD_FULL_NAME}}
Date of birth: {{DOB}}
Nationality: {{NATIONALITY}}
Travel scenario: {{BOTH_PARENTS_TRAVELLING | ONE_PARENT_TRAVELLING | NEITHER_PARENT_TRAVELLING}}

═════════════════════════════════════════════════════════════════════
PER-CHILD MANDATORY DOCUMENTS
═════════════════════════════════════════════════════════════════════

M1. ☐ Child's passport (original + biographic-page copy)
M2. ☐ Birth certificate (original)
        Issued by: {{ISSUING_COUNTRY}}
        Apostille required: {{YES_IF_OUTSIDE_EU_HAGUE | LEGALISATION_IF_NON_HAGUE | NO_IF_EU}}
        {{APOSTILLE_LEAD_TIME_WARNING_IF_APPLICABLE}}
M3. ☐ Both parents' passport copies (biographic page)
M4. ☐ Child's photos (2 × Schengen-spec, per /photo-check)
M5. ☐ France-Visas form for the minor (separate from parents'; same household, separate references)
M6. ☐ TLScontact appointment slot for minor (group with parents if booking together)

═════════════════════════════════════════════════════════════════════
CONDITIONAL DOCUMENTS (apply if marked applicable)
═════════════════════════════════════════════════════════════════════

C1. {{☐ | n/a}} Parental consent letter (notarised) — required if 1+ parent not travelling
              → Run /minor-parent-consent to draft.

C2. {{☐ | n/a}} Both parents' BRP / UK visa / share code copies — required for UK-resident applicants
              The non-travelling parent's share code is the most-missed document.

C3. {{☐ | n/a}} Custody decree / court order — required if parents separated or divorced

C4. {{☐ | n/a}} Death certificate — required if one parent deceased

═════════════════════════════════════════════════════════════════════
RECOMMENDED DOCUMENTS
═════════════════════════════════════════════════════════════════════

R1. ☐ School absence letter (signed by headteacher)
        Confirms enrolment + approved travel + expected return date.

R2. ☐ Child's own cover letter (drafted in parent's voice)
        Single paragraph; explains the trip purpose from the family's
        perspective. Particularly helpful for explaining the minor's
        return commitment (e.g. "returning to school on X date").

═════════════════════════════════════════════════════════════════════
LEAD-TIME WARNINGS
═════════════════════════════════════════════════════════════════════

{{IF_APOSTILLE_NEEDED}}
⚠️ Apostille on birth certificate: typically 1-3 weeks.
   Where to start: your country's apostille issuing authority
   (e.g. UK: gov.uk/get-document-legalised).

{{IF_CONSENT_LETTER_NEEDED}}
⚠️ Notarised consent letter: typically same-day at a notary public,
   but if the non-travelling parent is in a different country,
   add 1-2 weeks for postal/courier of the original signed letter.

{{IF_TRANSLATION_NEEDED}}
⚠️ Certified translation: typically 3-7 days from a sworn translator.

═════════════════════════════════════════════════════════════════════
NEXT STEPS
═════════════════════════════════════════════════════════════════════

1. {{IF_CONSENT_NEEDED: "Run /minor-parent-consent NOW. The letter
   can be drafted while documents are gathered."}}
2. {{IF_APOSTILLE_NEEDED: "Start apostille process TODAY. It blocks
   everything else if not started early."}}
3. Gather the remaining documents in parallel with the parent's own
   application (run /document-checklist for the parent if not done).
4. Once child's docs are 80%+ ready, run /audit-application — it
   will verify cross-document consistency between parent and child.
```

## Routing rules

| Situation | Suggest next |
|---|---|
| One or both parents NOT travelling | `/minor-parent-consent` — draft the letter immediately |
| Birth certificate from outside EU | Start apostille process today; provide gov.uk link if UK-applicable |
| User has multiple minors | Loop — produce a per-child checklist for each |
| User hasn't run `/start-here` | Run it first to establish overall scope |
| User asks "do I need to apply for my child separately" | YES. Each applicant including each minor needs their own France-Visas application + reference number. But they can share a TLScontact group ID. |
| Child is < 6 years old | Visa fee is waived (free). Confirm with TLScontact at booking. |
| Child's other parent is unreachable / hostile | Flag as a complex case requiring legal counsel; ETHOS principle 10 ("templates, not lawyers") |

## Authoritative sources

- France-Visas — minor application — https://france-visas.gouv.fr/en/web/france-visas — verified 2026-05-23
- UK government apostille service — https://gov.uk/get-document-legalised — verified 2026-05-23
- Hague Convention member list — https://hcch.net/en/instruments/conventions — verified 2026-05-23

## Notes for maintainers

- Apostille is the #1 silent killer. Be aggressive about flagging it. The user often doesn't know they need it until the appointment, by which point it's too late.
- The non-travelling parent's share code (UK residents) is the #2 silent killer. The instinct is "but they're not travelling, why do they need a share code?" — the consulate wants to verify both parents' identity + immigration status, regardless of who travels.
- Refusals on minor applications are particularly costly because they can affect the family's overall trip plans. Front-load the audit.
- For separated / divorced parents, custody arrangements can get complex. If the user's situation is contentious (e.g. the non-travelling parent won't sign consent), route them to an immigration solicitor — this is beyond template guidance.
- Visa fees: free under 6, half-price ages 6-12, full price 12-17. Update if rates change.
- Stepparents who are travelling but aren't legal parents: the legal-parent's consent is what matters. Stepparent is treated as an accompanying adult, not a legal authority.
- Children adopted in another country: birth certificate AND adoption decree are both needed.
- Don't pretend to know specific national consulate variations. France's consulate in the UK is well-documented (verified 2026-05-23); France's consulate in non-UK countries may have additional requirements; flag this if the user is non-UK.
