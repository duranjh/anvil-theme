# Logo list — `sections/anvil-logo-list.liquid`

_Section card, 2026-10-15 (wave 2, review fixes applied the same day). Spec: `docs/SPEC.md` §4.2 "Logo list" (up to 16 logos with image, link and alt; grid or marquee; greyscale; height). Design row: `docs/DESIGN-sections.md` §3 `anvil-logo-list` (L: `logo` ×16, JS: MQ optional, a11y/honesty: info "only where true"). Brief: `docs/agent-prompts/logo-list.md`._

## Purpose
A "featured in" row: press, retailer or partner logos under a short heading. It can be a static row or grid, or a scrolling strip built on the shared `<anvil-marquee>` component. The section ships no JavaScript or CSS asset of its own. In marquee mode it loads `assets/anvil-marquee.js` and `assets/anvil-marquee.css`, and nothing in grid mode.

## Settings
First come the 13 chassis settings, copied exactly from CONVENTIONS §4. Then come a "Logo list" header, an honesty paragraph, a "Logos" header and 14 settings of the section's own. That makes 27 settings, under the 40-setting limit.

The paragraph reads, in short: show a logo only where it is true (the outlet really featured you, the store really stocks you, the partner really works with you) and only with permission, and "As featured in" is a claim too.

| id | type | default | what it does |
|---|---|---|---|
| `layout` | select `grid` / `marquee` | `grid` | "Row or grid" or "Scrolling strip". The info says the strip always has a pause button, and that it stands still under reduced motion or when animations are off in Theme settings. |
| `cols_mobile` | select `auto` / `2` / `3` / `4` (`visible_if` grid) | `auto` | Below 750 px. `auto` ("Fit to width") is a wrapping flex row. A number makes an equal-column grid. |
| `cols_desktop` | select `auto` / `3` / `4` / `5` / `6` / `8` (`visible_if` grid) | `auto` | From 990 px. Tablets (750–989 px) use the same number capped at 4. `auto` is a wrapping row. 6 or 8 columns add `.av-logo-list--dense` (narrower tile padding from 990 px). |
| `speed` | range 10–150, step 10 (`visible_if` marquee) | 30 | Pixels per second, written to the component's `speed` attribute. |
| `direction` | select `left` / `right` (`visible_if` marquee) | `left` | `left` means right to left. |
| `pause_hover` | checkbox (`visible_if` marquee) | true | Writes `pause-on-hover`. |
| `logo_height` | range 16–120 px, step 4 | 40 | Logo height from 750 px up. |
| `logo_height_mobile` | range 16–96 px, step 4 | 32 | Logo height below 750 px. |
| `logo_max_width` | range 60–320 px, step 10 | 160 | Width cap. A wordmark wider than the cap is fitted inside it (`object-fit: contain`), so it gets shorter rather than wider. Phones cap it at 200 px, so a tiled logo still fits a 320 px screen. |
| `gap` | range 0–96 px, step 4 | 48 | Space between logos and between wrapped lines. Phones use half. |
| `greyscale` | checkbox | true | `filter: grayscale(1)` on the logo images. |
| `logo_opacity` | range 30–100 %, step 5 | 100 | Fades the logos. |
| `colour_hover` | checkbox (`visible_if` greyscale on or opacity below 100) | true | Restores full colour and opacity on hover (`@media (hover: hover)` only) and on a linked logo with `:focus-visible`. The Liquid also adds the class only when greyscale is on or opacity is below 100, so the setting is hidden whenever it would do nothing. |
| `tiles` | checkbox | false | Each logo sits on a tile with the card border width, border colour and corner radius from Theme settings. Tile padding is 12 × 8 px on phones (so 3 or 4 columns keep room for the logo), 16 × 24 px from 750 px, and 16 × 12 px from 990 px in 6- or 8-column grids. |

The row follows the chassis `head_align`: left, centre or right alignment of the heading also aligns the logos (`--av-logo-list-justify`). Fixed-column grids centre each logo in its cell. In marquee layout the static fallback row (reduced motion, animations off in Theme settings, or no JavaScript) follows the same alignment: a section-scoped rule (`.av-logo-list.av-logo-list--marquee .av-logo-list__strip > [data-marquee-track]`, specificity 0,4,0) outranks the component's centred static rules (at most 0,2,2). While the strip moves, the track is `max-content` wide, so the rule has no effect.

## Blocks
Local block `logo`, `limit: 16`, `max_blocks: 16`. `{{ block.shopify_attributes }}` sits on each `<li>`.

| id | type | note |
|---|---|---|
| `image` | image_picker | Info: upload only a logo you are entitled to show, from an outlet, store or partner that really featured, stocks or works with you. |
| `alt` | text | The brand's name. Screen readers read it, and a linked logo uses it as the link's name. Left blank, the alt text saved with the image is used. |
| `link` | url | Optional. The info suggests linking the article or listing that backs the mention, so shoppers can check it. The logo becomes an `<a>` only when it has an image and alt text, so a link always has a name (the same rule as the icon bar and scrolling images). |
| `new_tab` | checkbox (`visible_if` link set) | Opens the link in a new tab with `rel="noopener"` and adds the visually hidden `anvil.a11y.new_window` text to the link's name. |

## Presets
- **Logo list:** grid, heading "Example heading — as <strong>featured in</strong>", heading size small, 32 px padding, 6 empty logo blocks.
- **Scrolling logos:** the same, with `layout: marquee`, `width: full` and 8 empty logo blocks.

Empty logo blocks render `placeholder_svg_tag 'image'` on a tinted 5:2 box at the logo height. Shoppers see it too (CONVENTIONS §12), but the placeholder `<li>` carries `aria-hidden="true"`, so screen readers never announce empty list items. In the editor, a section that still holds placeholders shows the shared note `anvil.editor.example_content` ("Example content — replace before publishing") under the row. Shoppers never see that note.

## Markup and behaviour
- **Structure.** `<div class="av-logo-list [modifiers]" style="--av-logo-list-h-d/-h-m/-max-w-d/-max-w-m/-gap/-opacity/-justify [/-cm/-ct/-cd]">`. Inside it, either `<ul class="av-logo-list__grid" role="list">` (grid), or `<anvil-marquee class="av-logo-list__strip" speed direction [pause-on-hover]>` → `<ul class="av-logo-list__track" role="list" data-marquee-track>` (marquee). Each item is `<li class="av-logo-list__item">` → `<a>`/`<div class="av-logo-list__logo">` → `image_tag` (`.av-logo-list__img`). `role="list"` keeps list semantics in Safari after `list-style: none`.
- **One loop.** The blocks loop is captured once (`items`) and printed into whichever wrapper the layout needs, so the chassis lint sees a single loop with `shopify_attributes`, and no HTML tag is opened in one `if` branch and closed in another.
- **Sizes and no layout shift.** Each image has a fixed CSS height and `width: auto`. `image_tag` writes `width`/`height`, so the browser knows the width from the ratio before the file arrives. The cap is `max-width` plus `object-fit: contain`. In fixed-column grids the cap becomes `min(100%, cap)`, which is safe there because grid cells have a definite width. Flex rows keep the pixel cap only, because a percentage cap inside a content-sized flex item would size the item to the uncapped width.
- **Target size.** `.av-logo-list__logo` has `min-block-size: 24px`, so a linked logo is at least 24 px tall at the 16 px minimum height and 0 gap (CONVENTIONS §9, WCAG 2.5.8). It is a flex container with `align-items: center`, so the image stays centred.
- **Images.** The display width is height × aspect ratio, capped, for both the phone and desktop sizes. `widths` holds the phone width, the desktop width and twice the desktop width, never above the original upload. `sizes` is `(min-width: 750px) <desktop>px, <phone>px`. The largest file is therefore at most 640 px wide, the same 2× rule as the header and footer logos (see open questions). The first eight logos load `eager` only when `section.index` is nil (editor, Section Rendering API) or when `section.location == 'template'` and `section.index <= 2`. `index` restarts at 1 in every section group, so a logo list placed first in the footer group stays `lazy`. No logo gets `fetchpriority`: a logo row is never the LCP image.
- **Greyscale and hover.** Filters are switched, never animated (CONVENTIONS §8). Only opacity has a transition, and only under `prefers-reduced-motion: no-preference` and when Theme settings > Animations is on (`.av-logo-list--motion` is left out otherwise, which covers `html[data-animations="off"]` without a selector outside the section prefix).
- **Marquee.** The component clones the track into `aria-hidden` copies with untabbable links, so screen readers and keyboard users meet each logo once. It adds a 44 px pause/play button (WCAG 2.2.2) and pauses on hover (when enabled), on focus, while the button holds it and while a block is selected in the editor. The section gives the strip `min-height: 44px`, so the button is never clipped by the strip's `overflow: hidden` at small logo heights, and `padding-block: var(--av-space-2)` (8 px), so the focus ring of a linked logo is not clipped. There is no negative margin: the strip's box matches its layout box, so with 0 section padding nothing overlaps the neighbouring sections. The marquee gap is the section's gap (`--av-marquee-gap`), halved on phones like the grid. Full width plus animations on in Theme settings adds `.av-logo-list--bleed` (edge-to-edge strip). Reduced motion and no JavaScript drop the bleed, so the static wrapped row keeps the gutter.
- **No motion before the script.** `.av-logo-list__strip:not(:defined) > [data-marquee-track] { animation: none }` (0,3,0, above the component's 0,2,1 animation rule) keeps the strip still until `<anvil-marquee>` is defined. The clones and the pause button only exist once the module runs, so the strip never moves without a pause button: not while the module loads, not when it is blocked, and not when JavaScript is off (WCAG 2.2.2). Before definition the strip is a single static row, the same height as the moving strip, so nothing shifts when the script starts. Under `@media (scripting: none)` the strip wraps into a static row inside the gutter, so no logo is cut off.
- **Empty section.** With zero blocks shoppers see nothing. In `request.design_mode` the section shows the shared note `anvil.editor.empty_section`.
- **Link without alt text.** A logo with an image and a link but no alt text (block field and image alt both blank) renders without the link. In `request.design_mode` the section then shows `anvil.editor.logo_link_needs_alt` ("Add alt text to a linked logo so its link works. Shoppers never see this note.") under the row.
- `disabled_on.groups: ["header", "custom.overlay"]`, so the section can go on every template and in the footer group.

## Honesty notes
- A logo row is social proof, so the editor says three times that it must be true: in the section paragraph (featured, stocked or partnered, and with permission), in the logo `info` (only logos you are entitled to show) and in the link `info` (link the article or listing so shoppers can check it).
- The paragraph warns that the heading is a claim. The preset heading reads "Example heading — …", so an unedited section reads as an example.
- Anvil ships no logos. Placeholders are Shopify's generic image illustration, never real brands. `scripts/asset-audit.py` passes.

## Checks run (2026-10-15, after the review fixes)
- `shopify theme check --fail-level warning` (whole theme, 237 files): one finding in this file, `TranslationKeyExists` for the new key `anvil.editor.logo_link_needs_alt` (the integrator adds it). The other findings belong to other wave-2 files.
- `scripts/chassis-lint.py --only sections/anvil-logo-list.liquid --strict`: clean, 0 warnings. The whole-repo run reports errors only in other sections (`anvil-hero-slideshow`, `anvil-pricing`).
- `scripts/cleanroom-lint.sh`, `scripts/asset-audit.py`, `scripts/check-limits.sh`: clean.
- `{% stylesheet %}`: 5,501 B raw, 1,484 B gzipped (limit 6,144 raw). Every selector starts with `.av-logo-list`. No section JS. Shared files loaded in marquee mode only: `anvil-marquee.js` (1,458 B gz) and `anvil-marquee.css` (996 B gz), both unchanged.
- Mock render in headless Chrome (the exact `{% stylesheet %}` body, `anvil-base.css`, `anvil-marquee.css` and, where noted, `anvil-marquee.js`, with markup matching the Liquid output):
  - Script not loaded: track `animation-name: none`, no clones, no button, strip 56 px tall.
  - Script loaded: track animates, clones and button present, strip still 56 px tall (no shift), `margin-top: 0`.
  - `data-animations="off"` with left alignment: static wrapped row, track `justify-content: flex-start`, first logo at the gutter.
  - The `@media (scripting: none)` rules applied unconditionally: the strip wraps, the bleed is dropped, nothing moves. Chrome reports `(scripting: enabled)` with script on, so the feature is parsed.
  - Tiles with 4 phone columns: tile padding 12 × 8 px. 8 desktop columns at 1,000 px: 79 px cells, padding 16 × 12 px, a 4:1 test wordmark at 53 px wide.
  - Logo height 16 px, gap 0: each logo box is 24 px tall.

  This was not a Shopify render. `npm run gate` was not run, because its G0 paths-lint calls git and the wave rules forbid git. The G3 push is the first real render.

## Uncertainties and assumptions
- **Image width cap vs CONVENTIONS §11.** §11 caps logos and avatars at 200 px wide. Here the largest file is twice the displayed desktop width (up to 640 px), because a 4:1 wordmark at 40 px is already 160 px wide and a 200 px file would be soft on high-density screens. `anvil-header` and `anvil-footer` use the same 2× rule. This is raised to the integrator to settle in `docs/DECISIONS.md` or §11 ("logos: 2 × displayed width, max 640"). If 200 px is kept as a hard rule, the one-line change is `assign w_2 = w_2 | at_most: 200` after the `times: 2` line.
- **Eager rule vs CONVENTIONS §11 wording.** §11 says "`section.index <= 2` or nil". Because `index` restarts in every section group, this section also requires `section.location == 'template'`. Raised to the integrator so §11 says the same for every section.
- **Shared marquee component (all four issues resolved at integration, 2026-10-15).** `anvil-marquee.css` animates only once the element is `:defined` (and `html.no-js` shows the static row); clones drop `data-shopify-editor-block` and start in phase with the track; block select stops the strip and scrolls the logo into view; the pause button keeps the name "Pause" with `aria-pressed`; keyboard focus stops the strip and the browser scrolls the focused logo into view. This section's own "no motion before the script" rule is now redundant but harmless.
- **Hover on unlinked logos.** "Show full colour on hover" applies to every logo on mouse devices, not only linked ones, so the row feels alive. This could be limited to links if hover-without-action is judged misleading.
- **Locale keys.** One new key, `anvil.editor.logo_link_needs_alt`, for the integrator to add. The section also uses the existing `anvil.a11y.new_window`, `anvil.editor.example_content` and `anvil.editor.empty_section`.

## Integration pass (2026-10-15)
- Placed on `templates/index.json` (grid preset).

## Fix pass (2026-10-15)
- Setting ids follow the theme-wide vocabulary (CONVENTIONS §5; DECISIONS 82–100); the tables above use the new ids: `columns_mobile` → `cols_mobile`, `columns` → `cols_desktop`. Saved templates were migrated.
- Uses the shared pieces: eager or lazy media from `snippets/anvil-above-fold` (DECISIONS 85); the editor-only empty note from `snippets/anvil-editor-empty` (DECISIONS 87).
- Availability: `disabled_on` groups ["header","custom.overlay"] (CONVENTIONS §4, DECISIONS 100).
