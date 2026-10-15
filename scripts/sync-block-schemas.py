#!/usr/bin/env python3
"""scripts/sync-block-schemas.py — rebuild the product sections' {% schema %} from fragments.

Both product sections share one set of local blocks (WAVE1-CONTRACTS §2), so
their schemas are generated, never edited by hand:

  sections/main-product.liquid
      settings  docs/product-blocks/_section-main-product.json (the shell's
                own settings: the template-section layout block plus the
                layout_* ids), then every docs/product-blocks/_settings-*.json
                in file-name order
      blocks    every docs/product-blocks/<type>.json in the order of
                WAVE1-CONTRACTS §1, then {"type": "@app"}

  sections/anvil-featured-product.liquid (the addable twin)
      settings  the full chassis of CONVENTIONS §4, a "Featured product"
                header, a `product` setting, the shell's settings without the
                chassis ids it already has, then every _settings-*.json
      blocks    the same list without sticky_atc and quantity_gifts
      presets   one preset whose block stack keeps only the types that exist

Only the JSON between {% schema %} and {% endschema %} is replaced; the rest
of each file is left alone. Fragments that do not exist yet are reported and
skipped, so the script can run while other owners are still writing theirs.
A fragment that exists but is broken (bad JSON, wrong shape, a duplicate
setting id) is reported as an error and skipped.

Icon labels (DECISIONS 92). docs/icons.json is the one list of icon names and their editor labels. Every icon
select (a `select` whose id is `icon` or ends in `_icon` and whose option values are all names from that list, or
`none`) in sections/*.liquid, blocks/*.liquid and docs/product-blocks/*.json takes its labels from it; a select keeps
its own subset and order. The labels are rewritten in place (only the label strings change); --check reports drift.
The product fragments are fixed before the two product schemas are built, so those follow.

Exit codes: 0 when everything is in sync (or was written), 1 when --check
finds a section out of date, when a fragment is broken, or (with --strict)
when a fragment is missing, 2 for a usage or file error.

Usage:
  python3 scripts/sync-block-schemas.py            rewrite both schemas
  python3 scripts/sync-block-schemas.py --check    report drift, write nothing (CI)
  options: --strict (missing fragments fail), --quiet (errors only), --root DIR
"""
import argparse
import json
import os
import re
import sys

FRAGMENT_DIR = os.path.join("docs", "product-blocks")
SHELL_FRAGMENT = "_section-main-product.json"
SETTINGS_PREFIX = "_settings-"

MAIN_FILE = os.path.join("sections", "main-product.liquid")
FEATURED_FILE = os.path.join("sections", "anvil-featured-product.liquid")

# WAVE1-CONTRACTS §1, in table order (picker-form, content, trust, commerce).
BLOCK_ORDER = [
    "variant_picker", "offer_card", "quantity", "quantity_tier", "buy_buttons", "sticky_atc",
    "title", "price", "description", "sku", "inventory", "share", "custom_liquid", "collapsible_tab",
    "popup", "complementary", "divider", "image", "video", "link_button", "scroll_buttons",
    "text_icon", "icons_text", "emoji_benefits", "urgency_text", "payment_badges", "rating",
    "review_platform_badge", "reviews_list", "review_avatars",
    "shipping_estimate", "shipping_checkpoints", "custom_field", "size_chart", "discount_code",
    "bundle_offer", "upsells", "quantity_gifts",
]
FEATURED_EXCLUDE = {"sticky_atc", "quantity_gifts"}

# The block stack a merchant gets when adding "Featured product"; types whose
# fragment is missing are left out so the preset never names an unknown type.
FEATURED_PRESET_BLOCKS = ["title", "price", "variant_picker", "quantity", "buy_buttons", "payment_badges", "description"]

MAX_BLOCKS = 50          # Shopify's per-section ceiling
MAX_NAME = 25            # CONVENTIONS §1
MAX_ADDABLE_SETTINGS = 40  # scripts/chassis-lint.py ceiling for addable sections
NON_SETTING_TYPES = {"header", "paragraph"}
# A section that accepts app blocks may hold only one section-level setting of each resource type.
RESOURCE_TYPES = {"product", "collection", "page", "blog", "article", "metaobject"}

# The template-section layout block every main-* section carries (CONVENTIONS §4).
MAIN_CHASSIS_IDS = ["color_scheme", "width", "pad_top", "pad_bottom", "pad_mobile"]

# The full chassis of CONVENTIONS §4, ids, types, options and defaults exactly.
FULL_CHASSIS = [
    {"type": "header", "content": "Heading"},
    {"type": "inline_richtext", "id": "heading", "label": "Heading", "info": "Bold a word to colour it with the accent"},
    {"type": "richtext", "id": "subheading", "label": "Subheading"},
    {"type": "text_alignment", "id": "head_align", "label": "Heading alignment", "default": "center"},
    {"type": "select", "id": "head_size", "label": "Heading size", "options": [
        {"value": "xs", "label": "Extra small"}, {"value": "sm", "label": "Small"}, {"value": "md", "label": "Medium"},
        {"value": "lg", "label": "Large"}, {"value": "xl", "label": "Extra large"}], "default": "lg"},
    {"type": "select", "id": "accent_style", "label": "Accent style for bold words", "options": [
        {"value": "color", "label": "Accent colour"}, {"value": "underline", "label": "Underline"},
        {"value": "highlight", "label": "Highlight"}, {"value": "gradient", "label": "Gradient"}], "default": "color"},
    {"type": "header", "content": "Layout"},
    {"type": "color_scheme", "id": "color_scheme", "label": "Colour scheme", "default": "scheme-1"},
    {"type": "select", "id": "width", "label": "Width", "options": [
        {"value": "page", "label": "Page width"}, {"value": "narrow", "label": "Narrow"},
        {"value": "full", "label": "Full width"}], "default": "page"},
    {"type": "range", "id": "pad_top", "label": "Top padding", "min": 0, "max": 120, "step": 4, "unit": "px", "default": 48},
    {"type": "range", "id": "pad_bottom", "label": "Bottom padding", "min": 0, "max": 120, "step": 4, "unit": "px", "default": 48},
    {"type": "select", "id": "pad_mobile", "label": "Padding on phones", "options": [
        {"value": "same", "label": "Same as desktop"}, {"value": "compact", "label": "Compact"},
        {"value": "none", "label": "None"}], "default": "compact"},
    {"type": "select", "id": "reveal", "label": "Animate on scroll", "options": [
        {"value": "none", "label": "Off"}, {"value": "fade-up", "label": "Fade up"}, {"value": "fade", "label": "Fade"},
        {"value": "zoom", "label": "Zoom"}], "default": "none"},
    {"type": "select", "id": "show_on", "label": "Show on", "options": [
        {"value": "all", "label": "All devices"}, {"value": "mobile", "label": "Phones only"},
        {"value": "desktop", "label": "Desktop only"}], "default": "all"},
    {"type": "text", "id": "anchor", "label": "Anchor id", "info": "Letters, numbers and hyphens. Link to this section with #your-id"},
]
FULL_CHASSIS_IDS = {s["id"] for s in FULL_CHASSIS if "id" in s}

FEATURED_HEAD = [
    {"type": "header", "content": "Featured product"},
    {"type": "product", "id": "product", "label": "Product",
     "info": "Until you pick one, the section shows an example layout."},
]

SCHEMA_RE = re.compile(r"(\{%-?\s*schema\s*-?%\})(.*?)(\{%-?\s*endschema\s*-?%\})", re.S)


class Log:
    def __init__(self, quiet=False):
        self.quiet = quiet
        self.errors = 0
        self.missing = []

    def info(self, msg):
        if not self.quiet:
            print(msg)

    def warn(self, path, msg):
        if not self.quiet:
            print(f"{path}: [W] {msg}")

    def error(self, path, msg):
        self.errors += 1
        print(f"{path}: [E] {msg}", file=sys.stderr)


def load_json(root, rel, log):
    try:
        with open(os.path.join(root, rel), "r", encoding="utf-8") as fh:
            return json.load(fh), True
    except json.JSONDecodeError as exc:
        log.error(rel, f"invalid JSON at line {exc.lineno}: {exc.msg}; fragment skipped")
    except OSError as exc:
        log.error(rel, f"cannot read: {exc}; fragment skipped")
    return None, False


def check_setting_list(path, settings, log, where):
    """Return the settings that are well-formed; report the rest."""
    good = []
    if not isinstance(settings, list):
        log.error(path, f"{where}: `settings` must be an array; ignored")
        return good
    for i, s in enumerate(settings):
        if not isinstance(s, dict) or not isinstance(s.get("type"), str):
            log.error(path, f"{where}: settings[{i}] needs a string `type`; skipped")
            continue
        if s["type"] not in NON_SETTING_TYPES and not s.get("id"):
            log.error(path, f"{where}: settings[{i}] ({s['type']}) has no `id`; skipped")
            continue
        good.append(s)
    return good


def dedupe_ids(path, settings, seen, log, where):
    """Drop settings whose id was already used in the same scope."""
    out = []
    for s in settings:
        sid = s.get("id")
        if sid:
            if sid in seen:
                log.error(path, f"{where}: setting id `{sid}` already defined in {seen[sid]}; skipped")
                continue
            seen[sid] = os.path.basename(path)
        out.append(s)
    return out


def load_block(root, btype, log):
    rel = os.path.join(FRAGMENT_DIR, btype + ".json")
    path = os.path.join(root, rel)
    if not os.path.exists(path):
        log.missing.append(btype)
        return None
    data, ok = load_json(root, rel, log)
    if not ok:
        return None
    if not isinstance(data, dict):
        log.error(rel, "a block fragment must be one JSON object; skipped")
        return None
    if data.get("type") != btype:
        log.error(rel, f"`type` is {data.get('type')!r}; must be {btype!r} (the file name); skipped")
        return None
    name = data.get("name")
    if not isinstance(name, str) or not name:
        log.error(rel, "block needs a `name`; skipped")
        return None
    if len(name) > MAX_NAME:
        log.error(rel, f"block name {name!r} is {len(name)} chars; limit {MAX_NAME}; skipped")
        return None
    if "limit" in data and (not isinstance(data["limit"], int) or data["limit"] < 1):
        log.error(rel, "`limit` must be a positive integer; skipped")
        return None
    block = dict(data)
    if "settings" in block:
        block["settings"] = dedupe_ids(rel, check_setting_list(rel, block["settings"], log, btype), {}, log, btype)
    return block


def load_section_settings(root, log):
    """Shell settings, then every _settings-*.json in file-name order, ids unique across all of them."""
    seen = {}
    rel = os.path.join(FRAGMENT_DIR, SHELL_FRAGMENT)
    path = os.path.join(root, rel)
    shell = []
    if not os.path.exists(path):
        log.error(rel, "the shell's section settings are missing")
    else:
        data, ok = load_json(root, rel, log)
        if ok:
            shell = dedupe_ids(rel, check_setting_list(rel, data, log, "section"), seen, log, "section")
    ids = [s.get("id") for s in shell if s.get("id")]
    for sid in MAIN_CHASSIS_IDS:
        if sid not in ids:
            log.error(rel, f"template-section chassis setting `{sid}` is missing")

    extra = []
    frag_dir = os.path.join(root, FRAGMENT_DIR)
    names = sorted(n for n in os.listdir(frag_dir) if n.startswith(SETTINGS_PREFIX) and n.endswith(".json")) if os.path.isdir(frag_dir) else []
    for name in names:
        frel = os.path.join(FRAGMENT_DIR, name)
        data, ok = load_json(root, frel, log)
        if not ok:
            continue
        good = check_setting_list(frel, data, log, "section")
        for s in good:
            sid = s.get("id")
            if sid in FULL_CHASSIS_IDS:
                log.error(frel, f"`{sid}` is a chassis id owned by the shell; skipped")
        good = [s for s in good if s.get("id") not in FULL_CHASSIS_IDS]
        extra.extend(dedupe_ids(frel, good, seen, log, "section"))
    return shell, extra


def unknown_fragments(root, log):
    frag_dir = os.path.join(root, FRAGMENT_DIR)
    if not os.path.isdir(frag_dir):
        return
    known = set(BLOCK_ORDER)
    for name in sorted(os.listdir(frag_dir)):
        if not name.endswith(".json") or name.startswith("_"):
            continue
        if name[:-5] not in known:
            log.warn(os.path.join(FRAGMENT_DIR, name), "not a block type of WAVE1-CONTRACTS §1; ignored")


def check_resources(path, settings, log):
    counts = {}
    for s in settings:
        if s.get("type") in RESOURCE_TYPES:
            counts[s["type"]] = counts.get(s["type"], 0) + 1
    for rtype, n in counts.items():
        if n > 1:
            log.error(path, f"{n} section settings of type `{rtype}`; a section with app blocks may have one")


def real_count(settings):
    return sum(1 for s in settings if s.get("type") not in NON_SETTING_TYPES)


def build(root, log):
    shell, extra = load_section_settings(root, log)
    blocks = []
    for btype in BLOCK_ORDER:
        b = load_block(root, btype, log)
        if b is not None:
            blocks.append(b)
    unknown_fragments(root, log)

    main_settings = shell + extra
    main = {
        "name": "Product",
        "settings": main_settings,
        "blocks": blocks + [{"type": "@app"}],
        "max_blocks": MAX_BLOCKS,
    }

    # Featured: full chassis first, then its own head, then the shell's non-chassis settings.
    shell_rest = [s for s in shell if s.get("id") not in FULL_CHASSIS_IDS]
    while shell_rest and shell_rest[0].get("type") == "header" and shell_rest[0].get("content") == "Layout":
        shell_rest = shell_rest[1:]
    # a header left with nothing under it before the next header is dropped
    tidy = []
    for i, s in enumerate(shell_rest):
        nxt = shell_rest[i + 1] if i + 1 < len(shell_rest) else None
        if s.get("type") == "header" and (nxt is None or nxt.get("type") == "header"):
            continue
        tidy.append(s)
    featured_settings = FULL_CHASSIS + FEATURED_HEAD + tidy + extra
    featured_blocks = [b for b in blocks if b["type"] not in FEATURED_EXCLUDE]
    have = {b["type"] for b in featured_blocks}
    featured = {
        "name": "Featured product",
        "settings": featured_settings,
        "blocks": featured_blocks + [{"type": "@app"}],
        "max_blocks": MAX_BLOCKS,
        "presets": [{
            "name": "Featured product",
            "blocks": [{"type": t} for t in FEATURED_PRESET_BLOCKS if t in have],
        }],
        "disabled_on": {"groups": ["*"]},
    }

    check_resources(MAIN_FILE, main_settings, log)
    check_resources(FEATURED_FILE, featured_settings, log)
    n = real_count(featured_settings)
    if n > MAX_ADDABLE_SETTINGS:
        log.warn(FEATURED_FILE, f"{n} settings; scripts/chassis-lint.py allows {MAX_ADDABLE_SETTINGS} in an addable section")
    names = {}
    for b in blocks:
        if b["name"] in names:
            log.warn(os.path.join(FRAGMENT_DIR, b["type"] + ".json"), f"block name {b['name']!r} is also used by `{names[b['name']]}`")
        names.setdefault(b["name"], b["type"])
    return main, featured


# ----------------------------------------------------------------------------- output
def compact(value):
    return json.dumps(value, ensure_ascii=False, separators=(", ", ": "))


def dump_list(items, indent, fmt_item):
    pad = " " * indent
    if not items:
        return "[]"
    lines = ["["]
    for i, item in enumerate(items):
        comma = "," if i < len(items) - 1 else ""
        lines.append(pad + "  " + fmt_item(item, indent + 2) + comma)
    lines.append(pad + "]")
    return "\n".join(lines)


def dump_object(obj, indent, special):
    pad = " " * indent
    keys = list(obj.keys())
    lines = ["{"]
    for i, key in enumerate(keys):
        comma = "," if i < len(keys) - 1 else ""
        fmt = special.get(key)
        body = fmt(obj[key], indent + 2) if fmt else compact(obj[key])
        lines.append(f"{pad}  {json.dumps(key)}: {body}{comma}")
    lines.append(pad + "}")
    return "\n".join(lines)


def fmt_settings(settings, indent):
    return dump_list(settings, indent, lambda s, _i: compact(s))


def fmt_block(block, indent):
    if set(block) <= {"type", "name", "limit"}:
        return compact(block)
    return dump_object(block, indent, {"settings": fmt_settings})


def fmt_preset(preset, indent):
    return dump_object(preset, indent, {"blocks": lambda bl, i: dump_list(bl, i, lambda b, _j: compact(b))})


def dump_schema(schema):
    special = {
        "settings": fmt_settings,
        "blocks": lambda bl, i: dump_list(bl, i, fmt_block),
        "presets": lambda pl, i: dump_list(pl, i, fmt_preset),
    }
    return dump_object(schema, 0, special)


def apply(root, rel, schema, check, log):
    path = os.path.join(root, rel)
    try:
        with open(path, "r", encoding="utf-8") as fh:
            text = fh.read()
    except OSError as exc:
        log.error(rel, f"cannot read: {exc}")
        return None
    m = SCHEMA_RE.search(text)
    if not m:
        log.error(rel, "no {% schema %} … {% endschema %} block to replace")
        return None
    new_text = text[:m.start(2)] + "\n" + dump_schema(schema) + "\n" + text[m.end(2):]
    if new_text == text:
        log.info(f"{rel}: up to date ({len(schema['blocks']) - 1} block types, {real_count(schema['settings'])} settings)")
        return False
    if check:
        print(f"{rel}: [E] schema is out of date; run python3 scripts/sync-block-schemas.py", file=sys.stderr)
        return True
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(new_text)
    log.info(f"{rel}: schema rewritten ({len(schema['blocks']) - 1} block types, {real_count(schema['settings'])} settings)")
    return False


# --------------------------------------------------------------------------- icon labels (DECISIONS 92)
ICON_LIST = os.path.join("docs", "icons.json")
ICON_ID_RE = re.compile(r"(^|_)icon$")


def load_icons(root):
    with open(os.path.join(root, ICON_LIST), "r", encoding="utf-8") as fh:
        data = json.load(fh)
    labels = {o["value"]: o["label"] for o in data["icons"]}
    labels["none"] = data.get("none", "None")
    return labels


def icon_selects(settings_lists, labels):
    """Yield (setting, wanted labels) for every icon select whose labels drift, in document order, plus every
    setting with an icon-like id (so the text cursor can skip the ones that need nothing)."""
    for settings in settings_lists:
        for st in settings or []:
            if not isinstance(st, dict) or not ICON_ID_RE.search(str(st.get("id", ""))):
                continue
            opts = st.get("options") if st.get("type") == "select" else None
            if not opts or not all(o.get("value") in labels for o in opts):
                yield st, None
                continue
            want = [labels[o["value"]] for o in opts]
            yield st, (want if want != [o.get("label") for o in opts] else None)


def relabel_text(text, items):
    """Rewrite option labels inside the JSON text: for each (setting, wanted labels) find the setting's `"id"` after
    the cursor, then its `"options"` array, and replace the labels in order."""
    pos = 0
    for st, want in items:
        m = re.compile(r'"id"\s*:\s*' + re.escape(json.dumps(st["id"]))).search(text, pos)
        if not m:
            return None
        pos = m.end()
        if want is None:
            continue
        o = re.compile(r'"options"\s*:\s*\[').search(text, pos)
        if not o:
            return None
        depth, i = 1, o.end()
        while depth and i < len(text):
            if text[i] == '"':
                i += 1
                while text[i] != '"':
                    i += 2 if text[i] == "\\" else 1
            elif text[i] in "[{":
                depth += 1
            elif text[i] in "]}":
                depth -= 1
            i += 1
        span = text[o.end():i]
        labels_iter = iter(want)
        span = re.sub(r'("label"\s*:\s*)"(?:[^"\\]|\\.)*"', lambda mm: mm.group(1) + json.dumps(next(labels_iter), ensure_ascii=False), span)
        text = text[:o.end()] + span + text[i:]
        pos = o.end() + len(span)
    return text


def sync_icon_labels(root, check, log):
    """Returns True when --check finds drift."""
    try:
        labels = load_icons(root)
    except (OSError, ValueError, KeyError) as exc:
        log.error(ICON_LIST, f"cannot read the icon list: {exc}")
        return True
    drift = False
    paths = []
    for folder in ("sections", "blocks"):
        d = os.path.join(root, folder)
        paths += [os.path.join(folder, n) for n in sorted(os.listdir(d)) if n.endswith(".liquid")]
    d = os.path.join(root, FRAGMENT_DIR)
    if os.path.isdir(d):
        paths += [os.path.join(FRAGMENT_DIR, n) for n in sorted(os.listdir(d)) if n.endswith(".json")]
    for rel in paths:
        if rel in (MAIN_FILE, FEATURED_FILE):
            continue  # generated from the fragments
        path = os.path.join(root, rel)
        with open(path, "r", encoding="utf-8") as fh:
            text = fh.read()
        if rel.endswith(".json"):
            start, end = 0, len(text)
        else:
            m = SCHEMA_RE.search(text)
            if not m:
                continue
            start, end = m.start(2), m.end(2)
        body = text[start:end]
        try:
            data = json.loads(body)
        except ValueError:
            continue
        if isinstance(data, list):
            lists = [data]
        else:
            lists = [data.get("settings")] + [b.get("settings") for b in data.get("blocks") or [] if isinstance(b, dict)]
        items = list(icon_selects(lists, labels))
        if not any(w for _s, w in items):
            continue
        fixed = relabel_text(body, items)
        if fixed is None or json.loads(fixed) == data:
            log.error(rel, "icon labels drift but could not be rewritten in place")
            drift = True
            continue
        if check:
            print(f"{rel}: [E] icon labels differ from {ICON_LIST}; run python3 scripts/sync-block-schemas.py", file=sys.stderr)
            drift = True
            continue
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(text[:start] + fixed + text[end:])
        log.info(f"{rel}: icon labels synced from {ICON_LIST}")
    return drift


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--check", action="store_true", help="exit 1 when a section schema is out of date; write nothing")
    ap.add_argument("--strict", action="store_true", help="treat missing block fragments as errors")
    ap.add_argument("--quiet", action="store_true", help="print errors only")
    ap.add_argument("--root", default=None, help="theme root (default: the parent of scripts/)")
    args = ap.parse_args()

    root = args.root or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if not os.path.isdir(os.path.join(root, "sections")):
        print(f"sync-block-schemas: {root} has no sections/ folder", file=sys.stderr)
        return 2

    log = Log(quiet=args.quiet)
    icon_drift = sync_icon_labels(root, args.check, log)
    main_schema, featured_schema = build(root, log)
    if log.missing:
        msg = f"{len(log.missing)} block fragment(s) not written yet, skipped: {', '.join(log.missing)}"
        if args.strict:
            log.error(FRAGMENT_DIR, msg)
        else:
            log.warn(FRAGMENT_DIR, msg)

    drift = icon_drift
    for rel, schema in ((MAIN_FILE, main_schema), (FEATURED_FILE, featured_schema)):
        result = apply(root, rel, schema, args.check, log)
        if result is None:
            return 2
        drift = drift or result

    if drift or log.errors:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
