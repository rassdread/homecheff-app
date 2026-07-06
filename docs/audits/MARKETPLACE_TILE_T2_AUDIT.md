# Marketplace Tile T2 Audit

**Status:** Complete  
**Last updated:** 2026-07-06  
**Phase:** T2 — tile system foundation before previews / activity cards / sponsored

---

## Deliverables

| Requirement | Status |
|-------------|--------|
| `MarketplaceTileMini` | ✅ |
| `MarketplaceTileSidebar` shell (unmounted in feed) | ✅ |
| Shared primitives (`TileMedia`, `TilePersonRow`, `TileBadgeRow`, `TileTrustCue`, `TilePriceLine`) | ✅ |
| Trust polish per ListingKind matrix | ✅ |
| ListingKind badge / price / trust / person polish | ✅ |
| Workshop `availabilityDate` badge | ✅ |
| REQUEST Gezocht + requester row | ✅ |
| Accepted values: hidden compact/mini; max 1 standard | ✅ |
| Profile public aanbod → Mini | ✅ |
| Favorites → Mini | ✅ |
| Consumer accessor extensions | ✅ |
| `validate-marketplace-tile-system.ts` | ✅ |

---

## Trust channel matrix (implemented)

| ListingKind | Primary channel | Compact segments | Standard segments |
|-------------|-----------------|------------------|-------------------|
| PRODUCT | Product reviews | 1 (product → tier) | 2 (product · deal) |
| SERVICE | Deal | 1 | 2 |
| TASK | Deal | 1 | 2 |
| WORKSHOP | Deal | 1 | 2 |
| COACHING | Deal | 1 | 2 |
| REQUEST | Requester deal | 1 | 2 |
| INSPIRATION | None | 0 | 0 |

**Forbidden on all tiles:** `averageRating`, `viewCount`, `propsCount`, `UserStatsTile`, blended ratings.

---

## Badge rules (implemented)

Priority: Request → Workshop date → ListingKind → Specialization → Accepted value (standard only) → Trust badge.

| Variant | Max badges | Accepted value |
|---------|------------|----------------|
| Compact | 2 | Hidden |
| Standard | 3 | Max 1 |
| Mini | 1 | Hidden |
| Sidebar | 1 | Hidden |

---

## Variant surfaces

| Variant | Surfaces |
|---------|----------|
| Compact | Mobile feed, discover grid, search mobile |
| Standard | Desktop feed, discovery sections |
| Mini | Profile public aanbod, favorites |
| Sidebar | Shell only — future sponsored / recommendations |

---

## REQUEST presentation

- Badge: `Gezocht` (amber tone)
- Person row: `Gezocht door` + requester name
- Price: `Voorstel welkom` / budget — no € checkout styling
- Trust: deal channel on requester history

---

## Workshop presentation

- Date badge via `formatWorkshopDateCompact(availabilityDate)`
- Kind suffix on price line when date shown as badge

---

## Primitive module

```
components/marketplace/tiles/primitives/
  TileMedia.tsx
  TilePersonRow.tsx
  TileBadgeRow.tsx
  TileTrustCue.tsx
  TilePriceLine.tsx
  TileFavoriteAction.tsx
```

All four main variants import from `primitives/`.

---

## Explicit non-goals (unchanged)

- Hover / long-press preview (T3)
- Activity cards
- Sponsored placements
- Recommendations slot
- Ranking / API / section changes

---

## Related

- [MARKETPLACE_LEGACY_CARD_DEBT.md](./MARKETPLACE_LEGACY_CARD_DEBT.md)
- [MARKETPLACE_TILE_T1.md](../progress/MARKETPLACE_TILE_T1.md)
