# Anvil

Anvil is a free Shopify theme for stores that sell one product or a small catalog. It has the product page and cart features those stores use: offer cards for packs, quantity tiers, a sticky add-to-cart bar, a cart drawer with a free-shipping bar, gifts and upsells, and sections such as tickers, comparison tables, reviews, FAQ and timelines. It is written from scratch against Shopify's public developer documentation and released under the MIT licence. Anvil is not affiliated with Shopify Inc., Shrine Solutions Ltd, or the "Anvil – Product Options" app.

**Version:** 1.0.0-rc.1, a release candidate (Shopify shows it as 1.0.0). What has been checked on a live store and what is still open: `docs/STATUS.md`, "Release candidate".

## Install in 5 minutes

You need a Shopify plan that can add themes. On the Starter plan only the Spotlight theme is available. Basic, Grow and Advanced plans hold up to 20 themes (Plus up to 100); if you are at the limit, delete a theme you no longer use first.

1. **Download the zip.** On the [Releases page](https://github.com/duranjh/anvil-theme/releases), download `Anvil-<version>.zip`. Keep it zipped: if your browser unpacked it into a folder, use the `.zip` file, not the folder.
2. **Open your themes.** In your Shopify admin, go to **Online Store**.
3. **Upload it.** In the **Draft themes** section, click **Import theme** > **Upload zip file**. Click **Choose File**, pick the zip, then click **Upload**. Anvil arrives as a draft theme. Your live store does not change.
4. **Customize it.** Next to Anvil, click **Edit theme**. Add your logo, colours and menus. Replace or delete every text that starts with "Example:" and every example image. The full first pass is in [`docs/INSTALL.md`](docs/INSTALL.md#2-first-pass-in-the-theme-editor).
5. **Publish when ready.** In the theme editor's top bar, click **Publish**, then **Publish** again in the window that opens. Your old theme moves to **Draft themes** with nothing lost, so you can switch back.

Shopify's own help: [Adding themes](https://help.shopify.com/en/manual/online-store/themes/adding-themes), [Publishing themes](https://help.shopify.com/en/manual/online-store/themes/managing-themes/publishing-themes).

## If you are moving from a Shrine-style theme

- Your products, collections, pages, blog posts, menus and discounts live in the Shopify admin. They stay when you change themes.
- What you built in the old theme's editor does not move to Anvil. Section layouts, the text and images inside sections, theme settings and custom templates belong to that theme. Rebuild those pages in Anvil's theme editor; "What's inside" below lists the sections and blocks.
- For a product that should use the long sales page, open the product in your admin and set **Theme template** to `landing`.
- When Anvil is published and checked, delete the old theme copy from **Draft themes**. Also remove any paid third-party sections that are not licensed to your store. Anvil does not need them.

## Set up the conversion features

Anvil shows offers; Shopify grants them. Set up each one in your admin first, so that what the store says is true. More detail: [`docs/INSTALL.md`](docs/INSTALL.md#3-shopify-side-setup-the-theme-relies-on).

- **Offer cards from variants.** Give the product one variant per offer, for example an option "Pack" with the values 1 pack, 2 pack and 3 pack, each with its own price and image. Add a compare-at price only if the item really sold at that price: the card's savings come from it. In the theme editor, select the product page's **Variant picker** block and set **Style** to **Offer cards**. Without **Offer card** blocks, Anvil makes one card per option value; add Offer card blocks to give a card its own label, caption or badge. The `landing` template already uses offer cards.
- **Quantity tiers.** In **Discounts**, click **Create discount** > **Amount off products**, choose **Automatic discount** and set a **Minimum quantity of items**. Then set the **Quantity selector** block's **Style** to **Tier cards**, add a **Quantity tier** block for each quantity, and copy the discount's percentage into **Discount to show** and its title into **Discount name**. Shopify allows up to 25 active automatic discounts.
- **Gifts.** For a gift on quantity (the product page's **Gifts on quantity** block) or a gift at a cart total (the **Free gift at threshold** block in the cart drawer, or in the Cart summary when the cart is a page), create an automatic **Buy X get Y** discount. Under **Customer gets**, choose the gift and select **Free**. Anvil adds and removes the gift line; the cart says "Free" only when Shopify priced it at zero.
- **Free-shipping threshold.** In **Settings** > **Shipping and delivery**, add a free shipping rate with a minimum order price. Enter the same amount in the cart drawer's **Free shipping bar** block (**Free shipping minimum**), and one line per market for other currencies.
- **Ratings from a review app.** Install a product review app that writes Shopify's standard rating metafields (`reviews.rating` and `reviews.rating_count`). Stars and review counts then show on product cards and in the **Rating stars** block. Stars typed into a section show only with a rating and a link to the review.

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
- **Cart drawer** (or cart page) with line items, subtotals and checkout, plus blocks for a free-shipping bar, a checkpoints bar, a countdown to a real end date, product upsells, a free gift at a spend threshold, text with icon, image, icons with text, payment badges, a discount field, a cart note, a policies checkbox and custom Liquid. With the cart page instead of the drawer, the cart summary has its own policies checkbox and free gift at a spend threshold.

## Performance

Lighthouse, mobile profile, on an unpublished copy of Anvil on a live store, median of three runs (2026-10-15, `docs/LIVE-QA-2026-10-15.md`):

| Page | Performance | Accessibility |
|---|---|---|
| Home | 97 | 97 |
| Product | 96 | 97 |
| Landing (`product.landing`) | 93 | 97 |
| Collection | 98 | 97 |

Each page loads only the stylesheets of the sections on it, and stylesheets below the first screen do not block the first paint. The remaining accessibility finding was Shopify's own preview bar, which appears only while a draft theme is previewed. Your own scores depend on your images, apps and content.

## Documents
- `docs/INSTALL.md` — install, first editor pass and the Shopify-side setup each offer needs
- `docs/SECTIONS.md` — every section, where it can be added and its card
- `docs/STATUS.md` — what has been verified, what is still open
- `CHANGELOG.md` — what each release contains
- `docs/SPEC.md` — functional specification (what the merchant can set, what the shopper sees)
- `docs/ARCHITECTURE.md` — core architecture
- `docs/DESIGN-money-path.md` — product page and cart drawer design
- `docs/DESIGN-sections.md` — section library and build harness
- `docs/DECISIONS.md` — architecture decision records
- `docs/CLEANROOM.md` — how this theme was kept free of third-party code
- `docs/HONEST.md` — honest-marketing rules the theme enforces by default

For developers: `npm run lint`, `npm run check` and `npm test` are the static gates; `npm run package` builds the zip. A version tag (`v1.0.0`, or `v1.0.0-rc.1` for a pre-release) builds and publishes a GitHub Release (`.github/workflows/release.yml`).

## Licence
MIT. See `LICENSE` and `NOTICE`.
