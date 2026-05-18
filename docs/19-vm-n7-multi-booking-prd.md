# PRD: N-7 — Multi-Booking After Refund Window

**Document:** 19-vm-n7-multi-booking-prd.md
**Version:** 0.1 (draft)
**Date:** 2026-05-18
**Status:** Draft for review
**Owner:** Duke Harewood (Torly AI)
**Related docs:**
- `09-visa-master-premium-prd.md` — Premium PRD (success-fee model; FSM at §12, refund window at §6.5)
- `10-visa-master-premium-wireframes.md` — Premium wireframes (P-14 Booked, P-16 Refund Prompt)
- `12-premium-backlog.md` — Premium release backlog
- `14-notifications-and-email-prd.md` — Notifications + email infrastructure
- `17-ops-dashboard-prd.md` — Install metadata (PRD 17 §7.4 — extensionVersion, attribution)
- `torlyAI/supabase/migrations/026_visa_master.sql` — `visa_master_bookings` schema

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Goals, Non-Goals, and Success Metrics](#3-goals-non-goals-and-success-metrics)
4. [Personas and Scenarios](#4-personas-and-scenarios)
5. [Pricing Model](#5-pricing-model)
6. [Functional Requirements](#6-functional-requirements)
7. [State Machine Changes](#7-state-machine-changes)
8. [Storage Schema](#8-storage-schema)
9. [UI Affordances](#9-ui-affordances)
10. [Edge Cases and Decisions](#10-edge-cases-and-decisions)
11. [Migration for Stranded v1.1 Users](#11-migration-for-stranded-v11-users)
12. [Backend Contract — No Changes](#12-backend-contract--no-changes)
13. [Internationalisation](#13-internationalisation)
14. [Telemetry and Analytics](#14-telemetry-and-analytics)
15. [Release Plan](#15-release-plan)
16. [Open Questions](#16-open-questions)

---

## 1. Executive Summary

Premium today is functionally a **one-shot booking system** despite a backend designed for multi-booking. The DB schema, `/booking/capture` route, license JWT, and Stripe Customer all support N bookings per install; the extension UX caps it at one because `PREMIUM_BOOKED` is sticky with no exit path other than refund.

This PRD removes that cap. After the 24h refund window expires, the extension auto-returns to `PREMIUM_ACTIVE`, allowing a second slot detection to trigger a second £19 capture. Users who got their appointment and don't want further monitoring can opt out with a "Stop watching" button on the Booked screen at any time.

**No backend changes.** Every successful booking = £19, charged to the saved card via the existing off-session PaymentIntent flow. This is a pure extension-side feature, shipping as v1.2.0.

---

## 2. Problem Statement

### 2.1 What the code does today (audited 2026-05-18)

- **`visa_master_bookings` schema** (migration 026) uses a unique index on `(install_id, booking_id)` only. Different TLS bookingIds → different rows. Multi-booking ready at the data layer.
- **`/api/visa-master/booking/capture`** is idempotent on `bookingId` (re-calls return existing row without charging). It does **not** check whether the install has booked before. A new bookingId triggers a fresh £19 capture.
- **License JWT** has `tier: 'premium'` valid for ~18 months. Not consumed by a booking.
- **Stripe Customer + saved card** persist. Off-session PaymentIntents charge them on demand.
- **Extension booking FSM** (`booking-fsm.ts`):
  - Cooldown `BOOKING_COOLDOWN_MS = 24h` after a successful booking blocks `maybeStartBookingOnSlot`.
  - Captures the booking, sets `activeBooking` storage, transitions to `PREMIUM_BOOKED`.
- **`PREMIUM_BOOKED`** is in `STICKY_PREMIUM` (`state-machine.ts:105`). `applyDetection` short-circuits on sticky states. No `SLOT_AVAILABLE` detection can override.
- **`Booked.tsx` (P-14)** offers only "Pay TLS visa fee" and "Slot was cancelled by TLS" (refund). Refund clears `activeBooking` → returns to `PREMIUM_ACTIVE`. No other exit.
- **After 24h**: refund window closed (backend rejects with 409). User is permanently in `PREMIUM_BOOKED` until they manually clear storage or reinstall.

### 2.2 Why this matters

Real-world demand for repeat bookings comes from three sources:

| Scenario | Frequency | Today's outcome |
|---|---|---|
| TLS cancels the slot after 24h | Rare but real (~1–2% of bookings) | Permanently stuck |
| Family member needs a second appointment on the same TLS account | Common in family-trip use case | No path; reinstall required |
| User wants a different centre / date later | Occasional | No path; reinstall required |
| Successful booking → user got visa → wants to stop | Common | No path; reinstall required |

The last row is the inverse problem: users who *don't* want repeat monitoring also have no clean exit. Both sides of the lifecycle are broken.

---

## 3. Goals, Non-Goals, and Success Metrics

### 3.1 Goals

- **G1.** After 24h refund window expiry, extension auto-returns to `PREMIUM_ACTIVE` so subsequent `SLOT_AVAILABLE` detections can trigger a second `/booking/capture`.
- **G2.** Provide explicit "I'm done — stop watching" opt-out on the Booked screen, available throughout the booking lifecycle.
- **G3.** Charge £19 per successful booking. No pricing variance. Backend unchanged.
- **G4.** Migrate users from any prior version stuck in `PREMIUM_BOOKED` past their refund window on first run of v1.2.0.
- **G5.** Preserve the existing 24h refund affordance unchanged — multi-booking does not weaken the refund promise.

### 3.2 Non-Goals

- **NG1.** Booking history UI. Storage will retain only the most recent past booking (`previousBooking`). A list of all past bookings can be a later feature.
- **NG2.** Subscription / discounted re-bookings. Pricing stays at £19 success-fee per slot.
- **NG3.** Multi-account support (one extension monitoring multiple TLS accounts). Out of scope; each install is tied to one credential set.
- **NG4.** Backend pricing logic. The capture route stays "every call with a fresh bookingId charges £19".
- **NG5.** Auto-disabling auto-book after N successful bookings. Users explicitly opt out via the button.

### 3.3 Success metrics

| Metric | Baseline (v1.1) | Target (v1.2 + 30d) |
|---|---|---|
| Premium installs that return to `PREMIUM_ACTIVE` after a booking | 0 | ≥40% |
| Repeat-booking captures per install (90d cohort) | n/a (impossible) | 0.15 avg |
| "Stop watching" button click-through (of users who booked) | n/a | ≥30% (sanity — users *do* finish their visa journey) |
| Support tickets containing "stuck", "can't book again", "reinstall" | qualitatively non-zero | →0 |

---

## 4. Personas and Scenarios

### 4.1 Persona A — Family-trip planner (primary)

Jane has booked her own Schengen appointment in Manchester for July 15 via Visa Master Premium. Her husband and two children need appointments at the same centre on the same week. Same TLS login (he's the account holder; she's listed as a family member).

**Today:** Jane is stuck in `PREMIUM_BOOKED` after her own booking. Husband cannot book through the same install. They reinstall, which invalidates her license link and creates a new orphan install in the DB.

**Target:** 24h after Jane's booking, extension auto-returns to `PREMIUM_ACTIVE`. She updates the booking window to husband's preferred dates. Next slot detection auto-books for him (£19). Repeat for kids.

### 4.2 Persona B — Solo traveller who got their visa (secondary)

Mike booked his Schengen slot, attended the appointment, got his visa. He has no further use for Visa Master.

**Today:** Mike is stuck in `PREMIUM_BOOKED` forever. The extension still polls TLScontact pointlessly (well — actually, scheduling is cleared while in sticky states; verified in `state-machine.ts:175-182`). Toolbar badge stays as 🎉 forever.

**Target:** Mike taps "I'm done — stop watching" → extension goes to `PAUSED` → toolbar badge clears → polling fully stopped. License remains valid (he could resume later if needed).

### 4.3 Persona C — Slot cancelled by TLS after 24h (recovery)

Sam booked successfully. 48h later TLScontact emails him: appointment cancelled, no slot available. The 24h refund window has closed.

**Today:** Sam is stuck. Backend rejects refund with 409 "refund window closed". The 24h auto-return doesn't help him recover money — that requires a manual support intervention (out of scope for N-7).

**Target (this PRD):** Sam is in `PREMIUM_ACTIVE` and can re-book if a new slot appears. The original £19 is not refunded automatically (backend policy unchanged). Support ticket → Stripe Dashboard refund → backend webhook flips booking row to `refunded` (existing flow).

---

## 5. Pricing Model

**No change from `09-visa-master-premium-prd.md` §6.** Each successful booking captures £19 against the saved card. £0 for failed attempts. £0 if no slot is ever booked.

User-facing copy must be unambiguous:

> Each time we successfully book an appointment for you, we charge £19 to your saved card. You can request a refund within 24 hours if the slot wasn't what you wanted.

This matches the existing onboarding copy and Stripe Checkout `custom_text.submit.message`. **No change to that string.**

---

## 6. Functional Requirements

### 6.1 Auto-return after refund window

- **FR-1.** At the moment `/booking/capture` returns success, the extension MUST schedule a `chrome.alarms` alarm `VM_REFUND_WINDOW_EXPIRED` with `when = capturedAt + 24h`.
- **FR-2.** When that alarm fires, the SW handler MUST:
  - Check current state is still `PREMIUM_BOOKED`. If not (e.g. user refunded or stopped watching), no-op.
  - Move `activeBooking` → `previousBooking` in `chrome.storage.local`.
  - Transition state machine to `PREMIUM_ACTIVE`.
  - Fire the `monitor_resumed` Telegram + webhook notifications (consistent with other monitoring-resumption signals — PRD 14 §6 row 18 includes `PREMIUM_ACTIVE` already).
- **FR-3.** `chrome.alarms` survives SW eviction. Implementation MUST NOT rely on `setTimeout`.
- **FR-4.** Alarm handler MUST be idempotent. Multiple invocations (e.g. clock skew + retry) must not double-fire transitions.

### 6.2 Manual stop-watching button

- **FR-5.** `Booked.tsx` MUST surface a "Done — stop watching" button visible at all times in the `PREMIUM_BOOKED` state.
- **FR-6.** Tapping the button MUST:
  - Dispatch message `PREMIUM_STOP_WATCHING`.
  - SW handler transitions state to `PAUSED` (existing state).
  - Clear the `VM_REFUND_WINDOW_EXPIRED` alarm (no longer needed).
  - Move `activeBooking` → `previousBooking`.
  - Show a brief in-popup confirmation toast (locale-aware) before the popup re-renders into `PAUSED`.
- **FR-7.** PAUSED screen MUST remain user-resumable via the existing "Resume" affordance.

### 6.3 Repeat booking via existing FSM

- **FR-8.** No change to `maybeStartBookingOnSlot`. The existing 24h `BOOKING_COOLDOWN_MS` check (which reads `lastBookedAt` from storage) MAY remain as a safety net but becomes effectively redundant once `PREMIUM_BOOKED` is exited.
- **FR-9.** A second successful capture goes through the same `/booking/capture` route. The backend's idempotency on `bookingId` MUST be preserved — we do NOT clear `lastBookedAt` to avoid the obvious "same slot detected again" double-charge bug.
- **FR-10.** `activeBooking` becomes the most recent in-flight or recently-captured booking. `previousBooking` holds the prior captured booking, if any. Only one of each is retained.

### 6.4 Backward compatibility

- **FR-11.** Storage keys MUST be added, not repurposed. `activeBooking` retains its current shape and semantics during a booking's 24h refund window.
- **FR-12.** A v1.2 build MUST detect v1.1-era stranded users on SW startup (see §11).
- **FR-13.** No change to the `Msg` union, `ExtState` union, or storage shape beyond additions enumerated in §8.

---

## 7. State Machine Changes

### 7.1 Diagram

```
PREMIUM_ACTIVE
  ├─ SLOT_AVAILABLE detected + booking window matches
  │    → maybeStartBookingOnSlot() → PREMIUM_BOOKING_IN_PROGRESS
  │
  └─ user pauses
       → PAUSED

PREMIUM_BOOKING_IN_PROGRESS
  ├─ capture succeeds (60s budget)
  │    → PREMIUM_BOOKED (£19 captured, activeBooking set)
  │    → alarm VM_REFUND_WINDOW_EXPIRED scheduled at +24h
  │
  └─ capture fails / timeout
       → PREMIUM_BOOKING_FAILED → PREMIUM_ACTIVE

PREMIUM_BOOKED  ← new exits in N-7
  ├─ user clicks "Slot cancelled" + within 24h         [existing]
  │    → refund → activeBooking cleared → PREMIUM_ACTIVE
  │
  ├─ user clicks "Done — stop watching" (any time)      [NEW]
  │    → activeBooking → previousBooking
  │    → VM_REFUND_WINDOW_EXPIRED alarm cleared
  │    → PAUSED
  │
  └─ alarm VM_REFUND_WINDOW_EXPIRED fires (no user action) [NEW]
       → activeBooking → previousBooking
       → PREMIUM_ACTIVE
       → next SLOT_AVAILABLE detection eligible for second booking
```

### 7.2 Stickiness

`PREMIUM_BOOKED` remains in `STICKY_PREMIUM` (`state-machine.ts:105`). The auto-exit and manual-exit both call `transitionTo(...)` directly, which bypasses the sticky guard. The sticky guard only protects against unsolicited detections, which is still the correct behaviour during the 24h refund window.

### 7.3 Race conditions

| Race | Mitigation |
|---|---|
| Alarm fires while user is mid-refund (HTTP in flight) | Alarm handler checks state at fire time; if state has flipped to `PREMIUM_ACTIVE` (refund completed) or `PAUSED` (manual stop), no-op. |
| Alarm fires twice (Chrome bug or clock skew) | Handler checks state + checks `activeBooking` exists; once moved to `previousBooking`, second call no-ops. |
| User clicks "Stop watching" within ms of alarm firing | Last-write-wins on storage; both flows produce a non-`PREMIUM_BOOKED` end state, so user intent is honoured. |

---

## 8. Storage Schema

### 8.1 New key: `previousBooking`

Same shape as `activeBooking` (`ActiveBooking` interface in `booking-fsm.ts`). Holds the most recent **captured** booking after its 24h refund window has expired. Used for:
- Audit ("when did we last book for you?")
- Future "Booking history" UI (out of scope for N-7).

### 8.2 Existing keys — no changes

| Key | N-7 impact |
|---|---|
| `activeBooking` | Unchanged. Now cleared (moved to `previousBooking`) when 24h refund window expires OR user manually stops watching. |
| `lastBookedAt` | Unchanged. Kept as a defence-in-depth cooldown against same-slot re-detection. |
| `vmLicense` | Unchanged. License doesn't expire on booking; the 18-month exp still applies. |
| `installId` | Unchanged. Same install ID across multiple bookings. |
| Anything else | Unchanged. |

### 8.3 New alarm

- Name: `VM_REFUND_WINDOW_EXPIRED`
- Schedule: `chrome.alarms.create('VM_REFUND_WINDOW_EXPIRED', { when: capturedAtMs + 24*60*60*1000 })`
- Cleared on: refund issued, manual stop, or successful auto-transition.

Existing alarms (`VM_BOOKING_TIMEOUT`, etc.) are unaffected.

---

## 9. UI Affordances

### 9.1 Booked screen (P-14) — updated

Existing layout retained. **Add** a tertiary action below the refund link:

```
┌─────────────────────────────────────┐
│ ✓ Booked                            │
│ Wed 15 Jul 2026 09:30               │
│ Manchester → France · TLS-MNC-…    │
├─────────────────────────────────────┤
│ [ £ Captured: £19 ]                 │
│ "Charged when we booked your slot." │
├─────────────────────────────────────┤
│ Next: pay the TLS visa fee          │
│ [   Open TLScontact tab    ]        │
├─────────────────────────────────────┤
│ Refund: 23h 47m remaining           │
│ → Slot was cancelled by TLS         │
├─────────────────────────────────────┤
│ → Done — stop watching   [NEW]      │
└─────────────────────────────────────┘
```

### 9.2 Conditional copy after refund window expires

If the SW was evicted past the 24h alarm and the popup is opened before the alarm has a chance to fire (rare — alarms fire eventually but not exactly at `when`), Booked.tsx detects `Date.now() - new Date(capturedAt) > 24*60*60*1000` and renders:

> Refund window closed. We're back to watching for slots. [Continue watching] [Done — stop watching]

The "Continue watching" button triggers an immediate `transitionTo('PREMIUM_ACTIVE')` rather than waiting for the alarm. This is a graceful UX backup, not the primary path.

### 9.3 PAUSED screen — unchanged

The existing PAUSED screen (Free + Premium share it) already has a "Resume" button. Premium users who paused via "Done — stop watching" can resume → returns to `PREMIUM_ACTIVE`, license + saved card still valid, ready to auto-book again. No new UI here.

---

## 10. Edge Cases and Decisions

| # | Edge case | Decision |
|---|---|---|
| E1 | Same TLS slot re-detected immediately after auto-return | Backend idempotency on `(install_id, booking_id)` blocks the double-charge. Extension also has `lastBookedAt` cooldown as belt-and-braces. Verify with e2e test. |
| E2 | Different TLS slot detected within 24h of first booking | Auto-return hasn't fired yet. `maybeStartBookingOnSlot` is gated by `lastBookedAt`. **Decision: keep the 24h cooldown** to avoid surprise £19 charges. Users who want to book multiple slots in <24h must wait. |
| E3 | User explicitly wants a second booking *now* (e.g. wrong time was booked, refund issued, new slot appears immediately) | Refund path already returns to `PREMIUM_ACTIVE` and clears `lastBookedAt` implicitly via `setActiveBooking(null)`. Verify the refund-path → second-book flow in e2e. **Tracking issue if cooldown trips this.** |
| E4 | License revoked between first and second booking | `/booking/capture` rejects with 401 "Invalid licence" or 403 "Free tier". Extension surfaces `PREMIUM_BOOKING_FAILED` → returns to `PREMIUM_ACTIVE`. The user gets the existing failure path. |
| E5 | Saved card expired between bookings | Stripe rejects PaymentIntent with `card_declined` / `expired_card`. Extension shows `PREMIUM_BOOKING_FAILED`. **Follow-up: surface a "Update card" CTA** — currently no path. Tracked as N-8. |
| E6 | User uninstalls + reinstalls between bookings | New `installId`, new license needed. Existing `/license/rebind` route handles this by email. Out of N-7 scope. |
| E7 | TLS booking_id format collision between two real bookings | Backend's unique index on `(install_id, booking_id)` makes the second a no-op (returns existing row, marked `idempotent: true`). No £19 charged. UX-wise the extension sees "success" — wrong outcome — but extremely unlikely in practice (TLS booking IDs include date + centre + sequence). |
| E8 | User opens popup while SW is evicted, with `activeBooking` past 24h but alarm not fired | Popup-side helper detects and renders the §9.2 "Continue watching" CTA. User-initiated transition does the same thing as the alarm would have. |
| E9 | Chrome auto-update from v1.1 to v1.2 lands during a booking's 24h window | New SW starts; no alarm exists (set under v1.1). v1.2 startup migration (§11) detects pending refund window and schedules the alarm with the remaining time. |
| E10 | Two consecutive successful bookings, user wants to refund the first one but is past 24h | Backend rejects. Same as today. N-7 doesn't relax the refund window. |

---

## 11. Migration for Stranded v1.1 Users

On SW startup (`chrome.runtime.onInstalled` and `chrome.runtime.onStartup` events), v1.2 MUST run a one-shot migration:

1. Read `activeBooking` from storage.
2. If absent or no `capturedAt` → no-op.
3. Compute `elapsedSinceCapture = Date.now() - new Date(capturedAt).getTime()`.
4. If `elapsedSinceCapture > 24h`:
   - Move `activeBooking` → `previousBooking`.
   - If current state is `PREMIUM_BOOKED`, transition to `PREMIUM_ACTIVE`.
   - Fire a one-shot welcome notification: "We've extended Visa Master with re-booking. Tap to learn more." (Optional — design decision. Default OFF for now.)
5. If `elapsedSinceCapture < 24h`:
   - Schedule `VM_REFUND_WINDOW_EXPIRED` alarm with `when = capturedAt + 24h`.

This runs idempotently — checking for an already-scheduled alarm before re-scheduling.

---

## 12. Backend Contract — No Changes

The torlyAI backend is unchanged by this PRD. Specifically:

- **`/api/visa-master/booking/capture`** — already supports multi-booking. No code change.
- **`/api/visa-master/booking/refund`** — unchanged. 24h window enforced server-side.
- **`/api/visa-master/license/status`** — unchanged. `lastBookingAt` already reported.
- **`visa_master_bookings`** schema — unchanged. The `idx_vm_bookings_idempotency` unique index on `(install_id, booking_id)` still prevents double-charging the same TLS slot.
- **Stripe Customer + saved card** — unchanged. Off-session PaymentIntents continue to work for the second-Nth booking.

The "cross-repo: torlyAI deploy gate `[deploy]` token" workflow does NOT apply to this PRD; no torlyAI commits are required.

---

## 13. Internationalisation

New i18n strings (en + zh-CN, per `src/i18n/`):

| Key | en | zh-CN (placeholder — translation needed) |
|---|---|---|
| `premium.booked.done.cta` | Done — stop watching | 完成 — 停止监控 |
| `premium.booked.done.toast` | Watching paused. Resume from the popup any time. | 监控已暂停。可随时在弹窗中恢复。 |
| `premium.booked.refundExpired.title` | Refund window closed | 退款窗口已关闭 |
| `premium.booked.refundExpired.body` | We're back to watching for slots. You can keep going or stop here. | 我们已恢复名额监控。您可以继续或在此停止。 |
| `premium.booked.refundExpired.continue` | Keep watching | 继续监控 |

Per `09-visa-master-premium-prd.md` §17, the zh-CN translations are TODO at PRD-draft time and will be reviewed before release.

---

## 14. Telemetry and Analytics

Add two analytics events to `lib/analytics.ts` (already pattern-established for `schengenPremiumActivated` etc.):

- `schengenPremiumAutoReturned` — fired when `VM_REFUND_WINDOW_EXPIRED` alarm transitions to `PREMIUM_ACTIVE`. Payload: `{ installId, elapsedHours }`. (`elapsedHours` may be >24 if the alarm fired late due to SW eviction.)
- `schengenPremiumStoppedWatching` — fired when user clicks "Done — stop watching". Payload: `{ installId, sourceState }` (always `PREMIUM_BOOKED` in N-7 but kept generic for future).

These help validate **success metrics §3.3** in production.

---

## 15. Release Plan

| Step | Owner | Time | Notes |
|---|---|---|---|
| Code on `feat/vm-n7-multi-booking-after-refund-window` | engineering | 1–2 h | 5 files (this draft) |
| Playwright e2e — capture → 24h fast-forward → second slot → second capture | engineering | 30 min | Use a mocked clock; existing e2e infra in `extension/tests/` |
| Manual smoke test against Stripe test mode | engineering | 15 min | Two consecutive captures in <30 min using TLS test fixtures |
| PR review | self / Codex | 20 min | |
| Manifest bump `1.1.0` → `1.2.0` | engineering | 1 min | Semver minor for new feature |
| Build + zip + tag + push to release repo | engineering | 5 min | Existing release workflow per CLAUDE.md |
| Upload to Chrome Web Store | self only | 5 min | CWS auth in Dev Dashboard |
| Web Store review | Google | 1–3 d | v1.1.0 stays live throughout |
| Auto-update rollout | Google | ~5 h | After approval |

**Bundling note:** consider merging this with N-3b (email-notification client) and any pending P0/P1 items from `12-premium-backlog.md` to amortise one CWS review cycle.

---

## 16. Open Questions

- **OQ-1.** Should the auto-return alarm fire a desktop notification ("We've resumed watching for slots") or silently transition? Default proposal: silent transition. The badge change is visible signal enough; a notification would surprise users who got their visa and forgot the extension was installed. **Recommendation: silent.**
- **OQ-2.** Should `lastBookedAt` be cleared after the alarm fires? Current draft keeps it as a 24h cooldown anchor. If we clear it, the second booking attempt could fire within seconds of the first if a new slot appears — surprise £19. **Recommendation: keep it.** The 24h cooldown is a feature, not a bug.
- **OQ-3.** Per E5, expired-card handling needs a "Update card" CTA. Should that be added in this PRD or a follow-up N-8? **Recommendation: N-8.** Out of scope here; tracked separately.
- **OQ-4.** Should there be a hard limit on bookings per install (e.g. "max 5 in 90 days") to defend against runaway charges? **Recommendation: no hard limit in v1.2.0.** Add only if abuse is observed. Each charge is gated by a real slot detection + a real TLS booking flow + the user's saved card — all friction in their own right.
- **OQ-5.** Booking history UI — should we surface `previousBooking` anywhere in v1.2.0? **Recommendation: no.** Adds UI scope. Storage exists for future. Defer.

---

**End of PRD.**
