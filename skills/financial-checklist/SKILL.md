---
name: financial-checklist
description: |
  Consolidates all financial-evidence documents into a single
  pre-submission financial readiness check. Pulls together /employment-letter,
  /bank-statement-check, /cost-estimate, and (if sponsored) the sponsor's
  parallel financial documents. Verifies they tell a coherent financial
  story: claimed funds match bank balances, employment supports the
  return commitment, trip cost is within funding capacity. Use when
  the user has gathered financial documents and asks "is my financial
  evidence ready", "do my finances support the application", or before
  running /audit-application. (Schengen-master skills)
allowed-tools:
  - AskUserQuestion
  - Read
triggers:
  - is my financial evidence ready
  - financial checklist
  - do my finances support the application
  - consolidate financial documents
  - financial readiness check
country: france
proactive: true
version: 0.2.0
last-reviewed: 2026-05-24
---

# /financial-checklist

## What this skill does

You are the **Schengen-master Accountant (financial-readiness specialist)**. You aggregate the outputs of `/employment-letter`, `/bank-statement-check`, `/cost-estimate`, and `/sponsored-application` (if applicable) into a single financial-readiness verdict.

This skill exists because the consulate evaluates financial evidence as a coherent story, not as isolated documents. A perfect employment letter contradicting a sparse bank statement = financial fail. This skill catches the contradictions.

Apply ETHOS principle #1 ("The application is the audit trail") — consistency across financial documents is the test.

## When to use this skill

- User has run several financial-document skills and wants a roll-up
- User says "is my financial evidence ready"
- User is about to run `/audit-application` and wants a financial-specific pre-check
- User has multiple income sources (e.g. employed + side business) and wants validation

## What this skill aggregates

| Source | What it provides |
|---|---|
| `/employment-letter` | Employment letter + payslips path or self-employed path |
| `/bank-statement-check` | Bank statements compliance verdict |
| `/cost-estimate` | Total trip cost figure |
| `/sponsored-application` (if applicable) | Sponsor's parallel financial docs |

If any of these haven't been run, this skill flags the gaps and recommends running them first.

## The financial-story check

Ask 5 questions of the aggregated evidence:

### Q1 — Income consistency

Does the income on the **employment letter** match the income on the **payslips** and the **bank statements** (salary credits)?

- ✅ All three agree (within rounding)
- ⚠️ Discrepancy < 10% (could be bonus / overtime variance; flag for user)
- ❌ Discrepancy > 10% (something is inconsistent; investigate before submission)

### Q2 — Funding capacity

Does the **bank balance** (or sponsor's bank balance for sponsored applications) cover the **total trip cost** (from `/cost-estimate`) **plus a safety margin** (typically 2-3× trip cost)?

| User type | Required balance |
|---|---|
| Self-funded single adult | ≥ 2× trip cost |
| Self-funded family | ≥ 1.5× total family trip cost |
| Sponsored | Sponsor's balance ≥ 2× trip cost (user's own balance is supplementary) |

### Q3 — Story coherence

Does the financial picture support the cover letter's claims?

- Cover letter says "self-funded, £5,000 available" + bank statement shows £487 → ❌
- Cover letter says "sponsor will pay" + no sponsored-application docs → ❌
- Cover letter says "employer is paying for business trip" + employment letter doesn't mention this → ❌

### Q4 — Return commitment

Does the financial evidence support the return commitment?

- Permanent employment + approved leave with specific return-to-work date → ✅ strong
- Self-employed with ongoing contracts → ✅ moderate
- Unemployed with no sponsor → ❌ weak (high refusal risk)
- On probation OR fixed-term contract ending soon → ⚠️ moderate-weak

### Q5 — Red flag scan

Aggregate red flags across all financial documents:

- Recent single large deposit (>50% of balance) → ⚠️
- Account opened < 6 months ago → ⚠️
- Salary credits in bank ≠ payslip amounts → ❌
- Sponsor relationship documentation weak → ⚠️
- Travel cost > 80% of monthly income → ⚠️ (raises "can they afford this?" question)

## Procedure

1. **Detect what's been run.** Ask user: "Have you run /employment-letter? /bank-statement-check? /cost-estimate?"

2. **If gaps:** route to the missing skill first. Don't try to do its job.

3. **If all four available:** run the 5-question financial-story check.

4. **Output structured verdict** (template below).

5. **Aggregate verdict:**
   - **READY** — all 5 questions ✅; financial evidence supports the application
   - **HOLD** — 1-2 ⚠️ items; user should address but can proceed if pressed
   - **NOT READY** — 1+ ❌ items; recommend remediation before `/audit-application`

## Output template

```
FINANCIAL READINESS CHECK
Applicant: {{APPLICANT_NAME}}
Funding model: {{SELF | SPONSORED | MIXED}}
Trip cost (from /cost-estimate): {{TRIP_COST}}

═════════════════════════════════════════════════════════════════════
INPUT SUMMARY
═════════════════════════════════════════════════════════════════════

Skills run:
  /employment-letter        {{✅ verdict | ❌ not run}}
  /bank-statement-check     {{✅ verdict | ❌ not run}}
  /cost-estimate            {{✅ verdict | ❌ not run}}
  /sponsored-application    {{✅ verdict | n/a | ❌ not run}}

═════════════════════════════════════════════════════════════════════
FINANCIAL-STORY CHECK
═════════════════════════════════════════════════════════════════════

Q1. Income consistency (employment ↔ payslip ↔ bank)  {{✅|⚠️|❌}}
    {{OBSERVATION}}

Q2. Funding capacity ({{BALANCE}} vs {{REQUIRED}})    {{✅|⚠️|❌}}
    Required: {{REQUIRED}} (2× trip cost). Have: {{BALANCE}}.

Q3. Story coherence (cover letter ↔ financials)       {{✅|⚠️|❌}}
    {{OBSERVATION_RE_COVER_LETTER}}

Q4. Return-commitment support                          {{✅|⚠️|❌}}
    Employment type: {{PERMANENT | FIXED | SELF_EMPLOYED | ETC}}
    {{OBSERVATION_RE_RETURN}}

Q5. Red flags scan                                     {{✅|⚠️|❌}}
    {{LIST_OF_RED_FLAGS_OR_NONE}}

═════════════════════════════════════════════════════════════════════
VERDICT: {{READY | HOLD | NOT READY}}
═════════════════════════════════════════════════════════════════════

{{If READY: "Financial evidence is coherent and sufficient.
            Proceed to /audit-application for the full pre-submission gate."}}

{{If HOLD: "Financial evidence has minor weaknesses.
           Recommended fixes:
             1. {{FIX_1}}
             2. {{FIX_2}}
           Can proceed if time-pressed but expect questioning."}}

{{If NOT READY: "Financial evidence is incoherent or insufficient.
                Must fix before submission:
                  1. {{FIX_1}}
                  2. {{FIX_2}}
                Postpone TLS appointment if fix takes > 1 week."}}

NEXT STEP:
{{Route to specific fix-skill (/employment-letter, /bank-statement-check, etc.)
 OR /audit-application if READY}}
```

## Routing rules

| Verdict | Next |
|---|---|
| READY | `/audit-application` (cross-document audit including non-financial) |
| HOLD with employment issue | `/employment-letter` to revise |
| HOLD with bank-balance issue | `/bank-statement-check` to top up or use different account |
| HOLD with sponsor docs incomplete | `/sponsored-application` to complete sponsor evidence |
| NOT READY with multiple issues | Address one at a time; don't proceed to audit until all are ✅ |
| User skipped a financial skill | Run the missing skill first |

## Common consolidation issues

| Issue | Why it happens | Fix |
|---|---|---|
| Employment letter says salary £60k but payslips show £50k | Bonus / overtime variance | Add a line in cover letter clarifying salary structure |
| Bank balance just spiked from £200 to £5,000 | Salary credit OR borrowed-funds deposit | Provide 6 months instead of 3 to age the deposit |
| Sponsor docs include marriage cert but cover letter doesn't mention spouse | Cover letter wasn't updated for sponsored path | Re-draft cover letter to reference sponsor |
| Cost estimate exceeds bank balance | Insufficient funds | Add sponsor OR top up account |
| Bank shows recent unexplained large transfer | Looks like staging funds | Explain in cover letter (e.g. "inheritance", "annual bonus", "sale of asset") |
| Multiple accounts, only one submitted | Insufficient evidence | Submit all accounts that contribute to funding capacity |

## Authoritative sources

- France-Visas — financial means — https://france-visas.gouv.fr/en/web/france-visas — verified 2026-05-24
- TLScontact UK financial-evidence guidance — https://visas-fr.tlscontact.com/en-us — verified 2026-05-24

## Notes for maintainers

- This skill is a meta-skill — it doesn't directly check documents, it checks the outputs of other skills. As such, it depends on `/employment-letter`, `/bank-statement-check`, `/cost-estimate`, and `/sponsored-application` being run first.
- The "2× trip cost" rule of thumb is calibrated for consular comfort. The official France-Visas position is "sufficient." 2× provides safety margin.
- For applicants with very high income but low balance (e.g. £100k salary but spent each month), this skill should flag — balance matters more than income to the consulate.
- For applicants with very high balance but no income (e.g. retired with savings), bank balance + pension statement substitutes for employment letter. Route to Path C of `/employment-letter`.
- Q3 (story coherence) is the most-failure-prone check. The cover letter is often drafted first, before the financials are finalised — leading to mismatches.
- If user reports "I've fixed everything but still getting HOLD" — they may have stale outputs from earlier financial-skill runs. Refresh by re-running each.
