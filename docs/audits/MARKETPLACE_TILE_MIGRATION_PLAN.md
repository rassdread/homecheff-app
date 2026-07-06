# Marketplace Tile Migration Plan — T1–T2

**Status:** Migration plan (presentation layer only)  
**Last updated:** 2026-07-06  
**Architecture:** [MARKETPLACE_TILE_ARCHITECTURE.md](./MARKETPLACE_TILE_ARCHITECTURE.md)

---

## 1. Migration principles

1. **Strangler pattern** — new tiles wrap behind `MarketplaceTileRouter`; old cards deleted per surface
2. **No API changes** — `GeoFeedCardItem` + `discovery` block remain feed transport
3. **No ranking/section changes** — `GeoFeed` row iteration unchanged; only row renderer swaps
4. **Feature flag** — `NEXT_PUBLIC_MARKETPLACE_TILES_V1` for staged rollout (default `true` after QA)
5. **One PR per phase** — T1 core, T2 profile + validation

---

## 2. Current → target mapping

| Current component | Target | Phase |
|-------------------|--------|-------|
| `FeedSaleCard` | `MarketplaceTileCompact` / `Standard` | T1 |
| `FeedInspirationCard` | Same router `mode="inspiration"` | T1 |
| `DiscoverGridTile` | `MarketplaceTileCompact` `mediaRatio="1:1"` | T1 |
| `FeedMarketplaceCard` | Thin router to `MarketplaceTileRouter` | T1 |
| `FeedCardPrimaryMedia` | `MarketplaceTileMedia` (or wrap) | T1 |
| `FeedSellerMediaChip` | **Remove** — `MarketplaceTilePersonRow` | T1 |
| `FeedCardCompactStats` | **Remove** — `build-tile-trust-cue` | T1 |
| `UserStatsTile` in feed | **Remove** | T1 |
| `.hc-home-feed-grid` compaction CSS | **Deprecate** after Standard ships | T1 cleanup |
| `InspirationCard` | `MarketplaceTileCompact` (when route revived) | T4 |
| `DorpspleinPageContent` inline cards | Deprecate page | T4 |
| `MyDishesManager` public grid | `MarketplaceTileMini` | T2 |
| `ProductManagement` owner cards | Keep separate (management UI) | — |

---

## 3. Phase T1 — Core feed tiles

### 3.1 Deliverables

- [ ] `lib/marketplace/tiles/` — rules + price/trust/badge builders
- [ ] `components/marketplace/tiles/` — Compact, Standard, Media, PersonRow, Router
- [ ] `map-to-tile-model.ts` — from `GeoFeedCardItem`
- [ ] i18n keys NL + EN
- [ ] `FeedMarketplaceCard` → router
- [ ] `GeoFeed` → remove `DiscoverGridTile` branch; use router with variant selection
- [ ] Remove `UserStatsTile` import from `GeoFeedCards.tsx`
- [ ] Delete or deprecate `FeedSaleCard`, `FeedInspirationCard`, `DiscoverGridTile` bodies (keep thin re-exports 1 release if needed)

### 3.2 GeoFeed variant selection (pseudo)

```typescript
const tileVariant = isMobileFeedUi
  ? 'compact'
  : 'standard';

const mediaRatio = useDiscoverGridTiles ? '1:1' : isMobileFeedUi ? '4:5' : '4:3';

<MarketplaceTileRouter
  item={card}
  variant={tileVariant}
  mediaRatio={mediaRatio}
  mode={row.variant}
  ...
/>
```

### 3.3 Files touched (T1)

| File | Change |
|------|--------|
| `components/feed/GeoFeed.tsx` | Replace `FeedMarketplaceCard` / `DiscoverGridTile` with router |
| `components/feed/FeedMarketplaceCard.tsx` | Delegate to `MarketplaceTileRouter` |
| `components/feed/GeoFeedCards.tsx` | Remove card implementations; keep `GeoFeedCardItem` type + `feedLocationLine` |
| `components/feed/DiscoverGridTile.tsx` | Delete after migration |
| `app/globals.css` | Mark `.hc-home-feed-grid` tile overrides deprecated |
| `public/i18n/nl.json`, `en.json` | New tile keys |

### 3.4 Files NOT touched (T1)

| File | Reason |
|------|--------|
| `app/api/feed/route.ts` | No API change |
| `lib/feed/build-discovery-feed.ts` | No ranking/section change |
| `lib/discovery/ranking/*` | Forbidden |
| `lib/discovery/sections/*` | Forbidden |
| `components/feed/DiscoveryFeedSectionHeading.tsx` | Unchanged |

### 3.5 Rollback

Set `NEXT_PUBLIC_MARKETPLACE_TILES_V1=false` → `FeedMarketplaceCard` renders legacy cards (keep legacy behind flag until T1 stable).

---

## 4. Phase T2 — Discovery data + profile mini

### 4.1 Deliverables

- [ ] `build-tile-trust-cue` wired to `DiscoveryTrustContract` channels (verify no blend)
- [ ] `listingKind` + `listingIntent` badges on all sale tiles
- [ ] `availabilityDate` on workshop tiles
- [ ] Barter price lines (`BARTER_ONLY`, `MONEY_AND_BARTER`)
- [ ] `MarketplaceTileMini` + profile `MyDishesManager` public grid
- [ ] `MarketplaceTileSidebar` shell (unmounted)
- [ ] `scripts/validate-marketplace-tiles.ts`
- [ ] Add `description` to tile model (for T3 preview)
- [ ] Search results mobile → `MarketplaceTileCompact` (if search UI uses shared card)

### 4.2 Consumer accessor extensions

Optional helpers in `lib/discovery/consumer-accessors.ts`:

```typescript
getDiscoveryDealReviewCount(item)
getDiscoveryCompletedDeals(item)
getDiscoveryCourierReviewCount(item)
getDiscoveryCompletedDeliveries(item)
getDiscoveryAvailabilityDate(item)
getDiscoveryBarterOpenness(item)
```

### 4.3 Files touched (T2)

| File | Change |
|------|--------|
| `lib/discovery/consumer-accessors.ts` | Trust channel helpers |
| `lib/marketplace/price-display.ts` | Barter compact suffixes (or tile-only builder) |
| `components/profile/MyDishesManager.tsx` | `MarketplaceTileMini` for public view |
| `scripts/validate-marketplace-tiles.ts` | New validation script |

---

## 5. Risk register

| Risk | Mitigation |
|------|------------|
| Missing `discovery` on old cached items | Fallback mappers + dev console warn |
| Favorite breaks on entity type | Keep `productId` / `dishId` logic in router |
| Desktop layout regression | Visual QA on `hc-home-feed-grid` 2–3 columns |
| Native 3:4 override lost | Re-evaluate in T3; T1 uses 4:5 compact |
| Inspiration API shape mismatch | Keep `inspirationApiToCardItem` in mapper layer |
| SEO / crawl | Tiles are client components — no change |

---

## 6. QA checklist

### T1 sign-off

- [ ] Mobile feed: no `UserStatsTile` in DOM
- [ ] Mobile: media ≥ 60% card height (sample 10 cards)
- [ ] Desktop: no full-width CTA on tiles
- [ ] Favorite works sale + inspiration
- [ ] Card tap navigates to detail
- [ ] Discovery sections render same headings + new tiles
- [ ] No `averageRating` text in tile HTML
- [ ] Lint + build pass

### T2 sign-off

- [ ] Workshop shows date badge when `availabilityDate` set
- [ ] REQUEST shows “Gezocht” badge
- [ ] Trust cue shows product OR deal channel (not blend)
- [ ] Barter-only shows `Ruil`
- [ ] Profile public grid uses Mini tile
- [ ] `validate-marketplace-tiles.ts` passes

---

## 7. Timeline estimate

| Phase | Effort | Dependencies |
|-------|--------|--------------|
| T1 core | 3–5 dev days | None |
| T2 data + mini | 2–3 dev days | T1 merged |
| T3 preview | 3–4 dev days | T2 + preview architecture |
| T4 legacy cleanup | 1–2 dev days | T3 |

---

## 8. Deprecation schedule

| Asset | Deprecate after | Remove after |
|-------|-----------------|--------------|
| `FeedSaleCard` | T1 merge | T1 + 1 week |
| `DiscoverGridTile` | T1 merge | T1 + 1 week |
| `FeedCardCompactStats` | T1 merge | T1 + 1 week |
| `FeedSellerMediaChip` | T1 merge | T1 + 1 week |
| `.hc-home-feed-grid` CSS overrides | T1 merge | T2 cleanup PR |
| `InspirationCard` | T4 | When hub removed |
| `ItemCard.tsx` | T4 | If still unused |

---

## 9. Search integration note

No dedicated search result card exists today. When search UI renders listing rows:

- Mobile → `MarketplaceTileCompact`
- Desktop → `MarketplaceTileStandard` or list `MarketplaceTileWide` (T4)

Mapper accepts `SearchableListingRecord` + `discovery` same as feed.

---

## 10. Commit strategy

```
feat(tiles): marketplace tile architecture T1 — compact + standard feed
feat(tiles): discovery trust + listingKind on tiles T2
chore(tiles): remove legacy FeedSaleCard and DiscoverGridTile
docs(tiles): architecture and migration audits
```

No mixed PR with Discovery ranking or feed API changes.
