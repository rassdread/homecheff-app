# Ranking Engine Validation (Phase 2C-I)

**Date:** 2026-07-06  
**Harness:** `scripts/validate-ranking-engine.ts`  
**Run:** `npx tsx scripts/validate-ranking-engine.ts`

---

## Sample fixtures

| ID | Scenario |
|----|----------|
| `near-new` | 2 km, 1 day old, tier 3, 2 product reviews, 3 favorites |
| `far-established` | 40 km, 30 days, tier 4, 8+4 reviews, badge, 12 deals |
| `trending-hot` | 8 km, 2 days, tier 3, 8 favorites (capped to 5), 2 deals |
| `top-rated-deal` | 15 km, tier 5, 6 product + 12 deal reviews |
| `inactive` | tier 4 but `isActive: false` |
| `inspiration-dish` | INSPIRATION listingKind, high reviews |

---

## Expected behavior by profile

### baseline

| Check | Expected |
|-------|----------|
| Order | Higher tier + deals can lead; closer listings beat distant ones |
| Excludes | `inactive` |
| Signals | distance, recency, sellerTier, capped favorites, completedDeals |

### trusted_maker

| Check | Expected |
|-------|----------|
| Includes | `far-established`, `top-rated-deal` (tier ≥ 4, reviews ≥ 3) |
| Excludes | `near-new` (tier 3), `inspiration-dish`, `inactive` |
| No engagement | viewCount/favorites not in score |

### top_rated

| Check | Expected |
|-------|----------|
| Leader | `top-rated-deal` (max channel 12 deal reviews) |
| Excludes | `inspiration-dish`, listings below 5 channel reviews |
| No blended rating | Score from channel counts only |

### trending

| Check | Expected |
|-------|----------|
| Includes | `trending-hot` (recent + favorites ≥ 2 + tier ≥ 3) |
| Excludes | `far-established` (not within 7 days) |
| Favorite cap | 5 vs 100 favorites → identical trending score |

---

## Anti-gaming checks

| Rule | Validation |
|------|------------|
| `viewCount` on input | `assertRankingInputPurity` throws |
| Favorites capped | 5 = 100 favorites same score |
| HCP / followers | Not referenced in engine code |
| workspace props | Not in `DiscoveryRankingInput` |
| Blended ratings | Not in score functions |

---

## Validation run output

Run the script after any engine change. All assertions must pass before Phase 2D API rollout.

```
npx tsx scripts/validate-ranking-engine.ts
```

Expected: `Results: N passed, 0 failed` with exit code 0.

---

## Manual verification checklist

- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] Validation script passes
- [ ] No production API routes import ranking engine yet (Phase 2C scope)
- [ ] Legacy sort paths unchanged (no accidental rollout)
