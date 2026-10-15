#!/usr/bin/env python3
"""scripts/check-templates.py — validate JSON templates and section groups against the section schemas.

Theme Check does not look inside templates/*.json or sections/*-group.json beyond JSON syntax, and Shopify only
reports a bad setting when the theme is uploaded or opened in the editor. This script mirrors those checks:

  sections   at most 25 per template or group; every `type` names sections/<type>.liquid; every `order` entry
             exists and every section is ordered; `limit` (times per template) respected; `enabled_on` /
             `disabled_on` allow the template or group it is placed in
  settings   every key exists in the schema; select / radio values are listed options; ranges are numbers within
             min..max on a step; checkboxes are booleans; numbers are numbers; text_alignment is left|center|right;
             color_scheme names a scheme from config/settings_data.json; resource settings (image_picker, product,
             collection, video, ...) are never pre-filled with a value Shopify would have to resolve
  blocks     every block type is allowed: a local block of that section, a theme block (blocks/<type>.liquid)
             when the section offers @theme or names it, `@app` style app blocks when @app is offered; private
             theme blocks (_name) only where they are named; nested blocks follow the parent theme block's own
             `blocks` list; `block_order` matches the blocks; static blocks are skipped in counts
  limits     `max_blocks` (default 50) per section, top-level, static blocks excluded; 1,250 blocks per template;
             nesting depth <= 8
  honesty    every anvil-faq section keeps `json_ld: false` (DECISIONS 26)

Usage: scripts/check-templates.py [--root DIR] [FILE ...]   (default: templates/*.json + sections/*-group.json)
Exit 1 with path: message lines on any problem.
"""
import argparse
import glob
import json
import os
import re
import sys
from fractions import Fraction

MAX_SECTIONS = 25
MAX_BLOCKS_SECTION = 50
MAX_BLOCKS_TEMPLATE = 1250
MAX_DEPTH = 8
RESOURCE_TYPES = {
    "image_picker", "video", "product", "collection", "blog", "article", "page", "link_list", "product_list",
    "collection_list", "metaobject", "metaobject_list", "font_picker",
}
STRING_TYPES = {"text", "textarea", "richtext", "inline_richtext", "html", "liquid", "url", "video_url", "color",
                "color_background", "text_alignment"}
SCHEMA_RE = re.compile(r"\{%-?\s*schema\s*-?%\}(.*?)\{%-?\s*endschema\s*-?%\}", re.S)


class Checker:
    def __init__(self, root):
        self.root = root
        self.problems = []
        self.cache = {}
        self.schemes = self._schemes()

    def say(self, where, msg):
        self.problems.append(f"{where}: {msg}")

    # ---------------------------------------------------------------- schema loading
    def schema(self, folder, name):
        key = (folder, name)
        if key in self.cache:
            return self.cache[key]
        path = os.path.join(self.root, folder, name + ".liquid")
        sch = None
        if os.path.isfile(path):
            m = SCHEMA_RE.search(open(path, encoding="utf-8").read())
            if m:
                body = re.sub(r"^\s*//.*$", "", m.group(1), flags=re.M)
                try:
                    sch = json.loads(body)
                except ValueError as e:
                    sch = {"_error": str(e)}
            else:
                sch = {}
        self.cache[key] = sch
        return sch

    def _schemes(self):
        path = os.path.join(self.root, "config", "settings_data.json")
        try:
            data = json.loads(strip_comment(open(path, encoding="utf-8").read()))
        except (OSError, ValueError):
            return None
        ids = set()
        for preset in [data.get("current")] + list((data.get("presets") or {}).values()):
            if isinstance(preset, dict):
                for group in (preset.get("color_schemes") or {},):
                    ids.update(group.keys())
        return ids or None

    # ---------------------------------------------------------------- settings
    def settings(self, where, values, defs):
        if values is None:
            return
        if not isinstance(values, dict):
            self.say(where, "settings must be an object")
            return
        by_id = {d["id"]: d for d in defs or [] if isinstance(d, dict) and d.get("id")}
        for sid, val in values.items():
            d = by_id.get(sid)
            if d is None:
                self.say(where, f"setting `{sid}` is not in the schema")
                continue
            t = d.get("type")
            w = f"{where} setting `{sid}`"
            if t in ("select", "radio"):
                opts = [o.get("value") for o in d.get("options") or []]
                if val not in opts:
                    self.say(w, f"value {val!r} is not an option ({', '.join(map(str, opts))})")
            elif t == "range":
                if isinstance(val, bool) or not isinstance(val, (int, float)):
                    self.say(w, f"range value {val!r} must be a number")
                    continue
                mn, mx = Fraction(str(d["min"])), Fraction(str(d["max"]))
                st = Fraction(str(d.get("step", 1)))
                v = Fraction(str(val))
                if v < mn or v > mx:
                    self.say(w, f"{val} is outside {d['min']}..{d['max']}")
                elif ((v - mn) / st).denominator != 1:
                    self.say(w, f"{val} is not on a step of {d.get('step', 1)} from {d['min']}")
            elif t == "checkbox":
                if not isinstance(val, bool):
                    self.say(w, f"checkbox value {val!r} must be true or false")
            elif t == "number":
                if val is not None and (isinstance(val, bool) or not isinstance(val, (int, float))):
                    self.say(w, f"number value {val!r} must be a number")
            elif t == "text_alignment":
                if val not in ("left", "center", "right"):
                    self.say(w, f"text_alignment value {val!r} must be left, center or right")
            elif t == "color_scheme":
                if self.schemes is not None and val not in self.schemes:
                    self.say(w, f"colour scheme {val!r} is not defined in config/settings_data.json")
            elif t in RESOURCE_TYPES:
                if val not in (None, "", []) and t not in ("link_list", "font_picker"):
                    if isinstance(val, str) and val.startswith("shopify://"):
                        continue
                    self.say(w, f"{t} settings cannot carry an example value ({val!r}); leave them empty")
            elif t in STRING_TYPES:
                if val is not None and not isinstance(val, str):
                    self.say(w, f"{t} value must be a string")
            if t in ("richtext",) and isinstance(val, str) and val and not re.match(r"^\s*<(p|ul|ol|h[1-6])\b", val):
                self.say(w, "richtext values start with <p>, <ul>, <ol> or a heading tag")

    # ---------------------------------------------------------------- blocks
    def allowed(self, entries):
        """Return (local block defs by type, theme refs, has @theme, has @app)."""
        local, refs = {}, set()
        has_theme = has_app = False
        for b in entries or []:
            if not isinstance(b, dict):
                continue
            t = b.get("type")
            if t == "@theme":
                has_theme = True
            elif t == "@app":
                has_app = True
            elif b.get("name"):
                local[t] = b
            elif t:
                refs.add(t)
        return local, refs, has_theme, has_app

    def blocks(self, where, blocks, order, entries, max_blocks, depth, counter):
        if blocks is None:
            if order:
                self.say(where, "block_order without blocks")
            return
        if not isinstance(blocks, dict):
            self.say(where, "blocks must be an object")
            return
        if depth > MAX_DEPTH:
            self.say(where, f"blocks nested deeper than {MAX_DEPTH} levels")
        local, refs, has_theme, has_app = self.allowed(entries)
        order = order or []
        for bid in order:
            if bid not in blocks:
                self.say(where, f"block_order names `{bid}`, which is not in blocks")
        top = 0
        for bid, blk in blocks.items():
            w = f"{where} block `{bid}`"
            if not isinstance(blk, dict):
                self.say(w, "must be an object")
                continue
            static = bool(blk.get("static"))
            if not static:
                top += 1
                if bid not in order:
                    self.say(w, "is not in block_order")
            counter[0] += 1
            t = blk.get("type", "")
            nested_entries = None
            if t.startswith("shopify://apps/"):
                if not has_app:
                    self.say(w, "app blocks are not allowed here (no @app)")
                continue
            if t in local:
                self.settings(w, blk.get("settings"), local[t].get("settings"))
                if blk.get("blocks"):
                    self.say(w, "local blocks cannot hold nested blocks")
                continue
            sch = self.schema("blocks", t)
            if sch is None:
                self.say(w, f"type `{t}` is neither a local block nor a theme block file")
                continue
            if "_error" in sch:
                self.say(w, f"blocks/{t}.liquid schema does not parse ({sch['_error']})")
                continue
            if t.startswith("_"):
                if t not in refs and not static:
                    self.say(w, f"private theme block `{t}` is not named in this parent's blocks list")
            elif not (has_theme or t in refs or static):
                self.say(w, f"theme block `{t}` is not allowed here (no @theme and not named)")
            self.settings(w, blk.get("settings"), sch.get("settings"))
            nested_entries = sch.get("blocks")
            self.blocks(w, blk.get("blocks"), blk.get("block_order"), nested_entries,
                        sch.get("max_blocks", MAX_BLOCKS_SECTION), depth + 1, counter)
        if top > max_blocks:
            self.say(where, f"{top} blocks; max_blocks is {max_blocks}")

    # ---------------------------------------------------------------- files
    def check_file(self, path):
        rel = os.path.relpath(path, self.root)
        try:
            data = json.loads(strip_comment(open(path, encoding="utf-8").read()))
        except ValueError as e:
            self.say(rel, f"invalid JSON ({e})")
            return
        is_group = rel.startswith("sections" + os.sep) or rel.startswith("sections/")
        sections = data.get("sections") or {}
        order = data.get("order") or []
        if is_group:
            gtype = data.get("type", "")
            scope_name = gtype
        else:
            base = os.path.basename(rel)[:-5]  # strip .json
            scope_name = base.split(".")[0]
        if len(sections) > MAX_SECTIONS:
            self.say(rel, f"{len(sections)} sections; the limit is {MAX_SECTIONS}")
        for sid in order:
            if sid not in sections:
                self.say(rel, f"order names `{sid}`, which is not in sections")
        counter = [0]
        types_used = {}
        for sid, sec in sections.items():
            w = f"{rel} section `{sid}`"
            if not isinstance(sec, dict):
                self.say(w, "must be an object")
                continue
            if sid not in order:
                self.say(w, "is not in order")
            t = sec.get("type", "")
            types_used[t] = types_used.get(t, 0) + 1
            sch = self.schema("sections", t)
            if sch is None:
                self.say(w, f"sections/{t}.liquid does not exist")
                continue
            if "_error" in sch:
                self.say(w, f"sections/{t}.liquid schema does not parse ({sch['_error']})")
                continue
            self.scope(w, sch, is_group, scope_name)
            self.settings(w, sec.get("settings"), sch.get("settings"))
            self.blocks(w, sec.get("blocks"), sec.get("block_order"), sch.get("blocks"),
                        sch.get("max_blocks", MAX_BLOCKS_SECTION), 1, counter)
            if t == "anvil-faq" and (sec.get("settings") or {}).get("json_ld") is not False:
                self.say(w, "anvil-faq ships with json_ld: false (example questions are not structured data)")
        for t, n in types_used.items():
            sch = self.schema("sections", t) or {}
            lim = sch.get("limit")
            if isinstance(lim, int) and n > lim:
                self.say(rel, f"`{t}` appears {n} times; its schema limit is {lim}")
        if counter[0] > MAX_BLOCKS_TEMPLATE:
            self.say(rel, f"{counter[0]} blocks; the limit is {MAX_BLOCKS_TEMPLATE}")
        return len(sections), counter[0]

    def scope(self, where, sch, is_group, name):
        def match(scope):
            if not isinstance(scope, dict):
                return None
            if is_group:
                groups = scope.get("groups") or []
                return "*" in groups or name in groups or (name.startswith("custom.") and "custom.*" in groups)
            templates = scope.get("templates") or []
            return "*" in templates or name in templates
        en, dis = sch.get("enabled_on"), sch.get("disabled_on")
        if en is not None and not match(en):
            self.say(where, f"`enabled_on` does not include {'group' if is_group else 'template'} `{name}`")
        if dis is not None and match(dis):
            self.say(where, f"`disabled_on` excludes {'group' if is_group else 'template'} `{name}`")


def strip_comment(text):
    """Shopify writes a /* ... */ banner above JSON templates it saves; drop a leading block comment."""
    return re.sub(r"^\s*/\*.*?\*/", "", text, count=1, flags=re.S)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--root", default=None)
    ap.add_argument("files", nargs="*")
    args = ap.parse_args()
    root = os.path.abspath(args.root or os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
    files = [os.path.abspath(f) for f in args.files] or sorted(
        glob.glob(os.path.join(root, "templates", "*.json"))
        + glob.glob(os.path.join(root, "templates", "customers", "*.json"))
        + glob.glob(os.path.join(root, "sections", "*-group.json"))
    )
    chk = Checker(root)
    summary = []
    for f in files:
        res = chk.check_file(f)
        if res:
            summary.append((os.path.relpath(f, root), *res))
    for p in chk.problems:
        print(p)
    if chk.problems:
        print(f"check-templates: {len(chk.problems)} problem(s) in {len(files)} file(s)", file=sys.stderr)
        return 1
    widest = max((s[2] for s in summary), default=0)
    print(f"check-templates: clean ({len(files)} file(s); largest {widest} blocks)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
