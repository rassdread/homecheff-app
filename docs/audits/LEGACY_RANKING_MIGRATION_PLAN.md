# Legacy Ranking Migration Plan

**Phase:** Discovery 2D  
**Status:** Audit complete — **do not remove legacy paths yet**

This plan maps active legacy ranking/sort code to the new **Discovery Section Registry** + **Ranking Engine**. Migration is **Phase 2E+** (feed/API rollout), explicitly out of 2D scope.

---

## Target architecture

```
DiscoveryReadModel[] (with trust enrichment)
        ↓
Section Registry (eligibility + profile + limits)
        ↓
rankDiscoveryReadModels(profileId)
        ↓
DiscoverySectionResult.items
```

---

## Legacy inventory

| Path | Location | Current role | Action | Target section/profile |
|------|----------|--------------|--------|------------------------|
| Feed smart ranking | `components/feed/feedSaleRanking.ts` | Client-side score: distance, recency, favorites, tier | **Replace** | `baseline` or composed sections |
| Local discovery sort | `lib/geo/local-discovery.ts` | Geo bucket + national tail ordering | **Wrap** | `nearby` profile + registry limits |
| Feed client sort | `lib/feed/feed-client-sort.ts` | URL-driven sort (price, date, smart) | **Wrap** | Map `smart` → engine; keep price/date as non-ranking sorts |
| Inspiratie popular | `lib/getInspiratieItems.ts` | `averageRating` + props sort | **Replace** | Separate inspiratie profile (future) — **not** marketplace sections |
| Smart recommendations | `app/api/recommendations/smart/route.ts` | View-based mock scoring | **Deprecate** | Do not migrate — orphan/dead |

### Consumers still importing legacy paths

| Consumer | Legacy import |
|----------|---------------|
| `components/feed/GeoFeed.tsx` | `feedSaleRanking.ts` |
| `components/dorpsplein/DorpspleinPageContent.tsx` | local discovery helpers |
| `app/api/feed/route.ts` | server-side ordering before client |
| `app/api/products/route.ts` | product list ordering |
| `app/api/inspiratie/route.ts` | `getInspiratieItems` popular sort |

---

## Per-path migration notes

### 1. `feedSaleRanking.ts` — **Replace**

**Today:** Computes `smartScore` from distance, recency, capped favorites, seller tier. Duplicates engine logic.

**Migration:**
1. Map feed items to `DiscoveryReadModel` (already enriched in Phase 2B).
2. Call `buildDiscoverySection('nearby', …)` or `rankDiscoveryReadModels(..., { profileId: 'baseline' })` depending on feed mode.
3. Remove `smartScore` / `computeSmartScore` once GeoFeed reads engine order.
4. Keep file as thin adapter during transition: `export function rankFeedItems(items) { return sortDiscoveryReadModels(items, 'baseline'); }`

**Risk:** Client-only ranking vs server order mismatch — unify on server order in Phase 2E.

### 2. `local-discovery.ts` — **Wrap**

**Today:** Radius filter + sort by distance/recency for local bucket.

**Migration:**
1. Radius filter stays in geo layer (`feed-radius-filter.ts`, `item-location.ts`).
2. Sort within bucket → `nearby` ranking profile via registry.
3. National tail → `baseline` or exclude from nearby section.

### 3. `feed-client-sort.ts` — **Wrap**

**Today:** Parses `sortBy` query; `smart` delegates to feedSaleRanking.

**Migration:**
1. `price_asc` / `price_desc` / `newest` — keep as deterministic non-ranking sorts.
2. `smart` / default discovery → `buildAllDiscoverySections` or single section from registry config.
3. Export sort mode → section id mapping in one config file.

### 4. `getInspiratieItems.ts` popular sort — **Replace (separate track)**

**Today:** Uses `averageRating` and props count for INSPIRATION listings.

**Migration:**
- **Not** mapped to marketplace section registry (inspiration excluded from all 5 sections).
- Future: `inspiration_trending` profile or dedicated inspiratie section outside Phase 2D scope.
- Short-term: sort by `trust.product.reviewCount` + recency (no blended rating).

### 5. `/api/recommendations/smart` — **Deprecate**

**Today:** Unused in routes; view-count trending with mock categories.

**Migration:** Add `@deprecated` JSDoc + ADR reference. Remove in cleanup sprint after confirming zero callers. **Do not** wire to ranking engine (personalization out of scope).

---

## Rollout sequence (Phase 2E+)

| Step | Work | Verification |
|------|------|--------------|
| 1 | Server feed API returns section metadata (no UI change) | API contract tests |
| 2 | Replace `feedSaleRanking` smart path with engine order | GeoFeed parity check |
| 3 | Wire `local-discovery` sort to `nearby` profile | Radius fixture scripts |
| 4 | Map feed `sortBy=smart` to registry | `feed-client-sort` tests |
| 5 | Inspiratie popular sort debt (separate PR) | No `averageRating` in sort |
| 6 | Remove deprecated helpers after 1 release flag | Grep zero imports |

---

## What stays until rollout

- All legacy files remain in repo (2D requirement).
- No route or UI changes in 2D.
- No removal of `feedSaleRanking.ts` exports used by GeoFeed.

---

## Validation commands

```bash
npx tsx scripts/validate-ranking-engine.ts
npx tsx scripts/validate-discovery-sections.ts
```
