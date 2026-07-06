# Marketplace Legacy Card Debt

**Status:** Audit — remaining non-canonical card surfaces  
**Last updated:** 2026-07-06  
**Canonical system:** `components/marketplace/tiles/`

---

## Migrated to tile system (T1–T2)

| Surface | Variant | Status |
|---------|---------|--------|
| GeoFeed mobile list | Compact | ✅ T1 |
| GeoFeed discover grid | Compact 1:1 | ✅ T1 |
| GeoFeed desktop | Standard | ✅ T1 |
| Discovery section rows | Compact / Standard | ✅ T1 |
| Profile public aanbod (`MyDishesManager` dorpsplein) | Mini | ✅ T2 |
| Favorites grid (`FavoritesGrid`) | Mini | ✅ T2 |

---

## Remaining legacy cards

| Component | Surface | Target variant | Phase |
|-----------|---------|----------------|-------|
| `ProductManagement` | Owner aanbod management (edit/delete) | Keep separate — management UI | — |
| `MyDishesManager` inspiratie public grid | Profile inspiratie tab | Mini `mode=inspiration` | T3/T4 |
| `InspirationCard` | Inspiratie hub, legacy routes | Compact inspiration | T4 |
| `ItemCard.tsx` | Legacy listing card | Deprecate if unused | T4 |
| `DorpspleinPageContent` inline cards | Legacy dorpsplein page | Deprecate with page | T4 |
| Search results | No dedicated card yet | Compact / Standard | When search UI ships |
| Profile collections | Not implemented | Mini | Future |
| Feed sidebar | No tiles mounted | Sidebar shell | Sponsored phase |

---

## Profile integration roadmap

| Module | Current | Target |
|--------|---------|--------|
| Profile aanbod (visitor) | `MarketplaceTileMini` | ✅ |
| Profile inspiratie (visitor) | Inline legacy grid | `MarketplaceTileMini` inspiration |
| Favorites | `MarketplaceTileMini` | ✅ |
| Saved searches | N/A | Out of tile scope |
| Creator audience panel | User list — not tiles | N/A |

---

## Data gaps (no API change)

| Surface | Gap | Mitigation |
|---------|-----|------------|
| Favorites API | No `discovery` block on favorites response | Client mapper with legacy fields |
| Profile products load | May lack full `discovery` | `deriveListingKind` + owner person from profile context |
| Inspiratie public grid | Dish shape without trust | Inspiration mode — no trust row |

---

## Deprecated wrappers (keep 1 release)

| File | Re-exports |
|------|------------|
| `MarketplaceTileMedia.tsx` | `primitives/TileMedia` |
| `MarketplaceTilePersonRow.tsx` | `primitives/TilePersonRow` |
| `MarketplaceTileBadgeStrip.tsx` | `primitives/TileBadgeRow` |
| `MarketplaceTileFavorite.tsx` | `primitives/TileFavoriteAction` |
| `DiscoverGridTile.tsx` | `MarketplaceTileRouter` |
| `GeoFeedCards.tsx` | Stubs for `FeedSaleCard` |

---

## Removal criteria

1. All visitor profile grids use `MarketplaceTileMini` or router
2. Inspiratie hub migrated to router
3. Dorpsplein page deprecated
4. No imports of `FeedSaleCard` body (already stubbed)

---

## Related

- [MARKETPLACE_TILE_MIGRATION_PLAN.md](./MARKETPLACE_TILE_MIGRATION_PLAN.md)
- [MARKETPLACE_TILE_T2_AUDIT.md](./MARKETPLACE_TILE_T2_AUDIT.md)
