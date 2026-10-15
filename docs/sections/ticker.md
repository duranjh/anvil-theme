# Ticker — `sections/anvil-ticker.liquid`

_Section card, 2026-10-15 (wave 2). Brief: `docs/agent-prompts/ticker.md`; spec: `docs/SPEC.md` §4.2 "Ticker (horizontal)"; design row: `docs/DESIGN-sections.md` §3 `anvil-ticker`._

## Purpose
A strip of short items that scrolls sideways without end, usually right under the hero on the homepage or under the product section on `product.landing`. Items can be text, an image, a typed review (stars, quote, name), an icon with text, or an icon with a heading and a line of text. Up to 24 items. Shoppers who prefer reduced motion, and stores with animations switched off, see one static, centred, wrapping row instead.

No section-specific JavaScript or CSS asset. The section composes the shared `<anvil-marquee>` (`assets/anvil-marquee.js` + `assets/anvil-marquee.css`, loaded from the section with a module script and `stylesheet_tag`). Section CSS lives in `{% stylesheet %}` (5,182 bytes, limit 6,144).

## Settings
Chassis first (the 13 ids from CONVENTIONS §4, pasted verbatim), then a header "Ticker" and 13 section settings (26 settings in all, limit 40):

| id | type | default | what it does |
|---|---|---|---|
| `speed` | range 10–120, step 5 (no unit) | 40 | the marquee's `speed` attribute: **pixels per second** (see Uncertainties) |
| `direction` | select `left` / `right` | `left` | the marquee's `direction` attribute ("Right to left" / "Left to right") |
| `pause_hover` | checkbox | true | adds `pause-on-hover` |
| `gap` | range 8–96 px, step 4 | 32 | written inline as `--av-marquee-gap` on `<anvil-marquee>`; the same value spaces each item from its separator |
| `size` | select `sm` / `md` / `lg` / `xl` | `md` | text `--av-text-sm` / `-md` / `-xl` / `-3xl`; icons 16 / 20 / 28 / 40 px; stars 14 / 16 / 20 / 28 px |
| `font` | select `body` / `heading` | `body` | heading font, weight and letter spacing for the strip |
| `uppercase` | checkbox | false | `text-transform: uppercase` with 0.06em tracking |
| `item_style` | select `plain` / `outline` / `filled` | `plain` | no box, an outlined pill (`--av-radius-pill`, `--av-border`), or a tinted card (`--av-fg-rgb` at 0.06, `--av-radius-card`) |
| `icon_color` | select `accent` / `text` | `accent` | colour of item icons and separators |
| `image_height` | range 16–120 px, step 4 | 40 | height of image items; width follows the image's aspect ratio |
| `sep_icon` | select (none, a CSS dot, 15 icon names) | `dot` | separator after each item |
| `sep_image` | image_picker | — | replaces the separator icon; drawn at the icon height |
| `show_disclosure` | checkbox | true | prints `anvil.trust.quotes_disclosure` under the strip when it holds review items |

## Blocks
Local blocks, `max_blocks: 24`; `{{ block.shopify_attributes }}` is on each `<li>`.

| type | name | settings |
|---|---|---|
| `text` | Text | `text` inline_richtext (default "Example message — replace with your own"), `link` url |
| `icon_text` | Icon with text | `icon` select (46 names + none), `icon_image` image_picker, `text` inline_richtext, `link` url |
| `rich` | Icon, heading and text | `icon`, `icon_image`, `heading` text, `text` text, `link` url |
| `review` | Typed review | a paragraph saying the merchant types these in, `quote` text, `name` text, `rating` range 0–5 step 0.5 (default 5), `source_url` url |
| `image` | Image | `image` image_picker, `alt` text, `caption` text, `link` url (used only with a caption, or an image with alt text) |

Every icon value exists in the `anvil-icon` lookup snippets. The preset ("Ticker": full width, 16 px padding) ships five items that read as examples: free shipping over $50 (truck), an example message with a bold word, 30-day returns as icon + heading + text, an example quote by "Example name" (no stars: no source link), and replies within one business day (chat bubble).

## Markup and behaviour
- `div.av-ticker` (size, style, font and colour modifiers; `--av-ticker-icon` and `--av-ticker-img` inline) → `<anvil-marquee class="av-ticker__strip" speed direction pause-on-hover style="--av-marquee-gap">` → `<ul class="av-ticker__track" role="list" data-marquee-track>` → `<li class="av-ticker__item">` → `.av-ticker__body` (a `<div>`, an `<a class="av-ticker__link">` or, for reviews, a `<figure>`) + the separator `<span class="av-ticker__sep" aria-hidden="true">`.
- The separator sits inside each `<li>`, after the body, so the copies the marquee makes carry it too: item, gap, separator, gap, item, all the way round the loop with no seam (checked: the gap from the last item's separator to the first copied item equals the setting).
- The marquee clones the track for the loop; clones are `aria-hidden`, their links untabbable and their ids removed (component behaviour, verified). It adds a 44 px pause/play button. The strip clips its overflow, so while it moves it is at least 44 px tall (`min-height`, only when motion is allowed and `data-animations="on"`), otherwise the button would be cut off on small sizes.
- Full width (`width: full`) lets the strip run edge to edge (`av-ticker--bleed`, negative inline margins equal to the gutter) only while it moves: the class is added only when `settings.animations_enabled`, and `@media (prefers-reduced-motion: reduce)` sets its margin back to 0, so the static row keeps the gutter (same rule as `anvil-logo-list` and `anvil-image-marquee`). The heading and the note always keep the gutter.
- Focus room: the strip clips at its padding box, so it has `padding-block: --av-space-2` (cancelled by an equal negative `margin-block`, so the layout does not move) and, in the static row, `padding-inline: --av-space-2`. The 5 px focus ring (2 px outline, 3 px offset) of a linked item is never cut off; the 44 px minimum height is border-box, so it still holds the pause button.
- Static row (reduced motion from the first paint through the component's CSS, or `av-is-static` when the merchant switched animations off): items wrap their text, rows are `--av-space-3` apart, a review's name drops under its quote, separators are hidden (wrapped rows would leave them stranded at line ends), and the row keeps the gutter even at full width.
- Links: an item becomes a link only when it has a name (text, heading, caption, or alt text on an image that is set; alt text without an image does not count). A text that already holds a link is never wrapped in a second one. A review's `source_url` always shows as a link in a new tab, with the shared "(opens in a new tab)" text: on the stars when the rating is above 0, otherwise on the name, otherwise on the quote. Stars and name links are at least 24 px tall; the name and quote links are underlined.
- Labels are not headings (CONVENTIONS §3): a rich item's heading is a `<span>`, review quotes are `<blockquote>` with a `<figcaption>` name; quotation marks and the dash before the name come from CSS (`open-quote`, and `content: "— " / ""` so screen readers skip the dash where supported).
- Icons are decorative (`anvil-icon` without a label; custom icon and separator images get `alt=""`). Image items use their alt text unless a caption already names the link. The placeholder for an empty image item sits in an `aria-hidden` span, so it is never announced.
- Images: `image_url | image_tag` with `widths: "<w>, <2w>"`, `sizes: "<w>px"` where `w = image_height × aspect_ratio` (separator images use the icon height); `width`/`height` attributes plus a fixed CSS height, so nothing shifts. In the first two sections (or with no `section.index`) the first 4 rendered items load their images eagerly and the rest lazily, so the strip does not compete with the hero or product image for bandwidth; lazy in every later section. The separator image follows the section (one URL, cached). Empty image items render `placeholder_svg_tag 'image'`.
- Empty items: skipped for shoppers; in the editor they show `anvil.editor.block_empty` so they stay selectable. No blocks: nothing for shoppers, `anvil.editor.empty_section` in the editor.
- Editor: selecting a block pauses the strip (component listens for `shopify:block:select`); a settings change re-renders the section and the element reconnects.
- `disabled_on.groups: ["custom.overlay"]`; header, footer and every template can take it.

## Honesty notes
- Reviews are merchant-entered (design row). The block is named "Typed review" and opens with a paragraph saying so; quote and name carry `info` asking for a real customer's words, with permission, and only the name they agreed to.
- Stars show only with a source link shoppers can open (`rating > 0` and `source_url` set), matching `blocks/anvil-stars` and `blocks/anvil-review-stars`; the rating `info` says so and that 0 hides them. A rating of 0 never hides the source: the name (or the quote) then carries the link, and the `source_url` `info` says so. No review counts.
- The strip prints the shared "Quotes shared by customers; entered by the store." under itself when it holds review items (on by default, the same line the product page's reviews list always shows). Its `info` says to turn it off only if every review has a source link (each one then shows a link shoppers can open).
- Every free-text field a shopper reads has a one-sentence `info` (offers and deadlines must be true; policies back the claim; conditions belong in the text). Image items warn about press or partner logos that are not real.
- Defaults read as examples ("Example: …", "Replace with …").

## Checks run (2026-10-15)
- `shopify theme check --fail-level warning`: 0 offenses in this file. The whole-theme run shows missing locale keys in other wave-2 sections being written in parallel (compare table, feature grid, image gallery, testimonials, vertical ticker, timeline).
- `scripts/chassis-lint.py --only sections/anvil-ticker.liquid --strict`: clean, 0 warnings. `scripts/cleanroom-lint.sh`, `scripts/asset-audit.py`, `scripts/check-limits.sh`: clean.
- Composed assets (not changed): `anvil-marquee.js` 1,458 B gzipped (budget 1,536), `anvil-marquee.css` 996 B gzipped. Section CSS 5,182 B raw, 1,456 B gzipped. No section JavaScript.
- Render check with the real `anvil-base.css`, `anvil-marquee.css`, `anvil-marquee.js` and this section's CSS on mock markup matching the Liquid output, in headless Chromium at 1280×800, 375×812@2x and 375×812 with reduced motion: no console errors, no page-level horizontal scroll, one clone per strip, clones hidden and untabbable, pause button 44 px and not clipped, separator spacing even across the loop seam, static wrapping row with separators hidden under reduced motion. Not a Shopify render; the harness push (G3) is the first real one.
- Review fixes (2026-10-15): focus room, bleed, image-link name, review source link, per-item eager loading. Re-ran the render check on mock markup (real `anvil-base.css`, `anvil-marquee.css`, `anvil-marquee.js`, this section's CSS) in headless Chrome at 500 and 1280 px, plain and outlined pill, md and xl, animations on and off, and 500 px with `--force-prefers-reduced-motion`: every link (text, rich, image, captioned placeholder, name and quote source links) sits at least 8 px inside the strip's clip box top and bottom, and in the static row at least 8 px from every side. The static row keeps the gutter at full width (500 px: strip 16 to 484, no glyph at the screen edge), with animations off and under reduced motion. The pause button stays inside the strip; no page-level horizontal scroll. Gates re-run: theme check (0 offenses in this file), chassis-lint `--strict` clean, cleanroom-lint, asset-audit and check-limits clean.

## Uncertainties and assumptions
- **Speed unit.** The design row says "speed 10–120 s". The shared marquee's `speed` attribute is pixels per second (its duration is the track width divided by speed), and Liquid cannot measure the track, so a seconds-per-loop setting cannot be honoured without a section script. The setting keeps the 10–120 range as pixels per second (40, the component's default), so the pace stays the same however many items there are; its `info` says so. If seconds per loop is wanted, the marquee would need a `duration` attribute.
- **Without JavaScript** (resolved at integration): `anvil-marquee.css` animates only a defined element, and `html.no-js` shows the static wrapping row, so the strip never scrolls out and jumps back.
- **Focus inside a moving strip** (resolved at integration): keyboard focus stops the strip at its start and the browser scrolls the focused item into view; the scroll resets when focus leaves (WCAG 2.4.11). A mouse click only pauses, so a link never moves under the pointer.
- The static row's `data-animations` rules use `:where([data-animations="off"] *)` (and `="on"` for the 44 px minimum height) so every selector still starts with `.av-ticker`. Both layouts write `data-animations="on|off"` on `<html>`.
- The review note reuses `anvil.trust.quotes_disclosure`; no new locale keys are needed.
- No `@app` or custom Liquid block: app content is not plausible inside a scrolling strip (DESIGN-sections §2).

## Integration pass (2026-10-15)
- Placed on `templates/index.json` and `templates/product.landing.json` (speed 35).

## Fix pass (2026-10-15)
- Setting ids follow the theme-wide vocabulary (CONVENTIONS §5; DECISIONS 82–100); the tables above use the new ids: `review_note` → `show_disclosure`. Saved templates were migrated.
- Uses the shared pieces: eager or lazy media from `snippets/anvil-above-fold` (DECISIONS 85); the editor-only empty note from `snippets/anvil-editor-empty` (DECISIONS 87).
- Availability: `disabled_on` groups ["custom.overlay"] (CONVENTIONS §4, DECISIONS 100).
