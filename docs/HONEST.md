# Honest-marketing defaults

Anvil ships every popular conversion feature, including countdown timers, stock counters, review walls and social-proof cards. It refuses to fake them. Shopify's own Theme Store rule is the bar, even though Anvil is distributed as a zip: themes "must not mislead or deceive merchants or customers with false data or claims", including "fictitious countdown timers, stock levels, or viewer activity counts".

What Anvil does by construction:
- **Timers** count down to a real end date the merchant enters. There is no evergreen or per-visitor-reset mode.
- **Stock counters** read Shopify's tracked inventory and render nothing when inventory is untracked. No typed stock numbers.
- **Savings** are computed from the product's compare-at price or shown only as "applied at checkout" when they come from a Shopify discount. There is no manual "you save" field and no fabricated bundle total.
- **"FREE"** appears on a cart line only when Shopify priced it at zero.
- **Star ratings and review counts** come from the standard `reviews.rating` metafields (written by review apps) or carry a source link; merchant-typed testimonials are labelled as such in the editor.
- **"Most popular" badges** render only when the merchant ticks "backed by sales data".
- **Platform logos** (review sites, social networks, payment brands) are not shipped; payment icons come from Shopify, and the merchant uploads any other logo they are entitled to use.
- **Inspect blocker and country blocker** exist for parity but default off; the setting text explains that they break accessibility tools and that the country check uses the shopper's Shopify Market, not geo-IP.

Every setting that could be misused carries a one-line note in the theme editor saying what is and is not honest to enter.
