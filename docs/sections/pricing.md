# Pricing table — `sections/anvil-pricing.liquid`

_Section card, 2026-10-15. Wave 5. Built from `docs/agent-prompts/pricing.md` (CONVENTIONS, spec card, chassis API, exemplars). Review fixes applied the same day (see "Review fixes")._

## Purpose
A row of plan cards: each plan has a name, a one-line description, a price (from a linked product, or typed), an optional badge, feature rows and one button. One plan can be highlighted. Spec: `docs/SPEC.md` §4.2 "Pricing table" (plans with name, price or linked product, badge, feature rows, button; highlighted plan; columns); design row: `docs/DESIGN-sections.md` §3 `anvil-pricing` (T: `_anvil-plan` → `@theme` rows; highlight plan, columns; no JS; price from product when linked). Phones stack the cards or show a swipe row; tablets show up to 2 columns; desktop 1–4. No section JavaScript.

## Files
| file | role |
|---|---|
| `sections/anvil-pricing.liquid` | chassis, the row of plans (`{% content_for 'blocks' %}`), column and phone layout CSS |
| `blocks/_anvil-pricing-plan.liquid` | private theme block: one plan card; accepts `_anvil-pricing-feature`, `@theme` and `@app` children |
| `blocks/_anvil-pricing-feature.liquid` | private theme block: one feature row (included / not included / no marker) |

The spec card names the plan block `_anvil-plan`; the wave's allowed paths are `blocks/_anvil-pricing-*.liquid`, so it is `_anvil-pricing-plan`. The feature row block is an addition (see "Uncertainties").

## Section settings
The 13 chassis settings come first, pasted verbatim from CONVENTIONS §4. Then a header "Pricing table" with 7 settings (20 settings in total; the limit is 40).

| id | type | default | what it does |
|---|---|---|---|
| `cols_desktop` | select `auto` / `2` / `3` / `4` | `auto` | columns at ≥ 990 px; `auto` = one row matching the plan count, capped at 4. Tablets (750–989 px) show `min(columns, 2)`. A short last row is centred (flex-wrap) |
| `mobile_layout` | select `stack` / `swipe` | `stack` | below 750 px: stacked cards, or a native scroll-snap row where the next card peeks in (85 %, at most 22 rem). Ignored with a single plan |
| `card_style` | select `outlined` / `tinted` / `raised` | `outlined` | border in `--av-border`; fill `rgb(--av-fg-rgb / 0.05)`; or `--av-bg` with `--av-shadow-md` |
| `text_align` | select `left` / `center` | `left` | aligns name, badge, description, price and button. Feature rows stay start-aligned so their marks line up; other theme blocks keep their own alignment setting |
| `highlight` | select `none` / `1`–`6` | `2` | the plan at that position gets its card border in `--av-accent` (same width as the other cards, so nothing shifts), a 1 px `--av-accent` ring outside it, `--av-shadow-md` and the scheme below. Only the first six plans can be highlighted; a 7th or later plan cannot be picked |
| `highlight_scheme` | color_scheme | `scheme-1` | colour scheme class on the highlighted card; picking the section's own scheme leaves only the border |
| `button_style` | select `auto` / `primary` / `secondary` | `auto` | `auto` = solid button on the highlighted plan, outline on the others |

`schema.name` "Pricing table" (13 characters), no `max_blocks`, `disabled_on.groups: ["*"]` (a template section). The section's `blocks` array names only `_anvil-pricing-plan`, so the row can hold nothing but plans (that keeps `role="list"` valid).

**No `max_blocks`.** It is left out for the same reason as in `anvil-columns` and `anvil-hero-slideshow` (`docs/sections/columns.md`, open question 1): shopify.dev says a section holds at most 50 blocks, which `max_blocks` can lower, and does not say whether nested theme blocks count. If they count, the earlier `max_blocks: 6` would have made the preset (3 plans + 9 feature rows = 12 blocks) invalid and left no room for one more feature row. The default limit of 50 applies instead. The `highlight` select still stops at the 6th plan. See open question 1 below.

## Plan block (`_anvil-pricing-plan`)
`"tag": null`; the card root prints `{{ block.shopify_attributes }}`.

| id | type | default | note |
|---|---|---|---|
| `title` | text | "Example plan — replace me" | `<h3>` |
| `summary` | text | "Example: say in one line who this plan is for" | `info`: describe only what the plan really is; no prices, savings or "was" amounts |
| `product` | product | — | when set: price, compare-at and saving from Shopify, product page or add-to-cart for the button, and `closest.product` for child blocks. `info` also asks the merchant to update the price note to match how the product is billed |
| `price` | text | "$19" | shown only without a product; `info`: type the real price, no "was" amount |
| `price_note` | text | — | after the price; `info`: must match how the merchant bills. No setting default: a linked one-time product must not inherit "per month (example price)". The section preset types that note for its three example plans. In the editor, a plan with a linked product whose note still says "example price" shows `anvil.editor.pricing_note_example` |
| `show_compare` | checkbox | true | passes `show_compare` and `show_badge` to `anvil-price` |
| `badge` | text | — | shown only with the box below ticked; `info`: a label such as Most popular, never a saving or discount amount |
| `badge_backed_by_sales` | checkbox | false | "Badge is backed by sales data" (same wording as the offer card) |
| `button_label` | text | "Choose this plan" | |
| `button_action` | select `auto` / `cart` / `link` | `auto` | see "Button" |
| `button_url` | url | — | used without a product, or always with `link` |

Children: `_anvil-pricing-feature`, any `@theme` block (heading, text, icon with text, stars, product add-to-cart, divider …) and `@app`. The block preset "Plan" brings three feature rows.

## Feature row block (`_anvil-pricing-feature`)
`"tag": null`. `text` (inline_richtext, default "Example feature — replace with something this plan includes", `info` on honest claims, including "Do not type savings or 'was' prices") and `state` (`included` check mark / `excluded` cross with muted text / `plain` no marker). Renders `<p class="av-pricing-feature …">`; the icon is decorative (`anvil-icon`, `aria-hidden`) and a visually hidden "Included:" / "Not included:" precedes the words, so the meaning never rests on the icon or its colour (WCAG 1.3.1, 1.4.1). A row with blank text renders nothing on the storefront and `anvil.editor.block_empty` in the editor.

## Markup and behaviour
- Structure: a visually hidden `<h2>` (`anvil.pricing.heading`) when the heading is blank and plans exist, so plan `<h3>`s never skip a level (CONVENTIONS §3). It comes before `anvil-section-head`, so a subheading shown without a heading follows its section heading instead of preceding it. Then `<div class="av-pricing av-pricing--t… --d… --<card_style> --<card_align> [--swipe]" role="list">` holding the plans (`role="listitem"`), so screen readers announce "list, 3 items".
- Plan card: `.av-pricing-plan__head` (title, badge, summary, price, editor note), `.av-pricing-plan__rows` (the child blocks, with a divider above; hidden when empty), `.av-pricing-plan__action` (`margin-top: auto`, so buttons line up at the bottom of a row of equal-height cards). The badge follows the `<h3>` in the DOM (heading navigation reaches the name first) and is drawn above it with `order: -1`.
- Highlight: the plan walks `section.blocks` to find its own position (theme blocks can read the section object, shopify.dev "Theme blocks") and compares it with `highlight`. Highlight is visual only; it writes no words.
- Price: a linked product renders `anvil-price` (`size: 'lg'`): "From" when variant prices differ, compare-at strike-through and saving only from `compare_at_price`, sold-out styling, unit price. The typed price reuses the `.av-price .av-price--lg .av-price__current` classes (with the visually hidden "Price" label from `anvil.price.price`), so linked and typed plans look the same on one page. The price is not enlarged beyond the component's `lg` size, to avoid restyling a shared component.
- Button (`anvil-button`, full width; the visible label is followed by a visually hidden ": <plan name>", so three "Choose this plan" buttons have distinct names while the visible words stay first, WCAG 2.4.4 / 2.5.3):
  - `auto`: linked product → its page; otherwise `button_url`.
  - `cart`: linked single-variant product that does not require a selling plan → `{% form 'product' %}` with hidden `id` and `quantity` inputs inside `<anvil-product-form form-id="av-pricing-form-<section id>-<block id>">` (block ids are unique only within a section, so the section id keeps two pricing sections with the same block keys from sharing a form id); it posts natively without JavaScript and `assets/anvil-product.js` (module script, loaded only when a form renders) turns it into a drawer add with error (`data-anvil-form-error`, `role="alert"`) and status (`data-anvil-form-status`) regions. Sold out → disabled "Sold out" button, also followed by the visually hidden ": <plan name>", so several sold-out plans are told apart. A product with options, or one sold only through a selling plan → its page, labelled `anvil.product.choose_options`.
  - `link`: always `button_url`.
  - No destination, or a blank label → no button.
- Child blocks get the linked product as `closest.product` (`{% content_for 'blocks', closest.product: p %}`; a second branch without the parameter when no product is linked, because a nil product would be the wrong resource type). A product add-to-cart or stars block inside the plan therefore uses the plan's product.
- Phones, swipe: the list sits in `<div class="av-pricing__scroller" tabindex="0" role="region" aria-label="Plans">` (label from `anvil.pricing.heading`). The wrapper carries `overflow-x: auto`, `scroll-snap-type: x mandatory`, `overscroll-behavior-x: contain`, the bleed to the screen edges and `scroll-padding-inline` equal to the gutter; the inner `role="list"` keeps flex `nowrap`. Because the scroller itself takes focus, keyboard users can scroll it with the arrow keys even when no plan has a button (WCAG 2.1.1; axe `scrollable-region-focusable`). Its focus ring is drawn inside (`outline-offset: -2px`), since the wrapper touches the screen edges. From 750 px the wrapper stops scrolling and the cards wrap. It keeps its `tabindex`, because markup cannot change by viewport without script, so keyboard users meet one extra tab stop (a named region) on tablets and desktops in swipe mode only. The wrapper is rendered only in swipe mode with two or more plans.
- Width: cards are capped at 30 rem, so one or two plans on a wide page do not stretch.
- Empty section: the shopper sees nothing (the row has `:not(:has(> *)) { display: none }`); the editor shows `anvil.editor.empty_section`. The plan's rows area uses the same rule rather than `:empty`, because theme block files print whitespace (for example the newline between `{% endstylesheet %}` and `{% schema %}`) even when a feature row with blank text prints no element, and `:empty` does not match an element that holds whitespace. `:has()` is Baseline widely available since December 2023 (MDN).
- Motion: none of its own; the chassis `reveal` respects reduced motion.
- CSS: section 1,496 B raw / 586 B gz; plan block 1,949 B / 597 B; feature block 530 B / 255 B (each `{% stylesheet %}` limit 6,144 raw). Block CSS lives in the block files because Shopify serves `{% stylesheet %}` only for files rendered on the page. No asset files, no JavaScript of its own.

## Honesty notes
- Prices come from Shopify when a product is linked; savings appear only from `compare_at_price` (via `anvil-price`). There is no field for a "was" price, a saving or a discount percentage. The typed price and the price note each carry an `info` saying they must match what and how the merchant charges.
- The badge shows only when "Badge is backed by sales data" is ticked; the preset's "Most popular" badge ships unticked, so an unedited store shows no popularity claim, and the editor says the badge is hidden (`anvil.editor.pricing_badge_hidden`).
- The highlight adds no text; its `info` says a "Most popular" claim needs the badge and its box.
- Defaults read as examples ("Example plan — …", "Example feature — …"; the section preset's notes say "per month (example price)"). Preset buttons go to `/collections/all` until the merchant links products. The price note has no setting default, so a newly added plan never labels a real Shopify price "per month (example price)"; when a linked plan still carries that example note, the editor says to update it (`anvil.editor.pricing_note_example`).
- Feature text and the plan description carry `info` on claims that must match the store's policies. The description, feature text and badge `info` each say not to type savings, "was" prices or discount amounts (docs/HONEST.md bans a manual "you save"; the offer card uses the same wording).

## Checks run (2026-10-15, after the review fixes)
- `shopify theme check --fail-level warning` (whole theme): the only findings in these three files are `TranslationKeyExists` for the five new keys listed below (`anvil.pricing.heading` is reported twice: the hidden h2 and the scroller label). Every other finding in the tree (183 at this run) is in other builders' files.
- `scripts/cleanroom-lint.sh`, `scripts/asset-audit.py`, `scripts/check-limits.sh`: clean.
- `scripts/chassis-lint.py`: one error and, now that `max_blocks` is gone, one warning on this section ("local blocks declared but no loop renders them", "local blocks without `max_blocks`"; under `--strict` both are errors). `sections/anvil-columns.liquid` reports exactly the same pair. Both block files pass `--strict`. The error is a false positive: the lint counts every block type that does not start with `@` as a local block, and a private theme block named in `blocks` (here `_anvil-pricing-plan`) must be rendered with `content_for`, never a loop. In the first build run, a patched copy of the lint (a type with a file in `blocks/` counts as a theme block, so the `content_for` check applies) run from outside the repo found the whole repo clean and these three files clean under `--strict`; it was not re-run after the review fixes.
- Render check: the three `{% stylesheet %}` bodies plus `assets/anvil-base.css` with mock markup in local headless Chromium at 375 and 1280 px (outlined 3 columns left-aligned with a dark highlighted plan; tinted, centred, swipe row; shadow 4 columns with 5 plans). Re-run after the fixes for the swipe scroller: at 375 px the wrapper scrolls (`overflow-x: auto`, `x mandatory`, scroll width 939 px in a 375 px box); at 1280 px it is `overflow: visible`, no snap, and the cards wrap. A rows area holding only whitespace computes to `display: none`, as does an empty row. The highlighted card keeps the 1 px card border and adds the 1 px accent ring. Not a Shopify render; the harness push (G3) will be the first real one.
- `npm run gate -- pricing` was not run as a whole: its paths gate shells out to git, which this wave's rules forbid; the static gates were run one by one as above.

## Locale keys for the integrator
- `anvil.pricing.heading` = "Plans"
- `anvil.pricing.included_prefix` = "Included:"
- `anvil.pricing.excluded_prefix` = "Not included:"
- `anvil.editor.pricing_badge_hidden` = "Badge hidden from shoppers: tick “Badge is backed by sales data” in this plan to show it."
- `anvil.editor.pricing_note_example` = "This plan's price now comes from the linked product. Update the price note so it matches how this product is billed."

## Open questions
1. **`max_blocks` and nested blocks** (same question as `docs/sections/columns.md` open question 1). Can someone confirm in the theme editor whether nested theme blocks (here the feature rows inside each plan) count toward a section's block limit? If only top-level blocks count, `"max_blocks": 6` can return, matching the `highlight` select's 1–6. Until then the section has no cap, and plans past the 6th cannot be highlighted.
2. **chassis-lint and private theme blocks.** `scripts/chassis-lint.py` `check_blocks` treats `_anvil-pricing-plan` as a local block. Suggested integrator fix (same as columns and hero-slideshow): treat a type that starts with `_`, or that has a file `blocks/<type>.liquid`, as a theme block; require `{% content_for 'blocks' %}` for it, and skip the loop and `max_blocks` checks. No change to this section.

## Review fixes (2026-10-15)
- `max_blocks: 6` removed (see "No `max_blocks`" and open question 1).
- Fallback `<h2>` moved above `anvil-section-head`.
- Swipe row: focusable, named scroll region around the list.
- `info` on the description, badge and feature text: no savings, "was" prices or discount amounts.
- `price_note` default removed; product `info` asks for a matching note; editor note when a linked plan keeps the example note.
- Form id includes the section id.
- Sold-out button keeps the hidden plan name.
- Highlight: accent border colour at the card's own width plus a 1 px ring, instead of a fixed 2 px border.
- `:empty` replaced with `:not(:has(> *))` on the row and the rows area.

## Uncertainties and assumptions
- Feature row block: the spec card says "@theme rows". The general "Icon with text" block has no cross icon and no hidden "not included" wording, so a "not included" row could not be expressed accessibly with primitives alone. `_anvil-pricing-feature` adds it; plans still accept every `@theme` block. Owner call whether a second private block is in scope.
- Highlight is set on the section by position (the spec lists "highlighted plan" next to the plans). Reordering plans moves the highlight to whichever plan takes that position. A per-plan checkbox would be the alternative.
- `section.blocks` read from inside a theme block, and `content_for 'blocks', closest.product:`, follow shopify.dev and pass Theme Check, but have not been rendered on a store yet.
- A product sold only through selling plans: the card shows the variant price from `anvil-price`, which may differ from the subscription charge; the button opens the product page. Merchants who sell plans as subscriptions may prefer a typed price that matches the subscription.
- The typed price default "$19" uses a dollar sign whatever the store currency; it sits next to "(example price)".
- `<anvil-product-form>` is given `form-id`, because `ProductForm.connectedCallback` resolves its form with `this.closest('form')` or `getElementById(form-id)`; an element that wraps the form without `form-id` (as in `blocks/anvil-product-atc.liquid`, `snippets/anvil-product-card.liquid` and `sections/anvil-image-text.liquid`) finds neither and the form falls back to a native post. Reported to the integrator; not changed here (read-only files).

## Integration pass (2026-10-15)
- chassis-lint recognises the private plan block; `anvil-product-card` and the Add to cart block now pass `form-id` like this section's plans.

## Fix pass (2026-10-15)
- Setting ids follow the theme-wide vocabulary (CONVENTIONS §5; DECISIONS 82–100); the tables above use the new ids: `columns` → `cols_desktop`, `card_align` → `text_align`. Saved templates were migrated.
- Uses the shared pieces: columns from the shared `.av-grid` rule (DECISIONS 82); slider attributes, peek, arrows and dots per width from `snippets/anvil-slider-attrs` (DECISIONS 89); the editor-only empty note from `snippets/anvil-editor-empty` (DECISIONS 87); a hidden fallback heading through `anvil-section-head` (DECISIONS 84).
- Availability: `disabled_on` groups ["header","custom.overlay"] (CONVENTIONS §4, DECISIONS 100).
