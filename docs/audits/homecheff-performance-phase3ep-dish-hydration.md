# Phase 3E+ — Dish IDs-first hydration

**Datum:** 2026-07-13  
**Branch:** `performance/phase3e-production-cold-path` (lokaal, niet gepusht)  
**Baseline:** Phase 3E preview warm p50 Dish **1205 ms** (`2c91ef1`)

---

## Architectuur

### Stap 1 — Minimale dish-selectie

`fetchFeedPublishedDishes` strategy `ids_first` (default):

```text
dish.findMany({
  where, orderBy: createdAt DESC, take: FEED_DB_DISH_CAP,
  select: DISH_ID_SELECT   // geen user, photos, videos
})
```

Velden: `id`, `createdAt`, `userId`, tile-body (`title`, `priceCents`, `category`, geo, stock, …).

### Stap 2 — Parallelle batch-hydration

`hydrateDishesIdsFirst()`:

```text
Promise.all([
  batchHydrateFeedUsers(unique userIds),   // één User.findMany
  dishPhoto.findMany({ dishId: { in: ids } }),
  dishVideo.findMany({ dishId: { in: ids } }),
])
→ merge photos/videos per dish, preserve ID order
```

**Geen** nested `include` op hoofdquery.

---

## Parity

| Check | Resultaat |
|-------|-----------|
| `ids_first` ids = `include_full` | ✅ |
| `user.id` + photo/video counts | ✅ |
| `trimmed_user` legacy parity (3E) | ✅ |

Validator: `scripts/validate-feed-phase3ep-ids-first-parity.ts`

---

## Query-isolatie benchmark (Neon, 5 runs p50)

| Strategie | p50 | rows |
|-----------|-----|------|
| `include_full` (3D legacy) | 682 ms | 22 |
| `trimmed_user` (3E) | 758 ms | 22 |
| **`ids_first` (3E+)** | **501 ms** | 22 |

**~26% sneller** dan `include_full` in isolatie.

EXPLAIN `Dish` feed scan: index `Dish_status_createdAt_idx`, execution **0.05 ms** (kleine tabel; bottleneck = hydration/joins).

---

## Route-level timing (lokaal prod-mode, warm)

| Metriek | Phase 3E preview | 3E+ lokaal warm p50 |
|---------|------------------|---------------------|
| `dbDishMs` (wall) | ~1205 ms | **~576 ms** |
| `dbDishUserHydrateMs` | n.v.t. | **~553 ms** (incl. photo/video batch) |
| `dishMetadataMs` | n.v.t. | **~600 ms** (CDN URL resolve, overlapt deels) |

Slowest Prisma query (warm): `DishVideo.findMany` (350–640 ms) — kandidaat voor volgende fase.

---

## Media batching (DEEL 4)

| Pad | Query | Wanneer |
|-----|-------|---------|
| Dish tile photos/videos | `dishPhoto` + `dishVideo` IN batch | IDs-first hydrate |
| Product images | `loadProductImageMetadata(productIds)` | parallel met hydrate |
| Linked donor dishes | `loadDishPhotoMetadata(donorIds)` + `prisma.dish.findMany` videos | alleen `linkedIdsNeedingDonor` |

**Geen dubbele product-body load.** Product metadata en dish metadata zijn **gescheiden** batches (verschillende tabellen/contract); parallel uitgevoerd, geen gezamenlijke IN over Product+Dish (niet contractveilig).

---

## Seller/User batching (DEEL 3)

| Entiteit | Batch-functie | Uniek per feed |
|----------|---------------|----------------|
| Product sellers | `batchHydrateFeedSellers` | 7 profielen / 7 producten (fixture) |
| Dish users | `batchHydrateFeedUsers` | ≤ dish count |

**Geen dubbele Prisma seller-calls** binnen één request — één `sellerProfile.findMany` + één `user.findMany` voor dishes.

---

## Contractbehoud

- `notIn linkedProductIds`: ✅ ID-fase vóór dish-query
- Status `PUBLISHED` + radius/geo filters: ✅ ongewijzigd
- Video take 1, photo sort `idx`: ✅ parity
- Discovery/dedup: ✅ fixtures groen

---

## Risico's

1. **`DishVideo.findMany`** blijft slowest query — dominant in `dbDishUserHydrateMs`.
2. **Metadata wall** (`dishMetadataMs`) overlapt niet volledig met DB-fase — totale feed-tijd bevat beide.
3. Kleine datasets: batching-overhead relatief hoger.
