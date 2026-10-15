# Icon bar — `sections/anvil-icon-bar.liquid`

_Section card, 2026-10-14. Wave-0 exemplar: later section agents are shown this file and the section side by side, so it follows `docs/CONVENTIONS.md` §3–§4 to the letter._

## Purpose
A trust row: up to six short promises (icon, label, caption, optional link) under a hero or product section. Spec: `docs/SPEC.md` §4.2 "Icon bar"; design row: `docs/DESIGN-sections.md` §3 `anvil-icon-bar`. Phones show a 1–3 column grid (2 by default); desktop shows one row of all items or a fixed 2–6 columns. No JavaScript.

## Settings
Chassis first (the 13 ids from CONVENTIONS §4, pasted verbatim), then a header "Icon bar" and seven section settings:

| id | type | default | what it does |
|---|---|---|---|
| `layout` | select `stacked` / `inline` | `stacked` | icon above centred text, or icon beside start-aligned text |
| `cols_mobile` | select `1` / `2` / `3` | `2` | columns below 750 px |
| `cols_desktop` | select `auto` / `2`–`6` | `auto` | columns at ≥ 990 px; `auto` = one column per item, so every item sits on one row (clamped 1–6) |
| `icon_size` | range 20–64 px, step 4 | 32 | icon box; a custom image is requested at 2× this width and fitted with `object-fit: contain` |
| `icon_style` | select `plain` / `circle` | `plain` | `circle` puts the icon in a 1.75× tinted disc (`rgb(var(--av-accent-rgb) / 0.12)`, or `--av-fg-rgb` at 0.08 when the icon colour is "Text colour") |
| `icon_color` | select `accent` / `text` | `accent` | `--av-accent` or `inherit` |
| `dividers` | checkbox | false | 1 px `--av-border` rules between columns and rows; gap collapses to 0 and each cell gets `--av-space-4` padding |

Tablets (750–989 px) use `min(cols_desktop, 3)` columns, computed in Liquid (`at_most: 3`) rather than in CSS so `repeat()` always receives a plain integer.

## Blocks
Local block `item`, `limit: 6`, `max_blocks: 6`; `{{ block.shopify_attributes }}` is on the `<li>`.

| id | type | default | note |
|---|---|---|---|
| `icon` | select (55 names from `anvil-icon`, plus `none`) | `check-circle` | every value exists in `snippets/anvil-icon.liquid`'s table |
| `icon_image` | image_picker | — | replaces the icon; info says square works best and to upload only artwork the merchant may use |
| `label` | text | "Example: free shipping over $50" | info: state only what shipping, refund and support policies promise |
| `caption` | text | "Replace with a promise your policies back up" | info: conditions go here (for example the order value an offer needs) |
| `link` | url | — | info: link the policy page that backs the claim |

Preset "Icon bar" ships four items that read as obvious examples: free shipping over $50 (truck), 30-day returns (return arrow), secure checkout (lock), fast support (chat bubble). Each label starts with "Example:" and each caption tells the merchant what to replace it with, so an unedited publish makes no claim.

## Markup and behaviour
- `<ul class="av-icon-bar …">` → `<li class="av-icon-bar__item">` → `<a>`/`<div class="av-icon-bar__body">` → `.av-icon-bar__icon` + `.av-icon-bar__text` (`.av-icon-bar__label`, `.av-icon-bar__caption`). A list, not headings: a trust row's items are list entries, and six `<h3>`s would clutter the page outline (CONVENTIONS §3's `<h3>` rule applies to blocks that carry a heading; this block has a label).
- Column counts travel as classes `av-icon-bar--m{1-3}`, `--t{1-3}`, `--d{1-6}` that set `--av-icon-bar-cols` at each breakpoint; the icon size travels as the inline custom property `--av-icon-bar-icon` on the `<ul>` (the only per-instance value, so no `{% style %}` block).
- Dividers: every cell draws `border-top` and `border-inline-start`; `:nth-child(Nn+1)` hides the start edge of the first column and `:nth-child(-n+N)` hides the top edge of the first row, per breakpoint. Each breakpoint first resets both colours with an equal-specificity `:nth-child(n)` rule so the phone rules cannot leak into desktop. Logical properties keep RTL correct.
- Links: the whole item body becomes an `<a>` only when the item has a label or caption, so a link never ships with an empty accessible name. Hover underlines the label; focus uses the global `:focus-visible` ring. Icons are `aria-hidden` (rendered by `anvil-icon` without a `label`); a custom image gets `alt=""` while text is present and falls back to the image's own alt only when the item is icon-only.
- An item with no icon, label or caption renders an empty `<li>` so it stays selectable in the editor. With zero blocks the section renders nothing for shoppers and, in `request.design_mode`, the note `anvil.icon_bar.empty_editor_note`.
- No motion of its own; the chassis `reveal` setting is the only animation and it already respects reduced motion and `html[data-animations="off"]`.
- `disabled_on.groups: ["custom.overlay"]` keeps it out of the floating-widget group; header, footer and all templates can take it.
- Images: `image_url: width: 2 × icon_size` with `widths: "<size>, <2×size>"`, `sizes: "<size>px"`, `loading: 'lazy'`; `image_tag` writes `width`/`height`, and the CSS box is fixed, so nothing shifts on load.

## Honesty notes
- Every item setting a shopper reads (`label`, `caption`, `link`, `icon_image`) carries a one-sentence `info` saying what is honest to enter; the defaults are visibly examples (CONVENTIONS §12, HONEST.md).
- No platform logos ship; the custom-image `info` tells merchants to upload only artwork they are entitled to use.
- "Secure checkout" appears in the preset only as "Example: secure checkout" with a caption telling the merchant to describe, in plain words, what protects shoppers.

## Checks run (2026-10-14)
- `shopify theme check --fail-level warning`: 86 files, 0 offenses (whole theme).
- `scripts/chassis-lint.py --only sections/anvil-icon-bar.liquid --strict`: clean, 0 warnings. Whole-repo run: clean; the three `[W] group-only section` notices belong to header, footer and announcement bar and are expected.
- `scripts/cleanroom-lint.sh`, `scripts/asset-audit.py`, `scripts/check-limits.sh`: clean. Forbidden-token grep over this section and the locale file: empty.
- `{% stylesheet %}` body: 4,414 bytes (limit 6,144); every selector starts with `.av-icon-bar`.
- 20 section settings (13 chassis + 7), 5 block settings, schema name 8 characters.
- Render check of the exact `{% stylesheet %}` body with mock markup in a local headless Chromium at 375, 768 and 1280 px viewports (stacked + dividers with 5 items: one row on desktop, 3+2 on tablet, 2+2+1 on phones, first column and first row rules hidden; inline + circle; inline + text-colour icons with 6 items; empty state). Not a Shopify render — the harness push (G3) is the first real one.

## Uncertainties and assumptions
- Locale key added under `anvil.icon_bar.empty_editor_note` in `locales/en.default.json` (the brief allowed this key family; CONVENTIONS §1 otherwise keeps locale files read-only during a wave). If the integrator prefers an existing `anvil.editor.*` key, swap the `t` call.
- `disabled_on.groups` with a `custom.<name>` value follows shopify.dev's documented accepted values; verify in the editor that the Overlay group's "Add section" list omits the icon bar.
- The `auto` desktop count is computed from `section.blocks.size`, so a hidden (disabled) block still counts toward the column number in the editor until it is removed; Shopify excludes disabled blocks from `section.blocks` on the storefront, so the live site is right. Confirm the editor behaviour during the G3 push.
- No `@app` block: app content is not plausible in a trust row (DESIGN-sections §2 asks for `@app` only where it is).
- Not verified against a real Shopify render yet: `image_tag` with `alt: ''` on a custom icon (same pattern as `blocks/anvil-icon-text.liquid`, which passed theme check), and the `{% stylesheet %}` per-page subsetting noted as a wave-0 check in `docs/DESIGN-sections.md`.
