# Cart drawer — `sections/anvil-cart-drawer.liquid`

_Section card, 2026-10-14 (fix pass), updated 2026-10-15 (wave 1: drawer blocks). Static section rendered by `layout/theme.liquid` when Theme settings > Cart > cart type is "drawer". JS: `assets/anvil-cart-drawer.js` (`<anvil-cart-drawer>`) and `assets/anvil-cart.js` (`<anvil-cart-form>`). Spec: SPEC §2.4; design: DESIGN-money-path §G._

## Settings
`drawer_title` (default "Your cart"), `color_scheme`, `drawer_preview_open` (editor only). Width, open-after-add, note, discount field, vendor and savings line are theme settings (DECISIONS 17).

## Markup and behaviour
- `<anvil-cart-drawer>` → `<dialog>` → `.av-cart-drawer__frame[data-anvil-section="anvil-cart-drawer"][data-anvil-cart-render]` (the re-render root; the dialog stays open) → head + `<anvil-cart-form>` → plain `<form action="/cart" method="post">` (updates[<line key>], remove links, checkout) → `[data-anvil-live]` outside the frame.
- With JS: steppers and typed quantities update the line through `cart/change.js` with the drawer and bubble sections; a refused change rolls the input back and shows Shopify's message in the form's alert line; remove links work in place; the note saves on change; the discount field applies/removes codes and reports an unusable code. Without JS the Update button and the plain form do the same work.
- Opens from the header cart link and after an add (`anvil:cart:updated` with source "add", when open-on-add is on); closes with Esc, the close button and a backdrop click; focus returns to the opener; scroll lock released even if the element is removed while open.
- Per line: names include the product title ("Quantity for …", "Remove: …"), struck prices carry "Regular price" / "Sale price" text, "Free" only when Shopify priced the line at zero. Savings: "You save …" comes from Shopify discount allocations and compare-at savings get their own line (wave 1 split the old combined figure); never typed.

## Blocks (wave 1)
Sixteen blocks, each with "Show in the footer" (`place_in_footer`): Items, Subtotals, Checkout button, Free-shipping bar, Checkpoints bar, Countdown, Upsells, Free gift at threshold, Text with icon, Image, Icons with text, Payment badges, Discount field, Cart note, Policies checkbox, Custom Liquid. Items, Subtotals, Checkout, Discount field, Cart note and Policies checkbox are limited to one each. No app blocks (static sections cannot hold them).
- **No blocks configured:** items, then the discount field and note when their theme settings are on, subtotals, checkout, payment icons. **Blocks configured:** the blocks decide; Items and Checkout are added automatically if left out, and the note and discount field theme settings no longer apply ("block wins").
- **Form:** the `<form>` is empty and every input (`updates[<line key>]`, note, terms checkbox, checkout, the fallback Update button) carries `form="anvil-cart-drawer-form"`, so upsell cards and custom Liquid never nest forms and the drawer still posts without JavaScript.
- **Lines and totals** come from `snippets/anvil-cart-line.liquid` and `snippets/anvil-cart-totals.liquid`, shared with the cart page, styled from `assets/anvil-cart-drawer.css` (not snippet stylesheets: a drawer opened empty renders no line until the first add, DECISIONS 57): underscore properties hidden, gift lines labelled and without a stepper (clamped to 1), "Free" only when `final_line_price == 0`, "You save" from Shopify discounts and compare-at savings on their own line.
- **Free-shipping bar:** threshold in the store currency plus `market-handle:amount` lines; hidden in a currency without a configured line; gift lines optionally left out. The info text says the bar grants nothing. **Checkpoints bar:** up to three amounts, visual only.
- **Countdown:** a real date only (a full `YYYY-MM-DD`), no evergreen mode. **Gift at threshold:** writes a spend rule (`spend:<cents>`) for `assets/anvil-gifts.js` outside the swap root; the engine also loads whenever the cart holds a gift line (DECISIONS 48). Pair with a Buy X Get Y discount.
- **Policies checkbox:** checkout gets `aria-disabled` and a hint until ticked; the answer posts as `attributes[anvil_terms_accepted]`; without JavaScript the `required` attribute blocks checkout.
- **Upsells:** manual list or recommendations through `sections/anvil-upsell-row.liquid` (list items into a `<ul role="list">`); loads `assets/anvil-commerce.js` for one-tap adds and `assets/anvil-pb-commerce.css` for the cards. An add announces "Added to cart" in the drawer's live region and keeps focus on an Add button when one is left.

## Not yet verified
Static-section blocks in the live editor (DECISIONS 4, 28); the free-shipping comparison against a real shipping-rate condition; gift add/remove against a real Buy X Get Y discount (STATUS §4).

## Fix pass (2026-10-15)
- Gift at threshold: no rule and no progress line while the gift variant is sold out (editor note instead); the rule carries `data-anvil-cart-count`.
- `aria-expanded` is written only on the header cart link (an opener with `aria-haspopup`), never on an Add to cart button the drawer opened after; the checkout button is described by the terms hint only while locked.
- The note and terms saves are untracked cart updates (they cannot hide a line change's re-render); quantity changes still waiting when another line re-renders the drawer are sent anyway.
- Honesty notes on the checkout line, text with icon, icons with text and custom Liquid; icons-with-text item text is inline rich text like the product block; default upsell heading "Add something extra"; placeholders written `[remaining]`.
