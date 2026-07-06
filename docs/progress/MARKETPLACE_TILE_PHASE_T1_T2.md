# Marketplace Tile System — Phase T1–T2

**Status:** Planned (architecture complete — implementation pending)  
**Last updated:** 2026-07-06  
**Prerequisite:** Discovery Phase 0–2E complete

---

## Goal

Design and implement the **first Discovery tile generation** — presentation-only redesign. No changes to Discovery ranking, sections, or feed ordering.

---

## Audit inputs

| Document | Role |
|----------|------|
| [MARKETPLACE_TILE_INVENTORY.md](../audits/MARKETPLACE_TILE_INVENTORY.md) | Current card census |
| [MARKETPLACE_TILE_DENSITY_AUDIT.md](../audits/MARKETPLACE_TILE_DENSITY_AUDIT.md) | Info > image findings |
| [MARKETPLACE_TILE_UX_RECOMMENDATIONS.md](../audits/MARKETPLACE_TILE_UX_RECOMMENDATIONS.md) | Variant + rules recommendation (C phased) |

---

## Architecture outputs (this phase)

| Document | Status |
|----------|--------|
| [MARKETPLACE_TILE_ARCHITECTURE.md](../audits/MARKETPLACE_TILE_ARCHITECTURE.md) | ✅ Complete |
| [MARKETPLACE_TILE_PREVIEW_ARCHITECTURE.md](../audits/MARKETPLACE_TILE_PREVIEW_ARCHITECTURE.md) | ✅ Complete (T3 impl) |
| [MARKETPLACE_TILE_MIGRATION_PLAN.md](../audits/MARKETPLACE_TILE_MIGRATION_PLAN.md) | ✅ Complete |

---

## Phase T1 — Compact + Standard feed tiles

### Scope

- [ ] `MarketplaceTileModel` + `map-to-tile-model.ts`
- [ ] `MarketplaceTileCompact` (mobile default, 4:5 / 1:1 discover)
- [ ] `MarketplaceTileStandard` (desktop default, 4:3)
- [ ] `MarketplaceTileMedia`, `PersonRow`, `BadgeStrip`, `Favorite`
- [ ] `build-tile-badges`, `build-tile-trust-cue`, `build-tile-price-line`
- [ ] `MarketplaceTileRouter` + `FeedMarketplaceCard` delegation
- [ ] `GeoFeed` wired to router (replace `DiscoverGridTile` + legacy cards)
- [ ] Remove `UserStatsTile` from feed card tree
- [ ] Remove full-width CTA from tiles
- [ ] i18n NL + EN tile keys
- [ ] Feature flag `NEXT_PUBLIC_MARKETPLACE_TILES_V1`

### Out of scope T1

- Activity cards, sponsored placements, recommendations
- Hover / long-press preview UI
- Profile `Mini` tile (T2)
- API / ranking / section changes

### Acceptance

- [ ] Mobile media ≥ 60% card height
- [ ] Zero `UserStatsTile` in feed DOM
- [ ] Zero blended rating on tiles
- [ ] Favorite + tap-to-detail work
- [ ] Discovery sections unchanged (headings + order)
- [ ] `npm run lint` + `npm run build` pass

---

## Phase T2 — Discovery data + Mini tile

### Scope

- [ ] ListingKind + REQUEST badges on all sale tiles
- [ ] Workshop `availabilityDate` badge
- [ ] Per-channel trust cues from `DiscoveryTrustContract`
- [ ] Barter price lines (`Ruil`, `€ + ruil`)
- [ ] `MarketplaceTileMini` for profile public aanbod
- [ ] `MarketplaceTileSidebar` shell (not mounted)
- [ ] `scripts/validate-marketplace-tiles.ts`
- [ ] Extended `consumer-accessors` for trust channels
- [ ] Add `description` to tile model (preview-ready)

### Out of scope T2

- Preview panel / bottom sheet (T3)
- Sponsored badge (priority slot reserved)
- Dorpsplein / InspirationCard legacy migration (T4)

### Acceptance

- [ ] All T1 acceptance still pass
- [ ] Trust cue uses product/deal/courier channels only
- [ ] Validation script green
- [ ] Profile public grid uses Mini variant

---

## Implementation file map (target)

```
components/marketplace/tiles/          # T1
lib/marketplace/tiles/                 # T1
components/feed/FeedMarketplaceCard.tsx  # T1 delegate
components/feed/GeoFeed.tsx            # T1 renderer swap
components/feed/GeoFeedCards.tsx       # T1 slim types only
components/profile/MyDishesManager.tsx # T2 mini tiles
scripts/validate-marketplace-tiles.ts  # T2
```

---

## Explicit non-goals (T1–T2)

| Area | Status |
|------|--------|
| Discovery ranking engine | No change |
| Section registry / builders | No change |
| `/api/feed` contract | No change |
| Activity cards | Not in scope |
| Sponsored placements | Not in scope |
| Recommendations slot | Not in scope |
| `UserStatsTile` on profile/detail | **Keep** |

---

## Decision record

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Redesign depth | Phased full redesign (C) | Architecture mismatch + mobile density |
| Default mobile | `MarketplaceTileCompact` | Discover grid proves lighter pattern |
| Default desktop | `MarketplaceTileStandard` | Replace CSS-only compaction |
| Trust on tile | Single cue, per-channel | Anti-gaming compliance |
| CTA on tile | Removed | Tap card → detail |
| Preview | Spec in T2, build in T3 | T1–T2 focus on base tile |

---

## Next steps after T2

| Phase | Work |
|-------|------|
| T3 | Hover preview + long-press sheet |
| T4 | Legacy Inspiratie/Dorpsplein/ItemCard removal |
| T5 | Sponsored `MarketplaceTileSidebar` mount |

---

## Progress log

| Date | Event |
|------|-------|
| 2026-07-06 | UX audit V1 complete (inventory, density, recommendations) |
| 2026-07-06 | T1–T2 architecture + migration + preview spec complete |
| — | T1 implementation not started |
