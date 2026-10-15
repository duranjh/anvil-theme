# Multirow — `sections/anvil-multirow.liquid`

_Section card, 2026-10-15. Built from `docs/agent-prompts/multirow.md` (CONVENTIONS, spec card, chassis API, exemplars)._

## Purpose
Up to 10 stacked rows. Each row puts an image (or a video) beside a block of text, and the image can switch sides from row to row. Use it for "how it works" steps, materials and features, or a brand story. Spec card: `docs/spec/multirow.md`. Design row: `docs/DESIGN-sections.md` §3 "Standard sections" (`anvil-multirow`, about 220 lines). The SPEC §4.1 standard list names it. Phones stack every row with the image above the text. From 750 px each row has two columns. No JavaScript.

## Settings
The 13 chassis settings come first, pasted verbatim from CONVENTIONS §4. A header "Multirow" follows, then 10 section settings under the sub-headers "Images" and "Text and button". That makes 23 settings in total (the limit is 40).

| id | type | default | what it does |
|---|---|---|---|
| `image_side` | select `left` / `right` | `left` | side of the image in the first row. Its `info` says phones always show the image above the text |
| `alternate` | checkbox | true | switches sides on every second row. Off: every row uses `image_side` |
| `row_gap` | range 0–128 step 8 px | 64 | space between rows, written inline as `--av-multirow-gap`. Phones use 60 % of it |
| `image_ratio` | select `adapt` / `1:1` / `4:5` / `3:4` / `16:9` | `1:1` | image shape, passed to `anvil-media`. `adapt` follows each image's own shape |
| `image_fit` | select `cover` / `contain` | `cover` | crop to the shape, or fit inside it |
| `image_width` | range 30–70 step 5 % | 50 | the image's share of the row on desktop (≥ 990 px), written inline as `--av-multirow-media`. From 990 px the share is capped at `max(50%, 100% - 20rem)` of the row, so the text and the column gap always keep about 320 px unless that would push the image under half the row (Narrow width at 600–700 px is the one case where the 50 % floor wins). Tablets (750–989 px) show at most 50 %. Phones show the image at full width. Its `info` says the image narrows when the text would get too little room |
| `text_align` | text_alignment | `left` | text alignment. The button follows it, and the text box (max 36 rem) sits at the start, middle or end of its column |
| `valign` | select `top` / `center` / `bottom` | `center` | where the text sits beside the image when the two differ in height (`align-items` on the row grid) |
| `title_size` | select `sm` / `md` / `lg` / `xl` | `lg` | row heading at `--av-text-lg` / `-xl` / `-2xl` / `-3xl` |
| `button_style` | select `primary` / `secondary` / `link` | `secondary` | solid button, outline button, or a text link with an `arrow-right` icon (all from `snippets/anvil-button`) |

`schema.name` is "Multirow" (8 characters). `max_blocks: 10`, per the spec card. `disabled_on.groups: ["*"]`, because it is a template section, like the FAQ and Feature grid.

## Blocks
Local block `row`. `{{ block.shopify_attributes }}` is on each row `<li>`.

| id | type | default | note |
|---|---|---|---|
| `image` | image_picker | — | `info`: show the real product or result, and only images the merchant may use. The alt text comes from the image's own alt in Files |
| `video` | video | — | a Shopify-hosted video. It replaces the image (`anvil-media` order: video, then video_url, then image). `info`: show the real product in use, and only footage the merchant has the right to use |
| `video_url` | video_url (`youtube`, `vimeo`) | — | replaces the image, which becomes the cover. `anvil-media`'s click-to-load facade means nothing loads from YouTube or Vimeo until the shopper presses play. `info` carries the same real-product and rights note as the uploaded video |
| `video_autoplay` | checkbox | false | uploaded video only. It plays muted on a loop while in view, and only when the shopper allows motion: `anvil-media` writes `data-anvil-autoplay` and `anvil-core.js` decides. The controls stay visible (WCAG 2.2.2) |
| `eyebrow` | text | — | the short label above the heading. `info`: words like "Best seller" or "New" only where they are true |
| `heading` | inline_richtext | "Example row heading — replace it" | `<strong>` becomes the accent span in the section's own `accent_style`, the same way `anvil-section-head` does it. `info` covers claims such as "best-selling" or "clinically proven" |
| `text` | richtext | `<p>Example text — describe one feature, material or step in your own words.</p>` | `info`: results, guarantees and delivery promises must match the product and the store's policies |
| `button_label` | text | "Example: Read the full story" | `info`: the button shows only once the row has a link; replace the example with words that say where it goes (for example "See how it is made") |
| `button_link` | url | — | |

The preset "Multirow" ships the heading "Example heading — how it **works**" and three rows. Their eyebrows read "Example — step 1/2/3", their headings start with "Example:" and their texts start with "Example text —". Only the first row has a link (`/collections/all`, labelled "Shop now"), so the unedited preset shows one button. The other two keep the default label with no link, so they show no button.

## Markup and behaviour
- Structure: `anvil-section-head`, then `<ul class="av-multirow …" role="list">` holding one `<li class="av-multirow__row av-multirow__row--media-left|right">` per block. The rows are a set of parallel items (often steps), so screen readers announce a list with an item count, and each image belongs to its own item instead of sitting under the previous row's `<h3>` (CONVENTIONS §9, like Feature grid's `<ul>` and Timeline's `<ol>`). `role="list"` keeps the list semantics in WebKit once `list-style` is removed; `.av-multirow` also sets `margin:0; padding:0; list-style:none`. Each row has the `anvil-media` box (`.av-multirow__media`) followed by `.av-multirow__content`, which holds `<p class="av-multirow__eyebrow">`, `<h3 class="av-multirow__title">`, `.av-multirow__text.av-rte` and `.av-multirow__action`.
- DOM order is always image, then text. On a "right" row only the visual placement changes: from 750 px the media is placed with `grid-column: 2; grid-row: 1` and the text with `grid-column: 1; grid-row: 1`, so the reading order is the same on every row and on every device (WCAG 1.3.2). Explicit placement (not `order`) keeps an image-only right row in its own right-hand column; with `order` the single item auto-placed into the left `1fr` text column.
- Sides are worked out in Liquid over the rows the storefront shows, not with `:nth-child`. A row skipped on the storefront therefore never breaks the left/right pattern. In the editor, an empty row is kept but not counted: it takes the side the next real row would get (`shown | plus: 1`, not stored), so every real row shows on the same side in the editor as on the live page. The same counter drives the eager first image, which only a real row can take.
- Heading levels: row titles are `<h3>`. When the section heading is blank and at least one row has a heading, a visually hidden `<h2>` (`anvil.a11y.highlights`, "Highlights") sits above the rows, so the outline never jumps from the page's `<h1>` to `<h3>` (CONVENTIONS §3). The check uses `section.blocks | map: 'settings' | map: 'heading'`, not a second loop: the chassis lint inspects every `for … in section.blocks` loop for `shopify_attributes`.
- Layout: each row is a CSS grid. Phones: one column, image then text, `--av-space-5` apart. From 750 px the image track is `--av-multirow-col: min(var(--av-multirow-media), 50%)` and the row is `var(--av-multirow-col) minmax(0, 1fr)`, mirrored for right rows. From 990 px only the track changes, to `min(var(--av-multirow-media), max(50%, 100% - 20rem))`: the chosen share applies unless it would leave the text and gap less than 20 rem of the row (Narrow width, or Page width near 990 px at 60–70 %). The cap is relative to the row, not the viewport, so it holds at every chassis width. The column gap is `clamp(--av-space-6, 4vw, --av-space-8)`.
- Buttons: a row gets a button only when it has both a label and a link, so no button ever leads nowhere. Text-link buttons keep no padding and a 24 px minimum height inside the row (`.av-multirow__action .av-btn--link`). This is a known deviation from CONVENTIONS §3, see Uncertainties.
- Images: `widths: '360, 540, 720, 900, 1100'`. That is the 1100 px "half" cap from CONVENTIONS §11; a phone at 3× density showing a full-width image needs it. 1500 is added for full-width sections, and for page or narrow widths whenever the desktop slot (`max_inner × image_width / 100`) is over 1100 px, for example page width 1800 at 70 % (1260 px). The CSS cap can only make the image smaller than the `sizes` value, so `sizes` stays a safe overestimate. `sizes` follows the breakpoints and `settings.page_width` / `narrow_width`. Two examples:
  - Page width 1400 at 50 % gives `(min-width: 1400px) 700px, (min-width: 990px) 50vw, (min-width: 750px) 50vw, 100vw`.
  - Narrow 800 at 65 % gives `(min-width: 990px) 520px, (min-width: 800px) 400px, (min-width: 750px) 50vw, 100vw`.
- Loading: images are lazy, except in the first two sections (or when `section.index` is nil, which shopify.dev lists for static sections, the editor and the Section Rendering API), where the first real row loads eagerly. In the first section that row also gets `priority` (fetchpriority high and preload). `anvil-media` writes the aspect-ratio box, so nothing shifts while images load. Empty media show the `lifestyle-1` and `lifestyle-2` placeholders in turn.
- Empty rows: a row with no media, no eyebrow, no heading, no text and no button is skipped on the storefront. The editor keeps it, with a placeholder image, so the merchant can still select it. A row with media but no text shows the image in its own column (left or right, by its turn) with an empty text column. With zero blocks the shopper sees nothing and the editor shows `anvil.editor.empty_section`.
- Motion: the section has no motion of its own. The chassis `reveal` setting and video autoplay both respect `prefers-reduced-motion` and `html[data-animations="off"]`.
- CSS: the `{% stylesheet %}` body is 2,899 bytes raw and 1,002 bytes gzipped (limit 6,144 raw). Every selector starts with `.av-multirow`. There are no asset files and no JavaScript.

## Honesty notes
- Every free-text field that could carry a claim (eyebrow, heading, text) has a one-sentence `info` on what is honest to enter, and so do the image, the uploaded video and the YouTube/Vimeo link: show the real product or result, and only media the merchant has the right to use (CONVENTIONS §10, HONEST.md). The section has no badge, rating, price, stock or timer field.
- Defaults read as examples ("Example row heading — replace it", "Example text — …", "Example — step 1").
- No platform logos ship. The image `info` asks for artwork the merchant is entitled to use.

## Checks run (2026-10-15)
- `shopify theme check --fail-level warning` on the whole theme (194+ files): this file's only finding is `TranslationKeyExists` for `anvil.a11y.highlights`. The integrator adds that key at wave end. Every other finding in the tree is the same check in other builders' files: ticker-vertical, timeline, feature-grid, testimonials, image-gallery, multicolumn, compare-table, review-wall and product-videos.
- `scripts/chassis-lint.py --only sections/anvil-multirow.liquid --strict`: clean. Whole repo: clean.
- `scripts/cleanroom-lint.sh`, `scripts/asset-audit.py`, `scripts/check-limits.sh`: clean.
- Render check: mock markup that mirrors the Liquid output, with the exact `{% stylesheet %}` body and `assets/anvil-base.css`, in local headless Chromium at 375, 820 and 1280 px. Three setups were tested:
  - left-aligned, middle, 50 %, alternating, outline buttons
  - centred, top, 40 %, right first, text links, no section heading (hidden `<h2>`)
  - right-aligned, bottom, 65 %, full width, alternate off, solid buttons
- Results: no horizontal scroll at any width. At 1280 px the media measured exactly 50 / 40 / 65 % of the inner width. At 820 px the 65 % image was capped to 50 %. Bottom alignment lined up the text's bottom edge with the image's. This was not a Shopify render; the harness push (G3) will be the first real one.
- Review fixes, re-checked the same day (same mock method, `<ul>`/`<li>` markup, gutter 40, heading "Example: show the product doing its job", rows: left with text, right image-only, right with text), at 500 (headless minimum), 820, 990 and 1280 px:
  - Image-only right row: now in the right-hand column at its own width (page width, 40 %, 1280 px: media x 720, width 480; before the fix it sat at x 0, width 693).
  - Narrow 800 at 70 %: text column 280 px at 990 and 269 px at 1280 (before: 176 and 165). Page width 1400 at 70 % and 990 px: 280 px (before: about 233). Narrow 600 at 70 %: 220 / 209 px, the 50 % floor (before: 105).
  - Page width at 40 % and 70 %, full width at 70 %: the share applies in full at 1280 px (480 / 840 px of 1200). Tablet (820 px) still caps at half.
  - No horizontal scroll at any width; the list shows no markers and no margin.
- Gates after the fixes: theme check on this file still reports only `TranslationKeyExists` for `anvil.a11y.highlights`; chassis-lint `--only … --strict`, cleanroom-lint, asset-audit and check-limits clean. The whole-repo chassis-lint now reports errors only in other builders' in-progress files (columns, hero-slideshow, pricing).

## Uncertainties and assumptions
- The visually hidden `<h2>` says "Highlights" whatever the rows hold, following CONVENTIONS §3 the way Feature grid does ("Features"). Owner call if a different word reads better.
- "Content alignment" in the spec card is read as text alignment (`content_align`). The vertical position beside the image (`content_valign`) was added as a separate setting, because a two-column row needs it once the image and text differ in height.
- Tablets capping the image at half the row is a layout choice of this section; the `image_width` `info` says so. The tablet rule keeps the hard 50 % cap instead of the desktop `max(50%, 100% - 20rem)` expression: at tablet row widths the hard cap is the stricter of the two, and it keeps the tablet `sizes` value (`tablet_pct`) exact.
- From 990 px, a row narrower than 40 rem (Narrow width at 600–700 px) keeps the 50 % floor, so a 50–70 % image leaves a text column of about 210–230 px there. Dropping the floor would shrink the merchant's image below half the row; the 50 % floor matches the tablet behaviour.
- Known deviation from CONVENTIONS §3 ("do not restyle components, compose them"): `.av-multirow__action .av-btn--link{min-height:24px;padding:0}` stays for this wave. `anvil-base.css` defines `.av-btn--md` and `.av-btn--has-icon` after `.av-btn--link`, so a link-style button built with `size: 'md'` and an icon gets a 48 px control height and padding back. Feature grid, Multicolumn and Icon content carry the same patch. Asked of the core owner: one rule such as `.av-btn.av-btn--link{min-height:24px;padding:0}` placed after the size and has-icon rules in `anvil-base.css`; this line is then deleted.
- The eyebrow is a `<p>` before the `<h3>`, not part of the heading. Screen-reader users who jump between headings hear the title alone, which is the usual pattern for a kicker line.
- Wave rule: no locale or shared-asset edits. The one new key is listed in the builder's output for the integrator.

## Integration pass (2026-10-15)
- The link-button fix lives in `anvil-base.css` and the section rule was removed; the hidden heading uses `anvil.a11y.highlights`.

## Fix pass (2026-10-15)
- Setting ids follow the theme-wide vocabulary (CONVENTIONS §5; DECISIONS 82–100); the tables above use the new ids: `ratio` → `image_ratio`, `content_align` → `text_align`, `content_valign` → `valign`. Saved templates were migrated.
- Uses the shared pieces: eager or lazy media from `snippets/anvil-above-fold` (DECISIONS 85); the editor-only empty note from `snippets/anvil-editor-empty` (DECISIONS 87); a hidden fallback heading through `anvil-section-head` (DECISIONS 84).
- Availability: `disabled_on` groups ["header","custom.overlay"] (CONVENTIONS §4, DECISIONS 100).

## Honest-defaults pass (2026-10-15)
- `button_label` defaults to "Example: Read the full story": a row has no heading link to fall back on (the button needs a label), so the default reads as an example and the README's "Example:" sweep finds it (DECISIONS 142, superseding that part of 125). The preset's first row keeps "Shop now".
