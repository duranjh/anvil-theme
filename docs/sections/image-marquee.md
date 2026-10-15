# Scrolling images — `sections/anvil-image-marquee.liquid`

_Section card, 2026-10-15 (wave 2). Spec: `docs/SPEC.md` §4.2 "Scrolling images (marquee)"; design row: `docs/DESIGN-sections.md` §3 `anvil-image-marquee` (L: `image` ×20, JS: MQ, a11y: duplicates hidden). Brief: `docs/agent-prompts/image-marquee.md`._

## Purpose
One or two endless rows of images moving sideways, for lifestyle photos, product shots or press images. Every row is the shared `<anvil-marquee>` component (`assets/anvil-marquee.js` + `assets/anvil-marquee.css`, both loaded by the section). The section adds no JavaScript of its own.

## Settings
First the 13 chassis settings, copied exactly from CONVENTIONS §4. Then a "Scrolling images" header and an "Images" header, with 10 settings of the section's own. 23 settings in all, so well under the 40-setting limit.

| id | type | default | what it does |
|---|---|---|---|
| `rows` | select `1` / `2` | `1` | With two rows the images are split in order. The first half (rounded up) goes on top and the rest below. A section with a single image always stays one row. |
| `reverse_second` | checkbox (`visible_if` rows = 2) | true | The second row moves in the opposite direction. |
| `direction` | select `left` / `right` | `left` | `left` = right to left. Written to the component's `direction` attribute. |
| `speed` | range 10–150, step 10 (no unit) | 40 | The component's `speed` attribute, in pixels per second. Each row's loop takes its track width ÷ speed, so two rows of different widths still move at the same pace. The info text says shoppers can pause the strip, and that it stays still under reduced motion. |
| `pause_hover` | checkbox | true | Writes `pause-on-hover`. When any image renders as a link, the section writes `pause-on-hover` whatever this setting says, so a click target never moves under the pointer. The info text says so. |
| `height` | range 80–480 px, step 10 | 240 | Image height from 750 px up. |
| `height_mobile` | range 60–360 px, step 10 | 160 | Image height below 750 px. |
| `image_ratio` | select `adapt` / `square` / `portrait` / `landscape` | `adapt` | `adapt` keeps each image's own proportions at the set height. A fixed shape (1, 3:4, 4:3) gives every image the same box with a `cover` crop. |
| `gap` | range 0–64 px, step 4 | 16 | Space between images, between wrapped lines and between the two rows. |
| `rounded` | checkbox | true | Uses `--av-radius-media` from Theme settings. A radius of 0 there means square corners. |

The preset sets `width: full`. When animations are on in Theme settings (`settings.animations_enabled`), full width adds `.av-image-marquee--bleed`, which pulls the strip out past the gutter so it runs from edge to edge. Under reduced motion the bleed is removed, so the static wrapped layout keeps the gutter. When animations are off in Theme settings, Liquid leaves the class out.

## Blocks
Local block `image`, `limit: 20`, `max_blocks: 20`. `{{ block.shopify_attributes }}` sits on each `<li>`.

| id | type | note |
|---|---|---|
| `image` | image_picker | Info: use photos you own or have permission to use, and do not present staged or stock photos as customer photos. |
| `alt` | text | Overrides the alt text saved with the image. Left blank, the image's own alt is used. |
| `link` | url | Optional. The image becomes an `<a>` only when it has an image and alt text, so a link always has an accessible name (the same rule as the icon bar), **and only while the strip stands still** (see "Links" below). The info text says both. |

The preset ships 8 empty `image` blocks, which render placeholder illustrations. That makes the unedited section obviously example content.

## Markup and behaviour
- The structure is `<div class="av-image-marquee …" style="--av-image-marquee-h-d / -h-m / -gap [/ -ar]">` → one or two `<anvil-marquee class="av-image-marquee__row" role="group" aria-label speed direction [pause-on-hover] style="--av-marquee-gap">` → `<ul class="av-image-marquee__track" role="list" data-marquee-track>` → `<li class="av-image-marquee__item">` → `<a>`/`<div class="av-image-marquee__media">` → `image_tag`.
- Liquid renders the blocks in one `for` loop. Each item is captured into `row_1` or `row_2`, so the chassis lint sees one loop with `shopify_attributes`.
- **Duplicates are hidden.** The component clones the track into `.av-marquee__clone` copies. Each clone has `aria-hidden="true"`, its ids removed and its links at `tabindex="-1"`. Screen readers and keyboard users therefore meet every image once. The component also adds a 44 px pause/play button per row (WCAG 2.2.2). Each row pauses while it has hover (when enabled), while it has focus, while the button holds it, and while a block is selected in the editor.
- **Row names.** Each `anvil-marquee` carries `role="group"` and an `aria-label`: `anvil.image_marquee.label` ("Scrolling images") for one row, `anvil.image_marquee.row` ("Scrolling images, row 1" / "row 2") for two. A screen reader announces the row name as focus enters it, so each row's "Pause" button is tied to the row it controls (WCAG 2.4.6). A name on the button itself would need the shared component (see Uncertainties).
- **Motion starts with the script.** The section's stylesheet sets `animation: none` on `.av-image-marquee__row:not(:defined) > .av-image-marquee__track` (specificity 0,3,0, above the component's 0,2,1). The track therefore stays still until `anvil-marquee.js` has defined the element. The upgrade sets the duration and inserts the clones in the same task, so the track and its clones start in step. Without JavaScript the strip does not move at all, so it never moves without a pause button (WCAG 2.2.2).
- **Reduced motion and animations off.** The component's CSS shows one static wrapped row from the first paint, with no clones and no button. Both rows then show every image exactly once. In that layout an image wider than the content box would be cut off on both sides. The section therefore caps `__item`, `__media` and `__img` at `max-width: 100%` and crops with `object-fit: cover`: through `.av-image-marquee--static` (Liquid adds it when `settings.animations_enabled` is off) and through a `prefers-reduced-motion: reduce` block.
- **Sizes.** Per instance, the heights travel as inline custom properties on the wrapper. CSS switches `--av-image-marquee-h` at 750 px. In `adapt` mode the `<img>` takes `height: 100%` and `width: auto`. `image_tag` writes `width`/`height`, so the box width comes from the image's ratio before it loads and nothing shifts. A fixed shape sets the box width to `height × --av-image-marquee-ar`. Adapt-mode placeholders cycle through the ratios 4:3, 3:4 and 1:1.
- **Images.** The ratio used for sizing is the image's own ratio. With a fixed shape it is raised to at least the box ratio, because `object-fit: cover` paints the image at height × max(own ratio, box ratio): a 3:2 photo in a 240 px square is drawn 360 px wide. `image_url: width:` is the larger of twice the desktop painted width and twice the phone painted width, capped at 1100 and at the original width. `widths` are the steps 160–960 that sit below that cap, plus the cap itself. `sizes` is `(min-width: 750px) <h × ratio>px, <h_mobile × ratio>px`, the painted width. Loading: when the section is one of the first two (or `section.index` is nil), the first five images of each row are `eager` and the rest `lazy`. In section 1, the very first image also gets `fetchpriority="high"` and `preload`. Everywhere else, every image is `lazy`.
- **Links.** A linked image needs alt text (block or image) so the link has a name. Keyboard focus inside a moving strip stops it at its start (`anvil-marquee.css`, `:has(:focus-visible)`) and the browser scrolls the focused image into view; `anvil-marquee.js` resets the scroll when focus leaves, so the loop restarts cleanly (WCAG 2.4.7, 2.4.11). Mouse clicks only pause the strip, so a link never moves under the pointer. Until the integration pass, links were off whenever animations were on.
- **Editor notes.** In `request.design_mode` the section counts the links it left out. It shows `anvil.editor.image_marquee_link_needs_alt` (count) when a linked image has no alt text. Shoppers never see these notes.
- **Focus.** The strip clips at its padding box. The section therefore gives each `anvil-marquee` `padding-block: var(--av-space-2)` and cancels it with an equal negative `margin-block`, which leaves room for the global focus ring without changing the layout. A linked image dims to 0.85 opacity on hover, with a transition only when motion is allowed.
- **Empty section.** With zero blocks, shoppers see nothing. In `request.design_mode` the section shows the shared note `anvil.editor.empty_section`.
- `disabled_on.groups: ["header", "custom.overlay"]`. The section can go in the footer group and on every template.

## Honesty notes
- The section can carry no claims: it holds images, alt text and links only. The image `info` warns against presenting staged or stock photos as customer photos, because a marquee of "customer" pictures is a common way to fake social proof.
- The examples are placeholder illustrations, never sample photos that could pass as real.
- The `speed` info points out that the strip can always be paused and stands still for shoppers who ask for less motion, so merchants are not tempted to remove the control.

## Checks run (2026-10-15, after the review fixes)
- `npm run gate -- image-marquee --no-paths --no-push --report-dir <scratchpad>` (G0 is the only git step, and `--no-paths` skips it):
  - G1 theme check: FAIL on the whole theme, 174 offenses in 38 files, all `TranslationKeyExists`. 5 of them are in this file: the new keys `anvil.image_marquee.row` (2 uses), `anvil.image_marquee.label`, `anvil.editor.image_marquee_links_moving` and `anvil.editor.image_marquee_link_needs_alt`, which the integrator adds at wave end. The rest are other wave builders' keys.
  - G2 cleanroom-lint, asset-audit and check-limits: PASS.
  - G2 chassis-lint: FAIL on 3 errors in other builders' in-progress sections (`anvil-columns`, `anvil-hero-slideshow`, `anvil-pricing`). `chassis-lint.py --only sections/anvil-image-marquee.liquid --strict`: clean, 0 warnings.
  - G3/G4: skipped (`--no-push`).
- `{% stylesheet %}`: 3,001 B raw, 960 B gzipped (limit 6,144 raw). Every selector starts with `.av-image-marquee`. 23 settings. The section ships no JS or CSS asset of its own. The shared files it loads are unchanged: `anvil-marquee.js` (1,441 B gz) and `anvil-marquee.css` (978 B gz).
- Headless Chromium with mock markup, `anvil-base.css`, `anvil-marquee.css`, `anvil-marquee.js` and this stylesheet:
  - 1280 px, module injected 2 s after load: before the module the track had no animation. 1.5 s and 4.5 s after it, the track and clone `currentTime` were equal (1517/1517 ms, 4517/4517 ms) and the gap between the track and the first clone was exactly 16 px.
  - The accessibility tree shows `group "Scrolling images"` holding the list and the "Pause" button.
  - 375 px with `data-animations="off"` + `.av-image-marquee--static`, and again under emulated reduced motion: a 4.5:1 image at 160 px (720 px wide) rendered 343 px wide inside the 343 px strip. No item overflowed the strip, there was no horizontal page scroll, and there were no clones and no button.

  This was not a Shopify render. The G3 push is the first real render.

## Uncertainties and assumptions
- **Links and focus (resolved at integration).** `assets/anvil-marquee.js`/`.css` now stop the strip on keyboard focus, scroll the item into view and reset the scroll on focus out, so `links_ok` was removed and links always render (checked in Chromium: the 8th link of a 12-link strip was fully visible on Tab, and the strip resumed at scroll 0 after Tab left it).
- **Re-cloning on resize (resolved at integration).** `anvil-marquee.js` copies the track animation's `currentTime` to every new clone, and the animation is gated on `:defined` in the component CSS, so this section's own `:defined` rule is now redundant but harmless.
- **Lazy images inside the moving strip.** Images beyond the strip's right edge are clipped by `overflow: hidden`, and browsers may not start loading them until they move into view. In the meantime the box shows the `rgb(var(--av-fg-rgb) / 0.06)` tint, and no layout shift occurs. Confirm in a real render whether pop-in is visible at slow speeds.
- **Clones and block selection in the editor (shared component).** Clones keep the `data-shopify-editor-*` attributes from `{{ block.shopify_attributes }}`, because the component strips ids only. Selecting a block only pauses the row, so the selected image can be frozen outside the strip. The fix is in `anvil-marquee.js`: strip `data-shopify-editor-block` from clones, and on `shopify:block:select` zero the animations and scroll the block into view. Check during G3.
- **Two pause buttons.** Each row has its own button, and both are named "Pause" (a toggle with `aria-pressed` since the integration pass). The row's group name now tells them apart for screen reader users. If the component later reads an optional `label` attribute into the button name, the section can pass the same row label there and drop the group label, to avoid hearing the name twice.
- **Locale keys** (added at integration; `anvil.editor.image_marquee_links_moving` was dropped with the interim link rule):
  - `anvil.image_marquee.label`: "Scrolling images"
  - `anvil.image_marquee.row`: "Scrolling images, row {{ number }}"
  - `anvil.editor.image_marquee_link_needs_alt`: one "1 linked image has no alt text, so it is not a link yet. Add alt text to the block or the image." / other "{{ count }} linked images have no alt text, so they are not links yet. …"

## Fix pass (2026-10-15)
- Setting ids follow the theme-wide vocabulary (CONVENTIONS §5; DECISIONS 82–100); the tables above use the new ids: `shape` → `image_ratio`. Saved templates were migrated.
- Uses the shared pieces: eager or lazy media from `snippets/anvil-above-fold` (DECISIONS 85); the editor-only empty note from `snippets/anvil-editor-empty` (DECISIONS 87).
- Availability: `disabled_on` groups ["header","custom.overlay"] (CONVENTIONS §4, DECISIONS 100).
