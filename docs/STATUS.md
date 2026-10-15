# Anvil — Status after the wave-0 fix pass

_2026-10-14. Written by the fixer after applying the wave-0 review (about 90 findings) and the owner's decisions A–H on the integrator's open questions. Numbers are from the in-place gate (`shopify theme check --fail-level warning`, Shopify CLI 4.9.3) and the repo scripts. The previous integrator status is in git history._

## 1. What exists

| Area | Files | Notes |
|---|---|---|
| Layouts | `layout/theme.liquid`, `layout/password.liquid` | `window.Anvil` bootstrap (routes, versioned core module URLs in `Anvil.modules`, money formats, strings, settings); `<link rel="modulepreload">` for the four core modules; body-font preload with `crossorigin` |
| Config | `config/settings_schema.json` (23 groups, 117 settings, 48 KB), `config/settings_data.json` | new "Variant dropdowns" group and slider dot spacing; "Anvil Dark" now redefines schemes 1–5 (dark surfaces, light inverse in scheme 5) |
| Locales | `locales/en.default.json` (690 values incl. `date_formats.anvil_date`), `locales/en.default.schema.json` (291) | every storefront string of the main, customer, gift card, chrome and contact sections is an `anvil.*` key (DECISIONS 23) |
| Snippets (20) | chassis snippets + `anvil-money`, `anvil-social-links`, `anvil-cart-bubble`, icon lookups `anvil-icon-a-c/-d-l/-m-r/-s-z` | `anvil-product-card` takes `loading`, `priority`, `heading_tag`; `anvil-media` autoplay keeps controls |
| Theme blocks (12) | unchanged set | every block has a `{% doc %}` header (settings, values, defaults, example) feeding `docs/CHASSIS-API.md`; group block class `.av-group-block` |
| Assets (26) | `anvil-base.css` (38.8 KB raw / 8.8 KB gz, now incl. media, price, stars, social pills), `anvil-header.css` (new), `anvil-card.css` (card only); core JS 5 modules; new `anvil-cart.js`, `anvil-cart-drawer.js`, `anvil-facets.js`, `anvil-predictive-search.js`, `anvil-code.js`; `anvil-media.css` removed | gzip budgets enforced by `scripts/check-limits.sh` |
| Sections (30 Liquid + 3 groups) | chrome `anvil-announcement-bar`, `anvil-header`, `anvil-footer` (reduced chassis); static `anvil-cart-drawer`, `anvil-cart-bubble`, `anvil-predictive-search` (new, SRA only); addable `anvil-welcome`, `anvil-contact-form`, `anvil-faq`, `anvil-icon-bar`, `apps`; every `main-*` | header: mega menu blocks, menu position, transparent homepage mode, tiles drawer, socials, predictive search; footer: featured product/collection blocks, payment filter; announcement: page targeting, apply-to-cart codes |
| Templates | 15 JSON + 7 `customers/*.json` + `gift_card.liquid` | `page.faq.json` = main page + two FAQ sections (decision G); example icon bar / FAQ added to `index`, `product.landing`, `page.contact`, `page.track-order` |
| Docs | `docs/spec/*.md` (35 cards), `docs/CHASSIS-API.md`, `docs/sections/*.md` (10 cards), `docs/agent-prompts/2026-10-14-fix-pass.md`, DECISIONS 20–40, CONVENTIONS amended | |

## 2. Gates (after the fix pass)

- `shopify theme check --fail-level warning`: **95 files inspected, 0 offenses**. Thresholds: `AssetSizeJavaScript` and `AssetSizeCSS` 40,000 raw bytes (DECISIONS 20).
- `scripts/cleanroom-lint.sh`: clean (30 token patterns). `--strict` reports only the provenance prose it is meant to exempt (ARCHITECTURE, DESIGN-sections, NOTICE); README no longer names a competitor.
- `scripts/asset-audit.py`: clean. `scripts/chassis-lint.py`: clean, 42 files, 0 warnings (header, announcement bar and footer now checked against the reduced chassis). `scripts/check-limits.sh`: all limits respected, including the new gzip budgets.
- Forbidden-token grep over theme files, scripts, `docs/sections`, `docs/spec`, `docs/CHASSIS-API.md`: empty.
- Gzip sizes: core modules 13.0 KB together (≤ 15 KB); slider 4.5 KB (≤ 5); marquee 1.46 KB (≤ 1.5); cart 2.9 KB, facets 1.9 KB, predictive search 1.6 KB, code 1.5 KB, drawer 1.2 KB (≤ 4); base CSS 8.8 KB (≤ 20); header CSS 2.3 KB (≤ 8).
- JS smoke test (local static page with the real assets and a mocked Cart API, Chromium in the browser pane): every element defines; the drawer opens, a stepper updates the line, the re-render keeps the dialog open and the focused button, the bubble updates without nesting, a 422 rolls the quantity back and shows the message, an unusable code shows "not valid", removing the last line focuses the drawer title, closing releases the scroll lock and returns focus; facets re-render with focus kept and the URL pushed; header dropdowns close each other and on outside click; marquee pause/play; predictive results with ArrowDown into the list; countdown un-hides and ticks from `data-anvil-end`; no console errors.
- Not run (need a live store or npm packages): `scripts/gate.sh` G3/G4, `scripts/a11y.sh`, `scripts/similarity.py`, Lighthouse.

## 3. Fix pass

### Owner decisions applied (DECISIONS 20–27)
A raw thresholds 40,000 + gzip budgets in check-limits · B collapsible height exception in CONVENTIONS §8 · C reduced chassis for header/announcement/footer, CONVENTIONS §4 paragraph, chassis-lint enforcement · D storefront strings to `anvil.*` keys · E `smile` dropped · F icon-bar labels stay `<span>`, heading rule amended, shared `anvil.editor.empty_section` · G FAQ page with JSON-LD on the first FAQ only · H spec cards and CHASSIS-API generated (both scripts ran without changes).

### Blockers fixed
1. Collection and search filtering/sorting: `<anvil-facets>` re-renders results through the Section Rendering API; Apply stays visible until the element is defined; no navigation on select change.
2. Country/language forms: Update buttons always visible; no auto-submit.
3. Cart drawer and cart page: `<anvil-cart-form>` handles steppers, typed quantities, remove links, note and discount field; Update stays until defined; steppers appear only when defined.

### Majors fixed
SVG fill rule; header logo box; font preload `crossorigin`; cart count in the link name; hidden header never holds focus; product media row keyboard-reachable and slider tracks focusable when they scroll; announcement text wraps; focus rings visible in forced colours; `--av-input-border` (3:1) on inputs and quantity boxes; linked images always named (footer, image block); media/price/stars CSS in base so blocks render correctly anywhere; drawer swap root moved inside the dialog, scroll lock released on disconnect, `wrapper()` prefers `data-anvil-section`; reveal gated on `html.av-reveal-ready`; first card row eager + LCP priority; hover images not downloaded on touch; autoplay videos keep controls and respect reduced motion; marquee pause button; slider layout written inline with a reserved dots row; `heading` → `title` in main sections and `drawer_title` in the drawer; countdowns to one absolute instant with date validation; storefront strings localised; unused settings wired (card/blog card style and ratio, cart vendor/savings/discount, light logo, predictive search); price filter in cents; review badge only with a source link; real dark preset; FAQ templates; header, footer and announcement spec gaps (mega menu, menu position, transparent mode, drawer layout and socials, predictive search, featured product/collection, payment filter, page targeting, apply mode); variant dropdown settings and dot spacing; password errors visible; open-on-add via a document event; drawer JS moved to a module.

### Minors fixed
Drawer closes past 990 px; no-JS menu drops down under the bar; per-line control names and price context; responsive tables keep semantics (hidden thead + explicit roles + aria-hidden cell labels); heading levels (footer `h2`, hidden `h2` over card grids, welcome `h1`); slider pause state under reduced motion, named dots group, 0.55 dot opacity; marquee static row from CSS under reduced motion and pause rules that actually win; announcement slide roles left to the slider, copy label fallback; `aria-haspopup` on search and cart; duplicate link names (empty alt inside named links); rating counts read as "12 reviews"; modulepreload; icon lookup split (no 27 KB re-parse, under LiquidComplexity); card widths `300, 450, 600`, banner `sizes`; reveal from the third section; form errors tied to fields (contact, newsletter, comments, customer forms); prose tables in labelled scroll regions; bubble slot; overlay tokens; `av-is-*` state classes; `av-s-<type>` class; `data-anvil-*` hooks and `.av-marquee__clone`; slug classes; sentence-case names documented; footer heading "Shop"; vendor prefixes removed; contact keys; CSS threshold; block doc headers; README; password and gift card routes; currency-code money everywhere (`anvil-money`); CartBubble fallback; empty-cart link navigates; drawer backdrop closes; honesty notes (announcement text, footer image, newsletter text, contact success); security setting text; sold-out variants selectable; FAQ open-first flag.

### Skipped or deferred (with reason)
- **Cart drawer blocks (SPEC §2.4, 16 blocks)** — wave-1 scope per DESIGN-money-path §G and still blocked on the static-section-blocks verification (DECISIONS 4, 36). The drawer settings that already existed now work.
- **JS-off discount field** — hidden without JavaScript on purpose (DECISIONS 37): a blank `discount` field posted with every cart update could clear codes, and checkout has its own field.
- **Archiving every section prompt now** (`agent-prompt.py <slug> --archive` × 35) — not done ahead of time: a prompt archived before a section is dispatched is not the prompt actually used; the dispatcher archives each one when it runs (DECISIONS 38). The wave-0 cluster briefs cannot be recovered verbatim; this pass archived its own brief.
- **Section cards for `main-*`** — exempt (minimal page shells, DECISIONS 38); cards were added for every wave-0 `anvil-*` section.
- **Templates waiting on sections that do not exist yet** (hero, ticker, featured collection, related products, track order, 404 featured collection) — added as their waves land.
- **`js` / `no-js` classes** kept (documented in CONVENTIONS §1 as the only non-`av` classes) rather than renamed.

## 4. Verifications that still need a live store

Carried from wave 0 (see the previous status in git history for detail): static-section blocks editable in the editor; `{% stylesheet %}` subsetting per page; `content_for 'blocks'` with `closest.product`; `visible_if` on settings (now also `pages_custom` in the announcement bar); system fonts in `font_picker`; inline token size with real font URLs; legacy customer-account templates; invalid discount code behaviour on `cart/update.js`; `variant | json` media; recommendations `section_id`; `drawer_preview_open`; OG image pairs and JSON-LD validity; gift card QR script and wallet badge; country rule with JS off.

New from this pass (written from memory of shopify.dev; the sandbox had no network):
1. `preload_tag: … crossorigin: 'anonymous'` writes the attribute (and the Link header) — confirm in the rendered source; otherwise switch back to a literal `<link … crossorigin>` and accept Theme Check's `AssetPreload` suggestion.
2. The AJAX cart JSON includes `discount_codes: [{code, applicable}]` (used to report an unusable code).
3. `/discount/CODE?redirect=…` keeps the market/locale prefix; predictive search accepts `resources[limit_scope]=each`.
4. `time_tag: format: 'anvil_date'` and `date: format: 'anvil_date'` resolve a theme-defined `date_formats` key.
5. `form.errors contains 'email'` (field-level checks) on contact, customer, comment and newsletter forms.
6. The transparent header's computed overlap matches the rendered height with a real logo; `:has()` hides the section background while transparent.
7. Section Rendering with `section_id` for JSON-template sections on collection/search URLs carrying filter parameters (facets).
8. Liquid `date: '%s'` reads a zone-less `YYYY-MM-DDTHH:MM` string in the store's time zone (countdown `data-anvil-end`).

## 5. Open questions carried forward

- **FAQ JSON-LD on example content.** Decision G puts `json_ld: true` on the first FAQ section of `page.faq.json`, whose questions are examples until the merchant edits them; search engines would read example questions as FAQ data on a store published unedited. Keep, or ship it off and let the merchant turn it on?
- **Secondary button colours.** `--av-btn2-fg` / `--av-btn2-border` still map to the scheme text; add two scheme definitions if merchants need a distinct secondary colour.
- **Countdown unit labels** are block settings; `anvil.countdown.*` keys exist if the block should switch to `t`.
- **Video facade script** is inline in `snippets/anvil-media.liquid` (guarded, ~20 lines per facade); move into a module if the duplication matters.
- **`cartAdd` makes two requests** (`add.js` then `cart.js`) to keep the event shape.
- **Address deletion** posts immediately (the old `data-anvil-confirm` attribute had no handler and was removed); add a confirmation step later if wanted.
- **Copy button** in the announcement bar is shown whenever JS runs (`av-js-only`), not keyed on `anvil-code.js` having loaded; low risk, but not the `:defined` pattern.
- **Wave-1 hand-offs.** `<anvil-product-form>` must pass the ids from `[data-anvil-cart-render]` (drawer, bubble) as `sections` to `Anvil.cart.cartAdd` — `anvil-core.js` then swaps them and the drawer opens on `source: 'add'`; drawer blocks render inside `.av-cart-drawer__frame` and reuse `<anvil-cart-form>`.
- **Dev store.** `shopify.theme.toml` still has `theme = "REPLACE_WITH_DEV_THEME_ID"`; `SCRATCH_PAGE` defaults to `contact`.
