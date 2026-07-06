# Discovery Classification Debt

**Version:** V1 (Phase 1B)  
**Last updated:** 2026-07-06

## Resolved in Phase 1B (discovery mappers)

| Area | Before | After |
|------|--------|-------|
| Product classification | `deriveListingKind` in feed/search only | All product mappers use `deriveListingKind` |
| Dish classification | Hardcoded INSPIRATION in some paths | `mapDishToDiscoveryReadModel` → `deriveListingKind` |
| Legacy Listing | Implicit PRODUCT | `mapLegacyListingToDiscoveryReadModel` → `deriveListingKind` |

---

## Remaining custom classification (not in discovery mappers)

| Location | Pattern | Severity | Notes |
|----------|---------|----------|-------|
| `feed-taxonomy.ts` | Price-based INSPIRATION vs PRODUCT | Medium | Parallel to ListingKind; feed chip only |
| `marketplace-sale.ts` | Sale chip via taxonomy + price | Medium | Not kind derivation — visibility |
| `DorpspleinPageContent` | `category !== "all"` legacy filter | High | Vertical filter, not kind |
| `MyDishesManager` | `priceCents > 0` for dorpsplein | High | Commerce leak on profile |
| `ImprovedFilterBar` | CHEFF/GROWN/DESIGNER categories | Medium | UI vertical, not ListingKind |
| `GeoFeed` | `feedVerticalSlugToCategoryEnum` | Medium | Legacy vertical chip |
| `DesignManager` / `RecipeManager` | `category === 'DESIGNER'` | Low | Content management |
| `/api/recommendations/smart` | Unknown | Critical if enabled | Not used in routes |

---

## Eliminated patterns in new code

- ❌ `if category === CHEFF` in discovery layer
- ❌ Service/workshop/request guessing outside `deriveListingKind`
- ❌ Price-based kind inference in mappers

---

## Migration checklist (post Phase 1B)

- [ ] Profile grids filter by `discovery.listingKind` not `Product.category`
- [ ] Dorpsplein vertical chips map to ListingKind or marketplaceCategory
- [ ] Remove price-based dish→sale leak in MyDishesManager
- [ ] Deprecate parallel `feed-taxonomy.kind` when chips use ListingKind
- [ ] Gate or remove `/api/recommendations/smart` until discovery ranking
