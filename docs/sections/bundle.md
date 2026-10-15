# `anvil-bundle` — Bundle deals (section card)

_Wave section. File `sections/anvil-bundle.liquid`, editor name "Bundle deals", module `assets/anvil-bundle.js`. Spec: `docs/spec/bundle.md` (SPEC §4.2 "Bundle deals"; DESIGN-sections §3: pick-N → one ATC, `slot` ×6 or `product_list`, savings text, badge, show compare-at, cart `items[]`). Contract: `docs/CONVENTIONS.md` §3–§12, `docs/HONEST.md`._

## Purpose
A pick-your-bundle box. Up to six products, shown as cards or rows, each with a variant dropdown (products with options) and an "Add to bundle" checkbox. A box beside the products (desktop) or below them shows the picked products as thumbnails with an empty square for each pick still missing, "N of M picked", the total of the real prices with the compare-at total struck through, the merchant's savings text with "Discount applied at checkout", and one button that adds every pick to the cart in a single request.

## Markup (shopper view)
```
div#anchor.av-section.av-s-anvil-bundle                          ← anvil-section-attrs
  div.av-section__inner
    .av-section-head (h2 + subheading)                            ← anvil-section-head
    h2.av-visually-hidden                                         ← only when the heading is blank (titles are h3)
    anvil-bundle.av-bundle.av-bundle--cards|rows.av-bundle--side|below
        data-anvil-pick=<need> [data-anvil-exact] data-anvil-progress data-anvil-picked data-anvil-limit
      div.av-bundle__picker                                  ← container (container queries for the columns)
        fieldset.av-bundle__set
          legend.av-bundle__legend  "Pick 3 products" | "Pick at least 3 products" | sold out / "Unavailable" when nothing can be bought
          ul.av-bundle__slots.av-list-reset[role=list]
            li.av-bundle__slot[--example][data-anvil-bundle-slot=n] {{ block.shopify_attributes }}   ×≤6 (empty slots skipped on the live store once one is real)
              a.av-bundle__media[tabindex=-1][aria-hidden] > anvil-media   (div for an example slot)
              div.av-bundle__info
                p.av-bundle__caption                         ← slot caption (slot blocks only)
                h3.av-bundle__title > a                      ← "Example product" for an empty slot
                p.av-price.av-price--sm[--sale][--sold-out]
                  span.av-price__current > span.av-visually-hidden.av-bundle__lr "Price" + span.av-visually-hidden.av-bundle__ls "Sale price"
                                         + span[data-anvil-bundle-price]          ← CSS shows one label, following .av-price--sale
                  s.av-price__compare[data-anvil-bundle-compare][hidden?] > [hidden "Regular price"] span[data-anvil-bundle-amount]
                  span.av-price__unit[data-anvil-bundle-unit=<variant id>][hidden?] ×n  ← per variant with a unit price (only the opening variant without a dropdown)
                span.av-field__select.av-dropdown.av-bundle__variant > label.av-visually-hidden + select   ← options only
                  option[value][data-anvil-price][data-anvil-compare][selected][disabled = sold out]
              label.av-check.av-bundle__pick
                input.av-bundle__check[type=checkbox][data-anvil-bundle-pick][value=<variant id>]
                     [data-anvil-price][data-anvil-compare][checked = preselect][disabled = sold out | example]
                span  "Add to bundle" | "Sold out" | "Unavailable" (subscription-only) + hidden ": <title>"
      div.av-bundle__box
        div.av-bundle__summary
          div.av-bundle__box-head > h3.av-bundle__box-title + span.av-badge.av-badge--accent   ← badge only when backed by sales data
          ul.av-bundle__tray[aria-hidden]                    ← "Show picked products in the box"
            li.av-bundle__thumb[data-anvil-bundle-thumb=n][hidden?]   ← one per buyable slot (56 px, lazy)
            li.av-bundle__empty[data-anvil-bundle-empty][hidden?]      ← one per pick (plus icon); none when nothing can be bought
          p.av-bundle__progress#<uid>-progress[aria-live=polite][data-anvil-bundle-progress]
        div.av-bundle__checkout
          p.av-bundle__total > "Total" + span.av-price.av-bundle__sum
            span.av-price__current[data-anvil-bundle-total] + s.av-price__compare[data-anvil-bundle-was][hidden?]
          p.av-bundle__savings > tag icon + "<savings text> · Discount applied at checkout"
          button.av-btn.av-btn--primary.av-btn--lg.av-btn--full.av-bundle__add[data-anvil-bundle-add][disabled]
                 [aria-describedby=<uid>-progress]                ← snippets/anvil-button
          p.av-bundle__nojs                                  ← only under html.no-js
          p.av-bundle__status[role=status][data-anvil-status]
          p.av-example-note ×0–4                                  ← editor only
    script[type=module] anvil-bundle.js                           ← only when at least one product can be bought
```
Headings: chassis `h2`, slot titles and the box title `h3`; a visually hidden `h2` (box heading, else `anvil.bundle.label`) keeps the outline when the heading is blank (CONVENTIONS §3). The slots are a real list inside a fieldset whose legend says how many to pick, so a screen reader announces the rule when it enters the group.

Why `.av-bundle*` and `<anvil-bundle>`: `.av-bundle*` classes and the `<anvil-bundle>` element already belong to the product page's Bundle offer block (`assets/anvil-pb-commerce.css`, `assets/anvil-commerce.js`). Every selector still starts with `.av-bundle` (chassis-lint), but nothing collides when both sit on one product page.

## Settings
The 13 chassis settings come first, verbatim. Then 15 own settings (28 non-header settings in total, cap 40):

| id | type | default | effect |
|---|---|---|---|
| `source` | select `slots` / `list` | `slots` | slot blocks, or the product list below |
| `products` | product_list (limit 6) | — | used when `source` is `list`; an empty list shows 4 example slots |
| `pick_count` | range 1–6 step 1 | `3` | products to pick. `info`: match the automatic discount's minimum quantity |
| `pick_exact` | checkbox | `true` | on: exactly that many (further boxes are `aria-disabled`); off: at least that many |
| `preselect` | checkbox | `false` | ticks the first buyable products, up to the number to pick |
| `layout` | select `cards` / `rows` | `cards` | cards: 2 columns, 3 from a 520 px container, 4 from 820 px. Rows: square 72/96 px image beside the words, the checkbox moves to the end of the row from 520 px |
| `image_ratio` | select `theme` / `1:1` / `4:5` / `3:4` | `theme` | card image shape (`theme` = `settings.card_image_ratio`); rows are always square |
| `show_compare` | checkbox | `true` | struck compare-at prices per slot and on the total. `info`: from the admin only |
| `box_position` | select `side` / `below` | `side` | desktop (≥ 990 px): sticky box beside the products, or a two-column box below them (≥ 750 px). Phones: always below |
| `box_heading` | text | "Your bundle" | box `h3` (escaped); blank hides it |
| `badge` | text | — | accent badge in the box, shown only when the next box is ticked. Honesty `info` |
| `badge_backed_by_sales` | checkbox | `false` | "Badge is backed by sales data"; off: shoppers never see the badge and the editor says so (`anvil.editor.bundle_badge_hidden`) |
| `savings_text` | text | — | printed with "Discount applied at checkout". Honesty `info`; blank by default so an unedited store promises nothing |
| `button_label` | text | "Add bundle to cart" | blank falls back to `anvil.product.bundle_add` |
| `show_tray` | checkbox | `true` | thumbnails of the picks and the empty squares |

## Blocks
`slot` "Product slot" (limit 6, `max_blocks` 6):

| id | type | default | effect |
|---|---|---|---|
| `product` | product | — | the product; blank renders an example slot ("Example product", placeholder image, disabled checkbox, editor note). On the live store a blank slot is skipped as soon as any slot resolves to a real product (a `product`, or `page_product` on a product page), so a half-filled section never publishes an example card; with no real product at all, every slot stays an example (CONVENTIONS §12). The editor always shows every slot |
| `page_product` | checkbox | `false` | on a product template the slot shows the product being viewed (the global `product`); elsewhere it uses `product` |
| `caption` | text | — | short line above the title. Honesty `info` |

Preset "Bundle deals": heading "Build your **bundle**", an example subheading, no badge, four empty slots, pick 3, exactly. `disabled_on` every section group.

## Behaviour
- **Liquid.** One loop renders the slots for both sources: `for n in (1..slot_total)` picks its product through a one-step `for item in s.products offset: i0 limit: 1` or `for block in section.blocks offset: i0 limit: 1` (that loop prints `block.shopify_attributes` onto the slot). The slots are captured first, because the legend and the box need the counts (buyable slots, preselected picks, totals). Each slot opens on `selected_or_first_available_variant`, or on the first available variant when `?variant=` selected a sold-out one on the product's own page. Images: `anvil-media` with `300, 450, 600` (cards) or `96, 192` (rows); in a section in the first two positions the whole first visible row is eager (the first 4 shown cards, the first 3 rows), the rest lazy (CONVENTIONS §11).
- **Prices.** The slot price has the parts of `snippets/anvil-price` (hand-written because the dropdown rewrites it): the hidden label reads "Sale price" or "Price", picked by CSS from `.av-price--sale`, so it follows the variant; every variant with a `unit_price_measurement` prints its unit price (`anvil-money` amount, "/", `reference_value` when not 1, `reference_unit`), hidden unless that variant is selected, and the module shows the one for the picked variant.
- **Subscription-only products.** Picks are added without a `selling_plan`, so a product with `requires_selling_plan` cannot be picked: its box is disabled and reads `anvil.product.unavailable`.
- **Too few buyable products.** When real products exist but fewer can be bought than `pick_count` (sold out, or too few slots), the box asks for the number that can be bought, so the rest can still be added together, and **the savings text is hidden**, because the cart could not meet the discount's terms. The editor shows `anvil.editor.bundle_short`. When nothing can be bought, the legend and the progress line say `anvil.bundle.sold_out` (or `anvil.product.unavailable` when a subscription-only product is among them), the tray draws no empty squares, and no script loads.
- **`<anvil-bundle>`** (`assets/anvil-bundle.js`, 5,565 B raw, 2,031 B gzipped at level 9, 2,048 B with the `gzip` CLI header; budget 2,048):
  - Money waits for `anvil-dom` (CONVENTIONS §7): the module imports `Anvil.modules.dom` when `Anvil.dom` is not attached yet, and a write that comes earlier (a restored form on connect, an early change) runs again once it arrives, so prices never show as bare numbers. If the import fails, the write goes ahead with a plain `0.00` fallback.
  - A `change` anywhere recomputes: each slot's checkbox takes the selected option's id, price and compare-at; slot prices, the `av-price--sale` class (and so the hidden sale label), the compare line and the unit price follow the variant; the total is the sum of the picked prices and the struck total the sum of `max(compare_at, price)`, shown only when it is higher. On connect the server's money text stands unless a box or dropdown already differs from its default (picked before the module ran, or restored by the browser).
  - Exact mode: once the number is reached, the other boxes get `aria-disabled="true"` (they stay focusable); a click on one is cancelled and the live progress line says `anvil.bundle.limit` (cleared, then set after 60 ms, so a repeat click is announced again). Ticks beyond the number from before the module ran are cleared.
  - The tray shows the thumbnails of the picks and hides one empty square per pick; the progress line (polite live region, also the button's description) reads "N of M picked", or "N picked" past the number in "at least" mode. It is written only when its words change, so a variant change that keeps the count is not announced again.
  - The button is enabled once the number is reached. A click sends one `cartAdd(items, {sections: ['anvil-cart-drawer', 'anvil-cart-bubble'], source: 'add'})` with every pick at quantity 1 (busy guard, `aria-busy` spinner). Success: "Added to cart" goes to the open drawer's live region (the drawer opens per Theme settings), else to the box's status line; with cart type "page" the cart page opens (after waiting up to 3 s for `Anvil.gifts.settled()`, as the product form does). Failure: Shopify's description when the request reached Shopify (a 422 adds nothing), else `anvil.cart.error` (network errors).
- **Without JavaScript** (`html.no-js`): the slots stay product links with prices; the checkboxes, dropdowns, legend, tray, progress, total and button are hidden and one line says `anvil.bundle.no_js`. Shopify documents multi-item adds for `/cart/add.js` with a JSON `items` array only (shopify.dev Cart API), so no form fallback is attempted. With JavaScript on, everything is displayed from the first paint (no shift); if the module fails, the button stays disabled and the product links still work.
- **Editor.** `shopify:section:load` reconnects the element. Notes (editor only): empty slot (`anvil.editor.block_empty`), list mode with slot blocks present (`anvil.editor.bundle_list_mode`), empty list (`anvil.editor.choose_product`), too few buyable products, or "Products to pick" above the number of example slots (`anvil.editor.bundle_short`), badge filled in but not backed by sales data (`anvil.editor.bundle_badge_hidden`), no blocks (`anvil.editor.empty_section`).
- **CSS.** `{% stylesheet %}` 6,070 B raw (1,475 B gzipped), under the 6,144 B cap; tokens only. Slot cards use `max(1px, var(--av-border-w-card))` (so the picked accent border still shows at width 0) and the box `var(--av-border-w-card)`, matching the theme's card border width. Picked slots are drawn with `:has(:checked)` (accent border and tinted pick row), so the state shows before the module runs. Rows: the pick control ends the row from a 520 px container. Without JavaScript the slots stay product links with prices. Reduced motion: nothing animates.

## Honesty notes
- The total is always the sum of the real prices of the picked variants. There is no bundle price field, no "you save" field and no computed discount.
- Struck prices come only from compare-at prices (`show_compare`).
- The savings text is the merchant's description of a real automatic discount and is always followed by "Discount applied at checkout"; it ships blank, and it is hidden whenever the bundle cannot reach the number to pick.
- The badge renders only when "Badge is backed by sales data" is ticked (CONVENTIONS §10, HONEST.md), like every free-text badge in Anvil; it ships blank and unticked, and the editor says when a filled-in badge is hidden. The caption is free text with an `info` that forbids unbacked savings or popularity claims.
- On the live store, empty slot blocks never render beside real products, so no "Example product" card can be published by accident.
- Example slots read "Example product" and cannot be picked.

## Locale keys used
New (for the integrator; until they are added, theme check reports TranslationKeyExists on this file):

| key | form | variables | English |
|---|---|---|---|
| `anvil.bundle.label` | plain | — | "Bundle deal" |
| `anvil.bundle.pick_exact` | one/other | `count` | one: "Pick {{ count }} product" · other: "Pick {{ count }} products" |
| `anvil.bundle.pick_min` | one/other | `count` | one: "Pick at least {{ count }} product" · other: "Pick at least {{ count }} products" |
| `anvil.bundle.add_to_bundle` | plain | — | "Add to bundle" |
| `anvil.bundle.progress` | plain (never one/other: the JS template passes the text `[total]`) | `picked`, `total` | "{{ picked }} of {{ total }} picked" |
| `anvil.bundle.picked` | plain | `picked` | "{{ picked }} picked" |
| `anvil.bundle.limit` | one/other | `count` | one: "You can pick {{ count }} product. Untick one to swap." · other: "You can pick {{ count }} products. Untick one to swap." |
| `anvil.bundle.no_js` | plain | — | "Turn on JavaScript to add these products together, or open each product to add it on its own." |
| `anvil.bundle.sold_out` | plain | — | "These products are sold out." |
| `anvil.editor.bundle_list_mode` | plain | — | "Products come from the product list, so the slot blocks are not shown. Switch “Products from” to use them." |
| `anvil.editor.bundle_short` | one/other | `count`, `available` | one: "This bundle asks for {{ count }} product but only {{ available }} can be picked here. Add products or lower “Products to pick”." · other: "This bundle asks for {{ count }} products but only {{ available }} can be picked here. Add products or lower “Products to pick”." |
| `anvil.editor.bundle_badge_hidden` | plain | — | "Badge hidden from shoppers: tick “Badge is backed by sales data” in the section settings to show it." |

Existing: `anvil.product.sold_out`, `anvil.product.unavailable`, `anvil.product.choose_variant`, `anvil.product.bundle_total`, `anvil.product.bundle_add`, `anvil.price.price`, `anvil.price.sale_price`, `anvil.price.regular_price`, `anvil.price.unit_price`, `anvil.price.per`, `anvil.card.example_product`, `anvil.cart.applied_at_checkout`, `anvil.editor.block_empty`, `anvil.editor.choose_product`, `anvil.editor.empty_section`; JS reads `Anvil.strings.added` and `cartError`.

## Uncertain / open
- Quantity rules: every pick is added at quantity 1. A variant whose `quantity_rule.min` is above 1 makes Shopify reject the add (the description is shown).
- The slot image stays the product's featured image when the variant changes.
- Subscription-only products (`requires_selling_plan`) show as "Unavailable" and cannot be picked: the bundle has no selling-plan picker. Products that merely offer a subscription are added as one-time purchases.
- Unit prices print one hidden span per variant that has a unit price, so a product with very many unit-priced variants adds markup; the module only toggles `hidden`.
- No `@app` block: app content is unlikely inside a pick box.
- Not rendered on a live store in this wave (no dev-theme push); the module was exercised in headless Chrome against markup mirroring the Liquid output (34 scenarios: totals, compare-at, exact limit, variant change, add payload, 422, "at least" mode), and the layout was checked at 375 px and 1280 px. The review fixes were re-run in headless Chrome (20 scenarios: no money write before a slow `anvil-dom` import, then formatted totals; repeat limit clicks re-announced; unit price follows the variant; no live-region rewrite when the words stay; untick re-enables the boxes) plus the failed-import fallback.

## Integration pass (2026-10-15)
- Locale keys added with the second-pass values (`limit`, `bundle_short` and the pick keys are one/other). `anvil.editor.bundle_badge_hidden` stays separate from `anvil.editor.pricing_badge_hidden`: they point to different places to tick the box.
- The `.av-bundle-deal*` / `<anvil-bundle-deal>` names were recorded in DECISIONS 79; the fix pass renamed them to `.av-bundle*` / `<anvil-bundle>` and gave the product page's Bundle offer block `.av-pb-bundle*` / `<anvil-pb-bundle>` (DECISIONS 109).
- Placed on `templates/product.landing.json` with the first slot set to the page's product.

## Fix pass (2026-10-15)
- Uses the shared pieces: eager or lazy media from `snippets/anvil-above-fold` (DECISIONS 85); the editor-only empty note from `snippets/anvil-editor-empty` (DECISIONS 87).
- Availability: `disabled_on` groups ["*"] (CONVENTIONS §4, DECISIONS 100).
