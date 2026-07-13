# Phase 3D — Dish Feed Query Plan (vóór index)

**Datum:** 2026-07-12  
**Branch:** `performance/phase2-baseline`  
**Database:** Neon dev (read-only EXPLAIN) — kleine dataset; preview-baseline uit Phase 3C-preview  
**Status:** analyse only — **geen productiemigratie uitgevoerd**

---

## 1. Exacte `Dish.findMany` (feed critical path)

Bron: [app/api/feed/route.ts](app/api/feed/route.ts) (~453–497).

| Aspect | Waarde |
|--------|--------|
| **Model** | `prisma.dish.findMany` |
| **status** | `PUBLISHED` (altijd) |
| **id notIn** | `linkedProductIds` wanneer Stripe-gefilterde producten IDs hebben |
| **Tekstzoek** | `buildDishTextSearchWhere(q)` wanneer `q` gezet |
| **Geo bbox** | `lat`/`lng` ± radius wanneer `lat`, `lng` en `effectiveRadius > 0` |
| **Categorie** | `category: productCategory` wanneer filter actief |
| **orderBy** | `[{ createdAt: "desc" }]` |
| **take** | `FEED_DB_DISH_CAP` (30) |
| **include user** | id, name, username, profileImage, display*, place, city, lat, lng, stripe* |
| **include photos** | `select: { idx: true }`, `orderBy: idx asc` |
| **include videos** | url, thumbnail; `orderBy createdAt desc`, `take: 1` |

National feed (`radius=0`, `scope=national`, geen `q`):  
`WHERE status = 'PUBLISHED' ORDER BY createdAt DESC LIMIT 30`.

---

## 2. Bestaande indexen op `Dish`

| Index | Kolommen |
|-------|----------|
| `Dish_pkey` | `id` |
| `Dish_userId_idx` | `userId` |

**Geen** `(status, createdAt)` index — national feed filtert op `status` zonder `userId`.

---

## 3. EXPLAIN ANALYZE — national dish (dev DB)

Dataset: 22 published dishes (alle rijen published).

```
Limit
  -> Sort (Sort Key: createdAt DESC, Method: quicksort Memory: 50kB)
       -> Seq Scan on "Dish"
            Filter: (status = 'PUBLISHED')
Planning Time: 0.096 ms
Execution Time: 0.080 ms
Buffers: shared hit=7
```

| Metriek | Waarde |
|---------|--------|
| Plan | **Sequential Scan** + **Sort** |
| Index gebruikt | Geen |
| Rows scanned | 22 (volledige tabel) |
| Rows returned | 22 (LIMIT 30) |
| Sort | In-memory quicksort |
| SQL execution | ~0.08 ms (tabel te klein voor representatieve DB-tijd) |

### Prisma wall-clock (dev, met includes)

5 runs: 448, 531, 592, 599, 652 ms → **p50 592 ms**, **p95 652 ms**.

Dominantie: Neon netwerk + Prisma relation fetches, niet lokale SQL. Preview (3C): **~1424 ms** gemiddeld — consistent met grote tabel + seq scan + sort op productie-achtige data.

---

## 4. Voorgestelde index — aansluiting op query

```prisma
@@index([status, createdAt(sort: Desc)])
```

Equivalent SQL:

```sql
CREATE INDEX "Dish_status_createdAt_idx" ON "Dish" ("status", "createdAt" DESC);
```

**Verwacht plan na index (national feed):**

```
Limit
  -> Index Scan Backward using Dish_status_createdAt_idx on Dish
       Index Cond: (status = 'PUBLISHED')
```

- Eerste kolom `status` = equality filter in WHERE ✓  
- Tweede kolom `createdAt DESC` = ORDER BY ✓  
- `LIMIT 30` = early stop via index scan ✓  
- `notIn`, bbox, category: extra filters na index scan — index blijft nuttig voor national/geo zonder userId

**Conclusie:** index sluit **direct** aan op de dominante dish-feed query. **Voor** index op preview/productie-data.

---

## 5. Risico's queryplan

| Risico | Mitigatie |
|--------|-----------|
| `notIn` grote lijst | Zeldzaam op national; monitor EXPLAIN na index |
| Bbox op lat/lng | Optionele fase-2 index `(status, lat, lng)` alleen bij bewezen behoefte |
| Include user/photos | Blijft aparte lookups; index helpt alleen hoofd-Dish select |

---

## 6. Go/no-go index (queryplan)

| Omgeving | Besluit |
|----------|---------|
| Dev EXPLAIN | **GO** — seq scan bevestigd; index past bij query |
| Preview DB | **GO** na CONCURRENTLY rollout + hermeting |
| Productie | **GO** met `CREATE INDEX CONCURRENTLY` + rollback plan |
