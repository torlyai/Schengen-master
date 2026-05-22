# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this workspace.

## Project Overview

This workspace contains **Visa Master**, a Chrome Manifest V3 extension that watches TLScontact for Schengen visa appointment slots. Two tiers:

| Tier | Price | What it does | Server contact |
|---|---|---|---|
| **Free** | £0 | Slot notification only (desktop + sound + optional Telegram) | **None — 100% local** |
| **Premium** | £19 per successful booking (success fee) | Free + auto-login on logout + auto-book when slot appears + 24h refund window | torly.ai (license + £19 capture only) |

**Architecture doc to read first:** `docs/11-architecture.md`. It is the canonical source for the two-repo system map, the FSMs, payment flow, and trust boundaries.

**Backend companion repo:** `/Users/Jason-uk/AI/AI_Coding/Repositories/torlyAI` — Next.js app at `torly.ai`. The `/api/visa-master/*` routes + `lib/visa-master/*` + Supabase migration `026_visa_master.sql` belong to this product.

## Workspace layout

```
Schengen-visa/
├── README.md / README.zh-CN.md      # User-facing (Chrome Web Store + GitHub)
├── DASHBOARD.md                      # Personal tracker (don't ship)
├── extension/                        # The MV3 extension — see §"Extension layout" below
├── docs/
│   ├── 06-visa-master-chrome-extension-prd.md  # Free-tier PRD
│   ├── 07-chrome-extension-wireframes.md        # Free-tier wireframes
│   ├── 08-vs-alternatives{,.zh-CN}.md           # Competitor comparison
│   ├── 09-visa-master-premium-prd.md            # Premium PRD (decisions locked)
│   ├── 10-visa-master-premium-wireframes.md     # Premium wireframes
│   ├── 11-architecture.md                       # System architecture (read first)
│   ├── 12-premium-backlog.md                    # Release-blocking issues tracker
│   ├── 13-chrome-web-store-submission-prd.md    # CWS submission copy + assets
│   ├── 14-notifications-and-email-prd.md        # Multi-channel notif system (Telegram + email + webhook)
│   ├── 15-directory-submissions-launch-plan.md  # Marketing launch plan
│   ├── 16-vm-launcher-usage-plan.md             # vm-launcher agent usage
│   ├── 17-ops-dashboard-prd.md                  # Admin ops dashboard (install metadata, refund audits)
│   ├── 18-ops-dashboard-wireframes.md           # P-17 wireframes
│   ├── 19-vm-n7-multi-booking-prd.md            # N-7 multi-booking after 24h refund window
│   ├── 20-vm-n8-refund-evidence-prd.md          # N-8 required refund evidence (Tier 1)
│   └── 21-vm-v1.2.0-post-deploy-monitoring-plan.md  # v1.2.0 operational playbook
└── (other family-trip planning docs — unrelated to the extension)
```

**Current release state (2026-05-22):** v1.2.0 is **live on Chrome Web Store** (approved after a 4-day review window; CWS item ID `cpogdllkcpenafboclnidfmmlcnjpbfm`). Auto-update rollout from v1.1.0 → v1.2.0 is in flight (Chrome's default check interval is ~5h, so most users will be on v1.2.0 within 24–48h). See `docs/21-vm-v1.2.0-post-deploy-monitoring-plan.md` §5 (post-approval rollout) + §10 (operational SQL queries) for what to watch over the first week.

## Free vs Premium — the trust boundary (CRITICAL)

The brand promise is local-first. Free tier guarantees, restated everywhere in user-facing copy:

- **Free never reads your TLS password.**
- **Free never sends anything to torly.ai.**
- **Free never makes a network call outside the TLS tab + optional Telegram.**

Premium **relaxes** this with explicit user consent:

| What Premium DOES send to torly.ai | What Premium STILL DOES NOT send |
|---|---|
| `installId` (random UUID) | TLS email / password |
| Stripe customer email | Slot data the user hasn't booked |
| `bookingId` (TLS-format string, on capture) | Polling cadence |
| `slotAt`, `centre` (for receipt + Telegram echo) | DOM contents |
| `refund_evidence_text` (on user-initiated refund only — PRD 20) | Telegram bot tokens |
| `extensionVersion`, `browserName`, `os`, `attributionSource` (on activation — PRD 17) | – |
| Email-event triggers via `/notify/email` (booking_confirmed/failed/refund_issued/auto_login_disabled — PRD 14 N-3b) — extension sends event + metadata only; backend resolves recipient email from `vm_installs.stripe_email` | The user's email address (looked up by backend, never sent by extension) |

**Rules when editing:**
- Do NOT introduce a network call from the Free path. If unsure, search for `getLicense()`/`tier === 'premium'` gates before adding any `fetch()` or `chrome.runtime.sendMessage` that triggers one.
- Do NOT log TLS credentials, even at debug level. The encrypted form (`tlsCreds` in storage) and the plaintext form (`PlaintextTlsCreds`) must never reach `console.*`, Telegram, or any network payload.
- The welcome page i18n (`welcome.no.2`, `welcome.no.4`) scopes the "we never touch credentials" promise to "the Free tier" with a Premium asterisk. Don't widen it back to all-tier.

## Extension layout (`extension/`)

```
extension/
├── manifest.json            # MV3 — version, host perms (TLS + torly.ai), content scripts
├── vite.config.ts           # Multi-entry build: popup, settings, welcome, premium
├── src/
│   ├── background/          # Service worker — the brain
│   │   ├── service-worker.ts        # Message router, alarm receiver, install hook
│   │   ├── state-machine.ts         # FREE FSM: IDLE↔NO_SLOTS, SLOT_AVAILABLE, CLOUDFLARE, LOGGED_OUT, …
│   │   ├── booking-fsm.ts           # PREMIUM FSM: book → capture £19 → 24h refund window → auto-return (N-7)
│   │   ├── scheduler.ts             # chrome.alarms cadence (smart/fixed/release-window)
│   │   ├── badge.ts                 # Toolbar badge config per ExtState
│   │   ├── notifications.ts         # chrome.notifications + sound + tab title
│   │   ├── telegram.ts              # Optional phone push
│   │   ├── webhook.ts               # BYO webhook (PRD 14 §7.9) — both tiers
│   │   ├── email.ts                 # PREMIUM: /notify/email client (PRD 14 N-3b) — fire-and-forget
│   │   ├── tls-auto-login.ts        # PREMIUM: fill+submit on LOGGED_OUT
│   │   ├── backend-client.ts        # PREMIUM: typed wrapper over /api/visa-master/*
│   │   └── update-checker.ts        # GitHub Releases API
│   ├── content/             # Runs inside web pages
│   │   ├── content-script.ts                    # MAIN: tlscontact.com/* — detector + affordance
│   │   ├── detector.ts                          # DOM → ExtState
│   │   ├── booking-confirmation-detector.ts     # PREMIUM: post-book detector
│   │   └── license-relay.ts                     # torly.ai/visa-master/activated — postMessage → SW
│   ├── popup/               # React popup (toolbar)
│   ├── settings/            # Full-page Options
│   ├── welcome/             # First-run onboarding
│   ├── premium/             # Premium intro tab (opened by UPGRADE_TO_PREMIUM)
│   ├── shared/              # Used by all entry points
│   │   ├── states.ts                # ExtState union (Free + 14 Premium variants)
│   │   ├── messages.ts              # Typed Msg union for SW ↔ UI ↔ content
│   │   ├── storage.ts               # chrome.storage.local wrappers
│   │   ├── crypto.ts                # AES-GCM (PBKDF2 from per-install salt) for TLS creds
│   │   ├── license.ts               # JWT validation + storage (aud='visa-master-extension')
│   │   └── target.ts                # parseTlsUrl()
│   └── i18n/                # en + zh-CN
├── public/icons/
└── dist/                    # `npm run build` output — load as unpacked
```

### The four MV3 contexts (they share `chrome.storage.local` as their bus)

| Context | Lives | Survives |
|---|---|---|
| Service worker | Background, ephemeral | Until evicted (~30s idle); re-creates from `chrome.storage.local` on next event |
| Content script | Inside the page DOM | Until tab navigates away |
| Popup | Toolbar window | Until the popup closes |
| Full-page (settings/welcome/premium) | A regular browser tab | Until tab closes |

**Persistence is `chrome.storage.local`.** SW eviction never loses state.

## Dev workflow

```bash
cd extension
npm install
npm run build              # → dist/
# Chrome → chrome://extensions → "Load unpacked" → select dist/

# Watch mode
npm run dev                # rebuilds on save; press the reload button on the extension card
```

**Type-check before every commit:** `npm run typecheck`. The ExtState union and Msg union are exhaustive switches in `badge.ts` and `service-worker.ts` — adding a new state without updating both will fail the build (this is intentional).

## Release workflow

1. Bump `manifest.json` `version` (e.g. `1.1.0` → `1.2.0`).
2. `npm run build` and verify by loading `dist/` unpacked.
3. Zip the build: `(cd extension/dist && zip -rq ../../visa-master-v1.2.0.zip .)`.
4. Tag + push to `torlyai/Schengen-master` (the public release repo): `git tag v1.2.0 && git push origin v1.2.0`.
5. Create the GitHub Release with the ZIP attached: `gh release create v1.2.0 visa-master-v1.2.0.zip --repo torlyai/Schengen-master --notes "..."`.
6. Upload the same ZIP to Chrome Web Store via the dev console.
7. CWS review: 1–3 days typical. v(N-1) stays live throughout.

The "Check for updates" button in Settings (`update-checker.ts`) calls the GitHub Releases API for the latest tag — so the GitHub Release MUST be created for in-extension update notifications to surface to existing users.

**Cross-repo coupling: many releases require a backend deploy first.** If the release introduces new fields on `/api/visa-master/*` request bodies, the torlyAI side must ship + deploy before the extension reaches CWS approval (extensions deploy via CWS review cycle, but old extensions already in the wild keep talking to your backend). Deploy backend → wait for `vercel ls torlyai --prod` to show `● Ready` → then submit extension to CWS.

## Cross-repo: torlyAI deploy gate (`[deploy]` token)

When you merge anything in the torlyAI repo that touches `app/api/visa-master/*`, `app/visa-master/*`, `app/schengen/*`, or `lib/visa-master/*`, the change does NOT reach production automatically.

`vercel.json` in torlyAI has an `ignoreCommand` that **cancels every deploy whose commit message lacks the literal token `[deploy]`**:

```jsonc
"ignoreCommand": "if [[ \"$VERCEL_GIT_COMMIT_MESSAGE\" == *\"[deploy]\"* ]]; then exit 1; else exit 0; fi"
```

(Vercel exit-code semantics are inverted: `exit 1` = proceed, `exit 0` = skip. The token means "proceed".)

**The trap:** the GitHub PR page shows the Vercel check as ✅ success even when the deploy was skipped, because Vercel reports "Canceled" as a successful skip rather than a failure. PRs #21 and #22 both squash-merged and were silently un-deployed until a follow-up `chore(deploy): trigger [deploy]` empty commit was pushed.

**What to do after merging a cross-repo PR:**

1. Edit the squash-merge commit message in the GitHub PR UI to append `[deploy]` *before* clicking "Confirm squash and merge". The default `feat(...): … (#NN)` line is what Vercel sees, so the token has to live there.
2. If you forgot (or the merge already happened): push an empty trigger commit on `main`:
   ```bash
   cd /Users/Jason-uk/AI/AI_Coding/Repositories/torlyAI
   git checkout main && git pull
   git commit --allow-empty -m "chore(deploy): trigger [deploy]"
   git push
   ```
3. Verify by running `vercel ls torlyai --prod | head -5` and confirming the latest entry shows `● Ready` (not `● Canceled`). The merge commit SHA must match the one you just pushed.

**Why the gate exists:** the torlyAI repo holds multiple products (Schengen extension backend, Innovator Founder assistant, WordPress proxy, marketing pages). The gate prevents every typo-fix commit from rebuilding the production app and disturbing in-flight feature work; only intentional `[deploy]`-tagged commits ship.

## Backend contract with torly.ai (Premium)

When editing **anything** that crosses to the server, also update the backend side in the torlyAI repo and reference both commits. The cross-repo contract surfaces are:

| Boundary | Extension side | Backend side |
|---|---|---|
| License JWT shape | `src/shared/license.ts` | `lib/visa-master/jwt.ts` |
| Endpoint paths + payloads | `src/background/backend-client.ts` | `app/api/visa-master/*/route.ts` |
| Activation postMessage | `src/content/license-relay.ts` | `app/visa-master/activated/ActivatedClient.tsx` |
| Email events (PRD 14 N-3b) | `src/background/email.ts` | `app/api/visa-master/notify/email/route.ts` + `lib/visa-master/notifications.ts` |
| Refund evidence (PRD 20) | `src/popup/states/premium/RefundPrompt.tsx` | `app/api/visa-master/booking/refund/route.ts` (column `visa_master_bookings.refund_evidence_text`) |
| Install metadata (PRD 17) | `src/background/backend-client.ts` `activateLicense()` | `app/api/visa-master/license/activate/route.ts` |

JWT contract:
- Audience MUST be `visa-master-extension` (the desktop torlyAI license uses `torlyai-desktop` and shares the same signing key — the audience check is what keeps them apart).
- Signed RS256 with `JWT_PRIVATE_KEY`; verified with `JWT_PUBLIC_KEY`.
- Extension does **structural** validation only (`iss`/`aud`/`exp`/`tier`). Liveness/revocation is via `/api/visa-master/license/status?installId=…` polled ~1×/24h.

Activation flow: **always use `?session_id={CHECKOUT_SESSION_ID}` in Stripe Checkout's `success_url`, NEVER `{SETUP_INTENT_ID}`** — Stripe only substitutes the former. The `/license/activate` route accepts either `sessionId` (preferred, resolves session → setup_intent) or `setupIntentId` (legacy / manual recovery). The route also self-heals SetupIntents that landed with `customer:null` by creating a Customer from `session.customer_details.email`. This combined flow shipped 2026-05-18 to recover Visa Master's first paid user from a launch-night activation bug; do not regress.

Base URL: `https://torly.ai/api/visa-master`. Override at build time with `VITE_VM_BACKEND_BASE` (defined in `backend-client.ts`).

## Critical files — do not break these contracts

- `src/shared/states.ts` — `ExtState` is the discriminator everywhere. Adding a variant requires updating `badge.ts` config + `popup.tsx` router + `service-worker.ts` switches. The compiler will tell you what's missing.
- `src/shared/messages.ts` — `Msg` is the SW ↔ UI ↔ content bus. Same exhaustiveness rule.
- `src/shared/storage.ts` — the keys (`settings`, `state`, `target`, `stats`, `bookingWindow`, `tlsCreds`, `installSalt`, `vmLicense`, `installId`, `webhookInstallId`, plus booking-FSM-owned: `activeBooking`, `previousBooking`, `lastBookedAt`) are read by multiple contexts. Renaming any breaks installed users on upgrade. Add new keys instead of repurposing. Notes: `installId` is the Premium-tier identifier disclosed to torly.ai; `webhookInstallId` is a SEPARATE anonymous UUID used only by the BYO webhook channel so Free users enabling webhook never reveal an identifier we can correlate with anything else. `activeBooking` holds the current booking inside the 24h refund window; `previousBooking` holds the most recent captured booking after the window has expired (N-7 archive).
- **`chrome.alarms` names** — `POLL_ALARM` (scheduler), `AUTOSTOP_ALARM` (cloudflare/logged-out timeout), `VM_BOOKING_TIMEOUT` (60s booking budget), `VM_REFUND_WINDOW_EXPIRED` (N-7 24h auto-return). All alarms survive SW eviction and are wired in `service-worker.ts`'s `chrome.alarms.onAlarm.addListener`. Adding a new alarm = add to that switch + the cleanup paths.
- `manifest.json` host permissions — the only domains we touch are `*.tlscontact.com` and `torly.ai`. Don't add a third without updating PRD §11 and the welcome i18n promise list.

## Known open items

**Pre-existing risks (carried from v1.0/v1.1, not regressed by v1.2.0):**
- `driveBookingFlow()` in `background/booking-fsm.ts` is **a stub**. Needs empirical validation against a real TLS booking page. Fails-safe (no submit) on any missing selector.
- `injectedFill()` selectors in `background/tls-auto-login.ts` are **best-guess**. Same caveat.
- `extension/test-fixtures/tls-dom/` contains `.keep` placeholders only — **no real TLS HTML has ever been captured.** Detection logic has no automated coverage; validated only by empirical production observation. See `docs/21-vm-v1.2.0-post-deploy-monitoring-plan.md` §7 for the planned remediation.
- 中文 (zh-CN) translations are partial — Premium popup states have placeholder translations added during v1.2.0 (need native-speaker review).

**v1.2.0 deferred (PRD 14 N-3b "out of scope" list):**
- Popup P-12 "Send test email" button UI not wired. `testEmailConnection()` exists in `email.ts` but no UI calls it — verifiable from SW console only.
- `license-watch.ts` not built. `vm_license_expiring` + `vm_license_deactivated` email events have no client-side triggers. Backend cron could still fire them.
- Per-event email opt-out UI in Settings not built. Premium users get all 4 wired email types automatically.

**v1.2.0 deferred (PRD 20 Tier 2):**
- TLS-page programmatic verification of refund cancellations. T1 (required evidence text) shipped; T2 (content script reads TLS appointments page DOM) deferred to a future PR — only worth doing if fraud volume warrants the engineering.

## Quick references

- **Architecture:** `docs/11-architecture.md`
- **Premium PRD:** `docs/09-visa-master-premium-prd.md`
- **Premium wireframes:** `docs/10-visa-master-premium-wireframes.md`
- **v1.2.0 PRDs:** `docs/19` (N-7 multi-booking) · `docs/20` (N-8 refund evidence) · `docs/14` (N-3b email) · `docs/17` (install metadata)
- **v1.2.0 monitoring plan:** `docs/21-vm-v1.2.0-post-deploy-monitoring-plan.md` (CWS review window through T+30d)
- **Premium backlog:** `docs/12-premium-backlog.md`
- **Backend repo:** `/Users/Jason-uk/AI/AI_Coding/Repositories/torlyAI` (search `app/api/visa-master`)
- **Public release repo:** `https://github.com/torlyai/Schengen-master`
