# Theme colours preview — `sections/anvil-palette-preview.liquid`

_Section card, 2026-10-15 (wave 5; review fixes applied the same day). Built from `docs/agent-prompts/palette-preview.md` (CONVENTIONS, spec card, chassis API, exemplars), `docs/HONEST.md`, `docs/DECISIONS.md` and shopify.dev only. Spec: SPEC §4.2 "Theme colours preview", DESIGN-sections §3 `anvil-palette-preview`. Script: `assets/anvil-palette-preview.js` (`<anvil-palette-preview>`). CSS: `assets/anvil-palette-preview.css` (editor only, see Behaviour)._

## Purpose
A merchant tool that lists every colour scheme from Theme settings > Colors, with a painted preview and the WCAG 2 contrast ratio of each colour pair the theme draws (see the table below for the exact list). It appears only in the theme editor. It replaces a shopper-facing "colour changer": the real way to change the store's look for everyone is to edit the schemes or switch the theme style (Anvil ships "Anvil" and "Anvil Dark").

## Settings
The 13 chassis settings first (CONVENTIONS §4, pasted verbatim), then a header "Theme colours preview" and one `paragraph` (no id). The paragraph says that only the merchant sees the section's content, in the editor, and that Shopify still adds an empty section wrapper on the live store, so the section belongs at the bottom of the template or should be removed before publishing (see Behaviour). The spec card lists no settings beyond the chassis, so there are none.

- Schema: name "Theme colours preview" (21 characters), `limit: 1` (one per template is enough), `disabled_on.groups: ["*"]` (templates only; it makes no sense in the header, footer or overlay groups).
- Preset "Theme colours preview" with `heading: "Colour schemes"`. With a blank heading, a visually hidden `<h2>` (`anvil.palette_preview.title`) keeps the outline: scheme cards are `<h3>`. The hidden `<h2>` is printed before `anvil-section-head`, so a subheading never comes before it in reading order.
- No blocks.

## What it shows
For each scheme in `settings.color_schemes`, in order, one card (`<li>`):
- **Head:** "Scheme N" (`<h3>`, N = position in the list), the scheme id in `<code>`, and tags when the scheme is the page scheme (`settings.body_color_scheme`) or the product card scheme (`settings.card_color_scheme`).
- **Preview panel** (`aria-hidden`, painted with `.av-scheme .av-scheme--<id>` so every token is that scheme's): "Aa" in the heading font, body text, muted text, a link, a primary and a secondary button (the real `.av-btn` classes on `<span>`s), an accent chip (the real `.av-badge.av-badge--accent`) and an empty field (the real `.av-field__input` on a `<div>`, so its fill, `--av-input-border` edge and `--av-shadow-input` all show). The panel has `pointer-events: none`, so the sample buttons show no pointer and no hover change: they look like the theme's buttons but do not pretend to be controls. A background gradient paints here too.
- **Swatches:** a `<dl>` of the nine scheme colours (background, text, muted text, borders, accent, text on accent, button background, button text, button border) with a chip and the value as stored.
- **Gradient note** when the scheme has a background gradient: the ratios use the solid background colour; check text over the gradient by eye.
- **Contrast table** (`<table>`, visually hidden caption, `th scope`): pair, ratio, result, nine rows (ten with the outline hover):

| Row | Colours | Threshold |
|---|---|---|
| Text on background | text / background | text: 4.5 AA, 7 AAA, 3 large text only |
| Muted text on background | text_muted / background | text |
| Links and focus ring on background | accent / background | text (links are text; 4.5 also covers the 3:1 a focus ring needs) |
| Text on accent | on_accent / accent | text |
| Button text on button | button_text / button | text |
| Button colour as hover text (outline style) | button / background; only when Theme settings > Buttons > hover is "outline" (`.av-btn-hover--outline` paints a hovered primary button's text in the button colour on a transparent fill) | text |
| Field borders on background | text mixed 50 % with background (`color_mix` of the solid colours: the edge `--av-input-border` paints over the field's solid fill) / background | non-text 3:1 (WCAG 1.4.11) |
| Error text on background | Theme settings `color_error` / background | text |
| Success text on background | `color_success` / background | text |
| Rating stars on background | `color_rating` / background | non-text 3:1 |

After the last scheme, a **Badges** card (same row template, rides on the last loop iteration) checks badge text on badge colour for the sale, sold-out and custom badges (theme-wide colours, text thresholds). Then a legend (thresholds, large text = 24 px or about 19 px bold, how transparency is measured) and a line pointing to Theme settings > Colors and theme styles.

Each result is a pill with an icon and words, never colour alone: "Passes AAA", "Passes AA", "Large text only", "Fails", "Passes 3:1", "Below 3:1", "Has transparency, check by eye", "Not set" (a blank colour). Pill colours come from the section scheme's own tokens (pass: a light fg tint; large and check: outlined; fail: inverted fg/bg), so nothing is hard-coded.

## Behaviour
- **Editor only.** `request.design_mode or request.visual_preview_mode` decides. Otherwise the section outputs nothing inside its Shopify wrapper: no markup, no stylesheet link, no script. Shopify still prints the empty `<div id="shopify-section-…" class="shopify-section">` wrapper on the live store, and the section still takes a `section.index`. Left near the top of a live template, it shifts the sections after it: the real second section becomes index 3, so `anvil-section-attrs` turns on its reveal animation and `anvil-gallery` lazy-loads its media (both start at `section.index > 2`), and the base rule `.av-main .shopify-section + .shopify-section .av-section` adds the section gap above the real first section. At the bottom of a template it changes nothing; the schema paragraph tells the merchant to keep it there or remove it before publishing. shopify.dev notes that the editor preview should normally match the live store; this section is the deliberate exception the spec asks for.
- **Ratios in Liquid:** `color_contrast` computes every ratio on the server. It returns one decimal (shopify.dev's example: 3.0 for a true 3.008), so the printed value is marked "≈" and a verdict is given only when the value is strictly above the threshold: a printed 4.5 may be 4.46, so it reads "Large text only" until the script confirms. The fallback never overstates.
- **Transparency.** A colour setting can hold transparent `#00000000`, which is not blank (shopify.dev, input settings), and `color_contrast` does not know what lies under a see-through colour. When either colour of a pair has `color_extract: 'alpha'` below 1, the server prints no ratio ("–") and the verdict "Has transparency, check by eye". Rows on a scheme card also carry `data-anvil-base` (the scheme background, `color_to_rgb`). The module reads the alpha from `color_to_rgb`'s `rgba()` output, composites a see-through background over that base, then a see-through foreground over the result (c = a × top + (1 − a) × under, in 0–255 sRGB, rounded to whole channel values), and gives the exact ratio and verdict. Example: page background white, button background `#00000000`, button text white is measured as white on white, 1.00:1, "Fails", not as white on black. When there is no solid base (badge rows, whose surface is a product card or image, or a scheme whose own background is see-through), the "check by eye" verdict stays. The measurement assumes the pair sits on the scheme's solid background; over images or gradients it still needs an eye check.
- **Exact ratios in the editor:** `<anvil-palette-preview>` reads each row's `data-anvil-pair` (text | edge | icon), `data-anvil-fg`, `data-anvil-bg` and optional `data-anvil-base` (`color_to_rgb` output), computes the WCAG 2 relative-luminance ratio, prints it **rounded down** to two decimals and swaps in the matching verdict from six `<template data-anvil-level>` elements that Liquid rendered once (so the module holds no strings). The verdict uses the unrounded value. The element has no listeners; an editor re-render (`shopify:section:load`) connects a fresh element, which computes again, so there is nothing to clean up in `disconnectedCallback`.
- **Layout:** `.av-palette-preview` is an inline-size container: one column, two from 700 px of section width, three from 1,400 px (a full-width section on a wide screen). Cards are containers too; verdict pills stay on one line from a 22 rem card and may wrap on phones instead of widening the table. No horizontal scroll at 375 px.
- **Accessibility:** one `<h2>` (visible or hidden, always first), `<h3>` per card, real tables with scoped headers and captions, a `<dl>` for swatches. Samples and the preview panel are `aria-hidden` (the table carries the same facts) and the panel ignores the pointer. No focusable elements. Forced-colours mode keeps the real colours on chips and pair samples (`forced-color-adjust: none`), since showing them is the point.
- **Motion:** none.
- **Without JavaScript:** the server values and conservative verdicts stay, and see-through pairs keep "check by eye" (only theoretical: the editor always runs scripts).

## Honesty notes
- Nothing here is shown to shoppers, so it cannot mislead them. For the merchant, the tool never overstates: "≈" one-decimal server values with strictly-above verdicts, no server verdict at all for see-through colours, then exact values rounded down, with transparency composited over the scheme background.
- It checks only the pairs Anvil draws; it does not certify a page. Text over images, gradients (noted per scheme) and see-through badge colours need a manual check. The "darken" and "lift" button hovers are not checked (darken dims the button by 8 %).

## Findings on the shipped colours (computed with the same formula, rounded down as the tool prints them, 2026-10-15)
- `config/settings_data.json` current and the "Anvil" style: scheme 3 field borders 2.81:1 (below 3:1); scheme 3 error 1.19:1 and success 1.34:1; schemes 4 and 5 error about 3.3:1 and success about 3.8:1 (large text only); rating stars on schemes 1 and 2 about 2.0:1 and 1.8:1 (below 3:1). If the merchant switches the button hover to "outline": scheme 5 button colour `#1D4ED8` on background `#111111` is 2.81:1 (below even large text). The shipped hover is "darken", so the row is hidden by default.
- "Anvil Dark": error and success below 4.5:1 on schemes 1–4 (scheme 3: 1.28 / 1.44); scheme 5 passes both (5.15 / 4.58); rating stars 1.85:1 on scheme 5.
- The status and rating colours are single theme-wide values, so one choice cannot pass on both light and dark schemes. Raised as an open question; the section reports, it does not change settings.

## Locale keys (integrator adds them to `locales/en.default.json`)
47 keys under `anvil.palette_preview`:
- `anvil.palette_preview.title` = "Theme colours preview"
- `anvil.palette_preview.intro` = "Every colour scheme from Theme settings > Colors, painted as the theme draws it, with the WCAG 2 contrast ratio of each colour pair. Only you see this, in the theme editor."
- `anvil.palette_preview.scheme_name` = "Scheme {{ number }}"
- `anvil.palette_preview.used_page` = "Page colours"
- `anvil.palette_preview.used_cards` = "Product cards"
- `anvil.palette_preview.sample_text` = "Body text"
- `anvil.palette_preview.sample_link` = "Link"
- `anvil.palette_preview.sample_button` = "Button"
- `anvil.palette_preview.color_background` = "Background"
- `anvil.palette_preview.color_text` = "Text"
- `anvil.palette_preview.color_text_muted` = "Muted text"
- `anvil.palette_preview.color_border` = "Borders"
- `anvil.palette_preview.color_accent` = "Accent"
- `anvil.palette_preview.color_on_accent` = "Text on accent"
- `anvil.palette_preview.color_button` = "Button background"
- `anvil.palette_preview.color_button_text` = "Button text"
- `anvil.palette_preview.color_button_border` = "Button border"
- `anvil.palette_preview.checks_caption` = "Contrast checks for {{ name }}"
- `anvil.palette_preview.col_pair` = "Colour pair"
- `anvil.palette_preview.col_ratio` = "Ratio"
- `anvil.palette_preview.col_result` = "Result"
- `anvil.palette_preview.pair_text` = "Text on background"
- `anvil.palette_preview.pair_muted` = "Muted text on background"
- `anvil.palette_preview.pair_accent` = "Links and focus ring on background"
- `anvil.palette_preview.pair_on_accent` = "Text on accent"
- `anvil.palette_preview.pair_button` = "Button text on button"
- `anvil.palette_preview.pair_button_hover` = "Button colour as hover text (outline style)"
- `anvil.palette_preview.pair_field` = "Field borders on background"
- `anvil.palette_preview.pair_error` = "Error text on background"
- `anvil.palette_preview.pair_success` = "Success text on background"
- `anvil.palette_preview.pair_rating` = "Rating stars on background"
- `anvil.palette_preview.pair_badge_sale` = "Sale badge text on badge"
- `anvil.palette_preview.pair_badge_soldout` = "Sold-out badge text on badge"
- `anvil.palette_preview.pair_badge_custom` = "Custom badge text on badge"
- `anvil.palette_preview.badges_title` = "Badges"
- `anvil.palette_preview.badges_note` = "Badge colours are set once for the whole theme in Theme settings > Colors, so they are checked here on their own: badge text on badge colour."
- `anvil.palette_preview.gradient_note` = "This scheme has a background gradient. The ratios use its solid background colour, so check text over the gradient by eye."
- `anvil.palette_preview.level_aaa` = "Passes AAA"
- `anvil.palette_preview.level_aa` = "Passes AA"
- `anvil.palette_preview.level_large` = "Large text only"
- `anvil.palette_preview.level_fail` = "Fails"
- `anvil.palette_preview.level_ui` = "Passes 3:1"
- `anvil.palette_preview.level_ui_fail` = "Below 3:1"
- `anvil.palette_preview.level_unset` = "Not set"
- `anvil.palette_preview.level_check` = "Has transparency, check by eye"
- `anvil.palette_preview.legend` = "Text needs 4.5:1 for AA or 7:1 for AAA; large text (24 px, or about 19 px bold) needs 3:1. Field borders and icons need 3:1. Ratios are rounded down to two decimals. A colour with transparency is measured over its scheme's solid background."
- `anvil.palette_preview.restyle` = "To change these colours, edit the schemes in Theme settings > Colors, or switch the theme style."

The first build's English values were in its output notes; the values above were rewritten from this card. If the integrator still has the originals, either set works; the two new keys are `pair_button_hover` and `level_check`.

## Budgets (gzip -9, as `scripts/check-limits.sh` measures)
- `assets/anvil-palette-preview.js`: 2,978 B raw, 1,409 B gzipped (section budget 2 KB gz, hard limit 4 KB).
- `assets/anvil-palette-preview.css`: 5,464 B raw, 1,546 B gzipped (limit 8 KB gz). Loaded only in the editor.
- Section Liquid: about 22.5 KB raw.

## Checks run (2026-10-15)
- First build: `shopify theme check --fail-level warning` (whole theme) reported only `TranslationKeyExists` for this file's keys; in a scratch copy with the keys added, 0 offenses in this file. `scripts/chassis-lint.py`, `scripts/cleanroom-lint.sh`, `scripts/asset-audit.py`, `scripts/check-limits.sh`: clean. Render check on a static mock of the markup (five shipped schemes plus a gradient scheme and muted text `#777777`, true ratio 4.478) at 1280 × 900 and 375 × 812: every ratio matched the formula, the 4.478 pair read "4.47:1, Large text only", no horizontal overflow.
- Review fixes: `shopify theme check --fail-level warning` reports only `TranslationKeyExists` for this file (51 occurrences of the 47 keys); in a scratch copy with the 47 keys above added to `en.default.json`, 0 offenses in this file. `scripts/chassis-lint.py --only sections/anvil-palette-preview.liquid --strict`, `scripts/cleanroom-lint.sh`, `scripts/asset-audit.py`, `scripts/check-limits.sh`: clean. Headless Chrome render of a static mock at 500 px (Chrome's smallest headless window): the composed `.av-badge--accent` and `.av-field__input` (with an input shadow) paint as the theme's own, a `#00000000` button with white text on white reads "1.00:1, Fails", a see-through badge keeps "Has transparency, check by eye", no horizontal overflow. The module's compositing was unit-tested in Node with a stub element: white text on a `rgba(0, 0, 0, 0)` button over white reads 1.00:1 "Fails"; 50 % black text on white reads 3.94:1 "Large text only"; a see-through badge and a see-through scheme background keep "check by eye"; opaque pairs are unchanged (21.00:1 AAA, 4.47:1 Large text only). Not a Shopify render: the first real one is the editor on the dev store.

## Uncertain
- **Stylesheet as an asset, not `{% stylesheet %}`.** CONVENTIONS §3 puts section CSS in `{% stylesheet %}`. Shopify serves that CSS for every rendered section file (DECISIONS 57), and this section file is rendered on the storefront even though it outputs nothing, so `{% stylesheet %}` CSS would reach shoppers wherever the section is left on a template. The asset is linked only inside the editor branch. Asked the integrator for a DECISIONS entry ("Editor-only sections load CSS as an asset inside the design_mode branch") so reviews and lints treat it as allowed.
- **Scheme names.** Liquid's `color_scheme` exposes only `id` and `settings`, so cards are titled "Scheme N" by position, with the id beside it. If the editor labels schemes differently, the id is the reliable match.
- **Harness screenshots.** The G3 scratch render is a storefront request, so this section renders nothing there by design. Reviewers should look at the editor, or the gate needs an editor-mode check.
- **`color_contrast` precision.** shopify.dev does not document its rounding; the code assumes at most one decimal and is conservative either way.
- **Alpha output formats.** shopify.dev says `color_to_rgb` gives `rgba()` for a colour with alpha and `color_modify: 'alpha', 1` gives `rgba()`, but shows no exact alpha number format. The module accepts any decimal (`0`, `.5`, `0.5`, `1.0`); confirm on the dev store with one see-through button colour.

## Integration pass (2026-10-15)
- Locale keys added with the values in this card. The editor-only asset stylesheet is accepted (DECISIONS 78).

## Fix pass (2026-10-15)
- Availability: `disabled_on` groups ["*"] (CONVENTIONS §4, DECISIONS 100).
