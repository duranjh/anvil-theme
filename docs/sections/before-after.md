# `anvil-before-after` — Before/after slider (section card)

_Wave-2 section, 2026-10-15. File `sections/anvil-before-after.liquid`, editor name "Before/after slider". Built from `docs/agent-prompts/before-after.md` (CONVENTIONS, spec card `docs/spec/before-after.md`, CHASSIS-API, FORBIDDEN, two exemplars) plus `docs/HONEST.md` and `docs/DECISIONS.md`. Design row: `docs/DESIGN-sections.md` §3 (`anvil-before-after`: two images and a draggable divider, JS = compare, `<input type=range aria-label>`, info: real pairs)._

## Purpose
Two photos of the same subject stacked in one box, with a divider the shopper drags (or moves with the keyboard) to show more of one or the other. The section adds no JavaScript or asset file of its own. It composes the shared `<anvil-compare>` component (`assets/anvil-compare.js`, `assets/anvil-compare.css`, both read-only here) and keeps its own CSS in `{% stylesheet %}` (1,786 bytes raw, 711 B gzipped). The file is 400 lines; the card estimated about 230. Most of the extra lines are the schema, the per-image `sizes` code and comments.

## Markup (shopper view)
```
div#anchor.av-section.av-scheme--… .av-s-anvil-before-after        ← anvil-section-attrs
  div.av-section__inner
    .av-section-head (h2 + subheading)                              ← anvil-section-head, only when set
    link rel=stylesheet anvil-compare.css                           ← stylesheet_tag, deduped by URL
    figure.av-before-after  style="--av-before-after-r: 1.3333[; --av-before-after-r-m: 1]"
      anvil-compare.av-before-after__compare.av-enhance [vertical]  style="--av-compare-pos: 50%"
        div.av-compare__media.av-compare__media--before [aria-hidden when placeholder]
          img (image_tag) | svg.av-placeholder (lifestyle-1)
          span.av-compare__label.av-compare__label--before aria-hidden  ← only when the label is set
        div.av-compare__media.av-compare__media--after [aria-hidden when placeholder]
          img (image_tag) | svg.av-placeholder.av-before-after__ph--after (lifestyle-2)
          span.av-compare__label.av-compare__label--after aria-hidden   ← only when the label is set
        span.av-compare__handle aria-hidden
          span.av-before-after__grip.av-enhanced-only               ← chevron-left + chevron-right (anvil-icon, 16 px)
        input.av-compare__range.av-enhanced-only type=range 0–100 step 1 value=<start> aria-label [aria-orientation=vertical] data-compare-range
      figcaption.av-before-after__caption                           ← only when a caption is set
    script type=module anvil-compare.js
```
The section heading is the chassis `h2`. The labels and the caption are not headings. Each tag is the last child of its own image layer. The shared CSS positions it in the same corner as before (the layers fill the box), but the after layer now covers the before tag and the clip hides the after tag together with its photo. Wherever the divider sits, a tag only shows on the photo it names, including at the `start` values 0 and 100 and in a vertical split.

## Settings
The 13 chassis settings come first, word for word (CONVENTIONS §4). They are followed by a "Before/after slider" header and 9 settings: 22 non-header settings in total. The schema name is 19 characters, `disabled_on.groups: ["*"]` (templates only), and there are no blocks (the design row says "—").

| id | type | default | effect |
|---|---|---|---|
| `before_image` | image_picker | — | the layer underneath. Info (honesty): a real, unedited photo of the same subject as the after image, from the same angle and in the same light |
| `after_image` | image_picker | — | the top layer, clipped by the divider. Info (honesty): a result the product really produced, without retouching, with the caption saying how typical it is |
| `before_label` | text | "Before" | tag on the image's start corner. Blank hides it. Info: shown on the image; leave blank to hide it |
| `after_label` | text | "After" | tag on the end corner (bottom end when split top and bottom). Blank hides it. Info (honesty): shown on the image; leave blank to hide it; name a time such as 'After 4 weeks' only when that is when the photo was really taken |
| `start` | range 0–100 %, step 5 | 50 | where the divider sits before anyone moves it. Info: 0 shows the whole after image, 100 the whole before image |
| `image_ratio` | select `adapt` / `1:1` / `4:5` / `3:4` / `4:3` / `3:2` / `16:9` / `21:9` | `adapt` | box shape. Adapt uses the before image's own shape (the after image's when only that one is set; 4:3 while both are placeholders), so the before photo is never cropped. Info: a fixed shape crops both images to fill it |
| `image_ratio_mobile` | select `same` / `1:1` / `4:5` / `3:4` | `same` | shape below 750 px. Lets a wide desktop pair become taller on phones |
| `vertical` | checkbox | off | "Split top and bottom": writes the component's `vertical` attribute and `aria-orientation="vertical"` on the range. Info: shoppers drag up and down, and on touch screens a swipe that starts on the image moves the divider instead of scrolling the page |
| `caption` | inline_richtext | blank | small muted line under the pair, in the `<figcaption>`. Info (honesty): say what changed and over what time, and say so when results vary |

Preset "Before/after slider": heading "See the **difference**", caption "Example caption — say what changed, over what time, and whether results vary. Replace it with your own." With no images picked it renders two different placeholder illustrations: the before one on the light placeholder tint, the after one on a darker tint over an opaque scheme-background base, so the before drawing never shows through the after half and the divider reads as two clean panels.

## Behaviour
- **Component contract.** `<anvil-compare>` reads the range (`[data-compare-range]`), writes `--av-compare-pos` on itself and `aria-valuetext` (`"50%"`) on the range, clips the after layer with `clip-path` and moves the handle. Pointer drags anywhere on the box move the divider (pointer capture); arrow keys, Page Up/Down, Home and End work through the native range, which stays focusable but is visually hidden. The handle circle shows the focus ring (`:has(.av-compare__range:focus-visible)`).
- **No layout shift.** Liquid writes the start position twice: as the range's `value` and inline as `--av-compare-pos`. The first paint therefore already shows the divider where the script will put it. The box shape comes from CSS alone (`aspect-ratio` through `--av-compare-ratio`), and both images fill absolutely positioned layers with `object-fit: cover`, with `width`/`height` from `image_tag`.
- **Touch.** A one-finger swipe across the split moves the divider; one along it scrolls the page (the shared `touch-action: pan-y`, `pan-x` for a vertical split). The section adds `pinch-zoom` to both (`touch-action: pan-y pinch-zoom` / `pan-x pinch-zoom` on `.av-before-after__compare`), so a shopper can still pinch to inspect the photos when the gesture starts on the slider. A browser that does not know the value drops the declaration and keeps the shared rule.
- **Whole pair in view.** The figure's width is capped at `80svh × shape` (`80vh` fallback), so the slider is never taller than 80 % of the screen while the shopper drags. A portrait pair at page width becomes narrower and centred instead of running off the screen. The caption keeps the same width.
- **Phone shape.** `--av-before-after-r-m` is written only when `ratio_mobile` is not `same`. The section CSS picks it below 750 px and `--av-before-after-r` from 750 px up, then hands the result to the component as `--av-compare-ratio`.
- **Without JavaScript** (or if the module fails) the element never becomes `:defined`. Base CSS's enhancement gating (`.av-enhance:not(:defined) .av-enhanced-only`) hides the range and the grip arrows, so no focusable control does nothing. The shopper still sees both photos split at the start position, with the labels and the divider line.
- **Images.** `image_tag` with widths `375, 550, 750, 1100, 1500, 1800, 2200`. Focal points set in the image picker apply on their own (`image_tag` writes `object-position`). Each image gets its own `sizes`, built in Liquid from three upper bounds on its rendered width:
  - the container: `cap` px (`settings.page_width` / `settings.narrow_width`, none at full width) or `100vw`;
  - the 80vh height cap on the figure: `80vh × shape`;
  - the cover crop: an image wider than the box is scaled to the box height, so every bound is multiplied by `f = image shape / box shape` (at least 1), and the height bound becomes `80vh × the wider of the two shapes`.

  Every clause is one of those bounds, so whichever one matches never understates the width; the media conditions only choose the tightest. The height bound comes first under `(min-aspect-ratio: 0.8 × shape)` (where it beats `100vw`) and, with a cap, `(max-height: 1.25 × cap / shape px)` (where it beats the cap). Then come `(min-width: cap px) cap × f px` and finally `100 × f vw`. A phone shape adds the same clauses with its own shape under `(max-width: 749px)` first; the phone cap clause appears only when the cap is under 750 px. Example, page width 1400, a 3:4 pair: `(min-aspect-ratio: 600/1000) and (max-height: 2333px) 60vh, (min-width: 1400px) 1400px, 100vw`. At 1440 × 900 that resolves to 540 px, the displayed width; the old `(min-width: 1400px) 1400px, 100vw` asked for 1400 px. A Ruby emulation of the Liquid (same float semantics) checked 12 shape/cap/crop combinations over a 1,653-viewport grid against a layout model: no clause ever understated the rendered width, and the mean overstatement was 1.01–1.10× (the old string averaged 1.15–2.45× over for uncropped pairs and fell short at many viewports for cropped ones).
- **LCP.** In the first two sections (`section.index` ≤ 2, or nil in the editor and the Section Rendering API) both images load `eager`, because both are on screen together. Only in the first section (`section.index == 1`) does the before image (the full layer underneath) get `fetchpriority="high"`: there it is the likely LCP image, while as section 2 under a hero it would compete with the hero's image. Elsewhere it stays `auto`, the same rule as `anvil-hotspots`. Further down both load `lazy`. No preload header is sent.
- **Screen readers.** Each image's alt text is the label followed by the image's own alt from the Files admin ("Before: kitchen counter with stains"). With no own alt it is just the label, and with the label blank as well it falls back to the locale words "Before" / "After". The visible tags are `aria-hidden` so the word is not read twice. The range is named by `anvil.before_after.slider_label` and announces its percentage. Placeholders are `aria-hidden`.
- **Grip.** Two 16 px chevrons sit in the handle circle (`z-index: 1` above the component's `::after` circle) and turn 90° for a vertical split. They draw in the scheme's text colour on the scheme background, like the circle.
- **Motion.** Nothing animates; the divider follows the pointer directly. Reveal is the chassis setting only.
- **Editor.** A settings change re-renders the section and the new element upgrades itself (the custom element is already defined). No blocks, so no `shopify:block:select` handling.

## Honesty notes
- The design row's "info: real pairs" is carried by the `before_image` and `after_image` info texts: same subject, same angle, same light, unedited, a real result.
- The `caption` info asks for what changed, over what time, and whether results vary. The preset caption is worded as an example, so an unedited store shows an obvious placeholder line, not a claim.
- The default labels "Before" / "After" make no claim. The `after_label` info asks for a time in the tag ("After 4 weeks") only when that is when the photo was really taken. Nothing in the section computes or states a result.
- Each tag sits inside its own image layer, so it is covered and clipped with its photo: a tag can never label the other photo, whatever the start position or drag.

## Locale keys (added by the integrator; locale files are read-only during the wave)
- `anvil.before_after.slider_label` = "Before and after comparison"
- `anvil.before_after.before` = "Before"
- `anvil.before_after.after` = "After"

## Gate results (2026-10-15, after the review fixes)
- `shopify theme check --fail-level warning`: in this file only the three `TranslationKeyExists` findings for the keys above (lines 19, 23 and 218). The whole run shows 180 findings, all `TranslationKeyExists`, the rest from other wave sections' keys.
- `scripts/cleanroom-lint.sh`, `scripts/asset-audit.py` and `scripts/check-limits.sh` are clean. `scripts/chassis-lint.py --only sections/anvil-before-after.liquid --strict` is clean; the full run's 4 errors and 3 warnings are in other sections (columns, hero-slideshow, pricing, tabs).
- Shared assets this section loads: `anvil-compare.js` 3,046 B raw / 1,235 B gz, `anvil-compare.css` 2,351 B raw / 781 B gz. The section CSS is 1,786 B raw / 711 B gz (Python `gzip.compress`).
- A static render of the exact markup with the base, section and shared CSS (headless Chrome) confirmed:
  - tags at start 0, 8, 50, 92 and 100 and in a vertical split: each tag shows only on its own photo and is cut off with it;
  - the placeholder pair: the before drawing no longer shows through the after half.
- The first build's render confirmed:
  - the cap: 819 × 614 px at a 768 px-high window, which is 80 %;
  - the phone shape: 1:1 at 375 px;
  - the vertical box (3:4) and the 90° grip;
  - keyboard and pointer input updating `--av-compare-pos` and `aria-valuetext`;
  - focus moving to the range after a drag.

## Open questions
All of these are in `assets/anvil-compare.js` / `assets/anvil-compare.css`, which this section composes but does not own.
- **Touch scroll in horizontal mode (review: major).** `#onDown` starts a drag on every `pointerdown`: it captures the pointer, calls `#onMove` straight away and so jumps the divider to the finger. When the browser then takes a vertical page swipe (`pointercancel`), `#onUp` also focuses the range. Shoppers scrolling past the section on a phone keep moving the divider. Needed change: for `e.pointerType === 'touch'`, `#onDown` only records the start x/y. Dragging (`setPointerCapture` plus the first `#onMove`) starts once `|dx| > |dy|` and `|dx| > 8px`, with the axes swapped when `vertical`. Bind `pointercancel` to `#release` only, without the focus. Mouse and pen keep the jump-to-point behaviour.
- **Vertical keyboard direction.** For a vertical split the native range raises its value on Arrow Up, which moves the divider down, so sighted keyboard users see the opposite of what they press. Needed change: when `vertical` is set, a keydown handler on the range maps Arrow Up to value − step and Arrow Down to value + step, then calls `preventDefault()` and `#apply()`. Alternatively the range could store `100 - pos` for vertical and map it back in `#apply` / `#onMove`.
- **Pinch-zoom.** The shared `touch-action: pan-y` (`pan-x` when vertical) blocks pinch-zoom for gestures that start on the slider. This section already overrides it with `pan-y pinch-zoom` / `pan-x pinch-zoom`; the component CSS should carry the same values so every user of `<anvil-compare>` gets them, and the section override can then go.
- **RTL.** `anvil-compare.css` positions the handle and the clip with physical `left`, but the labels with logical `inset-inline-*`. On a right-to-left storefront both tags would land on the side their layer does not show (the before tag at the right edge, under the after layer; the after tag at the left edge, inside the clipped part), so both would be hidden at the middle position. Since the tags moved into their layers they can be hidden but never mislabel. Anvil is English-only in v1.0, so this is noted for the component owner.

## Integration pass (2026-10-15)
- Applied in the shared component: touch drags start only after 8 px along the split axis (a page swipe that starts on the slider scrolls), `pointercancel` releases without focusing the range, ArrowUp/ArrowDown move a vertical divider in the direction pressed, and `anvil-compare.css` keeps pinch-zoom (`pan-y pinch-zoom` / `pan-x pinch-zoom`), so this section's own `touch-action` override was removed. Still open: RTL placement of the handle and clip in `anvil-compare.css`.
- Placed on `templates/product.landing.json` (placeholder pair until images are picked).

## Fix pass (2026-10-15)
- Setting ids follow the theme-wide vocabulary (CONVENTIONS §5; DECISIONS 82–100); the tables above use the new ids: `ratio` → `image_ratio`, `ratio_mobile` → `image_ratio_mobile`. Saved templates were migrated.
- Uses the shared pieces: eager or lazy media from `snippets/anvil-above-fold` (DECISIONS 85).
- Availability: `disabled_on` groups ["header","custom.overlay"] (CONVENTIONS §4, DECISIONS 100).
