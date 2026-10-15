# `anvil-collapsible` — Collapsible content (section card)

_Wave section. File `sections/anvil-collapsible.liquid`, editor name "Collapsible content". Spec: `docs/spec/collapsible.md`; `docs/DESIGN-sections.md` §3 "Standard sections". Contract: `docs/CONVENTIONS.md` §3–§4._

## Purpose
Rows that open and close, such as "Shipping", "Materials" and "Care". It works like the FAQ section, and adds a row icon, an optional page as row content, and an optional image beside the rows. Each row is a native `<details><summary>`, so the section works with JavaScript off. `<anvil-collapsible>` from `assets/anvil-core.js` adds the height animation and the optional single-open mode. There is no section JavaScript and no asset file. All CSS is in the section's `{% stylesheet %}`: 3,448 B raw, 952 B gzipped (gzip -9).

## Markup (shopper view)
```
div#anchor.av-section … .av-s-anvil-collapsible          ← anvil-section-attrs
  div.av-section__inner
    .av-section-head (h2 + subheading)                    ← anvil-section-head
    link[stylesheet] anvil-prose.css                       ← only when a row picks a page
    div.av-collapsible.av-collapsible--rows|image[.--left|--right .--m-top|--m-bottom][.--solo]
      div.av-collapsible__media[--sticky] > anvil-media     ← Image and rows layout only
      anvil-collapsible.av-collapsible__rows.--divided|cards.--toggle-end|start.--icon-accent|text[single]
        details.av-collapsible__row[open] {{ block.shopify_attributes }}   ×N
          summary.av-collapsible__summary
            span.av-collapsible__toggle[aria-hidden]      ← here when the icon position is Start
            span.av-collapsible__icon (anvil-icon or uploaded image, alt="")
            h3|h2.av-collapsible__heading
            span.av-collapsible__toggle[aria-hidden]      ← here when the icon position is End
          div.av-collapsible__body                        ← the one element <anvil-collapsible> animates
            div.av-collapsible__content (padding lives here so the height can reach 0)
              div.av-collapsible__text.av-rte             ← row text
              div.av-collapsible__page.av-prose           ← chosen page's content, tables in a labelled scroll region
```
Heading levels: row headings are `h3` under the chassis `h2`. When the section heading is blank they become `h2`, so the outline never jumps from the page `h1` to an `h3` (the rule `anvil-image-text` uses too).

## Settings
The 13 chassis settings come first, exactly as the contract gives them. Then 14 settings of its own (27 in total). The six image settings (`image` to `image_sticky`) carry `visible_if: section.settings.layout == 'image'`, so the editor shows them only with the Image and rows layout:

| id | type | default | effect |
|---|---|---|---|
| `layout` | select `rows` / `image` | `rows` | Rows only, or Image and rows (from 750 px the image and rows sit side by side; on phones they stack) |
| `image` | image_picker | — | the image for the Image and rows layout; shows the `lifestyle-2` placeholder when empty |
| `image_ratio` | select `adapt` / `1:1` / `4:5` / `3:4` / `16:9` | `adapt` | the shape of the image box (`anvil-media` ratio) |
| `image_width` | range 30–70 %, step 5 | 50 | the image column's share of the inner width from 750 px. The column is `max(30%, min(image_width, 100% − 20rem − gap))`, so the rows always keep at least 20rem (320 px) where the space allows and headings never break letter by letter between 750 and 1100 px. Also feeds the `sizes` attribute |
| `image_side` | select `left` / `right` | `left` | which side the image sits on from 750 px |
| `image_side_mobile` | select `top` / `bottom` | `top` | image above or below the rows on phones |
| `image_sticky` | checkbox | `true` | from 750 px the image stays in view below the sticky header (`--av-header-h`) while long rows are open. It only moves inside its grid row |
| `open_first` | checkbox | `true` | the first row that actually renders gets `open` (works without JS) |
| `single_open` | checkbox | `false` | adds `single` to `<anvil-collapsible>`; with JS, opening a row closes the others |
| `item_style` | select `divided` / `cards` | `divided` | divider lines between rows, or boxed rows (card border, radius, shadow and a 3 % tint) |
| `toggle_icon` | select `chevron` / `plus` | `chevron` | one chevron that turns 180° when open, or a plus and minus pair swapped with CSS |
| `icon_position` | select `end` / `start` | `end` | where the open and close icon sits: at the end of the row, or before the row icon and heading |
| `icon_size` | range 16–48 px, step 4 | 24 | row icon size (Lucide icon or uploaded image) |
| `icon_color` | select `accent` / `text` | `accent` | row icon colour |

Presets: "Collapsible content" (rows only, `width: narrow`, heading "Good to **know**", four example rows: Shipping, Materials, Care, Returns) and "Collapsible rows with image" (Image and rows, heading aligned left, three example rows).

## Blocks
Local block `row` (name "Row"), `max_blocks: 20`:

| id | type | default | note |
|---|---|---|---|
| `icon` | select (66 Lucide names + `none`) | `info` | decorative (`aria-hidden`); every name exists in the `anvil-icon-*` lookups |
| `icon_image` | image_picker | — | replaces the icon; drawn by `image_tag` at 1× and 2× the icon size, `alt=""` (the heading names the row) |
| `heading` | text | "Example row — replace this heading" | the accessible name of the disclosure; when blank, the page title is used |
| `content` | richtext | `<p>Example text — replace it with details that are true for your store.</p>` | printed in `.av-rte`; has an honesty `info` |
| `page` | page | — | its content is shown below the text, in `.av-prose`; tables get the same labelled scroll region as the product page's collapsible tab. The page's `h1`–`h3` are demoted one level below the row heading (`h4` under an `h3` row, `h3` under an `h2` row), so a policy page headed with an H1 never adds a second `h1` or jumps back above the row title (CONVENTIONS §3, §9) |

`{{ block.shopify_attributes }}` sits on the `<details>`, so the editor's `shopify:block:select` handler in `anvil-core.js` opens the row being edited.

## Behaviour
- **Without JS:** native disclosure; `open_first` works; icons swap through `[open]`. `single_open` has no effect (every row can stay open). No animation.
- **With JS:** `<anvil-collapsible>` animates the body's height with `--av-dur` / `--av-ease`, adds `av-is-animating` / `av-is-closing` while it runs, and dispatches `anvil:collapsible:toggle`. The icon CSS uses `[open]:not(.av-is-closing)`, so the icon flips back as soon as a close starts.
- **Keyboard:** `summary` can be focused natively; Enter and Space toggle a row; the global `:focus-visible` ring applies. Each summary is at least 44 px tall.
- **Reduced motion / animations off:** the chevron's transition sits inside `@media (prefers-reduced-motion: no-preference)` and uses `--av-dur` (0 ms when the merchant turns animations off). The core element skips the height animation under both conditions.
- **Rows the storefront skips:** a row with no name (blank heading and no page) or nothing to open (blank text and no page). In the editor both stay visible, so the merchant can select them: an untitled row shows `anvil.collapsible.untitled_row`, and an empty body shows `anvil.collapsible.no_content`.
- **No rows to show:** the storefront draws no rows wrapper. With the image layout the image then takes the full width (`--solo`), and its `sizes`/`widths` switch to the full inner width (`(min-width: page or narrow width) that width px, 100vw`, widths up to 1500; `100vw` and up to 2200 at full width). With the Rows only layout the section root gets `hidden`, so shoppers never see an orphan heading or an empty padded band. In the editor the section always shows, and a section with no blocks shows `anvil.editor.empty_section`.
- **Image loading:** eager in the first two sections (or when `section.index` is nil), with `fetchpriority=high` in the first section; lazy below that. Uploaded row icon images follow the same rule. `sizes` comes from the width setting and `image_width`, capped at `settings.page_width` / `settings.narrow_width`, and mirrors the CSS clamp with upper bounds: `image_width` vw from the viewport where that share becomes the smaller value (36800 / (100 − image_width) px), `calc(100vw - 368px)` between 750 px and that viewport, and at the cap `min(image_width % of the page width, page width − 368 px)`.
- **Prose stylesheet:** `anvil-prose.css` is linked only when at least one row picks a page (URLs dedupe with other sections).
- **Icons:** the open and close icon is rendered once and captured. Row icons are rendered per row (at most 20).
- **Escaping:** merchant text (row heading, page title) is escaped once when it is assigned; strings from `t` are printed as is, because Shopify already HTML-escapes translations whose key has no `_html` suffix.

## Honesty notes
- Every default and preset string reads as an example ("Example: Shipping", "Example text — replace …") and says what real content goes there, so a store published unedited makes no factual claim.
- `content.info`: delivery times, returns, materials and care claims must match the store's policies and products.
- `icon_image.info`: upload only artwork you are entitled to use (Anvil ships no logos).
- `page.info` suggests the shipping or returns policy page, so a row can show the merchant's own policy text instead of a retyped summary.
- No timers, counters, ratings, savings or badges anywhere in this section.

## Locale keys needed (integrator adds them)
| key | English |
|---|---|
| `anvil.collapsible.untitled_row` | Untitled row: add a heading or pick a page. |
| `anvil.collapsible.no_content` | Add text or pick a page to show this row to shoppers. |

Both render only in `request.design_mode`. The existing keys `anvil.a11y.scroll_table` and `anvil.editor.empty_section` are reused.

## Contract assumptions
- `<anvil-collapsible>` (`assets/anvil-core.js`) animates `details > :not(summary)`, the first non-summary child, so each row has exactly one body element after `summary`.
- `anvil-media` accepts `placeholder: 'lifestyle-2'` and the ratio values above. `anvil-icon` has `chevron-down`, `plus`, `minus` and every name in the row icon list (checked against the four lookup snippets).
- `assets/anvil-prose.css` defines `.av-prose` and `.av-prose__table`. `anvil-base.css` defines `.av-rte`, `.av-example-note`, the summary marker reset and `--av-header-h`.

## Uncertainties / open questions
1. **"Icon position".** The card lists "icon position" next to row icons. It was read as the position of the open and close indicator (end or start of the row); the row icon always sits before the heading. If the card meant the row icon (before or above the heading), the select options change, but the id can stay.
2. **`h3`/`h2` inside `summary`.** Valid HTML, but some screen readers expose a summary only as a button. Same open question as the FAQ card.
3. **Native exclusive accordion** (`<details name>`) is not used for single-open, for the same reason as the FAQ: it would snap rows shut before the element can animate them.
4. **`image_sticky` defaults to on.** It has no effect when the rows are shorter than the image.

## Fix pass (2026-10-15)
- Setting ids follow the theme-wide vocabulary (CONVENTIONS §5; DECISIONS 82–100); the tables above use the new ids: `image_mobile` → `image_side_mobile`, `row_style` → `item_style`. Saved templates were migrated.
- Uses the shared pieces: eager or lazy media from `snippets/anvil-above-fold` (DECISIONS 85); the editor-only empty note from `snippets/anvil-editor-empty` (DECISIONS 87); accordion rows from `assets/anvil-accordion.css` (DECISIONS 91); a hidden fallback heading through `anvil-section-head` (DECISIONS 84).
- Availability: `disabled_on` groups ["header","custom.overlay"] (CONVENTIONS §4, DECISIONS 100).
