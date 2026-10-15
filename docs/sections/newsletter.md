# Newsletter — `sections/anvil-newsletter.liquid`

_Section card, 2026-10-15. Wave-2 section, built from `docs/agent-prompts/newsletter.md` (spec card `docs/spec/newsletter.md`). Addable section, full chassis. Classes `.av-newsletter*`. No JavaScript, no assets of its own._

## Purpose
An email signup band: the chassis heading and subheading, one email field with a submit button, a success or error message, and small print (consent wording, privacy link). An optional background image with an overlay sits behind it. Planned for the home page, after the logo list (SPEC "Homepage"). It can also be added to the footer group, above the footer. It is disabled in the header and overlay groups.

## Form
- `{% form 'customer', id: 'anvil-newsletter-<section.id>', class: 'av-newsletter__form' %}` posts `contact[email]` and a hidden `contact[tags]` = `newsletter`. Per shopify.dev (Email consent), each signup creates a customer with `accepts_marketing` true, and Shopify adds the tag. When the store has double opt-in on (help.shopify.com: Settings > Customer privacy, Marketing settings), the subscription stays pending until the shopper clicks the confirmation email. The settings paragraph says so: "subscribes them to email marketing (pending until they confirm, if double opt-in is on …)".
- **Scroll back after posting.** Shopify's customer form writes the form id into the action as a fragment. With no id, shopify.dev's example output is `action="/contact#contact_form"`. The section passes a unique id, so the action becomes `/contact#anvil-newsletter-<section id>`. The success redirect inherits that fragment (a redirect without its own fragment keeps the request's), and the error response is the page at that same URL, so the browser lands on this form either way. `html` already sets `scroll-padding-top: var(--av-header-h)` (base CSS), so a sticky header does not cover it. The form adds `scroll-margin-top: var(--av-space-8)` so the heading above stays in view.
- **States.** `form.posted_successfully?` shows `success_text` (fallback `anvil.newsletter.success`) in a `role="status"` message with id `<form id>-success` and a check icon. `form.errors` shows `form.errors | default_errors` in a `role="alert"` message with id `<form id>-errors` and an alert icon. The email input then gets `aria-invalid="true"` when the error is on `email`, and `aria-describedby` points at the error message. After a successful post, `aria-describedby` points at the success message instead. The message comes first inside the form, so after the jump a screen reader reads it before the field. Both use the shared `.av-form-message` styles from `anvil-base.css`.
- **Live regions at page load.** With no JavaScript the result is in the HTML when the page loads, and a live region that is already present at load is not announced: live regions announce changes, not initial content. So the roles alone do not announce the result. The no-JS substitutes are the fragment jump (the browser lands on the form, message first) and the `aria-describedby` link from the field to the success or error message, so a screen-reader user who tabs into the field hears the result.
- **No `autofocus`.** The footer's newsletter block already puts `autofocus` on its message, and MDN says only one element per document may carry it (the first focusable one wins). Two would fight. Also, browsers skip `autofocus` when the URL fragment names an element, which it does here. So the result reaches screen readers through the fragment jump and the field's description (see "Live regions at page load").
- **Field.** `type="email"`, `autocomplete="email"`, `autocapitalize="off"`, `spellcheck="false"`, `required` (native validation, no `novalidate`), `value="{{ form.email | escape }}"`, so a rejected address stays in the field. The label is `anvil.newsletter.label` ("Email"). It is visually hidden unless `show_label` is on, and the placeholder is never the only label. With small print, `aria-describedby` also names the small print, so screen-reader users hear the consent wording before they subscribe.
- **Button.** `anvil-button` with `type: 'submit'`, size `md` (the same `--av-control-h` as the field), style primary or secondary. A blank label falls back to `anvil.newsletter.submit`. The label is escaped before it is passed in, because the snippet prints labels as HTML.

## Settings
The 13 chassis settings come first, pasted from CONVENTIONS §4. A header "Newsletter" and a paragraph follow. The paragraph says what a signup creates (pending until confirmed when double opt-in is on), and that any promised discount must exist and reach every subscriber. Then 8 section settings, then a header "Background" and 6 more: 27 settings in total.

| id | type | default | what it does |
|---|---|---|---|
| `layout` | select `inline` / `stacked` | `inline` | field and button on one row, or the button full width below the field. When `inline` has no room (about 300 px of content width), the button wraps to its own full-width line. The field grows first (`flex: 999 1 12rem`), and the button keeps its natural width while both fit. |
| `content_width` | range 360–960 px, step 20 | 640 | max width of the heading, form and small print column (`--av-newsletter-w`) |
| `show_label` | checkbox | off | shows the "Email" label above the field |
| `placeholder` | text | "Your email address" | field placeholder. Left out when blank. |
| `button_label` | text | "Subscribe" | submit button text. Info: name a discount or gift only if a real code exists and reaches every subscriber. |
| `button_style` | select `primary` / `secondary` | `primary` | `anvil-button` style |
| `success_text` | text | "Thanks for signing up." | message after a successful signup. Info: mention a discount, or a confirmation email (double opt-in), only if every subscriber really receives it. |
| `small_print` | richtext | "Example small print — …" | consent wording and privacy link, under the form, in `--av-text-sm` muted text with underlined links. Info: any discount named here must exist and reach every subscriber. |
| `image` | image_picker | — | optional background, decorative (`alt=""`). `image_tag` with `widths: 750, 1100, 1500, 1800, 2200`. `sizes` follows the section width (`settings.page_width` / `narrow_width`, `100vw` at full width). Eager loading in the first two sections of the template (`section.location` `template` or `content_for_index`; `fetchpriority="high"` there, eager without a priority hint when `section.index` is nil, as in the editor), lazy after that and always lazy in a section group such as the footer, where `section.index` restarts at 1 on every page. Info also says the card option keeps the form and small print readable over a busy image. The image picker's focal point is applied by `image_tag` (inline `object-position`), and `object-fit: cover` fills the band. |
| `overlay` | range 0–90 %, step 5 | 40 | strength of the `.av-overlay` above the image (`--av-overlay-strength`). Shown only when an image is set (`visible_if`). Info: raise it until the text reads clearly over the busiest part of the image, on phones too. |
| `overlay_color` | select `shadow` / `scheme` | `scheme` | theme overlay colour (`--av-overlay-rgb`), or the section scheme's background (`--av-bg-rgb`). Shown only with an image. The default is `scheme`: the overlay tints toward the background the scheme's text colour was chosen for, so text stays readable in any scheme (with the default scheme-1, dark text over a black shadow overlay would lose contrast as the overlay rises). Info: theme shadow colour suits a scheme with light text; the scheme background suits any scheme. |
| `height` | select `auto` / `sm` / `md` / `lg` | `auto` | minimum band height, with the content centred vertically: phones 240 / 320 / 400 px, 750 px and up 320 / 440 / 560 px. Applies with or without an image. |
| `box` | checkbox | off | puts the content on a card (`.av-box` with its own scheme), padded `--av-space-6`/`-5` on phones and `--av-space-7` from 750 px |
| `box_scheme` | color_scheme | `scheme-1` | the card's colour scheme. Shown only when `box` is on. |

**Alignment.** The chassis `head_align` also places the content column (left, centre, right) and aligns the small print. That keeps heading, form and small print on one axis without another setting. The form's own text (messages, label) stays start-aligned.

**Width and image.** With an image and `width: full`, the inner wrapper gets `av-section__inner--bleed` and the image runs edge to edge. Otherwise the band is framed with the theme's media radius, border and shadow (`.av-media-frame`). Either way the band gets `--av-space-8` (phones) or `--av-space-9` block padding and gutter inline padding. Without an image there is no extra band padding; the section padding is enough.

**Messages over an image.** The shared `.av-form-message--success` / `--error` styles are transparent with the fixed `--av-success` / `--av-error` colours, which a photo behind them can push below 4.5:1 (red on a darkened photo is about 2.3:1). With an image and the card off, `.av-newsletter__notice` gets the section scheme's background (`rgb(var(--av-bg-rgb))`), so the message sits on a solid surface.

## Blocks
None. The spec card lists no blocks, and the preset ships no example blocks.

## Preset
"Newsletter". Heading "Join the **list**". Subheading "Example: new arrivals and restock news, about twice a month. Replace with what you really send." Small print "Example small print — …". Everything reads as an example.

## Behaviour
- No JavaScript. The form posts and the page reloads (Shopify's customer form has no AJAX endpoint for themes).
- Keyboard: one field and one button in tab order. Focus rings come from the base `.av-field__input:focus-visible` and `.av-btn` rules (with the forced-colours outline).
- Reduced motion: nothing animates here except the chassis reveal, which the chassis gates.
- CSS: 2.0 KB raw / 0.6 KB gzipped (1,969 / 641 bytes) in `{% stylesheet %}`. Every selector starts with `.av-newsletter`. Three rules adjust shared pieces: `.av-newsletter--image .av-newsletter__content:not(.av-box) .av-newsletter__notice` gives the form messages a scheme background over an image (see "Messages over an image"), and two by spacing only: `.av-newsletter__content .av-section-head` tightens the head's bottom margin to `--av-space-5`, and `.av-newsletter__content .av-newsletter__print` overrides `.av-rte`'s size and link colour for small print.
- Locale keys used, all existing: `anvil.newsletter.label`, `anvil.newsletter.submit`, `anvil.newsletter.success`. No new keys.

## Honesty notes
- No subscriber counts, "X people joined" lines or invented social proof. The section has no setting that could print one.
- Discounts: the settings paragraph, the button-label info, the success-message info and the small-print info all say a promised discount or gift must exist and reach every subscriber.
- Consent: the settings paragraph does not claim consent is accepted outright; it says the subscription is pending until the shopper confirms when double opt-in is on.
- The success message's default makes no promise (no discount, no "check your inbox"). The info says to mention a confirmation email only when double opt-in is on.
- The background image is decorative. Its info says to keep any message in the text, where everyone can read it.

## Uncertain / to verify on the dev theme
1. **Fragment with a custom id.** shopify.dev documents the default `action="/contact#contact_form"`, but its custom-id example (a cart form) does not show whether a customer form's fragment follows the id. Check the rendered action reads `/contact#anvil-newsletter-<section id>`. If it does not, the page would reload at the top and the message would only be found by scrolling. The fallback would be a tiny module that scrolls to and focuses `.av-newsletter__notice`, which the card's "JS: none" would need to allow.
2. **Two customer forms on one page** (this section and the footer's newsletter block). Shopify reports the post to every `customer` form on the page, so both show the success (or error) message. The fragment still brings the shopper back to the form they used. This is a platform limit with no Liquid-only fix.
3. **Already-subscribed email.** Shopify's response for an email that already exists is not documented on shopify.dev. The section shows whatever `form.posted_successfully?` / `form.errors` report.
4. **Duplicate form markup.** The form (field, row, button, notices, `aria-describedby` logic) and its CSS mirror `blocks/_anvil-popup-newsletter.liquid`. DESIGN-sections planned one shared form; the integrator is asked to extract `snippets/anvil-newsletter-form.liquid` and render it from both, so fixes such as the success `aria-describedby` reach the popup too.
5. **Consent checkbox** (for stores that need explicit opt-in) is not in the card. Merchants can state consent in the small print. A required checkbox would be a later addition.

## Integration pass (2026-10-15)
- Placed on `templates/index.json`. Not done: extracting the shared signup form into a snippet (the popup block still lacks the success-message `aria-describedby` and the solid message background).

## Fix pass (2026-10-15)
- Uses the shared pieces: eager or lazy media from `snippets/anvil-above-fold` (DECISIONS 85).
- Availability: `disabled_on` groups ["header","custom.overlay"] (CONVENTIONS §4, DECISIONS 100).
