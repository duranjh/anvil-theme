#!/usr/bin/env python3
"""scripts/check-schema-ranges.py — validate every `range` setting the way Shopify's upload does.

Theme Check does not catch these; Shopify rejects the file on upload ("default must be a step in the range").
Checks config/settings_schema.json and the {% schema %} of every sections/*.liquid and blocks/*.liquid,
including block settings and docs/product-blocks/*.json fragments:
  * min < max, step > 0, step >= 0.1
  * (max - min) / step <= 101 and is a whole number
  * default present, min <= default <= max, (default - min) / step is a whole number
Exit 1 with file:setting messages on any problem. Usage: scripts/check-schema-ranges.py [--root DIR]
"""
import glob, json, os, re, sys
from fractions import Fraction

root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if '--root' in sys.argv[1:]:  # same flag as the other gate scripts
    root = os.path.abspath(sys.argv[sys.argv.index('--root') + 1])
problems = []

def frac(x):
    return Fraction(str(x))

def check_settings(settings, where):
    for s in settings or []:
        if not isinstance(s, dict) or s.get('type') != 'range':
            continue
        sid = s.get('id', '?')
        try:
            mn, mx, st = frac(s['min']), frac(s['max']), frac(s.get('step', 1))
        except KeyError as e:
            problems.append(f"{where}: range '{sid}' missing {e}")
            continue
        if st <= 0 or st < Fraction(1, 10):
            problems.append(f"{where}: range '{sid}' step {s.get('step')} must be >= 0.1")
            continue
        if mn >= mx:
            problems.append(f"{where}: range '{sid}' min {s['min']} must be < max {s['max']}")
        span = (mx - mn) / st
        if span.denominator != 1:
            problems.append(f"{where}: range '{sid}' (max-min)/step = {float(span):g} is not a whole number")
        elif span > 101:
            problems.append(f"{where}: range '{sid}' has {int(span)} steps; Shopify allows at most 101")
        if 'default' not in s:
            problems.append(f"{where}: range '{sid}' needs a default")
            continue
        d = frac(s['default'])
        if d < mn or d > mx:
            problems.append(f"{where}: range '{sid}' default {s['default']} outside {s['min']}..{s['max']}")
        elif ((d - mn) / st).denominator != 1:
            problems.append(f"{where}: range '{sid}' default {s['default']} is not min + n*step (min {s['min']}, step {s.get('step', 1)})")

def check_schema(obj, where):
    if isinstance(obj, list):  # settings_schema.json
        for i, group in enumerate(obj):
            check_settings(group.get('settings'), f"{where} [{group.get('name', i)}]")
        return
    check_settings(obj.get('settings'), where)
    for b in obj.get('blocks', []) or []:
        check_settings(b.get('settings'), f"{where} block '{b.get('type')}'")

def load_liquid_schema(path):
    src = open(path, encoding='utf-8').read()
    m = re.search(r'{%-?\s*schema\s*-?%}(.*?){%-?\s*endschema\s*-?%}', src, re.S)
    if not m:
        return None
    body = re.sub(r'^\s*//.*$', '', m.group(1), flags=re.M)
    return json.loads(body)

rel = lambda p: os.path.relpath(p, root)
try:
    check_schema(json.load(open(os.path.join(root, 'config/settings_schema.json'))), 'config/settings_schema.json')
except Exception as e:
    problems.append(f"config/settings_schema.json: cannot parse ({e})")
for path in sorted(glob.glob(os.path.join(root, 'sections/*.liquid')) + glob.glob(os.path.join(root, 'blocks/*.liquid'))):
    try:
        sch = load_liquid_schema(path)
    except Exception as e:
        problems.append(f"{rel(path)}: schema does not parse ({e})")
        continue
    if sch is not None:
        check_schema(sch, rel(path))
for path in sorted(glob.glob(os.path.join(root, 'docs/product-blocks/*.json'))):
    try:
        obj = json.load(open(path))
    except Exception as e:
        problems.append(f"{rel(path)}: does not parse ({e})")
        continue
    if isinstance(obj, list):
        check_settings(obj, rel(path))
    else:
        check_schema(obj, rel(path))

for p in problems:
    print(p)
print(f"check-schema-ranges: {'clean' if not problems else str(len(problems)) + ' problem(s)'}", file=sys.stderr)
sys.exit(1 if problems else 0)
