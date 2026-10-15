# `anvil-hero-parallax` — Parallax hero (section card)

_Wave-5 parity section. Files `sections/anvil-hero-parallax.liquid` (editor name "Parallax hero") and `assets/anvil-hero-parallax.js`. Spec: `docs/spec/hero-parallax.md`; `docs/SPEC.md` §4.2 "Parallax hero"; `docs/DESIGN-sections.md` §3 (`T: @theme`, JS "15 lines (off on reduced motion/touch)", "h1 option; LCP eager"). Contract: `docs/CONVENTIONS.md` §3–§4._

## Purpose
A full-bleed hero: a background image that moves slower than the page as the shopper scrolls, an overlay, and a column of theme blocks (heading, text, buttons, rating badge, countdown, groups and so on) placed at one of nine spots. The movement is decoration only. It is off on touch screens, for shoppers who ask for reduced motion, when the theme's animation switch is off, and at strength 0. Without it the section is a normal image hero, and nothing in it depends on JavaScript.

## Markup (shopper view)
```
div#anchor.av-section.av-scheme--… .av-s-anvil-hero-parallax          ← anvil-section-attrs
  div.av-section__inner[.av-section__inner--bleed]                    ← bleed (no gutters) when width = full
    anvil-hero-parallax.av-hero-parallax[--framed][--hm-full][--hd-full][--move]  strength="25"
        style="--av-hero-parallax-s; -shift; -min-m; -min-d; -pos-m; -pos-d; -v-m; -v-d; -h-d; -box-w; -gap"
      div.av-hero-parallax__media                                     ← clips; named view timeline (native path)
        div.av-hero-parallax__layer[data-anvil-parallax]              ← the part that moves
          picture.av-hero-parallax__picture
            source media="(max-width: 749px)" …                       ← only when a different phone image is set
            img.av-hero-parallax__img (image_tag, object-position: inherit)
          | svg.av-hero-parallax__placeholder (lifestyle-2)           ← no image picked
      div.av-overlay.av-hero-parallax__overlay  style="--av-overlay-strength"   ← only when overlay > 0
      div.av-hero-parallax__content                                   ← column capped at the page width, places the box
        div.av-hero-parallax__box.av-hero-parallax__box--left|center|right [.av-box.av-scheme--…]
          .av-section-head (h2 or h1 + subheading)                    ← anvil-section-head, only when set
          p.av-hero-parallax__empty.av-example-note                   ← editor only, when there is no content
          {% content_for 'blocks' %}                                  ← theme blocks and app blocks
  script type="module" anvil-hero-parallax.js                         ← only when the movement is on
```
The hero is a one-cell grid. The media and overlay are absolutely positioned under it, and the content is the only grid item, so it fills the minimum height (the grid row stretches) and its flex column places the box: vertically on phones (top, middle or bottom), and on nine spots from 750 px. Blocks are flex-column children of the box with `min-width: 0`. They stretch to the box width, and each block's own alignment setting works inside that width. No margins are reset, so a Divider keeps its "space above and below".

## How the movement works
- **Geometry.** With strength `k` (0–0.5), the layer reaches `k × hero height` above and below the hero (`inset: calc(k × -100%) 0`). It travels from `−k·h` while the hero enters at the bottom of the window to `+k·h` while it leaves at the top, linearly with scroll. So the image drifts down inside the hero and appears to move slower than the page, and no edge ever shows. At the hero's centre line it sits at rest.
- **Native path (no JavaScript).** Where `@supports (animation-timeline: view())` holds, the media box declares `view-timeline: --av-hero-parallax block` and its direct child, the layer, runs `@keyframes av-hero-parallax` on that timeline: `translate3d(0, −shift, 0)` → `translate3d(0, +shift, 0)`. `--av-hero-parallax-shift` is `k / (1 + 2k)` as a percentage, because a translate percentage refers to the taller layer. The animation runs on the compositor, so the main thread does no work while scrolling. The timeline is declared on the media box rather than the hero so that the layer is its direct child (MDN, `timeline-scope`). `animation-duration: 1ms` is set because MDN notes Firefox needs a non-zero duration to apply a timeline animation.
- **Fallback path.** `<anvil-hero-parallax>` (`assets/anvil-hero-parallax.js`) does nothing where the native path exists. Elsewhere it listens to `scroll` and `resize` (passive, one `requestAnimationFrame` per frame) only while an IntersectionObserver (root margin 25 %) reports the hero near the window. It writes `translate3d(0, −p·k·h px, 0)` on `[data-anvil-parallax]`, where `p = (2·top + h − vh) / (vh + h)`, clamped to −1…1, which is the same mapping as the keyframes. When the hero leaves the window or motion turns off, it removes its listeners and clears the transform. `disconnectedCallback` cleans up, so section re-renders in the editor need no `shopify:*` handlers.
- **When it is off.** The layer grows and moves only inside `@media (prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)`. The module watches the same query (a `change` listener). It reads `html[data-animations]` only when the hero comes near the window or that query changes; it does not observe the attribute, because Liquid writes it once and nothing in the theme toggles it at runtime. Liquid adds `--move` (and loads the module) only when strength > 0 and Theme settings > Animations is on, which is the setting that writes `html[data-animations]`. The stylesheet therefore never needs an `html` selector, and every selector starts with `.av-hero-parallax`. With the movement off, the layer is exactly the hero's size, so the image is not zoomed in.
- **Verified** (headless Chrome over CDP, mock page built from the real stylesheet and module, 1280 × 800, hero 560 px tall at strength 25): the native path and the fallback (forced on by disabling the native check) gave the same translation at seven scroll positions, within 0.1 px (−140 … +140 px). The layer covered the hero at every position (layer top ≤ 0, layer bottom ≥ hero bottom). Emulated reduced motion and touch both gave no movement and an unenlarged layer on both paths. Phone (375 × 812, touch) and desktop screenshots looked right. Not verified: a live store render (G3/G4 need the dev-theme env vars), and Firefox or Safari engines.

## Settings
The 13 chassis settings come first, verbatim (CONVENTIONS §4). Then, under "Parallax hero" and "Content":

| id | type | default | effect |
|---|---|---|---|
| `image` | image_picker | — | background image; focal point honoured per breakpoint; `info` asks for a focal point and no words in the image |
| `image_mobile` | image_picker | — | optional phone image below 750 px (art direction with `<picture>`); a phone image alone serves every screen |
| `strength` | range 0–50 %, step 5 | 25 | share of the hero's height the image travels above and below its resting point; 0 = still. `info` says it crops more when stronger and when it stays still |
| `height_desktop` | select sm / md / lg / full | lg | minimum height from 750 px: 440 / 560 / 720 px / 100svh (100vh fallback) |
| `height_mobile` | select sm / md / lg / full | md | minimum height below 750 px: 320 / 440 / 560 px / 100svh; `info`: long content makes it taller |
| `overlay` | range 0–90 %, step 5 | 35 | overlay opacity (`.av-overlay`, `--av-overlay-strength`); `info`: raise it until the text reads clearly |
| `overlay_color` | select shadow / scheme | shadow | theme shadow colour (`--av-overlay-rgb`) or the scheme background (`--av-bg-rgb`) |
| `position_desktop` | select, 9 spots | middle-center | box position from 750 px; the horizontal part also sets the text alignment app blocks inherit |
| `position_mobile` | select top / middle / bottom | middle | vertical box position on phones (the box is full width there) |
| `content_width` | range 320–900 px, step 20 | 640 | box maximum width from 750 px |
| `gap` | range 0–64 px, step 4 | 24 | space between the heading and the blocks |
| `box` | checkbox | false | puts the content on a solid panel (`.av-box`) in its own scheme |
| `box_scheme` | color_scheme | scheme-1 | panel scheme (`visible_if` the box is on) |
| `heading_tag` | select h2 / h1 | h2 | level of the section heading. H1 only when this is the first template section and the template has no H1 of its own: product, collection, page (main-page shows its title by default), blog, article, search, cart, list-collections, 404, password, gift card and customer templates are excluded. `info` tells merchants to turn off the Welcome section's "Use the heading as the page title" on the homepage, or keep H2 |

27 non-header settings in total (13 chassis + 14 own, of the 27 own ids CONVENTIONS allows), within the 40-setting limit.

## Blocks
`"blocks": [{ "type": "@theme" }, { "type": "@app" }]`, rendered with `{% content_for 'blocks' %}` (app blocks included), `max_blocks: 8`. No local and no private blocks, because the spec card's Blocks column says `T: @theme`. Blocks print their own `{{ block.shopify_attributes }}`.

Preset "Parallax hero": scheme-4 (light text on dark), full width, no padding, large / medium heights, strength 25, overlay 35. The heading is "Example hero heading — **replace** me" (size extra large, H2). Then a Text block ("Example text — one or two sentences on what shoppers get. Replace it with words that are true for your store.", large, centred) and a Button block ("Shop all products" → `/collections/all`, primary, large, centred). The preset uses the section heading rather than a Heading block, so the `heading_tag` option is effective right away.

`disabled_on.groups: ["header", "custom.overlay"]`, as for `anvil-image-banner`.

## Behaviour
- **Without JavaScript:** everything renders. In browsers with scroll-driven animations the image still moves (CSS only). Elsewhere it stays still, with the layer slightly enlarged and centred, so no edge shows.
- **Keyboard:** only the blocks' own links and buttons are focusable. The section adds no controls and no scroll-jacking, and moving the image changes no layout.
- **Reduced motion / touch / animations off:** no movement, no enlarged layer, no scroll listener. Changing the system setting takes effect at once (media query in CSS, `change` listener in the module).
- **Heading level:** the chassis heading is rendered by `anvil-section-head` with `tag: h1|h2`. Heading blocks keep their own level setting (the Heading block already offers H1 with its own warning).
- **No content:** on the storefront the hero shows only the image. In the editor the shared note `anvil.editor.empty_section` appears in a dashed box, and the content panel stays off while there is nothing to put on it.
- **Editor:** `section.index` is nil there, so a hero in a template is eager and the chosen heading level shows. Re-renders replace the custom element, which cleans up after itself.

## Performance
- **LCP:** the image is eager with `fetchpriority="high"` in the first two template sections (`section.location` is `template`, or `content_for_index`, and `section.index` ≤ 2 or nil). The first template section also sends `preload: true` (a Link header), except when a separate phone image exists, because the hint carries no media query and phones would fetch both images. Lazy loading applies from the third template section on, and always in the footer, in other section groups and in static renders: shopify.dev says `section.index` is "the 1-based index of the current section within its location", so index 1 in the footer group is not the top of the page.
- **Image sizes:** `image_tag` with widths `550…2200`. From 750 px the cover image fills a layer that is the hero's width (capped at the page or narrow width when framed) and `min-height × (1 + 2k)` tall, so it is drawn at `max(hero width, layer height × image aspect)`. For the fixed heights that height-bound width is a fixed number of px, `D = min-height × (1 + 2k) × aspect`, so `sizes` names it in px rather than as a share of the screen:
  - full width: `(min-width: Dpx) 100vw, (min-width: 750px) Dpx, 100vw` (just `100vw` when D ≤ 750);
  - framed, D ≥ cap: `(min-width: 750px) Dpx, 100vw`;
  - framed, D < cap: `(min-width: cap) cap px` first, then the full-width entries;
  - full-screen height: height-bound while the window is narrower than `G = (1 + 2k) × aspect` times its height, so `(min-width: 750px) and (min-aspect-ratio: G×1000/1000) 100vw, (min-width: 750px) calc(100vh * G), 100vw`; framed adds `(min-width: cap) and (min-height: cap ÷ G px) calc(100vh * G), (min-width: cap) cap px` first. Only media conditions and `calc()` are used (no `min()`/`max()`), for the widest browser support.

  Examples: the preset (full width, large, strength 25, 16:9) gives `(min-width: 1920px) 100vw, (min-width: 750px) 1920px, 100vw`, so an 800 px or 1024 px window requests the 1920 px the image is drawn at. Page width, medium, strength 25, 16:9 gives `(min-width: 750px) 1493px, 100vw`. Phones keep `100vw`. Touch tablets from 750 px do not enlarge the layer, so they ask for up to `1 + 2k` times more than they draw; on 2× screens the 2200 px cap makes that moot.
- **No layout shift:** heights are CSS minimums written inline. Moving the image is a transform. The first fallback frame offsets the image by a few pixels; transforms do not count towards CLS.
- **Budgets:** section CSS 3,320 B raw (1,151 B with `gzip -9`) of the 6 KB limit. Module 2,823 B raw, 1,287 B with `gzip -9` (CONVENTIONS ≤ 2 KB; `check-limits.sh` allows 4 KB). The module loads only when the movement is on; in browsers with scroll-driven animations it only defines the element and returns.

## Honesty notes
- The section prints no claims, prices, numbers, timers or badges. Blocks that can (countdown, rating, review badge) carry their own honesty rules and `info` texts.
- The preset heading and text read as examples ("Example hero heading — replace me", "Example text — … true for your store"). The button is a real link to all products, not a claim.
- The image `info` asks merchants to keep words out of the image (readability and screen readers). The strength `info` states plainly when the effect is off.

## Styling decisions
- Every selector starts with `.av-hero-parallax`. Tokens only: `--av-fg-rgb`, `--av-radius-media`, `--av-radius-card`, `--av-page-width`, `--av-gutter`, `--av-space-5/6/7/8`. The overlay uses the shared `.av-overlay` (`--av-overlay-strength`, `--av-overlay-rgb`). The panel uses the shared `.av-box` with an `.av-scheme--<id>`.
- `overflow: hidden` on the media box clips the enlarged layer. The media box is the timeline's subject, and a view timeline looks for the subject's nearest ancestor scroll container, so the media box's own clipping does not affect it.
- Framed heroes (page or narrow width) take `--av-radius-media`, inherited by the media and overlay. Full-width heroes have square corners and no gutters.
- The custom element is the hero box itself (`display: grid` from the class), so the undefined element never renders inline.

## Locale keys
None new. The section uses the existing shared key `anvil.editor.empty_section` (editor only).

## Contract assumptions
- `anvil-section-attrs`, `anvil-section-head` (with `tag`), `.av-overlay`, `.av-box`, `.av-example-note` and `--av-bg-rgb` behave as CONVENTIONS and `assets/anvil-base.css` describe. The section head's bottom margin is reset inside the box, and its muted subheading colour inherits the hero text colour, as in `anvil-image-banner`.
- `section.blocks.size` counts top-level theme and app blocks (the same assumption `anvil-rich-text` documents). If it did not, the only effect would be the editor note showing next to blocks.
- `settings.animations_enabled` is the setting `layout/theme.liquid` turns into `html[data-animations]`, written once at render; nothing in the theme toggles it at runtime. If something later did, neither path would follow it while the hero is in view: the module reads the attribute only when the hero comes near the window or the motion query changes (it has no MutationObserver), and the native CSS path never reads it.
- No ancestor of the section is a scroll container (true for `layout/theme.liquid` today). A theme-level `overflow` on `<main>` would make the native timeline measure against that element instead of the window.

## Open questions
1. **Video background (owner decision needed).** SPEC says "media", so the spec item is only partly met: this build takes images only, with an optional phone image. A moving autoplay video would need a visible pause control (WCAG 2.2.2) and its own play logic, because core's `[data-anvil-autoplay]` restarts a video the shopper paused when it scrolls back into view. That is more than the spec card's 15-line JS. If the owner wants video, the follow-up is a `video` setting rendered with `anvil-media` in the moving layer (core autoplay keeps the controls visible), with the image as poster and fallback. Otherwise SPEC/DECISIONS should record that the parallax hero is image-only.
2. **H1 on page templates.** Resolved after review: H1 is refused on every `page` template, because `main-page` prints its own `<h1>` whenever "Show page title" is on (the default) and a section cannot read another section's settings. A merchant whose page template hides the title, or has no `main-page`, can still use a Heading block set to H1. The owner can reopen this. `anvil-image-banner` still allows H1 on `page` templates (with an `info` warning), so the two heroes now differ; its owner may want the same rule. On the homepage the Welcome section's H1 (on by default, anywhere on the page) cannot be detected either, so the `info` asks merchants to turn it off or keep H2.
3. **Phone image sharpness.** On a tall phone hero a landscape image is height-bound and drawn about twice the screen width, but phones request `100vw` (as `anvil-image-banner` does) to protect mobile LCP. A dedicated phone image is the recommended fix and is offered.
4. **Transparent header.** With the transparent header over the first section, content placed at a top spot sits under the header bar. The hero does not know the header height without JavaScript (which would shift layout). Merchants should use middle or bottom spots there. A shared header-offset token from the header owner would solve this for both heroes and the image banner.
5. **New blocks default to left alignment** in a centred hero (same as `anvil-rich-text` open question 1): theme blocks default `align: left`. The preset blocks are centred.

## Fix pass (2026-10-15)
- Setting ids follow the theme-wide vocabulary (CONVENTIONS §5; DECISIONS 82–100); the tables above use the new ids: `box_width` → `content_width`. Saved templates were migrated.
- Uses the shared pieces: eager or lazy media from `snippets/anvil-above-fold` (DECISIONS 85); the H1 guard in `snippets/anvil-main-heading-tag` (DECISIONS 86); the editor-only empty note from `snippets/anvil-editor-empty` (DECISIONS 87).
- Availability: `disabled_on` groups ["header","custom.overlay"] (CONVENTIONS §4, DECISIONS 100).
