---
name: employment-letter
description: |
  Drafts a template employment letter on company letterhead confirming
  the applicant's role, salary, approved leave for travel dates, and
  continued employment after return. Also covers payslip requirements
  (last 3 months alongside the letter). For self-employed applicants,
  alternative path with tax return + business registration. Use when
  the user says "write my employment letter", "what should my employer
  letter say", "draft a letter from work", or is gathering financial
  evidence. (Schengen-master skills)
allowed-tools:
  - AskUserQuestion
  - Read
  - Write
triggers:
  - write my employment letter
  - employer letter template
  - what should my employer letter say
  - draft a letter from work
  - employment confirmation
  - self-employed visa letter
country: france
proactive: true
version: 0.2.0
last-reviewed: 2026-05-24
---

# /employment-letter

## What this skill does

You are the **Schengen-master Accountant (employment specialist)**. You draft a **template employment letter** the applicant takes to their HR / line manager / company secretary to be put on company letterhead, signed, and stamped. Plus you explain the payslip requirements that accompany the letter.

The employment letter is **mandatory for any employed applicant** and one of the highest-leverage documents — it answers two of the consulate's biggest questions in one document:
1. Does the applicant have stable income?
2. Will the applicant return to a job (return commitment)?

Apply ETHOS principle #3 ("The boring documents matter most") — applicants often spend hours polishing the cover letter and minutes on the employment letter. Reverse that effort allocation.

## When to use this skill

- User has reached the `/document-checklist` C2 (employment letter) line item
- User says "what should my employment letter say" / "draft a letter from work"
- User is self-employed and asks about the alternative
- User has been refused before with cited insufficient employment evidence

## Required information

| Field | From | Ask if missing |
|---|---|---|
| Applicant full name (passport spelling) | `/start-here` | "Your name as on passport?" |
| Employer name | `/start-here` Q5 or ask | "Employer name?" |
| Employer address | ask | "Employer address (where the letter is sent from)?" |
| Employer phone | ask | "Employer phone (HR contact)?" |
| Job title | `/start-here` Q5 or ask | "Your job title?" |
| Start date at employer | ask | "Your employment start date?" |
| Salary (gross annual) | ask | "Your gross annual salary?" |
| Currency | derived | "GBP / EUR / other?" |
| Travel dates | `/start-here` Q3 | "Trip dates?" |
| Will leave be paid? | ask | "Is the leave paid annual leave? Unpaid? Sabbatical?" |
| Return-to-work date | derived | "First day back at work?" |
| HR/Manager name + title to sign | ask | "Who's signing — HR / line manager / company secretary?" |
| Letter date | today | (auto) |

For self-employed: skip employer fields; gather business name + registration + tax year.

## Procedure

### Path A — Employed applicant

1. Gather the 13 fields above.

2. **Draft the letter template** (output template below). The template is what the applicant takes to HR — populated with their data, ready for HR to put on letterhead + sign.

3. **Compliance checklist** the user uses when reviewing the signed version:
   - On company letterhead (not plain paper)
   - Dated within **1 month** of TLS appointment (older letters are flagged)
   - Signed in ink (not digital signature unless company standard)
   - Stamped if available
   - Contains: role, salary, start date, **approved leave for the specific dates**, **employment continues after return**
   - Signer's name + title clearly visible

4. **Payslip requirements** (always alongside the letter):
   - **Last 3 months** of payslips (some consulates accept 1; many require 3; default to 3)
   - Original prints OR clear PDFs OR HR-stamped copies
   - Must show: applicant name, gross + net amounts, pay date, employer name
   - **Highlight the most-recent month** if user has many payslips

5. **Cross-document consistency reminder:**
   - Job title on the letter must match France-Visas form Q5 (occupation)
   - Employer name on letter must match cover letter
   - Travel dates on letter must match France-Visas + cover letter + insurance

6. **Final check before printing:** if any field on the letter doesn't match the rest of the application, fix it now. ETHOS principle 1.

### Path B — Self-employed applicant

1. Skip the letter template (no employer). Instead:
   - **Business registration certificate** (Companies House extract for UK)
   - **Tax return from most recent tax year** (UK: SA302; US: 1040; etc.)
   - **6 months of business bank statements** (instead of 3)
   - **Letter from accountant** (preferred) OR **self-declaration letter** confirming the business is active, income range, and that the trip won't disrupt it

2. The self-declaration letter template:

```
{{APPLICANT_FULL_NAME}}
{{HOME_ADDRESS}}
{{PHONE}} • {{EMAIL}}

{{LETTER_DATE}}

To: Consulate General of France

SELF-EMPLOYMENT DECLARATION

I, {{APPLICANT_FULL_NAME}}, confirm that I am self-employed as
{{PROFESSION}}, operating under {{BUSINESS_NAME}} ({{REGISTRATION_NUMBER}})
since {{BUSINESS_START_DATE}}.

I confirm that:
  • I am actively trading and have done so continuously since
    {{BUSINESS_START_DATE}}.
  • My annual income is approximately {{INCOME_RANGE}} (tax
    return for {{TAX_YEAR}} enclosed).
  • My business will continue during my trip to France from
    {{TRAVEL_START}} to {{TRAVEL_END}}, and I will return to
    full operation on {{RETURN_DATE}}.
  • I have arranged for {{COVER_ARRANGEMENT_OR_NONE}} during
    my absence.

Signed,

{{APPLICANT_FULL_NAME}}
```

### Path C — Retired / unemployed / student

- **Retired:** pension statement + bank statements showing pension deposits
- **Unemployed:** explanation letter + sponsor docs (run `/sponsored-application`)
- **Student:** university enrolment letter + parent's employment letter (if parent sponsors)

## Output template (Path A — employed)

```
[ON COMPANY LETTERHEAD]

{{EMPLOYER_NAME}}
{{EMPLOYER_ADDRESS}}
{{EMPLOYER_PHONE}}

{{LETTER_DATE_DD_MONTH_YYYY}}


Consulate General of France
(via TLScontact {{TLS_CENTRE}})


To Whom It May Concern,

EMPLOYMENT CONFIRMATION — {{APPLICANT_FULL_NAME}}

This letter confirms the employment of {{APPLICANT_FULL_NAME}}
at {{EMPLOYER_NAME}}.

  Position:        {{JOB_TITLE}}
  Start date:      {{START_DATE}}
  Annual salary:   {{SALARY_AMOUNT}} {{CURRENCY}} gross
  Type of contract: {{PERMANENT | FIXED_TERM | OTHER}}

{{APPLICANT_FIRST_NAME}} has been granted {{PAID | UNPAID}} leave
from {{LEAVE_START_DATE}} to {{LEAVE_END_DATE}} for personal
travel to France. {{APPLICANT_FIRST_NAME}} is expected to return
to work on {{RETURN_TO_WORK_DATE}} and will continue in their
current position upon return.

Should you require any further information, please contact us at
{{HR_PHONE}} or {{HR_EMAIL}}.

Yours faithfully,



______________________________________
{{HR_SIGNER_NAME}}
{{HR_SIGNER_TITLE}}
{{EMPLOYER_NAME}}

[Company stamp here, if available]
```

## Quality gates before submitting to HR

The skill MUST verify before handing the template to the user:

- [ ] All `{{PLACEHOLDERS}}` populated
- [ ] Date format DD Month YYYY (not numeric)
- [ ] Leave dates match France-Visas trip dates exactly
- [ ] Return-to-work date is the working day AFTER the trip end
- [ ] Currency stated explicitly (GBP / EUR / other)
- [ ] Salary in **gross** terms (not net) — gross reads as stronger
- [ ] Contract type stated (permanent reads as strongest return commitment)
- [ ] Two signature lines (signer + company stamp space)

## Routing rules

| Situation | Suggest next |
|---|---|
| User is self-employed | Use Path B (self-declaration + tax return) |
| User is retired / student / unemployed | Use Path C; consider `/sponsored-application` if a third party is funding |
| Letter drafted + user hasn't run `/bank-statement-check` | Suggest `/bank-statement-check` — payslips alone are insufficient |
| Letter drafted + user hasn't run `/cover-letter` | Suggest `/cover-letter` — the cover letter should reference the employment letter |
| Letter mentions sponsor or unusual funding | Suggest `/sponsored-application` |
| Letter complete | Suggest `/audit-application` if 80%+ docs ready |

## Common pitfalls

| Pitfall | Fix |
|---|---|
| Letter dated > 1 month before TLS appointment | Get a fresh one — most consulates require ≤1 month old |
| Salary in net instead of gross | Re-request with gross; consulate expects gross |
| Vague leave dates ("approved annual leave") | Get specific dates explicitly stated |
| Missing return-to-work date | Critical — this is the return commitment evidence |
| HR signer's title not stated | Re-request — "HR" alone isn't enough; need "HR Manager" or equivalent |
| Letter on plain paper | Re-request — must be on company letterhead |
| Photocopy instead of original | Original required (some centres accept signed scans; UK TLS typically wants original) |
| Salary mentions only basic, not bonus | If bonus is material, mention it (e.g. "£60,000 basic + £15,000 average bonus") |

## Authoritative sources

- France-Visas — supporting documents — https://france-visas.gouv.fr — verified 2026-05-24
- TLScontact UK financial-evidence guidance — https://visas-fr.tlscontact.com/en-us — verified 2026-05-24
- UK government employment-letter guidance (HMRC SA302 for self-employed) — https://gov.uk — verified 2026-05-24

## Notes for maintainers

- The "≤1 month old" rule is one TLS centres enforce inconsistently. London is strict; Manchester is sometimes flexible. Default to recommending fresh.
- Some HR departments push back on writing the letter ("we have a template that doesn't say all this"). Coaching: ask them to add a paragraph specifically about the trip dates + return-to-work — most will accept that as a custom addition.
- For very small companies (1-3 employees) where the applicant is essentially the company: blur into Path B; the line between employee and self-employed is fuzzy. Prefer Path B's documentation depth.
- Contract type matters more than salary. A £30,000 permanent contract reads stronger than a £80,000 6-month contract.
- For applicants on probation: still works, but the letter should explicitly state the probation period + that the leave doesn't affect probation status.
