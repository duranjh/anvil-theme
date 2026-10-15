# `anvil-tabs` — Content tabs (section card)

_Wave section. Files `sections/anvil-tabs.liquid` (editor name "Content tabs") and the private theme block `blocks/_anvil-tabs-tab.liquid` (editor name "Tab"). Spec: `docs/spec/tabs.md`; `docs/SPEC.md` §4.2 "Content tabs"; `docs/DESIGN-sections.md` §3. Contract: `docs/CONVENTIONS.md` §3–§4 and §6 (`<anvil-tabs>`)._

## Purpose
A row of tabs, each opening a panel of rich content such as Details, Materials and Care. Each panel holds any theme blocks (heading, text, image, button, icon with text, stars, countdown, group …) and app blocks. On phones the tab row scrolls sideways; from tablets up it sits left or centred. Tabs can show an underline or pills.

The section composes the shared component and adds no asset of its own:
- `assets/anvil-tabs.js` (`<anvil-tabs>`, roving focus, arrows / Home / End, `hash-sync`, `shopify:block:select`): 4,390 B raw, 1,612 B gzipped; read-only, not edited.
- `assets/anvil-tabs.css` (strip, underline indicator, `.av-tabs--pills`, `.av-tabs--center`, panel spacing, the no-JS rule that shows every panel): 2,159 B raw, 764 B gzipped; read-only, not edited.
- Section `{% stylesheet %}`: 2,559 B raw, 1,057 B gzipped. It lays out what sits inside a tab (icon + label) and inside a panel (columns, width, alignment, the no-JS titles), plus three strip fixes that belong in the component (see Assumptions: inset focus ring, `safe center`, thin scrollbar for mouse users).
- No section JavaScript.

## Markup (shopper view)
```
div#anchor.av-section … .av-s-anvil-tabs                         ← anvil-section-attrs
  div.av-section__inner                                           ← empty on the storefront when no tab renders
    .av-section-head (h2 + subheading)                            ← anvil-section-head
    h2.av-visually-hidden                                         ← only when the heading is blank ("Content tabs")
    link[stylesheet] anvil-tabs.css                               ← only when at least one tab renders
    div.av-tabs.av-tabs--underline|pills[.av-tabs--center] style="--av-tabs-icon: 20px"
      anvil-tabs[hash-sync]
        div.av-tabs__strip[role=tablist][aria-label]              ← section, from section.blocks
          button.av-tabs__tab[role=tab]#av-tabs-tab-<section>-<block>
                [aria-controls=<panel id>][aria-selected][tabindex 0|-1]   ×N
            span.av-tabs__label > span.av-tabs__icon (anvil-icon or uploaded image, alt="") + span.av-tabs__text
        div.av-tabs__panel[role=tabpanel]#<panel id>[aria-labelledby][hidden]   ← _anvil-tabs-tab, via content_for
              .av-tabs__panel--stack|split --left|center|right [--v-start] [--narrow]
              style="--av-tabs-gap: 24px" {{ block.shopify_attributes }}   ×N
          h3.av-tabs__title                                       ← shown only without JavaScript
          div.av-tabs__content > theme blocks / app blocks (content_for 'blocks')
    script[type=module] anvil-tabs.js                             ← only when at least one tab renders
```
- **Panel id:** the tab's "Tab link id" setting, handleized, or `av-tabs-<section.id>-<block.id>` when blank. **Tab id:** `av-tabs-tab-<section.id>-<block.id>`. The section and the block compute both from the same inputs, so `aria-controls` and `aria-labelledby` always pair up.
- **Open tab:** the first tab with a title (in the editor, simply the first tab). The section marks its button `aria-selected="true"` and `tabindex="0"`; the block leaves that panel visible and renders every other panel with `hidden`. Nothing moves when the module runs.
- **Heading levels:** the section always has an `h2`: the chassis heading, or a visually hidden one with the tab row's name (`anvil.tabs.list_label`) when the heading is blank (CONVENTIONS §3, as in `anvil-pricing`). The per-panel titles exist only for the no-JavaScript view and are always `h3`. Headings inside panels come from the merchant's Heading blocks; the presets set them to `h3`.
- The block uses `"tag": null`, so Shopify adds no wrapper `<div>` and the panels sit directly inside `<anvil-tabs>`. The panel is the block's single root element and the only element that carries `{{ block.shopify_attributes }}`; the tab buttons in the strip carry none (shopify.dev, theme block schema: "Only a single HTML element can be tagged with `{{ block.shopify_attributes }}`", the topmost element in the file).
- **Tab row name:** `aria-label` is the section heading with its tags stripped, printed with `escape_once` (the inline rich text is stored as HTML, so `&` arrives as `&amp;` and must not be escaped twice), or `anvil.tabs.list_label` when the heading is blank.

## Settings
The 13 chassis settings come first, exactly as the contract gives them. Then 4 of its own (17 in total):

| id | type | default | effect |
|---|---|---|---|
| `tab_style` | select `underline` / `pills` | `underline` | underline indicator (component default) or pills (`.av-tabs--pills`, button colours when selected) |
| `text_align` | select `left` / `center` | `center` | where the row of tabs sits (`.av-tabs--center`). The info says a row wider than the screen scrolls sideways on every device and asks for short titles |
| `icon_size` | range 16–32 px, step 2 | 20 | size of the tab icons (Lucide or uploaded image) |
| `hash_sync` | checkbox | `false` | adds `hash-sync` to `<anvil-tabs>`: a URL ending in `#<panel id>` opens that tab on load, and choosing a tab writes its id into the address bar with `history.replaceState` (no scroll, no history entry) |

Preset "Content tabs": heading "Take a closer **look**", three tabs:
1. "Example: Details" (icon Info, narrow content): Heading block (`h3`, small) + Text block, both example copy.
2. "Example: Materials" (icon Leaf, two columns): Image block (4:5, placeholder until an image is picked) + Text block.
3. "Example: Care" (icon Droplet, narrow content): Text block with an example list.

## Blocks
The section accepts one block type, the private theme block `_anvil-tabs-tab` ("Tab"). It sets no `max_blocks`, so the platform cap of 50 blocks per section applies (see Assumptions: whether nested blocks count is not documented). Private blocks are not offered by `@theme`, so Tab blocks only exist inside this section and app blocks cannot be dropped into the tab row.

`_anvil-tabs-tab` settings:

| id | type | default | note |
|---|---|---|---|
| `title` | text | "Example tab" | the tab's accessible name; info: a tab without a title is hidden from shoppers |
| `icon` | select (46 Lucide names + `none`) | `none` | decorative (`aria-hidden`), drawn before the title; every name exists in the `anvil-icon-*` lookups |
| `icon_image` | image_picker | — | replaces the icon; `image_tag` at 1× and 2× the icon size, `alt=""`; eager in the first two sections, lazy below; info: only artwork the merchant may use |
| `anchor` | text | — | "Tab link id": handleized into the panel id; used with "Open tabs from links" |
| `layout` | select `stack` / `split` | `stack` | blocks stacked, or a two-column grid from 750 px (blocks fill it in pairs: image + text) |
| `valign` | select `center` / `start` | `center` | vertical alignment of the two columns |
| `width` | select `full` / `narrow` | `full` | panel content at the container width, or centred at `--av-narrow-width` |
| `align` | text_alignment | `left` | label "App block alignment"; info: aligns app blocks and the title shown without JavaScript, theme blocks keep their own alignment setting |
| `gap` | range 0–64 px, step 4 | 24 | space between blocks (columns get at least `--av-space-6`) |

Child blocks: `@theme` and `@app`. Block preset "Tab": title "Example tab", a Heading block (`h3`, small) and a Text block.

## Behaviour
- **With JavaScript:** `<anvil-tabs>` selects on click, Enter and Space; ArrowLeft / ArrowRight move and select (wrapping), Home / End jump to the first / last tab. Only the selected tab is in the Tab order (roving `tabindex`); the open panel gets `tabindex="0"` so its content is reachable next. It emits `anvil:tabs:change` (bubbles) on every change.
- **Without JavaScript:** `anvil-tabs.css` shows every panel (`html.no-js`). The section hides the tab row (its buttons could not switch anything) and shows each panel's own title above its content, under `@media (scripting: none)`, so the page reads as titled sections in order.
- **Overflowing row:** a row wider than the screen scrolls sideways; each tab is at least 44 px tall. On touch screens the scrollbar stays hidden (component CSS). On devices with a fine pointer that can hover (`@media (hover: hover) and (pointer: fine)`), the section sets `scrollbar-width: thin`, which also overrides the component's `::-webkit-scrollbar { display: none }` in browsers that support `scrollbar-width` (MDN: Baseline 2024), so mouse users can reach every tab; older browsers keep the hidden scrollbar. The row also gets `overflow-y: hidden`, so the selected tab's underline (drawn 1 px below the tab) cannot raise a vertical scrollbar. A centred row that overflows uses `justify-content: safe center`, so the first tab can still be scrolled to (browsers without `safe` keep the component's plain centring).
- **Focus:** the scrolling row clips anything drawn outside a tab, so the global `:focus-visible` ring is drawn 4 px inside each tab (`outline-offset: -4px`). On a selected pill the ring uses the button text colour, because the pill background may equal the accent.
- **Reduced motion / animations off:** the only motion is the component's underline indicator, which transitions only under `prefers-reduced-motion: no-preference` and not with `html[data-animations="off"]`. Panels switch without animation.
- **Theme editor:** the editor outlines, selects and scrolls to a Tab block through its panel, the only element with `block.shopify_attributes`. Selecting a Tab block, or any block inside a panel, in the sidebar opens its tab (`shopify:block:select` bubbles from the panel or its children; the component maps it to the panel's tab). Clicking a tab in the preview switches the panel but does not select the block in the sidebar; click inside the panel for that. An untitled tab stays visible in the editor as "Untitled tab (hidden from shoppers)"; a section with no tabs shows `anvil.editor.empty_section`.
- **Images in panels** use the blocks' own loading (the Image block is lazy), so pictures in closed panels are fetched only when their tab opens.
- **Untitled tabs** are skipped on the storefront, button and panel alike. When every tab is untitled (or there are none), the storefront renders only the empty section skeleton (root and `.av-section__inner`): no heading, no `<anvil-tabs>`, no stylesheet, no script. The editor still renders the heading and the tabs with placeholders.

## Honesty notes
- Every preset string reads as an example ("Example: Details", "Example text — … Replace it before publishing", "Example step — replace with …"), so a store published unedited makes no claim about materials, care or the product.
- The section itself has no setting that could carry a price, a saving, a stock level, a rating or a timer. Those come only from the theme blocks placed in a panel, which carry their own honesty rules and `info` texts (Stars and Review stars need a source, Countdown needs a real end date, Text says "Only state things that are true for your store").
- `icon_image` info: upload only artwork the merchant is entitled to use (Anvil ships no logos).

## Assumptions and open questions
- **`section.blocks` with theme blocks.** The strip is built by looping `section.blocks` in the section and the block finds the open tab by looping `section.blocks` too. This assumes `section.blocks` lists the section's top-level theme blocks with their `id` and `settings` (shopify.dev documents `section.blocks` as "the blocks of the section" and shows `section.blocks.size` counting top-level slides; theme blocks "can reference the section object"). Confirm on the dev theme that the strip lists only the tabs, not the blocks nested in the panels.
- **chassis-lint false positive.** `scripts/chassis-lint.py` counts every block type that does not start with `@` as a local block, so it reports "[E] blocks loop never prints {{ block.shopify_attributes }}" and "[W] local blocks without `max_blocks`" for `_anvil-tabs-tab`, a private theme block with its own `blocks/` file (the same lint bug fails `anvil-columns`, `anvil-hero-slideshow` and `anvil-pricing`). The strip loop must not print the attributes: the panel already does, and shopify.dev allows one tagged element per block. Suggested lint fix: a `blocks` entry with a matching `blocks/<type>.liquid` file counts as a theme block (require `{% content_for 'blocks' %}`, skip the loop and `max_blocks` checks).
- **Strip fixes that belong in the component.** `assets/anvil-tabs.css` is a read-only shared file for this wave, so three fixes live in the section stylesheet, each scoped to `.av-tabs` and to this section's own strip classes: the inset focus ring (`.av-tabs .av-tabs__tab:focus-visible { outline-offset: -4px }`, plus the selected-pill ring colour), `.av-tabs.av-tabs--center .av-tabs__strip { justify-content: safe center }`, and the thin scrollbar for fine pointers with `overflow-y: hidden`. Every other user of `<anvil-tabs>` still has the clipped focus ring, the clipped centred row and the hidden scrollbar. The component owner should move them into `assets/anvil-tabs.css` (keyed on `anvil-tabs [role="tab"]` / `[role="tablist"]`, keeping `justify-content: center` before `safe center`), and then this section can drop them.
- **`max_blocks` and nested blocks.** shopify.dev (section schema, theme limits) gives 50 blocks per section, lowered by `max_blocks`, and says static blocks do not count; it does not say whether theme blocks nested inside a Tab count. With the earlier `max_blocks: 10` the preset (3 tabs + 6 child blocks = 9) would have left one block for the whole section if they do, so `max_blocks` was removed and the platform cap applies. Confirm in the editor on the dev theme: if only top-level blocks count, set `"max_blocks": 10` again; if nested blocks count, leave it unset.
- **JavaScript on but the module fails.** Liquid writes `hidden` on the closed panels (no layout shift), and the component only un-hides them under `html.no-js`. If `anvil-tabs.js` fails to load in a browser with JavaScript on, the first panel shows and the tabs do nothing. This is the component's contract; changing it (for example keying on `:defined`) would shift the layout on every load.
- **Block file name.** `docs/DESIGN-sections.md` names the private block `_anvil-tab`; the wave rules allow only `blocks/_anvil-tabs-*.liquid`, so it is `_anvil-tabs-tab`.
- **Tab link ids** must be unique on the page and differ from section anchors; Liquid cannot check ids across sections, so the info text asks for it.

## Gate results (2026-10-15, after review fixes)
- `shopify theme check --fail-level warning`: in this section's files only the 3 expected `TranslationKeyExists` errors for the two locale keys below. The whole-theme run reports 183 errors and 2 warnings, the rest in other wave sections.
- `cleanroom-lint`, `asset-audit`, `check-limits`: clean.
- `chassis-lint`: block file clean; section has the false positive above (1 error, 1 warning).
- Sizes: section CSS 2,559 B raw / 1,057 B gzipped (limit 6 KB raw); `anvil-tabs.css` 764 B gz and `anvil-tabs.js` 1,612 B gz, unchanged. No section JavaScript.

## Locale keys (added by the integrator)
- `anvil.tabs.list_label` = "Content tabs" (the tab row's name when the section heading is blank)
- `anvil.editor.tab_no_title` = "Untitled tab (hidden from shoppers)" (editor only)

## Integration pass (2026-10-15)
- The three strip fixes (safe centring, inner focus ring, thin scrollbar and `overflow-y: hidden`) moved into `assets/anvil-tabs.css`; chassis-lint recognises `_anvil-tabs-tab`.

## Fix pass (2026-10-15)
- Setting ids follow the theme-wide vocabulary (CONVENTIONS §5; DECISIONS 82–100); the tables above use the new ids: `tab_align` → `text_align`. Saved templates were migrated.
- Uses the shared pieces: eager or lazy media from `snippets/anvil-above-fold` (DECISIONS 85); the editor-only empty note from `snippets/anvil-editor-empty` (DECISIONS 87); a hidden fallback heading through `anvil-section-head` (DECISIONS 84).
- Availability: `disabled_on` groups ["header","custom.overlay"] (CONVENTIONS §4, DECISIONS 100).
