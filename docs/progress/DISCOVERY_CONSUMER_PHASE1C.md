# Discovery Consumer Phase 1C — Progress

**Status:** Complete  
**Last updated:** 2026-07-06

## Completed

- [x] `lib/discovery/consumer-accessors.ts`
- [x] GeoFeed + GeoFeedCards + DiscoverGridTile migration
- [x] DorpspleinPageContent migration
- [x] ProductManagement + profile-filter discovery kind
- [x] InspiratieContent search/sort/filter migration
- [x] Search text matching via `toSearchableListingRecord`
- [x] `marketplace-sale.ts` prefers discovery.listingKind
- [x] `feedSaleRanking.ts` removes propsCount scoring
- [x] Audit docs: consumer, legacy consumer debt, contract coverage

## Files changed

| Area | Files |
|------|-------|
| Core | `lib/discovery/consumer-accessors.ts`, `lib/discovery/index.ts` |
| Profile filter | `lib/marketplace/listing-kind/profile-filter.ts` |
| Search | `lib/search/filters/search-text.ts`, `lib/search/contracts/search-contract.ts` |
| Feed | `components/feed/GeoFeed.tsx`, `GeoFeedCards.tsx`, `DiscoverGridTile.tsx`, `feedSaleRanking.ts`, `lib/feed/marketplace-sale.ts` |
| Dorpsplein | `components/dorpsplein/DorpspleinPageContent.tsx` |
| Profile | `components/profile/ProductManagement.tsx` |
| Inspiratie | `components/inspiratie/InspiratieContent.tsx` |
| Docs | `docs/audits/DISCOVERY_*.md`, this file |

## Validation

| Check | Result |
|-------|--------|
| `npm run lint` | ✅ |
| `npm run build` | ✅ |

## Explicitly not done (per spec)

- No ranking, recommendations, personalization
- No UI redesign
- No Discovery API
- MyDishesManager, ItemCard, UserStatsTile deferred
