#!/usr/bin/env bash
# scripts/a11y.sh — axe-core pass over the dev theme at 375 px and 1280 px.
#
# Usage:
#   scripts/a11y.sh [URL ...]
#
# With no URLs it checks the storefront paths that matter most on the dev
# theme: /, /collections/all, /cart, /search?q=a, /pages/$SCRATCH_PAGE and,
# when PRODUCT_HANDLE is set, /products/$PRODUCT_HANDLE.
#
# Env: STORE, DEV_THEME_ID (both required unless full URLs are given),
#      STORE_PASSWORD (password-protected dev store), PRODUCT_HANDLE,
#      SCRATCH_PAGE (default contact), A11Y_REPORT_DIR (default .harness/reports/a11y)
#
# Each page runs through scripts/screenshot.mjs in MODE=a11y (axe serious or
# critical violations and first-party console errors fail). Skips with a notice
# when playwright or @axe-core/playwright is not installed. Exit 1 on findings.

set -u
SELF_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SELF_DIR/.." && pwd)"
[ -d /opt/homebrew/opt/node@22/bin ] && export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
cd "$ROOT" || exit 2

REPORT_DIR="${A11Y_REPORT_DIR:-$ROOT/.harness/reports/a11y}"
mkdir -p "$REPORT_DIR"

URLS=()
if [ $# -gt 0 ]; then
  for u in "$@"; do URLS[${#URLS[@]}]="$u"; done
else
  if [ -z "${STORE:-}" ] || [ -z "${DEV_THEME_ID:-}" ]; then
    echo "a11y: SKIPPED — set STORE and DEV_THEME_ID (or pass full URLs)"
    exit 0
  fi
  HOST="${STORE#https://}"; HOST="${HOST#http://}"; HOST="${HOST%/}"
  Q="preview_theme_id=$DEV_THEME_ID&pb=0"
  URLS[${#URLS[@]}]="https://$HOST/?$Q"
  URLS[${#URLS[@]}]="https://$HOST/collections/all?$Q"
  URLS[${#URLS[@]}]="https://$HOST/cart?$Q"
  URLS[${#URLS[@]}]="https://$HOST/search?q=a&$Q"
  URLS[${#URLS[@]}]="https://$HOST/pages/${SCRATCH_PAGE:-contact}?$Q"
  [ -n "${PRODUCT_HANDLE:-}" ] && URLS[${#URLS[@]}]="https://$HOST/products/$PRODUCT_HANDLE?$Q"
fi

if ! command -v node >/dev/null 2>&1; then
  echo "a11y: SKIPPED — node not found"
  exit 0
fi

FAILED=0
SKIPPED=0
i=0
for u in "${URLS[@]}"; do
  i=$((i + 1))
  name="$(printf '%s' "$u" | sed -e 's#^https\{0,1\}://[^/]*##' -e 's#[?].*$##' -e 's#[^A-Za-z0-9]#-#g' -e 's#^-*##' -e 's#-*$##')"
  [ -n "$name" ] || name="home"
  echo "=== $u"
  SCRATCH_URL="$u" MODE=a11y OUT_DIR="$REPORT_DIR/$i-$name" STORE_PASSWORD="${STORE_PASSWORD:-}" node "$SELF_DIR/screenshot.mjs"
  rc=$?
  case "$rc" in
    0) ;;
    3) SKIPPED=1; break ;;
    *) FAILED=1 ;;
  esac
done

if [ "$SKIPPED" = 1 ]; then
  echo "a11y: SKIPPED — install playwright and @axe-core/playwright (npm install && npx playwright install chromium)"
  exit 0
fi
if [ "$FAILED" = 1 ]; then
  echo "a11y: findings; see $REPORT_DIR" >&2
  exit 1
fi
echo "a11y: clean (${#URLS[@]} page(s))"
exit 0
