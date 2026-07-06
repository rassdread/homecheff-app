# Discovery Consumer Audit

**Version:** V1 (Discovery Phase 1C)  
**Last updated:** 2026-07-06

## Summary

Phase 1C migrates marketplace UI consumers to read `DiscoveryReadModel` as primary source. Legacy fields remain on payloads for backward compatibility but are no longer primary where migration completed.

---

## Consumer inventory

| Consumer | Uses discovery? | Legacy fields? | Both? | Phase 1C status |
|----------|-----------------|----------------|-------|-----------------|
| **GeoFeed** | ✅ primary | passthrough only | yes | ✅ migrated |
| **GeoFeedCards** | ✅ | favoriteCount sync | yes | ✅ migrated |
| **FeedMarketplaceCard** | via cards | — | — | ✅ indirect |
| **DiscoverGridTile** | ✅ | — | — | ✅ migrated |
| **DorpspleinPageContent** | ✅ primary | deprecated trust fields on wire | yes | ✅ migrated |
| **ProductManagement** | ✅ filters | category label fallback | yes | ✅ migrated |
| **InspiratieContent** | ✅ sort/filter | propsCount on wire | yes | ✅ migrated |
| **InspirationCard** | partial | category labels | yes | partial |
| **ItemCard** (list view) | ❌ | category, reviewCount | yes | deferred |
| **MyDishesManager** | ❌ | price/category filters | yes | deferred |
| **UserStatsTile** (seller) | ❌ | averageRating (seller-level) | — | deferred |
| **Recommendations API** | ❌ | blended | — | gated |

---

## Duplicated fields (pre-1C → post-1C)

| Legacy field | Discovery field | Migration |
|--------------|-----------------|-----------|
| `propsCount` | `discovery.social.favoriteCount` | Feed, Inspiratie, DiscoverGrid |
| `averageRating` | `discovery.trust.productReviewCount` (count, not stars) | Dorpsplein, Inspiratie sort |
| `reviewCount` | `discovery.trust.productReviewCount` | Dorpsplein, Inspiratie |
| `category` (CHEFF/GROWN/DESIGNER) | `discovery.marketplaceCategory` → vertical | Feed, Dorpsplein, Profile |
| client `attachListingKind` | `discovery.listingKind` | GeoFeed normalize |
| `deriveListingKind` in profile filter | `discoveryListingKind` param | ProductManagement |

---

## Trust consumer audit (Phase 1C-G)

| Consumer | Blended trust? | Compliant source |
|----------|----------------|------------------|
| GeoFeed cards | ❌ item-level | N/A at item level |
| Dorpsplein cards | ✅ removed stars | `getDiscoveryProductReviewCount` |
| Inspiratie sort/filter | ✅ removed averageRating | product review count |
| UserStatsTile | ⚠️ seller `averageRating` | seller profile — not listing discovery |
| FeedCardCompactStats | ⚠️ seller `averageRating` | seller profile — deferred |

**Violations remaining:** Seller-level stats tiles still show blended `averageRating` from `/api/user/stats` — not item discovery trust.

---

## Social signal audit (Phase 1C-H)

| Consumer | Compliant? | Issue |
|----------|------------|-------|
| GeoFeed / cards | ✅ | `favoriteCount` from discovery |
| Dorpsplein | ✅ | favorites via accessor |
| Inspiratie | ✅ | sort/filter use favoriteCount |
| DiscoverGridTile | ✅ | removed propsCount display |
| UserStatsTile | ⚠️ | `totalProps` = workspace props (correct semantics) |
| FeedCardCompactStats | ⚠️ | shows `totalProps` on seller tile |

**Legacy `propsCount` on API payloads:** still present on dish responses; consumers no longer read it when `discovery` is present.

---

## Shared helpers

`lib/discovery/consumer-accessors.ts` — canonical read path for UI:
- `getDiscoveryListingKind`, `getDiscoveryListingIntent`
- `getDiscoveryFavoriteCount`, `getDiscoveryProductReviewCount`
- `getDiscoveryLegacyVerticalCategory`, `toSearchableListingRecord`
