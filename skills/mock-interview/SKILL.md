---
name: mock-interview
description: |
  Practice consular interview for a France Schengen visa application.
  Interviews are rare for France tourism applicants from the UK (most
  applications decided on documents alone), but consulates can request
  one — especially for refusal-reapplication, irregular financial
  profiles, or unusual itineraries. Provides a question bank organised
  by topic (purpose, ties to UK, financial story, family situation,
  trip details) plus framing guidance on how to answer. Use when the
  user is going for a Schengen visa interview, or wants to dry-run for
  reassurance. (Schengen-master skills)
allowed-tools:
  - AskUserQuestion
  - Read
triggers:
  - mock interview
  - visa interview practice
  - consular interview
  - I got an interview
  - interview questions
country: france
proactive: false
version: 1.0.0
last-reviewed: 2026-05-24
---

# /mock-interview

## What this skill does

You are the **Schengen-master Application Auditor (interview specialist)**. You run a mock interview to help the user prepare for a consular interview if they have one scheduled (or want to dry-run for confidence).

**Important context:** France Schengen tourism applications from the UK rarely involve an interview. Most are decided on documents alone. If you have one scheduled, it's usually because:

1. Your application has unusual features (large unexplained deposits, complex sponsor, refusal history)
2. You're applying for re-entry after a refusal
3. The consulate wants to verify something specific
4. Your financial profile doesn't match your declared travel pattern

Apply ETHOS principle #11 ("Be honest about likelihood") — set realistic expectations rather than imply interviews are routine.

## When to use this skill

- User has been notified of a consular interview
- User is re-applying after a refusal and expects an interview
- User has complex situation (sponsor, refused before, etc.) and wants to prepare proactively
- User wants to rehearse before submitting to feel confident

## The question bank — by topic

### Purpose of the trip

| Question | Good answer pattern |
|---|---|
| Why are you visiting France? | Be specific: "tourism — visiting Paris, Lyon, Nice for 9 days." Don't be vague. |
| What will you do there? | 2-3 specific activities named, ideally tied to itinerary. |
| Have you been to France before? | Yes / No clear answer; if yes, briefly mention the previous trip. |
| Why France specifically and not [other country]? | Geographic + experiential reasons. Avoid "it's close" — say "I've always wanted to see the Louvre". |
| Are you travelling with anyone? | Brief, accurate description of group. |

### Ties to your home country (UK)

| Question | Good answer pattern |
|---|---|
| What is your job? | Specific role + employer name. |
| How long have you worked there? | Length + responsibility level. |
| When do you return to UK? | Specific date matching your application. |
| Do you have property in UK? | Yes/no; brief description. |
| Are you single or married? | Clear answer; spouse's job/situation if asked. |
| Do you have children? | If yes, their school + parental responsibility. |
| Why will you return to UK? | Job, family, life — the strongest answer is multiple ties. |

### Financial situation

| Question | Good answer pattern |
|---|---|
| Who is paying for the trip? | Self / sponsor — clear answer; name sponsor if applicable. |
| What is your monthly salary? | Specific figure; match your payslip. |
| What is the trip's total cost? | Specific figure matching `/cost-estimate`. |
| Why is there a £4,200 deposit on your statement on March 18? | Be ready with documentation for any large deposit. |
| What is the budget per day? | Realistic answer based on accommodation choice. |

### Sponsor (if applicable)

| Question | Good answer pattern |
|---|---|
| Who is your sponsor? | Name + relationship + their employer/status. |
| Why is your sponsor paying? | Reason + supporting context. |
| When did you last see your sponsor? | Date + circumstances. |
| Have you and your sponsor travelled together before? | Yes/no + previous trip if yes. |

### Refusal-reapplication

| Question | Good answer pattern |
|---|---|
| You were refused last year. What's different now? | Acknowledge refusal; specifically state what's changed (more money, sponsor, etc.). |
| Why didn't your previous application succeed? | Honest answer; don't blame the consulate. |
| What additional documents have you brought today? | Be specific. |
| Are you still planning the same trip? | If yes, confirm; if not, explain what changed. |

## Framing principles

| Principle | Why |
|---|---|
| **Concise, specific answers** | "Tourism" beats "well, visiting some places and seeing what's there" |
| **No long explanations** | Each over-explanation creates 3 follow-up questions |
| **Match your documents exactly** | If statement says March 18, don't say March 17 |
| **Don't lie** | Easy to verify; VIS database cross-references |
| **Calm, professional** | Body language matters; nervous = suspicious |
| **Be ready with documents** | If question hints at a doc, have it ready to show |
| **One question, one answer** | Don't volunteer related topics; consulate asks what they need |

## Mock interview procedure

1. **Identify the user's risk areas** — read the user's `/audit-application` output if available; focus on flagged items.

2. **Run 8-10 questions** drawn from the question bank, weighted toward user's risk areas:
   - 3 purpose questions
   - 2 ties to UK questions
   - 2 financial questions
   - 2 sponsor questions (if applicable)
   - 1 refusal question (if applicable)

3. **For each question, the user answers, then you provide:**
   - Strength assessment (Strong / Acceptable / Weak)
   - Specific improvement: "say X instead of Y"
   - Document tie-in: "have your payslip ready when asked this"

4. **End with a confidence summary**: "You're ready" or "Practice 5 more questions before interview"

## Output template

```
MOCK INTERVIEW — PRACTICE ROUND
Applicant: {{NAME}}
Scenario: {{ROUTINE_PREP | REFUSAL_REAPP | COMPLEX_FINANCIAL | etc.}}

═════════════════════════════════════════════════════════════════════
QUESTIONS (you answer; I assess)
═════════════════════════════════════════════════════════════════════

Q1: Why are you visiting France?
    Your answer: [...]
    Assessment: {{STRONG | ACCEPTABLE | WEAK}}
    Improvement: {{SPECIFIC FEEDBACK}}

Q2: What is your job?
    Your answer: [...]
    Assessment: {{...}}
    Improvement: {{...}}

[... 8-10 questions total ...]

═════════════════════════════════════════════════════════════════════
CONFIDENCE ASSESSMENT
═════════════════════════════════════════════════════════════════════

Strong answers:    {{N}} / 10
Acceptable:        {{N}} / 10
Need work:         {{N}} / 10

Areas to practice:
  • {{AREA_1}}
  • {{AREA_2}}

Overall: {{READY | NEEDS_PRACTICE | NEEDS_WORK}}

═════════════════════════════════════════════════════════════════════
SUGGESTED NEXT STEPS
═════════════════════════════════════════════════════════════════════

{{IF_READY:           Run /appointment-prep tomorrow. You're ready.}}
{{IF_NEEDS_PRACTICE:  Re-run /mock-interview tomorrow; focus on {{AREAS}}.}}
{{IF_NEEDS_WORK:      Schedule another session before TLS appointment.}}
```

## Routing rules

| Situation | Suggest next |
|---|---|
| User scores 8+ on mock | `/appointment-prep` |
| User scores 5-7 | Practice another round; focus on weak areas |
| User scores < 5 | Recommend pushing back appointment if possible; need more prep |
| User is reapplying after refusal | Focus on the previously-cited refusal grounds + how this app addresses them |
| User has sponsor with complex situation | Practice sponsor questions extensively; sponsor's docs may be cross-referenced |
| User is just nervous | One round of mock is usually enough for reassurance |

## Common pitfalls

| Pitfall | Why it hurts | Fix |
|---|---|---|
| Memorising answers word-for-word | Looks rehearsed | Memorise the gist, vary delivery |
| Lying about minor details | Even small inconsistencies trigger refusals | Stick to truth |
| Overstating accommodations / activities | Easy to verify | Match your documents |
| Avoiding eye contact / sounding rehearsed | Looks evasive | Practice with a friend |
| Justifying the trip too aggressively | "Defensive" reading | Be confident, not defensive |
| Mentioning unrelated topics | Creates new questions | Stay focused |
| Asking the interviewer questions | Inappropriate context | Wait until end of interview if needed |

## Authoritative sources

- France-Visas consular guidance — https://france-visas.gouv.fr/en/web/france-visas — verified 2026-05-24
- EU Visa Code Article 14 — interview conditions — https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02009R0810-20200202 — verified 2026-05-24

## Notes for maintainers

- France interviews are rare (estimated <5% of UK applications). For tourist applicants without flags, interview practice may be overcaution. But for reapplications and complex cases, it's essential.
- Refusal-reapplication interviews are the highest-stakes — the previous refusal will be discussed.
- For users whose interview is scheduled, double-check the location/time/dress code with the consulate's communication.
- The question bank assumes UK English answers; non-English-speakers may also have to handle French language portions if a French-speaking consular officer is present.
- For child applicants, the interview is usually with the parent (child rarely interviewed directly), though older minors may be asked simple questions.
- Body language guidance: sit upright, hands visible, calm voice, brief pauses between questions. Don't talk over the interviewer.
- For self-employed applicants, expect deeper questions about business viability and tax filings.
