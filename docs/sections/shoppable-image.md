# Shoppable image — `sections/anvil-shoppable-image.liquid`

_Section card, 2026-10-15. Wave 5. Built from `docs/agent-prompts/shoppable-image.md` (CONVENTIONS, spec card, chassis API, exemplars)._

## Purpose
One image with up to 12 dots. Each dot is linked to a product. Tapping a dot opens a small product card with the product's thumbnail, title, price and an add to cart button. It suits a lifestyle photo on the home or landing page ("shop the look"). Spec: `docs/SPEC.md` §4.2 "Shoppable image" (image, up to 12 spots each linked to a product; dots that open a small product card with price and add button). Design row: `docs/DESIGN-sections.md` §3 `anvil-shoppable-image` (dots → product popover with card + ATC; local `spot` ×12 (x, y, product); popover position, show price/ATC; hotspots + cart JS; `aria-haspopup=dialog`; price from Shopify).

Phones and desktop show the same image in the same shape, so every dot stays on the same spot of the picture. From 750 px the image can be narrower than the content width and is centred.

## Settings
The 13 chassis settings come first, pasted verbatim from CONVENTIONS §4. Then come 16 section settings under the headers "Shoppable image", "Dots" and "Product card". That makes 29 settings in total (the limit is 40).

| id | type | default | what it does |
|---|---|---|---|
| `image` | image_picker | — | the picture. Its `info` asks for products shown as they really look, with each dot on the product it names. Empty: the `lifestyle-1` placeholder |
| `alt` | text | (blank) | alt text for the image; blank uses the image's own alt text from Files |
| `image_ratio` | select `adapt` / `1:1` / `4:5` / `3:4` / `16:9` / `21:9` | `adapt` | box shape (`anvil-media` ratios; other shapes crop with `object-fit: cover`). The `info` warns that dots are placed on the box as shown, so a new shape needs a dot check. With no image and `adapt`, the placeholder is drawn 16:9 (a square placeholder would be as tall as the page is wide) |
| `image_width` | range 30–100 step 5 % | 100 | image width from 750 px, as a share of the content width (page, narrow or full). Phones always use the full width |
| `dot_shape` | select `number` / `plus` / `dot` | `number` | numbers 1–12 in block order, a plus sign (turns into an × while its card is open), or a plain disc |
| `dot_color` | select `accent` / `button` / `background` | `accent` | dot colours from the section's scheme: accent + on-accent (the component's look), button background + button text, or background + text |
| `dot_pulse` | checkbox | true | the component's pulse ring; off makes the dots still. The pulse never runs under `prefers-reduced-motion: reduce` or `html[data-animations="off"]` (component CSS), as the `info` says |
| `pop_position` | select `auto` / `above` / `below` / `side` | `auto` | where the card opens (see "Card placement") |
| `card_scheme` | color_scheme | `scheme-1` | colour scheme of the cards (`av-scheme av-scheme--<id>` on each card), so a dark image section can keep light cards |
| `show_image` | checkbox | true | 72 px product thumbnail in the card |
| `show_vendor` | checkbox | false | `product.vendor` above the title |
| `show_price` | checkbox | true | `anvil-price` at size `sm`, no savings badge; the compare-at price shows struck through only when Shopify has a higher one. Also adds the price to the no-JavaScript list |
| `show_atc` | checkbox | true | the card's button area. Off: the card has only the thumbnail, the title link and the price |
| `variant_mode` | select `select` / `link` | `select` | products with options: a variant menu inside the card's form, or a "Choose options" link to the product |
| `add_label` | text | (blank) | button label; blank uses `anvil.product.add_to_cart`. The `info` says to name the action only, since prices and savings come from Shopify |
| `button_style` | select `primary` / `secondary` | `primary` | add / choose-options button style (sold out is always secondary and disabled) |

`schema.name` is "Shoppable image" (15 characters), `max_blocks: 12`, `disabled_on.groups: ["*"]`.

## Blocks
Local block `spot` ("Spot"). `{{ block.shopify_attributes }}` is on each spot wrapper (`.av-hotspots__spot-wrap`, which holds the dot and its card), so `shopify:block:select` opens that spot's card (component behaviour) and deselecting closes it.

| id | type | default | note |
|---|---|---|---|
| `product` | product | — | the card's product; `info`: title, image, price and availability come from Shopify |
| `x` | range 0–100 step 1 % | 50 | horizontal position of the dot's centre on the image box (0 = left edge); the centre is kept at least 22 px from each edge |
| `y` | range 0–100 step 1 % | 50 | vertical position (0 = top edge); the same 22 px clamp applies |

The preset "Shoppable image" ships the heading "Example heading — shop the **look**", the subheading "Example subheading — tap a dot to see each product." and three spots at (28, 42), (56, 28) and (74, 68) with no product, over the placeholder image.

## Markup and behaviour
- **Structure:** `anvil-section-head`, then `.av-shoppable-image` (modifier classes for card position, dot style, dot tone and still dots; `--av-si-w` inline) holding `<anvil-hotspots class="av-shoppable-image__stage av-enhance">`. The stage holds the `anvil-media` box (`.av-shoppable-image__media`) and one spot wrapper per shown spot, with `--av-spot-x` / `--av-spot-y` (the component's contract) and the unitless `--av-si-x` written inline. Section CSS clamps each wrapper 22 px (half the 44 px dot) inside the stage on both axes, so a dot at 0 or 100 keeps its whole target on the image and never makes a phone page scroll sideways (the pulse ring reaches 4.6 px further, inside the 12 px minimum gutter). Card and form ids carry `section.id` as well as `block.id`, because block ids are only unique within one section. After the stage come the `<noscript>` list and, in the editor with no blocks, `anvil.editor.empty_section`.
- **Dot:** `<button type="button" class="… av-enhanced-only" data-spot aria-haspopup="dialog" aria-expanded="false" aria-controls="av-si-pop-<section id>-<block id>">`, named by `aria-label` "Product N: <title>" (`anvil.shoppable_image.spot_label`). N counts the spots shown, so it has no gaps when the storefront skips empty spots. The visible number is part of that name (WCAG 2.5.3), and the plus or disc styles still get the same name. The 44 × 44 px target, disc and pulse come from `assets/anvil-hotspots.css`; the dot tone sets `--av-si-dot-bg` / `--av-si-dot-fg`, which recolour the disc, the ring and the static marker. Tab order is block order.
- **Static marker:** each wrapper also holds `<span class="av-shoppable-image__marker av-fallback-only" aria-hidden="true">N</span>`, a 28 px disc in the dot colours. Through the CONVENTIONS §6 enhancement gating (`.av-enhance` in `anvil-base.css`), the marker shows and the button is hidden until `<anvil-hotspots>` is defined, so without JavaScript (or if the module fails to load) there are no dead tab stops. The marker shows its number in every dot style, so it matches the numbered no-JavaScript list.
- **Card:** right after its dot, `<div class="av-hotspots__pop av-shoppable-image__pop" role="dialog" aria-labelledby="…-t" tabindex="-1" hidden>`. It is a non-modal dialog labelled by the product title. Inside: a close button (`anvil.a11y.close`, × icon), the thumbnail (a link hidden from assistive tech and the tab order, like the mini card), the vendor, the title as a link (`<p>`, not a heading: one card shows at a time and the dialog is named by it), the price and the buy area. The grid sits on an inner `.av-shoppable-image__card`, so the `hidden` attribute is never overridden by a `display` rule.
- **Opening and closing** (`assets/anvil-hotspots.js`, the shared component, unchanged): click, Enter or Space toggles a card. One card is open at a time. Esc closes it and returns focus to the dot. A click or focus outside the section's stage closes it too.
- **Section module** (`assets/anvil-shoppable-image.js`, 3,253 B raw, 1,441 B gzipped, under the 2 KB budget; document-level listeners, so editor re-renders need no re-binding):
  - When a card opens from a focused dot (keyboard, or a click that focused it), focus moves to the dialog and the dialog scrolls into view only as far as needed (`scroll-margin` keeps it clear of the sticky header). This is what `aria-haspopup="dialog"` promises. The editor's block select leaves focus in the editor;
  - a card set to open above its dot whose top would land above the header at the top of the page (`--av-header-height`, written on `:root` by `anvil-core.js`) opens below the dot instead. This happens with a low dot on a short phone image in a first section with no heading. The class `--up` is swapped for a style-less `--flip` while the card is open and restored on close, so in `side` mode the card top-aligns with the dot instead. Shoppers can always scroll to a card below;
  - focus reaching a different dot (Tab past the open card's last control) closes the open card, so a card never covers the focused dot (WCAG 2.4.11 Focus Not Obscured). The component alone keeps a card open while focus stays anywhere in the stage;
  - the close button closes its card and returns focus to the dot;
  - a click on the image away from every dot and card closes the open card (the component alone only closes on clicks outside the whole stage, so tapping the photo did nothing).
- **Card placement** (section CSS, container units of the stage, inside `@supports (left: 1cqw)`). The card is `min(300px, stage width − 16 px)` wide and centred on its dot, then clamped 8 px inside the stage. The dot centre in that formula (`--av-si-dot`) uses the same 22 px clamp as the wrapper, so the card stays centred on a dot that the clamp moved. A card therefore never runs past the image's edges, and phones never scroll sideways. This replaces the component's `.av-is-left` / `.av-is-right` / `.av-is-flip-y` classes, which can push a 280 px card off a 375 px screen for dots between 30 % and 70 % across. The vertical side is decided in Liquid, so placement works without the script, which corrects only the one case noted under `auto`:
  - `auto`: below the dot, or above it for dots in the lower 40 % (`y > 60`). The script turns an above card that would start above the header at the page top into a below card (see "Section module");
  - `above` / `below`: always that side;
  - `side`: from 750 px the card sits to the right of the dot, or to its left for dots in the right half (`x > 50`). Its top lines up with the dot, or its bottom for dots in the lower 40 %. Below 750 px it behaves like `auto`.
  Without container-unit support the component's own placement applies unchanged.
- **Stacking:** while a card is open its spot wrapper gets `z-index: 3`, so later dots never paint over it (each wrapper's `translate` makes its own stacking context). The section wrapper gets `position: relative; z-index: 2`, so a card that reaches past the image overlays the next section instead of sliding under it. Both use `:has([aria-expanded="true"])`.
- **Add to cart:** the same contract as `anvil-product-videos`. Cards whose product can be bought hold a native `{% form 'product' %}` (`id="av-si-form-<section id>-<block id>"`), wrapped by `<anvil-product-form form-id>` from `assets/anvil-product.js`. That script loads only when such a card exists. Without JavaScript the form posts to `/cart/add`. With it, `cartAdd(items, {sections: ['anvil-cart-drawer','anvil-cart-bubble'], source: 'add'})` runs, the drawer opens when the theme says so (focus moves there, and the component closes the card on that focus change), and otherwise the button reads "Added to cart" for 2 s. The drawer's opener is the card's button, which is hidden once the card closes, so the drawer could not hand focus back and it fell to `<body>`. The section module records the dot of a card closed by focus moving into a modal `<dialog>`, and when that dialog closes it moves focus to the dot. The listener is a capture `close` listener on `document`, so it runs after the dialog's own failed restore and before the drawer's no-op `opener.focus()`. Shopify's 4xx message shows in the card's `role="alert"` box.
  - single-variant product → hidden `id` input + submit button;
  - product with options and `variant_mode: select` → `<select name="id">` (visually hidden label "Choose a variant: <title>", theme dropdown style). Each option shows the variant title and its Shopify price; sold-out variants are `disabled` and say so. The opening choice is `selected_or_first_available_variant`;
  - `variant_mode: link`, or a product that `requires_selling_plan` → `anvil-button` link "Choose options";
  - sold-out product → disabled secondary button "Sold out", rendered by `anvil-button` (`disabled: true`).
  Every button carries the product title in visually hidden text ("Add to cart: <title>"). Variant option prices go through `anvil-money` (captured, then `strip_html`), like every other price.
- **Why not `anvil-product-card`:** CONVENTIONS §5 and DESIGN-sections §1 list "shoppable image" as a user of `anvil-product-card`. That card is a 4:5 media card for grids, and this popover is a 300 px row (72 px thumbnail beside the title and price), so the section builds its own compact card. It still uses the shared parts: `anvil-price`, `anvil-money`, `anvil-button`, and `<anvil-product-form>`. This is a recorded departure for the integrator.
- **Example spots (editor only):** in the theme editor (`request.design_mode`, or `request.visual_preview_mode` for the preset preview), a spot without a product shows an example card: placeholder thumbnail, "Example product" (`anvil.card.example_product`), the example price 19.00 through `anvil-money` (the one `anvil-product-card-mini` uses) and a disabled `anvil-button`. Its dot is named "Product N: Example product". On the storefront such a spot is skipped, whether no product was picked or the linked product was later drafted, unpublished or deleted (Shopify then returns the setting as blank). Shoppers never see a made-up price attached to a real item in the photo, the same rule `anvil-hotspots` follows for empty spots. When no spot is left, the scripts do not load.
- **No JavaScript:** dots cannot open, so the static markers replace them and a `<noscript>` `<ol role="list">` under the image links every spot that has a product. Each item shows its number in the same disc as its marker, then the title, plus the price when `show_price` is on. Each `<li>` carries `value="N"`, so in the editor, where example spots sit between product spots, the numbers still match. The forms inside the cards are never reachable without JavaScript, so the list links to the product pages. The spot loop builds the list, so the section has one `for` loop over `section.blocks`.
- **Loading:** the image is eager in the first two sections (or when `section.index` is nil) and gets `fetchpriority="high"` + preload in the first section. Otherwise it is lazy. `widths` go up to 2200; `sizes` follow `image_width` and `settings.page_width` / `narrow_width`, as in `anvil-image-text`. Card thumbnails are lazy (`72, 144, 216`, `sizes: 72px`) and sit in hidden cards, so they download only when a card opens.
- **CSS:** the `{% stylesheet %}` body is 5,703 B raw, 1,769 B gzipped (limit 6,144 raw). Every selector starts with `.av-shoppable-image`. `assets/anvil-hotspots.css` is loaded with `stylesheet_tag`; price, button, field and form-message styles come from `anvil-base.css`. Only `transform`-family properties (`rotate` on the plus icon) animate, under `prefers-reduced-motion: no-preference`.

## Honesty notes
- Titles, images, prices, compare-at prices and availability all come from Shopify. There is no typed price, saving, stock or badge field. Sold-out variants cannot be picked, and sold-out products say "Sold out".
- The `image` info asks for products shown as they really look, with each dot on the product it names. The `add_label` info keeps prices and savings out of the button text.
- Defaults read as examples ("Example heading — …", "Example subheading — …", "Example product"). Example cards and their typed 19.00 price appear in the editor only. Their buttons are disabled, so an unedited preset can never add anything to a cart.
- No timers, counters or social proof.

## Contract assumptions
- `<anvil-hotspots>` (assets/anvil-hotspots.js) exposes `spots`, `popFor(spot)`, `close(spot, refocus)` and `closeAll()`, emits `anvil:hotspot:toggle {spot, open}` (bubbling) after it un-hides a card, and opens a spot on `shopify:block:select` when the block element contains the `[data-spot]` button. Its CSS dot is 44 px. The placement formula uses half of that (22 px) as the offset between the wrapper's edge and the dot's centre. If the component's dot size changes, that constant must follow.
- `<anvil-product-form>` finds its form through `form-id`, reads `[data-anvil-form-error]` / `[data-anvil-form-status]` / `[data-anvil-bind="add_label"]` inside itself, and defaults the quantity to 1 (as `anvil-product-videos` documents).
- `.av-scheme--<id>` redefines the scheme tokens on the element it sits on, so the card scheme works on the card alone.
- `anvil-base.css` hides `.av-enhanced-only` inside `.av-enhance:not(:defined)` and `.av-fallback-only` inside `.av-enhance:defined` (CONVENTIONS §6).
- The cart drawer is a native modal `<dialog>` (`assets/anvil-cart-drawer.js`), and its opener defaults to `document.activeElement`. `anvil-core.js` writes `--av-header-height` on `:root`.

## Locale keys needed (integrator)
- `anvil.shoppable_image.spot_label` = "Product {{ index }}: {{ title }}" (accessible name of each dot; `title` is the product title or "Example product").
Existing keys used: `anvil.product.add_to_cart`, `anvil.product.sold_out`, `anvil.product.choose_options`, `anvil.product.choose_variant`, `anvil.card.example_product`, `anvil.a11y.close`, `anvil.editor.empty_section`.

## Open questions
1. **Shared hotspots placement.** On phones the component's flip classes can push its 280 px popover off a 375 px screen (dots between 30 % and 70 % across), and later spot wrappers paint over an open popover. This section works around both with scoped CSS (container-unit clamp, `:has()` z-index). `anvil-hotspots` (the product-features section) has the same exposure. The integrator may want both fixes moved into `assets/anvil-hotspots.css`, which this wave keeps read-only.
2. **Focus and close in the component.** The component does not move focus into a popover, close a popover when focus reaches another spot, or support a close button. So this section adds a 1.4 KB module. If the component gains these, most of `assets/anvil-shoppable-image.js` can go. `anvil-hotspots` (the product-features section) has the same Focus Not Obscured exposure with its own popovers.
3. **No phone image.** A second image for phones would move every dot off its product, so there is none. Wide images (16:9, 21:9) give small targets on phones. The `ratio` setting (the same shape on every screen size) is the merchant's lever.
4. **`side` mode width.** Side cards are not clamped horizontally. With a narrow `image_width` and a dot near the middle, a side card can extend past the image (still on screen at ≥ 750 px). `auto` / `above` / `below` are always clamped.

## Integration pass (2026-10-15)
- `anvil-cart-drawer.js` now hands focus to the `[aria-controls]` control of a hidden opener's container on close, so the section's capture listener can go later; `anvil-hotspots.css` raises open and focused spots.

## Fix pass (2026-10-15)
- Setting ids follow the theme-wide vocabulary (CONVENTIONS §5; DECISIONS 82–100); the tables above use the new ids: `ratio` → `image_ratio`, `dot_style` → `dot_shape`, `dot_tone` → `dot_color`. Saved templates were migrated.
- Uses the shared pieces: the add-to-cart form from `snippets/anvil-quick-buy` (DECISIONS 96); eager or lazy media from `snippets/anvil-above-fold` (DECISIONS 85); the editor-only empty note from `snippets/anvil-editor-empty` (DECISIONS 87).
- Availability: `disabled_on` groups ["header","custom.overlay"] (CONVENTIONS §4, DECISIONS 100).
