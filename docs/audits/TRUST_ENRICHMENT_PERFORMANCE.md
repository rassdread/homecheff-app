# Trust Enrichment Performance Audit (Phase 2B-H)

**Date:** 2026-07-06  
**Goal:** No N+1 query explosions from trust enrichment

---

## Batch design

`fetchSellerTrustSnapshots(userIds[])` runs a **fixed set of parallel queries** (~18 `Promise.all` + up to 2 product lookups), independent of listing count **N**.

Per unique seller **U** on a page: **O(1)** additional queries (not O(U × N)).

---

## Per-surface query budget

| Surface | Listings (typ.) | Unique sellers | Trust queries (added) | Notes |
|---------|-----------------|----------------|----------------------|-------|
| **Feed** | ≤30 | ≤30 | +18 fixed batch | After sort slice; reuses seller badge IDs |
| **Dorpsplein** | ≤50 | ≤50 | +18 fixed batch | Shares badge fetch with trust bundle |
| **Profile aanbod** | ~10–50 | 1 | +18 fixed batch | Single seller — same batch path |
| **Inspiratie** | 24 | ≤24 | +18 fixed batch | Author IDs = seller IDs |
| **Search** | Same as products | Same | Same as Dorpsplein | Products API |

---

## Query breakdown (`fetchSellerTrustSnapshots`)

1. `sellerProfile.findMany` — profile flags  
2. `deliveryProfile.findMany` — courier flags  
3. `product.groupBy` — active listings  
4. `dealReview.groupBy` — by reviewee  
5. `productReview.groupBy` — by product (+ optional product lookup)  
6. `deliveryReview.groupBy` — by profile  
7–8. `communityOrder.groupBy` — seller + buyer completed  
9. `courierAssignment.groupBy` — completed deliveries  
10. `orderItem.groupBy` — product orders (+ optional product lookup)  
11–12. `communityOrder.groupBy` — repeat pairs  
13–15. reviews left (product/deal/delivery)  
16. `userBadge.findMany` — trust slugs  

**Total:** 16 parallel + 0–2 sequential product ID resolves.

---

## Caching opportunities (deferred)

| Cache | TTL | Benefit |
|-------|-----|---------|
| Seller trust snapshot by userId | 60–300s | Hot Dorpsplein/feed sellers |
| Badge summaries | Already batched | — |
| Profile trust summary | Per-user | Do **not** duplicate in discovery path |

Phase 2B intentionally skips cache — measure first in production.

---

## Bottlenecks

| Risk | Mitigation |
|------|------------|
| Large seller ID sets (100+) | Dorpsplein paginates; feed caps at 30 |
| Product lookup after groupBy | Only when reviews/orders exist |
| Duplicate badge + trust fetch | `fetchSellerTrustBundles` merges badge map |

---

## Before Phase 2C

- Add integration test for batch snapshot shape (optional).
- Monitor P95 `/api/products` and `/api/feed` after deploy.
- Consider Redis snapshot cache if P95 > 500ms added latency.
