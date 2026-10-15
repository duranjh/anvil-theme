# Anvil

Anvil is a free, MIT-licensed Shopify Online Store 2.0 theme for conversion-focused, one-product and small-catalog stores: offer-ladder variant cards, sticky add-to-cart, a cart drawer with a free-shipping bar, gift-at-threshold and upsells, tickers, comparison tables, testimonials, FAQ, timelines and the rest of the sections dropshippers reach for.

It is written from scratch against Shopify's public developer documentation: an independent, free, conversion-focused theme. See `NOTICE` for licences and affiliation.

**Status:** in development. The chassis, the product page, the cart drawer and the full section library are built and pass the static gates (`npm run lint`, `npm run check`, `npm test`); live-store checks and the release zip are still to come. Install and store setup: `docs/INSTALL.md`; every section, where it can go and its card: `docs/SECTIONS.md`.

## What's inside

### Sections you can add (editor → Add section)
- **Hero slideshow** — slides of image plus heading, text and buttons; autoplay with a pause button, dots, arrows, slide or fade.
- **Parallax hero** — full-bleed image whose background moves slower than the page (off on touch and reduced motion).
- **Image banner** — image with overlaid content, focal points and a separate phone image.
- **Image with text** — media beside eyebrow, heading, text, checklist, stars, buttons or a one-click add to cart.
- **Rich text** — free-form heading, text, buttons and other theme blocks in a centred column.
- **Columns** — up to four columns of theme blocks (heading, text, stars, buttons, add to cart, image).
- **Group** — nested boxed areas, each with its own colour scheme and padding.
- **Content tabs** — a tab strip whose panels hold any theme blocks.
- **Multicolumn** — image or icon columns with heading, text and a link; grid or swipe row on phones.
- **Multirow** — alternating image and text rows.
- **Collage** — a big tile beside smaller image, product, collection or video tiles.
- **Collapsible content** — accordion rows with an optional image, text or page content.
- **FAQ** — accordion of questions and answers, two columns on desktop, optional FAQPage structured data (off by default).
- **Icon bar** — up to six trust items in a row.
- **Icons with content** — feature cards with an icon or image, heading, text and button.
- **Feature grid** — image cards with heading, text and button, one to four columns.
- **Guarantees** — up to six promise cards that can link to the store's own policies.
- **Stats** — big figures that count up once, with an optional source link per figure.
- **Timeline** — numbered or icon steps, vertical on phones and horizontal on desktop.
- **Ticker** — an endless strip of text, icon, image or review items with a pause button.
- **Ticker (vertical)** — one line at a time rotating in place.
- **Scrolling images** — one or two endless rows of images.
- **Logo list** — a "featured in" row as a grid or a scrolling strip.
- **Comparison table** — "us vs them" rows with text, ticks, crosses or sourced stars; sticky first column on phones.
- **Before/after slider** — two images with a draggable, keyboard-operable divider.
- **Testimonials** — a card carousel of quotes; stars only with a source link.
- **Review wall** — a grid or masonry wall of reviews with read more and show more; summary and stars only with a source link.
- **Social cards** — post-style cards with the counts the merchant copies from the original post.
- **Stories** — round thumbnails that open a full-screen vertical viewer.
- **Media slider** — a carousel of images and videos with captions.
- **Video** — a Shopify-hosted video or a YouTube/Vimeo link behind a click-to-load cover.
- **Product videos** — vertical video cards, each with its product and an add button.
- **Image gallery** — grid, masonry or slider with a lightbox.
- **Image hotspots** — numbered dots over an image with a matching bullet list.
- **Shoppable image** — dots that open a small product card with price and add button.
- **Featured collection** — product cards from a collection or a hand-picked list, grid or slider, optional quick add.
- **Featured product** — the full product form (every product block) anywhere on the store.
- **Collection list** — collection cards as a grid or slider.
- **Bundle deals** — pick N products and add them together; savings only from compare-at prices or an automatic discount.
- **Pricing table** — plan cards with included and not-included rows, linked products or typed prices.
- **Related products** — Shopify's related or complementary recommendations, loaded after the page.
- **Newsletter** — an email signup band, optionally over an image.
- **Contact form** — name, email, optional phone and message.
- **Track order** — a link to the customer's orders, a tracking-number form for the store's carrier, or a pasted embed.
- **Promo popup** — a dialog after a delay, a scroll depth or exit intent (desktop), shown once per visitor per period; never within 3 seconds of landing or on editor load.
- **Scroll to top** — a floating button that appears after the shopper scrolls.
- **Music player** — a floating mini player with visible controls; never autoplays.
- **Section divider** — a line, wave, angle, curve, peak, zigzag or icon between sections.
- **Welcome** — a simple heading, text and button block for a first homepage.
- **Theme colours preview** — every colour scheme with its WCAG contrast ratios, visible only in the editor.
- **Custom Liquid** and **Apps** — merchant code and app blocks in the theme's spacing.

### Header, footer and overlays
- **Announcement bar** — rotating messages, copyable or one-click-apply discount codes, page targeting.
- **Header** — logo, menu with mega-menu panels, sticky and transparent modes, mobile drawer, predictive search, cart count.
- **Footer** — menus, text, newsletter, image, product or collection blocks, payment icons, socials and localisation.
- **Overlay group** — Scroll to top (on), Promo popup and Music player (configured, off until enabled).

### Template sections
- Product, collection (with filters, sorting and paging), collection banner, collections list, search with predictive results, cart items and summary, page, blog, article, 404, password, gift card and the customer account pages.

### Product page blocks (main product and Featured product)
- **Variant picker** — pills, dropdowns or offer cards; variant images, price and stock lines follow the choice.
- **Offer cards** — one card per pack or option with its own image, label, caption and real savings.
- **Quantity selector** and **Quantity tiers** — a stepper, or tier cards tied to an automatic discount.
- **Buy buttons** — add to cart, optional express checkout and a secure-checkout line.
- **Sticky add to cart** — a bottom bar once the buy button scrolls away.
- **Title**, **Price** (compare-at savings, unit price), **Description**, **SKU** and **Share**.
- **Inventory** and **Urgency text** — stock lines only from Shopify's tracked inventory.
- **Rating stars**, **Review platform badge**, **Reviews** and **Review avatars** — numbers only from review metafields or with a source link.
- **Estimated shipping** and **Shipping checkpoints** — delivery dates from processing and transit days the merchant sets.
- **Custom product field** — text, long text, checkbox, choice or date, saved as a line item property.
- **Size chart**, **Popup** and **Collapsible tab** — page or rich-text content in a dialog or accordion.
- **Discount code** — copy or apply a real code.
- **Bundle offer**, **Product upsells**, **Complementary products** and **Gifts on quantity** — add-ons and gifts in one click.
- **Text with icon**, **Icons with text**, **Emoji benefits**, **Payment badges**, **Image**, **Video**, **Link button**, **Scroll-to buttons**, **Divider** and **Custom Liquid**.
- **Gallery** — swipeable media with variant filtering, a hover magnifier and a pinch-zoom lightbox.

### Cart
- **Cart drawer** (or cart page) with line items, subtotals and checkout, plus blocks for a free-shipping bar, a checkpoints bar, a countdown to a real end date, product upsells, a free gift at a spend threshold, text with icon, image, icons with text, payment badges, a discount field, a cart note, a policies checkbox and custom Liquid.

## Documents
- `docs/SPEC.md` — functional specification (what the merchant can set, what the shopper sees)
- `docs/ARCHITECTURE.md` — core architecture
- `docs/DESIGN-money-path.md` — product page and cart drawer design
- `docs/DESIGN-sections.md` — section library and build harness
- `docs/DECISIONS.md` — architecture decision records
- `docs/CLEANROOM.md` — how this theme was kept free of third-party code
- `docs/HONEST.md` — honest-marketing rules the theme enforces by default

## Licence
MIT. See `LICENSE` and `NOTICE`.
