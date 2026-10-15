# Predictive search — `sections/anvil-predictive-search.liquid`

_Section card, 2026-10-14. Static, Section Rendering only (no presets). JS: `assets/anvil-predictive-search.js`._

Requested as `routes.predictive_search_url?q=…&section_id=anvil-predictive-search&resources[type]=query,product,collection,page,article&resources[limit]=4&resources[limit_scope]=each`. Renders suggestions, products (thumbnail, title, price when Theme settings > Search > show prices is on), collections, pages and articles as link lists under `<h2>` group headings, a hidden result count for the live region, and "View all results" to the search page. The header dialog shows it while typing (2+ characters, debounced, cached); ArrowDown/ArrowUp move between the field and the links.

Uncertain: `resources[limit_scope]=each` is from Shopify's predictive search API reference as remembered offline; verify on the dev store.
