#!/usr/bin/env python3
"""scripts/agent-prompt.py — assemble the implementation prompt for one section.

Order of the assembled prompt:
  0. role and hard rules (written here)
  1. docs/CONVENTIONS.md                       (the contract, verbatim)
  2. docs/spec/<slug>.md                        (the spec card; see spec-cards.py)
  3. CHASSIS-API: the {% doc %} headers of every snippets/anvil-*.liquid and
     blocks/*.liquid, extracted at run time (product block snippets
     snippets/anvil-pb-*.liquid are left out: only the product block
     dispatcher renders them, and their headers are documented in place)
  4. docs/FORBIDDEN.md                          (verbatim)
  5. the two exemplar sections in full: sections/anvil-icon-bar.liquid and
     sections/anvil-faq.liquid
  6. output contract: allowed paths, definition of done, `npm run gate -- <slug>`,
     the structured notes to return

The result is printed to stdout, or written with --out FILE / --archive
(docs/agent-prompts/<slug>.md). The script refuses to emit a prompt that
mentions a local volume path or the course-theme folder, so nothing outside
the clean room can leak into an agent's context.

Usage:
  scripts/agent-prompt.py <slug|anvil-slug> [--root DIR] [--out FILE]
                          [--archive] [--write-chassis-api FILE] [--strict]
"""
import argparse
import os
import re
import sys

EXEMPLARS = ("anvil-icon-bar", "anvil-faq")
DOC_RE = re.compile(r"\{%-?\s*doc\s*-?%\}(.*?)\{%-?\s*enddoc\s*-?%\}", re.S)
LEAK_RE = re.compile(r"/Volumes/|_course-theme", re.I)


def norm_slug(s):
    s = s.strip()
    if s.endswith(".liquid"):
        s = s[:-7]
    s = s.split("/")[-1]
    if s.startswith("anvil-"):
        s = s[len("anvil-"):]
    return s


def read(path):
    with open(path, "r", encoding="utf-8") as fh:
        return fh.read()


def extract_doc(text):
    m = DOC_RE.search(text)
    if not m:
        return None
    lines = [ln.rstrip() for ln in m.group(1).strip("\n").splitlines()]
    # drop a common leading indent
    indents = [len(ln) - len(ln.lstrip()) for ln in lines if ln.strip()]
    cut = min(indents) if indents else 0
    return "\n".join(ln[cut:] if len(ln) >= cut else ln for ln in lines).strip()


def chassis_api(root, warnings):
    parts = ["# CHASSIS-API (extracted from LiquidDoc headers)", ""]
    found = 0
    for folder, prefix in (("snippets", "anvil-"), ("blocks", "")):
        d = os.path.join(root, folder)
        if not os.path.isdir(d):
            warnings.append(f"{folder}/ does not exist yet; CHASSIS-API has no {folder}")
            continue
        for name in sorted(os.listdir(d)):
            if not name.endswith(".liquid") or not name.startswith(prefix):
                continue
            if folder == "snippets" and name.startswith("anvil-pb-"):
                continue
            text = read(os.path.join(d, name))
            doc = extract_doc(text)
            parts.append(f"## {folder}/{name}")
            if doc:
                parts.append("```")
                parts.append(doc)
                parts.append("```")
                found += 1
            else:
                parts.append("_(no LiquidDoc header; read docs/CONVENTIONS.md §5–§6 for its signature)_")
            parts.append("")
    if found == 0:
        warnings.append("no {% doc %} headers found in snippets/ or blocks/")
    return "\n".join(parts).rstrip() + "\n"


def output_contract(slug):
    return f"""# OUTPUT CONTRACT

You are implementing **sections/anvil-{slug}.liquid** for Anvil.

## Files you may create or change (nothing else)
- `sections/anvil-{slug}.liquid`
- `blocks/_anvil-{slug}-*.liquid` (only when the spec card's Blocks column says private theme blocks)
- `assets/anvil-{slug}*.css` / `assets/anvil-{slug}*.js` (only when the spec card's JS column needs it)
- `docs/sections/{slug}.md` (purpose, settings, blocks, behaviour, honesty notes, open questions)

Shared snippets, components, locale files, theme settings and other sections are read-only.
Need something from them? Code against the contract in CONVENTIONS and write the assumption in your notes.

## Sources
Allowed while you work: shopify.dev, help.shopify.com, MDN, W3C/WAI. Nothing else.
Never open, fetch or recall any theme repository or zip, nor any commercial theme or section library.
Write every string yourself. No identifier from FORBIDDEN may appear in your files.

## Definition of done (CONVENTIONS §13)
1. Skeleton and the 13 chassis settings exactly as the contract says; `presets` present;
   `{{{{ block.shopify_attributes }}}}` on every local block.
2. `shopify theme check --fail-level warning` reports 0 findings for the whole theme.
3. `scripts/cleanroom-lint.sh`, `scripts/asset-audit.py`, `scripts/chassis-lint.py`, `scripts/check-limits.sh` pass.
4. Renders with placeholder content; works without JavaScript where the card says so;
   keyboard-operable; reduced motion respected; every setting that could mislead has a one-sentence `info`.
5. `docs/sections/{slug}.md` written.
6. Nothing outside the allowed paths changed.

Run the whole gate yourself before you finish:

    npm run gate -- {slug}

(`scripts/gate.sh {slug}` does the same; it needs the Shopify CLI on PATH.)

## What to return
A structured note with: `files_written` (paths), `summary` (one line per file),
`contract_assumptions` (anything you assumed about snippets, components, tokens or locale keys you do not own),
`theme_check` (your files' finding count after fixes, plus findings you saw in other files),
`open_questions` (conflicts between the documents, honesty edge cases, anything uncertain).
"""


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("slug")
    ap.add_argument("--root", default=None)
    ap.add_argument("--out", default=None, help="write the prompt here instead of stdout")
    ap.add_argument("--archive", action="store_true", help="write to docs/agent-prompts/<slug>.md")
    ap.add_argument("--write-chassis-api", default=None, metavar="FILE", help="also write the extracted CHASSIS-API markdown to FILE")
    ap.add_argument("--strict", action="store_true", help="fail when the exemplars or doc headers are missing")
    args = ap.parse_args()

    root = os.path.abspath(args.root or os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
    slug = norm_slug(args.slug)
    warnings = []

    conventions = os.path.join(root, "docs", "CONVENTIONS.md")
    forbidden = os.path.join(root, "docs", "FORBIDDEN.md")
    card = os.path.join(root, "docs", "spec", f"{slug}.md")
    for p in (conventions, forbidden):
        if not os.path.isfile(p):
            raise SystemExit(f"{os.path.relpath(p, root)}:1: missing")
    if not os.path.isfile(card):
        raise SystemExit(f"docs/spec/{slug}.md:1: missing; run scripts/spec-cards.py first")

    api = chassis_api(root, warnings)
    if args.write_chassis_api:
        with open(args.write_chassis_api, "w", encoding="utf-8") as fh:
            fh.write(api)

    exemplar_parts = ["# EXEMPLARS (two finished sections; copy the shape, not the content)", ""]
    for ex in EXEMPLARS:
        p = os.path.join(root, "sections", f"{ex}.liquid")
        exemplar_parts.append(f"## sections/{ex}.liquid")
        if os.path.isfile(p):
            exemplar_parts.append("```liquid")
            exemplar_parts.append(read(p).rstrip("\n"))
            exemplar_parts.append("```")
        else:
            warnings.append(f"exemplar sections/{ex}.liquid is missing")
            exemplar_parts.append("_(MISSING at prompt time — the chassis wave has not landed this exemplar yet)_")
        exemplar_parts.append("")

    head = f"""# Anvil — implementation brief for `anvil-{slug}`

You are building one section of **Anvil**, a from-scratch, MIT-licensed Shopify Online Store 2.0 theme.
Read every part of this brief before writing a line. Part 1 (CONVENTIONS) is the contract and wins over
everything else; raise any conflict you notice in your notes instead of resolving it silently.
Honesty rules are product requirements, not suggestions.

Parts: 1 CONVENTIONS · 2 SPEC CARD · 3 CHASSIS-API · 4 FORBIDDEN · 5 EXEMPLARS · 6 OUTPUT CONTRACT
"""
    sections = [
        head,
        "\n---\n# PART 1 — CONVENTIONS (docs/CONVENTIONS.md)\n\n" + read(conventions).rstrip() + "\n",
        "\n---\n# PART 2 — SPEC CARD (docs/spec/" + slug + ".md)\n\n" + read(card).rstrip() + "\n",
        "\n---\n# PART 3 — " + api.lstrip("# ").rstrip() + "\n",
        "\n---\n# PART 4 — FORBIDDEN (docs/FORBIDDEN.md)\n\n" + read(forbidden).rstrip() + "\n",
        "\n---\n# PART 5 — " + "\n".join(exemplar_parts).lstrip("# ").rstrip() + "\n",
        "\n---\n# PART 6 — " + output_contract(slug).lstrip("# ").rstrip() + "\n",
    ]
    prompt = "\n".join(sections)

    leak = LEAK_RE.search(prompt)
    if leak:
        line = prompt.count("\n", 0, leak.start()) + 1
        print(f"agent-prompt: refusing to emit — prompt line {line} mentions `{leak.group(0)}`", file=sys.stderr)
        return 2

    for w in warnings:
        print(f"agent-prompt: warning: {w}", file=sys.stderr)
    if args.strict and warnings:
        return 1

    out = args.out
    if args.archive:
        out = os.path.join(root, "docs", "agent-prompts", f"{slug}.md")
    if out:
        os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
        with open(out, "w", encoding="utf-8") as fh:
            fh.write(prompt)
        print(os.path.relpath(out, root) if out.startswith(root) else out)
    else:
        sys.stdout.write(prompt)
    return 0


if __name__ == "__main__":
    sys.exit(main())
