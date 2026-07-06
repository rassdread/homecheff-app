# Discovery Trust Enrichment — Phase 2B Progress

**Date:** 2026-07-06  
**Status:** Complete  
**Depends on:** Phase 2A (DiscoveryTrustContract + TRUST_TIER_SPEC)

---

## Delivered

### 2B-A Trust enrichment audit
- `docs/audits/TRUST_ENRICHMENT_AUDIT.md`

### 2B-B Trust enrichment module
- `lib/discovery/trust/derive-trust-tier.ts`
- `lib/discovery/trust/build-discovery-trust.ts`
- `lib/discovery/trust/trust-badge-utils.ts`
- `lib/discovery/trust/trust-channel-utils.ts`
- `lib/discovery/trust/fetch-seller-trust-snapshots.ts`
- `lib/discovery/trust/batch-enrichment.ts`
- `lib/discovery/trust/types.ts`
- `lib/discovery/trust/index.ts`

### 2B-C Tier derivation
- Seller, buyer, courier tiers + product/deal/courier channel tiers per `TRUST_TIER_SPEC.md`

### 2B-D Contract attachment
- Feed, Dorpsplein (`/api/products`), profile aanbod, inspiratie
- `DiscoveryReadModel.trust` → full `DiscoveryTrustContract`

### 2B-E Listing-level trust
- `docs/audits/LISTING_TRUST_ENRICHMENT.md`

### 2B-F Badge normalization
- `docs/audits/TRUST_BADGE_MAPPING.md`

### 2B-G Consumer readiness
- `docs/audits/TRUST_DISCOVERY_READINESS.md`
- Updated `consumer-accessors.ts`

### 2B-H Performance audit
- `docs/audits/TRUST_ENRICHMENT_PERFORMANCE.md`

---

## Explicitly not done (by design)

- Ranking, sorting changes, recommendations
- Wilson score, trending, trusted-maker sections
- Trust UI redesign

---

## Phase 2C blockers cleared

- ✅ Canonical `discovery.trust` on all discovery surfaces
- ✅ Tier derivation from approved spec
- ✅ Batch fetch — no N+1 per listing

## Remaining before Phase 2C ranking

- Migrate Inspiratie popular sort off `averageRating`
- Optional: cache seller trust snapshots
- Wire ranking engine to `DiscoveryRankingInput` (Phase 2C scope)
