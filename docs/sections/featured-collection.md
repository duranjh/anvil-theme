# `anvil-featured-collection` — Featured collection (section card)

_Wave-3 section. File `sections/anvil-featured-collection.liquid`, editor name "Featured collection". Spec: `docs/spec/featured-collection.md`; `docs/DESIGN-sections.md` §3 "Standard sections" (`anvil-featured-collection`: grid/slider, product cards, quick add). Contract: `docs/CONVENTIONS.md` §3–§6 (`<anvil-slider>`), §11–§12._

## Purpose
Products from one collection, or from a hand-picked product list, shown as `snippets/anvil-product-card.liquid` cards in a grid or in a one-row `<anvil-slider>`. Nothing chosen: example cards (the card snippet's placeholder state) so the preset looks finished and reads as an example. No section-specific JavaScript and no asset file of its own; the CSS lives in `{% stylesheet %}` (2.6 KB raw, 0.7 KB gzipped).

## Markup (shopper view)
```
div#anchor.av-section.av-s-anvil-featured-collection          ← anvil-section-attrs
  div.av-section__inner
    .av-section-head (h2 + subheading)                          ← anvil-section-head
    h2.av-visually-hidden                                       ← only when the heading is blank (card titles are h3)
    link anvil-card.css
    div.av-featured-collection[.av-featured-collection--no-hover]
      p.av-featured-collection__note.av-example-note           ← editor only, while nothing is chosen (list wording when Products from is Hand-picked)
      grid:   ul.av-featured-collection__grid.av-list-reset[role=list] style="--av-featured-collection-cols-m|t|d"
                li.av-featured-collection__cell > anvil-product-card            ×N
      slider: link anvil-slider.css
              anvil-slider.av-featured-collection__slider[--arrows][--scroll-m][--scroll-t][--scroll-d]
                       role=region aria-label="<heading text | collection title | Featured products>"
                       per-view=M per-view-desktop=D [arrows] [dots]
                       style="--av-slider-per-view; --av-slider-per-view-desktop; --av-featured-collection-cols-t; --av-featured-collection-peek; --av-featured-collection-peek-t"
                div.av-featured-collection__track[data-slider-track]
                  div.av-featured-collection__slide[data-slider-slide] > anvil-product-card   ×N
                div.av-slider__dots[data-slider-dots]           ← when dots are on (filled by the script); display none at widths where the row fits
              script[type=module] anvil-slider.js
      div.av-featured-collection__foot.av-align--<head_align>
        anvil-button (View all)                                 ← visually hidden "(collection title)" after the label
```
No `anvil-product.js` for now: the card's quick-add form cannot bind to it yet (see Uncertain / open), so the section does not pay 7.5 KB gzipped for a module that does nothing. The hidden `h2` and the slider `aria-label` use `escape_once`, because the label is HTML text already (an `inline_richtext` heading after `strip_html`, or escaped `t` output) and `escape` would double-encode `&amp;`.
Headings: the section heading is the chassis `h2`; card titles are `h3` (`heading_tag: 'h3'`). When the merchant leaves the heading blank a visually hidden `h2` (collection title, else `anvil.featured_collection.label`) keeps the outline without a skipped level (CONVENTIONS §3). The grid is a real list (`role="list"` because `list-style: none` drops list semantics in Safari); slides get their roles from the slider (CONVENTIONS §6).

## Settings
The 13 chassis settings come first, verbatim. Then 18 own settings (31 non-header settings in total):

| id | type | default | effect |
|---|---|---|---|
| `source` | select `collection` / `products` | `collection` | where products come from; `info` points at the matching picker |
| `collection` | collection | — | the collection; products in its sort order, used when `source` is `collection`. Blank shows example cards |
| `products` | product_list (limit 24) | — | hand-picked products in the picked order, used when `source` is `products` |
| `limit` | range 2–24 step 1 | `8` | the most products shown (`for … limit:`); a shorter source shows fewer |
| `layout` | select `grid` / `slider` | `grid` | grid, or one scroll-snap row (`<anvil-slider>`, works without JS) |
| `cols_desktop` | range 2–6 step 1 | `4` | columns (slider: cards per view) at ≥ 990 px; tablets (750–989 px) show `min(cols_desktop, 3)` |
| `cols_mobile` | select `1` / `2` | `2` | columns (slider: cards per view) below 750 px |
| `image_ratio` | select `theme` / `adapt` / `1:1` / `4:5` / `3:4` / `16:9` | `theme` | card image shape; `theme` passes `settings.card_image_ratio` |
| `hover_image` | checkbox | `true` | the card's second image on hover. Off: the section hides `.av-card__img--hover` (display none, so the lazy image is never downloaded) |
| `show_vendor` | checkbox | `false` | card vendor line |
| `show_rating` | checkbox | `false` | card stars, which the card draws only from the `reviews.rating` metafield. Honesty `info` |
| `quick_add` | checkbox | `false` | card add-to-cart: single-variant products get a native product form, others a "Choose options" link, sold-out products a disabled button. Loads `anvil-product.js` |
| `show_arrows` | checkbox | `true` | slider arrows from 750 px up, in side space the slider reserves only at the widths where the row overflows; hidden on phones (swipe, dots, keyboard). Forced on while `show_dots` is off (below). `visible_if` layout is slider |
| `show_dots` | checkbox | `true` | Liquid renders the empty `.av-slider__dots` row (height reserved by the slider CSS); the script fills it. Off keeps the arrows on, because the track hides its scrollbar and a vertical wheel does not scroll sideways: mouse users need arrows or dots to reach the rest of the row. `visible_if` layout is slider |
| `show_view_all` | checkbox | `true` | the View all button under the products |
| `view_all_label` | text | "View all" | button text (escaped). `visible_if` view_all |
| `view_all_url` | url | — | override; blank links the chosen collection, or `routes.all_products_collection_url` while nothing is chosen. A hand-picked list has no page of its own, so without a link no button shows. `visible_if` view_all |
| `view_all_style` | select `primary` / `secondary` / `link` | `secondary` | `anvil-button` style. `visible_if` view_all |

`collection` and `products` cannot hide each other: shopify.dev lists the setting types that support `visible_if` (basic inputs, sidebar settings and fourteen specialized types) and the resource pickers are not among them. Their `info` text, the `source` info and the editor note (which names the picker the current source reads) cover that instead. The "Slider" header carries the same `visible_if` as its two checkboxes.

Presets: "Featured collection" (grid, 8 products, 4 columns, heading "Featured **products**") and "Product slider" (slider, 12 products, arrows and dots, heading "Shop the **collection**"). `disabled_on` the header group and `custom.overlay`.

## Blocks
None. The cards come from the collection or product list; there is nothing per item for the merchant to type.

## Behaviour
- **Empty states.** Nothing chosen: `max(cols_desktop, 4)` example cards in the grid, `cols_desktop + 2` in the slider (so the example row scrolls and shows arrows and dots at every width), both capped at `limit`; placeholder illustrations `product-1…6`, plus an editor-only note (`anvil.editor.choose_products`, or `anvil.featured_collection.choose_list` when Products from is Hand-picked products). Example cards pass an explicit nil product, because `render` still sees the global `product` object: on a product page an omitted argument would repeat that page's product. A chosen collection or list with no products renders nothing for shoppers (not even the section padding) and, in the editor, the heading plus `anvil.editor.collection_empty`.
- **Images.** `sizes` follows the column counts (desktop / tablet / phones, phones 88 % when the slider peeks) and is capped at `settings.page_width / cols` (or `narrow_width`) for page and narrow widths. The first desktop row is `loading="eager"` when the section is one of the first two template sections (or `section.index` is nil, as in the editor); the first card of the first template section gets `fetchpriority="high"` through the card's `priority`. Both need `section.location` to be `template` (or legacy `content_for_index`): `section.index` starts at 1 inside each location, so without the check the first footer-group section would load eagerly, with a high-priority image, at the bottom of every page. Everything else is lazy.
- **Slider.** Phones show `cols_mobile` cards with the next one peeking (48 px for one column, 32 px for two), tablets `min(cols_desktop, 3)` with a 40 px peek when the row overflows, desktops `cols_desktop` without a peek. The layout values are inline custom properties, so nothing moves when `anvil-slider.js` runs; the section does not write the `peek` attribute (the script would then write `--av-slider-peek` inline over the per-breakpoint values). A row that fits at a width never scrolls there (`av-is-static`), so the section sets `display: none` on the dots row at that width (`--scroll-m` / `--scroll-t` / `--scroll-d` classes from `render_count`) instead of leaving the slider's invisible 24 px row and margin as a gap above View all. No autoplay: a product row is browsed, not watched. Keyboard: Tab through the cards, arrows inside the slider, focusable track when it scrolls; reduced motion turns off smooth scrolling (slider CSS).
- **Quick add.** The card renders a native product form (posts to `/cart/add` and lands on the cart page). The section does not load `anvil-product.js` until the card's `<anvil-product-form>` can bind (see Uncertain / open). Form ids get `uid: section.id`, so a product shown by two sections never repeats an id.
- **Equal heights.** Grid cells and slides stretch, and the card fills its cell, so prices and buttons line up per row.

## Honesty notes
Every card is a real product with its Shopify price; savings badges come from compare-at prices and stars only from the `reviews.rating` metafield (card snippet). The `show_rating` info says nothing shows without a review app. Example cards read "Example product" / "Example vendor" (card locale keys). Preset headings make no claim (no "bestsellers" or "most popular" wording, which would need sales data).

## Locale keys used (added by the integrator)
- `anvil.featured_collection.label` = "Featured products"
- `anvil.featured_collection.view_all_context` = "({{ title }})"
- `anvil.editor.choose_products` = "Choose a collection or products in this section's settings to replace the example cards."
- `anvil.editor.collection_empty` = "This collection or product list has no products to show, so shoppers do not see this section."
- `anvil.featured_collection.choose_list` = "Products from is set to Hand-picked products: pick them under Products to replace the example cards."

## Uncertain / open
- `snippets/anvil-product-card.liquid` wraps its quick-add form in `<anvil-product-form>` without a `form-id` attribute. `ProductForm.connectedCallback` looks for `this.closest('form')` (an ancestor) or `#<form-id>`, and the form is a child, so the card's quick add posts natively (redirect to the cart page) even with `anvil-product.js` loaded. The section therefore stopped loading the module. Once the card writes `form-id="{{ form_id }}"` (card owner), either the card loads `anvil-product.js` itself next to its form (one place for every section that renders cards) or this section restores `{%- if s.quick_add and has_source -%}<script type="module" src="{{ 'anvil-product.js' | asset_url }}"></script>{%- endif -%}` after the products.
- The Liquid preamble (columns, `sizes` caps, card ratio, hidden-heading label, peek and slider classes, grid/slide markup strings), both card loops and the `{% stylesheet %}` are the same as `sections/anvil-related-products.liquid` apart from the slug and the View all rules. A shared `snippets/anvil-product-row.liquid` (params: products, limit, cols_desktop, cols_mobile, layout, show_arrows, show_dots, card options, label, uid) with its CSS in a shared asset would hold one copy; it needs owners outside this section, so it is listed for the integrator rather than done here. The fixes in this pass (`escape_once` on the label, the `section.location` guard, the dots and arrows rules) apply to anvil-related-products too.
- The card has no parameter to turn the hover image off; the section hides it with a scoped rule (`.av-featured-collection--no-hover .av-card .av-card__img--hover`). A `hover_image` parameter on the card would be cleaner.
- Tablet column counts for the slider are applied by overriding the slider's `--n` in this section's CSS (the component knows only phone and desktop counts), the same pattern `anvil-testimonials` uses.

## Integration pass (2026-10-15)
- The product card now writes `form-id` and loads `anvil-product.js` with its quick-add form, so quick add goes through the drawer here and on collection and search pages; the "no anvil-product.js here yet" comment was removed.
- Placed on `templates/index.json` and `templates/404.json` (example cards until a collection is chosen).

## Fix pass (2026-10-15)
- Setting ids follow the theme-wide vocabulary (CONVENTIONS §5; DECISIONS 82–100); the tables above use the new ids: `view_all` → `show_view_all`. Saved templates were migrated.
- Uses the shared pieces: product cards from `snippets/anvil-product-row` (DECISIONS 93); eager or lazy media from `snippets/anvil-above-fold` (DECISIONS 85); the editor-only empty note from `snippets/anvil-editor-empty` (DECISIONS 87); a hidden fallback heading through `anvil-section-head` (DECISIONS 84).
- Availability: `disabled_on` groups ["header","custom.overlay"] (CONVENTIONS §4, DECISIONS 100).
