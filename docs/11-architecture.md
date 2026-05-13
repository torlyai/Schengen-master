# 11 — Visa Master / Schengen-visa Architecture

> **Canonical home:** `Schengen-visa/docs/11-architecture.md`
> **Sibling copy:** `torlyAI/docs/architecture/visa-master-architecture.md`
> When the system changes, update **both** copies in the same commit pair.

This document describes the **two-repo, single-product** architecture behind
the Visa Master Chrome extension and its Premium-tier backend. It is the
reference for: which file goes in which repo, which secrets live where,
how money moves, and which trust boundaries are load-bearing.

---

## 1. System map

```
            ┌─────────────────────────── User's laptop ───────────────────────────┐
            │                                                                     │
            │   Chrome browser                                                    │
            │   ┌────────────────────────────────┐                                │
            │   │  Visa Master extension v1.x    │   ◄─ Free tier: 100% local     │
            │   │  (Schengen-visa repo)          │   ◄─ Premium: 1 hop to torly.ai│
            │   │                                │       (license + £19 capture)  │
            │   │  ┌──────────────┐              │                                │
            │   │  │ Service      │  alarms      │                                │
            │   │  │  Worker      │◄─────────────┤                                │
            │   │  │ (FSM brain)  │              │                                │
            │   │  └──┬───────┬───┘              │                                │
            │   │     │       │                  │                                │
            │   │     ▼       ▼                  │                                │
            │   │  Popup    Content              │                                │
            │   │  React    Script               │                                │
            │   │           (TLS DOM)            │                                │
            │   └────────┬───────────────────────┘                                │
            │            │                                                        │
            │            │ chrome.tabs.sendMessage / executeScript                │
            │            ▼                                                        │
            │   ┌────────────────────────┐                                        │
            │   │ tlscontact.com tab     │                                        │
            │   │ (the page we watch)    │                                        │
            │   └────────────────────────┘                                        │
            └─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │   HTTPS, only when Premium is in play:
                                    │     • Checkout start
                                    │     • License activate / rebind / status
                                    │     • Booking capture / refund
                                    ▼
            ┌─────────────────────────── torly.ai (Vercel) ───────────────────────┐
            │                                                                     │
            │   Next.js 14 App Router  (torlyAI repo)                             │
            │   /api/visa-master/{checkout, license/*, booking/*, webhook/stripe} │
            │   /visa-master/activated (post-checkout landing → JWT relay)        │
            │                                                                     │
            │       │                              ▲                              │
            │       │ service-role SQL             │ webhook events               │
            │       ▼                              │ (mode='setup' &              │
            │   ┌─────────────┐                    │  metadata.product=           │
            │   │  Supabase   │                    │  'visa-master')              │
            │   │  Postgres   │                    │                              │
            │   │             │             ┌──────┴──────┐                       │
            │   │ visa_master_│             │   Stripe    │                       │
            │   │   installs  │◄────────────┤  (live mode)│                       │
            │   │   bookings  │             └─────────────┘                       │
            │   └─────────────┘                                                   │
            └─────────────────────────────────────────────────────────────────────┘
```

**Two repos, one product.** The extension is in `Schengen-visa`. The
server companion lives inside `torlyAI` so it can share Stripe customer
records, the existing JWT signing keys, and the Supabase project with
torlyAI's other paid products — without ever cross-contaminating them
(see §6, "Isolation guarantees").

---

## 2. Repo layout

### 2.1 `Schengen-visa/` — the extension

```
Schengen-visa/
├── README.md                          # User-facing install + free-tier feature blurb
├── README.zh-CN.md                    # 中文 mirror
├── DASHBOARD.md                       # Personal project tracker (not user-facing)
├── extension/                         # The Chrome extension
│   ├── manifest.json                  # MV3, version, host perms, content scripts
│   ├── vite.config.ts                 # Multi-entry build (popup, settings, welcome, premium)
│   ├── package.json
│   ├── src/
│   │   ├── background/                # Service-worker layer
│   │   │   ├── service-worker.ts      # Message router, alarm receiver, install hook
│   │   │   ├── state-machine.ts       # FREE FSM: IDLE↔NO_SLOTS, SLOT_AVAILABLE, CLOUDFLARE, …
│   │   │   ├── booking-fsm.ts         # PREMIUM FSM: bookingStart→confirm→capture£19→refund
│   │   │   ├── scheduler.ts           # chrome.alarms cadence (smart / fixed / release windows)
│   │   │   ├── badge.ts               # Toolbar badge config per ExtState
│   │   │   ├── notifications.ts       # chrome.notifications + sound + tab title
│   │   │   ├── telegram.ts            # Optional phone push (free + premium events)
│   │   │   ├── tls-auto-login.ts      # PREMIUM: fill+submit on LOGGED_OUT (best-guess selectors)
│   │   │   ├── backend-client.ts      # PREMIUM: typed wrapper over /api/visa-master/*
│   │   │   └── update-checker.ts      # GitHub Releases API "check for updates"
│   │   ├── content/                   # Runs inside TLScontact tabs (+ torly.ai landing)
│   │   │   ├── content-script.ts      # MAIN: tlscontact.com/* — detector + affordance
│   │   │   ├── detector.ts            # DOM → ExtState (NO_SLOTS / SLOT_AVAILABLE / CF / …)
│   │   │   ├── booking-confirmation-detector.ts  # PREMIUM: post-book "Booking ID …" parse
│   │   │   └── license-relay.ts       # SECONDARY: torly.ai/visa-master/activated → postMessage JWT to SW
│   │   ├── popup/                     # React popup UI (the toolbar window)
│   │   │   ├── popup.html
│   │   │   ├── popup.tsx              # Router by ExtState
│   │   │   ├── components/            # QR popover, lang toggle, bottom chrome
│   │   │   └── states/                # One component per ExtState
│   │   │       ├── NoSlots.tsx, SlotAvailable.tsx, Cloudflare.tsx, …  (free)
│   │   │       ├── WrongPage.tsx                                       (free, /travel-groups fix)
│   │   │       └── premium/                                            (Premium-only)
│   │   │           ├── Preflight.tsx, SetupCredentials.tsx, SetupBookingWindow.tsx,
│   │   │           │   SetupReadyToActivate.tsx, VerificationGate.tsx,
│   │   │           │   SetupFailedRetry.tsx, SetupFailedStale.tsx,
│   │   │           │   PremiumActive.tsx, PremiumOptions.tsx,
│   │   │           │   BookingInProgress.tsx, Booked.tsx,
│   │   │           │   BookingFailed.tsx, RefundPrompt.tsx
│   │   ├── settings/                  # Full-page Options (/src/settings/settings.html)
│   │   ├── welcome/                   # First-run onboarding page
│   │   ├── premium/                   # Premium intro tab opened by UPGRADE_TO_PREMIUM
│   │   │   ├── premium.html, premium.tsx
│   │   │   └── PremiumLandingPage.tsx
│   │   ├── shared/                    # Used by all 4 entry points
│   │   │   ├── states.ts              # ExtState union (Free + 14 Premium variants)
│   │   │   ├── messages.ts            # Typed Msg union for SW ↔ UI ↔ content
│   │   │   ├── storage.ts             # chrome.storage.local wrappers (settings/state/target/stats/bookingWindow/creds)
│   │   │   ├── crypto.ts              # PREMIUM: AES-GCM (PBKDF2 from per-install salt) for TLS creds
│   │   │   ├── license.ts             # PREMIUM: install JWT validation + storage
│   │   │   ├── target.ts              # parseTlsUrl() — URL → centre/subjectCode/country
│   │   │   └── messages.ts            # ExtState + Msg type unions
│   │   ├── i18n/                      # en + zh-CN dictionaries
│   │   ├── components/                # Cross-page shared components
│   │   ├── hooks/, styles/
│   ├── public/icons/                  # Toolbar icons + brand
│   ├── docs/                          # Extension-internal dev notes
│   └── dist/                          # `npm run build` output (loaded as unpacked ext)
└── docs/                              # Product docs (this folder)
    ├── 06-visa-master-chrome-extension-prd.md   # Free-tier PRD
    ├── 07-chrome-extension-wireframes.md         # Free-tier wireframes
    ├── 08-vs-alternatives.md / .zh-CN.md         # Competitor comparison
    ├── 09-visa-master-premium-prd.md             # PREMIUM PRD (decisions locked)
    ├── 10-visa-master-premium-wireframes.md      # PREMIUM wireframes
    └── 11-architecture.md                        # ← you are here
```

### 2.2 `torlyAI/` — the backend companion

Visa Master Premium does **not** have its own repo or its own Vercel
project. It is a six-file annex that lives inside the existing torlyAI
Next.js app:

```
torlyAI/
├── app/
│   ├── api/visa-master/                # Server routes — all chrome-extension://-CORSed
│   │   ├── checkout/route.ts           # POST: Stripe Setup Intent Checkout session
│   │   ├── license/
│   │   │   ├── activate/route.ts       # POST: Setup Intent → DB row → JWT
│   │   │   ├── rebind/route.ts         # POST: reinstall, 3 rebinds / 30d
│   │   │   └── status/route.ts         # GET : liveness/revocation, polled 1×/24h
│   │   ├── booking/
│   │   │   ├── capture/route.ts        # POST: £19 off-session PaymentIntent, idempotent
│   │   │   └── refund/route.ts         # POST: 24h refund window
│   │   ├── webhook/stripe/route.ts     # POST: filtered to mode=setup AND metadata.product=visa-master
│   │   └── README.md                   # Endpoint catalog + curl smoke tests
│   └── visa-master/
│       └── activated/
│           ├── page.tsx                # Post-Checkout landing
│           └── ActivatedClient.tsx     # Calls /license/activate → window.postMessage(JWT) to ext
├── lib/visa-master/                    # Logic shared across the 6 routes
│   ├── jwt.ts                          # signVmLicense() / verifyVmLicense() — aud='visa-master-extension'
│   ├── stripe.ts                       # Lazy Stripe client + VM_PRICE_PENCE=1900, VM_CURRENCY='gbp'
│   └── cors.ts                         # withCors() + corsPreflight() for chrome-extension:// origins
├── supabase/migrations/
│   └── 026_visa_master.sql             # visa_master_installs + visa_master_bookings (RLS, service-role only)
└── docs/architecture/
    └── visa-master-architecture.md     # ← sibling copy of this file
```

**Zero edits** to existing torlyAI files. The Visa Master subsystem
is additive only (see §6).

---

## 3. Extension internals (Schengen-visa)

### 3.1 The four entry points

A Manifest V3 extension is not one program — it is up to four cooperating
contexts that share `chrome.storage.local` as their bus. Visa Master uses
all four:

| Context | Entry file | Lives | Tooling | Survives |
|---|---|---|---|---|
| **Service worker** | `src/background/service-worker.ts` | Background, ephemeral | TS+Vite, no DOM | Until evicted (~30s idle) |
| **Content script** | `src/content/content-script.ts` | Inside TLS tab DOM | Isolated world by default | Until tab navigates away |
| **Popup React** | `src/popup/popup.tsx` | Toolbar window | React 18 | Until popup closes |
| **Options/Welcome/Premium pages** | `src/settings/*`, `src/welcome/*`, `src/premium/*` | Full tabs | React 18 | Until tab closes |

The brain is the **service worker**. Everything else talks to it via
`chrome.runtime.sendMessage`. Persistence is `chrome.storage.local`
(see §3.4) so an SW eviction never loses state — on the next message
the SW reads back where it was.

### 3.2 The two FSMs

**Free-tier FSM** (`background/state-machine.ts`)
Drives the badge, notifications, scheduling, and Telegram pings:

```
   IDLE  ◄──►  NO_SLOTS  ──► SLOT_AVAILABLE  ──► (notify → ackSlot → NO_SLOTS)
              ▲    ▲
              │    │
      CLOUDFLARE  LOGGED_OUT      (15-min auto-stop → IDLE)
              │
            PAUSED  (user-toggled, suppresses all transitions)
              │
            UNKNOWN  (awaits user classification from popup)
              │
            WRONG_PAGE  (tab is on a TLS URL but not the booking page)
```

Transition logic is in `transitionTo()`. Every transition recomputes:
badge text+color, scheduling (poll vs. clear), notifications (rising
edge only), Telegram (if enabled), and the tab affordance overlay.

**Premium-tier booking FSM** (`background/booking-fsm.ts`)
Layered on top — it observes `SLOT_AVAILABLE` and races to book:

```
   (free FSM emits SLOT_AVAILABLE)
              │
              ▼
   maybeStartBookingOnSlot()                    [eligibility gates: license, creds,
              │                                  bookingWindow, includePrimeTime]
              ▼
   BOOKING_IN_PROGRESS  ──► driveBookingFlow()  [scripted DOM ops on TLS]
              │
              ├─► success (BOOKING_CONFIRMED detected by content script)
              │       │
              │       ▼
              │   handleBookingConfirmed() ──► captureBooking() ──► POST /booking/capture
              │       │                                              (£19 to saved card)
              │       ▼
              │   BOOKED (refund window: 24h)
              │       │
              │       ▼
              │   user clicks "TLS cancelled it"
              │       │
              │       ▼
              │   refundActiveBooking() ──► POST /booking/refund ──► REFUNDED
              │
              └─► 60s timeout
                      │
                      ▼
                  handleBookingTimeout() ──► BOOKING_FAILED (no charge)
```

PRD §12 contains the full state diagram. The pre-charge "is the booking
actually real" check is two-sourced: URL pattern AND text pattern, both
must match (`booking-confirmation-detector.ts`).

### 3.3 Scheduling — `chrome.alarms`

- `vmPollAlarm` — drives detection cadence. Cadence comes from
  `applyResolvedCadence()` which combines: smart-mode (state-aware
  back-off), fixed-mode, and release-window overrides (06:00–09:30 UK,
  23:30–00:30 UK, 2-min poll).
- `vmAutoStopAlarm` — 15-min timer for CLOUDFLARE / LOGGED_OUT. Fires
  once; if still stuck, falls to IDLE.
- `vmBookingTimeoutAlarm` — Premium 60s budget for `driveBookingFlow`.

Service-worker eviction can lose alarms in MV3; `service-worker.ts`'s
self-healing block re-creates the poll alarm if the SW comes up and
sees `stateAllowsPolling(state) === true` but no alarm registered.

### 3.4 Persisted keys in `chrome.storage.local`

Stable contract — both UI and SW read these:

| Key | Shape | Notes |
|---|---|---|
| `settings` | `SettingsPayload` (DEFAULT_SETTINGS in storage.ts) | Cadence, lang, Telegram, notifs |
| `state` | `PersistedState` | FSM cursor, lastCheckTs, watchedTabId, blockerStartedTs |
| `target` | `PersistedTarget` | URL + parsed centre/subjectCode/country |
| `stats` | `PersistedStats` | Daily checks+slots counter |
| `consent` | `PersistedConsent` | Onboarding consent timestamp + version |
| `bookingWindow` | `PersistedBookingWindow` | Premium: travelDate, processingDays, etc. |
| `tlsCreds` | `EncryptedTlsCreds` | Premium: AES-GCM ciphertext only |
| `installSalt` | base64 32 bytes | Crypto salt (never leaves device) |
| `vmAutoLoginFails` | `FailLog` | Per-hour fail counter for auto-login cooldown |
| `vmAutoLoginCooldownUntil` | number | Epoch ms |
| `vmLicense` | parsed JWT payload + raw | Premium license (see §4.2) |
| `vmInstallId` | UUID | Per-install identifier, persisted for life |

### 3.5 The credential boundary

Free tier guarantees: **the extension never reads your TLS password,
never sees the form, never makes a request to torly.ai.** This is the
brand promise restated in the welcome page i18n and PRD §11.2.

Premium tier relaxes the first half: the user opts in to **save** their
TLS password (encrypted under a per-install salt, AES-GCM via PBKDF2)
so the extension can auto-fill + submit when a `LOGGED_OUT` is detected.

The encryption is **local obfuscation, not user-passphrase-strength**.
Threat model in `shared/crypto.ts` header. The salt is wiped by the
"Forget my credentials" button (`forgetTlsCredentials()`), making all
prior ciphertexts unrecoverable.

What is still **never** sent to torly.ai, even on Premium:
- TLS email / password
- TLS slot data
- Polling cadence
- DOM contents
- Telegram tokens

What is sent to torly.ai (Premium only):
- `installId` (random UUID)
- Stripe customer email (at Checkout)
- Booking ID (TLS-format string) at capture time
- Centre + slot timestamp (for the user's own receipt + Telegram echo)

---

## 4. Backend internals (torlyAI/app/api/visa-master)

### 4.1 Endpoint catalog

All routes live under `/api/visa-master/*`. All allow `chrome-extension://`
origin via `lib/visa-master/cors.ts`. All bodies are Zod-validated.

| Verb | Path | Body | Returns | When |
|---|---|---|---|---|
| POST | `/checkout` | `{installId, locale}` | `{checkoutUrl}` | Popup "Activate Premium" |
| POST | `/license/activate` | `{installId, sessionId}` | `{licenseJwt, exp}` | Post-Checkout landing |
| POST | `/license/rebind` | `{newInstallId, oldInstallId, email}` | `{licenseJwt}` | Reinstall flow |
| GET  | `/license/status?installId=…` | – | `{active, status}` | Liveness 1×/24h |
| POST | `/booking/capture` | `{installId, bookingId, slotAt, centre}` | `{captured, refundUntil}` | After BOOKING_CONFIRMED |
| POST | `/booking/refund` | `{installId, bookingId, reason}` | `{refunded, amount}` | User clicks "TLS cancelled" |
| POST | `/webhook/stripe` | (Stripe-signed) | 200 | Stripe → revoke on dispute/refund/customer.deleted |

### 4.2 The license JWT

Signing: **shared key with the existing torlyAI desktop license**
(`JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY` env vars, RS256). What keeps them
distinct is the `aud` claim:

| Product | `aud` | Expiry |
|---|---|---|
| torlyAI desktop license (pre-existing) | `torlyai-desktop` | per plan |
| Visa Master Premium | `visa-master-extension` | 18 months |

Verification in `shared/license.ts` rejects any JWT whose `aud` is not
exactly `visa-master-extension`. A leaked desktop token cannot activate
Premium and vice-versa.

Payload:
```json
{
  "iss": "torly.ai",
  "aud": "visa-master-extension",
  "sub": "<installId>",
  "tier": "premium",
  "email": "<stripe customer email>",
  "iat": 1715000000,
  "exp": 1762000000
}
```

The extension does **structural** validation only (`iss`/`aud`/`exp`/
`tier`). A 1×/24h call to `/license/status?installId=…` is the
revocation channel.

### 4.3 The payment lifecycle

**Activation — £0 charged.**

1. Popup POSTs `/checkout` with `installId`.
2. Server creates a Stripe Checkout session in `mode: 'setup'`,
   `metadata.product: 'visa-master'`, `metadata.installId: <id>`,
   success_url = `https://torly.ai/visa-master/activated?session_id={CHECKOUT_SESSION_ID}`.
3. User completes Stripe form (saves card; no charge).
4. Browser lands on `/visa-master/activated`. `ActivatedClient.tsx` POSTs
   `/license/activate` with `{installId, sessionId}`.
5. `/license/activate`:
   - retrieves the Setup Intent (must be `succeeded`),
   - upserts `visa_master_installs` (one active row per Stripe email),
   - signs a JWT,
   - returns `{licenseJwt}`.
6. `ActivatedClient` does `window.postMessage({type: 'PREMIUM_INSTALL_LICENSE', jwt}, '*')`.
7. The `license-relay.ts` content script (matched on
   `torly.ai/visa-master/activated*`) catches the message and forwards
   to the SW via `chrome.runtime.sendMessage`.
8. SW validates + stores the JWT → state machine flips to PREMIUM_ACTIVE.

**Booking — £19 captured.**

1. Free FSM emits `SLOT_AVAILABLE`.
2. `maybeStartBookingOnSlot()` checks eligibility (license, creds,
   bookingWindow, includePrimeTime), enters BOOKING_IN_PROGRESS.
3. `driveBookingFlow()` scripts the TLS DOM (CURRENT STATUS: stub —
   needs empirical TLS markup before public release; tracked in
   PRD §17).
4. Content script's `booking-confirmation-detector.ts` matches URL
   pattern AND text pattern on the resulting page; extracts
   `bookingId, slotAt, centre`; sends `BOOKING_CONFIRMED` to SW.
5. SW calls `backend-client.captureBooking()` → POST `/booking/capture`.
6. Server:
   - looks up the install's `stripe_customer_id` + saved payment method,
   - idempotency check on `(install_id, booking_id)`,
   - creates an **off-session** PaymentIntent for 1900 GBP pence,
     `confirm: true`, `off_session: true`, `metadata.product: 'visa-master'`,
   - on success, inserts a `visa_master_bookings` row with
     `refund_until = now() + 24h`,
   - returns `{captured: true, refundUntil}`.
7. Extension transitions to BOOKED, shows Refund button until 24h.

**Refund.**

1. User clicks "TLS cancelled it" within 24h → POST `/booking/refund`.
2. Server creates `stripe.refunds.create({payment_intent})`, updates the
   booking row, returns `{refunded: true}`.
3. Extension transitions to REFUNDED. Telegram echo if enabled.

### 4.4 Webhook (`/webhook/stripe`)

Subscribed events:
- `checkout.session.completed` — secondary confirmation of activation
- `charge.refunded` — sync DB state if refund was issued out-of-band
- `charge.dispute.created` — revoke license (`status='disputed'`)
- `customer.deleted` — revoke license

**Why a separate webhook endpoint** from the existing torlyAI subscription
webhook: both are subscribed to `checkout.session.completed`, but:
- existing webhook filters `session.mode === 'subscription'`
- Visa Master webhook filters `session.mode === 'setup'`
  **AND** `session.metadata.product === 'visa-master'`

Disjoint filter sets → zero interference. Both use the same Stripe
account but distinct webhook signing secrets (env vars
`STRIPE_WEBHOOK_SECRET` vs `STRIPE_VM_WEBHOOK_SECRET`).

---

## 5. Data model (Supabase, migration `026_visa_master.sql`)

```
visa_master_installs                     visa_master_bookings
─────────────────────                    ───────────────────────
id                  uuid PK              id                  uuid PK
install_id          uuid UNIQUE          install_id          uuid → installs.install_id
stripe_customer_id  text                 booking_id          text                  ┐
stripe_email        text                 stripe_payment_intent_id text             │ UNIQUE
status              text                 amount_pence        int                   │ (install_id,
   (active|disputed|cancelled|deleted)   currency            text                  │  booking_id)
created_at          timestamptz          slot_at             timestamptz           ┘
updated_at          timestamptz          centre              text
                                         status              text
                                            (captured|refunded|failed)
UNIQUE (stripe_email) WHERE status='active'  refund_until        timestamptz
   — one active install per email           created_at          timestamptz
                                            updated_at          timestamptz
```

- **RLS enabled, no policies** → service role only. The extension never
  talks to Supabase directly; only `/api/visa-master/*` routes do, via
  `SUPABASE_SERVICE_ROLE_KEY`.
- The `UNIQUE WHERE status='active'` index is the "one Premium per
  email" enforcement (Stripe email = identity). Disputed/cancelled
  rows are kept (audit trail) but don't block re-activation.
- The booking idempotency index makes `/booking/capture` retry-safe
  — duplicate `(install_id, booking_id)` submissions hit the unique
  constraint and the route returns the existing row.

---

## 6. Isolation guarantees vs. existing torlyAI products

A key requirement: shipping Visa Master must not affect the existing
torlyAI subscription/payment flow. The isolation is enforced at six
layers:

| Layer | Pre-existing torlyAI | Visa Master Premium |
|---|---|---|
| **Tables** | `auth.users`, `subscriptions`, `desktop_*`, … | `visa_master_installs`, `visa_master_bookings` |
| **Stripe mode** | `subscription` | `setup` |
| **Stripe metadata filter** | (any, but never `product='visa-master'`) | `metadata.product === 'visa-master'` |
| **Webhook endpoint** | `/api/stripe/webhook` + `STRIPE_WEBHOOK_SECRET` | `/api/visa-master/webhook/stripe` + `STRIPE_VM_WEBHOOK_SECRET` |
| **JWT audience** | `torlyai-desktop` | `visa-master-extension` |
| **Files touched in existing app** | – | None. Visa Master is additive only |

A leak in either direction is structurally impossible: the wrong-mode
session can't be processed by the wrong webhook (mode filter), and the
wrong-audience JWT is rejected by either verifier.

---

## 7. Production infrastructure

### 7.1 Hosting / deploy

| Component | Where | Pipeline |
|---|---|---|
| **Extension** | Chrome Web Store + GitHub Releases (`torlyai/Schengen-master`) | `npm run build` → zip `extension/dist` → CWS upload |
| **Backend** | Vercel (`torlyAI` project, production = `torly.ai`) | git push with `[deploy]` tag in commit subject (per CLAUDE.md guard) |
| **Database** | Supabase (existing torlyAI project) | `supabase db push` of migration `026_visa_master.sql` |
| **Payments** | Stripe (existing torlyAI account, **live mode**) | Webhook configured via Stripe dashboard |

### 7.2 Required env vars (Vercel, production)

Shared with the rest of torlyAI:
- `JWT_PRIVATE_KEY` (RS256, RSA PKCS#8 PEM)
- `JWT_PUBLIC_KEY` (RS256, X.509 SPKI PEM)
- `STRIPE_SECRET_KEY` (live mode)
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

Visa Master–specific (added for this product):
- `STRIPE_VM_WEBHOOK_SECRET` — signing secret of the
  `/api/visa-master/webhook/stripe` Stripe endpoint
- `VITE_VM_BACKEND_BASE` (extension build-time, optional override —
  defaults to `https://torly.ai/api/visa-master`)

### 7.3 Stripe configuration (live)

- **Mode:** live
- **Product / price:** ad-hoc — created per PaymentIntent
  (`amount: 1900`, `currency: 'gbp'`)
- **Webhook endpoint:** `https://torly.ai/api/visa-master/webhook/stripe`
- **Webhook events:** `checkout.session.completed`, `charge.refunded`,
  `charge.dispute.created`, `customer.deleted`
- **Webhook signing secret:** `STRIPE_VM_WEBHOOK_SECRET`
  (stored in Vercel env + macOS Keychain — see §7.5)

### 7.4 Supabase

- Project: same Supabase project as the rest of torlyAI.
- Migration: `026_visa_master.sql` — additive, no edits to existing
  tables.
- Access: service role only. RLS enabled with no policies; the absence
  of policies is intentional (deny-by-default).

### 7.5 Local secret store (developer)

On the developer machine (macOS), secrets are mirrored into Keychain
under the service prefix `torly-vm-*`:

| Keychain entry | Account | Contents |
|---|---|---|
| `torly-vm-webhook-secret-live` | `stripe-webhook` | `whsec_…` signing secret |
| `torly-vm-webhook-endpoint-id-live` | `stripe-webhook` | `we_…` endpoint id |

Vercel env (`.env.local` for dev, Vercel UI for prod) is the source of
truth at runtime; Keychain is the developer's backup so a new laptop
can re-provision without round-tripping the Stripe dashboard.

---

## 8. End-to-end flows

### 8.1 Free user — slot found

```
TLS tab loads ─► content-script detects NO_SLOTS ─► SW state-machine
   ─► badge "•" green ─► (loop) chrome.alarms fires every N min
       ─► content-script re-runs detection
           ─► detector returns SLOT_AVAILABLE
               ─► SW state-machine transitions
                   ├─► chrome.notifications + sound
                   ├─► Telegram push (if enabled)
                   └─► popup updates on next open
```

Zero network requests outside the user's TLS tab + optional Telegram.
torly.ai is **not contacted** in this flow.

### 8.2 Premium activation

```
Popup ─POST /checkout─► server ─► Stripe Checkout URL
   ─► user pays £0 (saves card)
       ─► redirect to torly.ai/visa-master/activated?session_id=…
           ─► ActivatedClient POST /license/activate
               ─► server: validate Setup Intent, upsert install, sign JWT
                   ─► postMessage({jwt}) ─► license-relay content script
                       ─► chrome.runtime.sendMessage(PREMIUM_INSTALL_LICENSE)
                           ─► SW stores JWT, FSM → PREMIUM_ACTIVE
```

### 8.3 Premium booking + capture

```
Free FSM ─► SLOT_AVAILABLE
   ─► booking-fsm.maybeStartBookingOnSlot (eligibility gates pass)
       ─► driveBookingFlow scripts TLS DOM (5 steps within 60s)
           ─► booking-confirmation-detector matches URL + text
               ─► SW receives BOOKING_CONFIRMED
                   ─► backend-client.captureBooking
                       ─► POST /api/visa-master/booking/capture
                           ─► server: off-session PaymentIntent £19
                               ─► DB insert (refund_until = +24h)
                                   ─► extension shows BOOKED + refund CTA
```

### 8.4 Refund

```
User clicks "TLS cancelled it" within 24h
   ─► POST /api/visa-master/booking/refund
       ─► server: stripe.refunds.create
           ─► DB update status=refunded
               ─► extension shows REFUNDED
```

### 8.5 Disputed / chargeback

```
Cardholder disputes via bank
   ─► Stripe fires charge.dispute.created
       ─► /api/visa-master/webhook/stripe receives event
           ─► server: install.status = 'disputed'
               ─► next /license/status poll returns active=false
                   ─► extension drops back to Free tier
```

---

## 9. Trust boundaries — single-page summary

| Actor | Sees | Doesn't see |
|---|---|---|
| torly.ai backend | installId, Stripe email, bookingId, slotAt, centre, JWT | TLS password, polling cadence, DOM, Telegram tokens |
| Stripe | Payment method, email, amount, currency, `metadata.{product, installId, bookingId}` | Anything else |
| Supabase | Same as torly.ai backend (it's the storage) | – |
| The extension (free) | TLS DOM of the current tab | Anything outside the tab |
| The extension (premium) | Same as free + saved TLS creds + license JWT | – |
| Telegram (if user enabled) | "Slot found at <centre>" notification text | TLS creds, license, payment data |

---

## 10. Open architectural items

These are tracked formally in `09-visa-master-premium-prd.md` §17:

1. **`driveBookingFlow` is a stub** — needs an empirical pass against a
   real TLS booking flow before public release. Currently fails-safe
   (no submit) if any selector goes missing.
2. **`injectedFill` selectors are best-guess** — same caveat; must be
   validated against real TLS login markup.
3. **TLS DOM may rev without notice** — both above scripts need a
   detection heartbeat / canary so we know early if TLS changes.
4. **Chinese (zh-CN) translations** for the Premium popup states +
   intro page are still TODO.

---

## 11. Where things change next

- **Extension changes** → `Schengen-visa` repo, `extension/src/…`, rebuild
  with `npm run build`, ship via Chrome Web Store + tag a GitHub Release.
- **Backend route changes** → `torlyAI` repo, `app/api/visa-master/…` and/or
  `lib/visa-master/…`. Commit subject must include `[deploy]` to trigger
  Vercel build.
- **DB schema changes** → new migration file under
  `torlyAI/supabase/migrations/0NN_…sql`, then `supabase db push`.
- **Stripe webhook changes** → Stripe dashboard + rotate
  `STRIPE_VM_WEBHOOK_SECRET` in Vercel env.

If a change spans both repos, write both PRs in the same session and
reference each other's commit SHA — the cross-repo contract surfaces
are: license JWT shape (`shared/license.ts` ↔ `lib/visa-master/jwt.ts`),
endpoint paths + payload shapes (`backend-client.ts` ↔ each `route.ts`),
and the `PREMIUM_INSTALL_LICENSE` postMessage contract
(`ActivatedClient.tsx` ↔ `content/license-relay.ts`).
