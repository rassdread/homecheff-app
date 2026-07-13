# HomeCheff Performance Phase 3A — Feed Server Critical Path Optimization

**Datum:** 2026-07-12  
**Scope:** `/api/feed` server critical path · contract-safe · geen Render/Redis/infra-migratie  
**Baseline:** preview-run met `FEED_PERF_TIMING=1` (ingelogd, national)

---

## 1. Gemeten baseline (preview, vóór 3A)

| Metriek | Waarde |
|---------|--------|
| Client feed-fetch | 7.092 ms |
| Server total | 6.538 ms |
| auth | 6 ms |
| geo | 0 ms |
| feed-db | 2.733 ms |
| transform | 2 ms |
| stats | 775 ms |
| trust | 1.520 ms |
| discovery (aggregate bucket) | 1.494 ms |
| mapping | 0 ms |
| serialize | 8 ms |
| Prisma queries | 7 |
| Prisma summed | 7.944 ms |
| Slowest query | `Dish.findMany` ~2.730 ms |
| Response bytes | ~34.463 |
| Response items | 10 |
| DB pool | 7 products, 22 dishes |
| Trust sellers | 4 uniek |

**Discovery intern (niet gelijk aan discovery-bucket):**

| Submetriek | Waarde |
|------------|--------|
| sectionBuildMs | 1.15 ms |
| dedupMs | 0.16 ms |
| **Gap ~1.49 s** | statsPreview + discovery attach + activity eligibility |

---

## 2. Query-analyse (Deel 1)

### 2.1 `Product.findMany`

| Veld | Waarde |
|------|--------|
| **Callsite** | `app/api/feed/route.ts` (feed-db fase) |
| **where** | `isActive: true` OR inactive met betaalde `orderItems`; optioneel text, `listingIntent`, `productCategory` |
| **select** | Id/titel/prijs/seller.User/Image/Video — geen geo-bbox op DB |
| **orderBy** | `createdAt desc` |
| **take** | was **100** → 3A: **`FEED_DB_PRODUCT_CAP` = 60** |
| **Relaties** | `seller.User`, `Image[]`, `Video` 1:1 |
| **Eerste tegel nodig** | id, title, price, images[0], seller display, coords |
| **Overfetch** | 100 nationale producten; diepe seller+media graph |
| **Index** | `@@index([isActive, createdAt(sort: Desc)])` aanwezig |
| **Risico scan** | `OR` + `orderItems.some` op inactieve producten — relation filter |

### 2.2 `Dish.findMany`

| Veld | Waarde |
|------|--------|
| **Callsite** | `app/api/feed/route.ts` (feed-db fase, na products) |
| **where** | `status: PUBLISHED`; optioneel bbox; category; **3A:** `id notIn linkedProductIds` |
| **include** | `user`, `photos[]`, `videos take:1` |
| **orderBy** | `createdAt desc` |
| **take** | was **50** → 3A: **`FEED_DB_DISH_CAP` = 30** |
| **22 records @ 2.73 s** | Geen ontbrekende take; **wel** nationale scan zonder `(status, createdAt)` index; parallel contention met product-query; linked dishes dubbel opgehaald |
| **Index gap** | Geen `@@index([status, createdAt])` — zie §7 |

### 2.3 `Listing.findMany`

| Veld | Waarde |
|------|--------|
| **take** | was 50 → **35** |
| **where** | `isPublic: true` + optioneel bbox/text/category |
| **include** | `User`, `ListingMedia[]` |

### 2.4 Vier stats groupBy (listing-niveau)

| # | Query | Callsite | Scope vóór 3A | Scope 3A |
|---|-------|----------|---------------|----------|
| 1 | `analyticsEvent.groupBy` | route ~677 | marketplace pool ≤80 | pool ≤**50** |
| 2 | `productReview.groupBy` count | route ~689 | idem | idem |
| 3 | `productReview.groupBy` avg | route ~699 | idem | idem |
| 4 | `favorite.groupBy` | route ~708 | idem | idem |

Parallel via `Promise.all` — **geen N+1**. IDs beperkt tot enrichment-pool.

### 2.5 Trust / business DNA

| Stap | Bestand | Patroon |
|------|---------|---------|
| Badges | `author-badge-summaries.ts` | 1× batch `userBadge.findMany` |
| Snapshots | `fetch-seller-trust-snapshots.ts` | ~16 parallel queries per **unieke seller batch** |
| Business plan | `visibility-profile.ts` | In snapshot-build per sellerProfile |
| Order counts | `countDeliveredOrderItemsByProductId` | was `orderItem.findMany` → **3A: `groupBy`** |

Trust draait **1× per unieke seller** in enrichment-pool (niet per listing). 3A verkleint pool 80→50 sellers max.

### 2.6 statsPreview (zwaar, zat in discovery-bucket)

| Veld | Waarde |
|------|--------|
| **Was** | Tot 9 sellers uit enrichment-pool vóór discovery |
| **Per seller** | `computeUserPublicStats` ~8–10 queries (`userStatsBatchPreview.ts`) |
| **3A** | Alleen sellers in **`pageItems`** (max 9); product reviews via **`aggregate`** i.p.v. `findMany` |

---

## 3. Enrichment-volgorde (Deel 2)

### Vóór 3A

1. DB: Product(100) + Listing(50) + Dish(50) parallel  
2. Transform + combine **zonder** cross-source dedup  
3. Sort → marketplace pool **80** + inspiration tail  
4. Stats groupBy op 80 IDs  
5. Trust op alle unieke sellers in pool  
6. statsPreview op 9 sellers uit pool  
7. Discovery attach + sections + activity DB  
8. Cap 40 → paginate 10  

### Na 3A

1. DB: Product(**60**) → Listing(**35**) + Dish(**30**, `notIn` product IDs)  
2. Transform + **`deduplicateCrossSourceFeedItems`** (PRODUCT > LISTING > DISH)  
3. Sort → enrichment pool **50**  
4. Stats + trust **alleen** op pool sellers  
5. Discovery attach → sections → activity (sub-timing)  
6. Response assemble → **statsPreview alleen pageItems sellers**  
7. Paginate + serialize  

**Kandidatenvenster** gedocumenteerd in `lib/feed/feed-candidate-window.ts`.

---

## 4. Discovery timing-gap (Deel 5)

De legacy bucket `discovery` (= `trust_business_dna_done` → `discovery_done`) bevatte:

| Fase | Geschatte kosten |
|------|------------------|
| `batchComputeUserStatsPreview` | **~1.0–1.3 s** (9×8 queries) |
| `attachFeedItemDiscovery` × N | CPU, laag |
| `buildDiscoveryFeed` | sectionBuildMs 1.15 ms |
| Activity eligibility + surfaces | 2–4 extra Prisma queries |

**3A timing-fases** (`lib/feed/feed-api-timing.ts`):

- `discovery-attach`
- `discovery-sections`
- `discovery-activity`
- `stats-preview` (na `response_mapped`)
- Legacy aggregate `discovery` blijft voor dashboards

---

## 5. PRODUCT/DISH-duplicaat (Deel 6)

**ID:** `fcc5ff2a-651a-4983-9d17-b3f1acf7ca17`

**Oorzaak (bewezen in code):**

- `lib/items/sync-linked-product-dish.ts` maakt Dish met **`id: product.id`**
- Feed haalt Product en Dish onafhankelijk op
- PRODUCT → marketplace pool; DISH → inspiration tail (`marketplace-sale.ts`: `source === 'DISH'`)

**3A-fix:**

- `deduplicateCrossSourceFeedItems` — zelfde UUID: PRODUCT wint
- Dish-query: `id notIn linkedProductIds` — geen DB-fetch voor linked twin

**Uitzondering:** Dish zonder actief Product blijft als DISH/inspiration.

---

## 6. Geïmplementeerde wijzigingen

| Bestand | Wijziging |
|---------|-----------|
| `lib/feed/feed-candidate-window.ts` | **Nieuw** — caps, cross-source dedup, seller collector |
| `app/api/feed/route.ts` | Twee-fase DB, dedup, kleinere pools, statsPreview defer, timing marks |
| `lib/discovery/trust/fetch-seller-trust-snapshots.ts` | `orderItem.groupBy` i.p.v. `findMany` |
| `lib/stats/compute-user-public-stats.ts` | `productReview.aggregate` i.p.v. `findMany` |
| `lib/feed/feed-api-timing.ts` | Sub-buckets discovery + stats-preview |
| `scripts/validate-feed-contract-phase3a.ts` | **Nieuw** — contract guards |

---

## 7. Indexvoorstellen (Deel 7 — geen migratie in 3A)

| # | Tabel | Kolommen | Query | Voordeel | Schrijfoverhead | Risico |
|---|-------|----------|-------|----------|-----------------|--------|
| 1 | `Dish` | `(status, createdAt DESC)` | `findMany PUBLISHED orderBy createdAt` | Minder seq scan op feed-db | Laag per insert | Laag |
| 2 | `Dish` | `(status, lat, lng)` | bbox radius filter | Snellere local/radius | Medium | Medium — nullable coords |
| 3 | `Product` | `(isActive, category, createdAt DESC)` | vertical filter national | Kleinere sort sets | Laag | Laag |
| 4 | `OrderItem` | `(productId)` + FK index check | trust `groupBy` delivered | Snellere trust aggregate | Bestaand mogelijk | Laag |
| 5 | `AnalyticsEvent` | `(entityId, eventType, entityType)` | stats groupBy views | Snellere stats fase | Medium op writes | Laag |

**Phase 3B:** `EXPLAIN ANALYZE` op Neon + migratie-review.

---

## 8. Contractveiligheid (Deel 8)

Ongewijzigd:

- Response-schema, pagination, filters, scopes  
- Auth, visibility, Stripe filters, taxonomy  
- Discovery sections, trust tiers, statsPreview shape  
- Capacitor-compatibiliteit  

**Nieuwe validator:** `scripts/validate-feed-contract-phase3a.ts`

---

## 9. Streefwaarden & verwachte impact

| Bucket | Baseline | Streef 3A | Mechanisme |
|--------|----------|-----------|------------|
| feed-db | 2.733 ms | < 1.250 ms | Kleinere takes, dish `notIn`, minder rows |
| trust | 1.520 ms | < 500 ms | Kleinere seller set, `groupBy` orders |
| stats | 775 ms | < 350 ms | Kleinere ID-set listing stats |
| stats-preview | ~1.3 s (in discovery) | < 400 ms | Alleen page sellers + aggregate |
| discovery-sections | 1.15 ms | ~gelijk | Geen wijziging ranking |
| server total | 6.538 ms | < 2.500 ms | Som bovenstaande |

**Geen productie-after meting in deze sessie** — zie [before-after doc](./homecheff-performance-phase3a-before-after.md).

---

## 10. Resterende risico’s

1. **Enrichment pool 50** i.p.v. 80 kan zeldzame discovery-ranking verschuiven — monitor discovery secties op preview.  
2. **Product vóór Dish sequential** — +latency op product-query, maar minder dish-werk; netto verwacht positief.  
3. **Cross-source dedup** — linked DISH met afwijkende inspiration-content verdwijnt; PRODUCT is canonical sale.  
4. **Indexen** — feed-db blijft gevoelig op national zonder migratie.  
5. **statsPreview** — alleen sellers op **huidige pagina**; pagina 2+ kan andere sellers in preview missen (was al pool-based).

---

## Bevestiging

| Item | Status |
|------|--------|
| Render / Redis | ❌ Niet toegevoegd |
| DB migratie | ❌ Niet uitgevoerd |
| Auth / UI / GeoFeed | ❌ Ongewijzigd |
| Commit / push | ❌ Niet uitgevoerd |
