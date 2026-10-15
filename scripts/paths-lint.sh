#!/usr/bin/env bash
# scripts/paths-lint.sh — fail when the working tree (or a diff) touches
# anything outside the allowed path globs.
#
# Usage:
#   scripts/paths-lint.sh [--root DIR] [--base REF] GLOB [GLOB ...]
#
#   GLOB is a shell pattern matched against repo-relative paths, e.g.
#     'sections/anvil-ticker.liquid' 'blocks/_anvil-ticker-*.liquid'
#     'assets/anvil-ticker*' 'docs/sections/ticker.md'
#   `*` matches across `/` (plain string pattern matching), so
#   'assets/anvil-ticker*' also covers 'assets/anvil-ticker-item.css'.
#
#   --base REF additionally checks `git diff --name-only REF` so committed
#   work on an agent branch is covered, not only the dirty tree.
#
# Every offending path is printed as path:1: message; exit 1 when any exists.

set -u

ROOT=""
BASE=""
GLOBS=()
while [ $# -gt 0 ]; do
  case "$1" in
    --root) ROOT="$2"; shift 2 ;;
    --base) BASE="$2"; shift 2 ;;
    -h|--help) sed -n '2,18p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) GLOBS[${#GLOBS[@]}]="$1"; shift ;;
  esac
done
[ -n "$ROOT" ] || ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" || { echo "paths-lint: cannot cd to $ROOT" >&2; exit 2; }

if [ "${#GLOBS[@]}" -eq 0 ]; then
  echo "paths-lint: pass at least one allowed path glob" >&2
  exit 2
fi
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "paths-lint: $ROOT is not a git work tree" >&2
  exit 2
fi

allowed() {
  local p="$1" g
  for g in "${GLOBS[@]}"; do
    # shellcheck disable=SC2254
    case "$p" in
      $g) return 0 ;;
    esac
  done
  return 1
}

FINDINGS=0
check_path() {
  local p="$1"
  [ -n "$p" ] || return 0
  if ! allowed "$p"; then
    printf '%s:1: changed outside the allowed paths\n' "$p"
    FINDINGS=$((FINDINGS + 1))
  fi
}

# Working tree (staged, unstaged, untracked). Rename lines read "R  old -> new".
while IFS= read -r line; do
  [ -n "$line" ] || continue
  entry="${line:3}"
  case "$entry" in
    *" -> "*) entry="${entry##* -> }" ;;
  esac
  entry="${entry%\"}"; entry="${entry#\"}"
  check_path "$entry"
done <<EOF_STATUS
$(git status --porcelain -uall 2>/dev/null)
EOF_STATUS

# Committed diff against a base ref, when asked.
if [ -n "$BASE" ]; then
  while IFS= read -r p; do
    check_path "$p"
  done <<EOF_DIFF
$(git diff --name-only "$BASE" 2>/dev/null)
EOF_DIFF
fi

if [ "$FINDINGS" -gt 0 ]; then
  echo "paths-lint: $FINDINGS path(s) outside: ${GLOBS[*]}" >&2
  exit 1
fi
echo "paths-lint: all changes within the allowed paths"
exit 0
