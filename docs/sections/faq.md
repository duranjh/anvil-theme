# `anvil-faq` — Simple FAQ (section card)

_Wave-0 exemplar section. File `sections/anvil-faq.liquid`, editor name "FAQ". Spec: `docs/SPEC.md` §4.2 "Simple FAQ"; `docs/DESIGN-sections.md` §3 row `anvil-faq`. Contract: `docs/CONVENTIONS.md` §3–§4._

## Purpose
An accordion of up to 30 questions and answers. Each item is a native `<details><summary>` pair, so the section works with JavaScript disabled; `<anvil-collapsible>` from `anvil-core.js` adds the height animation and the optional single-open behaviour. Optional schema.org `FAQPage` JSON-LD. No section-specific JavaScript and no component CSS file; everything is in the section's `{% stylesheet %}` (about 2.6 KB).

## Markup (shopper view)
```
div#anchor.av-section.av-scheme--… .anvil-faq            ← anvil-section-attrs
  div.av-section__inner
    .av-section-head (h2 + subheading)                   ← anvil-section-head
    anvil-collapsible.av-faq.av-faq--lines|cards.av-faq--icon-plus|chevron[.av-faq--two-col][single]
      details.av-faq__item[open] {{ block.shopify_attributes }}   ×N
        summary.av-faq__summary
          h3.av-faq__question
          span.av-faq__icon[aria-hidden]  (plus + minus spans, or one chevron)
        div.av-faq__answer.av-rte
  script[type=application/ld+json]                       ← only when json_ld is on
```
Heading level: the section heading is the chassis `h2`; every question is an `h3` inside its `summary` (HTML allows heading content in `summary`).

## Settings
The 13 chassis settings come first, verbatim (see CONVENTIONS §4). Then:

| id | type | default | effect |
|---|---|---|---|
| `open_first` | checkbox | `true` | first `<details>` is rendered with the `open` attribute (works without JS) |
| `single_open` | checkbox | `false` | adds the `single` attribute to `<anvil-collapsible>`; with JS, opening one item closes the others. Without JS every item can stay open |
| `icon_style` | select `plus` / `chevron` | `plus` | plus/minus pair swapped by CSS on `[open]`, or one chevron rotated 180° on `[open]` |
| `item_style` | select `lines` / `cards` | `lines` | divider lines between items, or boxed items using the card radius/border tokens |
| `two_columns` | checkbox | `false` | ≥ 990 px: two-column grid, rows aligned at the top. Below that always one column |
| `json_ld` | checkbox | `false` | emits a `FAQPage` JSON-LD block (see below). Carries an honesty `info` |

19 non-header settings in total (13 chassis + 6). Preset "FAQ": heading "Frequently asked **questions**", `width: narrow`, four example items.

## Blocks
Local block `item` (name "Question"), `max_blocks: 30`:

| id | type | default | note |
|---|---|---|---|
| `question` | text | "Example question — replace with a real one" | escaped on output; it is the accessible name of the disclosure button |
| `answer` | richtext | `<p>Example answer — replace with a real one.</p>` | printed as rich text inside `.av-rte`; `info` reminds the merchant that delivery, returns and guarantee statements must match their policies |

`{{ block.shopify_attributes }}` sits on the `<details>` itself, so the editor's `shopify:block:select` handler in `anvil-core.js` (`target.closest('details')`) opens the item being edited and scrolls to it.

## Behaviour
- **Without JS:** native disclosure; `open_first` works; icons swap via `[open]`; `single_open` has no effect (all items can be open); no animation.
- **With JS:** `<anvil-collapsible>` intercepts summary clicks, animates the answer's height using `--av-dur`/`--av-ease`, adds `is-animating`/`is-closing` while it runs, and dispatches `anvil:collapsible:toggle`. The icon CSS uses `[open]:not(.is-closing)` so the icon flips back the moment a close starts rather than when the animation ends.
- **Keyboard:** `summary` is natively focusable; Enter/Space toggle; the global `:focus-visible` ring applies.
- **Reduced motion / animations off:** the chevron transition uses `--av-dur`, which `anvil-css-tokens` sets to `0ms` when the merchant turns animations off; the transition itself is wrapped in `@media (prefers-reduced-motion: no-preference)`. The core element skips the height animation under both conditions (`motionOff()`).
- **Icons** are rendered once with `anvil-icon` (`plus`, `minus` or `chevron-down`) and captured, then printed per item, so 30 items do not trigger 60 snippet renders.
- **Blank question:** on the storefront the item is skipped (a disclosure without a name is an accessibility failure). In the editor it is kept with the placeholder `anvil.faq.untitled_question` so the merchant can still select and fix it.
- **No blocks:** nothing renders beyond the heading; in the editor a one-line note (`anvil.faq.empty_editor_note`) explains how to add a question.
- **Editor:** block select opens the item (core.js); section/padding/scheme behave through the chassis.

## Structured data (`json_ld`)
Emitted only when the setting is on **and** at least one item has both a question and an answer. Shape: `FAQPage` → `mainEntity[]` of `Question{name, acceptedAnswer: Answer{text}}`. The answer keeps the richtext HTML (`p`, `strong`, `em`, `a`, `ul/ol/li`, `br`), which is what shoppers see and what Google documents as acceptable in `Answer.text`; the question is stripped of surrounding whitespace. Items are skipped when either text is blank. The block is built as a string inside the opening `{% liquid %}` tag so the file has exactly one `{% for block in section.blocks %}` tag (the rendering loop that the chassis lint checks for `shopify_attributes`).

The setting's `info` says to use it on one FAQ section per page and only for genuine Q&A that matches the visible content. It makes no promise about rich results; search engines decide whether and where to show FAQ data.

## Honesty notes
- Every default and preset string begins with "Example question —" / "Example answer —" and tells the merchant what real content to put there, so a store published unedited makes no factual claim.
- `answer.info`: delivery, returns and guarantee statements must match the store's policies.
- `json_ld.info`: one section per page, genuine questions only, content must match what shoppers see.
- No counters, timers, ratings or "verified" wording anywhere in this section.

## Styling decisions
- Questions use the body font at weight 600 and `--av-text-md`, not the heading font: FAQ questions are content rows, and a display heading font at 30 rows reads badly. Change in `.av-faq__question` if the brand wants otherwise.
- `cards` uses `--av-radius-card`, `--av-border-w-card`, `--av-shadow-sm` and a 3 % foreground tint; `lines` uses `--av-border`.
- Two-column mode is a CSS grid with `align-items: start` (not CSS multi-column) so an opening item never reflows its neighbour into the other column.
- All selectors start with `.av-faq`; the `html[data-animations="off"]` requirement is met through the `--av-dur` token rather than an `html …` selector.

## Implementation notes for later section agents
- Inside a `{% liquid %}` block, a `#` comment line must never contain a tag delimiter (`%}` or `{%`): the first `%}` closes the liquid tag and everything after it renders as text. Theme Check surfaces this as `UndefinedObject` on the variables assigned after that point; treat that warning as a parse bug, not a style nit.
- Render shared markup (icons) once, capture it, and print it per block.
- When you need a second pass over `section.blocks` (counting, JSON-LD), do it inside the opening `{% liquid %}` block with `for … in section.blocks` and string building; `scripts/chassis-lint.py` requires every `{% for … in section.blocks %}` *tag* to print `shopify_attributes`.
- Every selector in `{% stylesheet %}` starts with `.av-<slug>`; meet the `html[data-animations="off"]` rule through the `--av-dur` token instead of an `html …` selector.

## Locale keys added (`locales/en.default.json`, under `anvil.faq`)
| key | English |
|---|---|
| `anvil.faq.empty_editor_note` | Add a question with the + button in the editor. The storefront shows nothing here until you do. |
| `anvil.faq.untitled_question` | Untitled question — add the question text in this block's settings |

Both are rendered only in `request.design_mode`; the storefront reads no fixed string from this section.

## Contract assumptions (other clusters)
- `<anvil-collapsible>` from `assets/anvil-core.js`: wraps `<details>` children, `single` attribute closes siblings, animates `:scope > :not(summary)` (so the answer is the single element after `summary`), toggles `is-animating` / `is-closing`, reads `--av-dur` from computed style.
- `anvil-section-attrs` / `anvil-section-head` signatures per CONVENTIONS §5; `anvil-icon` has `plus`, `minus`, `chevron-down` and marks them `aria-hidden`.
- `anvil-base.css` provides `summary { list-style: none }` + marker removal, `.av-rte`, `.av-example-note`, the `:focus-visible` ring and the `h3` defaults that `.av-faq__question` resets.
- `anvil-css-tokens` sets `--av-dur` to `0ms` when `settings.animations_enabled` is off.
- `templates/page.faq.json` (owned by the templates cluster) is expected to add two `anvil-faq` sections with anchors `shipping` and `product`; see the open question on JSON-LD below.

## Uncertainties / open questions
1. **`h3` inside `summary`.** Valid HTML, but some screen readers expose the summary only as a button and drop the heading semantics. Alternative: a `<span>` and no heading, or a heading wrapping the whole `details`. Kept `h3` per CONVENTIONS §3; flag for the a11y pass.
2. **Two FAQ sections on `page.faq`.** If both enable `json_ld`, the page carries two `FAQPage` objects. Either the template preset turns it on for one section only, or a later `anvil-json-ld` pass merges them. The setting's `info` already says "one section per page".
3. **`disabled_on.groups: ["*"]`** keeps the FAQ out of header/footer/overlay groups. Validated locally by Theme Check's schema validation; shopify.dev was unreachable from this session for a documentation re-check.
4. **Native exclusive accordion** (`<details name="…">`) was not used for `single_open`: it would snap siblings closed before `<anvil-collapsible>` can animate them. Could be added later for a JS-off single-open mode if wanted.
5. **Answer HTML in JSON-LD.** Kept as HTML (what shoppers see). Switch to `strip_html` if a consumer other than Google is the target.
6. **Preset width `narrow`.** Chosen for readability; two-column mode on a narrow width is tight, so a merchant turning on `two_columns` may also want `width: page`.
