# `anvil-collage` — Collage (section card)

_Wave-2 section. File `sections/anvil-collage.liquid`, editor name "Collage". Spec: `docs/SPEC.md` §4.1 "Collage"; `docs/DESIGN-sections.md` §3 "Standard sections" (`anvil-collage` 260); spec card `docs/spec/collage.md`. Contract: `docs/CONVENTIONS.md` §3–§4. Module: `assets/anvil-collage.js` (video tiles only)._

## Purpose
An asymmetric mosaic of up to five tiles that mixes images, products, collections and videos. The first block is the big tile; the merchant puts it on the left or the right, picks the tile height, the gap and whether tiles use the theme's media corner radius or square corners. The layout is pure CSS grid. Video tiles show a cover and open the video in a native `<dialog>` inside `<anvil-dialog>`.

## Layout
| Tiles | Phones (< 750 px), two columns | Tablet / desktop (≥ 750 px), two rows |
|---|---|---|
| 1 | one tile, full width, two rows tall | one tile, full width, two rows tall |
| 2 | big tile (2 rows) + one full-width tile | big 3fr + one 2fr tile, both two rows tall |
| 3 | big tile + two half tiles | big 3fr (2 rows) + two stacked 2fr tiles |
| 4 | big tile + two halves + one full-width tile | big 2fr (2 rows) + one wide tile on top + two below |
| 5 | big tile + four halves | big 2fr (2 rows) + a 2 × 2 grid |

"Big tile: Right" mirrors the column template and places the first tile in the last column (`grid-column: -2`); the other tiles keep their DOM order through auto-placement, so the reading order is always the block order. Phones always show the big tile on top. Row heights come from "Tile height" (phones 180 / 210 / 250 px per row; desktop 220 / 280 / 340 px; tablets 80 % of desktop). They are minimums (`grid-auto-rows: minmax(<height>, auto)`): image, collection and video tiles hold only absolutely positioned content, so they keep the chosen height, and a product card that needs more room (quick add, a rating, a long title on a half tile) makes its row taller instead of spilling onto the next tile. Every tile fills its grid area and its media covers it, so nothing shifts while images load.

## Markup (shopper view)
```
div#anchor.av-section … .av-s-anvil-collage                           ← anvil-section-attrs
  div.av-section__inner
    .av-section-head (h2 + subheading)                                ← anvil-section-head
    h2.av-visually-hidden "Highlights"                                ← heading blank and a product/collection tile exists
    link anvil-card.css                                               ← any product tile
    link anvil-dialog.css                                             ← any video tile with a video
    ul.av-collage.av-collage--n<1-5>.av-collage--big-left|big-right.av-collage--h-sm|md|lg[.--square][.--motion]
        style="--av-collage-gap"
      li.av-collage__tile.av-collage__tile--<type>[.av-collage__tile--link] {{ block.shopify_attributes }}  ×N
        image:      a.av-collage__fill[href] | div.av-collage__fill
                      div[aria-hidden=true when the link has a caption or description]
                        .av-media.av-collage__media (anvil-media, cover)
                      span.av-collage__label (caption [+ arrow icon when linked])
                      | span.av-visually-hidden (link description, linked tile without caption)
                    p.av-collage__note.av-example-note               ← editor only: link without a name
        product:    .av-card.av-card--fill … (anvil-product-card, h3 title, image fills what the text leaves, shown whole)
        collection: a.av-collage__fill[href=collection] | div.av-collage__fill (no collection picked)
                      div[aria-hidden=true] > .av-media.av-collage__media (custom image or collection.featured_image)
                      div.av-collage__label > h3.av-collage__title [+ arrow] [+ span.av-collage__count]
        video:      .av-media.av-collage__media (cover, else the uploaded video's preview image)
                    anvil-dialog#anvil-collage-<section>-<block>.av-collage__host.av-enhance[data-anvil-collage-video]
                      a.av-collage__fill.av-fallback-only[href=MP4 | video link]      ← until anvil-dialog is defined
                      button.av-collage__fill.av-enhanced-only[data-anvil-open][aria-haspopup=dialog][aria-expanded]
                        span.av-media__play[aria-hidden] (shared play disc) + span.av-visually-hidden "Play video"
                        span.av-collage__label (caption)
                      dialog.av-dialog.av-collage__dialog[aria-label=caption|"Video"] style="--av-collage-ratio"
                        button.av-dialog__close[data-anvil-close]
                        uploaded:  template[data-anvil-collage-player] > .av-media.av-collage__player (anvil-media, video_tag)
                                   a[data-anvil-collage-fallback][href=MP4] "Play video"   ← both replaced by the player on first open
                        YouTube/Vimeo: .av-media.av-collage__player (anvil-media facade, lazy poster)
                    (no video: cover + caption only; editor note anvil.collage.no_video)
    script[type=module] anvil-product.js                              ← a product tile with quick add and a product
    script[type=module] anvil-collage.js                              ← a video tile with a video
```
Headings: the chassis `h2` (or the hidden one), then `h3` for product and collection titles. Image and video captions are not headings.

## Settings
The 13 chassis settings come first, verbatim. Then, under the header "Collage":

| id | type | default | effect |
|---|---|---|---|
| `layout` | select `big_left` / `big_right` | `big_left` | side of the big (first) tile on tablets and desktop; class `av-collage--big-left|big-right` |
| `height` | select `sm` / `md` / `lg` | `md` | row heights (see Layout) |
| `gap` | range 0–40 step 4 px | `12` | `--av-collage-gap` |
| `radius` | select `media` / `none` | `media` | tile, media box and focus-ring corners: `--av-radius-media` or 0 (`av-collage--square`) |

17 non-header settings (13 chassis + 4). `max_blocks: 5`. `disabled_on.groups: ["*"]`. Preset "Collage": heading "Explore the **range**", blocks image (caption "Example caption — replace me"), collection, product, video (caption "Example video — replace me"); every picker empty, so the preview shows placeholders and the example card.

## Blocks (local)
| type | settings | renders |
|---|---|---|
| `image` "Image" | `image` (image_picker), `caption` (text), `link` (url), `link_label` (text) | the image cropped to the tile, the caption in a chip at the bottom; the whole tile is the link. Placeholder `lifestyle-1` / `lifestyle-2` when empty |
| `product` "Product" | `product` (product), `quick_add` (checkbox, off) | `anvil-product-card` (`heading_tag: 'h3'`, `show_rating: true`, `uid: block.id`, `placeholder_index` = tile number); blank renders the example card |
| `collection` "Collection" | `collection` (collection), `image` (image_picker, optional override), `show_count` (checkbox, off) | the collection image (override, else `collection.featured_image`) and a chip with the title as `h3`, an arrow and optionally "N products" (`collection.all_products_count`); blank renders `collection-N` placeholder art and "Example collection", not linked |
| `video` "Video" | `cover` (image_picker), `video` (video), `video_url` (video_url, YouTube/Vimeo), `caption` (text) | the cover with a play button; the button opens the dialog with the video |

## Behaviour
- **Links and names.** An image tile becomes a link only when the link has a name. It is named by its own text first: the caption (visible in the chip), else the link description (a visually hidden span inside the link); in both cases the image sits in an `aria-hidden` wrapper, so its alt does not add to the name (WAI images tutorial: an image beside text in the same link is silent). With neither, the image's alt text names the link. With none of the three it stays a plain tile and the editor shows `anvil.collage.link_needs_name`. Collection tiles are named by their `h3` (and the optional count); their image is in an `aria-hidden` wrapper because `anvil-media` cannot print `alt=""` and would otherwise read out the image's own alt (often a product photo's, from `collection.featured_image`). The global `:focus-visible` ring draws around the whole tile (the link covers it) and follows the tile corners; the focused tile is lifted (`.av-collage__tile:focus-within { z-index: 1 }`) so neighbours never cover the ring, even at gap 0.
- **Video tiles.** With JavaScript, the button carries `data-anvil-open`; `anvil-core.js` opens the `<anvil-dialog>` (`showModal`, scroll lock, `aria-expanded`, focus back to the button on close; Esc, backdrop click and the close button close it). `anvil-collage.js` then starts playback because the shopper asked for it: an uploaded video's `play()` (on the first open the module first replaces the `<template>` and its fallback link with the player), or a click on the YouTube/Vimeo facade (`anvil-media`; nothing loads from those hosts before this). On close it pauses the uploaded video and points the YouTube/Vimeo iframe at `about:blank`, keeping its address for the next open, so no sound plays from a closed dialog (WCAG 1.4.2). The dialog is as wide as the video can be at the viewport height (`--av-collage-ratio`, at most 1040 px), so portrait videos do not leave an empty frame.
- **Without JavaScript** (or before `anvil-dialog` is defined): `.av-enhance` shows the fallback link instead of the button, pointing at the uploaded video's MP4 source or at the YouTube/Vimeo link the merchant entered; an uploaded video without an MP4 source has no fallback and its tile is inert. If `anvil-dialog` runs but `anvil-collage.js` does not, the open dialog shows a "Play video" link to the MP4 in place of the player. Images, products and collections need no script; quick add posts the card's native form.
- **Product tiles** render the shared card with `class: 'av-card--fill'`. Until the card supports that variant, three interim rules in this section's stylesheet (scoped to `.av-collage__tile--product > .av-card--fill`) make it fill the tile: the image box drops its aspect ratio and takes the height the text leaves (`flex: 1 1 0`, at least 64 px), the body keeps its height, and the image uses `object-fit: contain`, so a square product shot is shown whole on the media box's neutral background instead of being cut to a strip. Badges, hover image, rating (metafield only) and quick add come from the card. When the card needs more height than the row gives, the row grows (see Layout).
- **Loading.** First two sections (or `section.index` nil): tiles 1–3 load eagerly; in the first section tile 1 gets `priority` (eager, `fetchpriority=high`, preload; the product card's own `priority`). `sizes` follows each tile's share of the row (60/40, 50/25 …; phones 100 or 50 vw) with a `(min-width: <page or narrow width>px)` cap that never starts below 750 px (a Narrow width under 750 px gives `(min-width: 750px) <cap share>px, <phone share>vw`, so phone-layout viewports keep their phone size); widths up to 1100 for big and full-width-on-phone tiles, 900 for small ones, 2200 for a single tile. Dialog media is not fetched before opening: an uploaded video sits in an inert `<template>` (a `<video>` in the page would fetch its poster and metadata even inside a closed dialog) and is put in by `anvil-collage.js` on the first open; a YouTube/Vimeo facade's poster is `loading=lazy` inside the hidden dialog and nothing loads from those hosts before play. Each video tile fetches only its cover image on page load.
- **Motion.** Linked and video tiles zoom their image 4 % on hover, only with Theme settings > Animations on (`av-collage--motion`, decided in Liquid) and inside `prefers-reduced-motion: no-preference`. The dialog's own entrance animation comes from `anvil-dialog.css` (same gates).
- **Editor.** An empty section shows `anvil.editor.empty_section`. Selecting a block scrolls to its tile (core). The module listens on `document`, so section re-renders need no clean-up.

## Honesty notes
- Nothing in the section counts, times or rates on its own. Product ratings appear only from the `reviews.rating` metafield (the card's rule); the collection count is Shopify's `all_products_count`, behind a checkbox whose `info` says so.
- Free text is limited to captions and the link description; each carries an `info` asking for statements true to the photo or video. The image `info` asks for photos the merchant owns or is licensed to use.
- Preset captions read as examples; pickers ship empty, so an unedited section shows Shopify's illustration placeholders and the "Example product" card, never a stock photo that could pass for the merchant's product, and no links that lead nowhere.

## Performance
- `{% stylesheet %}` 4,876 B raw (limit 6 KB), 1,537 B gzipped.
- `assets/anvil-collage.js`: 2,072 B raw, 901 B gzipped (CONVENTIONS §7 budget 2 KB). Loaded only when a video tile has a video.
- Shared files loaded only when used: `anvil-card.css` (product tiles), `anvil-dialog.css` (video tiles), `anvil-product.js` (quick add on a picked product).

## Locale keys needed (`anvil.collage.*`, added by the integrator)
| key | English |
|---|---|
| `anvil.a11y.highlights` | Highlights |
| `anvil.card.example_collection` | Example collection |
| `anvil.collage.link_needs_name` | Add a caption or a link description so this link has a name. Until then the tile is not a link. |
| `anvil.collage.no_video` | Add a video or a YouTube or Vimeo link so this tile can play. |

Reused: `anvil.media.play`, `anvil.media.video`, `anvil.a11y.close`, `anvil.collection.product_count` (one/other), `anvil.editor.empty_section`, and the card's `anvil.card.*`.

## Contract assumptions
- `<anvil-dialog>` (anvil-core.js) emits `anvil:dialog:opened` / `anvil:dialog:closed` with `{ element }` on `document`, and the page-wide `[data-anvil-open]` handler calls `open(opener)` (it sets `aria-expanded` on an opener that carries `aria-haspopup`).
- `anvil-media` renders the YouTube/Vimeo facade as `<anvil-video-facade>` with a `[data-anvil-play]` link and replaces its children with an `iframe` on click; `class` lands on the `.av-media` box; `ratio: 'adapt'` sets `--av-media-ratio` from the media. Its uploaded-video branch prints `video_tag` with `preload: 'metadata'` and a poster, and takes no `preload`/`poster` parameter (hence the `<template>`). Passing `alt: ''` does not make an image decorative: the snippet falls back to the image's own alt (hence the `aria-hidden` wrappers).
- `.av-media__play` (anvil-base.css) is the shared play disc; the video tile reuses it on a `<span>` inside its button.
- `anvil-product-card` keeps its media in `.av-card__media` (an `.av-media` box), its images as `.av-card__img`, and its text in `.av-card__body`, inside a flex column `.av-card` with `height: 100%`; its `class` parameter lands on `.av-card`.
- `video` settings expose `sources` (with `format` and `url`), `aspect_ratio` and `preview_image`; a `video_url` setting prints the URL the merchant entered.
- `settings.page_width`, `settings.narrow_width` and `settings.animations_enabled` are theme settings (they are).

## Open questions
1. **A small module beyond `<anvil-dialog>`.** The card says "JS: none beyond `<anvil-dialog>`", but the core dialog neither starts nor stops media, so without `anvil-collage.js` a closed dialog would keep playing sound (and the shopper would have to press play twice). The module also puts an uploaded video into the dialog on first open (it waits in a `<template>` so the page does not fetch its poster and metadata). It is 901 B gzipped. If the core dialog ever pauses media on close, the module can shrink to the swap-and-play part. Alternative to the `<template>`: a `preload` (and `poster: false`) parameter on `anvil-media` (shared snippet; integrator decision).
2. **Card fill variant (integrator / card owner).** The section passes `class: 'av-card--fill'` to `anvil-product-card` and, for now, carries three rules for it scoped to the tile (CONVENTIONS §3 says compose, not restyle). Requested in `assets/anvil-card.css`: `.av-card--fill>.av-card__media{flex:1 1 0;min-height:var(--av-space-8);aspect-ratio:auto}`, `.av-card--fill>.av-card__body{flex:none}`, `.av-card--fill .av-card__img{object-fit:contain}` (the parent sets the height). Once it lands, delete the three `.av-card--fill` rules here; the markup does not change. `object-fit: contain` shows the whole product with the media box's neutral background as the letterbox, instead of cropping a square shot to a wide strip.
3. **Card images top out at 600 px** (`anvil-product-card` fixes `widths: '300, 450, 600'`), so a product on the big desktop tile can look soft on high-density screens. A `widths` parameter on the card would fix it.
4. **No focal point.** Image, collection and video tiles crop with `object-fit: cover` from the centre; `anvil-media` takes no `object-position`, so the image `info` says to keep the subject near the centre.
5. **Phones and product tiles.** At 210 px per row a half-width product tile leaves roughly 64–140 px for the image under the title and price; with quick add (or a rating and a long title) the card can need more than the row, and the row then grows to fit (so the mosaic's rows are no longer all equal). "Large" height or putting the product on the big tile keeps the rows even.
6. **Dialog padding.** `.av-collage__dialog` overrides `.av-dialog` padding (top `44px + space-3`) so the close button never sits on the video. `anvil-dialog.css` has a width token (`--av-dialog-width`, used here) but no padding token; a `--av-dialog-pad` token or an `.av-dialog--media` variant would let the section drop the override.
7. **Decorative images in `anvil-media`.** The snippet cannot print `alt=""` (blank `alt` falls back to the image's own). The section wraps such images in `aria-hidden` containers; a `decorative: true` parameter on the snippet would be the cleaner fix.

## Integration pass (2026-10-15)
- The `av-card--fill` variant moved into `assets/anvil-card.css`; the three section rules were removed. `anvil-product-card` now takes `widths` (the big tile can pass up to 1100; not wired yet) and its quick add binds to `anvil-product.js`.
- `anvil-media` has a `decorative` parameter now; the section's aria-hidden wrappers still work and were left as they are.
- Shared keys: the hidden heading uses `anvil.a11y.highlights`, example tiles `anvil.card.example_collection`.

## Fix pass (2026-10-15)
- Uses the shared pieces: eager or lazy media from `snippets/anvil-above-fold` (DECISIONS 85); the editor-only empty note from `snippets/anvil-editor-empty` (DECISIONS 87); hover zoom from `.av-hover-zoom` (DECISIONS 98); a hidden fallback heading through `anvil-section-head` (DECISIONS 84).
- Availability: `disabled_on` groups ["header","custom.overlay"] (CONVENTIONS §4, DECISIONS 100).
