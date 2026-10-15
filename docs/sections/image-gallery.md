# `anvil-image-gallery` — Gallery (section card)

_Wave-2 section. File `sections/anvil-image-gallery.liquid`, editor name "Image gallery". Spec: `docs/SPEC.md` §4.2 "Gallery"; `docs/DESIGN-sections.md` §3 row `anvil-image-gallery`; spec card `docs/spec/image-gallery.md`. Contract: `docs/CONVENTIONS.md` §3–§4. Module: `assets/anvil-image-gallery.js`._

## Purpose
Up to 30 images shown as a grid, a masonry wall or a slider, with an optional full-screen lightbox that moves between the images. The layouts are pure CSS (the slider is `<anvil-slider>`, a scroll-snap row that works without JavaScript). The lightbox is a native `<dialog>` inside `<anvil-dialog>`, filled and driven by `<anvil-image-gallery>`. Without JavaScript every lightbox image is a plain link to the full-size image.

Name note (DECISIONS 52): `<anvil-gallery>`, `.av-gallery*` and `assets/anvil-gallery.*` belong to the product media gallery. This section uses `<anvil-image-gallery>`, `.av-image-gallery*`, `--av-ig-*` and `assets/anvil-image-gallery.js`.

## Markup (shopper view)
```
div#anchor.av-section … .av-s-anvil-image-gallery            ← anvil-section-attrs
  div.av-section__inner
    .av-section-head (h2 + subheading)                        ← anvil-section-head
    anvil-image-gallery.av-image-gallery.av-image-gallery--grid|masonry|slider[.--motion][.--zoom]
        style="--av-ig-gap; --av-ig-cols-m; --av-ig-cols-t; --av-ig-cols-d"
      grid / masonry:  ul.av-image-gallery__list > li.av-image-gallery__item {{ block.shopify_attributes }}  ×N
      slider:          link anvil-slider.css
                       anvil-slider.av-image-gallery__slider[per-view][per-view-desktop][peek][autoplay][arrows][dots]
                         div.av-image-gallery__track[data-slider-track] > div.av-image-gallery__item[data-slider-slide] {{ block.shopify_attributes }}  ×N
                         div.av-slider__dots[data-slider-dots]   ← only when dots are on
                       script[type=module] anvil-slider.js
        figure.av-image-gallery__figure
          a.av-image-gallery__open[href=<image 2200 px>][data-anvil-lb-open][data-anvil-w]   ← lightbox on and an image picked
            .av-media … (anvil-media)
            span.av-image-gallery__zoom[aria-hidden]  (zoom-in icon)
            span.av-visually-hidden "Enlarge image N of M"
          (or .av-media alone: lightbox off, or a placeholder)
          figcaption.av-image-gallery__cap                    ← show_captions and a caption
      link anvil-dialog.css                                    ← lightbox on (scroll lock rule)
      anvil-dialog#anvil-image-gallery-lb-<section id>.av-image-gallery__lb-host[data-anvil-lb-host]   ← lightbox on
        dialog.av-image-gallery__lb[aria-label="Image viewer"]
          button.av-image-gallery__lb-close[data-anvil-close][autofocus]
          div.av-image-gallery__lb-track[data-anvil-lb-track][data-anvil-slide][tabindex=0][role=region][aria-roledescription=carousel]
            figure.av-image-gallery__lb-slide[role=group][aria-roledescription=slide][aria-label="Image N of M"]   (built by JS)
          div.av-image-gallery__lb-bar
            button.av-image-gallery__lb-btn[data-anvil-lb-prev]
            p.av-image-gallery__lb-count[data-anvil-lb-count][data-anvil-text][aria-live=polite]
            button.av-image-gallery__lb-btn[data-anvil-lb-next]
      script[type=module] anvil-image-gallery.js               ← lightbox on
```
Headings: only the chassis `h2`. Captions are `figcaption`, not headings, so no `h3` and no outline gap.

## Settings
The 13 chassis settings come first, verbatim. Then, under the header "Image gallery":

| id | type | default | effect |
|---|---|---|---|
| `layout` | select `grid` / `masonry` / `slider` | `grid` | CSS grid; CSS multi-column (column-major order, `break-inside: avoid`); or `<anvil-slider>` |
| `cols_desktop` | range 2–6 step 1 | `3` | columns from 990 px; tablets (750–989 px) use at most 3. In the slider: images in view from 990 px |
| `cols_mobile` | select `1` / `2` | `2` | columns below 750 px; in the slider: images in view below 990 px (the slider has no tablet breakpoint) |
| `image_ratio` | select `adapt` / `1:1` / `4:5` / `3:4` / `16:9` | `1:1` | shape passed to `anvil-media` (cover crop). Masonry always uses `adapt` |
| `gap` | range 0–40 step 4 px | `12` | `--av-ig-gap`, also passed to the slider as `--av-slider-gap` |
| `show_captions` | checkbox | `true` | captions under the images and in the lightbox |
| `hover_zoom` | checkbox | `true` | 4 % scale on hover for images that open the lightbox; hover-capable pointers, theme animations on, motion allowed |

Header "Lightbox":

| id | type | default | effect |
|---|---|---|---|
| `lightbox` | checkbox | `true` | wraps every picked image in a link and renders the dialog and module; ignored when no block has an image |

Header "Slider" (used only by the slider layout):

| id | type | default | effect |
|---|---|---|---|
| ~~`slider_peek`~~ | range 0–64 step 8 px | `24` | `peek` / `--av-slider-peek` |
| `show_arrows` | checkbox | `true` | `arrows` attribute |
| `show_dots` | checkbox | `false` | `dots` attribute plus the empty dots row (reserved height) |
| `autoplay` | range 0–10 step 1 s | `0` | `autoplay` attribute; the slider pauses on hover/focus, shows a pause button and starts paused under reduced motion |

25 non-header settings (13 chassis + 12). `disabled_on.groups: ["*"]`. Preset "Image gallery": heading "In **pictures**", six empty image blocks (placeholders).

## Blocks
Local block `image` (name "Image"), `max_blocks: 30`:

| id | type | note |
|---|---|---|
| `image` | image_picker | no default; blank renders a placeholder (`lifestyle-1`, `product-1`, `lifestyle-2`, `product-2`, `image`, `product-3`, cycling). In masonry, blank blocks cycle 4:5, 1:1, 3:4, 16:9 so the preview shows the staggered wall |
| `alt` | text | overrides the image's own alt text (passed to `anvil-media`, which falls back to `image.alt`) |
| `caption` | text | optional; escaped; honesty `info` |

## Behaviour
- **Without JS:** grid and masonry are static; the slider is a swipeable, keyboard-scrollable scroll-snap row; lightbox images are links that open the image itself (same tab). The `<dialog>` stays closed and invisible.
- **Lightbox (with JS):** a plain click on an image link opens the dialog on that image (`anvil-dialog.open(opener)`: `showModal`, scroll lock, `aria-expanded` on the opener, which carries `aria-haspopup="dialog"`). Ctrl/Cmd/Shift/Alt/middle clicks keep the link. Slides are built on the first open; each has an empty `<img>` whose `srcset` (750/1100/1500/2200, capped at the image's own width, from the link's CDN URL) is set only for the current slide and its two neighbours. Off-screen slides are `aria-hidden="true"`.
- **Carousel semantics (CONVENTIONS §9, WAI-ARIA APG carousel):** the lightbox track is `role="region"` with `aria-roledescription` from `anvil.a11y.carousel` and the section heading (or `anvil.image_gallery.label`) as its name. Each slide is `role="group"`, `aria-roledescription` from `anvil.a11y.slide` (rendered on the track as `data-anvil-slide`, so the module carries no strings) and named "Image N of M" from the counter's template.
- **Moving:** swipe (scroll-snap, `scroll-snap-stop: always`), Previous/Next buttons, ArrowLeft/ArrowRight anywhere in the dialog (mirrored in RTL), Home, End. Buttons and keys wrap around and jump instantly (no smooth scroll, so nothing to gate for reduced motion and nothing for a re-snap to cut short). The counter "Image N of M" is a polite live region; it follows swipes after the scroll settles (120 ms). One image: the buttons are hidden.
- **Closing:** Esc (native) or the close button (`data-anvil-close`, handled by `anvil-core.js`). `anvil-dialog` returns focus to the opener; the module then moves focus to the link of the image the shopper ended on (inside the slider this also scrolls the row to it).
- **Loading:** first two sections: the first desktop row is eager (grid and slider: blocks 1..`columns_desktop`; masonry, which fills column by column: the approximate top of each column, every `ceil(blocks / columns_desktop)`-th block); in the first section the first image (when picked) gets `priority` (eager, `fetchpriority=high`, preload). Elsewhere lazy. `sizes` follows the columns, with a `(min-width: <max(page or narrow width, 990)>px) <width / columns_desktop>px` entry that caps the column at the container width only where the desktop column count applies; below 990 px (tablets, and the slider's phone count) the viewport-fraction entries apply, which can only overestimate. Full width uses viewport fractions only.
- **Focus ring on image links:** drawn by `.av-image-gallery__open::after` (absolute, `inset: 0`, above the positioned media) as a 2 px accent outline with `outline-offset: -2px`; the link itself keeps `outline: 2px solid transparent`. The ring sits inside the image because the slider track (`overflow-x: auto`, so `overflow-y` computes to hidden) clips anything outside the slide, and later masonry/grid tiles would cover an outside ring at small gaps. A pseudo-element outline (not a box-shadow) also shows in forced-colours mode.
- **Motion:** the open fade and the hover zoom exist only when Theme settings > Animations is on (`av-image-gallery--motion` / `--zoom`, decided in Liquid) and inside `prefers-reduced-motion: no-preference`; they use `--av-dur` / `--av-ease`.
- **Editor:** an empty section shows `anvil.editor.empty_section`. Block select in the slider scrolls to the slide (`<anvil-slider>`). A section re-render reconnects the element; an open dialog's scroll lock is released by `anvil-dialog`.

## Honesty notes
- Nothing in this section counts, times or rates anything. The only free text is the caption, whose `info` asks for statements that are true for the product or result shown; the image picker's `info` asks for photos the merchant owns or is licensed to use.
- Placeholders are Shopify's illustration SVGs, so an unedited section never shows a stock photo that could pass as the merchant's product.

## Performance
- Section CSS ~4.5 KB raw (~1.4 KB gzipped) in `{% stylesheet %}` (limit 6 KB).
- `assets/anvil-image-gallery.js`: 5.5 KB raw, 2045 B gzipped (`gzip -9`; CONVENTIONS §7 budget 2 KB, 3 B left; `check-limits.sh` 4 KB). Loaded only when the lightbox is on and at least one image is picked.
- The lightbox also loads the shared `anvil-dialog.css` (scroll lock), cached across sections.
- The slider layout loads the shared `anvil-slider.css` / `anvil-slider.js`; grid and masonry load nothing else.

## Locale keys needed (`anvil.image_gallery.*`)
| key | English |
|---|---|
| `anvil.image_gallery.label` | Image gallery |
| `anvil.image_gallery.enlarge` | Enlarge image {{ index }} of {{ total }} |
| `anvil.image_gallery.viewer` | Image viewer |
| `anvil.image_gallery.previous` | Previous image |
| `anvil.image_gallery.next` | Next image |
| `anvil.image_gallery.count` | Image {{ index }} of {{ total }} |
| `anvil.a11y.slide` | Slide |

Shared keys used: `anvil.a11y.close`, `anvil.a11y.carousel`, `anvil.editor.empty_section`.

## Contract assumptions
- `<anvil-dialog>` (anvil-core.js): `open(opener)` shows the inner `<dialog>` modally, locks scroll and restores focus to the opener on `close`; `[data-anvil-close]` closes the nearest ancestor with `close()`. The module falls back to `dialog.showModal()` if the element is not defined yet.
- The scroll lock depends on `assets/anvil-dialog.css`: `anvil-dom.js` `lockScroll` only toggles `html.av-scroll-locked`, and the `overflow: hidden` rule for that class lives in `anvil-dialog.css`. The section loads it inside the lightbox branch (DECISIONS 3), like every other dialog section; without it the page scrolls behind the open lightbox.
- `<anvil-slider>`: inline `--av-slider-gap` on the element overrides the component's default gap (the component declares `--av-slider-gap` on itself, so it cannot be inherited).
- `anvil-media`: `alt` blank falls back to the image alt; `placeholder` names a `placeholder_svg_tag`; `priority` adds preload.
- `image_url: width: 2200` returns a URL carrying `width=2200`; the module rewrites that parameter for the srcset (a URL without it gets one candidate).
- `settings.page_width`, `settings.narrow_width`, `settings.animations_enabled` are theme settings (they are).

## Uncertainties / open questions
1. **Captions in the lightbox follow `show_captions`.** One switch for both places keeps the editor simple; a merchant who wants captions only in the lightbox cannot have that.
2. **Hover zoom applies only to lightbox images**, so an image that does nothing on click never looks clickable. With the lightbox off the setting has no effect (its `info` says so).
3. **No per-image link.** The spec lists none; a link would compete with the lightbox. Add later as "link (used when the lightbox is off)" if wanted.
4. **No pinch zoom inside the lightbox** beyond the browser's own page zoom; the product gallery's zoom engine was not reused because it is bound to `<anvil-gallery>`.
5. **Slider on tablets** uses the phone count (the slider component has only the 990 px breakpoint).

## Integration pass (2026-10-15)
- The lightbox slide role uses the shared `anvil.a11y.slide`, which `layout/theme.liquid` also exposes as `Anvil.strings.slideRole`; `anvil-slider.js` reads it, so slider slides are localised too.
- Placed on `templates/product.landing.json`.

## Fix pass (2026-10-15)
- Setting ids follow the theme-wide vocabulary (CONVENTIONS §5; DECISIONS 82–100); the tables above use the new ids: `columns_desktop` → `cols_desktop`, `columns_mobile` → `cols_mobile`, `ratio` → `image_ratio`, `slider_peek` removed, `slider_arrows` → `show_arrows`, `slider_dots` → `show_dots`, `slider_autoplay` → `autoplay`. Saved templates were migrated.
- Uses the shared pieces: columns from the shared `.av-grid` rule (DECISIONS 82); slider attributes, peek, arrows and dots per width from `snippets/anvil-slider-attrs` (DECISIONS 89); eager or lazy media from `snippets/anvil-above-fold` (DECISIONS 85); the editor-only empty note from `snippets/anvil-editor-empty` (DECISIONS 87); hover zoom from `.av-hover-zoom` (DECISIONS 98).
- Availability: `disabled_on` groups ["header","custom.overlay"] (CONVENTIONS §4, DECISIONS 100).
