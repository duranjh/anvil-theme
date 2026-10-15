# `anvil-custom-liquid` — Custom Liquid (section card)

_Wave-2 standard section. File `sections/anvil-custom-liquid.liquid`, editor name "Custom Liquid". Spec: `docs/spec/custom-liquid.md`; `docs/DESIGN-sections.md` §3 "Standard sections" (`anvil-custom-liquid`, ~60 lines); SPEC §4.1. Contract: `docs/CONVENTIONS.md` §3–§4._

## Purpose
A section that prints the merchant's own HTML and Liquid inside the Anvil chassis (colour scheme, width, padding, reveal, device visibility, anchor and the optional section heading). Typical uses: an embed code (map, form, booking widget), an app's install snippet, a one-off layout written in HTML, or Liquid that reads store data (`shop`, `customer`, `localization`, and on their own templates `product`, `collection`, `article`…). No JavaScript of its own and no asset files: the section CSS is 1,346 bytes raw (358 B gzipped) in its `{% stylesheet %}`.

## Markup (shopper view)
```
div#anchor.av-section.av-scheme--… .av-s-anvil-custom-liquid   ← anvil-section-attrs
  div.av-section__inner
    .av-section-head (h2 + subheading)                            ← anvil-section-head, only when set
    div.av-custom-liquid                                          ← the merchant's rendered code, as written
    p.av-custom-liquid__empty.av-example-note                     ← editor only: "invisible output" hint (see below)
    p.av-custom-liquid__empty.av-example-note                     ← editor only, instead of the div, when the code printed nothing
```
The code is rendered once, into a capture, before any markup is written. That lets the section see whether the code printed anything on this page:
- **It printed something** → the wrapper above with the output inside.
- **It printed nothing** (blank setting, or Liquid whose conditions all failed, such as `{% if customer %}` for a guest) **and the chassis heading and subheading are blank** → on the storefront the section renders nothing at all, so no padded empty band appears. Only Shopify's own empty `#shopify-section-<id>` wrapper remains.
- **It printed nothing but a heading or subheading is set** → the heading renders with the padding (the merchant asked for it).
- **In the theme editor** the section always renders, so it stays selectable, and shows one of two notes in a dashed box instead of the code: "add Liquid or HTML" when the setting is blank, or "your code printed nothing on this page" when it holds code that produced no output here. The blank test that picks between the two reads the setting a second time, so it runs only in this editor branch (see Contract assumptions).

"Printed nothing" means the output is empty after `strip`: whitespace-only output counts as empty; an HTML comment or a `<script>` counts as output.

**Output with nothing visible.** A script-only paste (a chat widget loader, a tracking tag, an app's install snippet) counts as output, so for shoppers the section is an empty band as tall as the padding (48 px top and bottom by default, less on phones with "Compact"). In the editor only, the section then adds a third dashed note under the output ("This code shows no text or media here…"), telling the merchant to set Top padding and Bottom padding to 0. The note appears when all of these hold: no heading or subheading; Top or Bottom padding above 0; the output is blank after `strip_html | strip`; and the output (lower-cased) contains none of `<iframe`, `<img`, `<picture`, `<video`, `<audio`, `<svg`, `<canvas`, `<object`, `<embed`, `<form`, `<input`, `<button`, `<select`, `<textarea`. Setting both paddings to 0 removes the note. It is a hint, not a verdict: an embed whose script fills an empty `<div>` later also triggers it, which is why the wording says "if it only loads a script". Padding 0 does not remove the theme-wide section gap (`--av-section-gap`, a theme setting), which applies between any two sections.

## Settings
The 13 chassis settings come first, verbatim (CONVENTIONS §4). Then, under the "Custom Liquid" header:

| id | type | default | effect |
|---|---|---|---|
| `custom_liquid` | liquid | — (the preset fills in an example) | printed as written inside `.av-custom-liquid`. Info: "Renders exactly as written and any script here loads on every view of this section, so what it shows is your responsibility: never use it for timers, stock counts, viewer counts, ratings or reviews that are not real." |

14 non-header settings in total (13 chassis + 1), exactly what the spec card names.

What Shopify allows in a `liquid` setting (shopify.dev, Input settings, `liquid`): HTML and "limited Liquid markup"; global objects and template objects on their own templates, standard tags and filters. Not available: `layout`, `content_for_header`, `content_for_layout`, `content_for_index`, **`section`**, `javascript`, `stylesheet`, `schema` and **`settings`**. At most 50 KB; invalid Liquid or a larger value is refused when the merchant saves. The value is not translatable in Translate & Adapt (Liquid can still print locale-dependent output, for example with `localization`).

The setting has no schema `default` on purpose: a template JSON that lists this section without the key would otherwise show example text. The example lives in the preset only.

## Blocks
None. The spec card names no blocks; app blocks are not offered either, because the same job (an app's code) is what the `liquid` setting is for, and Anvil already has `sections/apps.liquid` for app blocks.

Preset "Custom Liquid": heading blank, `custom_liquid` = `<p>Example custom Liquid — replace this with your own HTML or Liquid code.</p>`. It reads as an example and makes no claim.

`disabled_on.groups: ["custom.overlay"]`: the overlay group is for floating widgets (scroll-to-top, audio, popup) and renders after the footer, where a padded in-flow section would look like a stray band. Header and footer groups and every template can take it (a strip above the header, an embed above the footer). See open question 2.

## Behaviour
- **Without JS:** everything the section itself draws renders; there is nothing to enhance. Scripts in the merchant's code follow their own rules.
- **Keyboard / focus:** the section adds no controls; links and buttons in the merchant's code get the global `:focus-visible` ring.
- **Reduced motion:** nothing animates here. Reveal on scroll comes from the chassis (only from the third section on, only when motion is allowed). Animations in the merchant's code are the merchant's responsibility.
- **Styling of the output:** `anvil-base.css` sets `margin: 0` on `p`, `h1`–`h6`, `ul`, `ol`, `dl`, `figure`, `blockquote` and `pre`, so pasted prose such as `<h3>Shipping</h3><p>One</p><p>Two</p>` would otherwise have no space between blocks. The wrapper gives a direct-child prose block (`p`, `h1`–`h6`, `ul`, `ol`, `dl`, `blockquote`, `figure`, `pre`, `table`) `margin-top: 1em` when it follows a rendered sibling, which matches the `.av-rte > * + *` rhythm. A sibling that is `<script>`, `<style>` or `<link>` does not count, so a paste that starts with a style tag gets no stray top gap. Widgets (`div`, `iframe`, custom elements…) get no margin from the section. The rule is wrapped in `:where()`, so it weighs one class: any class the merchant styles wins. The wrapper also sets `min-width: 0` and `overflow-wrap: break-word` (a long URL cannot push the page wider than a phone). Beyond that spacing it does not apply `.av-rte` prose styles (font size, line height, accent links). `anvil-base.css` already caps `img`, `video`, `iframe`, `svg` and `canvas` at `max-width: 100%`.
- **Script-only code:** for a chat widget, tracking tag or app loader that shows nothing in place, set Top padding and Bottom padding to 0 (the editor hint above says so), or put the code in the footer group. Otherwise shoppers see an empty band in the section's colour scheme.
- **Editor re-renders:** Shopify re-renders the section's HTML when a setting changes and says page-load JavaScript "won't run again" (shopify.dev, Integrate sections and blocks with the theme editor). Whether inline `<script>` tags in a re-rendered section execute is not documented; a merchant's widget script may need a preview reload to reappear after an edit. The storefront is unaffected.
- **Section Rendering API:** the root keeps `data-anvil-section`; a swap re-renders the code like any other section.

## Honesty notes
- The section prints only what the merchant writes. It cannot verify it, so the `custom_liquid` `info` says the content is the merchant's responsibility and names the things Anvil refuses to fake (timers, stock counts, viewer counts, ratings, reviews). "Viewer counts" covers fake "N people are viewing this" or "someone just bought" snippets, which the Theme Store rule quoted in `docs/HONEST.md` names ("viewer activity counts"). The other three `liquid` settings (the custom Liquid blocks in `anvil-cart-drawer`, `anvil-featured-product` and `main-product`, DECISIONS 63) do not name viewer counts yet; the integrator was asked to align them.
- The spec card's note is in the same `info`: scripts placed here load on every view of this section (a performance and privacy cost the merchant should know about; CONVENTIONS §11's "zero third-party requests" holds for the theme, not for code a merchant adds).
- The preset text starts with "Example custom Liquid —", so an unedited section makes no claim.

## Styling decisions
- All selectors start with `.av-custom-liquid`. Tokens only: `--av-space-4` (gap between the output and the editor hint), `--av-space-5`, `--av-border`, `--av-radius-card`; the notes reuse `.av-example-note` from `anvil-base.css` and the dashed empty box used by Rich text and Icon bar. The prose spacing is `1em`, like `.av-rte`.
- The prose rule is written as one `:where(:not(script):not(style):not(link)+<el>)` selector per element, not as a `:where(<list>)+:where(<list>)` pair, because `chassis-lint.py` splits selectors on every comma and would read the list items as unscoped selectors.
- No `{% style %}` block: nothing is instance-specific beyond the chassis custom properties.

## Locale keys (to be added by the integrator)
- `anvil.editor.custom_liquid_blank` = "Add Liquid or HTML in this section's settings to show it here."
- `anvil.editor.custom_liquid_silent` = "Your code printed nothing on this page. Check its conditions, or preview a page where they apply. Shoppers never see this note."
- `anvil.editor.custom_liquid_invisible` = "This code shows no text or media here. If it only loads a script (a chat widget or tracking tag, for example), set Top padding and Bottom padding to 0 so shoppers do not see an empty band. Shoppers never see this note."

All three are editor-only (`request.design_mode`). The shared `anvil.editor.empty_section` ("Add blocks to show content here.") was not reused: this section has no blocks, so its wording would send the merchant looking for something that does not exist.

## Contract assumptions
- `anvil-section-attrs` and `anvil-section-head` per CONVENTIONS §5; `.av-example-note` from `anvil-base.css`.
- Printing `{{ s.custom_liquid }}` (with `s = section.settings`) renders the setting's Liquid, as `sections/anvil-cart-drawer.liquid` already does with `{{ bs.custom_liquid }}`; capturing that output and printing the capture gives the same HTML.
- An empty `liquid` setting is blank (shopify.dev returns "an `empty` object if nothing has been entered").
- **To verify on the first store render:** shopify.dev says reading a `liquid` setting returns "a string that contains the entered content" but not whether reading it (for example `!= blank`) runs the merchant's Liquid. The storefront therefore reads `s.custom_liquid` once, in the capture. The editor branch reads it again for the blank test. If reading runs the code, that test sees the (blank) output and the "silent" note never appears; check with `{% if customer %}x{% endif %}` while logged out in the editor. If it never appears, merge `custom_liquid_silent` and `custom_liquid_blank` into one note that covers both cases.
- `strip_html` "strips all HTML tags" (shopify.dev); it does not say whether it also drops the text inside `<script>` and `<style>`. If it keeps that text, an inline script's code reads as visible text and the "nothing visible" hint stays hidden. That fails quietly, toward no hint. A `<script src="…"></script>` loader has no inner text, so the hint still shows for it.

## Checks run (2026-10-15, after the review fixes)
- `shopify theme check --fail-level warning` (whole theme): this file's only findings are the three `TranslationKeyExists` for the keys above (expected until the integrator adds them). The other findings belong to other wave-2 sections.
- `scripts/chassis-lint.py --only sections/anvil-custom-liquid.liquid --strict`: clean, 0 warnings; the whole-theme run lists nothing for this file. `scripts/cleanroom-lint.sh`, `scripts/asset-audit.py`, `scripts/check-limits.sh`: clean.
- `{% stylesheet %}` 1,346 B raw / 358 B gzipped (limit 6,144 B); no JS. Schema name 13 characters; 14 settings.
- Not rendered on a store yet (the harness push is the first real render).

## Open questions
1. **Collapse when nothing prints.** The section renders nothing for shoppers when the code prints nothing and the heading is blank. That hides an empty padded band (the usual case for conditional code), but it also means the anchor id does not exist on such pages. Kept, because a link to an empty section has nothing to show anyway.
2. **Overlay group.** Disabled there (see Blocks). A merchant who wants code on every page (a chat widget loader, for example) can place this section in the footer group with padding 0 (the editor hint suggests this), or use an app embed. If the owner wants it in the overlay group, removing `custom.overlay` from `disabled_on` is the only change.
3. **Prose styles.** The output is not wrapped in `.av-rte`: pasted prose gets the 1em gap between blocks (see Styling of the output) but not the `.av-rte` font size, line height or accent link colour. A "Use theme text styles" checkbox would be a one-line addition if merchants ask; the spec card names only the code setting, so none was added.

## Integration pass (2026-10-15)
- The "viewer counts" wording was added to the custom Liquid info in the cart drawer, main product and Featured product (via `docs/product-blocks/custom_liquid.json` and `sync-block-schemas.py`).

## Fix pass (2026-10-15)
- Uses the shared pieces: the editor-only empty note from `snippets/anvil-editor-empty` (DECISIONS 87).
- Availability: `disabled_on` groups ["custom.overlay"] (CONVENTIONS §4, DECISIONS 100).
