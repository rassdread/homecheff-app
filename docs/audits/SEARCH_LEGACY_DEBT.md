# Search Legacy Debt

**Version:** V1 (Discovery Phase 1A)  
**Last updated:** 2026-07-06

Categorized technical debt identified during search audit. Phase 1A addresses **Critical** and **High** items partially; remainder deferred.

---

## Critical

| ID | Issue | Impact | Phase 1A status |
|----|-------|--------|-----------------|
| S-C1 | **Dual product APIs** — Dorpsplein uses `/api/products`, GeoFeed uses `/api/feed` with different filters | Inconsistent search results | Partial — both now use shared search helpers |
| S-C2 | **REQUEST invisible in sale chip** — `isMarketplaceSaleItem` excludes REQUEST; search finds them via feedOnlyInspiration bucket | REQUEST shows as inspiration card shape | Data exposed (`listingKind=REQUEST`); UI deferred |
| S-C3 | **No unified search endpoint** — clients call 3 APIs | Duplicate filter logic | Mitigated via `lib/search/` |

---

## High

| ID | Issue | Impact | Phase 1A status |
|----|-------|--------|-----------------|
| S-H1 | **Legacy Listing entity** in feed merge | Always `PRODUCT` kind, no V2 taxonomy | Documented; deprecation deferred |
| S-H2 | **Product.category** vertical filters (CHEFF/GROWN/DESIGNER) parallel to ListingKind | Profile/search divergence | Profile kind filters use `deriveListingKind`; legacy vertical kept |
| S-H3 | **`/api/products` heavy debug logging** | Performance noise | Unchanged (out of scope) |
| S-H4 | **Inspiratie page client-only search** | No server q before 1A | Fixed in API; InspiratieContent client filter remains |
| S-H5 | **Creator search ignores ListingKind** | User search ≠ listing search | By design — users not listings |

---

## Medium

| ID | Issue | Impact |
|----|-------|--------|
| S-M1 | GeoFeed smart ranking still price/engagement based | Not ListingKind-aware (Discovery Phase 2+) |
| S-M2 | Dorpsplein fetch on mount only — q not in initial fetch deps | Re-fetch on Apply Filters only |
| S-M3 | Taxonomy label search not in Prisma (specializations id only) | "tuinman" won't match `practical.gardening` unless in title |
| S-M4 | MyDishesManager public profile price-based dish filter | Dish/commerce leak on profile URLs |
| S-M5 | `/api/inspiratie` no `listingKind` filter param | Filter client-side or by category |

---

## Low

| ID | Issue | Impact |
|----|-------|--------|
| S-L1 | Admin product search — local filter only | Internal tooling |
| S-L2 | Saved searches store legacy filter shape | Migration when Discovery UI ships |
| S-L3 | `SmartRecommendations` API exists but unused | Remove or gate in Discovery Phase 2 |
| S-L4 | User search location filter stubbed (`return true`) | Distance filter ineffective |

---

## Recommended next steps (post Phase 1A)

1. Unified `/api/search` read model (products + requests + inspiration)
2. Gezocht tab + REQUEST card variant
3. Deprecate legacy `Listing` in feed search pool
4. Taxonomy synonym index for specialization ids
5. Consolidate Dorpsplein onto `/api/feed` or shared search service
