# Cart bubble — `sections/anvil-cart-bubble.liquid`

_Section card, 2026-10-14. Exists only for the Section Rendering API (no presets, not in any template)._

Renders `snippets/anvil-cart-bubble.liquid`: a `.av-cart-bubble-slot[data-anvil-section="anvil-cart-bubble"]` holding `<anvil-cart-bubble>` (count + visually hidden "N items"). The header renders the same snippet, so a swap replaces the whole bubble inside the slot and bubbles never nest. `<anvil-cart-bubble>` (anvil-core.js) also updates the count and hidden label from any `anvil:cart:updated` cart JSON.
