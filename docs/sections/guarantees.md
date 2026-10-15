# Guarantees — `sections/anvil-guarantees.liquid`

_Section card, 2026-10-15. Wave 2. Built from `docs/agent-prompts/guarantees.md` (CONVENTIONS, spec card, chassis API, exemplars)._

## Purpose
Up to six guarantee cards. Each card has an icon (or an uploaded seal image), a title, a short text and an optional link to the store policy that backs the promise. The default shows three cards: returns, shipping and secure checkout. Spec: `docs/SPEC.md` §4.2 "Guarantee icons"; design row: `docs/DESIGN-sections.md` §3 `anvil-guarantees` (3 icon cards, local `item` ×6, columns / style, no JS, info "must match your policies"). The product landing template (SPEC §5) puts it between multicolumn and bundle. No JavaScript.

How it differs from its neighbours: `anvil-icon-bar` is a compact trust row with labels that are not headings. `anvil-icon-content` is a general card grid with buttons. Guarantees sits between them: cards with `<h3>` titles, a frame for the icon (including a seal ring), and links to Shopify's own policy pages.

## Settings
The 13 chassis settings come first, pasted verbatim from CONVENTIONS §4. Then a header "Guarantees" with five settings and a header "Icons" with three. That makes 21 settings in total (the limit is 40).

| id | type | default | what it does |
|---|---|---|---|
| `cols_mobile` | select `1` / `2` | `1` | columns below 750 px. At 2, the gap drops to `--av-space-3`, card padding to `--av-space-4`, and the icon sits above the text even in the "beside" layouts, because there is not enough room beside it. Those stacked phone cards follow `card_align` like any stacked card |
| `cols_desktop` | select `auto` / `1`–`4` | `auto` | columns at ≥ 990 px. `auto` puts 1–4 cards on one row, and 5 or 6 cards in rows of 3. It counts the cards that render: on the storefront only the cards shoppers see (an empty card is skipped), in the editor every block. Tablets (750–989 px) get `min(desktop, 3)` columns, or `min(desktop, 2)` when the icon sits beside the text, and never fewer than the phone count. All of this is computed in Liquid. The info says the tablet cap (3, or 2 beside) |
| `layout` | select `stacked` / `inline` / `inline_mobile` | `inline_mobile` | icon above the text; icon beside the text; or beside on phones and above from 750 px (compact one-column phone cards, centred cards on larger screens) |
| `card_style` | select `theme` / `flat` / `outlined` / `tinted` / `raised` | `outlined` | `theme` follows Theme settings > Cards (`settings.card_style`), like feature grid and icons with content. `outlined` draws a `max(1px, --av-border-w-card)` border in `--av-border`. `tinted` fills the card with `rgb(--av-fg-rgb / 0.05)`. `raised` (label "Shadow") puts the card on `--av-bg` with the theme's card shadow, or `--av-shadow-md` when Theme settings set the card shadow to none. `flat` has no box and no padding |
| `text_align` | text_alignment | `center` | aligns the icon and text whenever the icon sits above the text, including two-column phone cards in the beside layouts. Beside layouts always start-align |
| `icon_size` | range 20–64 px, step 4 | 28 | icon glyph size |
| `icon_style` | select `plain` / `circle` / `ring` / `solid` | `circle` | `circle`: a tinted disc 1.75× the icon (`--av-accent-rgb` at 0.12, or `--av-fg-rgb` at 0.08 with text-coloured icons). `ring` ("Seal ring"): a 2 px border plus a 1 px outline 3 px outside it, which reads as a seal. `solid`: an accent disc with an `--av-on-accent` icon (or `--av-fg` disc with an `--av-bg` icon). Discs use `border-radius: 50%`, not the merchant's pill radius. The info says a seal ring or an award icon is decoration only and must never sit under a title that suggests a certification, award or endorsement the merchant does not hold |
| `icon_color` | select `accent` / `text` | `accent` | `--av-accent` or `inherit` |

`schema.name` is "Guarantees" (10 characters). `max_blocks: 6` and the block's `limit: 6`. `disabled_on.groups: ["header", "custom.overlay"]`: the section fits templates and the footer group, but not the header or the floating-widget group.

## Blocks
Local block `item` ("Guarantee"). `{{ block.shopify_attributes }}` is on each `<li>`.

| id | type | default | note |
|---|---|---|---|
| `icon` | select (51 Lucide names plus `none`) | `shield-check` | every value exists in the `anvil-icon-*` lookup snippets (checked by script). Info: icons are decoration only; an award, medal, trophy or badge icon must not suggest a certification, award or endorsement the merchant does not hold |
| `icon_image` | image_picker | — | replaces the icon. Its info: upload only seals, logos or artwork the merchant is entitled to use, never a badge for a certification they do not hold; its alt text is read only when the card has no title or text, so anything the image says belongs in the title or text. The image skips the frame and is drawn at the frame's size (1.75 × icon size when framed), so seal artwork reads at full size |
| `heading` | text | "Example: 30-day returns" | info: must match your policies |
| `text` | richtext | `<p>Example text — replace with a guarantee your policies back up.</p>` | info: must match your policies; conditions go here |
| `link` | select `none` / `refund` / `shipping` / `privacy` / `terms` / `custom` | `none` | policies come from `shop.refund_policy`, `shop.shipping_policy`, `shop.privacy_policy` and `shop.terms_of_service` (shopify.dev `shop` and `policy` objects). A link renders only when that policy has both a URL and a body, so a store without the policy shows no dead link. Its info says this |
| `link` | url | — | used when `link` is `custom` |
| `link_label` | text | blank | blank uses the policy's own title ("Refund policy"), or `anvil.a11y.learn_more` for a custom link |

The preset "Guarantees" ships the heading "Example heading — what we **promise**" and three cards: "Example: 30-day returns" (return arrow, linked to the refund policy), "Example: tracked shipping" (truck, linked to the shipping policy) and "Example: secure checkout" (lock, no link). Every text starts with "Example text —" and tells the merchant what to replace it with. The policy links point at the store's real policies and only appear once they exist.

## Markup and behaviour
- Structure: `anvil-section-head`, then `<ul class="av-guarantees …" role="list">` holding `<li class="av-guarantees__item">` (the card). Each card holds `.av-guarantees__icon` (an SVG from `anvil-icon`, or `.av-guarantees__icon--img` with an `image_tag`) and `.av-guarantees__body` (`<h3 class="av-guarantees__title">`, `.av-guarantees__text.av-rte`, `a.av-guarantees__link`). `role="list"` keeps list semantics in Safari/VoiceOver, which drops them from lists styled `list-style: none` (MDN `list-style`, Accessibility); `anvil-base.css` resets `ul[role="list"]`.
- Heading levels: card titles are `<h3>`. Each card has a title and a paragraph, so the titles are content headings, not the short list labels of the icon bar (CONVENTIONS §3). When the section heading is blank, a visually hidden `<h2>` (`anvil.guarantees.heading`, "Guarantees") sits above the list, so the outline never jumps from `<h1>` to `<h3>`. The `<h2>` and the list render only when at least one card renders, so a storefront whose cards are all empty gets no heading over an empty list.
- Layout: flexbox with `flex-wrap` and `justify-content: center`. Each item's basis is `(100% − (cols − 1) × gap) / cols`, with the count in `--av-guarantees-cols`, set per breakpoint by `--m1/2`, `--t1/2/3` and `--d1/2/3/4`. Flexbox, not grid, so a short last row (5 cards in rows of 3) is centred. Cards in a row stretch to equal height. The gap is `--av-space-4` on phones and the theme's `--av-grid-gap` from 750 px. Card padding is `--av-space-5`, or `--av-space-6` from 990 px.
- Alignment travels as two custom properties on the list (`--av-guarantees-align`, `--av-guarantees-text`), so the "beside on phones" layout can switch back to the merchant's alignment at 750 px without a specificity chain.
- Links: the policy link's text is the policy title or the merchant's label. It is named by `aria-labelledby` (its own id, then the card title), so a generic label such as "Learn more" reads "Learn more <title>" in a links list and two cards never give identical link names; the visible label stays first (WCAG 2.5.3). Same pattern as Feature grid (integration pass). It is at least 24 px tall, underlined, and turns accent on hover. Focus uses the global `:focus-visible` ring.
- Icons are decorative (`anvil-icon` without a label is `aria-hidden`). An uploaded image gets `alt=""` while the card has words. A card with only an image uses the image's own alt. The `icon_image` info tells the merchant this (same wording as icons with content).
- Empty cards: a card with no title, no text and no image alt is skipped on the storefront and kept in the editor so it can be selected. That covers an icon-only card, an image without alt and a link-only card. In the editor such a card shows `anvil.editor.block_empty` (`p.av-guarantees__note.av-example-note`, first in the card body), so the merchant sees that shoppers get nothing for it. A pre-pass loop runs the same test to count visible cards for `auto` columns and the heading/list gate. With zero blocks, shoppers see nothing and the editor shows `anvil.editor.empty_section`.
- Images: `image_url: width: 2 × size` with `widths: "<size>, <2×size>"`, `sizes: "<size>px"`. They load eagerly in the first two sections (or when `section.index` is nil) and lazily below. They are icons, so none gets `fetchpriority`. `image_tag` writes `width`/`height` and the CSS box is fixed, so nothing shifts.
- Motion: none of its own. The chassis `reveal` setting is the only animation and it already respects reduced motion and `html[data-animations="off"]`.
- CSS: the `{% stylesheet %}` body is 4,588 bytes raw, 1,017 bytes gzipped (limit 6,144 raw). Every selector starts with `.av-guarantees`. No asset files, no JavaScript.

## Honesty notes
- `title` and `text` carry the spec's "must match your policies" info. `icon_image` warns against seals or certification badges the merchant is not entitled to. `icon_style` (seal ring) and the block's `icon` select (award, medal, trophy, badge check) say the frame and icons are decoration only and must not suggest a certification, award or endorsement the merchant does not hold. `link` explains where policies come from. CONVENTIONS §10, HONEST.md.
- There is no rating, counter, price, saving or "most popular" field, so the section cannot carry a typed number or an unbacked badge.
- Defaults read as examples ("Example: …", "Example text — …"). The preset links go to the store's own refund and shipping policies, so the claims sit next to the text that governs them, and a link only appears once that policy has text.
- No platform or payment logos ship. "Secure checkout" appears only as an example, with a text asking the merchant to describe the protection in plain words.

## Checks run (2026-10-15)
- `shopify theme check --fail-level warning` (whole theme): this file's only findings are `TranslationKeyExists` for `anvil.guarantees.heading` and `anvil.a11y.learn_more`, which the integrator adds at wave end. Every other finding in the tree (99) is the same check for other wave-2 builders' new keys.
- `scripts/chassis-lint.py --only sections/anvil-guarantees.liquid --strict`: clean. In the whole-repo run, the errors and warnings belong to other builders' files that were still in progress (`anvil-hero-slideshow`, `anvil-pricing`, `anvil-columns`).
- `scripts/cleanroom-lint.sh`, `scripts/asset-audit.py`, `scripts/check-limits.sh`: clean.
- Render check: the exact `{% stylesheet %}` body plus `assets/anvil-base.css` with mock markup, in local headless Chromium at 375, 820 and 1280 px. Four setups were tested: default (outlined, tinted circle, beside on phones, 3 cards); tinted + seal ring + left-aligned with 5 cards (3 + 2, centred last row); shadow + solid disc + beside, 4 desktop / 2 phone columns (phones stack the icon above the text); flat + plain text-colour icons + right-aligned with 6 cards. This is not a Shopify render; the harness push (G3) will be the first real one.
- Review fixes (2026-10-15, second pass): theme check again shows only the two `TranslationKeyExists` findings above for this file; chassis-lint `--only --strict`, cleanroom-lint, asset-audit and check-limits clean. Headless Chrome (500 px, its narrowest window; 820 px; 1280 px) on the fixed stylesheet: two phone columns with the beside layouts now stack centred (or end-aligned with right alignment) as `card_align` says; "beside" with two phone columns goes back to a start-aligned row from 750 px; one phone column with the beside layouts stays a start-aligned row on phones.

## Uncertainties and assumptions
- `shop.refund_policy` and the other policy properties are documented as `policy` objects; shopify.dev does not say what they return when the policy is not set (its example shows `{}`). The section checks `url` and `body` for blank, which covers nil, an empty object or an empty policy. Verify on the dev store with one policy left empty.
- `shop.subscription_policy` and the contact-information page are not offered. Add them if merchants ask.
- In the editor, `auto` counts every block (empty ones render there with the editor note), so a section with one empty card can show one more column in the editor than on the storefront. Both still follow the same one-row-of-up-to-four rule.
- The hidden `<h2>` reads "Guarantees" whatever the cards hold (same open question as feature grid's "Features").
- `settings.card_style` and `settings.card_shadow` come from Theme settings > Cards (read-only here), the same way feature grid and icons with content read them.
- Not offered: whole-card links (the policy link is the action) and `@app` blocks (app content is not plausible in a guarantee row).

## Integration pass (2026-10-15)
- Policy links are named with `aria-labelledby` (own id, then the card title), as Feature grid does; the fallback label is the shared `anvil.a11y.learn_more`.
- Placed on `templates/product.landing.json`.

## Fix pass (2026-10-15)
- Setting ids follow the theme-wide vocabulary (CONVENTIONS §5; DECISIONS 82–100); the tables above use the new ids: `card_align` → `text_align`, `title` → `heading`, `link_url` → `link`. Saved templates were migrated.
- Uses the shared pieces: card boxes from `snippets/anvil-surface` and `.av-surface` (DECISIONS 83); columns from the shared `.av-grid` rule (DECISIONS 82); eager or lazy media from `snippets/anvil-above-fold` (DECISIONS 85); the editor-only empty note from `snippets/anvil-editor-empty` (DECISIONS 87); icon frames from `.av-icon-frame` (DECISIONS 92); a hidden fallback heading through `anvil-section-head` (DECISIONS 84).
- Availability: `disabled_on` groups ["header","custom.overlay"] (CONVENTIONS §4, DECISIONS 100).
