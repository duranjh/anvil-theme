# Stats — `sections/anvil-stats.liquid`

_Section card, 2026-10-15. Wave-2 section, built from `docs/agent-prompts/stats.md` (spec card `docs/spec/stats.md`); review fixes applied the same day (link purpose, label-less link cue, leading-zero count-up, editor/storefront count-up note, centred short rows, RTL alignment, empty-section wording)._

## Purpose
A row of up to six big figures ("12,500+ orders shipped", "30 days to return"), each with an optional icon, text before and after the number, a label and an optional source link. Phones show 2 per row by default; desktop shows one row matching the number of stats (the preset's 4). Plain numbers can count up once when they scroll into view. Spec: `docs/SPEC.md` §4.2 "Results / stats". Design row: `docs/DESIGN-sections.md` §3 `anvil-stats` (L: `stat` ×6; size, divider, count-up; count-up JS optional; values merchant-entered, info quotes Shopify's rule). Planned for `index.json` and `product.landing.json`.

## Settings
The 13 chassis settings come first, pasted from CONVENTIONS §4. A header "Stats" follows, then 10 section settings, 23 in total:

| id | type | default | what it does |
|---|---|---|---|
| `cols_mobile` | select `1` / `2` / `3` | `2` | stats per row below 750 px, capped at the number of stats shown |
| `cols_desktop` | select `auto` / `2`–`6` | `auto` | stats per row from 990 px. `auto` = one row with every stat shown. A fixed count is capped at the stats shown, so 3 stats with "4" fill the row instead of leaving an empty column. Info: tablets show at most 3 per row. |
| `size` | select `sm` / `md` / `lg` / `xl` | `lg` | number size: `--av-text-2xl`, `--av-text-3xl`, `--av-text-4xl`, 1.35 × `--av-text-4xl`. Info: long numbers shrink to fit their column. |
| `value_color` | select `accent` / `text` | `accent` | figure colour: `--av-accent` or the text colour |
| `text_align` | text_alignment | `center` | alignment of each stat and of the source note. With `center`, a short last row (3 stats at 2 per row, 5 at 3, 6 at 4) sits in the middle; with `left` / `right` it packs to that side. |
| `item_style` | select `plain` / `divided` / `cards` | `plain` | no frame; divider lines between stats (the spec's "divider"); or a bordered, lightly tinted card per stat (`--av-radius-card`, `--av-border-w-card`) |
| `icon_position` | select `top` / `start` | `top` | icon above the figure, or beside the figure and label |
| `icon_size` | range 20–64 px, step 4 | 32 | icon box (uploaded icons are requested at 1× and 2×) |
| `count_up` | checkbox | `true` | count plain numbers up from zero once, about 2 s, when they scroll into view. Info says which values count and which show the final number at once: figures already on screen when the page opens (in the editor preview too) and every figure for shoppers who reduce motion. |
| `footnote` | inline_richtext | blank | "Source note": small print under the stats. Info asks the merchant to say where the figures come from and when they were last checked. |

Tablets (750–989 px) show at most 3 per row, balanced in Liquid: `rows = ceil(d / 3)`, `t = ceil(d / rows)`, so 4 become 2 + 2 and 5 or 6 become rows of 3; `t` is never below the phone count or above the desktop count.

## Blocks
Local block `stat`, `limit: 6`, `max_blocks: 6`. `{{ block.shopify_attributes }}` sits on the `<li>`.

| id | type | default | note |
|---|---|---|---|
| `icon` | select (63 `anvil-icon` names plus `none`) | `none` | decorative; every value exists in the `anvil-icon-*` lookup snippets (checked) |
| `icon_image` | image_picker | — | replaces the icon; `alt=""` (decorative). Info: upload only artwork you are entitled to use. |
| `prefix` | text | blank | "Before the number", for example `$` or `~`. Info: a word of three letters or more, such as "Over", gets a space after it. |
| `value` | text | `100` | "Number". Info quotes Shopify's rule: themes "must not mislead or deceive merchants or customers with false data or claims". |
| `suffix` | text | blank | "After the number", for example `+`, `%`, `k`. Info: a word of three letters or more, such as "days", gets a space before it. |
| `label` | text | "Example: what this number counts — replace with a figure you can prove" | Info: say what the number counts and for which period. |
| `source_url` | url | blank | Info: optional page where shoppers can check the figure (the stat links to it); ratings and review counts always need one. |

The "Stats" preset sets the heading "By the **numbers**", an example source note, and four stats whose labels all start with "Example:" and say what to replace them with (orders shipped, return window, dispatch rate, countries).

## Markup and behaviour
- Structure: `<ul class="av-stats …" role="list">` → `<li class="av-stats__item">` → `.av-stats__body` (`<a>` when `source_url` is set, else `<div>`) → optional `.av-stats__icon` + `.av-stats__text` holding `.av-stats__figure` and `.av-stats__label`. Labels are `<span>`s, not headings (CONVENTIONS §3, DECISIONS 25), so the section needs no hidden `<h2>`. A linked stat's accessible name is its figure, its label and a visually hidden " (source)" (`anvil.stats.source_link`, new key), so a screen-reader user hears where the link goes (WCAG 2.4.4). The label is underlined (thicker on hover) so the link is visible without hovering; a linked stat with no label underlines its figure instead (`.av-stats__figure:only-child`, which also covers the count-up copy), so it never looks like plain text (WCAG 1.4.1). The hidden text sits after `.av-stats__text`, not inside it, so `:only-child` still holds.
- A pre-pass in the top `{% liquid %}` (inside the tag, so the render loop stays the only `for` tag over `section.blocks`, which chassis-lint checks) decides per block:
  - whether it shows: a stat needs a number or a label; an empty stat is skipped on the storefront and shown in the editor with `anvil.editor.block_empty` so it can still be selected. Column counts use the stats shown, not `section.blocks.size`.
  - the space rule for prefix and suffix (a word of 3+ characters ending/starting in a cased letter gets a space; symbols and unit letters touch the number);
  - whether the value is a plain number: digits with optional `,` `.` `'` or space separators, starting and ending with a digit, at most 15 digits. Plain numbers never wrap (`white-space: nowrap`) and, when `count_up` is on and the value is above zero, carry `data-anvil-count`. A figure that starts with `0` pads every digit slot, so `0.125` counts `0.000` → `0.125` (integration pass, 2026-10-15; the Liquid `first != '0'` guard was removed). Anything else ("24/7", "4.8/5" typed as one value) is text shown exactly as typed.
  - `--av-stats-ch`: the longest unbreakable run across every figure in the section. CSS sizes all figures from it with a container query on each item (`max(--av-text-lg, min(size, 100cqi × 1.5 / ch))`), so one row never mixes sizes and a long figure shrinks to its column. Inline icons subtract their width from the room.
- Count-up (`assets/anvil-stats.js`, `<anvil-stats>`): loaded with a module script only when at least one figure carries `data-anvil-count`. The merchant's exact text (`.av-stats__final`) stays in flow and in the accessibility tree, with `opacity: 0` while counting; an `aria-hidden` clone (`.av-stats__tick`) is laid over it and counts with an ease-out curve, writing digits into the original's digit slots so separators and decimals keep their places (`12,500` → `4,312`; `4.8` starts at `0.0`). Tabular numerals and the hidden original keep the width fixed, so nothing shifts (measured: same width before and after). Skipped entirely under `prefers-reduced-motion: reduce` or `html[data-animations="off"]`, for figures already on screen when the module runs (no flash back to zero; the editor applies the same rule on first connect, so the preview matches the storefront), and in the editor after a section re-render; `shopify:block:select` jumps a figure to its final value. Runs once, under 5 s, so WCAG 2.2.2 does not apply. Print shows the final text.
- Layout: a grid of `--av-stats-cols` equal columns. Centred lists (`align: center`) are a wrapping flex row instead (`justify-content: center`), each stat exactly one column wide, `(100% + gap) / cols - gap` less 0.1 px against rounding, so a short last row sits in the middle while every row keeps the grid's positions. `--av-stats-cg` carries the column gap for both (0 for divider lines). Checked in headless Chrome: rows of the expected size and a centred last row for 1–6 stats, every valid phone/tablet/desktop column combination for plain lists and a third of them for divided and cards, at 169 widths from 320 to 1500 px (27,716 layouts, 0 failures; also 0 without the 0.1 px).
- Dividers: each stat draws a top and a start border through `--av-stats-bt` / `--av-stats-bs`; the first row and first column set them to transparent per breakpoint (`--m*`, `--t*`, `--d*` classes), and each breakpoint resets them. Only the divider borders read those properties, so cards keep all four edges. The rules use `>:nth-child()` with equal specificity throughout. A centred short last row keeps its top edges and the borders between its stats. Dividers use `border-inline-start`, so they mirror in RTL.
- Alignment follows `anvil-section-head`, which uses physical `text-align: left/right` with logical `justify-items: start/end`: stats use `text-align: left/right` with `align-items: flex-start/flex-end`, and the source note uses `text-align: left/right` with `width: fit-content` (plus `margin-inline-start: auto` for right), like a start/end grid item. Checked in headless Chrome with `dir=rtl` and `dir=ltr` at 1280 px for left, centre and right: a short heading, subheading, stat and note land on the same side in every case (in RTL, "Left" places short boxes at the right edge, as the chassis heading does), and wrapped text (a long label against a long heading) ends its lines on the same physical side as the heading. Beside-the-number icons keep the text start-aligned next to the icon.
- Icons: uploaded icons load eagerly in the first two sections (or when `section.index` is nil), lazily after that.
- Empty section: on the storefront only the heading and subheading (when set) and the section padding render; the editor also shows `anvil.editor.empty_section`.
- `disabled_on.groups: ["*"]`: not in header, footer or overlay groups.
- `{% stylesheet %}`: 5,478 bytes raw (limit 6,144), 1,398 gzipped; every selector starts with `.av-stats`. Its explanatory comments live in a Liquid `{% comment %}` just above it, so they do not ship in the compiled CSS. `assets/anvil-stats.js`: 4,173 bytes raw, 1,873 gzipped (section budget 2,048), unchanged.

## Honesty notes
- Every figure is typed by the merchant, so the `value` info quotes Shopify's Theme Store rule (HONEST.md), the label info asks what the number counts and for which period, and the source-link info says ratings and review counts always need a source (CONVENTIONS §10: star numbers only from metafields or with a source URL). The section cannot tell a rating from any other number, so it relies on that info.
- The optional source note under the row gives merchants a place to state where the figures come from.
- Preset content reads as an example ("Example: orders shipped — replace with your real count"); an unedited store makes no claim it cannot back.
- Count-up starts at zero and ends on exactly the typed text; it never shows a number the merchant did not enter as the final state. Figures starting with `0` (`0.125`, `0.5`) count with every slot padded, so a small decimal never reads as a figure many times larger on the way.
- No platform logos ship; the custom icon info says to upload only artwork the merchant is entitled to use.

## Checks run (2026-10-15)
- `shopify theme check --fail-level warning` (whole theme, after the review fixes): 1 finding in this file, `TranslationKeyExists` for the new `anvil.stats.source_link` (waits for the integrator). The run's other 192 findings are all `TranslationKeyExists` in other wave files.
- `scripts/check-schema-ranges.py`, `scripts/cleanroom-lint.sh`, `scripts/asset-audit.py`, `scripts/chassis-lint.py --only sections/anvil-stats.liquid --strict`, `scripts/check-limits.sh`: clean. (Whole-repo chassis-lint currently reports errors in other wave sections only.)
- Render check of the exact `{% stylesheet %}` with `anvil-base.css` and a Python port of the section's Liquid in local headless Chromium at 375, 768 and 1280 px, plus RTL at 1280 px: preset plain row; divided 6 stats, left aligned, icons on top, fixed 3 columns; cards with inline icons and text-colour numbers; cards 2/4; `xl` with a fixed 6 capped to 2. The first run showed the divider rules stripping the start and top edges off cards; fixed with the custom-property borders above. Count-up driven over CDP: counts 0 → 12,500+ with separators kept, ends on the typed text, no width change, nothing counts under reduced motion or for figures in view at load, no ticks left behind. Not a Shopify render; the harness push is the first real one.
- Review fixes (2026-10-15), Playwright driving local Chrome with the exact stylesheet and `anvil-base.css`: the centred-row sweep above; RTL/LTR alignment against `anvil-section-head`; a linked stat with no label shows an underlined figure, one with a label keeps the figure plain and the label underlined; link text reads "12,500+ orders (source)" and "30 days (source)". Screenshots at 375 and 800 px: divided 5 stats as 2 + 2 + 1 and 3 + 2, cards 2 + 1 centred, cards left-aligned 2 + 1 packed left.

## Uncertainties and assumptions
- `assets/anvil-stats.js` existed before this wave run and was treated as read-only (wave rule for existing assets); it was reviewed and exercised, not changed.
- Figures already on screen when the module runs never count (by design, to avoid a flash back to zero), so a stats section at the top of a page is static. Since the integration pass the editor applies the same in-view skip on first connect (block select still jumps to the final value), so the preview matches the storefront. The observer starts a figure as soon as 1 px of it is visible.
- Applied at integration (`anvil-stats.js:18`): a figure starting with `0` pads every slot (`0.125` counts `0.000` → `0.125`) and the Liquid `first != '0'` guard is gone. A related, shorter effect stays: a 3-digit tail after `.` is read as thousands, so a decimal such as `4.125` shows 3-digit values (`500`) for about the first 180 ms before `1.xxx` to `4.125`; the section cannot tell `4.125` (decimal) from `4.125` (European thousands).
- The 0.1 px rounding margin on the centred flex row was verified only in Chrome (which needed none); Firefox and Safari were not run.
- Prefix and suffix are stripped, so a merchant cannot force a space before a symbol suffix ("4.8 / 5" renders "4.8/ 5" when the suffix is typed "/ 5"); only words get the automatic space.
- A plain number of 12+ digits at the `--av-text-lg` floor can be wider than a narrow phone column; it does not wrap.
- In an RTL document, Latin figures with a neutral suffix ("12,500+") follow the Unicode bidi rules ("+12,500"); RTL stores typing RTL text are unaffected.
- Locale keys used: `anvil.editor.block_empty` and `anvil.editor.empty_section` (already in `locales/en.default.json`) and the new `anvil.stats.source_link` = "(source)", listed for the integrator. Until it lands, theme check reports `TranslationKeyExists` for it and the hidden text reads as a missing translation.

## Integration pass (2026-10-15)
- Locale key `anvil.stats.source_link` added; the `anvil-stats.js` fixes listed above landed.
- Placed on `templates/index.json` and `templates/product.landing.json`.

## Fix pass (2026-10-15)
- Setting ids follow the theme-wide vocabulary (CONVENTIONS §5; DECISIONS 82–100); the tables above use the new ids: `align` → `text_align`. Saved templates were migrated.
- Uses the shared pieces: columns from the shared `.av-grid` rule (DECISIONS 82); eager or lazy media from `snippets/anvil-above-fold` (DECISIONS 85); the editor-only empty note from `snippets/anvil-editor-empty` (DECISIONS 87).
- Availability: `disabled_on` groups ["header","custom.overlay"] (CONVENTIONS §4, DECISIONS 100).
