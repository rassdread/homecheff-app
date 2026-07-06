# Listing-Level Trust Enrichment (Phase 2B-E)

**Date:** 2026-07-06  
**Scope:** What trust belongs on each discovery listing row

---

## Decision matrix

| Signal | Listing-level? | Rationale |
|--------|----------------|-----------|
| Product review count (this listing) | ✅ **Yes** | `trust.product.reviewCount` — listing-specific evidence |
| Seller trust tiers | ✅ **Yes** | `trust.sellerTier`, `trust.buyerTier`, `trust.courierTier` — owner-scoped, same for all seller listings |
| Deal/courier channel counts | ✅ **Yes** (seller-scoped) | `trust.deal`, `trust.courier` — seller aggregate, not per-listing |
| Completed deal/delivery counts | ✅ **Yes** (seller-scoped) | `trust.completedDeals`, `trust.completedDeliveries` |
| Repeat customers | ✅ **Yes** (seller-scoped) | `trust.repeatCustomers` |
| Trust badges (TRUST class) | ✅ **Yes** (seller-scoped) | `trust.trustBadges` — normalized via `filterTrustBadges()` |
| HCP points | ❌ **Forbidden** | Gamification, not trust — `DISCOVERY_TRUST_FORBIDDEN_SIGNALS` |
| Followers / fans | ❌ **Forbidden** | Social block only (`discovery.social.fansCount`) |
| Views | ❌ **Forbidden** | Engagement, not trust |
| Workspace props | ❌ **Forbidden** | Social/engagement |
| Dish feedback / dish reviews | ❌ **Forbidden** | Inspiration uses creator seller trust; dish reviews not on contract |
| Blended ratings | ❌ **Forbidden** | Per-channel only; legacy `averageRating` stays on wire for UI debt |

---

## By entity type

| Entity | Listing product reviews | Seller tiers | Notes |
|--------|------------------------|--------------|-------|
| **Product** (Dorpsplein, feed, search) | Per-product count | Seller snapshot | Full contract |
| **Legacy listing** (feed) | 0 unless enriched | Seller snapshot | Same contract shape |
| **Dish** (Inspiratie) | 0 (no ProductReview) | Creator snapshot | Product channel tier from seller catalog evidence |
| **Profile aanbod** | Per-product count | Profile owner snapshot | Same as Dorpsplein |

---

## Implementation

- `buildDiscoveryTrust({ listingProductReviewCount, listingIsActive, sellerSnapshot, trustBadges })`
- Listing counts come from page-level groupBy; seller evidence from `fetchSellerTrustSnapshots()`.

---

## Future ranking (Phase 2C)

Ranking may read `discovery.trust.*` without re-querying profile trust APIs. Listing sort must not use `averageRating` once consumers migrate.
