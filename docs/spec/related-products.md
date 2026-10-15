# anvil-related-products — spec card

**Build exactly this; ids and words are yours; follow CONVENTIONS.**

_Hand-written card for a standard storefront section (SPEC §4.1 lists these by name; DESIGN-sections §3 "Standard sections"). Edit by hand._

- **Purpose:** "You may also like" on product pages via Shopify's product recommendations.
- **Merchant sets:** heading (chassis), product count (2–10), columns D/M, layout grid/slider, intent (related; complementary falls back to related when Search & Discovery has none), card options as in featured collection.
- **Shopper sees:** server-rendered through the recommendations endpoint: the section renders an empty shell with `data-url="{{ routes.product_recommendations_url }}?section_id={{ section.id }}&product_id={{ product.id }}&limit=N&intent=related"`; a small module fetches and swaps it; the endpoint renders the cards via the `recommendations` object. Nothing renders when there are no recommendations.
- **enabled_on:** product templates.
- **JS:** ≤ 1 KB fetch-and-swap. **~Lines:** 140.
