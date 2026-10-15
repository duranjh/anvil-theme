# Anvil — Install and set up

_2026-10-15. For a store owner putting Anvil on a store, and for a developer working on it. What every section is: `docs/SECTIONS.md` and README "What's inside"._

Anvil is not on any store yet: the live-store checks in `docs/STATUS.md` (S.6, W1.4) run on an unpublished copy first. Never publish a build that has not passed them.

## 1. Put the theme on the store (unpublished)

**From the release zip (store owner).**
1. Build it with `npm run package` (theme check, `shopify theme package`, zip check); the zip lands in `dist/Anvil-<version>.zip`. Only the theme folders are inside.
2. Shopify admin → Online Store → Themes → Add theme → Upload zip file. It arrives unpublished.
3. Rename it so nobody publishes it by accident (Anvil's own copy on the Voreau store is "ANVIL dev - DO NOT PUBLISH").

**With Shopify CLI (developer).**
1. First push, once: `shopify theme push --unpublished --theme "ANVIL dev - DO NOT PUBLISH" --store ftsegk-n1.myshopify.com`.
2. Copy the new theme's id (`shopify theme list --store …`) into `shopify.theme.toml` (`theme = "…"`) and into `DEV_THEME_ID` for `scripts/gate.sh`.
3. After that: `shopify theme push -e voreau-dev` or `shopify theme dev -e voreau-dev`.
4. Never `--live`, never `--allow-live`, never the id of the published theme. `.shopifyignore` keeps `docs/`, `scripts/`, `tests/` and the other repo files off the store.

## 2. First pass in the theme editor

1. **Theme settings**: Colors, Typography, Buttons, **Cards** (image shape, style, border, shadow; card grids set to "Same as theme cards" follow these), **Cart** (cart type Drawer or Page, note, discount field, vendors, savings line), **Drawers & popups**, **Quantity picker**, **Animations**.
2. **Header and footer groups**: menus, logo, announcement bar messages. Header → "Transparent over the first section" works on the homepage or on the templates you list.
3. **Templates that ship with content**: `index`, `product.landing`, `product`, `page.contact`, `page.faq`, `page.track-order`, `404`. Text that starts with "Example:" and example images are placeholders: replace or delete every one before publishing. Example cards (collections, products, logos) show until real ones are picked.
4. **Assign the alternate templates**: a product that should use the long landing page gets the `landing` template (product admin page → Theme template); the contact, FAQ and track-order pages are pages that use `page.contact`, `page.faq` and `page.track-order`.
5. **Overlay group**: Scroll to top is on; the Promo popup and Music player ship switched off. Turn them on only when they have real content.

## 3. Shopify-side setup the theme relies on

Anvil shows offers; Shopify grants them. Set these up in the admin so what the storefront says is true:

| Feature | What to set up in Shopify | Where the theme reads it |
|---|---|---|
| Gift on quantity (product block), Gift at a cart total (drawer block) | An automatic **Buy X get Y** discount that makes the gift item free. The theme adds and removes the gift line; Shopify prices it. "FREE" shows only when Shopify priced the line at zero. | `assets/anvil-gifts.js`; the gift at a cart total works in the cart drawer only (cart type Drawer). |
| Quantity tiers, Bundle deals, Bundle offer | An automatic **Amount off products** discount with the minimum quantity the tier or bundle names; copy the same percentage into the block. | Tier and bundle settings; "Discount applied at checkout" is the theme's only claim. |
| Free shipping bar | A free shipping rate with a minimum order price (Settings → Shipping and delivery). Enter the same amount in the bar, and one line per market for other currencies. | Cart drawer → Free shipping bar block. |
| Complementary products (Related products, upsells) | The Search & Discovery app, with complementary products picked per product. Without it, "Complementary" shows nothing. | Related products section, Upsells blocks. |
| Star ratings and review counts | A review app that writes the standard `reviews.rating` and `reviews.rating_count` product metafields. Typed stars show only with a link to the review. | Product cards, rating blocks, testimonials, review wall. |
| Policies checkbox and policy links | Settings → Policies. The drawer's Policies checkbox block and the cart page's "Show policies checkbox" list the policies written there. | Cart drawer block; Cart summary section (cart type Page). |
| Countdown | A real end date and time zone for a real offer; no evergreen timers exist. | Countdown blocks. |

Cart type **Page** uses the cart page (Cart items + Cart summary): the drawer's blocks (free shipping bar, checkpoints, countdown, gift at a cart total, upsells) do not appear there; the Cart summary has its own policies checkbox.

## 4. Before publishing

- Every "Example:" text and example image replaced or removed.
- `docs/STATUS.md` live-store list run on the unpublished copy: editor checks, both viewport sizes, reduced motion, console errors, accessibility checks, Lighthouse on home, product and landing.
- Discounts from section 3 tested with a real cart (gift line priced at zero, tier discount applied at checkout).
- Only then publish from Online Store → Themes.
