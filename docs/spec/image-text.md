# anvil-image-text — spec card

**Build exactly this; ids and words are yours; follow CONVENTIONS.**

_Hand-written card for a standard storefront section (SPEC §4.1 lists these by name; DESIGN-sections §3 "Standard sections"). Edit by hand._

- **Purpose:** image (or video) beside a text column; the workhorse "feature row".
- **Merchant sets:** image or video, image side (left/right on D; top/bottom on M), image ratio (adapt/1:1/4:5/3:4/16:9), image width 40–60 %, vertical alignment, content box style (none/card), content alignment D and M.
- **Blocks (local, ≤ 10):** `eyebrow`, `heading`, `text` (richtext), `checklist` (lines with a check icon), `stars` (rating from a metafield or none), `buttons`, `atc` (add a chosen product's first available variant; links to the product when it has options).
- **A11y:** headings in order (section heading from the chassis is h2; heading blocks are h3).
- **JS:** none (ATC posts a native product form; `<anvil-product-form>` from wave 1 enhances it when present). **~Lines:** 240.
