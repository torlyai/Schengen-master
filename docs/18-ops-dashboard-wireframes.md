# Wireframes: Visa Master — Schengen Visa Ops Dashboard

**Document:** 18-ops-dashboard-wireframes.md
**Version:** 1.0
**Date:** 2026-05-18
**Status:** Hi-fi-ready handoff
**Companion to:** [`17-ops-dashboard-prd.md`](./17-ops-dashboard-prd.md)
**Implementation target:** `torlyAI/app/admin/ops/schengen-visa/page.tsx` + `torlyAI/components/admin/VisaMasterDashboard.tsx`
**Design system:** Matches existing `/admin/ops/*` (Tailwind, lucide-react icons, recharts), no new patterns introduced.

---

## 0. Purpose

This file is the **single source of truth** for every screen, state, and pixel-level interaction in the new Schengen Visa Ops dashboard section. It is intended to be imported into Claude design / Figma for hi-fi mockup generation. Every wireframe deliberately:

- Embeds the new pane in the existing `/admin/ops/*` shell (`OpsSidebar` + `OpsHeader` + `main p-6`), not an idealized layout.
- Reuses components already present in `components/admin/` (`KpiCard`, `AlertBanner`, the recharts wrappers from `DesktopDashboard.tsx`).
- Marks each new component the implementer must produce with `[NEW]`.
- Avoids introducing UI patterns the dashboard doesn't already use (no new modal stack, no new tab strips, no new icon family).

If a wireframe in this file contradicts a sentence in [`17-ops-dashboard-prd.md`](./17-ops-dashboard-prd.md), **this file wins** for layout questions; the PRD wins for scope questions.

---

## Table of Contents

1. [Sidebar — before / after diff](#1-sidebar--before--after-diff)
2. [Shell anatomy](#2-shell-anatomy)
3. [Tier-1 landing page — full layout](#3-tier-1-landing-page--full-layout)
4. [Page header + time-window selector](#4-page-header--time-window-selector)
5. [KPI strip — 6 cards](#5-kpi-strip--6-cards)
6. [Activations + Captures area chart](#6-activations--captures-area-chart)
7. [Country distribution block (donut + top-5 table)](#7-country-distribution-block-donut--top-5-table)
8. [Premium customers table](#8-premium-customers-table)
9. [Bookings table](#9-bookings-table)
10. [Empty states](#10-empty-states)
11. [Loading states](#11-loading-states)
12. [Error states](#12-error-states)
13. [Interaction details](#13-interaction-details)
14. [Component inventory](#14-component-inventory)

---

## 1. Sidebar — before / after diff

### Before

```
┌─────────────────────┐
│ TorlyAI  Ops        │
├─────────────────────┤
│ ⊞  Overview         │
│ £  Revenue       ▼  │
│    ● Subscriptions  │
│    ● Transactions   │
│ 👥 Users         ▶  │
│ ✉  Emails        ▶  │
│ 💻 Desktop          │  ← Innovator Founder
│ 📢 Campaigns     ▶  │
│ ─────────────────── │
│ 🤖 Agent Log        │
│ 🔌 MCP Integration  │
└─────────────────────┘
```

### After (this PRD adds line marked with 🆕)

```
┌─────────────────────┐
│ TorlyAI  Ops        │
├─────────────────────┤
│ ⊞  Overview         │
│ £  Revenue       ▼  │
│    ● Subscriptions  │
│    ● Transactions   │
│ 👥 Users         ▶  │
│ ✉  Emails        ▶  │
│ 💻 Desktop          │  ← Innovator Founder
│ ✈  Schengen Visa  🆕│  ← Visa Master (this PRD)
│ 📢 Campaigns     ▶  │
│ ─────────────────── │
│ 🤖 Agent Log        │
│ 🔌 MCP Integration  │
└─────────────────────┘
```

The active-state styling matches existing items: amber-50 background, amber-700 text, 3px amber-500 left border, indented +2px so the text aligns with non-active items (per `OpsSidebar.tsx:289`).

### Collapsed sidebar variant

When collapsed (`w-16`), the entry shrinks to icon-only with a hover tooltip "Schengen Visa". Same pattern as existing `Desktop` and `Overview` items.

```
┌───┐
│ T │
├───┤
│ ⊞ │
│ £ │
│ 👥│
│ ✉ │
│ 💻│
│ ✈ │  ← hover shows tooltip "Schengen Visa"
│ 📢│
│ ──│
│ 🤖│
│ 🔌│
└───┘
```

---

## 2. Shell anatomy

The page lives inside the existing `OpsLayout` shell (`app/admin/ops/layout.tsx`), so the chrome is fixed:

```
┌───────────────────────────────────────────────────────────────────────┐
│ ┌─────────┐ ┌───────────────────────────────────────────────────────┐ │
│ │         │ │ OpsHeader (breadcrumbs + admin email + sign out)     │ │
│ │ OpsSide │ ├───────────────────────────────────────────────────────┤ │
│ │  bar    │ │                                                       │ │
│ │ (w-60)  │ │  <main className="flex-1 p-6">                        │ │
│ │         │ │     [VisaMasterDashboard renders here]                │ │
│ │ Schengen│ │  </main>                                              │ │
│ │ Visa ◄  │ │                                                       │ │
│ │ ACTIVE  │ │                                                       │ │
│ │         │ │                                                       │ │
│ └─────────┘ └───────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────┘
```

No new shell elements. The page component is the contents of `<main>` only.

---

## 3. Tier-1 landing page — full layout

Full page, scrollable, single column for sections (some sections have a two-column inner grid).

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ Schengen Visa  /  Overview                          [ 7d ] [ 30d ▣ ] [ 90d ] [ 1y ] │
│                                                                               │
│ Visa Master · Free-tier reach + Premium funnel                                │
│ Last refreshed 14:52 UTC · auto-refresh every 60s                             │
│                                                                               │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                           │
│  │ CWS INSTALLS │ │ PREMIUM      │ │ BOOKING      │                           │
│  │              │ │ ACTIVATIONS  │ │ CAPTURES     │                           │
│  │  1,200+      │ │  47          │ │  6           │                           │
│  │  📊 ~24h     │ │  ↑ 9 vs prev │ │  ↑ 2 vs prev │                           │
│  └──────────────┘ └──────────────┘ └──────────────┘                           │
│                                                                               │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                           │
│  │ CAPTURED £   │ │ REFUNDED £   │ │ ⚠ ORPHAN     │                           │
│  │              │ │              │ │   SETUP INTS │                           │
│  │  £114.00     │ │  £19.00      │ │  0           │                           │
│  │  ↑ £38 vs    │ │  1 refund    │ │  (good)      │                           │
│  └──────────────┘ └──────────────┘ └──────────────┘                           │
│                                                                               │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ACTIVATIONS + CAPTURES — last 30 days                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │  8 ┤                                                          ╱╲        │  │
│  │  6 ┤                                                ╱╲       ╱  ╲       │  │
│  │  4 ┤                                ╱╲   ╱╲  ╱╲   ╱  ╲      ╱    ╲      │  │
│  │  2 ┤                          ╱╲  ╱  ╲ ╱  ╲╱  ╲ ╱    ╲   ╱╲╱      ╲     │  │
│  │  0 ┤_______________________╱___╲╱____╳____╳____╲╱______╲╱____________╲  │  │
│  │     19  21   23   25   27   29   1    3    5    7    9   11   13   15  │  │
│  │     Apr                       May                                       │  │
│  │  ─── Premium activations  ─── Booking captures (£19 each)               │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────┐  ┌────────────────────────────────────┐  │
│  │ BOOKINGS BY CENTRE              │  │ TOP CENTRES (last 30d)             │  │
│  │                                 │  │                                    │  │
│  │      ╱─────╲                    │  │ London Manor House       3   £57   │  │
│  │     │  ╲    │                   │  │ Manchester               1   £19   │  │
│  │     │   ╲   │                   │  │ Edinburgh                1   £19   │  │
│  │      ╲___╳__╱                   │  │ Birmingham               1   £19   │  │
│  │                                 │  │ —                        0    —    │  │
│  │  ▣ London  ▣ Manchester         │  │                                    │  │
│  │  ▣ Edinburgh  ▣ Birmingham      │  │ → see all centres (V2)             │  │
│  └─────────────────────────────────┘  └────────────────────────────────────┘  │
│                                                                               │
│  ┌─────────────────────────────────┐  ┌────────────────────────────────────┐  │
│  │ HOW DID THEY HEAR ABOUT US?     │  │ TOP ATTRIBUTION SOURCES (last 30d) │  │
│  │ (paying users only)             │  │                                    │  │
│  │      ╱─────╲                    │  │ SOURCE       ACT.  £     CONV→BOOK │  │
│  │     │ Reddit│                   │  │ Reddit        12   £19    8%       │  │
│  │     │   ╲   │                   │  │ Friend         8   £38   25%       │  │
│  │      ╲ Frnd_╱                   │  │ TikTok         5    £0    0%       │  │
│  │       ╲ TT ╱                    │  │ CWS organic    4   £19   25%       │  │
│  │        ╲__╱  ▣ Unknown 18       │  │ Unknown       18    £0    0%       │  │
│  │  ▣ Reddit ▣ Friend ▣ TikTok    │  │  (pre-1.2 backfill)                │  │
│  │  ▣ CWS organic ▣ Unknown        │  │                                    │  │
│  └─────────────────────────────────┘  └────────────────────────────────────┘  │
│                                                                               │
│  ┌─ Show technical breakdown ▶ ─────────────────────────────────────────────┐ │
│  │ (collapsed by default — operator clicks to reveal browser × OS donut)   │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  PREMIUM CUSTOMERS — last 30d                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ WHEN    │ STATUS    │ CUSTOMER          │ INSTALL ID                              │ VER   │ BROWSER    │ SOURCE  │ BK │ £   │  │
│  ├─────────┼───────────┼───────────────────┼─────────────────────────────────────────┼───────┼────────────┼─────────┼────┼─────┤  │
│  │ 2h ago  │ [active]  │ app***@example.com │ 00000000-0000-4000-8000-000000000001 📋│ 1.2.0 │ Chrome 130 │ Reddit  │ 0  │ £0  │  │
│  │ 18 May  │           │ 👁                │                                         │       │ 🌐 macOS   │ → r/SVI │    │     │  │
│  ├─────────┼───────────┼───────────────────┼─────────────────────────────────────────┼───────┼────────────┼─────────┼────┼─────┤  │
│  │ 3d ago  │ [active]  │ usr1***@example.com│ 00000000-0000-4000-8000-000000000003 📋│ 1.2.0 │ Edge 130   │ Friend  │ 1  │ £19 │  │
│  │ 15 May  │           │                   │                                         │       │ 🪟 Windows │         │ 2d │     │  │
│  ├─────────┼───────────┼───────────────────┼─────────────────────────────────────────┼───────┼────────────┼─────────┼────┼─────┤  │
│  │ 4d ago  │ [active]  │ usr2***@example.com  │ 3ff2342d-aabb-ccdd-eeff-001122334455 📋│ 1.1.0 │ Chrome 129 │ TikTok  │ 2  │ £38 │  │
│  │ 14 May  │           │                   │                                         │  ⚠   │ 🍎 macOS   │         │ 1d │     │  │
│  ├─────────┼───────────┼───────────────────┼─────────────────────────────────────────┼───────┼────────────┼─────────┼────┼─────┤  │
│  │ 5d ago  │ [disputed]│ usr3***@example.com  │ 00000000-0000-4000-8000-000000000004 📋│ 1.1.0 │ Chrome 130 │ —       │ 1  │ £0  │  │
│  │ 13 May  │  ⚠        │                   │                                         │  ⚠   │ 🌐 Linux   │         │ ref│     │  │
│  ├─────────┼───────────┼───────────────────┼─────────────────────────────────────────┼───────┼────────────┼─────────┼────┼─────┤  │
│  │ 10d ago │ [orphan]  │ app***@example.com │ 00000000-0000-4000-8000-000000000001 📋│ —     │ —          │ —       │ 0  │ £0  │  │
│  │ 8 May   │  ⚠ RED    │ 👁                │                                         │       │            │         │ Rec│     │  │
│  └──────────────────────────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                          [ Load 20 more ]                          │
│                                                                               │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  BOOKINGS — last 30d                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │ WHEN    │ STATUS    │ CUSTOMER          │ CENTRE     │ SLOT  │ £   │ ⟳   │  │
│  ├─────────┼───────────┼───────────────────┼────────────┼───────┼─────┼─────┤  │
│  │ 2d ago  │ [captured]│ usr1***@example.com│ London MH  │ 22 May│ £19 │ 16h │  │
│  │ 15 May  │           │                   │            │ 09:40 │     │ left│  │
│  ├─────────┼───────────┼───────────────────┼────────────┼───────┼─────┼─────┤  │
│  │ 3d ago  │ [captured]│ usr2***@example.com  │ Manchester │ 25 May│ £19 │Closed│  │
│  │ 14 May  │           │                   │            │ 14:00 │     │     │  │
│  ├─────────┼───────────┼───────────────────┼────────────┼───────┼─────┼─────┤  │
│  │ 5d ago  │ [refunded]│ usr3***@example.com  │ Edinburgh  │ 28 May│ £19 │Refunded│  │
│  │ 12 May  │           │                   │            │ 11:30 │     │ ✓   │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                                  [ Load 20 more ]             │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Page header + time-window selector

```
Schengen Visa  /  Overview                          [ 7d ] [ 30d ▣ ] [ 90d ] [ 1y ]
                                                            ▲
                                                            └ selected (dark bg, white text)

Visa Master · Free-tier reach + Premium funnel
Last refreshed 14:52 UTC · auto-refresh every 60s
                                                            ┌────────────┐
                                                            │ Refresh ⟳  │  (top-right
                                                            └────────────┘   action)
```

- Breadcrumb text matches the existing Revenue → Transactions pattern.
- Subtitle: 14px gray, single line, includes auto-refresh timer.
- Time-window pills: reuse the exact `<TimeWindowPills>` from `RevenueDashboard.tsx`. Same focus-ring, same dark/light state.

---

## 5. KPI strip — 6 cards

Grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`.

Each card uses the existing `<KpiCard>` component. Per-card spec:

### Card 1 — CWS Installs

```
┌─────────────────────────┐
│ CWS INSTALLS            │ ← label, uppercase, 11px, gray-500
│                         │
│   1,200+                │ ← value, 32px bold, gray-900
│                         │
│ 📊 Chrome Web Store     │ ← subtext, 12px, gray-500
│    ~24h delayed         │
└─────────────────────────┘
```

- No delta (CWS doesn't expose history).
- The `📊` emoji icon distinguishes approximate-source cards.

### Card 2 — Premium activations

```
┌─────────────────────────┐
│ PREMIUM ACTIVATIONS     │
│                         │
│   47                    │
│                         │
│ ↑ 9 vs prev 30d         │ ← delta, green if +, red if -
│ Card saved, not charged │
└─────────────────────────┘
```

### Card 3 — Booking captures

```
┌─────────────────────────┐
│ BOOKING CAPTURES        │
│                         │
│   6                     │
│                         │
│ ↑ 2 vs prev 30d         │
│ £19 each on success     │
└─────────────────────────┘
```

### Card 4 — Captured £

```
┌─────────────────────────┐
│ CAPTURED £              │
│                         │
│   £114.00               │
│                         │
│ ↑ £38 vs prev 30d       │
│ Net of refunds          │
└─────────────────────────┘
```

### Card 5 — Refunded £

```
┌─────────────────────────┐
│ REFUNDED £              │
│                         │
│   £19.00                │
│                         │
│ 1 refund this period    │
│ 24h window post-capture │
└─────────────────────────┘
```

### Card 6 — Orphan Setup Intents (CRITICAL)

Two visual states:

**Healthy (count = 0)** — gray treatment:
```
┌─────────────────────────┐
│ ⚠ ORPHAN SETUP INTENTS  │
│                         │
│   0                     │
│                         │
│ All Stripe payments     │
│ matched in DB ✓ (good)  │
└─────────────────────────┘
```

**Alert (count ≥ 1)** — red treatment (border-red-300, bg-red-50, text-red-700):
```
┌─────────────────────────┐
│ ⚠ ORPHAN SETUP INTENTS  │ ← red
│                         │
│   2                     │ ← red, bold
│                         │
│ Stripe succeeded but    │
│ no DB row. INVESTIGATE. │ ← red
│ [ View list → ]         │ ← red link
└─────────────────────────┘
```

The "View list →" link opens an inline accordion below the KPI strip showing the orphan Setup Intent IDs and the corresponding recovery URL pattern (`/visa-master/activated?setup_intent=<id>&install=<id>`). This is the exact mechanism that recovered install `b7ad8db5…` on 2026-05-18.

---

## 6. Activations + Captures area chart

Reuses the existing recharts `AreaChart` setup from `DesktopDashboard.tsx`. Two stacked series:

```
                                                                           ┌──────────────────┐
ACTIVATIONS + CAPTURES — last 30 days                                      │ ● Activations    │
                                                                           │ ● Captures (£19) │
┌─────────────────────────────────────────────────────────────────────────┐│                  │
│  8 ┤                                                          ╱╲        ││                  │
│    │                                                         ╱  ╲       │└──────────────────┘
│  6 ┤                                                ╱╲      ╱    ╲       │  ← legend, top-right
│    │                                               ╱  ╲    ╱      ╲      │
│  4 ┤                                ╱╲    ╱╲     ╱    ╲  ╱        ╲     │
│    │                              ╱  ╲  ╱  ╲   ╱      ╲╱          ╲    │
│  2 ┤                            ╱    ╲╱    ╲ ╱                     ╲   │
│    │                  ╱╲      ╱                                      ╲  │
│  0 ┤________________╱__╲____╱_______________________________________╲ │
│     19  21   23   25   27   29   1    3    5    7    9   11   13   15  │
│     Apr                                May                              │
└─────────────────────────────────────────────────────────────────────────┘
```

- **Activation series:** amber-500 stroke, amber-500/20 fill.
- **Capture series:** green-500 stroke, green-500/20 fill.
- **Tooltip on hover:** date label, "Activations: N", "Captures: N", "Net £: £NN".
- **Empty state for the chart:** see §10.2.

---

## 7. Distribution donuts — three themes, two rows + optional toggle

Three donut+table blocks stacked vertically. The first two (Centre, Attribution) are always visible; the third (Browser × OS) is behind a `Show technical breakdown ▶` toggle to keep the daily-glance signal clean.

### 7.1 Row 1 — Bookings by Centre

Two-column grid: donut left (50%), table right (50%). Stacks to single column < md.

```
┌───────────────────────────────────┐  ┌───────────────────────────────────────┐
│ BOOKINGS BY CENTRE                │  │ TOP CENTRES (last 30d)                │
│                                   │  │                                       │
│            ╱──────╲               │  │ London Manor House          3    £57  │
│          ╱  blue   ╲              │  │ Manchester                  1    £19  │
│         │  (London) │             │  │ Edinburgh                   1    £19  │
│          ╲          ╱             │  │ Birmingham                  1    £19  │
│           ╲────────╱              │  │                                       │
│           ╱       ╲               │  │ → 4 centres total                     │
│          ╱ purple  ╲              │  │ → see all (V2)                        │
│         │ (Manchstr)│             │  │                                       │
│          ╲          ╱             │  │                                       │
│           ╲________╱              │  │                                       │
│                                   │  │                                       │
│ ▣ London  ▣ Manchester            │  │                                       │
│ ▣ Edinburgh  ▣ Birmingham         │  │                                       │
└───────────────────────────────────┘  └───────────────────────────────────────┘
```

- Donut palette reuses `OS_COLORS` from `DesktopDashboard.tsx` for consistency.
- The "→ see all centres (V2)" link is intentionally disabled in V1 with a tooltip "Coming in V2".

### 7.2 Row 2 — Attribution: How did paying users hear about us? (NEW)

```
┌───────────────────────────────────┐  ┌───────────────────────────────────────┐
│ HOW DID THEY HEAR ABOUT US?       │  │ TOP ATTRIBUTION SOURCES (last 30d)    │
│ Paying users only                 │  │                                       │
│            ╱──────╲               │  │ SOURCE      ACT.  £     CONV→BOOK     │
│          ╱  orange ╲              │  │ Reddit       12   £19    8%           │
│         │  (Reddit) │             │  │ Friend        8   £38   25% 🟢        │
│          ╲          ╱             │  │ TikTok        5    £0    0%           │
│           ╲────────╱              │  │ YouTube       3   £19   33% 🟢        │
│           ╱       ╲               │  │ CWS organic   4   £19   25%           │
│          ╱  green  ╲              │  │ Other         2    £0    0%           │
│         │ (Friend)  │             │  │ Unknown      18    £0    0%           │
│          ╲          ╱             │  │  (pre-1.2 backfill)                   │
│           ╲________╱              │  │                                       │
│                                   │  │ → 7 sources total                     │
│ ▣ Reddit ▣ Friend ▣ TikTok       │  │                                       │
│ ▣ YouTube ▣ CWS ▣ Unknown        │  │                                       │
└───────────────────────────────────┘  └───────────────────────────────────────┘
```

- **Empty state** (no rows have non-NULL `attribution_source` yet): shows "No attribution data yet. First answers expected after extension v1.2 ships and the first Premium user activates."
- **Conversion-to-booking column** turns 🟢 green if ≥ 20%, 🟡 amber if 5–19%, 🔴 red if 0% (with ≥3 activations).
- **Source labels** are rendered from a fixed lookup (`reddit` → `Reddit`, `cws_organic` → `CWS organic`, `friend` → `Friend`, etc.); raw values from "Other" free text are NOT shown in the donut to keep cardinality bounded.

### 7.3 Row 3 — Browser × OS (collapsed by default)

Header bar:

```
┌─ Show technical breakdown ▶ ─────────────────────────────────────────────┐
│ Browser, OS, and extension version distribution                         │
└──────────────────────────────────────────────────────────────────────────┘
```

When expanded:

```
┌───────────────────────────────────┐  ┌───────────────────────────────────────┐
│ BROWSER (paying users)            │  │ OS × BROWSER MATRIX                   │
│            ╱──────╲               │  │                                       │
│          ╱  blue   ╲              │  │           Chrome  Edge  Brave  Other  │
│         │  (Chrome) │             │  │  macOS      18      2     1      0    │
│          ╲          ╱             │  │  Windows    12      4     0      1    │
│           ╲ purple ╱              │  │  Linux       3      0     1      0    │
│            ╲(Edge)╱               │  │                                       │
│             ╲____╱                │  │                                       │
│                                   │  │ → 42 paying users total               │
│ ▣ Chrome 33  ▣ Edge 6             │  │                                       │
│ ▣ Brave 2  ▣ Other 1              │  │                                       │
└───────────────────────────────────┘  └───────────────────────────────────────┘
```

Extension version distribution shown below the matrix as a simple bar list:

```
EXTENSION VERSION
1.2.0  ████████████████████████  36 (86%)
1.1.0  █████                      6 (14%)  ⚠ 2 minor revs behind
1.0.9  —                          0
```

---

## 8. Premium customers table

```
PREMIUM CUSTOMERS — last 30d                                                                                       [ ↧ Sort: Newest ]

┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ WHEN    │ STATUS    │ CUSTOMER          │ INSTALL ID                              │ VER   │ BROWSER     │ SOURCE     │ BK │ £   │
├─────────┼───────────┼───────────────────┼─────────────────────────────────────────┼───────┼─────────────┼────────────┼────┼─────┤
│ 2h ago  │ [active]  │ app***@example.com │ 00000000-0000-4000-8000-000000000001 📋│ 1.2.0 │ 🌐 Chrome 130│ Reddit     │ 0  │ £0  │
│ 18 May  │           │ 👁                │  (monospace, 11px, click to copy)       │       │   macOS     │ → r/SVI    │    │     │
├─────────┼───────────┼───────────────────┼─────────────────────────────────────────┼───────┼─────────────┼────────────┼────┼─────┤
│ 3d ago  │ [active]  │ usr1***@example.com│ 00000000-0000-4000-8000-000000000003 📋│ 1.2.0 │ 🪟 Edge 130 │ Friend     │ 1  │ £19 │
│ 15 May  │           │ 👁                │                                         │       │   Windows   │            │ 2d │     │
├─────────┼───────────┼───────────────────┼─────────────────────────────────────────┼───────┼─────────────┼────────────┼────┼─────┤
│ 4d ago  │ [active]  │ usr2***@example.com  │ 3ff2342d-aabb-ccdd-eeff-001122334455 📋│ 1.1.0 │ 🍎 Chrome 129│ TikTok     │ 2  │ £38 │
│ 14 May  │           │ 👁                │                                         │ ⚠ old │   macOS     │            │ 1d │     │
├─────────┼───────────┼───────────────────┼─────────────────────────────────────────┼───────┼─────────────┼────────────┼────┼─────┤
│ 5d ago  │ [disputed]│ usr3***@example.com  │ 00000000-0000-4000-8000-000000000004 📋│ 1.1.0 │ 🐧 Chrome 130│ —          │ 1  │ £0  │
│ 13 May  │  ⚠        │ 👁                │                                         │ ⚠ old │   Linux     │  (skipped) │ ref│     │
├─────────┼───────────┼───────────────────┼─────────────────────────────────────────┼───────┼─────────────┼────────────┼────┼─────┤
│ 10d ago │ [orphan]  │ app***@example.com │ 00000000-0000-4000-8000-000000000001 📋│ —     │ —           │ —          │ 0  │ £0  │
│ 8 May   │  ⚠ RED    │ 👁                │                                         │       │             │            │ Rec│     │
└─────────┴───────────┴───────────────────┴─────────────────────────────────────────┴───────┴─────────────┴────────────┴────┴─────┘
                                                                                                                  [ Load 20 more ]
```

### Status badges

| Badge | Color | Meaning |
|---|---|---|
| `[active]` | green-700 on green-100 | Normal Premium user |
| `[disputed]` | red-700 on red-100 | Stripe webhook fired `charge.dispute.created` |
| `[cancelled]` | gray-600 on gray-100 | User-initiated or webhook-driven cancellation |
| `[deleted]` | gray-500 on gray-100 | `customer.deleted` webhook |
| `[orphan]` | white on red-600 | Stripe Setup Intent succeeded but no `active` install row |

### Email column — reveal interaction

- `👁` is a button right next to the masked email. Hover: `text-gray-400 → text-amber-600`.
- Click: replaces masked email with full email + writes audit row (per PRD §13.2). Button becomes `🔒`.
- Reveal state does NOT persist across page reloads (deliberately ephemeral).

### Install ID column — full UUID display

- **Full UUID shown** (`00000000-0000-4000-8000-000000000001`), monospace 11px (`font-mono text-xs`). 36 chars wide.
- The `📋` icon at the end is a click-to-copy button. Tooltip: `Copy install_id to clipboard`. After click: toast "Copied b7ad8db5…" for 2s.
- Cell is also click-to-copy on the whole text (clicking the UUID itself copies it).
- Not PII — random UUID with no embedded personal info — so no audit log for copy/reveal.

### Version column

- Cell color rules:
  - **Current version (matches latest manifest)**: gray-700 on default bg
  - **1 minor rev behind**: gray-700 on amber-50, no icon
  - **2+ minor revs behind**: gray-700 on amber-100, `⚠ old` icon
- `NULL` (pre-migration backfill, install activated before extension v1.2): renders as `—` with hover tooltip "Activated before metadata collection landed (pre-1.2.0)".

### Browser column

- Display: `[OS-icon] [Browser name] [Major version]`
- Icon mapping (lucide-react or emoji):
  - macOS → 🍎 (or `Apple` icon)
  - Windows → 🪟 (or `Microsoft` icon)
  - Linux → 🐧 (or generic computer icon)
  - Unknown → 🌐 (or `Globe`)
- Browser names recognized: `Chrome`, `Microsoft Edge`, `Brave`, `Opera`, `Vivaldi`, `Arc`. Any other Chromium brand → "Other Chromium".
- NULL: `—` with hover tooltip same as Version.

### Source (attribution) column

- Display: friendly label from a lookup table (`reddit` → `Reddit`, `cws_organic` → `CWS organic`, `friend` → `Friend`, etc.)
- For `other`: shows `Other` + an info icon; hover reveals `attribution_detail` free text (truncated to 60 chars).
- For an answer-text that maps to a recognized referrer (e.g. specific subreddit), the second line shows `→ r/SchengenVisaInfo` style breadcrumb in xs gray text.
- NULL or `skip`: shows `—` (gray-400) — these users either didn't answer or activated before v1.2.

### Orphan row Recover action

For rows with `[orphan]` status, the BK column shows `Rec→` instead of the count:

- Hover: tooltip preview of the recovery URL.
- Click: opens `https://torly.ai/visa-master/activated?setup_intent=<seti_xxx>&install=<install_id>` in a new tab. This is the exact mechanism that recovered the 2026-05-18 incident.

---

## 9. Bookings table

```
BOOKINGS — last 30d                                       [ ↧ Sort: Newest ]

┌─────────────────────────────────────────────────────────────────────────────────┐
│ WHEN    │ STATUS    │ CUSTOMER          │ CENTRE     │ SLOT     │ £   │ WINDOW  │
├─────────┼───────────┼───────────────────┼────────────┼──────────┼─────┼─────────┤
│ 2d ago  │ [captured]│ usr1***@example.com│ London MH  │ 22 May   │ £19 │ 16h left│
│ 15 May  │           │                   │            │ 09:40    │     │ ⏳       │
├─────────┼───────────┼───────────────────┼────────────┼──────────┼─────┼─────────┤
│ 3d ago  │ [captured]│ usr2***@example.com  │ Manchester │ 25 May   │ £19 │ Closed  │
│ 14 May  │           │                   │            │ 14:00    │     │ (24h+) │
├─────────┼───────────┼───────────────────┼────────────┼──────────┼─────┼─────────┤
│ 5d ago  │ [refunded]│ usr3***@example.com  │ Edinburgh  │ 28 May   │ £19 │ ✓ Ref'd │
│ 12 May  │           │                   │            │ 11:30    │     │         │
├─────────┼───────────┼───────────────────┼────────────┼──────────┼─────┼─────────┤
│ 9d ago  │ [failed]  │ usr4***@example.com  │ Birmingham │ —        │ £0  │ —       │
│ 9 May   │  ⚠        │                   │ (no slot)  │          │     │         │
└─────────┴───────────┴───────────────────┴────────────┴──────────┴─────┴─────────┘
                                                                  [ Load 20 more ]
```

### Status badges (bookings)

| Badge | Color | Meaning |
|---|---|---|
| `[captured]` | green-700 on green-100 | £19 charged, slot booked |
| `[refunded]` | gray-600 on gray-100 | Refunded within 24h window |
| `[failed]` | red-700 on red-100 | `driveBookingFlow` errored or timed out — no charge |

### Refund window column

- **`Xh left ⏳`** when `now() < refund_until` and `status='captured'`. Counts down in real-time (refreshes every 60s).
- **`Closed (24h+)`** when `now() > refund_until` and `status='captured'`. The booking is now non-refundable from the dashboard.
- **`✓ Refunded`** when `status='refunded'`.
- **`—`** for failed bookings.

---

## 10. Empty states

Each chart, table, and donut has a designed empty state. Pattern follows existing dashboards (see `DesktopDashboard.tsx`'s empty state at the `dailyActivations` chart).

### 10.1 No Premium activations yet

KPI card:
```
┌─────────────────────────┐
│ PREMIUM ACTIVATIONS     │
│                         │
│   —                     │ ← em-dash, gray-400
│                         │
│ No Premium customers    │
│ yet                     │
└─────────────────────────┘
```

### 10.2 Activations chart empty

```
ACTIVATIONS + CAPTURES — last 30 days

┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                                                                         │
│                       📭                                                 │
│                                                                         │
│                       No activations in this window                     │
│                                                                         │
│                       Try a longer window or wait for first             │
│                       Premium activation                                │
│                                                                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 10.3 Country donut empty

```
┌───────────────────────────────────┐
│ BOOKINGS BY CENTRE                │
│                                   │
│           ⊘                        │
│       No bookings yet              │
│                                   │
│       Once £19 captures start,    │
│       this donut shows centre     │
│       distribution                │
└───────────────────────────────────┘
```

### 10.4 Tables empty

```
PREMIUM CUSTOMERS — last 30d

┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                         📋  No Premium customers in this window             │
│                                                                             │
│                         Customers appear here once they complete            │
│                         Stripe Checkout (Setup Intent succeeded).           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 11. Loading states

Single page-level skeleton, mounts immediately and is replaced section-by-section as data arrives.

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓ ▓ ▓▓▓▓▓▓▓▓                            [ ▓▓ ] [ ▓▓ ] [ ▓▓ ] [ ▓▓ ] │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                                              │
├───────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                           │
│  │ ▓▓▓▓▓▓▓▓▓▓▓▓ │ │ ▓▓▓▓▓▓▓▓▓▓▓▓ │ │ ▓▓▓▓▓▓▓▓▓▓▓▓ │                           │
│  │              │ │              │ │              │                           │
│  │   ▓▓▓▓▓      │ │   ▓▓▓        │ │   ▓▓         │                           │
│  │              │ │              │ │              │                           │
│  │ ▓▓▓▓▓▓▓▓▓▓   │ │ ▓▓▓▓▓▓▓▓▓▓   │ │ ▓▓▓▓▓▓▓▓▓▓   │                           │
│  └──────────────┘ └──────────────┘ └──────────────┘                           │
│  ... etc                                                                      │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                         │  │
│  │     [ animated shimmer block ]                                          │  │
│  │                                                                         │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

Use the same `<SkeletonRow>` / `<SkeletonBlock>` primitives as `RevenueDashboard.tsx` (do NOT introduce a new skeleton system).

---

## 12. Error states

### 12.1 Full-page error (Supabase down)

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ Schengen Visa  /  Overview                          [ 7d ] [ 30d ▣ ] [ 90d ]  │
│                                                                               │
│ ┌───────────────────────────────────────────────────────────────────────────┐ │
│ │ ⚠ Dashboard data unavailable                                              │ │
│ │                                                                           │ │
│ │ Could not reach Supabase. Stripe and Chrome Web Store data are also       │ │
│ │ skipped because they're derived from this query.                          │ │
│ │                                                                           │ │
│ │ [ ⟳ Retry ]   [ Open Supabase status →]                                   │ │
│ └───────────────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────────────┘
```

Uses existing `<AlertBanner>` (`components/admin/AlertBanner.tsx`) with `variant='destructive'`.

### 12.2 Partial error (Stripe down, Supabase OK)

KPI strip + chart + tables all render normally from Supabase. The Orphan card and CWS card show:

```
┌─────────────────────────┐
│ ⚠ ORPHAN SETUP INTENTS  │
│                         │
│   —                     │
│                         │
│ Stripe API unreachable. │
│ [ ⟳ Retry ]              │
└─────────────────────────┘
```

```
┌─────────────────────────┐
│ CWS INSTALLS            │
│                         │
│   1,200+                │ ← last-known-good value
│                         │
│ ⚠ Scrape failed at      │
│   14:32 UTC             │
│ Last good: 1,200+       │
│ from 14:00 UTC          │
└─────────────────────────┘
```

### 12.3 No admin session

Existing middleware redirects to `/admin/login` before this page renders, so no in-page handling needed.

---

## 13. Interaction details

### 13.1 Time-window changes

When operator changes the time window:
1. URL updates immediately (`?period=90d`).
2. Skeleton replaces KPI strip + chart + tables (within 50ms).
3. New data arrives, sections un-skeleton one at a time as they resolve.

### 13.2 Reveal email

1. Click `👁 reveal` on a masked email.
2. Optimistically swap mask → full email.
3. POST `/api/admin/ops/visa-master/audit` with `{action:'reveal_email', install_id}`.
4. If audit POST fails: revert to masked state, show toast "Audit log failed, email re-hidden for safety".
5. Button text becomes `🔒 hide`. Click again to re-mask.

### 13.3 Orphan recovery

1. Click `Recover →` link in the BOOKINGS column for an `[orphan]` row.
2. New tab opens to `https://torly.ai/visa-master/activated?setup_intent=<id>&install=<id>`.
3. The recovery flow runs (per `app/visa-master/activated/ActivatedClient.tsx`).
4. On the dashboard, the row's status remains `[orphan]` until the next data refresh (60s), at which point it should flip to `[active]`.
5. If still `[orphan]` after 5 minutes, surface a warning in the inline accordion of the Orphan Setup Intents KPI card.

### 13.4 Auto-refresh

- Page polls `/api/admin/ops/visa-master?period=<current>` every 60s.
- Refresh is silent (no skeleton); section data swaps in place.
- Manual refresh: header `Refresh ⟳` button forces an immediate refetch.

### 13.5 Click-to-copy install_id

- Whole UUID cell is a clickable target (plus the `📋` button).
- On click: `navigator.clipboard.writeText(full_uuid)` + toast "Copied b7ad8db5… ✓" for 2s.
- Toast position: top-right of the table cell, matches existing toast pattern in `/admin/ops/users/lifecycle`.

---

## 13a. Extension-side capture flow (the "How did you hear about us?" question)

The dashboard surfaces the data, but the data is captured in the extension. This wireframe documents the Premium intro page change needed in the Schengen-visa repo (`extension/src/premium/PremiumLandingPage.tsx`) so the dashboard has data to show. Per PRD §7.4 and Decision D4.

### Before — current Premium intro page (today)

```
┌────────────────────────────────────────────────────┐
│                                                    │
│   ★ Upgrade to Visa Master Premium                 │
│                                                    │
│   Auto-book the moment a slot opens.               │
│   £19 only on success — fully refundable 24h.      │
│                                                    │
│   ┌────────────────────────────────────────────┐   │
│   │ • Auto-fill + submit when logged out      │   │
│   │ • Auto-book on slot detected               │   │
│   │ • 24h refund window                        │   │
│   └────────────────────────────────────────────┘   │
│                                                    │
│   ┌──────────────────────────┐                     │
│   │   Activate Premium  →    │                     │
│   └──────────────────────────┘                     │
│                                                    │
│   Already activated? Restore →                     │
│                                                    │
└────────────────────────────────────────────────────┘
```

### After — same page, with attribution question inlined

```
┌────────────────────────────────────────────────────┐
│                                                    │
│   ★ Upgrade to Visa Master Premium                 │
│                                                    │
│   Auto-book the moment a slot opens.               │
│   £19 only on success — fully refundable 24h.      │
│                                                    │
│   ┌────────────────────────────────────────────┐   │
│   │ • Auto-fill + submit when logged out      │   │
│   │ • Auto-book on slot detected               │   │
│   │ • 24h refund window                        │   │
│   └────────────────────────────────────────────┘   │
│                                                    │
│   ┌────────────────────────────────────────────┐   │  ← NEW BLOCK
│   │ Quick question (optional)                  │   │
│   │ How did you hear about Visa Master?        │   │
│   │                                            │   │
│   │ ┌────────────────────────────────────┐ ▼   │   │
│   │ │  — Select an answer —              │     │   │
│   │ └────────────────────────────────────┘     │   │
│   │                                            │   │
│   │ • Reddit                                   │   │
│   │ • Twitter / X                              │   │
│   │ • TikTok                                   │   │
│   │ • YouTube                                  │   │
│   │ • A friend told me                         │   │
│   │ • Google search                            │   │
│   │ • Chrome Web Store browse                  │   │
│   │ • Other (please tell us)                   │   │
│   │ • Skip                                     │   │
│   │                                            │   │
│   │ Just helps us know where to focus our     │   │
│   │ marketing time. You can skip — that's OK. │   │
│   └────────────────────────────────────────────┘   │
│                                                    │
│   ┌──────────────────────────┐                     │
│   │   Activate Premium  →    │  ← unchanged action │
│   └──────────────────────────┘                     │
│                                                    │
│   Already activated? Restore →                     │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Behavior

- Question appears once per install (gated on `attributionAsked` flag in `chrome.storage.local`).
- "Other" choice reveals a small `<input type="text" maxlength="200">` below the dropdown.
- Answer is stored in `chrome.storage.local.attributionSource` and `.attributionDetail`, then sent in the next `/license/activate` body.
- If user clicks "Activate Premium" without answering: `attributionSource = null` (NOT "skip" — null means we never asked successfully; "skip" means they explicitly chose to skip).
- If user clicks "Activate Premium" AND has selected an answer: send the selected value.
- If user clicks "Activate Premium" AND has chosen "Skip": send `attributionSource = 'skip'` so the dashboard knows the answer was offered and declined (distinct from null).

### A/B variant — for V2 consideration

If the V1 question produces too many "Skip" answers (e.g. > 50%), V2 can experiment with:
- Moving the question to AFTER successful Stripe Checkout (the thank-you page) — answers come from buyers only, but lower friction.
- Adding a small incentive ("Help us figure out where to invest — answer 1 question and we'll add a 5% discount on your first booking" — though discounting a £19 success fee is awkward).
- Changing the wording / dropdown order based on what's actually performing well.

Not in V1 scope. V1 ships the dropdown as-is.

---

## 14. Component inventory

### Existing components — reuse, do NOT recreate

| Component | File | Used for |
|---|---|---|
| `KpiCard` | `components/admin/KpiCard.tsx` | All 6 KPI cards |
| `AlertBanner` | `components/admin/AlertBanner.tsx` | Full-page error state |
| `OpsSidebar` | `components/admin/OpsSidebar.tsx` | Add 1 entry (per PRD §17 / Appendix A) |
| `OpsHeader` | `components/admin/OpsHeader.tsx` | Breadcrumb, no changes |
| Recharts `AreaChart` setup | inlined in `DesktopDashboard.tsx` | Activations chart — copy the wrapper pattern, do not extract yet |
| Recharts `PieChart` (donut) | inlined in `DesktopDashboard.tsx` | Centre distribution donut |
| Time-window pills | inlined in `RevenueDashboard.tsx` | Header selector — copy the pattern |

### New components — implement in this PR

**Dashboard side (torlyAI repo):**

| Component | File | Notes |
|---|---|---|
| `VisaMasterDashboard` | `components/admin/VisaMasterDashboard.tsx` | The page body; ~700 LOC target (up from 600 after metadata/attribution columns) |
| `OrphanSetupIntentsCard` | inline in `VisaMasterDashboard.tsx` | Special-case KPI card with red treatment + accordion |
| `RevealableEmail` | `components/admin/RevealableEmail.tsx` | Mask/reveal + audit post; reused later in V2 |
| `RefundWindowChip` | inline in `VisaMasterDashboard.tsx` | Counts down `Xh left` from `refund_until` |
| `CopyableInstallId` | inline in `VisaMasterDashboard.tsx` | 36-char monospace UUID + 📋 button + toast on copy |
| `BrowserOsIcon` | `components/admin/BrowserOsIcon.tsx` | OS emoji or icon + browser name mapping (Chrome/Edge/Brave/Opera/Vivaldi/Arc/Other) |
| `AttributionSourceBadge` | inline in `VisaMasterDashboard.tsx` | Lookup `attribution_source` → friendly label; show "(skipped)" / "(unknown)" appropriately |
| `TechnicalBreakdownAccordion` | inline in `VisaMasterDashboard.tsx` | Collapsed-by-default panel for the browser × OS matrix + version distribution bars |

**Extension side (Schengen-visa repo):**

| Component | File | Notes |
|---|---|---|
| `AttributionQuestion` | inline in `extension/src/premium/PremiumLandingPage.tsx` | Dropdown + optional "Other" free text; ~60 LOC including i18n strings |
| Metadata collection helper | new function in `extension/src/background/backend-client.ts` | `collectInstallMetadata()` returns `{ extensionVersion, browserName, browserVersion, os }` — called by `activateLicense()` and `pollLicenseStatus()` |

### New backend

| Route | File | Notes |
|---|---|---|
| `GET /api/admin/ops/visa-master` | `app/api/admin/ops/visa-master/route.ts` | The dashboard payload endpoint, per PRD §12 |
| `POST /api/admin/ops/visa-master/audit` | `app/api/admin/ops/visa-master/audit/route.ts` | Logs reveal-PII events to `visa_master_admin_audit` |

### Backend contract changes (existing routes)

| Route | Change |
|---|---|
| `POST /api/visa-master/license/activate` | Body schema gains optional fields: `extensionVersion`, `browserName`, `browserVersion`, `os`, `attributionSource`, `attributionDetail`. Server persists to the install row. |
| `GET /api/visa-master/license/status` | Promote to POST (or add a POST variant) so the extension can refresh `extensionVersion` / `browserName` / `browserVersion` on each poll without re-activation. Older extensions on GET continue to work; server treats missing body as "no metadata refresh". |

### New migrations

| File | Purpose |
|---|---|
| `supabase/migrations/028_visa_master_admin_audit.sql` | Creates `visa_master_admin_audit` table per PRD §13.2 |
| `supabase/migrations/029_visa_master_install_metadata.sql` | Adds `extension_version`, `browser_name`, `browser_version`, `os`, `attribution_source`, `attribution_detail` columns to `visa_master_installs` + an index on `attribution_source` |

### Sidebar diff

Already documented in PRD §17 / Appendix A — a single line added to `components/admin/OpsSidebar.tsx:73` plus a `Plane` icon import.

### Extension version bump

The metadata-collection extension change is a **data-collection boundary**: it adds new categories of fields to the activation payload (even though they're not sensitive). For changelog clarity and welcome-i18n alignment, bump `manifest.json` from `1.1.0` → `1.2.0`. The next welcome i18n update (in the same PR) appends the new fields to the "what Premium sends" disclosure list.

---

## End of wireframes

Implementation order suggestion (for the PR):

1. **Migration** `028_visa_master_admin_audit.sql` — `supabase db push`.
2. **Sidebar item** — single line in `OpsSidebar.tsx`, ship it independently to surface the entry early.
3. **Backend route** `/api/admin/ops/visa-master` — start with KPIs only, add chart data, then tables.
4. **Page shell** `app/admin/ops/schengen-visa/page.tsx` — empty container that renders `<VisaMasterDashboard />`.
5. **Dashboard component** `VisaMasterDashboard.tsx` — KPI strip first, then chart, then tables, then donut.
6. **Polish** — empty states, loading skeletons, error banners.
7. **Audit route + reveal interaction** — last because it requires the table to exist.

Estimated effort: 4–5 focused days, single developer, all of it in the `torlyAI` repo. Commit messages must include the `[deploy]` token per the project's vercel.json gate (per CLAUDE.md).
