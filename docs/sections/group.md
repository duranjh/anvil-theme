# Group — `sections/anvil-group.liquid`

_Section card, 2026-10-15. Wave 5. Built from `docs/agent-prompts/group.md` (CONVENTIONS, spec card, chassis API, exemplars) plus `docs/HONEST.md` and DECISIONS 1–67. One file: `sections/anvil-group.liquid`. No private blocks, no assets._

## Purpose
"Sections group" (SPEC §4.2): nested boxed areas, each with its own colour scheme and padding, holding grouped content. Design row (`docs/DESIGN-sections.md` §3 `anvil-group`): theme blocks `anvil-group` → `@theme`, key setting stack / 2-col, no JavaScript, nesting depth ≤ 8. The boxes are the existing **Group** theme block (`blocks/anvil-group.liquid`: scheme, stacked or side-by-side layout, width, alignment, gap, padding, border, rounded corners, nestable). This section is the page-level container for them. It sets the outer layout (stacked or two columns), the spacing between top-level blocks and their vertical alignment. It can also draw an optional content box in its own scheme behind the heading and blocks, which adds one more level of boxing. The section CSS is 1,492 B raw (475 B gzipped) in its `{% stylesheet %}`. There is no JS.

## Markup (shopper view)
```
div#anchor.av-section.av-scheme--… .av-s-anvil-group                 ← anvil-section-attrs
  div.av-section__inner
    div.av-group__panel[.av-group__panel--box.av-box.av-scheme.av-scheme--<id>]  style="--av-group-box-pad: Npx" (box only)
      .av-section-head (h2 + subheading)                               ← anvil-section-head, only when set
      p.av-group__note.av-example-note                                 ← editor only, section without blocks
      div.av-group[.av-group--two.av-group--r{1-1|3-2|2-3|2-1|1-2}.av-group--v-{stretch|start|center|end}
                   .av-group--{t|d}][.av-group--span][.av-group--compact]   style="--av-group-space: Npx"
        {% content_for 'blocks' %}
          div.av-group-block.av-scheme--…                              ← Group theme block (tag: null), nests further
          …any other theme block or app block
```
`.av-group` is a CSS grid. On phones it has one track. From the breakpoint it has two tracks whose widths come from `--av-group-cols`, which the ratio class sets. `min-width: 0` on every child stops a long word or a wide image from pushing a track wider. With `align-items: stretch` (the default), the boxes in a row share one height. The Group block is a flex column at `width: 100%`, so it fills that height.

## Settings
The 13 chassis settings come first, verbatim (CONVENTIONS §4). Then come the header "Group", a paragraph explaining nesting, 7 settings, the header "Content box" and 3 more settings. That makes 23 settings in total, within the 40 limit.

| id | type | default | effect |
|---|---|---|---|
| `layout` | select `stack` / `two` | `two` | the spec's stack / 2-col. `stack`: one column at every width. `two`: two columns from the breakpoint below |
| `col_split` | select `1-1` / `3-2` / `2-3` / `2-1` / `1-2` | `1-1` | column widths: equal, 60/40, 40/60, two thirds/one third, one third/two thirds (`minmax(0, Nfr)` tracks). Shown only for `two` (`visible_if`) |
| `cols_from` | select `tablet` / `desktop` | `tablet` | two columns from 750 px or from 990 px. Narrower screens stack the blocks in editor order. Shown only for `two` |
| `valign` | select `stretch` / `start` / `center` / `end` | `stretch` | vertical alignment of the blocks in a row. "Equal heights" lines up the boxes top and bottom. Shown only for `two` |
| `full_row` | checkbox | true | blocks that are not Group boxes (heading, text, button, app blocks placed straight in the section) span both columns (`grid-column: 1 / -1`), so each takes a full row of its own instead of a column. Grid auto-placement (no `dense` packing, which would reorder content visually) means a spanning block placed *between* two groups ends the row: the group before it sits alone in its row and the group after it starts a new row. The `info` text says so and tells the merchant to place these blocks above or below the groups. Shown only for `two` |
| `gap` | range 0–80 px, step 4 | 24 | space between top-level blocks, both rows and columns (`--av-group-space`) |
| `compact_mobile` | checkbox | true | below 750 px, top-level groups use at most 24 px padding (`min(--av-group-pad, --av-space-5)`) and groups inside groups use at most 12 px (`--av-space-3`). This keeps room for content in nested boxes on a 320–375 px screen. From 750 px every group uses its own padding again |
| `box` | checkbox | false | draws the heading and the blocks on a panel in its own scheme. The panel reuses the theme's `.av-box` container, so its corners, border and shadow follow Theme settings > Content containers (`--av-radius-box`, `--av-border-w-box`, `--av-shadow-box`). On the storefront the panel is drawn only when the section has blocks, a heading or a subheading (`has_content`), so shoppers never see an empty coloured card. In the editor it is always drawn, around the empty-section note |
| `box_scheme` | color_scheme | `scheme-2` | the panel's scheme (shown while `box` is on). The default differs from the section default, so ticking the box changes something visible |
| `box_pad` | range 0–80 px, step 4 | 32 | the panel's padding (shown while `box` is on). Phones use at most 24 px |

`schema.name` is "Group". `disabled_on.groups: ["header", "custom.overlay"]`, as for Columns and Rich text: templates and the footer group can use it.

## Blocks
`"blocks": [{ "type": "@theme" }, { "type": "@app" }]`. Every public theme block can go in: Group, heading, text, button, image, text with icon, stars, review badge, countdown, add-to-cart, spacer, divider. App blocks can go in too. `content_for 'blocks'` renders them. Each theme block prints its own `{{ block.shopify_attributes }}` (all Anvil theme blocks use `"tag": null`). The section has no local blocks and no `max_blocks`, for the reason given in `docs/sections/columns.md` open question 1.

**Depth ≤ 8.** shopify.dev (theme block schema): "Theme blocks can be nested up to 8 levels deep, excluding the section level." The count includes content blocks, not only Groups: a top-level Group is level 1 and its heading is level 2, so a Group at level 8 can hold nothing and the deepest Group that can hold content sits at level 7. Shopify enforces the limit in the editor. The section adds no level of its own, and the content box is a section setting, not a block. The settings paragraph tells the merchant: "Groups can hold other groups; Shopify allows 8 levels of blocks in all, counting the content inside the innermost group." On phones, `compact_mobile` keeps padding from piling up across levels.

### Presets
1. **Group**: chassis heading "Example heading — two **boxes**, side by side" (`h2`), two columns, equal widths. It holds two Group blocks: scheme-2 and scheme-3, padding 32, gap 16. Each has an `h3` Heading (size small), an example Text and a button "Shop all products" → `/collections/all` (secondary in the first box, primary in the second).
2. **Group with nested boxes**: chassis heading "Example heading — boxes inside a **box**", stacked, narrow width, content box on (scheme-2). It holds one Group (scheme-1, padding 32) containing an `h3` Heading, an example Text and an invisible row Group (padding 0, side by side). That row holds two bordered Groups (scheme-2, padding 24), each with an `h4` Heading and a short example Text. A centred primary button sits below, straight in the section. Nesting depth: section → group → group → group → heading (4 levels).

Only the two presets guarantee the heading outline: chassis `h2`, then `h3` in the boxes, then `h4` in the inner boxes (CONVENTIONS §3). A Group added from the block picker brings the Group block's own preset, whose Heading has no `tag` and so falls back to the Heading block's default `h2`, a sibling of the section `h2`. A bare Heading block added straight into the section is also `h2`. Merchants can set "Heading level" on each Heading, but the default is wrong until the block preset changes (open question 6).

## Behaviour
- **Without JS:** everything renders; nothing needs enhancing. Blocks with their own scripts follow their own rules.
- **Keyboard and reading order:** only the blocks' own controls take focus, with the global `:focus-visible` ring. Visual order always follows DOM order (editor order). Nothing is reordered with `order` or `*-reverse`, so focus order matches what the shopper sees (WCAG 1.3.2, 2.4.3). For that reason the section has no "reverse on phones" option.
- **Reduced motion:** nothing animates. Reveal on scroll comes from the chassis.
- **Odd number of boxes in two columns:** blocks fill the tracks left to right, so a box left over at the end sits in the first column and the second stays empty. With `full_row` off, a heading placed straight in the section takes a column like any box.
- **No blocks:** the grid is empty and takes no height. The editor shows the shared note `anvil.editor.empty_section` in a dashed box. On the storefront, a section with the content box on but no blocks, heading or subheading drops the box, so nothing visible renders beyond the section padding.
- **Editor:** adding, nesting, reordering and selecting blocks all go through Shopify's theme-block handling. No `shopify:*` handlers are needed.

## Honesty notes
- The section prints no claims, numbers, ratings, timers or badges. The nested countdown, stars, review badge, text-with-icon and add-to-cart blocks carry their own honesty rules and `info` texts. The section passes nothing to them.
- Preset copy reads as examples ("Example heading —", "Example box —", "Example text —"). The texts remind the merchant to state only what is true.
- No setting here can mislead, so no honesty `info` was needed. The `info` texts explain layout behaviour.

## Styling decisions
- Every selector starts with `.av-group` (`.av-group-block` is the theme block's own class; the section only places it in the grid and, with `compact_mobile`, caps its padding on phones).
- Custom properties are section-specific (`--av-group-space`, `--av-group-cols`, `--av-group-box-pad`), so they never collide with the block's own `--av-group-gap` and `--av-group-pad`. The phone padding cap reads the block's `--av-group-pad`, so it never makes a box roomier than the merchant set.
- Tokens only: `--av-space-3`, `--av-space-4`, `--av-space-5`, `--av-border`, `--av-radius-card`. The panel composes `.av-box` and `.av-scheme--<id>` from `anvil-base.css` and overrides only the padding (a two-class selector, as `anvil-image-banner` does).
- Mobile first: the phone caps are the base rules, and `min-width: 750px` restores the merchant's padding.
- Checked in a static mock (base CSS, the Group and Heading block CSS and this stylesheet, rendered at 1280 px and 375 px in headless Chromium): equal-height boxes, full-row spanning, the content box and the phone padding caps (24 px top-level, 12 px nested, panel 24 px) all render as described.

## Locale keys
None new. Uses the existing `anvil.editor.empty_section` (editor only).

## Contract assumptions
- `section.blocks.size` counts only top-level blocks, as `anvil-rich-text` and `anvil-columns` assume. It drives the empty-editor note and, with the heading and subheading, whether the content box is drawn on the storefront.
- The Group theme block keeps its root class `.av-group-block` and its inline `--av-group-pad` custom property (`blocks/anvil-group.liquid`, read-only here). If either is renamed, `full_row` would span the boxes too, and `compact_mobile` would stop working. Neither change would break the layout.
- `.av-box` and its `--av-*-box` tokens stay in `anvil-base.css` (Theme settings > Content containers).

## Gate results (2026-10-15)
- `shopify theme check --fail-level warning`: 0 findings in `sections/anvil-group.liquid`. The whole-theme run showed 184 `TranslationKeyExists` errors, all in other wave sections and blocks waiting for their locale keys.
- `cleanroom-lint`, `asset-audit`, `check-limits`: clean. `chassis-lint`: 0 findings in this file (the whole-tree run reports 4 errors and 4 warnings, all in other sections' in-progress files).
- Review fixes applied the same day: content box gated on content, `full_row` info text, nesting-depth wording, presets-only heading outline (open question 6).
- CSS: 1,492 B raw / 475 B gzipped (limit 6 KB raw). JS: none.

## Open questions
1. **Featuring Group in the block picker.** shopify.dev allows a section to list named theme blocks next to `@theme` (for example `[{"type": "anvil-group"}, {"type": "@theme"}, {"type": "@app"}]`), and the editor then features them in the picker. `scripts/chassis-lint.py` counts every type without `@` as a local block, so that list fails "local + @theme". The section offers plain `@theme` + `@app`, and the settings paragraph points the merchant to Group. The suggested lint fix is the same as in `docs/sections/columns.md` open question 3: treat a type with no `name`/`settings` in the section schema as a theme-block reference.
2. **Same name as the block.** The section and the theme block are both called "Group". They appear in different pickers ("Add section" and "Add block"), and SPEC calls this "Sections group". If merchants find it confusing, the section could become "Group section" or "Boxed group" (both ≤ 25 characters).
3. **Heading outline with a blank section heading.** The presets use `h2` → `h3` → `h4`. A merchant who clears the chassis heading leaves `h3` box headings with no `h2` above them. The chassis heading's `info` is fixed by the contract, so the section cannot warn about this. Columns and Rich text share the issue. A shared rule (for example a visually hidden `h2` from the section name) would need a chassis decision.
4. **Image sizes inside boxes** (same as `docs/sections/columns.md` open question 4): `blocks/anvil-image.liquid` cannot know it sits in half of a two-column row, so its `sizes` overstates the width.
5. **Add-to-cart enhancement** (same as `docs/sections/columns.md` open question 5): the add-to-cart theme block works as a native form post here. Its drawer enhancement depends on a fix in the block.
6. **Heading level in the Group block preset** (owner of `blocks/anvil-group.liquid`). The block's preset inserts `{ "type": "anvil-heading", "settings": { "heading": "Example group heading", "size": "sm" } }` with no `tag`, so every Group a merchant adds from the picker brings an `h2` box heading next to the section `h2`, against CONVENTIONS §3 ("Content headings inside blocks are `<h3>`"). Suggested fix: add `"tag": "h3"` to that heading entry (`blocks/anvil-group.liquid`, preset `blocks[0].settings`). A Group nested in a Group would still bring `h3`; the merchant sets `h4` there by hand, as the nested preset of this section does. A bare Heading block placed straight in the section stays `h2` (the Heading block's default), which is correct there only when the section heading is blank.

## Integration pass (2026-10-15)
- The Group block's preset heading now ships as `h3`. chassis-lint accepts a theme-block reference such as `{"type": "anvil-group"}` in a section's `blocks`, so the section could feature Group in the picker; the schema was left at `@theme` + `@app`.

## Fix pass (2026-10-15)
- Setting ids follow the theme-wide vocabulary (CONVENTIONS §5; DECISIONS 82–100); the tables above use the new ids: `ratio` → `col_split`. Saved templates were migrated.
- Uses the shared pieces: the editor-only empty note from `snippets/anvil-editor-empty` (DECISIONS 87).
- Availability: `disabled_on` groups ["header","custom.overlay"] (CONVENTIONS §4, DECISIONS 100).
