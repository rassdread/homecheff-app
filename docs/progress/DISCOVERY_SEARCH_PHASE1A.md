# Discovery Search Phase 1A — Progress

**Status:** Complete (implementation)  
**Last updated:** 2026-07-06  
**Prerequisites:** Trust Phase 0 ✅, ListingKind Phase 1 ✅

## Completed

### 1A — Search audit
- [x] `docs/audits/SEARCH_ARCHITECTURE_AUDIT.md`

### 1B — ListingKind search support
- [x] All 7 kinds filterable via `matchesSearchListingFilters`
- [x] No ranking / ordering changes

### 1C — Search contract
- [x] `lib/search/contracts/search-contract.ts`
- [x] Barrel `lib/search/index.ts`

### 1D — Filter normalization
- [x] `lib/search/filters/search-listing-filters.ts`
- [x] `lib/search/filters/search-text.ts`
- [x] `lib/search/filters/matches-search-item.ts`
- [x] `lib/search/filters/build-product-search-where.ts`

### 1E — REQUEST search
- [x] `inferSearchQueryIntent` — gezocht/hulp/wie kan patterns
- [x] `buildProductTextSearchWhere` — includes active REQUEST rows
- [x] Feed + products API integration

### 1F — Profile search
- [x] Profile filters already use `deriveListingKind` via `matchesProfileAanbodFilter`
- [x] Re-exported from `lib/search/index.ts`

### 1G — Result classification
- [x] `attachSearchClassificationToRecord` on feed + products API
- [x] Inspiratie items expose `listingKind: INSPIRATION` + entity fields

### 1H — Legacy debt doc
- [x] `docs/audits/SEARCH_LEGACY_DEBT.md`

### 1I — Gezocht readiness
- [x] `docs/audits/REQUEST_DISCOVERY_READINESS.md`

---

## Files changed

| Area | Files |
|------|-------|
| Core | `lib/search/**` |
| APIs | `app/api/feed/route.ts`, `app/api/products/route.ts`, `app/api/inspiratie/route.ts`, `lib/getInspiratieItems.ts` |
| Feed client | `lib/feed/feed-query-params.ts`, `components/feed/GeoFeed.tsx`, `lib/feed/feed-sale-visibility-audit.ts` |
| Dorpsplein | `components/dorpsplein/DorpspleinPageContent.tsx` |
| Docs | `docs/audits/SEARCH_*.md`, `docs/audits/REQUEST_DISCOVERY_READINESS.md` |

---

## Validation

```bash
npm run lint
npm run build
```

Manual smoke:
- Feed search with product name
- Search "gezocht" / "hulp" returns REQUEST listings
- Dorpsplein search with q param
- Inspiratie search via API `?q=`
- Profile Aanbod kind filters unchanged

---

## Remaining before Discovery Phase 1 (ranking)

- Unified search read API
- Gezocht tab + REQUEST card UI
- Legacy Listing removal from feed
- Taxonomy synonym search index
- Optional: consolidate Dorpsplein → feed search
