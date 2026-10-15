# anvil-collage — spec card

**Build exactly this; ids and words are yours; follow CONVENTIONS.**

_Hand-written card for a standard storefront section (SPEC §4.1 lists these by name; DESIGN-sections §3 "Standard sections"). Edit by hand._

- **Purpose:** an asymmetric mosaic of 2–5 tiles mixing images, products, collections and videos.
- **Merchant sets:** layout (big tile left/right), tile gap, tile radius from the media token.
- **Blocks (local, ≤ 5):** `image` (image, link, caption), `product` (product card), `collection` (collection card), `video` (cover + Shopify video or URL in `<anvil-dialog>`).
- **JS:** none beyond `<anvil-dialog>`. **~Lines:** 260.
