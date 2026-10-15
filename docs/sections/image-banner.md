# Image banner — `sections/anvil-image-banner.liquid`

_Section card, 2026-10-15. Wave-2 section, built from `docs/agent-prompts/image-banner.md` (CONVENTIONS, spec card `docs/spec/image-banner.md`, CHASSIS-API, FORBIDDEN, two exemplars) plus `docs/HONEST.md` and `docs/DECISIONS.md`. Review fixes applied the same day (loading by location, cover-aware `sizes`, editor selection, link escaping, empty-section note, info texts)._

## Purpose
A hero image across the page or the page width, with separate desktop and phone images, and a content area over it: eyebrow, heading (the chassis heading or a local heading block), text and up to two buttons. The whole banner can be a link. No JavaScript. Design row: `docs/DESIGN-sections.md` §3, "Standard sections" (`anvil-image-banner`, ~260 lines).

## Settings
Chassis first (the 13 ids from CONVENTIONS §4, pasted verbatim). After them come a header "Image banner" and 15 section settings in three groups. Total: 28 settings, 9 block settings at most per block, schema name 12 characters.

| id | type | default | what it does |
|---|---|---|---|
| `image` | image_picker | — | desktop image, ≥ 750 px; also used on phones when `image_mobile` is empty. Its focal point drives `object-position`. Info: set a focal point, and keep words out of the image |
| `image_mobile` | image_picker | — | phone image, < 750 px (art direction through `<picture>`); on its own it serves every screen |
| `height_desktop` | select `adapt` / `sm` / `md` / `lg` / `full` | `md` | adapt = the image's own shape (aspect-ratio box); sm/md/lg = a minimum height of 440 / 560 / 720 px; full = `100svh` (`100vh` fallback) |
| `height_mobile` | select, same values | `md` | adapt = the shown phone image's shape; sm/md/lg = a minimum of 320 / 440 / 560 px; full = `100svh` |
| `overlay` | range 0–90 %, step 5 | 30 | strength of `.av-overlay` (`--av-overlay-strength`, 0–0.9); 0 renders no overlay. Info: raise it until the text reads clearly, on phones too |
| `overlay_color` | select `shadow` / `scheme` | `shadow` | the theme shadow colour (`--av-overlay-rgb`, the convention), or the section scheme's background (`--av-overlay-rgb: var(--av-bg-rgb)` inline), which always contrasts with that scheme's text colour |
| `position_desktop` | select, 9 values `top-left` … `bottom-right` | `middle-center` | where the content sits at ≥ 750 px (`justify-content` / `align-items` from inline custom properties) |
| `position_mobile` | select `top` / `middle` / `bottom` | `middle` | vertical position below 750 px; the content is full width there |
| `text_align` | text_alignment | `center` | aligns the blocks (eyebrow, headings, text, buttons) inside the content area |
| `content_width` | range 320–800 px, step 20 | 560 | maximum width of the content area at ≥ 750 px |
| `box` | checkbox | false | puts the content on a solid panel (`.av-box`, theme container radius, border and shadow) |
| `box_scheme` | color_scheme | `scheme-1` | the panel's colour scheme; `visible_if` the box is on |
| `heading_tag` | select `h2` / `h1` | `h2` | level of the banner's main heading (see Headings below). Info: where H1 applies, and that pages showing their title and a Welcome section set as the page title already have one |
| `link` | url | — | makes the whole banner a link |
| `link_name` | text | — | the banner link's accessible name; blank uses the main heading text |

The chassis `heading` / `subheading` (with `head_align`, `head_size`, `accent_style`) render inside the content area, after any leading eyebrow blocks and before every other block. `head_align` aligns that chassis heading; `text_align` aligns the blocks. `width: full` adds `av-section__inner--bleed`, so the banner runs edge to edge with no gutter. Page and narrow widths round the banner's corners with `--av-radius-media`.

## Blocks
Local blocks, `max_blocks: 6`. `{{ block.shopify_attributes }}` sits on each block's root element.

| type | limit | settings | markup |
|---|---|---|---|
| `eyebrow` | 2 | `text` (text, "Example eyebrow — replace me"; info: announce a sale or deadline only when a real discount or end date backs it), `style` (plain / accent / pill) | `<p class="av-image-banner__eyebrow">` |
| `heading` | 2 | `heading` (inline_richtext, "Example banner heading — replace me"; bold words take the chassis `accent_style`; info: promise a discount, saving or deadline only when a real Shopify discount or end date backs it), `size` (md / lg / xl → `--av-text-2xl` / `3xl` / `4xl`) | `<h1>`/`<h2>`/`<h3>` (see Headings below) |
| `text` | 3 | `text` (richtext, example paragraph; info: only true statements, and prices or savings come from products and discounts), `size` (sm / md / lg) | `<div class="av-image-banner__text av-rte">` |
| `button` | 2 | `label_1` ("Shop now"), `url_1` (default `/collections/all`), `style_1` (primary / secondary / ghost / link), `label_2`, `url_2`, `style_2` (secondary), `size` (sm / md / lg, default lg) | `snippets/anvil-button` ×2 in a wrapping flex row |

The preset "Image banner" ships an eyebrow, an xl heading with one accented word, an example paragraph and a "Shop now" button, all worded as examples. It uses `color_scheme: scheme-4` (the dark scheme, light text), `width: full`, padding 0/0, `height_desktop: lg`, `height_mobile: md` and a 30 % overlay.

## Markup and behaviour
- Structure: `.av-image-banner` (a one-cell grid) → `.av-image-banner__media` (absolute: `<picture>` or the `lifestyle-1` placeholder SVG) → `.av-overlay.av-image-banner__overlay` → optional `a.av-image-banner__link` → `.av-image-banner__content` (in flow, capped at `--av-page-width` and padded by the gutter) → `.av-image-banner__box`.
- **No layout shift.** The image fills an absolutely positioned layer with `object-fit: cover`. The box's height comes from CSS alone: `aspect-ratio` for adapt, or `min-height` otherwise. Every value is an inline custom property (`--av-image-banner-ar-m|d`, `--av-image-banner-min-m|d`), so nothing waits for the image.
- **Content never clips.** Fixed heights are minimums. For adapt, the root keeps `min-height: auto` and no `overflow: hidden`, so CSS's automatic minimum for aspect-ratio boxes lets long content stretch the banner. A render check confirmed it: a 3:2 phone banner (250 px) grew to 827 px around 763 px of text. The media layer and overlay do the clipping (`overflow: hidden; border-radius: inherit`).
- **Images.** `image_tag` uses widths `750, 1100, 1500, 1800, 2200`. The base `sizes` is `100vw` at full width; at page or narrow width it is `(min-width: Wpx) Wpx, 100vw` from `settings.page_width` / `settings.narrow_width`. A separate phone image is a `<source media="(max-width: 749px)">` with srcset widths `750, 1100, 1500` (capped at the image's own width), its own `sizes`, `width` and `height`. The `<img>` keeps the desktop image's alt text from the Files admin.
- **Cover-aware `sizes`.** `object-fit: cover` draws the image wider than the banner whenever the banner's height times the image's shape (`aspect_ratio`) beats its width. Example: the preset's 440 px phone minimum with a 16:9 image draws it 783 px wide on a 390 px phone, so `100vw` alone would pick a file about half as sharp as needed. Entries go in front of the base `sizes`:
  - phones, fixed height (sm/md/lg): `(max-width: Npx) Wpx`, where W = ceil(minimum × shape) and N = min(W, 749); skipped when W ≤ 360;
  - phones, full: `(max-width: 749px) and (orientation: portrait) calc(100vh * shape)` when shape ≥ 0.75 (on a portrait phone that is always wider than the screen); landscape phones keep the base;
  - desktop, fixed height: `(min-width: 750px) Wpx` when W ≥ the page or narrow cap (the image is always that wide), else `(min-width: 750px) and (max-width: Wpx) Wpx` when W > 750 (tablets and small laptops);
  - desktop, full: `(min-width: 750px) and (orientation: portrait) calc(100vh * shape)` for landscape images (shape ≥ 1) on portrait tablets.
  With a separate phone image, the phone entry goes on the `<source>` (without the width condition, which the `media` attribute already covers) and the `<img>` gets only the desktop entries. Adapt heights use the image's own shape, so they add nothing. Example output for the preset with a 16:9 image: `(max-width: 749px) 783px, (min-width: 750px) and (max-width: 1280px) 1280px, 100vw`.
- **LCP.** In the first two template sections (`section.location == 'template'` and `section.index` ≤ 2, or nil in the editor) the image loads `eager` with `fetchpriority="high"`. Otherwise it loads `lazy` with `fetchpriority="auto"`. `section.index` restarts at 1 in every location (shopify.dev, section object), so the location check keeps a banner in the footer group lazy. Only the first template section sends `preload: true` (a Link header), and only without a separate phone image and with the chassis `show_on` at "All devices": the header carries no media query, so the other screens would download an image they never show.
- **Focal points.** shopify.dev says `image_tag` writes the image's focal point as an inline `object-position`, and that passing `style: object-position: inherit;` overrides it. The section passes that style and puts `object-position` on the `<picture>` from `--av-image-banner-pos-m` / `-d`. Those come from `image.presentation.focal_point.x/y` (50/50 when unset), so phones use the phone image's focal point and desktop uses the desktop image's. A render check confirmed that the `<img>` inherits 50% 80% on phones and 80% 25% on desktop from the picture.
- **Whole-banner link.** Its `href` is printed with `| escape`, as `snippets/anvil-button` does. Its hidden name uses `| escape_once`, because a name taken from a heading is HTML (`strip_html` keeps entities such as `&amp;`), and plain `escape` would turn it into `&amp;amp;`. It is a stretched `<a>` (inset 0, z-index 1) with visually hidden text, before the content in DOM and tab order. The content is above it (z-index 2) with `pointer-events: none` (the `--linked` class, added for shoppers only: in the editor, `request.design_mode`, the content keeps pointer events so blocks stay hover-highlighted and click-selectable on the preview), so clicks on text and empty space go to the banner link, while `a` and `button` descendants (the buttons, links inside the text block) keep `pointer-events: auto` and their own targets. No interactive element is nested inside another. Focus draws the accent outline 6 px inside the edge over a 4 px inset band in the scheme background, so it shows on any image. With motion allowed and the theme's animations setting on, a linked banner's image scales to 1.03 on hover (transform only).
- **Buttons.** A button with a label but no link would do nothing. It is left out for shoppers, and in the editor it shows disabled as a reminder. A block whose content is empty renders nothing for shoppers, and in the editor it shows the shared `anvil.editor.block_empty` note, so it stays selectable. With no blocks and no chassis heading, the editor shows `anvil.editor.empty_section` in the content area (CONVENTIONS §1); shoppers see only the image.
- `disabled_on.groups: ["header", "custom.overlay"]`: every template and the footer group can take it.
- Reveal is the chassis setting only (already off for the first two sections). The section has no other motion.

## Headings
- The banner's main heading is the chassis `heading` when it has text, else the first `heading` block with text. It takes `heading_tag`. Later heading blocks sit one level below (h2 under an h1, h3 under an h2), so the outline never skips a level.
- `h1` applies only when all of these hold:
  - `section.location == 'template'` (never in a section group);
  - `section.index` is 1, or nil in the editor and the Section Rendering API, so the merchant sees the choice while editing;
  - the template's main section does not print its own `<h1>`: not product, collection, article, blog, search, cart, list-collections, 404 or password, and not `customers/*`.
  In every other case the main heading is an `h2`. The setting's `info` says so, and adds that pages showing their title and a Welcome section with "Use the heading as the page title" turned on already have an H1, so the merchant keeps H2 there.
- Page templates and the home page are allowed because a landing page may remove the Page section and a home page may have no Welcome section. When `main-page` stays with "Show title" on, or `anvil-welcome` keeps `title_h1` (default on) on the home page, choosing H1 makes two. The `info` names both cases (see open questions).

## Honesty notes
- No timers, stock, prices or ratings come from this section. The free-text fields a shopper reads (eyebrow, heading, text) default to visible examples. The eyebrow, heading and text blocks carry one-sentence `info` notes: announce sales, discounts, savings or deadlines only when a real Shopify discount or end date backs them, and leave prices and savings to products and discounts (HONEST.md). The chassis `heading` keeps its verbatim chassis info.
- The image `info` asks merchants to keep words out of the image (card a11y line: no text baked into images). Contrast depends on the overlay and the scheme, and the overlay `info` asks the merchant to check it on phones.

## Checks run (2026-10-15)
- After the review fixes: `shopify theme check --fail-level warning` (whole theme, 237 files): the only finding in this file is still `TranslationKeyExists` for `anvil.a11y.learn_more` (expected; the integrator adds it). The other findings belong to other wave sections. `chassis-lint --only … --strict`, `cleanroom-lint`, `asset-audit` and `check-limits` are clean for this file; the `{% stylesheet %}` is unchanged (3,974 B raw, 1,184 B gzipped), and there is still no JS. The cover-aware `sizes` strings were traced by hand, not rendered (no local Liquid engine); the harness push (G3) is the first real render.
- First build: `shopify theme check --fail-level warning` (whole theme): one finding in this file, `TranslationKeyExists` for the new key `anvil.a11y.learn_more` (expected during the wave; the integrator adds it). The other 33 findings are other wave sections' missing locale keys (compare-table, feature-grid, image-gallery, multicolumn, multirow, product-videos, review-wall, testimonials, ticker-vertical, timeline).
- `scripts/chassis-lint.py --only sections/anvil-image-banner.liquid --strict`: clean. Whole repo: clean (60 files, 0 warnings).
- `scripts/cleanroom-lint.sh`, `scripts/asset-audit.py`, `scripts/check-limits.sh`: clean.
- `{% stylesheet %}`: 3,974 bytes raw, 1,184 bytes gzipped (limit 6,144 raw). Every selector starts with `.av-image-banner`. No JS file, so the JS budget is 0 bytes.
- Render check: the exact `{% stylesheet %}` body with `assets/anvil-base.css` and mock markup in a local headless Chromium at 375×812 and 1280×800. Cases: a full-width linked banner with placeholder, fixed heights 440/720 px; page width with art direction, box, bottom-left and adapt 4:5 / 3:2; full screen top-right; adapt with long content. Measured: heights, box offsets for each position, `currentSrc` and the inherited `object-position` per breakpoint, and `elementFromPoint` on the heading (banner link) and on the button (button). This is not a Shopify render; the harness push (G3) is the first real one.

## Uncertainties, assumptions and open questions
- **Image widths.** The spec card says "widths 750–3000"; CONVENTIONS §11 caps full-bleed images at 2200. CONVENTIONS wins, so the largest width is 2200. Raise the cap in CONVENTIONS if 3000 is wanted for 4K/retina heroes.
- **Focal point override.** This relies on documented `image_tag` behaviour: a passed `style` replaces the automatic focal-point style. Confirm in the first real render that the `<img>` carries only `object-position: inherit;`.
- **H1 on page templates and the home page** cannot detect whether `main-page` (with its title shown) or `anvil-welcome` (with `title_h1` on) is in the template, so two H1s are possible. The info text now names both cases. A shared rule (for example a theme-level "page has its own H1" flag) would settle it for every hero section.
- **`anvil-hero-parallax`** copies the same loading logic (eager, `fetchpriority` and preload from `section.index` alone). It needs the same location and `show_on` gates; that file belongs to another builder.
- **Cover-aware `sizes` limits.** Landscape desktops with full height add no entry, so a very wide image (for example 3:1) on a full-screen desktop banner is drawn wider than `100vw` and picks a slightly soft file. Content that pushes a banner taller than its minimum also draws the image wider than the entry says. Both stay within one srcset step in common cases.
- **Transparent header.** With the header's "transparent on the home page" option, the header overlaps the first section. Content positioned at the top of a first-section banner can sit under the logo and menu. The banner cannot see header settings; the merchant can choose middle or bottom, or add top padding. Worth a shared answer with `anvil-hero-*`.
- **Preset scheme.** The preset uses `scheme-4` (dark) for readable light text over the overlay. If a store deletes that scheme, Shopify falls back to its default.
- **Alignment settings.** `head_align` (chassis) aligns the chassis heading; `text_align` aligns the blocks. Both default to centre. Merging them would leave a chassis setting inert or relabel it, so both stay.
- **`100svh`** has a `100vh` fallback written as two declarations. `section.index` is nil in the editor, so every banner previews eager there, which is expected.
- **Locale key needed:** `anvil.a11y.learn_more` = "Learn more", the fallback name of the whole-banner link when neither a link name nor a heading exists. Existing keys used: `anvil.editor.block_empty`, `anvil.editor.empty_section`.

## Integration pass (2026-10-15)
- The whole-banner link name falls back to the shared `anvil.a11y.learn_more`. Still open: H1 on page templates differs from the parallax hero (which refuses it).

## Fix pass (2026-10-15)
- Setting ids follow the theme-wide vocabulary (CONVENTIONS §5; DECISIONS 82–100); the tables above use the new ids: `box_width` → `content_width`, `link_label` → `link_name`, `buttons` → `button`. Saved templates were migrated.
- Uses the shared pieces: eager or lazy media from `snippets/anvil-above-fold` (DECISIONS 85); the H1 guard in `snippets/anvil-main-heading-tag` (DECISIONS 86); the editor-only empty note from `snippets/anvil-editor-empty` (DECISIONS 87); hover zoom from `.av-hover-zoom` (DECISIONS 98).
- Availability: `disabled_on` groups ["header","custom.overlay"] (CONVENTIONS §4, DECISIONS 100).
