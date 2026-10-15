# Related products — `sections/anvil-related-products.liquid`

_Section card, 2026-10-15. Wave 2. Built from `docs/agent-prompts/related-products.md` (CONVENTIONS, spec card, chassis API, exemplars)._

## Purpose
A row of product cards under the product, filled from Shopify's product recommendations for the product on the page. Spec: `docs/spec/related-products.md` (heading, product count 2–10, columns desktop/phone, grid or slider, intent related or complementary with a related fallback, card options as in Featured collection; an empty shell that a small module fills from the recommendations endpoint; nothing renders when there are no recommendations). SPEC §5 puts it last on both product templates. `enabled_on.templates: ["product"]`, so it covers every product template (`product.json`, `product.landing.json`, …).

## Settings
The 13 chassis settings come first, verbatim from CONVENTIONS §4. Then 12 section settings under "Related products", "Product cards" and "Slider" (25 in total; limit 40). A `paragraph` under "Related products" tells the merchant where the products come from, that the section stays hidden when Shopify has none, and that it needs JavaScript.

| id | type | default | what it does |
|---|---|---|---|
| `intent` | select `related` / `complementary` | `related` | which recommendations Shopify returns. Complementary reads the products picked per product in the Search & Discovery app; when that request has no products, the related request runs instead (info says so) |
| `limit` | range 2–10 | 4 | the `limit` parameter (Shopify accepts 1–10); Shopify may return fewer |
| `layout` | select `grid` / `slider` | `grid` | grid = `<ul role="list">`; slider = `<anvil-slider>` (scroll-snap row, arrows, dots) |
| `cols_desktop` | range 2–6 | 4 | cards per row at ≥ 990 px (tablets: at most 3) |
| `cols_mobile` | select `1` / `2` | `2` | cards per row below 750 px (the slider's `per-view`) |
| `image_ratio` | select `theme` / `adapt` / `1:1` / `4:5` / `3:4` / `16:9` | `theme` | card image shape; `theme` follows Theme settings > Product cards |
| `hover_image` | checkbox | true | second image on hover (devices that can hover only; hidden, it is never downloaded) |
| `show_vendor` | checkbox | false | vendor line on each card |
| `show_rating` | checkbox | false | stars from the `reviews.rating` metafield only (info says nothing shows otherwise) |
| `quick_add` | checkbox | false | Add to cart for single-variant products, "Choose options" link otherwise (the card's own form) |
| `show_arrows` | checkbox | true | slider arrows on tablets and desktops when the row overflows |
| `show_dots` | checkbox | false | slider dots (Liquid renders the empty dots row so nothing shifts) |

`schema.name` "Related products" (16 characters). Preset "Related products": heading "More to **explore**", related, 4 products, grid, 4 columns. The heading avoids reference-theme wording (DECISIONS 63). No blocks.

## Blocks
None.

## Markup and behaviour
- **Two renders, one file.** `recommendations.performed?` tells them apart.
  - *Page render (storefront):* the chassis root (`anvil-section-attrs`) with `hidden`, a visually hidden `<h2>` when the heading is blank (printed before the section head, so a lone subheading follows it), the section head, and an empty `<anvil-related-products class="av-related-products" data-anvil-urls="…">`. The URL is `routes.product_recommendations_url?section_id=<section.id>&product_id=<product.id>&limit=<limit>&intent=related`; with intent complementary the attribute holds the complementary URL, a space, then the related URL. The page render also loads `anvil-card.css`, `anvil-slider.css` + `anvil-slider.js` (slider layout), `anvil-related-products.js`, and `anvil-product.js` when quick add is on (already loaded by `main-product` on product pages; module URLs dedupe). Scripts inside a fetched response would never run, so everything the cards need is loaded here. `data-anvil-urls`, `anvil-related-products.js` and `anvil-product.js` are printed only on the storefront page render, never in the editor (see Editor); the card and slider assets load in both.
  - *Endpoint render:* Shopify renders this same section instance with the `recommendations` object. With products, the same skeleton prints the cards (`anvil-product-card`, `heading_tag: 'h3'`, `uid: section.id` for unique form ids, `loading: 'lazy'`) inside `<anvil-related-products>`, as a grid or an `<anvil-slider>`. With no products it prints nothing at all.
- **Fetch and swap** (`assets/anvil-related-products.js`, 2,130 B raw, 993 B gzipped; card budget 1 KB). Once the section comes within 600 px of the viewport (an IntersectionObserver on the hidden root's `.shopify-section` wrapper, or on the root when it is visible), the element requests each URL in turn. The first response whose `<anvil-related-products>` contains a product link wins: its children move into the page's element and the root's `hidden` is removed. A non-OK response, a response without a product link, or a network error leaves the section hidden (errors are logged with `console.warn`). Only the element's children are copied, so the page keeps its own root: the anchor id, scheme, padding and the reveal class computed from `section.index` stay right (the endpoint render has no index, so reveal would be off there). `disconnectedCallback` disconnects the observer and aborts a running request (and a pending breakpoint listener). `<anvil-slider>` in the response upgrades when it is inserted.
- **Show on.** With "Phones only" or "Desktop only" the root carries `av-show--mobile` / `av-show--desktop` and stays `display: none` on the other side of 750 px. The module reads that class and observes only while `(max-width: 749px)` / `(min-width: 750px)` matches; otherwise it waits for one `change` of that media query (a rotation or resize across 750 px) before observing. A section that cannot show on the device never requests anything.
- **Quick add.** The cards' single-variant button sits in a native `{% form 'product' %}`, so it always works without JavaScript. Today it is not enhanced: the card wraps the form in `<anvil-product-form>` without `form-id`, and `ProductForm` looks for `this.closest('form')` or `#<form-id>`, neither of which finds a child form. Until the card snippet passes `form-id` (open question 6), quick add posts natively to `/cart/add` and the shopper lands on `/cart` instead of the drawer. The section already loads `anvil-product.js`, so the fix in the snippet is enough.
- **Fallback for complementary.** Only when the complementary request returns no product does the related request run. A partial complementary result is shown as it is, not topped up.
- **Heading levels.** Card titles are `<h3>` under the section `<h2>` (or the visually hidden one, `anvil.related_products.label`, which also names the slider region). The label comes from `heading | strip_html | strip` and prints with `escape_once`: an inline-richtext heading stores `&` as `&amp;`, which `escape` would turn into `&amp;amp;` in the slider's `aria-label`.
- **Columns and slider.** Inline `--av-related-products-cols-m|t|d` drive the grid at 0 / 750 / 990 px. In the slider the section sets the component's `--n` to the tablet count at 750 px and to `per-view-desktop` at 990 px, peeks the next card on phones and tablets when the row overflows, and pads the row for the arrows only when it scrolls (`--scroll-t`, `--scroll-d`), the same pattern as Featured collection. When Shopify returns fewer products than columns, the grid keeps the merchant's column count.
- **Image sizes** come from the column counts, capped by `settings.page_width` / `narrow_width` for page and narrow widths. All card images are lazy: the cards arrive after load, below the product.
- **Editor.** The page render keeps the root visible and fills the element with example cards (at least a desktop row, never more than the product count; explicit nil product so the page's product is not repeated) under an `av-example-note`: `anvil.editor.related_products_example`. The editor never fetches: the page render prints no `data-anvil-urls` when `request.design_mode` is true. Shopify's docs say the Section Rendering API cannot take setting values and an existing section renders with its stored settings, so a plain GET from the editor would bring cards in the saved layout, columns and card options and replace examples that follow the unsaved ones (a mixed, stale preview until Save). The examples therefore always reflect the current settings; the merchant sees real recommendations in the store preview outside the editor or on the live store, and the note says so.
- **No JavaScript.** The page render has no products (the `recommendations` object is empty outside the endpoint), so the section stays hidden. The editor paragraph says so.
- **CSS.** `{% stylesheet %}` 1,888 B raw, 587 B gzipped (limit 6,144 raw); every selector starts with `.av-related-products`. Shopify serves section CSS for files rendered on the page (DECISIONS 57); the shell is rendered on the page, so the cards' layout rules are present before they arrive. Card, price, badge and stars styles come from `anvil-card.css` and `anvil-base.css`; slider surfaces from `anvil-slider.css`.

## Honesty notes
- Every card is a real product with its real price, compare-at price, badges and availability from Shopify; nothing is typed.
- Stars appear only from the `reviews.rating` metafield (the card snippet's rule); the `show_rating` info says so.
- The section never fills itself with stand-in products for shoppers: with no recommendations it stays hidden. Example cards appear only in the editor and are labelled by the note; their quick-add button is disabled.
- The `intent` info states where complementary products come from and when related products show instead.

## Contract assumptions
- The product recommendations endpoint renders a JSON-template section instance by its `section.id` with that instance's saved settings (the spec card's URL; shopify.dev Section Rendering API: "the existing section settings apply"). If it ever answered 404 for an instance id, the section would stay hidden. The editor does not depend on it.
- `anvil-product-card` accepts `product: nil` for example cards and `uid` for unique form ids. Its quick-add form is a native product form; it is NOT enhanced today (see Quick add and open question 6).
- `anvil-slider` keeps `--n` as its per-view variable (Featured collection, Testimonials and Product videos rely on it too) and upgrades when inserted after load.
- `html [hidden] { display: none }` in `anvil-base.css` hides the shell root; `.av-design-mode .av-show--*` can override it, which is why the root is never hidden in the editor.

## Locale keys needed (integrator)
- `anvil.related_products.label` = "Recommended products" (visually hidden `<h2>` when the heading is blank; slider region name)
- `anvil.editor.related_products_example` = "Example cards. The editor always shows these. Shoppers see Shopify's recommendations for this product here, and nothing at all when there are none."

Existing keys used through the card: `anvil.card.*`, `anvil.stars.count`, `anvil.price.*`.

## Open questions
1. The spec card names the attribute `data-url`; CONVENTIONS §1 requires `data-anvil-*` hooks, so it is `data-anvil-urls` (space-separated, so the complementary request can carry its related fallback). CONVENTIONS wins; flagged rather than resolved silently.
2. Templates are read-only during the wave: the integrator adds `anvil-related-products` as the last section of `templates/product.json` and `templates/product.landing.json` (SPEC §5).
3. Resolved by design: the editor no longer fetches (see Editor), so the endpoint's handling of unsaved settings and of a section added but not yet saved no longer matters there. Worth a look on the dev theme only to confirm the store preview (outside the editor) shows real cards.
4. `anvil-card.css` (and `anvil-slider.css` for the slider) load with every product page render, even when Shopify later returns no products, so arriving cards are styled at once. A `preload` plus a link inside the response would save the bytes on pages without recommendations, at the cost of a possible unstyled frame. Kept the simple way, as Featured collection does.
5. Cards are fetched when the section comes within 600 px of the viewport. A shopper who jumps straight to the footer may see the footer move when the cards land; reserving space is impossible because the section must render nothing when there are no recommendations.
6. **Card snippet (integrator, shared file).** `snippets/anvil-product-card.liquid` line 155 wraps the quick-add form in a bare `<anvil-product-form>`. `ProductForm.connectedCallback` (`assets/anvil-product.js` line 297) runs `this.closest('form') || document.getElementById(this.getAttribute('form-id'))`, which finds neither a child form nor an id, so no submit listener is attached and quick add posts natively to `/cart/add`. Fix one of: change the card to `<anvil-product-form form-id="{{ form_id }}">` (the working callers do this: `anvil-shoppable-image`, `anvil-product-videos`, `_anvil-pricing-plan`), or make `ProductForm` fall back to `this.querySelector('form')`. The same bare pattern is in `sections/anvil-image-text.liquid` and `blocks/anvil-product-atc.liquid`. No change is needed in this section once that lands.

## Integration pass (2026-10-15)
- Placed last on `templates/product.json` and `templates/product.landing.json`. Card quick add now binds to `anvil-product.js`.

## Fix pass (2026-10-15)
- Uses the shared pieces: product cards from `snippets/anvil-product-row` (DECISIONS 93); a hidden fallback heading through `anvil-section-head` (DECISIONS 84).
- Availability: `enabled_on` "templates": ["product"] (CONVENTIONS §4).
