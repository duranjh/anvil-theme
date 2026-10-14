# Forbidden identifiers and sources

This list feeds `scripts/cleanroom-lint.sh`. Any case-insensitive hit anywhere in the repo (except this file) fails CI.

## Vendor and product tokens
shrine, shrinesolutions, shrine.io, sectionstore, section.store, pagefly, "elite 8", `\bss-[a-z]`

## Third-party schema ids (seeded by the spec author; extend only here)
animations_type, fav_collection

## Reference-theme identifiers (Dawn / Horizon / Skeleton vocabulary that must not appear)
`component-[a-z-]+\.css`, `global\.js`, `pubsub\.js`, PUB_SUB_EVENTS, trapFocus, removeTrapFocus, onKeyUpEscape, getFocusableElements, HTMLUpdateUtility, `page-width`, `spacing-sections`, `motion-reduce`, `scroll-trigger`, `animate--slide-in`, `color-background-1`, `--color-foreground`, `utilities\.css`, `critical\.js`, `theme-editor\.js`, `declarative-shadow`

## Structural rules
- Every file in `sections/`, `snippets/`, `blocks/`, `assets/` is prefixed `anvil-`, `_anvil-` or `main-`, except Shopify-fixed names: `header-group.json`, `footer-group.json`, `overlay-group.json`, `apps.liquid`, `_blocks.liquid`.
- No file over 256 KB; `config/settings_schema.json` under 512 KB.
- No raster images (`.png .jpg .jpeg .webp .gif`) in `assets/`; no SVG containing a brand token (trustpilot, facebook, instagram, tiktok, google, amazon, visa, mastercard, paypal, apple, klarna, afterpay, "shop pay", youtube, meta, twitter, yelp, judge, loox) or an embedded base64 image.

## Forbidden sources while coding
Any theme repository or theme zip, including Shopify/dawn, Shopify/horizon, Shopify/skeleton-theme and any commercial theme or section library. Allowed: shopify.dev, help.shopify.com, MDN, W3C/WAI.
