# Phase 3E+ — Product IDs-first hydration

**Datum:** 2026-07-13  
**Branch:** `performance/phase3e-production-cold-path` (lokaal, niet gepusht)  
**Baseline:** Phase 3E preview warm p50 Product **1292 ms** (`2c91ef1`)

---

## Architectuur

### Stap 1 — ID-selectie (geen nested relations)

`fetchFeedProductIdRows()` voert parallel uit:

- `product.findMany` **active** (`isActive: true`)
- `product.findMany` **inactive+paid** (`orderItems → Order.stripeSessionId`)

Select alleen:

| Veld | Doel |
|------|------|
| `id`, `createdAt` | sort + pagination |
| `sellerId` | seller batch |
| `isActive` | visibility |
| `priceCents`, `orderMethod` | payment/Stripe gate |
| `_count.Image` | linked-donor detectie |
| `seller.User.stripeConnectAccountId` | Stripe-filter vóór dish-query |

**Geen:** `seller` profielvelden, `Image` rows, `Video`, overige tile-body.

Merge: `createdAt DESC`, cap `FEED_DB_PRODUCT_CAP` (60), dedup op `id`.

### Stap 2 — Body-hydration

`hydrateFeedProductsFromIdRows()`:

```text
product.findMany({ id: { in: orderedIds } })  // PRODUCT_BODY_SELECT
  → batchHydrateFeedSellers(unique sellerIds)
  → merge in ID-volgorde
```

### Route-orchestratie (`app/api/feed/route.ts`)

```text
await productIdPhase          // snel: linkedProductIds + donor IDs
parallel:
  hydrateFeedProductsFromIdRows
  fetchFeedPublishedDishes    // notIn linkedProductIds
  loadProductImageMetadata
  loadDishPhotoMetadata (donors)
  listingQuery
```

Stripe/linked-media beslissingen gebruiken **ID-fase** (`productIdRowToStripeRow`), niet volledige hydrate.

---

## Modules

| Bestand | Rol |
|---------|-----|
| `lib/feed/feed-product-query.server.ts` | `ids_first` default, `fetchFeedProductIdRows`, `hydrateFeedProductsFromIdRows` |
| `lib/feed/feed-seller-hydration.server.ts` | `batchHydrateFeedSellers` — één `sellerProfile.findMany` per feed-request |

---

## Parity (validators)

`scripts/validate-feed-phase3ep-ids-first-parity.ts`:

| Check | Resultaat |
|-------|-----------|
| `ids_first` order = `split_or` | ✅ |
| split hydrate = full `ids_first` | ✅ |
| `seller.User` ids parity | ✅ |
| seller batch dekt alle unieke profielen | ✅ |

---

## Query-isolatie benchmark (Neon, 5 runs p50)

| Strategie | p50 | rows |
|-----------|-----|------|
| `or_single` | 211 ms | 7 |
| `split_or` (3E) | 237 ms | 7 |
| `trimmed_or` | 246 ms | 7 |
| **`ids_first` (3E+)** | **334 ms** | 7 |

**Opmerking:** geïsoleerde module is iets trager (extra round-trip + seller batch). Route-winst komt uit **parallelisatie** met dish/listing/metadata.

---

## Route-level timing (lokaal prod-mode, warm)

| Metriek | Phase 3E preview | 3E+ lokaal warm p50 |
|---------|------------------|---------------------|
| `dbProductMs` (wall) | ~1292 ms | **~537 ms** |
| `dbProductIdsMs` | n.v.t. | **~148 ms** |
| `dbProductHydrateMs` | n.v.t. | **~325 ms** |
| `sellerHydrateMs` | n.v.t. | **~43 ms** |

Voorbeeld warm run (`perfProbe=1`):

```json
{
  "dbProductIdsMs": 148,
  "dbProductHydrateMs": 325,
  "sellerHydrateMs": 43,
  "dbProductMs": 473,
  "productMetadataMs": 42
}
```

---

## Query count

| Phase | Prisma queries (typisch) |
|-------|--------------------------|
| 3E preview | 8 |
| 3E+ lokaal | **13** (+5: ID-split, body IN, seller batch, dish photo/video batch) |

Meer queries, kleinere payloads → lagere totale wall-clock in route.

---

## Contractbehoud

- Visibility OR (active + inactive paid): ✅ parity met `split_or`
- Stripe inactive filter: ✅ via ID-fase `stripeConnectAccountId`
- Pagination/sort: ✅ `createdAt DESC` ongewijzigd
- Geen dubbele seller hydration per product: ✅ één batch per unieke `sellerId`

---

## Risico's

1. **Extra latency op kleine DB's** — ID + hydrate kan trager zijn dan één zware join (gemeten in isolatie).
2. **Query-count stijging** — monitoring op Neon connection pool.
3. **Vercel ≠ lokaal** — preview-p50 nog niet herhaald op Vercel voor 3E+.
