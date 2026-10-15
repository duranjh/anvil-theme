# Wave 1 contracts — product page and cart drawer

_2026-10-14. Binding for every wave-1 agent, together with `CONVENTIONS.md` (wins on conflict), `DESIGN-money-path.md` (behaviour), `SPEC.md` §2.4 and §3 (what merchants and shoppers see), `HONEST.md` and `FORBIDDEN.md`._

Seven builders write at the same time. Each owns the files listed in §8 and nothing else. Anything shared is defined here so nobody waits for anybody.

## 1. Block types and snippet names
Liquid `render` only takes a literal name, so the dispatcher is a `case` with one `render` per type. Every block type `foo_bar` renders `snippets/anvil-pb-foo-bar.liquid` with exactly these params:

```liquid
{% render 'anvil-pb-foo-bar', product: product, block: block, section: section, form_id: form_id, current_variant: current_variant %}
```

The 38 types (+ `@app`), by owner:

| Owner (§8) | Types |
|---|---|
| picker-form | `variant_picker`, `offer_card`, `quantity`, `quantity_tier`, `buy_buttons`, `sticky_atc` |
| content | `title`, `price`, `description`, `sku`, `inventory`, `share`, `custom_liquid`, `collapsible_tab`, `popup`, `complementary`, `divider`, `image`, `video`, `link_button`, `scroll_buttons` |
| trust | `text_icon`, `icons_text`, `emoji_benefits`, `urgency_text`, `payment_badges`, `rating`, `review_platform_badge`, `reviews_list`, `review_avatars` |
| commerce | `shipping_estimate`, `shipping_checkpoints`, `custom_field`, `size_chart`, `discount_code`, `bundle_offer`, `upsells`, `quantity_gifts` |

`offer_card` and `quantity_tier` are **data blocks**: their snippets render nothing when called by the dispatcher (they output only `{{ block.shopify_attributes }}`-carrying hidden markers if needed for editor selection); the picker and quantity snippets read them from `section.blocks`. `sticky_atc` is rendered once by the shell **after** the section's main grid, not in block order (the dispatcher skips it).

## 2. Block schema fragments
Each owner writes one JSON file per block type at `docs/product-blocks/<type>.json` containing exactly the block object that goes into a section schema's `blocks` array:

```json
{ "type": "price", "name": "Price", "limit": 1, "settings": [ ... ] }
```

Section-level settings that belong to a feature live in fragments named `docs/product-blocks/_settings-<area>.json`, each a JSON array of setting objects (e.g. `_settings-gallery.json` from the gallery owner). The shell owner writes `scripts/sync-block-schemas.py`, which rebuilds the `{% schema %}` of `sections/main-product.liquid` and `sections/anvil-featured-product.liquid` from: the shell's own section settings, every `_settings-*.json` (in file-name order), every `<type>.json` (in the order of §1's table), then `{"type": "@app"}`. Featured product excludes `sticky_atc` and `quantity_gifts` and adds a `product` setting. `python3 scripts/sync-block-schemas.py --check` exits 1 when a section is out of date (CI runs it). Labels and `info` are inline English, written in the owner's own words; every misusable setting gets a one-sentence honesty `info`.

## 3. The product form and variant state
- The shell renders one `{%- form 'product', product, id: form_id, data-anvil-product-form: '' -%}` (no `novalidate` since the fix pass, §11: the browser enforces required fields and quantity rules with or without JavaScript) containing **only** `<input type="hidden" name="id" value="{{ current_variant.id }}" data-anvil-variant-input>` and the `buy_buttons` block output. `form_id = 'anvil-pf-' | append: section.id`.
- Every other input that must post (quantity, custom fields, bundle checkboxes) sits outside the form and carries `form="{{ form_id }}"`.
- `current_variant`: the shell computes it once: `product.selected_variant`, else the `offer_cards_preselect` variant when the variant picker block is in cards mode and that variant is available, else `product.selected_or_first_available_variant`.
- The variant picker block renders `<script type="application/json" data-anvil-product-json>` with `{ "id", "handle", "url", "variants": [trimmed variant objects, §11], "media": {variant_id: media_id}, "inventory": {variant_id: {qty, managed, policy}} }` once per section.
- On change the picker emits `anvil:variant:changed` with `{ sectionId, variant, product: {id, handle} }` through `window.Anvil.events` and sets `?variant=` with `history.replaceState`, keeping every other query parameter.
- **Bind targets.** Any element inside the section with `data-anvil-bind="<field>"` is updated client-side on every variant change: `price` (money), `compare` (money or empty + hidden), `savings` (money, hidden when no saving), `savings_percent`, `sku`, `availability` (`in_stock|low_stock|sold_out` as `data-state`), `add_label` (button text: add / sold out / unavailable), `image` (for the sticky bar thumbnail). Owners render these attributes; the picker updates them. After the client update the picker fetches `?section_id=<section.id>&variant=<id>` and replaces every `[data-anvil-server-truth]` node by matching `data-anvil-server-truth="<key>"` (inventory text, unit price, pickup availability, market-priced money).
- Money is formatted with `window.Anvil.dom.formatMoney(cents)`.

## 4. JS module access
Section and block modules never import core modules by relative path. They read `window.Anvil.<area>` at call time, or, when they need the API at load time, `const cart = await import(window.Anvil.modules['cart-api'])` (same versioned URL as core → same module instance, same request sequence). Events: `window.Anvil.events.on/emit`, or listen on `document` for the mirrored CustomEvent. Add-to-cart always calls `cart.cartAdd(items, { sections: ['anvil-cart-drawer', 'anvil-cart-bubble'], source: 'add' })`; core swaps returned sections and the drawer opens itself when `Anvil.settings.openCartOnAdd`.

## 5. Gift rules (shared engine)
`assets/anvil-gifts.js` (commerce owner) runs after every `anvil:cart:updated` whose `source` is not `gift`. It reads every element on the page matching `[data-anvil-gift-rule]` whose content is JSON:

```json
{ "key": "qty:<trigger_product_id>:<min>", "trigger": "quantity", "productId": 123, "min": 3, "giftVariantId": 456 }
{ "key": "spend:<threshold_cents>", "trigger": "spend", "threshold": 5000, "giftVariantId": 456, "excludeGifts": true }
```

For each rule: when the condition holds and no cart line has property `_anvil_gift` equal to `key`, add `{id: giftVariantId, quantity: 1, properties: {_anvil_gift: key}}` with `source: 'gift'`; when it no longer holds and such a line exists, set it to 0. Spend uses `cart.total_price` minus lines carrying `_anvil_gift` when `excludeGifts`. A shopper removing a gift line stores `sessionStorage['anvil_gift_dismissed:' + key]` and the engine skips that key for the session. Gift lines are clamped to quantity 1. Errors (422 sold out) are swallowed and logged once. The product page's `quantity_gifts` block and the drawer's `gift_threshold` block each render one rule element plus `<script type="module" src="{{ 'anvil-gifts.js' | asset_url }}">`. The decision logic is a pure exported function `planGiftChanges(cart, rules, dismissed) → [{action:'add'|'remove', ...}]` with tests in `tests/gifts.test.mjs` (`node --test`). The drawer shows "FREE" only when `line.final_line_price == 0`.

## 6. Shared snippets (used by product blocks AND the drawer)
| Snippet | Owner | Params | Output |
|---|---|---|---|
| `anvil-text-icon` | trust | `icon`, `image`, `text`, `size` (`sm\|md`), `pill` (bool), `class` | one reassurance line |
| `anvil-icons-text` | trust | `items` (array of `{icon, image, heading, text}` built by the caller), `columns_mobile`, `columns` | trust row |
| `anvil-payment-badges` | trust | `source` (`shop\|custom`), `filter` (comma list of payment type handles), `images` (array), `size` | one row of payment icons from `shop.enabled_payment_types` via `payment_type_svg_tag`, or custom images |
| `anvil-product-card-mini` | commerce | `product`, `show_price`, `button` (`add\|view`), `source_tag` | compact card with image, title, price, add button (single-variant products add via `cartAdd`; others link to the product) |
| `anvil-ship-dates` | commerce | `processing_min`, `processing_max`, `delivery_min`, `delivery_max`, `skip_weekends`, `cutoff_hour`, `timezone_note`, `format`, `mode` (`range\|steps`), `labels`, `icons` | computed dates in Liquid from `'now'` + a `data-anvil-ship-dates` JSON config that `assets/anvil-ship-dates.js` recomputes client-side (pure exported `computeShipDates(now, cfg)` with `tests/ship-dates.test.mjs`) |

Signatures go in a `{% doc %}` header at the top of each snippet.

## 7. Cart drawer render contract
- `sections/anvil-cart-drawer.liquid` stays the static section rendered from `layout/theme.liquid`; its inner element carries `data-anvil-section="anvil-cart-drawer"` (core's swap target) inside the `<dialog>`; `<anvil-cart-form cart-id="drawer">` from `assets/anvil-cart.js` keeps handling steppers, removal, note and the discount field; the drawer's own module handles the new blocks.
- Blocks: `items`, `subtotals`, `checkout`, `free_ship_bar`, `checkpoints_bar`, `countdown`, `upsells`, `gift_threshold`, `text_icon`, `image`, `icons_text`, `payment_badges`, `discount_field`, `note`, `policies_check`, `custom_liquid`. Each has `place_in_footer` (checkbox). `items`, `subtotals`, `checkout`, `discount_field`, `note`, `policies_check` have `limit: 1`. No `@app` (static sections cannot hold app blocks).
- Theme settings already own `drawer_width`, `cart_open_on_add`, `cart_show_note`, `cart_show_discount_field`, `cart_show_savings` (DECISIONS 17); the drawer's `note` and `discount_field` blocks render only when their theme setting is on **or** the block exists (block wins, theme setting is the default when no blocks are configured).
- Presets/defaults: when the drawer section has no blocks configured (fresh install), it renders the default stack: items, subtotals, free_ship_bar (hidden until a threshold is set), checkout, payment_badges.
- The cart page (`main-cart-items`, `main-cart-footer`) reuses the same line and totals markup via `snippets/anvil-cart-line.liquid` and `snippets/anvil-cart-totals.liquid` (drawer owner).

## 8. File ownership
| Owner | Files |
|---|---|
| **shell** | `sections/main-product.liquid`, `sections/anvil-featured-product.liquid`, `snippets/anvil-product-block.liquid` (dispatcher), `scripts/sync-block-schemas.py`, `docs/product-blocks/_section-main-product.json` (shell settings), `assets/anvil-product.css` (two-column layout, buy column rhythm, mobile stacking, section padding) |
| **gallery** | `snippets/anvil-gallery.liquid`, `assets/anvil-gallery.js`, `assets/anvil-gallery.css`, `docs/product-blocks/_settings-gallery.json` |
| **picker-form** | the 6 snippets for its types + `snippets/anvil-offer-cards.liquid`, `assets/anvil-product.js` (`<anvil-variant-picker>`, `<anvil-product-form>`, `<anvil-quantity>`, `<anvil-sticky-bar>`), `assets/anvil-offer-cards.css`, `assets/anvil-sticky-bar.css`, its 6 fragments |
| **content** | the 15 snippets for its types, `assets/anvil-pb-content.css`, its 15 fragments |
| **trust** | the 9 snippets for its types, `snippets/anvil-text-icon.liquid`, `snippets/anvil-icons-text.liquid`, `snippets/anvil-payment-badges.liquid`, `assets/anvil-pb-trust.css`, its 9 fragments |
| **commerce** | the 8 snippets for its types, `snippets/anvil-product-card-mini.liquid`, `snippets/anvil-ship-dates.liquid`, `sections/anvil-upsell-row.liquid` (no presets; rendered only through the recommendations endpoint with `section_id`), `assets/anvil-gifts.js`, `assets/anvil-ship-dates.js`, `assets/anvil-commerce.js` (bundle add, discount copy/apply, upsell add, custom-field validation), `assets/anvil-pb-commerce.css`, `tests/gifts.test.mjs`, `tests/ship-dates.test.mjs`, its 8 fragments |
| **drawer** | `sections/anvil-cart-drawer.liquid`, `sections/anvil-cart-bubble.liquid`, `sections/main-cart-items.liquid`, `sections/main-cart-footer.liquid`, `snippets/anvil-cart-line.liquid`, `snippets/anvil-cart-totals.liquid`, `assets/anvil-cart-drawer.js`, `assets/anvil-cart-drawer.css`, `assets/anvil-cart.js` |

Read-only for everyone during the wave: `layout/`, `config/`, `locales/`, `docs/` (except your fragments), core assets (`anvil-core.js`, `anvil-events.js`, `anvil-cart-api.js`, `anvil-sections.js`, `anvil-dom.js`, `anvil-base.css`), the shared snippets of wave 0, templates. **Locale keys**: list every `anvil.*` key you need, with its English value, in your output; the integrator adds them. Liquid's `t` filter has no inline default, so write the key and list it; theme check flags it as missing until the integrator adds it at wave end.

## 9. Gates for each builder
Run `shopify theme check --fail-level warning` (PATH=/opt/homebrew/opt/node@22/bin) and the four lints; fix findings in your own files; findings caused by another owner's unfinished file are expected — list them, don't touch. Missing translation keys you introduced are expected until integration — list them. `node --test tests/` for the commerce owner.

## 10. As integrated (2026-10-15)
What shipped where it differs from or sharpens the text above (DECISIONS 41–52):
- §1: the dispatcher never calls `offer_card`, `quantity_tier` or `sticky_atc`. The picker and quantity snippets render cards and tiers (each with its block's `shopify_attributes`); `snippets/anvil-pb-offer-card.liquid` and `anvil-pb-quantity-tier.liquid` render nothing unless called with their extra params.
- §3: the shell prints `{{ form | payment_button }}` inside the form after the Buy buttons output when that block's `show_dynamic_checkout` is on (a rendered snippet cannot reach the `form` object). Without a Buy buttons block an empty hidden form is still rendered so `form=` controls post. Buy buttons adds a `<noscript>` variant select (`name="id"`) after the hidden input for shoppers without JavaScript.
- §3 binds: `savings_percent` is a bare whole number rounded down; the `%` comes from the locale string. Empty values hide the closest `[data-anvil-bind-box]` or the element; `availability` writes `data-state` (CSS may read it); `add_label` reads `data-anvil-label-add` / `data-anvil-label-sold-out`. Server-truth keys are `<area>-<section.id>-<block.id>`.
- §3 product JSON adds `"options"` (option names); `inventory[id].managed` is true when `inventory_management` is not blank and `qty` is null when untracked.
- §6: `anvil-icons-text` and `anvil-payment-badges` also take `settings` (a settings object with `item_N_icon|image|heading|text`, or `badge_image_N` / `badge_alt_N`), because Liquid cannot build an array of objects; `anvil-text-icon` adds `tone` and `shape`.
- Size chart dialog id: `anvil-size-chart-<section.id>`.
- Extra events: `anvil:quantity:changed {sectionId, formId, quantity, mirror}`; editor only `anvil:quantity:tier-check {sectionId, ok, expected, actual, title}`.

## 11. After the wave-1 review (fix pass, 2026-10-15)
Amendments from the review findings (DECISIONS 53–62); where they differ from the text above, this section wins:
- §3 form: no `novalidate` on any product form (main-product, Featured product, the bare and zero-block forms). `<anvil-product-form>` runs after the browser's own validation; the commerce module marks a custom field from its `invalid` event too.
- §3 product JSON: `variants` is no longer `product.variants | json` but a trimmed list built in Liquid with exactly the fields the scripts read: `{id, title, options, price, compare_at_price, available, sku, requires_shipping, featured_image: {src} (image_url width 160) | null, quantity_rule: {min, max, increment}, unit_price, unit_ref}`. `inventory[id].qty` is the tracked quantity only when it is at or under the highest threshold of the section's Inventory and Urgency text (tracked-inventory) blocks; otherwise `null` (as for untracked variants), so the page never publishes stock levels nothing displays.
- §3 picker: every `[data-anvil-option]` control renders `disabled` and `<anvil-variant-picker>` enables them on connect, so a picker whose module never ran shows only the opening variant, the one the form posts. An option with no checked control (a value without an offer card) keeps the value of the variant the form's id input holds. With offer_card blocks, every option value no block points at still gets a generated card after them.
- §3 binds, added: `sale` / `regular` (element shown only with / without a compare-at saving), `price_state` (toggles `av-price--sale` and `av-price--sold-out`), `unit` (unit price money) and `unit_ref` (reference quantity and unit), and `stock`: the inventory and urgency lines render on the client from `inventory[id]` with `data-anvil-tpl-low|in|back|out` (empty = nothing), `data-anvil-threshold`, `[count]` replaced by the tracked quantity (in `<strong>` with `data-anvil-strong`); the bind hides its `[data-anvil-bind-box]` when there is nothing to say and writes `data-state` there (`low_stock|in_stock|backorder|sold_out`, readable by CSS like the availability bind's). The first bind pass on load leaves server money text alone.
- §3 server truth: only on the product's own page (the path after `/products/` matches the product URL); the request keeps the current URL's parameters (`?view=` included) and sets `section_id` and `variant`. Featured product (where Shopify ignores `?variant=`) relies on the client binds alone.
- §4 cart API: `opts.track === false` keeps a quiet save (order note, terms attribute) out of the stale-response sequence; it is always emitted. `swapSection` appends every `<style data-section-stylesheet>` of a Section Rendering response to `<head>` once.
- §5 gifts: the engine re-renders the sections named by `[data-anvil-cart-render]` (fallback drawer + bubble); its first run on load is skipped when every rule carries `data-anvil-cart-count="0"` and no `[data-anvil-gift-key]` line is rendered; `window.Anvil.gifts.settled()` resolves when the current run is done (the product form waits for it, up to 3 s, before opening a cart page). `main-cart-items` loads the engine when a line carries `_anvil_gift`. The drawer writes a spend rule only while its gift variant is available.
- §6 `anvil-payment-badges`: new `uid` param; `payment_type_svg_tag`'s fixed `pi-<type>` ids become `pi-<uid>-<type>` (the product block passes `block.id`, the drawer `drawer-ck` / `drawer-<block id>`, the footer prefixes `footer`). `anvil-product-card-mini`: the Add button carries `data-anvil-focus-key="mini-<product id>"`; styles in `assets/anvil-pb-commerce.css`.
- §7 drawer: line and totals CSS live in `assets/anvil-cart-drawer.css` (also loaded by `main-cart-items` and `main-cart-footer`), mini-card CSS in `assets/anvil-pb-commerce.css` (loaded by the drawer when it has an upsells block and by the complementary block): Shopify serves `{% stylesheet %}` CSS only for files rendered on the page. Cart line inputs are named `updates[<line key>]`. The recommendations list is a `<ul role="list">` filled with the response's `[data-anvil-upsell-row] > [data-anvil-product-id]` items. `aria-expanded` is written only on an explicit opener with `aria-haspopup`; the checkout button's `aria-describedby` points at the terms hint only while it is locked.
- §8 files added: `assets/anvil-pb-content.js` (`<anvil-share>`, `<anvil-scroll-links>`, `<anvil-complementary>`; ≤ 4 KB gz), loaded with a module script by the share, scroll-to and complementary blocks (no inline modules).
