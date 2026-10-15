# Anvil conventions — the contract every file follows

_This is the one document an implementation agent receives besides its spec card. Read it fully. If a rule here conflicts with a design document, this file wins; raise the conflict in your output notes._

## 0. Sources and forbidden material
Allowed while coding: shopify.dev, help.shopify.com, MDN, W3C/WAI. Forbidden: any theme repository or zip (including Shopify's Dawn, Horizon, Skeleton) and any commercial theme or section library. Never use an identifier from `docs/FORBIDDEN.md`. Write every string yourself.

## 1. Naming
- Files you author: `sections/anvil-<slug>.liquid`, `snippets/anvil-<name>.liquid`, `blocks/anvil-<name>.liquid` (private: `blocks/_anvil-<name>.liquid`), `assets/anvil-<name>.css|js`. Template-bound sections: `sections/main-<template>.liquid`. Fixed Shopify names stay: `layout/theme.liquid`, `layout/password.liquid`, `sections/header-group.json`, `sections/footer-group.json`, `sections/overlay-group.json`, `sections/apps.liquid`, `blocks/_blocks.liquid`, `templates/*`.
- CSS classes `.av-*` (BEM-ish: `.av-ticker`, `.av-ticker__item`, `.av-ticker--vertical`); a section's own classes start with `.av-<slug>` exactly (`.av-contact-form`, `.av-announcement-bar`), and a theme block that shares a name with a section adds `-block` (`.av-group-block`). State classes are `.av-is-*` (`av-is-open`, `av-is-hidden`, `av-is-in`, `av-is-static`, `av-is-paused`, `av-is-expired` …), never a bare `is-*`, so app and framework CSS cannot hit them. The only non-`av` classes are `js` / `no-js` on `<html>`. CSS custom properties `--av-*`. Custom elements `<anvil-*>`. Events `anvil:*`. JS global `window.Anvil`. Data attributes `data-anvil-*` for JS hooks (never style on them); the component contract hooks `data-slider-*` and `data-marquee-track` (§6) are the only other data attributes.
- Setting ids: short snake_case in Anvil's vocabulary (`pad_top`, `offer_cards_preselect`, `ship_bar_threshold`). Block types: snake_case nouns (`review`, `step`, `offer_card`). Schema `name` ≤ 25 characters, sentence case like the Shopify editor's own labels ("Announcement bar", "Icon with text"), no vendor words.
- Schema labels and `info` are inline English in section/block schemas (v1.0). Storefront strings a shopper reads (button labels, a11y labels, messages, table headers, form labels) use `{{ 'anvil.<area>.<key>' | t }}` from `locales/en.default.json`, one namespace per area (`anvil.collection.*`, `anvil.customer.*`, `anvil.gift_card.*`, `anvil.password.*`, `anvil.article.*`, `anvil.<your-slug>.*`); editor-only notes use the shared `anvil.editor.*` keys (`anvil.editor.empty_section` for an empty block list). Pass raw values to `t` (it escapes them). Dates use `time_tag: format: 'anvil_date'` (locale `date_formats.anvil_date`), never a hard-coded format. Merchant-editable copy stays in settings. Theme-settings labels use `t:settings_schema.*` keys (owned by the core author). During a wave the locale files are read-only: list the keys you need, with their English values, in your output notes and the integrator adds them at wave end.

## 2. Design tokens (defined in `snippets/anvil-css-tokens.liquid`, consumed everywhere)
- Scheme (set per section by `.av-scheme--<id>`): `--av-bg`, `--av-bg-gradient`, `--av-fg`, `--av-fg-rgb`, `--av-fg-muted`, `--av-border`, `--av-accent`, `--av-on-accent`, `--av-btn-bg`, `--av-btn-fg`, `--av-btn-border`, `--av-btn2-fg`, `--av-btn2-border`.
- Type: `--av-font-heading`, `--av-font-body`, `--av-heading-weight`, `--av-heading-case`, `--av-heading-spacing`, `--av-text-xs|sm|md|lg|xl|2xl|3xl|4xl` (fluid `clamp()` already scaled by the merchant's settings).
- Space: `--av-space-1`…`--av-space-10` (4, 8, 12, 16, 24, 32, 48, 64, 96, 128 px), `--av-page-width`, `--av-narrow-width`, `--av-gutter`, `--av-section-gap`.
- Shape: `--av-radius-button|input|card|media|drawer|popup|badge|pill`, `--av-border-w-button|input|card|media`, `--av-shadow-sm|md|lg`.
- Motion: `--av-dur` (merchant duration), `--av-ease`.
- Controls: `--av-input-border` (per scheme, text colour at 50 %: the 3:1 boundary every input, select, textarea and quantity box draws; `--av-border` is for decorative dividers only), `--av-dropdown-radius`, `--av-dropdown-border-w`, `--av-shadow-dropdown` (variant dropdowns), `--av-slider-arrow`, `--av-slider-dot`, `--av-slider-dot-gap`, `--av-logo-w` (theme logo width; phones below 750 px).
- Overlays: `--av-overlay-rgb` (from the theme shadow colour) and `--av-overlay-a` (0.45) for every backdrop: `rgb(var(--av-overlay-rgb) / var(--av-overlay-a))`. Image overlays inside a section set `--av-overlay-strength` inline on `.av-overlay`.
Never hard-code a colour, font, radius or shadow. Opacity variants use `rgb(var(--av-fg-rgb) / 0.6)`.

## 3. Section skeleton (mandatory; checked by `scripts/chassis-lint.py`)
```liquid
{%- liquid
  assign s = section.settings
-%}
<div {% render 'anvil-section-attrs', section: section, type: 'anvil-<slug>' %}>
  <div class="av-section__inner">
    {% render 'anvil-section-head', section: section %}
    <!-- body: local blocks loop with {{ block.shopify_attributes }} on each, or {% content_for 'blocks' %} -->
  </div>
</div>
{% stylesheet %}
/* section-only CSS, ≤ 6 KB, every selector starts with .av-<slug> */
{% endstylesheet %}
{% schema %}
{ ... }
{% endschema %}
```
- Shared component CSS (slider, marquee, dialog, product card, price, media, button) is already loaded by the chassis or by the component snippet; do not restyle components, compose them.
- Per-instance values (padding, custom widths) are emitted as inline custom properties by `anvil-section-attrs`; do not add `{% style %}` blocks unless a setting truly needs an instance-scoped rule, and then scope by `#shopify-section-{{ section.id }}`.
- Headings: the section heading comes from the chassis (`anvil-section-head`). Content headings inside blocks are `<h3>`; short labels in lists (icon-bar items, trust rows, stats captions) are not headings and stay `<span>`/`<p>`. Never render a second `<h1>`, and never skip a level: a grid of cards whose titles are `<h3>` sits under a section `<h2>` (a visually hidden one when the design has none).

## 4. Chassis settings (paste first in every section schema, ids and types exactly)
```json
{ "type": "header", "content": "Heading" },
{ "type": "inline_richtext", "id": "heading", "label": "Heading", "info": "Bold a word to colour it with the accent" },
{ "type": "richtext", "id": "subheading", "label": "Subheading" },
{ "type": "text_alignment", "id": "head_align", "label": "Heading alignment", "default": "center" },
{ "type": "select", "id": "head_size", "label": "Heading size", "options": [ {"value":"xs","label":"Extra small"}, {"value":"sm","label":"Small"}, {"value":"md","label":"Medium"}, {"value":"lg","label":"Large"}, {"value":"xl","label":"Extra large"} ], "default": "lg" },
{ "type": "select", "id": "accent_style", "label": "Accent style for bold words", "options": [ {"value":"color","label":"Accent colour"}, {"value":"underline","label":"Underline"}, {"value":"highlight","label":"Highlight"}, {"value":"gradient","label":"Gradient"} ], "default": "color" },
{ "type": "header", "content": "Layout" },
{ "type": "color_scheme", "id": "color_scheme", "label": "Colour scheme", "default": "scheme-1" },
{ "type": "select", "id": "width", "label": "Width", "options": [ {"value":"page","label":"Page width"}, {"value":"narrow","label":"Narrow"}, {"value":"full","label":"Full width"} ], "default": "page" },
{ "type": "range", "id": "pad_top", "label": "Top padding", "min": 0, "max": 120, "step": 4, "unit": "px", "default": 48 },
{ "type": "range", "id": "pad_bottom", "label": "Bottom padding", "min": 0, "max": 120, "step": 4, "unit": "px", "default": 48 },
{ "type": "select", "id": "pad_mobile", "label": "Padding on phones", "options": [ {"value":"same","label":"Same as desktop"}, {"value":"compact","label":"Compact"}, {"value":"none","label":"None"} ], "default": "compact" },
{ "type": "select", "id": "reveal", "label": "Animate on scroll", "options": [ {"value":"none","label":"Off"}, {"value":"fade-up","label":"Fade up"}, {"value":"fade","label":"Fade"}, {"value":"zoom","label":"Zoom"} ], "default": "none" },
{ "type": "select", "id": "show_on", "label": "Show on", "options": [ {"value":"all","label":"All devices"}, {"value":"mobile","label":"Phones only"}, {"value":"desktop","label":"Desktop only"} ], "default": "all" },
{ "type": "text", "id": "anchor", "label": "Anchor id", "info": "Letters, numbers and hyphens. Link to this section with #your-id" }
```
Then a `{ "type": "header", "content": "<Section name>" }` and your own settings (≤ 27 ids). Every section has `"presets": [{ "name": "<Section name>" }]` with example blocks, and `"enabled_on"` or `"disabled_on"` when it belongs only to certain templates or groups.

**Reduced chassis.** Group-only and overlay sections (`enabled_on.groups` without `templates`: `anvil-header`, `anvil-announcement-bar`, `anvil-footer`, and later `anvil-scroll-top`, `anvil-audio`, `anvil-popup`) carry only these five chassis settings, first, under `{ "type": "header", "content": "Layout" }`, with the ids, types and options above: `color_scheme`, `pad_top`, `pad_bottom`, `pad_mobile`, `show_on`. They have no `heading`, `subheading`, `head_align`, `head_size`, `accent_style`, `width`, `reveal` or `anchor`, and do not render `anvil-section-head`; the skeleton is `anvil-section-attrs` + `.av-section__inner`. `anvil-section-attrs` falls back to the chassis defaults for every missing setting (width `page`, reveal `none`, anchor = section id). `scripts/chassis-lint.py` enforces the exact set. Template-bound `main-*` sections keep their layout-only block (`color_scheme`, `width`, `pad_top`, `pad_bottom`, `pad_mobile`) and name their page heading setting `title`, never `heading`.

## 5. Shared snippets (call signatures)
| Snippet | Params | Output |
|---|---|---|
| `anvil-section-attrs` | `section`, `type` | `id`, classes (`av-section av-scheme av-scheme--<id> av-width--<w> av-reveal--<r> av-show--<s> av-s-<type>`), inline `--av-pad-top`/`--av-pad-bottom` (px) and `--av-pad-mobile` (unitless multiplier 1 / 0.6 / 0), `data-section-id`, `data-section-type`, `data-anvil-section="<section.id>"`. Reveal only from the third section on (`section.index > 2`). |
| `anvil-section-head` | `section`, `tag` (default `h2`) | heading + subheading wrapper, or nothing when both are blank |
| `anvil-button` | `label`, `url`, `style` (`primary\|secondary\|ghost\|link`), `size` (`sm\|md\|lg`), `full`, `icon`, `attrs`, `aria_label`, `type` (`button\|submit`) | `<a>` when `url`, else `<button>` |
| `anvil-icon` | `name`, `size` (px, default 24), `label`, `class` | inline SVG; `aria-hidden="true"` unless `label` |
| `anvil-media` | `image`, `video`, `video_url`, `ratio` (`adapt\|1:1\|4:5\|3:4\|16:9\|21:9`), `widths`, `sizes`, `loading`, `priority`, `alt`, `fit` (`cover\|contain`), `placeholder` (placeholder_svg name), `class`, `autoplay`, `loop`, `controls` | responsive `<img>` via `image_tag`, `<video>` via `video_tag`, or a click-to-load facade for YouTube/Vimeo; placeholder when empty. `autoplay` never writes the attribute: the video keeps its controls and anvil-core.js plays it muted while in view only when motion is allowed. Styles in `anvil-base.css`. Pass `alt: ''` when the image sits inside a link or heading that already names it. |
| `anvil-stars` | `rating`, `max` (5), `size`, `label` | 5 stars with partial fill, `role="img"` + label |
| `anvil-price` | `product` or `variant`, `show_compare`, `show_badge`, `size` | price markup with compare-at and savings |
| `anvil-product-card` | `product`, `show_vendor`, `show_rating`, `quick_add`, `image_ratio`, `sizes`, `loading`, `priority`, `heading_tag`, `uid` | card used by collections, upsells, bundles, shoppable image; pass `loading: 'eager'` for the first visible row and `priority: true` for the first card when it is the LCP image; load `anvil-card.css` |
| `anvil-money` | `amount` | money with or without the currency code, following `settings.show_currency_code`; use for every price you print |
| `anvil-social-links` | `class`, `label` | text pills for Theme settings > Social links (no platform logos) |
| `anvil-cart-bubble` | — | the header cart count in its Section Rendering slot (`data-anvil-section="anvil-cart-bubble"`) |
| `anvil-pagination` | `paginate` | accessible pagination |

`data-anvil-section="<id>"` marks the element whose **children** `Anvil.sections.swapSection(id, html)` replaces (the element itself stays, so an open dialog, a live region or a custom element outside it survives); without one, the `#shopify-section-<id>` wrapper is used. Elements marked `data-anvil-cart-render="<section id>"` name the sections every cart change re-renders (at most 5). The cart drawer's swap root is the inner `.av-cart-drawer__frame`, never `<anvil-cart-drawer>` or its `<dialog>`.

## 6. Shared components (custom elements; markup contracts)
- `<anvil-slider per-view="1" per-view-desktop="3" peek="16" autoplay="0" loop dots arrows>` wraps `<div data-slider-track>` with children `[data-slider-slide]`. Works as a scroll-snap row without JS. Liquid writes the layout inline so nothing moves when the script runs: `style="--av-slider-per-view: 1; --av-slider-per-view-desktop: 3; --av-slider-peek: 16px"` and, when `dots` is on, an empty `<div class="av-slider__dots" data-slider-dots></div>` after the track (its height is reserved by CSS). Do not add slide roles in Liquid; the element sets them. Autoplay starts paused under reduced motion and always has a pause/play button. Emits `anvil:slider:change`.
- `<anvil-marquee speed="40" direction="left" pause-on-hover paused>` wraps one `[data-marquee-track]`; the element clones the track for the loop and adds a pause/play button (`paused` attribute reflects it). CSS shows a static wrapping row under reduced motion from the first paint.
- `<anvil-dialog id="…">` wraps a native `<dialog>`; open with `<button data-anvil-open="id">`, close with `[data-anvil-close]`; focus returns to the opener.
- `<anvil-collapsible>` wraps `<details><summary>`; adds animation and group behaviour (`single` attribute).
- `<anvil-countdown ends-at="2026-12-31T23:59:00" timezone="America/Denver" data-anvil-end="<epoch s>" expired="hide|text">`: Liquid writes `data-anvil-end` (the absolute instant, store time zone) when no time zone is set, so every shopper counts down to the same moment.
- `<anvil-cart-form cart-id="drawer|page|page-summary" class="av-enhance">` (`assets/anvil-cart.js`) enhances a working cart `<form>`: steppers, quantity typing, remove links, note, discount field. `<anvil-cart-drawer>` (`assets/anvil-cart-drawer.js`) is the drawer.
- `<anvil-facets section-id="…" class="av-enhance">` (`assets/anvil-facets.js`) re-renders collection/search results in place; `<anvil-predictive-search section-url="…" class="av-enhance">` (`assets/anvil-predictive-search.js`) shows header search results. Discount codes: `assets/anvil-code.js` (`data-anvil-copy`, `data-anvil-apply`).
- **Enhancement gating.** A custom element with class `.av-enhance` hides its `.av-fallback-only` controls (Update/Apply buttons) and shows its `.av-enhanced-only` controls only once it is defined (`:defined`). Never hide a working fallback with `.js .av-no-js-only` when the replacement depends on a module that may not load; never auto-submit a form on `change` (WCAG 3.2.2).
- `<anvil-tabs>` with `[role=tablist]`, `[role=tab]`, `[role=tabpanel]`; keyboard: arrows, Home, End.
- `<anvil-compare>` (before/after) with `<input type="range">` and two images.
- `<anvil-hotspots>` with `[data-spot]` buttons toggling `aria-expanded` popovers.
Load a component with `<script type="module" src="{{ 'anvil-<name>.js' | asset_url }}"></script>` inside the section; module URLs dedupe. Never use `script_tag`, never a bare `<script>` without `type="module"` or `defer`.

## 7. JavaScript
ES modules, no bundler, no dependencies. `anvil-core.js` loads the four core modules with `import()` from the versioned URLs in `window.Anvil.modules` (preloaded with `<link rel="modulepreload">` in the layouts), so core modules never import each other statically and reach the bus through `window.Anvil.events`. Section modules run in document order but may run before core finishes: read `window.Anvil.*` lazily (at event time), and subscribe to cross-module events on `document` (every `emit` also dispatches a `CustomEvent` there). Core modules export: `anvil-events.js` → `on, off, emit`; `anvil-cart-api.js` → `cartAdd, cartChange, cartUpdate, cartGet, applyDiscount, removeDiscount, cartClear`; `anvil-sections.js` → `fetchSections, swapSection`; `anvil-dom.js` → `confineFocus, releaseFocus, focusables, lockScroll, unlockScroll, debounce, formatMoney, onReady, t, motionOff` (the reference-theme names for focus trapping are banned by `docs/FORBIDDEN.md`). Always use `window.Anvil.routes.*`, never hard-coded paths; the keys are camelCase: `root, cart, cartAdd, cartChange, cartUpdate, cartClear, predictiveSearch, search, productRecommendations, collections, allProducts, account, login`. Shopper-facing strings for JS come from `window.Anvil.strings` (camelCase keys, `[var]` placeholders, filled in `layout/theme.liquid` from `anvil.*` locale keys); read them through `Anvil.dom.t(keys, vars, fallback)` and always pass an English fallback. Listen to `anvil:cart:updated` rather than polling. Handle `shopify:section:load`, `shopify:section:unload`, `shopify:block:select` in the editor. Every custom element cleans up in `disconnectedCallback`. Budgets: ≤ 2 KB gzipped per section-specific module; shared components have their own budgets.

## 8. CSS
Mobile first; breakpoints `min-width: 480px`, `750px`, `990px`, `1200px`. Container queries for component internals. Only `transform`/`opacity` animate, and only inside `@media (prefers-reduced-motion: no-preference)`; respect `html[data-animations="off"]`. The one exception is the height of a disclosure body in `<anvil-collapsible>` (accordions open and close in place), animated with the Web Animations API only when motion is allowed and `data-animations` is on. Reveal-on-scroll hides content only under `html.av-reveal-ready` (set by anvil-core.js once its observer runs). Focus styles use the global `:focus-visible` ring; components that draw focus with `box-shadow` keep `outline: 2px solid transparent` so Windows High Contrast still shows it. No `!important`. No vendor prefixes beyond what MDN says is needed. Every image gets `width`/`height` or an aspect-ratio box; nothing shifts after load.

## 9. Accessibility
Semantic elements first (`<table>` for comparison tables, `<ol>` for steps, `<details>` for accordions, `<dialog>` for modals, `<button>` for actions). One `<h1>` per page (the product title or page title). Every control has a name; every icon is decorative (`aria-hidden`) unless it is the only label. Touch targets ≥ 24 × 24 px (44 px for floating buttons). Contrast ≥ 4.5:1 is the merchant's responsibility through colour schemes; the editor warns. Carousels: `aria-roledescription="carousel"`, slides `role="group"` with "N of M". Live regions for cart and slider changes.

## 10. Honesty rules (see `docs/HONEST.md`)
No evergreen or per-visitor timers. No typed stock numbers; inventory only from Shopify's tracked inventory. No manual "you save"; savings only from compare-at or "applied at checkout". "FREE" only when Shopify prices the line at zero. Star numbers only from the rating metafields or with a source URL. Badges like "Most popular" only behind a "backed by sales data" checkbox. No bundled platform logos; merchants upload what they are entitled to use. Example content must read as an example. Every setting that could mislead carries a one-sentence `info`.

## 11. Performance budgets
Lighthouse mobile ≥ 80 performance, ≥ 95 accessibility on home, product and landing. `{% stylesheet %}` ≤ 6 KB per section; section JS ≤ 2 KB gz; images always via `image_tag` with `widths` and `sizes`, max width 2200 (full-bleed), 1100 (half), 600 (cards: `300, 450, 600`), 200 (logos/avatars); `loading="lazy"` except media in the first two sections (`section.index <= 2` or nil), where the first visible row is eager and the likely LCP image gets `fetchpriority: 'high'`; fonts preload with `crossorigin`; no raster files in `assets/`; zero third-party requests.

## 12. Placeholders and defaults
Empty image settings render `placeholder_svg_tag` (`product-1…6`, `collection-1…6`, `lifestyle-1`, `lifestyle-2`, `image`). Empty product lists render four placeholder cards. Default text is visibly an example ("Example review — replace with a real one"). Presets include enough example blocks to look finished.

## 13. Definition of done (per section/block)
1. Skeleton and chassis settings exactly as above; `presets` present; `shopify_attributes` on every local block.
2. `shopify theme check --fail-level warning` → 0 findings for the whole theme.
3. `scripts/cleanroom-lint.sh`, `scripts/asset-audit.py`, `scripts/chassis-lint.py` pass.
4. Renders with placeholder content; works with JavaScript disabled where the spec says so; keyboard-operable; reduced motion respected.
5. `docs/sections/<slug>.md` written: purpose, settings, blocks, behaviour, honesty notes, and anything uncertain.
6. Nothing outside your allowed paths changed.
