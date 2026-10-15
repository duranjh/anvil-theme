# `anvil-compare-table`: Comparison table (section card)

_Wave-2 section. File `sections/anvil-compare-table.liquid`, editor name "Comparison table". Spec: `docs/SPEC.md` §4.2 "Comparison table"; `docs/DESIGN-sections.md` §3 row `anvil-compare-table`; spec card `docs/spec/compare-table.md`. Contract: `docs/CONVENTIONS.md` §3–§4._

## Purpose
A two-column "us vs them" table: a row label, your value and the other column's value, for up to 20 rows. It is a real `<table>` with column and row headers. On phones the first column (the row labels) stays in place while the value columns scroll sideways when they do not fit. There is no JavaScript and no asset file. Everything is in the section's `{% stylesheet %}` (6,051 B raw, under the 6,144 B chassis limit; 1,351 B gzipped).

## Markup (shopper view)
```
div#anchor.av-section.av-scheme--… .av-s-anvil-compare-table          ← anvil-section-attrs
  div.av-section__inner
    .av-section-head (h2 + subheading)                                ← anvil-section-head
    div.av-compare-table.av-compare-table--hl-<h>--icon-<i>--color-<c>--rows-<r>--align-<a>[--gradient]
        style="--av-compare-table-col: 104px; --av-compare-table-logo: 96px"
      div.av-compare-table__scroll[role=region][tabindex=0][aria-labelledby=caption]
        table.av-compare-table__table[aria-describedby=footnote]
          caption.av-visually-hidden   "<yours> compared with <theirs>"
          thead > tr
            th[scope=col].av-compare-table__corner      first column heading, or a visually hidden "Feature"
            th[scope=col].av-compare-table__head.av-compare-table__ours     logo (image_tag) or heading text
            th[scope=col].av-compare-table__head.av-compare-table__theirs   heading text
          tbody > tr.av-compare-table__row {{ block.shopify_attributes }}   ×N
            th[scope=row].av-compare-table__label   label + optional span.av-compare-table__label-note
            td.av-compare-table__cell.av-compare-table__ours
            td.av-compare-table__cell.av-compare-table__theirs
      p.av-compare-table__footnote#note   (optional)
```
A value cell holds `span.av-compare-table__value` with one of the following:
- `check`: `span.av-compare-table__icon` (Lucide `check`, aria-hidden) plus visually hidden "Yes"
- `cross`: `span.av-compare-table__icon--no` (Lucide `x`) plus visually hidden "No"
- stars: `anvil-stars` (role="img", "4.5 out of 5 stars") plus the number (aria-hidden), inside a link to the source for typed stars
- and, after any of these, the optional text (`span.av-compare-table__text`)

An empty cell shows an aria-hidden em dash and a visually hidden "Not stated".

Heading levels: the section heading is the chassis `h2`. Row labels are `<th scope="row">`, not headings (CONVENTIONS §3: short labels are not headings).

## Settings
The 13 chassis settings come first, verbatim. Then, under the "Comparison table" header:

| id | type | default | effect |
|---|---|---|---|
| `our_heading` | text | empty | your column's header text; empty means `shop.name`. With a logo it becomes the logo's `alt` |
| `our_logo` | image_picker | — | optional logo shown instead of the text (`image_tag`, widths `w, 2w`, `sizes: <w>px`, width/height attributes from the aspect ratio; eager in the first two sections, lazy after) |
| `logo_width` | range 40–200 step 8 px | 96 | logo width (`--av-compare-table-logo`), capped at the cell width |
| `their_heading` | text | "Other brands" | the other column's header; empty means `anvil.compare_table.others`. `info` steers toward a generic name |
| `label_heading` | text | empty | the first column's header; empty gives a visually hidden "Feature" so the column still has a header |
| `highlight` | select `none` / `tint` / `outline` / `accent` | `tint` | your column: off, accent tint at 10 %, 2 px accent outline, or a solid accent band with `--av-on-accent` text. Every option except off rounds the top and bottom with `--av-radius-card` |
| `icon_style` | select `plain` / `soft` / `circle` | `soft` | check and cross drawn plain, in a tinted circle (currentColor at 14 % opacity), or in a solid circle |
| `icon_color` | select `accent` / `status` / `text` | `accent` | accent check with a muted cross; `--av-success` / `--av-error`; or both in the text colour. In an accent-highlighted column both use `--av-on-accent`. With solid circles and accent colours, the check glyph is `--av-on-accent` on the accent disc (the scheme's contrast pair), not `--av-bg` |
| `row_style` | select `lines` / `striped` | `lines` | divider lines, or a 5 % foreground stripe on odd rows |
| `text_align` | select `center` / `start` | `center` | alignment of the value columns, their headers and the footnote |
| `col_min` | range 80–200 step 8 px | 104 | minimum width of each value column (`--av-compare-table-col`). At the default, a 375 px phone fits the table without scrolling; wider values or narrower phones scroll |
| `rating_product` | product | — | product whose `reviews.rating` metafield feeds rows set to "Product review rating"; empty means `closest.product` (the product of a product page) |
| `footnote` | inline_richtext | "Example: compared with other brands' product pages in [month, year]. Replace with your real sources." | printed under the table and linked to it with `aria-describedby`; links allowed |

26 non-header settings in total (13 chassis + 13). Preset "Comparison table": heading "How we **compare**", `width: narrow`, five example rows (check vs cross, text vs text, check + note on both sides, text vs text, check vs check).

## Blocks
Local block `row` (name "Row"), `max_blocks: 20`:

| id | type | default | note |
|---|---|---|---|
| `label` | text | "Example feature — replace" | the row header. A blank label skips the row on the storefront (a row without a header fails accessibility). In the editor it stays visible with `anvil.editor.untitled_row` |
| `note` | text | empty | short muted line under the label (a condition, for example "on orders over $50") |
| `ours_type` | select `check` / `cross` / `text` / `stars` / `rating` | `text` | `stars` = typed stars with a source link; `rating` = the review app's metafield rating of `rating_product`. The default `text` with no text shows the dash and "Not stated", so a new row claims nothing. `info`: a check says your product or store offers this today |
| `ours_text` | text | empty | shown alone for Text, or beside a check, cross or stars |
| `ours_rating` | range 0–5 step 0.5 | 5 | used only by `stars`, and only with `ours_source`. `info`: type the rating exactly as the linked page shows it |
| `ours_source` | url | — | a public page that shows this exact rating. Without it, typed stars are not shown |
| `theirs_type` | select `check` / `cross` / `text` / `stars` | `text` | no `rating` option: the other column never reads a product of yours. The default `text` with no text shows the dash and "Not stated", so a new row makes no claim about a competitor |
| `theirs_text` | text | empty | as `ours_text`. `info` warns that unproven competitor claims can be unlawful |
| `theirs_rating` | range 0–5 step 0.5 | 5 | as `ours_rating` |
| `theirs_source` | url | — | as `ours_source` (for example the product's public review page) |

`{{ block.shopify_attributes }}` sits on the `<tr>`, so the editor selects and scrolls to the row.

## Behaviour
- **No JavaScript.** The table is plain HTML and CSS. The scroll wrapper is a focusable, labelled region (`role="region"`, `tabindex="0"`, `aria-labelledby` = the caption), so keyboard users can scroll it with the arrow keys (WCAG 2.1.1). It is always focusable, even when nothing overflows. That costs one tab stop and needs no script.
- **Phones:** the label column and the corner cell are `position: sticky; inset-inline-start: 0` with an opaque `--av-bg` background and a divider on their inline-end edge (below 750 px), so values slide under them. `inset-inline-start` keeps it correct in right-to-left languages. The scroll wrapper has `scroll-padding-inline-start: 8rem` (the label column's minimum width), so when a keyboard user tabs to a "Source" link that sits under the sticky column, the browser scrolls it clear (WCAG 2.4.11; checked in headless Chrome on a 320 px mockup: without the padding the focused link stayed hidden, with it the link scrolled clear). The wrapper is `position: relative`, so the visually hidden texts inside cells use it as their containing block and cannot widen the page (found while testing a 375 px mockup).
- **Desktop (≥ 750 px):** larger type and padding; the label column takes 40 % of the width, loses the sticky divider, and the scroll padding becomes 40 %. On a colour scheme with a background gradient (`color_scheme.settings.background_gradient` not blank, class `--gradient`) the label column and corner drop the opaque fill and the sticky position, so the gradient shows through.
- **Icons** are rendered once with `anvil-icon` and captured, then printed per cell (at most 40 cells).
- **Reduced motion:** nothing animates.
- **Empty states:** with no rows to show, the storefront renders only the padded section wrapper (no heading over an empty table). In the editor the heading stays and the shared `anvil.editor.empty_section` note shows under it. An empty value prints a dash with "Not stated" for screen readers.
- **Editor hints** (design mode only, in the cell): `anvil.editor.compare_stars_no_source` when typed stars lack a source link; `anvil.editor.compare_rating_missing` when a "Product review rating" row finds no rating.

## Honesty notes
- **Competitor claims are merchant-entered.** Every field about the other column carries an `info`: enter only what you can prove (for example from the other product's own listing), and unproven claims about competitors can be unlawful. `their_heading` defaults to the generic "Other brands", and its `info` says to name a specific competitor only if every row can be proven for that product. No competitor logo setting exists, on purpose (trademarks; see also "no bundled platform logos").
- **Footnote for sources.** The default footnote reads as an example and asks for the real sources and the date they were checked. It is linked to the table with `aria-describedby`, so screen reader users hear it with the table.
- **Stars follow docs/HONEST.md.** Typed stars render only with a source link, shown as a visible "Source" link that opens in a new tab and says so to screen readers. "Product review rating" reads only the `reviews.rating` / `reviews.rating_count` metafields a review app writes. Without either source, the storefront shows the cell's text or a dash, never stars.
- **New rows claim nothing.** A new Row block defaults both values to Text with no text, which shows the dash and "Not stated". Changing only the label therefore cannot produce a check for you or a cross for a competitor. The explicit check and cross values live only in the preset rows, whose labels start with "Example:".
- **Example content** in every default and preset begins with "Example" ("Example: free shipping", "Example: 30 days"), so a store published unedited states no real fact about itself or anyone else. The preset includes no star row, because stars without a source would show nothing.
- No counters, timers, "most popular" badges or savings anywhere in this section.

## Styling decisions
- `border-collapse: separate` with `border-spacing: 0`, so sticky cells keep their borders and backgrounds, and the highlighted column can have rounded ends (`border-radius` on the first and last cells of the column).
- Stripes use `background-image` (a flat gradient), so they layer over the sticky cells' opaque `background-color` and over the column tint, with no second colour token.
- The tinted icon circle is a `::before` with `background: currentColor; opacity: .14`, which works with any of the three colour modes without `color-mix()`.
- In the accent-highlighted column, solid circles draw the icon in `--av-accent` on an `--av-on-accent` disc, so the check never disappears. Elsewhere, with accent colours, the check glyph is `--av-on-accent` on the accent disc; the muted cross and the status and text modes keep `--av-bg`.
- In the accent-highlighted column, `--av-rating` is set to `--av-on-accent`, so the filled stars of `anvil-stars` stay readable on the accent band (the shared component reads that token; it is not restyled).
- The rounded column ends apply only when a highlight is on, so with highlight off the bottom divider stays straight under your column.
- Column headers use the heading font tokens (`--av-font-heading`, weight, case, spacing). Row labels use the body font at weight 600, because 20 rows in a display face read badly.
- Every selector starts with `.av-compare-table`. The label column and the corner cell share their rules through `:is()`, and the CSS carries no comments (they live here), to stay under the 6,144 B stylesheet limit.

## Locale keys needed (integrator adds them; locale files are read-only during the wave)
| key | English |
|---|---|
| `anvil.compare_table.caption` | {{ ours }} compared with {{ theirs }} |
| `anvil.compare_table.feature` | Feature |
| `anvil.compare_table.others` | Others |
| `anvil.compare_table.yes` | Yes |
| `anvil.compare_table.no` | No |
| `anvil.compare_table.not_stated` | Not stated |
| `anvil.compare_table.source` | Source |
| `anvil.editor.untitled_row` | Untitled row: add a label in this block's settings. Shoppers do not see rows without one. |
| `anvil.editor.compare_stars_no_source` | Add a source link to show these stars. Until then shoppers see the text or a dash. |
| `anvil.editor.compare_rating_missing` | No review rating found: pick a product with a rating from your review app, or use this section on a product page. Shoppers see the text or a dash. |

Existing keys reused: `anvil.a11y.new_window`, `anvil.editor.empty_section`, `anvil.stars.label` (via `anvil-stars`), `anvil.stars.count`.

## Contract assumptions
- `anvil-stars` draws the stars and takes `rating`, `max`, `size`; its styles are in `anvil-base.css` (DECISIONS 29), so this section loads no extra stylesheet.
- `anvil-icon` has `check` and `x` and marks them `aria-hidden`.
- `anvil-base.css` provides `.av-visually-hidden`, `.av-example-note`, the `:focus-visible` ring and the `--av-success`, `--av-error`, `--av-accent-rgb`, `--av-scrollbar-color` tokens.
- `closest.product` is global (shopify.dev: Liquid objects › closest). In a section it resolves to the section's own product setting, else the template's product. It is blank elsewhere, and those rows then show the fallback.

## Uncertainties / open questions
1. **Sticky cells over a gradient scheme (phones).** On desktop a gradient scheme now drops the fill and the sticky position. Below 750 px the sticky label cells still paint `--av-bg`, a solid strip over the gradient, because the values have to scroll under something opaque. The alternative would be no sticky column on gradient schemes.
2. **Always-focusable scroll region.** A tab stop even when the table fits. Making it focusable only on overflow needs a small script, which the spec card does not include ("JS: —").
3. **"Product review rating" on the home page** needs `rating_product`. On a product page it reads the page's product. If a merchant places this section on a product template and also picks a different product, the picked product wins.
4. **Long competitor names.** The other column's header wraps within `col_min`. Very long names make the column grow, and the table then scrolls on phones (by design).
5. **Typed rating default.** `ours_rating` / `theirs_rating` default to 5, matching the shared `anvil-stars` block. They render only with a merchant-entered source link, and the `info` now says to type the rating exactly as the linked page shows it. A stricter option for the project is a default of 0 treated as "not set" (dash plus an editor hint, one new locale key), applied to `anvil-stars` and here together.
6. **Legal wording.** The `info` texts say "can be unlawful" without naming a jurisdiction. Comparative-advertising rules differ by country (for example the EU's comparative advertising directive and the FTC's guidance in the US). This was left general on purpose.

## Integration pass (2026-10-15)
- Locale keys added. `anvil-base.css` now reads `--av-rating-empty` for empty stars, so a highlighted column could set a readable empty-star colour; this section does not set it yet.
- Placed on `templates/index.json` and `templates/product.landing.json` (anchor `compare`).

## Fix pass (2026-10-15)
- Setting ids follow the theme-wide vocabulary (CONVENTIONS §5; DECISIONS 82–100); the tables above use the new ids: `value_align` → `text_align`. Saved templates were migrated.
- Uses the shared pieces: eager or lazy media from `snippets/anvil-above-fold` (DECISIONS 85); the editor-only empty note from `snippets/anvil-editor-empty` (DECISIONS 87).
- Availability: `disabled_on` groups ["header","custom.overlay"] (CONVENTIONS §4, DECISIONS 100).
