# Anvil — build harness

_How to run every check locally and what each one enforces. The scripts live in `scripts/`; CI runs the same scripts. Nothing here needs npm packages except the optional screenshot/axe stage._

## 0. Prerequisites
- Shopify CLI 4.x (`npm i -g @shopify/cli`). On this Mac it lives under `/opt/homebrew/opt/node@22/bin`; the gate, a11y and package scripts add that folder to `PATH` when it exists.
- `python3` (3.9+), `bash` (3.2 is enough), `git`, `unzip`. `ripgrep` is used when present, plain `grep -E` otherwise.
- Optional, for screenshots and axe: `npm install && npx playwright install chromium` (declared in `package.json`, never required for the static gates).

### Note on `.theme-check.yml` ignore patterns
The ignore globs are anchored with a leading slash (`/dev/**`, `/docs/**`, `/scripts/**`). Theme Check matches unanchored globs against the full path, so a bare `dev/**` made a checkout at `~/dev/anvil-theme` inspect **0 files** and report success during wave 0. Keep the slashes when adding patterns. `scripts/gate.sh` still refuses to count a 0-files run as a pass (`G1 theme check FAIL(0-files)`), so a regression shows up as a failed gate rather than a silent pass.

## 1. Quick start
```sh
npm run check                 # shopify theme check --fail-level warning (whole theme)
npm run lint                  # cleanroom-lint → asset-audit → chassis-lint → check-limits
npm test                      # node --test 'tests/*.test.mjs' (gift engine, ship dates)
npm run blocks                # rebuild the product section schemas from docs/product-blocks/
npm run blocks:check          # fail when those schemas drifted (CI runs it with --strict)
npm run gate -- ticker        # the full per-section gate for sections/anvil-ticker.liquid
npm run spec-cards            # regenerate docs/spec/<slug>.md from SPEC §4.2 + DESIGN-sections §3
npm run prompt -- ticker      # print the implementation brief for anvil-ticker
npm run a11y                  # axe over the dev theme (needs STORE + DEV_THEME_ID)
npm run package               # theme check + shopify theme package → dist/<name>-<version>.zip
```
Every script prints findings as `path:line: message` (file-level findings use line 1) and exits 1 when anything is wrong, 2 on bad usage. `--help` prints the header comment of each script.

## 2. The scripts

### `scripts/cleanroom-lint.sh [--root DIR] [--strict]`
Three rules from `docs/FORBIDDEN.md`:
1. **Forbidden tokens.** The token list is parsed from `docs/FORBIDDEN.md` at run time (the three token headings; back-ticked entries are extended regexes, everything else a literal), so the doc stays the single source and this script never has to contain a token itself. Matching is case-insensitive over the whole repo except `.git/`, the ignored build folders (`node_modules/`, `.harness/`, `dev/`, `.shopify/`, `dist/`), `docs/FORBIDDEN.md`, the script itself and — unless `--strict` / `CLEANROOM_STRICT=1` — the provenance prose that has to name what we are independent from: the top-level `docs/*.md`, `docs/agent-prompts/`, `README.md`, `NOTICE`, `CHANGELOG.md`, `LICENSE`. Everything that ships in the zip, plus `scripts/`, `.github/`, `docs/sections/`, `docs/spec/`, is always scanned.
   Hyphenated class-name tokens are matched only when they do not continue a longer kebab-case identifier, so Anvil's own `--av-*` / `.av-*` names never trip on a reference theme's class fragment while the verbatim class still does.
2. **File prefixes.** Every file in `sections/ snippets/ blocks/ assets/` is `anvil-*`, `_anvil-*` or `main-*`, except the Shopify-fixed names (`header-group.json`, `footer-group.json`, `overlay-group.json`, `apps.liquid` in `sections/`; `_blocks.liquid` in `blocks/`). No sub-directories.
3. **Sizes.** Liquid, asset, JSON-template and section-group files ≤ 256 KB; `config/settings_schema.json` ≤ 512 KB; `config/settings_data.json` and `locales/*.json` ≤ 1.5 MB (Shopify's own limits).

### `scripts/asset-audit.py [--root DIR]`
Fails on any raster image in `assets/` (`.png .jpg .jpeg .gif .webp .avif .bmp .tif .tiff .ico`), on SVGs (`assets/*.svg`, inline `<svg>` in `snippets/ blocks/ sections/ layout/`) that contain a brand token (review sites, social networks, payment brands, platform names) or an embedded base64 image, and on any base64 image data URI in `assets/`. Payment icons come from `payment_type_svg_tag`; other logos are merchant uploads.

### `scripts/chassis-lint.py [--root DIR] [--only PATH ...] [--strict]`
For every group-only or overlay `sections/anvil-*.liquid` (`enabled_on.groups` without `templates`: header, announcement bar, footer, overlay widgets): the **reduced chassis** — exactly `color_scheme`, `pad_top`, `pad_bottom`, `pad_mobile`, `show_on` with the contract types and options, none of the full-chassis heading/width/reveal/anchor ids, `anvil-section-attrs` with the file name as `type`, and the `av-section__inner` wrapper (CONVENTIONS §4, DECISIONS 22).

For every other `sections/anvil-*.liquid` with `presets` (addable sections):
- skeleton: `{% render 'anvil-section-attrs', section: section, type: '<file name>' %}`, `{% render 'anvil-section-head', section: section %}`, an `av-section__inner` wrapper (`assign s = section.settings` is a warning);
- the 13 chassis settings with exact ids and types (`heading` inline_richtext, `subheading` richtext, `head_align` text_alignment, `head_size`/`accent_style`/`width`/`pad_mobile`/`reveal`/`show_on` select with the exact option values, `color_scheme` color_scheme, `pad_top`/`pad_bottom` range 0–120 step 4 px, `anchor` text). Defaults, order and "chassis first" drift are warnings;
- `presets` non-empty and named; schema `name` ≤ 25 chars; ≤ 40 non-header settings; `enabled_on`/`disabled_on` not both;
- blocks: `{{ block.shopify_attributes }}` on every local block (either on the loop wrapper or inside each `when` branch), `{% render block %}` for `@app`, `{% content_for 'blocks' %}` when `@theme` is offered, no local + `@theme` mix, `max_blocks` present (warning).

For every `sections/*.liquid` and `blocks/*.liquid` (`main-*`, static and group sections included):
- no literal `<img>` (use `image_tag` via `anvil-media`);
- no `<script>` without `type="module"` or `defer` (`application/json` and `application/ld+json` data scripts are allowed);
- no `http(s)://` URL except the SVG namespace, `schema.org` and the two click-to-load video facade hosts;
- `{% stylesheet %}` ≤ 6 KB; top-level selectors should start with `.av-<slug>` (warning).
Theme blocks must print `{{ block.shopify_attributes }}` on their root.

### `scripts/check-limits.sh [--root DIR]`
Gzip budgets (DECISIONS 20): the core modules `anvil-core`, `-events`, `-cart-api`, `-sections`, `-dom` together ≤ 15,360 B; `anvil-slider.js` ≤ 5,120; `anvil-marquee.js` ≤ 1,536; `anvil-product.js` ≤ 8,192 and `anvil-cart-drawer.js` ≤ 6,144 (DECISIONS 41); every other `assets/anvil-*.js` ≤ 4,096; `anvil-base.css` ≤ 20,480; every other `assets/anvil-*.css` ≤ 8,192 (each finding names the file and its size). Shopify platform limits: Liquid < 256 KB; `settings_schema.json` < 512 KB; `settings_data.json` and locale files < 1.5 MB; JSON templates and section groups < 512 KB; locale files below 3,400 translation keys and 1,000 chars per value; JSON validity of `templates/**`, `config/`, `locales/`, `sections/*.json` (a leading `/* … */` comment is tolerated); templates: `sections`/`order` agree, ≤ 25 sections, ≤ 50 blocks per section, `block_order` agrees with `blocks`; section groups carry `type/name/sections/order`; `theme_info` has name, version and author; `blocks/` ≤ 300 files.

### `scripts/sync-block-schemas.py [--check] [--strict]`
Rebuilds the `{% schema %}` of `sections/main-product.liquid` and `sections/anvil-featured-product.liquid` from `docs/product-blocks/` (WAVE1-CONTRACTS §2): the shell settings (`_section-main-product.json`), every `_settings-*.json` in name order, every `<type>.json` in the order of WAVE1-CONTRACTS §1, then `@app`. Featured product gets the full chassis, a `product` setting and no `sticky_atc` / `quantity_gifts`. Edit the fragments, never the generated schema. `--check` exits 1 on drift and writes nothing; `--strict` also fails on a missing fragment. Broken fragments (bad JSON, wrong type, duplicate or chassis setting ids) always exit 1.

### `scripts/paths-lint.sh [--root DIR] [--base REF] GLOB...`
Fails when `git status --porcelain -uall` (and, with `--base`, `git diff --name-only REF`) lists a path outside the allowed globs. Globs are shell patterns matched against repo-relative paths; `*` crosses `/`.

### `scripts/scratch-template.py <slug> [--slot N] [--stage DIR] [--preset N] [--no-copy] [--json]`
Reads `sections/anvil-<slug>.liquid`, takes `presets[0]` (or `--preset N`) and writes `templates/page.anvil-scratch-<slot>.json` rendering `main-page` + the section with the preset settings and blocks (nested blocks included, alphanumeric ids). The stage directory (default `.harness/stage/<slot>/`) is a fresh copy of the theme folders so a push with `--only` can run from it without touching the working tree. Prints the stage dir, the template path and the `--only` list. No store content is created: `?view=anvil-scratch-<slot>` renders the template on any existing page.

### `scripts/agent-prompt.py <slug> [--out FILE] [--archive] [--write-chassis-api FILE] [--strict]`
Assembles the implementation brief: role + hard rules → `docs/CONVENTIONS.md` → `docs/spec/<slug>.md` → CHASSIS-API (the `{% doc %}` headers of `snippets/anvil-*.liquid` and `blocks/*.liquid`, extracted live; the product block snippets `snippets/anvil-pb-*.liquid` are left out, only the dispatcher renders them) → `docs/FORBIDDEN.md` → the exemplars `sections/anvil-icon-bar.liquid` and `sections/anvil-faq.liquid` in full → the output contract (allowed paths, definition of done, `npm run gate -- <slug>`, the notes to return). Refuses to emit a prompt that mentions a local volume path or the course-theme folder. `--archive` writes `docs/agent-prompts/<slug>.md`; `--write-chassis-api docs/CHASSIS-API.md` also writes the extracted API on its own.

### `scripts/spec-cards.py [--only SLUG ...] [--check] [--list]`
Joins the `docs/SPEC.md` §4.2 table (human names) with the `docs/DESIGN-sections.md` §3 table (file names) through the `NAME_MAP` in the script and writes `docs/spec/<slug>.md`, each opening with "Build exactly this; ids and words are yours; follow CONVENTIONS", the SPEC row, the DESIGN row, the allowed paths and the non-negotiables. Unmatched rows on either side are reported and exit 1. `--check` is the CI-style drift guard (writes nothing). Slugs are the file name without `anvil-` (`docs/spec/ticker.md` for `anvil-ticker`).

### `scripts/gate.sh <slug> [--slot N] [--allow GLOB]... [--no-paths] [--no-push]`
The per-section gate (`npm run gate -- <slug>`). Static gates always all run, then one summary:
- **G0 paths-lint** with the slug's allowed paths (`sections/anvil-<slug>.liquid`, `blocks/_anvil-<slug>-*.liquid`, `assets/anvil-<slug>*`, `docs/sections/<slug>.md`, plus `--allow`). `--no-paths` or `GATE_SKIP_PATHS=1` skips it (dirty wave branches).
- **G1** `shopify theme check --fail-level warning` on the whole theme.
- **G2** cleanroom-lint, asset-audit, chassis-lint, check-limits.
- **G3/G4** run only when the static gates passed and `DEV_THEME_ID`, `STORE`, `THEME_TOKEN` are set; otherwise they print SKIP. G3 stages the scratch template and pushes with `shopify theme push --path <stage> --theme $DEV_THEME_ID --only … --nodelete --json --no-input` (token via `SHOPIFY_CLI_THEME_TOKEN`) under a repo-wide lock (`.harness/push.lock`, `mkdir`-based so it works on macOS too) with ≥ 5 s between pushes. G4 runs `scripts/screenshot.mjs` on `https://$STORE/pages/$SCRATCH_PAGE?view=anvil-scratch-<slot>&preview_theme_id=$DEV_THEME_ID&pb=0` (`SCRATCH_PAGE` defaults to `contact`; set `STORE_PASSWORD` for a password-protected dev store).
Logs, PNGs and JSON reports land in `.harness/reports/<slug>/`. Exit 1 when any gate fails; skips are not failures.

### `scripts/screenshot.mjs`
Playwright capture: 375×812 @2x (mobile emulation) and 1280×800 full-page PNGs, a reduced-motion run that asserts no `<anvil-marquee>` animation is running and no `anvil:slider:change` fires within 3 s, console/page errors (first-party ones fail, third-party app scripts are listed as warnings), third-party origins listed, and axe-core (`@axe-core/playwright`) with 0 serious/critical violations when installed. Env: `SCRATCH_URL` (or `STORE`+`DEV_THEME_ID`+`SCRATCH_PAGE`+`SLOT`), `OUT_DIR`, `SECTION_TYPE`, `STORE_PASSWORD`, `MODE=full|a11y`, `AXE=auto|off`, `TIMEOUT_MS`. Exit 3 = skipped (playwright or chromium missing).

### `scripts/a11y.sh [URL ...]`
Runs `screenshot.mjs` in `MODE=a11y` over `/`, `/collections/all`, `/cart`, `/search?q=a`, `/pages/$SCRATCH_PAGE` and `/products/$PRODUCT_HANDLE` (when set) on the dev theme (`STORE`, `DEV_THEME_ID`), or over the URLs given. Skips with a notice when the env or playwright is missing. Reports in `.harness/reports/a11y/`.

### `scripts/package.sh [--skip-check]`
`shopify theme check --fail-level warning`, then `shopify theme package`, then verifies the zip (theme folders at the root, no `docs/ scripts/ .github/ node_modules/`, ≤ 50 MB, warning above the 2 MB design budget) and moves it to `dist/<theme_name>-<theme_version>.zip`.

### `scripts/similarity.py` (CI only)
Shallow-clones the two public Shopify reference themes into a cache **outside** the repository (`~/.cache/anvil-similarity` by default; a cache inside the tree is refused), builds normalised 6-line shingles of every `.liquid/.css/.js` on both sides and reports any shared window as `our/file:line ~ ref/file:line`. It never copies reference files into the theme, never prints their content, and refuses to run unless `CI=true` (or `--local-ok`, which an implementation session must never pass). This script is the only place those repositories are ever touched. `--allow REGEX` silences a reviewed false positive; `--min-chars` (default 90) drops boilerplate windows.

## 3. CI and release
- `.github/workflows/ci.yml` — on every push and pull request: Node 22, `npm i -g @shopify/cli`, `shopify theme check --fail-level warning`, cleanroom-lint, asset-audit, chassis-lint, check-limits, `scripts/sync-block-schemas.py --check --strict` and `node --test 'tests/*.test.mjs'` (Node 22 reads a bare `tests/` as a file name, so the glob is quoted); a second job runs similarity.
- `.github/workflows/release.yml` — on tags `v*`: asserts `theme_info.theme_version` equals the tag, extracts the matching `## [X.Y.Z]` section from `CHANGELOG.md`, runs `scripts/package.sh`, attaches `dist/*.zip` to a GitHub Release through `softprops/action-gh-release@v2`.
- `.github/workflows/lighthouse.yml` — `workflow_dispatch`: `Shopify/lighthouse-ci-action@v1` with minimum scores performance 0.80 / accessibility 0.95. Secrets: `SHOP_CLIENT_ID`, `SHOP_CLIENT_SECRET` (a Dev Dashboard app with `read_products` + `write_themes`), `SHOP_STORE`, `SHOP_PASSWORD` (password-protected stores only), optional `LHCI_GITHUB_APP_TOKEN`. Point it at a development store.

## 4. Dev theme
`shopify.theme.toml` declares `[environments.voreau-dev]` (`store = "ftsegk-n1.myshopify.com"`, `theme = "REPLACE_WITH_DEV_THEME_ID"`). Create the dev theme once with `shopify theme push --unpublished --theme "ANVIL dev - DO NOT PUBLISH"`, paste its id into the TOML and into `DEV_THEME_ID` for the gate. Never add `live`/`allow-live`. Tokens go in `THEME_TOKEN` (env), never in the TOML.

## 5. Working as an implementation agent
1. `npm run prompt -- <slug>` gives you the brief; the card comes from `npm run spec-cards`.
2. Touch only your allowed paths; code against `docs/CONVENTIONS.md` for anything you do not own and write the assumption in your notes.
3. Before you finish: `npm run gate -- <slug>`. With `DEV_THEME_ID`, `STORE` and `THEME_TOKEN` set it also pushes your scratch page and screenshots it; without them the static gates still decide.
4. Findings in other clusters' files are expected while they are being written: list them, do not edit those files.
