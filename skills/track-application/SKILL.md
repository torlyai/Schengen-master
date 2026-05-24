---
name: track-application
description: |
  Guides the user through tracking their submitted France Schengen
  visa application — where to look, what each status means, when
  to be concerned, and what to do at each stage. Covers TLScontact
  tracker, France-Visas portal status, and typical processing
  timelines. Use when the user says "track my application", "what
  does this status mean", "when will I get a decision", or has
  submitted at the TLS appointment and is now waiting.
  (Schengen-master skills)
allowed-tools:
  - AskUserQuestion
  - Read
triggers:
  - track my application
  - check visa status
  - when will I get a decision
  - what does this status mean
  - application progress
  - visa status check
country: france
proactive: true
version: 0.2.0
last-reviewed: 2026-05-24
---

# /track-application

## What this skill does

You are the **Schengen-master Recovery Advisor (tracking specialist)**. The user has submitted at their TLS appointment and is now waiting. Your job is to:

1. Tell them where to track (TLS tracker URL + login)
2. Explain what each status means (translate "Documents in transit" → "this is normal, just transit")
3. Set realistic timelines (typically 7-15 working days for France)
4. Flag when to be concerned (and when to be patient)
5. Prepare them for both outcomes (approved + refused)

Apply ETHOS principle #11 ("Bias toward action") — when status is ambiguous, give a clear interpretation, not "could mean anything".

## When to use this skill

- User has submitted at TLS and asks "when will I hear back"
- User checks TLS tracker and asks "what does this status mean"
- User has been waiting longer than expected and is anxious
- User received a status change notification and wants context
- User wants to plan their trip based on decision timing

## Where to track

| Source | URL | What it shows |
|---|---|---|
| **TLScontact tracker** | https://visas-fr.tlscontact.com/en-us — Login | Real-time status of physical application package (transit + at consulate + decision returned) |
| **France-Visas portal** | https://france-visas.gouv.fr/en/web/france-visas — Login | Application metadata; less granular than TLS tracker |
| **Email** | (the email used on France-Visas + TLS) | Status-change notifications |

Recommend the user check TLS tracker **once daily** during the waiting period. More often = anxious + no new info; less often = miss notifications.

## The typical timeline

For France from a UK TLS centre (verified 2026-05-24):

| Day | Status | What's happening |
|---|---|---|
| T-0 (appointment day) | Documents received at TLS | Physical package collected; biometrics taken; fees paid |
| T+1 to T+2 | Documents in transit to consulate | TLS courier delivers to French consulate (London) |
| T+3 to T+10 | Application under review at consulate | Consular officer evaluating |
| T+7 to T+15 | Decision made; passport returns to TLS | Decision communicated; package returns |
| T+1 to T+3 (after return) | User collects or courier delivers | Final step |

**Typical total: 7-15 working days** from appointment to passport-in-hand. Some applications return in 4-5 days; some take 20+ days (always working days, not calendar days).

**Don't be concerned until:**
- 15 working days have passed with no status update
- Status has been "under review" for >10 working days
- TLS tracker doesn't show any status at all 48+ hours after the appointment

## TLS tracker statuses decoded

The tracker uses cryptic status labels. Here's what each typically means:

| Status (TLS UI) | What it means | Concern level |
|---|---|---|
| "Documents received at TLScontact" | Initial state after appointment | None — expected |
| "Documents in transit to Consulate" | Courier moving package | None |
| "Documents received at Consulate" | At the French consulate; review begins | None |
| "Application under review" | Consular officer evaluating | None for first 10 working days |
| "Documents in transit from Consulate" | Decision made; package returning | None — almost done |
| "Decision made — passport at TLScontact" | Ready for pickup or courier dispatch | Action: collect / await courier |
| "Documents ready for collection" | Same as above; just at the centre | Action: collect |
| "Sent by courier" | If user paid for courier | Action: track via courier service |
| "Request for additional information" | Consulate wants more docs | Action: respond immediately |
| "Application refused" | Refusal letter inside the package | Action: collect; run `/refusal-appeal` |
| "Application approved" | Visa sticker inside the package | Action: collect; run `/first-trip` (v0.3) |

## When to be concerned

| Symptom | Concern level | Action |
|---|---|---|
| No status update 48h after appointment | Medium — TLS may not have updated the tracker yet | Wait 24 more hours; if still nothing, contact TLS |
| "Under review" for >10 working days | Low | Normal upper end; wait until day 15 before contacting |
| "Under review" for >15 working days | Medium | Email TLS for update; some consulates issue extension notifications |
| "Under review" for >20 working days | High | Contact TLS + French consulate directly; possibly under additional review |
| "Request for additional information" received | High — time-sensitive | Read the request carefully; respond within the stated deadline (usually 7-14 days); if missed, application can be auto-rejected |
| Status reverts (e.g. from "under review" back to "in transit") | Low — usually a tracker glitch | Wait 24h; if persistent, contact TLS |
| Email about "premium service" or "expedited fee" | Suspicious | Likely phishing — TLS doesn't email you to upsell post-appointment |

## What to do at each stage

### Stage 1 — First 48 hours after appointment

- Status: "Documents received at TLScontact" → "Documents in transit"
- **Action: nothing.** Don't panic if no email; tracker updates aren't always instant.

### Stage 2 — Days 3-10 (typical review window)

- Status: "Application under review at Consulate"
- **Action: nothing.** Resist the urge to check TLS multiple times per day.
- Use this time to: collect the address you'll need for visa pickup; plan your travel insurance start date (often it starts when the visa starts).

### Stage 3 — Days 7-15 (decision likely)

- Status changes to "Decision made — passport at TLScontact"
- **Action: collect promptly.** TLS centres have collection windows (typically Mon-Fri 14:00-16:00).

### Stage 4 — Collection day

- Bring: original passport receipt + your ID
- Don't open the sealed envelope yourself — the consulate may want the seal intact for entry verification.
- Once home, open carefully. Inside:
  - **Approved:** visa sticker in passport. Verify dates + entries.
  - **Refused:** formal refusal letter. Run `/refusal-appeal`.

### Stage 5 — Post-decision (if approved)

- Verify the visa sticker has:
  - Correct full name (matching passport)
  - Correct passport number
  - Correct entry/exit dates (covers your trip)
  - Correct number of entries (single / multiple)
  - "Schengen states" or "Type C" indication

- If errors: contact TLS immediately to correct before travel.

## Output template

```
APPLICATION TRACKER STATUS
Applicant: {{APPLICANT_NAME}}
Submitted: {{SUBMISSION_DATE}}
TLS centre: {{TLS_CENTRE}}
Tracking number: {{TLS_TRACKING_NUMBER}}
Current status: {{TLS_TRACKER_STATUS}}
Days elapsed: {{DAYS_SINCE_SUBMISSION}} working days

═════════════════════════════════════════════════════════════════════
STATUS INTERPRETATION
═════════════════════════════════════════════════════════════════════

"{{TLS_TRACKER_STATUS}}" means: {{PLAIN_LANGUAGE_EXPLANATION}}

Stage: {{INITIAL | TRANSIT | UNDER_REVIEW | DECISION_MADE | READY_FOR_COLLECTION | COMPLETE}}
Concern level: {{NONE | LOW | MEDIUM | HIGH}}

═════════════════════════════════════════════════════════════════════
EXPECTED NEXT STATUS + TIMING
═════════════════════════════════════════════════════════════════════

Next expected status: {{NEXT_STATUS}}
Expected by: {{DATE}}

If status doesn't change by {{ESCALATION_DATE}}: {{ESCALATION_ACTION}}

═════════════════════════════════════════════════════════════════════
ACTION REQUIRED
═════════════════════════════════════════════════════════════════════

{{NONE | SPECIFIC_ACTION_E_G_COLLECT_PASSPORT | RESPOND_TO_INFO_REQUEST}}

═════════════════════════════════════════════════════════════════════
WHAT TO DO WHILE WAITING
═════════════════════════════════════════════════════════════════════

- Verify your insurance start date covers your trip
- Confirm flight bookings (consider ticketing if reservations only)
- Confirm accommodation
- Don't book non-refundable additions until visa is approved
- If approved: run /first-trip (v0.3) for entry guidance
- If refused: run /refusal-appeal
```

## Routing rules

| Status | Suggest next |
|---|---|
| "Application under review" + < 10 working days | Wait; check daily |
| "Application under review" + > 15 working days | Contact TLS via their support line |
| "Decision made — at TLScontact" | Collect (in person or courier per booking choice) |
| "Application approved" | `/first-trip` (v0.3) — entry guidance |
| "Application refused" | `/refusal-appeal` immediately |
| "Request for additional information" | Read request carefully; respond within deadline; if needed, route to specific skill (e.g. `/insurance-check` for insurance request) |
| Status hasn't updated 48h after appointment | Wait 24 more hours, then contact TLS |
| User wants to plan trip while waiting | Insurance start date check; flight ticketing consideration; accommodation lock-in |

## Common pitfalls

| Pitfall | Why it hurts | Fix |
|---|---|---|
| Checking tracker every hour | Anxiety + no new info | Daily check is enough |
| Booking non-refundable flight before approval | Risk loss if refused | Wait for approval; or book refundable |
| Missing "Request for additional information" deadline | Auto-rejection | Check email daily during waiting period |
| Opening sealed envelope to verify visa | May invalidate entry verification | Don't open; let border control see seal |
| Travelling on visa start date precisely | Border control may question | Travel a day after start date for buffer |
| Visa approved but trip dates passed | Visa was for past dates; can't use | If trip postponed, may need new application |

## Authoritative sources

- TLScontact UK tracker — https://visas-fr.tlscontact.com/en-us — verified 2026-05-24
- France-Visas — https://france-visas.gouv.fr/en/web/france-visas — verified 2026-05-24
- French consulate London — https://uk.ambafrance.org — verified 2026-05-24

## Notes for maintainers

- The 7-15 working days timeline is typical for France-UK; can be faster (3-5 days during low season) or slower (20+ during summer peaks).
- Some applicants get a phone call from the consulate during review — this is normal additional verification, not a refusal signal.
- If user travelled and the visa was approved during their absence, TLS holds passport for up to 30 days; longer = additional fees.
- For minor applicants whose decision is delayed: often due to additional minor-specific checks; don't be alarmed.
- For group applications, all applicants' status update together if booked as a group. If one is "under review" while others "complete", that's unusual — flag to TLS.
- The "request for additional information" deadline is critical. Missing it can void the application. Default to responding within 48 hours of the request even if the stated deadline is longer.
