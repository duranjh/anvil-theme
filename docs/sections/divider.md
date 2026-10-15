# Section divider — `sections/anvil-divider.liquid`

_Section card, 2026-10-15 (wave 5). Built from `docs/agent-prompts/divider.md` (CONVENTIONS, spec card, chassis API, exemplars) and shopify.dev only. Revised the same day after review (flush rule per breakpoint, height for every style, mirror only where it shows, editor info, eager icon in the editor, forced colours)._

## Purpose
A decorative separator between two sections. Spec: `docs/SPEC.md` §4.2 "Section divider" (style line / wave / angle / icon, height, flip); design row: `docs/DESIGN-sections.md` §3 `anvil-divider`. Two families:

- **Shapes** (wave, curve, angle, peak, zigzag): an SVG band filled with a colour, normally the background of the next section's scheme, so the divider's own background (the section above) flows into the section below through the shape's edge.
- **Lines** (line, line with icon): a rule, optionally broken by a centred Lucide icon or an uploaded image.

No blocks, no JavaScript. Everything the section draws is `aria-hidden="true"`; only the optional chassis heading is exposed to assistive technology.

## Settings
Chassis first (the 13 ids from CONVENTIONS §4, pasted verbatim), then a header "Section divider" and 15 settings (28 in all). Settings that do not apply to the chosen style are hidden in the editor with `visible_if`.

| id | type | default | what it does |
|---|---|---|---|
| `style` | select `line` / `icon` / `wave` / `curve` / `angle` / `peak` / `zigzag` | `wave` | the separator. The spec's four (line, wave, angle, icon) plus curve, peak and zigzag, which are one SVG path each. The info text says shapes sit flush against their neighbours and that the paddings should be 0 |
| `color` | select `auto` / `accent` / `text` / `border` | `auto` | Automatic: shapes take the background of `shape_scheme`, lines and icons take `--av-border`. The other three use the section scheme's `--av-accent`, `--av-fg` or `--av-border` for any style |
| `shape_scheme` | color_scheme | `scheme-2` | the scheme whose background fills the shape (Automatic colour, shape styles only). A seamless transition needs both schemes: the info says to set Layout > Colour scheme to the section above and this to the section below, swapped when flipped; gradient backgrounds fill with their base colour |
| `height` | range 16–240 px, step 4 | 64 | band height at ≥ 750 px, every style: shapes fill it, lines and icons sit centred in it (an icon larger than the band grows it). Info says so |
| `height_mobile` | range 8–160 px, step 4 | 40 | band height below 750 px, every style |
| `flip` | checkbox | false | upside down: the fill hangs from the top edge, so the shape flows out of the section above; the band then renders before the heading |
| `mirror` | checkbox | false | left to right. Shown and applied for wave and angle only; curve, peak and zigzag are symmetric about x = 600, so the setting is hidden there and the Liquid adds no `--mirror` class |
| `waves` | range 1–6, step 1 | 2 | wave periods across the width (wave only) |
| `teeth` | range 4–48, step 2 | 24 | zigzag teeth across the width (zigzag only) |
| `line_style` | select `solid` / `dashed` / `dotted` / `double` | `solid` | border style of the rule (info: double needs 3 px or more) |
| `thickness` | range 1–8 px, step 1 | 1 | rule thickness |
| `line_width` | range 10–100 %, step 5 | 100 | rule width, centred, as a share of the content width |
| `icon` | select (27 decorative Lucide names) | `sparkles` | every value exists in `snippets/anvil-icon-*.liquid` |
| `icon_image` | image_picker | — | replaces the icon; info: square works best, upload only artwork you are entitled to use |
| `icon_size` | range 16–64 px, step 4 | 24 | icon box; an image is requested at 2× and fitted with `object-fit: contain` |

Preset "Section divider": wave, `width: full`, `pad_top: 0`, `pad_bottom: 0`, so the shape touches both neighbours as soon as it is added. The schema keeps the chassis defaults (48 / 48 / page) so chassis-lint sees the contract values; only the preset changes them.

`disabled_on.groups: ["custom.overlay"]` keeps it out of the floating-widget group; header and footer groups can take it (a wave under the header, a line in the footer).

## Markup and behaviour
- Root and inner from the chassis; inside `.av-section__inner` one `.av-divider__art` element (modifiers `--<style>`, `--c-<colour>`, `--shape`, `--flip`, `--mirror`, `--bleed`) plus the chassis head. The head comes first, except for a flipped shape, where the band comes first so it can touch the section above.
- Shapes: one `<svg viewBox="0 0 1200 100" preserveAspectRatio="none">` with a single `<path>` filled with `currentColor`. Paths are written once (filled from the bottom edge up) and flipped/mirrored with a static CSS `transform` on the SVG. Wave = a quadratic Bézier `Q` followed by smooth `T` segments (peaks at y 0, troughs at y 80, so the fill never thins to nothing); zigzag = `L` teeth built in a Liquid loop, coordinates rounded to 2 decimals; curve, angle and peak are fixed strings. Band height travels as inline `--av-divider-h` / `--av-divider-hd` for every style; the stylesheet maps them to `--av-divider-band` (phone value, desktop value from 750 px), which shapes use as `height` and lines/icons as `min-height`.
- Fill colour: with Automatic colour the art element also carries `av-scheme--<shape_scheme id>`, which redefines the `--av-*` tokens on that element only (no `.av-scheme`, so it paints no background), and `color: var(--av-bg)` picks up that scheme's background.
- Full bleed: with `width: full` a shape takes `margin-inline: calc(var(--av-gutter) * -1)`, so it reaches both viewport edges without `100vw` (no scrollbar overflow). With page or narrow width the shape stays inside the content box. Lines never bleed.
- No seam: the filled edge carries a −1 px margin (bottom, or top when flipped), so at fractional pixel positions the neighbour paints over fill of its own colour instead of a hairline of the divider's background.
- Flush neighbours: for shape styles a `{% style %}` block sets `margin-top: 0` on this section's `.av-section` (`#shopify-section-<id> > .av-section`) and on the next section's `.av-section` (`#shopify-section-<id> + .shopify-section > .av-section`), so Theme settings > Layout > section spacing (`--av-section-gap`) cannot open a band of the page colour inside the transition. The first selector is the instance scope CONVENTIONS §3 allows. The second reaches past it into the neighbouring section's wrapper, so it is an exception to §3, not covered by it; it is raised with the integrator to record in `docs/DECISIONS.md`. It touches only the margin that `.av-main .shopify-section + .shopify-section .av-section` sets (outside `.av-main` that margin is already 0, and a last section in main matches nothing in the footer group). When Show on is Phones only or Desktop only, both rules sit in `@media (max-width: 749px)` or `@media (min-width: 750px)`, the same breakpoints as `.av-show--mobile` / `.av-show--desktop`, so on the breakpoint where the divider is `display: none` the neighbours keep their gap.
- Why not a negative bottom margin on the shape instead: it would only collapse into the neighbour's gap with 0 bottom padding, and it would pull up a footer-group section, an app section or anything else that has no gap of its own, overlapping the shape.
- Lines: the art element is a flex row, `min-height` = band, `align-items: center`; its `::before` draws the rule with `border-top: var(--av-divider-t) var(--av-divider-ls) currentColor`. The icon variant adds `::after`, so the two rule halves sit either side of `.av-divider__mark`. Line style comes from a whitelisted `case`, never echoed raw.
- Icon images: `image_url` at 2× the icon size, `widths: "<size>, <2×size>"`, `sizes: "<size>px"`, `alt: ''` (decorative, inside the `aria-hidden` element). Eager by default and lazy only when `section.index > 2` (CONVENTIONS §11): a nil index (theme editor, Section Rendering API, static render, per shopify.dev's `section.index`) stays eager.
- A flipped band before the heading gives the heading a top margin and drops its bottom margin, which would otherwise escape a section with 0 padding and show the page colour.
- Forced colours (Windows High Contrast): the UA forces SVG fill and backgrounds (MDN, `forced-colors`), so a shape would paint a solid CanvasText bar on Canvas. `@media (forced-colors: active)` sets `visibility: hidden` on the shape, which keeps the band's height and leaves it empty. Lines and icon rules stay, drawn in CanvasText as HCM users expect.
- No motion; the chassis `reveal` is the only animation and already respects reduced motion and `html[data-animations="off"]`. Works the same without JavaScript.

## Honesty notes
- Purely decorative; nothing a shopper reads comes from this section except the optional chassis heading.
- The custom image `info` tells merchants to upload only artwork they are entitled to use; Anvil ships no artwork here beyond Lucide icons (ISC, credited in NOTICE).

## Checks run (2026-10-15)
- `shopify theme check --fail-level warning` (whole theme): 0 offenses in `sections/anvil-divider.liquid`. Every other offense reported (97, then 101 as other builders added files) is `TranslationKeyExists` in other wave sections and blocks (keys their builders list for the integrator). This section needs no locale key.
- `scripts/chassis-lint.py --only sections/anvil-divider.liquid --strict`: clean, 0 warnings. Whole-repo run: the two errors belong to `anvil-columns` and `anvil-pricing` (in progress in the same wave).
- `scripts/cleanroom-lint.sh`, `scripts/asset-audit.py`, `scripts/check-limits.sh`: clean.
- `{% stylesheet %}`: 1,763 bytes raw (limit 6,144), 625 bytes gzipped; every selector starts with `.av-divider`. No JS, no asset files.
- After the review fixes: theme check 0 offenses in this file (all 186 reported are `TranslationKeyExists` in other files); chassis-lint `--only … --strict` clean; cleanroom-lint, asset-audit, check-limits clean. `{% stylesheet %}` 2,059 bytes raw, 800 bytes gzipped. Headless Chrome on mock markup with the exact stylesheet: a desktop-only wave between A and B at 1280 px gives B's top = A's bottom + 64 − 1 (gap zeroed); at phone width the wave is `display: none` and A–B keep the 24 px gap. A double 3 px line at 50 % is 64 px tall on desktop and 40 px on phones, centred; a 48 px icon in an 8 / 16 px band grows it to 48 px.
- Render check of the exact stylesheet with mock markup (paths generated by the same arithmetic as the Liquid) in the Browser pane at 1280 × 900 and 375 × 812: wave into scheme 2, flipped curve with heading, mirrored angle into scheme 3, zigzag out of scheme 3, peak at page width, flipped five-period wave, solid/dashed/double/dotted lines, icon with double and dotted rules. No seams, no horizontal scroll on phones, bleed equals the 16 px phone gutter, flush neighbours with a 24 px section gap set. Not a Shopify render — the harness push (G3) is the first real one.

## Uncertainties and assumptions
- `visible_if` with `and` / `or` / `!=`: shopify.dev shows only `==`; `main-product` already ships an `or` condition and theme check accepts these. If the editor rejects a compound condition, the fallback is to drop `visible_if` from those settings (values still apply only to their styles in Liquid).
- `visible_if` on `header` settings follows shopify.dev's statement that sidebar settings support it; verify in the editor.
- The flush rule assumes each section's chassis root is a direct child of the `.shopify-section` wrapper (true for every `anvil-*` section; an app section with another root keeps its own margin).
- A scheme with a gradient background: the shape fills with the solid base colour (`--av-bg`); an SVG fill cannot take a CSS gradient. Said in the setting's info.
- `{% style %}` sits inside the section root, so Section Rendering swaps replace it with the rest of the section.
- Zigzag is capped at 48 teeth (well under any loop limit); the range ends there too.
- The spec card lists height for all four styles; it now applies to every style (shapes fill the band, lines and icons are centred in it). With the preset's 0 paddings a line therefore gets 40 / 64 px of room instead of none.

## Integration pass (2026-10-15)
- The neighbour rule for shape styles is accepted as a recorded exception (DECISIONS 77).

## Fix pass (2026-10-15)
- Uses the shared pieces: eager or lazy media from `snippets/anvil-above-fold` (DECISIONS 85).
- Availability: `disabled_on` groups ["custom.overlay"] (CONVENTIONS §4, DECISIONS 100).
