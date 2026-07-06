# Marketplace Tile System — Phase T2 Progress

**Status:** ✅ Complete  
**Last updated:** 2026-07-06

---

## Summary

Phase T2 completes the marketplace tile **foundation** before previews, activity cards, sponsored placements, and sidebar redesign.

---

## New components

- `MarketplaceTileMini` — profile aanbod, favorites
- `MarketplaceTileSidebar` — architecture shell (not feed-mounted)
- `ProfilePublicAanbodTileGrid` — profile visitor aanbod wrapper
- `components/marketplace/tiles/primitives/*` — shared building blocks

---

## Lib additions

- `map-profile-listing-to-tile-model.ts`
- `map-favorite-to-tile-model.ts`
- `format-workshop-date.ts`
- Consumer accessors: deal/courier/availability/barter helpers
- `TILE_TRUST_CHANNEL_BY_KIND` export

---

## Integration

| File | Change |
|------|--------|
| `MyDishesManager.tsx` | Public dorpsplein → `ProfilePublicAanbodTileGrid` |
| `ProfileV2TabPanels.tsx` | Always pass `ownerUser` for aanbod |
| `FavoritesGrid.tsx` | `MarketplaceTileMini` |
| `MarketplaceTileRouter.tsx` | `mini` / `sidebar` variants + optional `model` prop |

---

## Validation

```bash
npx tsx scripts/validate-marketplace-tile-system.ts
npx tsx scripts/validate-marketplace-tiles.ts
npm run lint
npm run build
```

---

## Docs

- [MARKETPLACE_TILE_T2_AUDIT.md](../audits/MARKETPLACE_TILE_T2_AUDIT.md)
- [MARKETPLACE_LEGACY_CARD_DEBT.md](../audits/MARKETPLACE_LEGACY_CARD_DEBT.md)

---

## Next (out of T2 scope)

- T3: hover / long-press preview layer
- T4: Inspiratie hub + legacy cleanup
- Sponsored: mount `MarketplaceTileSidebar`
