# Discovery Section Readiness Report

**Phase:** Discovery 2D  
**Date:** 2026-07-06

Per-section readiness for production rollout (Phase 2E+). **2D delivers registry + engine wiring only** — no API/UI integration yet.

---

## Summary

| Section | Data | Trust | Ranking | Blockers |
|---------|------|-------|---------|----------|
| nearby | ✅ | ✅ | ✅ | Viewer geo context not standardized in all APIs |
| trusted_makers | ✅ | ✅ | ✅ | Reciprocal-review anti-gaming not enforced in eligibility |
| top_rated | ✅ | ✅ | ✅ | UI still shows blended stars in some cards |
| trending | ✅ | ✅ | ✅ | Legacy view-based paths still active in feed |
| new_creators | ✅ | ✅ | ✅ | Seller-level dedup not in section builder |

---

## nearby

| Dimension | Status | Notes |
|-----------|--------|-------|
| **Data availability** | ✅ Ready | `distanceKm`, `city`, `listingKind`, `isActive` on `DiscoveryReadModel` |
| **Trust readiness** | ✅ Ready | `trust.sellerTier` enriched via Phase 2B batch |
| **Ranking readiness** | ✅ Ready | `nearby` profile — distance primary, light activity/tier, no popularity |
| **Listing kinds** | ✅ | PRODUCT, SERVICE, TASK, WORKSHOP, REQUEST supported |
| **Blockers** | ⚠️ | Feed API must pass `viewer.radiusKm`; coords-only listings need distance computation upstream |

---

## trusted_makers

| Dimension | Status | Notes |
|-----------|--------|-------|
| **Data availability** | ✅ Ready | Product + deal review counts on trust contract |
| **Trust readiness** | ✅ Ready | `sellerTier ≥ 4`, combined reviews ≥ 3 |
| **Ranking readiness** | ✅ Ready | `trusted_maker` profile — deal → product → repeat customers |
| **Audit** | ✅ Ready | `auditDiscoverySection('trusted_makers')` — tier distribution, review buckets |
| **Blockers** | ⚠️ | Reciprocal-only review inflation (DISCOVERY_ANTI_GAMING) — gate deferred to Phase 2E |

---

## top_rated

| Dimension | Status | Notes |
|-----------|--------|-------|
| **Data availability** | ✅ Ready | Per-channel: product, deal, courier review counts |
| **Trust readiness** | ✅ Ready | Channel tiers on trust contract |
| **Ranking readiness** | ✅ Ready | `top_rated` profile — max channel review count, no `averageRating` |
| **Blockers** | ⚠️ | Legacy Inspiratie/card UI may still display blended stars (display-only debt) |

---

## trending

| Dimension | Status | Notes |
|-----------|--------|-------|
| **Data availability** | ✅ Ready | `createdAt`, `updatedAt`, `social.favoriteCount` |
| **Trust readiness** | ✅ Ready | `sellerTier ≥ 2` floor |
| **Ranking readiness** | ✅ Ready | `trending` profile — capped favorites (≤5), recency 7d, no views/HCP/followers |
| **Blockers** | ⚠️ | `feedSaleRanking.ts` still active on client — parallel sort until Phase 2E |

---

## new_creators

| Dimension | Status | Notes |
|-----------|--------|-------|
| **Data availability** | ✅ Ready | `createdAt`, media fields, description length |
| **Trust readiness** | ✅ Ready | Low tier (≤2) acceptable by design |
| **Ranking readiness** | ✅ Ready | `new_creators` profile — recency only, quality + anti-spam gates |
| **Blockers** | ⚠️ | Section returns listings not unique sellers — dedup policy needed for UI carousel |

---

## Forbidden signals — compliance

All five sections forbid via registry + ranking contracts:

- ❌ `viewCount`
- ❌ `followerCount` / `fansCount`
- ❌ `hcpPoints`
- ❌ `workspacePropsCount`
- ❌ `averageRating` / blended rating

Validated by `assertRankingInputPurity` and section validation scripts.

---

## Next phase (2E)

1. Wire `buildAllDiscoverySections` into `/api/feed` response shape.
2. Replace `feedSaleRanking` client sort with server section order.
3. Add reciprocal-review gate for `trusted_makers`.
4. Seller dedup policy for `new_creators`.
