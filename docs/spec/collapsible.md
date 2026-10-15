# anvil-collapsible — spec card

**Build exactly this; ids and words are yours; follow CONVENTIONS.**

_Hand-written card for a standard storefront section (SPEC §4.1 lists these by name; DESIGN-sections §3 "Standard sections"). Edit by hand._

- **Purpose:** collapsible rows (like FAQ but with icons and optional image), e.g. "Shipping", "Materials", "Care".
- **Merchant sets:** layout (rows only / image + rows), image, image side, open first row, single-open (`<anvil-collapsible single>`), row style (divided/cards), icon position.
- **Blocks (local, ≤ 20):** `row` (icon, heading, content richtext, or a page).
- **JS:** none beyond `<anvil-collapsible>` in core. Native `<details>/<summary>`. **~Lines:** 180.
