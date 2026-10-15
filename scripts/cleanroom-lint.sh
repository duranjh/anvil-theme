#!/usr/bin/env bash
# scripts/cleanroom-lint.sh — Anvil clean-room lint.
#
# What it checks (exit 1 on any finding, each printed as path:line: message):
#   1. Forbidden tokens. The token list is parsed at run time from
#      docs/FORBIDDEN.md (sections "Vendor and product tokens",
#      "Third-party schema ids", "Reference-theme identifiers"). Tokens in
#      back-ticks are extended regular expressions; everything else is a
#      literal. Matching is case-insensitive over every file in the repo
#      except .git/, the ignored build folders, docs/FORBIDDEN.md itself,
#      this script, and (unless --strict / CLEANROOM_STRICT=1) the
#      provenance prose that has to name the things we are independent from:
#      the top-level docs/*.md, docs/agent-prompts/, README.md, NOTICE,
#      CHANGELOG.md and LICENSE. Everything that ships in the theme zip is
#      always scanned.
#      Hyphenated class-name tokens (for example a reference theme's layout
#      class) are matched only when they are not the tail of a longer
#      kebab-case identifier, so Anvil's own --av-* / .av-* names never trip
#      them while a verbatim reference class still does.
#   2. File-name prefix rule for sections/ snippets/ blocks/ assets/:
#      anvil-*, _anvil-*, main-*, plus the Shopify-fixed names
#      header-group.json, footer-group.json, overlay-group.json, apps.liquid.
#      No sub-directories.
#   3. Size rules: Liquid, asset, JSON template and section-group files
#      <= 256 KB; config/settings_schema.json <= 512 KB;
#      config/settings_data.json and locales/*.json <= 1.5 MB.
#
# Works on macOS bash 3.2 and GitHub Actions ubuntu. Uses ripgrep when present,
# otherwise GNU/BSD grep -E.
#
# Usage: scripts/cleanroom-lint.sh [--root DIR] [--strict]

set -u

usage() {
  sed -n '2,32p' "$0" | sed 's/^# \{0,1\}//'
}

ROOT=""
STRICT="${CLEANROOM_STRICT:-0}"
while [ $# -gt 0 ]; do
  case "$1" in
    --root) ROOT="$2"; shift 2 ;;
    --strict) STRICT=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "cleanroom-lint: unknown argument: $1" >&2; exit 2 ;;
  esac
done
if [ -z "$ROOT" ]; then
  ROOT="$(cd "$(dirname "$0")/.." && pwd)"
fi
cd "$ROOT" || { echo "cleanroom-lint: cannot cd to $ROOT" >&2; exit 2; }

FORBIDDEN_DOC="docs/FORBIDDEN.md"
if [ ! -f "$FORBIDDEN_DOC" ]; then
  echo "$FORBIDDEN_DOC:1: missing; the lint has no token list" >&2
  exit 2
fi

FINDINGS=0
note() { # path line message
  printf '%s:%s: %s\n' "$1" "$2" "$3"
  FINDINGS=$((FINDINGS + 1))
}

# ---------------------------------------------------------------------------
# 1. Token list from docs/FORBIDDEN.md
# ---------------------------------------------------------------------------
trim() {
  local v="$1"
  v="${v#"${v%%[![:space:]]*}"}"
  v="${v%"${v##*[![:space:]]}"}"
  printf '%s' "$v"
}

escape_ere() {
  printf '%s' "$1" | sed -e 's/[][\.*^$?+(){}|\\]/\\&/g'
}

PATTERNS=()
in_tokens=0
while IFS= read -r line || [ -n "$line" ]; do
  case "$line" in
    "## Vendor"*|"## Third-party schema"*|"## Reference-theme"*) in_tokens=1; continue ;;
    "## "*) in_tokens=0; continue ;;
    "#"*) continue ;;
  esac
  [ "$in_tokens" = 1 ] || continue
  [ -n "$(trim "$line")" ] || continue
  IFS=',' read -r -a parts <<< "$line"
  for raw in "${parts[@]}"; do
    tok="$(trim "$raw")"
    [ -n "$tok" ] || continue
    regex=""
    case "$tok" in
      \`*\`)
        tok="${tok#\`}"; tok="${tok%\`}"
        regex="$tok"
        ;;
      \"*\")
        tok="${tok#\"}"; tok="${tok%\"}"
        regex="$(escape_ere "$tok")"
        ;;
      *)
        regex="$(escape_ere "$tok")"
        ;;
    esac
    # Hyphenated class-name fragments: require that they do not continue a
    # longer kebab identifier (so --av-foo-bar never matches a token foo-bar).
    case "$regex" in
      [a-z]*-*) regex="(^|[^A-Za-z0-9_-])$regex" ;;
    esac
    PATTERNS[${#PATTERNS[@]}]="$regex"
  done
done < "$FORBIDDEN_DOC"

if [ "${#PATTERNS[@]}" -eq 0 ]; then
  echo "$FORBIDDEN_DOC:1: no tokens parsed; expected comma-separated tokens under the three token headings" >&2
  exit 2
fi

# ---------------------------------------------------------------------------
# File selection (shared by the token scan)
# ---------------------------------------------------------------------------
TMP="$(mktemp -t anvil-cleanroom.XXXXXX)"
HITS="$(mktemp -t anvil-cleanroom-hits.XXXXXX)"
trap 'rm -f "$TMP" "$HITS"' EXIT

find_files() {
  # shellcheck disable=SC2039
  if [ "$STRICT" = 1 ]; then
    find . -type f \
      ! -path './.git/*' ! -path './node_modules/*' ! -path './.harness/*' \
      ! -path './dev/*' ! -path './.shopify/*' ! -path './dist/*' \
      ! -path "./$FORBIDDEN_DOC" ! -path './scripts/cleanroom-lint.sh' \
      ! -name '*.zip' ! -name '.DS_Store' ! -name '*.png' ! -name '*.jpg' \
      ! -name '*.jpeg' ! -name '*.gif' ! -name '*.webp' ! -name '*.woff' ! -name '*.woff2' \
      -print0
  else
    find . -type f \
      ! -path './.git/*' ! -path './node_modules/*' ! -path './.harness/*' \
      ! -path './dev/*' ! -path './.shopify/*' ! -path './dist/*' \
      ! -path "./$FORBIDDEN_DOC" ! -path './scripts/cleanroom-lint.sh' \
      ! -path './docs/agent-prompts/*' ! -regex '^\./docs/[^/]*\.md$' \
      ! -path './README.md' ! -path './NOTICE' ! -path './CHANGELOG.md' ! -path './LICENSE' \
      ! -name '*.zip' ! -name '.DS_Store' ! -name '*.png' ! -name '*.jpg' \
      ! -name '*.jpeg' ! -name '*.gif' ! -name '*.webp' ! -name '*.woff' ! -name '*.woff2' \
      -print0
  fi
}

SEARCH_ARGS=()
for p in "${PATTERNS[@]}"; do
  SEARCH_ARGS[${#SEARCH_ARGS[@]}]="-e"
  SEARCH_ARGS[${#SEARCH_ARGS[@]}]="$p"
done

if command -v rg >/dev/null 2>&1; then
  TOOL="rg"
  find_files | xargs -0 rg -n -i -H --no-messages --color never --no-heading "${SEARCH_ARGS[@]}" > "$HITS" 2>/dev/null || true
else
  TOOL="grep"
  find_files | xargs -0 grep -n -i -I -H -E "${SEARCH_ARGS[@]}" > "$HITS" 2>/dev/null || true
fi

if [ -s "$HITS" ]; then
  while IFS= read -r hit; do
    path="${hit%%:*}"; rest="${hit#*:}"
    lineno="${rest%%:*}"; content="${rest#*:}"
    path="${path#./}"
    content="$(printf '%s' "$content" | cut -c1-160)"
    note "$path" "$lineno" "forbidden token: $content"
  done < "$HITS"
fi

# ---------------------------------------------------------------------------
# 2. Structural prefix rule
# ---------------------------------------------------------------------------
for dir in sections snippets blocks assets; do
  [ -d "$dir" ] || continue
  while IFS= read -r entry; do
    [ -n "$entry" ] || continue
    base="${entry##*/}"
    if [ -d "$entry" ]; then
      note "$entry" 1 "sub-directories are not allowed inside $dir/"
      continue
    fi
    case "$base" in
      .gitkeep) continue ;;
      anvil-*|_anvil-*|main-*) continue ;;
    esac
    ok=0
    case "$dir/$base" in
      sections/header-group.json|sections/footer-group.json|sections/overlay-group.json|sections/apps.liquid) ok=1 ;;
    esac
    if [ "$ok" = 0 ]; then
      note "$entry" 1 "file name must start with anvil-, _anvil- or main- (or be a Shopify-fixed name)"
    fi
  done <<EOF_LIST
$(find "$dir" -mindepth 1 -maxdepth 1 | LC_ALL=C sort)
EOF_LIST
done

# ---------------------------------------------------------------------------
# 3. Size rules
# ---------------------------------------------------------------------------
KB256=262144
KB512=524288
MB15=1572864

limit_for() {
  case "$1" in
    config/settings_schema.json) echo "$KB512" ;;
    config/settings_data.json|locales/*.json) echo "$MB15" ;;
    *) echo "$KB256" ;;
  esac
}

for dir in assets blocks config layout locales sections snippets templates; do
  [ -d "$dir" ] || continue
  while IFS= read -r f; do
    [ -n "$f" ] || continue
    [ -f "$f" ] || continue
    size="$(wc -c < "$f" | tr -d ' ')"
    limit="$(limit_for "$f")"
    if [ "$size" -gt "$limit" ]; then
      note "$f" 1 "file is $size bytes; limit is $limit"
    fi
  done <<EOF_SIZES
$(find "$dir" -type f ! -name '.gitkeep' | LC_ALL=C sort)
EOF_SIZES
done

# ---------------------------------------------------------------------------
if [ "$FINDINGS" -gt 0 ]; then
  echo "cleanroom-lint: $FINDINGS finding(s) [${#PATTERNS[@]} token patterns, $TOOL]" >&2
  exit 1
fi
echo "cleanroom-lint: clean (${#PATTERNS[@]} token patterns, $TOOL)"
exit 0
