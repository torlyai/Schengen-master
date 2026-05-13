# Wireframes: Visa Master Premium — Hi-Fi Handoff

**Document:** 10-visa-master-premium-wireframes.md
**Version:** 1.0
**Date:** 2026-05-13
**Status:** Hi-fi-ready handoff
**Companion to:** [`09-visa-master-premium-prd.md`](./09-visa-master-premium-prd.md)
**Reuses:** [`07-chrome-extension-wireframes.md`](./07-chrome-extension-wireframes.md) (Free-tier wireframes — **do not replace**, extend)
**Target downstream:** Claude design / Figma hi-fi pipeline

---

## 0. Purpose

This file is the **single source of truth** for what every Premium screen looks like inside the existing Visa Master shell. It is intended to be imported into Claude design / Figma for hi-fi mockup generation, so the wireframes deliberately:

- Embed every screen in the actual v1.0.9 popup shell, not an idealised one.
- Reference the live design tokens (colors, fonts, dimensions) from `src/styles/styles.css`.
- Name every component that already exists in `src/popup/shell/` and `src/components/`.
- Mark each new component the designer must produce.
- Avoid inventing UI patterns the shipping codebase does not already use (no new tab strips, no new modal stack, no new icon family).

If a wireframe in this doc disagrees with one in [`09-visa-master-premium-prd.md`](./09-visa-master-premium-prd.md), **this file wins**. The PRD wireframes were drawn before the existing shell was inspected and contain inventions (notably tab strips) that this file corrects.

---

## Table of Contents

1. [What's locked in the current build — DO NOT replace](#1-whats-locked-in-the-current-build--do-not-replace)
2. [Shell anatomy](#2-shell-anatomy)
3. [Design tokens (verbatim from `src/styles/styles.css`)](#3-design-tokens-verbatim-from-srcstylesstylescss)
4. [Free-tier states (recap — already shipping)](#4-free-tier-states-recap--already-shipping)
5. [Premium upgrade nudges (Free states + CTA)](#5-premium-upgrade-nudges-free-states--cta)
6. [Premium setup wizard states](#6-premium-setup-wizard-states)
7. [Premium active states](#7-premium-active-states)
8. [Premium error & recovery states](#8-premium-error--recovery-states)
9. [Web pages — intro, Stripe Checkout, activated](#9-web-pages--intro-stripe-checkout-activated)
10. [Full-tab Settings page — Premium status card](#10-full-tab-settings-page--premium-status-card)
11. [Asset inventory for hi-fi](#11-asset-inventory-for-hi-fi)
12. [Component naming map (existing → reuse, new → design)](#12-component-naming-map-existing--reuse-new--design)
13. [Hi-fi handoff brief](#13-hi-fi-handoff-brief)

---

## 1. What's locked in the current build — DO NOT replace

These elements are shipping in v1.0.9 and are part of the brand surface. Every wireframe below preserves them unchanged. If a hi-fi mockup removes or restyles any of these, that's a regression that must come back for product approval.

| Element | Source | Why it's locked |
|---|---|---|
| Popup width = **360 px** | `styles.css :root width: 360px` | Chrome popup-max practical limit; layout is built on this. |
| **IBM Plex Sans / Mono / Serif** type stack | `styles.css --sans / --mono / --serif` | Brand voice + readability for both EN and 中文. |
| Warm paper palette (`#f6f3ee` paper, `#15140f` ink) | `styles.css :root` | Anti-dark-mode positioning — competitors are all dark. The warm paper is part of the trust narrative. |
| Green/amber/red status triad | `styles.css --green/-amber/-red` | Already mapped to state semantics throughout the SW + content script. |
| Status dot with halo (`.dot--green` + `0 0 0 4px var(--green-soft)`) | `styles.css` | Distinctive at the moment of "● ACTIVE". Carries over to Premium states. |
| Header right-side stack — **[QR popover] [EN/中 toggle] [⋯ More]** | `Popup.tsx:158-178` | Always-on. The QR popover (WhatsApp + WeChat) is the support channel for Chinese users; removing it loses trust signal. |
| Bottom chrome row — **[⚙ Settings] [torly.ai ↗] [v1.0.9]** | `Popup.tsx:75-100` | Pinned via flex. The brand link and version stamp set the open-source-on-GitHub trust frame. |
| Contact QR popover content (WhatsApp + WeChat side-by-side) | `Popup.tsx:36-69` + `public/qrcode/*` | Same images on every state. Hi-fi may restyle the popover but the two QRs and their labels remain. |

---

## 2. Shell anatomy

Every popup screen is a state inside this shell. **Body** is the only swappable region.

```
                        360 px
┌──────────────────────────────────────────────────────────┐  ← .popup
│  ●  State label                  [📷]  [EN/中]  [⋯]      │  ← .popup__hdr   (always)
│      status dot                   QR    lang    more      │
│      (.dot--green/amber/red/grey)                         │
├──────────────────────────────────────────────────────────┤
│                                                          │
│                                                          │
│            STATE-SPECIFIC BODY                           │  ← .popup__body  (per state)
│                                                          │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  [📊] X checks · Y slots          [●] notif: ON          │  ← .popup__ftr   (optional)
├──────────────────────────────────────────────────────────┤
│  [⚙ Settings]   torly.ai ↗            v1.0.9             │  ← .popup__bottom (always)
└──────────────────────────────────────────────────────────┘
```

**Header right-side stack** (visible on every state):
- `📷` — `ContactQrPopover` (`Popup.tsx:36`). Hover/focus reveals a tooltip with WhatsApp + WeChat QR images side-by-side, labels below each.
- `EN/中` — `LangToggle` (`Popup.tsx:120`). One-click switches `uiLang` between `en-GB` and `zh-CN`. Active segment is inked, inactive is muted.
- `⋯` — `popup__hdr-btn` calling `onOpenMore` (default = `openOptionsPage()`). **For Premium users this is rebound** to swap the popup body to the Options state (P-12) instead of opening the full-tab Settings page. Free behaviour unchanged.

**Bottom chrome** (visible on every state, pinned via flex):
- `⚙ Settings` — opens `chrome.runtime.openOptionsPage()`, i.e. the full-tab Settings page at `src/settings/settings.html`. Free + Premium identical.
- `torly.ai ↗` — opens `https://torly.ai/` in a new tab. Mono font, muted ink.
- `v1.0.9` — manifest version, mono font, muted-2 ink (subtler than brand link).

---

## 3. Design tokens (verbatim from `src/styles/styles.css`)

```
/* surface + ink */
--paper:        #f6f3ee
--surface:      #ffffff
--ink:          #15140f
--muted:        #6e6962
--hair:         #e3ddd2
--rule:         #d8d1c2

/* state semantics */
--green:        #1e6f4a   --green-ink: #0f4a30   --green-soft: #e7efe7   --green-hair: #c7d8c9
--amber:        #a86a1e   --amber-soft: #f6ecd9                          --amber-hair: #e5cf9f
--red:          #9b2a2a   --red-soft:   #f5dfdb                          --red-hair:   #e3a89e
--slate:        #4a5560   --slate-soft: #e9ecef

/* shape */
--radius:       8px
--radius-sm:    5px

/* type */
--sans:  'IBM Plex Sans', -apple-system, BlinkMacSystemFont, system-ui, sans-serif
--mono:  'IBM Plex Mono', ui-monospace, SFMono-Regular, monospace
--serif: 'IBM Plex Serif', Georgia, serif

/* layout */
width: 360px (body.vm-popup)
```

**State tone → semantics** (already in use throughout `Popup.tsx` and `App.tsx`):
- `green`  → NO_SLOTS (active monitoring), PREMIUM_ACTIVE, BOOKED
- `amber`  → CLOUDFLARE, LOGGED_OUT, BOOKING_IN_PROGRESS, SETUP_VERIFICATION
- `red`    → BOOKING_FAILED, SETUP_FAILED
- `grey`   → IDLE, PAUSED, LOADING

---

## 4. Free-tier states (recap — already shipping)

These are unchanged from v1.0.9 and live in [`07-chrome-extension-wireframes.md`](./07-chrome-extension-wireframes.md). They are referenced here only so the Premium delta is obvious.

| State | Code path | One-line summary |
|---|---|---|
| `IDLE` | `App.tsx:51` (IdlePlaceholder) | No TLS tab open; CTA to open TLScontact |
| `NO_SLOTS` | `Monitoring.tsx` | Steady-state monitoring; "no slots yet" hero + scan counter |
| `SLOT_AVAILABLE` | `SlotFound.tsx` | Win-state banner; "open tab and book now" CTA |
| `CLOUDFLARE` | `Cloudflare.tsx` | Verification gate detected; wait + retry CTA |
| `LOGGED_OUT` | `LoggedOut.tsx` | TLS session expired; "log back in" CTA |
| `PAUSED` | `Paused.tsx` | User paused; resume CTA |
| `UNKNOWN` | `Unknown.tsx` | Classifier inconclusive; manual classification prompt |

---

## 5. Premium upgrade nudges (Free states + CTA)

The Free experience is unchanged except for two carefully-placed upgrade CTAs. These nudges must NOT make the Free product feel crippled — Free is its own complete product.

### P-1. `SLOT_AVAILABLE` (Free) with "Premium would have booked this" upsell

This is the highest-converting moment in the funnel: the user just had a slot dangled in front of them. The win-state body is unchanged from v1.0.9; the upsell is a single boxed line **below** the primary CTA. Critical: the primary "Open tab and book now" CTA stays first; the upsell never replaces it.

```
┌──────────────────────────────────────────────────────────┐
│  ●  Slot found                   [📷] [EN/中] [⋯]        │
│     pulse · green                                        │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  🚨  SLOT FOUND                                          │
│  London → France · 4 Jun 2026 · 10:30                    │
│  Detected 14 s ago                                       │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │       Open the TLS tab and book now              │    │  ← .btn--primary --block
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  ╭──────────────────────────────────────────────────╮    │
│  │ ★  Premium would have booked this for you.       │    │  ← UpsellCard (NEW)
│  │    £0 now. £19 only if we book.                  │    │     bg: --paper
│  │    [ Tell me more → ]                            │    │     border: 1px --hair
│  ╰──────────────────────────────────────────────────╯    │     radius: --radius
│                                                          │
├──────────────────────────────────────────────────────────┤
│  [📊] 14 checks · 1 slot           [●] notif: ON         │
├──────────────────────────────────────────────────────────┤
│  [⚙ Settings]   torly.ai ↗            v1.0.9             │
└──────────────────────────────────────────────────────────┘
```

**New component:** `UpsellCard` (a single boxed card with a leading ★, two short lines, and a text-style "Tell me more →" link styled as `.btn--ghost`). Background `--paper` so it sits below the white surface and reads as secondary to the primary CTA.

### P-2. `NO_SLOTS` (Free) with a quiet footer upsell

In the steady-state monitoring view, the upgrade prompt is **much** quieter — a one-line link in the footer area. Active users see this dozens of times a day; loud nudges would burn trust.

```
┌──────────────────────────────────────────────────────────┐
│  ●  Watching                    [📷] [EN/中] [⋯]         │
│     dot · green                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Status                                                  │
│  No slots yet — next scan in 4 m 35 s                    │
│                                                          │
│  Target                                                  │
│  Manchester → France  ✓ logged in                        │
│                                                          │
│  37 scans today · 2 slots seen this week                 │
│                                                          │
│  Tip: don't refresh the TLS tab manually — we'll do it.  │
│                                                          │
│  ── ───────────────────────────────────────────────      │
│  Tired of having to race for it?                         │  ← UpgradeLine (NEW)
│  [ Get Premium auto-book — £19 only if we book → ]       │     small font, --muted
│                                                          │
├──────────────────────────────────────────────────────────┤
│  [📊] 37 checks · 0 slots          [●] notif: ON         │
├──────────────────────────────────────────────────────────┤
│  [⚙ Settings]   torly.ai ↗            v1.0.9             │
└──────────────────────────────────────────────────────────┘
```

**New component:** `UpgradeLine` (text-only link with leading muted line; sits above the `.popup__ftr` divider). Visible at most once per popup-open. Does not animate.

---

## 6. Premium setup wizard states

The wizard occupies the popup body. Header + bottom chrome stay visible — even mid-setup the user can switch language or contact support. No tab strip is introduced; each step IS a state in the router.

### P-3. `PREMIUM_SETUP_PREFLIGHT` — Before you start

```
┌──────────────────────────────────────────────────────────┐
│  ●  Setup · before you start    [📷] [EN/中] [⋯]         │
│     dot · slate                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  BEFORE YOU START                                        │
│                                                          │
│  ▸  Pin this tab. Right-click → Pin tab. It will survive │
│     browser restarts and won't be closed by accident.    │
│                                                          │
│  ▸  Keep your laptop plugged in. Monitoring pauses when  │
│     the computer sleeps. We keep the device awake while  │
│     watching, but battery drains and macOS sleeps when   │
│     you close the lid.                                   │
│                                                          │
│  ▸  Be logged in to TLScontact in this browser. Open     │
│     visas-fr.tlscontact.com and confirm the profile      │
│     icon top-right is yours.                             │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │            Continue to setup                     │    │  ← .btn--primary --block
│  └──────────────────────────────────────────────────┘    │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  [⚙ Settings]   torly.ai ↗            v1.1.0             │
└──────────────────────────────────────────────────────────┘
```

### P-4. `PREMIUM_SETUP_STEP_1` — Visa centre + TLS credentials

```
┌──────────────────────────────────────────────────────────┐
│  ●  Setup · step 1 of 4         [📷] [EN/中] [⋯]         │
│     dot · slate                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  STEP 1 OF 4 — Pick your centre and TLS login            │
│                                                          │
│  Visa centre                                             │
│  ┌──────────────────────────────────────────────────┐    │
│  │  Manchester → France                          ▾  │    │  ← Select (NEW)
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  TLScontact email                                        │
│  ┌──────────────────────────────────────────────────┐    │
│  │                                                  │    │  ← TextField (existing)
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  TLScontact password                                     │
│  ┌──────────────────────────────────────────────────┐    │
│  │  ••••••••••••                              👁    │    │  ← PasswordField (NEW)
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  ╭──────────────────────────────────────────────────╮    │
│  │ 🔒  STORED ON YOUR MACHINE — NEVER UPLOADED.     │    │  ← TrustCallout (NEW)
│  │    Email + password live in this extension's     │    │     border-left: 3px --green
│  │    encrypted Chrome storage (AES-GCM). They      │    │     bg: --green-soft (faint)
│  │    never leave your browser; our servers never   │    │     ink: --green-ink
│  │    see them.                                     │    │
│  │    Source: src/shared/crypto.ts                  │    │
│  ╰──────────────────────────────────────────────────╯    │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │                  Continue                        │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  [⚙ Settings]   torly.ai ↗            v1.1.0             │
└──────────────────────────────────────────────────────────┘
```

### P-5. `PREMIUM_SETUP_STEP_2` — Signing in (extension driving TLS tab)

```
┌──────────────────────────────────────────────────────────┐
│  ●  Setup · step 2 of 4         [📷] [EN/中] [⋯]         │
│     pulse · amber                                        │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  STEP 2 OF 4 — Signing you in to TLScontact…             │
│  ◐  (spinner, IBM Plex Sans 13px, muted-2)               │
│                                                          │
│  ╭──────────────────────────────────────────────────╮    │
│  │ ⚠  HANDS OFF THE TLS TAB                          │    │  ← WarningCallout (NEW)
│  │   Visa Master is driving the TLScontact tab     │    │     border-left: 3px --amber
│  │   right now. Don't click, type, or close it     │    │     bg: --amber-soft
│  │   until setup finishes — interfering will       │    │     ink: --ink (high contrast)
│  │   break the flow and force you to restart.      │    │
│  ╰──────────────────────────────────────────────────╯    │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  [⚙ Settings]   torly.ai ↗            v1.1.0             │
└──────────────────────────────────────────────────────────┘
```

### P-6. `PREMIUM_SETUP_STEP_3` — Booking window

```
┌──────────────────────────────────────────────────────────┐
│  ●  Setup · step 3 of 4         [📷] [EN/中] [⋯]         │
│     dot · slate                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  STEP 3 OF 4 — When are you travelling?                  │
│  We'll book the earliest slot that leaves enough buffer  │
│  for your visa to process.                               │
│                                                          │
│  Travel date                                             │
│  ┌──────────────────────────────────────────────────┐    │
│  │  15 / 08 / 2026                              📅  │    │  ← DateField (NEW)
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  Visa processing days before travel                      │
│  ┌──────────────────────────────────────────────────┐    │
│  │  21                                              │    │  ← NumberField (NEW)
│  └──────────────────────────────────────────────────┘    │
│  Most visas finish in ~14 days; the extra week is a      │  ← .hint (NEW small style)
│  buffer. Lower this only if you've confirmed a faster    │     12.5px, --muted, lh 1.55
│  turnaround for your visa type.                          │
│                                                          │
│  Min days notice                                         │
│  ┌──────────────────────────────────────────────────┐    │
│  │  0                                               │    │
│  └──────────────────────────────────────────────────┘    │
│  Don't book sooner than this many days from today.       │
│                                                          │
│  ☐  Include Prime Time and Premium slots                 │
│     TLScontact charges ~£60 surcharge for Prime Time.    │
│     Off by default; we only book standard slots.         │
│                                                          │
│  ✓  We'll accept slots between 2026-05-13 and            │
│     2026-07-25.                                          │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │                  Continue                        │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  [⚙ Settings]   torly.ai ↗            v1.1.0             │
└──────────────────────────────────────────────────────────┘
```

### P-7. `PREMIUM_SETUP_STEP_4` — Ready to activate

```
┌──────────────────────────────────────────────────────────┐
│  ●  Ready to activate           [📷] [EN/中] [⋯]         │
│     dot · green                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  STEP 4 OF 4 — Ready to activate                         │
│                                                          │
│  ╭──────────────────────────────────────────────────╮    │
│  │ Setup complete for Manchester → France           │    │  ← TrustCallout
│  │ (group 26445690).                                │    │     bg: --green-soft
│  │ £0 now — we only charge £19 if we actually      │    │
│  │ book a slot. No subscription. No charge if no   │    │
│  │ slot is found.                                   │    │
│  ╰──────────────────────────────────────────────────╯    │
│                                                          │
│  For comparison: VisaReady is £29 success fee;           │  ← .hint
│  TLSContact Booker is £19.99 / 2 weeks regardless of     │     small, --muted
│  outcome.                                                │
│                                                          │
│  From here, we do the work                               │  ← Section label
│  ▸  24/7 auto-booking — we watch TLS continuously and    │
│     grab the first slot that fits your window.           │
│  ▸  Email + Telegram the moment we book. Your card is    │
│     only charged then.                                   │
│  ▸  One last step on you: pay TLS's visa fee on their    │
│     site to confirm.                                     │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │  Activate — £0 now, £19 only on a booking        │    │  ← .btn--primary --block
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  Stripe saves your card so we can charge £19 if we      │  ← .hint
│  book — nothing is taken today. By activating you       │
│  accept our Terms and Privacy Policy.                    │
│                                                          │
│  Already paid? [ Recheck payment status ]                │  ← .btn--ghost
│                                                          │
├──────────────────────────────────────────────────────────┤
│  [⚙ Settings]   torly.ai ↗            v1.1.0             │
└──────────────────────────────────────────────────────────┘
```

---

## 7. Premium active states

### P-11. `PREMIUM_ACTIVE` — Watching for slots (the Premium NO_SLOTS)

This is the most-seen Premium screen. Mirror the structure of the Free `Monitoring` state, but the body content is denser (countdown + window + recent attempts) and the status dot reads `● ACTIVE` instead of `● Watching`. The `⋯` More button now opens **P-12 Options**, not the full-tab Settings page.

```
┌──────────────────────────────────────────────────────────┐
│  ●  Active                       [📷] [EN/中] [⋯]        │
│     dot · green · pulse                                  │     ⋯ rebinds to Options
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Active — watching for slots                             │
│  Manchester → France · group 26445690                    │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │              Pause scanning                      │    │  ← .btn--secondary --block
│  └──────────────────────────────────────────────────┘    │
│  ☑  Keep device awake while monitoring                   │
│                                                          │
│  Scan loop                                               │
│  Next scan in 4 m 35 s                                   │
│  3 scans today · 11 this week                            │
│                                                          │
│  Booking window                                          │
│  Accepting slots 2026-05-13 → 2026-07-25                 │
│  Include Prime Time: OFF                                 │
│  [ Edit options → ]                                      │  ← opens P-12
│                                                          │
│  Recent detections                                       │
│  • 09:42  No slots                                       │
│  • 09:36  No slots                                       │
│  • 09:30  No slots                                       │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  [📊] 3 checks · 0 slots             [●] notif: ON       │
├──────────────────────────────────────────────────────────┤
│  [⚙ Settings]   torly.ai ↗            v1.1.0             │
└──────────────────────────────────────────────────────────┘
```

### P-12. `PREMIUM_OPTIONS` — Inline options panel (reached via `⋯` More)

This is the body-swap reached by the `⋯` button when Premium is active. It is **not** a tab and **not** a modal — it occupies the popup body just like any other state. A breadcrumb-style "← Back" link in the body top-left returns to `PREMIUM_ACTIVE`.

```
┌──────────────────────────────────────────────────────────┐
│  ●  Active · options             [📷] [EN/中] [⋯]        │
│     dot · green                                          │     ⋯ toggles back to Active
├──────────────────────────────────────────────────────────┤
│  ←  Back to Active                                       │  ← BodyBackLink (NEW)
│                                                          │
│  TIER                                                    │
│  ●  PREMIUM ACTIVE — £19 success fee on next booking     │
│  [ Cancel Premium ]   [ Manage card in Stripe ]          │  ← .btn--ghost · .btn--ghost
│                                                          │
│  BOOKING WINDOW                                          │
│  Travel date      [ 15/08/2026                       📅] │
│  Processing days  [ 21                                 ] │
│  Min days notice  [ 0                                  ] │
│  ✓  Accepting 2026-05-13 → 2026-07-25                    │
│                                                          │
│  BOOKING PREFERENCES                                     │
│  ☐  Include Prime Time and Premium slots                 │
│  ☑  Auto-login when TLS expires my session               │
│  ☑  Keep device awake while monitoring                   │
│                                                          │
│  TLSCONTACT CREDENTIALS                                  │
│  Email      [ jasonxu20@icloud.com                     ] │
│  Password   [ ••••••••••••                          👁  ] │
│  Stored locally, AES-GCM.                                │  ← .hint
│  Source: src/shared/crypto.ts                            │
│  [ Forget TLS credentials ]                              │  ← .btn--ghost --danger
│                                                          │
│  APPLICATION GROUP ID                                    │
│  Group ID   [ 26445690                                 ] │
│  The 8-digit number in your TLS URL (/26091062/).        │  ← .hint
│                                                          │
│  VISA CENTRE                                             │
│  Manchester → France (gbMAN2fr)                          │
│  To change the centre, reset setup from the main view.   │
│                                                          │
│  For notifications, polling cadence, and language, use   │  ← .hint
│  the full Settings page below.                           │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  [⚙ Settings]   torly.ai ↗            v1.1.0             │
└──────────────────────────────────────────────────────────┘
```

**Critical UX note for hi-fi:** there is **no save button** here. Every field is debounced and auto-persisted to `chrome.storage.local` on edit. A small "✓ saved" toast appears top-right of the body for 2 seconds after each successful persist.

### P-13. `PREMIUM_BOOKING_IN_PROGRESS` — Auto-booking active

```
┌──────────────────────────────────────────────────────────┐
│  ●  Booking…                     [📷] [EN/中] [⋯]        │
│     pulse · amber                                        │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ⚡  AUTO-BOOKING IN PROGRESS                             │
│  4 Jun 2026 · 10:30 · Manchester → France                │
│                                                          │
│  ╭──────────────────────────────────────────────────╮    │
│  │ ⚠  HANDS OFF THE TLS TAB                          │    │  ← WarningCallout
│  │    Visa Master is driving the booking right     │    │     bg: --amber-soft
│  │    now. Don't click, type, or close the TLS tab.│    │
│  ╰──────────────────────────────────────────────────╯    │
│                                                          │
│  Step 1 of 3 · Selecting slot                            │
│  ●●○                                                     │  ← Progress (NEW), 3 segments
│  Elapsed 2.1 s · Budget 60 s                             │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  [⚙ Settings]   torly.ai ↗            v1.1.0             │
└──────────────────────────────────────────────────────────┘
```

### P-14. `PREMIUM_BOOKED` — Booking succeeded

```
┌──────────────────────────────────────────────────────────┐
│  ●  Booked                       [📷] [EN/中] [⋯]        │
│     dot · green                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  🎉  SLOT BOOKED                                         │
│  4 Jun 2026 · 10:30 · Manchester → France                │
│  Confirmation: TLS-MAN-26445690-0042                     │
│                                                          │
│  ╭──────────────────────────────────────────────────╮    │
│  │ £19 captured. Receipt emailed.                   │    │  ← TrustCallout
│  │ Receipt: you@example.com                         │    │     bg: --green-soft
│  ╰──────────────────────────────────────────────────╯    │
│                                                          │
│  ⏰  ONE STEP LEFT — pay TLS within 30 minutes            │
│  ┌──────────────────────────────────────────────────┐    │
│  │           Open TLS payment page ↗                │    │  ← .btn--primary --block
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  If TLS cancels this slot within 24 h, we'll refund £19. │  ← .hint
│  [ Slot was cancelled by TLS ]                           │  ← .btn--ghost
│                                                          │
├──────────────────────────────────────────────────────────┤
│  [⚙ Settings]   torly.ai ↗            v1.1.0             │
└──────────────────────────────────────────────────────────┘
```

### P-15. `PREMIUM_BOOKING_FAILED` — Attempt failed, no charge

```
┌──────────────────────────────────────────────────────────┐
│  ●  Active                       [📷] [EN/中] [⋯]        │
│     dot · amber                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Booking attempt failed                                  │
│  4 Jun 2026 · 10:30 — slot taken before we could         │
│  confirm.                                                │
│                                                          │
│  £0 charged. Back to scanning for the next slot.         │
│                                                          │
│  Reason: TLS returned "Slot no longer available" at      │  ← .hint
│  step 2. Total attempt time: 7.3 s.                      │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │              Keep scanning                       │    │  ← .btn--primary --block
│  └──────────────────────────────────────────────────┘    │
│  [ Pause ]                                               │  ← .btn--ghost
│                                                          │
├──────────────────────────────────────────────────────────┤
│  [📊] 4 checks · 0 booked            [●] notif: ON       │
├──────────────────────────────────────────────────────────┤
│  [⚙ Settings]   torly.ai ↗            v1.1.0             │
└──────────────────────────────────────────────────────────┘
```

### P-16. `PREMIUM_REFUND_PROMPT` — Request refund (within 24 h)

```
┌──────────────────────────────────────────────────────────┐
│  ●  Refund                       [📷] [EN/中] [⋯]        │
│     dot · slate                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Refund £19?                                             │
│                                                          │
│  We charged £19 for the booking at 09:42 on 2026-05-14.  │
│  If TLS has cancelled or refused this slot, we'll refund │
│  in full and resume scanning for a new slot.             │
│                                                          │
│  Why was the slot cancelled?                             │
│  ○  TLS released it (no reason given)                    │
│  ○  TLS asked for documents I don't have yet             │
│  ○  Other                                                │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │              Request refund                      │    │  ← .btn--primary --block
│  └──────────────────────────────────────────────────┘    │
│  [ Never mind ]                                          │  ← .btn--ghost
│                                                          │
│  Refunds take 5–10 business days to appear on your card. │  ← .hint
│                                                          │
├──────────────────────────────────────────────────────────┤
│  [⚙ Settings]   torly.ai ↗            v1.1.0             │
└──────────────────────────────────────────────────────────┘
```

---

## 8. Premium error & recovery states

### P-8. `PREMIUM_VERIFICATION_GATE` — Quick check needed (Cloudflare during setup)

Same shell pattern as the Free `CLOUDFLARE` state but reached during the Premium wizard. The user has to wait for TLS's challenge to clear before setup can resume.

```
┌──────────────────────────────────────────────────────────┐
│  ●  Quick check needed           [📷] [EN/中] [⋯]        │
│     dot · amber                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Quick check needed                                      │
│                                                          │
│  TLScontact is showing a verification gate. Wait for it  │
│  to clear (usually 20–30 seconds), then tap Continue.    │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │                Continue                          │    │  ← .btn--primary --block
│  └──────────────────────────────────────────────────┘    │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  [⚙ Settings]   torly.ai ↗            v1.1.0             │
└──────────────────────────────────────────────────────────┘
```

### P-9. `PREMIUM_SETUP_FAILED_RETRY` — Generic retry

```
┌──────────────────────────────────────────────────────────┐
│  ●  Setup couldn't finish        [📷] [EN/中] [⋯]        │
│     dot · red                                            │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Setup couldn't finish                                   │
│                                                          │
│  We couldn't complete sign-in on the first pass.         │
│  TLScontact often asks for a fresh login when an         │
│  existing session is still cached — "Try again" usually  │
│  clears it. If it keeps failing, "Start over" to         │
│  re-check your details.                                  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │                Try again                         │    │  ← .btn--primary --block
│  └──────────────────────────────────────────────────┘    │
│  [ Start over ]                                          │  ← .btn--ghost
│                                                          │
├──────────────────────────────────────────────────────────┤
│  [⚙ Settings]   torly.ai ↗            v1.1.0             │
└──────────────────────────────────────────────────────────┘
```

### P-10. `PREMIUM_SETUP_FAILED_STALE_SESSION` — Manual logout required

```
┌──────────────────────────────────────────────────────────┐
│  ●  Setup couldn't finish        [📷] [EN/中] [⋯]        │
│     dot · red                                            │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Setup couldn't finish                                   │
│                                                          │
│  TLScontact already has someone signed in on this        │
│  browser, and our auto-logout couldn't clear it.         │
│                                                          │
│  Open the TLS tab → click the profile icon top-right →   │
│  choose LOG OUT → then click Try again here.             │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │                Try again                         │    │  ← .btn--primary --block
│  └──────────────────────────────────────────────────┘    │
│  [ Start over ]                                          │  ← .btn--ghost
│                                                          │
├──────────────────────────────────────────────────────────┤
│  [⚙ Settings]   torly.ai ↗            v1.1.0             │
└──────────────────────────────────────────────────────────┘
```

---

## 9. Web pages — intro, Stripe Checkout, activated

These three pages live on `torly.ai` and are full-tab. They are designed in the same palette and type system as the popup (warm paper, IBM Plex Sans/Mono/Serif) so the brand feels continuous from extension → web → back.

### P-17. `torly.ai/premium` — Premium intro tab

Width: 1200 px max, content column 720 px centred. Header is the standard torly.ai site nav.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  [VM] Visa Master       How it works · Pricing · Trust · FAQ · About     │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│                                                                          │
│      Catch your TLS slot — and let us book it for you.                   │
│      ─── IBM Plex Serif 32px, --ink ───                                  │
│                                                                          │
│      Premium is the auto-book tier of Visa Master.                       │
│      Same codebase. Same trust posture. £0 install, £19 only             │
│      when we actually book your slot.                                    │
│                                                                          │
│      ┌────────────────────────┐  ┌────────────────────────┐              │
│      │  FREE  (you have this) │  │  PREMIUM               │              │
│      │  ─ IBM Plex Sans 16 ─  │  │                        │              │
│      │                        │  │                        │              │
│      │  • Detect slots        │  │  • Detect slots        │              │
│      │  • Desktop + Telegram  │  │  • Desktop + Telegram  │              │
│      │  • You book manually   │  │  • Email notifications │              │
│      │                        │  │  • Auto-book the slot  │              │
│      │  £0                    │  │  • Auto-login on TLS   │              │
│      │  forever               │  │    session expiry      │              │
│      │                        │  │                        │              │
│      │                        │  │  £0 now                │              │
│      │                        │  │  £19 only if we book   │              │
│      │  [ I'm on this ]       │  │  [ Start setup → ]     │              │
│      └────────────────────────┘  └────────────────────────┘              │
│         border: 1px --hair         border: 2px --green-ink               │
│         bg: --surface              bg: --paper                           │
│                                                                          │
│      ── How it works ──                                                  │
│      1.  You sign into TLScontact normally in your browser.              │
│      2.  We watch your tab locally — no servers, no shared network.      │
│      3.  When a slot opens that fits your travel window, we book it.    │
│      4.  Stripe charges £19 — only after the booking is confirmed.      │
│      5.  You pay TLS's visa fee on their site to finalise.              │
│                                                                          │
│      ╭──────────────────────────────────────────────────────────────╮    │
│      │ ⚠  TLScontact does not permit automated interactions.        │    │
│      │   Premium uses automation against their terms. We disclose   │    │
│      │   this so you can decide.                                    │    │
│      ╰──────────────────────────────────────────────────────────────╯    │
│                                                                          │
│      ── What changes vs Free? ──                                         │
│      • TLS email + password stored locally, AES-GCM encrypted            │
│        (Free: nothing stored)                                            │
│      • Card on file with Stripe (Free: no billing)                       │
│      • A small licensing API call to api.torly.ai                        │
│        (Free: no servers at all)                                         │
│                                                                          │
│      ── Pricing FAQ (verbatim from PRD §6.6) ──                          │
│      Q.  What if you never find me a slot?                               │
│         The £19 success fee never charges. You owe nothing — we keep    │
│         scanning until you cancel or successfully book.                  │
│                                                                          │
│      Q.  Can I cancel any time?                                          │
│         Yes — from the extension popup. We stop scanning immediately.   │
│         No charges happen unless we've booked a slot for you.            │
│                                                                          │
│      Q.  What if a slot opens but TLS doesn't confirm the booking?       │
│         No charge. The £19 is only captured when TLS confirms the       │
│         appointment.                                                     │
│                                                                          │
│      Q.  What if TLS cancels the slot you booked?                        │
│         We refund the £19 if TLS voids the booking within 24 hours of   │
│         confirmation. After that, the slot is yours and the fee stands. │
│                                                                          │
│      Q.  What if my TLScontact account gets locked?                      │
│         Premium pauses. We won't keep trying. If we haven't booked,     │
│         you owe nothing. If we already booked, the fee stands.          │
│                                                                          │
│      [ Start setup — £0 today ]   [ Stay on Free ]                       │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│  PRODUCT       UK ROUTES                    COMPANY                      │
│  How it works  UK → France  ● live          About                        │
│  Pricing       UK → Germany   soon          Privacy                      │
│  Trust         UK → Belgium   soon          Terms                        │
│  FAQ           UK → Netherlands soon        contact@torly.ai             │
│                                                                          │
│  © 2026 Torly AI Ltd. Not affiliated with TLScontact, the French         │
│  government, or any consulate.                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

### P-18. Stripe Checkout (Stripe-hosted)

We do not design this page — Stripe owns it. Only inputs we control: brand mark, name, success-redirect URL. Hi-fi should mock a stub showing the post-Stripe redirect target, not the Stripe form itself.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ←  [VM] Visa Master                                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Enter payment details                                                 │
│                                                                         │
│   Email      [ you@example.com                                       ]  │
│                                                                         │
│   Card                                                                  │
│   [ 1234 1234 1234 1234              ][ MM/YY ][ CVC ]                  │
│   Cardholder name                                                       │
│   [                                                                  ]  │
│   Country  [ United Kingdom                                       ▾  ]  │
│   Postal code [                                                      ]  │
│                                                                         │
│   ☐  I agree to Visa Master's Terms of Service and Privacy Policy       │
│                                                                         │
│   [             Save — £0 today              ]                          │
│                                                                         │
│   By saving your card, you allow Visa Master to charge £19 only if      │
│   we book a TLS slot for you. Nothing is taken today.                   │
│                                                                         │
│   Powered by Stripe         Terms · Privacy                             │
└─────────────────────────────────────────────────────────────────────────┘
```

### P-19. `torly.ai/activated` — Activation landing

```
┌──────────────────────────────────────────────────────────────────────────┐
│  [VM] Visa Master       How it works · Pricing · Trust · FAQ · About     │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│                                                                          │
│                                                                          │
│                                ✓                                         │
│                       ── 64px green checkmark inside soft circle ──      │
│                                                                          │
│                       Premium activated.                                 │
│                       ── IBM Plex Serif italic 28px, --green-ink ──      │
│                                                                          │
│       Visa Master is now scanning your TLS tab. You can close            │
│       this tab and return to TLScontact.                                 │
│                                                                          │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│  (same site footer as P-17)                                              │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 10. Full-tab Settings page — Premium status card

The existing v1.0.9 Settings page (`src/settings/settings.html`) is **unchanged** for Free users. Premium adds **one** new card at the very top — everything below it is the existing surface.

### P-20. Settings page with Premium status card

```
┌──────────────────────────────────────────────────────────────────────────┐
│  [VM] Visa Master — Settings                                       ✕     │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ╔══════════════════════════════════════════════════════════════════╗    │
│  ║  TIER STATUS — Premium only (hidden for Free)                     ║    │  ← PremiumCard
│  ║                                                                  ║    │     (NEW)
│  ║  ●  PREMIUM ACTIVE — £19 success fee on next booking             ║    │     bg: --green-soft
│  ║  Activated 2026-05-13. Card ending 4242 on file via Stripe.      ║    │     border-left:
│  ║  For booking window + TLS credentials,                           ║    │       4px --green
│  ║  open the popup → click ⋯ → Options.                             ║    │
│  ║                                                                  ║    │
│  ║  [ Manage card in Stripe ↗ ]   [ Cancel Premium ]                ║    │
│  ╚══════════════════════════════════════════════════════════════════╝    │
│                                                                          │
│  ── NOTIFICATIONS ────────────────────────                               │
│  ☑  Desktop notifications                                                │     ↑
│  ☑  Sound on slot-found                                                  │     │ existing
│  ☑  Telegram bot — Bot token [ ••••••• ]   Chat ID [          ]          │     │ v1.0.9
│      [ Send test message ]                                               │     │ surface
│  ☑  Email notifications — Stripe email: you@example.com                  │     │ unchanged
│      (Premium-only; Free users see this disabled)                        │     │
│                                                                          │     │
│  ── POLLING CADENCE ──────────────────────                               │     │
│  ●  Smart  — 2 min inside release windows, 6 min outside                 │     │
│  ○  Aggressive — every 2 min always                                      │     │
│  ○  Conservative — every 10 min always                                   │     │
│                                                                          │     │
│  Release windows (UK local)                                              │     │
│  Window 1: [ 06:00 ] – [ 09:30 ]                                         │     │
│  Window 2: [ 23:30 ] – [ 00:30 ]                                         │     │
│  [ + Add window ]                                                        │     │
│                                                                          │     │
│  ── LANGUAGE ─────────────────────────────                               │     │
│  ●  English      ○  中文 (Simplified)                                    │     │
│                                                                          │     │
│  ── DETECTION TUNING ─────────────────────                               │     │
│  ☑  Multi-month cycling — probe April / May / June automatically         │     │
│  Manual classification prompt: [ Always · Once · Never ]                 │     │
│                                                                          │     │
│  ── ABOUT ────────────────────────────────                               │     │
│  Visa Master v1.1.0 · MIT · github.com/torlyai/Schengen-master           │     │
│  [ Check for updates ]   [ View changelog ]                              │     │
│                                                                          │     │
│  ── DEBUG ────────────────────────────────                               │     │
│  [ Export logs ]   [ Reset state ]                                       │     │
│  Install ID: 35dee5ee-34cc-46d5-a1fb-17a9fb8370fd  [ copy ]              │     │
│                                                                          │     │
│  ── DANGER ZONE (Premium only) ───────────                               │     │
│  [ Delete my account ] — wipes server records + cancels Premium          │     ↓
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 11. Asset inventory for hi-fi

Assets needed for hi-fi mockups. Existing assets are at the listed paths; new assets need to be designed.

### 11.1 Existing — reuse as-is

| Asset | Path in repo | Use sites |
|---|---|---|
| Extension icons (16/32/48/128) | `extension/public/icons/icon-{16,32,48,128}.png` | Manifest action icon, all popups |
| WhatsApp contact QR | `extension/public/qrcode/whatsapp-qr.png` | `ContactQrPopover` header |
| WeChat contact QR | `extension/public/qrcode/wechat-qr.jpeg` | `ContactQrPopover` header |
| State screenshots (en + zh) | `i18n-en-noslots.png`, `i18n-zh-noslots-real.png`, `i18n-zh-slotfound-final.png`, `i18n-zh-welcome.png`, `state-{1..7}-*.png` | Reference for current visual look |
| Settings page screenshot | `settings-fixed.png`, `settings-telegram-final.png` | Reference for the unchanged Settings surface |

### 11.2 New — design for hi-fi

| Asset | Where used | Notes |
|---|---|---|
| `PremiumBadge` icon | Header dot when Premium active, Settings page card | 16px, --green-ink fill, optional small "P" mark |
| `StripeMark` lock icon | P-11 status card, intro tab | 14px, Stripe-style lock |
| Success checkmark (large) | P-19 activation landing | 64px, --green stroke, --green-soft circle bg |
| Success checkmark (small) | P-14 booking-succeeded callout | 20px, --green |
| Lightning bolt | P-13 booking-in-progress header | 16px, --amber |
| 3-segment progress indicator | P-13 step counter | Filled dots: --amber; unfilled: --amber-hair |
| Calendar input glyph | P-6 date field | 14px, --muted; matches Plex Mono |
| Number input stepper arrows | P-6 number fields | --muted; matches Plex Mono |
| Eye / eye-off (password visibility) | P-4 password field | 16px, --muted; toggle on click |
| Comparison-cards layout | P-17 intro tab | Two side-by-side cards, Free border --hair, Premium border --green-ink and bg --paper |

### 11.3 Notes on existing components to reuse

| Component | Source | Note |
|---|---|---|
| `Popup` shell | `src/popup/shell/Popup.tsx` | Wrap every Premium popup state |
| `Footer` polling-summary strip | `src/popup/shell/Footer.tsx` | Re-use as-is for Premium-active states |
| `Button` primary / ghost | `src/components/Button.tsx` | Already styled; do not redesign |
| `Icons` (Poll / More / Gear / QrCode) | `src/components/Icons.tsx` | Add Lightning + Premium + Calendar + Eye to this file |
| `LangToggle` EN/中 pill | `Popup.tsx:120` | Header right; do not move |
| `ContactQrPopover` | `Popup.tsx:36` | Header right; do not redesign |

---

## 12. Component naming map (existing → reuse, new → design)

This table is the contract between the wireframes here and the React code the UI agent will produce.

| Wireframe label | Component | Status | File (proposed) |
|---|---|---|---|
| Popup shell | `Popup` | Existing | `src/popup/shell/Popup.tsx` |
| Header status dot | `dot--{tone}` (CSS) | Existing | `src/styles/styles.css` |
| Header QR popover | `ContactQrPopover` | Existing | `src/popup/shell/Popup.tsx` |
| Header lang pill | `LangToggle` | Existing | `src/popup/shell/Popup.tsx` |
| Header More button | `popup__hdr-btn` (existing); **rebind onClick for Premium** | Existing wiring, new behaviour | `src/popup/shell/Popup.tsx` |
| Bottom chrome | `BottomChrome` | Existing | `src/popup/shell/Popup.tsx` |
| Polling-summary footer | `Footer` | Existing | `src/popup/shell/Footer.tsx` |
| Upsell card (P-1) | `UpsellCard` | New | `src/popup/components/UpsellCard.tsx` |
| Upgrade line (P-2) | `UpgradeLine` | New | `src/popup/components/UpgradeLine.tsx` |
| Trust callout (P-4, P-7, P-14) | `TrustCallout` | New | `src/popup/components/TrustCallout.tsx` |
| Warning callout (P-5, P-13) | `WarningCallout` | New | `src/popup/components/WarningCallout.tsx` |
| Body back link (P-12) | `BodyBackLink` | New | `src/popup/components/BodyBackLink.tsx` |
| Progress 3-segment (P-13) | `StepProgress` | New | `src/popup/components/StepProgress.tsx` |
| Hint text | `.hint` (CSS class) | New | `src/styles/styles.css` |
| Pre-flight checklist (P-3) | `Preflight` (state) | New | `src/popup/states/premium/Preflight.tsx` |
| Setup step 1 (P-4) | `SetupCredentials` | New | `src/popup/states/premium/SetupCredentials.tsx` |
| Setup step 2 (P-5) | `SetupSigningIn` | New | `src/popup/states/premium/SetupSigningIn.tsx` |
| Setup step 3 (P-6) | `SetupBookingWindow` | New | `src/popup/states/premium/SetupBookingWindow.tsx` |
| Setup step 4 (P-7) | `SetupReadyToActivate` | New | `src/popup/states/premium/SetupReadyToActivate.tsx` |
| Premium active (P-11) | `PremiumActive` | New | `src/popup/states/premium/PremiumActive.tsx` |
| Premium options (P-12) | `PremiumOptions` | New | `src/popup/states/premium/PremiumOptions.tsx` |
| Booking in progress (P-13) | `BookingInProgress` | New | `src/popup/states/premium/BookingInProgress.tsx` |
| Booked (P-14) | `Booked` | New | `src/popup/states/premium/Booked.tsx` |
| Booking failed (P-15) | `BookingFailed` | New | `src/popup/states/premium/BookingFailed.tsx` |
| Refund prompt (P-16) | `RefundPrompt` | New | `src/popup/states/premium/RefundPrompt.tsx` |
| Verification gate (P-8) | `VerificationGate` (state) | New | `src/popup/states/premium/VerificationGate.tsx` |
| Setup failed: retry (P-9) | `SetupFailedRetry` | New | `src/popup/states/premium/SetupFailedRetry.tsx` |
| Setup failed: stale (P-10) | `SetupFailedStaleSession` | New | `src/popup/states/premium/SetupFailedStaleSession.tsx` |
| Premium intro page (P-17) | `/premium.html` route | New | `extension/src/premium/premium.tsx` or `torly.ai/premium` |
| Activated landing (P-19) | `/activated` route on `torly.ai` | New | Web only |
| Premium card on Settings (P-20) | `PremiumCard` | New | `src/settings/components/PremiumCard.tsx` |

---

## 13. Hi-fi handoff brief

For the designer producing the hi-fi mockups from this wireframes file.

### 13.1 The brand is already designed — do not invent

This is a **warm-paper, IBM Plex** product that ships on the Chrome Web Store next to dark-themed VisaReady and dark-themed TLSContact Booker. The light, serif-headlined, mono-stamped aesthetic is the brand differentiation. Hi-fi must preserve it across every Premium screen.

If you find yourself reaching for a dark surface, a sans-only stack, or a saturated CTA — stop. Open `i18n-zh-welcome.png` and the existing `state-2-slotfound.png` and check what shipped. The Premium screens read as direct continuations of those, not as a different product.

### 13.2 Three things every popup mockup must show

1. The full header with status dot + QR popover icon + EN/中 toggle + ⋯ More button.
2. The full bottom chrome with ⚙ Settings + torly.ai ↗ + version stamp.
3. The polling-summary footer **only when the state has it** (Free Monitoring and Premium Active have it; setup-wizard states do not).

If any of those three are missing from a hi-fi popup mockup, that mockup is a regression vs v1.0.9 and must be revised.

### 13.3 What "hi-fi" needs to add over these wireframes

| Concern | What to add |
|---|---|
| Micro-spacing | Pad bodies at 16px top / 16px sides, sections separated by 16–20px |
| Typography rhythm | Body 14px; hint 12.5px; section labels 11px uppercase tracked +1; hero numbers in Plex Serif italic |
| Iconography | Replace ASCII glyphs (📷 📊 ⚙ ⋯ ●) with the actual SVG icons from `src/components/Icons.tsx` |
| Empty states | Inside the popup body — when there are no recent detections, no scans yet, etc. |
| Loading skeletons | The 200–400 ms between popup open and SW status response |
| Hover / focus states | All buttons; both QR popover hover and keyboard-focus paths |
| Dark-mode handling | **None at v1.0.** Visa Master is light-only. Reject any "dark variant" request — that's a different product. |
| 中文 layout | Every Premium screen needs a 中文 version. Plex Sans is paired with Source Han Sans SC for Chinese; spacing inside Chinese paragraphs is slightly tighter (lh 1.5 vs 1.55). |

### 13.4 What's out of scope for hi-fi

- The Free-tier states already shipping in v1.0.9. Those have screenshots in the repo root (`state-*.png`, `welcome-*.png`, `settings-fixed.png`). Reuse them. Do not redraw them.
- The Stripe Checkout page (P-18). Stripe owns this surface; we control only brand mark + name + success-redirect URL.
- The Chrome `chrome.notifications` desktop notification cards. The OS owns that surface.
- Telegram messages. Plain text + emoji, no design surface.

### 13.5 Deliverables expected back from hi-fi

1. A Figma file with one component-frame per row of §12 (Component naming map).
2. EN + 中文 variants of every popup state.
3. Light-mode only.
4. Hover and focus variants of every interactive element.
5. PNG exports at 1× and 2× for visual smoke testing in the Chrome popup.
6. A small `tokens.json` (or Figma variables file) confirming the tokens in §3 are referenced symbolically, not duplicated by hex.

### 13.6 What ships first

Per [PRD §18 roadmap](./09-visa-master-premium-prd.md#18-roadmap-and-milestones):

- **M2 (2026-05-27)** needs hi-fi for **P-1, P-2, P-17** — the Free→Premium conversion funnel.
- **M3 (2026-06-03)** needs hi-fi for **P-3 through P-10 + P-19** — the setup wizard + activation landing.
- **M4 (2026-06-10)** needs hi-fi for **P-11 through P-16** — the active Premium states.
- **M6 (2026-06-24)** needs the 中文 variants of all of the above.

Prioritising P-17 (intro tab) and P-1 (slot-found upsell) gets you the highest-leverage screens for early visual review.

---

**End of document.**
