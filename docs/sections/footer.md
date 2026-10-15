# Footer — `sections/anvil-footer.liquid`

_Section card, 2026-10-14 (fix pass). Group-only (`enabled_on.groups: ["footer"]`), reduced chassis. Spec: SPEC §2.3._

## Settings
Reduced chassis, then `show_payment_icons`, `payment_filter` (comma list of payment type names, kept in that order on one row; only enabled methods appear), `show_policies`, `show_country`, `show_language` (forms with a visible Update button), `copyright_text`.

## Blocks (max 8)
`link_list` (heading default "Shop"), `text`, `brand` (theme logo at `--av-logo-w`, the light logo on a dark scheme; text; social pills), `newsletter` (customer form; errors tied to the field with `aria-invalid`/`aria-describedby`), `image` (width, link, `link_label` so a linked image always has a name; info: upload only badges you may use), `product` (heading, product card, optional add-to-cart; loads `anvil-card.css` only when present), `collection` (heading, image + title link).

Column headings are `<h2>` so the page outline has no gap.

## Honesty notes
No platform logos ship; payment icons come from `payment_type_svg_tag`; the image block's info text covers uploaded badges.
