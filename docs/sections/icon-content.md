# Icons with content — `sections/anvil-icon-content.liquid`

_Section card, 2026-10-15 (wave 2). Spec: `docs/SPEC.md` §4.2 "Icons with content"; design row: `docs/DESIGN-sections.md` §3 `anvil-icon-content`; card: `docs/spec/icon-content.md`._

## Purpose
Feature cards: up to 12 items, each an icon (or an uploaded image), a heading, rich text and an optional button. Phones show 1 or 2 columns, tablets up to 3, desktop 1–4. The icon sits above the heading, beside the heading, or beside the whole text. Cards can be plain or boxed (outlined, tinted, shadow, or whatever Theme settings > Cards says). No JavaScript; everything works without it.

The design document plans this section for the FAQ and contact templates ("Still have questions"); those templates are not wired yet (templates are read-only in this wave).

## Settings
Chassis first (the 13 ids from CONVENTIONS §4, pasted verbatim), then a header "Icons with content" and 13 section settings (26 in all, limit 40):

| id | type | default | what it does |
|---|---|---|---|
| `cols_mobile` | select `1` / `2` | `1` | columns below 750 px |
| `cols_desktop` | select `1`–`4` | `3` | columns at 990 px and up; with the icon beside the text, 4 columns start at 1200 px (3 from 990 to 1199 px) |
| `center_cards` | checkbox | true | an unfinished last row is centred (flex-wrap + `justify-content: center`) |
| `card_style` | select `theme` / `flat` / `outlined` / `tinted` / `raised` | `theme` | `theme` follows Theme settings > Cards (`settings.card_style`: flat, outlined or raised); every style but `flat` adds card padding |
| `text_align` | text_alignment | `center` | text and icon alignment when the icon is above or beside the heading; ignored when the icon is beside the whole text (lines start next to the icon) |
| `icon_position` | select `top` / `heading` / `start` | `top` | above the heading; in one row with the heading (text and button below, full width); beside the heading, text and button |
| `icon_size` | range 20–80 px, step 4 | 32 | glyph size; framed icons sit in a square box 1.75 times this, capped at the card's width (`max-width: 100%`, `aspect-ratio: 1`), and the glyph then shrinks to at most 58% of the box |
| `icon_style` | select `plain` / `circle` / `square` / `solid` | `circle` | tinted disc (`rgb(var(--av-accent-rgb) / 0.12)`), tinted rounded square (`--av-radius-card`, so a large card radius rounds it further), or a solid accent disc with `--av-on-accent` glyph |
| `icon_color` | select `accent` / `text` | `accent` | glyph in `--av-accent`, or in the text colour (tints switch to `--av-fg-rgb` at 0.08, the solid disc to `--av-fg` with a `--av-bg` glyph) |
| `image_size` | range 24–240 px, step 8 | 64 | width of an uploaded image used instead of an icon; height follows the image's own ratio |
| `title_size` | select `sm` / `md` / `lg` | `md` | item heading at `--av-text-md` / `--av-text-lg` / `--av-text-xl` |
| `button_style` | select `primary` / `secondary` / `link` / `link_arrow` | `link_arrow` | solid button, outline button, text link, text link with an arrow |
| `card_link` | checkbox | false | the heading link stretches over the card; the button stays as a visual cue |

Tablet columns are computed in Liquid: `min(cols_desktop, 3)`, or `min(cols_desktop, 2)` when the icon is beside the text, and never fewer than the phone count (capped by the desktop count). They travel as `av-icon-content--m{1,2}`, `--t{1-3}`, `--d{1-4}` classes that set `--av-icon-content-cols`. With the icon beside the text and 4 desktop columns, a 990–1199 px media query sets 3 columns, so the text column is not narrower than on tablets.

## Blocks
Local block `item`, `max_blocks: 12`; `{{ block.shopify_attributes }}` is on each `<li>`.

| id | type | default | note |
|---|---|---|---|
| `icon` | select (67 names from `anvil-icon`, plus `none`) | `check-circle` | every value exists in `snippets/anvil-icon-*.liquid`; info: award, medal, trophy and badge icons suggest an award or certification, so use them only for ones the merchant holds |
| `icon_image` | image_picker | — | replaces the icon; info: only artwork the merchant may use, never a seal or badge for a certification they do not hold; alt text is read only when the item has no heading or text |
| `heading` | text | "Example heading — replace with a real feature" | `<h3>`; info: state only what is true, claims need evidence |
| `text` | richtext | `<p>Example text — explain one real benefit in plain words.</p>` | info: results, ratings, review or customer counts, guarantees, delivery and return promises must match the product, real reviews and policies |
| `button_label` | text | "Learn more" | info: shows only when the item has a link |
| `button_link` | url | — | |

Preset "Icons with content": heading "Example heading — what to **expect**" and three items (sparkles, leaf, chat bubble) whose headings start with "Example:" and whose texts say what to replace; the third carries a "Contact us" label that appears once a link is added. An unedited publish makes no claim.

No `@app` block: app content is not plausible inside a feature card (DESIGN-sections §2).

## Markup and behaviour
- `<ul class="av-icon-content …" role="list">` (the role keeps list semantics in Safari/VoiceOver, which drops them for `list-style: none`) → `<li class="av-icon-content__item">` → `.av-icon-content__card` → icon (`.av-icon-content__icon`, an `anvil-icon` SVG, `aria-hidden`) or image (`.av-icon-content__image`) + `.av-icon-content__body` (`<h3 class="av-icon-content__title">`, `.av-icon-content__text.av-rte`, `.av-icon-content__action`). In the "beside the heading" layout the icon and the `<h3>` share `.av-icon-content__head`.
- Outline: the section heading is the chassis `<h2>`; when it is blank a visually hidden `<h2>` (`anvil.a11y.highlights`) keeps the `<h3>` card titles from skipping a level (CONVENTIONS §3).
- Links, chosen per item so a link always has a name: with a link and `card_link` on and a heading, the heading link covers the card (`::after`, `inset: 0`) and the button is an `aria-hidden` `<span>` cue with `pointer-events: none`; links inside the rich text stay above the cover (`position: relative`). With a label, the button is a real link (`anvil-button`) described by the item heading (`aria-describedby`, so repeated "Learn more" labels are told apart). With a link but no label, the heading itself is the link. A link with neither heading nor label is not rendered.
- Focus: buttons use the global ring. A covered card draws `2px solid var(--av-accent)` around the card when its heading link has `:focus-visible` (via `:has()`); browsers without `:has()` keep the link's own outline.
- Equal-height cards: items are flex children; the action row has `margin-top: auto`, so buttons line up at the bottom of a row.
- Phones with 2 columns: an icon beside the text moves above it below 750 px (there is no room for both), card padding and gaps tighten, and the item text drops to `--av-text-sm`.
- Images: `image_url: width: 2 × image_size` with `widths: "<size>, <2×size>"`, and a `sizes` per breakpoint built from the column counts: `(max-width: 749px) min(<size>px, calc(<f>vw / <phone cols>)), (max-width: 989px) min(…, calc(<f>vw / <tablet cols>)), min(…, calc(<f>vw / <desktop cols>))`, where `f` is 100 above the heading (and on 2-column phones beside the text) and 40 beside the text or heading (the CSS cap). Beside the text at 4 desktop columns a `(max-width: 1199px) … calc(40vw / 3)` entry is added. So a 240 px image in a 140 px phone column no longer fetches the 480w file on a DPR-2 phone; `image_tag` writes `width`/`height` and CSS sets `width: 100%; height: auto` inside a fixed-width box, so nothing shifts. The first row loads eagerly in the first two sections (`section.index` ≤ 2 or nil), lazily elsewhere; none is marked high priority (they are small, never the LCP image). Images get `alt=""` next to a heading or text.
- Items with no icon, heading, text or button are skipped on the storefront and kept in the editor so they stay selectable; there each shows `anvil.editor.block_empty` (`.av-example-note`) so the selected block has a visible box. A short pre-loop counts items that have something to show: when none do, shoppers get no visually hidden `<h2>` and no empty `<ul>`, only the section head. With zero blocks the editor shows `anvil.editor.empty_section`.
- Motion: none of its own besides the chassis `reveal` and the global `.av-lift` hover on covered cards (both respect reduced motion and `html[data-animations="off"]`).
- `disabled_on.groups: ["header", "custom.overlay"]`, like the other content grids (multicolumn, guarantees); the footer group stays allowed for a "Still have questions" strip.

## Honesty notes
- Icon, heading, text and image settings each carry a one-sentence `info` on what is honest to enter (award and badge icons only for awards or certifications held; claims need evidence; results, ratings, review or customer counts and promises must match the product, real reviews and policies; only images the merchant may use and no seal for a certification not held). Defaults and preset copy read as examples (CONVENTIONS §12, HONEST.md).
- No platform logos ship; icons are generic Lucide glyphs.

## Checks run (2026-10-15, after the review fixes)
- `shopify theme check --fail-level warning` (whole theme, 237 files): this section's only finding is still `TranslationKeyExists` for `anvil.a11y.highlights` (listed for the integrator). The other findings are in other wave-2 sections.
- `scripts/chassis-lint.py --only sections/anvil-icon-content.liquid --strict`: clean. The whole-repo run reports only other builders' files (columns, hero-slideshow, pricing, tabs).
- `scripts/cleanroom-lint.sh`, `scripts/asset-audit.py`, `scripts/check-limits.sh`: clean.
- `{% stylesheet %}` body: 6,103 bytes raw (limit 6,144), 1,493 bytes gzipped; every selector starts with `.av-icon-content`. The phone-only 2-column rules (gap, padding, small text) moved into the `max-width: 749px` query instead of being reset at 750 px, which paid for the new rules. No JS and no asset files.
- `scripts/gate.sh` was not run as a whole: its G0 paths-lint calls git, which this wave forbids; G1 and G2 were run one by one.
- Render check of the exact stylesheet with `anvil-base.css` and hand-built markup in headless Chromium: a framed 80 px icon in 2 phone columns now fits the card (320 px: box 112 px in a 112 px content box, glyph 65 px; 360 px: box 132 px in a 158 px card), while the unconstrained case keeps 56/32 px; beside the text with 4 desktop columns shows 3 columns at 1000 and 1199 px and 4 at 1200 px; right alignment puts the icon, the beside-heading row and the button at the right edge in both `dir=ltr` and `dir=rtl`; an empty editor item shows the full-width hint. Not a Shopify render; the harness push (G3) is the first real one.

## Uncertainties and assumptions
- Locale key needed: `anvil.a11y.highlights` = "Highlights" (the visually hidden `<h2>`).
- `card_style: theme` reads `settings.card_style`, `settings.card_shadow` (none stays none) and the card border width (0 stays 0) exactly; only the explicit Outlined and Shadow choices keep their 1 px / `--av-shadow-md` floors (integration pass; the same rule as `anvil-feature-grid` and `anvil-columns`).
- "Left" alignment adds no class, so cards keep the start alignment of the page direction (right-to-left stores start on the right). Centre and right are physical in both directions: right uses `text-align: right`, `justify-content: right` on the heading and button rows (MDN: `right` packs toward the right edge when the flex main axis is the inline axis) and, above the heading, `margin-left: auto` on the icon or image. Checked with `dir=rtl` in headless Chromium: icon, heading row and button sit at the right edge.
- Uploaded images get `--av-radius-media` corners and no frame; the icon frame styles apply to Lucide glyphs only.

## Integration pass (2026-10-15)
- Hidden heading uses `anvil.a11y.highlights`; the text-link button fix moved to `anvil-base.css`; "Same as theme cards" copies the theme border width and shadow exactly (CSS variable `--av-icon-content-bw`).
- Placed on `templates/page.contact.json` ("Other ways to reach us", example email, phone and hours cards).

## Fix pass (2026-10-15)
- Setting ids follow the theme-wide vocabulary (CONVENTIONS §5; DECISIONS 82–100); the tables above use the new ids: `card_align` → `text_align`, `image` → `icon_image`. Saved templates were migrated.
- Uses the shared pieces: card boxes from `snippets/anvil-surface` and `.av-surface` (DECISIONS 83); columns from the shared `.av-grid` rule (DECISIONS 82); eager or lazy media from `snippets/anvil-above-fold` (DECISIONS 85); the editor-only empty note from `snippets/anvil-editor-empty` (DECISIONS 87); icon frames from `.av-icon-frame` (DECISIONS 92); a hidden fallback heading through `anvil-section-head` (DECISIONS 84).
- Availability: `disabled_on` groups ["header","custom.overlay"] (CONVENTIONS §4, DECISIONS 100).
