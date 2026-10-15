# Featured product — `sections/anvil-featured-product.liquid` (and the product page, `sections/main-product.liquid`)

_Section card, 2026-10-15 (wave-1 integration). Featured product is the addable twin of the template-bound product section; both share the layout, the 38 product blocks and the product form contract, so this card covers both. Spec: SPEC §3; design: DESIGN-money-path §A–§F; contracts: WAVE1-CONTRACTS §1–§5._

## Purpose
Sell one product anywhere: a gallery beside a buy column the merchant builds from blocks. On the product template the section is `main-product` (no product setting, no section head, the title block prints the page's only `<h1>`). Featured product adds the full chassis, a section heading, a `product` setting, and prints the product title as an `<h2>`.

## Settings
- Chassis (Featured product only): the 13 chassis settings, then the `product` picker.
- Layout (`docs/product-blocks/_section-main-product.json`): `color_scheme`, `width`, `pad_top`, `pad_bottom`, `pad_mobile` (main-product's layout block), `layout_gallery_position` (left/right), `layout_gallery_width` (40–60 %), `layout_sticky` (info/gallery/none), `layout_block_gap`, `layout_mobile_bleed`, `layout_trust_image` + `layout_trust_width` (an image under the buy column; the info text says to upload only badges the store is entitled to show).
- Gallery (`_settings-gallery.json`, 12 settings): desktop thumbnails (left/bottom/hidden/stacked), phone thumbnails and pager (dots under / dots over / numeric / hidden), peek, image shape (adapt/1:1/4:5/3:4, never cropped), zoom (none/hover/lightbox; a zoom button always opens the lightbox for touch and keyboard), selected variant's image first, hide other variants' media, video autoplay/loop/muted/controls.
- The schema is generated: edit `docs/product-blocks/*.json` and run `npm run blocks`; CI fails on drift.

## Blocks (local, in editor order)
Title, Price, Description, SKU, Inventory, Share, Custom Liquid, Collapsible tab, Popup, Complementary products, Divider, Image, Video, Link button, Scroll-to buttons · Variant picker (+ up to 6 Offer cards), Quantity (+ up to 5 Quantity tiers), Buy buttons, Sticky add-to-cart (main-product only) · Text with icon, Icons with text, Emoji benefits, Urgency text, Payment badges, Rating, Review-platform badge, Reviews, Review avatars · Estimated shipping, Shipping checkpoints, Custom field, Size chart, Discount code, Bundle offer, Upsells, Gifts on quantity (main-product only) · App blocks.

## Behaviour
- **Variant state.** The section picks the opening variant once: `?variant=` first, then the offer card the picker preselects (cards mode, when that variant is available), then the first available variant. The picker updates every `data-anvil-bind` target (price, compare, savings, savings percent, SKU, availability, button label, sticky thumbnail), sets `?variant=` with `history.replaceState` (UTM tags and `fbclid` kept) and then swaps the section's `data-anvil-server-truth` nodes from `?section_id=…&variant=…`. It emits `anvil:variant:changed {sectionId, variant, product}`; the gallery, shipping blocks and bundle listen.
- **One product form.** The form opens at the first Buy buttons block and holds only the hidden `id` input, the buttons and (when switched on) Shopify's express buttons. Quantity, custom fields, tier radios and the sticky bar's button post with `form="anvil-pf-<section id>"`, so block order is free. Add to cart calls `cartAdd` with the drawer and bubble sections; the drawer opens when "open on add" is on. Without JavaScript the form posts to `/cart/add`, and a `<noscript>` variant select in the Buy buttons block replaces the picker.
- **Fallbacks.** With no blocks, the section still renders a working buy box (title, price, variant select, add button). Featured product without a product shows an example layout with a disabled button and no price.

## Honesty notes
Savings only from compare-at (rounded down, DECISIONS 43); "Most popular"-style badges only behind the "backed by sales data" box; tier discounts are shown "applied at checkout" and the editor flags a cart line that did not receive them; stock lines only from tracked inventory (DECISIONS 44); stars only from the review metafields or with a source link; shipping dates only from the windows the merchant enters (0 shows nothing); gifts are added by the theme but priced by the merchant's Buy X Get Y discount; express buttons default off because they skip the drawer.

## Uncertain (needs the dev store)
`/cart/add` reading the last of two `id` values (the no-JS select), `variant | json` fields, Section Rendering with `section_id` on product URLs, app blocks rendered from the section loop, emoji detection in Emoji benefits, payment icon SVG ids repeated on one page. See STATUS §4.

## Fix pass (2026-10-15)
- Uses the shared pieces: the editor-only empty note from `snippets/anvil-editor-empty` (DECISIONS 87).
- Availability: `disabled_on` groups ["*"] (CONVENTIONS §4, DECISIONS 100).

## Honest-defaults pass (2026-10-15)
- The schema is generated from `docs/product-blocks/` (shared with the product page). Review platform badge: `badge_rating` defaults to 0, "not set", and `snippets/anvil-pb-review-platform-badge` draws the number and stars only with a source link **and** a rating above 0; the words and logo behave as before. Link button: `label` defaults to "Browse all products" (its default link is `/collections/all`) instead of "Learn more", and its `info` asks for a label that says where the link goes (DECISIONS 124, 125).
