# Changelog

All notable changes to Anvil are recorded here. The format follows Keep a Changelog; versions follow SemVer.

## [Unreleased]

## [1.0.0-rc.1] - 2026-10-15

First release candidate of Anvil 1.0.0, published as a GitHub pre-release for review before the final 1.0.0. Inside Shopify the theme shows version 1.0.0; the download is `Anvil-1.0.0-rc.1.zip`. Install steps: README "Install in 5 minutes".

### What ships
- **Product page.** A media gallery beside a buy column that you build from 38 block types plus app blocks. The gallery swipes, shows the selected variant's images first, magnifies on hover and opens a full-screen viewer with pinch zoom. The buy box still works with JavaScript off and with no blocks added.
- **Product blocks.** Variant picker as dropdowns, pills with colour swatches, or offer cards (one card per pack or option, with its own image, label and savings from the compare-at price). Quantity stepper or tier cards tied to an automatic discount. Buy buttons with optional express checkout, and a sticky add-to-cart bar. Price with compare-at savings and unit price; stock and urgency lines from Shopify's tracked inventory. Rating stars, reviews and badges. Estimated delivery dates and shipping checkpoints. Custom fields saved on the order line. Size chart, popups and collapsible tabs. Discount code, bundle offer, upsells, complementary products and gifts on quantity. Trust, image, video and text blocks. The Featured product section offers the same blocks anywhere on the store, except the sticky bar and quantity gifts.
- **Cart drawer.** Opens after add to cart, with quantity steppers, remove, note, discount field and checkout. 16 blocks: line items, subtotals, checkout, free-shipping bar (with amounts per market), checkpoints bar, countdown to a real end date, upsells, a gift at a cart total, text with icon, image, icons with text, payment badges, discount field, note, policies checkbox and custom Liquid. A cart page can be used instead (Theme settings > Cart); its summary has its own policies checkbox and gift at a cart total.
- **59 sections.** 54 you add in the theme editor, from heroes, banners and tickers to comparison tables, reviews, FAQ, bundles, pricing, newsletter and a promo popup (the full list is in the README), plus the Apps section. Four more the theme renders itself: the cart drawer, the cart count, search suggestions and the cart upsell row. 19 template sections cover the product, collection, search, cart, blog, article, page, 404, password and customer account pages.
- **Templates.** 23 in all: a finished homepage (12 sections), a long product sales page (`product.landing`, 19 sections) and the standard product page, contact, FAQ and track-order pages, a 404 page with featured products, collection, collections list, search, cart, blog, article, page, password, gift card and seven customer account pages. Example text starts with "Example:" so it is easy to find and replace.
- **Theme settings.** 117 settings in 23 groups: logo, colours and colour schemes, typography, layout, buttons, inputs, cards, media, content containers, drawers and popups, badges, colour swatches, variant pills and dropdowns, quantity picker, slider controls, animations, scrollbar, social links, cart, currency, search and security. Two style presets: Anvil and Anvil Dark.
- **Honest defaults.** Timers count down to a real end date the merchant enters. Stock lines read Shopify's tracked inventory and show nothing when it is not tracked. Savings come from compare-at prices or Shopify discounts, never from a typed number. "Free" shows only when Shopify priced a line at zero. Stars and review counts come from review-app metafields or carry a link to the review. "Most popular" badges need a "backed by sales data" tick. No platform logos ship. Settings that could be misused say so in the editor (`docs/HONEST.md`).
- **Performance and accessibility.** Each page loads only the stylesheets of the sections on it, and stylesheets below the first screen do not block the first paint. Lighthouse, mobile, on an unpublished copy on a live store (median of three runs, 2026-10-15): performance home 97, product 96, landing 93, collection 98; accessibility 97 on all four. Keyboard use, visible focus, reduced motion and one H1 per page are built in.
- **Shopify features.** Online Store 2.0 JSON templates, section groups for header, footer and overlays, theme blocks and app blocks. Every storefront string is in `locales/en.default.json`.
- **Text shows as typed.** Translated text and the plain text you type in settings are escaped exactly once, in page text, page titles, labels for screen readers and messages the scripts write, so an apostrophe or an ampersand never shows up as `&#39;` or `&amp;`.
- **Repository tooling** (not in the zip). Theme Check with zero findings, clean-room and asset lints, schema, template and size checks, unit tests for the gift engine and delivery dates, and a release workflow that builds this zip from a version tag.

### Known limits
- Not yet checked in the live theme editor: editing the cart drawer's blocks, nested theme blocks against block limits, the promo popup's signup block and settings that show or hide other settings. `docs/STATUS.md` "Release candidate" lists these and the other open store checks.
- Hero sections take images, not background video.
- English storefront text only.

## Development log (before 1.0.0-rc.1)

The detailed record of the build passes that led to 1.0.0-rc.1, kept as written. It is not part of any release's notes.

### Changed (consistency and completeness fix pass, 2026-10-15)
- One vocabulary for shared settings across every section (CONVENTIONS §4): columns (`cols_desktop` / `cols_mobile`, one tablet rule), image shape (`image_ratio` with one label set and "Same as theme cards"), card style, row style, button style (a plain text link never draws an arrow), alignment, spacing, content box, content width, slider arrows and dots, auto-advance (0–10 s), uploaded-video autoplay, review fields, hotspot dots, icons, marquee speed and link names. Saved templates and presets were migrated; DECISIONS 82–108.
- Shared pieces replace per-section copies: the `.av-grid` column rule, `.av-surface` card boxes, `.av-icon-frame`, `.av-hover-zoom`, `.av-editor-empty`, the accordion stylesheet, and the snippets `anvil-surface`, `anvil-above-fold`, `anvil-main-heading-tag`, `anvil-editor-empty`, `anvil-typed-date`, `anvil-slider-attrs`, `anvil-product-row` and `anvil-quick-buy`. Related products no longer copies featured collection's stylesheet; product videos and shoppable image share one add-to-cart form.
- Sliders decide dots, arrows and peek per screen width from the slide count, so no section hides a useless dots row itself; pricing gets the same "swipe row on phones" as multicolumn.
- Turning animations off in Theme settings works the same way in every section, the editor included.
- Every addable section says where it may be added: contact form and welcome stay out of the header, footer and overlay groups, strips may go in the header, and the lint fails a section that says nothing.
- The bundle section is `.av-bundle` / `<anvil-bundle>` again; the product page's Bundle offer block is `.av-pb-bundle` / `<anvil-pb-bundle>`. Scroll to top reads the music player's space from a variable.
- Section stylesheets share one compact format; the 6 KB budget is measured on minified CSS.

### Added (fix pass, 2026-10-15)
- Header: transparent over the first section on the homepage or on templates the merchant lists, with the header height passed to heroes so their content clears the bar; an inline search field with predictive results on desktop.
- Cart page: an optional policies checkbox in the Cart summary that blocks checkout until ticked, with or without JavaScript, saved as the same cart attribute as the drawer's.
- Product page Video block: "Start without sound" for click-to-play videos.
- `docs/SECTIONS.md` (generated by `scripts/sections-index.py`, checked in lint, the gate and CI), `docs/INSTALL.md` (upload, first editor pass, the Shopify-side setup each offer needs) and `.shopifyignore`.
- `docs/icons.json`, the one icon list whose labels `scripts/sync-block-schemas.py` writes into every icon select.

### Fixed (fix pass, 2026-10-15)
- Hotspots: tapping the image outside an open popover closes it in both hotspot sections; the dot colour and dot shape settings no longer share one id.
- FAQ always has a heading for its questions (hidden when the merchant leaves it blank), and collapsible content no longer promotes row titles to section headings.
- Typed dates in social cards and the review wall can no longer shift by a day in far-east time zones.
- The theme settings' "Cart type" explains which drawer blocks do not apply to the cart page; the cart drawer's settings point to the theme-wide width, open-after-add, vendor and quantity-style settings.
- `shopify.theme.toml` no longer names a dev theme that does not exist on the store (placeholder until the first unpublished push).

### Docs (fix pass)
- SPEC amended where the owner's decisions differ: announcement text wraps (§2.1), drawer settings are theme-wide (§2.4), Featured product omits the sticky bar and quantity gifts (§3), quantity min and step follow Shopify quantity rules (§3.2), heroes are image-only and columns beyond four wrap (§4.2), the FAQ page keeps two FAQs (§5). `_blocks.liquid` removed from the design docs (the Group section is the free-form section).

### Added (section library, waves 2–5, integrated 2026-10-15)
- 46 addable sections: hero slideshow, parallax hero, image banner, image with text, rich text, columns, group, content tabs, multicolumn, multirow, collage, collapsible content, icons with content, feature grid, guarantees, stats, timeline, ticker, vertical ticker, scrolling images, logo list, comparison table, before/after slider, testimonials, review wall, social cards, stories, media slider, video, product videos, image gallery, image hotspots, shoppable image, featured collection, collection list, bundle deals, pricing table, related products, newsletter, track order, promo popup, scroll to top, music player, section divider, theme colours preview and custom Liquid; each with a section card in `docs/sections/`.
- Templates per the spec: homepage (hero slideshow → ticker → icon bar → featured collection → comparison table → stats → testimonials → image with text → FAQ → logo list → newsletter → contact), product landing (19 sections), product with related products, contact page with "other ways to reach us", track-order page with tracking and a timeline, 404 with featured products. The overlay group ships scroll to top on and the promo popup and music player configured but off. Example copy reads as an example; every FAQ keeps structured data off.
- `scripts/check-templates.py` validates templates and section groups against the section schemas; it and `scripts/check-schema-ranges.py` run in the gate, CI and `npm run lint`.
- README "What's inside" lists every section, product block and cart feature.

### Fixed (section-library integration, 2026-10-15)
- Quick add on product cards and the Add to cart block now add through the cart drawer everywhere (the form was never found, so they left the page for /cart).
- Scrolling strips (ticker, scrolling images, logo list): no slide-out-and-jump without JavaScript, clones stay in step after a resize, keyboard focus brings a link into view (so linked images now work in a moving strip), the pause button reads "Pause" with a pressed state, and the editor highlights the real item.
- Carousels: no carousel announcement when every slide fits, arrow keys no longer hijack video controls, focus no longer stays on a slide that moved away, and a video with sound pauses when its slide leaves the view; a shopper's pause on an autoplaying video sticks.
- Before/after slider: a page swipe that starts on the slider scrolls the page, the vertical divider follows the arrow keys, pinch-zoom works.
- Sale badges round the percentage down like the rest of the theme; stats starting with 0 (0.125) count up correctly; text-link buttons keep their size everywhere; content tab strips scroll back to the first tab when centred; hotspot popovers stay above neighbouring dots; focus returns to the opener's control after adding from a popover.
- Every storefront string of the new sections is translatable (172 locale keys; one key per meaning).

### Changed (section-library integration)
- `scripts/chassis-lint.py`: private theme blocks (`_anvil-<section>-<name>`) are recognised as theme blocks.
- "Same as theme cards" in feature grid, icons with content and columns copies the theme's card border and shadow exactly.
- Logos may use images up to twice their displayed width; only sections in the template load eagerly.

### Added (wave 1: product page and cart drawer, 2026-10-15)
- Product section rebuilt (`main-product`) and an addable Featured product section: gallery beside a buy column of 38 block types plus app blocks, one product form per section, server-side offer-card preselect, a working buy box with no blocks and with JavaScript off.
- Product gallery (`<anvil-gallery>`): scroll-snap slides, thumbnails, dots or counter, variant image first and other variants' media hidden, hover magnifier, lightbox with pinch, pan and zoom.
- Variant picker (dropdowns, pills and swatches, offer cards), quantity stepper and tier cards, buy buttons, sticky add-to-cart bar (`assets/anvil-product.js`); variant changes update price, savings, SKU, stock, media, the sticky bar and `?variant=` (UTM and fbclid kept), then refresh server-rendered prices and stock.
- Content, trust and commerce blocks: title, price, description, SKU, inventory, share, custom Liquid, collapsible tab, popup, complementary products, divider, image, video, link button, scroll-to buttons; text with icon, icons with text, emoji benefits, urgency text, payment badges, rating, review-platform badge, reviews, review avatars; estimated shipping, shipping checkpoints, custom field, size chart, discount code, bundle offer, upsells, gifts on quantity.
- Gift engine (`assets/anvil-gifts.js`) shared by Gifts on quantity and the drawer's gift at threshold; ship-date calculator (`assets/anvil-ship-dates.js`); unit tests in `tests/` (`npm test`).
- Cart drawer blocks (16): items, subtotals, checkout, free-shipping bar with market thresholds, checkpoints bar, countdown to a real date, upsells, gift at threshold, text with icon, image, icons with text, payment badges, discount field, note, policies checkbox, custom Liquid. Cart page and drawer share the line and totals markup.
- Default `product` and `product.landing` templates with full block stacks; example copy reads as an example and shipping windows start at 0.
- `scripts/sync-block-schemas.py` builds both product schemas from `docs/product-blocks/`; CI runs it with `--check --strict` and runs the unit tests.

### Fixed (wave-1 review, 2026-10-15)
- Stock honesty: Inventory and Urgency text follow the selected variant on the client (Featured product included), never leaving another variant's count; the product JSON publishes stock counts only at or under a stock block's threshold.
- Cart drawer: lines, totals and upsell cards stay styled when the drawer first opens empty (styles moved to asset stylesheets; section styles from re-renders are kept); recommendations show the right number of cards in a real list; quantity changes are no longer lost when another line's update re-renders the drawer; note and terms saves can no longer leave totals stale; upsell adds are announced and keep focus; sold-out threshold gifts are never promised.
- Cart page: quantities post by line key; the gift engine runs there when a gift line exists and re-renders the page's own sections; with cart type "Page" the product form waits for the gift before opening the cart.
- Product page: values without an offer card stay selectable; a picker whose script failed can no longer add a different variant than the one shown; required custom fields and quantity rules hold without JavaScript; the stepper keeps keyboard focus at its limits; the sticky bar never covers the focused control; Add to cart confirms success and no longer reads as "collapsed"; prices keep their currency symbol at first paint; double clicks on "Add bundle" add once.
- Share, scroll-to and complementary products load one cached module instead of inline scripts; complementary cards get their styles and one-tap Add.
- Smaller fixes: offer-card layout at 320 px, unique payment-icon ids, keyboard panning in the lightbox, unit price and sale labels follow the variant, SKU line hides with its label, honesty notes on every free-text field that could carry a price or claim, neutral default headings, lighter gallery video sources, preloaded product and gallery CSS, image sizes that match the product grid.

### Changed (wave 1)
- Long-form prose styles moved to `assets/anvil-prose.css` and the country-rule overlay to `assets/anvil-security.css`, loaded only where used; `anvil-base.css` is 2.2 KB smaller.
- Gzip budgets: `anvil-product.js` 8 KB, `anvil-cart-drawer.js` 6 KB.
- Cart savings: "You save" now comes from Shopify discounts and compare-at savings get their own line; the cart page lists lines instead of a table.
- Savings percentages are rounded down everywhere so they are never overstated; "tracked inventory" means any inventory tracking service, the same rule in every block.

### Added
- Project scaffold, licence, clean-room and honesty documentation, architecture and design documents.
- Wave 0 chassis: `theme.liquid`/`password.liquid`, theme settings and presets, design tokens, `anvil-base.css`, the core JS modules and shared components (slider, marquee, dialog, collapsible, countdown, tabs, compare, hotspots), 13 shared snippets, 12 theme blocks, header, announcement bar, footer, cart drawer and bubble, every `main-*` section and template, the gift card template, the build harness (`scripts/`), CI and release workflows.

### Fixed (wave-0 review, 2026-10-14)
- Cart drawer and cart page: steppers, typed quantities, remove links, note and discount field now work with JavaScript (`assets/anvil-cart.js`); the Update button stays until the enhancement is defined. Drawer re-renders keep the dialog open; scroll lock always released; open-after-add works.
- Collection and search filters and sorting re-render in place (`assets/anvil-facets.js`); Apply stays until defined; price filter uses cents (comma-decimal currencies).
- Country and language forms keep a visible Update button (no auto-submit).
- Outline icons no longer render filled; header logo reserves its box; fonts preload with crossorigin; cart count announced; focus rings visible in forced colours; input borders meet 3:1; linked images always named; reveal never hides content when scripts fail; first product-card row eager, hover images only on hover devices; autoplay videos keep controls and respect reduced motion; marquee pause button; slider layout reserved before scripts run.
- Countdown counts down to one absolute instant; review-platform badge renders only with a source link; Anvil Dark preset is dark; password errors visible.
- Every shopper-facing string in the main, customer and gift card templates comes from `anvil.*` locale keys.

### Added
- Header: mega menu blocks, menu position, transparent homepage mode with light logo, tiles drawer, social links in the drawer, predictive search (`sections/anvil-predictive-search.liquid`, `assets/anvil-predictive-search.js`); CSS moved to `assets/anvil-header.css`.
- Footer: featured product and collection blocks, payment icon filter. Announcement bar: page targeting, apply-to-cart discount mode (`assets/anvil-code.js`).
- Theme settings: variant dropdown style group, slider dot spacing; card/blog card, cart vendor/savings/discount and light logo settings now wired.
- Example FAQ and icon bar sections in the home, landing, FAQ, contact and track-order templates.
- Reduced chassis for group-only sections, enforced by `scripts/chassis-lint.py`; gzip budgets in `scripts/check-limits.sh`; generated `docs/spec/`, `docs/CHASSIS-API.md`, section cards for the wave-0 sections.

