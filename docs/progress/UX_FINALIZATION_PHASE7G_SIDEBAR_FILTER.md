# UX Finalization — Phase 7G — Sidebar Dedup, Settlement Fallback & Filter Speed

Date: 2026-07-08  
Status: ✅ Complete

## Goal

Fix three live issues without redesign: duplicate delivery CTAs in the right sidebar, bare legacy tiles missing checkout icons, and slow-feeling filter updates.

## Delivered

| Item | Status |
|------|--------|
| 7G.1 Duplicate delivery CTA audit | ✅ Growth + Opportunity + Activity + Promotions mapped |
| 7G.2 CTA priority rules | ✅ `lib/home/sidebar-cta-priority.ts` |
| 7G.3 Right sidebar fixes | ✅ Suppression wired through cockpit stack |
| 7G.4 Legacy settlement fallback | ✅ `isLegacyPricedCheckoutEligible` + priced Connect gate |
| 7G.5 Settlement source of truth | ✅ Central helper + feed legacy fields |
| 7G.6 Filter performance audit | ✅ Skeleton flash + no stale-while-refresh identified |
| 7G.7 Fast filter implementation | ✅ `feedRefreshing`, debounced refine search |
| 7G.8 Mobile tile spacing | ✅ Re-verified 7E guards |
| 7G.9 Validator | ✅ `scripts/validate-homepage-sidebar-and-filter-phase7g.ts` |

## Key files

- `lib/home/sidebar-cta-priority.ts` — delivery CTA dedup + priority
- `components/home/HomeDesktopSidebar.tsx` — passes suppression to children
- `components/discovery/surfaces/OpportunitySurfaceStack.tsx` — hide duplicate COURIER
- `components/discovery/surfaces/DesktopRightSidebarSurfaceStack.tsx` — filter activity card
- `components/home/HomeRecommendedPromotions.tsx` — hide `werken-bij` when redundant
- `lib/marketplace/settlement/settlement-options.ts` — legacy priced checkout fallback
- `app/api/feed/route.ts` — legacy dish/listing settlement + Connect fields
- `components/feed/GeoFeed.tsx` — stale-while-refresh + debounced refine
- `hooks/useDebouncedValue.ts` — shared debounce hook

## Validation

```bash
npx tsx scripts/validate-homepage-sidebar-and-filter-phase7g.ts
npx tsx scripts/validate-discovery-filter-ui-phase7e.ts
npx tsx scripts/validate-marketplace-architecture-phase7d.ts
npx tsx scripts/validate-settlement-options-phase7c.ts
npx tsx scripts/validate-runtime-performance-phase4c.ts
npm run build
```

## Out of scope (per brief)

- Redesign / new features / ranking changes / payment-flow changes
- Full consolidation of delivery onboarding routes
