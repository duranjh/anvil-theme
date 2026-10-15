# Changelog

All notable changes to Anvil are recorded here. The format follows Keep a Changelog; versions follow SemVer.

## [Unreleased]
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

