#!/usr/bin/env bash
# scripts/gate.sh — the per-section quality gate (DESIGN-sections §5, G0–G4).
#
# Usage:
#   scripts/gate.sh <slug|anvil-slug> [--slot N] [--allow GLOB]... [--no-paths]
#                   [--no-push] [--report-dir DIR] [--root DIR]
#   npm run gate -- <slug>
#
# Static gates (always run, all of them, then one summary):
#   G0 paths-lint   working tree touches only the slug's allowed paths
#                   (sections/anvil-<slug>.liquid, blocks/_anvil-<slug>-*.liquid,
#                   assets/anvil-<slug>*, docs/sections/<slug>.md, plus --allow)
#   G1 theme check  `shopify theme check --fail-level warning` on the whole theme
#   G2 lints        cleanroom-lint, asset-audit, chassis-lint, check-limits
#
# Push + screenshot stage (only when every static gate passed and the three
# env vars are set; otherwise printed as SKIP):
#   DEV_THEME_ID   id of the shared unpublished dev theme (never the live theme)
#   STORE          my-store.myshopify.com
#   THEME_TOKEN    Theme Access password (passed via SHOPIFY_CLI_THEME_TOKEN)
#   SCRATCH_PAGE   handle of an existing page to render the scratch view on
#                  (default: contact). No store content is ever created.
#   STORE_PASSWORD storefront password when the dev store is password-protected
#   G3 scratch-template.py -> .harness/stage/<slot>, then
#      shopify theme push --path <stage> --theme $DEV_THEME_ID --only <agent files>
#        --only templates/page.anvil-scratch-<slot>.json --nodelete --json --no-input
#      under a repo-wide lock with >= 5 s between pushes
#   G4 node scripts/screenshot.mjs at 375x812@2x and 1280x800 (+ a reduced-motion
#      run, console errors, axe when @axe-core/playwright is installed)
#
# Reports land in .harness/reports/<slug>/. Exit 1 when any gate fails.

set -u

SELF_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SELF_DIR/.." && pwd)"
[ -d /opt/homebrew/opt/node@22/bin ] && export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
export SHOPIFY_CLI_NO_ANALYTICS=1

SLUG=""
SLOT="${SLOT:-1}"
EXTRA_ALLOW=()
DO_PATHS=1
DO_PUSH=1
REPORT_DIR=""
while [ $# -gt 0 ]; do
  case "$1" in
    --slot) SLOT="$2"; shift 2 ;;
    --allow) EXTRA_ALLOW[${#EXTRA_ALLOW[@]}]="$2"; shift 2 ;;
    --no-paths) DO_PATHS=0; shift ;;
    --no-push) DO_PUSH=0; shift ;;
    --report-dir) REPORT_DIR="$2"; shift 2 ;;
    --root) ROOT="$(cd "$2" && pwd)"; shift 2 ;;
    -h|--help) sed -n '2,36p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    -*) echo "gate: unknown option $1" >&2; exit 2 ;;
    *) if [ -z "$SLUG" ]; then SLUG="$1"; else echo "gate: unexpected argument $1" >&2; exit 2; fi; shift ;;
  esac
done
[ -n "$SLUG" ] || { echo "gate: usage: scripts/gate.sh <slug> [--slot N] [--allow GLOB]... [--no-paths] [--no-push]" >&2; exit 2; }
SLUG="${SLUG##*/}"; SLUG="${SLUG%.liquid}"; SLUG="${SLUG#anvil-}"
[ "${GATE_SKIP_PATHS:-0}" = 1 ] && DO_PATHS=0
[ -n "$REPORT_DIR" ] || REPORT_DIR="$ROOT/.harness/reports/$SLUG"
mkdir -p "$REPORT_DIR"
cd "$ROOT" || exit 2

NAMES=()
RESULTS=()
record() { NAMES[${#NAMES[@]}]="$1"; RESULTS[${#RESULTS[@]}]="$2"; }

run_gate() { # name logfile cmd...
  local name="$1" log="$2"; shift 2
  echo
  echo "=== $name"
  "$@" 2>&1 | tee "$REPORT_DIR/$log"
  local rc="${PIPESTATUS[0]}"
  if [ "$rc" -eq 0 ]; then record "$name" PASS; else record "$name" "FAIL($rc)"; fi
  return "$rc"
}

STATIC_OK=1

# --- G0 paths ---------------------------------------------------------------
if [ "$DO_PATHS" = 1 ]; then
  ALLOW=("sections/anvil-$SLUG.liquid" "blocks/_anvil-$SLUG-*.liquid" "assets/anvil-$SLUG*" "docs/sections/$SLUG.md")
  if [ "${#EXTRA_ALLOW[@]}" -gt 0 ]; then
    for g in "${EXTRA_ALLOW[@]}"; do ALLOW[${#ALLOW[@]}]="$g"; done
  fi
  run_gate "G0 paths-lint" paths-lint.log bash "$SELF_DIR/paths-lint.sh" --root "$ROOT" "${ALLOW[@]}" || STATIC_OK=0
else
  record "G0 paths-lint" SKIP
fi

# --- G1 theme check -----------------------------------------------------------
if command -v shopify >/dev/null 2>&1; then
  run_gate "G1 theme check" theme-check.log shopify theme check --fail-level warning --path "$ROOT" || STATIC_OK=0
  # A run that inspects nothing is a vacuous pass, not a pass. The usual cause is an
  # ignore pattern in .theme-check.yml (e.g. dev/**) that also matches a component of
  # the checkout path; move the checkout or anchor the pattern.
  if grep -q -E '(^|[^0-9])0 files inspected' "$REPORT_DIR/theme-check.log" 2>/dev/null; then
    echo "gate: theme check inspected 0 files; refusing to count that as a pass" | tee -a "$REPORT_DIR/theme-check.log"
    i=0
    while [ "$i" -lt "${#NAMES[@]}" ]; do
      [ "${NAMES[$i]}" = "G1 theme check" ] && RESULTS[$i]="FAIL(0-files)"
      i=$((i + 1))
    done
    STATIC_OK=0
  fi
else
  echo "gate: shopify CLI not on PATH (npm i -g @shopify/cli)" | tee "$REPORT_DIR/theme-check.log"
  record "G1 theme check" "FAIL(no-cli)"; STATIC_OK=0
fi

# --- G2 lints -----------------------------------------------------------------
run_gate "G2 cleanroom-lint" cleanroom-lint.log bash "$SELF_DIR/cleanroom-lint.sh" --root "$ROOT" || STATIC_OK=0
run_gate "G2 asset-audit" asset-audit.log python3 "$SELF_DIR/asset-audit.py" --root "$ROOT" || STATIC_OK=0
run_gate "G2 chassis-lint" chassis-lint.log python3 "$SELF_DIR/chassis-lint.py" --root "$ROOT" || STATIC_OK=0
run_gate "G2 check-limits" check-limits.log bash "$SELF_DIR/check-limits.sh" --root "$ROOT" || STATIC_OK=0

# --- G3/G4 push + screenshots ---------------------------------------------------
PUSH_READY=1
for v in DEV_THEME_ID STORE THEME_TOKEN; do
  eval "val=\${$v:-}"
  [ -n "$val" ] || PUSH_READY=0
done

if [ "$DO_PUSH" = 0 ]; then
  record "G3 push" SKIP; record "G4 screenshots" SKIP
elif [ "$PUSH_READY" = 0 ]; then
  echo
  echo "=== G3/G4 SKIP: set DEV_THEME_ID, STORE and THEME_TOKEN to push the scratch page and screenshot it"
  record "G3 push" SKIP; record "G4 screenshots" SKIP
elif [ "$STATIC_OK" = 0 ]; then
  echo
  echo "=== G3/G4 SKIP: static gates failed; nothing is pushed"
  record "G3 push" SKIP; record "G4 screenshots" SKIP
else
  STORE_HOST="${STORE#https://}"; STORE_HOST="${STORE_HOST#http://}"; STORE_HOST="${STORE_HOST%/}"
  SCRATCH_PAGE="${SCRATCH_PAGE:-contact}"
  STAGE="$ROOT/.harness/stage/$SLOT"
  echo
  echo "=== G3 stage + push (slot $SLOT, theme $DEV_THEME_ID on $STORE_HOST)"
  STAGE_OUT="$(python3 "$SELF_DIR/scratch-template.py" "$SLUG" --slot "$SLOT" --stage "$STAGE" --root "$ROOT" 2>&1)"
  rc=$?
  printf '%s\n' "$STAGE_OUT" | tee "$REPORT_DIR/stage.log"
  if [ "$rc" -ne 0 ]; then
    record "G3 push" "FAIL(stage)"; record "G4 screenshots" SKIP
  else
    ONLY_ARGS=()
    first=1
    while IFS= read -r line; do
      [ -n "$line" ] || continue
      case "$line" in warning:*) continue ;; esac
      if [ "$first" = 1 ]; then first=0; continue; fi   # line 1 = stage dir
      ONLY_ARGS[${#ONLY_ARGS[@]}]="--only"; ONLY_ARGS[${#ONLY_ARGS[@]}]="$line"
    done <<EOF_STAGE
$STAGE_OUT
EOF_STAGE
    if [ "${#EXTRA_ALLOW[@]}" -gt 0 ]; then
      for g in "${EXTRA_ALLOW[@]}"; do
        for f in $g; do
          [ -f "$STAGE/$f" ] && { ONLY_ARGS[${#ONLY_ARGS[@]}]="--only"; ONLY_ARGS[${#ONLY_ARGS[@]}]="$f"; }
        done
      done
    fi

    # repo-wide push lock (mkdir is atomic on every platform) + 5 s spacing
    LOCK="$ROOT/.harness/push.lock"
    STAMP="$ROOT/.harness/last-push"
    waited=0
    while ! mkdir "$LOCK" 2>/dev/null; do
      if [ "$waited" -ge 180 ]; then echo "gate: push lock held for 3 minutes; remove $LOCK if stale" >&2; break; fi
      sleep 1; waited=$((waited + 1))
    done
    trap 'rmdir "$LOCK" 2>/dev/null' EXIT
    last="$(cat "$STAMP" 2>/dev/null || echo 0)"
    now="$(date +%s)"
    gap=$((now - last))
    if [ "$gap" -lt 5 ]; then sleep $((5 - gap)); fi

    echo "shopify theme push --path $STAGE --theme $DEV_THEME_ID --nodelete ${ONLY_ARGS[*]}"
    SHOPIFY_CLI_THEME_TOKEN="$THEME_TOKEN" shopify theme push \
      --path "$STAGE" --store "$STORE_HOST" --theme "$DEV_THEME_ID" \
      --nodelete --json --no-input "${ONLY_ARGS[@]}" 2>&1 | tee "$REPORT_DIR/push.log"
    rc="${PIPESTATUS[0]}"
    date +%s > "$STAMP"
    rmdir "$LOCK" 2>/dev/null; trap - EXIT
    if [ "$rc" -ne 0 ]; then
      record "G3 push" "FAIL($rc)"; record "G4 screenshots" SKIP
    else
      record "G3 push" PASS
      echo
      echo "=== G4 screenshots"
      URL="https://$STORE_HOST/pages/$SCRATCH_PAGE?view=anvil-scratch-$SLOT&preview_theme_id=$DEV_THEME_ID&pb=0"
      if command -v node >/dev/null 2>&1; then
        SCRATCH_URL="$URL" OUT_DIR="$REPORT_DIR" SECTION_TYPE="anvil-$SLUG" STORE_PASSWORD="${STORE_PASSWORD:-}" \
          node "$SELF_DIR/screenshot.mjs" 2>&1 | tee "$REPORT_DIR/screenshot.log"
        rc="${PIPESTATUS[0]}"
        case "$rc" in
          0) record "G4 screenshots" PASS ;;
          3) record "G4 screenshots" "SKIP(playwright)" ;;
          *) record "G4 screenshots" "FAIL($rc)" ;;
        esac
      else
        echo "gate: node not found; screenshots skipped"
        record "G4 screenshots" "SKIP(node)"
      fi
    fi
  fi
fi

# --- summary --------------------------------------------------------------------
echo
echo "=== gate summary for anvil-$SLUG (reports: ${REPORT_DIR#$ROOT/})"
FAILED=0
i=0
while [ "$i" -lt "${#NAMES[@]}" ]; do
  printf '  %-20s %s\n' "${NAMES[$i]}" "${RESULTS[$i]}"
  case "${RESULTS[$i]}" in FAIL*) FAILED=1 ;; esac
  i=$((i + 1))
done
if [ "$FAILED" = 1 ]; then
  echo "gate: FAILED"
  exit 1
fi
echo "gate: PASSED (skips are not failures)"
exit 0
