# Discovery Ranking Engine — Phase 2C Progress

**Date:** 2026-07-06  
**Status:** Complete (engine foundation — no API rollout)  
**Depends on:** Phase 2B trust enrichment

---

## Delivered

### 2C-A Ranking audit
- `docs/audits/RANKING_ARCHITECTURE_AUDIT.md`

### 2C-B Ranking engine
- `lib/discovery/ranking/ranking-engine.ts`
- `lib/discovery/ranking/ranking-profiles.ts`
- `lib/discovery/ranking/ranking-types.ts`
- `lib/discovery/ranking/ranking-utils.ts`
- `lib/discovery/ranking/index.ts`

### 2C-C Input contract
- Consumes only `DiscoveryRankingInput` (readModel + trust + viewer)
- `toDiscoveryRankingInput()` from `DiscoveryReadModel`
- `assertRankingInputPurity()` rejects legacy field injection

### 2C-D Baseline profile
- Distance, recency, seller tier, capped favorites, completed deals
- Anti-spam gate for tier-0 listings without media/description

### 2C-E Trusted maker profile (definition)
- Gates: tier ≥ 4, combined reviews ≥ 3, active, not INSPIRATION
- Signals: sellerTier, deal/product reviews, completed deals, badges, distance

### 2C-F Top rated profile (definition)
- Gate: max channel reviews ≥ 5
- Score: per-channel volume — no blended ratings

### 2C-G Trending profile (definition)
- Gate: tier ≥ 3, within 7 days, favorites ≥ 2
- Score: capped favorites + recency + activity — no views

### 2C-H Anti-gaming
- Forbidden signals from `DISCOVERY_RANKING_FORBIDDEN_SIGNALS`
- Favorite cap = 5
- Legacy key rejection at runtime
- No HCP, followers, views, workspace props, dish feedback, blended ratings

### 2C-I Validation harness
- `scripts/validate-ranking-engine.ts`
- `docs/audits/RANKING_ENGINE_VALIDATION.md`

---

## Explicitly not done

- API rollout to feed/Dorpsplein/Inspiratie
- UI changes, sections, recommendations, personalization
- Removal of legacy ranking files

---

## Phase 2D blockers cleared

- ✅ Single ranking engine exists
- ✅ Four profiles defined
- ✅ Trust-aware scoring from `DiscoveryTrustContract`
- ✅ Validation harness

## Phase 2D scope (next)

- Replace `feedSaleRanking.ts` / `local-discovery.ts` sort with engine
- Wire `/api/feed` post-enrichment through `baseline`
- Section builders for Trusted Makers / Top Rated / Trending / Nearby
- Remove viewCount from sort paths
