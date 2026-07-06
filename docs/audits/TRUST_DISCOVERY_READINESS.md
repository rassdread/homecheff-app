# Trust Discovery Consumer Readiness (Phase 2B-G)

**Date:** 2026-07-06  
**Scope:** Can discovery surfaces consume enriched trust?

---

## Surface readiness

| Surface | Trust contract attached? | Can consume tiers? | Can consume badges? | Legacy `averageRating` |
|---------|-------------------------|-------------------|---------------------|------------------------|
| **Feed** | ✅ `/api/feed` batch trust | ✅ `discovery.trust.sellerTier` etc. | ✅ `discovery.trust.trustBadges` | Still on wire for cards; not in trust contract |
| **Dorpsplein** | ✅ `/api/products` | ✅ | ✅ | Sort/display debt — `getDiscoveryProductReviewCount()` |
| **Search** | ✅ via products API + classification | ✅ | ✅ | Same as Dorpsplein results |
| **Profile aanbod** | ✅ `/api/seller/products` | ✅ | ✅ (via trust bundle) | Not returned on seller products API |
| **Inspiratie** | ✅ `getInspiratieItems` | ✅ creator seller tiers | ✅ | Popular sort still uses `averageRating` (legacy) |

---

## Consumer accessors (Phase 1C + 2B)

| Accessor | Reads |
|----------|-------|
| `getDiscoveryProductReviewCount()` | `discovery.trust.product.reviewCount` |
| `getDiscoverySellerTier()` | `discovery.trust.sellerTier` |
| `getDiscoveryTrustBadges()` | `discovery.trust.trustBadges` |

---

## What still uses legacy trust

| Pattern | Files | Phase 2C action |
|---------|-------|-----------------|
| `averageRating` sort (Inspiratie popular) | `lib/getInspiratieItems.ts` | Replace with tier/count sort when ranking lands |
| `averageRating` display | Dorpsplein/Inspiratie cards | Display-only; optional migrate to channel stars |
| `batchComputeUserStatsPreview` | Feed route | Preview chips — not discovery trust |
| Profile trust API | Profile pages | Keep for detail view; discovery uses batch snapshot |

---

## Ranking readiness (Phase 2C)

All listing rows now expose `DiscoveryTrustContract`. Ranking can gate on:

- `trust.sellerTier >= N`
- `trust.product.reviewCount >= N`
- `trust.trustBadges` contains slug

Without calling legacy stats APIs or blending channels.
