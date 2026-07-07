# Marketplace Mobile Surface Layering Fix

**Date:** 2026-07-07  
**Audit:** [MARKETPLACE_MOBILE_SURFACE_LAYERING_AUDIT.md](./MARKETPLACE_MOBILE_SURFACE_LAYERING_AUDIT.md)

## Changes (CSS / className only)

| File | Change |
|------|--------|
| `components/feed/FeedMobileToolbar.tsx` | `bg-white/95 backdrop-blur-sm` → solid `bg-white`; `z-[2]` → `z-30` |
| `components/navigation/BottomNavigation.tsx` | Opaque `bg-white` on bar; removed `backdrop-blur` and `/88`/`/95`; `max-lg:bg-white` on fixed wrapper for safe-area zone; `data-play-migration-strip` for padding hook |
| `app/globals.css` | Extra `padding-bottom` on `AppPageChrome` when Play migration strip is visible (`:has([data-play-migration-strip="true"])`) |

## Unchanged

- Nav item layout, filter chip layout, sticky offsets, desktop (lg+) — bottom nav hidden on web desktop
- `ImprovedFilterBar`, `FeedMobileFilterSheet`, `GeoFeed` structure

## Validation

```bash
npm run lint
npm run build
npm run smoke-check
```

Manual: Home feed on mobile — scroll tiles under filter bar and bottom nav; no imagery visible through chrome. Optional: native build with Play migration strip — last row clears strip + tabs.
