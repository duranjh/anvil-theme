# anvil-newsletter — spec card

**Build exactly this; ids and words are yours; follow CONVENTIONS.**

_Hand-written card for a standard storefront section (SPEC §4.1 lists these by name; DESIGN-sections §3 "Standard sections"). Edit by hand._

- **Purpose:** an email signup band.
- **Merchant sets:** background image (optional) with overlay, layout (stacked / inline field + button), field placeholder, button label, success message, small print (richtext, e.g. consent text and a privacy link).
- **Shopper sees:** `{% form 'customer' %}` with `contact[email]` and `contact[tags]=newsletter`; success and error states from `form.posted_successfully?` and `form.errors`, announced in a live region; the page scrolls back to the form after posting (anchor).
- **Honesty:** no "X people joined" counters; any discount promised must exist (info text).
- **JS:** none. **~Lines:** 160.
