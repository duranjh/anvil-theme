# Feature grid — `sections/anvil-feature-grid.liquid`

_Section card, 2026-10-15. Wave 2. Built from `docs/agent-prompts/feature-grid.md` (CONVENTIONS, spec card, chassis API, exemplars)._

## Purpose
A grid of up to 12 cards. Each card has an image, a heading, a short text and an optional button. Use it for product benefits, ways to use a product, or collection teasers. Spec: `docs/SPEC.md` §4.2 "Feature grid"; design row: `docs/DESIGN-sections.md` §3 `anvil-feature-grid` (card grid 1 → 2–4, local `card` ×12, columns / ratio / card style / button, no JS). The product landing template (SPEC §5) lists it between stats and the comparison table. Phones show 1 or 2 columns, tablets 2 or 3, desktop 2–4. No JavaScript.

## Settings
The 13 chassis settings come first, pasted verbatim from CONVENTIONS §4. Then a header "Feature grid" with 12 section settings, grouped under the sub-headers "Images" and "Text and button". That makes 25 settings in total (the limit is 40).

| id | type | default | what it does |
|---|---|---|---|
| `cols_mobile` | select `1` / `2` | `1` | columns below 750 px; at 2 the gap drops to `--av-space-3` and card text to `--av-text-sm` |
| `cols_desktop` | select `2` / `3` / `4` | `3` | columns at ≥ 990 px. Tablets (750–989 px) get 3 columns when this is 3, otherwise 2, so 4 cards fill 2 × 2 instead of 3 + 1 (computed in Liquid) |
| `center_cards` | checkbox | true | centres an unfinished last row, and a row with fewer cards than columns |
| `card_style` | select `theme` / `flat` / `outlined` / `tinted` / `raised` | `theme` | `theme` follows Theme settings > Cards (`settings.card_style`: flat, outlined or raised) exactly as product cards do (`assets/anvil-card.css`): the grid gets `av-feature-grid--theme-cards`, the border is `--av-border-w-card` as set (0 px draws none) and the shadow is `--av-shadow-card` as set (`none` draws none). The explicit choices keep their floors: `outlined` draws a `max(1px, --av-border-w-card)` border in `--av-border`, and `raised` ("Shadow") puts the card on `--av-bg` with the theme's card shadow, or `--av-shadow-md` when Theme settings set the card shadow to none, because a style called "Shadow" should never render without one. `tinted` fills with `rgb(--av-fg-rgb / 0.05)` |
| `text_align` | text_alignment | `left` | text alignment inside the card; the button follows it |
| `show_media` | checkbox | true | off = text-only cards (no image box, no placeholder) |
| `image_ratio` | select `adapt` / `1:1` / `4:5` / `3:4` / `16:9` / `21:9` | `1:1` | image shape, passed to `anvil-media` |
| `image_fit` | select `cover` / `contain` | `cover` | crop to the shape, or fit inside it (good for cut-out product shots) |
| `media_inset` | checkbox | false | boxed styles only. Off ("bleed"): the image reaches the card's edges and the card clips it to `--av-radius-card`. On: the image sits inside the card padding with its own `--av-radius-media` |
| `title_size` | select `sm` / `md` / `lg` | `md` | card heading at `--av-text-md` / `-lg` / `-xl` |
| `button_style` | select `primary` / `secondary` / `link` / `link_arrow` | `link_arrow` | solid button, outline button, text link, or text link with an `arrow-right` icon (all from `snippets/anvil-button`) |
| `card_link` | checkbox | false | makes the whole card clickable (see "Links" below) |

`schema.name` is "Feature grid" (12 characters), `max_blocks: 12`, `disabled_on.groups: ["*"]` (a template section, like the FAQ).

## Blocks
Local block `card`. `{{ block.shopify_attributes }}` is on each `<li>`.

| id | type | default | note |
|---|---|---|---|
| `image` | image_picker | — | its `info` asks for the real product or result and for images the merchant may use; the alt text comes from the image's own alt in Files |
| `heading` | text | "Example feature — replace me" | its `info` covers claims such as "best-selling" or "clinically proven" |
| `text` | richtext | `<p>Example text — describe one real benefit in a sentence or two.</p>` | its `info` says results, guarantees and delivery promises must match the store's policies |
| `button_label` | text | blank | its `info` says that left empty the heading becomes the link, that a label only shows when the card has a link, and to say where it goes (for example "See the size guide") |
| `button_link` | url | — | its `info` says the link shows on the button, or on the heading when the button label is empty, and that a card with neither shows no link |

The preset "Feature grid" ships an example heading ("Example heading — what makes it **different**") and three cards. Each card heading starts with "Example feature —" and each text starts with "Example text —". The cards have no links, so no button shows until the merchant adds one.

## Markup and behaviour
- Structure: `anvil-section-head`, then `<ul class="av-feature-grid …" role="list">`, `<li class="av-feature-grid__item">`, `.av-feature-grid__card` holding the `anvil-media` box (`.av-feature-grid__media`) and `.av-feature-grid__body` (`<h3 class="av-feature-grid__title" id="FeatureGridTitle-{section.id}-{block.id}">`, `.av-feature-grid__text.av-rte`, `.av-feature-grid__action`). `role="list"` keeps the list semantics (and item count) in WebKit/VoiceOver, which drops them from a `list-style: none` list; `anvil-base.css` resets list-style and padding for `ul[role="list"]`, so the stylesheet only resets the margin.
- The cards are rendered into a `capture` first. The hidden `<h2>` and the `<ul>` print only when at least one card rendered, so a grid of empty cards leaves no empty list on the storefront.
- Heading levels: card titles are `<h3>`. When the section heading is blank, a visually hidden `<h2>` (`anvil.feature_grid.heading`, "Features") sits above the grid, so the outline never jumps from the page's `<h1>` to `<h3>` (CONVENTIONS §3).
- Layout: flexbox with `flex-wrap`. Each item's basis is `(100% − (cols − 1) × gap) / cols`, with the column count in `--av-feature-grid-cols`, set per breakpoint by the classes `--m1/2`, `--t2/3` and `--d2/3/4`. Flexbox, not grid, so `center_cards` can centre a short last row. Cards in a row stretch to equal height, and `margin-top: auto` keeps every button on the same line at the bottom. The gap is the theme's `--av-grid-gap`.
- Links. There are four modes per card, chosen in Liquid, and a link is only drawn when something names it:
  - `button`: card has a link and a button label. The button is a real link (`anvil-button`) and the heading is plain text. When the card has a heading, the button gets `id="FeatureGridLink-…"` and `aria-labelledby="<its own id> <heading id>"` (WCAG technique ARIA7), so its name is "Learn more Example feature — first benefit". Three cards then give three different link names in a screen-reader links list instead of "Learn more" three times. The visible label comes first in the name, so WCAG 2.5.3 Label in Name holds.
  - `title`: card has a link, a heading and no button label. The heading text becomes the link. It is underlined at all times (thicker on hover), because it is the card's only link and touch users get no hover cue.
  - `cover`: `card_link` is on and the card has a link and a heading. The heading link's `::after` covers the card (the card is `position: relative`). Links inside the card text get `position: relative`, so they stay clickable above the cover. The button becomes a visual cue only (`<span class="av-btn …" aria-hidden="true">` with `pointer-events: none`), so each card is one tab stop named by its heading, with no second "Learn more" link pointing at the same URL. Keyboard focus draws the ring around the whole card (`:has(:focus-visible)`, with the link's own ring removed under `@supports selector(:has(*))`). Linked cards carry `av-lift`, so the theme's "hover lift" setting applies.
  - `none`: card has a link but neither a heading nor a button label. No link is drawn, because nothing would name it. The Link setting's `info` says so, and in the editor the card shows the note `anvil.editor.feature_grid_link_hidden`.
  - In `cover` mode the heading link has no underline until the card is hovered: the card itself is the cue.
- Text-link buttons keep no padding and a 24 px minimum height inside the card. This is a contextual override, not a component change: the size class re-adds padding after `.av-btn--link`. `anvil-pb-content.css` does the same.
- Images: `widths: '300, 450, 600, 750, 900, 1100'`. One card on a phone at 3× pixel density needs more than the 600 px card cap, so the list goes up to the 1100 px "half" cap and the browser picks from `sizes`. `sizes` comes from the column counts and `settings.page_width` / `narrow_width`. For example, page width 1400 with 3 columns gives `(min-width: 1400px) 466px, (min-width: 990px) 33vw, (min-width: 750px) 33vw, 100vw`. Full-width sections use vw only. Images are lazy, except in the first two sections (or when `section.index` is nil), where the first `cols_mobile` cards (the phone's first row, the only cards in view on every device) load eagerly. On desktop the rest of the first row is lazy but in the viewport, so it still loads at once, and a hero above the grid keeps its LCP image uncontested on phones. In the first section, the first card gets `priority` (fetchpriority high and preload). `anvil-media` writes the aspect-ratio box, so nothing shifts while images load. Empty images show `product-1` to `product-6` placeholders in turn.
- Empty cards: a card with nothing of its own (no heading, no text, no button with a link, and no image, or images turned off) is skipped on the storefront, whether or not images are on, so a live store never shows a lone placeholder illustration in an empty card. In the editor it is kept as `.av-feature-grid__card--empty`: no placeholder, a dashed outline, `min-height: var(--av-space-9)` (and padding in the "No box" style), and the note `anvil.editor.block_empty` (or the link note above when the card has a link). It stays visible and clickable. With zero blocks, the shopper sees nothing and the editor shows `anvil.editor.empty_section`.
- Motion: none of its own. The chassis `reveal` setting and the theme's hover lift both respect `prefers-reduced-motion` and `html[data-animations="off"]`.
- CSS: the `{% stylesheet %}` body is 5,111 bytes raw, 1,416 bytes gzipped (limit 6,144 raw), and every selector starts with `.av-feature-grid`. No asset files, no JavaScript.

## Honesty notes
- The card heading, text and image each carry a one-sentence `info` on what is honest to enter (CONVENTIONS §10, HONEST.md). There is no badge, rating, price or counter field, so the section cannot carry a "Most popular" badge or a typed number.
- Defaults read as examples ("Example feature — …", "Example text — …"). Preset cards ship without links, so an unedited publish shows no buttons that lead nowhere.
- No platform logos ship; the image `info` asks for artwork the merchant is entitled to use.

## Checks run (2026-10-15, after the review fixes)
- `shopify theme check --fail-level warning` (whole theme, 237 files): this file's only findings are `TranslationKeyExists` for `anvil.feature_grid.heading` and `anvil.editor.feature_grid_link_hidden`, which the integrator adds at wave end. Every other finding in the tree is the same check in other builders' files. (Theme check also caught a bug during the fix: `empty` is a Liquid literal, so the flag is named `is_empty`.)
- `scripts/chassis-lint.py --only sections/anvil-feature-grid.liquid --strict`: clean. `scripts/cleanroom-lint.sh`, `scripts/asset-audit.py`, `scripts/check-limits.sh`: clean.
- Computed-style check: the exact `{% stylesheet %}` body plus `assets/anvil-base.css` with mock markup in local headless Chromium (375 px), with Theme settings mocked to a 0 px card border and card shadow "none". Theme-matched outlined card: 0 px border; explicit Outlined: 1 px. Theme-matched raised card: no shadow. The `<ul role="list">`: no bullets, no padding, no margin. Title-mode link: underlined; cover-mode link: no underline, underlined on card hover. Empty editor card: 96 px tall with a dashed outline, and 12 px padding in "No box". This is not a Shopify render; the harness push (G3) will be the first real one.

## Review fixes applied (2026-10-15)
Nine minor findings, all applied: button links named with the card heading (`aria-labelledby`, stronger than the suggested `aria-describedby`, which only adds a description and leaves the link names identical); `role="list"`; "Same as theme cards" now matches product cards exactly; empty cards skipped on the storefront even with images on, and no empty `<ul>`; empty editor cards keep a visible box with a note; title-mode heading links underlined; Link `info` plus an editor note for a link that cannot show; eager images limited to the phone's first row; the missing `anvil.feature_grid.heading` key is handed to the integrator.

## Uncertainties and assumptions
- The visually hidden `<h2>` says "Features" whatever the cards hold, because CONVENTIONS §3 asks for a hidden `<h2>` when the design has none. The alternative would be `<h2>` card titles when the section heading is blank. Owner call.
- `settings.card_style` / `settings.card_shadow` come from Theme settings > Cards (read-only here). If those ids change, the `theme` option falls back to `flat`.
- `sections/anvil-icon-content.liquid` and `sections/anvil-columns.liquid` still apply the "always a shadow" fallback after resolving "Same as theme cards". This section now follows the theme exactly; the owner should settle the rule across the repo.
- The decorative button cue in `cover` mode uses the base `.av-btn` classes on a `<span>`, not `snippets/anvil-button`, which only renders `<a>` or `<button>`. It looks the same as a real button.
- `anvil-media` receives `fit` and `ratio` straight from the settings. Its "adapt" ratio follows each image's own shape, so cards in a row can differ in height above the text. The default is square for that reason.
- Wave rule: no locale or shared-asset edits. The two new keys (`anvil.feature_grid.heading` "Features", `anvil.editor.feature_grid_link_hidden`) are listed in the builder's output for the integrator.

## Integration pass (2026-10-15)
- The text-link button fix lives in `anvil-base.css` (`.av-btn.av-btn--link`), so this section's patch was removed.
- Placed on `templates/product.landing.json`.

## Fix pass (2026-10-15)
- Setting ids follow the theme-wide vocabulary (CONVENTIONS §5; DECISIONS 82–100); the tables above use the new ids: `card_align` → `text_align`, `ratio` → `image_ratio`. Saved templates were migrated.
- Uses the shared pieces: card boxes from `snippets/anvil-surface` and `.av-surface` (DECISIONS 83); columns from the shared `.av-grid` rule (DECISIONS 82); eager or lazy media from `snippets/anvil-above-fold` (DECISIONS 85); the editor-only empty note from `snippets/anvil-editor-empty` (DECISIONS 87); a hidden fallback heading through `anvil-section-head` (DECISIONS 84).
- Availability: `disabled_on` groups ["header","custom.overlay"] (CONVENTIONS §4, DECISIONS 100).

## Honest-defaults pass (2026-10-15)
- `button_label` has no default: with a link and no label the heading is the link, which always names the destination (WCAG 2.4.4). A default such as "See how it works" was wrong for most links and the "Example:" sweep would not catch it (DECISIONS 142, superseding that part of 125). The `aria-labelledby` pairing with the card heading stays for typed labels, so repeated labels are still told apart.
