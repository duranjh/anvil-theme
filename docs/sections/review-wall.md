# `anvil-review-wall` — Review wall (section card)

_Wave-2 section. File `sections/anvil-review-wall.liquid`, editor name "Review wall", module `assets/anvil-review-wall.js`. Spec: `docs/SPEC.md` §4.2 "Review wall"; `docs/DESIGN-sections.md` §3 row `anvil-review-wall`; card `docs/spec/review-wall.md`. Contract: `docs/CONVENTIONS.md` §3–§4._

## Purpose
A summary line ("4.8 · 2,431 reviews on [logo]") above a grid of up to 50 review cards that the merchant types in: stars, text, name, date, photo and an optional link to the original. Long reviews are cut to a set number of lines and open in full in a dialog ("Read more"); the wall can show the first N reviews and reveal the rest in batches ("Show more"). Everything is server-rendered; the module only adds the two enhancements, and without it every review shows in full.

## Markup (shopper view)
```
div#anchor.av-section.av-s-anvil-review-wall          ← anvil-section-attrs
  div.av-section__inner
    .av-section-head (h2 + subheading)                ← anvil-section-head
    p.av-review-wall__summary--<head_align>           ← only with the platform link
      a.av-review-wall__platform[target=_blank]
        span.av-stars[role=img] (anvil-stars) · span.__score[aria-hidden] · span.__dot[aria-hidden]
        span.__count · img.__logo (alt = platform name) | span.__brand · span.av-visually-hidden "(opens in a new tab)"
    div.av-review-wall__summary--preview              ← editor only, no platform link: the same line dimmed,
      span.__platform · p.av-example-note               not a link, with a caption (never reaches shoppers)
    anvil-review-wall.av-review-wall.av-enhance.--grid|--masonry.--<card_style>[.--clamp][data-anvil-step]
      ul.av-review-wall__grid[role=list][data-anvil-grid]
        li.av-review-wall__card[.--extra][tabindex=-1 on extras] {{ block.shopify_attributes }}   ×N
          figure.av-review-wall__review
            .av-media.av-review-wall__media (anvil-media)       ← photo, optional
            div.__stars > anvil-stars                           ← only with this review's own link
            blockquote.__quote > p.__text
            button.__read.av-enhanced-only[aria-haspopup=dialog][data-anvil-read]   ← when lines > 0
            figcaption.__by > span.__name · span.__date > time · a.__source[target=_blank]
      div.__foot.av-enhanced-only[data-anvil-foot] > anvil-button (secondary) [data-anvil-more]   ← when extras exist
      anvil-dialog#av-review-wall-dialog-<section id> > dialog.av-dialog.av-dialog--sheet.av-review-wall__dialog
        button.av-dialog__close[data-anvil-close] · h2.av-dialog__title "Customer review" · div.__body[data-anvil-body]
    p.av-review-wall__note (disclosure)
    p.av-review-wall__note.av-example-note           ← editor only: why a review's stars are hidden
```
Heading levels: the chassis `h2`, then no headings in the cards (a review card is a quote with a caption, not a titled item). The dialog title is an `h2` inside the modal.

## Settings
The 13 chassis settings come first, verbatim (CONVENTIONS §4). Then, under "Review wall" (an honesty paragraph):

| id | type | default | effect |
|---|---|---|---|
| `summary_rating` | range 0–5 step 0.1 | `0` | stars + printed number in the summary; 0 (the default) hides both, so adding the link never publishes a rating nobody typed. `info`: copy today's platform rating |
| `count_text` | text | "Example: 120 reviews on — replace with your real count" | count wording, escaped. `info`: copy the platform count, never round up |
| `platform_name` | text | — | the logo's alt text, or plain text when no logo. `info`: the site where these reviews and the rating are published (the one the link opens) |
| `platform_logo` | image_picker | — | merchant-uploaded logo, `widths: '100, 200'`, `sizes` from height × aspect ratio. `info`: only logos they may use |
| `logo_height` | range 16–40 step 2 px | `24` | logo height (`--av-review-wall-logo`); width follows the image's ratio, so nothing shifts |
| `platform_url` | url | — | wraps the summary in a link (new tab). **Without it the summary does not render** (the editor shows a dimmed preview with a caption). It never unlocks card stars |
| `layout` | select `grid` / `masonry` | `grid` | CSS grid rows (cards in a row share a height) or CSS multi-column (cards stack, read top to bottom) |
| `cols_desktop` | select 2–5 | `3` | desktop columns (≥ 990 px); capped at the cards shown at first (`initial_count` when Show more hides some, else all), so a short first batch leaves no empty tracks. Tablets (≥ 750 px) show `min(columns, 2)` |
| `cols_mobile` | select 1 / 2 | `1` | phone columns |
| `card_style` | select `outlined` / `filled` / `raised` / `plain` | `outlined` | card box (same vocabulary as Testimonials) |
| `clamp_lines` | range 0–12 | `5` | lines shown before "Read more"; 0 = no cut, no dialog, no `anvil-dialog.css` |
| `image_ratio` | select `adapt` / `1:1` / `4:5` / `16:9` | `1:1` | photo box shape (anvil-media) |
| `show_stars` | checkbox | `true` | card stars, still only on a review with its own link |
| `show_more` | checkbox | `true` | enable the batch reveal |
| `initial_count` | range 2–24 | `6` | cards shown at first and added per click |
| `show_disclosure` | checkbox | `true` | the disclosure line under the wall |
| `disclosure` | text | — | overrides the default `anvil.trust.quotes_disclosure` ("Quotes shared by customers; entered by the store."). `info`: say plainly who entered them; never "verified" unless each links to its original |

30 non-header settings in total (13 chassis + 17). Preset "Review wall": heading "Customer **reviews**", eight example reviews (two long ones, Sam K. and Riley M., show the cut at the default 3 columns; the last two wait behind "Show more"; no stars and no summary rating, so nothing unchecked reaches shoppers, while the editor shows the summary line as a dimmed preview). `disabled_on.groups: header, custom.overlay` (as Testimonials).

## Blocks
Local block `review` ("Review"), `max_blocks: 50`, opening with an honesty paragraph:

| id | type | default | note |
|---|---|---|---|
| `text` | textarea | "Example review — replace with words a real customer wrote, copied exactly." | escaped, line breaks kept (`newline_to_br`); a blank review is skipped on the storefront and shows `anvil.editor.block_empty` in the editor |
| `rating` | range 0–5 step 1 | `0` | card stars (whole stars, as platforms show them); 0 (the default) hides. Shown only with this review's own `source_url` |
| `name` | text | "Example: Alex R." | escaped; also names the Read more button ("Read more of the review by …") |
| `date` | text, placeholder `2026-03-14` | — | must be `YYYY-MM-DD`; printed as `<time datetime="<as typed>">` with `date: format: 'anvil_date'` (built by hand, not `time_tag`; see Uncertain) |
| `image` | image_picker | — | customer photo, `widths: '300, 450, 600'`, eager for the first visible row in the first two sections (grid: the first `cols` cards; masonry: the top card of each column) |
| `source_url` | url | — | "See the original review" link (new tab); the only thing that lets this card show its stars |

`{{ block.shopify_attributes }}` is on each `<li>`.

## Behaviour
- **Without JavaScript (or if the module fails to load):** every review is visible, in full; no Read more buttons, no Show more button. The clamp, the hidden extras and both buttons key on `.av-review-wall:defined` / `.av-enhance:defined`, never on `html.js` (CONVENTIONS §6 enhancement gating).
- **Read more:** with the module, the text is clamped with `-webkit-line-clamp` (MDN: still needs the `-webkit-box` properties). In `connectedCallback` the module measures every clamped text (`scrollHeight > clientHeight`) and hides the button where nothing is cut, in the same task that defines the element, so buttons never flash. A `ResizeObserver` on the grid (one `requestAnimationFrame` per burst) measures again when the width or revealed cards change it, and `document.fonts.ready` triggers one more pass (a web font can need one more line without changing the grid's size, since a clamped row keeps its height). Each pass reads every card first and then writes only the buttons whose state changed, so the grid lays out once. A click clones the card's `<figure>` (minus the button) into the shared dialog body, sets the images' `sizes` to the dialog width, and calls `<anvil-dialog>.open(button)` from anvil-core.js: modal, scroll lock, Escape and backdrop close, focus back to the button, `aria-expanded` on the opener (it has `aria-haspopup="dialog"`, DECISIONS 61). If anvil-core has not defined `<anvil-dialog>` yet (its top-level imports are still loading) or failed to load, the module opens the native modal itself and wires the close button, `aria-expanded` and focus return; Escape closes it natively (no scroll lock in that window). Screen readers already get the full text in the card (line clamping is visual only); the dialog is a reading convenience.
- **Show more:** cards after `initial_count` carry `.av-review-wall__card--extra` and `tabindex="-1"`; each click adds `.av-is-shown` to the next `initial_count` of them, measures their Read more buttons, moves focus to the first revealed card and removes the button after the last batch.
- **Editor:** selecting a hidden review (`shopify:block:select` bubbles to the element) reveals them all, then anvil-core scrolls to it. Settings changes re-render the section, which resets the reveal.
- **Keyboard:** native buttons and links; the global `:focus-visible` ring; touch targets ≥ 24 px (Read more, source link, summary link).
- **Reduced motion:** the section animates nothing itself; the dialog's open animation is anvil-dialog.css's, already gated.
- **Images:** card photos lazy except the first visible row in the first two sections (grid: the first `cols` cards; masonry: the top card of each column, from an even split of the visible cards; hidden extras always lazy); the platform logo is eager in the first two sections; `sizes` follows the columns (`100/cols vw` desktop, `100/cols_t vw` tablet, `100/cols_m vw` phone).
- **Assets:** `anvil-review-wall.js` loads only when there is something to enhance (`clamp_lines > 0` or more reviews than `initial_count` with Show more on); `anvil-dialog.css` only when the dialog renders. JS 4,740 B raw / 1,904 B gzipped (budget 2 KB); section CSS 4.8 KB raw / 1.3 KB gzipped (cap 6 KB).

## Honesty notes
- **Summary:** rating, count, platform name and logo render only with `platform_url`, so a shopper can check them (the same rule as the `anvil-review-stars` block). The numbers are typed by the merchant and never computed or adjusted; the `info` texts say to copy them from the platform and never round up.
- **Card stars** render only when the card has its own `source_url` (as in Testimonials). The section's `platform_url` never unlocks them: a platform page is no source for a quote a customer emailed, and it would put stars on every card. `rating` defaults to `0`, so no card shows stars nobody set; the editor note `anvil.editor.review_wall_no_source` says why set stars are hidden.
- **Summary rating defaults to `0`**, so adding the platform link alone shows the count and logo, never a "5.0" the merchant did not type. In the editor, without the link, the summary renders dimmed with the caption `anvil.editor.review_wall_summary_preview`; nothing of it reaches shoppers.
- **No platform logos ship**; the logo is an `image_picker` with an "entitled to use" `info`.
- **Disclosure line on by default** ("Quotes shared by customers; entered by the store."); its `info` says to keep it unless every review links to its original, and the override's `info` says never to call the reviews verified unless each one links to where it was posted.
- **Example content** reads as an example ("Example review — …", "Example: Alex R."); preset dates are left empty so an unedited store shows no fabricated dates.
- **No structured data.** The section emits no `Review` / `AggregateRating` JSON-LD: typed reviews are not review-app data, and Anvil's only `AggregateRating` comes from the `reviews.rating` metafields (`snippets/anvil-json-ld.liquid`).
- No "verified" badge: a typed "verified buyer" mark could not be checked.

## Uncertain / for review
- **Layout change at define time.** Because the clamp and the hidden extras wait for `:defined`, a wall that is on screen at first paint can shrink when the module runs (the usual place for this section is far down a landing page, where it does not count towards CLS). Keying on `html.js` would avoid it but hides content if the module fails, which CONVENTIONS §6 forbids.
- **Date parsing.** `'YYYY-MM-DD 12:00' | date: '%Y-%m-%d'` is used as a validity round-trip, and the visible text comes from the same parse path (`date: format: 'anvil_date'`; shopify.dev documents `format:` with custom `date_formats`). `time_tag` was dropped: shopify.dev's examples show it writing the default `datetime` in UTC (`16:56:02 -0400` → `20:56:02Z`), which in a UTC+13/+14 store could move a noon date to the day before. The `datetime` attribute is the typed `YYYY-MM-DD`. Confirm the visible date on the dev store (gates G3/G4 were not run in this wave).
- **Masonry eager estimate.** CSS multi-column balances columns by height, not card count, so the "top of each column" cards are estimated from an even split; with very uneven review lengths one top card may stay lazy (it still loads, just later).
- Masonry reflows every column when Show more adds cards (multi-column layout distributes cards top to bottom); the grid layout appends rows instead.

## Locale keys needed (integrator adds at wave end)
| key | English |
|---|---|
| `anvil.review_wall.read_more` | Read more |
| `anvil.review_wall.read_more_by` | Read more of the review by {{ name }} |
| `anvil.review_wall.show_more` | Show more reviews |
| `anvil.trust.original_review` | See the original review |
| `anvil.review_wall.dialog_title` | Customer review |
| `anvil.editor.review_wall_no_source` | Stars stay hidden on reviews without their own link. Add the link to where the customer posted each review so shoppers can check its stars. |
| `anvil.editor.review_wall_summary_preview` | Editor preview: shoppers see this line once you add the platform link. Type the rating and count exactly as the platform shows them. |

Reused: `anvil.a11y.new_window`, `anvil.a11y.close`, `anvil.trust.quotes_disclosure`, `anvil.editor.block_empty`, `anvil.editor.empty_section`, `anvil.stars.label` (via anvil-stars), `date_formats.anvil_date`.

## Integration pass (2026-10-15)
- The "see the original" link uses the shared `anvil.trust.original_review` (also Testimonials). Placed on `templates/product.landing.json` with the anchor `reviews`.

## Fix pass (2026-10-15)
- Setting ids follow the theme-wide vocabulary (CONVENTIONS §5; DECISIONS 82–100); the tables above use the new ids: `columns` → `cols_desktop`, `columns_mobile` → `cols_mobile`. Saved templates were migrated.
- Uses the shared pieces: card boxes from `snippets/anvil-surface` and `.av-surface` (DECISIONS 83); columns from the shared `.av-grid` rule (DECISIONS 82); eager or lazy media from `snippets/anvil-above-fold` (DECISIONS 85); the editor-only empty note from `snippets/anvil-editor-empty` (DECISIONS 87); typed dates through `snippets/anvil-typed-date` (DECISIONS 88).
- Availability: `disabled_on` groups ["header","custom.overlay"] (CONVENTIONS §4, DECISIONS 100).
