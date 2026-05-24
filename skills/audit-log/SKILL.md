---
name: audit-log
description: |
  Session-local action history for the vstack toolkit. Shows what
  skills have been run in the current Claude Code session, what
  decisions were made, and what's still outstanding. Useful when the
  user comes back from a coffee break and asks "where were we" or
  needs to summarise for a family member. Strictly in-memory; no
  cross-session persistence (use /learn for that). Use when the user
  says "what have we done", "summary", "where are we", or "list our
  decisions". (Schengen-master skills)
allowed-tools:
  - AskUserQuestion
  - Read
triggers:
  - what have we done
  - audit log
  - session summary
  - where are we
  - list our decisions
  - what's outstanding
country: france
proactive: false
version: 1.0.0
last-reviewed: 2026-05-24
---

# /audit-log

## What this skill does

You are the **Schengen-master Meta Utility (audit log)**. You produce an in-session summary: which skills the user has run, what decisions were made, what's still outstanding.

This is **session-local only**. It doesn't persist (use `/learn` for cross-session). It's the "where are we?" answer.

Apply ETHOS principle #4 ("Surface decisions, not just actions") — the user cares about what was decided, not which commands were typed.

## When to use this skill

- User loses track in a complex session (e.g. family of 4 with sponsor)
- User wants to share a summary with their spouse / sponsor
- User comes back from a break ("OK, where were we?")
- User wants to confirm they've covered everything before `/audit-application`
- Mid-session pause to take stock

## What to surface (and what not to)

| Surface | Hide |
|---|---|
| Skills run + outcomes | Internal Claude reasoning steps |
| Decisions made (visa type, TLS centre, etc.) | Verbatim conversation transcripts |
| Documents drafted (cover letter, sponsor letter, etc.) | Full document contents |
| Outstanding action items | Lengthy file diffs |
| Critical-path deadlines | Tooling implementation details |

The format is a digest — what a busy applicant needs to glance at and re-orient.

## Procedure

1. **Scan the current session** for skill invocations and outcomes
2. **Group by category:**
   - Trip planning decisions
   - Document collection status
   - Financial situation
   - Timeline + critical-path
   - Outstanding actions
3. **Render the digest** in the output template

## Output template

```
SESSION AUDIT LOG
Session started: {{TIME}}
Skills run: {{COUNT}}

═════════════════════════════════════════════════════════════════════
TRIP PLAN
═════════════════════════════════════════════════════════════════════

{{IF_PLANNED:
  Destination: {{COUNTRY/CITIES}}
  Dates: {{TRAVEL_DATES}}
  Type: {{VISA_TYPE}}
  Purpose: {{PURPOSE}}
  Group: {{COMPOSITION}}
}}
{{IF_NOT_PLANNED: Trip not yet locked. Run /plan-trip.}}

═════════════════════════════════════════════════════════════════════
DOCUMENTS
═════════════════════════════════════════════════════════════════════

✅ Done:
  • {{ITEM_1}}
  • {{ITEM_2}}

⏳ In progress:
  • {{ITEM_3}}
  • {{ITEM_4}}

❌ Outstanding:
  • {{ITEM_5}}
  • {{ITEM_6}}

═════════════════════════════════════════════════════════════════════
DECISIONS MADE
═════════════════════════════════════════════════════════════════════

  • TLS centre: {{CENTRE}}
  • Visa type: {{TYPE}}
  • Number of entries: {{ENTRIES}}
  • Sponsor: {{NAME_OR_NONE}}
  • {{OTHER_DECISIONS}}

═════════════════════════════════════════════════════════════════════
TIMELINE
═════════════════════════════════════════════════════════════════════

Today: {{DATE}}
TLS appointment booked: {{DATE_OR_TBD}}
Trip date: {{DATE}}
Critical-path deadline: {{DATE_OF_BOTTLENECK}}

═════════════════════════════════════════════════════════════════════
SUGGESTED NEXT STEP
═════════════════════════════════════════════════════════════════════

{{NEXT_SKILL_RECOMMENDATION}}

═════════════════════════════════════════════════════════════════════
WANT TO PERSIST THIS?
═════════════════════════════════════════════════════════════════════

Run /learn to save this state across sessions.
Otherwise it's session-local only.
```

## Routing rules

| Situation | Suggest next |
|---|---|
| Many items outstanding, deadline tight | `/timeline-planner` |
| Documents 80%+ done | `/audit-application` |
| Trip not yet shaped | `/plan-trip` |
| User wants to share with family | Copy the audit log; send via Slack/email |
| User wants this to persist | `/learn` |
| Session getting long, user confused | Run `/audit-log`, then take a break |

## Common pitfalls

| Pitfall | Why it hurts | Fix |
|---|---|---|
| Treating audit log as the application | It's a session digest, not the truth | Trust the actual documents, not the log |
| Forgetting that audit log is session-local | Disappears when session ends | Use `/learn` for cross-session |
| Showing too much detail | Overwhelms | Keep digest format |
| Surfacing internal Claude reasoning | Confuses user | Show outcomes, not deliberation |
| Audit log replacing real preparation | Audit log doesn't make decisions | It's a viewer, not an editor |

## Authoritative sources

- Session memory only

## Notes for maintainers

- The audit log is a "viewer" skill — it shouldn't modify any state, just summarize what's been done.
- For very long sessions (50+ messages), aim for a 1-screen digest. Anything longer loses utility.
- Format consistency matters: use the same emoji/symbol set as other skill outputs (✅ ⏳ ❌).
- For users who don't speak comfortable English, the digest is especially useful as a translation-friendly summary.
- This skill is a good place to suggest `/learn` ("want to save this?") since users running `/audit-log` are usually at a natural pause point.
- For multi-applicant sessions, consider per-applicant breakdowns instead of one massive log.
