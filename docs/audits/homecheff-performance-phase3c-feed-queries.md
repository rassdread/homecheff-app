# Phase 3C — Feed Query Analysis

**Datum:** 2026-07-12

---

## Preview baseline

| Query | Run 1 | Run 2 | Run 3 | Gemiddeld |
|-------|-------|-------|-------|-----------|
| Product.findMany | 1593 ms | 1404 ms | 1400 ms | **~1466 ms** |
| Dish.findMany | 1427 ms | 1336 ms | 1502 ms | **~1422 ms** |
| linked media | 558 ms | 558 ms | 557 ms | **~558 ms** |

---

## Product.findMany — oorzaak latency

### Where-clause

```sql
WHERE (isActive = true OR (isActive = false AND paid orderItems))
  [+ optional text search, listingIntent, category]
ORDER BY createdAt DESC
TAKE 60
```

### Root causes (3C analyse)

1. **Image.fileUrl base64** — legacy Product records (Sacco, Marilyn) hadden ~155–345 KB `data:` URLs per Image row; volledige bytes werden via Prisma relation geladen.
2. **Diepe seller/User select** — 15+ User velden per product; nodig voor tiles maar niet gecomprimeerd.
3. **OR paid-inactive clause** — kan index `(isActive, createdAt)` verzwakken bij mixed scan.
4. **Post-filter** — `passesFeedProductStripeFilter` in JS na query (niet in SQL).

### 3C fix

| Wijziging | Effect |
|-----------|--------|
| `Image.select: { sortOrder }` only | Geen fileUrl bytes in hoofdquery |
| `loadProductImageMetadata()` raw SQL | `CASE WHEN data: THEN 'legacy' ELSE LEFT(url,1024)` |
| Proxy URL via `/api/feed/media` | Legacy bytes alleen op image request |

### Index (bestaand)

```prisma
@@index([isActive, createdAt(sort: Desc)])  // Product — al aanwezig
```

---

## Dish.findMany — oorzaak latency

### Where-clause

```
status = PUBLISHED
id NOT IN (linkedProductIds)
[+ text search, bbox, category]
ORDER BY createdAt DESC
TAKE 30
```

### Root causes

1. **Geen `(status, createdAt)` index** — alleen `@@index([userId])`; national feed = seq scan + sort.
2. **DishPhoto.url base64** — zelfde probleem als Product Image.
3. **Volledige user include** — nodig voor seller display.

### 3C fix

| Wijziging | Effect |
|-----------|--------|
| `photos.select: { idx }` only | Geen photo URL bytes |
| `loadDishPhotoMetadata()` | Metadata parallel na dish query |
| `resolveFeedUrlsFromMetadata()` | Proxy voor legacy |

Zie [index proposal](homecheff-performance-phase3c-index-proposal.md) voor Dish index.

---

## Request graph

### Vóór 3C

```
Product (incl Image.fileUrl bytes) ─┐
Listing ────────────────────────────┼─► Dish (incl photos.url bytes)
                                    └─► linked ALL ids (photos.url bytes)
                                        ─► transform ─► trust (16 queries)
```

### Na 3C

```
Product (Image.sortOrder only) ─┐
Listing ────────────────────────┼─► productMetadata (raw SQL, parallel)
                                ├─► Dish (photos.idx only)
                                └─► linked SUBSET (no photos, videos only)
                                    ─► dishMetadata (raw SQL)
                                        ─► transform ─► trust minimal (11 queries)
```

---

## Gewijzigde bestanden

- [app/api/feed/route.ts](app/api/feed/route.ts)
- [lib/feed/feed-media-metadata.server.ts](lib/feed/feed-media-metadata.server.ts)
- [lib/feed/resolve-feed-media-url.ts](lib/feed/resolve-feed-media-url.ts)

---

## Validatie

`scripts/validate-feed-queries-phase3c.ts` — **7/7**
