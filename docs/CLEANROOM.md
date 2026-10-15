# Clean-room provenance

Anvil re-implements, from scratch, the *functionality* commonly found in paid conversion themes for Shopify. Functionality, feature ideas, menu and settings hierarchies and short phrases are not protected by copyright; source code, stylesheets, scripts, the body of setting labels and help texts, demo copy and images are. Anvil therefore takes only the former.

## Process (dated, in git history)
1. `docs/SPEC.md` was written first (2026-10-14) by the spec author from public marketing pages and from observing storefront behaviour. It describes what a merchant configures and what a shopper sees, in the author's own words and with Anvil's own setting ids.
2. No file of any third-party theme or section library was opened while any Anvil code was written. Implementation agents receive only `docs/CONVENTIONS.md`, their spec card, the chassis API and `docs/FORBIDDEN.md`; their prompts are archived under `docs/agent-prompts/`.
3. Allowed sources while coding: shopify.dev, help.shopify.com, MDN, W3C/WAI, the public marketing pages of other products (feature names only). Forbidden: any theme repository or zip, including Shopify's own Dawn, Horizon and Skeleton (their licences restrict redistribution; Anvil must stay MIT).
   _Record note, 2026-10-14:_ the wave-0 cluster briefs were not archived verbatim when they ran; the fix-pass brief is archived as `docs/agent-prompts/2026-10-14-fix-pass.md`, and from wave 1 on each section's brief is archived with `scripts/agent-prompt.py <slug> --archive` when it is dispatched (DECISIONS 38).
4. `scripts/cleanroom-lint.sh` runs in CI and fails on the identifiers listed in `docs/FORBIDDEN.md`; `scripts/similarity.py` compares normalised code windows against public reference themes held only in the CI cache and must report zero shared windows; `scripts/asset-audit.py` rejects raster images and brand marks in `assets/`.

## Why it matters
A dated spec, a public history and a lint that proves independence are the record of independent creation. If anyone ever claims otherwise, this file and the commit log are the answer.
