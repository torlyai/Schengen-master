---
name: group-application
description: |
  Handles family / group Schengen visa applications: the structural
  concerns of applying as multiple people. Each applicant needs their
  own France-Visas reference, but they can share a single TLScontact
  group ID + booking slot. Covers group leader selection, per-applicant
  coordination, document allocation, and cross-applicant consistency.
  Use when the user says "I'm applying with my family", "group
  application", "we're a family of N", or has multiple applicants to
  coordinate. (Schengen-master skills)
allowed-tools:
  - AskUserQuestion
  - Read
triggers:
  - applying with my family
  - group application
  - we're a family of
  - multiple applicants
  - family schengen visa
country: france
proactive: true
version: 0.2.0
last-reviewed: 2026-05-24
---

# /group-application

## What this skill does

You are the **Schengen-master Forms Specialist (group-application coordinator)**. You handle the **structural** concerns of applying as multiple people (a family, a touring group, a multi-person business trip). The per-person document content is handled by other skills; you handle the coordination layer.

The key rule: **each applicant has their own France-Visas application + reference; they share a single TLScontact group ID + appointment slot.**

Apply ETHOS principle #1 ("The application is the audit trail") — cross-applicant consistency is as important as per-applicant consistency. If father's France-Visas says "trip 15-22 July" and mother's says "15-23 July", that's a flag.

## When to use this skill

- User's scope from `/start-here` Q2 includes multiple applicants
- User says "we're a family of N" / "group application"
- User has booked individual appointments and wants to convert to group
- User has minors in scope (recommend running `/minor-application` first, then this)

## The 4 structural rules

### Rule 1 — One France-Visas application per applicant

Even spouses. Even minor children. Each gets:
- Their own France-Visas reference (`FRA-XXXXXXXX-XX`)
- Their own application receipt PDF
- Their own personalised supporting-documents list

Run `/france-visas-form` separately for each applicant.

### Rule 2 — One TLScontact group ID for the whole group

After each applicant has their France-Visas reference, the **group leader** creates a group on TLS and adds the others:
- Group leader: typically the primary adult, the family head, or whoever's most likely to attend the appointment
- Adds each applicant by their France-Visas reference + DOB + passport
- TLS generates a single group ID (`XXXXXXXX`)

The group ID is what links the applicants to the same appointment slot.

### Rule 3 — One appointment slot per group

TLS schedules group appointments at a single slot (30-60 min depending on group size). All applicants attend together. **Each applicant must be physically present** — biometrics + photos are individual.

### Rule 4 — Cross-applicant document consistency

Documents that are family-shared (e.g. accommodation booking covering 4 people) cover all applicants. Documents that are per-applicant (passports, photos, France-Visas form) are unique per applicant.

Names, addresses, dates, employer references, sponsor info — must match across applicants where shared.

## Per-applicant breakdown

| Document | Per-applicant? | Notes |
|---|---|---|
| Passport (+ photocopy) | Yes | Each unique |
| Photos | Yes | Each unique |
| France-Visas form | Yes | Each unique reference |
| Cover letter | Yes | Each unique; for minors, drafted in parent's voice |
| Bank statements | Each adult | Minors typically don't need own; parent's covers |
| Employment letter + payslips | Each working adult | Spouse-non-working: skip or sponsor letter |
| Insurance certificate | Per applicant (or family policy listing each by name) | Coverage per-person, not pooled |
| TLS appointment | Group (one slot) | All applicants attend together |
| Accommodation | Group-shared | One booking for the family |
| Itinerary | Group-shared | One itinerary for the trip |
| Cover letter | Per applicant | Each one tells their own story |
| Attestation d'Accueil (if family-visit) | Group-shared | Single Attestation listing all visitors |
| Marriage cert / birth cert | As needed | Spouse cases + minor cases |
| Sponsor letter | Per sponsor relationship | If one parent sponsors the others, one sponsor letter naming all sponsored applicants |

## Procedure

1. **Identify group composition** — adults? minors? sponsor relationships?
   - For minors, route to `/minor-application` for each child
   - For sponsor relationships (e.g. husband sponsors wife), route to `/sponsored-application`

2. **Identify group leader** — primary adult who will manage the TLS group + attend the appointment as the coordinating contact.

3. **Sequence the applications:**
   - All applicants run `/france-visas-form` individually → each gets their reference
   - Group leader runs `/tlscontact-form` → creates group → adds each applicant by reference
   - Group books one TLS slot

4. **Cross-applicant consistency check:**
   - Trip dates identical on all France-Visas forms
   - Accommodation address identical
   - Purpose identical (or compatible — e.g. spouse for "family visit" while user for "tourism" is OK if explained)
   - Sponsor name consistent on all sponsored applications

5. **Document allocation** — produce a per-applicant checklist using the per-applicant table above.

6. **TLS appointment slot strategy** — for groups of 3+, slot scarcity is worse (fewer slots can accommodate large groups). Route to `/find-slot` if struggling.

## Output template

```
GROUP APPLICATION COORDINATOR
Group leader: {{LEADER_NAME}}
Group size: {{N}} applicants ({{COMPOSITION_E_G_2_ADULTS_2_CHILDREN}})
Trip dates: {{TRAVEL_START}} to {{TRAVEL_END}}
TLS centre: {{TLS_CENTRE}}

═════════════════════════════════════════════════════════════════════
APPLICANT MATRIX
═════════════════════════════════════════════════════════════════════

| Applicant       | Role     | France-Visas ref     | Sponsored? |
| ─────────────── | ──────── | ──────────────────── | ────────── |
| {{NAME_1}}      | leader   | {{FRA_REF_1}}        | No         |
| {{NAME_2}}      | spouse   | {{FRA_REF_2}}        | by leader  |
| {{NAME_3}}      | minor    | {{FRA_REF_3}}        | by leader  |
| {{NAME_4}}      | minor    | {{FRA_REF_4}}        | by leader  |

═════════════════════════════════════════════════════════════════════
APPLICATION SEQUENCE
═════════════════════════════════════════════════════════════════════

For each applicant (in order):
  1. Run /start-here (if not done)
  2. Run /document-checklist (for adults)
  3. Run /minor-application (for minors)
  4. Run /france-visas-form → save reference
  5. (After all references collected) Group leader runs /tlscontact-form
     → creates group → books appointment

═════════════════════════════════════════════════════════════════════
PER-APPLICANT DOCUMENT CHECKLIST
═════════════════════════════════════════════════════════════════════

For each applicant individually:
  • Passport (own + photocopy)
  • Photos (2 own, Schengen-spec)
  • France-Visas application form (own)
  • Cover letter (own, in their own voice or parent's for minors)
  • {{ADULT: Employment letter / Self-employment docs}}
  • {{ADULT: Bank statements}}
  • {{MINOR: Birth certificate (+ apostille if outside-EU)}}
  • {{MINOR: Parental consent if 1+ parent not travelling}}
  • Insurance certificate naming this applicant (or family policy with all named)

Shared / group documents:
  • TLS appointment confirmation (group)
  • Accommodation booking covering all
  • Itinerary
  • Attestation d'Accueil (if family-visit, listing all visitors)
  • Sponsor letter (if one applicant sponsors others)
  • Cost estimate

═════════════════════════════════════════════════════════════════════
CROSS-APPLICANT CONSISTENCY CHECK
═════════════════════════════════════════════════════════════════════

✅/❌  Trip dates identical on all France-Visas forms
✅/❌  Accommodation address identical
✅/❌  Trip purpose compatible
✅/❌  Sponsor name (if applicable) consistent
✅/❌  Insurance covers all applicants for the same dates

═════════════════════════════════════════════════════════════════════
NEXT STEPS
═════════════════════════════════════════════════════════════════════

1. Complete /france-visas-form for any applicant who hasn't yet.
2. Once all references collected, group leader runs /tlscontact-form
   with the group flow.
3. Schedule the group appointment slot.
4. Run /audit-application as a final cross-applicant gate.
```

## Common pitfalls

| Pitfall | Why it hurts | Fix |
|---|---|---|
| Each applicant booking individual TLS slots | Inefficient + fewer slot options + cost of multiple TLS service fees | Cancel individuals, re-book as group |
| Trip dates inconsistent across applicants' France-Visas forms | Cross-applicant audit fails | Each applicant re-files with consistent dates |
| Minor applicant submitted without parent's docs | Application stalled at consulate | Run `/minor-application` for each minor before submission |
| Sponsor letter names only some sponsored applicants | Unsponsored applicants need own funds | Either re-issue sponsor letter naming all OR provide separate funds for unsponsored |
| Family insurance policy doesn't name each person | Coverage ambiguity | Request named-applicant version from insurer |
| Group leader can't attend appointment | Group reschedule required | Pick a leader who can definitely attend |
| Mixed purposes (one tourism, one business) | Confused consular story | OK if each cover letter explains; can be defensible |

## Routing rules

| Situation | Suggest next |
|---|---|
| Group includes minors | `/minor-application` for each child first |
| Group has sponsor relationship | `/sponsored-application` to handle sponsor docs |
| No appointment slots for group size | `/find-slot` with urgency + Visa Master extension |
| Group of 5+ | Consider 2 sub-groups (some centres cap group size at 4); confirm with TLS |
| All references collected, ready to book | `/tlscontact-form` for the group leader |
| Documents 80%+ ready across group | `/audit-application` for cross-applicant audit |

## Authoritative sources

- https://france-visas.gouv.fr/en/web/france-visas — France-Visas (per-applicant references) — verified 2026-05-24
- https://visas-fr.tlscontact.com/en-us — TLS group flow — verified 2026-05-24

## Notes for maintainers

- The "one France-Visas per applicant, one TLS group" structure is fundamental — many users assume groups share France-Visas references. They don't.
- Some centres cap group size at 4 (London) or 5 (Manchester). Confirm at booking; large groups may need 2 sub-groups.
- For corporate/touring groups (not family), the group leader is whoever has organisational authority. The dynamic is similar to family-leader logic.
- Group bookings have a fee structure benefit: TLS service fee is per-applicant (not per-group), so no savings. The savings are time (one slot vs N) and convenience (one appointment vs N).
- If a single applicant in the group is refused, the others' applications continue independently. The refused applicant doesn't tank the group.
- Visa fees are per-applicant. Under-6 children are free; 6-12 are half-price; 12-17 are full price.
