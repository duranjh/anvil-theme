# Implementation prompts — manifest

Every section built in the section-library waves received exactly the prompt produced by `python3 scripts/agent-prompt.py <slug> --strict` at commit `11ec30c`. The prompts are reproducible from git, so only their SHA-256 hashes are committed (each prompt is about 100 KB, mostly shared documents). To verify one:

```bash
git checkout 11ec30c && python3 scripts/agent-prompt.py anvil-ticker --strict | shasum -a 256
```

| Section | SHA-256 | Bytes |
|---|---|---|
| `anvil-audio` | `bc0d5d0d0328346cdf6811cb0e391ffaf23dd3ee001c07e217598e5097dbf886` | 100049 |
| `anvil-before-after` | `ed482421321b0937369e5ccd89ee18a87914be298621eaae116269460f515dd2` | 100195 |
| `anvil-bundle` | `ff0720f077a1ae0fff9c343d24ff47f487f08c080c4391bb84ac282b51bd40a1` | 100125 |
| `anvil-collage` | `171ae22ca402fd40a4f6108079acab1488a9fff0adbe1f2268fc616ec5a50f7d` | 99055 |
| `anvil-collapsible` | `e45b16529d5417228429149bb19f2ea0af28343a25ae676bc025b5b256b8c559` | 99147 |
| `anvil-collection-list` | `71ce3e476114833172afc946cda4b90f94f39a41914e11f2b3d9d78a2f9d6b3d` | 99095 |
| `anvil-columns` | `28056877273f97947803117c1a0fe3fc615f92a5f44b62e237e3d0b03c34b717` | 100083 |
| `anvil-compare-table` | `caefba6127b170ad47d6119d464ac29638215f554ba696fa2583a65a37f585b7` | 100492 |
| `anvil-custom-liquid` | `55500f4b4a14862b2dd5695dd715906aefff55a43292c7cb13c410b0bd7b7c2e` | 98986 |
| `anvil-divider` | `81620583e3f2b067ff6f45294257729a582dd44c1b755bf41cca8c9d262e1f50` | 99993 |
| `anvil-feature-grid` | `a75c34c3d18d54e46920e880dcc0fea26167d5d5e1fc5ed2669a6c5128e7a07d` | 100128 |
| `anvil-featured-collection` | `3b95ca0ffaee381b69465bc9008c9778a33babb395ba6439382552464193169b` | 99255 |
| `anvil-group` | `08a1693b5b43dac1c08d12e3877988686982c707157093df51011d3777b57975` | 99951 |
| `anvil-guarantees` | `b475e2864b1b21a57a3719733e014697767497f9dbb27e768e092ef2b159ceee` | 100069 |
| `anvil-hero-parallax` | `c1df3652408492f70715f7b1fe0393a5ba69265765c13f8d78c15b2ddc820c08` | 100246 |
| `anvil-hero-slideshow` | `cbdf13747a52589cadd1dfba242825733a00b437db14206f43b51322e8dfba9b` | 100199 |
| `anvil-hotspots` | `d670d2671b026c0fbc20c151209a6254a9e52e743707e54c560db1c656ab5cda` | 100189 |
| `anvil-icon-content` | `8f8dd33689e6fbe6fa59c8567e3d1653d54bce620e5fa84d1778bc3a49653830` | 100154 |
| `anvil-image-banner` | `bd2194f16a991a60d36f99213e948325d2fdb734f5a0ffa82371d241119ccd88` | 99736 |
| `anvil-image-gallery` | `2c4be0960f7469354c94411790bf996f9ff18709a67d436dbfcc07ff87945ac3` | 100174 |
| `anvil-image-marquee` | `2e153855e82848e85947e1bb4a1e0b3c6da75c19ad04787eed975d57ca52186a` | 100162 |
| `anvil-image-text` | `e7fa1a0fec6abf81b8d068ff3c6bc7b0bc6146ec11b081b11206d761a49a7817` | 99451 |
| `anvil-logo-list` | `30243bcaf8aa6161091e05cd33e78daeda9b676f64c95e7df27239eb037fe986` | 100060 |
| `anvil-media-slider` | `65ecaefaca15cdac9cf6f691ad1e13dc8f83a78f14598fd56b0b27f4a1eaa767` | 100142 |
| `anvil-multicolumn` | `81e0262f16bedaeb9e04185f10cdd0677634763f2979bb638084edaac96e568d` | 99125 |
| `anvil-multirow` | `487587b8f7b087004e8239c7a8678ff7727e0a151381af822cb888b7c0fa5cdb` | 98942 |
| `anvil-newsletter` | `7bb366f420cef5c527c11f38b9379f36380bec7e1d539ef646bdf9d45a65a59c` | 99300 |
| `anvil-palette-preview` | `02dedd5275954421f4edff413e1753bfc87d61849488c610867ccc88682f22dd` | 100226 |
| `anvil-popup` | `af0bb9ff7a438b45fc5285719b9e22d4d476f9d6a7b6b193d5c2be7a0547c2a1` | 100253 |
| `anvil-pricing` | `73bb86f400c7eacc4e21ca4ecfb8a07bb4ed3aca6c2042458bce7c1aaffd3f89` | 100062 |
| `anvil-product-videos` | `44cb4bdf9016c9b573e0dab41a28355d2abcdd2d142fdd35dcbcb2611c4c6187` | 100274 |
| `anvil-related-products` | `ee8ac54b5a58e53ef82ea6042d35201ef94660f968d16174185b6c0a9d58d6f9` | 99538 |
| `anvil-review-wall` | `dfdc115679f2d593c1627b22f0896f183cc5812ea174711ab14b71e7619e7fa4` | 100356 |
| `anvil-rich-text` | `4e2a6ab229dacaa1a28ead6fb22e83f97ea07ff7bb3c61ce81c59619f55e8461` | 99194 |
| `anvil-scroll-top` | `67415567a67d5f64f129f24a340316d5319d8821266a78702c57cb024c9e95c8` | 100062 |
| `anvil-shoppable-image` | `c97ee4a7629eceb0aa9848854b395ed3892b39043a7077b57c9ba2ae606a8ef9` | 100273 |
| `anvil-social-cards` | `20793735ab4da5d80741fac8734503485e865b50b2c0439f121a93cd37d3ba29` | 100263 |
| `anvil-stats` | `60c5555cc8eb2cab0137365192d5a3fa5fb5dfef0ec830e4441721a879bcd723` | 100016 |
| `anvil-stories` | `e7ad56a05b5e5977b040f62ba4eefb2d3da6e2726521e48b1ac63255bf00687b` | 100155 |
| `anvil-tabs` | `7848675ebaa47b26a7353a77255b84e54a726b600bba1a815940842d8beb1fde` | 100000 |
| `anvil-testimonials` | `2cc1030e15346d2bca7fc4b6fa0194666e2de17af75662803f272ff1d9aaf913` | 100266 |
| `anvil-ticker-vertical` | `93170f5ddd6198cbc3e05a1dad2ab60dac863b714d2253cb215f97d0544c0667` | 100207 |
| `anvil-ticker` | `657a9eee6f806a44d2cf20cf9c1b96ef41d51d0fa13b14ed489d2f04982e4d7f` | 100286 |
| `anvil-timeline` | `876c327b1e05cd3f82dd2fd768c7e4489828d876b4713964cd197307527210d2` | 100070 |
| `anvil-track-order` | `bfa17f28eedea71e8a62ece2c4c813fcf348e2a184247ee76fddd935f39f19c0` | 100279 |
| `anvil-video` | `a8d810f62829322af93fbfbde43e706c2405c125ea5f4f35ac2f391260fb505f` | 99225 |
