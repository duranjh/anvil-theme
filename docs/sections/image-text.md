# Image with text — `sections/anvil-image-text.liquid`

_Section card, 2026-10-15. Built from `docs/agent-prompts/image-text.md` (CONVENTIONS, spec card, chassis API, exemplars)._

## Purpose
An image or a video next to a column of text. This is the standard "feature row". Spec: `docs/spec/image-text.md` and SPEC §4.1 "Image with text". The design row is DESIGN-sections §3 `anvil-image-text`. SPEC §5 places it on the home page (between testimonials and the FAQ) and on the product landing template (between the image gallery and multicolumn). Phones stack the media above or below the text. From 750 px the media and the text sit side by side. The section adds no JavaScript of its own; the `atc` block loads the shared `assets/anvil-product.js` (see "Add to cart").

## Settings
The 13 chassis settings come first, copied exactly from CONVENTIONS §4. After them comes a header "Image with text" with 8 media settings, then a header "Content" with 5 content settings. That makes 26 settings in total (the limit is 40).

| id | type | default | what it does |
|---|---|---|---|
| `image` | image_picker | — | the image. It is also the cover of a YouTube or Vimeo video. Its `info` asks for the real product or result, and for images the merchant is entitled to use. Alt text comes from the image's own alt in Files |
| `video` | video | — | a video uploaded to Shopify. When set, it replaces the image |
| `video_url` | video_url (`youtube`, `vimeo`) | — | used when no Shopify video is set. It renders as the click-to-load facade in `anvil-media`, so nothing loads from the host until the shopper presses play |
| `video_autoplay` | checkbox | false | Shopify video only. It passes `autoplay` to `anvil-media`: muted, looping and played by `anvil-core.js` only while the video is in view and motion is allowed. The controls stay on (WCAG 2.2.2) |
| `image_ratio` | select `adapt` / `1:1` / `4:5` / `3:4` / `16:9` | `adapt` | the media shape. `adapt` uses the media's own aspect ratio (the placeholder is square) |
| `image_width` | range 40–60 %, step 5 | 50 | the media column's share of the row from 750 px, written inline as `--av-image-text-media` |
| `image_side` | select `left` / `right` | `left` | side of the media on tablet and desktop |
| `image_side_mobile` | select `top` / `bottom` | `top` | media above or below the text on phones |
| `valign` | select `top` / `center` / `bottom` | `center` | vertical alignment of the two columns from 750 px |
| `box` | select `none` / `card` | `none` | `card` wraps the text column in the shared `.av-box` container. Its border, corners and shadow come from Theme settings > Containers |
| `box_scheme` | color_scheme | `scheme-1` | the card's own colour scheme (`av-scheme av-scheme--<id>` on the box). Ignored when `box_style` is `none` |
| `text_align` | text_alignment | `left` | text and block alignment from 750 px |
| `text_align_mobile` | text_alignment | `left` | text and block alignment below 750 px |

`schema.name` is "Image with text" (15 characters). `max_blocks: 10`. `disabled_on.groups: ["header", "custom.overlay"]`, so the section can still go in the footer group and on any template.

## Blocks
These are local blocks. Each block prints `{{ block.shopify_attributes }}` on its own root element (and on its editor note), so a block that has nothing to show leaves no empty wrapper and no gap.

| type | settings | renders |
|---|---|---|
| `eyebrow` | `text` (text, "Example eyebrow"), `style` (`plain` muted / `accent` text / `pill` accent pill) | `<p class="av-image-text__eyebrow">`. A label, not a heading |
| `heading` | `heading` (inline_richtext, "Example heading — replace me"), `size` (`sm` / `md` / `lg` / `xl` → `av-text--xl` / `2xl` / `3xl` / `4xl`) | always `<h3>` (see "Headings"). Bold words become accent spans in the chassis `accent_style` |
| `text` | `text` (richtext, `<p>Example text — …</p>`), `size` (`sm` / `md` / `lg`) | `<div class="av-image-text__text av-rte">`, capped at 65ch for readable lines in full-width sections |
| `checklist` | `lines` (textarea, one item per line, at most 12 items shown; blank lines do not count toward the 12), `icon` (check, check-circle, badge-check, shield-check, star, heart, leaf, sparkles, zap; all in the icon set) | `<ul role="list">` of `<li>` items with a decorative icon (`aria-hidden`) and escaped text. Blank lines are skipped |
| `stars` | `product` (product), `show_number` (true), `show_count` (true) | `anvil-stars` from `reviews.rating` / `reviews.rating_count` only, plus the visible "4.6/5" and "(128)" (both `aria-hidden`; the stars' `role="img"` label and a visually hidden `anvil.stars.count` carry the meaning) |
| `button` | `label` ("Shop now"), `link` (`/collections/all`), `style` (primary), `label_2`, `link_2`, `style_2` (secondary), `size` (md) | up to two `anvil-button` links. A button needs both a label and a link |
| `atc` | `product` (product), `label` ("Add to cart"), `show_price` (true), `style` (primary / secondary) | price (`anvil-price`) and either a one-click product form, a link to the product, or a disabled "Sold out" button (see "Add to cart") |

The `stars` and `atc` blocks fall back to the template's `product` when their product setting is empty, so on a product page (including `product.landing`) they follow the page's product. On other templates `product` is nil and the block needs a product picked.

The preset "Image with text" ships eyebrow, heading ("Example heading — say what **changes** for the shopper", size lg), text, checklist (three "Example: …" lines) and buttons ("Shop now" → `/collections/all`; the second button is empty and hidden). It has no stars or add-to-cart block, because those need a product.

## Markup and behaviour
- Structure: `anvil-section-attrs` → `.av-section__inner` → `anvil-section-head` → `.av-image-text` (grid) holding `.av-image-text__media` (the `anvil-media` box, which has the theme's media radius, border and shadow through `.av-media-frame`) and `.av-image-text__content` (the blocks).
- Layout: on phones it is one column, and `--m-bottom` puts the media after the text (`order: 2`). From 750 px the columns are `var(--av-image-text-media) minmax(0, 1fr)`, reversed for `--right`. The gap is `--av-space-6`, `--av-space-7` from 750 px and `--av-space-8` from 990 px. The `--v-top` / `--v-bottom` classes set `align-items`.
- Content alignment: the classes `--ca-m-<left|center|right>` (phones) and `--ca-d-<…>` (from 750 px) set two custom properties: `--av-it-text` (text-align) and `--av-it-items` (flex alignment). The content column is a flex column, so a centred checklist, button row or price stays a centred group while the checklist lines stay start-aligned.
- Headings: the chassis heading is `<h2>`, and heading blocks are always `<h3>` (spec card A11y line, CONVENTIONS §3). When the section heading is blank and at least one heading block renders, a visually hidden `<h2>` (`anvil.a11y.highlights`, "Highlights") sits above the row, so the outline never jumps from the page's `<h1>` to an `<h3>`. This is the same pattern as feature-grid, multirow, icon-content and timeline. With no heading block at all, no hidden heading is added.
- Images, side by side: `widths: '375, 550, 750, 900, 1100'` (the 1100 px "half" cap), plus 1500 when the section is full width. `sizes` comes from `media_width` and `settings.page_width` / `narrow_width`. For example, page width 1400 at 50 % gives `(min-width: 1400px) 700px, (min-width: 750px) 50vw, 100vw`.
- Images, alone (`--solo`, see "Empty states"): the media spans the inner width, so `widths` run to the 2200 px full-bleed cap (`375, 550, 750, 1100, 1500, 1800, 2200`) and `sizes` is `(min-width: <page or narrow width>px) <that width>px, 100vw`, or `100vw` when the section is full width.
- Loading: `section.index` restarts at 1 inside each section group (shopify.dev `section` object), so the index is read only when `section.location` is `template` (or legacy `content_for_index`). There, media in the first two sections loads eagerly, and the first section's media gets `priority` (fetchpriority high and preload) only when `show_on` is `all`, so a section hidden on phones or desktop never preloads a hidden image there. In the footer or a custom section group the media is always lazy. With a nil index (editor, Section Rendering API) it is eager without priority. Empty media shows the `lifestyle-1` placeholder.
- Add to cart (`atc`):
  - An available product with a single variant renders a native `{% form 'product' %}` with that variant's `id` and quantity 1, inside `<anvil-product-form form-id="<form id>">`. The `form-id` attribute is required: the element finds its form with `closest('form')` (ancestors only) or `getElementById(form-id)`, and here the form is its child. A single variant counts as one-click even when it has a named option (for example "Color: Black"), the same test as `anvil-product-card` and the sibling sections (`has_only_default_variant or variants.size == 1`). Without JavaScript the form posts to `/cart/add` as usual. With `assets/anvil-product.js` (loaded by this section with a module script, only when such a form renders; module URLs dedupe, and product pages load it anyway), the submit is intercepted and the add goes through `cartAdd` with the `anvil-cart-drawer` and `anvil-cart-bubble` sections re-rendered. Success is announced in the open drawer if one is open; otherwise the form's status region speaks and the button label (`data-anvil-bind="add_label"`) reads "Added" for 2 s. A 4xx error from Shopify shows in the `role="alert"` box (`data-anvil-form-error`, hidden while empty); other failures fall back to the native post. With the cart type set to page, it goes on to the cart page after the add.
  - A product with more than one variant links to the product page ("Choose options", `anvil.product.choose_options`) and shows the "From" price.
  - A product that requires a selling plan, or whose variant has a minimum quantity above 1, links to the product page instead ("View product", `anvil.card.view`). A one-click add would fail there, or would silently add more than one unit.
  - A sold-out single-variant product shows a disabled secondary "Sold out" button (`anvil.product.sold_out`), named "Sold out: <title>".
  - Accessible names include the product title: a visually hidden ": <title>" inside the submit button, `aria-label` "Choose options: <title>" (or "View product: <title>") on the link, and `aria-label` "Sold out: <title>" on the disabled button. That way several add buttons on one page stay distinct, and the visible label is still part of the name (WCAG 2.5.3).
- Empty states: blocks with nothing to show are skipped on the storefront. In the editor they show a short note (`anvil.editor.block_empty`, `atc_no_product`, `rating_missing`) carrying the block's attributes, so they stay selectable. With zero blocks, the editor shows `anvil.editor.empty_section`. The blocks are rendered into a capture before the row, so the layout knows whether anything shows: on the storefront, with no blocks or with blocks that all render nothing (a stars block without a rating metafield, an atc block with no product off product pages, a buttons block with no link), the content column is dropped and the media spans the row (`--solo`) with full-row image `sizes`. In the editor every block shows at least its note, so the two-column layout stays.
- Motion: none of its own. The chassis `reveal` and the video autoplay both respect `prefers-reduced-motion` and `html[data-animations="off"]` through the shared code.
- CSS: the `{% stylesheet %}` body is 3,278 bytes raw and 837 bytes gzipped (limit 6,144 raw). Every selector starts with `.av-image-text`. No asset files are added. The only script loaded is the shared `assets/anvil-product.js` (22,976 B raw, 7,519 B gzipped, budget 8,192), and only when an add-to-cart form renders.

## Honesty notes
- Stars come only from the `reviews.rating` metafield a review app writes. There is no typed rating and no typed review count. Without a metafield nothing renders, and the editor explains why.
- The price comes from `anvil-price` (compare-at only). There is no "you save" field or badge text.
- The eyebrow, heading, text and checklist each carry an `info` on what is honest to enter: "Best seller" or "New" must be true, claims such as "clinically proven" need evidence, and results, guarantees and delivery times must match the policies. The image `info` asks for images the merchant is entitled to use. No logos ship.
- Defaults read as examples ("Example eyebrow", "Example heading — …", "Example text — …", "Example: first benefit — replace me"). The preset's one button ("Shop now") links to all products, so it works on an unedited store and promises nothing.
- The add-to-cart block never adds a variant the shopper did not see: a product with options goes to the product page.

## Checks run (2026-10-15)
- First build: `shopify theme check --fail-level warning` (whole theme, 201 files): 0 findings in this file. The 34 findings in the tree are `TranslationKeyExists` in 11 other builders' sections (compare-table, feature-grid, image-banner, image-gallery, multicolumn, multirow, product-videos, review-wall, testimonials, ticker-vertical, timeline).
- `scripts/chassis-lint.py --only sections/anvil-image-text.liquid --strict`: clean. Whole repo: clean (6 warnings, all in `anvil-image-banner`).
- `scripts/cleanroom-lint.sh`, `scripts/asset-audit.py`, `scripts/check-limits.sh`: clean.
- Render check: the exact `{% stylesheet %}` body plus `assets/anvil-base.css` and hand-written scheme tokens, with mock markup of three setups, in local headless Chromium at 1280 px and 375 px. The setups: left image 1:1 with left text; right image 4:5 at 60 % with a centred card in a second scheme and the image below on phones; left image 16:9 at 40 % with right-aligned text, bottom-aligned. This was not a Shopify render, and the harness push (G3) will be the first real one. `scripts/gate.sh` was not run as a whole, because its paths gate uses git, which this wave forbids. Each static gate was run on its own.

## Review fixes (2026-10-15)
- Major: `<anvil-product-form>` now has `form-id="{{ form_id }}"`. Without it the element found no form, the module loaded for nothing and every add posted natively.
- Major: the eager/priority logic reads `section.index` only for `section.location == 'template'` (or `content_for_index`); section-group placements are lazy. Priority also needs `show_on: all`. Both facts checked on shopify.dev (the `section` object: "The `index` starts at 1 within each location").
- Minor: a single variant with a named option adds in one click (`has_only_default_variant == false and variants.size > 1` is the only "Choose options" case). Checked on shopify.dev: `has_only_default_variant` is true only when the product has no options.
- Minor: blocks render into a capture first; when nothing shows, the row goes `--solo` and the image gets full-row `sizes` and widths up to 2200. This fixes both the blank half column (all blocks empty) and the soft solo image. The dead `:empty` rule was dropped.
- Minor: the disabled "Sold out" button is named "Sold out: <title>".
- Minor: heading blocks are always `<h3>`, with a visually hidden `<h2>` when the section heading is blank (new key `anvil.a11y.highlights`).
- Minor: the checklist cap counts only non-blank lines (the loop stops after 12 items instead of `limit: 12` on the raw lines).
- Gates after the fixes: theme check reports only `TranslationKeyExists` for `anvil.a11y.highlights` in this file (expected until the integrator adds the key; the other findings in the tree are other wave sections' keys). chassis-lint `--only … --strict` clean (the whole-repo run has errors only in other builders' in-progress files: columns, hero-slideshow, pricing). cleanroom-lint, asset-audit and check-limits clean. Not re-rendered in a browser: the changes are Liquid logic, one attribute and one removed CSS rule.

## Uncertainties and assumptions
- Heading levels: resolved in review. Heading blocks are always `<h3>` with a visually hidden `<h2>` fallback, as the card and CONVENTIONS §3 say. (`anvil-image-banner` still promotes its heading blocks to `<h2>`; that file is not this section's to change.)
- The `atc` block loads `assets/anvil-product.js` (22,976 B raw, 7,519 B gzipped) for one button. The card says "JS: none … enhanced when present". The wave brief names `<anvil-product-form>` as the way to add to cart, and without the module, home-page adds would leave the page for `/cart`. The first build forgot the `form-id` attribute, so the enhancement never attached; it is now set (review fix). If the owner prefers zero JS here, removing the one `<script>` line keeps the native form working.
- `anvil-product-card.liquid` and `blocks/anvil-product-atc.liquid` render `<anvil-product-form>` without loading the module themselves, so off product pages their quick-add posts natively. This is not changed here; noted for the integrator.
- `b.product | default: product` relies on the `product` global being available to sections on product templates (shopify.dev documents it for product templates); Theme Check raised nothing.
- The card reuses Theme settings > Containers (`.av-box`), not Theme settings > Cards, because it is a text container rather than a product card.
- The checklist reads plain text lines (textarea), so lines cannot carry bold or links. A richer list would need the `text` block's rich text.
- One new locale key for the integrator: `anvil.a11y.highlights` = "Highlights" (the visually hidden `<h2>`). Every other storefront string uses an existing key: `anvil.product.add_to_cart` (fallback for a blank label), `choose_options`, `sold_out`, `anvil.card.view`, `anvil.stars.count`, `anvil.editor.block_empty`, `atc_no_product`, `rating_missing`, `empty_section`.

## Integration pass (2026-10-15)
- Hidden heading uses `anvil.a11y.highlights`. The card snippet and the Add to cart block now bind to `anvil-product.js`, so every add-to-cart in the theme goes through the drawer.
- Placed on `templates/index.json` (media right) and `templates/product.landing.json`.

## Fix pass (2026-10-15)
- Setting ids follow the theme-wide vocabulary (CONVENTIONS §5; DECISIONS 82–100); the tables above use the new ids: `ratio` → `image_ratio`, `media_width` → `image_width`, `media_side` → `image_side`, `media_side_mobile` → `image_side_mobile`, `v_align` → `valign`, `box_style` → `box`, `content_align` → `text_align`, `content_align_mobile` → `text_align_mobile`, `buttons` → `button`. Saved templates were migrated.
- Uses the shared pieces: eager or lazy media from `snippets/anvil-above-fold` (DECISIONS 85); the editor-only empty note from `snippets/anvil-editor-empty` (DECISIONS 87); a hidden fallback heading through `anvil-section-head` (DECISIONS 84).
- Availability: `disabled_on` groups ["header","custom.overlay"] (CONVENTIONS §4, DECISIONS 100).
