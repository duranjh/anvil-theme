# `anvil-video` — Video (section card)

_Wave-2 standard section. File `sections/anvil-video.liquid`, editor name "Video". Spec: `docs/spec/video.md`; `docs/DESIGN-sections.md` §3 "Standard sections". Contract: `docs/CONVENTIONS.md` §3–§5._

## Purpose
One video in a section: a video uploaded to Shopify, or a YouTube or Vimeo link. A YouTube or Vimeo link shows as a facade (a cover image and a play button). The player iframe (`youtube-nocookie.com` or Vimeo with `dnt=1`) loads only after the shopper presses play. An uploaded video can play muted on a loop while it is on screen. The section has no JavaScript or asset files of its own. The facade comes from `snippets/anvil-media.liquid`, autoplay from `anvil-core.js` (`data-anvil-autoplay`), and the section CSS sits in `{% stylesheet %}` (1,290 bytes raw, 567 B with `gzip -9`). There is no section JS. The file is 293 lines; the card estimated about 160, and the extra lines are the schema, the image-size logic and the comments on the interim work-arounds.

## Markup (shopper view)
```
div#anchor.av-section.av-scheme--… .av-s-anvil-video          ← anvil-section-attrs
  div.av-section__inner
    .av-section-head (h2 + subheading)                         ← anvil-section-head, only when set
    div.av-video.av-video--16-9|9-16|1-1|4-5[.av-video--bleed]  style="--av-video-ratio: 16 / 9"
      figure.av-video__figure [aria-label="<title>"]           ← label only for an uploaded video without caption
        div.av-media.av-media-frame.av-video__media …          ← anvil-media: <video>, facade or placeholder
        figcaption.av-video__caption.av-video__caption--center ← only when a caption is set
      p.av-video__note.av-example-note                         ← editor only (no video / link without cover)
```
The section heading is an `h2` from the chassis. The caption is not a heading.

## Settings
The 13 chassis settings come first, word for word (CONVENTIONS §4). They are followed by a "Video" header and these settings:

| id | type | default | effect |
|---|---|---|---|
| `source` | select `upload` / `url` | `upload` | picks which of the two pickers is read. A link left over after switching to an upload (or the other way round) is ignored |
| `video` | video | — | Shopify-hosted video (`visible_if` source is upload). Rendered by `anvil-media` with `video_tag` (`playsinline`, `preload="metadata"`, controls, poster at the last `widths` value, which the section holds to 1100 or 1500 px; see Image sizes). `info`: the cover is the thumbnail set on the video in Content > Files; put captions in the video file if people speak |
| `video_url` | video_url (`youtube`, `vimeo`) | — | `visible_if` source is url. Shown as a click-to-load facade. `info`: nothing loads from YouTube or Vimeo before play; turn on captions there |
| `cover` | image_picker | — | `visible_if` source is url, so the card's "cover image" is met for links only (open question 4). The facade's poster. With no cover the facade shows the `lifestyle-1` placeholder, because Anvil never fetches YouTube or Vimeo thumbnails (zero third-party requests). The editor shows a note saying so |
| `title` | text | blank (placeholder "For example: How to set it up") | accessible name. It goes on the facade's play button ("Play video: <title>") and the iframe `title`, and labels the `<figure>` of an uploaded video that has no caption. Blank falls back to the section heading's text for the play button and iframe only; the figure gets no label then (the heading sits right above it). The `<video>` itself is named by `video_tag`, whose `aria-label` comes from the file's alt text, so the `info` also points merchants to Content > Files |
| `image_ratio` | select `16:9` / `9:16` / `1:1` / `4:5` | `16:9` | box shape. The video, cover and placeholder are cropped to fill it (`object-fit: cover`). From 750 px, portrait and square boxes are capped at 85 % of the screen height (`85svh`, with `85vh` as fallback) and centred |
| `video_autoplay` | checkbox | off | `visible_if` source is upload. It passes `autoplay: true` to `anvil-media`, which marks the box `data-anvil-autoplay`, renders the video `muted` and `loop` and keeps its controls. `anvil-core.js` plays it while at least 25 % is in view, and only when motion is allowed. `info` explains all three conditions |
| `bleed` | checkbox | off | "Edge to edge", `visible_if` width is full **and** shape is 16:9 (the only case it works for; other shapes are capped by height and centred). The media box grows into the side gutters and drops the frame's corners, border and shadow. The heading and caption keep the page margins. The Liquid repeats the 16:9 check, because a hidden setting keeps its saved value |
| `caption` | inline_richtext | blank | shown under the video in a `<figcaption>`, small and muted. Its `info` is the honesty note (see below) |
| `text_align` | text_alignment | `center` | caption alignment |

That is 23 non-header settings (13 chassis + 10). The schema name is "Video" (5 characters), with `disabled_on.groups: ["*"]`. There are no blocks.

Preset "Video": heading "See it in **action**" and caption "Example caption — say in one line what the video shows". With no video picked it renders the 16:9 placeholder and the editor note.

## Blocks
None. The card names no blocks, and one video needs none.

## Behaviour
- **Sources** (all decided by `anvil-media`):
  - Uploaded video: native `<video>` with controls.
  - YouTube or Vimeo link: `<anvil-video-facade>`, which holds the cover (or placeholder) and a play link to the watch page. On click the link is replaced by the iframe (`autoplay=1`, because the shopper asked for it), and focus moves to the iframe.
  - Nothing set: placeholder illustration.
- **Without JavaScript:** an uploaded video plays with its native controls; autoplay never starts. The facade's play link opens the video on YouTube or Vimeo in a new tab.
- **Autoplay** (uploaded videos only): muted, looping, only while in view, never when the shopper's device asks for reduced motion. Controls always stay, so the video can be paused (WCAG 2.2.2). Known gap in core (open question 6): `anvil-core.js` calls `muted = true; play()` every time the video comes back into view, so a shopper's own pause or unmute is undone after scrolling away and back.
- **Keyboard:** the play link and the native controls are the only focusable elements. The global `:focus-visible` ring applies.
- **Reduced motion:** nothing in the section animates. The play button's hover scale (base CSS) is already gated. Reveal-on-scroll comes from the chassis.
- **Loading:** the first two sections (or `section.index` nil) load eagerly; later sections are lazy. The section passes `priority` for the first section, but `anvil-media` applies it (fetchpriority high + preload) in its image branch only. A YouTube/Vimeo cover is eager in sections 1–2 but gets no fetchpriority and no preload, and an upload's poster comes from `video_tag`, which has neither. So today only a link source with a cover and no link (a still image) gets priority. Open question 7 asks core for the external branch.
- **Image sizes, link covers** (a responsive `srcset`):
  - 16:9: `sizes` follows the chassis width (`settings.page_width` / `narrow_width`, or `100vw` at full width). Widths go up to 1800 (page), 1500 (narrow) or 2200 (full).
  - 9:16: up to 1100 px wide, `sizes: (min-width: 750px) 48vh, 100vw`.
  - 4:5: up to 1500 px, `68vh`.
  - 1:1: up to 1800 px, `85vh`.
- **Image sizes, upload posters:** `video_tag` requests one poster at the last `widths` value (`image_size`), with no srcset, so every device gets the same file. For uploads the section sets `widths` to a single value: 1100 px for 16:9 at page or narrow width and for 9:16, 1500 px for 16:9 at full width, 1:1 and 4:5. Trade-off: the poster is a little soft on a wide desktop screen until the video plays, in return for a much smaller LCP image on phones (a 390 px phone at 3× needs about 1170 px; before, it downloaded up to 2200 px).
- **Editor notes** (`request.design_mode` only):
  - With no video, `anvil.editor.video_empty`.
  - With a link but no cover, `anvil.editor.video_no_cover`.

## Honesty notes
- `caption` `info`: "Call a clip a customer video or a real result only when it is one."
- `title` `info` asks for a description of what the video really shows.
- The preset caption reads as an example ("Example caption — …"). The preset heading is neutral and makes no claim.
- Captions are the merchant's responsibility. Both video pickers say so in their `info`.
- No platform logos are shipped. The play button is a theme icon, never a YouTube or Vimeo mark, and nothing is requested from those hosts before the shopper presses play.

## Styling decisions
- Every selector starts with `.av-video`, and only tokens are used.
- `anvil-media`'s own CSS (box, frame, facade, play button) is not restyled, with two exceptions:
  - the `aspect-ratio` of the box, because the snippet has no 9:16 option. This follows `anvil-product-videos`, which sets `aspect-ratio` from an inline variable with a two-class selector that wins over `.av-media`;
  - the edge-to-edge case, which removes corners, border and shadow, as the feature grid's bleed cards do.

## Locale keys (to add at wave end)
- `anvil.media.play_title` = `Play video: {{ title }}`
- `anvil.editor.video_empty` = `Pick a video, or paste a YouTube or Vimeo link, to show it here.`
- `anvil.editor.video_no_cover` = `Add a cover image. Nothing is fetched from YouTube or Vimeo before play, so shoppers see a plain placeholder until they press play.`

Existing keys used: `anvil.media.play` (to find the label the snippet prints).

Until these are added, Theme Check reports three `TranslationKeyExists` errors for this file, and screen readers hear "translation missing" on the facade's play button. Theme Check needs Node 22 or later (`PATH=/opt/homebrew/opt/node@22/bin:$PATH`); the CLI crashes on the default Node 20.

## Contract assumptions
- `snippets/anvil-media.liquid` accepts the documented parameters (`video`, `video_url`, `image`, `ratio`, `widths`, `sizes`, `loading`, `priority`, `alt`, `placeholder`, `autoplay`, `class`), uses `alt` as the iframe title, and prints the play label as `<span class="av-visually-hidden">{{ 'anvil.media.play' | t }}</span>`. The section captures the snippet's output and replaces that exact span with the titled label. This is an interim measure: if the snippet's markup changes, nothing matches, the generic "Play video" stays, and no lint notices (see open question 2).
- The `video` setting returns a `video` object whose `media_type` is not `external_video`, so `anvil-media` takes its `video_tag` branch. The `video_url` value exposes `.type` and `.id` (shopify.dev, input settings).
- `visible_if` works on `video`, `video_url`, `image_picker`, `checkbox` and `select` settings and may read `section.settings` (shopify.dev lists these types; other Anvil sections already read `section.settings` in `visible_if`). shopify.dev describes it as "a boolean expression" and shows only `==`; the `and` in `bleed` follows Liquid's boolean operators and `anvil-divider`'s schema, which already combines conditions with `and`.
- `t` escapes interpolated values in keys without `_html` (CONVENTIONS §1: "Pass raw values to `t`"). So the title is passed raw.
- Shopify lets merchants replace an uploaded video's cover image in Content > Files and on the product media editor (help.shopify.com, Files and "Change thumbnail"), so the `video` `info` points there.

## Open questions
1. **The "controls" setting from the card was not shipped (owner decision).** The card lists "controls" among the merchant's settings, but two documents rule out turning them off:
   - CONVENTIONS §5 and `anvil-media` keep controls on whenever autoplay is on ("autoplay keeps them on", WCAG 2.2.2).
   - Without autoplay, a native video with no controls cannot be started at all, and the card allows no JavaScript of its own.

   So every combination would show controls anyway, and a checkbox that does nothing would mislead merchants. Two ways out: amend `docs/spec/video.md` to drop "controls" (CONVENTIONS wins), or approve a ≤ 2 KB gz `assets/anvil-video.js` that follows the product gallery's bare-video pattern (one play/pause button swapped in for the native controls), then add a `controls` checkbox (default on, visible for uploads).
2. **Play-button label parameter for `anvil-media` (core).** The card asks for the play button to carry the video title. The snippet hard-codes "Play video", so this section rewrites the snippet's output with `replace` (see Contract assumptions). Requested change: in `snippets/anvil-media.liquid` add `@param {string} [play_label]`, `assign play_text = play_label | default: ('anvil.media.play' | t)` and print `{{ play_text }}` in the span at line 150; document it in CHASSIS-API and CONVENTIONS §5. Then this section passes `play_label: play_named` and drops its replace block. Until then, a guard in `scripts/chassis-lint.py` that the span at `anvil-media.liquid:150` still reads `<span class="av-visually-hidden">{{ 'anvil.media.play' | t }}</span>` would catch a silent break. `anvil-product-videos` passes its title as `alt` and so still announces only "Play video".
3. **9:16 in `anvil-media`.** As already raised by `anvil-product-videos`: a `9:16` ratio in the snippet, plus `.av-media--9-16` in base CSS, would let both sections drop their `aspect-ratio` overrides.
4. **Cover image for uploaded videos (owner decision).** `video_tag` takes the poster from the video's own preview image, and `anvil-media` does not forward a custom poster. So `cover` only applies to links (it is hidden with `visible_if` otherwise), and an uploaded video's cover is set in Content > Files; the card's "cover image" is therefore met for links only. Either accept "cover = links only" and amend `docs/spec/video.md`, or extend `anvil-media` so `image` sets the poster for Shopify videos (for example a cover `image_tag` layered over the video and removed on first play, which needs JS the card does not allow); then show `cover` for both sources.
5. **No caption tracks.** Uploaded Shopify videos get no `<track>` from `video_tag`, so the `info` asks for captions in the video file itself. YouTube and Vimeo carry their own captions.
6. **Autoplay overrides the shopper's pause and unmute (core, a11y, major).** `assets/anvil-core.js` `autoplay()` (around line 396) runs `target.muted = true; target.play()` on every intersect, and nothing listens for the shopper's own `pause` or `volumechange`. A shopper who pauses with the controls, scrolls on and comes back sees it play again, and an unmuted video is muted again. That weakens WCAG 2.2.2, which the `autoplay` `info` ("Controls stay visible so it can always be paused") relies on. Requested change for the core owner: set `target._anvilAuto = true` before the observer's own `pause()`, and only when `!target.paused` (pausing a paused video fires no `pause` event, so the flag would stick); add a capture-phase `pause` listener that sets `video.dataset.anvilUserPaused = ''` when `_anvilAuto` is not set, then resets the flag; clear `anvilUserPaused` on a `play` the shopper starts; in the intersect branch skip `play()` while `dataset.anvilUserPaused` is set, and force `muted = true` only on the first automatic start (`if (!target.dataset.anvilStarted) { target.muted = true; target.dataset.anvilStarted = ''; }`). No section change is needed once core does this.
7. **`priority` for external covers (core, perf).** `snippets/anvil-media.liquid` reads `priority` only in its `image` branch (line 121). Requested change: in the `external` branch (line 144), add `{%- if priority -%}` and render the poster with `loading: 'eager', fetchpriority: 'high', preload: true`, as the image branch does. The section already passes `priority` for section 1, so a YouTube/Vimeo cover becomes the prioritised LCP image with no section change.

## Integration pass (2026-10-15)
- The label swap is gone: the section passes `play_label` to `anvil-media`, and `priority` now also makes a link's cover eager with high fetch priority. `anvil-media` has a 9:16 ratio now; this section keeps its own ratio rule for now.

## Fix pass (2026-10-15)
- Setting ids follow the theme-wide vocabulary (CONVENTIONS §5; DECISIONS 82–100); the tables above use the new ids: `ratio` → `image_ratio`, `autoplay` → `video_autoplay`, `caption_align` → `text_align`. Saved templates were migrated.
- Uses the shared pieces: eager or lazy media from `snippets/anvil-above-fold` (DECISIONS 85).
- Availability: `disabled_on` groups ["header","custom.overlay"] (CONVENTIONS §4, DECISIONS 100).
