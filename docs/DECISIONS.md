# Anvil — Reconciliation of the three designs

_Design document, 2026-10-14. Part of the Anvil theme (MIT). Written from Shopify's public documentation only._

1. **From scratch, not Dawn.** Dawn/Skeleton/Horizon licences are Shopify-only with Theme Store distribution; Anvil is fully original code under MIT so the zip and repo are clean.
2. **Naming.** Classes `.av-*`, CSS variables `--av-*` (Appendix A); Appendix C's `.anvil-*`/`--a-*` examples read as `.av-*`/`--av-*`. Base stylesheet is `assets/anvil-base.css` (C's `anvil-core.css`). Template-bound sections are `main-*` (C's `anvil-main-*` reads as `main-*`); everything else we author is `anvil-`/`_anvil-`.
3. **CSS placement.** Shared component CSS (slider, marquee, product card, drawer, gallery, header) lives in `assets/anvil-<component>.css` loaded by `stylesheet_tag` from the sections that use it; section-only static CSS goes in that section's `{% stylesheet %}` (≤ 6 KB, no Liquid). **Wave-0 check:** confirm the bundled stylesheet is subsetted per page; if not, section CSS moves to `assets/anvil-<slug>.css`. Per-instance values (padding, widths) via `{% style %}` scoped by `#shopify-section-{{ section.id }}`.
4. **Cart drawer** is a static section rendered from `theme.liquid` (`{% section 'anvil-cart-drawer' %}`), not an `aside` group (would let merchants drop arbitrary sections into the drawer). **Wave-0 check:** static-section blocks editable in the editor; fallback `block_list`-style settings.
5. **Overlay group.** `sections/overlay-group.json` (`type: custom.overlay`, rendered after the footer group) holds floating widgets: scroll-to-top, audio player, promo popup. Three groups used of 20.
6. **Blocks.** Product section and data-row sections use local blocks; container/content sections use `@theme` primitives; private `_anvil-*` blocks only where a row contains primitives. Product block schemas for `main-product` and `anvil-featured-product` are generated from `docs/product-blocks.schema.json`.
7. **Icons.** One `snippets/anvil-icon.liquid` with ~120 Lucide icons (ISC, credited in `NOTICE`); merchants can upload a custom image where an icon setting exists. No icon font.
8. **Screenshots** use `?view=anvil-scratch-<slot>` on any existing page of the dev theme; no store pages are created.
9. **Free-shipping threshold** lives on the drawer's `free_ship_bar` block (per market textarea), not in theme settings.
10. **Locales** English-only in v1.0; marketing copy in settings; a11y strings under `anvil.*`.
11. **Honest defaults** (hard line 6) are implemented as Appendix B.K and the `info` texts in every spec card; Shopify's Theme Store honesty rule is quoted in `docs/HONEST.md`.
