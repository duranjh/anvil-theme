# Cart drawer — `sections/anvil-cart-drawer.liquid`

_Section card, 2026-10-14 (fix pass). Static section rendered by `layout/theme.liquid` when Theme settings > Cart > cart type is "drawer". JS: `assets/anvil-cart-drawer.js` (`<anvil-cart-drawer>`) and `assets/anvil-cart.js` (`<anvil-cart-form>`). Spec: SPEC §2.4; design: DESIGN-money-path §G._

## Settings
`drawer_title` (default "Your cart"), `color_scheme`, `drawer_preview_open` (editor only). Width, open-after-add, note, discount field, vendor and savings line are theme settings (DECISIONS 17).

## Markup and behaviour
- `<anvil-cart-drawer>` → `<dialog>` → `.av-cart-drawer__frame[data-anvil-section="anvil-cart-drawer"][data-anvil-cart-render]` (the re-render root; the dialog stays open) → head + `<anvil-cart-form>` → plain `<form action="/cart" method="post">` (updates[], remove links, checkout) → `[data-anvil-live]` outside the frame.
- With JS: steppers and typed quantities update the line through `cart/change.js` with the drawer and bubble sections; a refused change rolls the input back and shows Shopify's message in the form's alert line; remove links work in place; the note saves on change; the discount field applies/removes codes and reports an unusable code. Without JS the Update button and the plain form do the same work.
- Opens from the header cart link and after an add (`anvil:cart:updated` with source "add", when open-on-add is on); closes with Esc, the close button and a backdrop click; focus returns to the opener; scroll lock released even if the element is removed while open.
- Per line: names include the product title ("Quantity for …", "Remove: …"), struck prices carry "Regular price" / "Sale price" text, "Free" only when Shopify priced the line at zero. Savings line ("You save …", behind `cart_show_savings`) = compare-at savings + Shopify discounts, never typed.

## Not yet
The 16 drawer blocks (free-shipping bar, upsells, gift, countdown …) are wave 1 (DECISIONS 36).
