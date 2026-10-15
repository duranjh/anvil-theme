# Anvil — Status at release candidate 1.0.0-rc.1, and the build passes before it

_2026-10-15. Section RC is the release candidate 1.0.0-rc.1: what the live store verified and what is still open. Section F is the consistency and completeness fix pass (54 audit findings, DECISIONS 82–119). Section S below is the section-library integration pass (45 sections from the first run plus the rebuilt `anvil-stats`), written by the integrator. Numbers come from the in-place gate (`shopify theme check --fail-level warning`, Shopify CLI 4.9.3), the repo scripts and `node --test`. Section W1 is the wave-1 record (product page and cart drawer) and sections 1–5 the wave-0 record, kept as written; their live-store lists still apply._

## RC. Release candidate 1.0.0-rc.1 (2026-10-15)

`theme_version` is `1.0.0`. Pushing the tag `v1.0.0-rc.1` makes a GitHub pre-release with `Anvil-1.0.0-rc.1.zip` and the CHANGELOG section `[1.0.0-rc.1]` (`.github/workflows/release.yml`; DECISIONS 131–134). The owner reviews it before the final `v1.0.0`. Details of every live check: `docs/LIVE-QA-2026-10-15.md`.

### RC.1 Verified on the live store
Unpublished dev theme 189166714959 on ftsegk-n1, preview mode, 375 px and desktop. The checks ran on the 2026-10-15 pushes (wave 0 + 1 at commit 11ec30c, then the section library with the section CSS moved to asset files), not on the tagged commit itself.
- **Upload.** The whole theme uploads. The two errors Shopify's upload found (a range default off its step; two `content_for 'blocks'` in one file) are fixed and are now caught by `scripts/check-schema-ranges.py` and `scripts/chassis-lint.py` (DECISIONS 121, 122).
- **Templates.** Home, product, landing, collection, collections list, search, cart, contact, FAQ, track order, 404 and blog render with no Liquid or translation errors and exactly one `h1`; the 404 page returns status 404.
- **Scripts.** No theme console errors (only Shopify's own 401 on `/sf_private_access_tokens`); `window.Anvil` loads and every `<anvil-*>` element on the home page is defined.
- **Money path** (phone width). Add to cart posts, announces "Added to cart" and opens the drawer with the line; the stepper updates count, subtotal and header bubble and keeps focus; remove shows the empty state and moves focus to the drawer title; offer cards on the landing page update price, compare-at, Sale badge, the form's variant, the sticky bar and `?variant=` (keeping `view=landing`), and move the variant image first in the gallery.
- **Stylesheets.** Shopify's shared `compiled_assets/styles.css` is 11,813 B (from 41,471 B); each page loads only its sections' CSS files (4–21). Home on a phone: 36 Anvil requests, 47 KB compressed.
- **Lighthouse** (mobile, median of 3), performance / accessibility: home 97 / 97, product 96 / 97, landing 93 / 97, collection 98 / 97. The remaining misses come from Shopify (preview bar frame without a title, third-party cookies, the 401 above).

### RC.2 Still unverified before 1.0.0
Theme editor (the admin rendered blank with the browser pane hidden, so none of these ran):
1. **Static cart drawer blocks editable**: add, edit, reorder and hide the cart drawer's blocks in the editor, and "block wins" for the note and discount field (W1.4 item 8; DECISIONS 4, 28).
2. **Nested theme blocks vs `max_blocks`**: whether blocks inside columns, tabs, pricing plans and hero slides count toward a section's cap. Custom columns ships without a cap until this is known (DECISIONS 117; S.5, S.6 item 2).
3. **Promo popup**: the unlisted static signup block shows and can be hidden; the popup never opens on editor load; delay, scroll depth and exit intent open it on the storefront once per period (S.6 item 2).
4. **`visible_if`**: settings that show or hide other settings, including `and` / `or` conditions and conditions on header settings (`show_arrows` / `show_dots`, `box_scheme`, `transparent_templates`, the Cart summary policies settings; F.4 item 1, S.6 item 2).
5. **Cart summary's Free gift at threshold block**: with an empty preview cart, and with Cart type Drawer, selecting the block highlights its editor note (`anvil.editor.gift_page_only`); with Cart type Page and items in the cart, the progress line or `gift_not_ready` shows (DECISIONS 141).

Also still open: the rest of S.6, W1.4 and F.4 and the wave-0 list in §4 (among them the no-JavaScript variant post, gifts and tiers with real Shopify discounts, the free-shipping bar in a second currency, ship dates around midnight, Firefox and Safari). Changes recorded from DECISIONS 124 on were made after the live pushes and have not been seen on the store: typed star ratings default to not set, descriptive link labels (button labels now blank or "Example:", DECISIONS 142), offer cards on `product.landing` showing the product's own option values (DECISIONS 136), `.shopifyignore`, the spend gift on the cart page, the ticker's pause button in its own lane, this release preparation and the two-job release workflow (DECISIONS 137; it runs for the first time on the `v1.0.0-rc.1` tag). Translated-string escaping and the `window.Anvil.strings` decode (DECISIONS 135, 138, 139): on the dev theme, check a tag-filtered collection `<title>` (`Tagged "…"`, no `&amp;quot;`), an `aria-label` from a translation (cart line "Remove …", slider "Slide N of M"), a JS-written string ("Added to cart", "Slide N of M", "Pause"), and a button or countdown label typed with `&` or `<` (it shows as typed and is not parsed as markup). The ticker's disclosure line seen in LIVE-QA comes from the example review saved in `index` and `product.landing` (DECISIONS 130); keeping that example is an owner call.

### RC.3 Before tagging v1.0.0
1. Review the pre-release on GitHub (notes and zip).
2. Push the tagged build to the dev theme, or upload its zip as a draft, and run RC.2 and a short repeat of RC.1.
3. Fix or accept what that finds, add a `## [1.0.0] - <date>` CHANGELOG section, and tag `v1.0.0` (`theme_version` stays `1.0.0`).

F.5's "Create the dev theme?" is answered: 189166714959 exists and carried every check above.

### RC.4 Review fixes on the release candidate (DECISIONS 136–143)
Nine review findings (one major, eight minor), all applied; nothing was pushed to the store and git was not run.
- **Offer cards on `product.landing`** no longer ship typed labels: each card shows the product's own option value, so a product whose options are not pack counts never shows cards claiming 1, 2 or 3 packs (136, superseding 126).
- **Release workflow** split into a read-only `build` job (checkout without saved credentials, Shopify CLI from npm, checks, package, artifact) and a `release` job that alone holds `contents: write`, installs nothing and runs `gh release create` (137). The tag, version and CHANGELOG steps were re-run locally from the parsed workflow: `v1.0.0-rc.1` passes; `v1.0.0`, `v1.0.1`, `v1.0` and `1.0.0` stop with their errors.
- **Escaping.** A translation is never passed as a variable into another key (compare table caption, palette preview checks caption, shoppable image spot labels; 138). Typed plain text reaches `anvil-button` escaped (contact form, 404, welcome, image banner, cart drawer checkout and discount buttons, Add to cart and Button theme blocks) and the countdown, image and rating-stars blocks escape their text settings (139).
- **CHANGELOG** rc.1: 59 sections (54 addable, Apps, 4 theme-rendered), and a line on text shown as typed (140).
- **Cart summary gift block** is selectable in the editor with an empty cart or Cart type Drawer, with its own note `anvil.editor.gift_page_only` (141; RC.2 item 5).
- **Button labels.** Multicolumn, Feature grid and Icons with content have no default label (the heading becomes the link); Multirow's default is "Example: Read the full story" (142, superseding that part of 125).
- **CONVENTIONS** §1 carries the escaping rules and §6 the marquee's `av-marquee--lane` modifier (143).

Gates after the pass: `shopify theme check --fail-level warning` 247 files, 0 offenses (CLI 4.9.3); `npm run lint` clean (cleanroom 30 patterns, asset audit, chassis 96 files 0 warnings, limits, ranges, section CSS, templates 25 files, SECTIONS.md); `sync-block-schemas.py --check --strict` up to date; `node --test` 24/24.

## F. Consistency and completeness fix pass (2026-10-15)

54 audit findings (37 consistency, 17 completeness) applied by the final fixer; decisions are DECISIONS 82–119. Liquid and platform claims were checked on shopify.dev first: `section.location` / `section.index` (nil in the editor and under the Section Rendering API, index restarting per section group), `time_tag` writing `datetime` in UTC, and `.shopifyignore` syntax (simple names, wildcards, regular expressions, at the theme root). Nothing was pushed to the store.

### F.1 Gates (whole theme, after the pass)
- `shopify theme check --fail-level warning` (CLI 4.9.3): **246 files inspected, 0 offenses**.
- `scripts/cleanroom-lint.sh` clean (30 patterns); `scripts/asset-audit.py` clean; `scripts/chassis-lint.py` clean, 96 files, 0 warnings (now also: 6 KB measured on minified CSS, motion-prefix selectors accepted, an addable section without `enabled_on`/`disabled_on` is an error); `scripts/check-limits.sh` all limits respected; `scripts/check-schema-ranges.py` clean; `scripts/check-templates.py` clean, 25 files (largest 91 blocks); `python3 scripts/sync-block-schemas.py --check --strict` up to date (38 / 36 block types; icon labels from `docs/icons.json`); `python3 scripts/spec-cards.py --check` 35 cards up to date; `python3 scripts/sections-index.py --check` up to date (new); `node --test 'tests/*.test.mjs'` 24/24 (Node 22).
- Sizes (gzip -9): `anvil-slider.js` 4,974 / 5,120; `anvil-marquee.js` 1,528 / 1,536; core modules 13,996 / 15,360; `anvil-cart.js` 3,933; `anvil-cart-drawer.js` 4,065 / 6,144; `anvil-product.js` 7,541 / 8,192; `anvil-product-videos.js` 1,468; `anvil-slider.css` 2,431; `anvil-accordion.css` 1,014 (new); `anvil-base.css` 9,420 gz, **39,654 raw against Theme Check's 40,000-byte `AssetSizeCSS` limit** (the accordion moved to its own file for room; the next shared rule should go to a component file).
- Locales: `en.default.json` 535 values (+3: `anvil.faq.heading`, `anvil.collapsible.heading`, `anvil.cart.terms_default`); `en.default.schema.json` gained the `cart_type` info and canonical card image-shape labels.

### F.2 Findings applied
| # | Finding | Outcome |
|---|---|---|
| 1 | Columns spelled four ways | `cols_desktop` / `cols_mobile` everywhere (20 sections + collection, blog, collections list), selects, one tablet rule in `.av-grid`; templates and presets migrated (82) |
| 2 | Image shape ids and labels | `image_ratio` "Image shape", one label set, `theme` on card grids; theme block, product blocks, drawer image, theme card settings too (102) |
| 3 | Card style vocabularies | canonical `card_style`; `card_layout`; `item_style` lines / cards (83) |
| 4 | Surface CSS copied 12 times | `.av-surface` + `--av-surface-tint` + `--av-surface-shadow` + `snippets/anvil-surface` (83) |
| 5 | Rotation configured six ways | `autoplay` 0–10 s "Auto-advance every"; `video_autoplay` (+ scope) through anvil-core (94, 103) |
| 6 | `link` button style drew an arrow | `link` / `link_arrow` split; `show_view_all` (104) |
| 7 | H1 guard copy-pasted | `heading_tag` + `snippets/anvil-main-heading-tag`; slideshow documented (86) |
| 8 | Two hero content models | fields renamed to theme-block ids, one block per button; local blocks kept (99, see F.3) |
| 9 | FAQ / collapsible accordion | `assets/anvil-accordion.css`, `toggle_icon`, `item_style` (91) |
| 10 | Fallback headings three ways | `anvil-section-head` `fallback:` (84) |
| 11 | Slider controls per section | `snippets/anvil-slider-attrs`, fits classes, `arrows="desktop"`, pause room, gutter (89) |
| 12 | Slider ids and defaults | `show_arrows` / `show_dots` default on with `visible_if`; peek settings removed; label through `escape_once` (89) |
| 13 | Related products copied featured collection | `snippets/anvil-product-row` (93) |
| 14 | Quick-buy form duplicated | `snippets/anvil-quick-buy` with `anvil-money` option prices (96) |
| 15 | `dot_style` meant two things | `dot_shape` / `dot_color` / `dot_size` / `dot_pulse`; close-on-image-tap in `<anvil-hotspots>`; `anvil-hotspots-section.js` deleted (97) |
| 16 | Ids with several meanings | `image_side_mobile`, `show_image_mobile`, `link_type` + `link`, `link_label` vs `link_name`, `col_split`, `card_layout` (104) |
| 17 | Above-the-fold logic ×33 | `snippets/anvil-above-fold` in 36 files (85) |
| 18 | Group availability | one policy, applied to every addable section (100) |
| 19 | Empty-section note three looks | `snippets/anvil-editor-empty` + `.av-editor-empty`; storefront renders nothing (87) |
| 20 | Animations-off three ways | one CSS pattern, Liquid motion classes removed (107) |
| 21 | Hover zoom ×5 | `.av-hover-zoom`, `hover_zoom` (98) |
| 22 | Marquee configs | speed 10–150 / 40; linked strips pause in the component; inline gap (90) |
| 23 | Two one-line rotators | both kept on the canonical autoplay and `--av-inline-control` (103, see F.3) |
| 24 | Swipe on phones built twice | pricing on `mobile_layout` + `<anvil-slider>` (89) |
| 25 | 9:16 workarounds | `ratio: '9:16'` + `.av-media--9-16`; section workarounds deleted (102) |
| 26 | Hand-written icon lists | `docs/icons.json` + label sync in `sync-block-schemas.py` (92) |
| 27 | Icon frame vocabularies | `icon_style` plain / circle / square / ring / solid, `.av-icon-frame--*` (92) |
| 28 | Eight alignment ids | `text_align`, `valign`; `left` not `start` (105) |
| 29 | Gap labels | "Space between …", 4 px step, `--av-grid-gap` default (105) |
| 30 | Content box four ways | `box` + `box_scheme` in image with text, newsletter, track order (105) |
| 31 | Review blocks disagree | `quote`, `name`, `rating` 0–5 / 0.5, `source_url`; ticker disclosure (106) |
| 32 | Typed-date parser ×2 | `snippets/anvil-typed-date` (88) |
| 33 | Block field names | `heading`, `text`, `button_label` + `button_link`, `icon_image` (104) |
| 34 | Stylesheet leaks | scroll-top on `--av-audio-space`; `.av-bundle` / `.av-pb-bundle`; component modifiers (109) |
| 35 | Placeholder styles | "Example: " prefix rule (108) |
| 36 | Rich text content width | `content_width` px "Content width on desktop"; heroes' `box_width` renamed (105) |
| 37 | Two stylesheet formats | compact everywhere; 6 KB measured minified (95) |
| 38 | Dev theme id does not exist | placeholder in `shopify.theme.toml`, HARNESS and S.6 updated; no push (118, see F.5) |
| 39–40 | Hero video | image-only recorded, SPEC §4.2 amended (112, owner may reverse) |
| 41 | FAQ page "still have questions" | decision G kept; SPEC §5 and DESIGN-sections §4 amended (113) |
| 42 | Inline header search | `search_mode` `inline`: a field in the bar from 990 px with predictive results (110) |
| 43 | Transparent header on home only | `transparent_mode` home / listed templates + `--av-header-overlap` (110) |
| 44 | Announcement truncation | wrap recorded, SPEC §2.1 amended (111) |
| 45 | Video block mute | `muted` "Start without sound" + `video_autoplay` (94) |
| 46 | Quantity min/step | Shopify quantity rules recorded, SPEC §3.2 amended (114) |
| 47 | Featured product parity | SPEC §3 heading amended (115) |
| 48 | Cart type Page loses drawer blocks | policies checkbox on Cart summary; `cart_type` info lists drawer-only blocks (116) |
| 49 | Drawer settings are theme-wide | drawer schema points to them; SPEC §2.4 amended (116) |
| 50 | `_blocks.liquid` never built | removed from the docs and the lint exemption; Group is the free-form section (101) |
| 51 | SECTIONS / INSTALL / .shopifyignore | `docs/SECTIONS.md` (generated, checked), `docs/INSTALL.md`, `.shopifyignore` (119) |
| 52 | Columns has no cap | "more than 4 wraps" recorded, SPEC §4.2 amended (117) |
| 53 | Contact form and welcome in any group | template-only, and chassis-lint enforces the rule (100) |
| 54 | Stale track-order card line | replaced with the integration note |

Section cards: every `docs/sections/<slug>.md` touched by a rename has its table ids updated and a "Fix pass" note (renames, shared pieces used, availability); `docs/CHASSIS-API.md` regenerated; CONVENTIONS §1–§12 amended (tokens, headings, group policy, a shared setting-vocabulary table, snippet table, slider/marquee/accordion/hotspots contracts, motion pattern, utilities, fold snippet, placeholders).

### F.3 Applied in part, or kept, with the reason
- **Image banner and image with text keep local blocks** (finding 8): their banner-level H1 guard needs the section to own the heading level; `@theme` blocks would let a second H1 in. Fields and sizes now match the theme blocks, so moving later is a type change.
- **Timeline, stats and icon bar keep their own column classes** (finding 1): connectors and dividers need per-count selectors; they follow the canonical ids, labels and tablet rule.
- **Product-block and drawer "Columns in narrow / wider spaces"** keep their ids: they follow the container in a buy column or drawer, not the viewport breakpoints `cols_*` mean.
- **Two rotators stay** (finding 23): the announcement bar needs arrows and swipe (`<anvil-slider>`), the vertical ticker fades in place without arrows; both use the canonical autoplay and one control size.
- **Stories row and lightbox track are not sliders** (finding 24): a thumbnail strip and a full-screen viewer are not card carousels.
- **Shoppable image's narrow-screen popover placement** stays its own until a live check (finding 15).
- **Contextual `.av-section-head` overrides** in the divider, heroes and newsletter, and collage's `.av-card` fill, stay (finding 34): they place shared markup inside the section's own layout, not restyle a component.
- **Typed-rating theme blocks** (`anvil-stars`, review platform badge) keep their own rating fields (finding 31 covers review and quote blocks); their default of 5 stays an owner question (S.5).
- **Ticker `item_style`** (plain / outlined pill / tinted pill) keeps its values: it styles pills in a strip, not rows; same id meaning "how each item is drawn".
- **No `alt` override on every image block** (finding 33's `image` + `alt` pair): blocks without one use the image's own alt text from Shopify admin, and a linked image names its link with `link_name`.
- **No dev-theme push** (finding 38): creating a theme on the owner's store is the owner's call (F.5).

### F.4 Live-store checks added by this pass (on top of S.6, W1.4 and §4)
1. Editor: every renamed setting shows its saved value in `index`, `product.landing`, `product`, `page.*`, `404` and the groups (templates were migrated by script; presets updated); `visible_if` on `show_arrows`/`show_dots`, `box_scheme`, `transparent_templates`, the Cart summary policies settings.
2. Transparent header on a listed template (product, landing) with each hero and the image banner as first section: content clears the bar at 375, 768 and 1280 px; the `inline` search field with predictive results at ≥ 990 px and the search link below.
3. Sliders: dots and arrows hidden where every slide fits (fits classes at each width), the pause button beside the dots, `av-slider--overlay` on the hero, the announcement bar's inline controls, pricing's swipe row on phones.
4. Cart page with cart type Page and "Show policies checkbox" on: checkout blocked until ticked without JavaScript, Update still posts, the tick survives a quantity change, the attribute reaches the order.
5. Product videos: muted autoplay on phones only (scope `mobile`), one sound at a time, Save-Data respected; Video product block "Start without sound".
6. Hotspots and shoppable image: the new dot settings, close on an image tap, quick-buy variant menu with prices and sold-out options.
7. `anvil-base.css` under 40,000 bytes after any later edit (Theme Check fails above it).

### F.5 Open questions for the owner (new in this pass)
- **Create the dev theme?** `shopify theme push --unpublished --theme "ANVIL dev - DO NOT PUBLISH" --store ftsegk-n1.myshopify.com`, then put its id in `shopify.theme.toml` and `DEV_THEME_ID`. Never `--live`; the live theme is #189067624527. Every live-store list in this file waits on it. Also confirm a page with handle `contact` exists for `SCRATCH_PAGE`.
- **Hero video**: keep heroes image-only (DECISIONS 112) or add a background video with visible pause controls and a poster.
- **Columns cap**: restore `max_blocks: 4` on Custom columns once the editor shows whether nested theme blocks count.
- ~~**Spend gifts with cart type Page**~~: closed (DECISIONS 128). The Cart summary section offers its own Free gift at threshold block, applied only with cart type Page; the drawer's block keeps cart type Drawer.

### F.6 Earlier open items closed by this pass
S.4: the product-row snippet, slider `per-view-tablet` (now per-width inputs), hotspots pointer close, `.av-bundle` naming; S.5: hero H1 rule, transparent header offset, fallback headings, marquee speed wording; W1.5: Video block mute, cart page policies checkbox.

## S. Section library (integration pass, 2026-10-15)

### S.1 What exists
| Area | Files | Notes |
|---|---|---|
| Addable sections (46 built in waves 2–5) | `sections/anvil-{audio, before-after, bundle, collage, collapsible, collection-list, columns, compare-table, custom-liquid, divider, feature-grid, featured-collection, group, guarantees, hero-parallax, hero-slideshow, hotspots, icon-content, image-banner, image-gallery, image-marquee, image-text, logo-list, media-slider, multicolumn, multirow, newsletter, palette-preview, popup, pricing, product-videos, related-products, review-wall, rich-text, scroll-top, shoppable-image, social-cards, stats, stories, tabs, testimonials, ticker, ticker-vertical, timeline, track-order, video}.liquid` | 58 `anvil-*` sections in all (with the wave-0/1 chrome, FAQ, icon bar, contact, welcome, cart drawer/bubble, predictive search, featured product, upsell row) + 19 `main-*` + `apps` |
| Private theme blocks | `blocks/_anvil-columns-column`, `_anvil-hero-slideshow-slide`, `_anvil-popup-newsletter`, `_anvil-pricing-plan`, `_anvil-pricing-feature`, `_anvil-tabs-tab` | naming rule `_anvil-<slug>-<name>` (DECISIONS 70) |
| Section modules | `assets/anvil-{audio, bundle, collage, hero-parallax, hero-slideshow, hotspots-section, image-gallery, popup, product-videos, related-products, review-wall, scroll-top, shoppable-image, stats, stories, ticker-vertical, track-order}.js`, `anvil-palette-preview.{css,js}` | each ≤ 4,096 B gzipped (check-limits); bundle, image gallery, popup and stories sit at the 2 KB CONVENTIONS §7 line |
| Section cards | `docs/sections/<slug>.md` for every `anvil-*` section (58 cards, one per section), each with an "Integration pass" note where this pass changed something | |
| Templates | `index` (12 sections, 48 blocks), `product.landing` (19 sections, 91 blocks), `product` (main product + related products), `page.contact` (main → contact → icons with content → FAQ), `page.track-order` (main → track order → timeline → FAQ), `404` (main + featured collection); `sections/overlay-group.json` (Scroll to top on; Promo popup and Music player configured, `"disabled": true`) | DECISIONS 75; every FAQ `json_ld: false` |
| Locales | `locales/en.default.json` 532 values (+172 this pass) | DECISIONS 68 |
| Scripts | `scripts/check-templates.py` (new), `scripts/check-schema-ranges.py` (wired in), `scripts/chassis-lint.py` (theme-block references), `scripts/scratch-template.py` (static block ids) | DECISIONS 69, 76 |
| README | "What's inside": every section, header/footer/overlay, template sections, product blocks and cart features, one line each | |

### S.2 Gates (after integration, whole theme)
- `shopify theme check --fail-level warning`: **237 files inspected, 0 offenses** (193 `TranslationKeyExists` across 43 files before the locale keys).
- `scripts/cleanroom-lint.sh` clean (30 patterns); `scripts/asset-audit.py` clean; `scripts/chassis-lint.py` clean, 96 files, 0 warnings (4 errors and 3 warnings before: the private-theme-block false positives on columns, hero slideshow, pricing and tabs); `scripts/check-limits.sh` all limits respected; `scripts/check-schema-ranges.py` clean; `scripts/check-templates.py` clean, 25 files (largest `product.landing`, 91 blocks); `python3 scripts/sync-block-schemas.py --check --strict` up to date (38 / 36 block types); `python3 scripts/spec-cards.py --check` 35 cards up to date; `node --test 'tests/*.test.mjs'` 24/24 (PATH with Node 22).
- `scripts/gate.sh stats --no-paths --no-push`: every static gate PASS (G0 skipped, G3/G4 skipped: no push in this pass).
- Gzip after the shared changes: `anvil-marquee.js` 1,528 / 1,536; `anvil-slider.js` 4,974 / 5,120; core modules 13,786 / 15,360; `anvil-product.js` 7,541 / 8,192; `anvil-cart-drawer.js` 4,065 / 6,144; `anvil-compare.js` 1,611; `anvil-stats.js` 1,966; `anvil-base.css` 8,632 (36,979 raw).
- Browser smoke test (local static page with the real marquee, slider and compare assets, Chromium in the browser pane; no Liquid rendered): marquee clones in phase (`currentTime` equal), no editor attributes on clones, pause button keeps the name "Pause" and toggles `aria-pressed`; Tab to the 8th link of a 12-link moving strip stops the animation and the link is fully visible, Tab out resets the scroll to 0 and the strip runs again; a static slider row has no carousel roles and a scrolling one has region / carousel / "1 of 3" groups; ArrowRight from a button inside a slide moves focus to the track and slides; ArrowRight on a `<video>` does not slide; a slide change pauses an unmuted video that left the view; vertical compare: ArrowUp 50 → 45, ArrowDown back to 50.

### S.3 Shared-file changes applied from the section notes
1. Locale keys (all 349 request lines, deduplicated to 172 values) and seven reconciled keys (DECISIONS 68); Liquid and section cards updated to the shared names.
2. `assets/anvil-product.js`: `<anvil-product-form>` also finds a child form; `snippets/anvil-product-card.liquid` and `blocks/anvil-product-atc.liquid` write `form-id` and load the module; Featured collection's "not yet" comment removed (DECISIONS 73).
3. `scripts/chassis-lint.py`: theme-block references and parenthesis-aware selector lists (DECISIONS 69).
4. `assets/anvil-marquee.{js,css}`, `anvil-slider.js`, `anvil-compare.{js,css}`, `anvil-core.js` (autoplay pause, dialog opener), `anvil-cart-drawer.js` (hidden-opener focus), `anvil-tabs.css`, `anvil-hotspots.css`, `anvil-card.css` (`av-card--fill`), `anvil-base.css` (link button, `--av-rating-empty`), `snippets/anvil-media.liquid` (`decorative`, `play_label`, 9:16, lazy `preload="none"`, cover priority), `snippets/anvil-product-card.liquid` (`widths`), `snippets/anvil-price.liquid` (floor), `assets/anvil-stats.js` (leading-zero count, editor in-view skip; the Liquid `first != '0'` guard removed), `blocks/anvil-image.liquid` (column-aware sizes, eager in the first two sections), `blocks/anvil-icon-text.liquid` (pill width), `blocks/anvil-group.liquid` (preset `h3`), `layout/theme.liquid` (`slideRole`) (DECISIONS 74).
5. Section follow-ups those changes allowed: media slider and video drop their output rewrites (`play_label`, `decorative`); collage, feature grid, icon content, multirow, multicolumn, tabs and before/after drop their local patches; image marquee renders links in a moving strip (DECISIONS 81); guarantees links use `aria-labelledby`; icon content and columns follow the theme card settings exactly (DECISIONS 80); "viewer counts" in every custom Liquid info.
6. CONVENTIONS amended (§2 page offsets, §3 hidden heading key and private blocks, §5 media and card params, §6 slider, marquee and dialog, §8 visibility step, §11 eager location gate and logo widths); HARNESS documents the new scripts and the dev theme id; CHASSIS-API regenerated.

### S.4 Shared-file changes not applied (and why)
- **Hotspots component placement and pointer close** (hotspots, shoppable image): both sections already fix the narrow-screen popover and close-on-tap themselves, differently; merging them into `anvil-hotspots.css/.js` needs one agreed placement and a live check. Only the stacking rules moved.
- **"Inherit" alignment for 11 theme blocks; `h3` default for the Heading block** (rich text, columns, group): a cross-cutting schema change (every block, plus inline-margin rules) with migration risk for saved templates; the Heading block is also the main heading in rich text and hero slides. v1.1.
- **Shared newsletter form snippet** (newsletter, popup): a refactor of two working forms; the popup block still lacks the newsletter's success-message `aria-describedby` and solid message background. Next pass.
- **Shared overlay offset token** (audio, scroll-top, popup): needs a design for stacking order and heights; today scroll-to-top lifts itself over the docked player.
- **Slider `per-view-tablet`** (featured collection, product videos, testimonials, image gallery): sections override `--n` at 750–989 px; a component attribute would change every caller's dot count. Later.
- **`anvil-media` video `aria-label` and lazy poster deferral** (product videos): `video_tag` documents no alt parameter; product videos keep their own deferral.
- **Light dismiss for full-viewport dialogs in core** (stories): closing on any click on the dialog element would also close normal dialogs on a click in their padding; stories handles it.
- **Popup `open(null)`** (popup): core supports it now; `anvil-popup.js` (2,041 B) keeps its working stand-in until it has room.
- **Hero slideshow module** (hero slideshow): the slider now moves focus to the track on arrow keys; the module's focusout part still covers swipes, so it stays.
- **Collage big tile `widths`**, **comparison table `--av-rating-empty`**, **`decorative` in collage and collection list**: the switches exist; the sections still use their working fallbacks.
- **Card `hover_image` parameter**, **`.av-overlay--bottom` shared modifier**, **separator-aware number formats (social cards)**: not needed for v1.0 behaviour.
- **A shared product-row snippet** for Featured collection and Related products (same preamble, card loops and stylesheet apart from the slug): a refactor of two working sections; recorded as intended duplication until a later pass extracts `snippets/anvil-product-row.liquid`.
- **Footer newsletter `autofocus`** (newsletter): left as it is; only one form on a page posts, and the newsletter section has none.

### S.5 Open questions for the owner (from the 460 builder notes, grouped)
- **Hero media and H1.** Parallax hero and hero slideshow are image-only (SPEC says "media"): record image-only or add video with visible controls. One H1 rule for heroes: image banner allows H1 on page templates, parallax refuses it; the homepage's H1 is now the first slide's heading.
- **Transparent header over a first-section hero**: content at a top position can sit under the header; needs a header-height token from the header.
- **Example content on the live storefront**: placeholder logos, example collection cards, example bundle slots and product-video product rows render to shoppers until replaced (CONVENTIONS §12); shoppable image already shows its example spots only in the editor. Pick one rule.
- **Typed ratings**: stars default to 5 in `anvil-stars` and the comparison table (0 = "not set" would be stricter); the review wall shows card stars when the platform link is set; testimonials' "Verified purchase" toggle. Confirm the honesty level.
- **Stats**: figures already on screen when the module runs never count (a stats section at the top of a page stays static; now in the editor too); a decimal such as `4.125` reads as thousands for ~180 ms of the count (a stricter "no count-up when the last group after `.` has 3 digits" rule is possible); prefix and suffix are trimmed, so a typed space before a symbol suffix is lost (`4.8 / 5` shows `4.8/ 5`; only words of 3+ letters get the automatic space); a rating-like stat relies on the `source_url` info text, not a required source link; RTL figures without `dir=auto` or isolation.
- **Harness rule**: let a section's builder edit its own existing `assets/anvil-<slug>*` (DESIGN-sections §5 already lists them as allowed paths). The stats rebuild left two fixes to `anvil-stats.js` for the integrator because the wave made existing assets read-only; both landed here.
- **Fallback headings**: generic hidden "Highlights" / "Features" / "Guarantees" vs card titles as `h2` when the section heading is blank.
- **Nested theme blocks and `max_blocks`** (columns, tabs, pricing, hero slideshow): unknown whether nested blocks count; caps were removed where they could break presets.
- **Translation escaping**: several sections write `| t | escape`, which double-escapes `&` and apostrophes in translations; choose one rule theme-wide. **Answered:** one rule (DECISIONS 135, 138, 139), written into CONVENTIONS §1.
- **Marquee and ticker speed** is pixels per second, not seconds per loop (spec card).
- **Popup**: the result page after a signup opens the popup at once (answering the shopper's own submit); an `aria-modal` consent banner holds it back.
- **Bundle**: fewer buyable products than "Products to pick" lowers the count and hides the savings text (alternative: block the bundle); every pick is added at quantity 1; no selling plans; no form fallback without JavaScript.
- **Track order** reads "order number/email" as a link to the customer account (no theme endpoint checks both); no `@app` blocks yet; "new tab" defaults on.
- **Video**: no "controls" setting (a no-controls video needs a script); an uploaded video's cover is set in Content > Files.
- **Palette preview**: the shipped error, success and rating colours fail contrast on some schemes of both styles (theme-wide colours cannot pass on light and dark schemes); per-scheme status colours or retuned defaults.
- **Divider**: curve, peak and zigzag beyond the spec's four shapes; height applies to every style.
- **Smaller calls**: collapsible rows with no content are skipped on the storefront; collapsible image sticky by default; testimonials hide arrows on phones; social cards ship no counts and no verified mark; stories' "autoplay per story" is a duration; newsletter double opt-in admin path wording and no consent checkbox; logo hover colour on unlinked logos; related products show example cards in the editor only; custom Liquid that prints nothing also removes its anchor; music player "start muted" only sets the speaker control; overlay positions are physical (RTL); overlay widgets read `pad_bottom` as the distance from the screen edge and ignore `pad_top` (worth a CONVENTIONS line once the overlay offset token is designed).

### S.6 Live-store checks still needed (on the unpublished dev theme 189166714959, created 2026-10-15)
1. **G3/G4 for every section** (none ran in waves 2–5): scratch render at 375×812 and 1280×800, reduced motion, console errors, axe; then `index`, `product.landing`, `product`, `page.contact`, `page.track-order`, `404` and the overlay group as shipped. Lighthouse mobile on home, product and landing with the new templates (19 sections on landing).
2. **Editor**: the popup's unlisted static signup block shows and can be hidden; nested theme blocks vs `max_blocks`; `section.blocks` lists only top-level blocks in theme-block sections (tabs, rich text, columns, pricing); which element the editor outlines for a tab (button vs panel) and for a marquee item (original, not a clone, now that clones drop the editor attribute); `visible_if` with `and`/`or` and on header settings (divider, video, collection list); a module script in a newly added section runs (music player first add); `data-anvil-editor-open` on scroll-to-top; shoppable image's example dots in the preset preview (`design_mode` vs `visual_preview_mode`).
3. **Liquid behaviours** written from shopify.dev only: `capture` of `content_for 'blocks'` (columns); `content_for 'blocks', closest.product:` (pricing); `closest.product` on home vs product templates (comparison table, image with text); date-only `time_tag` and a UTC+13 store (review wall); unset `shop.refund_policy` (guarantees); `image_tag style: 'object-position: inherit;'` (image banner, parallax); customer-form action fragment `#anvil-newsletter-<id>` (newsletter, popup); `color_to_rgb` alpha format (palette preview); recommendations for an unsaved editor section (related products); custom Liquid blank/silent notes.
4. **Commerce paths changed in this pass**: card quick add on a collection page, featured collection and related products opens the drawer (not `/cart`); Add to cart theme block in rich text, columns and a hero slide; drawer focus returns to a shoppable-image dot after adding from its popover; product price badge percentages now round down.
5. **Cross-browser**: Firefox and Safari for stats row wrapping, the timeline's dotted connector, icon content `justify-content: right`, `:has()` fallbacks (music player padding, marquee keyboard stop, hotspot stacking), the hero slideshow fade in RTL, 343 px hotspot popovers, marquee lazy images popping in, the slider's dropped roles in VoiceOver.

## W1. Wave 1

### W1.1 What exists
| Area | Files | Notes |
|---|---|---|
| Product sections | `sections/main-product.liquid`, `sections/anvil-featured-product.liquid` | gallery + buy column; one product form per section (`anvil-pf-<section id>`) opened at the first Buy buttons block; zero-block fallback buy box; Featured product example layout without a product; schemas generated by `scripts/sync-block-schemas.py` (38 block types + `@app`; Featured product 36, no sticky bar or quantity gifts) |
| Dispatcher | `snippets/anvil-product-block.liquid` | one `case`, 35 literal renders; offer cards, tiers and the sticky bar are rendered by their owners |
| Product blocks | 38 `snippets/anvil-pb-*.liquid` + `snippets/anvil-offer-cards.liquid`, 38 fragments in `docs/product-blocks/` + `_section-main-product.json`, `_settings-gallery.json` | content 15, trust 9, commerce 8, picker-form 6 (WAVE1-CONTRACTS §1) |
| Gallery | `snippets/anvil-gallery.liquid`, `assets/anvil-gallery.js` (4.0 KB gz), `assets/anvil-gallery.css` | scroll-snap track that works without JS, variant filtering and ordering, hover magnifier, native `<dialog>` lightbox with pinch/pan/zoom |
| Product JS/CSS | `assets/anvil-product.js` (6.8 KB gz: `<anvil-variant-picker>`, `<anvil-product-form>`, `<anvil-quantity>`, `<anvil-sticky-bar>`), `assets/anvil-product.css`, `anvil-offer-cards.css`, `anvil-sticky-bar.css`, `anvil-pb-content.css`, `anvil-pb-trust.css`, `anvil-pb-commerce.css` | every CSS file ≤ 2.6 KB gz |
| Commerce | `assets/anvil-commerce.js` (bundle, discount code, upsells, mini card, custom-field validation), `assets/anvil-gifts.js` (gift engine), `assets/anvil-ship-dates.js`, `snippets/anvil-product-card-mini.liquid`, `snippets/anvil-ship-dates.liquid`, `sections/anvil-upsell-row.liquid`, `tests/gifts.test.mjs`, `tests/ship-dates.test.mjs` | pure `planGiftChanges` / `computeShipDates` with 24 tests |
| Shared trust snippets | `snippets/anvil-text-icon.liquid`, `anvil-icons-text.liquid`, `anvil-payment-badges.liquid` | used by product blocks and the drawer |
| Cart | `sections/anvil-cart-drawer.liquid` (16 blocks), `sections/main-cart-items.liquid`, `sections/main-cart-footer.liquid`, `snippets/anvil-cart-line.liquid`, `snippets/anvil-cart-totals.liquid`, `assets/anvil-cart-drawer.js` (3.5 KB gz), `assets/anvil-cart-drawer.css`, `assets/anvil-cart.js` | swap root `data-anvil-section="anvil-cart-drawer"` unchanged; empty `<form>` + `form=` inputs; cart page shares the line and totals markup |
| Integration | `assets/anvil-prose.css`, `assets/anvil-security.css` (split out of base, DECISIONS 42), `templates/product.json` (14 blocks), `templates/product.landing.json` (main-product 18 blocks), 52 locale values, `docs/sections/featured-product.md`, `upsell-row.md`, `cart-drawer.md` (updated), regenerated `docs/CHASSIS-API.md` | DECISIONS 41–52; CONVENTIONS §1 and §3 amended |

### W1.2 Gates (after integration)
- `shopify theme check --fail-level warning`: **185 files inspected, 0 offenses** (58 `TranslationKeyExists` before the locale keys were added; no other finding at integration time).
- `scripts/cleanroom-lint.sh` clean (30 patterns); `scripts/asset-audit.py` clean; `scripts/chassis-lint.py` clean (44 files, 0 warnings); `scripts/check-limits.sh` all limits respected, with the wave-1 budgets (DECISIONS 41).
- `python3 scripts/sync-block-schemas.py --check --strict`: both sections up to date (main-product 38 block types / 24 settings, Featured product 36 / 33).
- `node --test 'tests/*.test.mjs'`: 24/24 pass. (`node --test tests/` fails on Node 22 because a bare directory is read as a file name; CI and `npm test` use the glob, DECISIONS 47.)
- Template settings checked against the generated schemas with a one-off script (Theme Check does not do this): every template and section group valid.
- Gzip: `anvil-product.js` 6,815 / 8,192; `anvil-cart-drawer.js` 3,519 / 6,144; `anvil-gallery.js` 3,986, `anvil-commerce.js` 3,760, `anvil-cart.js` 3,356, `anvil-gifts.js` 2,864, `anvil-ship-dates.js` 2,186 (each ≤ 4,096); `anvil-base.css` 8,466 (36.6 KB raw, from 38.8); largest other CSS `anvil-gallery.css` 2,537; largest snippet `{% stylesheet %}` 2,290 raw (cart line). Largest Liquid files: `anvil-featured-product.liquid` 84 KB and `main-product.liquid` 83 KB (mostly the generated schema), well under 256 KB.
- Owner checks recorded in their reports (not re-run here): gallery, picker-form, content and commerce modules exercised on local static pages with mocked cart APIs; the drawer JS on the wave-0 harness page. No Liquid was rendered on a store.

### W1.3 Integration fixes (cross-owner contract check)
1. `savings_percent`: the picker wrote `"25%"` while the price block's locale string supplies the `%` ("Save 25%%"); the picker now writes the bare number, and price, offer cards and picker all round down (DECISIONS 43).
2. Size chart: the picker opened `anvil-size-chart-<block id>`, the size chart block renders `anvil-size-chart-<section id>`; aligned on the section id, and the picker link only appears when the chart has a page or image (DECISIONS 45).
3. Urgency text counted only `inventory_management == 'shopify'` while the inventory block and picker JSON counted any tracking service; aligned on "not blank" (DECISIONS 44).
4. The drawer loaded the gift engine only with a spend rule; it now also loads when the cart holds a gift line, so quantity gifts are cleaned up on every page (DECISIONS 48).
5. Upsells headings were `<h3>` in the buy column (a skipped level under the product `<h1>`); now `<h2>` like the other buy-column blocks (DECISIONS 49).
6. `data-price` in the bundle block (outside the `data-anvil-*` rule) renamed `data-anvil-price`, with its JS.
7. Verified unchanged: every dispatcher render matches the callees' `{% doc %}` params (Theme Check `UnrecognizedRenderSnippetArguments` clean); bind targets and server-truth keys (`price-`, `sku-`, `inventory-`, `urgency-<section>-<block>`) match `anvil-product.js`; `anvil:variant:changed {sectionId, variant, product}` matches the gallery, shipping blocks and bundle; gift rule JSON matches between Gifts on quantity, the drawer's gift block and `anvil-gifts.js`; the drawer calls `anvil-text-icon`, `anvil-icons-text` (`settings: block.settings`, slot ids `item_N_*`), `anvil-payment-badges` and `anvil-product-card-mini` with documented params; the product form posts the hidden `id` plus every `form=` control (quantity, tier radios, custom fields, sticky button); every `cartAdd` (product form, bundle, mini card, gift engine) passes `['anvil-cart-drawer', 'anvil-cart-bubble']`; Buy buttons' `show_dynamic_checkout` is the id the sections read for `{{ form | payment_button }}`.

### W1.4 Live-store checks still needed (dev theme push)
1. **No-JS variant choice:** `/cart/add` must read the last of two `id` values (the hidden input, then the Buy buttons `<noscript>` select). Post the form with JavaScript off and check the cart line's variant.
2. ~~`product.variants | json` fields used by the picker~~ (the fix pass builds its own variant list, see 16); Section Rendering `?section_id=<section>&variant=<id>` on a product URL (and with `?view=`) returns the server-truth nodes with the same keys.
3. Offer cards: preselect N with and without `?variant=`, card N = option value N, a two-option product (cards + pills), a sold-out preselect falling back to the first available variant; the form's id input matches the checked card after load.
4. App blocks rendered with `{% render block %}` from the section loop keep their product context.
5. Gifts: quantity gift added once at N and removed below N; spend gift at the threshold; dismissal sticks for the session; "Free" only when a Buy X Get Y discount prices the line at 0; a 422 on a sold-out gift is swallowed.
6. Tier cards: the editor-only mismatch note when the automatic discount does not match the promised percent.
7. Free-shipping bar against a real shipping-rate condition and a second market currency; checkpoints hidden in foreign currencies.
8. Static-section blocks editable in the live editor for the drawer (DECISIONS 4, 28); "block wins" for the note and discount field.
9. Emoji benefits: `url_encode` upper-case hex and code-point slicing; payment icon SVG title ids (now prefixed per row, see 18).
10. Ship dates: the `date_formats.anvil_ship_*` keys resolve, the store-offset recompute matches Liquid around midnight and the cut-off hour.
11. Discount code block: `discount_application.title` equals the code for the applied state; `/discount/CODE?redirect=` keeps the market prefix.
12. Lighthouse mobile on `product` and `product.landing` (≥ 80 performance, ≥ 95 accessibility), sticky bar not covering content at 320–390 px, z-index of the sticky bar (60) against the header and overlay widgets.

### W1.5 Open questions for the owner
- ~~**No-JS fallback vs module failure (CONVENTIONS §6).**~~ Closed by the fix pass: the picker's controls ship disabled and the module enables them (DECISIONS 55). The Buy buttons fallback select lives in `<noscript>`. If JavaScript runs but `anvil-product.js` fails to load, the picker shows but does nothing and the button adds the opening variant. The rule-following alternative (an `.av-fallback-only` select disabled once the module loads) shifts the layout on every product page. Keep `<noscript>`?
- ~~**Spend gifts with cart type "page".**~~ Closed (DECISIONS 128): `main-cart-footer` has a `gift_threshold` block that writes the same spend rule and progress line while cart type is Page.
- **Drawer complexity.** `anvil-cart-drawer.liquid` is just under Theme Check's `LiquidComplexity` limit; the next drawer block needs a helper snippet (e.g. `snippets/anvil-cart-drawer-block.liquid`). Approve that file for the drawer owner in wave 2?
- **Behaviour changes from wave 0 to confirm:** once any drawer block exists, the note/discount theme settings no longer apply; the savings figure is split into "You save" (discounts) and a compare-at line; the cart page lists lines in a `<ul>` instead of a table.
- **Duplicate stylesheet links.** Content, trust and commerce blocks each print their area stylesheet (`stylesheet_tag`, fetched once). Load them once per product section instead? Tidier markup, no network difference.
- ~~**Inline modules.**~~ Closed: moved to `assets/anvil-pb-content.js` (DECISIONS 58). Share, complementary and scroll buttons used guarded inline modules (scroll buttons repeats about 1.3 KB per instance). Move them into a shared asset later?
- **Gift key after a minimum change.** If the merchant changes `gift_min_qty`, an old `qty:<id>:<old min>` gift line stays until its own condition fails and the new key can add a second gift. Treat old quantity keys for the same product as replaced?
- **Video in the buy column.** Click-to-play videos have no separate mute setting (autoplay is always muted); YouTube/Vimeo iframes keep playing after a swipe in the gallery. Acceptable for v1?
- **Ranges.** Offer card position and tier quantity up to 20, preselect up to 6, tier discount up to 80 %. Enough?
- **Copy fallback.** The discount code copy fallback selects the code with no spoken hint; add a string such as "Code selected, copy it with your keyboard"?
- ~~**Product JSON exposes stock counts.**~~ Closed: published only at or under a stock block's threshold (DECISIONS 54). The picker's JSON carried `inventory_quantity` for tracked variants (needed for the low-stock state). Fine for the store, or limit it to variants at or under the urgency threshold?
- **Drawer countdown** duplicates `blocks/anvil-countdown.liquid`'s date rule under drawer classes; move it into a shared snippet later so the two cannot drift?

### W1.6 Fix pass after the wave-1 review (2026-10-15)
Every blocker and major of the review was applied, and every minor but the three listed under "Skipped". Liquid objects and filters touched were checked on shopify.dev first (`product.selected_variant`, `payment_type_svg_tag`, `image_url`, `video_source`, `video_tag`, `stylesheet_tag`, `preload_tag`, the Cart AJAX `updates` and `discount` parameters, stylesheet subsetting). Decisions: DECISIONS 53–63; contract amendments: WAVE1-CONTRACTS §11.

**Gates after the fix pass:** Theme Check 185 files, 0 offenses; cleanroom-lint, asset-audit, chassis-lint (44 files, 0 warnings) and check-limits clean; `sync-block-schemas.py --check --strict` up to date (38 / 36 block types); `node --test 'tests/*.test.mjs'` 24/24 (`node --test tests/` still fails on Node 22 because a bare directory is read as a module path, DECISIONS 47). Gzip: `anvil-product.js` 7,554 / 8,192; `anvil-cart-drawer.js` 3,881 / 6,144; `anvil-commerce.js` 4,083, `anvil-gallery.js` 4,060, `anvil-cart.js` 3,779, `anvil-gifts.js` 3,319, new `anvil-pb-content.js` 2,020 (each ≤ 4,096); core modules 13,383 / 15,360; largest CSS `anvil-cart-drawer.css` 2,894 (≤ 8,192). Largest Liquid: Featured product 84 KB.

**Smoke test** (local static page in the session scratchpad with the real assets and a mocked Cart API, Chromium in the browser pane; no Liquid rendered): picker controls enabled on connect; with the form holding a variant that has no card, Add to cart stays enabled and posts that variant; card changes off the product page update price, compare-at, sale / regular labels, text badge, sale class, unit price, SKU line, inventory text and urgency count (hidden when the variant has none) with no URL change and no server fetch; minus at the minimum keeps focus and sets `aria-disabled`; a second line's debounced change waiting while the first line's response re-rendered the drawer was still sent, and the new input showed it; a terms tick during a line change no longer suppressed the re-render; the response's section stylesheet was appended to `<head>` once; drawer recommendations filled a `<ul>` with two `<li>` cards; upsell Add announced "Added to cart" in the drawer's live region and kept focus on an Add button; product-form add opened the drawer without touching the button's `aria-expanded`, and with open-on-add off showed "Added to cart" for 2 s; the cart link's `aria-expanded` returned to false on Escape; the gift engine skipped its first read on an empty cart and `Anvil.gifts.settled()` resolved after the gift add; offer cards at 320 px keep "2 Pack", "Buy 2, get 1" and "3 Pack + gift" on one line with an image and amount savings (the example label "Example: 2 pack" still wraps beside an image).

**Fixed — blockers**
1. Stock text could show another variant's count (Featured product never refreshed it; product page until the fetch): Inventory and Urgency text now render on the client from tracked inventory (`stock` bind), the server swap stays a confirmation on the product page (DECISIONS 53).
2. Cart line, totals and mini-card CSS were snippet `{% stylesheet %}` only, so a drawer opened empty (and recommendation cards) lost their styles after Shopify's per-page stylesheet subsetting: moved to `assets/anvil-cart-drawer.css` / `assets/anvil-pb-commerce.css`, loaded by the drawer, the cart page and the complementary block; `swapSection` keeps response section styles (DECISIONS 57).
3. Inline modules in share, scroll-to and complementary: `assets/anvil-pb-content.js` (DECISIONS 58).
4. Honesty `info` missing on misusable free-text settings: offer card caption and label, tier label, drawer checkout line, text with icon, icons with text headings, drawer custom Liquid.

**Fixed — majors**
Drawer recommendations double-picked cards (child selector, `<ul role="list">`); uncarded option values unselectable (generated cards plus a selection fallback to the form's variant); no gift engine on the cart page with cart type "Page" (loaded when a gift line exists; product form waits for `Anvil.gifts.settled()`); offer-card labels wrapped at 320 px (second-row layout); debounced quantity changes lost on re-render (module-level pending changes); note / terms saves hid line changes (`track: false`); double-click on "Add bundle" (busy guard); `aria-expanded` written on Add to cart (only explicit `aria-haspopup` openers); stepper lost focus at its limits (`aria-disabled`); sticky bar covered the focused control (`scroll-padding-bottom`); drawer upsell adds unannounced (drawer live region, focus key, focus fallback to another Add button); module failure could add another variant than shown (disabled-until-enhanced controls); gift engine re-rendered only drawer + bubble on the cart page (page's `[data-anvil-cart-render]` sections; cart inputs keyed `updates[<line key>]`); sold-out threshold gift still promised and requested (availability check).

**Fixed — minors**
First-paint money without the currency symbol (server text kept on load; `anvil-dom.js` imported before money is written); unlisted discount code reported as applied (missing = not valid, with the applications fallback); "not valid" on an empty cart (new `anvil.cart.code_saved`); no-JS button read "Sold out" while other variants were buyable; `novalidate` disabled required fields without JS (dropped); product JSON published every stock count (threshold cap) and the whole variant JSON (trimmed list with explicit `quantity_rule`, `unit_price`); server-truth URL dropped `?view=`; complementary cards had no Add (commerce module loaded); manual upsells ignored the limit, recommendations sliced before hiding cart products; bare "SKU:" label; checkout described as locked after the box was ticked; add-to-cart success not confirmed; early stepper taps dropped (cart API imported on demand); no keyboard panning in the lightbox; hidden "Sale price" label stuck to the opening variant; duplicate payment-icon ARIA ids (`uid`, footer prefix); noscript select rendered a snippet per variant; gallery videos listed every rendition (HLS + one MP4 ≤ 1080 px); bundle foot, share and copy buttons shifted the column (space reserved while loading); product and gallery CSS discovered late (`stylesheet_tag: preload: true`); image and video block `sizes` assumed a 990 px breakpoint (750 px and the real column share); tier discount title unescaped in an `_html` key; offer-card saving escaped money markup (`strip_html`); gift engine read the cart on every page view (skipped on an empty cart); reference-theme default headings; stale or misleading doc headers (prose stylesheet, `data-anvil-source`, `form_id`); PascalCase gallery ids; mixed placeholder syntax in editor notes; "Sizing chart" block name in the picker's note; drawer icons-with-text item text printed raw (now inline rich text); `onPage()` built a route by hand (compares against the product JSON's URL).

**Skipped (with reasons)**
- Video poster `fetchpriority` / preload: `preload_tag` accepts only `asset_url`-type URLs (shopify.dev), a literal `<link rel="preload">` fails Theme Check's `AssetPreload`, and a `<video poster>` takes no `fetchpriority`. The poster stays in the HTML with `preload="metadata"` on the first video.
- Printing block stylesheets once per section instead of once per block (optional in the finding): the URLs are already fetched once; the change would only tidy markup and needs a shell-level registry of block types.
- Capping manual upsell cards that reappear after a product leaves the cart: the server render now honours the limit; re-capping on every cart event would push `anvil-commerce.js` over its 4 KB budget.

**Still needs a live store** (adds to W1.4)
13. A drawer opened with an empty cart, then the first add: line, totals and upsell cards styled (subsetting), and the response's `<style data-section-stylesheet>` lands in `<head>`.
14. The cart form posting `updates[<line key>]` to `/cart` without JavaScript (keys containing a colon), including a gift line.
15. `/cart.js` and `/cart/update.js` responses carry `discount_codes` with `applicable`; an empty-cart code reads "saved", a free-shipping code is not reported as "not valid".
16. The trimmed product JSON on a real product (option values with quotes, `unit_price_measurement`, `quantity_rule.max` null) parses, and B2B quantity rules survive a variant change.
17. Featured product: stock lines and unit price follow variant changes; no request with `section_id` is sent off the product page.
18. Payment icons in footer, product block and drawer on one page: no duplicate ids (axe).
19. Gallery videos: the HLS source plays where supported and the MP4 fallback is the ≤ 1080 px rendition.
20. Native validation: a required custom field and a quantity outside the rule block the no-JS post with the browser's message; with JS, the field's own error text shows too.
21. Cart type "Page": add on a product with Gifts on quantity at the minimum, the cart page opens with the gift line.

## 1. What exists (wave 0)

| Area | Files | Notes |
|---|---|---|
| Layouts | `layout/theme.liquid`, `layout/password.liquid` | `window.Anvil` bootstrap (routes, versioned core module URLs in `Anvil.modules`, money formats, strings, settings); `<link rel="modulepreload">` for the four core modules; body-font preload with `crossorigin` |
| Config | `config/settings_schema.json` (23 groups, 117 settings, 48 KB), `config/settings_data.json` | new "Variant dropdowns" group and slider dot spacing; "Anvil Dark" now redefines schemes 1–5 (dark surfaces, light inverse in scheme 5) |
| Locales | `locales/en.default.json` (690 values incl. `date_formats.anvil_date`), `locales/en.default.schema.json` (291) | every storefront string of the main, customer, gift card, chrome and contact sections is an `anvil.*` key (DECISIONS 23) |
| Snippets (20) | chassis snippets + `anvil-money`, `anvil-social-links`, `anvil-cart-bubble`, icon lookups `anvil-icon-a-c/-d-l/-m-r/-s-z` | `anvil-product-card` takes `loading`, `priority`, `heading_tag`; `anvil-media` autoplay keeps controls |
| Theme blocks (12) | unchanged set | every block has a `{% doc %}` header (settings, values, defaults, example) feeding `docs/CHASSIS-API.md`; group block class `.av-group-block` |
| Assets (26) | `anvil-base.css` (38.8 KB raw / 8.8 KB gz, now incl. media, price, stars, social pills), `anvil-header.css` (new), `anvil-card.css` (card only); core JS 5 modules; new `anvil-cart.js`, `anvil-cart-drawer.js`, `anvil-facets.js`, `anvil-predictive-search.js`, `anvil-code.js`; `anvil-media.css` removed | gzip budgets enforced by `scripts/check-limits.sh` |
| Sections (30 Liquid + 3 groups) | chrome `anvil-announcement-bar`, `anvil-header`, `anvil-footer` (reduced chassis); static `anvil-cart-drawer`, `anvil-cart-bubble`, `anvil-predictive-search` (new, SRA only); addable `anvil-welcome`, `anvil-contact-form`, `anvil-faq`, `anvil-icon-bar`, `apps`; every `main-*` | header: mega menu blocks, menu position, transparent homepage mode, tiles drawer, socials, predictive search; footer: featured product/collection blocks, payment filter; announcement: page targeting, apply-to-cart codes |
| Templates | 15 JSON + 7 `customers/*.json` + `gift_card.liquid` | `page.faq.json` = main page + two FAQ sections (decision G); example icon bar / FAQ added to `index`, `product.landing`, `page.contact`, `page.track-order` |
| Docs | `docs/spec/*.md` (35 cards), `docs/CHASSIS-API.md`, `docs/sections/*.md` (10 cards), `docs/agent-prompts/2026-10-14-fix-pass.md`, DECISIONS 20–40, CONVENTIONS amended | |

## 2. Gates (wave-0 fix pass)

- `shopify theme check --fail-level warning`: **95 files inspected, 0 offenses**. Thresholds: `AssetSizeJavaScript` and `AssetSizeCSS` 40,000 raw bytes (DECISIONS 20).
- `scripts/cleanroom-lint.sh`: clean (30 token patterns). `--strict` reports only the provenance prose it is meant to exempt (ARCHITECTURE, DESIGN-sections, NOTICE); README no longer names a competitor.
- `scripts/asset-audit.py`: clean. `scripts/chassis-lint.py`: clean, 42 files, 0 warnings (header, announcement bar and footer now checked against the reduced chassis). `scripts/check-limits.sh`: all limits respected, including the new gzip budgets.
- Forbidden-token grep over theme files, scripts, `docs/sections`, `docs/spec`, `docs/CHASSIS-API.md`: empty.
- Gzip sizes: core modules 13.0 KB together (≤ 15 KB); slider 4.5 KB (≤ 5); marquee 1.46 KB (≤ 1.5); cart 2.9 KB, facets 1.9 KB, predictive search 1.6 KB, code 1.5 KB, drawer 1.2 KB (≤ 4); base CSS 8.8 KB (≤ 20); header CSS 2.3 KB (≤ 8).
- JS smoke test (local static page with the real assets and a mocked Cart API, Chromium in the browser pane): every element defines; the drawer opens, a stepper updates the line, the re-render keeps the dialog open and the focused button, the bubble updates without nesting, a 422 rolls the quantity back and shows the message, an unusable code shows "not valid", removing the last line focuses the drawer title, closing releases the scroll lock and returns focus; facets re-render with focus kept and the URL pushed; header dropdowns close each other and on outside click; marquee pause/play; predictive results with ArrowDown into the list; countdown un-hides and ticks from `data-anvil-end`; no console errors.
- Not run (need a live store or npm packages): `scripts/gate.sh` G3/G4, `scripts/a11y.sh`, `scripts/similarity.py`, Lighthouse.

## 3. Fix pass (wave 0)

### Owner decisions applied (DECISIONS 20–27)
A raw thresholds 40,000 + gzip budgets in check-limits · B collapsible height exception in CONVENTIONS §8 · C reduced chassis for header/announcement/footer, CONVENTIONS §4 paragraph, chassis-lint enforcement · D storefront strings to `anvil.*` keys · E `smile` dropped · F icon-bar labels stay `<span>`, heading rule amended, shared `anvil.editor.empty_section` · G FAQ page with JSON-LD on the first FAQ only · H spec cards and CHASSIS-API generated (both scripts ran without changes).

### Blockers fixed
1. Collection and search filtering/sorting: `<anvil-facets>` re-renders results through the Section Rendering API; Apply stays visible until the element is defined; no navigation on select change.
2. Country/language forms: Update buttons always visible; no auto-submit.
3. Cart drawer and cart page: `<anvil-cart-form>` handles steppers, typed quantities, remove links, note and discount field; Update stays until defined; steppers appear only when defined.

### Majors fixed
SVG fill rule; header logo box; font preload `crossorigin`; cart count in the link name; hidden header never holds focus; product media row keyboard-reachable and slider tracks focusable when they scroll; announcement text wraps; focus rings visible in forced colours; `--av-input-border` (3:1) on inputs and quantity boxes; linked images always named (footer, image block); media/price/stars CSS in base so blocks render correctly anywhere; drawer swap root moved inside the dialog, scroll lock released on disconnect, `wrapper()` prefers `data-anvil-section`; reveal gated on `html.av-reveal-ready`; first card row eager + LCP priority; hover images not downloaded on touch; autoplay videos keep controls and respect reduced motion; marquee pause button; slider layout written inline with a reserved dots row; `heading` → `title` in main sections and `drawer_title` in the drawer; countdowns to one absolute instant with date validation; storefront strings localised; unused settings wired (card/blog card style and ratio, cart vendor/savings/discount, light logo, predictive search); price filter in cents; review badge only with a source link; real dark preset; FAQ templates; header, footer and announcement spec gaps (mega menu, menu position, transparent mode, drawer layout and socials, predictive search, featured product/collection, payment filter, page targeting, apply mode); variant dropdown settings and dot spacing; password errors visible; open-on-add via a document event; drawer JS moved to a module.

### Minors fixed
Drawer closes past 990 px; no-JS menu drops down under the bar; per-line control names and price context; responsive tables keep semantics (hidden thead + explicit roles + aria-hidden cell labels); heading levels (footer `h2`, hidden `h2` over card grids, welcome `h1`); slider pause state under reduced motion, named dots group, 0.55 dot opacity; marquee static row from CSS under reduced motion and pause rules that actually win; announcement slide roles left to the slider, copy label fallback; `aria-haspopup` on search and cart; duplicate link names (empty alt inside named links); rating counts read as "12 reviews"; modulepreload; icon lookup split (no 27 KB re-parse, under LiquidComplexity); card widths `300, 450, 600`, banner `sizes`; reveal from the third section; form errors tied to fields (contact, newsletter, comments, customer forms); prose tables in labelled scroll regions; bubble slot; overlay tokens; `av-is-*` state classes; `av-s-<type>` class; `data-anvil-*` hooks and `.av-marquee__clone`; slug classes; sentence-case names documented; footer heading "Shop"; vendor prefixes removed; contact keys; CSS threshold; block doc headers; README; password and gift card routes; currency-code money everywhere (`anvil-money`); CartBubble fallback; empty-cart link navigates; drawer backdrop closes; honesty notes (announcement text, footer image, newsletter text, contact success); security setting text; sold-out variants selectable; FAQ open-first flag.

### Skipped or deferred (with reason)
- **Cart drawer blocks (SPEC §2.4, 16 blocks)** — wave-1 scope per DESIGN-money-path §G and still blocked on the static-section-blocks verification (DECISIONS 4, 36). The drawer settings that already existed now work.
- **JS-off discount field** — hidden without JavaScript on purpose (DECISIONS 37): a blank `discount` field posted with every cart update could clear codes, and checkout has its own field.
- **Archiving every section prompt now** (`agent-prompt.py <slug> --archive` × 35) — not done ahead of time: a prompt archived before a section is dispatched is not the prompt actually used; the dispatcher archives each one when it runs (DECISIONS 38). The wave-0 cluster briefs cannot be recovered verbatim; this pass archived its own brief.
- **Section cards for `main-*`** — exempt (minimal page shells, DECISIONS 38); cards were added for every wave-0 `anvil-*` section.
- **Templates waiting on sections that do not exist yet** (hero, ticker, featured collection, related products, track order, 404 featured collection) — added as their waves land.
- **`js` / `no-js` classes** kept (documented in CONVENTIONS §1 as the only non-`av` classes) rather than renamed.

## 4. Verifications that still need a live store

Carried from wave 0 (see the previous status in git history for detail): static-section blocks editable in the editor; `{% stylesheet %}` subsetting per page; `content_for 'blocks'` with `closest.product`; `visible_if` on settings (now also `pages_custom` in the announcement bar); system fonts in `font_picker`; inline token size with real font URLs; legacy customer-account templates; invalid discount code behaviour on `cart/update.js`; `variant | json` media; recommendations `section_id`; `drawer_preview_open`; OG image pairs and JSON-LD validity; gift card QR script and wallet badge; country rule with JS off.

New from this pass (written from memory of shopify.dev; the sandbox had no network):
1. `preload_tag: … crossorigin: 'anonymous'` writes the attribute (and the Link header) — confirm in the rendered source; otherwise switch back to a literal `<link … crossorigin>` and accept Theme Check's `AssetPreload` suggestion.
2. The AJAX cart JSON includes `discount_codes: [{code, applicable}]` (used to report an unusable code).
3. `/discount/CODE?redirect=…` keeps the market/locale prefix; predictive search accepts `resources[limit_scope]=each`.
4. `time_tag: format: 'anvil_date'` and `date: format: 'anvil_date'` resolve a theme-defined `date_formats` key.
5. `form.errors contains 'email'` (field-level checks) on contact, customer, comment and newsletter forms.
6. The transparent header's computed overlap matches the rendered height with a real logo; `:has()` hides the section background while transparent.
7. Section Rendering with `section_id` for JSON-template sections on collection/search URLs carrying filter parameters (facets).
8. Liquid `date: '%s'` reads a zone-less `YYYY-MM-DDTHH:MM` string in the store's time zone (countdown `data-anvil-end`).

## 5. Open questions carried forward (wave 0)

- **FAQ JSON-LD on example content.** Decision G puts `json_ld: true` on the first FAQ section of `page.faq.json`, whose questions are examples until the merchant edits them; search engines would read example questions as FAQ data on a store published unedited. Keep, or ship it off and let the merchant turn it on?
- **Secondary button colours.** `--av-btn2-fg` / `--av-btn2-border` still map to the scheme text; add two scheme definitions if merchants need a distinct secondary colour.
- **Countdown unit labels** are block settings; `anvil.countdown.*` keys exist if the block should switch to `t`.
- **Video facade script** is inline in `snippets/anvil-media.liquid` (guarded, ~20 lines per facade); move into a module if the duplication matters.
- **`cartAdd` makes two requests** (`add.js` then `cart.js`) to keep the event shape.
- **Address deletion** posts immediately (the old `data-anvil-confirm` attribute had no handler and was removed); add a confirmation step later if wanted.
- **Copy button** in the announcement bar is shown whenever JS runs (`av-js-only`), not keyed on `anvil-code.js` having loaded; low risk, but not the `:defined` pattern.
- ~~**Wave-1 hand-offs.**~~ Done in wave 1: every add passes `['anvil-cart-drawer', 'anvil-cart-bubble']`; drawer blocks render inside `.av-cart-drawer__frame` and reuse `<anvil-cart-form>`.
- **Dev store.** `shopify.theme.toml` still has `theme = "REPLACE_WITH_DEV_THEME_ID"`; `SCRATCH_PAGE` defaults to `contact`.
