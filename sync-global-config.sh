#!/usr/bin/env bash
# sync-global-config.sh
# Pulls your live ~/.claude/ setup into global_config/ so the repo stays current.
# Run this any time you add a new skill, plugin, or tweak CLAUDE.md.
#
# Direction: ~/.claude/ → global_config/   (opposite of install.sh)
# Safe:      never touches credentials, cache, session data, or plugin binaries

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEST="$REPO_ROOT/global_config"
CLAUDE="$HOME/.claude"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BOLD='\033[1m'; NC='\033[0m'
log()  { echo -e "  ${GREEN}✔${NC} $1"; }
warn() { echo -e "  ${YELLOW}⚠${NC}  $1"; }
hdr()  { echo -e "\n${BOLD}$1${NC}"; }

SENSITIVE=(".credentials.json" "settings.local.json" "*.key" "*.pem" ".env" ".env.*")
is_sensitive() {
  local fname; fname="$(basename "$1")"
  for p in "${SENSITIVE[@]}"; do case "$fname" in $p) return 0 ;; esac; done
  return 1
}

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Claude Code — sync live setup → repo"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

mkdir -p "$DEST/skills"

# ── 1. CLAUDE.md ──────────────────────────────────────────────────────────────
hdr "1. CLAUDE.md"
if [[ -f "$CLAUDE/CLAUDE.md" ]]; then
  cp "$CLAUDE/CLAUDE.md" "$DEST/CLAUDE.md"
  log "Synced CLAUDE.md"
else
  warn "~/.claude/CLAUDE.md not found — skipping"
fi

# ── 2. Skills ─────────────────────────────────────────────────────────────────
hdr "2. Skills"
if [[ -d "$CLAUDE/skills" ]]; then
  for skill_dir in "$CLAUDE/skills"/*/; do
    [[ -d "$skill_dir" ]] || continue
    name="$(basename "$skill_dir")"

    # Skip any skill dir that contains sensitive files
    skip=false
    while IFS= read -r -d '' f; do
      if is_sensitive "$f"; then
        warn "Skipping skill '$name' — sensitive file detected: $(basename "$f")"
        skip=true; break
      fi
    done < <(find "$skill_dir" -type f -print0)
    $skip && continue

    rm -rf "$DEST/skills/$name"
    cp -r "$skill_dir" "$DEST/skills/$name"
    log "Synced skill: $name"
  done
else
  warn "No ~/.claude/skills/ found — skipping"
fi

# ── 3. settings.json (strip nothing — no secrets in this file) ────────────────
hdr "3. settings.json"
if [[ -f "$CLAUDE/settings.json" ]]; then
  cp "$CLAUDE/settings.json" "$DEST/settings.json"
  log "Synced settings.json ($(jq '.enabledPlugins | keys | length' "$DEST/settings.json" 2>/dev/null || echo '?') plugins, $(jq '.extraKnownMarketplaces | keys | length' "$DEST/settings.json" 2>/dev/null || echo '?') marketplaces)"
else
  warn "~/.claude/settings.json not found — skipping"
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
SKILL_COUNT=$(find "$DEST/skills" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "  ${GREEN}Done.${NC} global_config/ is up to date."
echo ""
echo "  Skills synced : $SKILL_COUNT"
echo "  Files:"
find "$DEST" -type f | sed "s|$REPO_ROOT/||" | sort | sed 's/^/    /'
echo ""
echo "  Commit when ready:"
echo "    git add global_config/ && git commit -m 'chore: sync global claude config'"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
