# HomeCheff Performance Phase 3B — Critical Path Reduction

**Datum:** 2026-07-12  
**Branch:** `performance/phase2-baseline` (lokaal)  
**Status:** geïmplementeerd · **geen commit/push/deploy**

---

## Uitgangspunt (gemeten na 3A + Fix2)

| Metriek | Baseline | Na 3A |
|---------|----------|-------|
| Server total | 6.538 ms | **6.095 ms** |
| Prisma total | 7.944 ms | **4.773 ms** |
| stats-preview bucket | ~0 (in discovery gap) | **~1.485 ms** |
| trust | 1.520 ms | **1.297 ms** |
| feed-db | 2.733 ms | **~3.012 ms** |
| Dish.findMany | 2.730 ms | **1.506 ms** |

Client: `geoFeedMounts=1`, `feedFetches=1`, images OK.

---

## 3B wijziging 1 — statsPreview uit kritieke pad

### Bewezen gebruik

| Consumer | Kritiek voor feed? |
|----------|-------------------|
| `seedCachedUserStats()` in GeoFeed | **Nee** — cache voor UserStatsTile |
| Tile rendering | **Nee** |
| Discovery / trust / ranking | **Nee** |

### Implementatie

| Onderdeel | Wijziging |
|-----------|-----------|
| `POST /api/feed/stats-preview` | Batch max 15 UUID sellerIds, publieke stats |
| `app/api/feed/route.ts` | **Geen** `await batchComputeUserStatsPreview` meer |
| `lib/feed/feed-deferred-stats-preview.ts` | `requestIdleCallback` na eerste render |
| `GeoFeed.tsx` | `scheduleDeferredFeedStatsPreview(items)` via `useEffect` |

### Verwachte impact (niet opnieuw gemeten in deze sessie)

| Metriek | Vóór 3B | Verwacht na 3B |
|---------|---------|----------------|
| Feed server critical path | ~6.095 ms | **~4.600 ms** (−~1.485 ms stats-preview) |
| stats-preview endpoint | — | ~1.400–1.600 ms (parallel, non-blocking) |
| Time to first tile | ongewijzigd of sneller | geen wachten op stats |
| Stats cache seeded | tijdens feed-fetch | **na** idle + POST (~+100–500 ms na first paint) |

Nieuwe client marks: `feed:stats-preview-request-start`, `feed:stats-preview-seeded`.

---

## DB sub-timing (Deel 4)

Nieuwe server buckets in `feed-api-timing.ts`:

| Bucket | Fase |
|--------|------|
| `db-product` | `viewer_geo` → `db_product_listing_done` (product query wall) |
| `db-dish` | product/listing → `db_dish_linked_done` |
| `db-linked-media` | idem (parallel met dish) |
| `feed-db` | aggregate beide batches |

`debug.perf.counts`: `dbProductMs`, `dbListingMs`, `dbDishMs`, `dbLinkedMediaMs`.

### Parallel-strategie (gemeten via structuur, niet herbenchmarkt)

| Strategie | Haalbaar? | Reden |
|-----------|-----------|-------|
| Product ‖ Listing | **Ja** (behouden) | Geen onderlinge afhankelijkheid |
| Dish ‖ linked-media | **Ja** (behouden) | linked IDs uit product-batch |
| Alles parallel | **Nee** | `linkedProductIds` vereist product-resultaat |
| Dish vóór product | **Nee** | `notIn linkedProductIds` |

---

## Dish index (Deel 5 — voorstel, geen migratie)

```prisma
@@index([status, createdAt(sort: Desc)])
```

Optioneel bbox-hulp:

```prisma
@@index([status, lat, lng])
```

National feed scan zonder `(status, createdAt)` verklaart resterende ~1.5 s Dish.findMany.

---

## Gewijzigde bestanden

| Bestand | Rol |
|---------|------|
| `app/api/feed/stats-preview/route.ts` | Deferred stats endpoint |
| `lib/feed/feed-stats-preview.ts` | Input validation |
| `lib/feed/feed-deferred-stats-preview.ts` | Client defer |
| `app/api/feed/route.ts` | Stats removed, DB sub-timing, cache policy |
| `lib/feed/feed-api-timing.ts` | Nieuwe buckets |
| `lib/feed/feed-cache-policy.ts` | Cache tiers A–D |
| `lib/feed/trust-enrichment-timing.ts` | Trust wall-clock |
| `components/feed/GeoFeed.tsx` | Deferred stats client |
| `lib/feed/feed-performance-baseline.ts` | Stats defer marks |
| `scripts/validate-feed-*-phase3b.ts` | Contract validators |

---

## Validatie

| Check | Resultaat |
|-------|-----------|
| `npm run lint` | pass |
| `npm run build` | pass |
| Phase 3A validator | 68/68 |
| Phase 13K validator | 23/23 |
| Stats defer 3B | 9/9 |
| Cache safety 3B | 11/11 |
| Trust+media 3B | 10/10 |

---

## Git

**Geen commit. Geen push. Geen deployment. Geen migraties. Geen Render-wijzigingen.**
