# Track order — `sections/anvil-track-order.liquid`

_Section card, 2026-10-15 (wave build). Addable section, full chassis, no blocks. Classes `.av-track-order*`. Module `assets/anvil-track-order.js` (`<anvil-track-order>`, 2.1 KB raw / 1.0 KB gz), loaded only by the tracking form._

## Purpose
Gives shoppers one way to follow a parcel, chosen by the merchant (SPEC §4.2 "Track order", DESIGN-sections §3):

| `mode` | Shopper sees | Works without JavaScript |
|---|---|---|
| `account` (default) | A button to `routes.account_url`. Shopify lists every order there with its tracking; signed-out shoppers sign in first (classic and new customer accounts both redirect from this route). With new customer accounts they sign in with a one-time code sent to the email they ordered with; with classic accounts a shopper who checked out as a guest must first create an account with that email or accept an account invite. | yes |
| `tracking` | A labelled "Tracking number" field and a submit button. The number goes into the merchant's carrier address template in place of `{number}` and the carrier's page opens. | yes when `{number}` is the last value of the query string (see below); otherwise a `<noscript>` link to the carrier's site |
| `embed` | The merchant's pasted embed code (tracking app or carrier widget), printed as given. | depends on the embed |

`help_text` (rich text) shows under the button, form or embed in every mode; the field and the button reference it with `aria-describedby`.

## Settings (after the 13 chassis settings)
| id | type | default | notes |
|---|---|---|---|
| `mode` | select `account` / `tracking` / `embed` | `account` | info: the account lists Shopify's tracking; the form sends shoppers to the carrier's own page |
| `help_text` | richtext | example paragraph | info: promise only delivery times and support hours the policies back |
| `button_style` | select `primary` / `secondary` | `primary` | account button and form button |
| `text_align` | text_alignment | `center` | position of the panel and alignment of the help text; form labels stay start-aligned |
| `box` | checkbox | true | panel in a bordered card |
| `account_label` | text | "View my orders" | blank falls back to `anvil.track_order.orders`; info: the account lists orders with their tracking, signed-out shoppers sign in first, and classic-account guests must create an account with the same email or accept an invite |
| `carrier_url` | text (placeholder `https://carrier.example/track?id={number}`) | blank | must start with `https://`, contain `{number}` and have a valid host (see Behaviour); anything else shows an editor note and nothing to shoppers |
| `carrier_name` | text | blank | named in the hint ("Results open on …"); blank uses the address's domain |
| `track_label` | text | "Track parcel" | blank falls back to `anvil.track_order.submit` |
| `new_tab` | checkbox | true | form `target="_blank" rel="noopener"`, hint says "in a new tab", module uses `window.open(…, 'noopener')` |
| `embed` | html | — | info: runs as pasted, Anvil adds no script, check privacy terms and consent |

Preset "Track order": heading "Track your **order**", width narrow, account mode.

## Behaviour
- **Template validation (Liquid).** `carrier_url` is stripped; it counts only when it starts with `https://` (any case), contains `{number}` and has a host (the part before the first `/`, `?` or `#`) that a browser's URL parser accepts: not blank, no space, none of `{ } < > \ ^ | @ [ ] % "` (the WHATWG forbidden host and domain code points that a text setting can hold, plus `{}` and `"`; `@` also rules out a sign-in part such as `dhl.com@other.example`, which would name the wrong site in the hint), and a port, if any, of digits up to 65535. The host gives the carrier label fallback and the no-JS fallback link (`https://<host>`).
- **No-JS GET form.** When the template holds exactly one `{number}`, that `{number}` directly follows `name=` as the last value before the end or an `&`, and the template has no `#` or `+`, Liquid splits it into the form `action` (everything before `?`), the input's `name` (the parameter) and hidden inputs for the other query pairs, kept in their original order before and after the field (names and values `url_decode`d, then escaped). The browser then builds the same address natively. Example: `https://carrier.example/track?lang=en&id={number}` → `action="https://carrier.example/track"`, hidden `lang=en`, field `name="id"`.
- **Path templates** (`…/track/{number}`, several `{number}`, fragments) need the module: the submit button (`.av-track-order__submit`) renders `disabled` (the precedent is DECISIONS 55) and the module enables it. As DECISIONS 55 asks, `.av-track-order__tool:not(:defined) .av-track-order__submit[disabled]` resets the shared `.av-btn[disabled]` fade (`opacity: 1; cursor: default`) so the button does not paint faded and then turn solid on first load. `<noscript>` offers "Track your parcel on <carrier>" linking to the carrier's site.
- **Module.** On submit it first cancels the native submit when the form has no `action` (path templates), so a template the browser still rejects can never send a GET to the current store page (or open a copy of it in a new tab). It removes all whitespace from the number; when nothing is left (the shopper typed only spaces, which `required` lets through) it clears the field, focuses it and calls `reportValidity()`, so the browser shows and announces its own "fill out this field" message (WCAG 3.3.1). Otherwise it replaces every `{number}` with the URL-encoded number, follows the result only when `new URL()` parses it as `https:`, and opens it in a new tab (`new-tab`) or the same tab. A native (query-string) form whose address the parser rejects falls back to its own GET submit. It fetches nothing. Listener removed in `disconnectedCallback`; a re-rendered section upgrades on its own.
- **Account mode** renders only when `shop.customer_accounts_enabled`; otherwise the editor shows a note and shoppers see only the help text.
- **No empty card.** `has_body` is true when the chosen mode renders something for shoppers (tracking with a valid template, embed with code, account with customer accounts on) or `help_text` is set. Without it the panel (and its card border, tint and shadow) is left out for shoppers and only the section heading shows; the editor always gets the panel with its note.
- **Embed mode** prints `s.embed` in `.av-track-order__embed` (horizontal scroll if a widget is wider than the column; iframes capped at 100 % width).
- Field: `type="text"`, `required`, `maxlength="64"`, `autocomplete="off"`, `autocapitalize="characters"`, `spellcheck="false"`, `enterkeyhint="go"`, label from `anvil.track_order.number_label`. Field and button sit in the shared `.av-field--inline` pair (anvil-base.css: flex, gap, input `flex: 1 1 auto; min-width: 0`); the section only stacks it below a 26rem container width and keeps the button `flex: none` above it (container query on the panel).

## Accessibility
Labelled input; hint and help text linked with `aria-describedby` from both the input and the button, so the destination site and the new tab are announced before leaving; the noscript link carries the shared `anvil.a11y.new_window` text when it opens a new tab; native `<form>` and `<button>`; no motion.

## Honesty notes
- Anvil ships no third-party script and makes no request to a carrier: the carrier is contacted only by the shopper's own navigation, and the hint names the site that opens.
- Nothing claims "live" or "real-time" tracking; results are the carrier's or Shopify's.
- `carrier_name` info: name only the carrier the address belongs to. `help_text` info: promise only what the policies back. `embed` info: the pasted code runs as written, with the provider's privacy and consent needs.
- Default help text reads as an example ("Example help text — … Replace it …").

## Locale keys (added by the integrator)
- `anvil.track_order.number_label` = "Tracking number"
- `anvil.track_order.submit` = "Track"
- `anvil.track_order.orders` = "My orders"
- `anvil.track_order.opens_on` = "Results open on {{ carrier }}."
- `anvil.track_order.opens_on_new_tab` = "Results open on {{ carrier }} in a new tab."
- `anvil.track_order.carrier_site` = "Track your parcel on {{ carrier }}"
- `anvil.editor.track_order_template` = "Enter your carrier's tracking address, starting with https:// and containing {number}, to show the tracking form."
- `anvil.editor.track_order_embed` = "Paste the embed code from your tracking app to show it here."
- `anvil.editor.track_order_accounts` = "Customer accounts are turned off (Settings > Customer accounts), so shoppers do not see the order link."
- Reused: `anvil.a11y.new_window`.

## Uncertain / open
- "order number/email → account link" is read as a link to the customer account, where Shopify asks for the order email. Shopify has no theme endpoint that looks up an order by number and email (that check lives on the order status page reached from the confirmation email), so the section does not draw order-number or email fields that could not do anything.
- The card names no blocks. Tracking apps usually ship app blocks; accepting `@app` blocks here would be a better home for them than pasted embed code. Not added, because the card says "Blocks: —".
- Integration pass: `templates/page.track-order.json` ships this section (main-page → track-order → timeline → FAQ, DECISIONS 75).
- A path-style template with JavaScript on but the module failing to load leaves a disabled button, unfaded by the `:not(:defined)` rule (same trade-off as DECISIONS 55); with JavaScript off the noscript link covers it.

## Integration pass (2026-10-15)
- Placed on `templates/page.track-order.json` after the page content (account mode, the preset).

## Fix pass (2026-10-15)
- Setting ids follow the theme-wide vocabulary (CONVENTIONS §5; DECISIONS 82–100); the tables above use the new ids: `align` → `text_align`, `card` → `box`. Saved templates were migrated.
- Availability: `disabled_on` groups ["*"] (CONVENTIONS §4, DECISIONS 100).
