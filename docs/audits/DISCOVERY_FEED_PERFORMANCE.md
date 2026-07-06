# Discovery Feed Performance Audit — Phase 2E

**Date:** 2026-07-06

---

## Query profile (`/api/feed`)

| Stage | Queries | Notes |
|-------|---------|-------|
| Product fetch | 1 | `take: 100`, `createdAt desc` |
| Listing fetch | 1 | `take: 50`, optional bbox |
| Dish fetch | 1 | `take: 50` |
| Follow boost | 0–1 | `take: 400` when logged in |
| Stats batch | 4 parallel | `groupBy` views, reviews, ratings, favorites — **scoped to discovery pool ids** |
| Seller badges | 1 | `fetchAuthorBadgeSummariesByUserIds` |
| Trust bundles | 1 | `fetchSellerTrustBundles` — batch, ~18 parallel Prisma per bundle set |
| Stats preview | 0–1 | Up to 9 sellers |

**Discovery pool cap:** 80 marketplace items (was 30 post-sort pre-2E).

**N+1 risk:** Low — trust enrichment uses existing batch path from Phase 2B. Section ranking is in-memory over read models.

---

## Section generation cost (in-memory)

Measured via `discovery.metrics` on API response (dev debug):

| Step | Typical | Complexity |
|------|---------|------------|
| `buildAllDiscoverySections` | &lt;5 ms | O(5 × n log n) rank per profile |
| `deduplicateDiscoverySections` | &lt;1 ms | O(sections × listings) |
| Total section build | &lt;10 ms | For n ≤ 80 |

No additional DB round-trips for section generation.

---

## Batch loading

- Trust: single `fetchSellerTrustBundles` for unique sellers in pool
- Stats: 4 `groupBy` queries in `Promise.all`
- Discovery sections: pure CPU after enrichment

---

## Client cost

- **Removed** client `rankSalesByScore` when `discovery` payload present
- Section row build: O(n) map by listing id
- No extra API calls

---

## Risks / watch

| Risk | Mitigation |
|------|------------|
| Pool 80 vs response 40 | Sections built from full pool; response slices after reorder |
| Larger enrich batch | Stats queries scale with pool size, not full 200 merged items |
| Cache without discovery | `home-feed-return-cache` now stores `discoveryFeed` |

---

## Validation

```bash
npx tsx scripts/validate-discovery-sections.ts
npm run lint
npm run build
```
