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
│   └── 11-architecture.md                       # System architecture (read first)
└── (other family-trip planning docs — unrelated to the extension)
```

## Free vs Premium — the trust boundary (CRITICAL)

The brand promise is local-first. Free tier guarantees, restated everywhere in user-facing copy:

- **Free never reads your TLS password.**
- **Free never sends anything to torly.ai.**
- **Free never makes a network call outside the TLS tab + optional Telegram.**

Premium **relaxes** this with explicit user consent:

| What Premium DOES send to torly.ai | What Premium STILL DOES NOT send |
|---|---|
| `installId` (random UUID) | TLS email / password |
| Stripe customer email | Slot data |
| `bookingId` (TLS-format string, on capture) | Polling cadence |
| `slotAt`, `centre` (for receipt + Telegram echo) | DOM contents |
| – | Telegram bot tokens |

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
│   │   ├── booking-fsm.ts           # PREMIUM FSM: book → capture £19 → refund window
│   │   ├── scheduler.ts             # chrome.alarms cadence (smart/fixed/release-window)
│   │   ├── badge.ts                 # Toolbar badge config per ExtState
│   │   ├── notifications.ts         # chrome.notifications + sound + tab title
│   │   ├── telegram.ts              # Optional phone push
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

1. Bump `manifest.json` `version` (e.g. `1.0.9` → `1.1.0`).
2. `npm run build` and verify by loading `dist/` unpacked.
3. Zip the build: `(cd dist && zip -r ../visa-master-v1.1.0.zip .)`.
4. Tag + push to `torlyai/Schengen-master` (the public release repo): `git tag v1.1.0 && git push --tags`.
5. Upload the ZIP to Chrome Web Store.
6. Attach the same ZIP to the GitHub Release (CI is configured to bundle contact-QR images).

The "Check for updates" button in Settings calls the GitHub Releases API for the latest tag.

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

JWT contract:
- Audience MUST be `visa-master-extension` (the desktop torlyAI license uses `torlyai-desktop` and shares the same signing key — the audience check is what keeps them apart).
- Signed RS256 with `JWT_PRIVATE_KEY`; verified with `JWT_PUBLIC_KEY`.
- Extension does **structural** validation only (`iss`/`aud`/`exp`/`tier`). Liveness/revocation is via `/api/visa-master/license/status?installId=…` polled ~1×/24h.

Base URL: `https://torly.ai/api/visa-master`. Override at build time with `VITE_VM_BACKEND_BASE` (defined in `backend-client.ts`).

## Critical files — do not break these contracts

- `src/shared/states.ts` — `ExtState` is the discriminator everywhere. Adding a variant requires updating `badge.ts` config + `popup.tsx` router + `service-worker.ts` switches. The compiler will tell you what's missing.
- `src/shared/messages.ts` — `Msg` is the SW ↔ UI ↔ content bus. Same exhaustiveness rule.
- `src/shared/storage.ts` — the keys (`settings`, `state`, `target`, `stats`, `bookingWindow`, `tlsCreds`, `installSalt`, `vmLicense`, `vmInstallId`) are read by multiple contexts. Renaming any breaks installed users on upgrade. Add new keys instead of repurposing.
- `manifest.json` host permissions — the only domains we touch are `*.tlscontact.com` and `torly.ai`. Don't add a third without updating PRD §11 and the welcome i18n promise list.

## Known open items (tracked in PRD §17)

- `driveBookingFlow()` in `background/booking-fsm.ts` is **a stub**. Needs empirical validation against a real TLS booking page before public release of Premium. Fails-safe (no submit) on any missing selector.
- `injectedFill()` selectors in `background/tls-auto-login.ts` are **best-guess**. Same caveat.
- 中文 (zh-CN) translations for all Premium popup states + the intro page are TODO.

## Quick references

- Architecture: `docs/11-architecture.md`
- Premium PRD: `docs/09-visa-master-premium-prd.md`
- Premium wireframes: `docs/10-visa-master-premium-wireframes.md`
- Backend repo: `/Users/Jason-uk/AI/AI_Coding/Repositories/torlyAI` (search `app/api/visa-master`)
- Public release repo: `https://github.com/torlyai/Schengen-master`
