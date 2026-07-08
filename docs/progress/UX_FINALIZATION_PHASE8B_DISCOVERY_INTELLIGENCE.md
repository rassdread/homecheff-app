# UX Finalization — Phase 8B — Discovery Intelligence

Date: 2026-07-08  
Status: ✅ Complete

## Goal

Enable reverse marketplace discovery: filter by what the user can offer (accepted counter-values), using the existing taxonomy — no new backend, no new settlement logic.

## Delivered

| Item | Status |
|------|--------|
| Reverse discovery filter | ✅ Client-side OR match on taxonomy ids |
| Advanced filter UI | ✅ `AcceptedValuesDiscoveryFilter` in sidebar/mobile |
| Active filter chips | ✅ Removable chips with icons in feed chrome |
| Empty state | ✅ Dedicated copy + clear / choose other |
| Wanted support | ✅ Same filter on `filteredRequestBase` |
| Detail grouped display | ✅ `AcceptedValuesGroupedList` |
| Preview icons | ✅ Taxonomy icons on accepted values |
| Validator | ✅ `scripts/validate-discovery-intelligence-phase8b.ts` |

## Key files

- `lib/marketplace/discovery/accepted-values-discovery.ts` — matching helper
- `lib/marketplace/discovery/group-accepted-taxonomy-ids.ts` — grouped display
- `components/feed/AcceptedValuesDiscoveryFilter.tsx` — filter UI
- `components/feed/GeoFeed.tsx` — wiring, chips, empty state
- `components/feed/FeedSidebarFilters.tsx` / `FeedMobileFilterSheet.tsx`
- `components/marketplace/AcceptedValuesGroupedList.tsx` — detail groups
- `components/product/detail/ProductAcceptedBadgesSection.tsx`

## Validation

```bash
npx tsx scripts/validate-discovery-intelligence-phase8b.ts
npx tsx scripts/validate-homepage-sidebar-and-filter-phase7g.ts
npx tsx scripts/validate-marketplace-architecture-phase7d.ts
npx tsx scripts/validate-settlement-options-phase7c.ts
npm run build
```

## Out of scope

- New API / ranking / settlement / redesign
