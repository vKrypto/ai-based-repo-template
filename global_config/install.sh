#!/usr/bin/env bash
# install.sh — portable Claude Code setup
#
# What it does:
#   1. Installs ~/.claude/CLAUDE.md          (skips if already present)
#   2. Installs ~/.claude/skills/*           (adds missing, never deletes existing)
#   3. Installs ~/.claude/settings.json      (merges plugins + marketplaces into existing)
#
# What it never touches:
#   .credentials.json, settings.local.json, backups/, cache/,
#   file-history/, projects/, sessions/, history.jsonl, ide/
#
# Requires: bash, cp, jq (for settings merge)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_DIR="$HOME/.claude"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

log()  { echo -e "  ${GREEN}✔${NC} $1"; }
warn() { echo -e "  ${YELLOW}⚠${NC}  $1"; }
err()  { echo -e "  ${RED}✘${NC} $1"; exit 1; }
hdr()  { echo -e "\n${BOLD}$1${NC}"; }

# ── Sensitive file guard ────────────────────────────────────────────────────
SENSITIVE=(".credentials.json" "settings.local.json" "*.key" "*.pem" ".env" ".env.*")

is_sensitive() {
  local fname
  fname="$(basename "$1")"
  for pattern in "${SENSITIVE[@]}"; do
    case "$fname" in $pattern) return 0 ;; esac
  done
  return 1
}

# ── Preflight ───────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Claude Code — portable setup installer"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if ! command -v jq &>/dev/null; then
  err "jq is required for settings merging. Install it: sudo apt install jq  OR  brew install jq"
fi

mkdir -p "$CLAUDE_DIR/skills"

# ── 1. CLAUDE.md ─────────────────────────────────────────────────────────────
hdr "1. Global CLAUDE.md"

TARGET="$CLAUDE_DIR/CLAUDE.md"
SOURCE="$SCRIPT_DIR/CLAUDE.md"

if [[ -f "$TARGET" ]]; then
  warn "~/.claude/CLAUDE.md already exists — skipping (delete to reinstall)"
else
  cp "$SOURCE" "$TARGET"
  log "Installed ~/.claude/CLAUDE.md"
fi

# ── 2. Skills ─────────────────────────────────────────────────────────────────
hdr "2. Skills"

SKILLS_SRC="$SCRIPT_DIR/skills"
SKILLS_DST="$CLAUDE_DIR/skills"

if [[ -d "$SKILLS_SRC" ]]; then
  for skill_dir in "$SKILLS_SRC"/*/; do
    [[ -d "$skill_dir" ]] || continue
    skill_name="$(basename "$skill_dir")"
    dest="$SKILLS_DST/$skill_name"

    # Safety: reject any sensitive file inside a skill dir
    while IFS= read -r -d '' f; do
      if is_sensitive "$f"; then
        err "Refusing to install skill '$skill_name' — sensitive file found: $f"
      fi
    done < <(find "$skill_dir" -type f -print0)

    if [[ -d "$dest" ]]; then
      warn "Skill '$skill_name' already exists — skipping"
    else
      cp -r "$skill_dir" "$dest"
      log "Installed skill: $skill_name"
    fi
  done
else
  warn "No skills/ directory found in global_config/ — skipping"
fi

# ── 3. settings.json — merge, never overwrite ─────────────────────────────────
hdr "3. settings.json (plugins + marketplaces)"

SRC_SETTINGS="$SCRIPT_DIR/settings.json"
DST_SETTINGS="$CLAUDE_DIR/settings.json"

if [[ ! -f "$SRC_SETTINGS" ]]; then
  warn "No settings.json in global_config/ — skipping"
else
  if [[ ! -f "$DST_SETTINGS" ]]; then
    # No existing settings — safe to copy wholesale (no credentials in this file)
    cp "$SRC_SETTINGS" "$DST_SETTINGS"
    log "Installed ~/.claude/settings.json (fresh)"
  else
    # Snapshot existing settings BEFORE merging, so we can diff against it below
    ORIGINAL_DST=$(mktemp)
    trap 'rm -f "$ORIGINAL_DST"' EXIT
    cp "$DST_SETTINGS" "$ORIGINAL_DST"

    # Merge: add missing enabledPlugins + extraKnownMarketplaces, keep existing values
    MERGED=$(jq -s '
      .[0] as $existing |
      .[1] as $source |
      {
        enabledPlugins: (
          ($existing.enabledPlugins // {}) +
          ($source.enabledPlugins // {})
        ),
        extraKnownMarketplaces: (
          ($existing.extraKnownMarketplaces // {}) +
          ($source.extraKnownMarketplaces // {})
        )
      } +
      ($existing | del(.enabledPlugins, .extraKnownMarketplaces))
    ' "$ORIGINAL_DST" "$SRC_SETTINGS")

    echo "$MERGED" > "$DST_SETTINGS"
    log "Merged plugins + marketplaces into existing ~/.claude/settings.json"

    # Show what was added (diff source against the pre-merge snapshot, not the file we just overwrote)
    ADDED_PLUGINS=$(jq -s -r '
      (.[0].enabledPlugins // {}) as $existing |
      (.[1].enabledPlugins // {}) as $source |
      ($source | keys[]) |
      select(. as $k | ($existing | has($k)) | not)
    ' "$ORIGINAL_DST" "$SRC_SETTINGS" 2>/dev/null || true)

    if [[ -n "$ADDED_PLUGINS" ]]; then
      while IFS= read -r plugin; do
        log "  + plugin: $plugin"
      done <<< "$ADDED_PLUGINS"
    fi

    ADDED_MARKETPLACES=$(jq -s -r '
      (.[0].extraKnownMarketplaces // {}) as $existing |
      (.[1].extraKnownMarketplaces // {}) as $source |
      ($source | keys[]) |
      select(. as $k | ($existing | has($k)) | not)
    ' "$ORIGINAL_DST" "$SRC_SETTINGS" 2>/dev/null || true)

    if [[ -n "$ADDED_MARKETPLACES" ]]; then
      while IFS= read -r marketplace; do
        log "  + marketplace: $marketplace"
      done <<< "$ADDED_MARKETPLACES"
    fi

    rm -f "$ORIGINAL_DST"
    trap - EXIT
  fi
fi

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "  ${GREEN}Done.${NC} Restart Claude Code to activate."
echo ""
echo "  Plugins will auto-download from marketplace on first launch."
echo "  Skills are live immediately."
echo ""
echo "  Never touched:"
echo "    ~/.claude/.credentials.json"
echo "    ~/.claude/settings.local.json"
echo "    ~/.claude/backups/, cache/, sessions/, projects/"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
