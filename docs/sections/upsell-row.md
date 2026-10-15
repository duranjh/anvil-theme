# Upsell row — `sections/anvil-upsell-row.liquid`

_Section card, 2026-10-15 (wave-1 integration). Helper section with no presets: merchants never add it. Spec: SPEC §2.4 and §3.2 (upsells, complementary); design: DESIGN-money-path §E._

## Purpose
The markup Shopify's product recommendations endpoint returns for Anvil: `routes.product_recommendations_url?section_id=anvil-upsell-row&product_id=…&limit=…&intent=related|complementary`.

## Output
`<ul data-anvil-upsell-row data-anvil-intent>` with one `<li data-anvil-product-id>` per recommendation, each an `anvil-product-card-mini` (image, title, price, one action). Nothing when Shopify returns no recommendations. No heading: the caller owns it. Callers read only the list items (`[data-anvil-upsell-row] > [data-anvil-product-id]`; the card inside carries the same attribute). The section is never in a page's render tree, so its card and list styles live in `assets/anvil-pb-commerce.css`, which every caller loads (DECISIONS 57).

## Callers
- Product block Upsells (`snippets/anvil-pb-upsells.liquid`, `<anvil-upsells>` in `assets/anvil-commerce.js`): recommendations mode; with "hide products already in the cart" it asks for the limit plus the number of cart lines (≤ 10), drops cart products before applying the limit and hides them after later cart updates; applies the price setting.
- Product block Complementary products (`snippets/anvil-pb-complementary.liquid`, `<anvil-complementary>` in `assets/anvil-pb-content.js`): `intent=complementary`, loaded when near the viewport; stays hidden on an empty response (complementary products need the Search & Discovery app); loads `anvil-commerce.js` so the cards' one-tap Add works.
- Cart drawer Upsells block: fetched once the drawer opens, cached per URL, products already in the cart dropped, the list items moved into a `<ul role="list">`.

## Honesty notes
Every card is a real product with its real price; nothing is generated. Single-variant products add in one tap through `cartAdd`; others link to the product.
