# Multicolumn — `sections/anvil-multicolumn.liquid`

_Section card, 2026-10-15. Wave 4 (standard sections). Built from `docs/agent-prompts/multicolumn.md` (CONVENTIONS, spec card, chassis API, exemplars)._

## Purpose
A grid of up to 12 columns. Each column shows an image, an icon or nothing above a heading, a short text and an optional link. Use it for benefits, how-it-works steps, materials, or links to other pages. Spec: `docs/spec/multicolumn.md`; listed in SPEC §4.1 ("Multicolumn") and DESIGN-sections §3 "Standard sections"; SPEC §5 puts it on the product landing template after "image with text". Desktop shows 1 to 6 columns, phones 1 or 2. On phones the columns can be a grid or a swipe row. JavaScript loads only for the swipe row (`assets/anvil-slider.js`, the shared component).

## Settings
The 13 chassis settings come first, pasted verbatim from CONVENTIONS §4. Then a header "Multicolumn" with 9 settings, under the sub-headers "Images and icons" and "Links". That makes 22 settings in total (the limit is 40).

| id | type | default | what it does |
|---|---|---|---|
| `cols_desktop` | select `1`–`6` | `3` | columns at ≥ 990 px. Tablets (750–989 px) show `min(cols, 3)`, except 4, which shows 2 so four columns fill 2 × 2 instead of 3 + 1 (computed in Liquid; the `info` says so) |
| `cols_mobile` | select `1` / `2` | `1` | columns below 750 px. At 2 the gap drops to `--av-space-3`, headings to `--av-text-md`, text to `--av-text-sm` and card padding to `--av-space-3` |
| `mobile_layout` | select `grid` / `swipe` | `grid` | `swipe` turns the list into `<anvil-slider>` on phones: one row, scroll-snap, part of the next column showing (40 px peek with 1 column, 24 px with 2), dots below when the row scrolls. From 750 px the same markup wraps into the grid. The `info` also says that screen readers still announce a carousel on tablets and desktop (see Open questions) |
| `center_row` | checkbox | true | centres a short last row, and a row with fewer columns than the grid has (grid on every width; swipe from 750 px, never on the phone row, where centring would hide the first column) |
| `card_style` | select `plain` / `card` | `plain` | `card` puts each column on a light tint (`rgb(--av-fg-rgb / 0.04)`) with the card border width, radius and shadow from Theme settings > Cards (`--av-border-w-card`, `--av-radius-card`, `--av-shadow-card`). The tint keeps the card visible when the theme sets a zero border and no shadow. In card style an image reaches the card edges and the card clips it to its radius |
| `text_align` | text_alignment | `center` | text, icon and button alignment inside each column |
| `image_ratio` | select `adapt` / `1:1` / `4:5` / `3:4` / `16:9` / `21:9` | `1:1` | image shape, passed to `anvil-media` |
| `icon_size` | range 16–96 px, step 4 | 40 | size of the Lucide icon, or of an uploaded icon image |
| `button_style` | select `primary` / `secondary` / `link` / `link_arrow` | `link_arrow` | the column link: solid button, outline button, text link, or text link with an `arrow-right` icon (all from `snippets/anvil-button`) |

`schema.name` is "Multicolumn" (11 characters), `max_blocks: 12`, `disabled_on.groups: ["header", "custom.overlay"]`, so it works on every template and in the footer group. Outside a template (footer group, any other group, static render) it never loads images eagerly or asks for priority (see Images).

## Blocks
Local block `column`. `{{ block.shopify_attributes }}` is on each item (`<li>` in the grid, `<div data-slider-slide>` in the swipe row).

| id | type | default | note |
|---|---|---|---|
| `media` | select `image` / `icon` / `none` | `image` | what sits above the words: an image in the ratio box (placeholder when no image is picked), an icon, or nothing ("Text only") |
| `image` | image_picker | — | image mode: the column image. Icon mode: drawn at the icon size instead of the Lucide icon (a custom icon). Its `info` asks for the real product or result and for images the merchant may use |
| `icon` | select (68 Lucide names) | `check-circle` | icon mode without an image. Every value exists in `snippets/anvil-icon-*` (checked by script) |
| `heading` | text | "Example column — replace me" | `info` on claims such as best-selling or clinically proven |
| `text` | richtext | `<p>Example text — describe one real benefit in a sentence or two.</p>` | `info`: results, guarantees and delivery times must match products and policies |
| `button_label` | text | blank | `info`: leave empty and the heading becomes the link; a label shows as a button once the column has a link and should say where it goes (for example "See the size guide") |
| `button_link` | url | — | |

The preset "Multicolumn" ships an example heading ("Example heading — what sets it **apart**") and three image columns whose headings start with "Example column —" and texts with "Example text —". The columns have no links, so no button shows until the merchant adds one. The empty images show the `collection-1` to `collection-6` placeholders in turn.

## Markup and behaviour
- Structure: `anvil-section-head`, then the list root `.av-multicolumn` holding `.av-multicolumn__list` and items `.av-multicolumn__item` > `.av-multicolumn__card` > the `anvil-media` box (`.av-multicolumn__media`) and `.av-multicolumn__body` (`.av-multicolumn__icon`, `<h3 class="av-multicolumn__title">`, `.av-multicolumn__text.av-rte`, `.av-multicolumn__action`).
- Grid layout: the root is a `<div>`, the list a `<ul role="list">` (the explicit role keeps the list announced in WebKit/VoiceOver, which drops it under `list-style: none`), the items `<li>`. Swipe layout: the root is `<anvil-slider class="av-multicolumn … av-multicolumn--swipe" per-view per-view-desktop peek dots aria-label>`, the list `<div data-slider-track>` and the items `<div data-slider-slide>`, because the slider gives slides `role="group"`, which a `<ul>` may not contain. The tag names are Liquid variables, so no element opens in one branch and closes in another. Liquid writes `--av-slider-per-view`, `--av-slider-per-view-desktop` and `--av-slider-peek` inline and, when the phone row can scroll (more columns than `cols_mobile`, the same rule as the peek), the `dots` attribute and the empty `.av-slider__dots` row, so nothing moves when the script runs (CONVENTIONS §6). A row that fits on the phone gets no dots attribute and no dots row, so no blank 40 px band sits under it. The slider's `aria-label` is the section heading as plain text (`strip_html | escape_once`, because the heading is stored as HTML and translations come back escaped; plain `escape` would turn "Fish & chips" into `Fish &amp;amp; chips`), or `anvil.a11y.highlights` when it is blank. The hidden `<h2>` uses `escape_once` for the same reason.
- Column widths: flexbox with `flex-wrap`, each item's basis `(100% − (cols − 1) × gap) / cols`, the column count in `--av-multicolumn-cols`, set by the classes `--m1/2`, `--t1/2/3`, `--d1…6`. Flexbox, not grid, so `center_row` can centre a short row. Items in a row stretch to equal height and `margin-top: auto` puts every button on the same line. The gap is the theme's `--av-grid-gap`.
- Swipe to grid: on phones the slider's own rules size the slides (`--av-slider-per-view` = phone columns, minus the peek). From 750 px the section overrides the track inside its own class only (`.av-multicolumn--swipe > [data-slider-track]`: `flex-wrap: wrap`, `overflow: visible`, no snap; slides get the grid basis; the dots row is `display: none`). The track then no longer scrolls, the slider marks itself `av-is-static`, and its ResizeObserver removes the track's `tabindex`. Below 750 px the swipe track has `padding: --av-space-1` and `scroll-padding-inline: --av-space-1`, because the scrolling track (`overflow-x: auto; overflow-y: hidden`) would otherwise clip the 4 px `--av-focus-ring` of each column's button (bottom edge, and the outer edge of the first and last column with left or right alignment). Card style adds `--av-space-3` at the bottom for the card shadow. From 750 px both are reset to 0. Verified in a browser at 375, 800 and 1280 px against the real `anvil-base.css`, `anvil-slider.css` and `anvil-slider.js`: phones scroll with 5 dots for 5 columns, 800 px wraps into 2 columns with the last one centred, 1280 px wraps into 4.
- Headings: column headings are `<h3>`. When the section heading is blank and at least one column has a heading, a visually hidden `<h2>` (`anvil.a11y.highlights`, "Highlights") sits above the list, so the outline never jumps from `<h1>` to `<h3>` (CONVENTIONS §3).
- Links: a link is drawn only when something names it. Link + label: a real button link (`anvil-button` in the chosen style). Link + heading, no label: the heading text is the link. Link alone: nothing is linked. The button's accessible name gets a visually hidden copy of the column heading after the visible label (`Learn more<span class="av-visually-hidden"> – Heading</span>`), so links that all read "Learn more" are told apart in a screen-reader link list (WCAG 2.4.4) and the visible words still come first (2.5.3 label in name). One link per column, never an image link plus a button to the same URL. Text-link buttons keep no padding and a 24 px minimum height inside the column (the size class re-adds padding after `.av-btn--link`; a contextual override, as in Feature grid).
- Icons: `anvil-icon` at `icon_size`, accent colour, `aria-hidden`. An uploaded icon image uses `image_tag` with widths `size, 2 × size` (≤ 192 px, under the 200 px cap) and `alt=""` beside the words; in a column without any text it takes the image's own alt.
- Images: `widths: '300, 450, 600, 750, 900, 1100'` (one phone column at 3× density needs more than the 600 px card cap), or `'450, 750, 1100, 1500, 1800, 2200'` when desktop shows one column. `sizes` follows the column counts and `settings.page_width` / `narrow_width`, for example page width 1400 with 3 columns: `(min-width: 1400px) 466px, (min-width: 990px) 33vw, (min-width: 750px) 33vw, 100vw`; the swipe row counts 85vw (1 column) or 45vw (2) on phones; full width uses vw only. Loading: `section.index` restarts at 1 in every location (shopify.dev, section object), so the rule checks `section.location` first. Outside `template` (footer group, other groups, static) everything is lazy and nothing gets priority. In the first two template sections (or when `section.index` is nil, as in the editor), the columns that start on a phone screen load eagerly: the first `cols_mobile` columns in the grid, `cols_mobile + 1` in the swipe row (the peeking column). Lazy images that start inside a wider viewport still load at first layout. In the first template section, `priority` (fetchpriority high and preload, from `anvil-media`) goes to the first of those eager columns that is an image column with a real image, so an icon, text-only or placeholder first column does not use it up. `anvil-media` writes the aspect-ratio box, so nothing shifts.
- Empty columns: a "Text only" column with no heading, text or named link is skipped on the storefront and kept in the editor with `anvil.editor.block_empty`, so it can still be selected. Image and icon columns always render (placeholder, icon). With zero blocks the shopper sees nothing and the editor shows `anvil.editor.empty_section`.
- Without JavaScript: the grid needs none. The swipe row is a native scroll-snap row (touch, trackpad, Shift + wheel); the dots row, when rendered, stays empty.
- Keyboard: links and buttons are in reading order. In the swipe row `anvil-slider.js` makes the track focusable while it scrolls and adds ArrowLeft / ArrowRight; the dots are buttons. `shopify:block:select` scrolls the row to the selected column (slider behaviour).
- Motion: none of its own. Smooth scrolling and dot transitions come from `anvil-slider.css` behind `prefers-reduced-motion` and `html[data-animations="off"]`; the chassis `reveal` setting follows the same rules. The slider has no autoplay here.
- CSS: the `{% stylesheet %}` body is 4,960 bytes raw, 1,286 bytes gzipped (limit 6,144 raw); every selector starts with `.av-multicolumn`. No section asset files; the swipe row loads the shared `anvil-slider.css` (`stylesheet_tag`) and `anvil-slider.js` (module) only when it is chosen.

## Honesty notes
- Heading, text and image each carry a one-sentence `info` on what is honest to enter (CONVENTIONS §10, HONEST.md). There is no badge, rating, price, counter or timer field.
- Defaults read as examples ("Example column — …", "Example text — …"). Preset columns ship without links, so an unedited publish shows no buttons that lead nowhere.
- No platform logos ship; the image `info` asks for artwork the merchant is entitled to use.

## Locale keys (added by the integrator)
- `anvil.a11y.highlights` = "Highlights" (hidden `<h2>` and the swipe row's accessible name when the section heading is blank)
- Reused: `anvil.editor.empty_section`, `anvil.editor.block_empty`.

## Open questions
- In swipe mode the slider's ARIA (`role="region"`, `aria-roledescription="carousel"`, slides "N of M") stays on tablets and desktop, where the same element is a wrapped grid that does not scroll. It is announced as a carousel that never moves, and the list semantics of the grid layout are lost there. A fix belongs in `anvil-slider.js`, which this section may not edit: in `#layout()`, when the track does not scroll, remove `role`, `aria-roledescription` and `aria-label` from the host (ARIA does not allow a name on a generic element) and from each slide, and put them back, including the author's own `aria-label`, when it scrolls again. Until then the `mobile_layout` `info` names the trade-off for merchants.
- The swipe track is not focusable without JavaScript (the slider adds `tabindex` only once it runs and only while the row scrolls), so a keyboard user without JavaScript reaches the hidden columns only through their links. Same as every other `anvil-slider` user.
- `media` ("Show": Image / Icon / Text only) is a per-column setting the spec card does not name. It lets one section mix image and icon columns and keeps the CONVENTIONS §12 placeholder for an image column whose image is empty.

## Integration pass (2026-10-15)
- `anvil-slider.js` drops the carousel roles while every slide fits, so the wrapped desktop grid is no longer announced as a carousel. The link-button patch moved to `anvil-base.css`; the hidden heading uses `anvil.a11y.highlights`.
- Placed on `templates/product.landing.json`.

## Fix pass (2026-10-15)
- Setting ids follow the theme-wide vocabulary (CONVENTIONS §5; DECISIONS 82–100); the tables above use the new ids: `link_label` → `button_label`, `link` → `button_link`. Saved templates were migrated.
- Uses the shared pieces: card boxes from `snippets/anvil-surface` and `.av-surface` (DECISIONS 83); columns from the shared `.av-grid` rule (DECISIONS 82); slider attributes, peek, arrows and dots per width from `snippets/anvil-slider-attrs` (DECISIONS 89); eager or lazy media from `snippets/anvil-above-fold` (DECISIONS 85); the editor-only empty note from `snippets/anvil-editor-empty` (DECISIONS 87); a hidden fallback heading through `anvil-section-head` (DECISIONS 84).
- Availability: `disabled_on` groups ["header","custom.overlay"] (CONVENTIONS §4, DECISIONS 100).

## Honest-defaults pass (2026-10-15)
- `button_label` has no default: with a link and no label the heading is the link, which always names the destination (WCAG 2.4.4). A default such as "Shop the collection" was wrong for most links and the "Example:" sweep would not catch it (DECISIONS 142, superseding that part of 125). The visually hidden heading copy after a typed label stays.
