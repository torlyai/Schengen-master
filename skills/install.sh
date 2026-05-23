#!/usr/bin/env sh
# ─────────────────────────────────────────────────────────────────────────
# Schengen-master skills — install script
#
# Sparse-checkout of just the skills/ subfolder from torlyai/Schengen-master
# into the user's Claude Code skills directory. No source code, no extension
# assets — only the markdown skills + ETHOS + install script.
#
# Usage (one-liner — what we tell users):
#   curl -sSL https://raw.githubusercontent.com/torlyai/Schengen-master/main/skills/install.sh | sh
#
# Re-running this script updates an existing install (idempotent).
# ─────────────────────────────────────────────────────────────────────────

set -e

REPO_URL="https://github.com/torlyai/Schengen-master.git"
DEST="${SCHENGEN_SKILLS_DEST:-$HOME/.claude/skills/schengen-master}"
BRANCH="${SCHENGEN_SKILLS_BRANCH:-main}"

# ── Sanity checks ────────────────────────────────────────────────────────
if ! command -v git >/dev/null 2>&1; then
  echo "❌ git is required but not installed. Install git and try again."
  exit 1
fi

# ── Update path (existing install) ───────────────────────────────────────
if [ -d "$DEST/.git" ]; then
  echo "🔄 Existing install detected at $DEST — updating…"
  cd "$DEST"
  git fetch --quiet origin "$BRANCH"
  git reset --quiet --hard "origin/$BRANCH"
  VERSION="$(cat VERSION 2>/dev/null || echo unknown)"
  echo "✅ Updated Schengen-master skills to v$VERSION"
  echo "   Skills available: $(ls -d */ 2>/dev/null | grep -v 'i18n\|countries' | wc -l | tr -d ' ')"
  exit 0
fi

# ── Fresh install ────────────────────────────────────────────────────────
echo "📥 Installing Schengen-master skills to $DEST…"
mkdir -p "$DEST"
cd "$DEST"

git init --quiet
git remote add origin "$REPO_URL"
git config core.sparseCheckout true

# Pull only the skills/ subfolder
cat > .git/info/sparse-checkout <<'EOF'
/skills/
EOF

git pull --quiet --depth=1 origin "$BRANCH"

# Move skills/* up to the install root so Claude Code finds them as
# top-level skills (Claude Code expects each skill at the root, not nested).
if [ -d skills ]; then
  # Cross-platform "move including hidden files" (dotglob/find difference handled)
  find skills -mindepth 1 -maxdepth 1 -exec mv -- {} . \;
  rmdir skills
fi

VERSION="$(cat VERSION 2>/dev/null || echo unknown)"
SKILL_COUNT="$(find . -maxdepth 1 -mindepth 1 -type d ! -name 'i18n' ! -name 'countries' ! -name '.git' | wc -l | tr -d ' ')"

echo ""
echo "✅ Installed Schengen-master skills v$VERSION"
echo "   Location:  $DEST"
echo "   Skills:    $SKILL_COUNT available"
echo ""
echo "📖 Try this in your next Claude Code session:"
echo "      /start-here"
echo ""
echo "🔄 To update later, re-run this script or:  cd $DEST && git pull"
