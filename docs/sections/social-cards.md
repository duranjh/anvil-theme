# `anvil-social-cards` — Social cards (section card)

_Wave-5 section. File `sections/anvil-social-cards.liquid`, editor name "Social cards". Spec: `docs/SPEC.md` §4.2 "Social-proof cards"; `docs/DESIGN-sections.md` §3 row `anvil-social-cards`; card `docs/spec/social-cards.md`. Contract: `docs/CONVENTIONS.md` §3–§4, §6 (`<anvil-slider>`)._

## Purpose
Up to 24 post-style cards that the merchant copies in by hand. Each card has a profile photo (or initials), a name, a username, where it was posted, a date, the post text (hashtags and @mentions can take the accent colour), a photo, like/comment/share counts and a "View post" link. They show as a grid, masonry columns or a slider. Nothing is fetched from a social network. Every count is the number the merchant typed, and a disclosure line under the cards says so. Counts and the network icon show only on a post that links to the original, where a shopper can check them (CONVENTIONS §10, the same rule as Testimonials' stars and Review wall's rating).

There is no section-specific JS and no asset file. The slider is the shared `<anvil-slider>` (spec: "SL opt"), so it scrolls without JavaScript. The CSS lives in `{% stylesheet %}`: 5.7 KB raw, 1.4 KB gzipped.

## Markup (shopper view)
```
div#anchor.av-section.av-s-anvil-social-cards                    ← anvil-section-attrs
  div.av-section__inner
    .av-section-head (h2 + subheading)                            ← anvil-section-head
    ── grid / masonry ──
    ul.av-social-cards.av-social-cards--grid|--masonry.--<card_style>.--t-<text_size>[role=list]
       style="--av-social-cards-cols; -cols-t; -cols-m"
      li.av-social-cards__item {{ block.shopify_attributes }}                         ×N
    ── slider ──
    link anvil-slider.css
    anvil-slider.av-social-cards.av-social-cards--slider.--<card_style>.--t-<size>[--autoplay][--dots][--arrows][--scroll-t][--scroll-d]
                 role=region aria-label="<heading text | Customer posts>" per-view=1 per-view-desktop=N autoplay=S [arrows] [dots]
                 style="--av-slider-per-view; --av-slider-per-view-desktop; --av-social-cards-tablet; --av-social-cards-peek; --av-social-cards-peek-t"
      div.av-social-cards__track[data-slider-track]
        div.av-social-cards__item[data-slider-slide] {{ block.shopify_attributes }}   ×N
      div.av-slider__dots[data-slider-dots]                       ← when dots are on
    script[type=module] anvil-slider.js
    ── each item ──
          article.av-social-cards__post[aria-labelledby=<name id | username line id>]
            header.av-social-cards__head
              span.__avatar (img alt="" | initials aria-hidden)
              span.__who > span.__name#…-name · span.__meta#…-meta (handle · where · <time>)
              span.__network > img                                ← uploaded icon, optional; only when post_url is set
            p.__text (escaped, line breaks kept, span.__tag around #words and @words)
            .av-media.av-media-frame.__media (anvil-media)        ← under or above the text; placeholder on example posts
            footer.__foot
              ul.__counts[role=list] > li.__count (icon aria-hidden · span.__num · span.av-visually-hidden " likes")   ← only when post_url is set
              a.__link[target=_blank] "View post" + hidden "(opens in a new tab)"
    p.av-social-cards__note                                       ← disclosure line (default on; forced on while any post has no post_url)
    p.av-social-cards__note.av-example-note                       ← editor only: no count shows yet, or counts / an icon wait for a link
```
Headings: the section heading is the chassis `h2`. Post names are labels, not headings (CONVENTIONS §3), so the outline has nothing under the `h2`. Each post is an `<article>` (MDN lists a user-submitted post as a typical article), named by the poster's name, or by the username line when there is no name. That way a screen reader's article list reads "Example name", not "article". The `<header>`/`<footer>` inside belong to the article.

## Settings
The 13 chassis settings come first, verbatim. They are followed by 15 of the section's own, 28 in total (the limit is 40). A `paragraph` under the "Social cards" header says the cards are copied in by hand and the counts never update.

| id | type | default | effect |
|---|---|---|---|
| `layout` | select `grid` / `masonry` / `slider` | `grid` | CSS grid rows (cards in a row share a height, footer pinned to the bottom), CSS multi-column (cards keep their own height and read top to bottom), or `<anvil-slider>` |
| `cols_desktop` | select `2`–`4` | `3` | cards per row (grid, masonry) or per view (slider) at ≥ 990 px. The slider caps it at the number of cards that render; grid and masonry keep it, so a lone post stays card-sized (and its 600 w srcset stays adequate) instead of spanning the page. Tablets (750–989 px) show `min(columns, 2)` |
| `cols_mobile` | select `1` / `2` | `1` | phone columns, grid and masonry only (capped at the tablet count). The slider always shows one card plus a 40 px peek on phones |
| `autoplay` | select `0` / `5` / `7` / `10` s | `0` | slider only. Pauses on hover, on focus, in a hidden tab, off-screen and while a block is selected. Starts paused under reduced motion. The pause button is always there (the shared slider) |
| `show_arrows` | checkbox | `true` | slider only. Arrows from 750 px up, in side space the section reserves only at widths where the row scrolls |
| `show_dots` | checkbox | `true` | slider only. Liquid renders the empty dots row (its height is reserved) and the script fills it |
| `card_style` | select `outlined` / `filled` / `raised` / `plain` | `outlined` | same vocabulary as Testimonials and Review wall. Raised pads the slider track so the shadow is not clipped |
| `image_position` | select `after_text` / `before_text` | `after_text` | post image under the text (text-first posts) or above it (photo-first posts) |
| `image_ratio` | select `adapt` / `1:1` / `4:5` / `16:9` | `1:1` | shape of the post image box (`anvil-media`) |
| `text_size` | select `sm` / `md` / `lg` | `sm` | `--av-text-sm|md|lg` for the post text |
| `tag_accent` | checkbox | `true` | words that start with `#` or `@` (and have at least one more character) take the accent colour. Off prints plain text |
| `show_counts` | checkbox | `true` | shows the counts typed on each post that has a `post_url`. Carries an honesty `info` |
| `like_icon` | select `heart` / `thumbs-up` | `heart` | icon for the likes count. Comments use `message-circle`, shares `share-2` (Lucide, rendered once per section) |
| `show_disclosure` | checkbox | `true` | prints the disclosure line under the cards. Ignored (the line stays) while any post that renders has no `post_url`, as in Testimonials. Carries an honesty `info` |
| `disclosure` | text | blank | overrides the line. Blank uses `anvil.social_cards.disclosure`. Its `info` says the text must still say the store entered the posts and the counts are a snapshot, and must not claim verified, live or independent |

Preset "Social cards": heading "Posts from **customers**", four example posts with no counts, dates, images or links. Their text explains what to fill in. Each one draws a placeholder illustration in the image slot (see Behaviour), so an unedited section shows the whole card. `disabled_on.groups: header, custom.overlay`, as in Testimonials.

## Blocks
Local block `post` (name "Post"), `max_blocks: 24`. A `paragraph` at the top of every post says it is a copied-in post (HONEST.md: merchant-typed social proof is labelled as such in the editor).

| id | type | default | note |
|---|---|---|---|
| `avatar` | image_picker | — | 44 px circle, `widths: '44, 88, 132'`, `alt=""` (the name sits beside it). Without one: initials (first and last word of the name, else the first letter of the username) on an 8 % tint, `aria-hidden` |
| `name` | text | "Example name" | escaped; names the `<article>` |
| `handle` | text | "@example_handle" | printed as typed (no `@` added) |
| `platform` | text | blank | "Where it was posted", plain text in the meta line. **Blank by default: no platform names in defaults** (spec) |
| `platform_icon` | image_picker | — | optional small logo in the card corner, 20 px high (`widths: '40, 80, 120'`). **Shown only when `post_url` is set.** Decorative (`alt=""`) when `platform` is filled in, otherwise the image's own alt text. `info`: Anvil ships no network logos |
| `date` | text, placeholder `2026-03-14` | blank | must be `YYYY-MM-DD`. Read at local noon and printed with `time_tag: format: 'anvil_date'`. Anything that does not read back as the same date is ignored (same rule as Review wall) |
| `text` | textarea | "Example post — replace with what a customer actually posted, copied as written. #example" | escaped. Line breaks become `<br>`. With `tag_accent`, each line is split on spaces and `#…`/`@…` words get `span.av-social-cards__tag` |
| `image` | image_picker | — | post photo via `anvil-media` (`widths: '300, 450, 600'`, `sizes` from the column counts, 85vw for the phone slider). Alt text is the image's own. Empty on a post still showing the example text: a placeholder illustration |
| `likes`, `comments`, `shares` | number | blank | blank or 0 hides that count; shown only when `post_url` is set. See "Counts" below |
| `post_url` | url | — | "View post" link (new tab, with the hidden "(opens in a new tab)"). Counts and the network icon need it |

A post with neither text nor image is skipped on the storefront. In the editor it stays visible and selectable, showing `anvil.editor.block_empty`. `{{ block.shopify_attributes }}` sits on each item (`li` or `[data-slider-slide]`), so the slider's `shopify:block:select` handler scrolls to the post being edited.

## Behaviour
- **Counts need a link.** A post's counts and network icon render only when its `post_url` is set, so every number and logo a shopper sees sits next to a "View post" link they can check. A post with counts but no link shows neither; the editor note says why.
- **Counts.** `number` settings, so the merchant types the exact figure the post shows. Below 1,000 the number prints as typed. From 1,000 it is shortened the way posts show counts, always **rounded down** so a count is never overstated: 1,299 → "1.2K", 12,345 → "12.3K", 123,456 → "123K", 1,250,000 → "1.2M" (the K/M wording comes from `anvil.social_cards.thousands|millions`). Screen readers hear the number followed by a hidden, pluralised word ("1.2K likes", "1 comment"). The rounding rule was checked in a scratch script against 13 boundary values.
- **Without JS:** grid and masonry are plain HTML/CSS. The slider is a horizontal scroll-snap row with the same widths and peek (inline custom properties), with no arrows, an empty reserved dots row and no autoplay.
- **With JS (`anvil-slider.js`):** arrows move one page, there is one dot per page, ArrowLeft/ArrowRight work inside the carousel, `role=region` + `aria-roledescription="carousel"`, slides get `role=group` "N of M", a polite live region, and `av-is-static` hides the controls when everything fits.
- **Narrow cards:** a container query on each item (`@container (max-width: 239px)`, for example two columns on a phone or four on a 990 px screen) cuts the padding, shrinks the avatar to 36 px and moves the name and username under it to the full card width, so names never break letter by letter. The meta line flows as text with real spaces around the "·" separators, so it wraps between parts.
- **Loading:** images (posts, avatars, icons) are lazy, except in the first two sections (`section.index` ≤ 2 or nil), where the first `columns` posts are eager. There is no `fetchpriority`, because a social card is not expected to be the LCP element.
- **No blocks / nothing to show:** nothing renders after the heading. The editor shows `anvil.editor.empty_section`.
- **Editor note:** a muted note under the cards (`anvil.editor.social_cards_no_counts`) says that counts and the network icon show only on posts that link to the original. It appears in the editor when any post has a network icon but no link, or when `show_counts` is on and either no count shows yet or some post has counts but no link. Shoppers never see it.
- **Placeholder image:** a post with no photo whose text still contains the shipped "Example post —" draws `placeholder_svg_tag` through `anvil-media` (`placeholder: 'lifestyle-1'`, `'lifestyle-2'` on even cards) in the image slot, at the section's image shape and position. Real text-only posts draw nothing.
- **Translations** are printed as `t` returns them (already escaped). Only merchant text is escaped, and the slider's region label uses `escape_once`, so entities stored by `inline_richtext` are not escaped twice.
- **Reduced motion:** handled by the slider (paused autoplay, `scroll-behavior: auto`). The section itself animates nothing.
- **Checked:** a static mock of the rendered markup (real `anvil-base.css`, `anvil-slider.css/js`, this stylesheet; grid outlined, masonry tinted with 2 phone columns, slider raised with the image first) at 375, 800 and 1280 px. There was no horizontal page scroll, the slider defined itself with "N of M" slide labels, and the arrows sat in the reserved side space.

## Honesty notes
- **Counts and network logos need a link to the original.** CONVENTIONS §10 / HONEST.md allow typed social-proof numbers only with a source link, so counts and the uploaded icon render only when `post_url` is set (the "View post" link is printed on the same card). The section `paragraph`, `show_counts`, each count, `platform_icon` and `post_url` infos all say so.
- **Counts are merchant-entered and labelled as a snapshot.** The section `paragraph`, the `show_counts` info and each count's info all say the numbers are copied by hand and never update. Each count's info adds "never round up". The display itself only ever rounds down.
- **Example content reads as an example.** Defaults and presets say "Example name", "@example_handle" and "Example post — …". Presets carry **no counts, dates, images or links**, so an unedited store shows no numbers (as in Testimonials, where stars stay at 0). One preset post's text tells the merchant where the counts go.
- **No platform names and no logos are shipped** (spec, HONEST.md). `platform` is blank by default. The corner icon is an image the merchant uploads, with an info saying to use only a logo they are entitled to use. None of this section's files name a network.
- **No "verified" check mark.** Social networks use a check badge to mean the network verified the account. Drawing one on a copied post would imitate that claim, so the section offers none (unlike Testimonials' "Verified purchase", which is about the store's own orders).
- **Disclosure line** on by default: "Posts entered by the store; counts as they were when each post was added." It can be switched off only when every post that renders links to the original; otherwise it prints regardless (as in Testimonials). The override text's info says it must keep that meaning and must not claim verified, live or independent posts.
- **Permission.** The block paragraph and the avatar, name and image infos ask for the person's permission, and the text info forbids changing what they meant.
- **No structured data** (`SocialMediaPosting`, `Review`, `AggregateRating`): these are store-entered copies, not the original posts.

## Locale keys needed (integrator adds them)
| key | English |
|---|---|
| `anvil.social_cards.label` | Customer posts |
| `anvil.social_cards.view_post` | View post |
| `anvil.social_cards.disclosure` | Posts entered by the store; counts as they were when each post was added. |
| `anvil.social_cards.thousands` | {{ value }}K |
| `anvil.social_cards.millions` | {{ value }}M |
| `anvil.social_cards.likes.one` / `.other` | like / likes |
| `anvil.social_cards.comments.one` / `.other` | comment / comments |
| `anvil.social_cards.shares.one` / `.other` | share / shares |
| `anvil.editor.social_cards_no_counts` | Counts and the network icon show only on posts that link to the original. Type each count as that post shows it; counts never update by themselves. |

The three count keys are plural objects, read with `t: count:` and the raw number. They hold only the word, because the number is printed beside them. Existing keys used: `anvil.a11y.new_window`, `anvil.editor.block_empty`, `anvil.editor.empty_section`. The slider's own strings come from `window.Anvil.strings`.

## Contract assumptions (other owners)
- `<anvil-slider>` (`assets/anvil-slider.js` / `.css`, read-only) is used exactly as Testimonials uses it. It reads `per-view`, `per-view-desktop`, `autoplay`, `arrows`, `dots`, keeps the `role` Liquid writes, and leaves `--av-slider-peek` alone when there is no `peek` attribute (the section sets the peek per breakpoint). It computes pages from the rendered layout, which respects the section's tablet `--n`. The section only hides arrows below 750 px and reserves space for them and for the pause button.
- `anvil-media` reserves the aspect ratio and renders `image_tag` with the given `widths`/`sizes`/`loading`, or `placeholder_svg_tag` with the given `placeholder` name when no media is passed. Its `.av-media-frame` class (anvil-base.css) supplies the radius (`--av-radius-media`), overflow, border and shadow, so the section adds none of its own (CONVENTIONS §3: compose, do not restyle).
- `.av-align--*`, `.av-example-note` and `.av-visually-hidden` come from `anvil-base.css`.
- Liquid's `newline_to_br` writes `<br />` before each newline (also for `\r\n`), and the hashtag pass splits on that string. A literal `<br />` typed by the merchant becomes a line break too, and the rest of the text is still escaped.
- Comparing a blank `number` setting (nil) with `> 0` evaluates false in Liquid, which the first pass relies on.

## Uncertainties / open questions
1. **Abbreviation format.** "1.2K" uses a hard-coded `.` decimal separator and the K/M suffixes from locale keys. That is fine for English v1.0. Other locales may want "1,2 k" (the separator would need its own key).
2. **Example counts in the preset.** The preset ships no counts, so `show_counts` has nothing to show in an unedited store, and an editor-only note says why. If the owner prefers visible example numbers, they would have to read as examples, which a bare number cannot. I left it to the honesty rule.
3. **No `@app` / `custom_liquid` blocks.** Same reasoning as Testimonials: a social-feed app's widget does not fit inside a post card. Merchants who want a live feed should use their app's own section.
4. **No video posts.** The spec lists an image only. `anvil-media` could take a `video` setting later (v1.1) without changing the card layout.
5. **Gates G0/G3/G4** (paths-lint, push, screenshots) were not run: no git in this wave and no dev-theme credentials. G1/G2 were run directly (see the builder's notes).

## Fix pass (2026-10-15)
- Setting ids follow the theme-wide vocabulary (CONVENTIONS §5; DECISIONS 82–100); the tables above use the new ids: `columns` → `cols_desktop`, `columns_mobile` → `cols_mobile`. Saved templates were migrated.
- Uses the shared pieces: card boxes from `snippets/anvil-surface` and `.av-surface` (DECISIONS 83); columns from the shared `.av-grid` rule (DECISIONS 82); slider attributes, peek, arrows and dots per width from `snippets/anvil-slider-attrs` (DECISIONS 89); eager or lazy media from `snippets/anvil-above-fold` (DECISIONS 85); the editor-only empty note from `snippets/anvil-editor-empty` (DECISIONS 87); typed dates through `snippets/anvil-typed-date` (DECISIONS 88); a hidden fallback heading through `anvil-section-head` (DECISIONS 84).
- Availability: `disabled_on` groups ["header","custom.overlay"] (CONVENTIONS §4, DECISIONS 100).
