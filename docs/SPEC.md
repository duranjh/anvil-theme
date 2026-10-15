# Anvil — functional specification

_Written 2026-10-14 by the spec author. This document describes **what a merchant can configure and what a shopper sees**. It is the only product input the implementation receives (together with `ARCHITECTURE.md`, `DESIGN-*.md`, `CONVENTIONS.md` and `FORBIDDEN.md`). It was written from public feature lists and from observing storefront behaviour; it contains no third-party code, text or identifiers. All setting ids are Anvil's own. Shopify facts referenced here are from shopify.dev._

Conventions in this file: **M** = phones (≤ 749 px), **D** = desktop. "Merchant sets" lists editor settings in plain words; the implementer chooses ids following `CONVENTIONS.md` unless an id is given in `DESIGN-*.md`. Every section also carries the shared chassis settings (colour scheme, width, padding, heading/subheading, reveal, show-on, anchor) described in `DESIGN-sections.md`.

---

## 1. Theme settings (editor → Theme settings)

| Group | Merchant sets | Shopper sees |
|---|---|---|
| Logo & favicon | logo image, optional secondary (light) logo, logo width D/M, favicon | logo in header/footer/password page, favicon |
| Colours | colour schemes (background incl. gradient, text, muted text, border, accent, text on accent, button, button text, button border); body scheme; sale / sold-out / custom badge colours; success / error / star colours | every section picks one scheme; badges and ratings use the global colours |
| Typography | heading font + scale + weight + case + letter spacing; body font + scale; optional custom fonts (two uploaded `.woff2` URLs + family names) | consistent type scale; fonts swap in without layout shift |
| Layout | page width; side gutters M/D; vertical spacing between sections M/D; grid gap | consistent rhythm |
| Buttons | corner radius, border width, shadow, text case, hover style | all buttons |
| Inputs | radius, border width, shadow | forms, quantity boxes, search |
| Cards | style (flat/outlined/raised), radius, border, shadow, scheme, text alignment, image ratio; separate groups for collection cards and blog cards | product/collection/article cards |
| Media | radius, border, shadow | images and videos in sections |
| Content containers | radius, border, shadow | boxed text areas |
| Drawers & popups | radius, shadow, drawer width | cart drawer, menu drawer, popups |
| Badges | position on cards, radius, sale badge format (text / percent / amount), show sold-out badge | product cards |
| Colour swatches | shape (circle/square), size, border; fallback list of `Name:#hex` for stores without Shopify swatches | variant swatches |
| Variant pills | radius, border width, selected style | pill-style variant pickers |
| Variant dropdowns | style, border, radius, shadow | dropdown variant pickers |
| Quantity picker | style, radius | quantity steppers |
| Slider controls | arrow style/size, dot style/size, dot spacing | every carousel |
| Animations | master on/off; reveal-on-scroll style; hover lift; duration | sections fade/slide in once as they enter the viewport; nothing animates on the first section or when the shopper prefers reduced motion |
| Scrollbar | style (native/thin/hidden), colour | page scrollbar |
| Social links | Instagram, TikTok, Facebook, YouTube, X, Pinterest URLs | footer / header / announcement social blocks |
| Cart | cart type (drawer / page); open drawer after add-to-cart; show note; show discount field; show vendor; show savings line; empty-cart link | cart behaviour everywhere |
| Currency | show currency code after prices | prices |
| Search | predictive search on/off; show prices in results | header search |
| Security (all default **off**) | block right-click/copy; block dev-tools shortcuts; country rule (block list or allow list, country codes, message) | right-click blocked; a full-page message when the shopper's Shopify Market country is on the list. Setting text says these break accessibility tools and that the check is the Market, not geo-IP |

No "authentication", "licence" or "help" groups exist. Theme information (name Anvil, author, version, documentation and support URLs) is shown by Shopify.

---

## 2. Global chrome

### 2.1 Announcement bar (header group)
Merchant sets: one or more bars (blocks), each either **text** (rich text + optional link), **discount code** (code shown with a one-tap copy button; optional "apply" that attaches the code to the cart), or **social links**; rotate between bars with timing and arrows; show on all templates or only some; colour scheme; height (as padding and text size). Shopper sees a slim bar above or below the header; on M long text wraps onto a second line (amended 2026-10-15, DECISIONS 111: truncating or scrolling text fails WCAG reflow and hides the offer).

### 2.2 Header (header group)
Merchant sets: logo position (left/centre) and menu position (left/centre/below); main menu (Shopify navigation); **mega menu** mode for top-level items that lists child links in columns and can show featured product/collection images; sticky mode (always / on scroll-up / never); transparent-over-the-first-section option (on the homepage or on the templates the merchant lists); icons (search, account, cart) with cart count bubble; M menu drawer layout (list / large tiles) and whether to show social links and localisation selectors in it; search opens as a field in the header (D), in a modal, or as a link to the search page, with predictive results in the field and the modal. Shopper sees a one-row header on M with hamburger, logo, cart; the cart icon opens the drawer (or links to the cart page when the drawer is off).

### 2.3 Footer (footer group)
Merchant sets blocks: **link list** (menu with heading), **brand information** (logo/text/social icons), **text**, **image**, **email signup** (form with success/error message), **featured product**, **featured collection**; footer-wide: payment icons (Shopify's enabled methods, optional filter to a short list on one line), language/country selectors, copyright line, policy links, colour scheme. Shopper sees stacked columns on M, grid on D.

### 2.4 Cart drawer (static section)
Merchant sets: colour scheme, "keep open while editing" (editor only), heading, and blocks in body or footer position; width (D), open-on-add, vendor and the quantity stepper style are theme-wide settings (Theme settings > Drawers & popups, Cart, Quantity picker) that the drawer's schema points to (amended 2026-10-15, DECISIONS 116). With cart type Page the drawer is not rendered: its blocks stay drawer-only, and the cart page's summary has its own policies checkbox.

| Block | Merchant sets | Shopper sees / behaviour |
|---|---|---|
| Items | show image, vendor, variant title, per-line savings, quantity stepper style | lines with image, title, variant, price, strike-through original when discounted, stepper, remove; stock errors shown inline with the quantity rolled back |
| Subtotals | show total savings line, show compare-at savings as a separate line, show taxes/shipping note | subtotal; "You save $X" from Shopify's discount allocations |
| Checkout button | label, secure-checkout line, show payment icons, note "shipping & taxes at checkout" | button goes to Shopify checkout; disabled until the policy checkbox (if present) is ticked |
| Free-shipping progress bar | threshold amount (store currency) with optional per-market overrides; message before threshold (uses the remaining amount); message after; exclude gift lines from the total | bar fills as the cart total approaches the threshold; hides in a currency without a configured threshold. Setting text: enter the same minimum as your free-shipping rate; the bar itself grants nothing |
| Checkpoints bar | up to 3 milestones (amount, label, icon) | multi-step bar showing which rewards are reached |
| Countdown timer | real end date-time, timezone, label, behaviour when expired (hide / show text) | counts down to that moment; nothing when no date is set. **No evergreen or per-visitor reset mode exists** |
| Product upsells | manual products (up to 4) or Shopify recommendations; hide products already in cart; layout row/slider | small cards with add buttons; one-tap add for single-variant products, otherwise opens the product |
| Free gift at threshold | gift product + variant, threshold amount, label | the gift line is added once when the total crosses the threshold and removed when it drops below; quantity locked at 1; "FREE" only when Shopify prices it at zero (merchant pairs it with a Buy X Get Y automatic discount; the setting text says so) |
| Text with icon | icon or image, text, size, background pill | reassurance line |
| Image | image, link, width | banner inside the drawer |
| Icons with text | up to 4 icon + label items | trust row |
| Payment badges | Shopify's methods or custom images | icons |
| Discount field | placeholder, button label | enter a code; applied codes listed with remove buttons; invalid codes show Shopify's message |
| Cart note | label | textarea saved to the order note |
| Policies checkbox | rich text (with links), required | checkout disabled until ticked; recorded as a cart attribute |
| Custom Liquid | code | renders as written |

Behaviour: opens from the header icon and (if enabled) after add-to-cart; traps focus; closes with Esc/overlay/close button; every change re-renders the drawer from the server; works as a plain form when JavaScript is off (updates, removes, checkout).

### 2.5 Overlay widgets (overlay group)
**Scroll-to-top button** (appear after N px, position, icon, size). **Promo popup** (see §4). **Audio player** (merchant-hosted audio URL, title, start muted, position; never autoplays with sound; off by default).

---

## 3. Product page (`main-product`; the same blocks except Sticky add-to-cart and Gifts on quantity are available in the addable "Featured product" section, DECISIONS 115)

### 3.1 Section settings
Gallery position (left/right) and width; thumbnails D (left / bottom / hidden / stacked) and M (hidden / bottom); M pager style (dots under / dots overlay / numeric / hidden); peek of the next slide on M; zoom (none / hover / lightbox); show the selected variant's image first; hide media that belongs to other variants; video autoplay/loop/mute/controls; trust badge image under the buy box; mobile and desktop padding.

### 3.2 Blocks (37)
| Block | Merchant sets | Shopper sees |
|---|---|---|
| Title | size, alignment, uppercase, margins; optional custom headline instead of the product title (page keeps one H1) | product name |
| Price | size, show compare-at, show "save" badge (percent/amount), show unit price, show tax/shipping note | price, strike-through compare-at, savings |
| Description | collapsed by default with "read more", or full | product description |
| SKU | label | SKU of the selected variant |
| Inventory | low-stock threshold, texts | "Only N left" from tracked inventory, or "In stock"; nothing when inventory is untracked |
| Variant picker | style (dropdowns / pills & swatches / **offer cards**); hide sold-out values; size-chart option name; offer-card options: which option drives the cards, preselected card, savings display (amount / percent / both / none), card image source | **Offer cards:** one card per variant with label, caption, badge, benefit line, strike-through compare-at, computed "you save", variant image; the preselected card opens on load unless the URL names a variant; other options render as pills under the cards. Dropdowns and pills work as expected; swatches come from Shopify's option swatches or the fallback colour list |
| Offer card (child data, up to 6) | variant position, label, caption, badge, "badge backed by sales data" tick, benefit line, show image | the card described above; the badge shows only when the tick is on |
| Quantity selector | style (stepper / **tier cards**); max (min and step follow the variant's Shopify quantity rule, so B2B and volume rules hold; amended 2026-10-15, DECISIONS 114); tier cards (up to 5): quantity, label, badge, discount percent, name of the automatic discount | stepper, or cards that set the quantity and show the per-unit price "with <discount> applied at checkout" |
| Buy buttons | label, sold-out label, dynamic checkout buttons (default off), secure line | add-to-cart; adds the selected variant and opens the drawer |
| Sticky add-to-cart | show on M / D; show image / price / quantity; label | a bottom bar appears when the main button scrolls out of view |
| Text with icon | icon or image, text, size, background pill, colours, margins | reassurance line (e.g. shipping, returns) |
| Rating stars | size, show count, alignment | stars from the product's rating metafield; nothing when no rating exists |
| Review-platform stars | platform logo (image), text, source URL | "Rated X on <logo>" linked to the source; a number only when a source URL is set |
| Reviews | app block slot, or up to 3 merchant-entered quotes (text, name, image) with a disclosure line | review widget from the merchant's review app, or quoted testimonials labelled as merchant-entered |
| Review avatars | up to 5 avatar images, text | avatar stack + text; count only from the rating-count metafield |
| Clickable discount code | code, text, mode (copy / apply) | a pill showing the code; tap copies it or applies it to the cart |
| Sizing chart | source (page or image), link text | opens a dialog with the chart; also linked beside the configured option |
| Product upsells | manual products or recommendations, intent, limit, hide if in cart | small cards with add buttons |
| Bundle offer | up to 3 companion products, include current product, preselect all, discount note | checkbox list with prices; one button adds all selected items; the total is the sum of real prices and says "discount applied at checkout" when a note is set |
| Gifts on quantity | gift product + variant, minimum quantity, label | when the shopper has ≥ N of this product in the cart, the gift line is added (and removed below N) |
| Estimated shipping | processing days min/max, delivery days min/max, skip weekends, cut-off hour, timezone, text with from/to placeholders | "Order now, arrives between <date> and <date>" |
| Shipping checkpoints | same windows + three labels and icons | three-step timeline (ordered → shipped → delivered) with dates |
| Payment badges | Shopify's methods or custom images; filter | one row of payment icons |
| Urgency text | source (tracked inventory / plain text), threshold, text | "Only N left" or the text; no viewer counts exist |
| Emoji benefits | lines of text each starting with an emoji | checklist of benefits |
| Image | image, width, alignment | an image in the buy column |
| Video | Shopify video or URL, autoplay (always muted)/start without sound/loop | a video in the buy column |
| Divider | thickness, colour, margins | a rule |
| Link button | label, URL, style | a button |
| Scroll-to buttons | up to 3 labels + target anchors | buttons that scroll to sections on the page (every Anvil section has an anchor id) |
| Custom product field | label, type (text / textarea / checkbox / select / date), options, required, hidden-at-checkout | an input whose value is saved as a line-item property |
| Collapsible tab | heading, icon, content (rich text or page) | an accordion row |
| Popup | link text, page | opens the page's content in a dialog |
| Share | label | share button (native share sheet or copy link) |
| Complementary products | heading, count | products from Shopify's complementary recommendations |
| Custom Liquid | code | renders as written |
| App block | — | any app's product block |

### 3.3 Behaviour
Changing a variant updates price, savings, SKU, inventory, availability, media, the sticky bar and the URL (`?variant=`) without reloading; the add-to-cart posts to the cart, re-renders the drawer and opens it (if enabled); when JavaScript is off the form still adds to the cart. Sold-out variants are selectable but the button reads sold out. Stock errors from Shopify are shown next to the button.

---

## 4. Sections (editor → Add section)

### 4.1 Standard sections (Anvil's own implementations)
Image banner · Slideshow hero · Image with text · Multicolumn · Multirow · Rich text · Collapsible content (FAQ-style) · Video · Featured collection · Featured product · Collection list · Collage · Email signup banner / Newsletter · Contact form · Custom Liquid · Apps · Related products · Predictive search · Collection page (grid with filters, sorting, pagination) · Collection list page · Search page · Cart page · Page · Blog · Article · 404 · Password · Gift card · Customer account pages.

### 4.2 Conversion sections (35)
| Section | Merchant sets | Shopper sees (M → D) |
|---|---|---|
| Ticker (horizontal) | items: text / image / review (stars, quote, name) / icon + text / icon + heading + text (up to 24); speed, direction, gap, pause on hover, separator icon, size, uppercase | an endless strip scrolling sideways; static wrapping row under reduced motion |
| Ticker (vertical) | up to 12 lines; interval; height; fade or slide | one line at a time rotating in place |
| Icon bar | up to 6 items (icon or image, label, caption, link); columns M/D; icon size; layout | a trust row: 2 columns on M, one row on D |
| Icons with content | up to 12 items (icon/image, heading, text, button); columns; icon position; card style | feature cards |
| Comparison table | our column heading or logo, other column heading, up to 20 rows (label, our value as text / check / cross / stars, their value), highlight our column, icon style | a two-column "us vs them" table; on M the first column stays fixed while the rest scrolls |
| Before/after slider | two images, labels, start position, ratio, vertical option | a draggable divider between the two images |
| Testimonials | up to 24 cards (stars, quote, name, role, avatar, image); cards per view; autoplay; card style | a card carousel, one card with a peek on M, three on D |
| Review wall | summary rating, count text, platform logo (image), platform link; up to 50 reviews (stars, text, name, date, image); columns; show more | a header line with the summary and a grid of review cards |
| Social-proof cards | up to 24 post-style cards (avatar, name, handle, text, image, reaction counts); grid or slider | post-like cards; counts are whatever the merchant typed |
| Image/video slider | up to 20 slides (media, caption, link); ratio; per view; autoplay; dots/arrows | a media carousel |
| Stories strip | up to 20 stories (thumbnail, full media, label, link); ring colour | a row of round thumbnails; tapping opens a full-screen vertical viewer with tap-through |
| Logo list | up to 16 logos (image, link, alt); grid or marquee; greyscale; height | a "featured in" row |
| Content tabs | tabs (title, icon) each holding content blocks; style | a tab strip (scrollable on M) with panels |
| Custom columns | up to 4 columns per row (more wrap onto the next row, DECISIONS 117) each holding heading / text / stars / buttons / add-to-cart / image blocks; gap; alignment | flexible columns |
| Product features (hotspots) | image, up to 12 numbered spots (position, title, text) and matching bullets; image side | an annotated image with a bullet list (list under image on M) |
| Shoppable image | image, up to 12 spots each linked to a product | dots that open a small product card with price and add button |
| Results / stats | up to 6 statistics (value, suffix, label, icon); size; count-up | big numbers in a row |
| Pricing table | plans (name, price or linked product, badge, feature rows, button); highlighted plan; columns | plan cards |
| Promo popup | trigger (delay / scroll depth / exit on D), delay, show-once days, image, content blocks (newsletter form, text, button) | a dialog that opens once per visitor per period; never within 3 s of landing and never while editing |
| Track order | mode (account link / tracking-number form with a carrier URL template / merchant-pasted embed), help text | a tracking form or link |
| Parallax hero | image (and a phone image), height, overlay, content position, strength (image-only, amended 2026-10-15, DECISIONS 112) | a hero whose background moves slower than the page (off on touch and reduced motion) |
| Slideshow hero | slides (image + content blocks; image-only, DECISIONS 112); autoplay; height; transition; dots | a hero carousel |
| Section divider | style (line / wave / angle / icon), height, flip | a decorative separator |
| Sections group | nested boxed areas with their own scheme/padding | grouped content |
| Scroll-to-top | threshold, position, icon, size | a floating button |
| Guarantee icons | up to 6 cards (icon, title, text) | three guarantee cards (returns / shipping / secure) |
| Bundle deals | up to 6 product slots or a product list; savings text; badge; show compare-at | a pick-your-bundle box with one add button |
| Timeline | up to 10 steps (icon or number, title, text, image); orientation on D; connector style | a vertical list on M, horizontal steps on D |
| Scrolling images (marquee) | up to 20 images; rows; speed; direction; height; gap; rounded | endless image rows |
| Feature grid | up to 12 cards (image, heading, text, button); columns; ratio; card style | a card grid (1 → 2–4 columns) |
| Gallery | up to 30 images; layout (masonry / grid / slider); columns; ratio; lightbox | an image gallery with a lightbox |
| Product videos | up to 12 video cards (video or URL, linked product); layout; ratio (9:16 default); muted autoplay on M | vertical video cards with an add button |
| Simple FAQ | up to 30 questions and answers; open first; icon style; two columns on D; FAQ structured data toggle | an accordion |
| Theme colours preview | — (editor only) | all colour schemes with contrast ratios, visible only while editing |
| Music player | audio URL, title, start muted, position | a floating mini player with visible controls; never autoplays |

---

## 5. Templates shipped
- **Homepage**: slideshow hero → ticker → icon bar → featured collection → comparison table → stats → testimonials → image with text → FAQ → logo list → newsletter → contact.
- **Product (default)**: product section with title, price, variant picker, quantity, buy buttons, description, tabs, share; related products.
- **Product landing** (`product.landing`, assign per product): product → ticker → icon bar → stats → feature grid → comparison table → before/after → testimonials → product videos → timeline → scrolling images → gallery → image with text → multicolumn → guarantees → bundle → FAQ → review wall → related products.
- **Pages**: default; contact; FAQ (two FAQ sections with anchors; owner decision G keeps the page to the two FAQs, and the contact page carries "other ways to reach us", DECISIONS 26, 75, 113); track order.
- **Collection, collections list, search, cart, blog, article, 404, password, gift card, customer account pages.**
- Two theme-style presets: light ("Anvil") and dark ("Anvil Dark").

All placeholder text is visibly an example ("Example review — replace with a real one") so a store published without edits makes no false claim.

---

## 6. Non-goals
No licence or activation mechanism; no remote assets or phone-home requests; no bundled third-party logos; no evergreen timers, typed stock numbers, fake viewer counts or manual "you save" fields; no features that exist only to impersonate a platform.
