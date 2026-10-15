# Timeline — `sections/anvil-timeline.liquid`

_Section card, 2026-10-15. Wave-2 section, built from `docs/agent-prompts/timeline.md` (spec card `docs/spec/timeline.md`)._

## Purpose
An ordered set of up to ten steps (how it works, order journey, brand history). Each step has a marker (number, icon or dot), a title, an optional short label, text and an optional image. Phones always show a vertical list with the markers on a rail at the start edge. From 750 px the default layout puts the steps side by side on a horizontal line. Spec: `docs/SPEC.md` §4.2 "Timeline". Design row: `docs/DESIGN-sections.md` §3 `anvil-timeline` (L: `step` ×10, orientation, connector, no JS, `<ol>`). Planned for `product.landing.json` and `page.track-order.json`. No JavaScript.

## Settings
The 13 chassis settings come first, pasted from CONVENTIONS §4. A header "Timeline" follows, then 12 section settings, 25 in total:

| id | type | default | what it does |
|---|---|---|---|
| `orientation` | select `horizontal` / `vertical` / `alternate` | `horizontal` | layout on bigger screens: horizontal steps from 750 px; a vertical list; or a vertical list whose steps alternate sides of a centre line from 990 px. Phones are always vertical. |
| `cols_desktop` | select `auto` / `2`–`6` | `auto` | steps per row, horizontal only. `auto` puts up to 6 steps on one row and splits 7–10 into two balanced rows (`ceil(n / 2)`). A fixed number is capped at the step count. The step count is the number of steps that render (see Empty steps below), not `section.blocks.size`. |
| `text_align` | select `center` / `start` | `center` | horizontal only: markers and text centred under each other, or aligned to the start edge |
| `connector` | select `solid` / `dashed` / `dotted` / `none` | `solid` | style of the line between markers (dotted draws at 3 px so the dots read as round) |
| `connector_color` | select `border` / `accent` / `text` | `border` | `--av-border`, `--av-accent` or `rgb(var(--av-fg-rgb) / 0.6)` |
| `marker` | select `number` / `icon` / `dot` | `number` | marker content. In icon mode a step with no icon and no icon image shows its number. Dots are a fixed 16 px. |
| `marker_style` | select `filled` / `outline` / `soft` | `filled` | accent disc with `--av-on-accent` content; a 2 px accent ring; or a 12 % accent tint with accent content |
| `marker_shape` | select `circle` / `rounded` / `square` | `circle` | `50%`, `--av-radius-badge` (theme badge corners) or 0 |
| `marker_size` | range 32–72 px, step 4 | 48 | marker box. Numbers draw at 40 % of it, in the heading font at `--av-heading-weight` (the only heading face the tokens load, so no synthetic bold), and icons at 50 %. Dots ignore it. |
| `number_style` | select `plain` / `padded` | `plain` | `1, 2, 3` or `01, 02, 03` |
| `image_ratio` | select `adapt` / `1:1` / `4:5` / `3:4` / `16:9` | `16:9` | aspect ratio of the step images (`anvil-media`) |
| `image_position` | select `bottom` / `top` | `bottom` | image below the text or above it |

Tablets (750–989 px) show at most 3 steps per row, balanced and computed in Liquid: `rows = ceil(d / 3)`, `t = ceil(d / rows)`. So 4 steps per row become 2 + 2, and 5 or 6 become rows of 3. Phones show one column.

## Blocks
Local block `step`, with `limit: 10` and `max_blocks: 10`. `{{ block.shopify_attributes }}` sits on the `<li>`.

| id | type | default | note |
|---|---|---|---|
| `icon` | select (66 names from `anvil-icon`, plus `none`) | `none` | shown only when markers are icons. Every value exists in the `anvil-icon-*` lookup snippets. Its info also says a step needs a title, label, text or image to show on the storefront (an icon alone is a bare marker, so it is skipped). |
| `icon_image` | image_picker | — | replaces the icon in icon mode. Its info says to upload only artwork you are entitled to use. Requested at 2× its drawn size and given `alt=""`, because the marker is decorative. |
| `heading` | text | "Example step — replace with your own" | rendered as `<h3>`. Its info says to keep it short and promise only what your policies back up. |
| `label` | text | blank | short line shown above the title (a year, "Day 1"). Its info says any date or duration must match what really happens. |
| `text` | richtext | "<p>Example text — … Only promise timings your business really meets.</p>" | its info says processing and delivery times must match the shipping policy |
| `image` | image_picker | — | optional. `anvil-media` with `widths: 300, 450, 600, 900, 1100`; `sizes` follows the layout; the CSS caps it at 36rem (576 px) |

The "Timeline" preset sets the heading "How it **works**" and ships four order-journey steps (shopping bag, package, truck, home icons). Each step's label, title and text starts with "Example:" and says what to replace it with, so an unedited page makes no claim. Markers default to numbers, so the preset icons show only once the merchant switches markers to icons.

## Markup and behaviour
- Structure: `<ol class="av-timeline …" role="list">` → `<li class="av-timeline__step">` → `<span class="av-timeline__marker" aria-hidden="true">` + `<div class="av-timeline__body">`. The body holds, in DOM order: `h3.__title`, `p.__label`, `div.__text.av-rte`, `.av-media.__media`. `role="list"` keeps the list semantics that WebKit drops from `list-style: none` lists (base CSS resets `ol[role="list"]`).
- The label comes after the title in the DOM and is shown above it with flex `order: -1`. A screen reader then reads "Order placed, Day 1", and heading navigation lands on the title. The image uses `order: 1`, or `order: -2` when `image_position` is `top`, so it is rendered only once.
- The marker is decorative (`aria-hidden`). The `<ol>` carries the order, and the visual number repeats it.
- Headings: when the section heading is blank, a visually hidden `<h2>` (`anvil.timeline.heading`, "Timeline") keeps the step `<h3>`s from skipping a level (CONVENTIONS §3). This is the same pattern as `anvil-feature-grid`.
- Connectors: each step draws the line to the next one as a `::before` border, so no extra markup and no JavaScript is needed. The line leaves an 8 px (`--av-space-2`) gap before each marker.
  - Vertical: the line runs from below the marker to the bottom of the step. Each step pads its bottom by `--av-space-6`.
  - Horizontal: the line starts at the marker's edge and is `100% + column gap − marker − 2 × gap` wide, which ends it at the next marker in both alignments.
  - The last step draws no line, and neither does the last step of each row (`:nth-child(Nn)` per breakpoint). The tablet rules use a `750–989.98 px` range, so they never leak into desktop.
  - Logical properties (`inset-inline-start`, `border-inline-start`) keep RTL correct.
- Alternate (≥ 990 px): each step is a three-column grid (body | marker | body). Odd steps put the body in column 3. Even steps put it in column 1 with `text-align: end`. The line runs down the centre column.
- Empty steps (no title, label, text or image) are skipped on the storefront, so a bare marker never shows. The top `{% liquid %}` counts the steps that will render (every block in the editor, non-empty blocks on the storefront) before it builds the column classes, `sizes` and the list guard, so an emptied step never leaves an empty grid track. In the editor an empty step stays selectable: its marker is unnumbered and its body shows `anvil.editor.block_empty`. Numbers count only non-empty steps, so the editor and the storefront show the same numbers. When no step renders, the storefront prints nothing (no hidden `<h2>`, no empty `<ol>`), and the editor shows `anvil.editor.empty_section` when there are zero blocks.
- Images load lazily unless the section is one of the first two (or `section.index` is nil): then step 1's image loads eagerly in every orientation. Phones always stack the steps, so step 1 is the whole first visible row on the mobile page Lighthouse grades; on wider screens the other first-row images sit inside the browser's lazy-load distance and load as soon as layout runs. No `fetchpriority`, because a timeline is never the likely LCP.
- Forced colours: every marker has a 2 px transparent border, which Windows High Contrast draws, and the connector borders stay visible.
- No motion of its own. The chassis `reveal` is the only animation.
- `disabled_on.groups: ["*"]` keeps it out of the header, footer and overlay groups. Every template can take it.
- `{% stylesheet %}`: 5,668 bytes raw (limit 6,144), 1,360 bytes gzipped. Every selector starts with `.av-timeline`. There is no section JS and no asset file.

## Honesty notes
- Timelines often carry processing and delivery times. The `label`, `text` and `title` fields each have a one-sentence `info` saying that dates, durations and promises must match what really happens and what the shipping policy states (HONEST.md; CONVENTIONS §10).
- Preset copy is visibly example copy ("Example: days 1–2", "Example text — replace with the processing time stated in your shipping policy").
- No platform logos ship. The custom icon image `info` says to upload only artwork the merchant is entitled to use.

## Checks run (2026-10-15)
- `shopify theme check --fail-level warning` (whole theme, 192 files): the only finding in this file is `TranslationKeyExists` for `anvil.timeline.heading`, which is expected until the integrator adds the key. Other findings in that run belong to other wave sections' missing locale keys.
- `scripts/chassis-lint.py --only sections/anvil-timeline.liquid --strict`: clean, 0 warnings. Whole-repo run: clean.
- `scripts/cleanroom-lint.sh`, `scripts/asset-audit.py` and `scripts/check-limits.sh`: clean.
- Render check of the exact `{% stylesheet %}` body with mock markup, base CSS and mock tokens in a local headless Chromium at 375, 768 and 1280 px, plus RTL at 1280 px. It covered: horizontal centred numbers with an image; horizontal start-aligned outline icons, dashed accent line, 7 steps in 4 + 3; vertical dots with a dotted accent line; and alternate with tinted padded numbers, images on top and a text-colour line. The first render showed the step grid stretching its rows when a sibling was taller; `align-content: start` fixed it. This was not a Shopify render: the harness push (G3) is the first real one.

## Review fixes (2026-10-15)
- Step count now counts rendered steps, not blocks (columns, `--t`/`--d` classes, `sizes`, list guard).
- Editor: empty steps are unnumbered and show `anvil.editor.block_empty`; the `icon` info says what makes a step show.
- Marker numbers use `--av-heading-weight` instead of a hard-coded 600.
- Eager loading cut to step 1 in every orientation.
- Gates rerun after the fixes: theme check (only `TranslationKeyExists` for `anvil.timeline.heading` in this file, expected), chassis-lint `--only … --strict` clean, cleanroom-lint, asset-audit and check-limits clean. Not re-rendered in a browser: the changes are Liquid logic plus one `font-weight` value.

## Uncertainties and assumptions
- Locale key needed: `anvil.timeline.heading` = "Timeline" (visually hidden fallback heading).
- `sizes` uses `min(calc(100vw / N), 576px)`. A browser that does not parse `min()` in `sizes` skips that entry and falls back to the phone entry, which only over-downloads.
- The 36rem image cap is a fixed length rather than a token. No token covers a content image width.
- The dotted connector looks different across engines (Chromium draws round dots at 3 px). Check it in Safari during the G3 push.

## Integration pass (2026-10-15)
- Placed on `templates/product.landing.json` and `templates/page.track-order.json` (heading "What happens after you order"); labels keep their "Example:" prefix.

## Fix pass (2026-10-15)
- Setting ids follow the theme-wide vocabulary (CONVENTIONS §5; DECISIONS 82–100); the tables above use the new ids: `step_align` → `text_align`, `title` → `heading`. Saved templates were migrated.
- Uses the shared pieces: columns from the shared `.av-grid` rule (DECISIONS 82); eager or lazy media from `snippets/anvil-above-fold` (DECISIONS 85); the editor-only empty note from `snippets/anvil-editor-empty` (DECISIONS 87); a hidden fallback heading through `anvil-section-head` (DECISIONS 84).
- Availability: `disabled_on` groups ["header","custom.overlay"] (CONVENTIONS §4, DECISIONS 100).
