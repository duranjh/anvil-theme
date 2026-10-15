# Hero slideshow — `sections/anvil-hero-slideshow.liquid`

_Section card, 2026-10-15. Wave-2 section, built from `docs/agent-prompts/hero-slideshow.md` (CONVENTIONS, spec card `docs/spec/hero-slideshow.md`, CHASSIS-API, FORBIDDEN, two exemplars) plus `docs/HONEST.md` and `docs/DECISIONS.md` (1–67), then revised the same day after review. Files: `sections/anvil-hero-slideshow.liquid`, `blocks/_anvil-hero-slideshow-slide.liquid` and `assets/anvil-hero-slideshow.js` (a stopgap focus helper for the fade transition; see Behaviour and open question 2). The carousel itself is the shared `<anvil-slider>` (`assets/anvil-slider.js` and `.css`, read-only)._

## Purpose
"Slideshow hero" (SPEC §4.2): a hero carousel of full-height slides. Each slide is an image (an optional separate phone image, an overlay, an optional link) with the theme's own content blocks on top: heading, text, buttons, stars, countdown, add-to-cart, group and app blocks. The merchant sets autoplay, height, transition and dots (spec card), plus arrows. Design row: `docs/DESIGN-sections.md` §3, theme block `_anvil-slide` → `@theme`, JS `SL`, "first slide eager/high priority".

**Block name.** DESIGN-sections calls the block `_anvil-slide`. The output contract allows only `blocks/_anvil-hero-slideshow-*.liquid`, so the file is `_anvil-hero-slideshow-slide.liquid` and its type is `_anvil-hero-slideshow-slide`. The same was done for `_anvil-columns-column`.

## Settings
The 13 chassis settings come first, verbatim (CONVENTIONS §4). After them come a header "Hero slideshow" and 7 settings, 20 in total. The schema name "Hero slideshow" is 14 characters. `disabled_on.groups: ["header", "footer", "custom.overlay"]`.

| id | type | default | what it does |
|---|---|---|---|
| `height_desktop` | select `adapt` / `sm` / `md` / `lg` / `full` | `lg` | ≥ 750 px. `adapt` uses the first slide's image shape for every slide (16 / 9 while it has no image). `sm` / `md` / `lg` set a minimum height of 440 / 560 / 720 px. `full` sets `100svh`. Long content makes the slides taller and never cuts text off |
| `height_mobile` | select, same values | `md` | < 750 px. `adapt` uses the first slide's phone image, else its desktop image (4 / 5 while it has none). `sm` / `md` / `lg` set 320 / 440 / 560 px, and `full` sets `100svh`. Info: every slide takes the same height |
| `transition` | select `slide` / `fade` | `slide` | how one slide gives way to the next (see Behaviour). Info: fade needs scroll-driven animations; shoppers who reduce motion see slides change without animation |
| `autoplay` | checkbox | true | auto-rotate. Info: it pauses on hover and keyboard focus, always shows a pause button, and starts paused for shoppers who reduce motion |
| ~~`autoplay_speed`~~ | range 3–10 s, step 1 | 6 | seconds per slide (the slider's `autoplay` attribute). `visible_if` autoplay is on |
| `show_arrows` | checkbox | true | previous and next buttons. With dots on they show from 750 px up (phones swipe or tap a dot). With dots off they show on phones too (`--arrows-always`), so a mouse user in a narrow window or at 200 % zoom can still change slides. Info says so |
| `show_dots` | checkbox | true | one dot per slide, in a pill over the bottom of the slides. Info: keep arrows or dots on, so shoppers with a mouse can change slides |

The chassis `heading` / `subheading` render above the carousel through `anvil-section-head`. Inside a full-width section they get the page gutter (`av-hero-slideshow__head--bleed`). The plain heading text also names the carousel (`aria-label`, written with `escape_once`: `inline_richtext` stores `&` as `&amp;`, which `strip_html` keeps, so `escape` would print `&amp;amp;`); without one the label is `anvil.hero_slideshow.label` ("Slideshow"). `width: full` adds `av-section__inner--bleed`, so the slides run edge to edge. Page and narrow widths round the track with `--av-radius-media`.

## Blocks
`"blocks": [{ "type": "_anvil-hero-slideshow-slide" }]`. Only slides can sit at the top level. App blocks and theme blocks go inside a slide. An app block at the top level would arrive in Shopify's wrapper without `data-slider-slide` and would break the slider's paging.

**`_anvil-hero-slideshow-slide`** (editor name "Slide", `"tag": null`). The block root is the slider's `[data-slider-slide]` and carries `{{ block.shopify_attributes }}`. It accepts `@theme` and `@app` children and renders them with `{% content_for 'blocks' %}`, captured so that an empty slide gets no content box. It has 12 settings:

| id | type | default | what it does |
|---|---|---|---|
| `image` | image_picker | — | desktop image, ≥ 750 px; it also serves phones when `image_mobile` is empty. Its focal point drives `object-position`. Info: set a focal point, and keep words out of the image |
| `image_mobile` | image_picker | — | phone image, < 750 px, through a `<picture>` `<source>` (750/1100/1500 w). On its own it serves every screen |
| `overlay` | range 0–90 %, step 5 | 30 | `.av-overlay` strength. 0 renders no overlay. Info: raise it until the text reads clearly, on phones too |
| `overlay_color` | select `shadow` / `scheme` | `shadow` | the theme shadow colour (`--av-overlay-rgb`), or the slide scheme's background |
| `position_desktop` | select, 9 values | `middle-center` | where the content box sits at ≥ 750 px |
| `position_mobile` | select `top` / `middle` / `bottom` | `middle` | vertical position on phones, where the box is full width |
| `content_width` | range 320–800 px, step 20 | 560 | maximum content width at ≥ 750 px |
| `box` | checkbox | false | puts the content on a solid panel (the shared `.av-box`) in the slide's colour scheme |
| `own_scheme` | checkbox | false | gives the slide its own colour scheme (its text colours and the panel's colours) |
| `color_scheme` | color_scheme | `scheme-1` | the slide's scheme; `visible_if` own_scheme is on. The default differs from the preset's section scheme (`scheme-4`), so ticking the box changes something visible |
| `link` | url | — | makes the slide clickable around its content box. Buttons and links in the box keep their own |
| `link_name` | text | — | the link's accessible name. Info: describe where the link goes, for example "Shop the new collection"; required when the image has no alt text. Blank uses the image's alt text, else `anvil.hero_slideshow.slide_link` ("Open slide N"). In that last case the editor shows `anvil.editor.slide_link_name` on the slide (shoppers never see it) |

The blocks inside a slide keep their own alignment settings (heading, text and button each have one). The box is a flex column with `align-items: stretch` and a `--av-space-4` gap. The block preset "Slide" (what "Add block" inserts) holds an `h2` Heading (xl, centred), a Text (lg, centred) and a primary "Shop now" button → `/collections/all`.

**`max_blocks: 8`.** Eight slides fit the dots pill on one row from about 364 px wide (8 × 24 px dots + gaps + padding inside `100% − 128px`). At 320 px they wrap to a second row (6 + 2 at the default 4 px dot gap, 4 + 4 at the widest 16 px gap), which still clears the content: the content keeps `--av-space-6` + 56 px of bottom padding (88 px), and two rows of dots reach 64 px (76 px at the widest gap) from the bottom. A cap of 10 would allow a third row at 320 px with the widest gap. shopify.dev (Section schema, Theme limits) gives the 50-block cap that `max_blocks` lowers, counts the blocks merchants can add, remove or reorder, and says nothing about nested theme blocks. Nested blocks are stored inside their parent block, and the sibling sections already rely on top-level counting: `anvil-pricing` caps at 6 with a preset of 12 blocks including nested ones, `anvil-tabs` at 10 with 8. If Shopify ever counted nested blocks, this preset (3 slides + 9 children) would exceed the cap, and so would pricing's.

### Preset "Hero slideshow"
Section: `scheme-4`, full width, padding 0 / 0, heights `lg` / `md`, autoplay on (6 s), arrows and dots on, transition slide. Three slides, all with placeholder images (`lifestyle-1`, `lifestyle-2`, alternating):
1. Overlay 35 %, centred. An `h2` "Example slide heading — **replace** me" (xl), example text and a primary "Shop now" button.
2. Overlay 35 %, middle left on desktop and bottom on phones. An `h2` "Example second slide — a collection or a story", text that says to announce a sale only when a real Shopify discount backs it, and a secondary "Browse the collection" button.
3. No overlay, bottom right, content box on in its own `scheme-1`, box width 480. An `h2` "Example third slide — text on a panel", text and a "Shop all products" text link.

## Markup and behaviour
```
div#anchor.av-section.av-scheme--… .av-s-anvil-hero-slideshow          ← anvil-section-attrs
  div.av-section__inner[.av-section__inner--bleed]
    div.av-hero-slideshow__head[--bleed] > .av-section-head            ← only when heading/subheading set
    link anvil-slider.css
    anvil-slider.av-hero-slideshow.av-hero-slideshow--{slide|fade}[--framed][--arrows][--controls][--motion]
        per-view=1 per-view-desktop=1 peek=0 autoplay="N|0" loop [arrows] [dots] aria-label
        style="--av-slider-per-view:1; …-desktop:1; --av-slider-peek:0px; --av-slider-gap:0px;
               --av-hero-slideshow-ar-m/-ar-d/-min-m/-min-d"
      div.av-hero-slideshow__track[data-slider-track]
        {% content_for 'blocks' %}
          div.av-hero-slideshow__slide[data-slider-slide]{block.shopify_attributes}      ← the private block
            div.av-hero-slideshow__frame[.av-scheme.av-scheme--id][--linked]  style="pos / position / box width vars"
              div.av-hero-slideshow__media > picture > (source) + img | placeholder svg
              div.av-overlay                       ← when overlay > 0
              div.av-hero-slideshow__content > div.av-hero-slideshow__box[.av-box]  ← slide's theme blocks
              a.av-hero-slideshow__link            ← when linked; visually hidden name; after the content
              p.av-hero-slideshow__note.av-example-note  ← editor only: linked slide without a link name
      div.av-slider__dots[data-slider-dots]        ← empty; the slider fills it (hidden while :empty)
    script type=module anvil-slider.js
    script type=module anvil-hero-slideshow.js    ← transition fade and 2+ slides only
```
- **Slider contract (CONVENTIONS §6).** The per-view, peek and gap values are written inline, so nothing moves when the script runs. The slider adds `role=region`, `aria-roledescription` "carousel", slides as `role=group` "N of M", a named dots group, the polite live region, the pause/play button (`aria-pressed`), the arrows and the keyboard behaviour (ArrowLeft/ArrowRight, focusable track). Autoplay pauses on hover, focus, a hidden tab, off-screen and while a block is selected in the editor. It starts paused under reduced motion or with animations off. `loop` makes the arrows wrap from the last slide to the first; autoplay wraps anyway. With one slide the section writes no `arrows`, `dots` or autoplay, and the slider marks itself static.
- **Heights.** Each slide is a grid box with `aspect-ratio` (adapt) or `min-height` (fixed / full) from the custom properties on the slider. Slides are flex items of the track, so a row stretches every slide to the tallest one, and a long slide never gets clipped. The frame fills its slide; the image and overlay are absolute, and the content is the frame's in-flow grid item.
- **Controls on the slides.** The dots sit in a 44 px pill at the bottom centre, in the section scheme's background and text colours, so their contrast follows the scheme and not the photo. The pause button sits bottom right at the same height. The arrows sit at mid-height on the edges: from 750 px when dots are on, at every width when dots are off (`--arrows-always`). When dots or autoplay are on, the content gets extra bottom padding (`--controls`). Wherever arrows show, it gets side padding that clears them, so position settings never put text under a control.
- **Slide transition.** This is the slider's own scroll-snap row: swipe, keys, arrows, dots and autoplay. Smooth scrolling is used only when motion is allowed.
- **Fade transition (a CSS animation; the focus helper is below).** The track still scrolls, so every input, the "N of M" announcements and the editor jumps behave exactly as in slide mode. Each slide declares a view timeline (`view-timeline: --av-hero-slideshow inline`), and its frame runs `@keyframes av-hero-slideshow-fade` on that timeline. The keyframes translate the frame against the scroll (from −100 % at cover 0 % to +100 % at cover 100 %), so the picture stays in place. The incoming slide fades from 0 to 1 over the outgoing one, which stays opaque, so there is no dip to the background in either direction. Frames waiting off-stage are switched to `visibility: hidden` (0–2 % and 98–100 % of the range), so they cannot catch a click or take keyboard focus. The frame paints a solid `--av-bg` background, so a fading frame never shows another slide's backdrop. Fade applies only under `@supports (animation-timeline: view())`, `prefers-reduced-motion: no-preference`, `scripting: enabled`, Theme settings > Animations on (`--motion`, from `settings.animations_enabled`) and `:dir(ltr)`. Everywhere else the slide transition is used. Headless Chrome (Chrome for Testing 1243) measurements on a static copy of this markup: at 25 / 50 / 75 % of a scroll between slides 1 and 2, the outgoing frame held opacity 1 and the incoming frame was 0.22 / 0.48 / 0.74, both at x = 0. At rest, the neighbours were `hidden`, and `focus()` on a button in the next slide did nothing. On a `dir="rtl"` page, Chrome mapped the view progress from the other edge, so RTL is excluded and falls back to slide. When autoplay wraps from the last slide to the first, the intermediate slides fade through quickly during the smooth scroll back.
- **Fade and keyboard focus (`assets/anvil-hero-slideshow.js`, 910 B gzipped).** A frame that leaves the stage turns `visibility: hidden`, so a focused link or button in it would lose focus: Chrome moves focus to `<body>`, the slider reads that as focus leaving and resumes autoplay, and the keyboard user loses their place (review finding, reproduced). The module adds two delegated listeners on `document`. A capture-phase `keydown` runs before the slider's ArrowLeft/ArrowRight handler and moves focus from inside a slide to the slider's track (focusable whenever it scrolls), with the slider's own input/textarea/select/contenteditable exception. A `focusout` listener catches the other way a frame hides under focus (a swipe): when focus inside a slide goes to nothing and the element is no longer visible, focus goes to the track. Clicking outside the carousel is left alone (the element is still visible). The section loads it only with transition fade and two or more slides. It is a stopgap: once `anvil-slider.js` moves focus itself (open question 2), delete the file and its script tag. Headless Chrome (Chrome for Testing 1243), static copy, autoplay 6 s, focus on a button in slide 1, then a real ArrowRight (CDP `Input.dispatchKeyEvent`): without the module, slide 2, focus `BODY`, autoplay running; with it, slide 2, focus on the track (`:focus-visible`), autoplay paused; a second ArrowRight goes to slide 3, and Tab then lands on slide 3's button. Swipe (scrollLeft set): without, `BODY` and autoplay running; with, the track and paused. Click outside: focus goes to `BODY` in both builds. ArrowRight inside a text input in a slide: no slide change, focus stays. The track's ring (the global `:focus-visible` outline, offset 3 px) shows above and below the slides; an inset ring would be painted under the frames.
- **Images and LCP.** `image_tag` with widths `750, 1100, 1500, 1800, 2200`. `sizes` is `100vw`, or `(min-width: <page|narrow width>px) <width>px, 100vw` when the section is capped. Only the first slide can be the LCP image. In the first two sections (or when `section.index` is nil: editor, Section Rendering) it is `loading="eager"` with `fetchpriority="high"`. In the first section it also gets `preload: true`, unless it has a separate phone image (the preload hint has no media query). Every other slide is lazy. In fade mode the next slide's frame sits over the viewport (hidden), so the browser fetches the next image early. That works as a free preload of one slide. Focal points: `img` gets `object-position: inherit`, and the `<picture>` takes the phone or desktop point from custom properties.
- **Linked slides.** The stretched link sits under the content (z-index 1, content 2), but follows it in the DOM, so the slide's heading comes before the link and gives it context (WCAG 2.4.4, technique H80), which matters when the name falls back to "Open slide N". The content area ignores the pointer except for the box, so a click anywhere around the box follows the slide link, while the box keeps its buttons, links and app forms. Tab reaches the box's controls first, then the slide link. The link has `:focus-visible` with an inset ring.
- **Without JavaScript.** The track is a scroll-snap row: phones swipe, and under `@media (scripting: none)` the track gets `scrollbar-width: thin`. A non-auto value is what switches off `anvil-slider.css`'s `::-webkit-scrollbar { display: none }` in Chromium (MDN: non-auto `scrollbar-width`/`scrollbar-color` override `::-webkit-scrollbar-*` styling), so mouse users get a scrollbar to scroll with. The fade is gated on `scripting: enabled`, so without JavaScript every transition is the plain slide and tabbing into a later slide scrolls it into view (with fade, slides 2..N would stay hidden and unreachable). No arrows, dots or autoplay. The empty dots container is hidden (`:empty`). Headless Chrome with script execution disabled: `scripting: none` matched, `scrollbar-width` computed `thin`, every frame `visible` with no animation.
- **Editor.** Selecting a slide or any block inside it jumps the slider to that slide and pauses autoplay (the slider's `shopify:block:select` handler). A section without slides shows `anvil.editor.empty_section` in a dashed box. A linked slide with no link name and no image alt text shows `anvil.editor.slide_link_name` in a small badge at its top-left corner (`request.design_mode` only).

## Headings
The slide content is theme blocks, so the merchant picks each heading's level (the Heading block's "Heading level" setting). The preset uses `h2` on every slide: the page outline stays valid, and a slideshow must not print one `<h1>` per slide. A store that wants the hero to carry the page's `<h1>` sets the first slide's heading to H1. The Heading block's own info says "Keep one H1 per page". See open question 3.

## Honesty notes
- The section prints no claims, numbers, ratings, timers or badges. Blocks placed in slides (countdown, stars, review badge, add-to-cart) carry their own honesty rules and `info` texts.
- Autoplay is not a fake-urgency device, and the info text says how shoppers can stop it.
- Preset copy reads as examples ("Example slide heading —", "Example text —"). Slide 2's text reminds the merchant to announce a sale only when a real Shopify discount backs it.
- Setting `info` texts: image (keep words out of the image), overlay (readability), link name (what screen readers hear), autoplay (pause behaviour), transition (fallbacks). No setting here can carry a price, saving or claim, so none needed an honesty warning beyond these.

## Checks run (2026-10-15, after the review fixes)
- `shopify theme check --fail-level warning` on the shared wave tree: 237 files, 192 offenses, all `TranslationKeyExists`. Three belong to this section's files: the three new locale keys listed below.
- `scripts/cleanroom-lint.sh`: clean. `scripts/asset-audit.py`: clean. `scripts/check-limits.sh`: all limits respected.
- `scripts/chassis-lint.py`: 1 error in this section, "local blocks declared but no `{% for … in section.blocks %}` loop". The lint treats the private theme block type `_anvil-hero-slideshow-slide` as a local block (see open question 1). The `max_blocks` warning is gone. The block file passes.
- Sizes: `{% stylesheet %}` 5,979 B raw / 1,881 B gzipped (limit 6,144 B raw). `assets/anvil-hero-slideshow.js` 1,795 B raw / 910 B gzipped (section budget 2 KB gzipped), loaded only in fade mode. The shared `anvil-slider.js` (4.5 KB gzipped, its own 5 KB budget) is reused unchanged.
- A static copy of the markup with `anvil-slider.css/js` and this stylesheet, driven in headless Chrome over CDP at 1280×800 and 500×812 (the headless minimum width). The checks covered: equal slide heights, dots and pause positions and size (44 px), arrows hidden on phones, slide roles "1 of 4" … "4 of 4", region label and role description, the fade measurements above, the reduced-motion fallback to slide, and the RTL fallback.
- After the review fixes, the same kind of static copy (with a `box-sizing` reset as in `anvil-base.css`), driven over CDP with real key and mouse events: the fade focus scenarios listed under Behaviour; at 375 px, arrows hidden with dots on and shown with dots off (content padding 68 px each side, the heading wrapping inside 239 px); at 1280 px arrows shown in both; no-JS run with script execution disabled (see Without JavaScript).

## Locale keys needed (integrator)
- `anvil.hero_slideshow.label` = "Slideshow"
- `anvil.hero_slideshow.slide_link` = "Open slide {{ index }}"
- `anvil.editor.slide_link_name` = "Add a slide link name or image alt text. Without one, screen readers announce this link as “Open slide {{ index }}”. Shoppers never see this note."

Existing keys used: `anvil.editor.empty_section`. The slider's own strings (`anvil.a11y.*`) come from `window.Anvil.strings`.

## Contract assumptions
- `section.blocks` lists the top-level theme blocks of a section (the first slide's image for `adapt`, the slide count, each slide's position). `anvil-tabs`, `anvil-pricing` and `anvil-columns` rely on the same behaviour. Theme blocks can read `section` (shopify.dev, Theme blocks).
- `<anvil-slider>` keeps its markup contract: slides are direct children of `[data-slider-track]`, an existing `[data-slider-dots]` is filled, and `goTo` scrolls the track. The fade only reads the scroll position, so it depends on no private slider API.
- The fade focus helper relies on documented slider behaviour (anvil-slider.js header): ArrowLeft/ArrowRight inside the element move the slider, its handler sits on the element (so a capture listener on `document` runs first), it skips `input, textarea, select, [contenteditable]`, and the track is keyboard-focusable whenever it scrolls. If the slider adds keys, the helper's `focusout` part still restores focus.
- `.av-box`, `.av-overlay` and `.av-visually-hidden` come from `anvil-base.css`. `--av-bg-rgb` exists per scheme (used by `.av-box`).

## Open questions
1. **chassis-lint and private theme blocks.** `check_blocks` counts any non-`@` block type as local, so a section that offers only its private `_anvil-*` block (columns, pricing, hero slideshow) fails "no `{% for … in section.blocks %}` loop" (the `max_blocks` warning is now cleared here). A loop that printed `block.shopify_attributes` a second time would only satisfy the lint, and it would put two editor targets on one block. Suggested lint fix (reviewer agrees): treat a `_`-prefixed type listed in `blocks` as a theme block, require `content_for 'blocks'` in the section body, and check that the block file's root prints `block.shopify_attributes`. Until then, record columns, pricing and hero slideshow as a known exception.
2. **Focus in `anvil-slider.js` (shared, needs sign-off).** The real fix for the fade focus loss belongs in the slider. In `#onKey`, before `this.next()` / `this.prev()`, add `if (e.target !== this.#track && e.target.closest('[data-slider-slide]')) this.#track.focus({ preventScroll: true });`. The track has `tabindex=0` whenever it scrolls, so focus and the autoplay pause stay inside the carousel. It also stops slide mode from leaving focus on an off-screen slide (measured here: after ArrowRight in slide mode, focus stays on slide 1's button while slide 2 shows). Once it lands, delete `assets/anvil-hero-slideshow.js` and its script tag in the section (or keep only its `focusout` part, which also covers a swipe).
3. **`visibility` in the fade keyframes.** CONVENTIONS §8 says only `transform` / `opacity` animate. The fade animates those two, and also switches `visibility` (a discrete step with no paint cost) so that hidden frames cannot be clicked or focused. Please confirm this exception, or name another mechanism.
4. **H1 in a hero.** The image banner has a "Main heading level" setting that guards against a second `<h1>`. Here each slide's heading level is the Heading block's own setting, so nothing stops a merchant from setting H1 on several slides. Should the section offer an "H1 on the first slide" helper? Theme blocks render after the section's Liquid, so it could not rewrite their tags.
5. **Video slides (owner decision).** The card says "slides (media + content blocks)", and in Anvil's own vocabulary (`anvil-media`) media covers image, video and video_url. This version ships images only (desktop + phone). Either accept images only and record it in DECISIONS, so the parity list does not flag it later, or add an optional `video` setting to the slide rendered through `anvil-media` (muted, controls kept for WCAG 2.2.2), and move the content box's bottom padding to clear the video controls as well as the slider's pause button.
6. **Transparent header.** DECISIONS 39 overlaps the first section by a computed header height. A hero whose content sits at "top" could slide under a transparent header. `anvil-image-banner` has the same gap, so a shared fix (a `--av-header-overlap` padding token) is better than a per-section one.
7. **`escape_once` in `anvil-tabs`.** Its `list_label` uses the same `strip_html | escape` pattern on an `inline_richtext` heading and double-escapes `&` the same way. Its owner should switch to `escape_once`.

## Integration pass (2026-10-15)
- chassis-lint recognises `_anvil-hero-slideshow-slide` as a theme block, so G2 passes. `anvil-slider.js` now moves focus to the track before an arrow key slides from inside a slide; `assets/anvil-hero-slideshow.js` is kept (its focusout part still covers swipes) and can shrink later.
- The discrete `visibility` step in the fade keyframes is allowed (CONVENTIONS §8, DECISIONS 72).
- Placed first on `templates/index.json`; the first slide's heading is the homepage `h1`.

## Fix pass (2026-10-15)
- Setting ids follow the theme-wide vocabulary (CONVENTIONS §5; DECISIONS 82–100); the tables above use the new ids: `autoplay_speed` removed, `arrows` → `show_arrows`, `dots` → `show_dots`, `box_width` → `content_width`, `link_label` → `link_name`. Saved templates were migrated.
- Uses the shared pieces: slider attributes, peek, arrows and dots per width from `snippets/anvil-slider-attrs` (DECISIONS 89); the editor-only empty note from `snippets/anvil-editor-empty` (DECISIONS 87).
- Availability: `disabled_on` groups ["header","custom.overlay"] (CONVENTIONS §4, DECISIONS 100).

## Honest-defaults pass (2026-10-15)
- The third preset slide's text link reads "Shop all products" instead of "Learn more" (Lighthouse flags "Learn more" as non-descriptive link text on the homepage; WCAG 2.4.4 Link Purpose). `templates/index.json` ships the same label (DECISIONS 125).
