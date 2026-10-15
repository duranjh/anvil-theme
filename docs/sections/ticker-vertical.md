# `anvil-ticker-vertical` — Ticker (vertical) (section card)

_Wave-2 section. Files `sections/anvil-ticker-vertical.liquid` and `assets/anvil-ticker-vertical.js`, editor name "Ticker (vertical)". Spec: `docs/SPEC.md` §4.2 "Ticker (vertical)"; `docs/DESIGN-sections.md` §3 row `anvil-ticker-vertical`; brief `docs/agent-prompts/ticker-vertical.md`. Contract: `docs/CONVENTIONS.md` §3–§4._

## Purpose
Up to 12 short lines shown one at a time in the same place, each replaced by the next after a set interval, with a slide-up or fade transition. Typical use: a strip of store promises or news under the header or between sections. The section CSS lives in its `{% stylesheet %}` (4.8 KB raw, 1.5 KB gzip). The section module `assets/anvil-ticker-vertical.js` is 4.7 KB raw and 1.9 KB gzip (`gzip -9`), under the 2 KB section budget (CONVENTIONS §7).

## Markup (shopper view)
```
div#anchor.av-section.av-scheme--… .av-s-anvil-ticker-vertical            ← anvil-section-attrs
  div.av-section__inner
    .av-section-head (h2 + subheading, only when filled)                   ← anvil-section-head
    anvil-ticker-vertical.av-ticker-vertical.av-ticker-vertical--slide|fade
        .av-ticker-vertical--sm|md|lg|xl.av-ticker-vertical--left|center|right[.av-ticker-vertical--upper]
        [.av-ticker-vertical--multi.av-enhance]
        style="--av-ticker-vertical-h: 40px"
        (2+ lines:) interval="4" role="region" aria-roledescription="Carousel" aria-label="<heading text or Highlights>" (printed with `escape_once`: `strip_html` keeps the heading's stored entities, and `escape` would encode `&amp;` a second time)
      button.av-ticker-vertical__toggle.av-enhanced-only[data-anvil-toggle]   ← 2+ lines only; pause + play icons
      div.av-ticker-vertical__viewport[aria-live="polite"][data-anvil-viewport]
        div.av-ticker-vertical__item[.av-is-current] {{ block.shopify_attributes }}   ×N
            (2+ lines:) role="group" aria-label="Slide N of M" data-anvil-line
          a.av-ticker-vertical__text.av-ticker-vertical__link | span.av-ticker-vertical__text
    script[type=module] anvil-ticker-vertical.js                             ← 2+ lines only
```
No content heading: lines are short labels, not headings (CONVENTIONS §3). The only heading is the optional chassis `h2`.

With one line (or one non-blank line on the storefront), the section renders that line statically: no region role, no button, no module.

## Settings
The 13 chassis settings come first, verbatim (CONVENTIONS §4). Then:

| id | type | default | effect |
|---|---|---|---|
| `autoplay` | range 2–15 s, step 0.5 | `4` | time each line stays; written as the element's `interval` attribute. The `info` says shoppers can pause, that rotation waits on hover and focus, and that it starts paused on the first line for reduced-motion browsers and for every shopper when Theme settings > Animations > Enable animations is off |
| `height` | range 24–160 px, step 4 | `40` | minimum height of the line area (`--av-ticker-vertical-h`, padding included). A line that wraps on a phone makes the strip taller instead of being clipped |
| `transition` | select `slide` / `fade` | `slide` | slide: the old line moves up and out while the new one comes in from below. Fade: the old line fades out, then the new one fades in (half of `--av-dur` each), so two lines never overlap |
| `text_size` | select `sm` / `md` / `lg` / `xl` | `md` | `--av-text-*` token |
| `text_align` | text_alignment | `center` | line alignment |
| `uppercase` | checkbox | `false` | uppercase with 0.06em tracking |

19 non-header settings in total (13 chassis + 6). `disabled_on.groups: ["custom.overlay"]`, so the ticker can sit in the header or footer group as well as on templates. Preset "Ticker (vertical)": `pad_top` and `pad_bottom` 12 (a slim strip; the chassis default of 48 is too tall for one line), three example lines.

## Blocks
Local block `text` (name "Line"), `max_blocks: 12`:

| id | type | default | note |
|---|---|---|---|
| `text` | inline_richtext | "Example line — replace with a message that is true for your store" | bold, italic and links allowed. Honesty `info`: offers, shipping thresholds and dates must match the store's settings and policies; no deadlines or stock levels that are not real |
| `link` | url | — | optional; makes the whole line a link. When it is set and the text has its own links, the text is printed with `strip_html` (no nested anchors), which also drops bold and italic in that line; the `info` says both: "the line is then shown as plain text without links, bold or italic" |

A blank line is skipped on the storefront. In the editor it stays in the rotation with the shared note `anvil.editor.block_empty`, so the merchant can still select it. The "Slide N of M" names count only the lines that render.

## Behaviour
- **First paint and without JavaScript:** Liquid marks the first rendered line `.av-is-current`. The other lines stay in the same grid cell at `opacity: 0` (slide mode: also moved just below the viewport), so the strip has its final height from the first paint and never changes height while rotating. The pause button is `.av-enhanced-only`, so it shows only once the element is defined. Without JavaScript the first line stays put.
- **Rotation (module):** every `interval` seconds the next line becomes current. A line parked above (the one that left last time, which happens with two lines) first jumps back below with transitions off (`.av-is-instant`, then a reflow), so in slide mode the incoming line always enters from below. The old line changes from `.av-is-current` to `.av-is-leaving` before that reflow, so it never keeps the fade delay next to the new line. Other lines are already waiting below and need no reflow.
- **Pause (WCAG 2.2.2):** a 32 px button, first in DOM order (WAI-ARIA APG: the rotation control comes first) but drawn at the inline end. It switches between `anvil.a11y.pause` and `anvil.a11y.play` as its label (no `aria-pressed`, so the label and the state never contradict each other). Rotation also waits while the pointer is over the ticker, while keyboard focus is inside it (except on the button itself, so pressing Play works straight away), while the tab is hidden, while the ticker is off-screen (IntersectionObserver) and while one of its blocks is selected in the editor.
- **Reduced motion / animations off:** with `prefers-reduced-motion: reduce` or `html[data-animations="off"]` the module starts paused on the first line (the card's "reduced motion → first item") and the button offers Play. The `interval` info tells the merchant about both cases, because the theme setting's own info mentions only hover effects and reveals. If the shopper presses Play, lines change without a transition: the transition rules sit inside `prefers-reduced-motion: no-preference`, and `--av-dur` is `0ms` when the merchant turns animations off.
- **Keyboard:** links in hidden lines stay in the tab order. Focusing one brings its line forward, both through CSS (`:focus-within`, which also works without JavaScript) and through the module, which makes it the current line and pauses. The focus swap is instant: both `:focus-within` rules set `transition: none`, so the focused link is visible at once and the old line is gone at once, in slide and fade mode, with or without the module. `overflow: clip` on the viewport means focus can never scroll the hidden lines into view sideways. Links in lines draw the focus ring at a 1 px offset (2 px ring, 3 px total), so it fits inside the viewport's 4 px padding instead of losing its outer edge to the clip.
- **Screen readers:** every line stays in the accessibility tree as a `group` named "Slide N of M" inside a `region` carousel, so a screen-reader user can read every line at any time. Rotation only changes classes and opacity, which are not live-region changes, so nothing is announced while it runs or while it is stopped, and the ticker has no next or previous control whose changes could be announced. The viewport's `aria-live` (`off` while rotating, `polite` while stopped) is therefore inert today. It is not the APG live-region pattern, which relies on hidden slides appearing when shown; it is kept only so that the region stays quiet during rotation if the owner ever chooses to hide waiting lines (open question 1). The card's "aria-live=polite" item is met by every line being readable, not by announcements.
- **Editor:** `shopify:block:select` shows the selected line and holds it; `shopify:block:deselect` resumes. A section re-render reconnects the element; `disconnectedCallback` clears the timer, aborts every listener (one `AbortController`) and disconnects the observer.

## Honesty notes
- Default and preset lines start with "Example" and say what real content replaces them ("replace with your real threshold", "replace with the window in your refund policy"). An unedited store makes no factual claim.
- The `text` info warns against unreal deadlines and stock levels. The section has no counters, timers or "only N left" features, so nothing in it can count down or invent scarcity.
- The rotation is presentation only; it never hides content from assistive technology.

## Locale keys
| key | English | status |
|---|---|---|
| `anvil.a11y.highlights` | Highlights | **new, for the integrator**: the region's name when the section heading is blank. Until it exists, `shopify theme check` reports `TranslationKeyExists` on this file, and the default preset (no heading) would name the region "translation missing". Add `"ticker_vertical": { "label": "Highlights" }` under `anvil` in `locales/en.default.json` before release |
| `anvil.a11y.carousel` | Carousel | existing (roledescription) |
| `anvil.a11y.slide_of` | Slide {{ index }} of {{ total }} | existing (line names) |
| `anvil.a11y.pause` / `anvil.a11y.play` | Pause / Play | existing (button label; both are written as `data-anvil-pause` / `data-anvil-play`, so the module needs no `Anvil.strings` entry) |
| `anvil.editor.block_empty` | This block is empty. Fill in its settings to show it here. | existing (editor only) |
| `anvil.editor.empty_section` | Add blocks to show content here. | existing (editor only) |

## Contract assumptions
- `anvil-base.css` provides `.av-enhance:not(:defined) .av-enhanced-only { display: none }`, `.av-example-note`, `box-sizing: border-box` and the global `:focus-visible` ring.
- `anvil-css-tokens` sets `--av-dur` to `0ms` when animations are off; `--av-ease`, `--av-text-*`, `--av-space-*`, `--av-radius-pill` and `--av-fg-rgb` exist.
- `anvil-icon` has `pause` and `play` and marks them `aria-hidden`.
- `window.Anvil.dom.motionOff()` from `anvil-dom.js`; the module falls back to the same test when core has not loaded yet.
- Theme editor events bubble from the block element (the one carrying `shopify_attributes`) to the custom element, as `<anvil-slider>` also assumes.

## Verified
Static harness (section CSS and module, tokens stubbed) in a browser at 1024 px and 375 px: slide enters from below and leaves upward, also with two lines; fade runs out then in; pause and play change the label and icon and stop or restart the timer; hover, focus, editor select and deselect hold and release rotation; a focused link in a hidden line becomes current; with `data-animations="off"` it starts paused on line 1 with Play; without the module, line 1 shows and the button stays hidden; no horizontal scroll at 375 px; waiting lines sit outside the viewport's clip box. After the review fixes (headless Chrome, same harness): focusing a link in a hidden line swaps lines instantly with no running transitions in fade mode, in slide mode, and in the two-line case where the incoming line was parked above; a timer step in fade mode still fades the old line out with no delay and the new one in after half of `--av-dur`; the button label falls back to "Play" / "Pause" without its data attributes; at 375 px with a wrapped full-width link and no minimum height, the focus ring ends 1 px inside the viewport's padding box on every side. Not yet run on a Shopify dev theme (gate G3/G4 need the push credentials).

## Uncertainties / open questions
1. **`aria-live=polite` from the card (owner decision).** Recorded choice: the card item is met by every line staying readable; the attribute is present but inert, because no line ever enters or leaves the accessibility tree and there is no next or previous control. The other option is to hide waiting lines from assistive technology (`visibility: hidden` on non-current lines, outside `:focus-within`). Then `polite` would only matter while rotation is stopped, when lines do not change anyway, screen-reader users could reach only the current line, and links in hidden lines would leave the tab order. That costs more than it gives, so it was not done. If the owner instead wants the inert attribute removed, delete `aria-live` / `data-anvil-viewport` in the section and the `setAttribute('aria-live', …)` line in the module.
2. **Carousel semantics** (region + roledescription + "Slide N of M") follow CONVENTIONS §9 for carousels. For a strip of short promises, a plain list could read more simply; the conventions were followed.
3. **Reduced motion:** the card says "first item". The section starts paused on the first line but still offers Play (like `<anvil-slider>`), so these shoppers can reach the other lines on request. If the owner wants no Play button under reduced motion, hide `.av-ticker-vertical__toggle` in a `prefers-reduced-motion: reduce` block.
4. **Text-in-link handling:** when `link` is set and the text has its own links, `strip_html` also drops bold and italic in that line, and the `info` now says so. Removing only the anchor tags (keeping bold and italic) would need a `split: '<a '` loop in Liquid; it was left out as not worth the edge cases for a one-line strip.
5. **Templates:** SPEC §4.2 places a ticker on the home and landing templates; this section is not added to any template (templates are read-only in this wave). The integrator decides where it goes.

## Integration pass (2026-10-15)
- The region name uses the shared `anvil.a11y.highlights`. Not placed on a template (SPEC §5 names the horizontal ticker).

## Fix pass (2026-10-15)
- Setting ids follow the theme-wide vocabulary (CONVENTIONS §5; DECISIONS 82–100); the tables above use the new ids: `interval` → `autoplay`, `align` → `text_align`. Saved templates were migrated.
- Uses the shared pieces: the editor-only empty note from `snippets/anvil-editor-empty` (DECISIONS 87).
- Availability: `disabled_on` groups ["custom.overlay"] (CONVENTIONS §4, DECISIONS 100).
