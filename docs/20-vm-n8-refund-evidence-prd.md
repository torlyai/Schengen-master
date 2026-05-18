# PRD: N-8 — Refund Evidence (Tier 1)

**Document:** 20-vm-n8-refund-evidence-prd.md
**Version:** 0.1 (draft, to be implemented in v1.2.0)
**Date:** 2026-05-18
**Status:** Draft for implementation
**Owner:** Duke Harewood (Torly AI)
**Related docs:**
- `09-visa-master-premium-prd.md` — Premium PRD (success-fee model; refund window §6.5)
- `17-ops-dashboard-prd.md` — Install metadata (where flagged refunds will surface)
- `19-vm-n7-multi-booking-prd.md` — Multi-booking after refund window (same v1.2.0 release)
- `torlyAI/supabase/migrations/026_visa_master.sql` — base `visa_master_bookings` schema
- `torlyAI/app/api/visa-master/booking/refund/route.ts` — current refund endpoint

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Goals, Non-Goals, and Success Metrics](#3-goals-non-goals-and-success-metrics)
4. [Tier Comparison and Rationale for T1](#4-tier-comparison-and-rationale-for-t1)
5. [Personas and Scenarios](#5-personas-and-scenarios)
6. [Functional Requirements](#6-functional-requirements)
7. [UI Changes — P-16 Refund Prompt](#7-ui-changes--p-16-refund-prompt)
8. [Backend Changes](#8-backend-changes)
9. [Validation Rules](#9-validation-rules)
10. [Edge Cases](#10-edge-cases)
11. [Backward Compatibility](#11-backward-compatibility)
12. [Internationalisation](#12-internationalisation)
13. [Telemetry and Audit](#13-telemetry-and-audit)
14. [Future Tiers — Out of Scope for v1.2.0](#14-future-tiers--out-of-scope-for-v120)
15. [Release Plan](#15-release-plan)
16. [Open Questions](#16-open-questions)

---

## 1. Executive Summary

Visa Master Premium's £19 success-fee model has one primary fraud surface: the self-serve 24h refund path. Today, a user clicks "Slot was cancelled by TLS", picks a reason from a 3-option dropdown, and the backend auto-issues a Stripe refund with no verification. A bad actor can book a slot (charging £19), wait minutes, click refund (£19 back), and keep the slot — net £0 cost, full automation benefit.

**This PRD ships Tier 1 (T1) verification in v1.2.0:** a required evidence-text field on P-16 (RefundPrompt) capturing what TLS told the user. Free-form text, validated minimum length, stored in a new `visa_master_bookings.refund_evidence_text` column. Refund still auto-processes (no human-in-the-loop per refund — that doesn't scale), but the evidence creates an audit trail that:

- Deters casual abuse via friction and visible accountability.
- Lets us flag suspicious patterns (very short, generic, profanity, identical text across installs) for ops review post-hoc.
- Becomes the foundation for T2 (programmatic TLS-page verification) in a future release.

**No human review per refund.** Refund auto-processes as today. Evidence is post-hoc and audit-only.

Tier 2 (TLS-page DOM verification) and Tier 3 (email-only manual review) are documented in §14 but out of scope.

---

## 2. Problem Statement

### 2.1 Current refund flow (audited 2026-05-18)

1. User clicks "Slot was cancelled by TLS" in P-14 (Booked).
2. Popup transitions to P-16 (RefundPrompt) — `extension/src/popup/states/premium/RefundPrompt.tsx`.
3. User picks one of 3 reason radio buttons:
   - `premium.refund.reason.released` ("TLS released the slot")
   - `premium.refund.reason.docs` ("My documents weren't ready")
   - `premium.refund.reason.other`
4. Extension dispatches `PREMIUM_REQUEST_REFUND` with the picked reason.
5. Backend (`torlyAI/app/api/visa-master/booking/refund/route.ts`) validates ≤24h since capture, not already refunded, then calls `stripe.refunds.create()` and marks the row `refunded`.

The current reason field has no minimum length and no required substantiation. A user clicking any radio + Request gets refunded if eligible.

### 2.2 Fraud math

- Cost of fraud per attempted booking: **£0** (charge → refund → keep slot).
- Time cost to attacker: ~60s (clicks).
- Detection probability today: **0%** — backend logs only `reason` string.
- Maximum exposure: bounded by (number of paid installs) × (number of distinct slots they can book). With a 24h booking cooldown per install (PRD 19 §10 E2), exposure today is ~1 fraudulent refund per install per day.

### 2.3 What the schema already supports

`visa_master_bookings` (migration 026) has `refund_reason TEXT` — stores the reason string. No evidence column. Backend's `BodySchema` in `refund/route.ts` accepts `reason: z.string().max(500).default('')` — optional, no min length.

---

## 3. Goals, Non-Goals, and Success Metrics

### 3.1 Goals

- **G1.** Require a substantive evidence text (≥20 chars) on every refund request initiated from the extension popup.
- **G2.** Persist evidence in a new column on `visa_master_bookings` (`refund_evidence_text TEXT`) so ops can audit refunds for plausibility.
- **G3.** Preserve the existing reason-radio UX as a categorisation aid, not a replacement for evidence.
- **G4.** Backend remains permissive for admin-initiated refunds (e.g. from ops dashboard) that bypass the extension UI.
- **G5.** Add an optional `mailto:` "Send full evidence with screenshots" link in P-16 for users who want to provide more — surfacing the existing `support@torly.ai` flow into the refund context.

### 3.2 Non-Goals

- **NG1.** Programmatic verification of TLS-page state. T2 — separate PRD.
- **NG2.** Human review per refund. Refund still auto-processes; evidence is audit-only.
- **NG3.** Block legitimate refunds. The text length threshold is low (20 chars) and the field is single free-text.
- **NG4.** Rich-media evidence (image upload). Out of scope; users can email screenshots via the existing support flow.
- **NG5.** Backdating evidence for past refunds. Existing refunded rows stay as they are (no migration backfill).

### 3.3 Success metrics

| Metric | Baseline | Target post-T1 |
|---|---|---|
| % of refunds with non-trivial evidence_text (>20 chars) | 0% (column doesn't exist) | ≥95% (extension enforces) |
| Suspicious-pattern flag rate (very short / repeated / generic) | n/a | ≤3% of refunds |
| Refund processing latency (P-16 click → confirmation) | ~1.2s | ≤2.5s |
| User-reported friction on legitimate refunds | n/a (small base) | 0 complaints in first 30d |

---

## 4. Tier Comparison and Rationale for T1

| Tier | What | UX friction | Fraud resistance | Engineering cost | Ship target |
|---|---|---|---|---|---|
| **T1 — Required evidence text** | Free-text field on P-16, required, audit-only storage. Refund auto-issues. Backend flags suspicious patterns post-hoc. | Low | Catches casual fraud; deters thinking actors via paper trail | ~1 day; 1 backend column; 1 extension field | **v1.2.0 (this PRD)** |
| **T2 — TLS-page verification** | Content script on TLS appointments page detects "Cancelled" status; auto-fills evidence + proceeds. Falls back to T1 if not detected. | Medium (one tab nav) | Strong — TLS DOM is source of truth | ~3 days; requires empirical TLS markup observations | v1.4+ if fraud emerges |
| **T3 — Email-only refunds** | Replace auto-refund with `mailto:support@torly.ai`. All refunds manual. | High | Strongest (human review) | Tiny code; ongoing ops load | Not recommended |

**Why T1 now, not T2:** the customer base is currently 1 paying user (`b7ad8db5-…`, Jason). Total fraud exposure today is ~£19. T2 needs empirical TLS markup observation across multiple centres/countries — that work is real engineering effort that the customer base doesn't yet justify. T1 is the right minimum increment: cheap to ship, audit trail in place for the day fraud volume warrants T2.

**Why not T3:** support email scales like 1× human time per refund. For a self-serve product this kills the UX promise. Reserve T3 for individual disputed cases, not the default path.

---

## 5. Personas and Scenarios

### 5.1 Legitimate refund (Persona A — Jane)

Jane booked a Manchester slot for 15 July. On 14 July she gets a TLS email: "Your appointment has been cancelled due to operational reasons." She opens the extension popup → still showing PREMIUM_BOOKED → clicks "Slot was cancelled by TLS" → P-16 opens.

**Today:** Jane picks "Other", clicks Request → £19 refunded.

**With T1:** Jane picks "Other", types in the text box: *"TLS sent me an email today saying my appointment was cancelled — they didn't give a clear reason but it's not happening on the 15th."* (76 chars, passes ≥20 threshold). Clicks Request → £19 refunded. Evidence stored.

### 5.2 Casual fraudster (Persona B)

Books a slot, gets the slot booked through auto-book, wants a free refund.

**Today:** Picks any reason → refunded.

**With T1:** Has to type ≥20 chars. May type "TLS cancelled" (13 chars — too short, rejected by extension). Tries "TLS cancelled it I think" (24 chars — passes). Refunded BUT the evidence is on file. If ops sees a pattern of suspiciously short or evasive evidence across multiple installs, can target review.

### 5.3 Determined fraudster (Persona C)

Knows the system, willing to fabricate evidence.

**With T1:** Types a plausible-sounding email-fragment fabrication. Refunded. Evidence on file but indistinguishable from a real refund. T1 alone doesn't stop this — that's what T2 (TLS-page verification) is for.

### 5.4 Edge case — TLS actually cancelled but user doesn't have the email handy (Persona D)

User has been notified by TLS phone call or word-of-mouth. Doesn't have a written cancellation email. Needs to type evidence.

**With T1:** User describes the cancellation in their own words ("TLS called me yesterday at 11am to say my appointment is no longer available, no reason given"). Refund processes. ✅ no false barrier.

### 5.5 Admin-initiated refund (Persona E — ops)

Duke needs to manually refund a customer (chargeback, support escalation) without going through the extension UI.

**With T1:** Backend's `evidenceText` field is **optional** at the API layer. Admin calls bypass it. Extension's UI enforces it. This split keeps ops flexibility while strengthening the user-driven path.

---

## 6. Functional Requirements

### 6.1 Extension (P-16 Refund Prompt)

- **FR-1.** Render a required `<textarea>` field labelled "What did TLS tell you?" with placeholder text giving examples.
- **FR-2.** The Request button MUST be disabled until the textarea has ≥20 non-whitespace characters.
- **FR-3.** Reason-radio dropdown stays. The submitted payload includes both `reason` (radio label) and `evidenceText` (textarea content).
- **FR-4.** Add a secondary "Send full evidence with screenshots" `mailto:` link below the textarea, populating subject + body with installId, bookingId, and a polite template. Optional; doesn't gate refund.
- **FR-5.** On successful refund, popup transitions to `PREMIUM_ACTIVE` (existing flow — unchanged).

### 6.2 Backend (`/api/visa-master/booking/refund`)

- **FR-6.** Accept new optional field `evidenceText: z.string().min(20).max(2000).optional()` in the request body.
- **FR-7.** Persist `evidenceText` to a new `visa_master_bookings.refund_evidence_text` column (nullable for backward compat).
- **FR-8.** Backend MUST NOT reject refunds for missing `evidenceText` — the extension UI enforces the requirement; admin-initiated refunds bypass it.
- **FR-9.** Log the evidence text length + a hash (not the full text) in the analytics event `schengenPremiumRefundIssued` for pattern analysis without PII exposure in logs.

### 6.3 Database (migration 031)

- **FR-10.** New migration `031_visa_master_refund_evidence.sql`:
  - `ALTER TABLE public.visa_master_bookings ADD COLUMN refund_evidence_text TEXT;`
  - Optionally index on `length(refund_evidence_text)` for ops queries finding short-evidence refunds. Defer unless ops dashboard needs it (PRD 17).

### 6.4 Cross-repo deploy order (critical)

- **FR-11.** Backend migration + route update MUST deploy to production **before** the extension v1.2.0 hits the Chrome Web Store. Otherwise the extension's new `evidenceText` field will be silently dropped by the older backend (Zod schema strips unknown fields by default).
- **FR-12.** The `[deploy]` token rule (CLAUDE.md "Cross-repo: torlyAI deploy gate") applies. Merge commit must contain `[deploy]`.

---

## 7. UI Changes — P-16 Refund Prompt

```
┌──────────────────────────────────────────┐
│ Refund                                   │
│ ──────────────────────────────────────── │
│ Refund slot booked Wed 15 Jul 2026 09:30 │
│                                          │
│ If TLS cancelled this slot, we'll refund │
│ your £19 in full. Please share what TLS  │
│ told you so we have it on record.        │
│                                          │
│ WHY                                      │
│ ○ TLS released the slot                  │
│ ● My documents weren't ready             │
│ ○ Other                                  │
│                                          │
│ WHAT DID TLS TELL YOU?  *required        │
│ ┌──────────────────────────────────────┐ │
│ │ e.g. "TLS emailed me today saying my │ │
│ │ appointment is cancelled due to…"    │ │
│ │                                      │ │
│ │                                      │ │
│ └──────────────────────────────────────┘ │
│ 0 / 20 minimum                           │
│                                          │
│ → Send full evidence with screenshots    │
│   (opens email)                          │
│                                          │
│ [   Request refund   ]   (disabled)      │
│ [   Never mind   ]                       │
│                                          │
│ We use this to make sure refunds are     │
│ honest. Suspicious patterns are reviewed.│
└──────────────────────────────────────────┘
```

The character-counter ("0 / 20 minimum") flips to green tick when ≥20 valid non-whitespace characters are entered.

---

## 8. Backend Changes

### 8.1 Migration `031_visa_master_refund_evidence.sql`

```sql
-- 031: Visa Master refund-evidence column (PRD 20 / N-8)
ALTER TABLE public.visa_master_bookings
  ADD COLUMN IF NOT EXISTS refund_evidence_text TEXT;

COMMENT ON COLUMN public.visa_master_bookings.refund_evidence_text IS
  'User-supplied description of what TLS told them about the cancellation.
   Populated only on user-driven refunds via the extension; admin-initiated
   refunds may leave this NULL. PRD 20.';
```

### 8.2 Refund route diff

`torlyAI/app/api/visa-master/booking/refund/route.ts`:

```typescript
const BodySchema = z
  .object({
    installId: z.string().uuid(),
    licenseToken: z.string().min(20),
    bookingDbId: z.string().uuid().optional(),
    stripePaymentIntentId: z.string().min(8).optional(),
    reason: z.string().max(500).default(''),
    evidenceText: z.string().min(20).max(2000).optional(),  // NEW
  })
  .refine((b) => b.bookingDbId || b.stripePaymentIntentId, {
    message: 'Either bookingDbId or stripePaymentIntentId is required',
  });

// ... existing refund logic ...

// In the UPDATE block:
.update({
  status: 'refunded',
  refunded_at: new Date().toISOString(),
  refund_reason: reason,
  refund_evidence_text: parsed.evidenceText ?? null,  // NEW
  stripe_refund_id: refund.id,
})
```

### 8.3 Tests

Add to `torlyAI/tests/api/visa-master/`:
- `refund.test.ts` — covers happy path with evidenceText, happy path without (admin-style), backward compat (no evidenceText field still 200s), Zod rejection on evidenceText < 20 chars when provided.

---

## 9. Validation Rules

| Layer | Rule | On violation |
|---|---|---|
| Extension UI | `evidenceText.trim().length >= 20` | Request button stays disabled |
| Extension UI | `evidenceText.length <= 2000` | Truncate or block input past 2000 |
| Backend Zod | If `evidenceText` provided: ≥20 and ≤2000 | 400 "Invalid body" |
| Backend Zod | `evidenceText` absent | Accept (admin path) |
| Database | Column is TEXT, no constraint | n/a |

Both sides defend, but the extension is the user-facing gate.

---

## 10. Edge Cases

| # | Case | Decision |
|---|---|---|
| E1 | User pastes the same evidence text twice | Allowed. Pattern detection is post-hoc in ops review. |
| E2 | Evidence contains personal info (full name, email) | Stored. Ops dashboard (PRD 17) will need access controls; consider redacting in logs (hash only). |
| E3 | Evidence in non-English language | Allowed. Length check ignores language. |
| E4 | Evidence is exactly 20 chars of whitespace | Trim before length check (`.trim().length >= 20`). |
| E5 | User clicks "Send full evidence with screenshots" instead of typing in textarea | mailto opens; refund stays gated until textarea is filled. The mailto is supplementary, not an alternative. |
| E6 | Network failure mid-submit | Existing retry behaviour; evidence in textarea persists until popup closes. |
| E7 | Backend pre-T1 (old version) receives v1.2 extension request with `evidenceText` | Zod schema strips unknown fields. Refund still processes; evidence is silently dropped. **This is why FR-11 / FR-12 matter — deploy backend first.** |
| E8 | Extension pre-T1 (older v1.x) sends refund without `evidenceText` to new backend | Optional schema accepts. No regression. |
| E9 | User refunds, opens popup, finds previous evidence preserved | Out of scope. Each refund is a fresh form; no draft persistence. |
| E10 | Admin needs to bulk-refund 100 users (e.g. TLS systemic outage) | Backend admin path bypasses evidence. Out of scope for popup UI. |

---

## 11. Backward Compatibility

- **Existing refunded rows** (Jason hasn't refunded; no real rows exist): keep `refund_evidence_text = NULL`. No backfill.
- **Older extension builds** (v1.1.0 currently on Web Store): send refunds without `evidenceText`. Backend stays permissive (optional field), refunds still process. No user-visible change for v1.1 users.
- **Order of deploy:** backend → extension. If reversed, evidence is dropped silently for a few hours / days until backend catches up. Not data-loss, just suboptimal audit window. Mitigated by the `[deploy]` gate enforcing intentional deploy.

---

## 12. Internationalisation

New keys for `en.json` and `zh.json`:

| Key | en | zh-CN (placeholder) |
|---|---|---|
| `premium.refund.evidence.label` | What did TLS tell you? | TLS 是怎么通知你的? |
| `premium.refund.evidence.placeholder` | e.g. "TLS emailed me today saying my appointment is cancelled due to…" | 例如:"TLS 今天给我发邮件说我的预约因…被取消了" |
| `premium.refund.evidence.minCount` | {n} / 20 minimum | {n} / 至少 20 字 |
| `premium.refund.evidence.metReq` | ✓ {n} characters | ✓ 已填 {n} 字 |
| `premium.refund.evidence.emailFull` | Send full evidence with screenshots ↗ | 发送完整证据(含截图) ↗ |
| `premium.refund.note.v2` | We use this to make sure refunds are honest. Patterns are reviewed. | 我们以此核实退款的真实性。可疑模式会被审查。 |

The existing `premium.refund.note` may be replaced or supplemented.

---

## 13. Telemetry and Audit

### 13.1 Analytics event additions

`analytics.schengenPremiumRefundIssued` — extend payload:

```ts
{
  installId: string,
  reason: string,           // radio label (existing)
  evidenceLength: number,   // chars, not the text itself
  evidenceHash: string,     // first 8 chars of sha256 (for pattern detection without PII)
  capturedAt: string,
  refundLatencyMs: number,
}
```

The hash is non-PII (one-way) but lets ops queries detect identical-text refunds across installs.

### 13.2 Ops queries

Quick ad-hoc queries for fraud-detection sweeps:

```sql
-- Refunds with suspiciously short evidence
SELECT install_id, refund_evidence_text, length(refund_evidence_text) AS len
FROM visa_master_bookings
WHERE status = 'refunded' AND refund_evidence_text IS NOT NULL
ORDER BY len ASC LIMIT 20;

-- Identical evidence across installs (paste copy)
SELECT refund_evidence_text, count(distinct install_id) AS installs
FROM visa_master_bookings
WHERE status = 'refunded' AND refund_evidence_text IS NOT NULL
GROUP BY refund_evidence_text
HAVING count(distinct install_id) > 1;
```

These should surface in the ops dashboard (PRD 17) once T1 has data.

---

## 14. Future Tiers — Out of Scope for v1.2.0

### 14.1 T2 — TLS-page verification

After T1, when fraud volume warrants the engineering, add:

1. On "Slot was cancelled by TLS" click, popup directs user to TLS appointments page (existing content script context).
2. New content script handler reads the appointments DOM. Looks for the booking that matches the captured `bookingId`. Detects status: scheduled / cancelled / paid.
3. If `cancelled` → auto-fill evidence textarea with "Verified via TLS appointments page: status=Cancelled" + a structured payload field `refund_evidence_verified: 'tls-dom'`.
4. If `scheduled` → block refund with message "TLS still shows this slot as scheduled. If TLS cancelled it, please paste the cancellation email below."
5. If not detected → fall back to T1 (manual evidence text).

Backend adds:
- `refund_evidence_verified TEXT` column with enum-like values.
- Stronger checks at the route level when `refund_evidence_verified === 'tls-dom'` is claimed but `refund_evidence_text` doesn't follow the verified-text format.

Effort: ~3 days plus empirical TLS-markup observations.

### 14.2 T3 — Email-only refunds

Reserved for individual escalated cases, not the default path. Reuses existing `support@torly.ai` mailto.

---

## 15. Release Plan

| Step | Owner | Time | Notes |
|---|---|---|---|
| Backend migration 031 | engineering | 5 min | `ADD COLUMN refund_evidence_text TEXT` |
| Backend refund route + tests | engineering | 30 min | Optional Zod field, persist on update |
| Backend deploy with `[deploy]` token | engineering | ~5 min build + ~5 min Vercel | Must happen FIRST per FR-11 |
| Extension RefundPrompt.tsx update | engineering | 30 min | Textarea + char counter + button gate + mailto link |
| Extension `PREMIUM_REQUEST_REFUND` message | engineering | 10 min | Add `evidenceText: string` field |
| Extension backend-client `requestRefund()` | engineering | 5 min | Pass evidenceText |
| i18n strings (en + zh) | engineering | 10 min | 6 keys × 2 locales |
| Smoke test in unpacked build | engineering | 10 min | Empty textarea → button disabled; 20+ chars → enabled; submit → refund + evidence in DB |
| Manifest bump (already at 1.2.0) | n/a | 0 | Stays at 1.2.0 |
| Build, zip, tag, push, CWS upload | engineering | 15 min | Standard release workflow per CLAUDE.md |

Total session-time: ~2.5 hours including testing.

---

## 16. Open Questions

- **OQ-1.** Should evidence text be required for refunds via the **mailto fallback** (i.e. when the user uses email instead of the popup)? **Recommendation: no.** The mailto is for cases where the popup form isn't enough; requiring evidence both places is redundant.
- **OQ-2.** Should the evidence textarea persist as a draft across popup closes? **Recommendation: no.** Refund actions should be intentional; if a user closes the popup mid-form they restart. Avoids accidental submission.
- **OQ-3.** Should there be a checkbox "I confirm TLS actually cancelled this slot" alongside the evidence text? **Recommendation: no, in v1.2.0.** Adds checkbox friction without meaningful fraud reduction beyond what evidence text provides. Reconsider in T2 design.
- **OQ-4.** Profanity / abuse filter on evidence text? **Recommendation: no.** Out of scope for v1.2.0. If a user types abuse, it's recorded as evidence-of-bad-faith — useful signal for ops, not something to filter at ingest.
- **OQ-5.** What's the minimum length threshold — 20, 50, 100 chars? **Recommendation: 20.** Low enough that legitimate one-sentence explanations pass ("TLS emailed me, appointment cancelled, no reason given" = 56 chars). High enough that pure noise ("ok cancelled" = 12) fails. We can tune after seeing real data.

---

**End of PRD.**
