# Welcome — `sections/anvil-welcome.liquid`

_Section card, 2026-10-14. Addable section, full chassis. Placeholder homepage section until the wave-3 hero sections exist._

Chassis heading + subheading, then `title_h1` (checkbox, default on: on the homepage the heading renders as the page's `<h1>`), `text` (rich text), `button_label`, `button_url`, `button_style`. The preset and `templates/index.json` use example wording. Turn `title_h1` off when another section above carries the page title.

## Fix pass (2026-10-15)
- Uses the shared pieces: the H1 guard in `snippets/anvil-main-heading-tag` (DECISIONS 86).
- Availability: `disabled_on` groups ["*"] (CONVENTIONS §4, DECISIONS 100).
