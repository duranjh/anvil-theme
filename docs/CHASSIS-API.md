# CHASSIS-API (extracted from LiquidDoc headers)

## snippets/anvil-button.liquid
```
Button or link styled as a button. Renders <a> when url is set, otherwise <button>.
Renders nothing when both label and aria_label are blank.

@param {string} [label] - Visible text (inline HTML allowed)
@param {string} [url] - Destination; when set an <a> is rendered
@param {string} [style] - primary | secondary | ghost | link (default primary)
@param {string} [size] - sm | md | lg (default md)
@param {boolean} [full] - Stretch to the container width
@param {string} [icon] - Icon name from anvil-icon, drawn after the label
@param {boolean} [icon_first] - Draw the icon before the label instead
@param {string} [attrs] - Extra attributes, written verbatim
@param {string} [aria_label] - Accessible name when the label is not descriptive
@param {string} [type] - button | submit (default button; <button> only)
@param {boolean} [external] - Open the link in a new tab
@param {boolean} [disabled] - Disable the <button>
@param {string} [class] - Extra classes

@example
{% render 'anvil-button', label: 'Shop now', url: product.url, style: 'primary', size: 'lg' %}
{% render 'anvil-button', label: 'Add to cart', type: 'submit', full: true %}
```

## snippets/anvil-cart-bubble.liquid
```
The cart count bubble used in the header link, wrapped in the slot the Section Rendering API swaps.
The slot carries data-anvil-section="anvil-cart-bubble", so a swap replaces the whole <anvil-cart-bubble> element
(count, hidden state, label) and never nests one bubble inside another. The visually hidden "N items" text joins
the link's own hidden "Cart" text to name the link, for example "Cart, 3 items".
Rendered by sections/anvil-header.liquid and by sections/anvil-cart-bubble.liquid (the section exists only for
the Section Rendering API).

@example
{% render 'anvil-cart-bubble' %}
```

## snippets/anvil-css-tokens.liquid
```
Every settings-derived design token, as CSS custom properties.

Rendered twice by the layouts:
- `{% render 'anvil-css-tokens', part: 'preload' %}` in <head> outputs only
  the <link rel="preload" crossorigin> tag for the body font.
- `<style>{% render 'anvil-css-tokens' %}</style>` outputs the @font-face
  rules, one rule set per colour scheme (.av-scheme--<id>, the body scheme
  repeated on :root) and the :root type/space/shape/motion tokens.

Fixed tokens that do not depend on settings (space scale, easing, fluid type
formulas) live in assets/anvil-base.css. Output here stays under 6 KB.

@param {string} [part] - 'preload' for the preload tags; anything else for CSS
```

## snippets/anvil-icon-a-c.liquid
```
SVG path data for the Lucide icons whose names start with a to c (ISC licence; credited in NOTICE).
Called only by snippets/anvil-icon.liquid, which wraps the output in the <svg> element; renders nothing for an
unknown name. Split by first letter so each lookup stays small.

@param {string} name - Icon name
```

## snippets/anvil-icon-d-l.liquid
```
SVG path data for the Lucide icons whose names start with d to l (ISC licence; credited in NOTICE).
Called only by snippets/anvil-icon.liquid, which wraps the output in the <svg> element; renders nothing for an
unknown name. Split by first letter so each lookup stays small.

@param {string} name - Icon name
```

## snippets/anvil-icon-m-r.liquid
```
SVG path data for the Lucide icons whose names start with m to r (ISC licence; credited in NOTICE).
Called only by snippets/anvil-icon.liquid, which wraps the output in the <svg> element; renders nothing for an
unknown name. Split by first letter so each lookup stays small.

@param {string} name - Icon name
```

## snippets/anvil-icon-s-z.liquid
```
SVG path data for the Lucide icons whose names start with s to z (ISC licence; credited in NOTICE).
Called only by snippets/anvil-icon.liquid, which wraps the output in the <svg> element; renders nothing for an
unknown name. Split by first letter so each lookup stays small.

@param {string} name - Icon name
```

## snippets/anvil-icon.liquid
```
Inline SVG icon from the Lucide icon set (ISC licence; credited in NOTICE). Renders nothing when the name is unknown.
The path data lives in four small lookup snippets split by first letter (anvil-icon-a-c, -d-l, -m-r, -s-z), so
each render evaluates one short case/when instead of scanning a 27 KB table.

@param {string} name - Icon name, for example 'check', 'truck' or 'star'
@param {number} [size] - Width and height in pixels (default 24)
@param {string} [label] - Accessible name; when set the icon gets role="img" and aria-label, otherwise it is aria-hidden
@param {string} [class] - Extra classes added to the <svg>

@example
{% render 'anvil-icon', name: 'truck', size: 20 %}
{% render 'anvil-icon', name: 'star', label: 'Rated 5 stars' %}
```

## snippets/anvil-json-ld.liquid
```
Structured data (schema.org JSON-LD), rendered once near the end of <body>:
- Organization on the home page (name, url, logo, social profiles)
- Product with one Offer per variant, and AggregateRating only when the
  standard reviews.rating / reviews.rating_count metafields exist
- Article on article pages
- BreadcrumbList on product, collection, blog, article and page templates
Nothing here is typed by the merchant; every value comes from Shopify data.
```

## snippets/anvil-media.liquid
```
Responsive media in an aspect-ratio box: an image via image_tag, a Shopify video via video_tag,
or a click-to-load facade for YouTube/Vimeo (youtube-nocookie, nothing loads before the tap).
Falls back to a placeholder illustration. Its styles live in assets/anvil-base.css (every page).

@param {object} [image] - Image object; also used as the poster of an external video
@param {object} [video] - Shopify video or external_video media object
@param {object} [video_url] - video_url setting value (YouTube or Vimeo)
@param {string} [ratio] - adapt | 1:1 | 4:5 | 3:4 | 16:9 | 21:9 (default adapt)
@param {string} [widths] - Comma-separated srcset widths; the last one is the base width (default up to 2200)
@param {string} [sizes] - sizes attribute (default 100vw)
@param {string} [loading] - lazy | eager (default lazy)
@param {boolean} [priority] - LCP media: eager, fetchpriority high and preload
@param {string} [alt] - Alt text; defaults to the media's own alt
@param {string} [fit] - cover | contain (default cover)
@param {string} [placeholder] - placeholder_svg_tag name used when nothing is set (default image)
@param {string} [class] - Extra classes on the box
@param {boolean} [autoplay] - Shopify video: play muted and looping while in view, started by anvil-core.js only when
  the shopper allows motion; controls stay visible so it can always be paused (WCAG 2.2.2)
@param {boolean} [loop] - Shopify video: loop (default follows autoplay)
@param {boolean} [controls] - Shopify video: show controls (default true; autoplay keeps them on)

@example
{% render 'anvil-media', image: s.image, ratio: '16:9', sizes: '(min-width: 990px) 50vw, 100vw' %}
{% render 'anvil-media', video: s.video, video_url: s.video_url, image: s.poster, ratio: '16:9' %}
```

## snippets/anvil-meta.liquid
```
Document <title>, description, canonical link, Open Graph and Twitter cards
from Shopify's page_title / page_description / page_image objects, and the
favicon from theme settings. Rendered once in <head> by both layouts.
```

## snippets/anvil-money.liquid
```
A money amount formatted the way Theme settings > Currency asks: with the currency code when
"Show currency code" is on, the plain money format otherwise. Use it for every price the cart and product
forms print so one page never mixes two styles.

@param {number} amount - Amount in the currency's subunit (cents), as Shopify returns prices

@example
{% render 'anvil-money', amount: item.final_line_price %}
```

## snippets/anvil-pagination.liquid
```
Accessible pagination for a paginate block: previous/next, numbered links, the current page and gaps.
Renders nothing when there is a single page. Styles live in assets/anvil-card.css.

@param {object} paginate - The paginate object from a {% paginate %} block

@example
{% paginate collection.products by 24 %}
  ...
  {% render 'anvil-pagination', paginate: paginate %}
{% endpaginate %}
```

## snippets/anvil-price.liquid
```
Price for a product or a variant: current price, compare-at strike-through, savings badge and unit price.
Savings come only from compare_at_price (docs/HONEST.md). Honours settings.show_currency_code and settings.badge_sale_format.
Styles live in assets/anvil-card.css. Data hooks: data-anvil-price, -current, -compare, -badge, -unit.

@param {object} [product] - Product; uses selected_or_first_available_variant and shows "From" when prices vary
@param {object} [variant] - Variant; wins over product
@param {boolean} [show_compare] - Show the compare-at price (default true)
@param {boolean} [show_badge] - Show the savings badge inline (default true)
@param {boolean} [badge_only] - Render only the savings badge, for card corners
@param {string} [size] - sm | md | lg (default md)
@param {string} [class] - Extra classes

@example
{% render 'anvil-price', product: product, size: 'lg' %}
{% render 'anvil-price', variant: current_variant, show_badge: false %}
```

## snippets/anvil-product-card.liquid
```
Product card: media with a hover second image, sale / sold-out badges, vendor, title, rating stars from the
reviews.rating metafield, price and an optional quick-add form that posts the first available variant without
JavaScript (products with options link to the product instead). The title link covers the whole card.
A blank product renders a placeholder card. Sections load assets/anvil-card.css once (media, price and stars styles
are in anvil-base.css). The hover image is only displayed, and so only downloaded, on devices that can hover.

@param {object} [product] - Product; blank renders a placeholder card
@param {boolean} [show_vendor] - Show product.vendor
@param {boolean} [show_rating] - Show stars when product.metafields.reviews.rating is set
@param {boolean} [quick_add] - Show the add-to-cart form, or a "Choose options" link when options exist
@param {string} [image_ratio] - adapt | 1:1 | 4:5 | 3:4 | 16:9 (default settings.card_image_ratio, then 4:5)
@param {string} [sizes] - sizes attribute for the card image
@param {string} [loading] - lazy | eager (default lazy); pass eager for cards in the first visible row
@param {boolean} [priority] - First card on the page: eager plus fetchpriority high (it is usually the LCP image)
@param {string} [heading_tag] - h2 | h3 | h4 for the title (default h3); keep the page outline without gaps
@param {number} [placeholder_index] - 1 to 6, picks the placeholder illustration (default 1)
@param {string} [uid] - Suffix that keeps form ids unique when one product repeats on a page
@param {string} [class] - Extra classes

@example
{% for product in collection.products %}
  {% render 'anvil-product-card', product: product, show_rating: true, quick_add: true, sizes: '(min-width: 990px) 25vw, 50vw' %}
{% endfor %}
```

## snippets/anvil-section-attrs.liquid
```
Attributes for a section's root element: id (anchor), chassis classes, padding custom properties and data hooks.
Falls back to the chassis defaults when a section schema lacks a setting, so sections with the reduced chassis
(color_scheme, pad_top, pad_bottom, pad_mobile, show_on) and template sections without heading settings work.
Reveal is disabled for the first two sections (usually above the fold on phones, where the LCP image lives) and
whenever section.index is nil (editor, Section Rendering API).
data-anvil-section marks this root as the Section Rendering swap target: its children are replaced, the root stays.

@param {object} section - The section object
@param {string} type - Section type class, for example 'anvil-ticker'

@example
<div {% render 'anvil-section-attrs', section: section, type: 'anvil-faq' %}>
```

## snippets/anvil-section-head.liquid
```
Section heading and subheading from the chassis settings (heading, subheading, head_align, head_size, accent_style).
In the heading, <strong> becomes an accent span. Renders nothing when both texts are blank.

@param {object} section - The section object
@param {string} [tag] - Heading element, default 'h2'

@example
{% render 'anvil-section-head', section: section %}
{% render 'anvil-section-head', section: section, tag: 'h1' %}
```

## snippets/anvil-security.liquid
```
The three "security" toggles from Theme settings > Security. All default off.
- block_right_click: stops the context menu, copy and image dragging outside
  form fields (the setting text warns that this breaks accessibility tools).
- block_devtools_shortcuts: swallows F12 and the common inspector shortcuts.
  Cosmetic; the tools still open from the browser menu.
- country rule: compares localization.country.iso_code (the shopper's active
  Shopify Market country, not geo-IP) with the merchant's list and, on a
  match, covers the page with the merchant's message.
Nothing runs in the theme editor; the country rule shows a note instead so
the merchant can keep editing.
```

## snippets/anvil-social-links.liquid
```
Text pills for the social profiles filled in under Theme settings > Social links, in a list. Network names are
plain text (Anvil ships no platform logos). Renders nothing when no link is set.

@param {string} [class] - Extra classes on the <ul>
@param {string} [label] - Accessible name for the list (default "Follow us")

@example
{% render 'anvil-social-links', class: 'av-footer__socials' %}
```

## snippets/anvil-stars.liquid
```
Star rating: max stars (default 5) with partial fill, announced as one image.
This snippet only draws; the number must come from a rating metafield or carry a source link (docs/HONEST.md).
Styles live in assets/anvil-card.css.

@param {number} rating - Rating value, for example 4.5
@param {number} [max] - Scale maximum (default 5)
@param {number} [size] - Star size in px (default 18)
@param {string} [label] - Accessible label; default "4.5 out of 5 stars"
@param {string} [class] - Extra classes

@example
{% render 'anvil-stars', rating: product.metafields.reviews.rating.value.rating, max: product.metafields.reviews.rating.value.scale_max %}
```

## blocks/anvil-button.liquid
```
Theme block: one button or text link (snippets/anvil-button). Use inside @theme containers.

Settings (id · type · values · default):
- label · text · default "Shop now"
- url · url
- external · checkbox · default false
- style · select · primary | secondary | ghost | link · default "primary"
- size · select · sm | md | lg · default "md"
- full · checkbox · default false
- align · text_alignment · default "left"
- icon · select · none | arrow-right | chevron-right | shopping-cart | shopping-bag | check | gift | zap | play | download | external-link | mail | phone | message-circle · default "none"

@example
{"type": "anvil-button"}
```

## blocks/anvil-countdown.liquid
```
Theme block: countdown to one real end date and time; hidden when no date is set or after it ends (unless a message is chosen). No evergreen or per-visitor mode. Loads assets/anvil-countdown.js.

Settings (id · type · values · default):
- ends_at · text
- timezone · text
- label · text · default "Offer ends in"
- expired · select · hide | text · default "hide"
- expired_text · text · default "This offer has ended"
- unit_days · text · default "Days"
- unit_hours · text · default "Hours"
- unit_minutes · text · default "Minutes"
- unit_seconds · text · default "Seconds"
- size · select · sm | md | lg · default "md"
- align · text_alignment · default "left"

@example
{"type": "anvil-countdown"}
```

## blocks/anvil-divider.liquid
```
Theme block: a horizontal rule (<hr>) in the border, text or accent colour.

Settings (id · type · values · default):
- style · select · solid | dashed | dotted · default "solid"
- color · select · border | text | accent · default "border"
- thickness · range · 1–8 step 1px · default 1
- width · range · 10–100 step 10% · default 100
- align · text_alignment · default "center"
- space · range · 0–64 step 4px · default 16

@example
{"type": "anvil-divider"}
```

## blocks/anvil-group.liquid
```
Theme block: a box with its own colour scheme, padding and layout that holds other theme blocks (@theme, @app). Nestable.

Settings (id · type · values · default):
- color_scheme · color_scheme · default "scheme-1"
- layout · select · stack | row · default "stack"
- width · select · full | narrow | compact · default "full"
- align · text_alignment · default "left"
- gap · range · 0–64 step 4px · default 16
- pad · range · 0–64 step 4px · default 24
- border · checkbox · default false
- rounded · checkbox · default true
Accepts child blocks: @theme, @app

@example
{"type": "anvil-group"}
```

## blocks/anvil-heading.liquid
```
Theme block: a heading; <strong> words take the accent style. Pick the level that keeps the page outline (one H1 per page).

Settings (id · type · values · default):
- heading · inline_richtext · default "Example heading — replace me"
- tag · select · h1 | h2 | h3 | h4 | p · default "h2"
- size · select · xs | sm | md | lg | xl · default "md"
- align · text_alignment · default "left"
- accent_style · select · color | underline | highlight | gradient · default "color"

@example
{"type": "anvil-heading"}
```

## blocks/anvil-icon-text.liquid
```
Theme block: an icon (Lucide name or uploaded image) with a short line of text, optionally in a pill.

Settings (id · type · values · default):
- text · inline_richtext · default "Example: ships within 2 days — replace with a statement that is true for your store"
- icon · select · none | check | check-circle | truck | package | package-check | shield | shield-check | lock | badge-check | award | gift | tag | percent | heart | star | clock | timer | calendar | zap | leaf | recycle | sparkles | thumbs-up | refresh-cw | rotate-ccw | globe | map-pin | mail | phone | message-circle | credit-card | wallet | users | smartphone | info · default "check-circle"
- icon_image · image_picker
- size · select · sm | md | lg · default "md"
- align · text_alignment · default "left"
- pill · checkbox · default false

@example
{"type": "anvil-icon-text"}
```

## blocks/anvil-image.liquid
```
Theme block: an image in an aspect-ratio box (snippets/anvil-media), optional link and caption. A linked image always gets a name.

Settings (id · type · values · default):
- image · image_picker
- alt · text
- ratio · select · adapt | 1:1 | 4:5 | 3:4 | 16:9 | 21:9 · default "adapt"
- width · range · 10–100 step 5% · default 100
- align · text_alignment · default "center"
- link · url
- link_label · text
- caption · text

@example
{"type": "anvil-image"}
```

## blocks/anvil-product-atc.liquid
```
Theme block: add-to-cart for one product (the picked one, else closest.product). Single-variant products get a form that works without JavaScript; products with options link to the product page.

Settings (id · type · values · default):
- product · product
- show_price · checkbox · default true
- label · text · default "Add to cart"
- sold_out_label · text · default "Sold out"
- options_label · text · default "Choose options"
- style · select · primary | secondary · default "primary"
- size · select · sm | md | lg · default "md"
- full · checkbox · default true
- align · text_alignment · default "left"

@example
{"type": "anvil-product-atc"}
```

## blocks/anvil-review-stars.liquid
```
Theme block: "rated X on <platform>" badge. Every part of it (stars, number, wording, logo) renders only with a source link shoppers can follow.

Settings (id · type · values · default):
- logo · image_picker
- text · text · default "Example: rated by our customers on — replace with your real wording"
- rating · range · 0–5 step 0.1 · default 5
- source_url · url
- show_stars · checkbox · default true
- show_number · checkbox · default true
- align · text_alignment · default "left"

@example
{"type": "anvil-review-stars"}
```

## blocks/anvil-spacer.liquid
```
Theme block: vertical space, separate heights for phones and desktop.

Settings (id · type · values · default):
- height · range · 0–160 step 4px · default 32
- height_mobile · range · 0–160 step 4px · default 16

@example
{"type": "anvil-spacer"}
```

## blocks/anvil-stars.liquid
```
Theme block: rating stars from the product's reviews.rating metafield, or typed stars with a source link. Nothing renders without one of the two.

Settings (id · type · values · default):
- source · select · product | manual · default "product"
- product · product
- rating · range · 0–5 step 0.5 · default 5
- source_url · url
- show_number · checkbox · default true
- text · text
- size · select · sm | md | lg · default "md"
- align · text_alignment · default "left"

@example
{"type": "anvil-stars"}
```

## blocks/anvil-text.liquid
```
Theme block: rich text in the theme's type scale.

Settings (id · type · values · default):
- text · richtext · default "<p>Example paragraph — replace it with your own words. Only state things that are true for your store.</p>"
- size · select · sm | md | lg · default "md"
- align · text_alignment · default "left"
- width · select · full | medium | narrow · default "full"
- muted · checkbox · default false

@example
{"type": "anvil-text"}
```
