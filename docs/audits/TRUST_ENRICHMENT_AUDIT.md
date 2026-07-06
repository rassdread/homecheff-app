# Trust Enrichment Audit (Phase 2B-A)

**Date:** 2026-07-06  
**Scope:** All trust sources consumed by `lib/discovery/trust/`  
**Status:** Complete — enrichment layer implemented

---

## Summary

Phase 2B attaches canonical `DiscoveryTrustContract` to every `DiscoveryReadModel`. Trust evidence is batch-fetched via `fetchSellerTrustSnapshots()` and composed by `buildDiscoveryTrust()`. No blended ratings, no reputation scores.

---

## Trust sources

| Source | Prisma model | Reliability | Availability | Performance | Consumer usage |
|--------|--------------|-------------|--------------|-------------|----------------|
| **ProductReview** | `ProductReview` | High — Stripe/order-gated, `reviewSubmittedAt` + `rating > 0` | All products with verified reviews | Listing: 1 groupBy per page; seller: aggregated in batch snapshot | `trust.product.reviewCount`, product channel tier |
| **DealReview** | `DealReview` | High — tied to completed `CommunityOrder` | Sellers/buyers with community deals | Batch groupBy by `revieweeId` | `trust.deal.reviewCount`, deal channel tier |
| **DeliveryReview** | `DeliveryReview` | High — tied to `DeliveryProfile` / assignments | Couriers with delivery profile | Batch groupBy by `deliveryProfileId` | `trust.courier.reviewCount`, courier channel tier |
| **CompletedDeals** | `CommunityOrder` (`status: COMPLETED`) | High | Seller + buyer roles | Batch groupBy by sellerId/buyerId | `trust.completedDeals`, seller/buyer tiers |
| **CompletedDeliveries** | `CourierAssignment` (`status: COMPLETED`) | High | Users with delivery profile | Batch groupBy by courierId | `trust.completedDeliveries`, courier tier |
| **RepeatCustomers** | `CommunityOrder` pairs (≥2 deals) | Medium — deal channel only today | Sellers/buyers with repeat deals | Batch groupBy sellerId+buyerId | `trust.repeatCustomers`, seller tier floor |
| **Trust badges** | `UserBadge` → `Badge.slug` | High when TRUST class | Awarded users | Single `findMany` + filter | `trust.trustBadges`, tier badge floors |
| **KVK** | `SellerProfile.kvk` | High for business verification | Seller profiles | Included in seller profile fetch (display elsewhere) | **Not** on discovery trust contract (forbidden for ranking) |
| **Response time** | Messaging / seller stats | Medium — not order-gated | Partial | N+1 if per-listing | **Not** on discovery trust — profile-only |
| **Trust summary** | `getProfileTrustSummary()` | High — SSOT for profile | Per-user API only | ~10 queries per user | Profile pages; discovery uses batch snapshot instead |
| **Seller stats** | `batchComputeUserStatsPreview` | Medium — legacy composite | Feed preview cap (9 sellers) | Batched | Feed wire only — **not** discovery trust |
| **Profile trust summary** | `/api/trust` | High | Authenticated + public profile | Single-user | Profile UI; discovery does not call this per listing |

---

## Batch enrichment module

| File | Role |
|------|------|
| `lib/discovery/trust/fetch-seller-trust-snapshots.ts` | Fixed ~18 parallel Prisma queries per request batch |
| `lib/discovery/trust/build-discovery-trust.ts` | Composes `DiscoveryTrustContract` |
| `lib/discovery/trust/derive-trust-tier.ts` | Tier rules from `TRUST_TIER_SPEC.md` |
| `lib/discovery/trust/trust-badge-utils.ts` | TRUST-class badge filter |
| `lib/discovery/trust/trust-channel-utils.ts` | Channel block helpers |
| `lib/discovery/trust/batch-enrichment.ts` | Bundle snapshots + UI badges |

---

## Reliability notes

- Product reviews require `reviewSubmittedAt != null` and `rating > 0` (matches profile trust SSOT).
- Completed product sales use `OrderItem` with order status `DELIVERED | SHIPPED | CONFIRMED` (no `COMPLETED` on Order).
- Dish/inspiration items have **no product reviews**; creator seller trust is attached at author level.
- `averageRating` remains on legacy wire for display sort debt — **not** copied into discovery trust.

---

## Gaps / deferred

- KVK, response time, HCP — explicitly excluded from `DiscoveryTrustContract`.
- Wilson score, trending, blended ratings — Phase 2C+ ranking, not enrichment.
- Per-listing deal/courier review counts — seller-scoped on listing rows (by design).
