# CHASSIS-API (extracted from LiquidDoc headers)

## snippets/anvil-above-fold.liquid
```
Where a section's media sits relative to the first screen (CONVENTIONS §11, DECISIONS 85). Prints one word:
`lcp` for the first section of a template (eager media, and the likely LCP image gets fetchpriority high),
`eager` for the second section or when Shopify gives no index (online store editor, Section Rendering API), and
`lazy` for everything else. Only template sections count: `section.index` restarts in every section group, so a
header, footer or overlay section is always `lazy`. `section.location` is `template` (or `content_for_index` on
a legacy homepage) for template sections and blank under the Section Rendering API.

@param {object} section - The section object

@example
{%- capture fold -%}{% render 'anvil-above-fold', section: section %}{%- endcapture -%}
{%- if fold != 'lazy' -%} … eager … {%- endif -%}
```

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

## snippets/anvil-cart-line.liquid
```
One cart line, shared by the cart drawer and the cart page: image, title, vendor, variant, line-item properties
(names that start with "_" stay hidden; a line carrying the _anvil_gift property shows a gift label instead),
selling plan, line-level discounts, the line price (struck through when a Shopify discount or, optionally, the
compare-at price is higher; "Free" only when Shopify prices the line at zero), a quantity stepper that posts
updates[<line key>] and a remove link. Quantities are keyed by line item key (Shopify's recommendation), so a
form rendered before another script changed the cart can never move a quantity onto a different line. Gift lines
get no stepper: a hidden input holds them at 1. Works as a plain form without JavaScript; <anvil-cart-form>
(assets/anvil-cart.js) enhances it. Render it inside a list (<ul>); styles live in assets/anvil-cart-drawer.css
(load it wherever lines render).

@param {object} item - The line item
@param {string} [form_id] - id of the cart form the inputs belong to (written as the form attribute)
@param {boolean} [show_image] - Show the line image (default true)
@param {boolean} [show_variant] - Show the variant title (default true)
@param {boolean} [show_vendor] - Show the vendor (default Theme settings > Cart > Show product vendors)
@param {boolean} [show_discounts] - List the line-level discounts (default true)
@param {boolean} [show_compare_at] - Strike through the compare-at price when it is higher (default false)
@param {boolean} [show_unit_price] - Show the price of one item when the quantity is above 1 (default false)
@param {string} [gift_label] - Label printed on gift lines (default "Gift")
@param {string} [size] - sm (drawer) | md (cart page), default md

@example
{% render 'anvil-cart-line', item: item, form_id: 'anvil-cart-form', size: 'md' %}
```

## snippets/anvil-cart-totals.liquid
```
Cart totals, shared by the cart drawer and the cart page: the subtotal, cart-level discounts, a savings line from
Shopify's discount allocations (cart.total_discount), an optional separate line for compare-at savings, the
estimated total and the taxes and shipping note. Every number comes from the cart; nothing is typed in
(docs/HONEST.md). Styles live in assets/anvil-cart-drawer.css (load it wherever totals render).

@param {boolean} [show_savings] - Show "You save" from Shopify discounts (default Theme settings > Cart > Show a savings line)
@param {boolean} [show_discounts] - List cart-level discounts between the subtotal and the total (default true)
@param {boolean} [show_compare_savings] - Show savings against compare-at prices on their own line (default false)
@param {boolean} [show_tax_note] - Show the taxes and shipping note (default true)

@example
{% render 'anvil-cart-totals', show_compare_savings: true %}
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

## snippets/anvil-editor-empty.liquid
```
The editor-only note for a section (or a part of one) with nothing to show (DECISIONS 87): a dashed, centred box
styled by .av-editor-empty in assets/anvil-base.css. Prints nothing outside the online store editor; on the
storefront a section with no body renders nothing at all.

@param {string} [text] - Note text, already translated (default: anvil.editor.empty_section)
@param {string} [class] - Extra classes

@example
{% render 'anvil-editor-empty' %}
{%- assign note = 'anvil.editor.block_empty' | t -%}{% render 'anvil-editor-empty', text: note %}
```

## snippets/anvil-gallery.liquid
```
Product media gallery for sections/main-product.liquid and sections/anvil-featured-product.liquid, driven by the
section's gallery_* settings (docs/product-blocks/_settings-gallery.json). One scroll-snap track of slides that works
without JavaScript (swipe on phones, a keyboard-scrollable region everywhere); assets/anvil-gallery.js
(<anvil-gallery>) adds the thumbnails, arrows, dots or counter, variant filtering, the hover magnifier and the
<dialog> lightbox. Slides carry data-anvil-media-id, data-anvil-variant-ids (the variants whose featured media the
slide is) and data-anvil-pos (media.position). Every media box keeps its aspect ratio from
media.preview_image.aspect_ratio (or the fixed shape setting), so nothing shifts while images load.
Loads assets/anvil-gallery.css and assets/anvil-gallery.js itself.

Behaviour added by <anvil-gallery section-id zoom variant-first hide-others>:
- An IntersectionObserver on the track sets the active dot or counter, the current thumbnail (aria-current) and a
  polite "Slide N of M" announcement. Thumbnails and arrows scroll the track with scrollTo (never the page; an
  absolute target is not stopped by scroll-snap-stop on the slides in between).
- anvil:variant:changed whose sectionId is this section: hide-others hides media featured by other variants (all
  media stay when nothing would be left), variant-first moves the variant's media to the front and puts the rest
  back in admin order, then the track scrolls to the variant's media. The same rules run here in Liquid for the
  first paint. Stacked desktop galleries never scroll the page on a variant change.
- zoom="hover": a magnifier following the mouse on fine pointers. Both zoom modes open the <dialog> lightbox from
  a button over each image: swipe or arrow keys to move, pinch, double-tap, ctrl+wheel, +/- keys or the zoom
  button to zoom, arrow keys to pan a zoomed image; closing returns focus to the image the shopper ended on.
- Videos with the controls setting off keep native controls without JavaScript; the module swaps them for one
  play/pause button. Autoplay uses anvil-core.js (muted, in view, motion allowed only).

@param {object} product - The product whose media is shown; blank or without media renders a placeholder
@param {object} section - The section; its gallery_* settings drive the layout, layout_gallery_width the image sizes,
  and its id filters anvil:variant:changed
@param {object} [current_variant] - Variant whose featured media leads and stays visible (default
  product.selected_or_first_available_variant)
@param {string} [sizes] - sizes attribute for the main images (default from layout_gallery_width and page_width)
@param {boolean} [lazy] - Lazy-load the first image too, for a gallery far down the page (default: only when
  section.index > 2)

@example
{% render 'anvil-gallery', product: product, section: section, current_variant: current_variant %}
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

## snippets/anvil-icons-text.liquid
```
Trust row: items made of an icon (anvil-icon, or an uploaded image instead), a short label and a line of text, in a
grid whose column count follows the width of the space it sits in (container query at 440 px), so one row fits a
phone, the buy column and the cart drawer. Labels are not headings (CONVENTIONS §3). Items with neither label nor
text are skipped; nothing renders when every item is empty. Shared by the product page's icons_text block and the
cart drawer's icons_text block (WAVE1-CONTRACTS §6). Loads assets/anvil-pb-trust.css.

Liquid cannot build an array of objects from literals, so the items arrive in one of two shapes:
- settings: a settings object holding the slot ids item_1_icon, item_1_image, item_1_heading, item_1_text, and so
  on up to item_4_*. Both icons_text blocks use these ids. A block passed as items is read the same way.
- items: an array of objects or blocks exposing icon, image, heading and text, directly or under .settings, for
  example section.blocks | where: 'type', 'trust_item' (at most 12 are drawn).

@param {object} [items] - Array of item objects or blocks, or a block whose settings use the slot ids
@param {object} [settings] - Settings object holding item_N_icon, item_N_image, item_N_heading, item_N_text (N = 1–4)
@param {string} [columns_mobile] - Columns in a narrow space: 1 to 4 (default 2)
@param {string} [columns] - Columns when the space is 440 px or wider: 1 to 4 (default 4)
@param {string} [layout] - stacked (icon above the words) | inline (icon beside them) (default stacked)
@param {string} [align] - left | center (default center when stacked, left when inline)
@param {string} [class] - Extra classes on the root

@example
{% render 'anvil-icons-text', settings: block.settings, columns_mobile: block.settings.columns_mobile, columns: block.settings.columns %}
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

## snippets/anvil-main-heading-tag.liquid
```
The heading level a hero or banner may use (DECISIONS 86). Prints `h1` only when the section asks for it, is the
first section of a template (or Shopify gives no index, as in the online store editor, so the chosen level shows
there) and that template's main section prints no H1 of its own; otherwise `h2`. Templates with their own H1:
product, collection, page (main-page shows the page title by default), article, blog, search, cart,
list-collections, 404, password, gift_card and every customers/* template. Group sections never print an H1.

@param {object} section - The section object
@param {string} [tag] - The section's heading_tag setting: h1 | h2 (default h2)

@example
{%- capture main_tag -%}{% render 'anvil-main-heading-tag', section: section, tag: s.heading_tag %}{%- endcapture -%}
```

## snippets/anvil-media.liquid
```
Responsive media in an aspect-ratio box: an image via image_tag, a Shopify video via video_tag,
or a click-to-load facade for YouTube/Vimeo (youtube-nocookie, nothing loads before the tap).
Falls back to a placeholder illustration. Its styles live in assets/anvil-base.css (every page).

@param {object} [image] - Image object; also used as the poster of an external video
@param {object} [video] - Shopify video or external_video media object
@param {object} [video_url] - video_url setting value (YouTube or Vimeo)
@param {string} [ratio] - adapt | 1:1 | 4:5 | 3:4 | 9:16 | 16:9 | 21:9 (default adapt)
@param {string} [widths] - Comma-separated srcset widths; the last one is the base width (default up to 2200)
@param {string} [sizes] - sizes attribute (default 100vw)
@param {string} [loading] - lazy | eager (default lazy)
@param {boolean} [priority] - LCP media: eager, fetchpriority high and preload (an image, or the cover of a
  YouTube/Vimeo facade)
@param {string} [alt] - Alt text; defaults to the media's own alt (a blank value falls back too)
@param {boolean} [decorative] - Image: write alt="" because a link or heading around it already names it
@param {string} [play_label] - YouTube/Vimeo facade: hidden name of the play link (default "Play video")
@param {string} [fit] - cover | contain (default cover)
@param {string} [placeholder] - placeholder_svg_tag name used when nothing is set (default image)
@param {string} [class] - Extra classes on the box
@param {boolean} [autoplay] - Shopify video: play muted and looping while in view, started by anvil-core.js only when
  the shopper allows motion; controls stay visible so it can always be paused (WCAG 2.2.2)
@param {string} [autoplay_scope] - all | mobile: with autoplay, where it applies (default all; mobile = below 750 px)
@param {boolean} [loop] - Shopify video: loop (default follows autoplay)
@param {boolean} [controls] - Shopify video: show controls (default true; autoplay keeps them on)
@param {boolean} [muted] - Shopify video without autoplay: start without sound (autoplay always starts muted)
Shopify videos load preload="metadata" when eager or priority, else preload="none" (only the poster loads).

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

## snippets/anvil-offer-cards.liquid
```
Offer cards for the variant picker (DESIGN-money-path §B, SPEC §3.2): one radio card per value of the option the
cards drive (the picker's offer_cards_option), inside a fieldset whose legend names the option and its selected
value. Card N comes from the Nth offer_card block of the section (its card_variant_position picks the option
value, 0 = block order); without offer_card blocks every value of the option gets a generated card. With blocks,
every value no block points at still gets a generated card after them, so each variant stays selectable (a
product with more values than cards, an ad link to another variant). Each card is rendered by
snippets/anvil-pb-offer-card.liquid.

With resolve: true nothing is drawn: the snippet prints only the id of the variant that the picker's
offer_cards_preselect points to (card N's value with the other options at their current values), or nothing for
0 or a card that does not exist. It is the same rule sections/main-product.liquid applies to current_variant, so
a caller can capture it:
  {% capture preselect_id %}{% render 'anvil-offer-cards', product: product, block: picker_block, section: section, resolve: true %}{% endcapture %}
Whether that variant is available is left to the caller.

@param {object} product - The product
@param {object} block - The variant_picker block
@param {object} section - The product section (offer_card blocks are read from it)
@param {boolean} [resolve] - Print only the preselected variant id
@param {object} [option] - product_option the cards drive (default: from offer_cards_option)
@param {string} [current] - Name of that option's selected value
@param {string} [name] - Radio group name
@param {string} [chart] - Size chart button markup, printed under the cards
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

## snippets/anvil-payment-badges.liquid
```
One row of payment icons. Source shop: the methods enabled in the store's admin (shop.enabled_payment_types) drawn
by Shopify's payment_type_svg_tag, optionally narrowed to the handles in filter and shown in the order typed.
Source custom: images the merchant uploaded, each with alt text. Anvil ships no payment or platform logos.
Renders nothing when there is no icon to show. Shared by the product page's payment_badges block and the cart
drawer (WAVE1-CONTRACTS §6). Loads assets/anvil-pb-trust.css.
payment_type_svg_tag writes fixed ids (<title id="pi-visa"> with aria-labelledby="pi-visa"), so two rows on one
page would repeat ARIA ids; with uid set, both the id and its reference become pi-<uid>-<type>.

Liquid cannot build an array of image objects from literals, so custom images arrive in one of two shapes:
- images: an array of image objects (for example section.blocks | map: 'settings' | map: 'image'); alt from each
  image's own alt text
- settings: a settings object holding badge_image_1 to badge_image_6 and badge_alt_1 to badge_alt_6 (the product
  block's ids; a drawer block that uses the same ids can pass its settings too)

@param {string} [source] - shop | custom (default shop)
@param {string} [filter] - Comma-separated payment type handles to keep, in display order (shop source)
@param {object} [images] - Array of image objects (custom source)
@param {object} [settings] - Settings object holding badge_image_N and badge_alt_N, N = 1–6 (custom source)
@param {string} [size] - sm | md | lg (default md)
@param {string} [align] - left | center | right (default left)
@param {string} [label] - Accessible name of the list (default "Payment methods")
@param {string} [class] - Extra classes on the list
@param {string} [uid] - Makes the icons' title ids unique on the page (for example the block id)

@example
{% render 'anvil-payment-badges', source: 'shop', size: 'sm', align: 'center' %}
{% render 'anvil-payment-badges', source: 'custom', settings: block.settings %}
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

## snippets/anvil-product-block.liquid
```
Product block dispatcher for sections/main-product.liquid and sections/anvil-featured-product.liquid.
Liquid's render tag takes only a literal name, so every block type has its own `when` and renders
snippets/anvil-pb-<type with hyphens>.liquid with the same five parameters (WAVE1-CONTRACTS §1).
Each block snippet prints {{ block.shopify_attributes }} on its own root element; this snippet adds no wrapper,
so a block that has nothing to show leaves no empty box and no gap in the buy column.

Not rendered here:
- offer_card and quantity_tier are data blocks: the variant picker and the quantity snippets read them from
  section.blocks and render them in place.
- sticky_atc is rendered once by main-product after the grid (snippets/anvil-pb-sticky-atc.liquid).

The product form and block order: the sections render one form per section, id form_id
('anvil-pf-' + section.id), at the position of the first buy_buttons block in the merchant's order. It holds the
hidden `id` input (data-anvil-variant-input), this snippet's buy_buttons output and, when that block's
show_dynamic_checkout setting is on, {{ form | payment_button }} (the form object exists only inside the
section's {% form %} tag, so a rendered snippet cannot print it). Every other control that posts (quantity,
custom fields, bundle rows, the sticky bar's button) sits outside the form with form="{{ form_id }}", so the
blocks above and below the buttons keep the order set in the editor and still post with JavaScript off. A
section without a buy_buttons block still renders the form, empty and hidden, at the end of the buy column, so
form="…" controls always find it. The buy_buttons snippet should give its submit button form="{{ form_id }}"
as well, which is harmless inside the form and keeps a second buy_buttons block working.

App blocks: the sections render '@app' blocks themselves with {% render block %} in the section file (an app
block then reads the section and the template's product from where it is rendered); the '@app' branch below
exists for any other caller.

@param {object} product - The product the section shows
@param {object} block - The section block to render
@param {object} section - The section, for reading sibling blocks and section settings
@param {string} form_id - Id of the section's product form; controls outside it post with form="{{ form_id }}"
@param {object} current_variant - The variant the page opened on (WAVE1-CONTRACTS §3)

@example
{% render 'anvil-product-block', product: product, block: block, section: section, form_id: form_id, current_variant: current_variant %}
```

## snippets/anvil-product-card-mini.liquid
```
Compact product card for upsell lists (product block "Product upsells", the drawer's upsells block, the
recommendations section anvil-upsell-row): thumbnail, title, price and one action.
The card is <anvil-mini-card class="av-enhance"> from assets/anvil-commerce.js. With that module, a single-variant
product shows an Add button that adds one unit through cartAdd (drawer and bubble re-render, the drawer opens when
the theme setting says so). Without it (or for products with options, sold-out products and button: 'view') the
action is a link to the product. The card holds no <form>, so it is safe inside the drawer's cart form.
Hooks: data-anvil-product-id (upsell lists hide products already in the cart), [data-anvil-status] (live message),
data-anvil-focus-key="mini-<product id>" on the Add button (the drawer keeps focus there across a re-render).
Styles live in assets/anvil-pb-commerce.css; every list that shows cards loads it. A blank product renders an
example card.

@param {object} [product] - Product; blank renders an example card
@param {boolean} [show_price] - Show the price (default true)
@param {string} [button] - add | view (default add)
@param {string} [source_tag] - Where the card is shown, for example 'upsell' or 'drawer'; written as
  data-anvil-source for scripts and analytics

@example
{% render 'anvil-product-card-mini', product: product, button: 'add', source_tag: 'upsell' %}
```

## snippets/anvil-product-card.liquid
```
Product card: media with a hover second image, sale / sold-out badges, vendor, title, rating stars from the
reviews.rating metafield, price and an optional quick-add form that posts the first available variant without
JavaScript (products with options link to the product instead); the form loads assets/anvil-product.js itself
(one fetch per page, module URLs dedupe), whose <anvil-product-form form-id> adds through the cart drawer.
The title link covers the whole card.
A blank product renders a placeholder card. Sections load assets/anvil-card.css once (media, price and stars styles
are in anvil-base.css). The hover image is only displayed, and so only downloaded, on devices that can hover.

@param {object} [product] - Product; blank renders a placeholder card
@param {boolean} [show_vendor] - Show product.vendor
@param {boolean} [show_rating] - Show stars when product.metafields.reviews.rating is set
@param {boolean} [quick_add] - Show the add-to-cart form, or a "Choose options" link when options exist
@param {string} [image_ratio] - adapt | 1:1 | 4:5 | 3:4 | 16:9 (default settings.card_image_ratio, then 4:5)
@param {string} [sizes] - sizes attribute for the card image
@param {string} [widths] - srcset widths, the last one the largest file (default '300, 450, 600'; a card shown
  wider than about 600 px, such as a collage's big tile, may pass up to 1100)
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

## snippets/anvil-product-row.liquid
```
A row of product cards as a grid or an <anvil-slider> (DECISIONS 93), shared by Featured collection and Related
products. Columns follow the shared grid rule (phones 1-2, tablets up to 3 with 4 becoming 2, desktop the setting);
the slider shows the same counts in view with the theme's standard peek and decides dots, arrows and peek per width
at first paint (snippets/anvil-slider-attrs). With dots off the arrows stay on, so mouse users always have a way
past the first view (the track hides its scrollbar). Card image sizes come from the column counts, capped by the
page or narrow width. Load assets/anvil-card.css (and anvil-slider.css for a slider) before rendering; the slider
module is loaded here. Styles: .av-product-row* in assets/anvil-card.css.

@param {product[]} [products] - Products to show; blank renders `placeholders` example cards
@param {number} [limit] - Most cards shown (default 8)
@param {number} [placeholders] - Example cards when `products` is blank (default 0)
@param {string} [layout] - grid | slider (default grid)
@param {number} [cols_desktop] - Columns from 990 px (default 4)
@param {number} [cols_mobile] - Columns below 750 px (default 2)
@param {boolean} [show_arrows] - Slider arrows (tablets and desktop, beside the track)
@param {boolean} [show_dots] - Slider dots
@param {string} [label] - Name of the slider region (escaped here)
@param {string} [fold] - lcp | eager | lazy from snippets/anvil-above-fold (default lazy)
@param {string} [width] - The section's width setting: page | narrow | full (caps the image sizes)
@param {boolean} [show_vendor] - Card vendor
@param {boolean} [show_rating] - Card stars from the rating metafield
@param {boolean} [quick_add] - Card quick add
@param {string} [image_ratio] - Card image shape; blank or theme follows Theme settings > Product cards
@param {boolean} [hover_image] - Show the card's second image on hover (default true)
@param {string} [uid] - Keeps quick-add form ids unique (pass section.id)

@example
{% render 'anvil-product-row', products: collection.products, limit: 8, layout: s.layout, cols_desktop: 4, cols_mobile: 2, fold: fold, width: s.width, uid: section.id %}
```

## snippets/anvil-quick-buy.liquid
```
The quick-buy control under a product in Product videos and Shoppable image (DECISIONS 96): one product form that
works without JavaScript and adds through the cart drawer once assets/anvil-product.js enhances it.
- A single-variant product gets a hidden variant id and an add button.
- A product with options gets a variant menu (every variant with its price through anvil-money; sold-out ones
  cannot be chosen) and an add button, or, with variant_mode 'link', a "Choose options" link to its page.
- A subscription-only product always links to its page; a sold-out product shows a disabled "Sold out" button.
The product title follows every button for screen readers, so several "Add to cart" buttons read apart. The
section loads assets/anvil-product.js once when any card renders a form.

@param {object} product - The product
@param {string} [variant_mode] - select | link (default select)
@param {string} [label] - Add button text, raw (default: the translated "Add to cart")
@param {string} [style] - Button style: primary | secondary (default primary)
@param {string} form_id - Unique form id
@param {string} [class] - Extra classes on the wrapper

@example
{% render 'anvil-quick-buy', product: p, variant_mode: s.variant_mode, label: s.add_label, style: s.button_style, form_id: 'av-pv-' | append: block.id %}
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
In the heading, <strong> becomes an accent span. Renders nothing when both texts are blank, unless `fallback` is
given: then a blank heading becomes a visually hidden heading with that text, so card or row titles below it
(h3) never skip a level (CONVENTIONS §3, DECISIONS 84). Sections pass their own translated word, or the generic
`anvil.a11y.highlights`.

@param {object} section - The section object
@param {string} [tag] - Heading element, default 'h2'
@param {string} [fallback] - Already translated text for a hidden heading when the heading is blank

@example
{% render 'anvil-section-head', section: section %}
{% render 'anvil-section-head', section: section, tag: 'h1' %}
{%- assign fallback = 'anvil.a11y.highlights' | t -%}
{% render 'anvil-section-head', section: section, fallback: fallback %}
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
the merchant can keep editing. The overlay loads assets/anvil-security.css (and anvil-prose.css for the
message) only when it renders, so stores without the rule never download them.
```

## snippets/anvil-ship-dates.liquid
```
Estimated ship and delivery dates, computed here from 'now' in the store's time zone (Settings > General) and
recomputed by assets/anvil-ship-dates.js (<anvil-ship-dates>), because a cached page can carry an earlier day's
dates. Renders nothing when processing_max + delivery_max is 0.
Day 0 is today, or tomorrow for an order at or after cutoff_hour. With skip_weekends, Saturdays and Sundays are not
counted and an order placed on a weekend starts counting on Monday. Ship = day 0 + processing days; delivery =
day 0 + processing + transit days. Dates are anchored at local noon, so daylight-saving days never shift a date.
Date text uses the locale formats date_formats.anvil_ship_<format>; styles are in this file's stylesheet.

@param {number} processing_min - Processing days before the parcel leaves, minimum
@param {number} processing_max - Processing days, maximum (raised to processing_min when lower)
@param {number} delivery_min - Carrier transit days, minimum
@param {number} delivery_max - Carrier transit days, maximum (raised to delivery_min when lower)
@param {boolean} [skip_weekends] - Count Monday to Friday only
@param {number} [cutoff_hour] - Store-time hour (1-23) from which an order counts from the next day; 0 = none
@param {string} [timezone_note] - Short label printed after the dates, for example "ET"
@param {string} [format] - short | long | weekday | weekday_long (default weekday)
@param {string} [mode] - range (one sentence) | steps (ordered, shipped, delivered timeline); default range
@param {string} [labels] - range: the sentence, with {{ from }} and {{ to }} (or [from] / [to]) where the dates
  go; blank = anvil.product.arrives_between. steps: three labels separated by "|"; a blank part falls back to
  Ordered / Shipped / Delivered
@param {string} [icons] - range: one icon name; steps: three names separated by "|"; blank or "none" = no icon

@example
{% render 'anvil-ship-dates', processing_min: 1, processing_max: 2, delivery_min: 3, delivery_max: 5, skip_weekends: true, mode: 'steps' %}
```

## snippets/anvil-slider-attrs.liquid
```
Attributes for an <anvil-slider> root (DECISIONS 89): class, the component attributes and the inline layout, so the
row is laid out at first paint and nothing moves when assets/anvil-slider.js runs (CONVENTIONS §6). From the slide
count and the slides in view per width it adds av-slider--fits-m|t|d, which hide the dots row and arrows and drop
the peek where every slide fits. Card carousels pass `arrows: 'desktop'` and `gutter: true` (arrows beside the
track from 750 px); media sliders pass `arrows: 'all'`. No role is written: the element adds region and carousel
roles only while its track scrolls, and keeps the aria-label as the name. The section still renders the track and,
when dots are on, the empty `<div class="av-slider__dots" data-slider-dots></div>` after it.

@param {number} count - Number of slides
@param {number} [per_view] - Slides in view on phones (default 1)
@param {number} [per_view_tablet] - Slides in view at 750–989 px (default per_view)
@param {number} [per_view_desktop] - Slides in view from 990 px (default per_view_tablet)
@param {string} [peek] - 'auto' for the theme's standard peek (phones 40 px, or 24 px with 2+ slides in view;
  tablets 32 px; desktop none), or pixels of the next slide shown on phones while the row scrolls (default 0)
@param {number} [peek_tablet] - Peek at 750–989 px when peek is a number (default peek)
@param {number} [peek_desktop] - Peek from 990 px when peek is a number (default 0)
@param {string} [arrows] - all | desktop | none (default none)
@param {boolean} [gutter] - Arrows sit beside the track while it scrolls (from 750 px)
@param {boolean} [dots] - Dots row
@param {number} [autoplay] - Seconds per slide, 0 = off (default 0)
@param {boolean} [loop] - Wrap around at the ends
@param {string} [label] - Accessible name (escaped here with escape_once)
@param {string} [class] - Classes for the root
@param {string} [style] - Extra inline declarations

@example
<anvil-slider {% render 'anvil-slider-attrs', count: n, per_view: 2, per_view_desktop: 4, peek: 'auto', arrows: 'desktop', gutter: true, dots: true, label: heading %}>
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

## snippets/anvil-surface.liquid
```
Card surface classes for a section's `card_style` setting (DECISIONS 83). Prints nothing for a card without a box
("No box", or "Same as theme cards" while Theme settings > Cards is flat), else `av-surface av-surface--<style>`.
The surface rules (border, one tint, shadow with a medium floor, theme cards copied exactly) live in
assets/anvil-base.css; sections add their own padding. Capture the output: a blank result means "no box".

@param {string} [style] - theme | flat | outlined | tinted | raised (default theme)

@example
{%- capture surface -%}{% render 'anvil-surface', style: s.card_style %}{%- endcapture -%}
<li class="av-foo__card {{ surface }}">…</li>
```

## snippets/anvil-text-icon.liquid
```
One reassurance line: an icon from anvil-icon, or an uploaded image instead, and a short text, optionally on a
background pill. Shared by the product page's text_icon block and the cart drawer's text_icon block
(WAVE1-CONTRACTS §6). The icon is decorative; the text carries the meaning. Renders nothing when the text is blank.
Loads assets/anvil-pb-trust.css (repeated links to one URL are fetched once).

@param {string} text - The line; inline rich text (bold, italic, links) is printed as given
@param {string} [icon] - anvil-icon name; ignored when image is set or when 'none'
@param {object} [image] - Image object drawn instead of the icon (decorative, alt="")
@param {string} [size] - sm | md (default md)
@param {boolean} [pill] - Draw a background pill behind the line
@param {string} [tone] - Pill look: subtle | accent | outline (default subtle)
@param {string} [shape] - Pill corners: pill | soft | square (default pill)
@param {string} [class] - Extra classes on the root

@example
{% render 'anvil-text-icon', icon: 'truck', text: block.settings.text, size: 'sm', pill: true %}
```

## snippets/anvil-typed-date.liquid
```
A date the merchant typed as YYYY-MM-DD, as a <time> element (DECISIONS 88). The value is read at noon and ignored
unless it reads back as the same date. The element is built from the typed date rather than with time_tag, which
writes its datetime attribute in UTC (shopify.dev time_tag) and so could move a date by a day in a UTC+13/+14
store. The text uses the theme date format (`date_formats.anvil_date`). Prints nothing for a blank or invalid date.

@param {string} date - The typed date
@param {string} [class] - Class on the <time> element

@example
{%- capture date_html -%}{% render 'anvil-typed-date', date: block.settings.date %}{%- endcapture -%}
```

## blocks/_anvil-columns-column.liquid
```
Private theme block for sections/anvil-columns.liquid: one column that stacks theme blocks (@theme) and app blocks
with the section's block spacing. Column count, card style and vertical alignment come from the section; the column
can take its own colour scheme, which always draws it as a padded box. With the section's card style "Same as theme
cards" and a boxed theme card style, the column uses Theme settings > Cards > colour scheme unless it has its own.
An empty column shows a note in the editor; on the storefront it keeps a blank slot from tablets up (no box) and is
dropped on phones. Styles live in the section's stylesheet.

Settings (id · type · values · default):
- own_scheme · checkbox · default false
- color_scheme · color_scheme · default "scheme-2" (shown when own_scheme is on)
Accepts child blocks: @theme, @app

@example
{"type": "_anvil-columns-column"}
```

## blocks/_anvil-hero-slideshow-slide.liquid
```
Private theme block for sections/anvil-hero-slideshow.liquid: one slide of the hero carousel. The block root is the
slider's [data-slider-slide] element (tag: null); inside it a frame holds the slide's image (a separate phone image
is optional, served with <picture> below 750 px), an overlay, an optional link over the whole slide and the slide's
theme blocks (@theme, @app) in a content box placed by the position settings. The section sets the slide height
and the transition; this file reads section.settings.width for the image sizes. The first slide's image loads eagerly
with high fetch priority in the first two sections (it is usually the LCP image) and is preloaded in the first
section when it has no separate phone image; every other slide loads lazily. The slide link comes after the content
in the DOM (z-index puts it underneath), and the editor shows a note while a linked slide's link has no name. Styles
live in the section's stylesheet.

Settings (id · type · values · default):
- image · image_picker
- image_mobile · image_picker
- overlay · range · 0–90 step 5% · default 30
- overlay_color · select · shadow | scheme · default "shadow"
- position_desktop · select · top-left … bottom-right (9) · default "middle-center"
- position_mobile · select · top | middle | bottom · default "middle"
- content_width · range · 320–800 step 20px · default 560
- box · checkbox · default false
- own_scheme · checkbox · default false
- color_scheme · color_scheme · default "scheme-1" (shown when own_scheme is on)
- link · url
- link_name · text
Accepts child blocks: @theme, @app

@example
{"type": "_anvil-hero-slideshow-slide"}
```

## blocks/_anvil-popup-newsletter.liquid
```
Private theme block for sections/anvil-popup.liquid: the popup's email signup form. The section renders it once as
a static block (content_for 'block', id "newsletter"), so merchants can edit or hide it but not remove or move it.
A Shopify customer form (id anvil-popup-<section id>-form) posts contact[email] and contact[tags] = "newsletter"
plus the optional tag below; each signup creates a customer with email marketing accepted. After a post the
form shows a success message (role="status", the field and button are hidden) or Shopify's errors (role="alert",
the field keeps the address); both messages carry data-anvil-result and tabindex="-1", which
assets/anvil-popup.js uses to reopen the popup on the shopper's own result and move focus to the message.
Without JavaScript the popup never opens, so this form only ever runs inside the open dialog.

Settings (id · type · values · default):
- layout · select · stacked | inline · default "stacked"
- show_label · checkbox · default false
- placeholder · text · default "Your email address"
- button_label · text · default "Subscribe"
- button_style · select · primary | secondary · default "primary"
- success_text · text · default "Thanks for signing up."
- small_print · richtext · default "<p>Example small print — …</p>"
- tag · text · default "popup"
- align · text_alignment · default "center" (small print and success message)

@example
{"type": "_anvil-popup-newsletter", "static": true, "id": "newsletter"}
```

## blocks/_anvil-pricing-feature.liquid
```
Private theme block: one feature row inside a plan of sections/anvil-pricing.liquid (blocks/_anvil-pricing-plan).
A short line with a marker: included (check mark), not included (cross, muted text) or no marker. The marker is
decorative; a visually hidden "Included:" / "Not included:" before the words carries the meaning, so the row
never depends on the icon or its colour (WCAG 1.3.1, 1.4.1). Renders nothing on the storefront when the text is
blank; the editor shows a note so the empty row can still be selected.

Settings (id · type · values · default):
- text · inline_richtext · default "Example feature — replace with something this plan includes"
- state · select · included | excluded | plain · default "included"

@example
{"type": "_anvil-pricing-feature"}
```

## blocks/_anvil-pricing-plan.liquid
```
Private theme block: one plan card of sections/anvil-pricing.liquid (the only place it can be added). Name, short
description, price, optional badge, a column of child blocks (feature rows from _anvil-pricing-feature, any theme
block, app blocks) and one button pinned to the bottom of the card.
Price: a linked product's price from Shopify (anvil-price: "From" when variants differ, compare-at strike-through
and saving only from compare_at_price); the typed price only when no product is linked. The linked product is
passed to the child blocks as closest.product, so an Add to cart or Stars block inside the plan uses it.
Highlight: the plan finds its position in section.blocks and compares it with the section's highlight setting;
the highlighted plan gets an accent border and the section's highlight colour scheme.
Badge: shown only when "Badge is backed by sales data" is ticked (docs/HONEST.md); the editor says when it is hidden.
Button: auto = the linked product's page, else the button link; cart = a product form that adds the linked
single-variant product without JavaScript (<anvil-product-form> from assets/anvil-product.js enhances it), while a
product with options or one that needs a selling plan opens its page; link = always the button link. Nothing is
drawn when there is no destination or no label.
Editor: when a product is linked but the price note still says "(example price)", an editor-only note asks the
merchant to update it, since the price shown is then the real Shopify price.

Settings (id · type · values · default):
- title · text · default "Example: plan name"
- summary · text · default "Example: say in one line who this plan is for"
- product · product
- price · text · default "$19"
- price_note · text · no default (the section preset types the example notes)
- show_compare · checkbox · default true
- badge · text
- badge_backed_by_sales · checkbox · default false
- button_label · text · default "Choose this plan"
- button_action · select · auto | cart | link · default "auto"
- button_url · url
Accepts child blocks: _anvil-pricing-feature, @theme, @app

@example
{"type": "_anvil-pricing-plan"}
```

## blocks/_anvil-tabs-tab.liquid
```
Private theme block for sections/anvil-tabs.liquid: one tab. The section draws the tab button in its strip from
this block's title and icon; this file draws the matching panel (role="tabpanel") holding theme blocks (@theme,
@app). Ids follow the section's rule: panel id = the link id setting (handleized) or av-tabs-<section id>-<block id>,
labelled by the button av-tabs-tab-<section id>-<block id>. The first tab with a title starts open (the first tab in
the editor); the other panels render hidden and <anvil-tabs> (assets/anvil-tabs.js) switches them. Without
JavaScript every panel shows, each under its own h3 title (the section always has an h2, visually hidden when
its heading is blank). A tab without a title renders nothing on the storefront, since its button would have no
name. The panel is the block's only root element and the only one carrying block.shopify_attributes.

Settings (id · type · values · default):
- title · text · default "Example tab"
- icon · select · none | info | check-circle | … · default "none"
- icon_image · image_picker
- anchor · text
- layout · select · stack | split · default "stack"
- valign · select · center | top · default "center"
- width · select · full | narrow · default "full"
- align · text_alignment · default "left" (app blocks and the no-JS title only)
- gap · range · 0–64 step 4px · default 24
Accepts child blocks: @theme, @app

@example
{"type": "_anvil-tabs-tab"}
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
- heading · inline_richtext · default "Example: your heading"
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
- image_ratio · select · adapt | 1:1 | 4:5 | 3:4 | 16:9 | 21:9 · default "adapt"
- width · range · 10–100 step 5% · default 100
- align · text_alignment · default "center"
- link · url
- link_name · text
- caption · text

@example
{"type": "anvil-image"}
```

## blocks/anvil-product-atc.liquid
```
Theme block: add-to-cart for one product (the picked one, else closest.product). Single-variant products get a form that works without JavaScript and loads assets/anvil-product.js (<anvil-product-form form-id> adds through the cart drawer); products with options link to the product page.

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
