# Discovery Legacy Consumer Debt

**Version:** V1 (Phase 1C)  
**Last updated:** 2026-07-06

## Critical

| Location | Debt | Blocker for Phase 2 |
|----------|------|---------------------|
| `/api/recommendations/smart` | Not migrated; may use blended scoring | Must stay gated |
| **MyDishesManager** | Price-based sale/inspiration split on public profile | Classification inconsistency |

---

## High

| Location | Debt |
|----------|------|
| **ItemCard.tsx** | Dorpsplein list view still uses legacy category + reviewCount |
| **UserStatsTile** | Seller-level blended averageRating on cards |
| **FeedCardCompactStats** | Seller stats with averageRating + totalProps |
| **Product detail page** | `stats.averageRating` not discovery |
| **ImprovedFilterBar** | Legacy vertical chips only (no ListingKind) |

---

## Medium

| Location | Debt |
|----------|------|
| **InspirationCard** | Category labels from legacy `category` field |
| **PublicSellerProfile** | Product grid without discovery |
| **Admin product views** | Legacy category merge |
| **GeoFeed feed-taxonomy** | Parallel FeedKind for chip display |

---

## Low

| Location | Debt |
|----------|------|
| Legacy `propsCount` on dish API payloads | Wire compat only |
| Legacy `averageRating` on product API | Wire compat only |
| Seller export CSV | averageRating column |

---

## Classification debt (consumer-side)

| Pattern | Status |
|---------|--------|
| `if category === CHEFF` in cards | Replaced with `getDiscoveryLegacyVerticalCategory` on migrated surfaces |
| Client `attachListingKind` when discovery present | GeoFeed skips re-derive when API sends discovery |
| Price-based kind inference | MyDishesManager only (deferred) |
| Profile filter `deriveListingKind` | Uses `discoveryListingKind` when available |
