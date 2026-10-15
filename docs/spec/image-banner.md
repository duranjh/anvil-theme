# anvil-image-banner — spec card

**Build exactly this; ids and words are yours; follow CONVENTIONS.**

_Hand-written card for a standard storefront section (SPEC §4.1 lists these by name; DESIGN-sections §3 "Standard sections"). Edit by hand._

- **Purpose:** a full-width hero image (separate desktop and mobile images) with a content box: eyebrow, heading (chassis heading or a local heading block), text, up to two buttons.
- **Merchant sets:** desktop image, mobile image (optional), focal-point aware `object-position`, height (adapt to image / small / medium / large / full screen) separately on M and D, overlay opacity 0–90 %, content position (9 positions on D, top/middle/bottom on M), content box on/off with the box colour scheme, text alignment, heading tag (h1 or h2: h1 only when this is the page's first section), make the whole banner a link.
- **Blocks (local, ≤ 6):** `eyebrow`, `heading`, `text`, `buttons` (two buttons with label, link, style).
- **Shopper sees:** an LCP-priority image (eager, `fetchpriority: high` when `section.index` ≤ 2 or nil), text readable over it.
- **A11y / perf:** no text baked into images; contrast relies on the overlay and the scheme; widths 750–3000 with `sizes="100vw"`; aspect box so nothing shifts.
- **JS:** none. **~Lines:** 260.
