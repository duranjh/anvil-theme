# `anvil-testimonials` — Testimonials (section card)

_Wave-2 section. File `sections/anvil-testimonials.liquid`, editor name "Testimonials". Spec: `docs/SPEC.md` §4.2 "Testimonials"; `docs/DESIGN-sections.md` §3 row `anvil-testimonials`; card `docs/spec/testimonials.md`. Contract: `docs/CONVENTIONS.md` §3–§4, §6 (`<anvil-slider>`)._

## Purpose
A carousel of up to 24 customer-quote cards that the merchant types in: optional card image, stars (only with a source link), quote, name, role or detail, avatar (or initials), an optional "Verified purchase" line and a link to the original review. Phones show one card with the next one peeking in, tablets up to two, desktops 1–4 (default 3; at most three between 990 and 1199 px, where four columns leave about 100 px for the quote). Built on the shared `<anvil-slider>`, so it works as a scroll-snap row without JavaScript. There is no section-specific JS and no asset file; the CSS lives in `{% stylesheet %}` (5.5 KB raw, 1.5 KB gzipped).

## Markup (shopper view)
```
div#anchor.av-section.av-s-anvil-testimonials              ← anvil-section-attrs; rendered only when a quote shows or in the editor
  div.av-section__inner
    .av-section-head (h2 + subheading)                      ← anvil-section-head
    link anvil-slider.css
    anvil-slider.av-testimonials.av-testimonials--<style>.av-testimonials--<align>.av-testimonials--q-<size>
                 [--autoplay][--nodots][--arrows][--dense][--scroll-t][--scroll-b][--scroll-d]
                 role=region aria-label="<heading text>" autoplay=S [arrows] [dots: 2+ cards]
                 style="--av-testimonials-tablet; --av-testimonials-band; --av-testimonials-desktop; --av-testimonials-peek; --av-testimonials-peek-t; --av-testimonials-dots-h"
      div.av-testimonials__track[data-slider-track]
        div.av-testimonials__slide[data-slider-slide] {{ block.shopify_attributes }}   ×N
          figure.av-testimonials__card
            anvil-media .av-testimonials__media            ← only when a card image is set
            div.av-testimonials__stars > anvil-stars       ← only when stars > 0 AND a source link is set
            span.av-testimonials__mark (quote icon, aria-hidden)
            blockquote.av-testimonials__quote.av-rte
            figcaption.av-testimonials__by
              span.av-testimonials__avatar (img alt="" | initials aria-hidden)
              span.av-testimonials__who
                span.__name · span.__role · span.__verified · a.__source[target=_blank]
      div.av-slider__dots[data-slider-dots]                ← whenever there are 2+ cards (filled by the script); hidden from 750 px up when dots are off
    script[type=module] anvil-slider.js
    p.av-testimonials__note                                ← disclosure line (default on; always on while a quote has no source link)
    p.av-testimonials__note.av-example-note                ← editor only: stars hidden for want of a source
```
Headings: the section heading is the chassis `h2`. Card names are labels, not headings (CONVENTIONS §3), so the outline has no `h3` under it. `figure` + `blockquote` + `figcaption` is the HTML pattern for a quote with its attribution; the source link sits inside the `figcaption` because a `figcaption` must be the first or last child of its `figure`.

## Settings
The 13 chassis settings come first, verbatim. Then (24 non-header settings in total):

| id | type | default | effect |
|---|---|---|---|
| `cols_desktop` | select `1`–`4` | `3` | cards per view at ≥ 1200 px. Clamped to the number of cards that render, so two cards never leave an empty third column. 990–1199 px show `min(per_view, 3)`, tablets (750–989 px) `min(per_view, 2)`, phones always 1. From 3 per view the section adds `--dense`, which keeps the 32 px card padding at desktop widths instead of 48 px |
| `autoplay` | select `0` / `5` / `7` / `10` (seconds) | `0` | written as the slider's `autoplay` attribute. The slider wraps around, pauses on hover, focus, hidden tab, off-screen and block selection, starts paused under reduced motion (or `data-animations="off"`), and always shows a pause/play button. A select instead of a range keeps out 1–3 s intervals that are too fast to read a quote |
| `show_arrows` | checkbox | `true` | slider arrows, shown from 750 px up in side space the section reserves (never over the text). Hidden on phones, where swiping, the dots (always shown there) and the keyboard do the job |
| `show_dots` | checkbox | `true` | applies from 750 px up. Phones always get dots, so a mouse or a narrow zoomed window can still reach every card (the track hides its scrollbar). Liquid always renders the empty `.av-slider__dots` row when there are two cards or more; off adds `--nodots`, which hides the row from 750 px up. `info` says phones always show them |
| `card_style` | select `outlined` / `filled` / `raised` / `plain` | `outlined` | border (`max(1px, --av-border-w-card)`), 5 % foreground tint, background + `--av-shadow-md` (the track gets a little padding so the shadow is not clipped by its `overflow`), or no box (an 8 px inset, so the 2 + 3 px focus ring on links at the card edge is not clipped by the track) |
| `text_align` | text_alignment | `left` | card content alignment; centred cards stack the avatar above the name, right-aligned cards mirror the caption |
| `quote_size` | select `sm` / `md` / `lg` | `md` | `--av-text-sm|md|lg` for the quote |
| `show_quote_icon` | checkbox | `true` | decorative Lucide `quote` icon in the accent colour, rendered once and reused |
| `image_ratio` | select `adapt` / `1:1` / `4:5` / `16:9` | `1:1` | shape of the optional card image (`anvil-media`), which is at most 400 px wide |
| `show_disclosure` | checkbox | `true` | prints the disclosure line under the slider. It can be switched off only when every quote has a source link; while any card has none, the line renders anyway. `info` says so |
| `disclosure` | text | blank | override for the line (escaped); blank uses the existing `anvil.trust.quotes_disclosure` ("Quotes shared by customers; entered by the store."). `info`: say plainly that the store entered the quotes; do not call them verified, independent or unedited unless that is true |

A `paragraph` under the "Testimonials" header tells the merchant that cards are typed quotes and points review-app users to their app's block. Preset "Testimonials": heading "What customers **say**", four example cards.

## Blocks
Local block `card` (name "Testimonial"), `max_blocks: 24`. A `paragraph` at the top of every card labels it as a merchant-typed quote (HONEST.md: "merchant-typed testimonials are labelled as such in the editor").

| id | type | default | note |
|---|---|---|---|
| `quote` | richtext | `<p>Example quote — replace with words a real customer sent you, and ask before you publish them.</p>` | the card is skipped on the storefront when blank; in the editor it stays selectable with `anvil.editor.block_empty`. `info`: shorten, never change the meaning |
| `name` | text | "Example name" | escaped; initials (first letters of the first and last word) feed the avatar fallback |
| `role` | text | "Example: their city or job" | escaped; `info` says not to type "verified" here |
| `avatar` | image_picker | — | 48 px circle, `widths: '48, 96'`, `alt=""` (the name is right beside it). Without one, initials on a 8 % tint, `aria-hidden` |
| `image` | image_picker | — | optional card image via `anvil-media` (`widths: '300, 450, 600'`), alt from the image's own alt text. Capped at 400 px wide (`width: 100%; max-width: 400px`, aligned with the card text), so one card per view never upscales a 600 px file to a screen-tall square; `sizes` is capped the same way per breakpoint (`min(<100/columns>vw, 400px)`). `info`: only images you have the rights to |
| `rating` | range 0–5 step 0.5 | `0` | drawn with `anvil-stars` **only when `source_url` is set**; 0 hides the stars |
| `source_url` | url | — | "See the original review" link (new tab, with the visually hidden "(opens in a new tab)") |
| `verified` | checkbox | `false` | "Verified purchase" line with a `badge-check` icon. The `info` is a warning: tick only after matching the quote to a real order |

`{{ block.shopify_attributes }}` sits on each slide (`[data-slider-slide]`), so the slider's `shopify:block:select` handler scrolls to the card being edited and pauses autoplay while it is selected.

## Behaviour
- **Without JS:** a horizontal scroll-snap row with the same widths and peek (the column counts and peeks are inline custom properties, so nothing moves when the script runs). No arrows, dots stay an empty reserved row, no autoplay.
- **With JS (`anvil-slider.js`):** arrows move one page, one dot per page, ArrowLeft/ArrowRight inside the carousel, `role=region` + `aria-roledescription="carousel"`, slides `role=group` "N of M", polite live region (off while rotating), `av-is-static` hides the controls when everything fits.
- **Columns and peek through the slider's public inputs.** The section writes no `per-view`, `per-view-desktop` or `peek` attribute and no `--av-slider-*` value inline. Its stylesheet sets `--av-slider-per-view` (1, then `--av-testimonials-tablet` from 750 px), `--av-slider-per-view-desktop` (`--av-testimonials-band` at 990–1199 px, `--av-testimonials-desktop` from 1200 px) and `--av-slider-peek` from the inline `--av-testimonials-*` values. The script fills a property only when its attribute is present, so it never overrides them. This departs from the letter of CONVENTIONS §6 (which has Liquid write `--av-slider-*` inline) to get per-breakpoint columns without touching the slider's private `--n`; nothing moves when the script runs either way.
- **Peek:** phones 40 px (only with two or more cards), tablets 48 px (only when the cards outnumber the tablet columns), desktop none.
- **Reserved space:** `--scroll-t` / `--scroll-b` / `--scroll-d` (Liquid: more cards than the tablet / 990–1199 px / 1200 px+ columns) decide whether the side space for arrows and the bottom space for the pause button exist at that width, which matches when the slider marks itself static, so nothing jumps after load.
- **Phone dots:** one dot per card. Liquid reserves the rows they will need once the script fills them (`--av-testimonials-dots-h`, worked out for a 320 px screen from `settings.gutter_mobile` and `settings.slider_dot_gap`, less 104 px for the pause button when the cards rotate), so the disclosure line does not move when the row wraps. Checked in headless Chrome at 320 and 375 px with 7, 12, 13 and 24 cards, with and without autoplay, and with a 16 px dot gap and 32 px gutter. On wider phones this can leave up to one empty row.
- **Loading:** images are lazy, except in the first two sections (`section.index` ≤ 2 or nil), where the first visible row (the first `per_view` cards) is eager. No `fetchpriority`: a testimonial is not expected to be the LCP element.
- **Equal heights:** slides stretch to the tallest card; the caption is pushed to the bottom of each card.
- **No blocks / no quotes:** the storefront renders nothing (no heading, no padding); the editor shows the heading and `anvil.editor.empty_section`.
- **Reduced motion:** handled by the slider (paused autoplay, `scroll-behavior: auto`). The section itself animates nothing.

## Honesty notes
- Every default and preset string reads as an example ("Example quote — …", "Example name", "Example: their city"), so an unedited store claims nothing.
- **Stars need a source link.** CONVENTIONS §10 / HONEST.md allow typed star numbers only with a source URL, so a card's stars render only when its `source_url` is set, and the link is printed on the card so shoppers can check it. Stars default to 0. In the editor a single note under the carousel (`anvil.editor.review_stars_no_source`) explains when a card's stars are hidden for this reason.
- **"Verified purchase"** is a checkbox, off by default, whose `info` is a warning (spec: "'verified' toggle carries a warning"). The `role` field's `info` steers merchants away from typing "verified" as free text.
- **Disclosure line** on by default, using the existing `anvil.trust.quotes_disclosure` string that the product page's reviews list uses, so the two read the same. Honest by construction: the checkbox only takes effect when every quote links to its source; while any card has no source link the line renders anyway. The override text's `info` says what may and may not be claimed.
- No review counts, no aggregate rating, no platform logos, and **no `Review`/`AggregateRating` structured data**: these are store-entered quotes about the store's own products, which search engines treat as self-serving reviews.

## Locale keys needed (integrator adds them)
| key | English |
|---|---|
| `anvil.testimonials.label` | Customer testimonials |
| `anvil.testimonials.verified` | Verified purchase |
| `anvil.trust.original_review` | See the original review |

Existing keys used: `anvil.trust.quotes_disclosure`, `anvil.a11y.new_window`, `anvil.editor.review_stars_no_source`, `anvil.editor.block_empty`, `anvil.editor.empty_section`, `anvil.stars.label` (through `anvil-stars`); the slider's own strings come from `window.Anvil.strings`. Translations are printed as `t` returns them (already escaped); only merchant text is escaped in the section, and the region label uses `escape_once` so entities stored by `inline_richtext` are not escaped twice.

## Contract assumptions (other owners)
- `<anvil-slider>` (`assets/anvil-slider.js` / `.css`, read-only): reads `autoplay`, `arrows`, `dots`; keeps a `role` already present; fills only the inline custom properties that are missing **and** whose attribute is present, so omitting `per-view`, `per-view-desktop` and `peek` leaves the section's breakpoint values alone; reads only the public inputs `--av-slider-per-view`, `--av-slider-per-view-desktop` and `--av-slider-peek` (the section never writes the private `--n`); computes pages from the rendered layout (so the tablet and 990–1199 px column counts are honoured); creates arrows and the pause button as direct children with the documented classes. The section restyles none of the controls' looks; it only hides arrows below 750 px, hides the dots from 750 px up when they are off, sets the dots row's minimum height, and reserves space for the arrows and the pause button (selectors scoped under `.av-testimonials`).
- `anvil-stars` styles live in `anvil-base.css` (DECISIONS 29), so no `anvil-card.css` is loaded.
- `anvil-media` reserves the aspect ratio and renders `image_tag` with the given `widths`/`sizes`/`loading`.
- `.av-align--*`, `.av-example-note`, `.av-visually-hidden` and `.av-rte` come from `anvil-base.css`.

## Uncertainties / open questions
1. **Stars without a source link.** The spec lists stars per card; the honesty rule only allows typed stars with a source URL, so most stores will show no stars until they paste one. If the owner prefers stars on unlinked quotes when "Verified purchase" is ticked, that is a rule change for HONEST.md, not something this section should decide.
2. **Arrows hidden on phones.** Chosen so arrows never cover quote text at 375 px; navigation there is swipe, the dots (always shown on phones since the review pass) and keyboard (the track is focusable once it scrolls). Revisit if the a11y pass wants visible arrows on phones (they would need a controls row below the cards in the shared slider).
3. **`@app` / `custom_liquid` blocks.** DESIGN-sections §2 says data-row sections offer them "where app content is plausible"; the spec card lists only `card`, and a review app's widget does not fit a carousel slide, so neither is offered.
4. **Theme-wide card style.** `settings.card_style` (flat/outlined/raised) is printed as a body class but no CSS reads it yet; this section has its own `card_style`. A "follow theme" option could be added once the theme-level rule exists.
5. **Gate G0/G3/G4** (paths-lint, push, screenshots) were not run: no git in this wave and no dev-theme credentials. Layout was checked in headless Chrome against a static mock of the rendered markup with the real `anvil-base.css`, `anvil-slider.css/js` and this stylesheet at 320, 375, 800, 1000, 1100 and 1280 px (phones in an iframe, since headless Chrome will not size a window below 500 px), before and after the script runs.

## Integration pass (2026-10-15)
- The source link uses the shared `anvil.trust.original_review`. Placed on `templates/index.json` and `templates/product.landing.json`.

## Fix pass (2026-10-15)
- Setting ids follow the theme-wide vocabulary (CONVENTIONS §5; DECISIONS 82–100); the tables above use the new ids: `per_view` → `cols_desktop`. Saved templates were migrated.
- Uses the shared pieces: card boxes from `snippets/anvil-surface` and `.av-surface` (DECISIONS 83); slider attributes, peek, arrows and dots per width from `snippets/anvil-slider-attrs` (DECISIONS 89); eager or lazy media from `snippets/anvil-above-fold` (DECISIONS 85); the editor-only empty note from `snippets/anvil-editor-empty` (DECISIONS 87).
- Availability: `disabled_on` groups ["header","custom.overlay"] (CONVENTIONS §4, DECISIONS 100).
