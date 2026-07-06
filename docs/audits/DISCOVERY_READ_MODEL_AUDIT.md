# Discovery Read Model Audit

**Version:** V1 (Discovery Phase 1B)  
**Last updated:** 2026-07-06

## Purpose

Document every marketplace transform path before unified `DiscoveryReadModel` consumption.

---

## Transform inventory

| Surface | Input entity | Output (legacy) | Classification | ListingKind | Trust | Social | Phase 1B |
|---------|--------------|-----------------|----------------|-------------|-------|--------|----------|
| `/api/feed` | Product, Listing, Dish | Feed item blob | `deriveListingKind` | ✅ | reviewCount only | favoriteCount | ✅ `discovery` |
| `/api/products` | Product | Dorpsplein item | `deriveListingKind` | ✅ | productReviewCount | favoriteCount | ✅ `discovery` |
| `/api/inspiratie` | Dish | Inspiratie item | `deriveListingKind` | ✅ INSPIRATION | — | favoriteCount | ✅ `discovery` |
| `/api/seller/products` | Product | Profile product row | `deriveListingKind` | ✅ | — | — | ✅ `discovery` |
| GeoFeed client | API feed item | FeedItem | passthrough + attachListingKind | ✅ | legacy fields | legacy | ✅ passthrough |
| Dorpsplein client | `/api/products` | Grid item | client category filter | partial | averageRating ⚠️ | favoriteCount | ✅ API `discovery` |
| Profile ProductManagement | seller products | Product card | `matchesProfileAanbodFilter` | ✅ | — | — | ✅ via API |
| Profile MyDishesManager | dishes/products | Mixed grid | price/category legacy | partial | — | — | deferred |
| `/api/users` | User | Creator search | N/A | N/A | — | followerCount | out of scope |
| `/api/recommendations/smart` | Product | Scored list | unknown | ❌ | blended ⚠️ | — | not wired |
| Admin products | Product + Listing | Admin row | legacy category | ❌ | — | — | out of scope |

---

## Duplications found

| Duplication | Locations | Phase 1B action |
|-------------|-----------|-----------------|
| Product → feed shape | `feed/route.ts` transformedProducts | Kept for compat; `discovery` added |
| Product → Dorpsplein shape | `products/route.ts` items map | Kept; `discovery` added |
| Dish → feed shape | `feed/route.ts` transformedDishes | Kept; `discovery` via mapper |
| Listing → feed shape | `feed/route.ts` transformedListings | Kept; `discovery` via mapper |
| Dish → inspiratie shape | `getInspiratieItems.ts` | Kept; `discovery` added |
| Classification attach | listingKind + search classify + discovery | Layered; discovery is canonical |

---

## Conflicts

| Conflict | Detail |
|----------|--------|
| Feed vs Dorpsplein product pool | Different APIs, different Stripe filters |
| `averageRating` on products API | Legacy field remains; **not** in `discovery.trust` |
| `propsCount` on dishes | Legacy name; maps to `discovery.social.favoriteCount` |
| Legacy Listing | No V2 taxonomy; defaults PRODUCT kind |
| MyDishesManager | Still filters by priceCents for public profile |

---

## Canonical contract

**Single shape:** `DiscoveryReadModel` in `lib/discovery/contracts/discovery-read-model.ts`

**Single mapper entry:** `mapRecordToDiscoveryReadModel()` → routes to product/dish/listing mappers

**Classification:** Always `deriveListingKind()` inside entity mappers — no exceptions

---

## Consumer migration path (future)

1. Discovery ranking reads `item.discovery` only
2. Deprecate legacy `category`-based filters in favor of `discovery.listingKind`
3. Remove duplicate transform blocks once UI consumes `discovery`
4. Unified `/api/discovery` read endpoint (Phase 2)
