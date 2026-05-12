# Schengen-master

An open-source **case study + tool** for a family Schengen visa application
(Chinese nationals, UK-resident, France-primary itinerary). Ships two things
in one repository:

1. **A privacy-first Chrome extension** — *Visa Master Appointment Watcher* —
   that watches your TLScontact appointment page and notifies you the instant
   a slot opens. Runs entirely in your own browser; no credentials leave the
   device.
2. **A complete documentation workspace** — research, requirements, document
   checklists, itinerary, cover-letter templates, and an Obsidian-friendly
   dashboard — designed to be readable as an end-to-end worked example for
   anyone preparing a similar application.

> **Status:** Active. Application target submission window 18 May 2026.
> Extension v1.0.0 sideload-only — Chrome Web Store listing is not live yet.

---

## Table of contents

- [What's in this repository](#whats-in-this-repository)
- [Repository structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
  - [Path A — Just read the case study (no install)](#path-a--just-read-the-case-study-no-install)
  - [Path B — Install the Chrome extension](#path-b--install-the-chrome-extension)
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
| `docs/` | Numbered worked-example documents — visa requirements, document checklist, appointment booking guide, travel insurance guide, itinerary, PRD and wireframes for the extension. Read in numeric order. |
| `platform/` | Higher-level platform design — competitive landscape, architecture, feature spec, privacy notes. |
| `privacy/` | `GUARDRAILS.md` (the "no PII in git" contract) + an action audit log. |
| `forms/`, `appointments/`, `insurance/` | **Always git-ignored.** Where you keep your own filled letters, booking confirmations and insurance certificates locally. Empty in the repo by design. |
| `DASHBOARD.md` | Single-screen status overview suited to Obsidian. |
| `visa-workflow.html` | Standalone interactive workflow visualisation. |
| `Term-Dates-*.pdf` | Public UK school term dates — the only PDFs allowed into git, allow-listed in `.gitignore`. |

---

## Repository structure

```
Schengen-master/
├── README.md                       ← you are here
├── .gitignore                      ← deny-by-default PII firewall
├── DASHBOARD.md                    ← family-level status dashboard
├── visa-workflow.html              ← interactive workflow diagram
├── Term-Dates-2025-2026.pdf        ← public reference (UK school terms)
├── Term-Dates-2026-2027.pdf        ← public reference (UK school terms)
│
├── docs/                           ← worked-example, read in numeric order
│   ├── 00-family-profile.md
│   ├── 01-france-visa-requirements.md
│   ├── 01-italy-visa-requirements.md
│   ├── 02-document-checklist.md
│   ├── 03-appointment-booking-guide.md
│   ├── 04-travel-insurance-guide.md
│   ├── 05-master-action-plan.md
│   ├── 06-itinerary-locked.md
│   ├── 06-visa-master-chrome-extension-prd.md
│   ├── 07-bookings-research.md
│   └── 07-chrome-extension-wireframes.md
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
│   ├── research/
│   └── privacy/
│
├── privacy/
│   ├── GUARDRAILS.md               ← READ THIS BEFORE COMMITTING
│   └── audit-log.md                ← action log, no PII
│
├── forms/                          ← gitignored (your filled letters)
├── appointments/                   ← gitignored (your bookings)
└── insurance/                      ← gitignored (your policy docs)
```

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

### Path A — Just read the case study (no install)

If you only want to read the documentation:

```sh
git clone https://github.com/DukeWood/Schengen-master.git
cd Schengen-master
```

Open `docs/00-family-profile.md` and read in numeric order. Everything is
plain Markdown — GitHub renders it inline, or use any Markdown viewer.

---

### Path B — Install the Chrome extension

This is the main install path. The extension is sideloaded ("Load unpacked")
until a Chrome Web Store listing is published.

**Step 1 — Clone**

```sh
git clone https://github.com/DukeWood/Schengen-master.git
cd Schengen-master/extension
```

**Step 2 — Install dependencies**

```sh
npm install
```

This pulls React 18, Vite 5, `@crxjs/vite-plugin`, TypeScript and Chrome
type definitions. About 250 MB into `node_modules/`. Takes 30–60 s.

**Step 3 — Build the extension**

```sh
npm run build
```

Vite compiles the TypeScript service worker, content script and React UI
into `extension/dist/`. The output is a valid unpacked MV3 extension.

> Note: `dist/` is **not** committed to the repo. You must build before
> loading. If you skip this step the next one will fail with "Could not
> load manifest".

**Step 4 — Load the unpacked extension in Chrome**

1. Open `chrome://extensions` in Chrome.
2. Toggle **Developer mode** in the top-right corner.
3. Click **Load unpacked**.
4. Select the `extension/dist/` folder you just built.
5. The extension appears in your toolbar as *Visa Master — Appointment Watcher*.
   Pin it for easier access.

**Step 5 — First run**

The extension opens a welcome tab on install. Pick your language (English /
中文), then follow the in-page guidance to:

1. Open your TLScontact appointment page in another tab and log in.
2. Return to the welcome tab — the extension auto-detects the watched tab and
   the badge turns green.
3. Open the popup to confirm the polling schedule and notification settings
   (defaults: poll every 2 min inside the configured release windows, every
   6 min outside; UK local time).

Once monitoring is on, you can leave Chrome running in the background. When
a slot is detected the extension shows a desktop notification, swaps the tab
title/favicon to ⚠ red, and (optionally) plays a sound.

---

### Path C — Open the workspace in Obsidian (optional)

The documentation set is designed to be browsed as an Obsidian vault — the
`.obsidian/` directory is committed (workspace state and caches are
gitignored, but plugin configuration is preserved).

1. Install [Obsidian](https://obsidian.md/) if you don't have it.
2. **Open folder as vault** → select the cloned `Schengen-master/` folder.
3. Trust the author when prompted (community plugins are read-only here).
4. Start at `DASHBOARD.md`.

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

---

## Privacy & data handling

This project takes privacy seriously — see
[`privacy/GUARDRAILS.md`](privacy/GUARDRAILS.md) for the full contract.

**What stays in git:**

- Documentation (uses placeholders like `APPLICANT_1`, `[PARIS_HOTEL_TBD]`).
- Extension source code.
- Public reference data (UK school term PDFs, allow-listed in `.gitignore`).

**What is always git-ignored:**

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

## License

MIT — see `LICENSE` (to be added). Open source by design; auditability is
the trust contract that makes a privacy-first extension credible.
