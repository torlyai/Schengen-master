# Marco Polo — Multi-Project & Multi-Machine Architecture

**Document:** 35-marco-polo-multi-project-multi-machine-architecture.md
**Date:** 2026-05-28
**Status:** Architecture analysis — pre-implementation
**Owner:** Duke Harewood (Torly AI)
**Related docs:**
- `33-marco-polo-unified-agent-architecture.md` — Three-path agent architecture (A/B/C)
- `34-unified-agent-implementation-plan.md` — 5-phase implementation + Appendix A (M1 Pro setup)

---

## Purpose

Doc 34 set up the M1 Pro as a single-project, single-tenant OpenClaw host for Marco Polo. This document answers two follow-on questions:

1. **Multi-project on one host:** How can the M1 Pro host *additional* OpenClaw-backed projects beyond Marco Polo, sharing the same machine?
2. **Multi-machine topology:** How can two additional Mac Mini M4 machines be added to form a tiered home infrastructure for several Marco Polo-style products?

The answers are scoped to the architecture already shipped in Phase 1 (`agent-core/` pattern, content layer, `openclaw/` config directory). No new architectural changes are required — only deployment topology decisions.

---

## Hardware Inventory

### Current — confirmed from system

| Machine | Role today | Spec |
|---|---|---|
| **Duke's MacBook Pro** (M1 Pro, 14-inch, 2021) | Marco Polo OpenClaw host (dev/dogfood) | Apple M1 Pro · 16 GB unified memory · macOS · serial KWPY65242X |

The M1 Pro has 8 performance + 2 efficiency cores (10 total CPU cores on the base 14-inch 2021 config) and a 14- or 16-core GPU, depending on SKU. 16 GB unified memory is the bottleneck for scaling, not the CPU.

### Confirmed — Mac Mini M4 expansion

| Machine | Form factor | Confirmed spec | Assigned role (see Part 2) |
|---|---|---|---|
| **Mac Mini M4 #A** | Desktop, fanless | M4 chip · 10-core CPU · 10-core GPU · 16 GB unified memory · **512 GB SSD** | **PROD** — production OpenClaw host |
| **Mac Mini M4 #B** | Desktop, fanless | M4 chip · 10-core CPU · 10-core GPU · 16 GB unified memory · **256 GB SSD** | **STAGING** — staging + heavy batch |

Mac Mini M4 dimensions: ~12.7 × 12.7 × 5 cm, ~5 W idle / ~65 W max — designed for always-on operation, silent, no battery to worsen with charge cycles.

**Role assignment is driven by SSD size, not RAM or CPU.** Both Minis have identical compute (M4 base + 16 GB), so single-project performance ceiling is identical. The SSD differential decides PROD vs STAGING:

- **512 GB → PROD:** Production accumulates state over time — Docker image layers, session logs, content updates, Supabase log exports, multiple project repos cloned in full. More headroom = less ops anxiety as the cluster fills with projects.
- **256 GB → STAGING:** Staging is transient — environments are reset, batch outputs are short-lived, big artifacts (video renders, eval datasets) can be offloaded to an external Thunderbolt SSD or cleared after each run. 256 GB is workable with discipline.

---

## Part 1 — Multi-Project on a Single Host

### The core insight

You don't need a second machine for a second project. You need a *multi-tenant pattern*. The `agent-core/` per-repo pattern shipped in Phase 1 is already the template — each new project replicates this in its own repo, and the OpenClaw daemon just gains more agent definitions.

The structural questions are:
1. How many OpenClaw daemons run on the box (1 vs N)?
2. How does external traffic (Telegram/WhatsApp webhooks) reach the right agent?
3. How do you keep projects from interfering with each other (crashes, rate limits, secrets)?

### Four architectural options, ordered by isolation strength

#### Option A — Single daemon, multiple agents (lightest)

OpenClaw natively hosts multiple agents in one process. Each is defined in `~/.openclaw/openclaw.json`:

```
~/.openclaw/openclaw.json
├── agents:
│   ├── marco-polo-visa-advisor   → uses agent-core/ from Schengen-visa
│   ├── other-project-agent        → uses agent-core/ from other-repo
│   └── third-project-agent        → uses agent-core/ from third-repo
└── channels:
    ├── telegram_marco_polo  → routes to marco-polo-visa-advisor
    ├── telegram_other       → routes to other-project-agent
    └── telegram_third       → routes to third-project-agent
```

| Aspect | Detail |
|---|---|
| **Ports** | One — 18789 |
| **launchd services** | One |
| **Tailscale Funnel** | One tunnel, one URL |
| **RAM cost per additional agent** | ~50–100 MB (config + session memory) |
| **Failure mode** | One bug in any tool executor can crash the whole daemon (all agents go down together) |
| **Rate limits** | Shared Anthropic API key → shared per-minute token budget |
| **Secrets** | All bot tokens live in one config file or one env file |
| **Deploy** | `git pull` in each repo + `openclaw gateway restart` once |

**When this fits:** 2-5 small projects, all owned by you, where downtime correlation is acceptable.

#### Option B — Multiple daemons, one per project (strongest isolation)

Each project gets its own launchd service, port, and config directory:

```
~/.openclaw-marco-polo/      → port 18789, launchd: ai.openclaw.marco-polo
~/.openclaw-project-b/        → port 18790, launchd: ai.openclaw.project-b
~/.openclaw-project-c/        → port 18791, launchd: ai.openclaw.project-c
```

| Aspect | Detail |
|---|---|
| **Ports** | One per project |
| **launchd services** | One per project |
| **Tailscale Funnel** | Either N tunnels (one per port) OR one tunnel + reverse proxy in front |
| **RAM cost per project** | ~200–400 MB (full daemon footprint) |
| **Failure mode** | A crash takes one project down; others keep running |
| **Rate limits** | Each project can use its own Anthropic API key (cleaner billing) |
| **Secrets** | Per-project `.env` files — easy to share/rotate independently |
| **Deploy** | Each project upgrades on its own cadence |

**When this fits:** Projects with different update cadences, different paying customers, different SLAs, or different teams.

#### Option C — Docker Compose with multiple services (cloud-shaped)

Run each project as a containerized OpenClaw service, orchestrated by a single `docker-compose.yml`:

```yaml
services:
  marco-polo:
    image: openclaw:latest
    volumes: [~/AI/.../Schengen-visa/agent-core:/workspace/agent-core:ro, ...]
    environment: [ANTHROPIC_API_KEY=${MARCO_POLO_KEY}, ...]

  project-b:
    image: openclaw:latest
    volumes: [~/AI/.../project-b/agent-core:/workspace/agent-core:ro, ...]
    environment: [ANTHROPIC_API_KEY=${PROJECT_B_KEY}, ...]

  traefik:  # reverse proxy
    image: traefik:latest
    ports: ["18789:80"]
    # routes by Host header or path prefix to each service
```

| Aspect | Detail |
|---|---|
| **Ports** | One external (18789), routed internally |
| **Daemons** | One container per project + a proxy |
| **Tailscale Funnel** | One tunnel → reverse proxy → routes by path/Host |
| **RAM cost per project** | ~250–500 MB (container overhead is small on Apple Silicon) |
| **Failure mode** | Restart policy `unless-stopped` per container — crashes self-heal |
| **Rate limits / secrets** | Per-container env, cleanly scoped |
| **Production transfer** | This IS the production architecture — same compose works on Railway/Fly.io |

**When this fits:** You're past the dogfood stage on at least one project and want dev/prod parity. This is also where Phase 4 of doc 34 was already headed — just multi-tenant instead of single-tenant.

#### Option D — Hybrid: progressive promotion

Don't pick one — sequence them. Run new projects through the same lifecycle Marco Polo is following:

```
Stage 1: Native single-daemon (Option A)              ← all new projects start here
Stage 2: Promote to Docker Compose service (Option C) ← when:
           - Real users exist
           - Crashes in other projects would be costly
           - You want separate Anthropic API billing
Stage 3: Move to its own cloud deployment             ← Railway/Fly.io
         (Railway/Fly.io) when paying users arrive
```

This matches the maturity ladder Marco Polo already has, just applied per project.

### Ingress strategy — how Telegram/WhatsApp webhooks find the right agent

This is the question Option B and C have to answer:

| Approach | How it works | Trade-off |
|---|---|---|
| **One port per project** | `tailscale funnel 18789`, `tailscale funnel 18790`, ... | Tailscale Funnel only allows a limited number of ports (currently 3) — caps at ~3 projects |
| **One tunnel + reverse proxy by path** | `https://host.tail.ts.net/marco-polo/webhook/...`, `/project-b/webhook/...` | Each bot's webhook URL is unique; clean; scales to many projects |
| **One tunnel + reverse proxy by subdomain** | `marco-polo.host.tail.ts.net`, `project-b.host.tail.ts.net` | Cleaner URLs but requires Tailscale MagicDNS + wildcard cert handling |
| **Per-project Cloudflare Tunnel** | Each project gets its own `*.your-domain.com` | Pro: clean per-product DNS; Con: more accounts/configs to manage |

**Best practical answer for 2-5 projects:** One Tailscale Funnel + Caddy as reverse proxy + path-based routing. Caddy is one binary, ~10 MB RAM, zero config beyond a `Caddyfile`.

### Resource budget on the M1 Pro (16 GB)

| Workload | RAM | Notes |
|---|---|---|
| macOS + system | ~4 GB | Baseline |
| Tailscale + tunnel | ~50 MB | Negligible |
| Caddy reverse proxy | ~10 MB | Negligible |
| OpenClaw daemon (Option A: 1 daemon, N agents) | 200–400 MB + 50 MB/agent | Could host 10+ agents comfortably |
| OpenClaw daemon (Option B/C: N daemons) | 250–500 MB per project | Could host 5–8 projects comfortably |
| Headroom for git, npm, occasional builds | ~2 GB | Leave this free |

**Practical ceiling on M1 Pro: ~10 projects in Option A, ~6 in Option C.** Beyond that, the M1 Pro becomes the bottleneck and you'd want to add a Mac Mini or move things to cloud.

### What the existing `agent-core/` pattern gives you for free

The structure shipped in Phase 1 scales to multi-project with **zero changes to the pattern**:

```
Repo 1 (Schengen-visa)              Repo 2 (some-other-project)
├── agent-core/                     ├── agent-core/
│   ├── SYSTEM_PROMPT.md            │   ├── SYSTEM_PROMPT.md
│   ├── tools/*.json                │   ├── tools/*.json
│   └── config/path-c.openclaw.yaml │   └── config/path-c.openclaw.yaml
├── skills/                          ├── skills/
└── ...                              └── ...

Host machine:
  ~/AI/AI_Coding/Workspaces/Schengen-visa/          ← git pull
  ~/AI/AI_Coding/Workspaces/some-other-project/     ← git pull

  OpenClaw config points at BOTH agent-core directories
```

Each repo owns its own brain. The host just mounts them all. The `tool-executor.ts` shipped in Phase 3 reads paths from environment variables, so pointing it at a different `agent-core/` per agent is a config change, not a code change.

### Risks and friction points specific to multi-tenant

| Risk | Severity | Mitigation |
|---|---|---|
| **Shared Anthropic rate limits** | Medium — bursts in one project starve another | Use per-project API keys (Option B/C); add request queuing in OpenClaw |
| **Secret sprawl** | Medium — N Telegram tokens, N WhatsApp numbers, N webhooks | One `.env.master` per project, never in git; consider `direnv` or 1Password CLI |
| **Telegram bot naming collisions** | Low — easy to avoid with `@Product_Name_Bot` convention | Standardise: `@ProjectName_Bot` |
| **Cost attribution** | High at scale — "which project burned £80 last month?" | Per-project Anthropic keys → Anthropic billing dashboard splits it automatically |
| **One bad deploy takes down everything** | High in Option A, Low in B/C | Reason to graduate to Option C earlier rather than later |
| **Host hardware failure** | High — single point of failure for all projects | See Part 2 — multi-machine topology |
| **macOS auto-update interrupts the daemon** | Medium | Already addressed in doc 34 Appendix A §A.8 — disable automatic updates |

---

## Part 2 — Multi-Machine Topology (M1 Pro + 2× Mac Mini M4)

Adding two Mac Mini M4 units changes the calculus from "how do I fit N projects on one box" to "how do I assign roles across three boxes." The Mac Mini form factor — silent, fanless, ~5 W idle, ~65 W max, no battery, no display — is purpose-built for always-on home infrastructure. The M1 Pro is a laptop and should be used as one.

### Hardware role mapping — what each machine is *naturally* best at

| Trait | M1 Pro MacBook | Mac Mini M4 |
|---|---|---|
| Portability | High (laptop) | Zero (desktop) |
| Always-on suitability | Medium (battery wear cycles, lid-closed thermals) | Excellent (designed for it) |
| Power efficiency at idle | ~5–10 W | ~5 W |
| Power efficiency at load | ~30 W | ~20–30 W (no display) |
| Noise | Audible fan under load | Effectively silent |
| Hardware reliability for 24/7 | Lower (more moving parts: hinge, keyboard, battery) | Higher (no battery, no display, fanless) |
| Cost-per-watt-hour for 24/7 ops | Higher | Lower |
| Single-core performance | Lower (older M1 Pro) | Higher (newer M4) |

**Conclusion:** Mac Minis should host always-on services. The MacBook should remain a laptop.

### Recommended topology — tiered by maturity + role

```
┌──────────────────────────────┐    ┌──────────────────────────────┐    ┌──────────────────────────────┐
│  M1 Pro MacBook              │    │  Mac Mini M4 #A (PROD)       │    │  Mac Mini M4 #B (STAGING)    │
│  16 GB · 2021 14-inch        │    │  16 GB · M4 · 512 GB SSD     │    │  16 GB · M4 · 256 GB SSD     │
│  Primary dev machine + mobile│    │  Production OpenClaw host    │    │  Staging + heavy compute     │
│                              │    │                              │    │                              │
│  • Active development        │    │  • All paying-customer       │    │  • Mirror of PROD config     │
│  • Skills authoring          │    │    OpenClaw agents           │    │  • Pre-prod validation       │
│  • Demos / client visits     │    │  • Multi-tenant via Docker   │    │  • Heavy batch work:         │
│  • Local extension build     │    │    Compose (Option C)        │    │    - Content gen runs        │
│  • Claude Code sessions      │    │  • Caddy reverse proxy +     │    │    - Video rendering         │
│  • Vercel dev server         │    │    Tailscale Funnel ingress  │    │    - Agent eval suites       │
│  • Git source of truth       │    │  • WhatsApp Business API     │    │  • Hot-spare for PROD        │
│                              │    │    canonical webhook target  │    │  • OpenClaw upgrade testing  │
│  No always-on services       │    │  • UPS protected, wired      │    │  • Externally-attached SSD   │
│                              │    │    ethernet                  │    │    for batch outputs         │
└──────────────────────────────┘    └──────────────────────────────┘    └──────────────────────────────┘
        │                                       │                                       │
        └──────────────────── Tailscale mesh — all three machines on one tailnet ─────────────────────┘
                                                │
                                                ▼
                                  External webhook URL (PROD)
                                  https://prod.your-domain.com/
```

### Why this assignment

| Machine | Role | Reasoning |
|---|---|---|
| **M1 Pro MacBook** | Dev + mobile | It's a laptop. Its unique value is going where you go. Loading it with always-on services wastes the form factor and ties it to a desk. |
| **Mac Mini M4 #1 — PROD** | Production OpenClaw host | Best location (best network drop, wired ethernet, UPS, fewest interruptions). 24/7 reliability target. Canonical home for the WhatsApp Business webhook URL (which is bound to one URL per phone number). |
| **Mac Mini M4 #2 — STAGING** | Staging + heavy batch | Mirrors PROD config exactly so deploys are pre-tested. Doubles as compute for jobs that don't fit a laptop: content generation runs, marketing video renders, agent evaluation suites, occasional model-fine-tuning experiments. Acts as hot spare — if PROD dies, DNS/webhook swap to STAGING in ~15 minutes. |

### Networking and ingress

All three machines join one Tailscale tailnet. Tailscale's MagicDNS gives stable hostnames (e.g. `mini-1.tail-xxxx.ts.net`). The PROD machine owns the public ingress:

```
Public webhook URL (e.g. https://prod.your-domain.com/marco-polo/telegram)
        │
        ▼
Tailscale Funnel on Mini #A
        │
        ▼
Caddy reverse proxy on Mini #A
        ├── /marco-polo/*    → marco-polo OpenClaw container
        ├── /project-b/*     → project-b OpenClaw container
        └── /project-c/*     → project-c OpenClaw container
```

For Cloudflare Tunnel users, the equivalent is `cloudflared tunnel route dns prod openclaw.torly.ai` running on Mini #A, with the same Caddy proxy behind it.

### Disaster recovery scenarios

| Scenario | Recovery |
|---|---|
| **Mini #A (PROD) hardware dies** | Promote Mini #B to PROD: update Tailscale Funnel binding + DNS, restart OpenClaw, ~15 min |
| **Mini #B (STAGING) dies** | No customer impact. Order replacement when convenient. STAGING work pauses. |
| **Power outage at home** | Cloud failover (already planned in doc 34 Phase 5 — Railway/Fly.io). UPS on Mini #A gives ~10 min to gracefully shut down or wait for power. |
| **Home ISP outage** | Cloud failover; cellular hotspot bridge if outage is short |
| **Both Minis dead simultaneously** | M1 Pro can run a degraded-mode OpenClaw temporarily; cloud is the proper recovery path |
| **macOS catastrophic update on Mini #A** | Time Machine restore from external SSD, or Mini #B takes over while Mini #A is repaired |
| **Tailscale account compromise** | Rotate auth keys; ACL changes apply network-wide in minutes |

### Migration plan — from current state to multi-machine

Current state: Marco Polo on M1 Pro, single project, single host.

**Phase A — Bring Mini #A online as a replica of M1 Pro (1 day)**
1. Mini #A follows doc 34 Appendix A end-to-end (node@24, OpenClaw, repos cloned, Tailscale joined)
2. Configure Mini #A with a *test* Telegram bot (not the live Marco Polo bot)
3. Validate parity: same conversation flow, same tool calls, same responses
4. Confirm Mini #A stays alive overnight under launchd (lid-closed equivalent — Mac Mini has no lid)

**Phase B — Cut Marco Polo traffic from M1 Pro to Mini #A (1 hour)**
1. Update Telegram bot webhook URL to point at Mini #A's Tailscale Funnel URL
2. Stop OpenClaw daemon on M1 Pro (`launchctl unload ...`)
3. Verify Marco Polo conversations land on Mini #A
4. M1 Pro becomes pure dev machine — no always-on services

**Phase C — Migrate to Docker Compose on Mini #A (1-2 days)**
1. Use the `Dockerfile` and `docker-compose.yml` already shipped in `lib/marco-polo/openclaw/`
2. Add Caddy reverse proxy service to the compose file
3. Cut over from native OpenClaw to containerised — same external behaviour, internal isolation
4. Validate WhatsApp can be added without disrupting Telegram

**Phase D — Bring Mini #B online as STAGING (1 day)**
1. Same setup as Mini #A but with `docker-compose.staging.yml`
2. Use *test* bots (not live customer bots)
3. Procedure: `git push` to private remote → `git pull` on Mini #B → run staging compose → validate → promote to Mini #A
4. Document the promotion flow as a runbook

**Phase E — Onboard a second project (variable)**
1. Add `agent-core/`, skills, etc. to the new project's repo
2. Deploy first to Mini #B (STAGING) to validate end-to-end
3. Add a service to Mini #A's compose file, route via Caddy at `/project-2/*`
4. Total ops cost: one service entry, one Caddy route, one Telegram bot. ~30 min.

### Capacity planning across three machines

Confirmed: 16 GB unified memory on both Minis. CPU/GPU identical (M4 base, 10+10). Docker Compose deployment on both.

#### Memory budget (the real bottleneck for project density)

| Machine | RAM | Always-on services budget | Project capacity (Docker Compose, Option C) |
|---|---|---|---|
| Mini #A (PROD) — 512 GB SSD | 16 GB | ~12 GB usable (after macOS + Docker overhead) | ~6 projects comfortably; ~8–10 if traffic is light |
| Mini #B (STAGING) — 256 GB SSD | 16 GB | ~12 GB usable | Same RAM ceiling as Mini #A, plus headroom for heavy batch work when not staging |
| M1 Pro (dev) | 16 GB | Not measured — used for active dev only | Zero always-on services |

**Combined capacity:** 10-15 production projects across the two Minis before cloud becomes the right next step. For a solo builder, that is more than enough runway for the next 2–3 years.

#### Storage budget — Mini #A (512 GB) is comfortable; Mini #B (256 GB) needs discipline

| Workload | Mini #A (PROD, 512 GB) | Mini #B (STAGING, 256 GB) |
|---|---|---|
| macOS + Xcode CLI + Homebrew + Node toolchain | ~40 GB | ~40 GB |
| Docker Desktop + cached images + volumes | ~40 GB (growth budget for ~8 projects) | ~25 GB (smaller image cache, prune often) |
| Cloned project repos (full git history × N projects) | ~20 GB | ~15 GB |
| Session logs + Supabase exports + content updates | ~50 GB (accumulates over years) | ~5 GB (resets often) |
| Batch outputs (video renders, eval datasets, content gen) | Not applicable on PROD | **Offload to external SSD** — see below |
| Time Machine local snapshots | ~30 GB (allow) | Disable — use external backup target instead |
| Safety headroom (avoid macOS getting unhappy < 10% free) | ~50 GB | ~25 GB |
| **Allocated** | ~230 GB | ~110 GB |
| **Remaining free** | **~280 GB** | **~145 GB** |

Mini #A has plenty of room to grow into. Mini #B is workable but needs three operational habits:

1. **External SSD for batch outputs.** A Thunderbolt 4 USB-C 1 TB external SSD (~£80–120) attached to Mini #B becomes the scratch drive for video renders, content generation runs, and eval datasets. The internal 256 GB stays lean.
2. **Aggressive Docker pruning.** Schedule `docker system prune -af --volumes` weekly via launchd on Mini #B. This is safe on staging — images can be rebuilt from registry on demand.
3. **Disable local Time Machine snapshots.** `sudo tmutil disablelocal` (or via System Settings) reclaims ~30 GB. Rely on the external backup target (also useful as the batch scratch SSD if you spec it large enough).

If Mini #B's 256 GB becomes a constraint as project count grows past ~5, the right move is to upgrade Mini #A or graduate the biggest project to cloud — not to upgrade Mini #B (the staging role doesn't justify the spend).

### When to graduate any project to cloud

Even with three machines, some projects belong in the cloud sooner rather than later. Concrete triggers:

| Trigger | Action |
|---|---|
| Project's Anthropic spend > £50/month | Move to Railway/Fly.io for proper cost visibility |
| Project's SLA expectation > 99% | Cloud's infrastructure exceeds home reliability; move it |
| Project gains a co-founder or team | Cloud removes the "Duke's home" SPOF for the team |
| Project ships to a region where local latency matters | Cloud region selection beats UK home internet |
| Project requires SOC2 / GDPR / similar compliance | Cloud is easier to audit than a home server |

The home cluster's purpose is to give every new project a free, low-friction runway. When the project earns its way out, it leaves. Mini #A and Mini #B stay as the launch pad and staging environment for the next ones.

### Operational considerations

| Topic | Recommendation |
|---|---|
| **Power** | UPS on Mini #A (production); Mini #B optional. ~£80 buys a Cyberpower UPS that gives 10 min of runtime — enough for graceful shutdown or short outages. |
| **Network** | Wired ethernet to both Minis if possible. Wi-Fi is fine but adds variance. 1 Gbps home internet handles all webhook + LLM API traffic with room to spare. |
| **Heat** | Mac Minis are fanless; don't stack them. Leave 5–10 cm air gap, place in a ventilated area. The study should be fine year-round in UK climate. |
| **Backup** | Time Machine to an external SSD for each Mini. Tailscale-based off-site backup (e.g. to a NAS at another location) is optional but cheap insurance. |
| **Monitoring** | Single Supabase `marco_polo_openclaw_events` table receives logs from all machines + all projects. Tag rows with `host` + `project`. The ops dashboard from doc 17 extends naturally. |
| **Updates** | Disable automatic macOS updates on all Minis (doc 34 Appendix A §A.8). Schedule manual updates: Mini #B first, validate for a week, then Mini #A. |
| **Physical access** | All three machines on one Tailscale tailnet means `ssh mini-1`, `ssh mini-2` from the M1 Pro from anywhere. No port forwarding, no public IPs. |
| **SSH hardening** | Use Tailscale SSH or key-only auth + disable password auth. Tailscale ACLs scope which devices can SSH to which. |

---

## Summary — decision flowchart

```
┌─ Starting a new Marco Polo-style project? ─────────────────────────────────────┐
│                                                                                │
│   Step 1: Create agent-core/ in the new repo (mirror Schengen-visa pattern)    │
│                                                                                │
│   Step 2: Develop locally on M1 Pro MacBook                                    │
│                                                                                │
│   Step 3: Deploy first to Mini #B (STAGING) as a Docker Compose service        │
│           with a test bot                                                      │
│                                                                                │
│   Step 4: Validate end-to-end (conversation flow, tool calls, bilingual,       │
│           session persistence)                                                 │
│                                                                                │
│   Step 5: Promote to Mini #A (PROD) — add service to its compose file,         │
│           route via Caddy at /<project-name>/*, point real bot webhook         │
│                                                                                │
│   Step 6: Monitor for 1 week. If stable, consider it shipped.                  │
│                                                                                │
│   Step 7 (later): If the project's spend > £50/month or SLA needs exceed       │
│           home infrastructure, migrate to Railway/Fly.io. Free up the          │
│           Mini #A slot for the next project.                                   │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
```

The home cluster scales to ~10–15 production projects across the two Minis before cloud becomes the right next step. The architectural pattern shipped in Phase 1 (`agent-core/` per repo, content read from disk at runtime, git as the sync mechanism, OpenClaw tool executor reading paths from env vars) handles all of this without changes — only deployment topology evolves.

---

## Open questions

- **Home network:** Confirm wired Ethernet availability at the planned Mini locations. Wi-Fi works but is more variance-prone for webhook latency. If only one drop is available, give it to Mini #A (PROD).
- **External SSD for Mini #B:** Decide whether to buy one upfront (~£80–120 for 1 TB Thunderbolt 4) or wait until the first batch workload needs it. Either is reasonable; the doc assumes it's available when batch work begins.
- **UPS provisioning for Mini #A:** Decide whether to buy a UPS (~£80 for Cyberpower with ~10 min runtime) before or after first paying customer arrives. Recommended: buy before, treat as launch readiness checklist item.
- **WhatsApp number strategy:** WhatsApp Business numbers are tied to one webhook URL each. If multiple projects each need their own WhatsApp number, each number's webhook points at Mini #A's Caddy routes — no per-number machine separation needed. If you wanted true per-project WhatsApp isolation across machines, each project would need its own Mini, which is uneconomic at 2 Minis total.
- **Physical placement:** Mini #A (PROD) should get the best location — wired ethernet drop, near the UPS, in a ventilated spot, away from where the cat / cleaning routine might unplug it. Mini #B is more forgiving since downtime there doesn't affect customers.

### Resolved (confirmed 2026-05-28)

- ~~Mac Mini M4 specs~~ → Confirmed: both are M4 base (10+10 cores), 16 GB; SSDs are 512 GB (Mini #A) and 256 GB (Mini #B). Role assignment driven by SSD differential.

---

## Related work (downstream)

When this analysis is acted on, the following docs/configs will need updates:

- `lib/marco-polo/openclaw/docker-compose.yml` — extend to multi-service shape (add Caddy, add additional project services)
- `lib/marco-polo/openclaw/Caddyfile` — new file, path-based routing config
- `docs/34-unified-agent-implementation-plan.md` Appendix A — extend with Mac Mini setup notes (largely identical to M1 Pro setup)
- `CLAUDE.md` two-machine model section — update to three-machine model when Minis arrive
- `docs/17-ops-dashboard-prd.md` — extend with `host` + `project` tags on log rows
