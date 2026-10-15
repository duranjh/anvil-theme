#!/usr/bin/env python3
"""scripts/chassis-lint.py — Anvil section chassis lint.

For every sections/anvil-*.liquid whose schema has `presets` (addable
sections) it verifies the contract in docs/CONVENTIONS.md §3–§4:

  skeleton   {% render 'anvil-section-attrs', section: section, type: '<file name>' %}
             {% render 'anvil-section-head', section: section %}
             a `av-section__inner` wrapper
  settings   the 13 chassis setting ids with their exact types; for selects
             the exact option values; for ranges the exact min/max/step/unit
             (defaults, order and "chassis first" drift are warnings)
  presets    present, non-empty, every preset named
  blocks     {{ block.shopify_attributes }} on every local block (wrapper or
             per `when` branch), {% render block %} for @app, no local+@theme
             mix, {% content_for 'blocks' %} when @theme is offered
  limits     schema name <= 25 chars, <= 40 non-header settings,
             enabled_on/disabled_on not both set

Universal hygiene, applied to every sections/*.liquid and blocks/*.liquid
(main-* and static sections included):
  * no literal <img> tag (use image_tag / anvil-media)
  * no <script> without type="module" or defer (data scripts with
    type="application/json" / "application/ld+json" are allowed)
  * no http(s):// URL except the SVG namespace, schema.org and the two
    click-to-load video facade hosts
  * {% stylesheet %} body <= 6 KB; top-level selectors start with .av-<slug>
    (warning)
Theme blocks (blocks/*.liquid) must print {{ block.shopify_attributes }}.
Exempt from the chassis checks (hygiene and schema limits still apply):
main-* sections, static sections (no presets) and group-only sections
(`enabled_on.groups` without `templates`, e.g. header, footer, overlay).

Exit 1 when any error exists; warnings are printed with [W] and do not fail
unless --strict. Output lines are path:line: [E|W] message.

Usage: scripts/chassis-lint.py [--root DIR] [--only PATH ...] [--strict]
"""
import argparse
import json
import os
import re
import sys

STYLESHEET_MAX = 6 * 1024
MAX_SETTINGS = 40
MAX_NAME = 25
ALLOWED_URL_HOSTS = {"www.w3.org", "schema.org", "www.youtube-nocookie.com", "player.vimeo.com"}

# id, type, extras (options = ordered list of values; range bounds; default)
CHASSIS = [
    ("heading", "inline_richtext", {}),
    ("subheading", "richtext", {}),
    ("head_align", "text_alignment", {"default": "center"}),
    ("head_size", "select", {"options": ["xs", "sm", "md", "lg", "xl"], "default": "lg"}),
    ("accent_style", "select", {"options": ["color", "underline", "highlight", "gradient"], "default": "color"}),
    ("color_scheme", "color_scheme", {"default": "scheme-1"}),
    ("width", "select", {"options": ["page", "narrow", "full"], "default": "page"}),
    ("pad_top", "range", {"min": 0, "max": 120, "step": 4, "unit": "px", "default": 48}),
    ("pad_bottom", "range", {"min": 0, "max": 120, "step": 4, "unit": "px", "default": 48}),
    ("pad_mobile", "select", {"options": ["same", "compact", "none"], "default": "compact"}),
    ("reveal", "select", {"options": ["none", "fade-up", "fade", "zoom"], "default": "none"}),
    ("show_on", "select", {"options": ["all", "mobile", "desktop"], "default": "all"}),
    ("anchor", "text", {}),
]
CHASSIS_IDS = [c[0] for c in CHASSIS]
NON_SETTING_TYPES = {"header", "paragraph"}

TAG = r"\{%-?\s*{name}\b[^%]*?-?%\}"
SCHEMA_RE = re.compile(r"\{%-?\s*schema\s*-?%\}(.*?)\{%-?\s*endschema\s*-?%\}", re.S)
STYLESHEET_RE = re.compile(r"\{%-?\s*stylesheet\s*-?%\}(.*?)\{%-?\s*endstylesheet\s*-?%\}", re.S)
COMMENT_RE = re.compile(r"\{%-?\s*comment\s*-?%\}.*?\{%-?\s*endcomment\s*-?%\}", re.S)
DOC_RE = re.compile(r"\{%-?\s*doc\s*-?%\}.*?\{%-?\s*enddoc\s*-?%\}", re.S)
RAW_RE = re.compile(r"\{%-?\s*raw\s*-?%\}.*?\{%-?\s*endraw\s*-?%\}", re.S)
HTML_COMMENT_RE = re.compile(r"<!--.*?-->", re.S)
INLINE_COMMENT_RE = re.compile(r"\{%-?\s*#.*?-?%\}", re.S)

RENDER_ATTRS_RE = re.compile(r"(?:\{%-?\s*)?render\s+['\"]anvil-section-attrs['\"]([^%\n]*)")
RENDER_HEAD_RE = re.compile(r"(?:\{%-?\s*)?render\s+['\"]anvil-section-head['\"]([^%\n]*)")
ASSIGN_S_RE = re.compile(r"assign\s+s\s*=\s*section\.settings")
CONTENT_FOR_BLOCKS_RE = re.compile(r"content_for\s+['\"]blocks['\"]")
FOR_BLOCKS_RE = re.compile(r"\{%-?\s*for\s+(\w+)\s+in\s+section\.blocks\b[^%]*-?%\}")
FOR_ANY_RE = re.compile(r"\{%-?\s*for\s+\w+\s+in\b[^%]*-?%\}")
ENDFOR_RE = re.compile(r"\{%-?\s*endfor\s*-?%\}")
CASE_ANY_RE = re.compile(r"\{%-?\s*case\b[^%]*-?%\}")
ENDCASE_RE = re.compile(r"\{%-?\s*endcase\s*-?%\}")
WHEN_RE = re.compile(r"\{%-?\s*(when\b[^%]*|else)\s*-?%\}")
IMG_RE = re.compile(r"<img\b", re.I)
SCRIPT_RE = re.compile(r"<script\b([^>]*)>", re.I)
URL_RE = re.compile(r"https?://([A-Za-z0-9.-]+)")
SELECTOR_RE = re.compile(r"([^{}]+)\{")


class Report:
    def __init__(self, strict=False):
        self.errors = []
        self.warnings = []
        self.strict = strict

    def err(self, path, line, msg):
        self.errors.append((path, line, msg))

    def warn(self, path, line, msg):
        (self.errors if self.strict else self.warnings).append((path, line, msg))

    def dump(self):
        rows = [(p, l, "E", m) for p, l, m in self.errors] + [(p, l, "W", m) for p, l, m in self.warnings]
        rows.sort(key=lambda r: (r[0], r[1], r[2]))
        for p, l, k, m in rows:
            print(f"{p}:{l}: [{k}] {m}")


def line_of(text, idx):
    return text.count("\n", 0, idx) + 1


def blank(text, spans):
    """Replace the given [start,end) spans with spaces, keeping newlines so
    offsets and line numbers stay valid."""
    chars = list(text)
    for start, end in spans:
        for i in range(start, end):
            if chars[i] != "\n":
                chars[i] = " "
    return "".join(chars)


def strip_for_body(text, keep_stylesheet=False):
    spans = []
    for rx in (SCHEMA_RE, COMMENT_RE, DOC_RE, RAW_RE, HTML_COMMENT_RE, INLINE_COMMENT_RE):
        spans.extend(m.span() for m in rx.finditer(text))
    if not keep_stylesheet:
        spans.extend(m.span() for m in STYLESHEET_RE.finditer(text))
    return blank(text, spans)


def parse_schema(text, path, rep):
    m = SCHEMA_RE.search(text)
    if not m:
        return None, None
    raw = m.group(1)
    start_line = line_of(text, m.start(1))
    try:
        return json.loads(raw), start_line
    except json.JSONDecodeError as exc:
        # tolerate // line comments, then report
        cleaned = re.sub(r"^\s*//.*$", "", raw, flags=re.M)
        try:
            data = json.loads(cleaned)
            rep.warn(path, start_line, "schema contains // comments; Shopify's JSON parser may reject them")
            return data, start_line
        except json.JSONDecodeError:
            rep.err(path, start_line + exc.lineno - 1, f"schema is not valid JSON: {exc.msg}")
            return None, start_line


def find_matching_end(text, start, open_re, close_re):
    """Index of the close tag matching the open tag that ends at `start`."""
    depth = 1
    pos = start
    while depth:
        o = open_re.search(text, pos)
        c = close_re.search(text, pos)
        if not c:
            return len(text)
        if o and o.start() < c.start():
            depth += 1
            pos = o.end()
        else:
            depth -= 1
            pos = c.end()
            if depth == 0:
                return c.start()
    return len(text)


# --------------------------------------------------------------------------- hygiene
def check_hygiene(path, text, body, rep, slug=None, want_selector_prefix=False):
    for m in IMG_RE.finditer(body):
        rep.err(path, line_of(body, m.start()), "literal <img>; render images with image_tag (anvil-media)")
    for m in SCRIPT_RE.finditer(body):
        attrs = m.group(1)
        ok = re.search(r"""type\s*=\s*["']?(module|application/json|application/ld\+json|text/template)["']?""", attrs, re.I)
        ok = ok or re.search(r"(^|\s)defer(\s|=|$|/)", attrs)
        if not ok:
            rep.err(path, line_of(body, m.start()), "<script> needs type=\"module\" or defer")
    for m in URL_RE.finditer(body):
        host = m.group(1).lower()
        if host not in ALLOWED_URL_HOSTS:
            rep.err(path, line_of(body, m.start()), f"remote URL to {host}; themes ship zero third-party requests")

    sheets = list(STYLESHEET_RE.finditer(text))
    if len(sheets) > 1:
        rep.warn(path, line_of(text, sheets[1].start()), "more than one {% stylesheet %} block")
    for sh in sheets:
        css = sh.group(1)
        size = len(css.encode("utf-8"))
        if size > STYLESHEET_MAX:
            rep.err(path, line_of(text, sh.start()), f"{{% stylesheet %}} is {size} bytes; limit {STYLESHEET_MAX}")
        if want_selector_prefix and slug:
            css_nc = re.sub(r"/\*.*?\*/", lambda mm: " " * len(mm.group(0)), css, flags=re.S)
            want = f".av-{slug}"
            want_short = ".av-" + slug.split("-")[0]
            for sm in SELECTOR_RE.finditer(css_nc):
                sel_text = sm.group(1).strip()
                if not sel_text or sel_text.startswith("@"):
                    continue
                # inside a block body preceded by `;` or `{`, the "selector" is the tail after the last of them
                sel_text = re.split(r"[;{}]", sel_text)[-1].strip()
                if not sel_text or re.match(r"^(from|to|\d+%)$", sel_text):
                    continue
                for sel in sel_text.split(","):
                    sel = sel.strip()
                    if not sel:
                        continue
                    if not (sel.startswith(want) or sel.startswith(want_short) or sel.startswith("#shopify-section")):
                        rep.warn(path, line_of(text, sh.start(1) + sm.start(1)), f"selector `{sel}` should start with {want}")


# --------------------------------------------------------------------------- chassis
def check_chassis_settings(path, schema, line, rep):
    settings = schema.get("settings")
    if not isinstance(settings, list):
        rep.err(path, line, "schema has no `settings` array")
        return
    by_id = {}
    real = []
    for s in settings:
        if not isinstance(s, dict):
            continue
        if s.get("type") in NON_SETTING_TYPES:
            continue
        real.append(s)
        if "id" in s:
            by_id.setdefault(s["id"], s)
    if len(real) > MAX_SETTINGS:
        rep.err(path, line, f"{len(real)} settings; Theme Check's ceiling is {MAX_SETTINGS}")

    for sid, stype, extra in CHASSIS:
        s = by_id.get(sid)
        if s is None:
            rep.err(path, line, f"chassis setting `{sid}` ({stype}) is missing")
            continue
        if s.get("type") != stype:
            rep.err(path, line, f"chassis setting `{sid}` must be type `{stype}`, found `{s.get('type')}`")
            continue
        if "options" in extra:
            values = [o.get("value") for o in s.get("options", []) if isinstance(o, dict)]
            if values != extra["options"]:
                rep.err(path, line, f"chassis setting `{sid}` options must be {extra['options']}, found {values}")
        for key in ("min", "max", "step", "unit"):
            if key in extra and s.get(key) != extra[key]:
                rep.err(path, line, f"chassis setting `{sid}` {key} must be {extra[key]!r}, found {s.get(key)!r}")
        if "default" in extra and s.get("default") != extra["default"]:
            rep.warn(path, line, f"chassis setting `{sid}` default is {s.get('default')!r}; contract says {extra['default']!r}")

    first = [s.get("id") for s in real[: len(CHASSIS)]]
    if set(first) != set(CHASSIS_IDS):
        strays = [i for i in first if i not in CHASSIS_IDS]
        if strays:
            rep.warn(path, line, f"chassis settings should come before section settings (found {strays} among the first 13)")
    elif first != CHASSIS_IDS:
        rep.warn(path, line, "chassis settings are present but not in the contract order")


def check_presets(path, schema, line, rep):
    presets = schema.get("presets")
    if not isinstance(presets, list) or not presets:
        rep.err(path, line, "`presets` must be a non-empty array")
        return
    for i, p in enumerate(presets):
        if not isinstance(p, dict) or not p.get("name"):
            rep.err(path, line, f"presets[{i}] needs a `name`")


def check_blocks(path, body, schema, line, rep):
    blocks = schema.get("blocks") or []
    types = [b.get("type") for b in blocks if isinstance(b, dict)]
    local = [t for t in types if t and not str(t).startswith("@")]
    has_theme = "@theme" in types
    has_app = "@app" in types

    if local and has_theme:
        rep.err(path, line, "a section cannot offer both local blocks and @theme blocks")
    if has_theme and not CONTENT_FOR_BLOCKS_RE.search(body):
        rep.err(path, line, "@theme blocks offered but no {% content_for 'blocks' %} in the body")
    if not local:
        return
    if "max_blocks" not in schema:
        rep.warn(path, line, "local blocks without `max_blocks`")

    loops = list(FOR_BLOCKS_RE.finditer(body))
    if not loops:
        rep.err(path, line, "local blocks declared but no `{% for … in section.blocks %}` loop renders them")
        return
    for lm in loops:
        var = lm.group(1)
        end = find_matching_end(body, lm.end(), FOR_ANY_RE, ENDFOR_RE)
        loop_text = body[lm.end():end]
        loop_line = line_of(body, lm.start())
        attrs_re = re.compile(re.escape(var) + r"\.shopify_attributes")
        render_block_re = re.compile(r"render\s+" + re.escape(var) + r"\b")
        delegated_re = re.compile(r"render\s+['\"][^'\"]+['\"][^%]*\b" + re.escape(var) + r"\b")

        case_m = re.search(r"\{%-?\s*case\s+" + re.escape(var) + r"\.type\s*-?%\}", loop_text)
        if not case_m:
            if not attrs_re.search(loop_text):
                if delegated_re.search(loop_text):
                    rep.warn(path, loop_line, f"blocks loop delegates to a snippet; make sure it prints {{{{ {var}.shopify_attributes }}}}")
                else:
                    rep.err(path, loop_line, f"blocks loop never prints {{{{ {var}.shopify_attributes }}}}")
            if has_app and not render_block_re.search(loop_text):
                rep.warn(path, loop_line, "@app offered but the loop never does {% render " + var + " %}")
            continue

        preamble = loop_text[:case_m.start()]
        if attrs_re.search(preamble):
            if has_app and not render_block_re.search(loop_text):
                rep.warn(path, loop_line, "@app offered but no {% render " + var + " %} in the loop")
            continue
        case_end = find_matching_end(loop_text, case_m.end(), CASE_ANY_RE, ENDCASE_RE)
        case_body = loop_text[case_m.end():case_end]
        whens = list(WHEN_RE.finditer(case_body))
        covered = set()
        has_else = False
        else_branch = ""
        for i, w in enumerate(whens):
            branch_end = whens[i + 1].start() if i + 1 < len(whens) else len(case_body)
            branch = case_body[w.end():branch_end]
            branch_line = line_of(body, lm.end() + case_m.end() + w.start())
            head = w.group(1)
            if head.strip() == "else":
                has_else = True
                else_branch = branch
                continue
            branch_types = re.findall(r"['\"]([^'\"]+)['\"]", head)
            for t in branch_types:
                covered.add(t)
                if t == "@app":
                    if not render_block_re.search(branch):
                        rep.err(path, branch_line, "@app branch must {% render " + var + " %}")
                    continue
                if t in local and not attrs_re.search(branch):
                    if delegated_re.search(branch):
                        rep.warn(path, branch_line, f"block `{t}` delegates to a snippet; make sure it prints {{{{ {var}.shopify_attributes }}}}")
                    else:
                        rep.err(path, branch_line, f"block `{t}` renders without {{{{ {var}.shopify_attributes }}}}")
        missing = [t for t in local if t not in covered]
        if missing:
            if has_else:
                if not attrs_re.search(else_branch):
                    rep.err(path, loop_line, f"blocks {missing} fall into `else` which lacks {{{{ {var}.shopify_attributes }}}}")
            else:
                rep.warn(path, loop_line, f"no `when` branch renders block type(s) {missing}")
        if has_app and "@app" not in covered and not render_block_re.search(loop_text):
            rep.warn(path, loop_line, "@app offered but never rendered with {% render " + var + " %}")


def check_section_schema_limits(path, schema, line, rep):
    name = schema.get("name")
    if not name:
        rep.err(path, line, "schema needs a `name`")
    elif len(name) > MAX_NAME:
        rep.err(path, line, f"schema name `{name}` is {len(name)} chars; limit {MAX_NAME}")
    if "enabled_on" in schema and "disabled_on" in schema:
        rep.err(path, line, "`enabled_on` and `disabled_on` are mutually exclusive")
    for key in ("enabled_on", "disabled_on"):
        scope = schema.get(key)
        if isinstance(scope, dict):
            for k in scope:
                if k not in ("templates", "groups"):
                    rep.err(path, line, f"`{key}` accepts only `templates` and `groups`, found `{k}`")
    for b in schema.get("blocks") or []:
        if isinstance(b, dict) and b.get("name") and len(b["name"]) > MAX_NAME:
            rep.err(path, line, f"block name `{b['name']}` is over {MAX_NAME} chars")


# --------------------------------------------------------------------------- drivers
def lint_section(path, rel, rep):
    text = open(path, "r", encoding="utf-8", errors="replace").read()
    base = os.path.basename(rel)[:-7]  # strip .liquid
    is_main = base.startswith("main-")
    slug = base[len("anvil-"):] if base.startswith("anvil-") else base
    body = strip_for_body(text)

    schema, sline = parse_schema(text, rel, rep)
    if schema is None and SCHEMA_RE.search(text) is None:
        rep.err(rel, 1, "section has no {% schema %}")
    has_presets = bool(schema and schema.get("presets"))
    scope = (schema or {}).get("enabled_on") or {}
    group_only = isinstance(scope, dict) and bool(scope.get("groups")) and not scope.get("templates")
    is_addable = (not is_main) and base.startswith("anvil-") and has_presets and not group_only

    check_hygiene(rel, text, body, rep, slug=slug, want_selector_prefix=is_addable)
    if schema is None:
        return
    check_section_schema_limits(rel, schema, sline, rep)

    if not is_addable:
        if group_only and has_presets:
            rep.warn(rel, sline, f"group-only section (enabled_on.groups {scope.get('groups')}): chassis settings not enforced")
        return  # main-*, static and group sections: hygiene + schema limits only

    # skeleton
    m = RENDER_ATTRS_RE.search(body)
    if not m:
        rep.err(rel, 1, "missing {% render 'anvil-section-attrs', section: section, type: '" + base + "' %}")
    else:
        params = m.group(1)
        ln = line_of(body, m.start())
        if not re.search(r"\bsection\s*:\s*section\b", params):
            rep.err(rel, ln, "anvil-section-attrs needs `section: section`")
        tm = re.search(r"\btype\s*:\s*(['\"]([^'\"]+)['\"]|[\w.]+)", params)
        if not tm:
            rep.err(rel, ln, "anvil-section-attrs needs `type: '" + base + "'`")
        elif tm.group(2) is None:
            rep.warn(rel, ln, "anvil-section-attrs `type` is not a literal; expected '" + base + "'")
        elif tm.group(2) != base:
            rep.err(rel, ln, f"anvil-section-attrs type is '{tm.group(2)}'; must equal the file name '{base}'")
    hm = RENDER_HEAD_RE.search(body)
    if not hm:
        rep.err(rel, 1, "missing {% render 'anvil-section-head', section: section %}")
    elif not re.search(r"\bsection\s*:\s*section\b", hm.group(1)):
        rep.warn(rel, line_of(body, hm.start()), "anvil-section-head should receive `section: section`")
    if "av-section__inner" not in body:
        rep.err(rel, 1, "missing the `av-section__inner` wrapper")
    if not ASSIGN_S_RE.search(body):
        rep.warn(rel, 1, "skeleton opens with `assign s = section.settings`")

    check_chassis_settings(rel, schema, sline, rep)
    check_presets(rel, schema, sline, rep)
    check_blocks(rel, body, schema, sline, rep)


def lint_block(path, rel, rep):
    text = open(path, "r", encoding="utf-8", errors="replace").read()
    body = strip_for_body(text)
    check_hygiene(rel, text, body, rep)
    schema, sline = parse_schema(text, rel, rep)
    if schema is None and SCHEMA_RE.search(text) is None:
        rep.err(rel, 1, "block has no {% schema %}")
    if not re.search(r"block\.shopify_attributes", body):
        rep.err(rel, 1, "theme block must print {{ block.shopify_attributes }} on its root element")
    if schema:
        name = schema.get("name")
        if name and len(name) > MAX_NAME:
            rep.err(rel, sline, f"block name `{name}` is over {MAX_NAME} chars")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--root", default=None)
    ap.add_argument("--only", action="append", default=[], help="lint only these files (repo-relative); repeatable")
    ap.add_argument("--strict", action="store_true", help="treat warnings as errors")
    args = ap.parse_args()
    root = os.path.abspath(args.root or os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
    rep = Report(strict=args.strict)

    targets = []
    if args.only:
        for rel in args.only:
            rel = rel.replace("\\", "/")
            p = os.path.join(root, rel)
            if not os.path.isfile(p):
                rep.err(rel, 1, "file not found")
                continue
            targets.append((p, rel))
    else:
        for folder in ("sections", "blocks"):
            d = os.path.join(root, folder)
            if not os.path.isdir(d):
                continue
            for name in sorted(os.listdir(d)):
                if name.endswith(".liquid"):
                    targets.append((os.path.join(d, name), f"{folder}/{name}"))

    linted = 0
    for p, rel in targets:
        if rel.startswith("sections/"):
            lint_section(p, rel, rep)
            linted += 1
        elif rel.startswith("blocks/"):
            lint_block(p, rel, rep)
            linted += 1
        else:
            rep.warn(rel, 1, "not a section or block; skipped")

    rep.dump()
    if rep.errors:
        print(f"chassis-lint: {len(rep.errors)} error(s), {len(rep.warnings)} warning(s) across {linted} file(s)", file=sys.stderr)
        return 1
    print(f"chassis-lint: clean ({linted} file(s), {len(rep.warnings)} warning(s))")
    return 0


if __name__ == "__main__":
    sys.exit(main())
