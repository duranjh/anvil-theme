#!/usr/bin/env bash
# scripts/package.sh — build the release zip.
#
#   1. shopify theme check --fail-level warning   (0 findings or stop)
#   2. shopify theme package                      (-> <theme_name>-<theme_version>.zip)
#   3. verify the zip: layout/theme.liquid, config/settings_schema.json,
#      sections/, snippets/, templates/, assets/, locales/ sit at the zip root;
#      no docs/, scripts/, .github/ or node_modules/ inside; size <= 50 MB
#      (warn above 2 MB)
#   4. move it to dist/ and print the path
#
# Usage: scripts/package.sh [--root DIR] [--skip-check]

set -u
ROOT=""
SKIP_CHECK=0
while [ $# -gt 0 ]; do
  case "$1" in
    --root) ROOT="$2"; shift 2 ;;
    --skip-check) SKIP_CHECK=1; shift ;;
    -h|--help) sed -n '2,13p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "package: unknown argument $1" >&2; exit 2 ;;
  esac
done
[ -n "$ROOT" ] || ROOT="$(cd "$(dirname "$0")/.." && pwd)"
[ -d /opt/homebrew/opt/node@22/bin ] && export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
export SHOPIFY_CLI_NO_ANALYTICS=1
cd "$ROOT" || exit 2

command -v shopify >/dev/null 2>&1 || { echo "package: shopify CLI not on PATH (npm i -g @shopify/cli)" >&2; exit 2; }
[ -f config/settings_schema.json ] || { echo "config/settings_schema.json:1: missing; cannot name the package" >&2; exit 1; }

read -r THEME_NAME THEME_VERSION <<EOF_INFO
$(python3 - <<'PY'
import json, re, sys
text = open("config/settings_schema.json", encoding="utf-8").read()
text = re.sub(r"^\s*/\*.*?\*/\s*", "", text, flags=re.S)
data = json.loads(text)
info = next((g for g in data if isinstance(g, dict) and g.get("name") == "theme_info"), {})
print(info.get("theme_name", "").replace(" ", "_") or "theme", info.get("theme_version", "") or "0.0.0")
PY
)
EOF_INFO
echo "package: $THEME_NAME $THEME_VERSION"

if [ "$SKIP_CHECK" = 0 ]; then
  echo "== theme check"
  shopify theme check --fail-level warning --path "$ROOT" || { echo "package: theme check failed; fix findings first" >&2; exit 1; }
fi

echo "== theme package"
BEFORE="$(ls -1 *.zip 2>/dev/null | LC_ALL=C sort)"
shopify theme package --path "$ROOT" --no-input || { echo "package: shopify theme package failed" >&2; exit 1; }
AFTER="$(ls -1 *.zip 2>/dev/null | LC_ALL=C sort)"
ZIP=""
for z in $AFTER; do
  case "$BEFORE" in *"$z"*) ;; *) ZIP="$z" ;; esac
done
[ -n "$ZIP" ] || ZIP="$(ls -1t *.zip 2>/dev/null | head -1)"
[ -n "$ZIP" ] && [ -f "$ZIP" ] || { echo "package: no zip produced" >&2; exit 1; }
echo "package: produced $ZIP"

echo "== verify"
FINDINGS=0
note() { echo "$ZIP:1: $1"; FINDINGS=$((FINDINGS + 1)); }
LIST="$(unzip -Z1 "$ZIP" 2>/dev/null)" || { echo "package: unzip cannot read $ZIP" >&2; exit 1; }
has() { printf '%s\n' "$LIST" | grep -q -x -E "$1"; }
has 'layout/theme\.liquid' || note "layout/theme.liquid not at the zip root"
has 'config/settings_schema\.json' || note "config/settings_schema.json not at the zip root"
for d in sections snippets templates assets locales; do
  has "$d/.+" || note "no files under $d/ at the zip root"
done
for bad in docs scripts .github node_modules .harness dev dist; do
  if printf '%s\n' "$LIST" | grep -q -E "^$bad/"; then note "$bad/ must not ship in the theme zip"; fi
done
if printf '%s\n' "$LIST" | grep -q -E '^[^/]+/(layout|config)/'; then note "theme folders are nested one level deep; Shopify needs them at the root"; fi
SIZE="$(wc -c < "$ZIP" | tr -d ' ')"
[ "$SIZE" -le 52428800 ] || note "zip is $SIZE bytes; Shopify's limit is 50 MB"
[ "$SIZE" -le 2097152 ] || echo "package: warning: zip is $SIZE bytes; the design budget is 2 MB"

mkdir -p dist
mv -f "$ZIP" "dist/$ZIP"
if [ "$FINDINGS" -gt 0 ]; then
  echo "package: $FINDINGS problem(s) with dist/$ZIP" >&2
  exit 1
fi
echo "package: OK dist/$ZIP ($SIZE bytes)"
exit 0
