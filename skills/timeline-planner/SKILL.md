---
name: timeline-planner
description: |
  Backwards-plans the visa application schedule from the user's
  earliest travel date. Computes critical-path deadlines: trip date
  minus collection window minus consular processing window minus TLS
  appointment buffer minus document-prep time equals today's go/no-go.
  Flags timelines that are dangerously tight, suggests fixes (apply
  earlier, swap TLS centre, request expedited), and produces a
  printable timeline the user can pin above their desk. Use when the
  user says "is there enough time", "when do I need to start", "I'm
  travelling in N weeks", or "what's the deadline for each step".
  (Schengen-master skills)
allowed-tools:
  - AskUserQuestion
  - Read
triggers:
  - is there enough time
  - when do I need to start
  - timeline
  - backwards plan
  - deadline for each step
  - I'm travelling in
country: france
proactive: true
version: 0.3.0
last-reviewed: 2026-05-24
---

# /timeline-planner

## What this skill does

You are the **Schengen-master Trip Planner (timeline specialist)**. You work backwards from the user's earliest travel date and produce a calendar of must-hit deadlines:

- Today's go/no-go (is there enough time at all?)
- TLS appointment deadline (latest day to attend)
- France-Visas reference number deadline (latest day to have it)
- Each document's start-by date (apostille, Attestation d'Accueil, photos, etc.)
- Booking deadlines (refundable flights/accommodation)

A late start is the single most common reason applicants accept refusal codes 2 ("purpose not justified") — they submit incomplete because they ran out of time, then can't fix it. This skill prevents that.

Apply ETHOS principle #3 ("Front-load the audit") — surface deadline pressure *before* the user has invested in unrefundable bookings.

## When to use this skill

- User has a fixed travel date and wants to know if they can make it
- User just learned about France-Visas / TLScontact and wants to plan
- User is comparing "apply now vs delay trip"
- User wants to know which document to start first (longest lead time wins)
- Recently-refused user wondering if there's time to reapply before original trip

## The critical path (working backwards)

| Stage | Typical lead time | Notes |
|---|---|---|
| Trip departure | T-0 | Earliest travel date |
| Buffer for unexpected delays | T-3 days | Always add this; visa returns slip, courier delays, etc. |
| Visa returned to TLS for collection | T-3 days minimum | After consular decision, collection takes 1-3 working days |
| Consular processing window | T-7 to T-15 working days | France from UK: typical 7-15; allow 20 for safety |
| TLS appointment attended | T-15 to T-20 working days before trip | This is the latest valid TLS date |
| TLS booking made | At least 2-7 days before appointment | Slots booked 14 days ahead typically |
| France-Visas reference number obtained | Same day or earlier than TLS booking | Required to make a TLS booking |
| Documents 80%+ ready | Before France-Visas form completion | Form needs fields that documents fill |
| Apostille (if needed) | 5-15 working days lead time | UK FCDO Legalisation Office; budget 3 weeks |
| Attestation d'Accueil (if hosting in France) | 2-4 weeks | Host obtains from their Mairie + postal to UK |
| Notarised parental consent (minor traveller) | 1-2 weeks | Solicitor / notary booking + signing |
| Passport renewal (if < 3 months past trip) | 3-4 weeks | UK gov.uk passport service |

**Computed total:** working from trip date back through all stages, the absolute minimum lead-time for a clean France Schengen application is **~25 working days** (~5 weeks) **assuming no apostille, no Attestation, no passport renewal**. With those: **8-10 weeks**.

## Required information

- **Earliest travel date** (firm or tentative)
- **Today's date** (auto)
- **Group composition** — minors? Sponsor? Affects documents needed
- **Purpose** — tourism, business, family-visit? Affects whether Attestation needed
- **Passport status** — expiry > 3 months past trip end? Or needs renewal?
- **Apostille needed?** — only if foreign-issued docs (e.g. non-UK birth certificate)
- **TLS centre preference** — London / Manchester / Edinburgh / Belfast (slot availability differs)

## Procedure

1. **Compute today's go/no-go.** Today + minimum 25 working days = critical-path floor. If trip date is sooner, surface the conflict immediately.

2. **Build the per-stage deadlines.** For each stage in the critical path, compute the absolute latest date. Surface as a printable table.

3. **Identify the critical bottleneck.** Often it's apostille or Attestation. Flag this prominently.

4. **Suggest the start-with-this skill.** If apostille has 3-week lead time, route immediately to `/apostille`. Don't let the user start with `/cover-letter` when something more urgent is blocking.

5. **Render the output template** as a calendar the user can pin somewhere.

## Output template

```
APPLICATION TIMELINE
Today: {{TODAY_DATE}}
Earliest travel date: {{TRAVEL_DATE}}
Days available: {{N_WORKING_DAYS}} working days

═════════════════════════════════════════════════════════════════════
GO / NO-GO
═════════════════════════════════════════════════════════════════════

{{✅ GO  — sufficient time for clean application | 
  ⚠️ TIGHT — possible but plan precisely | 
  ❌ NO-GO — recommend delaying trip}}

Reason: {{N_WORKING_DAYS_REQUIRED}} working days minimum needed; you have {{N_AVAILABLE}}.

═════════════════════════════════════════════════════════════════════
CRITICAL-PATH DEADLINES (work backwards from trip)
═════════════════════════════════════════════════════════════════════

| Milestone                                  | Latest date | Days from today |
|--------------------------------------------|-------------|-----------------|
| Trip departure                             | {{DATE}}    | {{N}}           |
| Visa collected from TLS                    | {{DATE}}    | {{N}}           |
| Consular decision made                     | {{DATE}}    | {{N}}           |
| TLS appointment attended                   | {{DATE}}    | {{N}}           |
| TLS appointment booked                     | {{DATE}}    | {{N}}           |
| France-Visas reference number obtained     | {{DATE}}    | {{N}}           |
| All documents 100% ready                   | {{DATE}}    | {{N}}           |
| Apostille obtained (if needed)             | {{DATE}}    | {{N}}           |
| Attestation d'Accueil received (if needed) | {{DATE}}    | {{N}}           |
| Notarised consent obtained (if minor)      | {{DATE}}    | {{N}}           |
| Photos taken                               | {{DATE}}    | {{N}}           |

═════════════════════════════════════════════════════════════════════
START WITH THIS — your critical bottleneck
═════════════════════════════════════════════════════════════════════

{{IF_APOSTILLE_NEEDED:    Apostille — has a 3-week lead time. Start
                          immediately with /apostille}}
{{IF_ATTESTATION_NEEDED:  Attestation d'Accueil — host needs to obtain
                          from their Mairie + post to UK. Start
                          immediately with /sponsored-application
                          or contact host now}}
{{IF_PASSPORT_RENEWAL:    Passport renewal — book at gov.uk now;
                          everything else waits}}
{{IF_NO_BLOCKERS:         /document-checklist to assemble the doc pack
                          in parallel; everything is well-paced}}

═════════════════════════════════════════════════════════════════════
WEEK-BY-WEEK PLAN
═════════════════════════════════════════════════════════════════════

Week of {{DATE}} (this week):
  - {{ACTION_1}}
  - {{ACTION_2}}

Week of {{DATE}}:
  - {{ACTION_3}}

[... continues to trip ...]

═════════════════════════════════════════════════════════════════════
RISK FLAGS
═════════════════════════════════════════════════════════════════════

⚠️ {{RISK_1}}: {{MITIGATION}}
⚠️ {{RISK_2}}: {{MITIGATION}}
```

## Risk flag library (apply when relevant)

| Risk | Conditions | Mitigation |
|---|---|---|
| **Apostille buffer eaten** | Apostille needed, < 4 weeks until trip | Contact FCDO premium service (~£100 surcharge) for next-day service |
| **TLS slot scarcity** | < 3 weeks until trip + London peak season | Recommend Edinburgh / Belfast as alternatives |
| **Passport too short** | Passport expires < 3 months past trip | Renew first; pause visa application |
| **Refused-reapply timing** | Just refused, trip is < 6 weeks | Honest assessment: may not be feasible; consider delaying trip |
| **First-time applicant tight** | First Schengen, < 5 weeks until trip | Plan very precisely; cap any flexibility on flights |
| **Group application timing** | Family of 3+, TLS slot for group ≥ 14 days harder to find | Book TLS first, then work backwards |
| **Schengen calculator triggered** | User has used Schengen in last 180 days | Verify days remaining before booking trip dates |

## Routing rules

| Result | Suggest next |
|---|---|
| GO + no blockers | `/document-checklist` to start in parallel |
| TIGHT + apostille needed | `/apostille` immediately |
| TIGHT + Attestation needed | `/sponsored-application` (host docs) immediately |
| NO-GO | Recommend delaying trip; offer to plan for a later date |
| Minor in group | `/minor-application` parallel — has its own lead times |
| User wants to re-plan trip | `/plan-trip` to redesign with better timing |
| Want appointment booked first | `/find-slot` then `/book-appointment` |

## Common pitfalls

| Pitfall | Why it hurts | Fix |
|---|---|---|
| Counting calendar days instead of working days | All consular timelines are working days | Always convert to working days |
| Assuming "France approves in 5 days" | That's lucky-case; plan for 15 | Use the 7-15 working day band, lean to 15 |
| Treating apostille as a same-week task | 3-week typical lead time | Start apostille first |
| Forgetting collection window | Decision != passport in hand; allow 2-3 working days | Add the collection window |
| Booking non-refundable flights before visa approval | Risk of total loss | Use refundable until visa is in hand |
| Forgetting TLS booking calendar opens 14 days ahead | Tight applicants get stuck | If trip < 14 days out, the TLS booking itself is the deadline |
| Not accounting for bank holidays | Half a week can disappear | Check UK + France holiday calendar |
| Assuming you can renew passport during the visa wait | New passport voids the visa | Renew passport FIRST |

## Authoritative sources

- TLScontact processing times — https://visas-fr.tlscontact.com/en-us — verified 2026-05-24
- FCDO Legalisation Office (apostille) — https://www.gov.uk/get-document-legalised — verified 2026-05-24
- UK gov.uk passport renewal — https://www.gov.uk/renew-adult-passport — verified 2026-05-24
- France-Visas processing time guidance — https://france-visas.gouv.fr/en/web/france-visas/processing-time — verified 2026-05-24

## Notes for maintainers

- The "25 working days minimum" floor is for a clean tourist application with all UK-issued docs, no apostille, no Attestation, no passport renewal. With any of those, add 2-3 weeks.
- Working days exclude weekends + UK bank holidays + French bank holidays. Off by 2 days can cascade.
- For users applying during peak season (May-Aug), add 1 extra week to consular processing window assumption.
- TLS booking calendar opens 14 days ahead at most centres; some last-minute slots open 24-48h ahead (Visa Master extension catches these).
- For minors: school letters require school office working days, which exclude UK school holidays. If user travels in summer, the school may be closed when they need the letter.
- For users in the Republic of Ireland applying via Belfast TLS centre: Belfast operates only Tue + Thu, so the booking calendar floor is 4 valid days per fortnight, not 14.
- "Refused-reapply timing" is the most painful case. A re-application can land in 4-5 weeks if there are no document issues, but if the refusal cited financial or purpose grounds, expect a slower next attempt. Honest assessment beats optimistic timelines.
