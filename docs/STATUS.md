# Anvil — Status after wave 0 (chassis integration)

_2026-10-14. Written by the wave-0 integrator after the five chassis clusters landed. Numbers below are from the in-place gate (`shopify theme check --fail-level warning`, Shopify CLI 4.9.3) and the repo scripts._

## 1. What exists

| Area | Files | Notes |
|---|---|---|
| Layouts | `layout/theme.liquid`, `layout/password.liquid` | head order per ARCHITECTURE §2; `window.Anvil` bootstrap (routes, money formats, strings, settings); `html.no-js → js` swap; `data-animations`; body scheme + style-variant classes; header/footer/overlay groups; static cart drawer when `cart_type == drawer`; JSON-LD; security snippet |
| Config | `config/settings_schema.json` (22 groups, 112 settings, 45 KB), `config/settings_data.json` | 10-definition colour scheme group with 5 schemes; presets "Anvil" and "Anvil Dark" |
| Locales | `locales/en.default.json` (541 values), `locales/en.default.schema.json` (278) | every `t:` key in the schema resolves; 67 `anvil.*` keys are reserved for later waves (cart drawer blocks, product blocks, predictive search) |
| Snippets (13) | `anvil-meta`, `anvil-css-tokens`, `anvil-json-ld`, `anvil-security`, `anvil-section-attrs`, `anvil-section-head`, `anvil-button`, `anvil-icon` (143 Lucide icons), `anvil-media`, `anvil-stars`, `anvil-price`, `anvil-product-card`, `anvil-pagination` | all with `{% doc %}` headers; `scripts/agent-prompt.py --write-chassis-api docs/CHASSIS-API.md` extracts them |
| Theme blocks (12) | `anvil-heading`, `-text`, `-button`, `-image`, `-icon-text`, `-stars`, `-review-stars`, `-countdown`, `-spacer`, `-divider`, `-group`, `-product-atc` | `tag: null`, `shopify_attributes` on the root, presets, small `{% stylesheet %}` each. **No section offers `@theme` yet**, so these are not placeable until a container section (columns, rich text, group) lands |
| Assets (21) | `anvil-base.css` (32.2 KB / 7.3 KB gz); core JS `anvil-core.js` + `anvil-events/cart-api/sections/dom.js` (11.7 KB gz together); `anvil-editor.js`; components `anvil-slider`, `-marquee`, `-dialog` (CSS only), `-countdown`, `-tabs`, `-compare`, `-hotspots` (+ their CSS); `anvil-card.css`, `anvil-media.css` | every custom element removes its listeners in `disconnectedCallback`; no dependencies; no raster files |
| Sections (31) | group chrome `anvil-announcement-bar`, `anvil-header`, `anvil-footer`, `apps`; static `anvil-cart-drawer`, `anvil-cart-bubble`; addable `anvil-welcome`, `anvil-contact-form`; every `main-*` (product, collection + banner, list-collections, search, cart items + footer, page, blog, article, 404, password, 7 × customers) | `main-*` carry the reduced chassis (scheme, width, padding); the three group-only sections carry the full chassis block |
| Groups + templates | `header-group.json`, `footer-group.json`, `overlay-group.json` (empty, `custom.overlay`); 15 JSON templates + 7 `customers/*.json` + `gift_card.liquid` | `page.faq.json` and `page.track-order.json` render `main-page` only until `anvil-faq` / `anvil-track-order` exist; `index.json` uses the `anvil-welcome` placeholder; `product.landing.json` = `main-product` only |
| Harness | `scripts/` (13 scripts), `.github/workflows/{ci,release,lighthouse}.yml`, `package.json`, `shopify.theme.toml`, `docs/HARNESS.md` | `docs/spec/*.md` and `docs/CHASSIS-API.md` are generated artefacts and have not been generated yet (`npm run spec-cards`, `npm run prompt -- <slug>`) |

## 2. Gates

- `shopify theme check --fail-level warning` (in place, repo config): **85 files inspected, 0 offenses**. The config now anchors its ignore globs (`/dev/**`, `/docs/**`, `/scripts/**`); the unanchored `dev/**` had matched the `~/dev/anvil-theme` checkout and every earlier "clean" run inspected 0 files (DECISIONS 15).
- With `theme-check:all` the only extra findings are three `AssetSizeJavaScript` notices at the default 10,000-byte threshold (`anvil-core.js` 14,935 B, `anvil-slider.js` 13,887 B); the repo threshold is 15,000 and passes.
- `scripts/cleanroom-lint.sh` clean (30 token patterns); `scripts/asset-audit.py` clean; `scripts/chassis-lint.py` clean (39 files; 3 informational notices that the group-only header, announcement bar and footer are exempt from chassis enforcement); `scripts/check-limits.sh` clean.
- Budgets (gzip): core modules 11.7 KB (≤ 15 KB); slider 4.35 KB (≤ 5); marquee 1.3 KB (≤ 1.5); other components 0.9–1.9 KB; base CSS 7.3 KB (≤ 20); component CSS 0.6–1.4 KB each. Raw: every JS asset < 15,000 B (the CLI measures raw bytes, DECISIONS 16).
- Not run (need a live store or npm packages): `scripts/gate.sh` G3/G4 push + screenshots, `scripts/a11y.sh`, `scripts/similarity.py` (CI only), Lighthouse.

## 3. Integration fixes made in this pass

1. `.theme-check.yml`: ignore globs anchored so the gate inspects the theme.
2. `assets/anvil-base.css`: `--av-header-h` now aliases `--av-header-offset`, the token `anvil-core.js` writes from the sticky header's height, so `scroll-padding-top` / `scroll-margin-top` clear the header; `anvil-product-form { display: block }` so the quick-add and product forms are block boxes before wave 1 defines the element.
3. `sections/anvil-announcement-bar.liquid`: loads `anvil-slider.css` with the slider (the JS-created arrows and pause button were unstyled) and sizes those controls for a one-line bar.
4. `layout/theme.liquid`: added the `strings` the components look up (`carousel`, `goToSlide`, `cartCountOne`, `cartCount`) from existing locale keys; `assets/anvil-slider.js` reads the `goToSlide` alias.
5. Contract docs: CONVENTIONS §1 (locale keys during waves), §5 (`anvil-section-attrs` output incl. `data-anvil-section`, padding units), §7 (shipped `anvil-dom.js` export names, camelCase route and string keys); DECISIONS 12–19; FORBIDDEN "How the lint matches"; HARNESS §0; CHANGELOG.

Cross-cluster checks that passed without changes: every `render 'anvil-*'` call matches the snippet's `{% doc %}` signature; every custom element used in Liquid is registered (`anvil-core.js`: drawer, dialog, collapsible, header, cart-bubble; module per section for slider, countdown; inline guarded definitions for `anvil-cart-drawer` and `anvil-video-facade`) except `<anvil-product-form>`, which is wave 1 and degrades to a native form post; every `settings.*` read exists in the schema; every `{{ 'anvil.…' | t }}` key exists and its placeholders match the call sites; `.av-scheme--<id>` is emitted identically by `anvil-css-tokens`, `anvil-section-attrs`, `theme.liquid` and the blocks; every `--av-*` custom property consumed has a definition or an inline fallback.

## 4. Wave-0 verifications that still need a live store

From `docs/DECISIONS.md` / `docs/DESIGN-sections.md`:
1. **Static-section blocks editable in the editor** (DECISIONS 4). The drawer ships with `"blocks": []` and its three settings, so nothing depends on it yet; wave 1 adds the 16 drawer blocks and needs the answer. Fallback: `block_list`-style settings.
2. **`{% stylesheet %}` subsetted per page** (DECISIONS 3). 31 sections and 12 blocks use it. If the bundle is not subsetted, section CSS moves to `assets/anvil-<slug>.css`.
3. **JSONC comments inside `{% schema %}`** (DESIGN §1). Not used: the chassis block is verified by id/type in `scripts/chassis-lint.py`, and a `//` comment is reported as a warning. Only matters if the `// anvil:chassis` markers are wanted after all.
4. **`content_for 'blocks'` with `closest.product` vs `context.product`** (DESIGN §2). `anvil-stars` and `anvil-product-atc` use `closest.product` as a Liquid fallback; no schema-level dynamic default was declared because shopify.dev does not document it for product settings.

From the cluster reports:
5. `visible_if` on theme settings (`use_custom_fonts`, country rule) — ValidVisibleIf passes locally.
6. A system font picked in `font_picker`: `font.family`/`fallback_families` stack and the skipped preload.
7. Inline tokens stay < 6 KB with real font URLs (estimate 4.3 KB, 5 schemes).
8. Customer account templates (`main-customers-*`): legacy form field names, `address[province]` as plain text, delete via `_method=delete`; stores on new customer accounts bypass them.
9. Two separate `{% form 'localization' %}` forms per location (country, language) with a visible Update button only without JS.
10. Shopify's response to an invalid discount code on `/cart/update.js` (200 with the code ignored, or 422).
11. Whether `variant | json` includes `featured_media` (money path) and whether `routes.product_recommendations_url` honours `section_id`.
12. `drawer_preview_open` keeps the drawer open in the editor; `section.index` is nil in the editor so reveal is off there by design.
13. `og:image` with `http:` + `https:` URL pairs, JSON-LD validity in Google's rich-results test.
14. The gift card page: `vendor/qrcode.js` via `shopify_asset_url` and the Apple Wallet badge.
15. Country rule with JS off: the overlay covers the viewport but the page behind stays in the accessibility tree (default-off parity feature; acceptable?).

## 5. Open questions carried forward

- **AssetSizeJavaScript threshold.** The CLI measures raw bytes; 15,000 raw per asset is far tighter than the documented gzip budgets (core 15 KB gz, product page 60 KB gz). Either raise `thresholdInBytes` (e.g. 40,000) and enforce gzip budgets in `scripts/check-limits.sh`, or require every module to stay under 15 KB raw. Decide before wave 1 writes `anvil-product.js`.
- **`<anvil-collapsible>` height animation** uses the Web Animations API on `height`; CONVENTIONS §8 says only `transform`/`opacity` animate. Keep (gated by reduced motion and `data-animations`) or drop for a transform-only reveal.
- **Chassis on group-only sections.** Header, announcement bar and footer carry the full 13-id chassis (heading settings above a header are unusual). Keep for uniformity or allow a reduced block; `scripts/chassis-lint.py` already exempts them. Same decision for overlay widgets (`anvil-scroll-top`, `anvil-audio`, `anvil-popup`).
- **Secondary button colours.** `--av-btn2-fg` / `--av-btn2-border` map to the scheme's `text`; add two colour-scheme definitions if merchants need a distinct secondary colour.
- **Plain English strings** in the main sections (sort/filter labels, "Clear all", customer-account labels, article comments, password page, gift card) are not in `locales/en.default.json`. Move them to `anvil.*` keys before any second locale.
- **Lucide `smile`** no longer exists upstream; 143 of 144 requested icons shipped. Alias `thumbs-up` or drop.
- **Countdown unit labels** are block settings; locale now has `anvil.countdown.days|hours|minutes|seconds`, so the block can switch to `t` if preferred.
- **Video facade script** is inline in `snippets/anvil-media.liquid` (guarded, ~20 lines per facade instance); move into `anvil-core.js` or an `anvil-media.js` if the duplication matters.
- **`cartAdd` makes two requests** (`add.js` then `cart.js`) to honour the `{cart, sections, source}` event shape; acceptable unless the drawer only ever needs section HTML.
- **Wave 1 hand-offs.** `sections/anvil-cart-drawer.liquid` must swap its inline `{% javascript %}` element for `assets/anvil-cart-drawer.js` (or keep the `customElements.get` guard); `<anvil-product-form>` must pass `sections: ['anvil-cart-drawer', 'anvil-cart-bubble']` and call `Anvil.sections.swapSection`; the drawer should render applied discount codes with data attributes for `applyDiscount/removeDiscount(opts.codes)`.
- **Generated docs.** Run `python3 scripts/spec-cards.py` and `python3 scripts/agent-prompt.py <slug> --write-chassis-api docs/CHASSIS-API.md` before the first section prompt; `docs/sections/<slug>.md` files do not exist yet for the wave-0 sections.
- **Dev store.** `shopify.theme.toml` still has `theme = "REPLACE_WITH_DEV_THEME_ID"`; `SCRATCH_PAGE` defaults to `contact` and needs an existing page on the dev store.
