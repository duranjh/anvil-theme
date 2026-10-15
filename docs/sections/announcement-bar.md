# Announcement bar — `sections/anvil-announcement-bar.liquid`

_Section card, 2026-10-14 (fix pass). Group-only (`enabled_on.groups: ["header"]`), reduced chassis. Spec: SPEC §2.1._

## Settings
Reduced chassis (`color_scheme`, `pad_top`, `pad_bottom`, `pad_mobile`, `show_on`), then `pages` (all / home / product / collection / home and product / templates I list) with `pages_custom` (comma list of template names, `visible_if` custom), `text_size`, `autoplay` (seconds, 0 = off), `show_arrows`.

## Blocks (max 6)
- `text`: rich text + link. Info: only announce offers and deadlines that are real.
- `code`: text before the code, the code, `mode` (copy / apply), labels (blank labels fall back to `anvil.announcement.copy` / `anvil.announcement.apply`). Copy uses the Clipboard API; apply is a link to Shopify's `/discount/CODE?redirect=…` URL that `assets/anvil-code.js` turns into `Anvil.cart.applyDiscount` (keeping codes already on the cart; a code Shopify does not accept reports "not valid").
- `socials`: label + text pills from Theme settings.

## Behaviour
Two or more blocks become an `<anvil-slider>` (inline per-view custom properties, arrows optional, autoplay with a pause button, paused at first under reduced motion). Text wraps (no truncation). Outside the editor the bar renders nothing on templates the `pages` setting excludes; in the editor it always shows, with a note.

## Uncertain
The `/discount/CODE?redirect=` link is Shopify's documented shareable discount URL; confirm the redirect keeps the market/locale prefix on a store with several markets.

## Fix pass (2026-10-15)
- Uses the shared pieces: slider attributes, peek, arrows and dots per width from `snippets/anvil-slider-attrs` (DECISIONS 89).
- Availability: `enabled_on` "groups": ["header"] (CONVENTIONS §4).
