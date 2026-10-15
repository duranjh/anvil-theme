# Columns — `sections/anvil-columns.liquid`

_Section card, 2026-10-15. Wave 5. Review fixes applied 2026-10-15 (see "Review fixes"). Built from `docs/agent-prompts/columns.md` (CONVENTIONS, spec card, chassis API, exemplars) plus DECISIONS 1–67. Files: `sections/anvil-columns.liquid`, `blocks/_anvil-columns-column.liquid`._

## Purpose
"Custom columns" (SPEC §4.2): one to four columns that the merchant fills with the theme's own content blocks (heading, text, stars, rating badge, buttons, add-to-cart, image, text with icon, countdown, spacer, divider, group) and app blocks. Phones stack the columns (or show two per row). Tablets keep 1–3 columns and show 4 as 2 × 2. Desktop shows 1–4 per row. Design row: `docs/DESIGN-sections.md` §3 `anvil-columns`: theme blocks `_anvil-column` → `@theme`, with the key settings columns, gap, valign and card style. No JavaScript and no asset files. The section CSS is 2,263 B raw (649 B gzipped) in its `{% stylesheet %}`.

## Markup (shopper view)
```
div#anchor.av-section.av-scheme--… .av-s-anvil-columns           ← anvil-section-attrs
  div.av-section__inner
    .av-section-head (h2 + subheading)                             ← anvil-section-head, only when set
    p.av-columns__note.av-example-note                             ← editor only, section without blocks
    p.av-columns__note.av-example-note                             ← editor only, "auto" with more than 4 columns
    div.av-columns.av-columns--m{1|2}.av-columns--t{1-3}.av-columns--d{1-4}
       .av-columns--v-{top|center|bottom|last}.av-columns--{flat|outlined|tinted|raised}[.av-columns--boxed]
       style="--av-columns-gap: Npx; --av-columns-block-gap: Npx[; --av-columns-shadow: var(--av-shadow-card)]"
      {% content_for 'blocks' %}
        div.av-columns__col[.av-columns__col--scheme.av-scheme.av-scheme--<id>][.av-columns__col--empty]   ← one column (tag: null)
          {% content_for 'blocks' %}                               ← the column's theme blocks and app blocks
```
The grid is a CSS grid with `repeat(N, minmax(0, 1fr))` and `align-items: stretch`, so the columns in a row share one height and a card style lines up. Each column is a flex column whose `gap` (`--av-columns-block-gap`) spaces its blocks. The theme blocks carry no outer margins. Grid and column children get `min-width: 0`, so a long word or a wide image cannot push a column past its track.

## Settings
The 13 chassis settings come first, verbatim (CONVENTIONS §4). Then, under the header "Columns", come 6 settings, 19 in total:

| id | type | default | effect |
|---|---|---|---|
| `cols_desktop` | select `auto` / `2` / `3` / `4` | `auto` | columns per row from 990 px. `auto` = the number of columns (top-level blocks), capped at 4, so the columns sit in one row. Extra columns start a new row. Tablets (750–989 px) use the same number, except 4, which becomes 2 (computed in Liquid). With `auto` and more than 4 columns, the editor shows the note `anvil.editor.columns_over_four` above the grid (shoppers never see it) |
| `cols_mobile` | select `1` / `2` | `1` | columns per row below 750 px, never more than the desktop count |
| `gap` | range 0–80 px, step 4 | 32 | space between columns and between rows (`--av-columns-gap`) |
| `block_gap` | range 0–48 px, step 4 | 16 | space between the blocks inside a column (`--av-columns-block-gap`) |
| `valign` | select `top` / `center` / `bottom` / `last` | `top` | where the content sits inside the equal-height columns. `last` keeps everything at the top and pushes the last visible block to the bottom (`margin-top: auto`), which lines up buttons across columns. "Visible" skips children with `hidden` (a countdown without a date, or one hidden at expiry) and `script`, `style`, `template` and `link` elements, via `:nth-last-child(1 of …)`; browsers without that syntax fall back to `:last-child`. This is the spec's "alignment" setting. Horizontal alignment stays with each block's own setting (see open question 2) |
| `card_style` | select `flat` / `theme` / `outlined` / `tinted` / `raised` | `flat` | `flat` draws no box. `theme` follows Theme settings > Cards exactly: `settings.card_style` (flat, outlined or raised), its shadow (`--av-shadow-card`, or none when the theme's card shadow is none) and its border width (`--av-border-w-card`, 0 included; integration pass, the same rule as Feature grid and Icons with content) and, when the theme style draws a box, its colour scheme (`settings.card_color_scheme`, applied per column, as product cards do). `outlined` draws a `max(1px, --av-border-w-card)` border in `--av-border`. `tinted` fills with `rgb(--av-fg-rgb / 0.05)`. `raised` puts the column on `--av-bg` with a shadow. Every boxed style pads columns with `--av-space-5` and rounds them with `--av-radius-card`. The `info` says what "Same as theme cards" copies: the style, border width and shadow, plus the card colour scheme for Outlined and Raised; only the explicit Outlined and Shadow choices keep a 1 px / medium-shadow floor |

The values and labels for `card_style` match `anvil-feature-grid`, so merchants see one vocabulary. The default is `flat` because columns are a layout tool, not cards.

`schema.name` is "Columns". `disabled_on.groups: ["header", "custom.overlay"]`: templates and the footer group can use it.

## Blocks
`"blocks": [{ "type": "_anvil-columns-column" }, { "type": "@app" }]`. Shopify hides a private (underscore) block from the `@theme` picker; a container must name it by its file name (shopify.dev, Theme block targeting). An app block added at the top level becomes a column of its own.

**`_anvil-columns-column`** (`blocks/_anvil-columns-column.liquid`, editor name "Column", `"tag": null`): accepts `@theme` and `@app`, and renders them with `{% content_for 'blocks' %}`. It prints `{{ block.shopify_attributes }}` on its root. Settings:

| id | type | default | effect |
|---|---|---|---|
| `own_scheme` | checkbox | false | gives the column its own colour scheme. A scheme column is always a padded, rounded box, even when the section's style is "No box", so text never touches the coloured edge. `info` explains this |
| `color_scheme` | color_scheme | `scheme-2` | the column's scheme. It shows only while `own_scheme` is on (`visible_if`). The default differs from the section default, so ticking the box changes something visible |

The block preset "Column" (what "Add block" inserts) holds an `h3` Heading and a Text.

**Name.** DESIGN-sections calls the block `_anvil-column`. The output contract allows only `blocks/_anvil-columns-*.liquid`, so the file is `_anvil-columns-column.liquid` and its type is `_anvil-columns-column`.

**No `max_blocks`.** The spec says "up to 4 columns". The section does not set `max_blocks: 4`: shopify.dev does not say whether nested blocks count toward a section's block limit, and the theme limits suggest they do (50 blocks per section, 1,250 per template = 25 sections × 50). If they count, `max_blocks: 4` would cap a section at four blocks in total, empty columns included, and the presets (9 and 15 blocks) would be invalid. Instead, `auto` puts up to 4 columns in one row and more columns wrap. See open question 1.

### Presets
1. **Columns**: chassis heading "Example heading — three things to **know**" (`h2`), and three columns, each with an `h3` Heading ("Example column — …", size small) and an example Text. The third text tells the merchant that columns can also hold images, buttons, stars and add-to-cart blocks. Style: no box.
2. **Columns with images**: chassis heading "Example heading — **replace** with your own", `valign: last`, `card_style: outlined`, and three columns, each with an Image (empty, so a placeholder, 4:5), an `h3` Heading, an example Text and a secondary button "Shop all products" → `/collections/all`.

Both presets keep the heading outline intact: one `h2` from the chassis, `h3` in the columns (CONVENTIONS §3).

## Behaviour
- **Without JS:** everything renders; there is nothing to enhance. Blocks with their own scripts follow their own rules: the countdown loads its module, and add-to-cart posts its native form.
- **Keyboard:** only the blocks' own controls are focusable; the global `:focus-visible` ring applies.
- **Reduced motion:** nothing animates. Reveal on scroll comes from the chassis.
- **Empty column:** the column captures its `content_for` output. In the editor an empty column (no blocks, or only hidden ones) shows the shared note `anvil.editor.empty_section` in a dashed box. On the storefront it gets `av-columns__col--empty`: from 750 px it keeps its grid slot as blank space with no box, padding, border, tint or shadow, so the other columns stay where the merchant put them; on phones it is `display: none`, which leaves no stray gap in the stack.
- **Columns with only hidden content:** a column whose children are all `hidden` (or only `script`/`style`/`template`/`link`), for example a lone countdown with no date or one hidden at expiry by `anvil-countdown.js`, gets the empty-column treatment from CSS: `.av-columns__col:not(:has(> :not([hidden]):not(script)…))` drops its box, padding, border, tint and shadow, hides it on phones and keeps the blank slot from 750 px. It reacts live when the countdown script sets `hidden`. Browsers without `:has()` keep the Liquid `--empty` fallback, which covers only truly empty columns. In the editor the countdown never renders `hidden` (its Liquid skips that in design mode), so the column stays visible there.
- **No columns:** the grid is empty and takes no height. The editor shows the shared note above it.
- **More than 4 columns:** columns never exceed 4 per row. With `auto`, the fifth column starts a new row, and the editor shows `anvil.editor.columns_over_four` above the grid so the merchant knows why the row broke and where to set the row length.
- **Editor:** adding, reordering and selecting columns and their blocks go through Shopify's theme-block handling; no `shopify:*` handlers are needed.

## Honesty notes
- The section and the column print no claims, numbers, ratings, timers or badges. The rating, review-platform, countdown and add-to-cart blocks carry their own honesty rules and `info` texts. The section passes nothing to them.
- Preset copy reads as examples ("Example heading —", "Example column —", "Example text —"). The texts remind the merchant to state only what is true and to keep delivery times and guarantees in line with their policies.
- No setting here can mislead, so no honesty `info` was needed. The `info` texts explain layout behaviour.

## Styling decisions
- Every selector starts with `.av-columns`. The private block has no stylesheet of its own: its markup appears only inside this section, so the section stylesheet always loads with it (DECISIONS 57).
- Tokens only: `--av-space-5`, `--av-radius-card`, `--av-border-w-card`, `--av-border`, `--av-fg-rgb`, `--av-bg`, `--av-shadow-card`, `--av-shadow-md`, `--av-fg`.
- `.av-columns--tinted` skips scheme columns (`:not(.av-columns__col--scheme)`), so a column's own scheme background wins. The empty-column reset uses a three-class selector to beat the tinted rule; the hidden-content reset has specificity (0,3,4) and also beats it.
- The "visible child" filters chain `:not([hidden]):not(script)…` instead of one `:not()` with a comma list, because `scripts/chassis-lint.py` splits selectors on commas. The `:has()` and `of S` rules sit in their own rule sets, so a browser that cannot parse them drops only that rule, not the fallback beside it.
- The editor note above the grid gets `margin-top` on the grid (`.av-columns__note + .av-columns`), so it does not touch the first row.

## Locale keys
- Existing: `anvil.editor.empty_section` (editor only), in the section and in the column.
- New, for the integrator to add to `locales/en.default.json`: `anvil.editor.columns_over_four` = "A row holds up to 4 columns, so extra columns start a new row. Set Columns per row on desktop to choose the row length." (editor only).

## Contract assumptions
- `section.blocks.size` counts the section's top-level theme and app blocks (the columns), as `anvil-rich-text` already assumes. It drives `auto` and the empty-section note.
- Capturing `{% content_for 'blocks' %}` in a theme block works like capturing any other Liquid output. shopify.dev neither documents nor forbids it. If it ever failed, the only effect would be that the empty-column handling misfires; the blocks still render.
- `section.settings` is readable from the private block. shopify.dev: "Theme blocks can reference the section object of the section that rendered the theme block." The block reads `section.settings.card_style` for the theme card scheme.
- Theme blocks use `"tag": null` and print their own `shopify_attributes` (checked in `blocks/*.liquid`).

## Known gaps
1. **Images in columns are oversized (perf, owner: `blocks/anvil-image.liquid`).** The "Columns with images" preset puts three Image blocks in a 3-column row. `anvil-image` writes `sizes="(min-width: 750px) <width>vw, 100vw"` (100vw at the default width) and passes no `widths`, so `anvil-media` offers candidates up to 2200 px. A 1280 px desktop at DPR 2 needs about 760 px per image, and the browser picks the 2200 px file. This breaks CONVENTIONS §11 (cards 600, half width 1100). A theme block cannot receive the column count through `{% content_for 'blocks' %}`, and this section may not edit the image block, so the gap ships until the block owner applies the fix in open question 4. The preset images start empty (placeholders), so the cost begins when the merchant uploads images.
2. **Column images in the first two sections load lazily (perf, owner: `blocks/anvil-image.liquid`).** CONVENTIONS §11 wants the first visible row eager when `section.index` is nil or <= 2. `anvil-image` renders `anvil-media` without `loading`, so it is always lazy. Fix in open question 7.

## Review fixes (2026-10-15)
- `valign: last` now pushes the last visible block down, skipping `hidden` children and `script`/`style`/`template`/`link` (fallback `:last-child` kept).
- Columns whose content is all hidden get the empty-column treatment through `:has()`.
- The `card_style` `info` now matches the code (see Settings).
- Editor-only note for `auto` with more than 4 columns. `max_blocks` stays unset: shopify.dev (section schema) still says only "There's a limit of 50 blocks per section. You can specify a lower limit with the `max_blocks` attribute" and does not say whether nested blocks count; the reviewer confirmed a per-type `limit` on the block reference is read as a local block definition (`ValidSchema: Missing property "name"`).
- Oversized and lazy column images recorded under Known gaps; fixes for the block owner in open questions 4 and 7.

## Gate results (2026-10-15, after review fixes)
- `shopify theme check --fail-level warning`: one finding in this section's files, `TranslationKeyExists` for the new `anvil.editor.columns_over_four` (expected until the integrator adds the key). The whole-theme run shows 182 errors across 41 files, all `TranslationKeyExists` in wave sections waiting for locale keys.
- `cleanroom-lint`, `asset-audit`, `check-limits`: clean.
- `chassis-lint`: the known false positive ([E] local blocks without a for-loop, [W] local blocks without `max_blocks`) on this section; see open question 3. No other findings.
- CSS: 2,263 B raw / 649 B gzipped (limit 6 KB raw). JS: none.

## Open questions
1. **`max_blocks` and nested blocks.** Can someone confirm in the theme editor whether `max_blocks` counts nested blocks? If it counts only top-level blocks, add `"max_blocks": 4` to match the spec's "up to 4 columns" and drop the editor note. `anvil-tabs` sets `max_blocks: 10` with nested panel content, so the same check applies there. Until then, the editor note `anvil.editor.columns_over_four` explains the wrap in `auto` mode.
2. **Horizontal alignment.** As in `anvil-rich-text` (open question 1), each theme block has its own `align` setting that defaults to left. A merchant who wants centred columns sets it on each block. A section-level alignment would only reach app blocks, so none was added. An "Inherit" value on the blocks' `align` would fix this across all container sections.
3. **chassis-lint does not know private theme blocks.** `scripts/chassis-lint.py` `check_blocks` counts every block type that does not start with `@` as a local block. So `_anvil-columns-column` is treated as local, which triggers "[E] local blocks declared but no `{% for … in section.blocks %}` loop renders them" and "[W] local blocks without `max_blocks`". The section renders the private block correctly with `{% content_for 'blocks' %}`, and the block prints its own `{{ block.shopify_attributes }}`. A loop that printed the attributes a second time would be wrong markup, so none was added to satisfy the lint. Suggested lint fix: treat types starting with `_` as theme blocks, require `{% content_for 'blocks' %}` for them, and skip the loop and `max_blocks` checks.
4. **Image sizes inside columns (Known gap 1).** Suggested change for the `blocks/anvil-image.liquid` owner. Only `anvil-columns` has both `cols_desktop` and `cols_mobile` and accepts theme blocks, so their presence identifies the section. Integer `divided_by` floors, which errs small by under 1vw and is offset by the column gaps.
   ```liquid
   assign img_sizes = '(min-width: 750px) ' | append: s.width | append: 'vw, 100vw'
   assign img_widths = ''
   if section.settings.cols_desktop != blank and section.settings.cols_mobile != blank
     assign n_d = section.blocks.size | at_least: 1 | at_most: 4
     unless section.settings.cols_desktop == 'auto'
       assign n_d = section.settings.cols_desktop | plus: 0
     endunless
     assign n_t = n_d
     if n_d == 4
       assign n_t = 2
     endif
     assign n_m = section.settings.cols_mobile | plus: 0 | at_most: n_d
     assign w_d = s.width | divided_by: n_d
     assign w_t = s.width | divided_by: n_t
     assign w_m = s.width | divided_by: n_m
     assign img_sizes = '(min-width: 990px) ' | append: w_d | append: 'vw, (min-width: 750px) ' | append: w_t | append: 'vw, ' | append: w_m | append: 'vw'
     if n_d > 1
       assign img_widths = '300, 450, 600, 900, 1100'
     endif
   endif
   ```
   Then pass `widths: img_widths` to `anvil-media` (an empty string falls back to its default list through `default`). The list stops at 1100 rather than 600 because the same `srcset` serves a one-column phone at DPR 3 (about 1,125 px). The reviewer's draft chained `| divided_by:` after `| append:`, which divides the whole string; the version above computes each width first.
5. **Add-to-cart enhancement.** `blocks/anvil-product-atc.liquid` puts `<anvil-product-form>` outside its `{% form %}` without a `form-id` attribute and does not load `assets/anvil-product.js`. The `ProductForm` element looks for `closest('form')` or `#<form-id>`, so even with the module loaded it would find no form. The block works as a native form post to the cart, but the drawer-opening enhancement never runs in any container (columns, rich text, group). The fix belongs to the block owner: add `form-id="{{ form_id }}"` and load the module. This section does not load `anvil-product.js` itself, because it cannot see which blocks its columns hold.
6. **Per-column width.** "Flexible columns" could also mean columns of different widths (for example 2/3 + 1/3). That was left out because spans conflict with `auto` (the track count would have to be the sum of spans, which needs a loop over the columns' settings). It could be added later as a column setting with a fixed track count.
7. **Eager column images in the first two sections (Known gap 2).** Suggested change for the `blocks/anvil-image.liquid` owner, following `blocks/_anvil-hero-slideshow-slide.liquid`: `assign img_loading = 'lazy'`, then `if section.index == nil or section.index <= 2` → `assign img_loading = 'eager'`, and pass `loading: img_loading` to `anvil-media`. shopify.dev (section object): `index` is 1-based and nil for static sections, in the editor and in the Section Rendering API. A block cannot tell which grid row it sits in, so this makes every image in such a section eager, not only the first row; with up to 4 columns per row that is acceptable, and no `fetchpriority` should be set from a block.

## Integration pass (2026-10-15)
- chassis-lint now treats a `_`-prefixed type (or one with a file in `blocks/`) as a theme-block reference: `{% content_for 'blocks' %}` is required and the loop and `max_blocks` checks are skipped, so this section passes without a workaround.
- `blocks/anvil-image.liquid` reads `cols_desktop` / `cols_mobile` for `sizes` (one column wide, srcset capped at 1100) and loads eagerly in the first two sections; `blocks/anvil-product-atc.liquid` passes `form-id` and loads `anvil-product.js`, so Add to cart in a column adds through the drawer.
- "Same as theme cards" now copies the theme card border width and shadow exactly (none stays none); only the explicit Outlined and Shadow styles keep their floors, as in Feature grid and Icons with content.
- Still open: whether nested theme blocks count toward `max_blocks` (needs the live editor).

## Fix pass (2026-10-15)
- Uses the shared pieces: card boxes from `snippets/anvil-surface` and `.av-surface` (DECISIONS 83); columns from the shared `.av-grid` rule (DECISIONS 82); the editor-only empty note from `snippets/anvil-editor-empty` (DECISIONS 87).
- Availability: `disabled_on` groups ["header","custom.overlay"] (CONVENTIONS §4, DECISIONS 100).
