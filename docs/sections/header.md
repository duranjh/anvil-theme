# Header — `sections/anvil-header.liquid`

_Section card, 2026-10-14 (fix pass). Group-only section (`enabled_on.groups: ["header"]`) with the reduced chassis (CONVENTIONS §4). CSS: `assets/anvil-header.css`. Spec: SPEC §2.2._

## Purpose
Logo, main menu (dropdowns or mega panels), search, account and cart on one bar; a menu drawer on phones; optional transparent mode over the homepage's first section.

## Settings
Reduced chassis first: `color_scheme`, `pad_top`, `pad_bottom`, `pad_mobile`, `show_on`. Then:

| id | type | default | what it does |
|---|---|---|---|
| `logo` | image_picker | — | overrides the theme logo; width always from Theme settings (`--av-logo-w`, desktop/phone) |
| `logo_position` | select `left` / `center` | `left` | desktop logo placement |
| `menu` | link_list | `main-menu` | the menu |
| `menu_position` | select `left` / `center` / `below` | `center` | desktop menu placement; with a centred logo `left` and `center` both sit left |
| `sticky` | select `always` / `scroll-up` / `never` | `scroll-up` | sticky behaviour; never hidden while focus is inside |
| `transparent_home` | checkbox | false | transparent over the homepage's first section until the page scrolls |
| `transparent_scheme` | color_scheme | `scheme-4` | text colour while transparent; a dark scheme also switches to `settings.logo_light` |
| `show_search`, `search_mode` | checkbox, select `link` / `modal` | true, `modal` | search link or dialog; the dialog shows predictive results when Theme settings > Search is on |
| `show_account` | checkbox | true | account link (when customer accounts are enabled) |
| `drawer_layout` | select `list` / `tiles` | `list` | phone menu: expandable groups or large tiles |
| `drawer_socials` | checkbox | false | social pills in the phone menu |
| `show_country`, `show_language` | checkbox | false | localisation forms in the phone menu, each with a visible Update button |

## Blocks
`mega` (max 6): `menu_item` (title of a top-level item with child links), `collection`, `product`, `image`, `image_label`, `image_link`. A matching top-level item opens a full-width panel: child links as columns with their own child links, a "View all" column, then the featured collection/product/image. Unmatched blocks show an editor-only note so they stay selectable.

## Behaviour
- Desktop dropdowns are `<details>`; `<anvil-header>` closes the others when one opens, on an outside click and on Escape (focus back to the summary).
- Phone menu: `<anvil-drawer close-at="990">` around a `<details>`. With JS it is a modal panel (focus confined, page inert, Esc/overlay close) that closes itself when the viewport reaches 990 px; without JS the panel drops down under the bar and the burger stays visible to close it.
- Cart link: hidden "Cart" text + the bubble's hidden "N items" give "Cart, 3 items"; `aria-haspopup="dialog"` when the drawer is on. Search link: `aria-haspopup="dialog"` in modal mode.
- Logo: `image_tag` with width/height attributes and CSS width `var(--av-logo-w)`, so the box is reserved before the image loads.
- Transparent: the section overlaps the first section by a height Liquid computes from padding and logo size (`margin-bottom: -Npx`, three breakpoints), so nothing shifts when scripts run; the bar starts with `av-is-transparent` and loses it once scrolled.

## Honesty / accessibility notes
No claims are rendered by the header. Every icon-only control has visually hidden text. Touch targets 44 px.

## Uncertain
- The transparent overlap is an estimate when the logo is taller than its width/aspect ratio suggests (SVG with padding); check on a real logo.
- `color_brightness` on a scheme background decides "dark" (< 128).
