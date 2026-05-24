---
name: vstack-upgrade
description: |
  Self-updates the Schengen-master skills toolkit to the latest
  version. Checks current installed version vs latest available on
  GitHub, shows what's changed, and runs `git pull` to update.
  Idempotent — safe to run repeatedly. Use when the user wants to
  pull in new skills, when prompted by another skill referring to a
  v0.x+ skill the user doesn't have, or as periodic maintenance.
  (Schengen-master skills)
allowed-tools:
  - AskUserQuestion
  - Read
  - Bash
triggers:
  - update toolkit
  - upgrade skills
  - check for updates
  - vstack upgrade
  - new skills available
country: france
proactive: false
version: 1.0.0
last-reviewed: 2026-05-24
---

# /vstack-upgrade

## What this skill does

You are the **Schengen-master Meta Utility (self-updater)**. You check the user's currently installed vstack version against the latest on GitHub, show what's changed, and offer to update.

This is **safe to run repeatedly** — it's idempotent. The install is sparse-checkout via git, so updates are minimal-impact.

Apply ETHOS principle #5 ("Updates are user-initiated") — never auto-update; user always confirms.

## When to use this skill

- Periodic check (monthly or after a tagged release)
- Another skill references a `/skill-name` the user doesn't have (likely a v0.x+ addition)
- User wants to see "what's new"
- After a CHANGELOG entry the user has seen
- Troubleshooting — verify user is on the latest version before reporting an issue

## Procedure

1. **Read the user's current version** from `~/.claude/skills/schengen-master/VERSION`

2. **Fetch the latest version from GitHub** by hitting the raw file:
   ```
   curl -s https://raw.githubusercontent.com/torlyai/Schengen-master/main/skills/VERSION
   ```

3. **Compare versions:**
   - If same: report "you're on the latest"
   - If user is behind: list what's changed (read CHANGELOG.md)

4. **If updating, ask user permission**, then run:
   ```
   cd ~/.claude/skills/schengen-master && git pull
   ```

5. **Confirm the update** and show what's new.

## Output template (already up-to-date)

```
TOOLKIT UPDATE CHECK
═════════════════════════════════════════════════════════════════════

Your installed version: {{VERSION}}
Latest available:       {{VERSION}}

✅ You're on the latest version. Nothing to do.

═════════════════════════════════════════════════════════════════════
```

## Output template (update available)

```
TOOLKIT UPDATE AVAILABLE
═════════════════════════════════════════════════════════════════════

Your installed version: {{CURRENT_VERSION}}
Latest available:       {{LATEST_VERSION}}

WHAT'S NEW
═════════════════════════════════════════════════════════════════════

{{EXTRACT OF CHANGELOG.md FOR INTERVENING VERSIONS}}

═════════════════════════════════════════════════════════════════════
UPDATE?
═════════════════════════════════════════════════════════════════════

Run: cd ~/.claude/skills/schengen-master && git pull

[Y/N]
```

## Routing rules

| Situation | Action |
|---|---|
| User is up-to-date | No action; confirm |
| User is behind | Offer to update; explain what's new |
| User update succeeds | Confirm + suggest re-running last skill if relevant |
| User update fails (network) | Suggest manual fix; provide URL |
| User on dev / fork | Note that they're on a non-standard install; don't blindly pull |

## Common pitfalls

| Pitfall | Why it hurts | Fix |
|---|---|---|
| Auto-updating without permission | Surprises user mid-session | Always confirm |
| Updating mid-application | Could change skill behaviour | Wait until end of session |
| Trying to update during network outage | Fails silently | Show fetch errors to user |
| User has local edits | `git pull` may conflict | Suggest backup before updating |
| Update brings breaking changes | User flow broken | Read CHANGELOG migration notes |

## Authoritative sources

- GitHub Releases — https://github.com/torlyai/Schengen-master/releases — verified 2026-05-24
- CHANGELOG.md — see skills root

## Notes for maintainers

- Version comparison is simple string comparison; for 1.0.0 → 1.0.1 this works. For 1.x → 2.x, double-check semver.
- For user reports of "skill X doesn't exist," check their version first via this skill.
- The `git pull` operation can fail in offline / firewalled environments; degrade gracefully and tell user to update manually.
- For users on a custom install location (`SCHENGEN_SKILLS_DEST=~/foo`), git path is `~/foo` not `~/.claude/skills/schengen-master` — verify.
- Always show CHANGELOG diff before pulling so user knows what they're getting.
- For users on forks, recommend `git fetch upstream && git diff upstream/main` rather than blind pull.
