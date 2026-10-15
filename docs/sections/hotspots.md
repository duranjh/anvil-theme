# `anvil-hotspots` — Image hotspots (section card)

_Wave-2 section, 2026-10-15. File `sections/anvil-hotspots.liquid`, editor name "Image hotspots". Built from `docs/agent-prompts/hotspots.md` (CONVENTIONS, spec card `docs/spec/hotspots.md`, CHASSIS-API, FORBIDDEN, two exemplars), `docs/HONEST.md` and `docs/DECISIONS.md`. Spec: SPEC §4.2 "Product features (hotspots)". Design row: DESIGN-sections §3 `anvil-hotspots` (image with numbered dots + bullet list, local `spot` ×12, image side and dot style, JS = hotspots, dots are `<button aria-expanded>`, the list is the accessible source)._

## Purpose
One product photo with up to 12 numbered dots. A shopper opens a dot to read a short title and description. The same points are repeated as a numbered list beside the image (left or right on desktop) or under it (always on phones, and on desktop when the image is set to sit above the list).

It composes the shared `<anvil-hotspots>` component (`assets/anvil-hotspots.js` and `assets/anvil-hotspots.css`, read-only here) and the `anvil-media` snippet for the image, and keeps its own CSS in `{% stylesheet %}`. It adds one small module of its own, `assets/anvil-hotspots-section.js` (841 B raw, 492 B gzipped), which closes an open popover when the shopper taps the image away from the dots (see Behaviour).

## Markup (shopper view)
```
div#anchor.av-section.av-scheme--… .av-s-anvil-hotspots              ← anvil-section-attrs
  div.av-section__inner
    .av-section-head (h2 + subheading)                                ← anvil-section-head, only when set
    h2.av-visually-hidden "Product features"                         ← only when the heading is blank and a list title renders
    link rel=stylesheet anvil-hotspots.css                            ← stylesheet_tag, deduped by URL
    div.av-hotspots.av-hotspots--<left|right|top> --v-<top|center> --dot-<accent|light|dark> --dot-<sm|md|lg> [--still] [--titles] [--solo]
        style="--av-hotspots-media: 55%"
      div.av-hotspots__figure                                         ← container "av-hotspots" (inline-size), z-index 1
        anvil-hotspots.av-hotspots__stage.av-enhance
          div.av-media.av-media-frame.av-hotspots__img                ← anvil-media, ratio adapt (never cropped); product-1 placeholder
          per spot:
            div.av-hotspots__spot-wrap style="--av-spot-x: 32%; --av-spot-y: 26%" {{ block.shopify_attributes }}
              button.av-hotspots__spot.av-enhanced-only data-spot aria-expanded=false aria-controls=<pop id>
                span.av-hotspots__num aria-hidden  "1"
                span.av-visually-hidden            "1. <title>"
              span.av-hotspots__marker.av-fallback-only aria-hidden "1"
            div.av-hotspots__pop#anvil-hotspot-<section id>-<block id> hidden  (same --av-spot-x/y)
              p.av-hotspots__pop-title  (span.av-hotspots__pop-num aria-hidden + title)
              div.av-hotspots__pop-text.av-rte  (description)
      ol.av-hotspots__list role=list
        li.av-hotspots__item
          span.av-hotspots__badge "1"
          div.av-hotspots__body
            h3.av-hotspots__title                                     ← only when the spot has a title (or is an editor placeholder)
            div.av-hotspots__text.av-rte [.av-hotspots__text--lead]   ← --lead when the spot has no title
    script type=module anvil-hotspots.js                              ← when a spot renders, and always in the editor
    script type=module anvil-hotspots-section.js                      ← same condition
```
The section heading is the chassis `h2`. Each list title heads its own description, so it is a content heading, an `<h3>` (CONVENTIONS §3), as in `anvil-feature-grid`, `anvil-timeline` and `anvil-multicolumn`. Screen-reader users can jump between the features by heading. When the chassis heading is blank, a visually hidden `<h2>` (`anvil.hotspots.heading`, "Product features") keeps the outline from skipping a level. The popover titles stay paragraphs, so the outline never lists the same title twice.

## Settings
The 13 chassis settings come first, word for word (CONVENTIONS §4). Then a header "Image hotspots" and 8 settings, split by "Dots" and "List" headers: 21 non-header settings in total. Schema name "Image hotspots" (14 characters), `max_blocks: 12`, `disabled_on.groups: ["*"]` (templates only).

| id | type | default | effect |
|---|---|---|---|
| `image` | image_picker | — | the photo. Info (honesty): use a photo of the real product; it is never cropped, so the dots stay on target at every screen size. Alt text comes from the image's own alt in Files |
| `image_side` | select `left` / `right` / `top` | `left` | desktop position: left or right of the list, or above it with the list in 2 (750 px) or 3 (990 px) columns. Info: on phones the list always sits under the image |
| `image_width` | range 40–70 %, step 5 | 55 | image column share from 750 px when the image sits beside the list (`--av-hotspots-media`) |
| `valign` | select `top` / `center` | `center` | vertical alignment of the list against the image, side layouts only |
| `dot_color` | select `accent` / `light` / `dark` | `accent` | dot colour: accent fill with the on-accent number, scheme background with the text colour, or text colour with the background colour. The list numbers follow (accent fill, outline, or text-colour fill, so a "background colour" badge never disappears on the section background) |
| `dot_size` | select `sm` / `md` / `lg` | `md` | visible dot 22 / 28 / 36 px. Every size keeps the component's 44 × 44 px button |
| `dot_pulse` | checkbox | off | lets the component's pulsing ring run around closed dots. Off adds `.av-hotspots--still`. The component already stops it under `prefers-reduced-motion` and `html[data-animations="off"]`. Info (honesty): the ring has no pause button, so it can distract some shoppers (WCAG 2.2.2) |
| `list_text` | checkbox | on | off = titles-only list: descriptions are visually hidden in the list (still read by screen readers) and open from the dots. A description shows again while a link inside it has keyboard focus, and always for a spot without a title (`--lead`), so no list item is a bare number. Descriptions stay visible when the component is not defined (no JavaScript, or a browser without `:has()`) |

## Blocks
Local block `spot` ("Hotspot"), at most 12 (`limit` and `max_blocks`).

| id | type | default | notes |
|---|---|---|---|
| `x` | range 0–100 %, step 1 | 50 | distance from the image's left edge. 100 steps, within Shopify's 101-step range limit |
| `y` | range 0–100 %, step 1 | 50 | distance from the top edge |
| `heading` | text | "Example feature — replace me" | Info (honesty): name a part or feature the product in the image really has |
| `text` | richtext | `<p>Example detail — say what this part does. Describe only what is true for your product.</p>` | Info (honesty): shown in the list and the popover; materials, sizes, certifications and test results must match the real product |

Preset "Image hotspots": heading "A closer **look**" and four spots at (32, 26), (70, 38), (44, 64) and (76, 80) titled "Example: the main material", "Example: a part shoppers ask about", "Example: a size or fit detail" and "Example: care or use", each with an "Example detail — …" description. With no image picked the `product-1` placeholder fills a square box, so the preset looks finished.

## Behaviour
- **One loop.** A single `{% for block in section.blocks %}` builds two strings with `capture`: the dots and popovers for the image, and the list items. The stage prints first, then the list, so reading and focus order are image, then list, on every layout (the right-hand image is moved with `order` only from 750 px).
- **Numbering.** Numbers count rendered spots only. A spot with neither title nor description is skipped on the storefront. In the editor it stays, with `anvil.editor.block_empty` as its title (`.av-example-note`), so the merchant can still select it.
- **Component contract.** Each `[data-spot]` button (styled through its class `.av-hotspots__spot`, never through the data attribute, CONVENTIONS §1) names its popover with `aria-controls`. The popovers sit as direct children of `<anvil-hotspots>` right after their dot's wrapper, not inside it. The component looks popovers up by id, so its behaviour is unchanged: click, Enter or Space toggles, one popover open at a time, Esc closes and returns focus to the dot, a click or focus outside closes, and `shopify:block:select` on a spot opens it (`block.shopify_attributes` is on the dot wrapper, inside the element). Tested in a static mock: Enter opens (`aria-expanded="true"`, popover shown) and Esc closes with focus back on the dot.
- **Popover placement.** Because the popovers are children of the stage, the section CSS places them against the image instead of the 44 px wrapper. They read `--av-spot-x/y` (also written inline on each popover), clamped to 16 px from the edges, and the component's own flip classes. A popover sits under its dot, or above it for a dot in the lower 40 % (`av-is-flip-y`). On a narrow image (under 560 px wide, measured with a container query on `.av-hotspots__figure`) it is a panel as wide as the image minus 8 px each side, so it can never leave the screen on a phone. From 560 px it is a card `min(280px, 60%)` wide, centred on the dot, or start- or end-aligned near the edges (`av-is-left` / `av-is-right`). Measured in the mock at 375, 820 and 1280 px: no horizontal scroll and every card inside the image width.
- **Focused dot above an open popover.** Popovers have the component's `z-index: 2`, and tabbing to another dot does not close the open popover (focus stays inside `<anvil-hotspots>`). Below 560 px of image width the popover is a full-width panel, so it can cover the next dot. `.av-hotspots__spot-wrap:focus-within { z-index: 3 }` paints the focused dot above it (WCAG 2.4.11 Focus Not Obscured). Checked in headless Chrome at 500 px with the four preset spots: open dot 1, focus dot 2, and `elementFromPoint` at dot 2's centre now returns dot 2 (without the rule it returned popover 1's title). The same holds for dot 3 and at 1280 px.
- **Tap on the image closes.** The component closes a popover on a second click on its dot, on Esc, or on a click or focus outside the whole element, but not on a tap on the image itself. `assets/anvil-hotspots-section.js` adds that: one `click` listener on `document`, scoped to `.av-hotspots anvil-hotspots`, calls the component's public `closeAll()` when the click is inside the stage but outside every `.av-hotspots__spot-wrap` and `.av-hotspots__pop`. Clicks inside a popover (text, links) keep it open, and a tap on a covered dot's area first closes the popover over it. With the listener on `document`, editor re-renders need no re-binding. Checked in the mock: a click on popover text keeps it open, a click on the image closes it, and dot toggles still work.
- **Dots near an edge.** Positions are clamped to 16 px from each edge, so the visible dot always stays inside the image, and the 44 px button sticks out by at most 6 px, inside the smallest page gutter (12 px).
- **Without JavaScript** the element never becomes `:defined`. Base CSS's enhancement gating hides the buttons (`.av-enhanced-only`) and shows a plain numbered marker in the same place (`.av-fallback-only`, aria-hidden), so no focusable control does nothing. The full content is in the list. Popovers stay `hidden`.
- **Open dot.** The open dot (`aria-expanded="true"`) gets a 3 px ring in the scheme background colour (accent for the "background colour" style).
- **Images.** `anvil-media` with ratio `adapt` (the image's own shape, so nothing is cropped and the percentages stay true). Beside the list: widths `375, 550, 750, 900, 1100` (the half-width cap, CONVENTIONS §11), plus `1500` only at full width, and `sizes` `(min-width: max(W, 750)px) W×img_w px, (min-width: 750px) img_w vw, 100vw` from `settings.page_width` / `narrow_width`. The first breakpoint is `W | at_least: 750` (`cap_bp`, as in `anvil-image-text`), because below 750 px the layout is stacked and the image is about 100vw wide. A narrow width of 600 px would otherwise tell the browser the image is 330 px wide at a 700 px viewport. Above the list, or alone: widths up to 2200 and `(min-width: Wpx) Wpx, 100vw`. Full width drops the cap. The image loads eagerly in the first two sections (or with a nil `section.index`) and gets `priority` (fetchpriority high, preload) in the first.
- **Empty states.** No blocks on the storefront: the image alone at full width (`--solo`). No blocks in the editor: `anvil.editor.empty_section` in the list column.
- **Motion.** Only the optional pulse (the component's keyframes on `transform`/`opacity`). Nothing else animates. Reveal is the chassis setting.
- **CSS.** `{% stylesheet %}` is 5,873 B raw and 1,563 B gzipped (limit 6,144 raw). Every selector starts with `.av-hotspots`. Component overrides are higher-specificity selectors scoped to `.av-hotspots`, for example `.av-hotspots .av-hotspots__stage .av-hotspots__spot::before` (0,3,1) against the component's `anvil-hotspots [data-spot]::before` (0,1,2). The `--still` rule (0,3,1) beats the pulse rule (0,2,2). The shared files the section loads measure `anvil-hotspots.js` 3,939 B raw / 1,371 B gzipped and `anvil-hotspots.css` 2,563 B raw / 922 B gzipped (gzip -9). The section module `anvil-hotspots-section.js` is 841 B raw / 492 B gzipped (budget 2 KB).
- **Component internals this section relies on.** The overrides depend on the component's class names `av-is-flip-y`, `av-is-left` and `av-is-right`, its 44 px button with `::before` / `::after` dots, and the popover's `z-index: 2`. A change to `assets/anvil-hotspots.css` can break this section silently (see Open questions).

## Accessibility
- The ordered list (`role="list"`, so Safari keeps list semantics with `list-style: none`) carries every title and description, with the number as visible text. Titles are `<h3>` under the section `<h2>` (a visually hidden one when the heading is blank).
- Titles-only list: the hidden descriptions stay in the accessibility tree. A link inside one becomes visible while it has focus (WCAG 2.4.7). While its popover is closed, that link is reached only once, because a closed popover is `hidden`.
- Each dot is a `<button type="button">` with `aria-expanded` and `aria-controls`. Its name is "N. Title" (visually hidden text, so it translates with the page), or "N. " plus the first ten words of the description when the title is blank. The visible label "N" starts the name (WCAG 2.5.3).
- The tap target is 44 × 44 px at every dot size. Focus uses the global `:focus-visible` ring. A focused dot always paints above an open popover (WCAG 2.4.11), and a tap on the image away from the dots closes an open popover.
- The pulse is off by default: a looping animation without a pause control conflicts with WCAG 2.2.2 for shoppers who have not set reduced motion. The setting's info now tells the merchant about that cost, not only what the setting does.

## Honesty notes
- The image info asks for a photo of the real product. The title and description info texts ask for features the product really has, and for materials, sizes, certifications and test results that match it.
- Preset titles and descriptions all start with "Example", so an unedited store shows obvious placeholders, not claims.
- Nothing in the section computes or states a price, a saving, stock or a rating.

## Locale keys
One new key, for the integrator: `anvil.hotspots.heading` = "Product features" (the visually hidden fallback `<h2>`). Until it lands, theme check reports `TranslationKeyExists` for it on this file. The section also uses `anvil.editor.block_empty` and `anvil.editor.empty_section`, which already exist. Dot names are built from the number and the merchant's own title, so they need no English words.

## Open questions
- **Component owner (review finding, not fixable in this wave).** This section overrides the component's popover placement and dot styling with higher-specificity rules, against CONVENTIONS §3 ("compose, do not restyle"). The narrow-container panel placement, a focused-dot-above-popover rule, and custom-property hooks for the dot fill, foreground and inset (for example `--av-hotspot-dot-bg`, `--av-hotspot-dot-fg`, `--av-hotspot-inset`) belong in `assets/anvil-hotspots.css`. A stage-click close belongs in `assets/anvil-hotspots.js`. Once those exist, this section would only set custom properties, and `anvil-hotspots-section.js` could be deleted. Until then, the component's header comment should say that this section relies on `av-is-flip-y` / `av-is-left` / `av-is-right`, the `::before` / `::after` dots and the popover's `z-index: 2`.
- The shared component CSS places `.av-hotspots__pop` relative to the 44 px wrapper, centred on the dot. Inside the wrapper, a 280 px popover for a dot between 30 % and 70 % of a 343 px phone image starts up to 37 px left of the image, past the 16 px gutter, so the page scrolls sideways. This section avoids it by placing popovers as children of the stage, which the component's id lookup allows. `anvil-shoppable-image` will meet the same case. Either it copies this placement, or the component CSS gets a narrow-container rule (the component owner decides).
- The popovers repeat the list for sighted shoppers, so screen-reader users who open a dot hear the same text again. This matches the design row ("list is the a11y source"). The repeat was kept on purpose: hiding the popover from assistive technology would hide the very content its button says it controls.
- `.av-hotspots__figure` has `z-index: 1`, so a popover that runs past the section's edge stays above the next section. If a future section sets a higher z-index on its own content, a long popover near the bottom could pass under it.

## Review fixes (2026-10-15)
All nine findings applied. Two of them could not be finished inside this section's files, and the open question above covers them.
- **Major, focus not obscured (a11y).** Added `.av-hotspots__spot-wrap:focus-within { z-index: 3 }`. For pointer users, added `assets/anvil-hotspots-section.js`: a tap on the image away from the dots and popovers closes the open popover. Both checked in headless Chrome (see Behaviour).
- **Major, hidden list links focusable (a11y).** The titles-only hide rule is now `.av-hotspots__text:not(:focus-within, .av-hotspots__text--lead)`, so a focused link shows its description. The reviewer's suggested separate `:focus-within` rule (0,3,0) would have lost to the hide rule (0,4,0, because `:has(.av-hotspots__stage:defined)` counts as (0,2,0)), so the exclusion went into the hide rule itself. Checked in the mock: the description is 1 px wide, about 428 px wide once its link has focus, and 1 px again after blur.
- **Minor, `sizes` breakpoint (perf).** `cap_bp = cap | at_least: 750` for the side layouts.
- **Minor, srcset cap (perf).** Side layouts stop at 1100 and add 1500 only at full width.
- **Minor, untitled spot in titles-only mode (spec).** `av-hotspots__text--lead` keeps the description visible (in the mock it stays full width while titled descriptions collapse to 1 px). The `list_text` info text says so.
- **Minor, list titles as headings (a11y).** List titles are `<h3>` (the base reset already gives them `margin: 0`, so no extra rule was needed), with a visually hidden `<h2>` when the heading is blank. Popover titles stay `<p>`.
- **Minor, styling on `[data-spot]` (conventions).** All five selectors now use `.av-hotspots__spot`, with specificity checked as listed under CSS. `[aria-expanded="true"]` is kept.
- **Minor, component overrides (conventions).** The dependency is recorded under CSS and handed to the component owner (Open questions). The section cannot edit the shared files.
- **Minor, pulse info (honesty).** The info now names the missing pause button and WCAG 2.2.2.

Gates after the fixes: theme check, whole theme. Its only finding in this file is `TranslationKeyExists` for `anvil.hotspots.heading`, which is expected. The other 183 findings are the same check in other wave files. `chassis-lint --only sections/anvil-hotspots.liquid --strict` is clean. The whole-tree run shows errors only in `anvil-pricing` and `anvil-tabs`. cleanroom-lint, asset-audit and check-limits are clean.

## Integration pass (2026-10-15)
- `assets/anvil-hotspots.css` now raises the wrapper of an open popover (`:has([aria-expanded="true"])`) and of a focused dot (`:focus-within`). The narrow-container popover placement and the close-on-tap-inside behaviour still live in this section and its module.

## Fix pass (2026-10-15)
- Setting ids follow the theme-wide vocabulary (CONVENTIONS §5; DECISIONS 82–100); the tables above use the new ids: `v_align` → `valign`, `dot_style` → `dot_color`, `title` → `heading`. Saved templates were migrated.
- Uses the shared pieces: eager or lazy media from `snippets/anvil-above-fold` (DECISIONS 85); the editor-only empty note from `snippets/anvil-editor-empty` (DECISIONS 87); a hidden fallback heading through `anvil-section-head` (DECISIONS 84).
- Availability: `disabled_on` groups ["header","custom.overlay"] (CONVENTIONS §4, DECISIONS 100).
