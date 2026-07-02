# HomeCheff Feed Taxonomy (Fase 5D)

Centrale classificatielaag voor de feed — voorbereid op Ecosysteem V3 (Aanbod + Vraag).

Gerelateerd: [Ecosysteem V3](./HOMECHEFF_ECOSYSTEM_V3.md) · [Local Discovery](./HOMECHEFF_LOCAL_DISCOVERY.md)

---

## Status

**Feed Taxonomy Foundation (Fase 5D)** — afgeleide classificatie en gecentraliseerde href/card-router. Geen REQUEST-items in productie, geen DB-migraties.

---

## Dimensies

### direction

| Waarde | Betekenis |
|--------|-----------|
| `OFFER` | Iemand biedt iets aan |
| `REQUEST` | Iemand vraagt iets (toekomst) |

### kind

| Waarde | Betekenis |
|--------|-----------|
| `PRODUCT` | Marketplace-product (nu: sale met prijs) |
| `SERVICE` | Dienst-aanbod (toekomst) |
| `INSPIRATION` | Content zonder verkoopprijs |
| `TASK` | Klusje / hulpvraag (toekomst) |
| `BARTER` | Ruil (toekomst) |

### category

| Waarde | Ecosystem V3 | Legacy DB/UI |
|--------|--------------|--------------|
| `FOOD` | Eten & Drinken | `CHEFF`, `HOMECHEFF` |
| `GARDEN` | Tuin & Natuur | `GROWN`, `GARDEN` |
| `CREATIVE` | Creatief & Gemaakt | `DESIGNER` |
| `HELP` | Hulp & Klusjes | *(future — geen enum in 5D)* |

### exchange

| Waarde | Betekenis |
|--------|-----------|
| `MONEY` | HomeCheff checkout / verkoopprijs |
| `CONTACT` | Contact-only / geen checkout |
| `BARTER` | Ruil (toekomst) |
| `RECIPROCITY` | Wederdienst (toekomst) |

---

## Afleiding vandaag (geen DB)

Helper: `deriveFeedTaxonomy()` in `lib/feed/feed-taxonomy.ts`

| Input | Taxonomy |
|-------|----------|
| `priceCents > 0` + `HOMECHEFF_PAYMENT` | `OFFER` · `PRODUCT` · `MONEY` |
| `priceCents > 0` + `CONTACT` | `OFFER` · `PRODUCT` · `CONTACT` |
| Geen verkoopprijs | `OFFER` · `INSPIRATION` · `CONTACT` |

Category uit `Product.category` / dish category via `mapLegacyCategoryToFeedCategory()`.

---

## View filters vs. item identity

| Concept | Vandaag | Toekomst |
|---------|---------|----------|
| **View filter (UI)** | `all`, `sale`, `inspiration` | + `offer`, `request`, `for_sale`, … |
| **Item taxonomy (data)** | Afgeleid `FeedTaxonomy` | Expliciet op records |

**Belangrijk:** `sale` chip ≠ `kind` alleen — chip = view filter voor `OFFER · PRODUCT`.

Helpers: `matchesFeedViewFilter()`, `FeedChip` type alias.

---

## Href resolver

`resolveFeedItemHref()` in `lib/feed/feed-item-href.ts`

| kind | Route (nu) |
|------|------------|
| `PRODUCT` | `/product/[slug]` |
| `INSPIRATION` | `/recipe`, `/garden`, `/design`, `/inspiratie` |
| `REQUEST`, `TASK`, `BARTER` | TODO — geen actieve routes |

SEO-routes ongewijzigd.

---

## Card router

`FeedMarketplaceCard` — delegeert naar `FeedSaleCard` / `FeedInspirationCard*`.  
`FeedRequestCard` — TODO (Fase 5E+).

---

## Filter registry

`lib/feed/filter-registry.ts` — declaratieve skeleton per direction × category.  
Nog niet wired naar API `subfilters`.

---

## Bestanden

| Bestand | Rol |
|---------|-----|
| `lib/feed/feed-taxonomy.ts` | Types, derive, view filter helpers, category map |
| `lib/feed/feed-types.ts` | `FeedClassifiable` |
| `lib/feed/feed-item-href.ts` | `resolveFeedItemHref()` |
| `lib/feed/filter-registry.ts` | Advanced filter skeleton |
| `components/feed/feedItemClassification.ts` | Legacy re-exports |
| `components/feed/FeedMarketplaceCard.tsx` | Card router |
| `app/api/feed/route.ts` | `taxonomy` op response items |

---

## Niet gebouwd (5D)

- REQUEST feed-items, DB-tabellen, formulieren
- DeliveryRequest, Assignment, HelperCapabilities
- HELP Prisma enum
- Request routes, FeedRequestCard
- Ruilen, wederdiensten

---

## Volgende fase (advies)

**DeliveryRequest MVP** of **HELP category enum** — taxonomy-laag maakt beide plug-in ready.
