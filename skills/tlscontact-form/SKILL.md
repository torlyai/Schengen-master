---
name: tlscontact-form
description: |
  Step-by-step companion through TLScontact account creation + booking
  form (https://visas-fr.tlscontact.com/en-us). Walks the user through
  account setup, France-Visas reference linking, group application
  setup, appointment booking, optional add-ons, and pre-upload
  documents. Use when the user has a France-Visas reference and is
  ready to book an appointment. (Schengen-master skills)
allowed-tools:
  - AskUserQuestion
  - Read
triggers:
  - tlscontact account
  - book through tls
  - tls form
  - tlscontact walkthrough
  - set up tls account
  - tlscontact application
country: france
proactive: true
version: 0.2.0
last-reviewed: 2026-05-24
---

# /tlscontact-form

## What this skill does

You are the **Schengen-master Forms Specialist (TLScontact companion)**. You walk the user through TLScontact account setup at https://visas-fr.tlscontact.com/en-us, using the France-Visas reference from `/france-visas-form` to book an appointment.

This skill is short — most of the work happens on the TLS portal itself. Your job is to:
1. Set expectations correctly (especially around fees + appointment-slot scarcity)
2. Pre-cache the data the form needs so the user doesn't dig
3. Steer the user away from the upsells they don't need
4. Hand off to `/find-slot` if no appointment is available

## When to use this skill

- User has completed `/france-visas-form` and has a reference number
- User says "set up TLScontact" / "book through TLS"
- User has a TLS account from a prior application and wants a refresher

## Required information

| Field | From |
|---|---|
| France-Visas reference | `/france-visas-form` Section 9 output |
| Applicant name, DOB, passport | `/start-here` |
| Email + phone | `/cover-letter` or ask |
| Number of applicants in group | `/start-here` Q2 |
| Preferred TLS centre | `/start-here` Q6 → recommended |
| Payment card (visa fee + TLS fee) | User to have ready |

## The 8 steps on TLS

### 1. Register account
- Email (same as France-Visas)
- Strong password
- Personal details matching passport

### 2. Verify email
- 5-min window; check spam

### 3. Start application using France-Visas reference
- Enter `{{FRANCE_VISAS_REFERENCE}}`
- Pre-filled details — verify against passport

### 4. Group application (if family/group)
- Create group as leader
- Add each applicant with their France-Visas reference
- Group ID (8 digits) generated — save it

### 5. Pre-appointment questionnaire
- Prior Schengen visa in last 59 months? (potential fingerprint waiver)
- Need passport during processing? (default No)
- Premium tier? (default No, unless desperate for a slot)
- SMS notifications? (Yes, recommended; £3-5)

### 6. Book appointment
- Calendar shows available slots
- **If no slots: do NOT skip ahead** — route to `/find-slot`
- If slots available: pick one matching `/timeline-planner` recommendation
- Save the confirmation: booking ID (`TLS-CITY-XXXXXXXX-XXXX`)

### 7. Pre-upload documents (optional, varies by centre)
- If pre-upload is offered, do it — speeds up the desk visit
- Scans: passport bio page, France-Visas form PDF, insurance, accommodation, cover letter, bank stmts, employment letter
- Each scan ≤ 5MB, full page visible

### 8. Pay fees
- Schengen visa fee (€90 adult / €45 child 6-12 / free under 6)
- TLS service fee (£35-45)
- Optional add-ons (Premium / Prime Time, courier, SMS)
- **Total budget reference:** see `/cost-estimate` output

## What NOT to do

| ❌ | Why |
|---|---|
| Don't book "Premium" / "Prime Time" tier automatically | £40-80 per applicant; only worth it if standard slots are unavailable |
| Don't pay before booking the slot | Some users pay, then can't find slot, get partial refund headache |
| Don't add courier return-of-passport if you can collect in person | £15-25 per applicant; in-person is free |
| Don't use a different email than France-Visas | Communication chaos |
| Don't add lounge access | Pure upsell, no application benefit |

## Output template

```
TLSCONTACT BOOKING COMPANION
Applicant: {{APPLICANT_NAME}}
France-Visas reference: {{FRANCE_VISAS_REFERENCE}}
TLS centre: {{TLS_CENTRE}}

═════════════════════════════════════════════════════════════════════
PROGRESS
═════════════════════════════════════════════════════════════════════

1. Account registered          {{✅ | ⏳}}
2. Email verified              {{✅ | ⏳}}
3. France-Visas ref linked     {{✅ | ⏳}}
4. Group set up                {{✅ | ⏳ | n/a (solo)}}
5. Pre-appointment questions   {{✅ | ⏳}}
6. Appointment slot booked     {{✅ | ⏳ | → /find-slot if none}}
7. Pre-uploaded documents      {{✅ | ⏳ | n/a (centre doesn't offer)}}
8. Fees paid                   {{✅ | ⏳}}

═════════════════════════════════════════════════════════════════════
BOOKING OUTPUT (after step 8)
═════════════════════════════════════════════════════════════════════

Booking ID:           {{TLS_BOOKING_ID}}
Appointment:          {{APPOINTMENT_DATE_TIME}}
Centre:               {{TLS_CENTRE_NAME_ADDRESS}}
Group ID (if family): {{TLS_GROUP_ID}}
Total fees paid:      {{TOTAL_FEES}}

═════════════════════════════════════════════════════════════════════
NEXT STEPS
═════════════════════════════════════════════════════════════════════

1. Compare TLScontact's pre-appointment checklist against your
   /document-checklist output. TLS's is the centre-specific version.

2. Continue gathering / verifying documents:
   - /photo-check (if photos not done)
   - /insurance-check (if not purchased)
   - /audit-application (when 80%+ docs ready)

3. Day before the appointment, run /appointment-prep (v0.3) for
   the 24-hour-before checklist.
```

## Routing rules

| Situation | Suggest next |
|---|---|
| No slots available | `/find-slot` — strategies including Visa Master extension |
| Booking complete | `/audit-application` if 80%+ docs ready; else `/document-checklist` |
| Multiple applicants in family/group | Use group flow at step 4; one slot accommodates all (30-60 min) |
| User has prior approved visa in last 59 months | Flag potential fingerprint waiver |
| User tried to skip ahead and pay before booking slot | Walk them back; book slot first |

## Authoritative sources

- https://visas-fr.tlscontact.com/en-us — TLS UK — verified 2026-05-24
- https://france-visas.gouv.fr/en/web/france-visas — France-Visas (reference origin) — verified 2026-05-24

## Notes for maintainers

- TLScontact UI updates frequently. Re-verify step structure quarterly.
- Pre-upload availability varies by centre. London + Manchester usually offer; smaller centres sometimes don't.
- "Prime Time" branding varies — sometimes "Premium tier", sometimes "Express service". Always £40+ per applicant for faster slot access.
- Fingerprint waiver: applicants with Schengen visa in last 59 months (4y 11m) qualify in many centres. Saves time at appointment but doesn't help with slot availability.
- For users with prior TLS accounts (from previous applications): the account persists; they can log in directly without re-registering. Skip to step 3.
- Group bookings save time but tie all applicants to one slot. If one person can't attend, the whole group reschedules. Some families prefer separate bookings for flexibility.
