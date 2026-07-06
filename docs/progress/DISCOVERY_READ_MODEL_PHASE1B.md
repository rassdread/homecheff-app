# Discovery Read Model Phase 1B — Progress

**Status:** Complete (implementation)  
**Last updated:** 2026-07-06

## Completed

- [x] `lib/discovery/contracts/discovery-read-model.ts`
- [x] Mappers: product, dish, legacy listing, unified record
- [x] `attachDiscoveryReadModel` on feed, products, inspiratie, seller products APIs
- [x] GeoFeed passthrough of `discovery` from API
- [x] Audit docs: read model, classification, social, legacy entity
- [x] No ranking, UI, or route changes

## Files changed

| Area | Files |
|------|-------|
| Core | `lib/discovery/**` |
| APIs | `app/api/feed/route.ts`, `app/api/products/route.ts`, `app/api/seller/products/route.ts`, `lib/getInspiratieItems.ts` |
| Client | `components/feed/GeoFeed.tsx` (passthrough only) |
| Docs | `docs/audits/DISCOVERY_*.md`, this file |

## Trust readiness (Phase 1B-E)

| Check | Status |
|-------|--------|
| No blended rating in `discovery.trust` | ✅ |
| Channel counts only (product/deal/courier) | ✅ structure ready; listing-level deal/courier default 0 |
| Profile trust split (Phase 0) | ✅ unchanged |
| Legacy `averageRating` on API payloads | ⚠️ still present outside `discovery` |

## Social readiness (Phase 1B-F)

| Check | Status |
|-------|--------|
| `discovery.social.favoriteCount` | ✅ |
| No item props in discovery | ✅ |
| Legacy `propsCount` field name | ⚠️ on dish payloads |

## REQUEST / kind readiness (Phase 1B-G)

All ListingKinds representable in `DiscoveryReadModel` without UI special cases:

PRODUCT, SERVICE, TASK, WORKSHOP, COACHING, REQUEST, INSPIRATION — via `deriveListingKind`

## Validation

| Check | Result |
|-------|--------|
| `npm run lint` | ✅ pass |
| `npm run build` | ✅ pass |

## REQUEST readiness (Phase 1B-G)

| ListingKind | Representable | Notes |
|-------------|---------------|-------|
| PRODUCT | ✅ | Full marketplace fields |
| SERVICE | ✅ | Via marketplaceCategory + specializations |
| TASK | ✅ | Via listingIntent |
| WORKSHOP | ✅ | Via specializations |
| COACHING | ✅ | Via specializations |
| REQUEST | ✅ | Via listingIntent + deriveListingKind |
| INSPIRATION | ✅ | Dish entity; price optional |

**Gap:** UI still uses legacy category/price filters — not a read-model gap.

## Trust readiness (Phase 1B-E)

| Consumer | Uses `discovery.trust` | Blended rating |
|----------|------------------------|----------------|
| Feed API | ✅ attached | Legacy `reviewCount` only on payload |
| Products API | ✅ attached | Legacy `averageRating` still on payload ⚠️ |
| Inspiratie | ✅ attached | N/A at dish level |
| Seller products | ✅ attached | No legacy rating |
| Product detail UI | ❌ not wired | Uses `stats.averageRating` |
| Dorpsplein cards | ❌ not wired | May use legacy fields |
| Recommendations API | ❌ not wired | Unknown — gated |

**Finding:** `DiscoveryReadModel.trust` has no blended average. Legacy fields remain on old shapes for backward compat; ranking phase must consume `discovery` only.
