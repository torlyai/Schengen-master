# Data Sources Playbook (Tier A)

**Document:** 22-data-sources-playbook.md
**Version:** 1.0
**Date:** 2026-05-24
**Status:** Living document — update as new data sources land
**Companion to:** [`23-vm-telemetry-tier-b-prd.md`](./23-vm-telemetry-tier-b-prd.md) (Premium telemetry expansion)
**Author:** Duke Harewood

---

## What this is

A founder-facing lookup that maps **business questions** → **where to find the answer**, using only data sources that already exist (zero new code, zero new telemetry). Updated when new sources come online.

## What this is NOT

- Not a strategy document (see [`17-ops-dashboard-prd.md`](./17-ops-dashboard-prd.md))
- Not a privacy policy (see `app/privacy/visa-master/page.tsx`)
- Not a marketing plan (see [`15-directory-submissions-launch-plan.md`](./15-directory-submissions-launch-plan.md))

---

## The trust boundary, restated

Visa Master Free is **100% local**. Zero telemetry reaches torly.ai from a Free user. This is the brand promise and it is non-negotiable. Any question about "what individual Free users are doing" is structurally unanswerable. **This non-capability is a feature, not a gap.** See [`11-architecture.md`](./11-architecture.md) §9.

Premium users have explicitly disclosed their data (install UUID, Stripe email, browser, OS, attribution source post-v1.2, booking metadata). Questions about individual Premium users are answerable.

Aggregate questions about all installs — counts, version/browser distribution, country buckets — are answerable from public Chrome Web Store sources without crossing the boundary.

---

## Question → Source matrix

### Acquisition & reach

| Question | Source | Where to look |
|---|---|---|
| How many total installs do we have? | Chrome Web Store (public) | https://chrome.google.com/webstore/detail/cpogdllkcpenafboclnidfmmlcnjpbfm — number after "users" (bucketed) |
| How many installs this week / by day? | CWS Developer Console (private, you only) | https://chrome.google.com/webstore/devconsole → Item → Statistics → Active users |
| How many people side-loaded via GitHub instead of CWS? | GitHub Releases API | Now surfaced on the **Ops dashboard CWS Installs card subtitle** (e.g. "+12 GitHub side-loads") — pulls `api.github.com/repos/torlyai/Schengen-master/releases` per-asset `download_count` totals |
| Which countries are installing most? | CWS Developer Console | Statistics → Geographic distribution (aggregate %, not per-user) |
| What browsers / versions are installs running on? | CWS Developer Console | Statistics → Browser version distribution (aggregate %) |
| How many people uninstalled? | CWS Developer Console | Statistics → Uninstall rate |
| Where did installs come from? | (Tier B post-v1.2) | The "How did you hear about us?" question on Premium intro page lands in `visa_master_installs.attribution_source` and surfaces on the dashboard's Attribution donut. Free-tier attribution is NOT available by design. |

### Marketing funnel (torly.ai → CWS install)

| Question | Source | Where to look |
|---|---|---|
| How many people view /schengen / /schengen/premium? | Google Analytics 4 + Plausible | GA4 property `G-G3HP1X98FN`. Plausible at plausible.io for the torly.ai property. |
| Which marketing page drives the most installs? | GA4 + Plausible custom events | `schengenPremiumInstallClicked` event fires with `placement: 'hero' \| 'compare' \| 'final'` (see `lib/analytics.ts`). The placement parameter tells you which CTA on which page converted. |
| How many people clicked the CWS install button? | GA4 + Plausible custom events | Same `schengenPremiumInstallClicked` event. Click is the strongest proxy for install intent. Actual install completion happens on CWS (not our domain), so we measure clicks not completions here. |
| Which insights articles drive the most CWS clicks? | GA4 page-view + outbound click tracking | GA4 tracks pageviews on /visa-master/insights/* automatically. CWS button clicks within MDX articles are currently NOT tracked as custom events — see "Gap A1" below. |
| What's the conversion rate from page view to CWS click? | GA4 funnel | Custom funnel: `/schengen` page view → `schengenPremiumCtaClicked` → `/schengen/premium` page view → `schengenPremiumInstallClicked` |

### Premium funnel (CWS click → £19 captured)

| Question | Source | Where to look |
|---|---|---|
| How many people started Premium activation but didn't complete Stripe? | Ops dashboard | Premium Customers table → rows with `status: 'pending'` (Stripe Checkout abandoned). Currently 7 of 11 (64% abandonment). |
| How many Premium customers do we have? | Ops dashboard | KPI card "Premium Activations" (count of `status: 'active'`) |
| How much money came in this month? | Ops dashboard | KPI cards "Captured £" + "Refunded £" |
| Did any Stripe payment succeed but fail to mint a license? | Ops dashboard | KPI card "Orphan Setup Intents" — red treatment if > 0. Currently 0 (good). The 2026-05-18 `b7ad8db5` incident would have shown here. |
| Which centre are bookings going to? | Ops dashboard | "Bookings by Centre" donut + top-5 table |
| Are we losing customers to refunds? | Ops dashboard | "Refunded £" KPI + Bookings table status badges |

### Behavioural questions (the ones you'd reach for telemetry for)

| Question | Best available source | What you can't see |
|---|---|---|
| How often does a Free user pause monitoring? | Not available (local-only) | Per-user pause events. Aggregate via Tier C opt-in (not recommended). |
| What proportion of installs have configured Telegram? | Not available (local-only) | Per-user Telegram config. Aggregate via Tier C. |
| Where does the auto-booking flow break in production? | **Tier B v1.3 (proposed)** — `booking_failed_at_step` event counter on the Premium `/license/status` POST | Not currently captured. Without this, you cannot fix `driveBookingFlow` empirically. **Highest-priority telemetry gap.** |
| How many slots does a typical Premium user catch per week? | **Tier B v1.3 (proposed)** — `slots_detected_count` event counter | Not currently captured. Useful for understanding usage intensity and bookings/slot conversion. |
| How long do users stay on a typical popup state? | Not available, even Tier B (would need explicit UI engagement events) | Out of scope. |
| What's the Free → Premium upgrade conversion rate? | **Derivable** from CWS install count + Premium activations — divide one by the other | Imprecise because CWS is bucketed ("1,000+") and lags. |

### Operational / quality

| Question | Source | Where to look |
|---|---|---|
| What's the extension's CWS rating? | Chrome Web Store (public) | The CWS detail page shows rating + review count |
| What are users saying in CWS reviews? | Chrome Web Store (public) | CWS detail page → Reviews tab |
| Are people opening GitHub issues? | GitHub | https://github.com/torlyai/Schengen-master/issues |
| Are we deploying smoothly? | Vercel dashboard | https://vercel.com/dukewoods-projects/torlyai → Deployments |
| Are emails landing? | Resend dashboard + Ops `/admin/ops/email` | Internal `/admin/ops/email` shows sent/failed/bounced |

---

## Known gaps (not blockers — opportunities)

### Gap A1 — Insights article CWS clicks not tracked

**What's missing:** The 31 articles at `/visa-master/insights/*` each have a CTA linking to the CWS install URL. These are plain markdown anchor links inside MDX. There's no `onClick` handler that fires `analytics.schengenPremiumInstallClicked()`.

**Why it matters:** Without it, you can see which insights articles get traffic (GA4 pageviews) but not which articles convert traffic into CWS clicks. That makes ROI per article fuzzy.

**Fix scope:** Either:
- (a) Wrap the install URL in a custom MDX `<InstallCta>` component that fires the analytics event. ~30 LOC. Edit each of 31 articles to swap raw links for the component (~1 hour of careful find-replace OR a sed pass).
- (b) Add a global outbound-link tracker that fires a `cws_click` event on any link to `chrome.google.com/webstore/detail/cpogd…`. ~15 LOC, no article edits needed. **Recommended.**

**Estimated effort:** Half a day. Not blocking — articles will accumulate pageview data either way.

### Gap A2 — UTM parameters on CWS install links

**What's missing:** The `INSTALL_URL` constant (`lib/schengen/constants.ts`) doesn't append UTM parameters. CWS strips them on click anyway, but UTMs in the URL still appear in GA referrer reports as the source of the outbound click.

**Why it matters:** A UTM like `?utm_source=torly.ai&utm_medium=insights&utm_campaign=france-visa-fees` on the article-page CWS link would let you compare which campaign / article cluster drives the most CWS click-throughs.

**Fix scope:** Adjust `INSTALL_URL` to accept a `source` parameter that appends UTM. Update the ~10 call sites across `/schengen`, `/schengen/premium`, and the new insights articles. ~50 LOC.

**Estimated effort:** Half a day. Not blocking — Gap A1 covers the same need from a different angle.

### Gap A3 — No daily KPI snapshot (history beyond Stripe/Supabase)

**What's missing:** The Ops dashboard always shows the CURRENT state, queried live. If you want to see "what did Premium Activations look like 3 weeks ago?", you can derive it from Supabase historical data (the rows are still there) but the dashboard's time-series chart is the only canonical view.

**Why it matters:** You can't easily show week-over-week growth without writing custom queries.

**Fix scope:** A `visa_master_kpi_snapshot` table populated by a cron job (Vercel Cron) at 00:00 UTC daily. Captures the KPI values for that day. Dashboard adds a "WoW change" annotation under each KPI card.

**Estimated effort:** 1 day. Probably worth doing in 30-day timeframe.

---

## How to update this playbook

When you add a new data source (e.g., Tier B v1.3 ships and you can finally answer "where does driveBookingFlow break"), update this doc with:

1. New row(s) in the relevant section's table
2. Move the question out of "Behavioural questions you can't see"
3. Update the "Last updated" date below

---

## Quick reference — five most-checked sources

| # | Source | URL | Login |
|---|---|---|---|
| 1 | Ops Dashboard | https://torly.ai/admin/ops/schengen-visa/ | Magic link |
| 2 | CWS Developer Console | https://chrome.google.com/webstore/devconsole | Google (dukeharewood@gmail.com) |
| 3 | Stripe Dashboard | https://dashboard.stripe.com/customers | Stripe login |
| 4 | GA4 | https://analytics.google.com/analytics/web/#/p/reports/intelligenthome | Google (dukeharewood@gmail.com) |
| 5 | Vercel | https://vercel.com/dukewoods-projects/torlyai | GitHub OAuth (DukeWood) |

---

**Last updated:** 2026-05-24 — Tier A shipped: GitHub Releases side-load counts surfaced on Ops dashboard CWS card subtitle (torlyAI PR #41).
