# Stories — `sections/anvil-stories.liquid`

_Section card, 2026-10-15. Wave 2. Built from `docs/agent-prompts/stories.md` (CONVENTIONS, spec card, chassis API, exemplars). Review fixes applied the same day (posters, focus hand-off, refused play, disclosure line, escaping, contrast, landscape, light dismiss)._

## Purpose
A row of round thumbnails, each opening a full-screen, upright (9:16) viewer that steps through the stories with a tap. It suits "new in", how-to and behind-the-scenes clips on the home page or a landing page. Spec: `docs/SPEC.md` §4.2 "Stories strip" (up to 20 stories with thumbnail, full media, label and link; ring colour; a row of round thumbnails that opens a full-screen vertical viewer with tap-through). Design row: `docs/DESIGN-sections.md` §3 `anvil-stories` (local `story` ×20, ring colour, autoplay per story, dialog + viewer JS, `<dialog>`, Esc, focus return, no "live" wording).

Phones show the circles in a sideways-scrolling row that runs to the screen edges. Desktop shows them in one row (centred or left-aligned, scrolling when they do not fit) or, with "Wrap onto more rows", in rows. The viewer fills the screen on phones. From 750 px wide **and** 600 px tall it is a 9:16 frame centred in a full-screen backdrop, as tall as the window allows (at most 960 px). Shorter windows (a phone held sideways, 844 × 390) keep the full-screen viewer and, in landscape, show the media whole (`object-fit: contain`), because a 9:16 story cropped to a landscape strip would lose most of the picture.

## Settings
The 13 chassis settings come first, pasted verbatim from CONVENTIONS §4. Then come 10 section settings under the headers "Stories", "Ring" and "Viewer", 23 settings in all (the limit is 40).

| id | type | default | what it does |
|---|---|---|---|
| `thumb_size` | range 56–120 step 4 px | 76 | circle size on desktop. Phones use 80 % of it, never under 56 px (`--av-stories-d`, CSS `max()`) |
| `text_align` | select `start` / `center` | `center` | row alignment. A centred row that overflows still scrolls from its first item (auto margins on the first and last item, not `justify-content`, so nothing is cut off) |
| `wrap_desktop` | checkbox | false | from 750 px the circles wrap onto more rows instead of scrolling |
| `show_labels` | checkbox | true | labels under the circles; off = visually hidden (`av-visually-hidden`), still the link's name |
| `ring_width` | range 0–6 step 1 px | 3 | ring thickness; 0 hides the ring and the gap |
| `ring_color` | color (no default) | — | ring colour; empty = the colour scheme's accent |
| `ring_gradient` | color_background (no default) | — | optional gradient; wins over `ring_color` |
| `viewer_scheme` | color_scheme | `scheme-4` | colour scheme of the full-screen viewer (background, buttons, progress bars, label). The shipped `scheme-4` is the dark one |
| `viewer_fit` | select `cover` / `contain` | `cover` | media fills the viewer and crops the edges, or shows whole |
| `auto_advance` | checkbox | true | stories move on by themselves (see Behaviour); off = images wait for a tap and videos loop |

`schema.name` is "Stories", `max_blocks: 20`, `disabled_on.groups: ["*"]`. The ring paint is written inline as `--av-stories-ring` (gradient, else colour, else `var(--av-accent)`); the merchant's colour setting is the only colour that does not come from a token.

## Blocks
Local block `story` (up to 20). `{{ block.shopify_attributes }}` is on each thumbnail's `<li>`. The viewer's slides are captured inside the same loop and printed in the dialog, so each block carries its editor attributes once and the section has a single blocks loop.

| id | type | default | note |
|---|---|---|---|
| `label` | text | "Example story" | name under the circle, the viewer's top line and part of the slide's accessible name. Blank = "Story N". Its `info` warns against "live" or "today only" wording |
| `image` | image_picker | — | full-screen image (srcset 375–1080, `sizes: (min-width: 750px) 56vh, 100vw`) |
| `video` | video | — | Shopify-hosted video; replaces the image. Its `info` asks for products shown as they really are and, when people speak, for captions burned into the video (the viewer starts muted and has no caption button, WCAG 1.2.2) |
| `disclosure` | select `none` / `paid` / `gifted` | `none` | "Paid or gifted content". `paid` shows `anvil.stories.paid` ("Paid partnership"), `gifted` shows `anvil.stories.gifted` ("Gifted product") as its own line at the bottom of the story, above the button: unclamped, on a 75 % backing, and independent of the label and of "Show labels" |
| `thumb` | image_picker | — | circle image; empty = the story image, else the video's preview image, else a placeholder. A story with no image or video shows the circle image in the viewer too (the placeholder is only for stories with no media at all) |
| `duration` | range 3–15 step 1 s | 6 | seconds an image story stays when stories move on by themselves ("autoplay per story"); videos play to their end |
| `button_link` | url | — | optional button at the bottom of the story |
| `button_label` | text | "Shop now" | button label; blank = `anvil.a11y.learn_more`. Its `info` asks that it only promise what the linked page shows |

The preset "Stories" ships the heading "Example heading — **stories**" (size md) and five stories labelled "Example: new in", "Example: how to", "Example: in use", "Example: making of", "Example: gift ideas". They have no media, so the circles and the viewer show placeholder illustrations (`lifestyle-1`, `product-1`, `lifestyle-2`, `product-2`, `collection-1`, `product-3` in turn).

## Markup and behaviour
- **Structure:** `anvil-section-head`, then `<anvil-stories class="av-stories" [auto]>` holding `<ul class="av-stories__list" role="list">` and `<anvil-dialog id="anvil-stories-<section id>">` with a native `<dialog class="av-stories__viewer av-scheme av-scheme--<viewer scheme>" aria-label="<heading or Stories>">`. Inside: progress bars (`aria-hidden`), the controls (pause, mute, close), the stage (`role="region"`, `aria-roledescription` = `anvil.a11y.carousel`) with one `role="group"` slide per story named "Story N of M: label", and two tap zones.
- **Thumbnails without JavaScript:** each thumbnail is a link to the story's media (the first MP4 source of the video, or the image at 1080 px), else to the story's link. A story with nothing to open (an untouched example) renders a `<button>`, which only does something with the module. Images in circles are `image_tag` with widths `size, 2×` (2× capped at 200 px, the avatar limit in CONVENTIONS §11) and `sizes: <size>px`, eager for the first 8 circles in the first two sections (or when `section.index` is nil), lazy otherwise, `alt=""` (the label names the link).
- **Viewer (`assets/anvil-stories.js`, 5,881 B raw, 2,022 B gzipped content / 2,039 B as `check-limits.sh` measures it with the file name header; budget 2,048):** a plain click opens the dialog on that story (modifier clicks keep the link's own behaviour). The module adds `aria-haspopup="dialog"` to the thumbnails, opens through `<anvil-dialog>`'s `open(opener)` (scroll lock, `aria-expanded`, backdrop handling), or `showModal()` if the core has not defined it.
  - **Tap-through:** the left third (`[data-anvil-go="-1"]`, "Previous story") and the right two thirds (`[data-anvil-go="1"]`, "Next story") are real buttons over the media, with a chevron that shows on hover or keyboard focus. ArrowLeft / ArrowRight do the same while the viewer is open (mirrored in RTL; the zones use logical positions). Next on the last story closes the viewer; previous on the first restarts it.
  - **Moving on by itself (`auto`):** an image story's bar fills with a Web Animation over its `duration` and then moves on; a video's bar follows its playback time and moves on when it ends. Without `auto` the current bar shows full, images wait for a tap and videos loop.
  - **Refused playback:** when the browser refuses `play()` (no user gesture behind a timer-started video with sound, iOS Low Power Mode, an unplayable source), the module retries muted (the mute button flips to muted), and if that is refused too it shows the paused state (pause toggle `aria-pressed="true"`, stage `aria-live="polite"`), so the shopper sees a play button to press with a real gesture instead of a still poster that never moves on. An `AbortError` (a `pause()` or a step that interrupted the start) is ignored.
  - **Pause (WCAG 2.2.2):** the first control, `[data-anvil-toggle]` ("Pause stories", `aria-pressed` = paused), pauses and resumes the timer and the video. It is hidden only when there is nothing to pause (an image story with `auto` off). Focus never drops to `<body>`: when a step hides the focused element (the mute button on an image story, the pause toggle on an image story without `auto`, or a button inside the story that just left, also when the timer moves on with no key pressed), focus moves to the pause toggle, or to the close button when the pause toggle is hidden too (WCAG 2.4.3). Playback starts paused when the shopper prefers reduced motion or the theme's animations are off (`Anvil.dom.motionOff()`); pressing play then starts it. As the first focusable element it receives focus when the dialog opens (the HTML dialog focusing steps), so a keyboard or screen-reader user lands on it.
  - **Sound:** videos have no native controls (they would fight the tap zones) and always start muted (`muted`, `playsinline`). `[data-anvil-mute]` ("Mute", `aria-pressed` = muted) shows on video stories and keeps the shopper's choice for the rest of this page view (it is an in-memory field; a new page starts muted again). No video ever starts with sound.
  - **Loading:** slide images are `loading="lazy"` inside the closed dialog. Videos are written by hand, not with `video_tag`: `video_tag` always writes `poster` and a fallback image, and the browser fetches a poster as soon as the attribute exists, even in a closed dialog (one 1080 px JPEG per video story on page load). The slide's `<video playsinline muted preload="none">` carries the poster URL in `data-anvil-poster` (the preview image at 1080 px, written only when Shopify has one), an `aria-label` from the video's alt text, and one `<source>` per MP4 rendition (`format == 'mp4'`, `type` from `mime_type`). Nothing in the viewer loads before a story is opened; opening or stepping to story N switches N and N + 1 to eager images, `preload="metadata"` and their poster. The circles themselves load as described above.
  - **Live region:** the stage's `aria-live` is `off` while stories move on by themselves and `polite` while paused or with `auto` off (the WAI-ARIA carousel pattern), so a screen reader is not interrupted every few seconds.
  - **Closing:** Esc (native), the close button (`[data-anvil-close]`, also handled by the core), a click on the backdrop around the desktop frame (the dialog fills the viewport, so `<anvil-dialog>`'s outside-the-rectangle light dismiss never fires; the module closes when the click's target is the `<dialog>` itself, which happens only outside `.av-stories__frame`), or the end of the last story. Closing stops the timer, pauses and rewinds the video and puts focus on the thumbnail of the story shown last (one frame after the core's own focus return).
- **Editor:** `shopify:section:load` / `unload` re-create the element (connected / disconnected callbacks clean up every listener). Selecting a story block opens the viewer paused on that story (also after a re-render, which Shopify follows with a block select); deselecting closes it after 250 ms, so moving between stories does not flicker. `assets/anvil-editor.js` does not touch this dialog: the blocks sit outside it and it carries no `data-anvil-editor-open`.
- **Motion:** the circle's hover zoom, the viewer's fade-in and the bar easing for videos run only inside `prefers-reduced-motion: no-preference` and only when Theme settings > animations are on (the section adds `.av-stories--motion` from `settings.animations_enabled`, the same pattern as the image gallery).
- **Empty section:** with zero blocks the shopper sees nothing and the editor shows `anvil.editor.empty_section`.
- **Viewer text contrast:** the story name (top) and the disclosure line (bottom) sit on their own backing, `rgb(var(--av-bg-rgb) / .75)` with `--av-radius-badge`. With the shipped dark viewer scheme (#F5F5F5 on #121212) that is about 7.7:1 even over a white photo; the old top gradient gave about 1.9:1 at the name. The name shrinks to fit, wraps to two lines (clamped on an inner `<span>`, so no third line shows in the padding) and stops 16 px before the three controls. The gradient stays for the progress bars. No hard-coded radius or shadow: the bars use `--av-radius-pill` and the text shadow is gone.
- **Escaping:** merchant text is escaped once where it is read (`label`, `link_label`, video alt), translation output (already escaped by Shopify) is never escaped again, and the heading-derived viewer name prints with `escape_once`, so "Tips & tricks" or a French "Voir l'offre" no longer show entities.
- **CSS:** the `{% stylesheet %}` body is 6,083 B raw, 1.69 KB gzipped (limit 6,144 raw), every selector starting with `.av-stories`. The section loads `anvil-dialog.css` for the page scroll lock (`html.av-scroll-locked`), which the core's `lockScroll()` toggles. Button styles (the story link) come from `anvil-base.css` via `anvil-button`.

## Honesty notes
- No "live" wording anywhere: no badge, no "now" or viewer counts, and no expiry. The `label` info tells merchants that these are saved media that never expire and to avoid "live" or "today only".
- Videos never autoplay with sound and never start under reduced motion; every timed change can be paused.
- Paid or gifted content gets its own `disclosure` setting. The viewer prints "Paid partnership" or "Gifted product" on a separate, unclamped line with its own contrast backing, so the disclosure cannot be cut off by the label's clamp or ellipsis, or hidden by "Show labels". The `video` info asks for products shown as they really are and for burned-in captions when people speak; the `link_label` info asks that the button only promise what the linked page shows.
- Defaults read as examples ("Example heading — …", "Example: …", "Example story").

## Contract assumptions
- `<anvil-dialog>` (anvil-core.js) exposes `open(opener)`, focuses the opener on close and handles `[data-anvil-close]`; the module works without it (native `showModal`, own close handling) except for the scroll lock.
- The `video` setting's object exposes `sources` (`video_source`: `format` mp4 / mov / m3u8, `mime_type`, `url`, checked on shopify.dev), `preview_image` and `alt`, as `snippets/anvil-media.liquid` already relies on. The section no longer uses `video_tag` (see Loading).
- `color_background` returns an empty string when unset (shopify.dev input settings), so `!= blank` is the right test; an unset `color` returns blank.
- Theme setting `animations_enabled` is the one `layout/theme.liquid` turns into `html[data-animations]`.

## Locale keys needed (integrator)
- `anvil.stories.viewer` = "Stories" (dialog and stage name when the heading is blank)
- `anvil.stories.story` = "Story {{ index }}" (label fallback)
- `anvil.stories.count` = "Story {{ index }} of {{ total }}" (slide names, followed by ": <label>")
- `anvil.a11y.learn_more` = "Learn more" (button label fallback)
- `anvil.stories.pause` = "Pause stories"
- `anvil.media.mute` = "Mute"
- `anvil.stories.previous` = "Previous story"
- `anvil.stories.next` = "Next story"
- `anvil.stories.paid` = "Paid partnership" (disclosure line, `disclosure: paid`)
- `anvil.stories.gifted` = "Gifted product" (disclosure line, `disclosure: gifted`)
Existing keys used: `anvil.a11y.close`, `anvil.a11y.carousel`, `anvil.editor.empty_section`.

## Open questions
- **"Autoplay per story" (owner to settle).** Read as a per-story duration (`duration`, seconds an image story stays) plus one section switch (`auto_advance`), with videos always playing to their end. If the owner meant a per-story on/off, the block gains a checkbox `auto` (default true) written as `data-anvil-auto` on the slide, and the `#auto` getter also checks the current slide. That costs about 30 B gzipped, and the module is at 2,022 of 2,048 B after the review fixes, so it would need a trim elsewhere first.
- **No YouTube / Vimeo stories.** A click-to-load iframe cannot sit under tap zones or report its end, so only Shopify-hosted videos are offered.
- **No "seen" ring, no swipe gestures, no remembered mute.** Greying out viewed stories, keeping the mute choice in `sessionStorage`, and swipe-to-step / swipe-down-to-close would push the module past its 2 KB gzipped budget (it is at 2,022 B); taps, keys and the close button cover the same actions.
- **Captions.** Stories have no `<track>`: Shopify's video setting has no caption file, and a caption button would need room in the controls. The `video` info asks merchants to burn captions in.
- **Progress bar under reduced motion.** The bar animates only after a shopper who prefers reduced motion presses play themselves; it is the timer's only visible cue. If that should also stop, the bar could jump in steps instead.
- **`viewer_scheme` default `scheme-4`** assumes the shipped colour schemes (scheme-4 is the dark one in `config/settings_data.json`).
- **Gate script:** `npm run gate -- stories` was not run as one command: its G0 paths gate runs `git status`, which builders in this wave may not run. G1 (theme check) and G2 (cleanroom-lint, asset-audit, chassis-lint, check-limits) were run one by one. The viewer was exercised in a local static harness (open, auto-advance across image and video stories, pause, mute, tap zones, arrow keys, close at the end with focus on the last story, start paused with animations off, `auto` off). After the review fixes a headless Chromium (headless shell 1243) run checked: no poster, video or slide-image request with the viewer closed; opening story 1 fetches only the next video's poster; focus moves to the pause toggle (or close without `auto`) when the focused mute button or a story's button gets hidden, including by the timer; a refused unmuted `play()` retries muted and a refused muted one shows the paused state, while an `AbortError` does not; a backdrop click closes on desktop and a frame click does not; 844 × 390 keeps the full-screen viewer with `contain`; the name box wraps and stays clear of three controls on a 375 px phone; the disclosure sits above the button. Rendering on the dev theme (375 × 812 and 1280 × 800, reduced motion, axe) is still to do.

## Integration pass (2026-10-15)
- The mute button uses `anvil.media.mute` and the link fallback `anvil.a11y.learn_more`.

## Fix pass (2026-10-15)
- Setting ids follow the theme-wide vocabulary (CONVENTIONS §5; DECISIONS 82–100); the tables above use the new ids: `align` → `text_align`, `link` → `button_link`, `link_label` → `button_label`. Saved templates were migrated.
- Uses the shared pieces: eager or lazy media from `snippets/anvil-above-fold` (DECISIONS 85); the editor-only empty note from `snippets/anvil-editor-empty` (DECISIONS 87).
- Availability: `disabled_on` groups ["header","custom.overlay"] (CONVENTIONS §4, DECISIONS 100).
