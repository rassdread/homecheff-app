# Public experience closeout

Production proof was taken on homecheff.eu after the closeout commit was the live alias.

| Field | Value |
|---|---|
| STARTING_SHA | `fe6338f5e4944a409d3ab3700e6522360c34e6cc` |
| COMMIT_SHA | `9f35fc97b05ad3c28ac64e9493cf5097e31dee63` |
| DEPLOYMENT_ID | `dpl_3fwmruPmjNPBfpNzLokyWyXVBu3P` |
| DEPLOYED_SHA_MATCH | YES. GitHub status for `9f35fc97` is success on that deployment, and `vercel inspect https://homecheff.eu` returned the same id, target production, status Ready. |

This document is the audit of that deployment. It does not change routes or calculator behavior.

## Why the routes 404'd

Next.js does not treat a folder named `eten-verkopen-[stad]` as a prefix. That folder was a literal route for the URL `/eten-verkopen-[stad]`. `generateStaticParams` emitted `rotterdam`, `amsterdam`, `den-haag` and `utrecht`, and those params never matched a request for `/eten-verkopen-rotterdam`. The request fell through to `[seoSlug]`, which called `notFound()`.

The source of truth for the public URL is the hyphenated path: `sitemapXml.ts` already pushed `/eten-verkopen-${stad}`, and the old page metadata used the same path. The slash form `/eten-verkopen/rotterdam` is not the architecture. No redirect was added.

The repair is four literal routes that share one renderer, `lib/seo/etenVerkopenCityRoute.tsx`. The unreachable bracket folder was removed. There is no second content system.

| Field | Value |
|---|---|
| ETEN_VERKOPEN_ROOT_CAUSE | Literal folder `app/eten-verkopen-[stad]` never matched `/eten-verkopen-<stad>`. |
| ETEN_VERKOPEN_CANONICAL_ROUTE | `/eten-verkopen-<stad>` |
| ETEN_VERKOPEN_INTENDED_URLS | `/eten-verkopen-rotterdam`, `/eten-verkopen-amsterdam`, `/eten-verkopen-den-haag`, `/eten-verkopen-utrecht` |
| ETEN_VERKOPEN_ROUTE_IMPLEMENTATION | `app/eten-verkopen-<stad>/page.tsx` → `EtenVerkopenCityView` |
| ROTTERDAM | 200 |
| AMSTERDAM | 200 |
| DEN_HAAG | 200 |
| UTRECHT | 200 |
| ETEN_VERKOPEN_SITEMAP | Already included. `lib/seo/sitemapXml.ts` was not changed. Live `sitemap.xml` lists all four URLs plus the existing vanuit-huis pages. |
| ETEN_VERKOPEN_CANONICALS | `https://homecheff.eu/eten-verkopen-rotterdam/`, `https://homecheff.eu/eten-verkopen-amsterdam/`, `https://homecheff.eu/eten-verkopen-den-haag/`, `https://homecheff.eu/eten-verkopen-utrecht/` |

Production, 24 Sep 2026, each city, Dutch and English cookie:

- HTTP 200, `x-matched-path` is the city route, body is not "Page not found".
- Title and description are the city strings. Robots is `index, follow`.
- H1 is "Eten verkopen in {city}" or "Sell food in {city}" (Den Haag / The Hague).
- JSON-LD includes FAQPage and WebPage, plus the site-wide Organization / WebSite nodes.
- hreflang `nl-NL` and `en-US` both point at the same city URL. Language follows the cookie. That is the existing programmatic-landing behavior.
- Internal links include `/onboarding/seller`, `/geld-verdienen-met-koken`, `/thuisgekookt-eten-verkopen`, `/eten-verkopen-vanuit-huis`, `/growth`.
- Primary CTA "Begin met aanbieden" goes to `/onboarding/seller` and that page is not a soft 404. Checked on all four Dutch pages.
- Copy uses the city as the place. It does not state seller counts, neighbourhoods, demand, or trends.

The layout title template still appends `| HomeCheff`, so the visible title ends with HomeCheff twice. That template already existed. It was not changed here.

## Cooking earnings page

`app/geld-verdienen-met-koken/page.tsx` rendered `cookingEarningPage` and shadowed `app/[seoSlug]`. The rewritten copy in `lib/seo/homecheffSeoPages.data.ts` never ran.

The static folder was removed. The Dutch URL is now the `[seoSlug]` page. The English page stays on its own slug.

| Field | Value |
|---|---|
| GELD_VERDIENEN_ROOT_CAUSE | Static route shadowed `[seoSlug]`. |
| ACTIVE_ROUTE | `app/[seoSlug]` for `/geld-verdienen-met-koken`; `app/en/[seoSlug]` for `/en/earn-money-cooking-from-home` |
| OLD_STATIC_SOURCE | `app/geld-verdienen-met-koken/page.tsx` (`cookingEarningPage`) — removed |
| NEW_COPY_SOURCE | `lib/seo/homecheffSeoPages.data.ts` id `geld-koken` |
| WHY_NEW_COPY_NOT_RENDERED | The static page won the route. |
| GELD_VERDIENEN_CANONICAL_SOURCE | `[seoSlug]` / `HomecheffSeoLanding` |
| STALE_STATIC_PAGE_REMOVED_OR_BYPASSED | Removed |
| GROEIT_IN_2026_REMOVED | YES |
| GELD_VERDIENEN_SEO | 200. Title `Geld verdienen met koken \| Start als thuiskok \| HomeCheff`. Canonical `https://homecheff.eu/geld-verdienen-met-koken/`. Robots `index, follow`. H1 `Geld verdienen met koken vanuit huis`. hreflang nl-NL that URL, en-US `https://homecheff.eu/en/earn-money-cooking-from-home/`. |

Production Dutch body contains "Een vast bedrag kan niemand je beloven." It does not contain "groeit in 2026" or "win je op smaak, versheid en vertrouwen". Primary CTA "Start met verkopen" opens `/sell`.

The English slug returns 200 with H1 "Earn money cooking from home" and "Nobody can promise you a fixed amount." The Dutch URL stays Dutch when the language cookie is English. That is how every `[seoSlug]` page works. The old static page had translated in place; retiring it restores the slug split.

The 2026 heading lived in `seoPhase2ClusterSources.ts` (`sec5Title`) and `seoLandingSources.ts` (`authorityLocal2026Title`). Both visible strings are now "Waarom mensen dichter bij huis willen kopen" / "Why people want to buy closer to home". The key name `authorityLocal2026Title` was left so call sites did not need a rename. No replacement growth claim was added.

## Affiliate calculator

| Field | Value |
|---|---|
| CANONICAL_AFFILIATE_ENGINE | `allocateMarketplaceAffiliatePool` in `lib/marketplace-affiliate-pool.ts`. Pool is `floor(platformFeeCents * 50 / 100)`. One qualifying affiliate receives the whole pool. Two different affiliates: buyer `floor(pool / 2)`, seller the remainder. Growth subscriptions use `growthV2AffiliateCommissionCents` with `affiliateCapacityHc`. |
| CALCULATOR_ENGINE | `lib/earn/passive-income-scenario.ts`, called by `app/affiliate/passive-income-calculator/page.tsx`. `app/aviliate/passive-income-calculator/page.tsx` re-exports that page. |
| CALCULATOR_ROOT_CAUSE | The page hardcoded `transactionCommissionPct = 0.25` and `affiliateCommissionPct = 0.5` of a typed subscription price, and used a 4% business fee. |
| ROOT_CAUSE_CALCULATOR_DRIFT | Same hardcoded rates, not the pool allocator. |
| SINGLE_AFFILIATE_RULE | Viewer is the only affiliate and receives the entire pool, which is already capped at 50% of the platform fee. |
| TWO_AFFILIATE_RULE | Viewer is the seller-side affiliate and receives the remainder after `floor(pool / 2)` goes to the other affiliate. |
| SHARED_CALCULATION | YES. Order shares call `allocateMarketplaceAffiliatePool`. Subscription shares call `growthV2AffiliateCommissionCents`. |
| ODD_CENT_ROUNDING | Sale €11.25, 12% fee → fee 135 cents, pool 67. One affiliate receives 67. Two affiliates: other 33, viewer 34. The page data attributes match that split. |
| CALCULATOR_COPY | "Ben jij de enige affiliate op een bestelling, dan kun je de hele pool krijgen: maximaal 50% van de platformfee. Zijn er twee verschillende affiliates, dan krijgt ieder de helft van die pool. Zonder affiliate is de commissie €0. Dit is een scenario, geen belofte dat elke referral het maximum oplevert." |

`customerEntitlementHc` is not used. Starter affiliate capacity is 750 HC. The unit fixture expects 1575 cents (€15.75) on the €39 ex-VAT starter price, and rejects the figure that would come from the 2500 customer HC. Historic ledger rows are not recomputed.

Individual fee is 12%. Business orders use the Pro fee, 7%, not the old 4%.

### Production calculator

Page: `https://homecheff.eu/affiliate/passive-income-calculator`. Plan left on starter. Readout is `[data-hc-order-example]`.

| Case | INPUT | PLATFORM_FEE | AFFILIATE_COUNT | AVAILABLE_POOL | CALCULATED_COMMISSION | EXPECTED_CANONICAL_COMMISSION |
|---|---|---|---|---|---|---|
| single | sale €100.00 | 1200 | 1 | 600 | 600 | 600 |
| two | sale €100.00 | 1200 | 2 | 600 | 300 | 300 |
| none | sale €100.00 | 1200 | 0 | 600 | 0 | 0 |
| odd, single | sale €11.25 | 135 | 1 | 67 | 67 | 67 |
| odd, two | sale €11.25 | 135 | 2 | 67 | 34 | 34 (other 33) |
| cap, single | sale €15.00, fee exactly 180 cents | 180 | 1 | 90 | 90 | 90 (50% of the fee) |
| cap, two | sale €15.00 | 180 | 2 | 90 | 45 | 45 |

| Field | Value |
|---|---|
| PRODUCTION_SINGLE_AFFILIATE | €100 sale → fee €12.00, pool €6.00, yours €6.00 |
| PRODUCTION_TWO_AFFILIATE | same sale → pool €6.00, yours €3.00 |
| CALCULATOR_MATCHES_ENGINE | YES |

Month 1 of the default projection, still on the single-affiliate scenario, shows subscription €31.50. That is 2 × €15.75, the starter residual. It is not half of €39 and not half of €47. The same row shows business €140.00 (2 businesses × 20 × €3.50, the 7% Pro pool) and sellers €300.00 (10 × 5 × €6.00).

## Regression

| Field | Value |
|---|---|
| HEADER_REGRESSION | NO. Logged-out 1280×900: Home, Werken bij, Verkoop of deel, language, Inloggen, Aanmelden, all hit, row 1216/1216. Logged-in 1280×900: Dashboard, Berichten, Reputatie, no overflow. 390×844: Inloggen and Aanmelden logged out; Menu logged in. 844×390 uses the work bar (`scrollWidth` 0 on `[data-wx-navbar-row]`), same as the first-pass certification. |
| HERO_REGRESSION | NO. NL and EN open from the keyboard, trap focus, Escape returns focus, explore goes to `/werken-bij` or `/careers`, start opens the create dialog. Overflow 0 at 1280 and 390. At 844×390 the trigger is absent because the work bar replaces that header. |
| LOCALE_REGRESSION | NO. City pages follow the language cookie on the same URL. `/geld-verdienen-met-koken` stays Dutch; English is `/en/earn-money-cooking-from-home`. |
| SEO_REGRESSION | NO. The four city URLs were already in the sitemap and are now reachable. Canonicals and robots are indexable. No new sitemap entries. |
| DESKTOP | 1280×900. Overflow 0 on Rotterdam, the cooking page, and the calculator. City CTA 50×201, hit after the cookie bar is out of the way, navigates to `/onboarding/seller`. |
| MOBILE_390 | 390×844. Overflow 0. City CTA 48×201, hit, navigates. Calculator scenario control hit. |
| LANDSCAPE | 844×390. Overflow 0. City CTA navigates. Until cookies are dismissed, the cookie bar covers the CTA in the short viewport. After dismiss, the CTA itself is the hit target. |
| ZOOM_200 | Reflow viewport 640×450 (200% of 1280×900). Overflow 0. City CTA navigates. CSS zoom 200% on a 1280 viewport also reported overflow 0; the CTA box scaled to height 100. |
| AFFILIATE_TESTS | `lib/earn/passive-income-scenario.test.ts` with the marketplace pool tests: 28/28 pass before the commit. |
| EARN_TESTS | Included in that run (`earn-how-it-works` and the scenario fixtures). Pass. |
| PHASE11B | Pre-existing. The prior certification recorded the same five failing lines on old and new code (`IDENTICAL_FAILS`). This closeout did not treat that as a regression. The validator's own section still reports checkout stock reservation and admin order cancel / payment_intent, then chains into later validators. Those are not the 25% calculator defect. |
| PHASE11C | Hang, same baseline as the previous certification. Not a regression from this phase. |
| BUILD | Pass (`npm run build` exit 0) before the commit. Lint exit 0 with the existing service-worker warning. `smoke-check` pass. `validate-legal-0-integrity` pass after the route allowlist update. |
| NEW_REGRESSIONS | None observed. |
| P0_REMAINING | None |
| P1_REMAINING | None from this closeout. The three certified P1s are closed on production. |
| P2_REMAINING | Visible titles that already include "HomeCheff" get a second "HomeCheff" from the root title template. The two-affiliate sentence says "de helft"; on an odd pool the engine gives the extra cent to the seller side, and the readout shows that cent. |

## Decision

HOMECHEFF_PUBLIC_EXPERIENCE_CLOSEOUT_PRODUCTION_CERTIFIED

The four city URLs, `/geld-verdienen-met-koken`, and the passive-income calculator were opened on homecheff.eu on deployment `dpl_3fwmruPmjNPBfpNzLokyWyXVBu3P`.
