# anvil-multicolumn — spec card

**Build exactly this; ids and words are yours; follow CONVENTIONS.**

_Hand-written card for a standard storefront section (SPEC §4.1 lists these by name; DESIGN-sections §3 "Standard sections"). Edit by hand._

- **Purpose:** a grid of columns, each with an image or icon, heading, text and link.
- **Merchant sets:** columns D (1–6) and M (1–2), M layout grid or swipe row (`<anvil-slider>`), image ratio, icon size, card style (plain/card), text alignment, column button style.
- **Blocks (local, ≤ 12):** `column` (image, icon name from anvil-icon, heading, text, link label, link).
- **JS:** slider only when the swipe layout is chosen. **~Lines:** 220.
