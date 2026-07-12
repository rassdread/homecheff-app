# Phase 3C — Trust Sub-timing & Minimal Tile Path

**Datum:** 2026-07-12  
**Branch:** `performance/phase2-baseline` (lokaal)  
**Status:** geïmplementeerd · **geen commit/push/deploy**

---

## Preview baseline (3 cache-miss runs)

| Metriek | Run 1 | Run 2 | Run 3 | Gemiddeld |
|---------|-------|-------|-------|-----------|
| Server total | 4640 ms | 4279 ms | 4704 ms | **~4541 ms** |
| trust | 1306 ms | 1304 ms | 1500 ms | **~1370 ms** |

Vier unieke sellers per batch.

---

## Minimal vs Extended trust

### Minimal tile trust (feed critical path)

Velden zichtbaar op eerste feedtegel via `buildTileTrustCue` / `buildTileBadges`:

| Veld | Bron | Tile? |
|------|------|-------|
| `productReviewCount` | listing stats + trust | ✅ |
| `dealReviewCount` | snapshot | ✅ |
| `completedDeals` | snapshot (fallback cue) | ✅ |
| `sellerTier` | afgeleid uit snapshot | ✅ |
| `trustBadges[0]` | author badges + trust slugs | ✅ |
| `businessPlan` | snapshot (badge strip) | ✅ |
| `courierReviewCount` | snapshot | ranking |

### Extended trust (defaults in minimal mode)

| Veld | Gebruik | Minimal default |
|------|---------|-----------------|
| `buyerTier` | activity/surfaces | `TRUST_TIER_PRESENT` |
| `reviewsLeftCount` | buyer tier | `0` |
| `completedDealsAsBuyer` | buyer tier | `0` |
| buyer-side `repeatCustomers` | buyer tier | niet opgeteld |

Extended queries **overgeslagen** in minimal mode (5 groupBy queries):

- `completed_as_buyer`
- `repeat_customers_buyer`
- `reviews_left_product`
- `reviews_left_deal`
- `reviews_left_delivery`

---

## Per-query timing (instrumentatie)

`fetchSellerTrustSnapshotsWithReport()` rapporteert per onderdeel:

| Key | Modellen | Tile? | Mode |
|-----|----------|-------|------|
| `seller_profiles` | SellerProfile, Subscription | ✅ businessPlan | batch |
| `delivery_profiles` | DeliveryProfile | courier tier | batch |
| `seller_products` | Product | ✅ review rollup | batch |
| `active_listings` | Product groupBy | ✅ | batch |
| `deal_reviews` | DealReview groupBy | ✅ | batch |
| `product_reviews` | ProductReview groupBy | ✅ | batch |
| `delivery_reviews` | DeliveryReview groupBy | ✅ | batch |
| `completed_as_seller` | CommunityOrder groupBy | ✅ | batch |
| `completed_deliveries` | CourierAssignment groupBy | ✅ | batch |
| `order_items` | OrderItem groupBy | ✅ | batch |
| `repeat_customers_seller` | CommunityOrder groupBy | ✅ sellerTier | batch |
| `trust_badges` | UserBadge, Badge | ✅ | batch |
| `assembly` | JS mapping | ✅ tiers | wall-clock |

Beschikbaar in `debug.perf.trustTiming.snapshotTiming` bij `FEED_PERF_TIMING=1`.

---

## Verwachte impact

| Metriek | Vóór 3C | Verwacht na 3C |
|---------|---------|----------------|
| trust queries | ~16 | **~11** (−5 extended) |
| trust wall-clock | ~1370 ms | **~700–900 ms** (preview hermeting vereist) |

Geen UI-regressie op tile trust cues — seller-side evidence intact.

---

## Gewijzigde bestanden

- [lib/discovery/trust/fetch-seller-trust-snapshots.ts](lib/discovery/trust/fetch-seller-trust-snapshots.ts)
- [lib/discovery/trust/trust-snapshot-timing.ts](lib/discovery/trust/trust-snapshot-timing.ts)
- [lib/discovery/trust/batch-enrichment.ts](lib/discovery/trust/batch-enrichment.ts)
- [lib/feed/trust-enrichment-timing.ts](lib/feed/trust-enrichment-timing.ts)

---

## Validatie

`scripts/validate-feed-trust-phase3c.ts` — **11/11**
