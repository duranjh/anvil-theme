# Scroll to top — `sections/anvil-scroll-top.liquid`

_Section card, 2026-10-15 (wave 2). Overlay section (`enabled_on.groups: ["custom.overlay"]`, `limit: 1`), reduced chassis. Spec: SPEC §4.2 "Scroll-to-top", DESIGN-sections §3. Script: `assets/anvil-scroll-top.js` (`<anvil-scroll-top>`). CSS: the section's `{% stylesheet %}`._

## Purpose
A floating round button that appears once a shopper has scrolled down a page and takes them back to the top.

## Settings
Reduced chassis first (CONVENTIONS §4), with these meanings for a floating button:
- `color_scheme`: the button uses the scheme's button colours (`--av-btn-bg`, `--av-btn-fg`, `--av-btn-border`), or its background, text and input-border colours with the bordered style.
- `pad_bottom`: distance from the bottom of the screen (px). `pad_mobile` scales it on phones (same 1, compact 0.6, none 0), the same multiplier the chassis applies to padding.
- `pad_top`: not used (its `info` says so). It stays because the reduced chassis requires it.
- `show_on`: all devices, phones only, desktop only (chassis classes on the root).

Section settings:
| id | type | values | default |
|---|---|---|---|
| `show_after` | range | 100–2000 px, step 50 | 400 |
| `position` | select | `right` (bottom right), `left` (bottom left), `center` (bottom centre); `info` asks merchants who use the audio player to put it in a different corner | `right` |
| `icon` | select | `arrow-up`, `chevron-up`, `rocket` (anvil-icon names) | `arrow-up` |
| `size` | range | 44–72 px, step 4 | 48 |
| `shape` | select | `circle` (round), `theme` (theme button corners) | `circle` |
| `style` | select | `button` (button colours), `surface` (background colour with border) | `button` |
| `label` | text | optional visible text beside the icon | blank |

No blocks. Preset "Scroll to top".

## Behaviour
- The section root takes no room: the stylesheet zeroes its padding and background (`.av-section.av-s-anvil-scroll-top`, the chassis type class; same pattern as `.av-s-main-cart-footer`). `<anvil-scroll-top>` is `position: fixed` in the chosen corner, with the page gutter (`--av-gutter`, or the safe-area inset when that is larger) as the side distance.
- Clicks: the fixed host has `pointer-events: none` and only the button has `pointer-events: auto`. A `visibility: hidden` button cannot be hit, so while the button is hidden (the first `show_after` px of every page, while a drawer is open) taps in its corner reach the page underneath, for example a hero link or the Add to cart button.
- The button starts hidden (`opacity: 0; visibility: hidden`), so it is out of the tab order and the accessibility tree. The script adds `.av-is-in` when `window.scrollY` passes `show_after`, and also while the button holds focus, so focus is never left on a hidden control. Scroll handling is one passive listener batched with `requestAnimationFrame`.
- Click: when the button had focus, focus moves first (with `preventScroll`) to the first focusable element of the page (`Anvil.dom.focusables(document.body)[0]`, the layout's skip link; before core has loaded, `.av-skip-link`, else `#main`), so the next Tab starts at the top. Then `scrollTo({ top: 0 })` runs, smooth only when motion is allowed (`Anvil.dom.motionOff()`, falling back to the same two checks if core has not loaded yet).
- Showing and hiding fades and lifts the button (opacity and transform, `--av-dur`) only under `prefers-reduced-motion: no-preference` and without `html[data-animations="off"]`. The icon moves up 2 px on hover under the same conditions.
- The button moves up by `--av-sticky-bar-h` (set on `:root` by `assets/anvil-product.js` while the sticky add-to-cart bar shows), so the two never overlap.
- Drawers and dialogs: the button is hidden (`opacity: 0; visibility: hidden`) while `html.av-scroll-locked` is set, which `Anvil.dom.lockScroll()` adds for every `<anvil-drawer>` and `<anvil-dialog>`. Its `z-index: 50` does not keep it under the header's phone menu: the header wrapper is `position: sticky; z-index: 40`, which caps the drawer (overlay 61, panel 70) at 40 in the root stacking context, so without this rule the inert button would sit over the open menu panel and its backdrop. The cart drawer, search and popups use `<dialog>` `showModal()` (top layer) and are above it anyway; the rule hides it there too.
- Audio player (`sections/anvil-audio.liquid`) uses the same `z-index` and the same bottom distance. The button rises by `--av-scroll-top-lift` (54 px player height + `--av-space-2`) when the player can sit under it: player in the same position; any open player (`.av-audio__toggle[aria-expanded="true"]`) when the button is centred; and on phones any open player, since it can span the screen width. These are `html:has(…)` rules; browsers without `:has()` keep the button at its normal distance.
- Accessibility: a native `<button type="button">` of at least 44 × 44 px. Icon-only, it is named by `aria-label` = `anvil.a11y.back_to_top` ("Back to top", an existing key); with `label` set the visible text names it and no `aria-label` is written (label in name, WCAG 2.5.3). The icon is `aria-hidden`. The global `:focus-visible` ring applies. Forced-colours mode draws a `ButtonText` border; print hides the button.
- No JavaScript: the button never shows, because it cannot work without the script.
- Theme editor: nothing shows on load (same rule as the storefront: only after scrolling). `data-anvil-editor-open` lets `assets/anvil-editor.js` call `open()` when the merchant selects the section, so the button shows while it is being edited, and `close()` on deselect. `shopify:section:load` re-renders it; the element removes its listeners in `disconnectedCallback`.

## Honesty notes
Nothing here states a claim, a price or a count. The only shopper-facing words are the locale string "Back to top" and the merchant's optional label.

## Locale keys
None new: uses `anvil.a11y.back_to_top`.

## Budgets
`assets/anvil-scroll-top.js`: about 2.4 KB raw, 1.06 KB gzipped (section budget 2 KB). Section `{% stylesheet %}`: about 3.7 KB raw, 1.3 KB gzipped (limit 6 KB).

## Verified
A static copy of the rendered markup with `anvil-base.css` and the module, run in headless Chromium at 390 × 844, with and without forced reduced motion: the root is 0 px tall; the button starts hidden; it shows after scrolling past the threshold, 16 px from the right and 29 px from the bottom (48 × 0.6); a click moves focus off it and scrolls to 0, after which it hides; `open()` / `close()` show and hide it; it works again after being removed and re-inserted. Review fixes (2026-10-15), same harness with Chromium (playwright-core 1.63) at 390 × 844 and 1280 × 800: with the button hidden, `elementFromPoint` at its centre returns a full-width link placed under it and a real click on it fires once; shown, the button is hit and scrolls to 0; with `html.av-scroll-locked` it is `hidden` / opacity 0 and the link underneath is hit again, and it shows again after the class is removed; with a mock audio player the bottom distance goes from 29 px to 91 px on phones (same corner, or any open player) and from 48 px to 110 px on desktop (same corner, or centred button with an open player), and stays put otherwise. Not yet seen in the real theme editor or on the dev store.

## Uncertain
- `pad_top` has no visual effect on a floating button. The reduced chassis requires the id; its `info` says it is not used. An alternative would be to give it a meaning, but no "top" distance makes sense for a bottom-anchored button.
- Audio player: the lift assumes both sections keep the same bottom padding and a 54 px player (one line of title and artist). A player whose section has a different bottom padding, or that wraps an editor note or error message onto more lines, can still touch the button; the `position` info asks merchants to use different corners. The `:has()` rules also lift the button when the audio section is hidden on that device by its `show_on` (harmless: 62 px higher). A shared offset token for overlay widgets (audio, popup trigger) could replace this later.
- WCAG 2.4.11 (Focus Not Obscured): a 44–72 px button in a corner can partly cover a focused element underneath it near the bottom of the screen. The page does not get a matching `scroll-padding-bottom` (that belongs to the layout); the button is small, and it hides again near the top of the page.
- Focus moves to the first focusable element of the document, which is the skip link in `layout/theme.liquid`. When the layout changes, the fallback is `#main`.

## Integration pass (2026-10-15)
- Shipped enabled in `sections/overlay-group.json` (bottom right, after 600 px, 24 px from the bottom).

## Fix pass (2026-10-15)
- Availability: `enabled_on` "groups": ["custom.overlay"] (CONVENTIONS §4).
