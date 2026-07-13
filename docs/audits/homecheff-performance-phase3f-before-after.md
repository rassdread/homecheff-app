# Phase 3F — Before / After

**Branch:** `performance/phase3f-anonymous-cache`  
**Commit:** `04775f6`  
**Baseline:** production post 3E+ (`7575fae`)

---

## Before (pre-3F production)

| Scenario | Latency |
|----------|---------|
| CDN HIT Tier A (no coords) | ~55–121 ms |
| CDN MISS / warm origin | ~2290 ms server p50 |
| Cold origin | ~4680–5376 ms |
| National + lat/lng | Tier B (~2800–3000 ms) |

---

## After (3F preview — manual verification)

### Zonder coords

| Run | x-vercel-cache | clientMs |
|-----|----------------|----------|
| 1 | MISS | 3781 |
| 2–5 | HIT | 169, 173, 592, 167 |

**Warm median:** ~171 ms

### Met coords

| Run | x-vercel-cache | clientMs |
|-----|----------------|----------|
| 1 | MISS | 2802 |
| 2–5 | HIT | 175, 159, 166, 175 |

**Warm median:** ~171 ms

---

## Delta summary

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Warm feed (national) | ~2290 ms | ~171 ms | **~92% faster** |
| National + coords tier | B | A | CDN-eligible |
| CDN HIT | Yes (no coords only) | Yes (coords too) | Parity fixed |
| Item order with coords | Could differ | Identical | Fixed |

---

## Not yet measured on preview

- Origin cache `X-Feed-Origin-Cache` header (observability only)
- Live `revalidateTag` after publish mutation
