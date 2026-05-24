---
name: appointment-prep
description: |
  24-hour-before TLScontact appointment checklist for France Schengen
  visa. Verifies all documents are printed (not screen-only), photos
  are physical prints (not phone images), payment card is in wallet,
  transport is sorted to arrive 15 min early, and the user has packed
  a sensible folder. Use the day or evening before the TLS
  appointment, especially the first time the user has gone through
  this. (Schengen-master skills)
allowed-tools:
  - AskUserQuestion
  - Read
triggers:
  - tomorrow's appointment
  - day before TLS
  - appointment tomorrow
  - prep for visa appointment
  - what should I bring tomorrow
country: france
proactive: true
version: 1.0.0
last-reviewed: 2026-05-24
---

# /appointment-prep

## What this skill does

You are the **Schengen-master Appointment Coordinator (prep specialist)**. You run the user through the 24-hour-before-appointment checklist. The audit work is done; now your job is to make sure nothing gets dropped at the finish line.

The cardinal rule: **print everything**. TLS centres reject screen-only documents. Phone photos are not acceptable; you need printed Schengen-spec photos. Forgotten documents = rescheduling fee + lost trip momentum.

Apply ETHOS principle #8 ("The mundane carries weight") — the cover letter is rhetoric; the printed barcode page is what TLS scans on entry.

## When to use this skill

- User's TLS appointment is tomorrow or in a few days
- User is first-time applicant and wants to feel ready
- User is taking the whole family and worried about coordination
- After `/audit-application` passed and the only step left is showing up

## The 24-hour checklist

### Documents (per applicant)

| Item | Status | Notes |
|---|---|---|
| ☐ Original passport | Mandatory | Check expiry > 3 months past trip end |
| ☐ Passport photocopy (bio page) | Mandatory | Black & white acceptable |
| ☐ France-Visas application form (printed + signed) | Mandatory | All pages including the barcode page |
| ☐ 2 Schengen-compliant photos (physical prints) | Mandatory | 35×45mm, white background, < 6 months old |
| ☐ TLS appointment confirmation (printed) | Mandatory | Required to enter centre |
| ☐ Travel insurance certificate (printed) | Mandatory | €30k+ coverage, full duration |
| ☐ Flight reservation (printed) | Mandatory | Round-trip OR onward; PDF print OK |
| ☐ Accommodation booking (printed) | Mandatory | All nights covered |
| ☐ Bank statements (3 months, printed) | Mandatory | Last 3 calendar months |
| ☐ Employer letter (printed) | Employed | Within last 1 month preferred |
| ☐ Last 3 payslips (printed) | Employed | Standard request |
| ☐ Cover letter (printed) | Mandatory | Under 300 words; signed |
| ☐ Apostille copy of foreign docs (if applicable) | Conditional | Originals not photocopies |
| ☐ Certified translations (if applicable) | Conditional | Each non-English/French doc |

### For families with minors

| Item | Status |
|---|---|
| ☐ Child's birth certificate (long-form, original or certified) | Mandatory |
| ☐ School absence letter (if term-time) | Conditional |
| ☐ Notarised parental consent (if one parent staying behind) | Conditional |
| ☐ Marriage certificate (if parents have different surnames) | Conditional |
| ☐ Adoption order (if adopted child) | Conditional |

### For sponsored applicants

| Item | Status |
|---|---|
| ☐ Sponsor's signed support letter (printed) | Mandatory |
| ☐ Sponsor's bank statements (printed) | Mandatory |
| ☐ Sponsor's employer letter (printed) | Mandatory |
| ☐ Sponsor's passport / ID photocopy | Mandatory |
| ☐ Relationship proof (marriage cert, birth cert, etc.) | Mandatory |

### Practical items

| Item | Status |
|---|---|
| ☐ Card for TLS service fee (~£35/applicant) | Mandatory |
| ☐ Card for visa fee (~£80/applicant) | Mandatory |
| ☐ Backup cash | Recommended |
| ☐ Folder or binder to keep docs organised | Strongly recommended |
| ☐ Phone fully charged | Useful for tracker check-ins |
| ☐ Tube/transport pass / route planned | Don't be late |
| ☐ Snack / water bottle | Wait can be long |

### What NOT to bring

| Item | Why |
|---|---|
| Large bag | Must be stored on entry; slows things down |
| Sharp items (scissors, nail file, multi-tool) | Security check |
| Cash equivalent of trip cost (e.g. £2000+) | Looks suspicious |
| Family member who is not applying | Cannot enter; will need to wait outside |
| Pet | Not permitted in centre |

## Procedure

1. **Walk through the checklist with the user.** Confirm each item is ready and printed (or noted).

2. **Identify missing items.** Order by criticality:
   - Mandatory missing → must source today
   - Recommended missing → consider buying/preparing
   - Optional → user choice

3. **Provide last-minute fix paths** for common missing items (see "Last-minute fixes" below).

4. **Confirm transport plan.** Centre arrival time = appointment time minus 15 minutes (not minus 60 — gives buffer but not so much you're early-early).

5. **Set expectations** for the appointment itself (see "What happens at TLS" below).

## Last-minute fixes

| Missing | Fix |
|---|---|
| Photos | Snappy Snaps / Photo-Me / Boots have same-day printing (~£8); some open 7am |
| Printing | Library / Print shop / Office Depot — last-minute printing |
| Bank statement | Online banking download → print (5 min) |
| Employer letter | Email HR for emergency PDF (may not be possible same-day) |
| Cover letter | Generate via `/cover-letter` skill, print at home |
| Cash | ATM at TLS centre or nearby |
| Folder | WHSmith / Rymans / Tesco £2-5 |

## What happens at TLS — set user expectations

1. **Arrive 15 min early**. Don't be later (rescheduling fee). Don't be earlier than 30 min (waiting room can't hold everyone).
2. **Show TLS appointment confirmation on entry** — usually a printed barcode is scanned.
3. **Security check** — light bag inspection.
4. **Wait** — 10-30 min typical; up to 60+ in peak times.
5. **Document submission** — TLS staff reviews docs in order. Don't pre-arrange in a specific way; they have their own filing.
6. **Biometrics** — fingerprints + photo (in addition to your own photos). 5-10 min.
7. **Fee payment** — TLS service fee + visa fee. Card preferred.
8. **Acknowledgement receipt** — keep this; needed for tracking.
9. **Departure** — typically 60-90 min total time at centre.

## Output template

```
TOMORROW'S APPOINTMENT CHECKLIST
For: {{APPLICANT_NAMES}}
TLS centre: {{CENTRE}}
Appointment time: {{TIME}} ({{DATE}})

═════════════════════════════════════════════════════════════════════
STATUS
═════════════════════════════════════════════════════════════════════

{{IF_READY:    ✅ All checks pass — you're ready}}
{{IF_MISSING: 
    ⚠️ Missing items requiring action:
    - {{ITEM_1}}: {{FIX_PATH}}
    - {{ITEM_2}}: {{FIX_PATH}}
}}

═════════════════════════════════════════════════════════════════════
TRANSPORT PLAN
═════════════════════════════════════════════════════════════════════

Leave home: {{TIME}} (allowing for {{N}} min transit)
Arrive at TLS: {{TIME}} ({{N}} min before appointment)

═════════════════════════════════════════════════════════════════════
DON'T FORGET
═════════════════════════════════════════════════════════════════════

- Card for payment (TLS fee ~£35/applicant + visa fee ~£80/adult)
- Phone fully charged
- Folder with all docs in order
- Arrive 15 minutes early

═════════════════════════════════════════════════════════════════════
WHAT TO EXPECT AT TLS
═════════════════════════════════════════════════════════════════════

Total time at centre: 60-90 min typical
Steps: Entry → Security → Document review → Biometrics → Payment → Receipt
Tomorrow evening: track status at https://visas-fr.tlscontact.com/en-us

═════════════════════════════════════════════════════════════════════
NEXT
═════════════════════════════════════════════════════════════════════

Run /appointment-day in the morning for last-minute reminders.
After appointment, run /track-application for waiting-period guidance.
```

## Routing rules

| Situation | Suggest next |
|---|---|
| All items checked, day done | Get a good night's sleep |
| Critical item missing day-before | Fix immediately; if can't, reschedule appointment (TLS allows one free reschedule) |
| User is in a panic / overthinking | Run through the checklist one more time, then stop |
| Family with multiple applicants | Print one master copy of family-shared docs (accommodation, insurance), individual copies for each applicant's unique docs |
| Next-day morning | `/appointment-day` for the morning-of routine |

## Common pitfalls

| Pitfall | Why it hurts | Fix |
|---|---|---|
| Bringing documents only on phone screen | TLS may not accept screen viewing | Print everything |
| Phone photo instead of printed photo | Not Schengen-compliant | Get prints from Snappy Snaps etc. |
| Wrong photos (too small, wrong background, glasses) | Photo rejected; rebook | Re-take to spec |
| Forgetting TLS appointment confirmation | Cannot enter | Print before leaving |
| Last-minute discovery that bank statement is too old | Re-print needed | Download fresh statement online |
| Multiple bookings instead of one consolidated trip | TLS confused | Consolidate or annotate with cover letter |
| Bringing originals only with no copies | TLS may keep originals | Always bring copies |
| Trying to apply on a different applicant's behalf | Each applicant must be present | All applicants must attend in person |

## Authoritative sources

- TLScontact UK — https://visas-fr.tlscontact.com/en-us — verified 2026-05-24
- France-Visas appointment requirements — https://france-visas.gouv.fr/en/web/france-visas — verified 2026-05-24

## Notes for maintainers

- For the very anxious user, sometimes the value of this skill is just running through the checklist twice for reassurance. That's valid.
- TLS one-free-reschedule policy: if a critical doc is genuinely missing, recommend rescheduling rather than attending with gaps. Refusal costs more.
- Same-day photo printing: Snappy Snaps and Photo-Me kiosks open early (some 7am); useful for last-minute photo issues.
- For Sunday-evening appointments where applicant realises Monday is missing something, advise reschedule rather than scramble.
- For group bookings, the TLS centre may seat all applicants together for the document review but biometrics are separate. Each applicant must be present.
- Phone fully charged matters because: tracker check-in, payment via card-on-file may need 2FA, family coordination if travelling together.
- Some TLS centres allow you to upload docs in advance via the TLS portal — this can save 5-10 min on arrival. Check your centre's procedure.
