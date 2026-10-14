# Anvil — Core architecture

_Design document, 2026-10-14. Part of the Anvil theme (MIT). Written from Shopify's public documentation only._

Written from scratch; no Dawn/Horizon/Skeleton files, so the repo is plain MIT. Facts verified on shopify.dev 2026-10-14 unless marked **(unverified)**.

## 1. Repo layout and naming
```
anvil-theme/
  assets/      anvil-*.css  anvil-*.js
  config/      settings_schema.json  settings_data.json
  layout/      theme.liquid  password.liquid
  locales/     en.default.json  en.default.schema.json
  sections/    main-*.liquid  anvil-*.liquid  header-group.json  footer-group.json
  snippets/    anvil-*.liquid
  templates/   *.json  gift_card.liquid  customers/*.json
  docs/        SPEC.md  CLEANROOM.md  HONEST.md  ARCHITECTURE.md  DESIGN-money-path.md  DESIGN-sections.md  DECISIONS.md  SECTIONS.md  INSTALL.md  agent-prompts/
  scripts/     cleanroom-lint.sh  check-limits.sh  a11y.sh  sync-block-schemas.py  package.sh
  .github/workflows/  ci.yml  release.yml  lighthouse.yml
  .theme-check.yml  shopify.theme.toml  .shopifyignore  LICENSE  NOTICE  README.md  CHANGELOG.md
```
Prefix rules (enforced by `scripts/cleanroom-lint.sh`): files we author = `anvil-`; template-bound sections = `main-<template>` (widely understood, not reserved); only `header-group.json` / `footer-group.json` keep Shopify-style names. Custom elements `<anvil-*>`, events `anvil:*`, JS global `window.Anvil`, CSS classes `.av-*`, CSS variables `--av-*`, setting ids plain snake_case from our vocabulary. Nothing named like a Shopify reserved file.

## 2. `layout/theme.liquid`
Head, in order: doctype + `<html class="no-js" lang="{{ request.locale.iso_code }}">`, charset, viewport (no `maximum-scale`), `theme-color`; `{% render 'anvil-meta' %}` (title, description, `canonical_url`, OG/Twitter from `page_image`, favicon `image_url: width: 32`); font preloads for ≤ 2 non-system `font_picker` fonts (`font_url`, `font.system` skips); `<style>{% render 'anvil-css-tokens' %}</style>` (`font_face: font_display: 'swap'` + every settings-derived token; the only inline CSS, < 6 KB); `anvil-base.css` via `stylesheet_tag: preload: true`; `{{ content_for_header }}` untouched; one inline `<script>` setting `window.Anvil = {routes, moneyFormat, strings, settings:{cartType, openCartOnAdd}}` and swapping `no-js`→`js`; `<script type="module" src="anvil-core.js">` (modules defer; never `script_tag`).
Body: skip link → `#main`; `{% sections 'header-group' %}`; `<main id="main" tabindex="-1">{{ content_for_layout }}</main>`; `{% sections 'footer-group' %}`; `{% if settings.cart_type == 'drawer' %}{% section 'anvil-cart-drawer' %}{% endif %}`; `{% render 'anvil-json-ld' %}` (Organization, Product with per-variant Offers, Article, BreadcrumbList); `{% render 'anvil-security' %}` only when a security toggle is on; `anvil-editor.js` only in `request.design_mode`.
Performance rules: no render-blocking script; component CSS loaded by `stylesheet_tag` inside the section that needs it; LCP image `image_tag: preload: true, fetchpriority: 'high', loading: 'eager'`; all other images lazy with `widths`/`sizes`; zero third-party origins (Theme Check `RemoteAsset`). `layout/password.liquid` = stripped copy without groups.

## 3. Design tokens
- **Colours:** one `color_scheme_group` setting `color_schemes` with definitions `background` (allows gradient), `text`, `text_muted`, `border`, `accent`, `on_accent`, `button`, `button_text`, `button_border`; role map to Shopify's roles (links = accent, primary_button = button, secondary_button = background, etc.). Five defaults: scheme-1 light, scheme-2 soft, scheme-3 accent block, scheme-4 dark, scheme-5 inverse. `anvil-css-tokens.liquid` emits `.av-scheme--<id> { --av-bg; --av-fg; --av-fg-rgb (color_to_rgb); …; color-scheme: dark|light by color_brightness }`; `:root` repeats `settings.body_color_scheme`. Every section schema carries `{"type":"color_scheme","id":"color_scheme","default":"scheme-1"}` and wraps in `class="av-section av-scheme av-scheme--{{ section.settings.color_scheme.id }}"`. Editor-only contrast warning when `color_contrast` < 4.5.
- **Typography:** `--av-font-heading`, `--av-font-body` (+ `fallback_families`), `--av-heading-scale`, `--av-body-scale` (80–150 %), weights via `font_modify` with nil guard; `--av-text-xs…4xl` as `clamp()` × scale. Custom fonts: `use_custom_fonts` reveals (`visible_if`) `custom_heading_font_url|family` and body equivalents; merchant uploads `.woff2` to Content > Files and pastes the CDN URL **(unverified that Files accepts woff2; fallback: upload to `assets/`)**.
- **Spacing/shape:** `--av-space-1..10` (4 px base), `--av-page-width`, `--av-gutter`, per-section `--av-section-pad` from `padding_top/bottom` ranges with `--av-pad-scale-mobile` (0.7) under 750 px; radius tokens `--av-radius-button|input|card|media|drawer|popup|badge|pill`; shadows `--av-shadow-sm|md|lg` from `settings.shadow_color` + opacity.

## 4. JavaScript
Plain ES modules in `assets/`, no bundler; each section includes `<script type="module" src="{{ 'anvil-x.js' | asset_url }}">` for the elements it uses (module URLs dedupe). Core (every page, ≤ 15 KB gz total):
- `anvil-events.js`: `on/off/emit` over a Map. Topics: `anvil:cart:updated {cart, sections, source}`, `anvil:cart:error {status, description}`, `anvil:variant:changed {variant, product, sectionId}`, `anvil:drawer:opened|closed`, `anvil:quantity:changed`.
- `anvil-cart-api.js`: `cartAdd(items,{sections})`, `cartChange({id|line, quantity, properties},{sections})`, `cartUpdate({updates, note, attributes, discount},{sections})`, `cartGet()`, `applyDiscount(code)`/`removeDiscount()`, `cartClear()`; POST JSON with `Accept: application/json` to `window.Anvil.routes.* + '.js'`; `sections` capped at 5, `sections_url = location.pathname`; non-2xx throws `CartError{status, message, description}`; 422 description shown verbatim in the form's `aria-live` region.
- `anvil-sections.js`: `fetchSections(ids, url)` (GET `?sections=a,b`, skip nulls), `swapSection(id, html)` (DOMParser; replace `#shopify-section-<id>` or `[data-anvil-section=<id>]` children; keep focus/scroll).
- `anvil-dom.js`: `trapFocus`, `releaseFocus`, `lockScroll`, `debounce`, `formatMoney(cents, format)` honouring `{{amount}}`, `{{amount_no_decimals}}`, `{{amount_with_comma_separator}}` and the currency-code setting.
- `anvil-core.js`: imports the above; registers `<anvil-drawer>`, `<anvil-modal>` (native `<dialog>`), `<anvil-header>`, `<anvil-cart-bubble>`, `<anvil-collapsible>`.
Per-feature elements: `<anvil-product-form>` (intercepts `{% form 'product' %}` submit → `cartAdd` with `sections: ['anvil-cart-drawer','anvil-cart-bubble']` → emit → drawer opens if `settings.cart_open_on_add`), `<anvil-variant-picker>`, `<anvil-quantity>`, `<anvil-media-gallery>`, `<anvil-slider>` (scroll-snap + buttons/dots; reused by every carousel section), `<anvil-cart-items>`, `<anvil-discount-form>`, `<anvil-facets>` (collection/search filtering via SRA), `<anvil-localization-form>`, `<anvil-predictive-search>` (v1 optional), `<anvil-menu-drawer>`.
Section IDs for SRA: static sections use the filename (`anvil-cart-drawer`); JSON/group sections get dynamic ids, so every section prints `data-section-id="{{ section.id }}"`. `sections/anvil-cart-bubble.liquid` exists only for SRA (no presets, not in any template) and feeds the header count.
Progressive enhancement: product form, cart page (`updates[]`), facets (GET form), collapsibles (`<details>`), mobile nav (`<details>/<summary>` overlay), sliders (overflow scroll-snap) all work with JS off; `<noscript>` adds a `<select name="id">` of variants; drawer triggers are `<a href="{{ routes.cart_url }}">` upgraded by JS. `anvil-editor.js` handles `shopify:section:select` / `shopify:block:select` (open the drawer/popup being edited).

## 5. CSS
- `anvil-base.css` (≤ 20 KB gz): reset, token defaults, type scale, `.av-page-width`, `.av-section`, `.av-btn` (primary/secondary/link), `.av-field`, `.av-badge`, `.av-visually-hidden`, `.av-skip-link`, `:focus-visible` ring, `.av-scheme`, `[hidden]`.
- `anvil-<component>.css` per component, included only where rendered. Per-instance CSS (padding, widths) in a `{% style %}` block scoped by `#shopify-section-{{ section.id }}`. The `{% stylesheet %}` tag is rejected (concatenates into one always-loaded file; no Liquid).
- Container queries (`container-type: inline-size` on `.av-grid`, `.av-card`, `.av-drawer__body`) for component internals; media queries (480/750/990/1200) for page layout and section padding.
- Motion only under `@media (prefers-reduced-motion: no-preference)` and `html[data-animations="off"]` from `settings.animations_enabled`; animate only `transform`/`opacity`.

## 6. `config/settings_schema.json`
`theme_info`: "Anvil", "Jhoalen Duran", semver, documentation = README, `theme_support_url` = `https://github.com/duranjh/anvil-theme/issues`. Labels via `t:settings_schema.<group>.settings.<id>.label`. Groups/ids (abridged): **Logo & favicon** `logo`, `logo_width`, `logo_width_mobile`, `favicon`. **Colors** `color_schemes`, `body_color_scheme`, `badge_sale_bg/_text`, `badge_soldout_bg/_text`, `badge_custom_bg/_text`, `color_success`, `color_error`, `color_rating`. **Typography** `font_heading`, `font_heading_scale|weight|case|letter_spacing`, `font_body`, `font_body_scale`, `use_custom_fonts` + 4 custom fields (`visible_if`). **Layout** `page_width`, `gutter_mobile|desktop`, `section_spacing_desktop|mobile`, `grid_gap`. **Buttons** `button_radius|border_width|shadow|text_case|hover`. **Inputs** `input_radius|border_width|shadow`. **Cards** `card_style|radius|border_width|shadow|color_scheme|text_align|image_ratio`. **Media** `media_radius|border_width|shadow`. **Drawers & popups** `drawer_radius|shadow|width`, `popup_radius|shadow`. **Badges** `badge_position|radius|sale_format|show_soldout`. **Swatches** `swatch_shape|size|border` (native `option_value.swatch`). **Variant pills** `pill_radius|border_width|selected_style`. **Quantity picker** `qty_style|radius`. **Slider controls** `slider_arrow_style|size`, `slider_dot_style|size`. **Animations** `animations_enabled|reveal|hover_lift|duration`. **Scrollbar** `scrollbar_style|color`. **Social** `social_instagram_url`, `social_tiktok_url`, `social_facebook_url`, `social_youtube_url`, `social_x_url`, `social_pinterest_url`. **Cart** `cart_type` (drawer/page), `cart_open_on_add`, `cart_show_note|discount_field|vendor|savings`, `cart_empty_link` (the free-shipping threshold lives on the drawer's `free_ship_bar` block, Appendix B). **Currency** `show_currency_code`. **Search** `predictive_search_enabled|show_price`. **Security** `block_right_click` (false; info: breaks accessibility tools), `block_devtools_shortcuts` (false), `country_block_enabled` (false), `country_block_mode|list|message` (`visible_if`); country check uses `localization.country.iso_code` (active Markets country, not geo-IP; `info` says so). ~160 settings ≈ 45 KB.

## 7. Templates and minimal `main-*` sections
| Template | Sections | v1 |
|---|---|---|
| `index.json` | `anvil-hero`, `anvil-rich-text`, `anvil-featured-collection` (+ the kit's homepage preset at parity) | preset content |
| `product.json` | `main-product` (37 blocks via dispatcher, `@app`), `anvil-related-products` | full |
| `product.landing.json` | `main-product` first + the course layout sections | full at parity |
| `collection.json` | `main-collection-banner`, `main-collection` (grid + `anvil-facets` using `collection.filters`, `sort_by`, `paginate` ≤ 50, SRA re-render) | full |
| `list-collections.json` | `main-list-collections` | minimal |
| `search.json` | `main-search` (facets with `search.filters`) | minimal; predictive optional |
| `cart.json` | `main-cart-items`, `main-cart-footer` | full (cart_type=page) |
| `page*.json` | `main-page`; contact adds `anvil-contact-form`; faq adds `anvil-faq`; track-order adds `anvil-track-order` | full |
| `blog.json`, `article.json` | `main-blog`, `main-article` (comments) | minimal |
| `404.json`, `password.json` | `main-404`, `anvil-password-content` | minimal |
| `gift_card.liquid` | code, balance, `gift_card.pass_url`, QR via a tiny MIT lib (credited in NOTICE) | minimal |
| `customers/*.json` | `main-customers-*` (account, login, register, addresses, order, activate_account, reset_password) | minimal styled forms; stores on new customer accounts bypass them **(unverified)** |
Every `main-product` block's markup lives in `snippets/anvil-pb-<block>.liquid`; only the schema stays in the section (256 KB cap).

## 8. Section groups and the drawer
`header-group.json` (`type: header`): `anvil-announcement-bar` (`enabled_on.groups: ["header"]`) + `anvil-header`. `footer-group.json` (`type: footer`): `anvil-footer` + optional `anvil-trust-strip`. Cart drawer = `{% section 'anvil-cart-drawer' %}` static section with blocks; settings persist in `settings_data.json` `current.sections`. The `aside` group type was rejected (would let merchants drop arbitrary sections into the drawer). **Verify in Phase 1 boots** that a static section's blocks are editable in the editor; fallback = a `block_list`-style settings pattern.

## 9. Locales
`en.default.json` + `en.default.schema.json` only. Storefront keys `general.*`, `products.product.*`, `products.facets.*`, `sections.cart.*`, `sections.header.*`, `templates.*`, `customer.*`, `gift_cards.*`, `newsletter.*`, `localization.*`, `blogs.*`, `onboarding.*`, `anvil.*` (feature strings, e.g. `anvil.free_shipping.remaining_html`); plurals `one/other` with `count`; HTML values end `_html`. Marketing copy stays in section settings. ~350 keys at core, ~800 at parity (limit 3,400). Theme Check `TranslationKeyExists` / `MatchingTranslations` in CI.

## 10. Budgets and checks
Lighthouse mobile perf ≥ 85 / a11y ≥ 95 on index, product, landing with real images; LCP < 2.5 s, CLS < 0.1, INP < 200 ms; core JS ≤ 15 KB gz, product page JS ≤ 60 KB gz, base CSS ≤ 20 KB gz, component CSS ≤ 8 KB gz; zero third-party requests; contrast 4.5:1, touch targets ≥ 24 px, visible focus, `alt`/`width`/`height` everywhere. `.theme-check.yml` extends `theme-check:recommended` + `AssetSizeJavaScript` (15000) + `AssetSizeCSS` (30000). `scripts/a11y.sh` runs `@axe-core/cli` + `pa11y-ci` at 375/1280 px against `shopify theme dev`. `Shopify/lighthouse-ci-action@v1` on `workflow_dispatch` (needs a Dev Dashboard app client id/secret). Manual per release: VoiceOver on iPhone, keyboard-only, 200 % zoom, reduced motion.

## 11. Dev workflow
`shopify.theme.toml`: `[environments.voreau-dev] store = "voreau.myshopify.com" theme = "<id>"`. First push `shopify theme push --unpublished --theme "ANVIL dev – DO NOT PUBLISH"`; then `shopify theme push -e voreau-dev`; daily `shopify theme dev -e voreau-dev --live-reload hot-reload`. Never `--live`/`--allow-live`. `ci.yml`: `shopify/theme-check-action@v2` (`--fail-level error`), `scripts/cleanroom-lint.sh` (forbidden strings + file-prefix rule), `scripts/check-limits.sh` (Liquid < 256 KB, schema < 512 KB, locale key count, JSON validity). `release.yml` on `v*` tags: assert `theme_version` == tag, `shopify theme package` → `Anvil-<version>.zip`, attach via `softprops/action-gh-release` with the CHANGELOG section.

## 12. Clean-room process
Commit order: scaffold → `docs/SPEC.md` (dated; what the merchant sets, what the shopper sees) → `docs/CLEANROOM.md` (allowed sources: shopify.dev, MDN, public marketing pages; forbidden: any Shrine/Dawn/Horizon/Section Store file; forbidden identifiers; spec author vs implementers) → code. Implementation agents receive only their SPEC table + `docs/ARCHITECTURE.md`; prompts stored in `docs/agent-prompts/`. `NOTICE` lists MIT dependencies (QR lib, Lucide icons). `docs/DECISIONS.md` logs ADRs (from-scratch over Dawn; static drawer over aside group; per-component CSS over `{% stylesheet %}`; local blocks over theme blocks for the product section).

## 13. Build order and size
A **Boots**: `theme.liquid`, `password.liquid`, `anvil-meta`, `anvil-css-tokens`, `anvil-base.css`, `anvil-core.js` + 4 core modules, both config files, both locale files, header/footer groups with minimal header/footer, every template with its `main-*` so no page 404s. Exit: editor opens, zero Theme Check errors.
B **Buy path**: `main-product`, gallery, variant picker, quantity, product form, `anvil-price`, `anvil-card-product`, `anvil-featured-collection`, `anvil-cart-drawer` + `anvil-cart-bubble` + `anvil-cart-items`, cart page, `main-collection` + facets.
C **Chrome**: announcement bar, mega menu, menu drawer, footer blocks, localization form, search, blog/article, contact, customers, 404.
D **Hardening**: a11y pass, Lighthouse, zip upload test to a second unpublished theme.
Conversion features start after D. Core estimate: ~135 files, ~18k lines (7k Liquid, 4.5k CSS, 2.5k JS, 3.5k JSON); full parity roughly doubles that.
