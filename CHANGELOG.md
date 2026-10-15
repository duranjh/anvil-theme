# Changelog

All notable changes to Anvil are recorded here. The format follows Keep a Changelog; versions follow SemVer.

## [Unreleased]
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

