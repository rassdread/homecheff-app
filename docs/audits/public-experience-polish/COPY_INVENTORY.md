# Public copy inventory (input for the second pass)

This inventory was read-only and changed no files. It is the input for the human-copy second pass. Dash counts are the number of lines containing an em dash (`rg -c "—"`), measured on 2026-09-23.

## Where visible copy lives

| Route family | Copy source | Title/meta/canonical | JSON-LD |
|---|---|---|---|
| `/` | `public/i18n/*.json` `home.*`, `homePhase1.*`, `homeValueExplainer.*`, `guestSalesPanels.*`; strip `components/adaptive-workspace/WorkspaceOrientationStrip.tsx` | `app/page.tsx` | root layout + `home.schema*` (do not humanize) |
| `/[seoSlug]`, `/en/[seoSlug]` | `lib/seo/homecheffSeoPages.data.ts` (128 dash lines) rendered by `components/seo/HomecheffSeoLanding.tsx` | `generateMetadata` from `page.nl/en.title/description`, `getSeoCanonicalUrl` | WebPage + Article in `HomecheffSeoLanding` |
| Programmatic landings (12 namespaces: bijverdienen, eten-verkopen-vanuit-huis, thuisgekookt, zelfgemaakt, lokaal-eten, lokale-producten, unieke-producten, dropshipping, bezorger-worden, …) | `lib/i18n/seoLandingSources.ts` (69), `lib/i18n/seoPhase2ClusterSources.ts` (62), blocks `lib/seo/seoLandingBlocks.ts` | `buildProgrammaticLandingMetadata` (`metaTitle`/`metaDescription` keys) | FAQPage + WebPage + Breadcrumb in `components/seo/SeoLandingTemplate.tsx` |
| `/eten-verkopen-[stad]` (4 cities) | `etenVerkopenCityPage` in `seoPhase2ClusterSources.ts`; only `{{city}}` varies | template metadata with `{{city}}` | template |
| `/maaltijden/[stad]` | hardcoded NL lede in `app/maaltijden/[stad]/page.tsx`; cities `lib/seo/localCities.ts` | inline `generateMetadata` | Collection LD in page |
| Pillars (`/wat-is-homecheff`, `/lokaal-verdienen`, `/wat-we-niet-zijn`, …) | `lib/i18n/pillarPageSources.ts`, shared `pillarSharedFaq` | `buildPillarLandingMetadata` | via template |
| `/hoe-homecheff-werkt` | `lib/i18n/ecosystemMapSources.ts`, `lib/seo/ecosystem-map-blocks.ts` | `buildAuthorityPageMetadata` | Authority template |
| `/werken-bij`, `/careers`, `hoe-werkt-het`, `vacatures` | `lib/i18n/verdienHubSources.ts`, `earnHowItWorksSources.ts` | page metadata | — |
| `/waarom-homecheff`, origin/founder | `lib/i18n/founderOriginSources.ts` | template | template |
| `/affiliate` | hardcoded FAQ/meta in `app/affiliate/page.tsx` + i18n `affiliate.*` | `generateMetadata` | affiliate structured data helpers |
| `/verdiencheck` | `lib/verdiencheck/i18n/copy.ts` (certified; keep fiscal precision) | `lib/verdiencheck/public-seo.ts` | — |
| `/faq` | i18n `faq.*` | page | FAQ schema must match visible answers |
| `/over-ons` | i18n `overOns` / `whoWeAre*` | page | — |

## Doorway / template risks

1. **`HomecheffSeoLanding` (high).**
   - 40 pages share the same four H2s: "Hoe HomeCheff werkt", "Voor wie is dit interessant?", "Waarom lokaal…" and "Wat je kunt ontdekken".
   - The `maaltijden-in-*` variants only swap the city name.
   - Fix: give each page its own section structure in the data file, not in the component.
2. **`/eten-verkopen-[stad]` (high).** One string bank is used for all 4 cities; the thesis is identical and only the city is interpolated. Fix: add real per-city facts, or collapse the pages into one page with city sections.
3. **`/maaltijden/[stad]` (medium).** The same lede appears on every city URL.
4. **Programmatic landings (medium).**
   - The same authority blocks and `seoSharedFaq` appear on most pages.
   - Recurring phrases: "zonder webshop", "anonieme massa", "korte ketens".

## Highest-priority AI-style passages (traffic order)

1. `home.heroEyebrow`, `home.heroSubtitle` ("Van inspiratie tot het dorpsplein…"), `home.whoWeAre3` ("Of je nu kookt, kweekt, ontwerpt…"), `bottomNav.earnMoneyDesc` ("Van keuken tot tuin, van atelier tot marktplaats"; EN "From kitchen to garden…").
2. `homecheffSeoPages.data.ts`:
   - "Of je nu één avond wilt ontdekken of vaker…"
   - "van comfortfood tot gezonde schotels"
   - EN "Whether you want to try once…"
   - "van Scheveningen tot Bezuidenhout"
   - the fragment "Extra startpunt: /maaltijden/den-haag — …"
3. `seoLandingSources` authority keys ("niet als modegrap…", "dat is je echte concurrentievoordeel"); `seoSharedFaq.faq4A` ("Soms wel, soms niet — …"), `faq6A`; `homeEarningPage.metaDescription` (meta: only change if the visible intent is kept).
4. `etenVerkopenCityPage.intro` / `sec3Body` ("distributie-engine").
5. `ecosystemMapPage` intro ("Eén platform verbindt… — met echte mensen"); `pillarSharedFaq.faq1A`.
6. `affiliate.audiencesSubtitle` ("Niet alleen voor influencers… — juist ook…"); EN `howSubtitle` ("From first link to weekly payouts — …").
7. `verdienHub.noIncomePromise` (legal disclaimer glued with a dash; keep the meaning exactly); `deliverySignup.subtitle` (promo tone around the age band; keep the 18+ precision).
8. Programmatic step titles "Stappenplan" and "Veelgemaakte fouten" repeated across 12 pages; `faq.*` long multi-clause answers.

## Rewrite order and guardrails

1. Remaining homepage keys (`home.*`).
2. Shared SEO template data (`homecheffSeoPages.data.ts`, city templates).
3. Programmatic shared blocks and FAQ.
4. Verdien, affiliate and how-it-works pages.
5. FAQ and over-ons long-form copy.

Guardrails:

- Before editing any page, snapshot it with `scripts/probe-seo-snapshot.mjs` (title, meta, robots, canonical, H1/H2, JSON-LD hash).
- Keep metadata keys and JSON-LD shapes. FAQ schema text must stay identical to the visible answer.
- Legal and fiscal wording (tax, toeslagen, NVWA, KVK, VAT, DAC7, payments, age, privacy) changes only in voice, never in meaning.
