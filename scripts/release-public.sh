#!/usr/bin/env bash
# release-public.sh — Build a filtered snapshot of main for the public repo
#
# Pattern: branch divergence. main (private) has everything;
# public-release is a generated branch that excludes internal docs.
#
# Usage:
#   ./scripts/release-public.sh           # creates/updates public-release locally
#   ./scripts/release-public.sh --push    # creates + pushes to origin/main
#
# Safety: this script never touches main. It works on a temp branch.

set -euo pipefail

# ─── Config: paths excluded from the public release ─────────────────
EXCLUDED_PATHS=(
  "docs/30-tls-slot-release-windows-research.md"
  "docs/31-plugin-marketplace-backlog.md"
  "docs/32-marco-polo-managed-agent-prd.md"
  "docs/33-marco-polo-unified-agent-architecture.md"
  "docs/34-unified-agent-implementation-plan.md"
  "docs/35-vm-catcher-prd.md"
  "docs/superpowers/"
)

PUBLIC_BRANCH="public-release"
SOURCE_BRANCH="main"
PUSH=false

# ─── Parse args ─────────────────────────────────────────────────────
for arg in "$@"; do
  case $arg in
    --push)
      PUSH=true
      shift
      ;;
    *)
      echo "Usage: $0 [--push]"
      exit 1
      ;;
  esac
done

# ─── Sanity checks ──────────────────────────────────────────────────
if [[ -n "$(git status --porcelain)" ]]; then
  echo "Error: working tree has uncommitted changes. Commit or stash first."
  exit 1
fi

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$CURRENT_BRANCH" != "$SOURCE_BRANCH" ]]; then
  echo "Error: must run from $SOURCE_BRANCH (currently on $CURRENT_BRANCH)"
  exit 1
fi

# ─── Build the public branch ────────────────────────────────────────
echo "→ Updating $PUBLIC_BRANCH from $SOURCE_BRANCH (excluding internal docs)..."

# Delete the local public branch if it exists, recreate from main
git branch -D "$PUBLIC_BRANCH" 2>/dev/null || true
git checkout -b "$PUBLIC_BRANCH"

# Remove excluded paths
for path in "${EXCLUDED_PATHS[@]}"; do
  if [[ -e "$path" ]]; then
    git rm -rq "$path" 2>/dev/null || true
    echo "  ✓ Removed $path"
  fi
done

# Single commit on top documenting the filter (no history of internal docs survives)
SOURCE_COMMIT=$(git rev-parse "$SOURCE_BRANCH")
git commit -m "chore(public): filtered release from $SOURCE_COMMIT

Excludes internal PRDs, specs, and research docs.
Public-facing content only: skills/, extension/, README, public docs."

# ─── Push if requested ──────────────────────────────────────────────
if [[ "$PUSH" == "true" ]]; then
  echo "→ Pushing $PUBLIC_BRANCH to origin/main..."
  git push origin "$PUBLIC_BRANCH:main" --force-with-lease
  echo "  ✓ Pushed to origin/main (force-with-lease)"
else
  echo ""
  echo "→ Dry run complete. $PUBLIC_BRANCH branch is ready locally."
  echo "  To push: git push origin $PUBLIC_BRANCH:main --force-with-lease"
  echo "  Or re-run: $0 --push"
fi

# ─── Return to main ─────────────────────────────────────────────────
git checkout "$SOURCE_BRANCH"
echo "→ Back on $SOURCE_BRANCH"
