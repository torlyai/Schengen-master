# Schengen-master

> Read this in: **English** · [中文](README.zh-CN.md)
>
> Built by [**Torly AI**](https://torly.ai) — we build visa-application AI
> assistants. The Schengen Visa Master agent is open source; our UK Innovator
> Founder visa AI-assistant is a related, separate project.

An open-source **toolkit + templates** for preparing a family Schengen visa
application. Ships two things in one repository:

1. **A privacy-first Chrome extension** — *Visa Master Appointment Watcher* —
   that watches your TLScontact appointment page and notifies you the instant
   a slot opens. Runs entirely in your own browser; no credentials leave the
   device.
2. **A documentation template set** — skeletal templates for the application
   docs every family maintains *locally* (family profile, master action plan,
   itinerary, status dashboard, audit log), plus the product specs and
   platform design notes behind the extension.

> **Privacy by design.** The repository is intentionally **template-only**.
> No real names, addresses, dates, document numbers, or itinerary specifics
> live here — concrete data is filled in by each user on their own machine
> and stays local via the deny-by-default `.gitignore`.
>
> **Status:** Extension v1.0.0 ships as a pre-built ZIP on the
> [Releases page](https://github.com/torlyai/Schengen-master/releases/latest)
> — **no Node / no terminal / no build step needed** for end-user install.
> Chrome Web Store listing is not live yet, so installation is still
> "Load unpacked" (with Developer mode on).

---

## Table of contents

- [What's in this repository](#whats-in-this-repository)
- [Repository structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
  - [Path A — Use the templates for your own application](#path-a--use-the-templates-for-your-own-application)
  - [Path B — Install the pre-built extension (recommended)](#path-b--install-the-pre-built-extension-recommended)
  - [Path C — Open the workspace in Obsidian (optional)](#path-c--open-the-workspace-in-obsidian-optional)
  - [Path D — Develop the extension](#path-d--develop-the-extension)
- [Configuration](#configuration)
- [Privacy & data handling](#privacy--data-handling)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## What's in this repository

| Area | Purpose |
| --- | --- |
| `extension/` | Chrome MV3 extension source (TypeScript + React + Vite). Watches TLScontact, raises notifications when a slot is detected. |
| `docs/templates/` | Skeleton templates with `{{PLACEHOLDER}}` tokens — copy locally, fill in, **don't** commit. See [`docs/templates/README.md`](docs/templates/README.md). |
| `docs/06-visa-master-chrome-extension-prd.md` | Product spec for the Chrome extension. |
| `docs/07-chrome-extension-wireframes.md` | Screen-by-screen wireframes for the extension. |
| `platform/` | Higher-level platform design — competitive landscape, architecture, feature spec, privacy framework. |
| `privacy/GUARDRAILS.md` | The "no PII in git" contract — read before contributing or committing. |
| `forms/`, `appointments/`, `insurance/` | **Always git-ignored.** Where you keep your own filled letters, booking confirmations and insurance certificates locally. Empty in the repo by design. |
| `Term-Dates-*.pdf` | Public UK school term dates — the only PDFs allowed into git, allow-listed in `.gitignore`. |

### Personal docs are kept local-only

The author's *concrete* worked example — family profile, itinerary, master
action plan, document checklist, status dashboard, audit log, country-specific
research notes — lives on the maintainer's local disk and is denied by name
in `.gitignore`. The community gets the **templates**, not someone else's
private application file.

---

## Repository structure

```
Schengen-master/
├── README.md                       ← you are here
├── LICENSE                         ← MIT
├── .gitignore                      ← deny-by-default privacy firewall
├── Term-Dates-2025-2026.pdf        ← public reference (UK school terms)
├── Term-Dates-2026-2027.pdf        ← public reference (UK school terms)
│
├── docs/
│   ├── 06-visa-master-chrome-extension-prd.md   ← extension product spec
│   ├── 07-chrome-extension-wireframes.md        ← extension wireframes
│   └── templates/                  ← copy locally, fill in, do NOT commit
│       ├── README.md
│       ├── family-profile.template.md
│       ├── master-action-plan.template.md
│       ├── itinerary.template.md
│       ├── dashboard.template.md
│       └── audit-log.template.md
│
├── extension/                      ← Chrome MV3 extension (TS + React + Vite)
│   ├── manifest.json               ← single source of truth for entry points
│   ├── package.json
│   ├── vite.config.ts
│   ├── public/                     ← static assets, icons
│   ├── scripts/                    ← icon generator etc
│   └── src/
│       ├── background/             ← service worker, state machine, scheduler
│       ├── content/                ← detector that runs on *.tlscontact.com
│       ├── popup/                  ← extension popup UI
│       ├── settings/               ← settings page UI
│       ├── welcome/                ← first-run welcome page
│       ├── components/             ← shared React components
│       ├── i18n/                   ← en / zh translations
│       ├── hooks/                  ← React hooks
│       ├── shared/                 ← typed message contract (UI ↔ SW)
│       └── styles/                 ← CSS
│
├── platform/                       ← system-level docs (architecture, etc.)
│   ├── architecture/
│   ├── features/
│   ├── integrations/
│   ├── research/
│   └── privacy/
│
├── privacy/
│   └── GUARDRAILS.md               ← READ THIS BEFORE COMMITTING
│
├── forms/                          ← gitignored (your filled letters)
├── appointments/                   ← gitignored (your bookings)
└── insurance/                      ← gitignored (your policy docs)
```

> **Files you'll create locally** (all ignored by `.gitignore`):
> `DASHBOARD.md`, `visa-workflow.html`, `docs/00-family-profile.md`,
> `docs/01-…-visa-requirements.md`, `docs/02-document-checklist.md`,
> `docs/03-appointment-booking-guide.md`, `docs/04-travel-insurance-guide.md`,
> `docs/05-master-action-plan.md`, `docs/06-itinerary-locked.md`,
> `docs/07-bookings-research.md`, `privacy/audit-log.md`.

---

## Prerequisites

You only need the bits relevant to the install path you pick.

| Component | Requirement | Verify with |
| --- | --- | --- |
| Git | any recent version | `git --version` |
| Node.js | **≥ 20.0** (the extension uses Vite 5 and `@crxjs/vite-plugin` v2) | `node --version` |
| npm | bundled with Node 20+ | `npm --version` |
| Chrome / Chromium | **≥ 110** (Manifest V3) | `chrome://version` |
| Obsidian *(optional)* | latest stable, only if you want the vault UX | — |

If you don't have Node 20, install via [nvm](https://github.com/nvm-sh/nvm):

```sh
nvm install 20
nvm use 20
```

---

## Installation

### Path A — Use the templates for your own application

If you want to prepare your own Schengen application using the same
templates:

```sh
git clone https://github.com/torlyai/Schengen-master.git
cd Schengen-master
```

1. Read `privacy/GUARDRAILS.md` — the one-page contract that keeps your
   data off git.
2. Browse `docs/templates/` and copy the templates you want to their
   target paths (each template's frontmatter says where to copy it to).
3. Fill in the `{{PLACEHOLDER}}` tokens with your own data.
4. **Never commit the filled copies.** The repo's `.gitignore` already
   denies the canonical target paths, so as long as you don't rename
   the files you can't accidentally publish them.

---

### Path B — Install the pre-built extension (recommended)

**No Node, no terminal, no build step.** This is the path for normal users.
Total install time: ~2 minutes.

**Step 1 — Download the ZIP**

Open the [latest release page](https://github.com/torlyai/Schengen-master/releases/latest)
and download the asset named `visa-master-v<version>.zip` (e.g.
`visa-master-v1.0.0.zip`).

If you don't see an "Assets" section, click "Show all" / the disclosure
triangle just below the release notes.

**Step 2 — Unzip it**

Double-click the downloaded ZIP. macOS and Windows will both auto-extract.
You'll get **one folder** named `visa-master-v<version>/`.

Remember where it lives (e.g. `~/Downloads/visa-master-v1.0.0/`). Chrome
will keep loading the extension from this exact folder, so don't delete or
move it after install — if you do, the extension will stop working until
you re-add it.

**Step 3 — Open Chrome's Extensions page**

Type `chrome://extensions` into the Chrome address bar and press Enter.

**Step 4 — Turn on Developer mode**

In the top-right corner of the Extensions page, flip the **Developer mode**
toggle ON. Three new buttons will appear — *Load unpacked*, *Pack extension*,
*Update*.

> **Why Developer mode?** Chrome requires it for any extension that's not
> from the Chrome Web Store. Visa Master is open source and pre-built on
> GitHub Actions from the public source code — but until we publish to the
> Chrome Web Store, you're loading it from a local folder, and Chrome
> calls that "developer mode" regardless of who built the ZIP.

**Step 5 — Load the unpacked extension**

Click **Load unpacked**. In the file picker, navigate to and select the
`visa-master-v<version>/` folder from Step 2 (the folder itself, not any
file inside it). Click *Open* / *Select Folder*.

The extension now appears as a card on the Extensions page and as an icon
in your Chrome toolbar (you may need to click the puzzle-piece icon and
*pin* it). A welcome tab opens automatically.

**Step 6 — First run**

In the welcome tab, pick your language (English / 中文), then follow the
in-page guidance:

1. Open your TLScontact appointment page in another tab and log in.
2. Return to the welcome tab — the extension auto-detects the watched tab
   and the toolbar badge turns green.
3. Open the popup to confirm the polling schedule and notification settings
   (defaults: poll every 2 min inside the configured release windows, every
   6 min outside; UK local time).

Once monitoring is on, you can leave Chrome running in the background. When
a slot is detected the extension shows a desktop notification, swaps the
tab title/favicon to ⚠ red, and (optionally) plays a sound.

> **Not on the right page?** If you click the extension while on a
> non-watched page (Idle popup) or on a TLS sub-page the extension doesn't
> recognise (Unknown popup), the popup leads with a green
> **"Go to my appointment page"** button — one click takes you to your
> saved target URL, or to the TLS landing page if you haven't set one yet.

**Updating to a new version**

When a new release ships:

1. Re-download the new ZIP from the [Releases page](https://github.com/torlyai/Schengen-master/releases/latest).
2. Unzip it. You'll get a folder with a new version suffix (e.g.
   `visa-master-v1.0.1/`).
3. On `chrome://extensions`, click the **reload icon** on the extension
   card — Chrome re-reads the original folder. To switch to the new
   version's folder, click **Remove** on the existing card, then **Load
   unpacked** the new folder. Your settings persist via
   `chrome.storage.local` and survive the reinstall.

**Step 7 (optional) — Phone notifications via Telegram**

Out of the box the extension fires *desktop* notifications. If you want slot
alerts on your **phone** so you can step away from the laptop, the extension
ships a built-in Telegram channel:

1. Open **Settings → Phone notifications (Telegram)** and flip the toggle on.
2. Follow the 5-step wizard — it walks you through install, bot creation,
   pasting the token, messaging your bot, and getting your Chat ID.
3. Hit **Send test message**. Your phone should ping within a couple of
   seconds.

Total setup time: ~2–3 minutes. Step 1 of the wizard includes download links
for iOS / Android / Desktop / Web Telegram clients, and step 2 deep-links
straight to **@BotFather** so you don't have to hunt for it.

What gets sent to Telegram:

| Event | Sent when |
|---|---|
| **Slot found** | Always, when Telegram is enabled. |
| **Cloudflare check needed** / **Session expired** | Only if you enable the *also alert me on blockers* toggle. |
| **Monitoring started / resumed** | Only if you enable the *ping me when monitoring starts* toggle. |

Privacy: each message contains the centre name, country code, subject code,
and a timestamp — never your TLScontact login, cookies, URLs, passport
number, or any form-field content. Token + chat ID are stored in
`chrome.storage.local`. See PRD Appendix A for the full posture.

---

### Path C — Open the workspace in Obsidian (optional)

The documentation set is designed to be browsed as an Obsidian vault — the
`.obsidian/` directory is committed (workspace state and caches are
gitignored, but plugin configuration is preserved).

1. Install [Obsidian](https://obsidian.md/) if you don't have it.
2. **Open folder as vault** → select the cloned `Schengen-master/` folder.
3. Trust the author when prompted (community plugins are read-only here).
4. Start at `docs/templates/README.md` to see the available templates.
5. Once you've copied a template (e.g. to `DASHBOARD.md`), Obsidian will
   pick it up automatically — and `.gitignore` will keep your filled copy
   out of git.

Useful pre-configured plugins:

| Plugin | What it does |
| --- | --- |
| Dataview | Lets `DASHBOARD.md` query the documents. |
| Tasks | Tracks the checklists in `05-master-action-plan.md`. |
| Calendar | Visualises milestone dates. |
| Kanban | Boards for the application stages. |

---

### Path D — Develop the extension

```sh
cd extension
npm install
npm run typecheck    # tsc --noEmit, must pass clean
npm run dev          # vite dev with HMR
npm run build        # one-shot production build into dist/
npm run icons        # regenerate placeholder icons
```

After `npm run dev`, reload the extension on `chrome://extensions` to pick
up changes. The service worker reload is automatic; content script and UI
changes need an explicit reload of the host page.

Source-level architecture is documented in `extension/README.md`. The short
version:

```
content-script  →  service-worker  →  badge / notifications
   (detector)       (state machine,
                     scheduler, SW
                     message router)
```

The tunable detector classification rule is in
`extension/src/content/detector.ts` — search for `TUNABLE:`.

---

## Configuration

The extension is configured entirely in-browser via the **Settings** page
(right-click the toolbar icon → *Options*). There are no environment
variables, no `.env` files, no remote configuration server.

Settings are persisted in `chrome.storage.local` (cleared if you uninstall
the extension). Key options:

| Setting | Default | Notes |
| --- | --- | --- |
| Polling mode | `smart` | `smart` uses release windows; `aggressive` polls every 2 min always; `relaxed` every 10 min. |
| Release windows | 06:00–09:30 + 23:30–00:30 UK time | When TLScontact historically releases new slots. |
| Notification sound | on | Desktop notification fires regardless. |
| Tab title swap | on | The watched tab's title changes to ⚠ + audible bell character. |
| Language | auto | English / 中文. |
| Phone notifications (Telegram) | off | Opt-in. Setup wizard inside Settings — see Step 6 above. |
| Also alert on Cloudflare / logged-out | off | Telegram pings you when monitoring gets blocked. |
| Ping me when monitoring starts | off | Confirmation message after the extension begins watching. |

---

## Privacy & data handling

This project takes privacy seriously — see
[`privacy/GUARDRAILS.md`](privacy/GUARDRAILS.md) for the full contract.

**What stays in git:**

- Templates with `{{PLACEHOLDER}}` tokens (`docs/templates/`).
- Extension source code.
- Product specs and platform design notes (no application-level personal data).
- Public reference data (UK school term PDFs, allow-listed in `.gitignore`).

**What is always git-ignored:**

- Personal application docs by canonical path: `DASHBOARD.md`,
  `visa-workflow.html`, `docs/00-family-profile.md`,
  `docs/01-france-visa-requirements.md`, `docs/01-italy-visa-requirements.md`,
  `docs/02-document-checklist.md`, `docs/03-appointment-booking-guide.md`,
  `docs/04-travel-insurance-guide.md`, `docs/05-master-action-plan.md`,
  `docs/06-itinerary-locked.md`, `docs/07-bookings-research.md`,
  `privacy/audit-log.md`.
- `forms/`, `appointments/`, `insurance/` — folders that, by intent, hold
  filled letters, booking confirmations and policy docs.
- All images (`*.png`, `*.jpg`, `*.heic`, …) — so passport scans cannot be
  accidentally committed.
- All Office documents and PDFs (except `Term-Dates-*.pdf`).
- All archives (`*.zip`, `*.tar.gz`, …).
- All `.env` files, keys, certificates.
- Browser automation snapshots (`.playwright-mcp/`).
- Build artefacts (`node_modules/`, `dist/`).

The `.gitignore` follows a **deny-by-default** strategy: if you forget to
think about a new file type, the default is "exclude" so accidents fail
safe. To track a new file type you must consciously un-ignore it.

**What the extension does NOT do:**

- Read your password.
- Auto-book an appointment for you.
- Send raw page HTML off your machine.
- Set up any remote service / account.

Everything detection-related happens in the content script in your own
browser. Notifications are local OS notifications via the
`chrome.notifications` API.

> **Telegram exception (opt-in).** If you enable the optional Telegram
> channel under *Settings → Phone notifications*, short structured strings
> (centre name, country code, subject code, timestamp) are sent to
> Telegram's servers so they can reach your phone. The bot token and chat
> ID you provide are stored locally in `chrome.storage.local`. No raw page
> content, no cookies, no login, no URLs leave the device. Off by default —
> see PRD Appendix A for the full posture.

---

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `chrome://extensions` says "Could not load manifest" | You picked the wrong folder. | Pick `extension/dist/`, not `extension/` or the repo root. |
| `npm install` fails on `node-gyp` / `sharp` | Native dependency on an unsupported Node. | Use Node 20 (`nvm install 20 && nvm use 20`). Icons are generated by a script with no native deps so `sharp` isn't required. |
| Build succeeds but `dist/` is empty | Vite cache is stale. | `rm -rf node_modules dist && npm install && npm run build`. |
| Extension badge stays grey | Watched tab not detected. | Make sure the TLScontact tab is open and the URL contains `tlscontact.com/workflow/` — only those URLs match the content script. |
| No desktop notifications fire | OS notification permission. | macOS: System Settings → Notifications → Chrome → Allow. Windows: Settings → System → Notifications → Chrome. |
| Tab title doesn't swap on slot found | Some TLS pages overwrite the title every render. | Known limitation; the badge + sound + notification still fire. |
| Telegram test message fails with "Forbidden: bot was blocked by the user" | You haven't messaged the bot yet, or you blocked it. | Open the bot chat in Telegram and tap Start. Then re-test. |
| Telegram test fails with "chat not found" | The Chat ID is wrong (often: extra space, wrong sign, or the bot ID copied by accident). | Re-run the *Find my Chat ID* button in Step 5 of the setup wizard; copy the `chat.id` number exactly. |
| Telegram getUpdates page returns `"result": []` | You haven't sent a message to your bot yet. | Open the bot in Telegram and send any message (tap Start, type "hi"). Reload the getUpdates page. |

---

## Contributing

This is a personal project published primarily as a worked example, but
contributions that improve the extension or the documentation are welcome:

1. Fork the repo.
2. Branch off `main`.
3. Make the change. Run `npm run typecheck` in `extension/` before pushing.
4. Open a PR. Keep changes scoped — extension and docs PRs separately.

**Do not** open issues or PRs containing real personal data, screenshots
of filled forms, or actual booking confirmations.

---

## About Torly AI

[**Torly AI (torly.ai)**](https://torly.ai) builds visa-application AI
assistants. Current projects:

- **Schengen Visa Master agent** — this project, fully open source (MIT)
  so you can audit every line of code that runs on your machine.
- **UK Innovator Founder visa AI-assistant** — a separate, related
  project that helps overseas founders prepare UK Innovator Founder
  visa applications.

We believe: **when a tool touches your visa application, "open source +
auditable" is the only credible way to earn trust.** You can inspect
exactly what the code does — and does not do — on your own computer.

Feedback, bug reports, or partnership inquiries:

- GitHub Issues: <https://github.com/torlyai/Schengen-master/issues>
- Website: <https://torly.ai>

---

## License

MIT — see [`LICENSE`](LICENSE). Open source by design; auditability is the
trust contract that makes a privacy-first extension credible.
