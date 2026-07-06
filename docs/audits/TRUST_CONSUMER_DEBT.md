# Trust Consumer Debt

**Version:** V1 (Discovery Phase 2A)  
**Last updated:** 2026-07-06

Audit of remaining **blended or legacy trust** consumers before Discovery Phase 2B ranking.

---

## Summary

| Category | Count | Blocks ranking? |
|----------|-------|-----------------|
| Listing cards migrated (Phase 1C) | Feed, Dorpsplein, Inspiratie | No — use discovery counts |
| Seller-level blended `averageRating` | ~15 files | Yes — for card trust display |
| Product detail trust UI | ~8 files | Yes — for commerce trust strip |
| API legacy fields | ~6 routes | Medium — parallel payloads |
| Admin / analytics | ~10 files | No — internal |
| Courier `DeliveryProfile.averageRating` | ~5 files | Yes — courier matching prep |
| Placeholder / seed data | 2 files | Low |

**No `reputationScore` or `blendedRating` identifiers exist in codebase.**

---

## Critical (migrate before trust-gated ranking)

| File | Issue | Migration target |
|------|-------|------------------|
| `components/ui/UserStatsTile.tsx` | Seller `averageRating` on listing cards | Per-channel counts or hide stars on cards |
| `components/feed/GeoFeedCards.tsx` | `FeedCardCompactStats` shows seller ★ | `DiscoveryTrustContract` or remove |
| `app/product/[id]/page.tsx` | Product detail blended stats | `trust.product.reviewCount` + channel display |
| `components/product/detail/ProductMakerTrustStrip.tsx` | Maker ★ aggregate | Profile trust summary API |
| `components/ItemCard.tsx` | Dorpsplein list view legacy reviewCount | `getDiscoveryProductReviewCount` |
| `app/api/seller/[sellerId]/stats/route.ts` | Hardcoded `4.5` placeholder | Real per-channel trust |

---

## High

| File | Issue |
|------|-------|
| `components/seller/PublicSellerProfileNew.tsx` | Seller grid uses legacy rating |
| `components/seller/PublicSellerProfile.tsx` | Same |
| `app/api/seller/[sellerId]/route.ts` | Computes blended product average |
| `components/dorpsplein/ProductReviewSection.tsx` | Local averageRating state |
| `lib/stats/compute-user-public-stats.ts` | `productAverageRating` for stats tile |
| `app/api/products/route.ts` | Legacy `averageRating` on wire |
| `app/api/products/[id]/route.ts` | Legacy product stats |
| `app/bezorger/[username]/PublicDeliveryProfileClient.tsx` | Courier blended rating |

---

## Medium

| File | Issue |
|------|-------|
| `components/profile/ItemsWithReviews.tsx` | Item-level averageRating |
| `lib/getInspiratieItems.ts` | Legacy averageRating on dish payload |
| `components/inspiratie/InspiratieContent.tsx` | Type still has deprecated fields |
| `app/product/[id]/layout.tsx` | SEO structured data ratingValue |
| `lib/product/product-story-copy.ts` | Marketing copy with stars |
| `app/api/feed/route.ts` | Legacy review fields on feed items |

---

## Low / internal

| File | Issue |
|------|-------|
| Admin analytics dashboards | Aggregated ratings for ops |
| `app/verkoper/analytics/page-client.tsx` | Seller dashboard stats |
| `prisma/seed.ts` | Seed ratings |
| `app/api/admin/analytics/route.ts` | Deliverer average |

---

## Compliant (per-channel, not blended)

| File | Status |
|------|--------|
| `lib/trust/profile-trust-summary.ts` | ✅ Phase 0 — 3 channels, no headline blend |
| `components/profile/ProfileTrustSummaryBlock.tsx` | ✅ Displays channels separately |
| `components/dorpsplein/DorpspleinPageContent.tsx` | ✅ Phase 1C — review count only |
| `lib/discovery/consumer-accessors.ts` | ✅ `getDiscoveryProductReviewCount` |

---

## Phase 2B migration order

1. Attach `DiscoveryTrustContract` to listing APIs (enrichment layer)
2. Product detail → profile trust summary or discovery trust contract
3. Remove seller ★ from feed/dorpsplein cards (counts + badges only)
4. Replace seller stats placeholder API
5. Courier profile → courier channel only

---

## Verification command

```bash
rg 'averageRating' --glob '*.{ts,tsx}' | wc -l
```

Target before Phase 2B launch: listing-facing surfaces at 0 blended consumers; profile/detail may still show per-channel ★ for display.
