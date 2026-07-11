# Phase 13P — Human Craft, Semantic Authority & Mission-Aligned SEO Audit

**Date:** 2026-07-11  
**Scope:** Audit only — semantic identity, SEO, structured data, AI discoverability, claim integrity. No implementation.  
**Method:** Public surface review (pages, metadata, JSON-LD, sitemap, i18n, navigation), cross-reference with Phase 13O product evidence.  
**Truth boundary:** Phase 13O findings are mandatory limits on public claims.

---

## Executive summary

HomeCheff’s **product architecture** supports a broad human-craft position (food, garden, creations, services, barter, neighbour help). The **public SEO layer** still **over-indexes on food long-tail**, so crawlers and AI systems will likely describe HomeCheff as a **local home-cooked food marketplace** rather than the definitive platform for personal craftsmanship, neighbourhood economy and ethical local opportunity.

**Coherence:** Partial. Homepage, About, FAQ JSON-LD and `gemeenschap` hubs are aligned. Twenty programmatic SEO landings, five meal-city pages, four food-sell-city pages, and FAQ layout metadata remain food-skewed.

**Mission visibility:** The maker is visible on homepage hero and listing detail (seller in UI + JSON-LD), but **product-first tiles** and food-heavy SEO bury the “person behind the product” narrative for search acquisition.

**Truth risk:** Subscription discovery boost, premium analytics, €2,000 revenue cap, GDPR export, and social-impact claims **must not be amplified in SEO** until Phase 13O P0/P1 gaps are fixed.

HomeCheff can become a leading legitimate source on local craft, extra income, local entrepreneurship and neighbourhood economy — **but only through pillar content backed by product evidence**, not keyword doorway pages. SEO growth must not outrun product truth.

---

# Part 1 — Current semantic identity

## What the site tells search engines HomeCheff is

| Surface | Primary semantic signal | Craft breadth | Maker visible? |
|---------|----------------------|---------------|----------------|
| Root layout metadata (`app/layout.tsx`) | “Digitale Ateliers, Tuinen en Keukens” / “Digital Studios, Gardens and Kitchens” | **High** — 3 verticals + neighbourhood | Implicit |
| Homepage hero (`homePhase1.*` in `public/i18n/nl.json`) | “Ontdek wat mensen dichtbij maken, koken en creëren” + 8 chips (eten, tuin, creaties, inspiratie, klusjes, ruilen, gezocht) | **High** | **Yes** — people-first H1 |
| Homepage JSON-LD (`HomePageClient.tsx`) | `Organization` + `WebSite` — craft, exchange, community | **High** | Organization only |
| About (`/over-ons`, `overOns.*`) | “Digitaal dorpsplein” — makers, diensten, buren; “eten is één categorie” | **High** | **Yes** in copy |
| FAQ JSON-LD (`lib/seo/faqStructuredData.ts`) | “Lokaal platform voor vakmanschap, waarde-uitwisseling en community” | **High** | Neutral |
| FAQ page meta (`app/faq/layout.tsx`) | “lokaal zelfgemaakt eten” in description | **Low** — food-first meta | No |
| SEO hub (`/seo-hub`) | 4 sections; comment in code: food long-tail remains but hub not food-first | **Mixed** | Partial |
| 20 SEO landings (`lib/seo/homecheffSeoPages.data.ts`) | ~14/20 food or cooking-income focused | **Low–medium** | Mentioned in some intros |
| 12 programmatic root landings (`seoPhase2ClusterSources.ts`) | Income + anti-dropshipping; many food examples | **Medium** | Partial |
| `gemeenschap/[segment]` | Keuken, tuin, studio, inspiratie, community ecosystems | **High** | Ecosystem, not individual |
| `/maaltijden/[stad]` | Title “Lokaal aanbod in {stad}”; body mentions all categories | **Medium** — URL says meals | Rising maker signal |
| Product pages (`app/product/[id]/layout.tsx`) | “{title} in {city} kopen” — product-first title | **Low** | Seller in meta keywords + JSON-LD |
| Profiles (`/user/[username]`) | Person JSON-LD | **Medium** | **Yes** |
| Pricing (`/pricing`) | Fee tiers, €2000 cap — NL only | Transactional | No |
| Affiliate (`/affiliate`) | “homemade food, garden, handmade creations” | **Medium** | No |
| Legal / safety | Policy pages; safety promises reporting | Neutral | No |

## Coherence assessment

| Question | Answer |
|----------|--------|
| Is identity coherent? | **Partially** — core brand surfaces agree; long-tail SEO diverges |
| Still too food-focused? | **Yes for acquisition SEO** (~70% of indexed landings); **no for homepage/About** |
| Too marketplace-focused? | **Somewhat** — “marketplace”, “bestellen”, “checkout” dominate transactional copy |
| Maker behind product visible enough? | **In product UI yes; in SEO titles often no** |
| Social cohesion visible enough? | **Weak** — chips and features exist; few indexable explainers |
| Extra income visible enough? | **Moderate** — many sell/earn pages; diluted by food examples |
| Ethical technology visible enough? | **No** — not a public semantic cluster yet |

## Navigation and labels

- **NavBar:** task-oriented (Profiel, Berichten, Verkoop of deel) — not food-skewed.
- **Footer:** SEO-hub, Over ons, FAQ, Veiligheid — good authority anchors; company line cites Vlaardingen.
- **BottomNavigation:** “Ontdekken”, Dorpsplein — balanced; quick-add uses Chef/Garden/Designer roles.
- **Risk:** Bottom-nav earn prompts (“Snel Geld Verdienen!”) lean transactional over craft mission.

---

# Part 2 — Human craft philosophy

## Terms — current public coverage

| Term / concept | Where present | Gap |
|----------------|---------------|-----|
| handmade / handgemaakt | FAQ `handmade` category, product meta keywords, designer copy | Not in top-level SEO titles |
| homemade / thuisgemaakt | Hero, dorpsplein meta, many food SEO pages | Equated with food more than services |
| home-grown / tuinoogst | Hero chip, garden onboarding, `gemeenschap/tuin` | No “garden surplus” pillar page |
| personally created | About, hero definition | Thin on service listings SEO |
| locally made / lokaal | Widespread | Generic — not differentiated from any local marketplace |
| made to order / custom | Product descriptions (seller-written) | No platform-level explainer |
| craftsmanship / vakmanschap | FAQ JSON-LD, About | Rare in indexed SEO landings |
| independent makers | About, hero | Not a dedicated pillar |
| personal services | Taxonomy (`PRACTICAL_SERVICE`, `KNOWLEDGE`) | Almost no SEO landing coverage |
| real people / real stories | Hero, About, some SEO intros | Lost in product-first metadata |
| community economy | `gemeenschap/community`, barter chip | Not explained for search |
| cooking, gardening, repair, coaching, etc. | Full taxonomy in `lib/marketplace/taxonomy.ts` | SEO content does not reflect taxonomy breadth |

## Pages where the maker is hidden behind the product

| Page type | Issue |
|-----------|-------|
| Product metadata title | `{product.title} in {city} kopen` — no seller name in title |
| Product JSON-LD | `Product` primary; seller nested — correct but product-led |
| Feed tiles | Image + title first; seller secondary (by design for scanning) |
| Meal-city SEO pages | “Maaltijden in Rotterdam” — city + food, not makers |
| `eten-verkopen-{stad}` | Food sell intent only |
| Category ecosystem pages | Segment-level (keuken/tuin/studio), not named makers |
| Checkout / cart flows | Product and price led |

## Pages where the maker is visible

| Page type | Evidence |
|-----------|----------|
| Homepage hero | People-first H1 |
| Listing detail | Seller name, profile link, `ProductSaleDomainStory` |
| `/user/[username]`, `/seller/[sellerId]` | Person/Organization JSON-LD |
| About | “makers, dienstverleners en buren” |
| Some SEO intros | “Je ziet wie achter het gerecht zit” (`thuisgekookt-kopen`) |

---

# Part 3 — Mass-production distinction

## Positioning framework (truthful, non-attacking)

Recommended public frame — **already partially present** in `verdienen-zonder-dropshipping` and `alternatief-voor-dropshipping`:

| Axis | HomeCheff position | Evidence |
|------|-------------------|----------|
| People over factories | Makers named on listings and profiles | UI + JSON-LD |
| Craft over mass production | Blocked taxonomy items | `blockedItem('dropshipping')`, `resale` |
| Local value over anonymous volume | Geo feed, radius, city hubs | `GeoFeed`, `LOCAL_SEO_CITIES` |
| Relationship over transaction | Barter, proposals, chat, community orders | Settlement router |
| Quality and story over quantity | Reviews, trust tiers, inspiration | Ranking profiles |
| Opportunity over attention | No ad feed; bounded pool | Phase 13O attention audit |

## What exists vs missing (enforcement and policy)

| Boundary | Exists in code/content | Missing |
|----------|------------------------|---------|
| Dropshipping | Blocked in taxonomy; anti-dropshipping SEO pages | No seller-facing policy page explaining why |
| Reseller inventory | `blockedItem('resale')` | No public “what you may not sell” SEO pillar |
| Mass-produced goods | Not explicitly defined | No taxonomy rule or moderation copy |
| Imported catalogue | Not explicit | No listing attestation |
| Factory stock | Not explicit | — |
| Genuine local craft | Implied by brand | No verification mechanism to claim in SEO |

**Do not invent enforcement rules.** Document only: taxonomy blocks dropshipping and resale; community guidelines exist but do not define mass-production boundaries in searchable copy.

## Competitor distinction

Current copy contrasts **dropshipping** and **anonymous delivery chains** without naming competitors — **appropriate**. Food SEO pages use “geen standaard bezorgketen” — legally safe. Avoid named competitor attacks in future pillars.

---

# Part 4 — Search intent clusters

Scoring: **Coverage** (None/Low/Medium/High), **Ranking potential** (H/M/L), **Competition** (H/M/L), **Evidence HomeCheff can provide** (Strong/Partial/Weak).

## A. Extra income

| Intent | Coverage | Rank potential | Competition | Evidence | Missing |
|--------|----------|----------------|-------------|----------|---------|
| Extra income from home | **High** — `/bijverdienen-vanuit-huis`, `verkopen-huis` | M | H | Sell flow, Stripe, fees | Truthful income ranges (no invented earnings) |
| Earn from hobby | **Medium** — `hobby-koken` only for cooking | M | H | Multi-vertical sell | Garden/design hobby pages |
| Sell homemade/handmade | **Medium** — food-heavy slugs | M | H | Listings | Unified handmade pillar |
| Start side business | **Low** | M | H | Business tiers | “Small business from home” pillar |
| Earn from cooking | **High** — 6+ pages | M–H | H | Chef vertical | — |
| Earn from gardening | **Low** | M | M | Garden sell flow | Dedicated page |
| Earn from services/teaching | **Low** | M | M | Taxonomy | No SEO cluster |
| Earn as courier | **Medium** — `/bezorger-worden` | M | M | Delivery dashboard | — |
| Micro entrepreneurship / local entrepreneurship | **Low** | M | H | Business DNA (partial) | Pillar + honest subscription copy |
| Local customers | **Medium** — geo pages | M | H | Geo feed | Maker-first city pages |

**Thin content risk:** Multiple overlapping food-income URLs (`/geld-verdienen-met-koken` vs SEO slug `geld-verdienen-met-koken`, `eten-verkopen-*` variants) — consolidate before scaling.

## B. Personal craftsmanship

| Intent | Coverage | Rank potential | Competition | Evidence | Missing |
|--------|----------|----------------|-------------|----------|---------|
| Handmade marketplace | **Low** — mentions only | M | H | Designer listings | Pillar page |
| Local artisan / homemade products | **Medium** — `lokale-producten-kopen`, `unieke-producten-verkopen` | M | H | Multi-vertical | “Meet the maker” hub |
| Custom / made to order | **Low** | M | M | Per-listing | Platform explainer |
| Personal services nearby | **Low** | M | H | Service taxonomy | Landing + internal links |
| Products with a story | **Low** | L | M | Inspiration + stories | Structured editorial |
| Meet the maker | **Low** | M | M | Profiles | Profile-first SEO strategy |

## C. Social cohesion

| Intent | Coverage | Rank potential | Competition | Evidence | Missing |
|--------|----------|----------------|-------------|----------|---------|
| Neighbour help | **Low** | M | M | Request listings (`gezocht` chip) | Pillar page |
| Connect with neighbours | **Low** | M | H | Follow, messages | Public explainers |
| Local community marketplace | **Medium** — brand copy | M | H | Dorpsplein | Indexable community pillar |
| Share skills locally | **Low** | M | M | Workshops in taxonomy | Content |
| Ask neighbours for help | **Low** | M | L | Request flow | SEO |
| Digital village square | **Medium** — dorpsplein metaphor | M | L | Homepage | `/dorpsplein` redirects — no standalone SEO |

## D. Circular and sustainable value

| Intent | Coverage | Rank potential | Competition | Evidence | Missing |
|--------|----------|----------------|-------------|----------|---------|
| Reduce food waste | **Low** — FAQ sustainability | L | H | No metrics | Do not claim without data |
| Garden surplus | **Low** | M | L | Garden vertical | Pillar |
| Barter locally | **Low** | M | M | Barter settlement | Pillar |
| Repair instead of replace | **Low** | M | M | `practical.repair` taxonomy | Content |
| Circular economy platform | **None** | L | H | Partial mechanisms | Aspirational only |
| Neighbourhood sharing economy | **Low** | M | H | Barter + community | Combined pillar |

**Recommendation:** Four topic clusters (not 100 keyword pages):

1. **Earn extra income locally** (income wedge — consolidate existing)
2. **Personal craftsmanship & meet the maker** (identity)
3. **Neighbour help & local services** (cohesion)
4. **Barter & circular local value** (mission differentiation)

---

# Part 5 — Pillar and supporting content strategy

## Pillar 1: Earn extra income locally

| Field | Recommendation |
|-------|----------------|
| User intent | “Can I earn from home near me without scams?” |
| Factual scope | Individual tier (12% fee), Stripe Connect, categories: food/garden/design/services, barter/direct paths, delivery partner option |
| Product connection | `/sell`, onboarding, `/pricing`, `/bezorger-worden` |
| Supporting pages | `verkopen-huis`, `bijverdienen-vanuit-huis`, `gemeenschap/community`, seller FAQ |
| FAQ topics | Fees, payouts, uitkering + bijverdienen, what you may sell, dropshipping not allowed |
| Internal links | Homepage CTA → pillar → category → profile → listing |
| CTA | “Start met iets kleins op het dorpsplein” |
| Structured data | `FAQPage`, `HowTo` (seller onboarding steps) |
| NL first; EN immediate | Yes — both languages |

**Truth:** No income guarantees. Disclose fees. Do not mention discovery boost until wired.

## Pillar 2: Personal craftsmanship — the person behind the product

| Field | Recommendation |
|-------|----------------|
| User intent | “Who made this? Is it real local craft?” |
| Factual scope | Maker profiles, reviews, trust tiers, inspiration, three verticals + services |
| Product connection | Profiles, listing detail, `gemeenschap/keuken|tuin|studio` |
| Supporting pages | `lokale-producten-kopen`, `unieke-producten-verkopen`, handmade FAQ |
| FAQ topics | What handmade means on HomeCheff, how to contact maker, barter |
| Internal links | Pillar → ecosystem segment → city hub → maker profile |
| CTA | “Ontdek makers in jouw buurt” |
| Structured data | `ProfilePage`, `Person`, `ItemList` of makers (only with real data) |
| NL first | Yes |

## Pillar 3: Neighbour help and local services

| Field | Recommendation |
|-------|----------------|
| User intent | “I need help nearby” / “I can offer a service” |
| Factual scope | Request listings, proposals, practical services taxonomy, community orders |
| Product connection | `gezocht` chip, request detail, messaging |
| Supporting pages | New — none today; link from hero chip “Gezocht” / “Klusjes” |
| FAQ topics | How requests work, safety, payment options |
| CTA | “Plaats een oproep” |
| Structured data | `Service` (not `Product`) for service listings when implemented |
| Pilot only initially | Rijnmond pilot |

## Pillar 4: Barter and community economy

| Field | Recommendation |
|-------|----------------|
| User intent | “Exchange without money” / “reduce waste locally” |
| Factual scope | Barter settlement, accepted values, proposals — **no waste kg claims** |
| Product connection | Barter chip, deal flow |
| Supporting pages | `gemeenschap/community`, FAQ buying/barter |
| CTA | “Bekijk ruil-aanbod” |
| Structured data | Custom type or `Offer` without price — honest representation |
| NL first | Yes |

## Pillar 5: Local food and home chefs (existing wedge — refine, don’t delete)

Keep as **supporting cluster** linking to Pillars 1–2. Reframe intros with one paragraph on broader craft. Do not create more meal-keyword variants.

## Pillar 6: Ethical technology and time well spent

| Field | Recommendation |
|-------|----------------|
| User intent | “Is this another addictive app?” |
| Factual scope | Only claims backed by Phase 13O: no ads, bounded feed, consent analytics, anti-pressure activations |
| Product connection | About, privacy, community guidelines |
| **Wait for** | P0 fixes + public metrics before SEO push |
| Structured data | `Organization` `ethicsPolicy` link — when page exists |

## Remaining pillars (garden surplus, social cohesion, circular) — P2

Merge into Pillars 3–4 as sections, not separate doorway pages.

---

# Part 6 — City and regional strategy

## Pilot geography audit

| Geography | In `LOCAL_SEO_CITIES` | `/maaltijden/{slug}` | Meal SEO page | `/eten-verkopen-{stad}` | Ops/pilot refs |
|-----------|----------------------|----------------------|---------------|-------------------------|----------------|
| **Vlaardingen** | ✅ | ✅ | ❌ | ❌ | Footer, pitch, admin command center |
| **Schiedam** | ❌ | ❌ | ❌ | ❌ | `validate-pilot-readiness-phase13g.ts` |
| **Rotterdam** | ✅ | ✅ | ✅ `maaltijden-in-rotterdam` | ✅ | Seed data, many tests |
| **Rijnmond** | ❌ (region) | ❌ | ❌ | ❌ | Pilot docs only |

## Minimum requirements before a city page may exist (indexable)

| Requirement | Threshold | Current enforcement |
|-------------|-----------|---------------------|
| Active listings in radius | ≥ **8** products/requests in 32 km bbox | `sparseGeoSignal` when probe `< 8` AND `activeCreatorsWeek < 3` |
| Active makers | ≥ **3** creators with geo in 7 days | Partial — hub shows metrics |
| Category diversity | ≥ **2** of: food, garden, design, service | **Not enforced** — recommend before index |
| Local examples | ≥ **3** named maker profiles linked | Rising maker in hub — optional |
| Local FAQs | 3–5 city-specific Q&As | **Missing** |
| Empty region | `noindex` when below thresholds | **Not implemented** — hub still indexable |

## Canonical strategy

- **City hub canonical:** `/maaltijden/{slug}` — rename path in future to `/lokaal/{slug}` when brand allows (audit note only).
- **Food sell city:** `/eten-verkopen-{stad}` — supporting only; canonical to city hub where overlap.
- **Do not** auto-generate Schiedam/Rijnmond pages until data thresholds met.

## Internal linking (city ↔ category ↔ maker)

Recommended model:

```
/maaltijden/vlaardingen
  → /gemeenschap/keuken|tuin|studio
  → /user/{maker}
  → /product/{listing}
  → pillar: earn locally / meet the maker
```

Currently: city pages link to dorpsplein CTA; **weak links to profiles and non-food categories**.

---

# Part 7 — Structured data

## Current inventory

| Type | Where | Correct? | Notes |
|------|-------|----------|-------|
| `Organization` | Homepage | ✅ | Broad description via i18n |
| `WebSite` | Homepage | ✅ | Missing `SearchAction` — optional |
| `FAQPage` | FAQ layout, affiliate, SEO landings | ✅ | Curated; not full FAQ page |
| `WebPage` + `Article` | SEO landings | ✅ | Appropriate for editorial landings |
| `Product` + `Offer` | Product layout | ⚠️ | Used for **all** listings including services/requests |
| `AggregateRating` + `Review` | Product layout | ✅ when reviews exist | Only when `reviewCount > 0` |
| `Person` | Seller, user profile, nested in Product | ✅ | Good maker signal |
| `Organization` | Business seller layout | ✅ | — |
| `BreadcrumbList` | Product layout | ✅ | — |
| `Place` | City hub | ✅ | Activity in `about` |
| `LocalBusiness` | — | ❌ Missing | Could apply to business sellers with care |
| `ProfilePage` | — | ❌ Missing | Opportunity for `/user/{username}` |
| `Service` | — | ❌ Missing | Should replace `Product` for service listings |
| `ItemList` | — | ❌ Missing | City/pillar pages with real listings |
| `HowTo` | — | ❌ Missing | Seller onboarding |
| `Event` / `Course` | — | ❌ Missing | Workshops if listed |

## Misleading risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| `Product` for services/requests | P1 | Map `Service` or `Offer` without product semantics |
| `OutOfStock` when stock null | P2 | Verify availability logic |
| Duplicate `FAQPage` (page + layout) | Low | Ensure answers match visible content |
| `gemeenschap` JSON-LD always Dutch | P2 | Language-aware |
| Fake ratings | — | **Not found** — ratings require real reviews ✅ |

## Platform entity

Represent HomeCheff as `Organization` + `WebSite` with:

- `sameAs` — when social profiles verified
- `foundingLocation` — Vlaardingen (factual, in footer)
- **No** `AggregateRating` on the platform itself

---

# Part 8 — AI discoverability

## How answer engines would likely describe HomeCheff today

| Question | Likely AI answer | Accurate? |
|----------|------------------|-----------|
| Food marketplace only? | **Probably yes** — dominant indexed content is food | **Partially true** |
| Local craftsmanship position? | **Maybe** — if FAQ/homepage crawled | **Directionally true** |
| Social cohesion mission? | **Unlikely** — thin content | **Weak evidence** |
| Extra income opportunity? | **Yes** — many earn pages | **Partially true** (fees vary) |
| vs mass-production platforms? | **Partial** — dropshipping pages help | **True for dropshipping** |
| Ethical / time-well-spent? | **Unlikely** — not public | **Product true, SEO silent** |

## Citation-worthy gaps

- Single authoritative **“What is HomeCheff?”** definition page cited consistently (currently split across FAQ JSON-LD, About, hero).
- **Founder mission** — pitch page exists (`/pitch`) but **not in sitemap**; investor-oriented not citizen-facing.
- **Impact evidence** — none public.
- **Category clarity** — taxonomy not exposed as readable public documentation.

## Entity consistency issues

- “Dorpsplein” vs “Village Square” vs “marketplace” vs “platform” — use consistent entity labels in JSON-LD and meta.
- “HomeCheff” vs “homecheff.eu” — canonical domain consistent ✅ (`MAIN_DOMAIN`).

## Recommendations for AI discoverability

1. One **definition block** repeated in Organization schema, About, FAQ (already similar — tighten wording).
2. Public **category map** page (taxonomy as human-readable).
3. **No** AI-generated filler content — cite real product mechanics only.

---

# Part 9 — Truth and claim integrity (Phase 13O boundary)

## Claim classification matrix

| Claim area | Public location | Classification | Action |
|------------|-----------------|----------------|--------|
| Discovery boost / visibility multiplier | DNA preview, sell UI, subscription copy | **Misleading** (P0-3) | Remove/soften in SEO until wired |
| GDPR data export | Privacy UI, safety copy | **Misleading** (P0-1) | Do not SEO on privacy leadership |
| Account suspension | Safety page | **Partially supported** (P0-2) | Soften “full enforcement” |
| Platform fees 12/9/7/5% | Pricing, FAQ | **Supported** | OK in SEO |
| €2,000 individual revenue cap | Pricing page | **Aspirational** (P1-4) | Disclose “target policy” or enforce |
| Premium analytics | Subscription marketing | **Misleading** (P1-9) | Remove from SEO |
| Affiliate 12-month / 50% commission | Affiliate JSON-LD, page | **Supported** (code exists) | OK with qualification |
| Income potential / “verdien” | Bottom nav, earn pages | **Aspirational** | No earnings guarantees |
| Social impact / waste reduction | FAQ sustainability | **Aspirational** | No metrics — do not rank |
| Neighbourhood connection outcomes | Hero, About | **Partially supported** | Qualify as mission, not proven outcome |
| Privacy controls | Privacy settings | **Partially supported** (P1-3, P1-10) | No “full control” superlatives |
| Popular sorting | Client feed | **Misleading** vs anti-gaming (P1-1) | Do not claim fair discovery |
| HCP leaderboards | FAQ JSON-LD | **Supported** but habit-risk (P1-6) | Neutral description OK |
| Barter / direct = no escrow | FAQ partial | **Partially supported** | Strengthen disclosure |
| Free to sell | Homepage, FAQ | **Supported** (individual tier) | OK |
| Pilot with Vlaardingen municipality | Pitch page | **Partially supported** | “Preparing” not “live” |

## Claims that must wait for Phase 13O P0 fixes

1. **“Boost your visibility in discovery”** — any SEO or subscription landing.
2. **“Download your data” / GDPR export** — privacy SEO.
3. **“Suspended users cannot use the platform”** — safety SEO.

## Claims that must wait for P1 fixes

4. **“Fair discovery without gaming”**
5. **“€2,000 cap enforced”**
6. **“Advanced seller analytics”**
7. **“Report any listing”** (reporting incomplete)
8. **Measurable waste reduction / social impact**

---

# Part 10 — Mission communication

## Message: “HomeCheff strengthens people and communities, not only transactions”

| Surface | Mission clear? | Issue |
|---------|----------------|-------|
| Homepage hero | **Yes** | Best mission surface |
| Homepage supporting | **Moderate** | Feed is product-first |
| About | **Yes** | Strong |
| Seller onboarding | **Moderate** | Subscription/fee prompts |
| Profile pages | **Moderate** | Reputation + listings |
| Listing detail | **Moderate** | Commerce zone prominent |
| Subscriptions | **Weak** | Fee and visibility focus |
| Affiliate | **Weak** | Income-first |
| Delivery | **Moderate** | Gig-income framing |
| Empty states | **Good** | Actionable, not shame-based (13O) |
| Transactional emails | *Not audited in depth* | — |
| Social sharing OG | Product/layout level | Product-first previews |
| Metadata | Mixed | Food SEO vs broad homepage |

## Copy tone opportunities (list only — no rewrites)

| Pattern | Examples |
|---------|----------|
| Too corporate | “platform”, “marketplace”, “ecosysteem” without human examples |
| Too transactional | “Snel Geld Verdienen”, checkout-first CTAs |
| Too product-focused | Product titles without maker |
| Too fee-focused | Pricing hero, subscription dashboard |
| Too generic | “lokale marktplaats” — could be any site |
| Not human enough | City pages without named makers |
| Not specific enough | Sustainability FAQ without data |

---

# Part 11 — Internal linking architecture

## Current clusters

| Cluster | Hub | Strength | Orphans / weak |
|---------|-----|----------|----------------|
| Extra income | `/bijverdienen-vanuit-huis`, SEO hub “sell” | **Medium** | `/pricing` not in sitemap |
| Personal craft | Homepage, `gemeenschap/*` | **Medium** | Weak link from food SEO → studio/tuin |
| Neighbour help | `gezocht` chip only | **Weak** | No indexable hub |
| Sustainability | FAQ section | **Weak** | No pillar |
| City → maker | `/maaltijden/{stad}` | **Low** | CTA to dorpsplein only |
| About → ethics | `/over-ons` | **Low** | No impact/ethics page |
| SEO hub | `/seo-hub` | **Good** | Food-heavy outbound links |

## Recommended scalable model

```
Homepage
├── Pillar: What is HomeCheff (definition)
├── Pillar: Earn locally
│   ├── /sell, /pricing, seller FAQ
│   └── category ecosystems
├── Pillar: Meet makers
│   ├── profiles, city hubs
│   └── listing detail
├── Pillar: Neighbour help
│   └── requests, services taxonomy
└── Pillar: Barter & circular
    └── barter FAQ, community
```

**Rules:** 3–5 contextual links per page; anchor text = human labels (“makers in Vlaardingen”), not keyword stuffing.

## Overlinked

- Multiple food-sell URLs pointing to same intent — **consolidate**.

---

# Part 12 — Social-impact authority

## Phase 13O metric classification for public use

| Metric | Status | Public page? |
|--------|--------|--------------|
| Local GMV / seller net | Derivable | **No** — future `/impact` when pilot data |
| First-time sellers with revenue | Derivable | No |
| Barter deals completed | Partial | No |
| Community orders fulfilled | Derivable | No |
| Active makers in region | Derivable | Partial — city hub metrics |
| % transactions in pilot region | Derivable | No — municipality report |
| Food waste kg | **Not tracked** | **Never claim** |
| Users feeling less lonely | Survey needed | **Never claim** without consent |
| Repeat local relationships | Derivable, not surfaced | No |

## Authority build order

1. **Pilot dashboard** (private) → derivable metrics
2. **Municipality brief** (Vlaardingen) — factual counts only
3. **Public impact page** — only when ≥90 days pilot data + legal review
4. **No invented numbers** — ever

---

# Part 13 — Content governance

## Rules preventing SEO degradation

| Rule | Rationale |
|------|-----------|
| **No thin pages** | Minimum 400+ words unique value + product connection |
| **No keyword doorway pages** | One intent per pillar, not 50 city×keyword combos |
| **No auto-generated city spam** | Threshold gate + `noindex` when sparse |
| **No unsupported claims** | Phase 13O classification required before publish |
| **Human review** | Founder or delegated editor for all new pillars |
| **Update ownership** | Product + content owner per pillar |
| **Review dates** | Quarterly review on all SEO landings |
| **Source requirements** | Link to product feature or policy for factual claims |
| **Duplicate prevention** | Canonical tags; merge overlapping food-income URLs |
| **Canonical rules** | `homecheff.eu` only (`MAIN_DOMAIN`) |
| **Translation parity** | No EN page without NL source of truth |
| **AI content safeguards** | No bulk AI copy; human-edited, fact-checked |

## Content quality checklist (pre-publish)

- [ ] User intent satisfied without leaving site?
- [ ] Every claim mapped to code/policy evidence?
- [ ] Phase 13O P0 claims absent?
- [ ] Maker/community language present?
- [ ] Internal links to 2+ related pillars?
- [ ] Structured data matches visible content?
- [ ] NL + EN parity (or intentional pilot-only)?
- [ ] City page meets activity thresholds?
- [ ] No duplicate intent with existing URL?

---

# Part 14 — International readiness

## NL vs EN parity

| Content | NL | EN | Priority |
|---------|----|----|----------|
| Homepage / hero | ✅ | ✅ | — |
| SEO landings (20) | ✅ | ✅ | — |
| Programmatic landings | ✅ | ✅ | — |
| `/maaltijden/[stad]` body | ✅ hardcoded | ❌ | **Translate when city strategy ships** |
| `/pricing` | ✅ | ❌ | **EN before international** |
| `gemeenschap` JSON-LD | NL only | ❌ | Fix with page i18n |
| FAQ full page | ✅ | ✅ | — |
| Pitch / investor | EN | — | Not citizen SEO |
| City food-sell (4) | ✅ | ✅ | — |

## Dutch-first strategic pages

1. Platform definition pillar (NL source)
2. Earn locally pillar
3. Rijnmond pilot city content
4. Ethical technology (when evidence page exists)

## English wording risk

“Handmade” in EN carries art/craft connotation — **good for Designer**, may undersell **cooking and services**. Prefer “home-prepared”, “personally made”, “local maker” where appropriate.

## Pilot-only (wait for expansion)

- Schiedam/Rijnmond regional pages
- Municipality impact reports
- Non-NL city pages

---

# Part 15 — Opportunity register

Prioritized opportunities. **No implementation in this phase.**

| ID | Semantic cluster | Audience | Page type | Intent | Business value | Social value | Evidence | Effort | SEO pot. | AI pot. | Priority |
|----|------------------|----------|-----------|--------|----------------|--------------|----------|--------|----------|---------|----------|
| O-01 | Platform identity / truth | All | Definition pillar + schema align | What is HomeCheff? | High | High | Strong | M | H | H | **P0** |
| O-02 | Discovery boost claims | Sellers | Copy fix on DNA/pricing/sell | Subscription truth | High | Medium | **Misleading** | S | — | — | **P0** |
| O-03 | GDPR / safety claims | Users | Privacy/safety copy audit | Trust | High | High | **Stub** | S | — | — | **P0** |
| O-04 | Earn extra income locally | Makers | Pillar + hub restructure | Side income | High | High | Strong | M | H | H | **P1** |
| O-05 | Meet the maker | Buyers | Profile-first SEO + ProfilePage schema | Authenticity | High | High | Strong | M | M | H | **P1** |
| O-06 | Personal craftsmanship | Makers/buyers | Craft pillar | Handmade local | High | High | Partial | M | H | H | **P1** |
| O-07 | Neighbour help & services | Residents | New pillar | Local help | Medium | High | Partial | L | M | M | **P1** |
| O-08 | Mass production boundary | Makers | Policy explainer (public) | What we are not | Medium | Medium | Partial | S | L | M | **P1** |
| O-09 | Service vs Product schema | Search | Schema fix | Correct results | Medium | Low | Strong | S | M | M | **P1** |
| O-10 | Rijnmond pilot cluster | Pilot citizens | City hubs + thresholds | Local discovery | High | High | Partial | M | M | M | **P2** |
| O-11 | Barter & circular | Community | Pillar section | Exchange | Medium | High | Partial | M | M | M | **P2** |
| O-12 | Garden surplus | Gardeners | Supporting guide | Surplus sharing | Low | Medium | Weak | M | M | L | **P2** |
| O-13 | Food SEO refactor | Food seekers | Update 14 landings | Meals local | Medium | Low | Strong | M | H | M | **P2** |
| O-14 | Public impact page | Partners/municipalities | `/impact` | Proof | Medium | High | **None yet** | L | L | M | **P2** |
| O-15 | EN city pages | EN users | i18n maaltijden | Local EN expats | Low | Medium | Partial | M | L | L | **P3** |
| O-16 | International craft SEO | EU expansion | Translated pillars | Craft marketplace | Low | Medium | Partial | H | M | M | **P3** |
| O-17 | HowTo seller schema | Makers | Onboarding | How to start | Medium | Medium | Strong | S | M | H | **P3** |
| O-18 | SearchAction on WebSite | Search | Schema | Sitelinks search | Low | Low | N/A | S | L | L | **P3** |

### Priority summary

- **P0 — identity/truth issue:** O-01, O-02, O-03  
- **P1 — high-value authority gap:** O-04 through O-09  
- **P2 — pilot content opportunity:** O-10 through O-14  
- **P3 — scale/international opportunity:** O-15 through O-18  

---

# Part 16 — Final verdict

Direct answers:

### 1. What does Google currently think HomeCheff is?

A **local home-cooked food and meal-ordering marketplace** with secondary signals for handmade products and local selling — because ~70% of indexed SEO landings, meal-city URLs, and food-sell pages are food-intent, while broader positioning lives on the homepage and a smaller set of hubs.

### 2. What should Google understand HomeCheff is?

The **digital home of personal craftsmanship and local human value** — a neighbourhood platform where real people offer food, garden harvest, creations, services, help, barter and inspiration, with the **person behind the product** always central.

### 3. Is personal craftsmanship sufficiently visible?

**Not yet for SEO.** Visible on homepage, About, and profiles; **not** sufficiently visible in metadata, long-tail landings, or category authority content.

### 4. Is extra-income opportunity sufficiently visible?

**Moderately** — many earn/sell pages exist, but they are **food-dominant** and sometimes **overpromise** (visibility, analytics, caps).

### 5. Is social cohesion sufficiently visible?

**No** for search — product features exist (requests, barter, community orders) but **lack indexable explanatory content**.

### 6. Is the distinction from mass production clear?

**Partially** — anti-dropshipping content and taxonomy blocks help; **missing** a clear public policy on mass-produced/imported goods.

### 7. Which claims must wait until Phase 13O P0 issues are fixed?

- Discovery/visibility boost in ranking  
- GDPR data export completeness  
- Global suspension enforcement  
- (P1 also before scaling:) fair discovery, €2k cap enforcement, premium analytics, measurable social impact

### 8. Which five pages/clusters would create the largest legitimate authority gain?

1. **Unified platform definition** (pillar — aligns Organization, About, FAQ)  
2. **Earn extra income locally** (consolidate existing sell pages + truthful fees)  
3. **Meet the maker / personal craftsmanship** (profiles + schema + editorial)  
4. **Neighbour help & local services** (requests + services taxonomy)  
5. **Rijnmond pilot local hub** (Vlaardingen + Schiedam + Rotterdam with data thresholds)

### 9. Can HomeCheff become a leading source around local craft, extra income and neighbourhood economy?

**Yes, legitimately** — if it publishes **useful, evidence-backed pillar content** tied to real listings and profiles, fixes truth gaps, and **refuses** empty keyword pages. The product already supports the story; the **SEO layer must catch up without lying**.

### 10. What must never be sacrificed for SEO growth?

- **Truth** — no claims beyond product evidence  
- **The human behind the product** — no anonymous catalogue SEO  
- **Local authenticity** — no empty city or category spam  
- **Mission over attention** — no engagement-bait content (per Phase 13O)  
- **Dignity of ordinary participants** — no income guarantees or shame-based copy  

---

## Appendix — Key file references

| Area | Path |
|------|------|
| SEO page definitions | `lib/seo/homecheffSeoPages.data.ts` |
| SEO hub sections | `lib/seo/homecheffSeoPages.ts` |
| Sitemap | `lib/seo/sitemapXml.ts` |
| Local cities | `lib/seo/localCities.ts` |
| City hub data | `lib/community/getEcosystemHubForCitySlug.ts` |
| FAQ JSON-LD | `lib/seo/faqStructuredData.ts` |
| Homepage schema | `components/home/HomePageClient.tsx` |
| Product JSON-LD | `app/product/[id]/layout.tsx` |
| Taxonomy blocks | `lib/marketplace/taxonomy.ts` |
| Phase 2 programmatic SEO | `lib/i18n/seoPhase2ClusterSources.ts` |
| Truth boundary | `docs/audits/ETHICAL_PRODUCT_PHILOSOPHY_PHASE13O_AUDIT.md` |

---

*End of Phase 13P audit. Implementation deferred until findings are approved and prioritized.*
