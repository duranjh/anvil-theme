# anvil-video — spec card

**Build exactly this; ids and words are yours; follow CONVENTIONS.**

_Hand-written card for a standard storefront section (SPEC §4.1 lists these by name; DESIGN-sections §3 "Standard sections"). Edit by hand._

- **Purpose:** one video: Shopify-hosted or YouTube/Vimeo.
- **Merchant sets:** source (Shopify video / URL), cover image, ratio (16:9 / 9:16 / 1:1 / 4:5), autoplay muted loop (Shopify video only; plays only while in view and when motion is allowed via core's `data-anvil-autoplay`), controls, full width, caption.
- **Shopper sees:** a facade (cover + play button) for external videos; the iframe loads on click (`youtube-nocookie`).
- **A11y:** play button labelled with the video title; captions are the merchant's responsibility (info text).
- **JS:** none beyond anvil-media's facade and core autoplay. **~Lines:** 160.
