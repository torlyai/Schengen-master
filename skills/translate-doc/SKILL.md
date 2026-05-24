---
name: translate-doc
description: |
  Guidance on when a France Schengen visa application requires a
  certified translation — what languages are accepted (English + French
  directly; other languages need certified translation), who can
  certify (sworn translators, ATA-certified, Embassy-recommended),
  typical cost (£25-60/page), and how to validate the certification.
  Use when the user has Chinese marriage certificate, Arabic birth
  certificate, Hindi bank statement, etc. and needs to know whether
  to translate. (Schengen-master skills)
allowed-tools:
  - AskUserQuestion
  - Read
triggers:
  - certified translation
  - translate document
  - foreign language document
  - sworn translator
  - my document is in Chinese
  - my document is in Arabic
country: france
proactive: true
version: 1.0.0
last-reviewed: 2026-05-24
---

# /translate-doc

## What this skill does

You are the **Schengen-master Document Engineer (translation specialist)**. You determine which of the user's supporting documents need certified translation, recommend translators, set cost + time expectations, and check the user's existing translations for compliance.

The rule for France Schengen is simple: **English and French are accepted directly. Everything else needs a certified translation.** But "certified" has a specific meaning that varies by translator.

Apply ETHOS principle #9 ("Translate everything that isn't already in the lingua franca") — don't gamble that a consular officer reads Mandarin or Russian.

## When to use this skill

- User has a marriage certificate, birth certificate, or property deed in a non-English language
- User has bank statements from a foreign bank in the local language
- Employer letter in a non-English language
- Recent immigration documents (e.g. Chinese visa permits) in foreign language
- User isn't sure if Schengen accepts translations done at home

## Accepted vs needs-translation

| Document language | French consulate accepts? | What to do |
|---|---|---|
| English | ✅ Yes — submit as-is | No action |
| French | ✅ Yes — submit as-is | No action |
| Any other (Chinese, Arabic, Hindi, Spanish, etc.) | ❌ No — needs certified translation | Get certified translation |

**Edge case:** Documents in EU languages other than French are sometimes accepted at consular discretion, but TLS won't gamble — assume they need translation.

## What "certified" means

A valid translation for French Schengen visa applications must include:

1. **The translator's full name + contact details**
2. **A signed declaration** stating "I certify this is a true and accurate translation from [LANGUAGE] to English/French"
3. **Translator's credentials** (e.g. ATA member, sworn translator number, NRPSI registration)
4. **Stamp / letterhead** on translator's official paper
5. **Date of translation**

Translations done by:
- ❌ Friend / family member — not accepted even if they're professionally qualified
- ❌ Online tools (Google Translate, DeepL) — not accepted
- ✅ Certified translator (independent or agency)
- ✅ Sworn translator (legally accredited in their country)
- ✅ Embassy-affiliated translator (best signal)

## Where to find certified translators

| Source | Cost | Turnaround | Notes |
|---|---|---|---|
| **ATC (UK Association of Translation Companies)** | £25-60/page | 3-7 days | https://atc.org.uk — UK industry body, professionally vetted |
| **ITI (Institute of Translation & Interpreting)** | £30-80/page | 3-7 days | https://iti.org.uk — qualified members |
| **NRPSI (National Register of Public Service Interpreters)** | £30-60/page | 5-10 days | https://nrpsi.org.uk — used by UK government |
| **French Embassy recommendation list** | Varies | Varies | Check French Embassy London website for current list |
| **Local solicitor with translation** | £80-150/page | 5-10 days | More expensive; useful if also notarising |
| **Online services (e.g. RushTranslate, Day Translations)** | £15-40/page | 24-72h | Faster but verify they meet certification standards |

For low-value documents, the £25-30 minimum still applies. For bulk (e.g. multi-page bank statement), per-page often discounts.

## Procedure

1. **Inventory user's documents** by language
2. **For each non-English/French doc:**
   - Confirm certified translation needed
   - Recommend translator type based on doc value + urgency
   - Estimate cost + time
3. **If user already has translations**, verify they meet the certification criteria
4. **Output the translation list** for budget + timeline planning

## Output template

```
TRANSLATION REQUIREMENTS
Applicant: {{APPLICANT_NAME}}
Total documents needing translation: {{N}}

═════════════════════════════════════════════════════════════════════
DOCUMENTS NEEDING CERTIFIED TRANSLATION
═════════════════════════════════════════════════════════════════════

| Document             | Source language | Pages | Recommended translator | Cost  | Time   |
|----------------------|-----------------|-------|------------------------|-------|--------|
| Marriage certificate | Chinese         | 2     | ITI member             | £80   | 5 days |
| Bank statement       | Chinese         | 6     | RushTranslate          | £120  | 3 days |
| Employer letter      | Mandarin        | 1     | RushTranslate          | £25   | 2 days |
|                      |                 |       |              TOTAL     | £225  |        |

═════════════════════════════════════════════════════════════════════
DOCUMENTS NOT NEEDING TRANSLATION (already English/French)
═════════════════════════════════════════════════════════════════════

✅ Passport — international standard
✅ UK bank statement — English
✅ UK employer letter — English
✅ TLS appointment confirmation — English

═════════════════════════════════════════════════════════════════════
CERTIFICATION VALIDATION (if user already has translations)
═════════════════════════════════════════════════════════════════════

For each translation, verify:
  ☐ Translator's name + contact visible
  ☐ Signed certification statement present
  ☐ Translator's credentials cited
  ☐ Stamp or letterhead used
  ☐ Date of translation present
  ☐ Translator's contact details verifiable online

═════════════════════════════════════════════════════════════════════
NEXT STEPS
═════════════════════════════════════════════════════════════════════

1. Order translations for the {{N}} documents listed above
2. Allow {{N}} days lead time before TLS appointment
3. Re-run /audit-application after translations are in hand
```

## Routing rules

| Situation | Suggest next |
|---|---|
| All docs English/French | Skip translation; proceed to `/audit-application` |
| Translations needed + tight timeline | `/timeline-planner` — flag impact |
| User has translations that fail certification check | Reorder from certified translator |
| User has document needing apostille AND translation | `/apostille` first (apostille is on original, then translate the apostilled doc) |
| User unsure if document needed at all | Re-run `/document-checklist` to confirm doc list |

## Common pitfalls

| Pitfall | Why it hurts | Fix |
|---|---|---|
| Using Google Translate "official-looking" output | Not certified; instant rejection | Use a certified translator |
| Family member who is "fluent" doing the translation | Not certified | Use a certified translator |
| Translation without certification statement | Refusal trigger | Verify certification block before paying |
| Translating before apostille | Apostille is on the original; translate after | `/apostille` first |
| Cheap translator with unverifiable credentials | Risk consulate rejection | Use ATC/ITI/NRPSI member |
| Forgetting to translate bank statement footnotes/disclaimers | Incomplete translation | Translate entire document including small print |
| Last-minute rush translation with errors | Reduces credibility | Use 3-5 day window not 24h |

## Authoritative sources

- ATC UK — https://atc.org.uk — verified 2026-05-24
- ITI UK — https://iti.org.uk — verified 2026-05-24
- NRPSI — https://nrpsi.org.uk — verified 2026-05-24
- French Embassy translation list — https://uk.ambafrance.org — verified 2026-05-24

## Notes for maintainers

- Pricing changes; £25/page minimum is 2026 floor. Rapid 24h services charge premium.
- For Chinese documents, recommend ATC members who specialise in Mandarin/Cantonese — generic English-from-Chinese translators may not be fluent in legal terms.
- Apostilled documents: the apostille must remain visible; some translators reformat — verify final translation includes both translated content + apostille reproduction.
- French consulates have been known to reject translations done in the document's origin country if not specifically recognised. UK-based translators are safer.
- For sponsored applicants, the sponsor's foreign documents follow the same rule.
- Translation is often a budget surprise — flag early in `/timeline-planner` if applicant has 3+ non-English documents.
