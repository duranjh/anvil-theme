#!/usr/bin/env python3
"""scripts/asset-audit.py — Anvil asset audit.

Fails (exit 1) and prints path:line: message for:
  * any raster image in assets/ (.png .jpg .jpeg .gif .webp .avif .bmp .tif
    .tiff .ico) — images belong in the merchant's Files, not in the theme
  * any SVG (assets/*.svg, assets/*.svg.liquid) or inline <svg> fragment in
    snippets/, blocks/, sections/, layout/ that contains a brand token
    (review sites, social networks, payment brands, platform names) or an
    embedded base64 image
  * any assets/ file that embeds a base64 image (CSS data URIs included)

Payment icons must come from `payment_type_svg_tag`; merchants upload any
other logo they are entitled to use through an image_picker.

Usage: scripts/asset-audit.py [--root DIR]
"""
import argparse
import os
import re
import sys

RASTER_EXT = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".bmp", ".tif", ".tiff", ".ico"}

BRAND_TOKENS = [
    "trustpilot", "facebook", "instagram", "tiktok", "google", "amazon", "visa",
    "mastercard", "paypal", "apple", "klarna", "afterpay", "shop pay", "youtube",
    "meta", "twitter", "yelp", "judge", "loox",
]

def brand_regex():
    parts = []
    for tok in BRAND_TOKENS:
        if " " in tok:
            a, b = tok.split(" ", 1)
            parts.append(r"\b" + re.escape(a) + r"[\s_-]?" + re.escape(b) + r"\b")
        else:
            parts.append(r"\b" + re.escape(tok) + r"\b")
    return re.compile("|".join(parts), re.I)

BRAND_RE = brand_regex()
BASE64_RE = re.compile(r"data:image/[a-z+.-]+;base64,", re.I)
SVG_FRAGMENT_RE = re.compile(r"<svg\b.*?</svg\s*>", re.I | re.S)


def line_of(text, idx):
    return text.count("\n", 0, idx) + 1


def read(path):
    with open(path, "r", encoding="utf-8", errors="replace") as fh:
        return fh.read()


def scan_svg_text(path, text, base_offset, findings):
    """Scan one SVG document/fragment. base_offset = index in the file where
    the fragment starts (for line numbers)."""
    for m in BRAND_RE.finditer(text):
        findings.append((path, line_of_from(text, m.start(), base_offset), f"brand token in SVG: `{m.group(0)}`"))
    for m in BASE64_RE.finditer(text):
        findings.append((path, line_of_from(text, m.start(), base_offset), "embedded base64 image in SVG"))


def line_of_from(fragment, idx, base_line):
    return base_line + fragment.count("\n", 0, idx)


def audit(root):
    findings = []
    assets = os.path.join(root, "assets")
    if os.path.isdir(assets):
        for name in sorted(os.listdir(assets)):
            path = os.path.join(assets, name)
            rel = os.path.relpath(path, root)
            if os.path.isdir(path):
                findings.append((rel, 1, "sub-directories are not allowed inside assets/"))
                continue
            lower = name.lower()
            stem = lower[:-7] if lower.endswith(".liquid") else lower
            ext = os.path.splitext(stem)[1]
            if ext in RASTER_EXT:
                findings.append((rel, 1, f"raster image ({ext}) in assets/; use the merchant's Files or an image_picker"))
                continue
            if ext in (".svg", ".css", ".js", ".json", ".liquid", ".txt", ".md", ""):
                text = read(path)
                if ext == ".svg":
                    scan_svg_text(rel, text, 1, findings)
                else:
                    for m in BASE64_RE.finditer(text):
                        findings.append((rel, line_of(text, m.start()), "embedded base64 image"))
                    for frag in SVG_FRAGMENT_RE.finditer(text):
                        scan_svg_text(rel, frag.group(0), line_of(text, frag.start()), findings)

    for folder in ("snippets", "blocks", "sections", "layout"):
        d = os.path.join(root, folder)
        if not os.path.isdir(d):
            continue
        for name in sorted(os.listdir(d)):
            if not name.endswith(".liquid"):
                continue
            path = os.path.join(d, name)
            if not os.path.isfile(path):
                continue
            rel = os.path.relpath(path, root)
            text = read(path)
            for frag in SVG_FRAGMENT_RE.finditer(text):
                scan_svg_text(rel, frag.group(0), line_of(text, frag.start()), findings)
            for m in BASE64_RE.finditer(text):
                findings.append((rel, line_of(text, m.start()), "embedded base64 image"))
    return findings


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--root", default=None, help="theme root (default: parent of scripts/)")
    args = ap.parse_args()
    root = os.path.abspath(args.root or os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

    findings = audit(root)
    # de-duplicate identical lines
    seen = set()
    uniq = []
    for f in findings:
        if f not in seen:
            seen.add(f)
            uniq.append(f)
    for path, line, msg in uniq:
        print(f"{path}:{line}: {msg}")
    if uniq:
        print(f"asset-audit: {len(uniq)} finding(s)", file=sys.stderr)
        return 1
    print("asset-audit: clean")
    return 0


if __name__ == "__main__":
    sys.exit(main())
