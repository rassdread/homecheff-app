# Ranking Architecture Audit (Phase 2C-A)

**Date:** 2026-07-06  
**Scope:** All ranking/sorting in HomeCheff discovery surfaces  
**Replacement:** `lib/discovery/ranking/` — single engine (Phase 2C)

---

## Executive summary

| Layer | Location | Status | Migration target |
|-------|----------|--------|------------------|
| Server geo + engagement | `lib/geo/local-discovery.ts` → `/api/feed` | **Active legacy** | `baseline` profile + distance |
| Client smart score | `components/feed/feedSaleRanking.ts` | **Active legacy** | Replace with engine `baseline` / `trending` |
| Client explicit sort | `lib/feed/feed-client-sort.ts` | **Active legacy** | Engine profiles per sort key |
| Inspiratie popular | `lib/getInspiratieItems.ts`, `InspiratieContent.tsx` | **Active legacy** | `trending` profile |
| Dorpsplein popular | `sortDorpspleinProducts` in feed-client-sort | **Active legacy** | `baseline` / `trending` |
| Phase 2A contract | `discovery-ranking-contract.ts` | **Spec → implemented 2C** | Engine input type |
| Smart recommendations API | `app/api/recommendations/smart/route.ts` | **Orphan / dead** | Do not migrate |
| HCP leaderboards | `lib/gamification/leaderboard-scoped.ts` | **Active (non-discovery)** | Out of scope |

**Debt:** Production ranking uses `viewCount`, uncapped favorites, and `averageRating` — all **forbidden** in Phase 2C engine.

---

## Active ranking implementations

### `components/feed/feedSaleRanking.ts`

| Field | Detail |
|-------|--------|
| **Status** | Active — client smart ranking |
| **Signals** | `viewCount`, `favoriteCount`/`propsCount`, `createdAt`, `distanceKm`, photo presence |
| **Weights** | views×0.5 + fav×1.75 (cap 22) + recency tiers + distance tiers + media +10 |
| **Trust** | None |
| **ListingKind** | None |
| **Geo** | `distanceKm` boost |
| **Personalization** | None |

### `lib/geo/local-discovery.ts`

| Field | Detail |
|-------|--------|
| **Status** | Active — server feed sort |
| **Signals** | Same as feedSaleRanking for local bucket; national tail by recency + follow tie-break |
| **Trust** | None |
| **ListingKind** | None |
| **Geo** | Primary — radius partition, haversine |
| **Personalization** | Follow graph soft tie-break (7-day window) |

### `lib/feed/feed-client-sort.ts`

| Field | Detail |
|-------|--------|
| **Status** | Active — user-selected sort |
| **Signals** | `createdAt`, `priceCents`, `viewCount`, `distanceKm` |
| **Dorpsplein popular** | `views + favorites×2` |
| **Trust** | None |
| **ListingKind** | Price sort eligibility via feed-taxonomy |
| **Geo** | Distance asc/desc |

### `lib/getInspiratieItems.ts`

| Field | Detail |
|-------|--------|
| **Status** | Active — server popular sort |
| **Signals** | `views + props×2 + reviews×3 + averageRating×10` |
| **Trust** | Attached post-sort, unused |
| **ListingKind** | INSPIRATION |
| **Geo** | None server-side |

### `components/inspiratie/InspiratieContent.tsx`

| Field | Detail |
|-------|--------|
| **Status** | Active — client re-sort |
| **Signals** | views, favorites, reviews, distance, rating proxy |
| **Trust** | Display only |

### `components/dorpsplein/DorpspleinPageContent.tsx`

| Field | Detail |
|-------|--------|
| **Status** | Active |
| **Product sort** | Delegates to `sortDorpspleinProducts` |
| **User sort** | distance, name, **followers**, products count |
| **Trust** | Discovery attached; sort ignores |

### `app/api/feed/route.ts`

| Field | Detail |
|-------|--------|
| **Status** | Active |
| **Pre-sort** | DB `createdAt desc` take 100 → `sortFeedItemsLocalFirst` → slice 30 |
| **Post-enrich** | viewCount, favoriteCount, averageRating, **trust bundles** |
| **Trust in sort** | No |

### `app/api/products/route.ts`

| Field | Detail |
|-------|--------|
| **Status** | Active |
| **Sort** | Prisma `createdAt desc`; client re-sorts |
| **Trust** | Enriched; not ranked |

---

## Classification (filter only — not ranking)

| File | Role |
|------|------|
| `lib/feed/feed-taxonomy.ts` | Chip/filter, price validity |
| `lib/feed/marketplace-sale.ts` | Sale pool gate for GeoFeed |
| `lib/search/*` | Filter/classification — explicitly no ranking |

---

## Legacy / dead

| File | Status |
|------|--------|
| `app/api/recommendations/smart/route.ts` | Orphan — view-based trending, mock category |
| `components/recommendations/SmartRecommendations.tsx` | Unused UI |
| `productGeoBboxWhere` | Implemented, unwired |
| `FEED_RADIUS_MODE_STRICT_LOCAL` | Not used by production feed |

---

## Adjacent (not marketplace discovery)

| File | Signals | Purpose |
|------|---------|---------|
| `lib/gamification/leaderboard-scoped.ts` | HCP points | HCP leaderboard |
| `lib/gamification/ranking-promo-build.ts` | Promo placement | Carousel |
| `app/api/home/community-pulse/route.ts` | HCP, saves | Homepage stats |

---

## Signal matrix vs production

| Signal | Production | Phase 2C engine |
|--------|------------|-----------------|
| viewCount | ✅ Used | ❌ Forbidden |
| averageRating | ✅ Used | ❌ Forbidden |
| favoriteCount | ✅ Uncapped | ✅ Capped (5) |
| trust tiers | ❌ Not used | ✅ Used |
| sellerTier | ❌ Not used | ✅ Gates + score |
| distanceKm | ✅ Used | ✅ Used |
| followers | ✅ Dorpsplein users | ❌ Forbidden |
| HCP | Leaderboard only | ❌ Forbidden |
| workspace props | Display | ❌ Forbidden |
| dish reviews | Inspiratie sort | ❌ Forbidden |

---

## Phase 2D migration order (recommended)

1. Wire `/api/feed` slice through `sortDiscoveryReadModels(..., { profileId: 'baseline' })`
2. Replace `feedSaleRanking.ts` smart path with engine
3. Replace Dorpsplein/Inspiratie popular with `trending` profile
4. Remove viewCount from sort paths; keep display-only
5. Section builders (Trusted Makers, Top Rated) use profile definitions + engine

---

## New engine (Phase 2C)

| Module | Role |
|--------|------|
| `lib/discovery/ranking/ranking-engine.ts` | Single entry: `rankDiscoveryItems` |
| `lib/discovery/ranking/ranking-profiles.ts` | baseline, trusted_maker, top_rated, trending |
| `lib/discovery/ranking/ranking-utils.ts` | Signal extractors + anti-gaming caps |
| `lib/discovery/ranking/ranking-types.ts` | Types + forbidden legacy keys |

Input: **only** `DiscoveryRankingInput` (`readModel` + `trust` + optional `viewer`).
