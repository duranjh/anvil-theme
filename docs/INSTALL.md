# Anvil — Install and set up

_2026-10-15, Anvil 1.0.0-rc.1. For a store owner putting Anvil on a store, and for a developer working on it. The short version is README "Install in 5 minutes"; this page has the detail. What every section is: `docs/SECTIONS.md` and README "What's inside"._

1.0.0-rc.1 is a release candidate. What was checked on a live store and what is still open: `docs/STATUS.md`, "Release candidate". Try Anvil as a draft theme and publish only after the checks in section 4.

## 1. Put the theme on the store (as a draft)

**From the release zip (store owner).** Shopify's own steps: [Adding themes](https://help.shopify.com/en/manual/online-store/themes/adding-themes).
1. Download `Anvil-<version>.zip` from the [GitHub Releases page](https://github.com/duranjh/anvil-theme/releases); a release candidate is marked "Pre-release". Upload the `.zip` itself, not a folder your browser unpacked. Inside Shopify a release candidate shows its base version (1.0.0-rc.1 shows as 1.0.0).
2. Shopify admin → **Online Store** → in **Draft themes**, **Import theme** > **Upload zip file** → **Choose File** → **Upload**. It arrives as a draft (unpublished). The plan must allow it: Starter offers only the Spotlight theme; Basic, Grow and Advanced hold up to 20 themes, Plus up to 100.
3. Optional: rename the draft so nobody publishes it by accident (Anvil's own copy on the Voreau store is "ANVIL dev - DO NOT PUBLISH").

**Building the zip yourself (developer).** `npm run package` runs Theme Check, `shopify theme package` and a zip check; the zip lands in `dist/Anvil-<theme_version>.zip` with only the theme folders inside.

**Publishing a release (maintainer).** `.github/workflows/release.yml` runs on a pushed tag `vX.Y.Z` or `vX.Y.Z-<suffix>`:
1. `theme_version` in `config/settings_schema.json` is the base version (`1.0.0` for `v1.0.0-rc.1` and for `v1.0.0`).
2. `CHANGELOG.md` has a `## [<tag without v>] - <date>` section; it becomes the release text, up to the next `## ` heading.
3. Tag a commit whose CI run is green: `git tag v1.0.0-rc.1 && git push origin v1.0.0-rc.1`.
4. The workflow checks the version, runs `shopify theme check --fail-level warning`, packages with `shopify theme package`, and attaches `Anvil-<tag without v>.zip` to a GitHub Release, marked pre-release when the tag has a `-` suffix. The checks and packaging run in a job with read-only access; a second job, which installs nothing, alone holds the write token and creates the release.

**With Shopify CLI (developer).**
1. The shared unpublished dev theme on the Voreau store is 189166714959, environment `voreau-dev` in `shopify.theme.toml`. On another store, create your own once with `shopify theme push --unpublished --theme "<name>" --store <store>.myshopify.com` and use its id (`shopify theme list --store …`), also as `DEV_THEME_ID` for `scripts/gate.sh`.
2. Then: `shopify theme push -e voreau-dev` or `shopify theme dev -e voreau-dev`. When a setting's default or range changes, push `config/settings_data.json` before `config/settings_schema.json` (DECISIONS 121).
3. Never `--live`, never `--allow-live`, never the id of the published theme. `.shopifyignore` keeps `docs/`, `scripts/`, `tests/` and the other repo files off the store.

**Moving from another theme.** Products, collections, pages, blog posts, menus and discounts live in the Shopify admin and stay. What was built in the old theme's editor (section layouts, text and images inside sections, theme settings, custom templates) belongs to that theme and does not move: rebuild those pages in Anvil's editor. Once Anvil is published and checked, delete the old theme copy and any paid third-party sections that are not licensed to the store.

## 2. First pass in the theme editor

Open it from **Online Store** → **Draft themes** → **Edit theme** next to Anvil.

1. **Theme settings**: Colors, Typography, Buttons, **Cards** (image shape, style, border, shadow; card grids set to "Same as theme cards" follow these), **Cart** (cart type Drawer or Page, note, discount field, vendors, savings line), **Drawers & popups**, **Quantity picker**, **Animations**.
2. **Header and footer groups**: menus, logo, announcement bar messages. Header → "Transparent over the first section" works on the homepage or on the templates you list.
3. **Templates that ship with content**: `index`, `product.landing`, `product`, `page.contact`, `page.faq`, `page.track-order`, `404`. Text that starts with "Example:" and example images are placeholders: replace or delete every one before publishing. Example cards (collections, products, logos) show until real ones are picked.
4. **Assign the alternate templates**: a product that should use the long landing page gets the `landing` template (product admin page → Theme template); the contact, FAQ and track-order pages are pages that use `page.contact`, `page.faq` and `page.track-order`.
5. **Overlay group**: Scroll to top is on; the Promo popup and Music player ship switched off. Turn them on only when they have real content.

## 3. Shopify-side setup the theme relies on

Anvil shows offers; Shopify grants them. Set these up in the admin so what the storefront says is true. Discounts: **Discounts** → **Create discount** → **Amount off products** or **Buy X get Y**, method **Automatic discount** (up to 25 automatic discounts can be active). Offer cards need no discount: one variant per offer, with a compare-at price only where the item really sold at it (README "Set up the conversion features").

| Feature | What to set up in Shopify | Where the theme reads it |
|---|---|---|
| Gift on quantity (product block), Gift at a cart total (drawer block, or Cart summary block with cart type Page) | An automatic **Buy X get Y** discount that makes the gift item free. The theme adds and removes the gift line; Shopify prices it. "FREE" shows only when Shopify priced the line at zero. | `assets/anvil-gifts.js`; the gift at a cart total is the cart drawer's Free gift at threshold block with cart type Drawer (it runs on every page) and the Cart summary section's block of the same name with cart type Page (it runs on the cart page; Buy it now buttons skip it). |
| Quantity tiers, Bundle deals, Bundle offer | An automatic **Amount off products** discount with the minimum quantity the tier or bundle names; copy the same percentage into the block. | Tier and bundle settings; "Discount applied at checkout" is the theme's only claim. |
| Free shipping bar | A free shipping rate with a minimum order price (Settings → Shipping and delivery). Enter the same amount in the bar, and one line per market for other currencies. | Cart drawer → Free shipping bar block. |
| Complementary products (Related products, upsells) | The Search & Discovery app, with complementary products picked per product. Without it, "Complementary" shows nothing. | Related products section, Upsells blocks. |
| Star ratings and review counts | A review app that writes the standard `reviews.rating` and `reviews.rating_count` product metafields. Typed stars show only with a link to the review. | Product cards, rating blocks, testimonials, review wall. |
| Policies checkbox and policy links | Settings → Policies. The drawer's Policies checkbox block and the cart page's "Show policies checkbox" list the policies written there. | Cart drawer block; Cart summary section (cart type Page). |
| Countdown | A real end date and time zone for a real offer; no evergreen timers exist. | Countdown blocks. |

Cart type **Page** uses the cart page (Cart items + Cart summary): the drawer's blocks (free shipping bar, checkpoints, countdown, gift at a cart total, upsells) do not appear there; the Cart summary has its own policies checkbox and its own Free gift at threshold block (same settings as the drawer's; it applies only with cart type Page).

## 4. Before publishing

- Every "Example:" text and example image replaced or removed.
- `docs/STATUS.md` "Release candidate" list (and the live-store lists it points to) run on the unpublished copy: editor checks, both viewport sizes, reduced motion, console errors, accessibility checks, Lighthouse on home, product and landing.
- Discounts from section 3 tested with a real cart (gift line priced at zero, tier discount applied at checkout).
- Only then publish: in **Draft themes**, **Edit theme** on Anvil, then **Publish** in the editor's top bar and **Publish** again in the window that opens ([Publishing themes](https://help.shopify.com/en/manual/online-store/themes/managing-themes/publishing-themes)). The old theme moves to **Draft themes** unchanged.
