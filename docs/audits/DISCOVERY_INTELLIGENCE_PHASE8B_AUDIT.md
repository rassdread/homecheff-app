# Discovery Intelligence — Phase 8B Audit

Date: 2026-07-08  
Scope: Accepted Values reverse discovery & filter

## 1. Reverse Discovery audit

**Before:** Discovery only supported classic search — “what do I want to buy?”

**After:** Users can filter by what they can offer — “I have fruit / I’m a photographer / I do nails” — and see listings that accept that counter-value.

| Direction | Example | Behaviour |
|-----------|---------|-----------|
| Classic | “Ik zoek een fiets” | Text/category filters (unchanged) |
| Reverse | “Ik heb fruit” | Accepted-values filter → items whose `acceptedSpecializations` include fruit taxonomy id |

Matching uses **OR** within selected counter-values (any match). Combined with category/search/price via **AND** in existing GeoFeed memos.

## 2. Accepted Values filter

| Surface | Location |
|---------|----------|
| Desktop sidebar | `FeedSidebarFilters` → “Verfijnen” → Geaccepteerde tegenwaarden |
| Mobile | `FeedMobileFilterSheet` |
| Legacy desktop card | GeoFeed inline advanced filters |

Instant client-side apply — no Apply button needed for this axis.

## 3. Taxonomy hergebruik

| Source | Usage |
|--------|--------|
| `getAcceptedValueTaxonomyItems()` | Filter options (same as `AcceptedValuesPicker`) |
| `TaxonomyLucideIcon` + `taxonomyLabelKey` | Chips & filter buttons |
| `acceptedSpecializations` / `discovery.acceptedValueSubcategories` | Item matching |
| `groupAcceptedTaxonomyIds()` | Detail grouped display |

No duplicate hardcoded lists.

## 4. Tile consistency

Order preserved (Phase 7D/7E):

1. Price + accepted-value icons (`TileValueExchangeBlock`)
2. Trust (`TileTrustCue`)
3. Settlement (`TileSettlementRow`)

## 5. Detail consistency

`ProductAcceptedBadgesSection` now uses `AcceptedValuesGroupedList` with group headings, icons, and description copy.

## 6. Preview consistency

`buildPreviewAcceptedValues` carries taxonomy icons; `MarketplacePreviewCard` renders icons beside labels.

## 7. Wanted ondersteuning

`filteredRequestBase` applies the same `itemMatchesAcceptedValuesDiscoveryFilter` — Gezocht items filter on counter-performance they accept/seek.

## 8. Services ondersteuning

No separate path — services are OFFER items in the sale pool with `acceptedSpecializations`; filter applies uniformly.

## 9. Performance

- Client-side only — no new API routes or Prisma queries
- Memoized `filteredSaleBase` / `filteredRequestBase`
- No GeoFeed remount

## 10. Data integrity

```
AcceptedValuesPicker → acceptedSpecializations (DB)
        ↓
Feed API → discovery.acceptedValueSubcategories
        ↓
extractItemAcceptedValueIds() → filter + tile + preview + detail
```

## 11. Deferred items

- Persist `appliedAcceptedValues` in feed surface state (session restore)
- Search box suggesting counter-values from query text (auto-detect “fruit” in q)
- Server-side accepted-values param on `/api/feed` (only if client pool becomes insufficient)
