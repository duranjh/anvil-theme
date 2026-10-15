#!/usr/bin/env python3
"""scripts/extract-section-css.py — move every section's {% stylesheet %} CSS into its own asset.

Why (verified on the dev store 2026-10-15, DECISIONS 3): Shopify bundles every {% stylesheet %} of the theme
into one compiled_assets/styles.css that loads on every page, whatever sections the page renders. Section CSS
therefore lives in assets/anvil-sec-<name>.css, loaded by the section itself with stylesheet_tag, so a page
downloads only the CSS of the sections it shows. Theme blocks and snippets keep their small {% stylesheet %}.

For each sections/*.liquid with a {% stylesheet %} block:
  * the CSS is written verbatim to assets/anvil-sec-<name>.css (<name> = file name without the anvil- prefix),
  * the {% stylesheet %} block is removed,
  * a load line {% render 'anvil-stylesheet', file: 'anvil-sec-<name>.css', section: section %} is put at the top
    of the file (blocking above the fold, non-blocking below it; snippets/anvil-stylesheet.liquid).
Idempotent: a section without {% stylesheet %} is left alone. --check exits 1 if any section still has one.
"""
import glob, os, re, sys

root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
BLOCK = re.compile(r'\n?[ \t]*{%-?\s*stylesheet\s*-?%}(.*?){%-?\s*endstylesheet\s*-?%}[ \t]*\n?', re.S)
check = '--check' in sys.argv
pending, moved = [], []
for path in sorted(glob.glob(os.path.join(root, 'sections', '*.liquid'))):
    src = open(path, encoding='utf-8').read()
    blocks = BLOCK.findall(src)
    if not blocks:
        continue
    rel = os.path.relpath(path, root)
    if check:
        pending.append(rel)
        continue
    base = os.path.basename(path)[:-len('.liquid')]
    name = base[len('anvil-'):] if base.startswith('anvil-') else base
    asset = f'anvil-sec-{name}.css'
    css = '\n'.join(b.strip('\n') for b in blocks).strip() + '\n'
    header = f'/* {rel} — section styles, loaded only where this section renders (scripts/extract-section-css.py) */\n'
    with open(os.path.join(root, 'assets', asset), 'w', encoding='utf-8') as fh:
        fh.write(header + css)
    out = BLOCK.sub('\n', src)
    load = "{% render 'anvil-stylesheet', file: '" + asset + "', section: section %}\n"
    if f"file: '{asset}'" not in out:
        out = load + out
    out = re.sub(r'\n{3,}', '\n\n', out)
    with open(path, 'w', encoding='utf-8') as fh:
        fh.write(out)
    moved.append((rel, asset, len(css.encode())))

if check:
    for p in pending:
        print(f'{p}:1: section still uses {{% stylesheet %}}; run scripts/extract-section-css.py')
    print(f"extract-section-css: {'clean' if not pending else str(len(pending)) + ' section(s) to extract'}", file=sys.stderr)
    sys.exit(1 if pending else 0)
for rel, asset, n in moved:
    print(f'{rel} -> assets/{asset} ({n} B)')
print(f'extract-section-css: {len(moved)} section(s) extracted', file=sys.stderr)
