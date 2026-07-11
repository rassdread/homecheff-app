# Phase 13R — AI Authority, Generative Search & Knowledge Graph Audit

**Date:** 2026-07-11  
**Scope:** Audit only — how LLM-based search and knowledge systems would understand, recommend and cite HomeCheff. No implementation.  
**Method:** Public surface review (copy, metadata, JSON-LD, sitemap, i18n, navigation), corpus analysis, cross-reference with Phase 13Q pillar layer and Phase 13O truth boundary.  
**Prerequisite phases:** 13N–13Q complete — not re-audited here; this audit builds on their outcomes.  
**Truth boundary:** Phase 13O P0/P1 limits on public claims remain mandatory.

---

## Executive summary

HomeCheff has **meaningfully improved** its craft-first entity definition since Phase 13P (platform SSOT, seven pillar pages, curated FAQ JSON-LD, ProfilePage schema). An AI system that reads **only** homepage, About, FAQ JSON-LD and pillars would describe HomeCheff as a **local personal-craftsmanship and neighbourhood-opportunity platform** — not solely food.

However, the **indexed public corpus is still food-heavy**: of **88 sitemap URLs**, roughly **41** are food-skewed (14 food SEO landings, 5 static food landings, 16 `/maaltijden/[stad]`, 6 `/eten-verkopen-*`) versus **12** craft-ecosystem hubs (7 pillars + 5 `gemeenschap`). Crawlers and retrieval-augmented LLMs weight volume; **ChatGPT and similar systems will still often classify HomeCheff as a local homemade-food / neighbourhood marketplace**, with secondary signals for handmade goods, neighbour help and barter.

**Knowledge graph readiness:** Partial. Core types exist (Organization, WebSite, FAQPage, ProfilePage, Product/Service, HowTo, BreadcrumbList on products). **Critical entity gaps:** `sameAs`, `legalName`, `foundingDate`, `foundingLocation`, rich `contactPoint`, founder `Person`, and Organization JSON-LD on About. Schema is **split across three implementations** (`HomePageClient` inline, `schema-builders.ts`, page-local scripts) with inconsistent SearchAction targets.

**Generative search:** Pillars answer “what / who / why / earn / barter / help / craft” well. **Named competitor questions** (Etsy, Marktplaats, Facebook Marketplace, Nextdoor, Vinted) have **no dedicated, extractable answers**. Only delivery-app comparison exists (`alternatief-voor-thuisbezorgd`).

**AI citation readiness:** Good on pillars and platform SSOT; weak on full FAQ page (emoji-heavy, long answers), seller meta (“homemade products”), and product-first titles.

**Ecosystem semantics:** Product UI and feed taxonomy connect Chef / Garden / Designer / services / barter / Gezocht. **Public explainers for HCP, Business DNA, Community Orders, Delivery and Affiliate** are thin or non-indexable — AI will treat them as isolated features.

**Local AI discovery:** HomeCheff is **unlikely** to be recommended for generic local-intent queries (“gardener in Vlaardingen”, “earn extra money”) unless the model already knows the brand or retrieves pillar pages. **Food and cooking-income queries** have stronger retrieval match.

**Founder philosophy:** Strengthens AI understanding where **product-backed** (person behind offer, barter, neighbour help, honest fees, no false impact). Must **not** be amplified via founder narrative where product evidence is missing (impact metrics, discovery boost, GDPR export).

---

# Part 1 — How would ChatGPT currently describe HomeCheff?

## Likely primary label (evidence-weighted)

| Label | Likelihood | Why |
|-------|------------|-----|
| **Local food / home-cooked marketplace** | **High** | 14/20 SEO landings food-focused; 16 meal-city pages; 5 root food landings; seller meta “thuisgemaakt producten”; `alternatief-voor-thuisbezorgd` |
| **Neighbourhood / local marketplace** | **High** | “Dorpsplein”, geo feed, city pages, “buurt” in pillars and About |
| **Platform for makers / handmade / local craft** | **Medium–High** | Phase 13Q pillars, platform SSOT, `gemeenschap` hubs, homepage hero chips |
| **Community platform / local economy** | **Medium** | `/buurt-economie`, barter FAQ, community guidelines; less volume than food URLs |
| **Human craftsmanship platform** | **Medium** | Strong on pillars + SSOT; diluted by food corpus and “marketplace/checkout” transactional copy |
| **Etsy competitor** | **Low** | No indexed comparison; handmade mentioned in FAQ selling section only |
| **Generic gig-economy app** | **Low** | `/buurthulp` explicitly contrasts with anonymous gig economy |

## Composite description an LLM would probably produce

> *“HomeCheff is a Dutch neighbourhood marketplace where local people sell homemade food, garden produce and handmade items, find neighbour help, barter, and pay via Stripe. It positions itself as the digital village square for personal craftsmanship, not just delivery apps.”*

That is **directionally closer to truth post-13Q** than Phase 13P’s “mostly food marketplace” — but **food still leads** because retrieval corpus favours food URLs **~3.4×** over pillar/ecosystem URLs (41 vs 12).

## Why — mechanism

1. **Retrieval volume:** Sitemap analysis (2026-07-11): 88 URLs — 7 pillars, 5 `gemeenschap`, 20 NL + 20 EN programmatic SEO, 16 `maaltijden`, 6 `eten-verkopen`, plus static hubs. Food-tagged paths dominate.
2. **Title/H1 patterns:** SEO landings like `thuisgekookt-eten-kopen`, `geld-verdienen-met-koken` supply explicit food intent.
3. **Craft counter-signals:** `lib/seo/platform-definition.ts`, `/wat-is-homecheff`, FAQ JSON-LD (`getFaqPageJsonLd`) — high quality but **fewer pages**.
4. **Training data:** If third-party sources (press, directories, social) describe HomeCheff as food-first, on-site food volume **reinforces** that embedding regardless of homepage copy.
5. **Schema descriptions:** Organization description is craft-first (`HomePageClient`, platform SSOT) — helps **entity summarization** but does not override **long-tail page retrieval**.

## Evidence files

| Signal | Path |
|--------|------|
| Platform SSOT | `lib/seo/platform-definition.ts` |
| Homepage JSON-LD | `components/home/HomePageClient.tsx` L136–159 |
| Sitemap composition | `lib/seo/sitemapXml.ts` + `collectSitemapLocUrls()` |
| Food SEO defs | `lib/seo/homecheffSeoPages.data.ts` (14/20 ids food-related) |
| Seller meta skew | `app/seller/[sellerId]/layout.tsx` L59–61 |

---

# Part 2 — Knowledge Graph readiness

## Schema inventory

| Type / property | Present? | Where | Quality |
|-----------------|----------|-------|---------|
| **Organization** | ✅ Partial | `HomePageClient.tsx` (inline); `buildOrganizationJsonLd()` (minimal) | Craft description; homepage has `alternateName`, `contactPoint`, `SearchAction`; builder lacks those |
| **Person** | ✅ Partial | `app/seller/[sellerId]/layout.tsx`; ProfilePage `mainEntity` | Seller profiles only; **no founder Person** |
| **ProfilePage** | ✅ | `app/user/[username]/page.tsx` → `buildProfilePageJsonLd()` | Good for makers |
| **Service** | ✅ | `buildListingJsonLd()` when `PRACTICAL_SERVICE` / `KNOWLEDGE` | Category-gated |
| **Product** | ✅ | `buildListingJsonLd()` default | Includes seller Person, reviews when present |
| **FAQPage** | ✅ Partial | `lib/seo/faqStructuredData.ts` (5 Q); pillar FAQs via `SeoLandingTemplate` | Curated set small vs full FAQ page |
| **HowTo** | ✅ | `buildSellerHowToJsonLd()` on `/lokaal-verdienen` | Earn path only |
| **BreadcrumbList** | ✅ Partial | `app/product/[id]/layout.tsx` only | Not on pillars, About, FAQ |
| **SearchAction** | ✅ Inconsistent | Homepage `/?q={search_term_string}`; `schema-builders` `/?place={search_term_string}#homecheff-feed` | **Two different templates** |
| **WebSite** | ✅ | Homepage + `buildWebsiteJsonLd()` | `publisher` present |
| **WebPage** | ✅ Partial | Pillars, `gemeenschap` | Pillar `name` uses i18n namespace key, not human title |
| **sameAs** | ❌ | — | No social/official profile URIs in JSON-LD |
| **publisher** | ✅ | WebSite | Organization name only, no `@id` |
| **logo** | ✅ | Organization | `/logo.png` |
| **brand** | ⚠️ Implicit | `name: HomeCheff` | No explicit `Brand` type |
| **foundingDate** | ❌ | — | Not in schema or About |
| **foundingLocation** | ⚠️ Copy only | `overOns.companyAddress`: “Vlaardingen” | Not in JSON-LD |
| **contactPoint** | ⚠️ Partial | Homepage email `support@homecheff.eu`; About has role-based emails in HTML table | Not unified in Organization schema |
| **legalName** | ⚠️ Copy only | `overOns.companyName`: “Arrias Beheer B.V.”, KvK/BTW in About + footer | **Absent from Organization JSON-LD** |
| **alternateName** | ✅ Homepage only | Extensive typo/marketplace variants in `HomePageClient` | Not in `schema-builders` |
| **parentOrganization** | ❌ | — | Legal entity not linked |
| **copyrightHolder** | ❌ | — | — |
| **creator** | ❌ | — | — |
| **license** | ❌ | — | — |

## Missing entity signals (priority)

| Gap | Impact on AI / KG | Evidence |
|-----|-------------------|----------|
| No `sameAs` (LinkedIn, Instagram, KvK, Wikidata) | Weak disambiguation vs homonyms (“home chef”) | Grep: zero `sameAs` in TS/TSX |
| `legalName` + `parentOrganization` not in schema | AI cannot reliably answer “who owns HomeCheff?” | `public/i18n/nl.json` `overOns.*` |
| No founder `Person` linked to `Organization` | “Who founded HomeCheff?” → pitch PDF only (`noindex`) | `app/pitch/page.tsx` robots noindex |
| Schema duplication / drift | Conflicting SearchAction, thinner Organization on other routes | `schema-builders.ts` vs `HomePageClient.tsx` |
| About / Contact lack Organization JSON-LD | High-trust pages don’t reinforce graph | `app/over-ons/layout.tsx` — metadata only |
| `gemeenschap` JSON-LD hardcoded NL | EN pages emit Dutch `name`/`description` | `app/gemeenschap/[segment]/page.tsx` L117–124 |
| FAQ JSON-LD ⊂ visible FAQ | Full FAQ not in structured data | ~40+ Q in `public/i18n/nl.json` `faq.*` |

## Knowledge graph coherence score

| Dimension | Score (1–5) | Note |
|-----------|-------------|------|
| Entity definition | 4 | SSOT strong post-13Q |
| Entity completeness | 2 | Legal, social, founder missing |
| Relationship graph | 2 | Pillars link in HTML; weak `@id` / `isPartOf` graph |
| Consistency | 3 | Homepage vs builders vs seller |
| Multilingual entities | 3 | EN SEO exists; pillars NL-path only |

---

# Part 3 — Generative Search Optimization (answer readiness)

Does the site **answer questions** (not just target keywords)?

| Question | Answerable today? | Best source | AI extractability |
|----------|-------------------|-------------|-------------------|
| What is HomeCheff? | ✅ Yes | `/wat-is-homecheff`, FAQ JSON-LD, SSOT | **High** — concise definitional paragraphs |
| Who is HomeCheff for? | ✅ Yes | `/wat-is-homecheff` `sectionWho*` | **High** |
| Why is it different? | ⚠️ Partial | `/wat-we-niet-zijn` (generic, not named competitors) | **Medium** |
| Can I earn money? | ✅ Yes | `/lokaal-verdienen`, HowTo schema, `/pricing` | **High** |
| Can I barter? | ✅ Yes | `/buurt-economie`, FAQ general | **Medium** — scattered |
| How does neighbourhood help work? | ✅ Yes | `/buurthulp`, FAQ `localCommunity` | **Medium** — “Gezocht” jargon |
| Can I sell services? | ⚠️ Partial | FAQ selling, feed chips; no dedicated pillar | **Medium** |
| Can I sell handmade products? | ✅ Yes | FAQ `handmade`, selling rules | **High** on FAQ, verbose |
| Can I sell food? | ✅ Yes | Many food SEO pages + FAQ Chef | **Very high** |
| What is personal craftsmanship? | ✅ Yes | `/persoonlijk-vakmanschap` | **High** |
| How is it different from Etsy? | ❌ No | — | **None** |
| How is it different from Marktplaats? | ❌ No | — | **None** |
| How is it different from Uber Eats / Thuisbezorgd? | ⚠️ Partial | `alternatief-voor-thuisbezorgd` SEO page | **Medium** |
| How is it different from Facebook Marketplace? | ❌ No | — | **None** |
| How is it different from Nextdoor? | ❌ No | — | **None** |
| How is it different from Vinted? | ❌ No | — | **None** |

## Extractability assessment

**Easy for LLMs to extract:**
- Pillar `SeoLandingTemplate` blocks: H1 + H2 sections + short paragraphs (`lib/i18n/pillarPageSources.ts`)
- `PLATFORM_DEFINITION.entityDefinition` (single sentence)
- Curated FAQ JSON-LD (plain text, no emoji)

**Hard for LLMs to extract:**
- Full FAQ page answers with emoji prefixes, multi-line numbered lists (`public/i18n/nl.json` `faq.general.0` etc.)
- Product page titles optimized for “{product} in {city} kopen” — answer-first format absent
- Investor pitch (`/pitch`, `noindex`) — invisible to most crawlers

**Keyword vs answer gap:** Food SEO pages answer “how to sell food from home” well but **over-answer** food at the expense of unified platform questions competitors trigger in generative search.

---

# Part 4 — AI Citation Readiness

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Clear definitions | ✅ Strong | `platform-definition.ts`, `/wat-is-homecheff` |
| Concise paragraphs | ✅ Pillars; ❌ FAQ | Pillar intros ~2–3 sentences; FAQ answers 150–400 words with symbols |
| Entity consistency | ⚠️ Mixed | SSOT says craft-first; seller meta says “homemade products”; pitch says “digital marketplace for neighbourhood economies” |
| FAQ quality | ⚠️ Mixed | JSON-LD curated ✅; visible FAQ comprehensive but not citation-friendly |
| Heading hierarchy | ✅ Pillars | `SeoLandingTemplate` section titles |
| Semantic HTML | ✅ Adequate | `<main>`, `<section>` patterns on landings; feed app shell less semantic |
| Tables | ✅ About | Reachability email table — good for “contact who for what” |
| Lists | ✅ Pillars, FAQ | FAQ lists buried in prose |
| Structured explanations | ✅ HowTo on earn pillar | Single HowTo only |
| Citation-friendly language | ⚠️ Partial | Dutch product terms (“Dorpsplein”, “Gezocht”, “HCP”) need glossaries for EN AI |

## Citation friction examples

1. **Dual SearchAction URLs** — an AI citing “site search” may cite wrong query parameter (`q` vs `place`).
2. **Pillar WebPage `name`** uses namespace string (`platformDefinitionPage`) not “Wat is HomeCheff?” — weak bibliographic title.
3. **No `dateModified` / `datePublished`** on explainer pages — freshness signals absent.
4. **Reviews** embedded in Product schema — good for product citations, not platform-level trust.

---

# Part 5 — Semantic Relationships (one ecosystem?)

## Concepts assessed

| Concept | Connected in product? | Connected in public AI-readable copy? |
|---------|----------------------|--------------------------------------|
| Chef (seller role) | ✅ Sell flow, categories | FAQ selling; food-heavy SEO |
| Garden | ✅ Vertical + `gemeenschap/tuin` | Pillar + ecosystem hub |
| Designer | ✅ Vertical + `gemeenschap/studio` | Pillar + ecosystem hub |
| Services | ✅ Feed taxonomy `PRACTICAL_SERVICE`, `KNOWLEDGE` | `/buurthulp`; no “services pillar” |
| Neighbour Help | ✅ Gezocht chip, requests | `/buurthulp` |
| Barter | ✅ `barter-models.ts`, proposals | `/buurt-economie` |
| Community Orders | ✅ `communityOrderId` in deals/proposals | **No public explainer page** |
| Delivery | ✅ Courier flows, `/bezorger-worden` | SEO landing exists; weak link to ecosystem narrative |
| Affiliate | ✅ `/affiliate` | Mentioned in `gemeenschap/community`; not in pillar hub list |
| Business DNA | ✅ `business.dna.*` on `/sell`, pricing compare | **Not in pillar hub or SSOT** |
| HCP | ✅ Gamification APIs, `/hcp-ranglijsten` | One FAQ JSON-LD answer; acronym unexplained on pillars |

## Verdict

**In the product:** One ecosystem — `lib/feed/feed-taxonomy.ts` unifies direction, kind, category, exchange; homepage mobile strip links five pillars (food, garden, creations, gezocht, services).

**For AI:** **Partially isolated.** Pillar cross-links (`PILLAR_HUB_SECTION`) connect craft narrative. **HCP, Business DNA, Community Orders, Delivery, Affiliate** lack a single indexable “ecosystem map” page linking them with consistent terminology. AI retrieval on “HomeCheff barter” may find `/buurt-economie`; “HomeCheff community order” likely finds **nothing**.

## `gemeenschap` JSON-LD gap

English metadata titles exist (`titleEn`) but JSON-LD always uses `m.titleNl` — breaks multilingual entity consistency for EU English domain.

---

# Part 6 — Authority Signals

| Signal | Present? | AI trust contribution |
|--------|----------|----------------------|
| About (`/over-ons`) | ✅ | Mission, legal entity, email routing table |
| Contact (`/contact`) | ✅ | Form + support path |
| Policies (privacy, terms) | ✅ | Standard trust |
| Legal (KvK, BTW in About/footer) | ✅ | **Not in schema** — copy only |
| Transparency (fees `/pricing`) | ✅ | Post-13Q softened claims |
| Mission | ✅ | Aligned with SSOT |
| Founder | ⚠️ | Pitch `noindex`; PDF mentions Sergio Arrias — **not citabl**e |
| Trust (reviews, disputes) | ⚠️ Partial | Product reviews in schema; dispute process in FAQ/legal |
| Reviews (platform-level) | ❌ | No Trustpilot/Google aggregate in markup |
| Community (guidelines, safety) | ✅ | Dated policy pages (May 2026) |
| HCP / reputation | ⚠️ | `/hcp-ranglijsten` exists; thin AI explanation |

## Enough for AI recommendations?

**For cautious recommendation** (“you can try…”): **Almost** — legal identity, fees, safety, and mission are present.

**For confident recommendation** (“use HomeCheff for…”): **Not yet** — missing third-party corroboration (`sameAs`, reviews), competitor positioning, and local supply proof pages that answer “is anyone active in my city?” without sparse city hubs (13Q `shouldIndexCityHub` may noindex).

**Truth risk for AI:** Any model ingesting pre-13Q copies or food-only snippets may cite **outdated food-only positioning** or **overclaim** subscription benefits if it reads unmigrated DNA copy — Phase 13O flagged discovery boost / GDPR stub.

---

# Part 7 — Content Gaps (questions people ask AI)

Ranked by likelihood in generative search + business impact.

### P0 — Wrong or missing answers cause misrepresentation

| Gap | Example query | Why P0 |
|-----|---------------|--------|
| Named competitor comparisons | “HomeCheff vs Etsy” | Users ask AI directly; site silent → model hallucinates or defaults to “food marketplace” |
| Unified ecosystem map | “What is HCP on HomeCheff?” / “What is a community order?” | Features exist; no extractable definitions → isolation |
| Legal entity in machine-readable form | “Is HomeCheff legitimate?” / “Who operates HomeCheff?” | KvK in HTML only |
| Corpus / identity alignment | “Is HomeCheff only for food?” | Food URL volume contradicts pillars without explicit reconciliation page |

### P1 — High-intent discovery lost

| Gap | Example query |
|-----|---------------|
| City / pilot locality proof | “HomeCheff Vlaardingen” / “makers near me Rotterdam” |
| Services-selling guide | “Can I offer guitar lessons on HomeCheff?” |
| Delivery role in ecosystem | “How does delivery work on HomeCheff?” |
| Business DNA plain-language | “HomeCheff subscription plans explained” |
| EN pillar parity | “What is HomeCheff?” (EN user, NL-only pillar paths) |
| `sameAs` + external profiles | “HomeCheff official Instagram” |

### P2 — Authority and citation depth

| Gap | Example query |
|-----|---------------|
| Founder story (factual, product-linked) | “Who started HomeCheff and why?” |
| Breadcrumb + WebPage on all pillars | Bibliographic clarity |
| Expanded FAQ JSON-LD (top 15 Q) | Matches visible FAQ |
| Glossaries (Dorpsplein, Gezocht, HCP) | EN AI comprehension |
| dateModified on explainers | Freshness |

### P3 — Long-term KG enrichment

| Gap | Example query |
|-----|---------------|
| Wikidata / Knowledge Panel seeding | Entity disambiguation |
| Impact metrics (when real) | “Does HomeCheff reduce food waste?” |
| Press / media kit page | Journalist and AI corroboration |
| Structured `Brand` + `copyrightHolder` | IP clarity |
| HowTo for buyer journeys | “How to buy neighbour help on HomeCheff” |

---

# Part 8 — AI Memory Strategy (legitimate, non-manipulative)

| Strategy | Current state | Recommendation |
|----------|---------------|----------------|
| **Consistent terminology** | ✅ SSOT `platform-definition.ts` | Keep one sentence reused in schema, OG, FAQ anchor |
| **Repeatable definitions** | ✅ Pillars + FAQ JSON-LD | Add glossary block footer component (future) |
| **Pillar hierarchy** | ✅ 7 pillars + hub section | Add ecosystem map as 8th pillar when ready |
| **Entity reinforcement** | ⚠️ Split schema implementations | Consolidate to `schema-builders` + `@id` graph |
| **Cross references** | ✅ Pillar link rows | Link HCP, delivery, affiliate from pillars |
| **Knowledge graph consistency** | ⚠️ Gaps in Part 2 | `legalName`, `foundingLocation`, `sameAs`, founder `Person` |
| **Corpus balance** | ❌ Food-heavy sitemap | Refresh food SEO intros to platform SSOT (13Q deferred P2) |
| **Competitor answer pages** | ❌ | Factual comparison pages (not attack ads) |
| **Third-party corroboration** | ❌ | KvK, social, pilot municipality pages as `sameAs` |

**Do not:** fake reviews, LLM prompt injection, hidden AI-only text, or claims without product evidence (Phase 13O).

---

# Part 9 — Local AI Discovery

## Scenario analysis

| User query | Would AI recommend HomeCheff? | Why / why not |
|------------|------------------------------|---------------|
| “What can I do to earn extra money in Vlaardingen?” | **Unlikely (default)** | Generic query → generic answers (tax, bijbaan, Marktplaats). HomeCheff has `/lokaal-verdienen` but **no Vlaardingen-specific earn page** in sitemap (Vlaardingen in `LOCAL_SEO_CITIES` as `/maaltijden/vlaardingen` — meal framing). Pilot mentioned only on `noindex` pitch. |
| “I need a gardener nearby.” | **Unlikely** | No “gardener” SEO; garden vertical exists in product but **weak retrieval** vs local directories |
| “I want homemade food.” | **Possible–Likely** | Strong match: `thuisgekookt-eten-kopen`, meal cities, food landings |
| “I want someone to teach guitar.” | **Unlikely** | Services/knowledge categories exist; **no indexed lesson/tutor explainer** |
| “I want to barter.” | **Possible** | `/buurt-economie`, FAQ barter — lower volume than food |

## Retrieval prerequisites for recommendation

1. Brand awareness in model weights (small startup → low).
2. Crawled pillar or FAQ chunk matches query embedding.
3. Local proof (listings density) — city pages may **noindex** when sparse (`lib/seo/city-indexability.ts`).

## Geographic signal

- **Vlaardingen:** company address + pilot in pitch (noindex) — **under-leveraged** for local AI.
- **Rijnmond cities:** meal pages indexed; craft breadth in body copy but URL says `maaltijden`.

---

# Part 10 — Founder Philosophy Integration (product-backed only)

Use Arriasis philosophy **only where the product demonstrates it** (Phase 13O mapping). Never exaggerate.

| Philosophy theme | Strengthens AI understanding when… | Current public evidence | Do not claim until… |
|------------------|-------------------------------------|-------------------------|---------------------|
| Social cohesion | Explained as neighbour help, Gezocht, community orders | `/buurthulp`, `/buurt-economie`, FAQ | Measured community outcomes |
| Personal craftsmanship | Defined consistently | SSOT + pillars ✅ | — |
| Technology serving humans | Anti-attention, calm discovery | `/wat-we-niet-zijn`, Phase 13O anti-manipulation audit | Avoid if citing streaks/leaderboards without context |
| Local opportunity | Earn paths, transparent fees | `/lokaal-verdienen`, `/pricing` | Guaranteed income |
| Community economy | Barter, proposals, checkout optional | FAQ + pillars | Platform-wide economic impact stats |
| Human dignity | Person behind offer, no anonymous mass | `/ontmoet-de-maker`, ProfilePage schema | — |
| Waste reduction / reuse | Barter, surplus framing | FAQ selling, community economy honest copy | Measured kg waste (13O: not tracked) |
| Ethical monetization | Transparent fees | Pricing, DNA compare (softened 13Q) | Discovery boost as live ranking |

**Where philosophy hurts AI clarity:** Subscription DNA still visible on `/sell` — if crawlers index “visibility multiplier” language, AI may cite **capabilities Phase 13O marked not live in feed ranking**.

**Founder visibility:** Sergio Arrias appears in pitch PDF only — **appropriate** not to center founder in AI graph until a factual, non-marketing About section exists (product-linked: pilot, Vlaardingen, mission origin).

---

# Opportunity register (implementation backlog — audit only)

| ID | Priority | Item | Rationale |
|----|----------|------|-----------|
| 13R-01 | P0 | Factual competitor comparison pages (Etsy, Marktplaats, FB, Nextdoor, Vinted, delivery) | Generative search direct questions |
| 13R-02 | P0 | Organization graph enrichment: `legalName`, `foundingLocation`, `contactPoint`, `sameAs` | Knowledge panel / disambiguation |
| 13R-03 | P0 | Single schema SSOT (`schema-builders`) wired on homepage + About | Eliminate drift |
| 13R-04 | P0 | Ecosystem map page linking HCP, DNA, orders, delivery, affiliate | Part 5 isolation |
| 13R-05 | P1 | Expand FAQ JSON-LD to top 15 Q (plain text) | Citation + GSO |
| 13R-06 | P1 | EN routes or hreflang for pillar content | EU English AI users |
| 13R-07 | P1 | Vlaardingen / pilot locality page (factual) | Local AI discovery |
| 13R-08 | P1 | Services & lessons explainer pillar | Tutor/gardener queries |
| 13R-09 | P1 | Fix `gemeenschap` JSON-LD language | EN entity consistency |
| 13R-10 | P2 | Food SEO corpus refresh to SSOT intros | Corpus balance |
| 13R-11 | P2 | Founder paragraph on About (factual) | “Who founded” queries |
| 13R-12 | P2 | BreadcrumbList on pillars + About | Citation structure |
| 13R-13 | P3 | Wikidata item + press kit | External corroboration |

---

# Validation references

| Check | Command |
|-------|---------|
| Phase 13R validator | `npx tsx scripts/validate-ai-authority-phase13r.ts` |
| Lint | `npm run lint` |
| Build | `npm run build` |

---

# Appendix — Sitemap corpus snapshot (2026-07-11)

| Bucket | Count |
|--------|------:|
| Total sitemap URLs | 88 |
| Craft pillars | 7 |
| `gemeenschap` ecosystems | 5 |
| NL programmatic SEO | 20 |
| EN programmatic SEO | 20 |
| Food-tagged NL SEO slugs | 14 |
| Static food root landings | 5 |
| `/maaltijden/[stad]` | 16 |
| `/eten-verkopen-*` | 6 |

**Ratio:** ~41 food-skewed paths vs ~12 craft-hub paths (excluding generic static pages like FAQ/About).

---

*End of Phase 13R audit. No product changes in this phase.*
