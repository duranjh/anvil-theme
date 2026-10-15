#!/usr/bin/env bash
# scripts/check-limits.sh — Shopify platform limits for the Anvil theme.
#
# Checks (exit 1 on any finding, printed as path:line: message; file-level
# findings use line 1):
#   - every *.liquid file < 256 KB
#   - config/settings_schema.json < 512 KB
#   - config/settings_data.json and locales/*.json < 1.5 MB
#   - templates/**/*.json and sections/*.json (section groups) < 512 KB
#   - locale files: fewer than 3,400 translation keys, no value over 1,000 chars
#   - JSON validity of templates/**/*.json, config/*.json, locales/*.json,
#     sections/*.json (a leading /* ... */ comment, as Shopify writes it, is
#     tolerated)
#   - JSON templates: `sections` + `order` agree, <= 25 sections, <= 50 blocks
#     per section, block_order agrees with blocks; section groups carry
#     type/name/sections/order
#   - blocks/ holds at most 300 files
#
# Usage: scripts/check-limits.sh [--root DIR]

set -u

ROOT=""
while [ $# -gt 0 ]; do
  case "$1" in
    --root) ROOT="$2"; shift 2 ;;
    -h|--help) sed -n '2,20p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "check-limits: unknown argument: $1" >&2; exit 2 ;;
  esac
done
[ -n "$ROOT" ] || ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" || { echo "check-limits: cannot cd to $ROOT" >&2; exit 2; }

FINDINGS=0
note() { printf '%s:%s: %s\n' "$1" "$2" "$3"; FINDINGS=$((FINDINGS + 1)); }

KB256=262144
KB512=524288
MB15=1572864

size_of() { wc -c < "$1" | tr -d ' '; }

# --- Liquid files -----------------------------------------------------------
while IFS= read -r f; do
  [ -n "$f" ] || continue
  s="$(size_of "$f")"
  [ "$s" -lt "$KB256" ] || note "${f#./}" 1 "Liquid file is $s bytes; limit 262144"
done <<EOF_LIQ
$(find . -type f -name '*.liquid' ! -path './.git/*' ! -path './node_modules/*' ! -path './.harness/*' ! -path './dev/*' ! -path './dist/*' | LC_ALL=C sort)
EOF_LIQ

# --- Config and locale sizes --------------------------------------------------
if [ -f config/settings_schema.json ]; then
  s="$(size_of config/settings_schema.json)"
  [ "$s" -lt "$KB512" ] || note config/settings_schema.json 1 "settings_schema.json is $s bytes; limit 524288"
fi
if [ -f config/settings_data.json ]; then
  s="$(size_of config/settings_data.json)"
  [ "$s" -lt "$MB15" ] || note config/settings_data.json 1 "settings_data.json is $s bytes; limit 1572864"
fi
for f in locales/*.json; do
  [ -f "$f" ] || continue
  s="$(size_of "$f")"
  [ "$s" -lt "$MB15" ] || note "$f" 1 "locale file is $s bytes; limit 1572864"
done
for f in templates/*.json templates/customers/*.json templates/metaobject/*.json sections/*.json; do
  [ -f "$f" ] || continue
  s="$(size_of "$f")"
  [ "$s" -lt "$KB512" ] || note "$f" 1 "JSON file is $s bytes; limit 524288"
done

# --- blocks/ file count -------------------------------------------------------
if [ -d blocks ]; then
  n="$(find blocks -maxdepth 1 -type f -name '*.liquid' | wc -l | tr -d ' ')"
  [ "$n" -le 300 ] || note blocks 1 "blocks/ holds $n files; limit 300"
fi

# --- JSON validity, structure and locale key counts ---------------------------
JSON_LIST="$(mktemp -t anvil-json-list.XXXXXX)"
trap 'rm -f "$JSON_LIST"' EXIT
find templates config locales sections -type f -name '*.json' 2>/dev/null | LC_ALL=C sort > "$JSON_LIST"
if [ -s "$JSON_LIST" ]; then
  # the Python source arrives on stdin, so the file list travels as argv[1]
  out="$(python3 - "$JSON_LIST" <<'PY'
import json, re, sys

LOCALE_KEY_LIMIT = 3400
LOCALE_VALUE_LIMIT = 1000
findings = 0

def note(path, line, msg):
    global findings
    findings += 1
    print(f"{path}:{line}: {msg}")

def strip_leading_comment(text):
    m = re.match(r"\s*/\*.*?\*/\s*", text, re.S)
    if m:
        return text[m.end():], text.count("\n", 0, m.end())
    return text, 0

def count_leaves(obj, path, out):
    if isinstance(obj, dict):
        for k, v in obj.items():
            count_leaves(v, path + (k,), out)
    else:
        out.append((path, obj))

for raw in open(sys.argv[1], encoding="utf-8").read().splitlines():
    path = raw.strip()
    if not path:
        continue
    try:
        with open(path, "r", encoding="utf-8") as fh:
            text = fh.read()
    except OSError as exc:
        note(path, 1, f"cannot read: {exc}")
        continue
    body, offset = strip_leading_comment(text)
    try:
        data = json.loads(body)
    except json.JSONDecodeError as exc:
        note(path, exc.lineno + offset, f"invalid JSON: {exc.msg}")
        continue

    if path.startswith("locales/"):
        leaves = []
        count_leaves(data, (), leaves)
        if len(leaves) >= LOCALE_KEY_LIMIT:
            note(path, 1, f"{len(leaves)} translation keys; must stay below {LOCALE_KEY_LIMIT}")
        for keypath, value in leaves:
            if isinstance(value, str) and len(value) > LOCALE_VALUE_LIMIT:
                note(path, 1, f"value of {'.'.join(keypath)} is {len(value)} chars; limit {LOCALE_VALUE_LIMIT}")
        continue

    if path.startswith("templates/"):
        if not isinstance(data, dict):
            note(path, 1, "template root must be an object")
            continue
        sections = data.get("sections")
        order = data.get("order")
        if not isinstance(sections, dict) or not sections:
            note(path, 1, "template needs a non-empty `sections` object")
            continue
        if not isinstance(order, list):
            note(path, 1, "template needs an `order` array")
            continue
        if len(sections) > 25:
            note(path, 1, f"{len(sections)} sections; limit 25 per template")
        if len(order) != len(set(order)):
            note(path, 1, "`order` contains duplicate ids")
        for sid in order:
            if sid not in sections:
                note(path, 1, f"`order` names unknown section id `{sid}`")
        for sid in sections:
            if sid not in order:
                note(path, 1, f"section `{sid}` is missing from `order`")
        for sid, sec in sections.items():
            if not isinstance(sec, dict) or "type" not in sec:
                note(path, 1, f"section `{sid}` needs a `type`")
                continue
            blocks = sec.get("blocks") or {}
            border = sec.get("block_order") or []
            if len(blocks) > 50:
                note(path, 1, f"section `{sid}` has {len(blocks)} blocks; limit 50")
            for bid in border:
                if bid not in blocks:
                    note(path, 1, f"section `{sid}`: block_order names unknown block `{bid}`")
            for bid in blocks:
                if bid not in border:
                    note(path, 1, f"section `{sid}`: block `{bid}` missing from block_order")
        continue

    if path.startswith("sections/"):
        if not isinstance(data, dict):
            note(path, 1, "section group root must be an object")
            continue
        for key in ("type", "name", "sections", "order"):
            if key not in data:
                note(path, 1, f"section group is missing `{key}`")
        sections = data.get("sections") or {}
        order = data.get("order") or []
        if isinstance(sections, dict) and isinstance(order, list):
            if len(sections) > 25:
                note(path, 1, f"{len(sections)} sections; limit 25 per group")
            for sid in order:
                if sid not in sections:
                    note(path, 1, f"`order` names unknown section id `{sid}`")
        continue

    if path == "config/settings_schema.json":
        if not isinstance(data, list) or not data:
            note(path, 1, "settings_schema.json must be a non-empty array")
        else:
            info = next((g for g in data if isinstance(g, dict) and g.get("name") == "theme_info"), None)
            if info is None:
                note(path, 1, "settings_schema.json has no theme_info entry")
            else:
                for key in ("theme_name", "theme_version", "theme_author"):
                    if not info.get(key):
                        note(path, 1, f"theme_info is missing `{key}`")
        continue

print(f"__FINDINGS__={findings}")
PY
)"
  printf '%s\n' "$out" | grep -v '^__FINDINGS__=' || true
  n="$(printf '%s\n' "$out" | sed -n 's/^__FINDINGS__=//p')"
  [ -n "$n" ] || n=1
  FINDINGS=$((FINDINGS + n))
fi

if [ "$FINDINGS" -gt 0 ]; then
  echo "check-limits: $FINDINGS finding(s)" >&2
  exit 1
fi
echo "check-limits: all limits respected"
exit 0
