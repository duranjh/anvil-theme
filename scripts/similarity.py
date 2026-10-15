#!/usr/bin/env python3
"""scripts/similarity.py — CI-only independence check against public reference themes.

This is the ONLY place in the Anvil project that ever touches the reference
theme repositories. It shallow-clones them into a cache directory that must
live OUTSIDE the theme tree, builds normalised 6-line shingles of every
.liquid/.css/.js file on both sides, and reports any window shared between
Anvil and a reference. It never copies reference files into the theme and
never prints reference content — only `our/file:line ~ ref/file:line`.

Guards:
  * refuses to run unless CI=true (or --local-ok is passed explicitly)
  * refuses a cache directory inside the repository
  * exit 1 on any shared window; exit 2 on setup problems

Normalisation per line: strip, collapse internal whitespace, lower-case.
Blank lines are dropped. Windows whose six lines total fewer than
--min-chars characters (default 90) are ignored as boilerplate.

Usage:
  scripts/similarity.py [--root DIR] [--cache DIR] [--refs URL ...]
                        [--window 6] [--min-chars 90] [--allow REGEX ...]
                        [--local-ok]
"""
import argparse
import os
import re
import subprocess
import sys

DEFAULT_REFS = [
    "https://github.com/Shopify/dawn.git",
    "https://github.com/Shopify/horizon.git",
]
OUR_DIRS = ("sections", "snippets", "blocks", "assets", "layout", "templates")
EXTS = (".liquid", ".css", ".js")


def norm_line(line):
    return re.sub(r"\s+", " ", line.strip()).lower()


def lines_of(path):
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as fh:
            raw = fh.read().splitlines()
    except OSError:
        return []
    out = []
    for i, ln in enumerate(raw, start=1):
        n = norm_line(ln)
        if n:
            out.append((i, n))
    return out


def shingles(path, window, min_chars):
    """Yield (key, first_line_no) for each window."""
    ls = lines_of(path)
    for i in range(0, len(ls) - window + 1):
        chunk = ls[i:i + window]
        key = "\n".join(n for _, n in chunk)
        if len(key) - (window - 1) < min_chars:
            continue
        yield key, chunk[0][0]


def walk(root, dirs=None, exts=EXTS):
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in (".git", "node_modules")]
        rel_dir = os.path.relpath(dirpath, root)
        if dirs is not None:
            top = rel_dir.split(os.sep)[0]
            if rel_dir != "." and top not in dirs:
                continue
            if rel_dir == ".":
                continue
        for name in filenames:
            if name.endswith(exts):
                yield os.path.join(dirpath, name)


def clone(url, cache):
    name = re.sub(r"\.git$", "", url.rstrip("/").split("/")[-1])
    dest = os.path.join(cache, name)
    if os.path.isdir(os.path.join(dest, ".git")):
        return name, dest
    os.makedirs(cache, exist_ok=True)
    cmd = ["git", "clone", "--depth", "1", "--quiet", url, dest]
    res = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)
    if res.returncode != 0:
        raise SystemExit(f"similarity: clone failed for {url}: {res.stderr.strip()}")
    return name, dest


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--root", default=None)
    ap.add_argument("--cache", default=None, help="cache dir for reference clones (default ~/.cache/anvil-similarity)")
    ap.add_argument("--refs", nargs="*", default=None, help="reference repo URLs (default: the two public Shopify references)")
    ap.add_argument("--window", type=int, default=6)
    ap.add_argument("--min-chars", type=int, default=90)
    ap.add_argument("--allow", action="append", default=[], help="regex on `our/file:line`; matching hits are ignored (reviewed false positives)")
    ap.add_argument("--local-ok", action="store_true", help="allow running outside CI (never do this in an implementation session)")
    args = ap.parse_args()

    if os.environ.get("CI", "").lower() not in ("1", "true", "yes") and not args.local_ok:
        print("similarity: refusing to run outside CI (set CI=true or pass --local-ok). "
              "Reference themes must never be opened in an implementation session.", file=sys.stderr)
        return 2

    root = os.path.realpath(args.root or os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
    cache = os.path.realpath(args.cache or os.path.join(os.path.expanduser("~"), ".cache", "anvil-similarity"))
    if cache == root or cache.startswith(root + os.sep):
        print(f"similarity: cache directory {cache} is inside the theme tree; refusing", file=sys.stderr)
        return 2

    refs = args.refs if args.refs else DEFAULT_REFS
    ref_index = {}  # key -> list of (refname/relpath, line)
    ref_files = 0
    for url in refs:
        name, dest = clone(url, cache)
        for path in walk(dest):
            ref_files += 1
            rel = f"{name}/{os.path.relpath(path, dest)}"
            for key, line in shingles(path, args.window, args.min_chars):
                ref_index.setdefault(key, []).append((rel, line))

    allow = [re.compile(a) for a in args.allow]
    hits = []
    our_files = 0
    for path in walk(root, dirs=OUR_DIRS):
        our_files += 1
        rel = os.path.relpath(path, root)
        for key, line in shingles(path, args.window, args.min_chars):
            if key in ref_index:
                where = f"{rel}:{line}"
                if any(a.search(where) for a in allow):
                    continue
                for ref_rel, ref_line in ref_index[key][:3]:
                    hits.append((rel, line, ref_rel, ref_line))

    # collapse runs of consecutive lines against the same reference file
    hits.sort()
    collapsed = []
    for rel, line, ref_rel, ref_line in hits:
        if collapsed:
            prel, pstart, pend, pref, pref_start, pref_end = collapsed[-1]
            if prel == rel and pref == ref_rel and line <= pend + 1 and ref_line <= pref_end + 1:
                collapsed[-1] = (prel, pstart, max(pend, line), pref, pref_start, max(pref_end, ref_line))
                continue
        collapsed.append((rel, line, line, ref_rel, ref_line, ref_line))

    for rel, start, end, ref_rel, rstart, rend in collapsed:
        span = f"{start}" if start == end else f"{start}-{end + args.window - 1}"
        rspan = f"{rstart}" if rstart == rend else f"{rstart}-{rend + args.window - 1}"
        print(f"{rel}:{start}: shared {args.window}-line window(s) {span} with {ref_rel}:{rspan}")

    print(f"similarity: {our_files} Anvil files vs {ref_files} reference files, "
          f"{len(ref_index)} reference windows, {len(collapsed)} shared region(s)", file=sys.stderr)
    return 1 if collapsed else 0


if __name__ == "__main__":
    sys.exit(main())
