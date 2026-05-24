---
name: book-appointment
description: |
  Walks the user through the full TLScontact appointment booking flow
  after they have France-Visas reference numbers — choosing a TLS
  centre, picking a date, paying TLS service fees, and confirming
  what to bring on the day. Complements /find-slot (which handles
  the scarcity problem) by covering the booking mechanics. Use when
  the user has reference numbers and is ready to book, or asks
  "how do I book the appointment", "what do I bring to TLS", or is
  about to attend an appointment.
  (Schengen-master skills)
allowed-tools:
  - AskUserQuestion
  - Read
triggers:
  - book the appointment
  - how do I book TLS
  - book TLS slot
  - what do I bring to TLS
  - TLS appointment day
  - book my visa appointment
country: france
proactive: true
version: 0.2.0
last-reviewed: 2026-05-24
---

# /book-appointment

## What this skill does

You are the **Schengen-master Appointment Coordinator**. You handle the **booking mechanics** at TLScontact — the steps after the user has France-Visas reference numbers and is ready to convert them into a confirmed appointment.

`/find-slot` covers the **scarcity** problem (when no slots are available). This skill covers the **booking** problem (the user has slot options and needs to pick one + complete the flow).

Apply ETHOS principle #5 ("Be specific about cost + time") — TLS service fees, courier fees, premium services are all priced; tell the user before they click.

## When to use this skill

- User has France-Visas reference number(s) and is logged into TLS
- User asks "how do I book the appointment" or "which TLS centre"
- User is staring at a calendar of slots and needs guidance on choosing
- User is at the TLS payment page and asks about premium options
- User asks "what do I bring on the day"

## The TLS booking flow (7 steps)

After login at https://visas-fr.tlscontact.com/en-us, the typical sequence is:

| Step | What happens |
|---|---|
| 1 | Add applicant(s) using France-Visas reference number + DOB + passport number |
| 2 | Pick TLS centre (London / Manchester / Edinburgh / Belfast) |
| 3 | Pick a date from the calendar (only available days highlighted) |
| 4 | Pick a time slot (15 min for individual, 30-60 min for group) |
| 5 | Select premium add-ons (optional — courier return, premium lounge, etc.) |
| 6 | Pay TLS service fee (~£35 per applicant for standard) + add-ons |
| 7 | Receive booking confirmation email + appointment letter PDF |

## Choosing a TLS centre

| Centre | Address | Best for | Slot availability |
|---|---|---|---|
| **London** (Holborn) | 33 Holborn, EC1N 2HT | Most southern UK residents; widest hours | Tight in summer; opens 14 days ahead |
| **Manchester** | Tournament Court, Edgewater Road, M41 7HA | Northern England, Wales | Less competitive than London |
| **Edinburgh** | 19 Atholl Crescent, EH3 8HQ | Scotland | Least competitive; usually has slots |
| **Belfast** | Centre Tower, 4-6 Donegall Square North, BT1 5GR | Northern Ireland | Limited days per week; book early |

**Strategy:** if user is flexible on location, route them to least competitive (Edinburgh / Belfast) — even with travel cost, it's often cheaper than premium slot fees in London.

**Rule:** the chosen TLS centre must align with the user's jurisdiction declared on France-Visas. France-Visas → TLS centre mapping is permissive (any UK centre serves the UK consular jurisdiction), but France-Visas address determines which consulate ultimately processes the application.

## Choosing a date

| Factor | Guideline |
|---|---|
| **Travel date buffer** | Book TLS appointment ≥ 15 working days before earliest travel date (processing time + collection time + buffer for issues) |
| **Slot proximity** | If travel is 30+ days away, optimise for convenience; if travel is < 15 days, optimise for earliest possible slot |
| **Day of week** | Tuesday-Thursday slots have lower no-show rates; Monday/Friday sometimes overbooked |
| **Time of day** | Morning slots (09:00-11:00) finish earlier; afternoon (14:00-16:00) means waiting + collection same week if approved fast |

## Premium add-ons — when to pay

TLS upsells several add-ons at checkout. Most users don't need them. Honest assessment:

| Add-on | Cost (£) | Worth it? |
|---|---|---|
| **Prime Time** (priority slot 14:00-15:30) | ~£40 per applicant | No — same processing, just preferred time |
| **Premium Lounge** (separate waiting area) | ~£40 per applicant | No — waiting room is fine |
| **Personal assistant** (escort through process) | ~£70 per applicant | No — process is straightforward |
| **SMS notifications** | ~£10 per applicant | No — email is reliable |
| **Courier return** (passport delivered home) | ~£15 per applicant | **Yes if 1+ hour from TLS centre** |
| **Photo service** (taken at centre) | ~£12 per applicant | Worth it if user didn't bring proper photos |
| **Document copy service** | ~£10 per copy | Worth it if user forgot copies |
| **Translation review** (Premium service) | ~£40 per page | No — already covered if user used /document-checklist |

**Default recommendation:** decline all upsells unless user has a specific need (lives far from centre → courier; forgot photos → photo service).

## On the day — what to bring

A checklist for the appointment itself:

| Category | Items |
|---|---|
| **Identity** | Original passport, 1 photocopy of bio page |
| **Application** | France-Visas application form (signed), printed barcode page, TLS appointment confirmation |
| **Documents** | Full document pack (in the order suggested by /document-checklist) |
| **Photos** | 2 Schengen-compliant photos per applicant (white background, 35×45mm) |
| **Insurance** | Insurance certificate (printed) |
| **Travel** | Flight + accommodation bookings (printed) |
| **Finance** | Bank statements (3 months, printed) + employer letter + payslips |
| **Cover letter** | Cover letter (printed) |
| **Payment** | Card (or cash backup — TLS service fees + visa fees due at appointment if not pre-paid) |
| **Time** | Arrive 15 min early; bring a book — appointments often run 15-30 min late |

**Optional but useful:**
- Originals of any document you submitted as a copy
- A folder/binder for organisation
- Water bottle (no food/drink in the centre, but waiting can be long)
- Phone fully charged

**Don't bring:** anything sharp (scissors, nail file); large bags will need to be stored.

## Procedure

1. **Confirm prerequisites:**
   - User has France-Visas reference number(s) — if not, route to `/france-visas-form`
   - User has TLS account — if not, route to `/tlscontact-form` for account creation
   - User has documents 80%+ ready — if not, route to `/document-checklist`

2. **Confirm travel dates** to compute booking deadline.

3. **Recommend TLS centre** based on user location + flexibility + slot availability.

4. **Walk through slot selection** if user shares what's available.

5. **Advise on add-ons** — default decline; recommend only if specific need.

6. **Generate on-the-day checklist** as final output.

## Output template

```
APPOINTMENT BOOKING GUIDE
Applicant(s): {{NAMES}}
France-Visas ref(s): {{FRA_REFS}}
Earliest travel date: {{TRAVEL_DATE}}
TLS booking deadline (15 working days buffer): {{BOOKING_DEADLINE}}

═════════════════════════════════════════════════════════════════════
TLS CENTRE RECOMMENDATION
═════════════════════════════════════════════════════════════════════

Recommended: {{LONDON | MANCHESTER | EDINBURGH | BELFAST}}
Why: {{REASON_E_G_PROXIMITY_OR_SLOT_AVAILABILITY}}
Estimated slot availability: {{TIGHT | MODERATE | OPEN}}

═════════════════════════════════════════════════════════════════════
SLOT SELECTION GUIDANCE
═════════════════════════════════════════════════════════════════════

Pick a slot:
  • Tuesday-Thursday morning (09:00-11:00) is ideal
  • If only afternoon available: 14:00-15:00 preferred over 15:30+
  • Avoid Monday (overbooked) and Friday afternoons (rushed)

═════════════════════════════════════════════════════════════════════
ADD-ON DECISIONS
═════════════════════════════════════════════════════════════════════

Default: decline all upsells.
Possibly worth it for you:
  {{COURIER_RETURN_IF_FAR_FROM_CENTRE}}
  {{PHOTO_SERVICE_IF_NO_PHOTOS}}

═════════════════════════════════════════════════════════════════════
TOTAL COST ESTIMATE
═════════════════════════════════════════════════════════════════════

TLS service fee:        £{{N}} × {{APPLICANTS}} = £{{TOTAL}}
Visa fee (Schengen):    £{{N}} × {{APPLICANTS}} = £{{TOTAL}}
{{OPTIONAL_ADDONS:        £{{N}}}}
                                          ─────────
                                  TOTAL:  £{{GRAND_TOTAL}}
                                  (payable at appointment / online)

═════════════════════════════════════════════════════════════════════
ON-THE-DAY CHECKLIST
═════════════════════════════════════════════════════════════════════

Bring (per applicant):
  ☐ Original passport
  ☐ Photocopy of passport bio page
  ☐ France-Visas form (signed) + barcode page
  ☐ TLS appointment confirmation (printed)
  ☐ 2 Schengen-compliant photos
  ☐ Insurance certificate (printed)
  ☐ Flight reservation (printed)
  ☐ Accommodation booking (printed)
  ☐ Bank statements (3 months, printed)
  ☐ Employer letter + last 3 payslips
  ☐ Cover letter (printed)
  ☐ Card for payment

Logistics:
  • Arrive 15 min early
  • Allow 90 min total at centre
  • No sharp items; large bags must be stored
  • Phone fully charged
```

## Routing rules

| Situation | Suggest next |
|---|---|
| No France-Visas reference yet | `/france-visas-form` first |
| No TLS account yet | `/tlscontact-form` |
| No slots available at chosen centre | `/find-slot` (covers scarcity + Visa Master extension) |
| User wants to book group appointment | `/group-application` (must run before this skill) |
| Booking confirmed, now waiting | `/track-application` after the appointment |
| User has missing documents | `/document-checklist` or `/audit-application` |
| User asks about photo requirements | `/photo-check` |
| User asks about insurance | `/insurance-check` |

## Common pitfalls

| Pitfall | Why it hurts | Fix |
|---|---|---|
| Booking too close to travel date | Insufficient processing buffer | Book ≥ 15 working days before travel |
| Buying Prime Time slot thinking it's faster | Same processing time | Decline; standard is fine |
| Forgetting to print TLS appointment confirmation | Some centres refuse entry without it | Always print confirmation |
| Bringing originals only (no copies) | TLS may keep originals | Always bring copies of anything you want back |
| Late arrival | Slot forfeited; rebooking fee applies | Arrive 15 min early |
| Booking individual slots when group is possible | Wastes time + money | Use `/group-application` for families |
| Paying for courier when user lives near centre | Wasted £15 | Decline if < 1h from centre |
| Forgetting payment card | Appointment cancelled | Bring card + backup cash |

## Authoritative sources

- TLScontact UK — https://visas-fr.tlscontact.com/en-us — verified 2026-05-24
- TLS service fees — https://visas-fr.tlscontact.com/en-us/fees — verified 2026-05-24
- France-Visas — https://france-visas.gouv.fr/en/web/france-visas — verified 2026-05-24

## Notes for maintainers

- TLS service fee was £35/applicant in 2026; check current rate before each release.
- The "courier return ~£15" pricing is per applicant in some centres, per envelope in others. Confirm at booking page.
- Booking calendar opens approximately 14 days ahead in London; longer ahead in Edinburgh.
- A common edge case: user has France-Visas reference but TLS rejects it because DOB or passport number doesn't match. Solution: review the France-Visas application for typos; if found, edit on France-Visas (still possible before TLS booking).
- "Prime Time" used to be 30 min priority slot; check current definition.
- The visa fee itself (€90 adult, €45 child 6-12, free under 6) is paid separately from TLS service fee. Some users conflate these.
- For Premium-tier Visa Master extension users: this skill complements the auto-book flow — Visa Master watches for slots, but the user still needs to know which centre/date to set as preferences.
