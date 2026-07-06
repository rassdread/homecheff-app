# Marketplace Tile System — Phase T1 Progress

**Status:** ✅ Implemented  
**Last updated:** 2026-07-06  
**Scope:** Presentation layer only — no ranking, sections, API, activity cards, or sponsored placements.

---

## Deliverables

| Item | Status |
|------|--------|
| `lib/marketplace/tiles/` — model, mappers, builders | ✅ |
| `components/marketplace/tiles/` — Compact, Standard, Router | ✅ |
| `FeedMarketplaceCard` → `MarketplaceTileRouter` | ✅ |
| `GeoFeed` unified tile path + discover `1:1` ratio | ✅ |
| `UserStatsTile` removed from feed cards | ✅ |
| i18n NL + EN (`marketplace.tile.*`) | ✅ |
| `scripts/validate-marketplace-tiles.ts` | ✅ |

---

## Module layout

```
lib/marketplace/tiles/
  types.ts
  tile-badge-priority.ts
  tile-trust-rules.ts
  build-tile-badges.ts
  build-tile-trust-cue.ts
  build-tile-price-line.ts
  map-to-tile-model.ts
  map-inspiration-api.ts
  index.ts

components/marketplace/tiles/
  MarketplaceTileCompact.tsx
  MarketplaceTileStandard.tsx
  MarketplaceTileRouter.tsx
  MarketplaceTileMedia.tsx
  MarketplaceTilePersonRow.tsx
  MarketplaceTileBadgeStrip.tsx
  MarketplaceTileFavorite.tsx
  index.ts
```

---

## Variant selection

`MarketplaceTileRouter` uses `useNarrowViewport` + `useIsNativeAppMounted` (same as GeoFeed):

| Viewport | Variant | Default media ratio |
|----------|---------|---------------------|
| Mobile / native | `MarketplaceTileCompact` | 4:5 |
| Discover grid | Compact | 1:1 |
| Desktop | `MarketplaceTileStandard` | 4:3 |

---

## Legacy deprecation

| Asset | T1 action |
|-------|-----------|
| `FeedSaleCard` | Stub in `GeoFeedCards.tsx` |
| `FeedInspirationCard*` | Stub in `GeoFeedCards.tsx` |
| `DiscoverGridTile` | Thin wrapper → router |
| `UserStatsTile` in feed | Removed |

`UserStatsTile` retained on profile pages, seller detail, public profile.

---

## Explicit non-goals (unchanged)

- Hover / long-press preview (T3)
- `MarketplaceTileMini` / sidebar (T2)
- Activity cards, sponsored placements, recommendations
- Discovery ranking / section builders
- `/api/feed` contract

---

## Validation

```bash
npx tsx scripts/validate-marketplace-tiles.ts
npm run lint
npm run build
```

---

## Related docs

- [MARKETPLACE_TILE_ARCHITECTURE.md](../audits/MARKETPLACE_TILE_ARCHITECTURE.md)
- [MARKETPLACE_PRESENTATION_MATRIX.md](../audits/MARKETPLACE_PRESENTATION_MATRIX.md)
- [MARKETPLACE_TILE_MIGRATION_PLAN.md](../audits/MARKETPLACE_TILE_MIGRATION_PLAN.md)
