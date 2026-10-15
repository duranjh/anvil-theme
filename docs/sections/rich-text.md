# `anvil-rich-text` — Rich text (section card)

_Wave-2 standard section. File `sections/anvil-rich-text.liquid`, editor name "Rich text". Spec: `docs/spec/rich-text.md`; `docs/DESIGN-sections.md` §3 "Standard sections" (`anvil-rich-text`, `@theme`, ~140 lines). Contract: `docs/CONVENTIONS.md` §3–§4._

## Purpose
A centred column of content: the chassis heading and subheading, then theme blocks (headings, text, buttons, rating badges, a countdown, spacers, dividers, images, text with icon, groups and add-to-cart) and app blocks. The merchant arranges the blocks in the editor; the section sets how wide the column is, where it sits, how it aligns and how much space separates the blocks. The section has no JavaScript and no asset files of its own: its CSS is 568 bytes raw (279 B gzipped) in its `{% stylesheet %}`. Assets the blocks need are the blocks' job. The countdown block loads `anvil-countdown.js` itself. The Add to cart block does **not** load `anvil-product.js` yet (see open question 2), so on a page with no other product form its button posts natively to `/cart/add`.

## Markup (shopper view)
```
div#anchor.av-section.av-scheme--… .av-s-anvil-rich-text      ← anvil-section-attrs
  div.av-section__inner
    div.av-rich-text.av-rich-text--narrow|page.av-rich-text--left|center|right
      .av-section-head (h2 + subheading)                       ← anvil-section-head, only when set
      div.av-rich-text__blocks  style="--av-rich-text-gap: Npx"
        p.av-rich-text__empty.av-example-note                  ← editor only, when the section has no blocks
        {% content_for 'blocks' %}                             ← theme blocks (tag: null, so each block's own
                                                                  root is a direct child) and app blocks
```
The column (`.av-rich-text`) holds the chassis heading as well as the blocks, so the heading shares the column's width and position. A long heading never runs wider than the 800 px text below it. The heading keeps its own chassis `head_align`.

The block list (`.av-rich-text__blocks`) is a one-column CSS grid, so `gap` spaces the blocks. Grid items stretch by default, so a block's root is as wide as the column unless the block gives itself a width. Grid items are also blockified, so an `inline-flex` root becomes `flex` and stretches too (see open question 3 for the pill). Grid children get `min-width: 0` so a long word or a wide image cannot push the column wider than the screen.

Heading level: the section heading is the chassis `h2` (CONVENTIONS §3), and the preset fills it in. Heading blocks that a merchant adds are content headings and should be `h3`. The block's default is `h2` and its `info` covers the one-`h1` rule. That default belongs to the block owner (open question 4).

## Settings
The 13 chassis settings come first, verbatim (CONVENTIONS §4). Then, under the "Rich text" header:

| id | type | default | effect |
|---|---|---|---|
| `content_width` | select `narrow` / `page` | `narrow` | `narrow` caps the column at `--av-narrow-width` (800 px) for comfortable line lengths. `page` lets it fill the section container. The chassis `width` still decides that container: page width, narrow or full width |
| `text_align` | text_alignment | `center` | places the column inside the container (visible when the column is narrower than the container) and sets the alignment that blocks without their own alignment follow: `text-align` (inherited) and `--av-justify` (`flex-start` / `center` / `flex-end`) for flex rows. App blocks follow it today. Theme blocks follow it once they have a "Same as section" alignment (open question 1); until then each theme block uses its own Left / Centre / Right setting. The `info` is written to be true in both states |
| `gap` | range 0–64 px, step 4 | 24 | space between blocks (`--av-rich-text-gap`, inline on the block list). A Spacer block adds its height on top of the two gaps around it; a Divider adds its own "space above and below" |

16 non-header settings in total (13 chassis + 3). `content_width` and `align` are the two settings the spec card names. `gap` was added because the theme blocks carry no outer margins, and without it a heading, a text and a button would touch.

## Blocks
`"blocks": [{ "type": "@theme" }, { "type": "@app" }]`, rendered with `{% content_for 'blocks' %}`, which renders app blocks as well (shopify.dev, App blocks: "This tag handles block rendering, including app blocks"). No local blocks: Shopify does not allow a section to mix local blocks with `@theme`. `@theme` accepts every public theme block in `blocks/`, which today are the twelve the spec card lists (anvil-heading, anvil-text, anvil-button, anvil-stars, anvil-review-stars, anvil-countdown, anvil-spacer, anvil-divider, anvil-image, anvil-icon-text, anvil-group, anvil-product-atc). Blocks print their own `{{ block.shopify_attributes }}`. No `max_blocks`, so Shopify's default limit applies.

Preset "Rich text" (spec: a heading, a text and a button):
- Section settings: heading "Example heading — say what **matters** to your shoppers", `head_align` centre. It renders as the chassis `h2`, so the preset has exactly one heading and filling in the chassis field cannot stack a second `h2`.
- Text block: "Example text — replace it with a few sentences about your store, your product or this page. Only state things that are true for your store." Alignment centre.
- Button block: "Shop all products" linking to `/collections/all` (the one URL default Shopify accepts besides `/collections`), primary, alignment centre. It is a real link, not a claim, so it does not need "Example" wording, and it is never a dead `<button>`.

The two blocks carry `"align": "center"` because the theme blocks' alignment still defaults to `left`. Once the blocks get a "Same as section" default (open question 1), drop `align` from both preset blocks so they follow the section's `align`.

`disabled_on.groups: ["header", "custom.overlay"]`: the section belongs in templates, and the footer group may use it for a text strip above the footer.

## Behaviour
- **Without JS:** everything the section renders works without JS. Blocks with scripts follow their own rules. The countdown loads its script. The Add to cart button always submits the native product form to `/cart/add`, which redirects to the cart, until open question 2 is fixed.
- **Keyboard:** only the blocks' own controls (links, buttons) are focusable; the global `:focus-visible` ring applies.
- **Reduced motion:** nothing animates here. Reveal on scroll comes from the chassis (`av-reveal--*`, only from the third section on, only when motion is allowed).
- **No content:** with no blocks, no heading and no subheading, the storefront renders nothing for the section: no root, no scheme background, no padding. Only Shopify's own empty `shopify-section` wrapper is left. In the editor (`request.design_mode`) the section still renders, and the shared note `anvil.editor.empty_section` ("Add blocks to show content here.") appears in a dashed box. A section with a heading or subheading but no blocks renders the heading.
- **Editor:** block selection, reordering and adding go through Shopify's theme-block handling; the section needs no `shopify:*` handlers.

## Honesty notes
- The preset heading and text read as examples ("Example heading —", "Example text —") and the text tells the merchant to state only what is true for their store.
- The section itself prints no claims, numbers, ratings, timers or badges. The rating, review-platform and countdown blocks carry their own honesty rules (source link required, real end date only) and `info` texts; the section passes nothing to them.
- No setting here can mislead, so no honesty `info` was needed; the `align` `info` explains a behaviour, not a claim.

## Styling decisions
- All selectors start with `.av-rich-text`. Tokens only: `--av-narrow-width`, `--av-space-5`, `--av-border`, `--av-radius-card`.
- Alignment uses physical `left` / `right` (margins and `text-align`) to match the `text_alignment` values and the theme blocks, which also use physical `left` / `right`.
- The section never overrides a block's alignment classes, so a block the merchant set to Left stays left. Its alignment reaches blocks only through inheritance: `text-align`, and the `--av-justify` custom property that flex-based blocks read as `justify-content: var(--av-justify, flex-start)` when their alignment is "Same as section".
- The pill look of "Icon with text" and the stretch of other inline-looking blocks are the blocks' own CSS (CONVENTIONS §3: do not restyle components). The section does not set `justify-items`, because that would shrink full-width blocks such as dividers and full-width buttons.

## Locale keys
None new. Uses the existing shared key `anvil.editor.empty_section` (editor only).

## Contract assumptions
- `section.blocks` lists the section's top-level theme and app blocks. Two checks rely on it: `section.blocks.size == 0` for the editor note, and `section.blocks.size > 0` in the storefront "render anything?" test. shopify.dev's object page documents `section.blocks` only as "The blocks of the section". The theme-blocks guide (Static blocks, "Conditional rendering") uses `section.blocks.size` in a section that renders `{% content_for "blocks" %}`, so theme blocks are counted. App blocks have always appeared in `section.blocks` as type `@app`.
- `{% content_for 'blocks' %}` sits inside `{% if has_content %}`. shopify.dev says dynamically rendered blocks "Cannot be rendered conditionally or in a for-loop", which is about showing or hiding individual merchant blocks. Here the condition is always true in the editor and always true when any block exists. It is false only when there is nothing to render, so the editor's block handling never sees a missing `content_for`.
- Every theme block uses `"tag": null` (checked in `blocks/*.liquid`), so the block roots are the grid items. A future theme block without `tag: null` is wrapped by Shopify in a `div`, which still stretches to the column.
- `anvil-section-attrs` and `anvil-section-head` per CONVENTIONS §5; `.av-example-note` from `anvil-base.css`. The section head sits inside the column wrapper instead of directly in `.av-section__inner`. chassis-lint checks only that it is rendered, and the snippet carries its own margins.

## Open questions (for block owners and the integrator; outside this section's files)
1. **Theme blocks need a "Same as section" alignment (review major).** The spec says the merchant sets the alignment, but every theme block's `align` is a `text_alignment` defaulting to `left` and always emits a `--left|center|right` class. The section's `align` therefore cannot reach theme blocks: Left or Right moves the column while the preset blocks stay centred, and a newly added block starts left-aligned under a centred section. Fix (block owners): in anvil-heading, anvil-text, anvil-button, anvil-stars, anvil-review-stars, anvil-countdown, anvil-icon-text, anvil-product-atc, anvil-group, and also anvil-image and anvil-divider, replace the setting with `{ "type": "select", "id": "align", "label": "Alignment", "options": [{"value":"inherit","label":"Same as section"},{"value":"left","label":"Left"},{"value":"center","label":"Centre"},{"value":"right","label":"Right"}], "default": "inherit" }`. `inherit` emits no alignment class. Text blocks then inherit `text-align`, and flex blocks use `justify-content: var(--av-justify, flex-start)` (or `align-items` for the column-direction `.av-atc`). Width-capped blocks (anvil-text narrow/medium, the icon-text pill, anvil-image) also need their inline margins for `inherit`. anvil-group should set `--av-justify` for its own children when its alignment is explicit, so the section's value does not leak through. This section already sets `text-align` and `--av-justify` on the column. After the change, the integrator removes `"align": "center"` from the two preset blocks in `sections/anvil-rich-text.liquid` so the preset follows the section.
2. **Add to cart in this section posts natively (review major).** `blocks/anvil-product-atc.liquid` never loads `assets/anvil-product.js`. Where the script is on the page anyway, `<anvil-product-form>` still cannot find its form: it wraps the `<form>`, has no `form-id`, and `assets/anvil-product.js:297` looks only at `this.closest('form')` (the element and its ancestors) or `form-id`. Fix (block / product.js owner): change line 297 to `this.form = this.closest('form') || this.querySelector('form') || document.getElementById(this.getAttribute('form-id'));`, which also fixes `snippets/anvil-product-card.liquid:155` and `sections/anvil-image-text.liquid:247`, or write `<anvil-product-form form-id="{{ form_id }}">` in the block. Also add `<script type="module" src="{{ 'anvil-product.js' | asset_url }}"></script>` inside the block's `{%- if p != blank -%}` branch, as the countdown block does with its script.
3. **"Icon with text" pill stretches to the column (review minor).** As a grid item, `.av-icon-text--pill{display:inline-flex}` is blockified and stretched, so the pill becomes a full-width grey bar. Fix (block owner, `blocks/anvil-icon-text.liquid`): `.av-icon-text--pill{width:fit-content;max-width:100%}`, `.av-icon-text--pill.av-icon-text--center{margin-inline:auto}`, `.av-icon-text--pill.av-icon-text--right{margin-inline-start:auto}`. The same pattern applies to any `inherit` value from question 1.
4. **Heading block default level.** CONVENTIONS §3 makes block headings `h3` under the chassis `h2`. `blocks/anvil-heading.liquid` defaults `tag` to `h2`, so a Heading block added here starts as a second `h2`. Option for the block owner: default to `h3`. The preset no longer uses a Heading block, so this only affects blocks merchants add.
5. **Spacer inside the gap.** A Spacer block adds its height plus two gaps. Merchants who want exact spacing can set `gap` to 0 and use Spacers; the `gap` label does not explain this. Worth a sentence in the merchant guide rather than an `info`.
6. **Heading alignment is separate.** The chassis heading follows `head_align`, not `align`. A merchant who sets Content alignment to Left also sets Heading alignment to Left. Both are chassis-standard and the heading sits in the same column, so the two line up once both are set.

## Integration pass (2026-10-15)
- The icon-text pill keeps its content width (`blocks/anvil-icon-text.liquid`), and Add to cart blocks bind to `anvil-product.js`. Not done: an "inherit" alignment for every theme block (11 blocks; left for v1.1) and an `h3` default for the Heading block (it is the main heading in rich text and hero slides).

## Fix pass (2026-10-15)
- Setting ids follow the theme-wide vocabulary (CONVENTIONS §5; DECISIONS 82–100); the tables above use the new ids: `align` → `text_align`. Saved templates were migrated.
- Uses the shared pieces: the editor-only empty note from `snippets/anvil-editor-empty` (DECISIONS 87).
- Availability: `disabled_on` groups ["header","custom.overlay"] (CONVENTIONS §4, DECISIONS 100).
