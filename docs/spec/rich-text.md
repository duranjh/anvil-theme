# anvil-rich-text — spec card

**Build exactly this; ids and words are yours; follow CONVENTIONS.**

_Hand-written card for a standard storefront section (SPEC §4.1 lists these by name; DESIGN-sections §3 "Standard sections"). Edit by hand._

- **Purpose:** a centred text block built from theme blocks.
- **Merchant sets:** content width (narrow/page), alignment.
- **Blocks:** `@theme` and `@app` (theme blocks: anvil-heading, anvil-text, anvil-button, anvil-stars, anvil-review-stars, anvil-countdown, anvil-spacer, anvil-divider, anvil-image, anvil-icon-text, anvil-group, anvil-product-atc) rendered with `{% content_for 'blocks' %}`; preset with a heading, a text and a button.
- **Note:** the section cannot also define local blocks (Shopify rule).
- **JS:** none. **~Lines:** 140.
