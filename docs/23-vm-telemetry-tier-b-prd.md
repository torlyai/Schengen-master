# PRD: Visa Master Tier B Telemetry — Premium aggregate event counters

**Document:** 23-vm-telemetry-tier-b-prd.md
**Version:** 1.0 (draft for review)
**Date:** 2026-05-24
**Status:** Draft — awaiting approval to implement
**Target version:** Visa Master extension v1.3.0
**Owner:** Duke Harewood (Torly AI)
**Companion to:** [`22-data-sources-playbook.md`](./22-data-sources-playbook.md) (Tier A — already-available sources)
**Related docs:**
- [`09-visa-master-premium-prd.md`](./09-visa-master-premium-prd.md) §13 (Privacy + Premium disclosure surface)
- [`11-architecture.md`](./11-architecture.md) §9 (trust boundaries)
- [`14-notifications-and-email-prd.md`](./14-notifications-and-email-prd.md) (existing telemetry surfaces)
- [`17-ops-dashboard-prd.md`](./17-ops-dashboard-prd.md) §7.3 (what we cannot show)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem](#2-problem)
3. [Goals, Non-Goals, Success Metrics](#3-goals-non-goals-success-metrics)
4. [Scope of telemetry — exact field list](#4-scope-of-telemetry--exact-field-list)
5. [What we will NEVER collect (trust boundary)](#5-what-we-will-never-collect-trust-boundary)
6. [Data flow](#6-data-flow)
7. [Schema changes](#7-schema-changes)
8. [API contract — `/license/status` POST extension](#8-api-contract--licensestatus-post-extension)
9. [Extension implementation](#9-extension-implementation)
10. [Dashboard surfacing](#10-dashboard-surfacing)
11. [Privacy disclosure updates](#11-privacy-disclosure-updates)
12. [Migration & rollout](#12-migration--rollout)
13. [Open questions](#13-open-questions)
14. [Implementation plan & estimate](#14-implementation-plan--estimate)
15. [Appendix A — Event counter inventory](#15-appendix-a--event-counter-inventory)

---

## 1. Executive Summary

Extend the existing `/api/visa-master/license/status` POST body (v1.2 metadata refresh) with **aggregate event counters** — small integer counts of significant state transitions and outcomes that happened on each Premium user's machine since the last poll. The single highest-priority counter is `booking_failed_at_step`: without it, we cannot empirically diagnose where `driveBookingFlow()` (currently a stub per PRD §17) breaks against real TLScontact markup.

Strictly Premium-only. Strictly aggregate counts (no event timestamps, no DOM samples, no per-event payloads). Strictly within the already-disclosed Premium telemetry surface — we add bullets to the welcome disclosure but do not introduce any new categories of data.

Free tier remains 100% local. This PRD does not touch the Free trust boundary.

---

## 2. Problem

### 2.1 The booking flow is a stub and we can't fix it blind

PRD §17 of `09-visa-master-premium-prd.md`:

> `driveBookingFlow()` in `background/booking-fsm.ts` is a stub. Needs empirical validation against a real TLS booking page before public release of Premium. Fails-safe (no submit) on any missing selector.

The stub fails-safe — which is correct safety behaviour — but every failed booking attempt is currently invisible to us. A paying user hits a real TLScontact slot, the stub fails to fill the form because the selector has changed or never matched, the user sees their slot evaporate to someone else, and **we don't know it happened**. The booking is never captured (correct — no false charges), but the failure itself is silent.

After ~5 production failures we should know exactly which DOM step is breaking. Today we'd need ~5 user-reported bug reports to gather the same data, with weeks of latency.

### 2.2 Usage intensity is invisible

The dashboard shows that we have 4 Premium customers. It does NOT show whether those 4 users:

- Are checking actively every day or have installed-and-forgotten
- Are detecting slots regularly or never
- Are hitting Cloudflare blocks repeatedly
- Are getting logged out frequently

This matters because:
- **Churn signal:** A Premium user who hasn't detected a slot in 30 days is probably gone. Worth a retention email.
- **Product health:** If 3 of 4 active users are hitting Cloudflare daily, our smart-mode polling is too aggressive.
- **Conversion forecasting:** "Average slots-detected per user per week" is the missing input to "expected £19 captures per user per month".

### 2.3 We already have the trust surface — just not the data flow

The v1.2 release already added a Premium-only metadata channel: extension version, browser, OS, attribution source are sent at activation and refreshed on the `/license/status` daily poll. The welcome page already discloses this. Adding aggregate event counters to the SAME payload is a small extension of an already-disclosed surface, not a new privacy regression.

---

## 3. Goals, Non-Goals, Success Metrics

### Goals (v1.3)

- **G1.** Capture `booking_failed_at_step` for every Premium auto-booking attempt that fails. Surface aggregate counts by step on the Ops dashboard so the empirical fix priority is obvious.
- **G2.** Capture 6 additional aggregate counters (see §4) that answer the "usage intensity" question per Premium user without collecting any per-event data.
- **G3.** Stay strictly within the existing Premium disclosure surface — no new categories of data, only aggregate counts of state transitions already happening on-device.
- **G4.** Update welcome-page disclosure copy + privacy page to honestly describe what's collected.
- **G5.** Free tier remains 100% local. Zero new bytes leave a Free user's device.

### Non-Goals (v1.3)

- **NG1.** Not capturing event timestamps. No "you detected a slot at 14:32 UTC". Only "you detected 12 slots since last poll".
- **NG2.** Not capturing per-event payloads. No slot text, no centre name per detection event, no Cloudflare challenge ID.
- **NG3.** Not capturing UI engagement events. No "user opened popup X times" or "user clicked Pause Y times". These are out of scope.
- **NG4.** Not capturing telemetry from Free users. Free tier code path remains untouched.
- **NG5.** Not introducing a new analytics endpoint or third-party tracker. Counters ride on the EXISTING `/license/status` POST that v1.2 added.
- **NG6.** Not building real-time dashboards. Counters arrive at next daily poll (≤24h latency). That's enough for the questions in §2.

### Success Metrics

- **SM1.** Within 30 days of v1.3 reaching 80% of Premium users via CWS auto-update, the `booking_failed_at_step` counter has identified the single most-failing DOM step. PRD §17 stub graduates from "best-guess selector" to "empirically validated" at that step.
- **SM2.** Within 30 days, the dashboard's "active vs dormant" Premium segmentation can be computed from `slots_detected_count` (active = ≥1 slot detected in window, dormant = 0).
- **SM3.** Zero new categories of data added to the Premium disclosure surface — only new bullets describing aggregate counts of already-disclosed categories.
- **SM4.** No regressions in Free-tier behaviour. CI check: assert that no `fetch()` or `chrome.runtime.sendMessage` to torly.ai is added inside Free-tier code paths.

---

## 4. Scope of telemetry — exact field list

The new payload added to each `/license/status` POST body, batched since the last successful poll:

```ts
{
  // ... existing v1.2 fields: installId, extensionVersion, browserName, browserVersion, os ...

  events: {
    // ── Lifecycle counters (since last successful poll) ─────────────
    slots_detected: number;              // SLOT_AVAILABLE state entries
    cloudflare_hits: number;             // CLOUDFLARE state entries
    logged_out_hits: number;             // LOGGED_OUT state entries
    paused_by_user: number;              // user-toggled pauses (count, not timing)

    // ── Auto-login counters (Premium-only state) ───────────────────
    auto_login_fired: number;            // tls-auto-login.ts attempted submit
    auto_login_succeeded: number;        // detected LOGGED_OUT → IDLE/NO_SLOTS transition after fire
    auto_login_failed: number;           // attempted submit but state didn't recover within 60s

    // ── Booking flow counters (the critical telemetry) ─────────────
    booking_attempts: number;            // driveBookingFlow() entered
    booking_succeeded: number;           // BOOKING_CONFIRMED + capture/booking endpoint reached
    booking_failed_total: number;        // any failure path
    booking_failed_at_step:              // categorical: WHICH step of driveBookingFlow failed last
      | null
      | 'load_calendar'
      | 'find_slot_button'
      | 'click_slot_button'
      | 'wait_for_form'
      | 'fill_name'
      | 'fill_email'
      | 'fill_phone'
      | 'click_confirm'
      | 'wait_for_confirmation'
      | 'detect_booking_id'
      | 'unknown';
    booking_timeout_count: number;       // driveBookingFlow hit the 60s budget without success

    // ── Health counters ────────────────────────────────────────────
    poll_count: number;                  // chrome.alarms fires (cadence sanity check)
    last_seen_at: string;                // ISO 8601, latest activity timestamp from local clock
  }
}
```

**Type strictness:** every count is a non-negative integer. `booking_failed_at_step` is a fixed enum or null — never a free-text DOM selector (which could leak content). The enum is hard-coded on the extension side and validated on the server.

**Reset semantics:** the extension increments these counters in `chrome.storage.local`. On successful POST, the extension clears them to zero. On POST failure, they accumulate until the next successful poll. The server treats them as a delta since last received, not absolute lifetime counts.

**Maximum payload size:** the events block is ~12 fields × ~10 bytes each ≈ 120 bytes added per poll. Negligible.

---

## 5. What we will NEVER collect (trust boundary)

The following are out of scope and must never appear in any future expansion without a separate PRD and a separate disclosure update:

- ❌ **Per-event timestamps.** "When did the slot appear?" is sensitive timing data we don't need at this granularity.
- ❌ **Per-event payloads.** No slot text. No centre name per detection. No Cloudflare challenge details. No booking form values.
- ❌ **DOM samples or selectors.** If the booking flow fails at step `fill_name`, we record the step name only — not the actual selector that failed, not the surrounding HTML.
- ❌ **TLS credentials or any derivative.** Already in the boundary; restated for clarity.
- ❌ **Polling cadence values.** We record `poll_count` (how many polls happened) but not the cadence setting (which is sensitive UX configuration).
- ❌ **UI engagement.** No "popup opened" events, no "settings page viewed" events, no click telemetry.
- ❌ **Any Free-tier signal whatsoever.** Free tier code paths must NOT call any telemetry method.
- ❌ **Cross-install correlation.** Each install reports independently. No shared identifiers beyond the installUUID already in use.

A CI check or a code-review checklist enforces "no new fetch() to torly.ai in Free code paths" — see §12.

---

## 6. Data flow

```
┌──────────────────────────────────────────────────────────────┐
│ Premium user's Chrome (extension v1.3.0)                    │
│                                                              │
│  ┌─────────────────────────────────────┐                    │
│  │ background/state-machine.ts         │                    │
│  │  on SLOT_AVAILABLE transition:      │                    │
│  │    incrementCounter('slots_detected')                    │
│  │  on CLOUDFLARE: incrementCounter('cloudflare_hits')      │
│  │  ...                                │                    │
│  └─────────────────────────────────────┘                    │
│                  │                                           │
│                  ▼ writes to chrome.storage.local.eventCounters
│  ┌─────────────────────────────────────┐                    │
│  │ background/booking-fsm.ts           │                    │
│  │  on driveBookingFlow failure:       │                    │
│  │    incrementCounter('booking_failed_total')              │
│  │    setLastFailedStep('fill_name')   │                    │
│  └─────────────────────────────────────┘                    │
│                  │                                           │
│                  ▼ 24h alarm fires                          │
│  ┌─────────────────────────────────────┐                    │
│  │ background/backend-client.ts        │                    │
│  │  refreshLicenseStatusWithMetadata() │                    │
│  │    body.events = readCounters()     │                    │
│  └─────────────┬───────────────────────┘                    │
└────────────────┼─────────────────────────────────────────────┘
                 │
                 │ POST https://torly.ai/api/visa-master/license/status
                 │ body: { installId, extensionVersion, browserName, browserVersion, os, events: {...} }
                 ▼
┌──────────────────────────────────────────────────────────────┐
│ torly.ai backend                                             │
│                                                              │
│  /api/visa-master/license/status (POST handler)              │
│    ├─ validate body (Zod)                                    │
│    ├─ verify installId is active                             │
│    ├─ UPDATE visa_master_installs SET                        │
│    │    extension_version = ...                              │
│    │    browser_name      = ...                              │
│    │    last_status_check_at = now()                         │
│    │  WHERE install_id = $1                                  │
│    ├─ INSERT INTO visa_master_event_snapshots (              │
│    │    install_id, captured_at, events_json                 │
│    │  ) VALUES (...)                                         │
│    └─ return 200                                             │
└──────────────────────────────────────────────────────────────┘
                 │
                 │ (on next dashboard load)
                 ▼
┌──────────────────────────────────────────────────────────────┐
│ /admin/ops/schengen-visa dashboard                          │
│                                                              │
│  New section: "Booking flow health" (4 KPIs)                 │
│  New section: "Per-customer activity" (table column)         │
│  New aggregate: "Booking failures by step" (bar chart)       │
└──────────────────────────────────────────────────────────────┘
```

**Cadence:** counters are read and POSTed on the existing daily license-status alarm (~24h interval). No new alarm. No new scheduled job.

**Failure mode:** if the POST fails (network blip, 5xx, server unreachable), counters remain in `chrome.storage.local` and are sent on the next poll. No data loss except in the case of uninstall before successful poll, which is acceptable.

---

## 7. Schema changes

### 7.1 New Supabase migration

```sql
-- supabase/migrations/0NN_visa_master_event_snapshots.sql

CREATE TABLE visa_master_event_snapshots (
  id          uuid       PRIMARY KEY DEFAULT gen_random_uuid(),
  install_id  uuid       NOT NULL REFERENCES visa_master_installs(install_id),
  captured_at timestamptz NOT NULL DEFAULT now(),
  events      jsonb      NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Index for dashboard queries: latest snapshot per install
CREATE INDEX visa_master_event_snapshots_install_captured_idx
  ON visa_master_event_snapshots (install_id, captured_at DESC);

-- Index for aggregate queries: time-window slicing
CREATE INDEX visa_master_event_snapshots_captured_idx
  ON visa_master_event_snapshots (captured_at DESC);

-- Service role only (matches the rest of visa_master_*)
ALTER TABLE visa_master_event_snapshots ENABLE ROW LEVEL SECURITY;
```

The `events` jsonb column holds the exact shape from §4. We avoid normalising into individual columns because:
- The set of counters is expected to evolve over minor versions
- jsonb queries are fast enough at our scale
- Adding a new counter is a code-only change, no migration

If a particular counter becomes a heavy query (e.g., we query `booking_failed_at_step` aggregates daily for alerting), we can extract it to a generated column later.

### 7.2 No changes to `visa_master_installs`

The metadata-refresh columns (`extension_version`, `browser_name`, etc.) from v1.2 are sufficient. The event snapshots are a SEPARATE table because:
- Snapshots accumulate (one row per poll per install — ~30/month/install)
- We want to keep `visa_master_installs` as the "latest state per user" view
- Time-series of events is its own concern, separately queryable

---

## 8. API contract — `/license/status` POST extension

### 8.1 Current v1.2 body (unchanged for backward compat)

```ts
POST /api/visa-master/license/status
Content-Type: application/json

{
  installId: string;
  extensionVersion?: string;   // optional from v1.2
  browserName?: string;
  browserVersion?: string;
  os?: string;
}
```

### 8.2 v1.3 body extension (additive, all optional)

```ts
{
  installId: string;
  extensionVersion?: string;
  browserName?: string;
  browserVersion?: string;
  os?: string;

  // NEW in v1.3 — all optional, older extensions don't send this block
  events?: {
    slots_detected?: number;
    cloudflare_hits?: number;
    logged_out_hits?: number;
    paused_by_user?: number;
    auto_login_fired?: number;
    auto_login_succeeded?: number;
    auto_login_failed?: number;
    booking_attempts?: number;
    booking_succeeded?: number;
    booking_failed_total?: number;
    booking_failed_at_step?: string;   // server validates against enum
    booking_timeout_count?: number;
    poll_count?: number;
    last_seen_at?: string;             // ISO 8601
  };
}
```

**Server validation (Zod):**

- All counters must be non-negative integers ≤ 100,000 (sanity cap; sane installs poll daily and won't accumulate beyond ~50 of anything between polls).
- `booking_failed_at_step` must match the fixed enum from §4 or be omitted/null. Unknown values are coerced to `'unknown'` rather than failing the whole request.
- `last_seen_at` must parse as ISO 8601 within a 30-day window (rejects clock-skewed clients).
- Total body size ≤ 4KB (existing limit on the route).

**Server behaviour:**

- If `events` is present and valid, INSERT a new `visa_master_event_snapshots` row.
- If `events` is invalid (one of the constraints fails), log + ignore the events block but still process the metadata refresh portion of the body. Return 200 with a warning header. We never want a malformed events block to lose us the metadata update.
- Return 200 always (matching v1.2 behaviour). 4xx only on auth failure or missing/invalid `installId`.

### 8.3 Backward compatibility

- v1.0/v1.1 extensions: send no body to `/license/status` GET. Server reads installId from query param. Unchanged.
- v1.2 extensions: POST with metadata but no `events` field. Unchanged behaviour.
- v1.3 extensions: POST with metadata + `events` field. New behaviour activates.

The server detects which version it's talking to by the presence of fields in the body, never by version-string comparison. This means a v1.3 extension can interact with a v1.2-era backend (the events block is silently dropped) and vice versa.

---

## 9. Extension implementation

### 9.1 New shared storage key

In `extension/src/shared/storage.ts`:

```ts
// chrome.storage.local key: 'eventCounters'
// PERMANENT — do not rename without a migration helper.
export interface PersistedEventCounters {
  slots_detected: number;
  cloudflare_hits: number;
  logged_out_hits: number;
  paused_by_user: number;
  auto_login_fired: number;
  auto_login_succeeded: number;
  auto_login_failed: number;
  booking_attempts: number;
  booking_succeeded: number;
  booking_failed_total: number;
  booking_failed_at_step: BookingFlowStep | null;
  booking_timeout_count: number;
  poll_count: number;
  last_seen_at: string;  // ISO 8601
}

export type BookingFlowStep =
  | 'load_calendar' | 'find_slot_button' | 'click_slot_button'
  | 'wait_for_form' | 'fill_name' | 'fill_email' | 'fill_phone'
  | 'click_confirm' | 'wait_for_confirmation' | 'detect_booking_id'
  | 'unknown';

export async function incrementCounter(
  key: keyof PersistedEventCounters,
  delta: number = 1
): Promise<void> { /* ... */ }

export async function setLastFailedStep(
  step: BookingFlowStep
): Promise<void> { /* ... */ }

export async function readAndClearCounters(): Promise<PersistedEventCounters> { /* ... */ }
```

### 9.2 Wiring into state machine + booking FSM

- `background/state-machine.ts` `transitionTo()`: when entering `SLOT_AVAILABLE`, `CLOUDFLARE`, `LOGGED_OUT`, call `incrementCounter()`.
- `background/booking-fsm.ts` `driveBookingFlow()`: at the start, increment `booking_attempts`. On each step boundary, track the current step in a local var. On failure (timeout, missing selector, etc.), `setLastFailedStep(currentStep)` then increment `booking_failed_total`.
- `background/scheduler.ts` `pollAlarmHandler`: increment `poll_count`. Update `last_seen_at = new Date().toISOString()`.
- `background/backend-client.ts` `refreshLicenseStatusWithMetadata()`: call `readAndClearCounters()`, attach to POST body as `events`. If POST succeeds (200), counters stay cleared; if not, write them back atomically.

**Gating:** every counter call sites must be inside a Premium tier check OR inside code paths that only execute for Premium installs. The state machine increments are tier-agnostic (Free + Premium both transition through these states) — but the POSTing of counters only happens via `refreshLicenseStatusWithMetadata()` which already gates on `tier === 'premium'`. So the data NEVER leaves a Free user's machine; it accumulates locally and is read by nothing.

**Verification:** a unit test asserts `refreshLicenseStatusWithMetadata` short-circuits when tier is 'free'. Existing test in v1.2 covers this — extend it.

### 9.3 Local debug surface (out of scope but worth noting)

Counters are visible in `chrome.storage.local` via DevTools. A future Settings page debug section could surface them so the user can see exactly what's being sent. Not in v1.3 scope; mentioned for transparency.

---

## 10. Dashboard surfacing

### 10.1 New section: "Booking flow health" (CRITICAL)

Position: above the Bookings table, below the Premium customers table.

```
┌────────────────────────────────────────────────────────────────────┐
│ BOOKING FLOW HEALTH — last 30d, Premium installs                  │
│                                                                    │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐         │
│  │ ATTEMPTS      │  │ SUCCEEDED     │  │ FAILED        │         │
│  │ 12            │  │ 0             │  │ 12            │         │
│  │ (across 3     │  │ (0% success — │  │ (100% failure │         │
│  │  installs)    │  │  expected; stub)│  │  rate — stub) │       │
│  └───────────────┘  └───────────────┘  └───────────────┘         │
│                                                                    │
│  FAILURES BY STEP                                                  │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ fill_name             ████████████████  8                  │   │
│  │ click_confirm         ██████  3                            │   │
│  │ wait_for_form         ██  1                                │   │
│  │ (no failures at: load_calendar, find_slot_button, ...)     │   │
│  └────────────────────────────────────────────────────────────┘   │
│  → Highest-priority fix: `fill_name` selector. See booking-fsm.ts │
└────────────────────────────────────────────────────────────────────┘
```

When a `failures by step` bar leads by 2x+ over the next, surface it as the actionable signal. This is the single most-load-bearing output of Tier B.

### 10.2 New section: "Per-customer activity"

Add 4 columns to the Premium Customers table (between BROWSER and BK):

| Column | Source | Display |
|---|---|---|
| Last seen | `last_seen_at` from latest snapshot | "2h ago" / "5d ago" — red if > 14d |
| Slots/wk | `slots_detected` averaged over last 7 days of snapshots | "12" / "—" if no snapshots yet |
| Auto-login | `auto_login_succeeded / auto_login_fired` ratio | "100%" / "67%" — amber if <80% |
| Booking attempts | `booking_attempts` lifetime | "3" / "—" |

### 10.3 New cold-start state

If no install in the window has any event snapshot (i.e., pre-v1.3 backfill), the section header shows: "Booking flow health — pending. Telemetry begins when v1.3 reaches users."

### 10.4 No changes to existing 6-card KPI strip

Counter aggregates are interesting but not daily-glance metrics. They live in the dedicated section below.

---

## 11. Privacy disclosure updates

### 11.1 Welcome page (extension/src/welcome/WelcomePage.tsx)

Add bullets to the Premium-tier disclosure list:

- "Aggregate counts of how often slots were detected, auto-login fired, and booking attempts happened — to help us improve the auto-booking flow"
- "Which step of the auto-booking flow failed last (a category label like `fill_name`, never the actual form contents)"

### 11.2 Privacy page (app/privacy/visa-master/page.tsx in torlyAI)

Same content, formatted for the public privacy policy. Position: under existing "What Premium sends" section.

### 11.3 zh-CN

All new strings translated. Best-effort initial, flagged for native review.

### 11.4 Hard restatement

Append to the Free-tier disclosure section: "Free tier sends zero events of any kind to torly.ai. This includes the new v1.3 event counters — they exist only on Premium users' machines, and only Premium users' counters reach our servers."

---

## 12. Migration & rollout

### 12.1 Order of operations

1. **Backend first** — ship migration + extended /license/status route. Backward-compatible: v1.2 extensions continue working unchanged.
2. **Extension second** — v1.3 release with counters wired up. CWS review ~3-5 days. Auto-update rolls out over ~24h.
3. **Dashboard third** — surface the new section once data starts flowing (after step 2 has been live for ~48h).

Step 1 alone is safe to deploy as soon as the PRD is approved (it's additive and gated by the optional body field).

### 12.2 CI checks

- **TypeScript** — extending the BodySchema in the route and the storage interface in the extension. Existing CI catches.
- **No-fetch-from-Free invariant** — add a unit test that mocks `getLicense()` returning `{ tier: 'free' }` and asserts that `refreshLicenseStatusWithMetadata()` does NOT call `fetch`. Extends an existing v1.2 test of the same shape.
- **Counter cap** — server-side Zod constraint rejects counter values > 100,000. Unit test for this.

### 12.3 Rollback

- If a counter starts producing garbage: server-side Zod will refuse those values and the metadata refresh continues unaffected.
- If a v1.3 release ships a bug: revert via CWS ("Revert to previous version") or a v1.3.1 hotfix. Counters are local-only state; nothing on the server breaks.
- If the privacy disclosure is criticised: the events block is OPTIONAL on the server side. We can ignore-and-discard incoming `events` until disclosure is updated, with zero code change beyond a feature flag.

---

## 13. Open questions

### Q1 — Snapshot retention

How long do we keep `visa_master_event_snapshots` rows? Forever (audit trail) or 90 days (smaller table)?

**My call:** keep forever for now. At ~30 snapshots/install/month × current Premium scale, the table grows ~120 rows/month. Trivial. Revisit if we ever exceed 100K rows.

### Q2 — Aggregate vs. last-snapshot for dashboard

The dashboard's "Last seen" + per-customer columns can be served by:
- (a) reading the LATEST snapshot per install (fast, simple, loses some context)
- (b) aggregating ALL snapshots in the window (richer, slower, requires window-functions)

**My call:** (a) for v1.3 (last snapshot per install). Revisit if we want week-over-week aggregates per customer.

### Q3 — Should `last_seen_at` come from the server or the client?

Client clock can be wrong. Server clock at POST receipt is authoritative.

**My call:** use server-receipt time as `last_seen_at` in the DB. Ignore the client-provided value (or use it only for sanity-check / drift detection).

### Q4 — Should the booking step enum be extensible?

The current enum (10 values) covers the steps in the current `driveBookingFlow()` stub. If we add steps later, we need to add to the enum + ship a new extension version.

**My call:** start with the fixed enum. Add `'unknown'` as a catch-all for new steps that haven't been formally added yet. Re-evaluate after first 60 days of data.

### Q5 — Free tier visibility

Should Free users see THEIR OWN counters in the popup (since the data exists locally)?

**My call:** out of scope for v1.3. Could be a nice transparency win in v1.4 ("here's exactly what we'd send if you upgraded to Premium — currently nothing").

---

## 14. Implementation plan & estimate

### Backend (torlyAI repo) — ~1 day

- New migration: `supabase/migrations/0NN_visa_master_event_snapshots.sql` (~30 LOC)
- Extend `/api/visa-master/license/status/route.ts` POST handler: validate + insert event snapshot (~40 LOC)
- Extend `/api/admin/ops/visa-master/route.ts` to aggregate events for dashboard (~80 LOC)
- Unit tests for counter cap + enum validation (~50 LOC)

### Extension (Schengen-visa repo) — ~1.5 days

- Extend `extension/src/shared/storage.ts` with counter helpers (~80 LOC)
- Wire `incrementCounter()` calls into `state-machine.ts`, `booking-fsm.ts`, `scheduler.ts`, `tls-auto-login.ts` (~30 LOC across files)
- Extend `background/backend-client.ts` `refreshLicenseStatusWithMetadata()` to attach `events` (~20 LOC)
- Update welcome page disclosure (en + zh-CN) (~10 LOC)
- Bump manifest to v1.3.0
- Unit test: no-fetch-from-Free invariant (~30 LOC)

### Dashboard (torlyAI repo) — ~1 day

- Extend `components/admin/VisaMasterDashboard.tsx` with "Booking flow health" section (~120 LOC)
- Add 4 columns to Premium Customers table (~40 LOC)
- Cold-start empty state (~20 LOC)
- Extend `VisaMasterDashboardResponse` interface (~20 LOC)

### Privacy/docs (Schengen-visa repo) — ~0.5 day

- Update `app/privacy/visa-master/page.tsx` (torlyAI) (~10 LOC)
- Update PRD 09 §13 to reference this PRD
- Mark this PRD status: Approved → In Progress → Shipped

### Total: ~4 days single-developer effort

Cross-repo PR coordination per CLAUDE.md (commit `[deploy]` token in torlyAI; CWS upload manual for extension).

---

## 15. Appendix A — Event counter inventory

### Counter origins (where each one is incremented)

| Counter | File | Trigger |
|---|---|---|
| `slots_detected` | `background/state-machine.ts` | Entry to `SLOT_AVAILABLE` |
| `cloudflare_hits` | `background/state-machine.ts` | Entry to `CLOUDFLARE` |
| `logged_out_hits` | `background/state-machine.ts` | Entry to `LOGGED_OUT` |
| `paused_by_user` | `background/state-machine.ts` | User-toggled pause action |
| `auto_login_fired` | `background/tls-auto-login.ts` | Form submit attempted |
| `auto_login_succeeded` | `background/tls-auto-login.ts` | Subsequent state transition out of LOGGED_OUT within 60s |
| `auto_login_failed` | `background/tls-auto-login.ts` | 60s timeout without LOGGED_OUT exit |
| `booking_attempts` | `background/booking-fsm.ts` | `driveBookingFlow()` entry |
| `booking_succeeded` | `background/booking-fsm.ts` | `BOOKING_CONFIRMED` reached + capture POST 200 |
| `booking_failed_total` | `background/booking-fsm.ts` | Any failure exit from `driveBookingFlow` |
| `booking_failed_at_step` | `background/booking-fsm.ts` | Set on failure exit; categorical |
| `booking_timeout_count` | `background/booking-fsm.ts` | 60s budget hit |
| `poll_count` | `background/scheduler.ts` | `vmPollAlarm` fires |
| `last_seen_at` | `background/scheduler.ts` | `vmPollAlarm` fires (overwrites with `new Date().toISOString()`) |

### Counter mapping to questions

| Question (from `22-data-sources-playbook.md`) | Counter(s) | Where in dashboard |
|---|---|---|
| Where does the auto-booking flow break in production? | `booking_failed_at_step`, `booking_failed_total` | "Booking flow health" — Failures by step bar chart |
| How many slots does a typical Premium user catch per week? | `slots_detected` / 7 (averaged) | Premium Customers table — Slots/wk column |
| Are users hitting Cloudflare repeatedly? | `cloudflare_hits` | Future: dashboard alert if any install crosses 50/week |
| Is auto-login actually working? | `auto_login_succeeded / auto_login_fired` | Premium Customers table — Auto-login column |
| Which users are dormant? | `last_seen_at` | Premium Customers table — Last seen column |
| What's our true poll cadence in production? | `poll_count` | Future: aggregate vs. expected cadence (8/hour × 24 = 192/day max) |
