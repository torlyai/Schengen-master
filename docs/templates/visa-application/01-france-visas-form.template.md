# Phase 1 — France-Visas Online Application

**Portal:** https://france-visas.gouv.fr/en/demande-de-visa
**Estimated time:** 30–90 minutes for a single applicant. **Save your progress** — the portal supports resuming.
**Outcome:** A unique France-Visas **reference number** (format: `FRA-XXXXXXXX-XX`). Save the PDF receipt.

---

## Before you start

Have ready (digital — for upload + form-fill):

- [ ] Your passport (need to type passport number, issue date, expiry date)
- [ ] Travel itinerary draft — entry date, exit date, accommodation address
- [ ] Insurance certificate (if already purchased — otherwise prepare in parallel)
- [ ] Employment information — employer name, address, phone, your role
- [ ] If you've held a Schengen visa before — details from those visas
- [ ] **The email address you'll keep checking for the next 30 days** — all communication goes here

> **Tip:** Open a notes file alongside the form. The portal **does not let you go back to change** some answers after you've moved forward — having your draft ready means fewer "do-overs."

---

## Step 1 — Visa-Wizard (assistant) to confirm visa type

The portal starts with a wizard that asks where you live, what citizenship, purpose, and trip length. It then tells you which visa type to apply for. **Run this even if you think you know** — it's how the portal opens the correct application form for you.

Expected outcome for most readers: **Short-stay visa (Schengen, Type C)** for tourism / family / business.

Fill in:

| Wizard field | Your answer |
|---|---|
| Country of residence | `{{COUNTRY_OF_RESIDENCE}}` |
| Nationality | `{{NATIONALITY}}` |
| Main reason for travel | `{{TRAVEL_REASON}}` (tourism / family visit / business / study / medical / other) |
| Trip length | `{{TRIP_LENGTH_DAYS}}` days (≤90 for short-stay) |
| First entry date | `{{FIRST_ENTRY_DATE}}` |
| Last exit date | `{{LAST_EXIT_DATE}}` |

Save the wizard's recommendation. The actual application form opens once you click **"Start your application"**.

---

## Step 2 — Personal details

| Field | Your answer |
|---|---|
| Surname (as on passport) | `{{SURNAME}}` |
| First name(s) | `{{FIRST_NAMES}}` |
| Surname at birth | `{{SURNAME_AT_BIRTH}}` (same as surname unless changed by marriage etc.) |
| Date of birth | `{{DOB_YYYY-MM-DD}}` |
| Place of birth | `{{BIRTH_CITY}}, {{BIRTH_COUNTRY}}` |
| Sex | `{{SEX}}` |
| Marital status | `{{MARITAL_STATUS}}` |
| Other nationality (if any) | `{{OTHER_NATIONALITY_OR_NONE}}` |

> **Spelling matters.** Your name on the application must **exactly** match your passport — same accents, same hyphens, same spaces.

---

## Step 3 — Travel document (passport)

| Field | Your answer |
|---|---|
| Travel document type | Ordinary passport (in most cases) |
| Number | `{{PASSPORT_NUMBER}}` |
| Issued by | `{{PASSPORT_ISSUING_AUTHORITY}}` |
| Date of issue | `{{PASSPORT_ISSUE_DATE}}` |
| Valid until | `{{PASSPORT_EXPIRY_DATE}}` |

> **Passport must be valid for 3+ months beyond your planned exit** from the Schengen area AND have been issued within the last 10 years AND have 2+ blank pages. If yours doesn't meet these, **renew first** before applying.

---

## Step 4 — Contact + residence

| Field | Your answer |
|---|---|
| Home address | `{{HOME_STREET}}, {{HOME_CITY}}, {{HOME_POSTCODE}}, {{HOME_COUNTRY}}` |
| Phone number | `{{PHONE_INTL_FORMAT}}` (e.g. `+44 7123 456789`) |
| Email | `{{EMAIL}}` |

The email here must be one you **monitor regularly** — TLScontact, the consulate, and France-Visas all send mail here.

---

## Step 5 — Profession / occupation

For most applicants:

| Field | Your answer |
|---|---|
| Current occupation | `{{JOB_TITLE}}` |
| Employer / school name | `{{EMPLOYER_NAME}}` |
| Employer address | `{{EMPLOYER_ADDRESS}}` |
| Employer phone | `{{EMPLOYER_PHONE}}` |

For students, retirees, unemployed, dependants — the portal has appropriate alternative questions.

---

## Step 6 — Trip details

| Field | Your answer |
|---|---|
| Main purpose of travel | `{{MAIN_PURPOSE}}` (Tourism / Visiting family or friends / Business / Conference / Cultural / Medical / Study / Transit / Other) |
| Member States of main destination | France |
| Member State of first entry | `{{FIRST_ENTRY_COUNTRY}}` (France if flying direct; could be another Schengen country if connecting via Amsterdam, Frankfurt, etc.) |
| Number of entries requested | Single / Multiple (request **multiple** if you might leave and re-enter the Schengen area during your trip) |
| Duration of intended stay (days) | `{{STAY_DAYS}}` |
| Intended date of arrival | `{{ARRIVAL_DATE}}` |
| Intended date of departure | `{{DEPARTURE_DATE}}` |

> **Multiple-entry vs single-entry:** if your itinerary has *any* trip outside Schengen during the visit (e.g. UK → France → UK weekend → France), request multiple. The fee is the same. Single-entry is one continuous stay only.

---

## Step 7 — Accommodation + costs

| Field | Your answer |
|---|---|
| Accommodation type | Hotel / Family or friend's home (invitation) / Rental |
| Accommodation address (in France) | `{{FRANCE_ADDRESS}}` |
| Contact person / hotel | `{{HOST_OR_HOTEL_NAME}}` |
| Cost of travel + stay covered by | Self / Sponsor / Inviting person |
| Means of subsistence | Cash / Credit card / Bank statement / Sponsor pays |

If you're staying with family or friends, you need an **Attestation d'Accueil** (invitation letter validated at the host's local French town hall) — see `03-document-checklist.template.md`.

---

## Step 8 — Previous Schengen / France visas

If applicable:

| Field | Your answer |
|---|---|
| Have you had a Schengen visa before? | Yes / No |
| If yes, visa numbers and dates | `{{PREVIOUS_VISA_DETAILS}}` |
| Have you previously been fingerprinted for a Schengen visa? | Yes / No (date if yes) |
| Have you previously been refused a Schengen visa? | Yes / No (details if yes) |

> **Be truthful here.** The system cross-references with VIS (Schengen visa info database). Lying is an automatic refusal trigger and may permanently affect future applications.

---

## Step 9 — Family information (if travelling with family)

For each accompanying family member, the portal asks for separate applications. **Each person needs their own application** with their own reference number.

For minors (under 18):

- Both parents (or legal guardians) must sign authorisation
- Birth certificate (legalised / apostilled if required) is needed for the document submission
- If only one parent is travelling, the non-travelling parent's consent letter

---

## Step 10 — Submit + save receipt

After review, you're asked to **electronically sign** and submit. You'll receive:

1. **Reference number** — `FRA-XXXXXXXX-XX` format. **Write this down.**
2. **Application receipt (PDF)** — download immediately and save.
3. **List of supporting documents** (PDF) — read carefully; this is the official checklist tailored to your case. Compare against [`03-document-checklist.template.md`](./03-document-checklist.template.md).

| To save | Where |
|---|---|
| Reference number | `{{FRANCE_VISAS_REFERENCE}}` |
| Application receipt | `~/{{DESTINATION_FOLDER}}/france-visas-receipt-{{APPLICANT_NAME}}.pdf` |
| Personalised checklist | `~/{{DESTINATION_FOLDER}}/france-visas-checklist-{{APPLICANT_NAME}}.pdf` |
| Date submitted | `{{SUBMIT_DATE}}` |

---

## After submission

Within 24 hours you should receive an email from France-Visas confirming receipt with your reference. If you don't get this email:

1. Check spam folder.
2. Log back into the France-Visas portal — your application should be visible under "My applications".
3. If still nothing, contact France-Visas support via the form on the portal (not email — they don't reply to direct emails).

**Next:** proceed to [`02-tlscontact-form.template.md`](./02-tlscontact-form.template.md) using your reference number.

---

## Common pitfalls

| Pitfall | How to avoid |
|---|---|
| Name doesn't exactly match passport | Copy character-for-character from passport. Watch for accents in non-Latin alphabets transliterated to Latin. |
| Wrong "first entry" country | If your flight is **London → Amsterdam → Paris**, your first Schengen entry is Amsterdam (Netherlands), not France. Many border-control rejections start here. |
| Wrong visa type via the wizard | If you're going for a conference or a paid speaking engagement, that's "business" not "tourism" even if you have free time alongside it. |
| Forgetting the reference number | Photograph the page that displays it. Save the PDF receipt in two places (cloud + local). |
| Submitting too early | The visa is valid from a specific date you nominate. Apply **no earlier than 6 months before** travel and **no later than 15 working days before**. |
