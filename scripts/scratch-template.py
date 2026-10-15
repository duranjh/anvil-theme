#!/usr/bin/env python3
"""scripts/scratch-template.py — build a scratch page template for one section.

Reads sections/anvil-<slug>.liquid, takes schema presets[0] and writes

    <stage>/templates/page.anvil-scratch-<slot>.json

rendering `main-page` followed by the section with the preset's settings and
blocks (nested blocks included). By default the stage directory is a fresh
copy of the theme folders (assets blocks config layout locales sections
snippets templates) under .harness/stage/<slot>/ so `shopify theme push
--path <stage> --only …` can upload the agent's files plus the scratch
template without touching the working tree. No store content is created:
the template renders on any existing page with `?view=anvil-scratch-<slot>`.

Prints, one per line, the stage directory, the template path (relative to
the stage) and the `--only` list for the push.

Usage:
  scripts/scratch-template.py <slug|anvil-slug> [--slot N] [--stage DIR]
                              [--root DIR] [--main-type main-page]
                              [--preset N] [--no-copy] [--json]
"""
import argparse
import json
import os
import re
import shutil
import sys

THEME_DIRS = ("assets", "blocks", "config", "layout", "locales", "sections", "snippets", "templates")
SCHEMA_RE = re.compile(r"\{%-?\s*schema\s*-?%\}(.*?)\{%-?\s*endschema\s*-?%\}", re.S)


def norm_slug(s):
    s = s.strip()
    if s.endswith(".liquid"):
        s = s[:-7]
    s = s.split("/")[-1]
    if s.startswith("anvil-"):
        s = s[len("anvil-"):]
    return s


def load_schema(path):
    text = open(path, "r", encoding="utf-8").read()
    m = SCHEMA_RE.search(text)
    if not m:
        raise SystemExit(f"{path}:1: no {{% schema %}} block")
    raw = m.group(1)
    try:
        return json.loads(raw)
    except json.JSONDecodeError as exc:
        line = text.count("\n", 0, m.start(1)) + exc.lineno
        raise SystemExit(f"{path}:{line}: schema is not valid JSON: {exc.msg}")


def block_id(btype, counter):
    counter[0] += 1
    stem = re.sub(r"[^a-z0-9]", "", str(btype).lower()) or "block"
    return f"{stem}{counter[0]}"


def convert_blocks(preset_blocks, counter):
    """Preset blocks (a list) -> template `blocks` object + `block_order`."""
    blocks = {}
    order = []
    for pb in preset_blocks or []:
        if not isinstance(pb, dict) or "type" not in pb:
            continue
        # A static block keeps its preset id: the Liquid renders it with {% content_for 'block', id: '<id>' %}.
        bid = pb.get("id") if pb.get("static") and pb.get("id") else block_id(pb["type"], counter)
        entry = {"type": pb["type"]}
        if isinstance(pb.get("settings"), dict):
            entry["settings"] = pb["settings"]
        if pb.get("static"):
            entry["static"] = True
        if isinstance(pb.get("blocks"), list) and pb["blocks"]:
            inner, inner_order = convert_blocks(pb["blocks"], counter)
            entry["blocks"] = inner
            entry["block_order"] = inner_order
        blocks[bid] = entry
        if not pb.get("static"):
            order.append(bid)
    return blocks, order


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("slug")
    ap.add_argument("--slot", default=os.environ.get("SLOT", "1"))
    ap.add_argument("--stage", default=None, help="stage directory (default .harness/stage/<slot>)")
    ap.add_argument("--root", default=None)
    ap.add_argument("--main-type", default="main-page")
    ap.add_argument("--preset", type=int, default=0, help="preset index (default 0)")
    ap.add_argument("--no-copy", action="store_true", help="only write the template; do not copy theme folders")
    ap.add_argument("--json", action="store_true", help="print a JSON summary instead of lines")
    args = ap.parse_args()

    root = os.path.abspath(args.root or os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
    slug = norm_slug(args.slug)
    slot = re.sub(r"[^A-Za-z0-9-]", "", str(args.slot)) or "1"
    section_type = f"anvil-{slug}"
    section_path = os.path.join(root, "sections", f"{section_type}.liquid")
    if not os.path.isfile(section_path):
        raise SystemExit(f"sections/{section_type}.liquid:1: not found")

    schema = load_schema(section_path)
    presets = schema.get("presets") or []
    if not presets:
        raise SystemExit(f"sections/{section_type}.liquid:1: schema has no presets; static sections cannot be staged this way")
    if args.preset >= len(presets):
        raise SystemExit(f"sections/{section_type}.liquid:1: preset index {args.preset} out of range ({len(presets)} presets)")
    preset = presets[args.preset]

    scope = schema.get("enabled_on") or {}
    if isinstance(scope, dict) and scope.get("groups") and not scope.get("templates"):
        print(f"warning: {section_type} is enabled only for groups {scope['groups']}; a page template may not be the right stage", file=sys.stderr)

    counter = [0]
    blocks, order = convert_blocks(preset.get("blocks"), counter)
    section_entry = {"type": section_type}
    if isinstance(preset.get("settings"), dict):
        section_entry["settings"] = preset["settings"]
    if blocks:
        section_entry["blocks"] = blocks
        section_entry["block_order"] = order
    template = {
        "sections": {
            "main": {"type": args.main_type, "settings": {}},
            "scratch": section_entry,
        },
        "order": ["main", "scratch"],
    }

    stage = os.path.abspath(args.stage or os.path.join(root, ".harness", "stage", slot))
    if os.path.realpath(stage) == os.path.realpath(root):
        raise SystemExit("stage directory must not be the theme root itself")
    if not args.no_copy:
        if os.path.isdir(stage):
            shutil.rmtree(stage)
        os.makedirs(stage)
        for d in THEME_DIRS:
            src = os.path.join(root, d)
            if os.path.isdir(src):
                shutil.copytree(src, os.path.join(stage, d), ignore=shutil.ignore_patterns(".DS_Store"))
    else:
        os.makedirs(os.path.join(stage, "templates"), exist_ok=True)

    rel_template = f"templates/page.anvil-scratch-{slot}.json"
    out_path = os.path.join(stage, rel_template)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as fh:
        json.dump(template, fh, indent=2, ensure_ascii=False)
        fh.write("\n")

    only = [f"sections/{section_type}.liquid", rel_template]
    for d, pattern in (("blocks", f"_anvil-{slug}-"), ("assets", f"anvil-{slug}")):
        src = os.path.join(root, d)
        if os.path.isdir(src):
            for name in sorted(os.listdir(src)):
                if name.startswith(pattern):
                    only.append(f"{d}/{name}")

    if args.json:
        print(json.dumps({"stage": stage, "template": rel_template, "only": only, "view": f"anvil-scratch-{slot}"}, indent=2))
    else:
        print(stage)
        print(rel_template)
        for o in only:
            print(o)
    return 0


if __name__ == "__main__":
    sys.exit(main())
