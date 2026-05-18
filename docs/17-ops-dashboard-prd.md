# PRD: Visa Master — Schengen Visa Ops Dashboard Section

**Document:** 17-ops-dashboard-prd.md
**Version:** 1.0
**Date:** 2026-05-18
**Status:** Draft for review
**Owner:** Duke Harewood (Torly AI)
**Implementation repo:** `torlyAI/` (Next.js app at `torly.ai`)
**Companion wireframes:** [`18-ops-dashboard-wireframes.md`](./18-ops-dashboard-wireframes.md)
**Related docs:**
- `09-visa-master-premium-prd.md` — Premium tier PRD
- `11-architecture.md` — System architecture (data source contract)
- `14-notifications-and-email-prd.md` — Email/notification touchpoints

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Why Add a Schengen Visa Section Now](#2-why-add-a-schengen-visa-section-now)
3. [Goals, Non-Goals, Success Metrics](#3-goals-non-goals-success-metrics)
4. [Personas](#4-personas)
5. [Information Architecture](#5-information-architecture)
6. [V1 Scope — Tier-1 Landing Page](#6-v1-scope--tier-1-landing-page)
7. [Data Sources & Trust Boundary](#7-data-sources--trust-boundary)
8. [KPI Card Specifications](#8-kpi-card-specifications)
9. [Time-Series Charts](#9-time-series-charts)
10. [Tables](#10-tables)
11. [Filters & Time Windows](#11-filters--time-windows)
12. [API Endpoints](#12-api-endpoints)
13. [Privacy, PII Handling, & Trust Boundary](#13-privacy-pii-handling--trust-boundary)
14. [Non-Functional Requirements](#14-non-functional-requirements)
15. [Open Decisions Surfaced for Review](#15-open-decisions-surfaced-for-review)
16. [Roadmap — V1 → V2 → V3](#16-roadmap--v1--v2--v3)
17. [Appendix A — Sidebar Insertion Diff](#17-appendix-a--sidebar-insertion-diff)

---

## 1. Executive Summary

Add a new **Schengen Visa** section to the TorlyAI Ops dashboard sidebar, positioned immediately under the existing **Desktop** entry (which represents the Innovator Founder visa desktop assistant). This section gives the operator (Duke) a single pane of glass for the Visa Master Chrome extension product: how many people have it, how many are Premium-paying, how their payments are progressing, and where the funnel leaks.

The V1 landing page (Tier-1) answers two questions:

1. **How many people are using Visa Master?** — broken down by Free-tier installs (anonymous, from Chrome Web Store public stats) and Premium activations (precise, from Supabase).
2. **How much money has come in?** — Premium card-saves (activations), £19 booking captures, refunds, MRR-equivalent (active Premium customers × expected lifetime value).

Wireframes for every screen, empty state, loading state, and error state live in the companion file [`18-ops-dashboard-wireframes.md`](./18-ops-dashboard-wireframes.md).

---

## 2. Why Add a Schengen Visa Section Now

Three forcing functions:

1. **Premium just shipped to production.** As of 2026-05-18 the success-fee flow is live (per `docs/11-architecture.md` and the `[deploy]`-gated rollout of `app/api/visa-master/*`). The operator currently has to open Stripe Dashboard + Supabase SQL editor + Chrome Web Store dev console to answer "how is Visa Master doing today?" — three tools, three logins, three mental models. The Ops dashboard already aggregates this for the Innovator Founder Desktop product; Visa Master deserves the same treatment.
2. **The recent stranded-payment incident (install `b7ad8db5…`)** showed that Stripe-side success and extension-side activation can silently diverge. A dashboard that surfaces orphan Setup Intents — succeeded server-side but with no corresponding popup state — would have caught this within minutes, not hours.
3. **Directory-submission and launch campaigns** (per `docs/15-directory-submissions-launch-plan.md` and `docs/16-vm-launcher-usage-plan.md`) will start driving real traffic. Without a dashboard, attribution of which directory drives which activations becomes a nightly SQL chore.

---

## 3. Goals, Non-Goals, Success Metrics

### Goals (V1)

- **G1.** Operator can see, on one page, the count of Premium activations and total £19 captures, with a chosen time window.
- **G2.** Operator can see Free-tier reach (Chrome Web Store install count) alongside Premium conversion — a single funnel view.
- **G3.** Operator can identify stranded Setup Intents (succeeded in Stripe but no `vmLicense` in the corresponding install row) without leaving the dashboard.
- **G4.** Page parity with the Desktop section: same KPI-card grid, same time-window selector, same recharts components, same table interactions.
- **G5.** Reuses existing components — `KpiCard`, `OpsSidebar` nav-item, the recharts AreaChart / PieChart wrappers from `DesktopDashboard.tsx` — so V1 is < 600 LOC of new code excluding the API route.

### Non-Goals (V1)

- **NG1.** Not building per-user drill-down detail pages in V1 (that's V2).
- **NG2.** Not exposing TLS credentials, polling cadence, or DOM contents — these never leave the user's machine and have no representation in our data model (per `docs/11-architecture.md` §9 trust boundary).
- **NG3.** Not tracking individual Free-tier users. Free-tier installs are deliberately anonymous (per the brand promise restated in welcome i18n). Only aggregate Chrome Web Store install counts may be surfaced.
- **NG4.** Not building cohort/retention curves in V1. The product is too young; cohort data would be misleading. Revisit in V3 when 3+ months of activation history exists.
- **NG5.** Not building alerting / Slack webhooks in V1. Dashboard is pull-based; push notifications wait for V2.

### Success Metrics

- **SM1.** Time-to-answer for "how many Premium customers paid this week?" drops from ≥3 min (login → Stripe Customers → filter → count) to ≤5 sec (open dashboard).
- **SM2.** Orphan Setup Intent count surfaced on the dashboard is ≤1 at any time within 48h of dashboard launch (i.e. the dashboard catches them faster than they accumulate).
- **SM3.** Page TTFB ≤500ms p95, full data render ≤1.5s p95, matching the Desktop section's measured budget.

---

## 4. Personas

| Persona | Who | What they need from this section |
|---|---|---|
| **P1: Operator (Duke)** | Founder, runs all ops solo | A daily glance answer to "is the funnel working?" Surface anomalies. Stripe-side and extension-side state both visible. |
| **P2: Support (future)** | Whoever handles Visa Master support emails | Look up an install_id or Stripe email to see its full state and last activity. (Stretch — V2.) |
| **P3: Investor / partner (future)** | Read-only viewer with filtered access | Aggregate Premium activation numbers only, no PII. (Out of scope — V3.) |

V1 designs only for P1. The page architecture should not foreclose P2/P3 evolution (e.g. don't hard-code "no detail pages" — leave the row click handler stubbed).

---

## 5. Information Architecture

### Sidebar placement

```
TorlyAI Ops
├── Overview
├── Revenue ▼
│   ├── Subscriptions
│   └── Transactions
├── Users ▼
│   ├── Directory
│   ├── Pipeline
│   ├── Lifecycle
│   └── Assessments
├── Emails ▼
│   ├── All emails
│   └── User lifecycle
├── Desktop                  ← existing (Innovator Founder)
├── 🆕 Schengen Visa         ← THIS PRD adds this entry, right here
├── Campaigns ▼
│   ├── Organic
│   ├── VIP50
│   ├── Prospect109
│   └── Summer Promo 2026
├──────────────────────────  (separator)
├── Agent Log
└── MCP Integration
```

The two product-line entries (**Desktop** for Innovator Founder, **Schengen Visa** for Visa Master) sit as sibling single-page items. They are deliberately NOT nested under a "Products" parent — both products are first-class business lines and the sidebar already treats Desktop as top-level.

### Page hierarchy (V1)

```
/admin/ops/schengen-visa
└── (single Tier-1 landing page — this PRD's V1 scope)
```

V2 will add children (`/installations`, `/premium`, `/bookings`, `/funnel`) under the same parent. The V1 page is intentionally scrollable rather than tabbed so we don't have to retrofit a nav structure later.

### Tier-1 page anatomy (top to bottom)

1. **Page header** — title, subtitle, time-window selector (7d / 30d / 90d / 1y; same component as Revenue page).
2. **Funnel KPI strip** — 6 cards showing the activation funnel + revenue rollup (see §8).
3. **Activation time-series chart** — area chart of Premium activations and £19 captures over time, same component as the Desktop section's `dailyActivations` chart.
4. **Distribution donut + table block** — donut of activations by `target.country` (the country of the TLS centre booked); table to its right showing the top 5 centres.
5. **Premium customers table** — recent Premium activations, oldest "stranded" Setup Intents first.
6. **Bookings table** — recent £19 captures, with refund status.

Sections 3–6 are scroll-stacked, no tabs.

---

## 6. V1 Scope — Tier-1 Landing Page

### 6.1 What the page MUST answer

| Question | Where it answers |
|---|---|
| How many people have installed Visa Master? | KPI: "Chrome Web Store users" (with a "data freshness: ~24h" label) |
| How many have activated Premium? | KPI: "Premium activations (Setup Intent succeeded)" |
| How many have actually booked? | KPI: "Booking captures (£19 charged)" |
| How much revenue this period? | KPI: "Captured £" + "Refunded £" + "Net £" |
| Is the funnel healthy? | Time-series chart showing activations + captures overlaid |
| Where are users booking? | Donut chart by country/centre |
| **Where did each paying user come from?** | KPI + donut: attribution source (CWS organic / Reddit / TikTok / etc.) |
| **What extension version are paying users on?** | Premium customers table column: Version |
| **What browser are paying users using?** | Premium customers table column: Browser (+ a small breakdown chart) |
| Who paid? | Premium customers table (now with full install_id) |
| Any silent failures? | Premium customers table sorted so orphan Setup Intents float to top |

### 6.2 What the page MUST NOT do (yet)

- No per-user drill-down — clicking a row shows a non-functional tooltip "Detail view coming in V2"; this preserves the row click handler so V2 only needs to wire up the route.
- No CSV export. Operator already uses Stripe Export for finance reconciliation.
- No edit/destructive actions (no "force activate", no "manual refund"). Those are kept in Stripe Dashboard + Supabase admin to avoid blast-radius in V1.

---

## 7. Data Sources & Trust Boundary

> **This section is load-bearing.** The Free vs Premium trust boundary (see `docs/11-architecture.md` §9) constrains what can be surfaced. Designers must read this before laying out KPIs.

### 7.1 What we can show with PRECISION

Comes from `visa_master_installs` + `visa_master_bookings` (Supabase) and the Stripe live API:

| Metric | Source | Precision |
|---|---|---|
| Premium activations | `visa_master_installs` rows where `status='active'` | Exact, real-time |
| **Install ID** (full UUID) | `visa_master_installs.install_id` | Exact — anonymous random UUID, not PII |
| **Extension version** | `visa_master_installs.extension_version` (new column, migration 029) | Exact — captured at activation, refreshed on each `/license/status` poll |
| **Browser name & version** | `visa_master_installs.browser_name`, `browser_version` (new, migration 029) | Exact — captured at activation, refreshed on each `/license/status` poll |
| **OS** | `visa_master_installs.os` (new, migration 029) | Exact — captured at activation |
| **Attribution source** | `visa_master_installs.attribution_source`, `attribution_detail` (new, migration 029) | Self-reported — see §7.4 for capture mechanism |
| £19 booking captures | `visa_master_bookings` rows where `status='captured'` | Exact, real-time |
| Refunds | `visa_master_bookings` rows where `status='refunded'` | Exact, real-time |
| Orphan Setup Intents | Stripe `setup_intents.list` filtered by `metadata.product='visa-master'` AND `status='succeeded'` AND **no** matching active install row in Supabase | Real-time (Stripe live API call, cached 60s) |
| Stripe customer email | Stripe customer lookup | Exact (PII — see §13 for masking) |
| Centre / country distribution | `visa_master_bookings.centre` parsed against TLS centre catalogue (V2 — V1 just shows raw centre string) | Exact |
| Booking refund-window state | `visa_master_bookings.refund_until` (timestamptz) compared to `now()` | Exact, real-time |

### 7.2 What we can show APPROXIMATELY

Comes from Chrome Web Store public stats (scrape or CWS Developer API):

| Metric | Source | Precision |
|---|---|---|
| Chrome Web Store install count | CWS public listing page (number after "users") | Rounded — CWS shows "200+", "1,000+" buckets. Updates ~daily. |
| GitHub Releases download count | GitHub API `repos/torlyai/Schengen-master/releases` | Exact per release asset, but represents side-load installs only, not CWS installs. |
| **Daily active users (Free)** | **NOT AVAILABLE** | Free tier sends zero telemetry. We cannot track DAU. |

The CWS install number is displayed with an explicit `📊 ~24h delayed, public stat` label so the operator doesn't conflate it with real-time precision.

### 7.3 What we CANNOT and WILL NOT show

These are protected by the architecture's trust boundary. Surfacing them would break the brand promise restated in welcome i18n and `docs/11-architecture.md` §9.

- ❌ Individual Free-tier user counts, identifiers, or any per-user metric.
- ❌ Any Free-tier user's extension version, browser, OS, or attribution source. Aggregate Chrome version stats from CWS Developer console are the only Free-tier breakdown allowed.
- ❌ Any user's TLS credentials, polling cadence, or DOM contents.
- ❌ Any Free-tier user's Telegram bot token.
- ❌ The contents of `chrome.storage.local` for any Free user (this data never leaves the device).

If a future operator asks for "the list of Free users", the answer is "we deliberately don't have that and won't build it". This non-capability is a feature, not a gap.

### 7.4 How attribution, version, and browser data is captured (Premium only)

These new fields need to be sent by the extension at activation time. They do NOT exist in Free tier (and won't — see §7.3). The extension-side capture flow:

#### 7.4.1 Extension version and browser detection

Captured automatically by the service worker at activation time and on every `/license/status` poll. No user-visible UI needed.

```ts
// Approximate detection logic in extension/src/background/backend-client.ts
const extension_version = chrome.runtime.getManifest().version;          // e.g. "1.1.0"
const userAgentData = (navigator as any).userAgentData;                   // Chrome 90+
const browser_name = userAgentData?.brands?.find(
  (b: { brand: string }) =>
    !['Chromium', 'Not.A/Brand', 'Not_A Brand'].includes(b.brand)
)?.brand ?? 'Chrome';                                                     // e.g. "Microsoft Edge", "Brave", "Google Chrome"
const browser_version = userAgentData?.brands?.[0]?.version ?? '';
const os = userAgentData?.platform ?? '';                                 // e.g. "macOS", "Windows"
```

These three fields ride on the `/license/activate` POST body. On subsequent `/license/status` polls (1×/24h), the server updates the install row if the values changed (so a user upgrading the extension is reflected without re-activation).

#### 7.4.2 Attribution source — self-reported

Because Chrome Web Store strips referrers, UTM params, and document.referrer, the only reliable source-of-truth is the user telling us. We capture this via a single optional question:

**Question:** "How did you hear about Visa Master?"
**Choices (V1):** Reddit · Twitter/X · TikTok · YouTube · Friend · Google · CWS recommendations · Other (free text) · Skip
**Placement:** the Premium intro page (`extension/src/premium/PremiumLandingPage.tsx`), shown ONCE after the user clicks "Activate Premium" but before the redirect to Stripe Checkout.

| Why Premium intro, not Welcome? | |
|---|---|
| **Pro:** the answer is collected from buyers (highest-signal cohort for ROI math). | |
| **Pro:** the question feels appropriate in a context where the user is already engaged (about to spend money). | |
| **Pro:** less skippable than on Welcome where users are trying to get to their first slot check ASAP. | |
| **Con:** answers from Free-only users are never collected, so CAC analysis (cost-per-install) cannot be computed — only ROAS (cost-per-paying-customer) can. | |
| **Con:** users abandoning Stripe still have their attribution captured (the value lands in the install row even if Setup Intent never succeeds), which is actually FINE since we want to know about high-intent abandoners too. | |

This placement decision is **Decision D4** in §15. Override if you'd rather capture at Welcome (more data, lower signal).

The answer is sent in the `/license/activate` POST body as `attribution_source` and (for "Other") an optional `attribution_detail` free-text string (max 200 chars, sanitized server-side).

#### 7.4.3 Migration

A new Supabase migration `029_visa_master_install_metadata.sql` adds:

```sql
ALTER TABLE visa_master_installs
  ADD COLUMN extension_version text,
  ADD COLUMN browser_name text,
  ADD COLUMN browser_version text,
  ADD COLUMN os text,
  ADD COLUMN attribution_source text,
  ADD COLUMN attribution_detail text;

-- Index for dashboard queries
CREATE INDEX visa_master_installs_attribution_idx
  ON visa_master_installs (attribution_source)
  WHERE attribution_source IS NOT NULL;
```

All columns are nullable. Existing rows backfill as NULL and the dashboard treats NULL as "Unknown (pre-1.2)" — see §10.1.

#### 7.4.4 Privacy posture

This is still the existing Premium-tier disclosure surface. We are not collecting any new categories of data; we are enriching the **already-disclosed** activation payload with a few low-cardinality fields. The `09-visa-master-premium-prd.md` privacy section and the welcome i18n's "what Premium sends" list are updated in the same PR to add: extension version, browser name, OS, and attribution source.

We do NOT collect: Chrome user fingerprint, screen resolution, language preferences (already known via the existing `uiLang` field), or any other browser-identifying signal beyond browser name and major version.

---

## 8. KPI Card Specifications

Six cards, top of page, two rows of three on desktop / single column on mobile. Each uses the existing `<KpiCard>` component (`components/admin/KpiCard.tsx`).

| Card | Value | Subtext | Delta vs prev period | Source |
|---|---|---|---|---|
| **CWS Installs** | "1,200+" (bucketed) | "Chrome Web Store users • ~24h" | none (CWS doesn't expose history) | scraped or CWS Developer API |
| **Premium activations** | `count(installs WHERE status='active' AND created_at >= since)` | "Card saved, not yet charged" | +/-X vs same window prior | Supabase |
| **Booking captures** | `count(bookings WHERE status='captured' AND created_at >= since)` | "£19 charged on successful booking" | +/-X vs prior | Supabase |
| **Captured £** | `SUM(amount_pence WHERE status='captured') / 100` | "Net of refunds" | +/-£X vs prior | Supabase |
| **Refunded £** | `SUM(amount_pence WHERE status='refunded') / 100` | "Within 24h refund window" | +/-£X vs prior | Supabase |
| **Orphan Setup Intents** | Live Stripe count | "⚠️ Succeeded in Stripe, missing in DB" | none (point-in-time) | Stripe API |

The **Orphan Setup Intents** card has a destructive-red visual treatment when count > 0. A count > 0 is a paging-worthy signal — the only way it goes >0 is a regression of the post-Checkout activation chain (the exact class of bug that bit install `b7ad8db5…` on 2026-05-18).

---

## 9. Time-Series Charts

### 9.1 Primary: Activations + Captures over time

Stacked area chart (recharts `AreaChart`), same configuration as `DesktopDashboard.tsx`'s `dailyActivations` chart.

- **X axis:** date (daily bucket, derived from selected time window).
- **Y axis:** count.
- **Series 1 (amber, fill):** Premium activations per day.
- **Series 2 (green, fill):** Booking captures per day.
- **Tooltip:** date • activations: N • captures: N • net £.

Daily granularity is hard-coded for V1. Hourly is overkill at current volume; weekly bucketing is added in V3 once we have 90+ days of history.

### 9.2 Distribution donuts — two rows, two themes each

Two-row block, each row is a donut chart on the left + top-5 table on the right (same two-column layout as Desktop section's "Devices by OS" donut + version distribution table).

**Row 1 — By centre / country**

- **Donut input:** `GROUP BY centre, count(*)` from `visa_master_bookings` (V1) or `visa_master_installs` if bookings dataset is < 10 rows (V1 cold-start fallback).
- **Color palette:** consistent with the OS_COLORS pattern in `DesktopDashboard.tsx` — reuse the same Tailwind palette to feel native.

**Row 2 — By attribution source** (NEW — answers "how do we attract paying users?")

- **Donut input:** `GROUP BY attribution_source, count(*)` from `visa_master_installs WHERE status='active'` for the selected window. NULL `attribution_source` values bucket into "Unknown (pre-1.2)".
- **Right-hand table:** top-5 attribution sources, each row showing: source label, activation count, captured £ total, conversion-to-booking %.
- **Why both count AND £:** lets you see e.g. "Reddit drives 40% of activations but only 20% of £, while TikTok drives 10% of activations but 30% of £" — which channel is worth the time investment.
- **Cold-start fallback:** if no install in the window has a non-NULL `attribution_source` (i.e. all rows are pre-migration-029 backfill), the donut shows an empty state with text "No attribution data yet — first answer expected after extension v1.2 ships".

**Row 3 — By browser / OS** (NEW, optional — tucked behind a "Show technical breakdown" toggle to avoid noise)

- **Donut input:** `GROUP BY browser_name, count(*)` from active installs.
- **Right-hand table:** browser × OS matrix.
- **Why a toggle:** this is operationally interesting (knowing 12% of paying users are on Edge means Edge regressions are commercial regressions) but not a daily glance metric. Hidden by default; one-click reveal.

---

## 10. Tables

### 10.1 Premium customers table

Columns:

| Column | Source | Notes |
|---|---|---|
| When | `installs.created_at` | Relative time ("2d ago") + absolute ("16 May") — same pattern as Transactions table |
| Status | `installs.status` | Badge: `active` (green) / `disputed` (red) / `cancelled` (gray) / `deleted` (gray); plus a special `orphan` (red) for installs that have a Stripe Setup Intent succeeded but no matching active install row |
| Customer | `installs.stripe_email` | Masked by default (`app***@example.com`); click to reveal (logs an audit event) |
| **Install ID** | `installs.install_id` | **Full UUID** shown (`00000000-0000-4000-8000-000000000001`), monospace 11px text-xs. Click-to-copy on the row. Per operator request 2026-05-18. |
| **Version** | `installs.extension_version` | E.g. `1.1.0`. Cell colored amber-50 if version is more than 2 minor revs behind latest; gray for current. NULL shows "—" (pre-migration backfill). |
| **Browser** | `installs.browser_name` + `browser_version` (compact) | E.g. `Chrome 130`, `Edge 130`, `Brave 1.71`. Lucide icon for the browser if recognized. NULL shows "—". |
| **Source** | `installs.attribution_source` | E.g. `Reddit`, `Friend`, `CWS organic`. NULL shows "—" (user skipped or pre-migration). Hover for `attribution_detail` if present. |
| Bookings | derived: `count(bookings WHERE install_id = installs.install_id)` | Count + last booking timestamp |
| Captured | derived: `SUM(amount_pence WHERE install_id = ...)` | Total £ this customer has been charged |

Default sort: orphan status first (descending priority), then `created_at` desc.

**Column priority for narrow viewports:** When the table can't fit all 9 columns, hide in this order: Browser → Version → Source → Captured. When → Status → Customer → Install ID → Bookings are kept until viewport is impossibly narrow. (The new metadata columns are valuable but not the primary view.)

### 10.2 Bookings table

Columns:

| Column | Source | Notes |
|---|---|---|
| When | `bookings.created_at` | Relative + absolute |
| Status | `bookings.status` | Badge: `captured` / `refunded` / `failed` |
| Customer | join to `installs.stripe_email` | Masked |
| Centre | `bookings.centre` | Raw string in V1; resolved to "London Manchester Manor House" via TLS catalogue in V2 |
| Slot date | `bookings.slot_at` | Absolute date |
| Amount | `bookings.amount_pence / 100` | £19.00 |
| Refund window | computed from `refund_until` | Shows "8h left" if active, "Refunded" if status=refunded, "Closed" if expired |

Default sort: `created_at` desc.

Both tables paginate at 20 rows with a "Load more" button (same UX as TransactionsDashboard.tsx).

---

## 11. Filters & Time Windows

Single time-window selector at page top, same component as Revenue page: `7d / 30d / 90d / 1y`. Default `30d` (matches Revenue default). State persists in URL search param `?period=30d` so it's bookmarkable.

KPI cards and the activations chart respect the selected window. Tables show all-time rows but filtered by the window — i.e. the table column header shows "Premium customers (last 30d)" when window=30d.

Additional filters considered but **deferred to V2**: centre filter, country filter, status filter, search-by-email.

---

## 12. API Endpoints

### 12.1 New endpoint: `GET /api/admin/ops/visa-master`

Single endpoint, returns the full dashboard payload. Modeled on `/api/admin/ops/stats` (the Desktop section's source).

**Query params:** `period=7d|30d|90d|1y` (default `30d`).

**Auth:** existing admin magic-link session cookie (same middleware as `/admin/ops/*` pages).

**Response shape:**

```ts
{
  period: { days: number; since: string };
  kpis: {
    cwsInstalls: { value: string; rawNumber: number | null; updatedAt: string };
    premiumActivations: { value: number; deltaVsPrev: number };
    bookingCaptures: { value: number; deltaVsPrev: number };
    capturedPounds: { value: number; deltaVsPrev: number };
    refundedPounds: { value: number; deltaVsPrev: number };
    orphanSetupIntents: { value: number };
  };
  dailyActivations: { date: string; activations: number; captures: number }[];
  byCentre: { centre: string; count: number; pounds: number }[];
  premiumCustomers: {
    installId: string;            // full UUID
    stripeEmail: string;          // server returns RAW; client masks for display, reveals on demand
    status: 'active' | 'disputed' | 'cancelled' | 'deleted' | 'orphan';
    createdAt: string;
    extensionVersion: string | null;     // e.g. "1.1.0"  (NULL = pre-migration backfill)
    browserName: string | null;          // e.g. "Google Chrome", "Microsoft Edge", "Brave"
    browserVersion: string | null;       // e.g. "130"
    os: string | null;                   // e.g. "macOS", "Windows", "Linux"
    attributionSource: string | null;    // e.g. "reddit", "tiktok", "friend", "cws_organic", "other"
    attributionDetail: string | null;    // free text for "other" (max 200 chars)
    bookingCount: number;
    capturedPounds: number;
    lastBookingAt: string | null;
  }[];
  byAttribution: { source: string; count: number; capturedPounds: number; bookingConversionPct: number }[];
  byBrowser: { browser: string; count: number }[];   // for the toggle-able technical breakdown
  bookings: {
    bookingId: string;
    installId: string;
    stripeEmail: string;
    centre: string;
    slotAt: string;
    amountPounds: number;
    status: 'captured' | 'refunded' | 'failed';
    refundUntil: string | null;
    createdAt: string;
  }[];
}
```

### 12.2 Caching

- Stripe lookups (orphan Setup Intent detection + CWS install scrape) are cached server-side for 60s using Next.js `unstable_cache`.
- Supabase queries are NOT cached (they're cheap and need to reflect real-time activation/refund state).

### 12.3 Failure modes

- If Stripe API is unreachable: orphan card shows "—" with a tooltip explaining the source is down. Rest of page still renders.
- If CWS scrape fails: CWS Installs card shows "—" with a "scrape failed, last good value: 1,200+ at 14:00 UTC" subtext.
- If Supabase is unreachable: page renders a blocking error banner with retry button (same pattern as `<AlertBanner>` in `components/admin/AlertBanner.tsx`).

---

## 13. Privacy, PII Handling, & Trust Boundary

### 13.1 Hard rules

1. **No Free-tier user is identifiable in this dashboard.** Even if we later add Mixpanel/PostHog to Free, we will not surface per-user metrics here.
2. **Stripe email is masked by default.** The mask format is `<first 3 chars>***@<domain>` (e.g. `app***@example.com`). Clicking to reveal logs an audit event with the operator's session ID and the install_id revealed.
3. **TLS credentials, polling cadence, DOM contents, Telegram tokens** — never appear in API responses, never appear in dashboard UI, never appear in logs. This is enforced by the data model: these fields don't exist in any table or any API response from `/api/visa-master/*`.
4. **Install ID is shown** because it's a random UUID with no embedded personal information. Showing it lets the operator correlate with Stripe.

### 13.2 Audit trail

Reveal-PII clicks write a row to `visa_master_admin_audit` (new table — migration `028_visa_master_admin_audit.sql`):

```sql
CREATE TABLE visa_master_admin_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_session_id text NOT NULL,
  action text NOT NULL,         -- 'reveal_email', 'view_install_detail', etc.
  target_install_id uuid,
  target_booking_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

The audit table is read-only from the dashboard and queryable from Supabase admin only.

---

## 14. Non-Functional Requirements

| Aspect | Target |
|---|---|
| TTFB | ≤500ms p95 |
| Full page render | ≤1.5s p95 |
| API endpoint latency | ≤300ms p95 for the cached path; ≤1.5s p95 for the Stripe-roundtrip path |
| Concurrent operators | 1 (single-operator product). Cache layer is per-process, no Redis needed. |
| Browser support | Same as the rest of `/admin/ops/*` — Chrome ≥ 110, Safari ≥ 16, Firefox ≥ 110 |
| Mobile | Functional but not optimized — operator uses desktop primarily |
| Dark mode | Supported (same as rest of `/admin/ops/*`) |
| Empty state | Each chart, donut, and table has a designed empty state (see [wireframes §6](./18-ops-dashboard-wireframes.md)) |

---

## 15. Open Decisions Surfaced for Review

These are the three calls I made on the operator's behalf. Each can be reversed cheaply if the operator prefers the alternative.

### Decision D1 — Show Chrome Web Store install count

**Choice made:** YES, surface CWS install count as the top-left KPI, labeled `📊 ~24h delayed, public stat`.

**Why:** answers the operator's "how many people have it?" question with a real number rather than a non-answer. The label and bucketed display ("1,200+") make the approximation honest.

**Alternative:** show only Premium activations and put a callout saying "Free installs are anonymous by design, see CWS dashboard for total reach." Cleaner privacy story; weaker at-a-glance answer.

### Decision D2 — Single scrollable page vs tabbed sub-pages

**Choice made:** Single scrollable Tier-1 page in V1. No children under `/schengen-visa`.

**Why:** matches the operator's request ("Tier-1 of Schengen item"). Defers the nav-design question until the data justifies more pages. Cheaper to refactor a single page into tabs than to retrofit a navigation pattern.

**Alternative:** ship with children from day 1 — `/installations`, `/premium`, `/bookings`. More work; benefits don't compound until volume justifies separate views.

### Decision D3 — Mask Stripe emails by default, click to reveal with audit

**Choice made:** Default-mask, click to reveal, log the reveal.

**Why:** even single-operator dashboards leak through screenshots, screen-shares, and accidental over-the-shoulder views. Operator already knows their own customers' emails from Stripe; the dashboard's job is not to make PII more spreadable.

**Alternative A:** show emails unmasked (current Desktop section behavior). Trade-off: faster at-a-glance customer lookup; more PII exposure.
**Alternative B:** never reveal emails in the dashboard; force lookup in Stripe. Trade-off: maximum privacy; broken workflow when operator needs to email a customer about a stuck booking.

### Decision D4 — Where to ask "How did you hear about us?" (attribution capture)

**Choice made:** On the **Premium intro page** (`extension/src/premium/PremiumLandingPage.tsx`), one optional dropdown shown ONCE after the user clicks "Activate Premium" but before redirecting to Stripe Checkout.

**Why:** highest signal-to-noise. Buyers are the cohort we care about for ROAS analysis ("which channel pays back the £19 per booking economics"). Asking earlier (e.g. on the welcome page) captures more answers but most come from users who never go Premium — which is information about CAC, not ROAS. Given that we monetize on conversion not reach, ROAS is the more decision-useful signal.

**Side benefit:** the answer is captured BEFORE the Stripe Checkout redirect, so if the user abandons Stripe we still know their source. That's high-intent abandonment data we'd otherwise miss.

**Alternative A — Welcome page:** asks every install (free + paying). Pros: enables CAC math (cost per install per channel). Cons: ~70% of users answer "Skip"; signal-to-noise is poor; first-run users are trying to get to slot detection, not answer surveys.

**Alternative B — Both Welcome AND Premium intro:** maximum data. Cons: redundant for users who pay (we'd ask twice); welcome-page low-quality answers contaminate the dataset.

**Alternative C — Post-booking thank-you page:** ask AFTER the first £19 capture. Highest signal but tiny sample (only users who actually book). Useful for retrospective channel attribution but unusable for next-week's "where should I spend my marketing time?" call.

### Decision D5 — Show full install_id UUID vs truncated

**Choice made:** Full UUID (`00000000-0000-4000-8000-000000000001`) in monospace 11px text-xs, click-to-copy. Per operator request 2026-05-18.

**Why:** the operator's support workflow involves correlating the popup-side `installId` with the Stripe-side metadata (which carries the full UUID). Truncation forces a copy-from-Stripe-paste-to-search round trip. Showing the full UUID at small font costs ~280px of column width but saves multiple seconds per incident.

**Trade-off accepted:** the Premium customers table is now ~9 columns wide and will need horizontal scroll on viewports < 1280px. The column priority rules in §10.1 mitigate this.

---

## 16. Roadmap — V1 → V2 → V3

### V1 (this PRD — ~6–7 days of focused work, +1–2d vs initial estimate after the metadata + attribution scope was added)

**Backend / dashboard (torlyAI repo, ~5d):**
- Migration `028_visa_master_admin_audit.sql` (audit log)
- Migration `029_visa_master_install_metadata.sql` (version, browser, OS, attribution columns)
- Sidebar item (`OpsSidebar.tsx`, 1-line + icon import)
- `GET /api/admin/ops/visa-master` endpoint (KPIs, chart data, distributions, tables)
- `POST /api/admin/ops/visa-master/audit` endpoint (PII-reveal logging)
- `VisaMasterDashboard.tsx` page component
- KPI cards, activations chart, country + attribution donuts, both tables (with full install_id, version, browser, source columns)
- Orphan Setup Intent detection

**Extension (Schengen-visa repo, ~1.5d):**
- Service worker: collect `extension_version`, `browser_name`, `browser_version`, `os` and include in `/license/activate` and `/license/status` payloads (`backend-client.ts`)
- Premium intro page: add "How did you hear about us?" optional dropdown before Stripe redirect (`PremiumLandingPage.tsx`)
- Welcome i18n: update Premium-tier disclosure list to mention new fields collected (`extension/src/i18n/`)
- Bump extension version to `1.2.0` to mark the data-collection change boundary
- Backend client + Activate route accept and forward the new fields

**Backend contract update (torlyAI repo):**
- `/api/visa-master/license/activate` body schema gains `extensionVersion`, `browserName`, `browserVersion`, `os`, `attributionSource`, `attributionDetail` (all optional for backward compat)
- `/api/visa-master/license/status` accepts the same in a POST variant (or piggybacks on the existing GET via headers — TBD in implementation; lower-risk via POST)
- Cross-repo coordination per CLAUDE.md "Backend contract with torly.ai" section

### V2 (next quarter — additive)

- Sub-pages under `/schengen-visa` with the children navigation pattern (matches `Revenue ▼` and `Users ▼` in existing sidebar):
  - `/installations` — full Premium customer table with filters
  - `/bookings` — full booking table with filters
  - `/funnel` — explicit funnel visualization (CWS install → Premium activate → Card-save success → Booking attempt → Booking capture → Refund)
- Row-click detail pages (`/installations/[installId]`, `/bookings/[bookingId]`)
- Centre catalogue lookup (raw `bookings.centre` resolved to human-readable "London Manor House (UK)")
- Filter UI: status, centre, country, email search

### V3 (when 90+ days of history exists)

- Cohort retention curves (activate → first booking, by week)
- Weekly bucketing on the activations chart
- Investor-mode view (anonymous aggregates only, no PII, filtered access)
- Slack/email alerts on orphan Setup Intent count > 0

---

## 17. Appendix A — Sidebar Insertion Diff

The minimum-viable nav change is one line in `components/admin/OpsSidebar.tsx`, inserting after the Desktop entry (line 73):

```diff
  { label: 'Desktop', href: '/admin/ops/desktop', icon: Monitor },
+ { label: 'Schengen Visa', href: '/admin/ops/schengen-visa', icon: Plane },
  {
    label: 'Campaigns', href: '/admin/ops/campaigns', icon: Megaphone,
    children: [
```

…plus adding `Plane` to the `lucide-react` import block at the top of the file.

The icon choice (`Plane`) was selected as the most universal Schengen-visa metaphor in lucide's library. Alternatives considered: `Stamp` (passport stamp — too small at 16px), `Globe` (already overloaded with "international"), `MapPin` (means "location" too broadly), `Ticket` (means "event ticket" more than "visa"). `Plane` is consistent with the product's travel-adjacent positioning.
