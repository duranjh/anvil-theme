# Music player — `sections/anvil-audio.liquid`

_Section card, 2026-10-15 (wave 2). Overlay section (`enabled_on.groups: ["custom.overlay"]`, `limit: 1`), reduced chassis. Spec: SPEC §4.2 "Music player" (and §2.5 "Audio player"), DESIGN-sections §3. Script: `assets/anvil-audio.js` (`<anvil-audio>`). CSS: the section's `{% stylesheet %}`._

## Purpose
A small floating player for background music the merchant hosts (Content > Files). It shows its controls at all times and plays only when the shopper presses Play. It is off by default: `sections/overlay-group.json` ships without it, so a store has no player until the merchant adds the section in the Overlay group and pastes a file link.

## Settings
Reduced chassis first (CONVENTIONS §4), with these meanings for a floating player (same as `anvil-scroll-top`):
- `color_scheme`: the player takes the scheme's background, gradient, text and border colours; the Play button is the shared primary icon button (`.av-btn .av-btn--primary .av-btn--icon`), so it takes the scheme's button colours, the Theme settings hover style, `--av-shadow-button` and the shared focus ring.
- `pad_bottom`: distance from the bottom of the screen (px). `pad_mobile` scales it on phones (same 1, compact 0.6, none 0).
- `pad_top`: not used (its `info` says so). It stays because the reduced chassis requires it.
- `show_on`: all devices, phones only, desktop only (chassis classes on the root). When a resize or rotation hides the player (for example phones only, rotated past 750 px), the module pauses the music, so nothing plays without a visible control.

Section settings:
| id | type | values | default |
|---|---|---|---|
| `audio_url` | url | link to an audio file (Shopify Files or any URL the merchant controls) | blank (nothing renders on the storefront) |
| `track_title` | text | shown in the player and named by the Play button's description | "Example track — replace with your own" |
| `artist` | text | optional second line (artist credit) | blank |
| `position` | select | `left` (bottom left), `right` (bottom right), `center` (bottom centre) | `left` |
| `start_collapsed` | checkbox | the player first shows folded: Play plus the fold button | false |
| `start_muted` | checkbox | the speaker control starts in its muted state | false |
| `volume` | range | 10–100 %, step 10 | 60 |
| `loop` | checkbox | repeat the track | true |

No blocks. Preset "Music player". 13 settings (limit 40).

## Behaviour
- **Never autoplays.** The `<audio>` element has no `autoplay` attribute and `preload="none"`, so it downloads nothing until the shopper presses Play, and the module calls `play()` only from that button's click. Nothing resumes by itself on the next page. (Verified: no request for the file before the click.)
- **Layout.** The section root takes no room (`.av-section.av-s-anvil-audio { padding: 0; background: none }`, the scroll-to-top pattern). `<anvil-audio>` is `position: fixed` in the chosen bottom corner (or centred), with the page gutter (`--av-gutter`, or the safe-area inset when larger) as the side distance, `pad_bottom` (× `pad_mobile` below 750 px) plus `--av-sticky-bar-h` (set by `assets/anvil-product.js` while the sticky add-to-cart bar shows) plus the bottom safe-area inset as the bottom distance. It never grows wider than the screen minus two gutters; the title and credit truncate with an ellipsis. `z-index: 50`, the same as the scroll-to-top button: under the header drawers (60–70), the sticky bar (60) and every `<dialog>` (top layer).
- **Page room (WCAG 2.4.11).** The module watches the player (`ResizeObserver` plus window `resize`) and writes `--av-audio-space` on `<html>`: the player's height plus its bottom offset, without the sticky bar's height (0 when the player is not rendered). The section CSS adds `html:has(anvil-audio:defined) body { padding-bottom }` and `html:has(anvil-audio:defined) { scroll-padding-bottom }`, both `calc(var(--av-audio-space, 0px) + var(--av-sticky-bar-h, 0px))`. These selectors outrank `html.av-is-sticky-shown` in `assets/anvil-sticky-bar.css`, so the two rooms add up. The footer's last row stays reachable above the player, and keyboard focus and scroll-into-view stop above it. `disconnectedCallback` removes the property when no player is left. Without JavaScript (or without `:has()` support) no padding is added.
- **Controls**, all native `<button type="button">` at 44 × 44 px. DOM order is visual order, so tab order follows the screen: bottom left renders fold, Play, panel (title, credit, Mute); bottom right and centre render Play, panel, fold (Liquid prints the captured fold button before or after the panel, with no CSS `order`).
  - Play: always visible, folded or not. `aria-label` "Play" (`anvil.a11y.play`, existing key) with `aria-pressed` (pressed = playing), described by the track title (`aria-describedby`). Its icon swaps between play and pause from the `aria-pressed` state.
  - Mute: `aria-label` "Mute" with `aria-pressed` (pressed = muted); the icon swaps between `volume-2` and `volume-x`.
  - Fold: `aria-label` "Player controls" with `aria-expanded` and `aria-controls` on the panel. Folding hides only the title, the credit and Mute; Play/Pause stays, so stopping the music always takes one press. Folded, the fold button shows a music icon, or three bars while music plays. The chevron points towards the edge the player folds to.
  - The states follow the media element's own `play`, `pause`, `ended` and `volumechange` events, so the buttons stay right when the track ends (loop off) or the browser pauses it.
- **Region.** The player is `role="region"` named "Music player", so screen-reader users can find it from the landmarks list.
- **Errors.** When the file fails to load or play (`error` event, or a rejected `play()` other than `AbortError`), the module pauses, resets the buttons, opens the panel if it was folded (a live region inside a hidden panel is neither seen nor announced) and writes `anvil.audio.error` into the status line (`role="status"`). The line uses the scheme's text colour (`--av-fg`, weight 600), not the global error colour, so it keeps the scheme's contrast on a dark player. Pressing Play again retries: after a failed load the media element keeps its error and `play()` alone never fetches again (HTML spec), so the module calls `load()` first and continues from the stored position on `loadedmetadata`.
- **Memory within one tab.** On `pagehide` the module stores the playback position, the mute state and the folded state in `sessionStorage` under `anvil-audio:<file link>`, so the next page starts folded or open as the shopper left it, with the same mute choice, and Play continues from the stored position (applied on `loadedmetadata`, so it works with `preload="none"`). A finished, non-looping track restarts from 0. Storage errors are caught; the player then starts fresh. Nothing personal is stored.
- **Volume.** `volume` sets `HTMLMediaElement.volume` (0.1–1). iOS and iPadOS keep the device volume (the property is read-only there); the setting's `info` says so.
- **Motion.** The three bars move (transform `scaleY`, 0.9 s alternate) only under `prefers-reduced-motion: no-preference` without `html[data-animations="off"]`, and only while music plays; otherwise they stand still at three heights. Nothing else animates.
- **No JavaScript.** `<anvil-audio>` stays hidden until its module defines it (`.av-audio:not(:defined) { display: none }`), so shoppers never see buttons that cannot work. A `<noscript>` copy gives shoppers without JavaScript the same card, with the title, the credit line and the browser's own `<audio controls preload="none">` (same `muted` and `loop`), also never autoplaying. If JavaScript runs but the module fails to load, no player shows.
- **Theme editor.** On load the player renders folded (Liquid forces `start_collapsed` under `request.design_mode`) and silent, and the module neither reads nor writes `sessionStorage`. `data-anvil-editor-open` lets `assets/anvil-editor.js` call `open()` when the merchant selects the section and `close()` on deselect; `close()` also pauses in the editor. A settings change re-renders the section and fires `shopify:section:load`, which opens the new player so it stays in view while being edited. `disconnectedCallback` aborts every listener and pauses. Editor hints sit outside the foldable panel, next to Play, so they show on load while the player is folded: without a file link, `anvil.editor.audio_no_file` (Play and Mute disabled); with a link whose path does not end in a common audio extension (mp3, m4a, aac, mp4, ogg, oga, opus, wav, webm, flac), `anvil.editor.audio_not_file` (editor only; streams without an extension still render for shoppers). In the editor the player also shows before its module is defined (`.av-design-mode .av-audio:not(:defined) { display: flex }`), so the hint is visible even if the module runs late after a first add.
- **Forced colours** draws a `CanvasText` border on the player and `ButtonText` borders on the buttons; the three bars use `forced-color-adjust: none` with a `ButtonText` fill so they do not vanish into the background. Print hides the player.

## Honesty notes
- No autoplay of any kind, muted or not (spec card: "never autoplays"). "Start muted" only sets the speaker control's starting state; its `info` explains that pressing Play then starts the track silently until the shopper turns the sound on.
- The `audio_url` `info` asks the merchant to play only music they hold a licence for, and the credit line exists so the artist can be named as a licence asks.
- The default title reads as an example ("Example track — replace with your own"), and nothing at all renders on the storefront until a file link is set, so an unedited store never shows a player.
- The only network request the player can make is the merchant's own file, and only after a shopper presses Play (zero requests on page load).

## Locale keys (to be added by the integrator)
- `anvil.audio.label` = "Music player"
- `anvil.audio.controls` = "Player controls"
- `anvil.media.mute` = "Mute"
- `anvil.audio.error` = "This track can't be played right now."
- `anvil.editor.audio_no_file` = "Add an audio file link in this section's settings. Shoppers see nothing until you do."
- `anvil.editor.audio_not_file` = "This link does not end in an audio file type such as .mp3, so it may not play."

Existing key used: `anvil.a11y.play`.

## Budgets
`assets/anvil-audio.js`: 4,694 B raw, 1,826 B gzipped (section budget 2 KB; check-limits 4 KB). Section `{% stylesheet %}`: 5,205 B raw, 1,807 B gzipped (limit 6 KB).

## Verified
A static copy of the rendered markup with `anvil-base.css`, the section CSS and the module, driven in headless Chromium at 390 × 844 and 1280 × 800: the root is 0 px tall; the player sits 16 px from the side and 29 px from the bottom on a phone (48 × 0.6) and 48 px on desktop; no file request before Play; Play sets `aria-pressed="true"` and `.av-is-playing`; Mute toggles `muted` and `aria-pressed`; folding while playing leaves one 54 px button showing the bars; Pause resets the buttons; a missing file shows the error in the status line with the buttons reset; after a navigation the player came back folded and muted as left, and Play continued from the stored position (3.46 s); `close()` / `open()` fold and unfold; removing the element pauses the audio; under emulated reduced motion the bars have no animation. Not yet seen in the real theme editor or on the dev store (no push in this wave).

Review fixes, same harness (2026-10-15): bottom right at 1280 px tabs Play (x 997), Mute (1167), fold (1215), matching the screen; `--av-audio-space` 102 px equals the player height plus offset, body `padding-bottom` and `scroll-padding-bottom` 102 px, and 172 px with a 70 px sticky bar shown; at the page end the footer's policy link ends 24 px above the player; Play has the primary button colours, 44 × 44 px and the shared focus ring; folded, Play stays visible; phones only, playing at 390 px then resized to 852 px: paused, not rendered, room 0; a 404 while folded opens the panel with the error, and Play after the file returns refetches (1 request) and plays; folded while playing shows the bars and the pause icon; under emulated forced colours the bars are black on white; editor with no link and no module: the player and the hint show while the panel stays folded; with JavaScript off the noscript copy shows the credit line and no padding is added; removing the player removes the property and the padding.

## Uncertain
- **SPEC wording.** SPEC §2.5 says "never autoplays with sound", which could allow muted autoplay; the spec card and the wave brief say "never autoplays", which this section follows. Muted autoplay of music would play silently with nothing to see, so "start muted" here means only the speaker control's starting state. If the owner wants a different meaning (for example "remember the shopper's mute choice"), it is one line in the module.
- **Overlapping widgets.** The scroll-to-top button sits bottom right by default; this player defaults to bottom left. If a merchant puts both in one corner with the same bottom padding they overlap (seen in testing). A shared offset token for overlay widgets could be added later.
- **First add in the editor.** When the section is added for the first time, its module may load after the editor's select event (shopify.dev does not say whether scripts inside newly added section HTML run), so the new player can stay folded until the merchant selects the section again. The setup hint shows regardless, because it sits outside the panel and the editor shows the player before the module is defined. Not yet confirmed in the real editor.
- **Editor loads folded even without a link.** The review suggested rendering the player open when no link is set; the wave rule says overlay sections never open in the editor on load, so the player stays folded and the hint moves outside the panel instead.
- **Page room on every page.** The bottom padding is reserved whenever the player is rendered, also on pages without a footer row under it; it is the same trade the sticky add-to-cart bar makes.
- **Positions are physical.** "Bottom left" stays on the left in right-to-left languages.
- **Third-party hosts.** `audio_url` accepts any link. A file on another host is the merchant's own choice and is requested only after Play, so page loads still make zero third-party requests.

## Integration pass (2026-10-15)
- Locale keys added; the mute button uses the shared `anvil.media.mute`.
- "Off by default" now means: `sections/overlay-group.json` ships the player configured with `"disabled": true`, so merchants find it in the Overlay group and switch it on. No extra checkbox was added.
- `--av-audio-space` is listed in CONVENTIONS §2 as a page-level offset that floating overlays read.

## Fix pass (2026-10-15)
- Availability: `enabled_on` "groups": ["custom.overlay"] (CONVENTIONS §4).
