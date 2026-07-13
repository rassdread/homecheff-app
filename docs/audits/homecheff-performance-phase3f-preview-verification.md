# Phase 3F — Preview Verification

**Commit:** `04775f6`  
**Branch:** `performance/phase3f-anonymous-cache`  
**Preview URL:** https://homecheff-r9se9mc6j-sergio-s-projects-f7b64ee1.vercel.app  
**Verified:** 2026-07-14 (manual browser, Vercel SSO)

---

## Deployment

| Check | Result |
|-------|--------|
| Feature push | ✅ `04775f6` |
| Preview build | ✅ Ready |
| Production deploy | Pending merge to main |

---

## Manual preview measurements

### Zonder coords

`GET /api/feed?scope=national&radius=0&take=10&skip=0&vertical=all`

| Run | x-vercel-cache | clientMs |
|-----|----------------|----------|
| 1 | MISS | 3781 |
| 2 | HIT | 169 |
| 3 | HIT | 173 |
| 4 | HIT | 592 |
| 5 | HIT | 167 |

- **Warme mediaan:** ~171 ms (runs 2–5, excl. outlier 592 ms)
- **x-feed-cache-tier:** A
- **Item IDs:** stable across runs

### Met coords

`GET /api/feed?scope=national&radius=0&take=10&skip=0&vertical=all&lat=52.09&lng=5.12`

| Run | x-vercel-cache | clientMs |
|-----|----------------|----------|
| 1 | MISS | 2802 |
| 2 | HIT | 175 |
| 3 | HIT | 159 |
| 4 | HIT | 166 |
| 5 | HIT | 175 |

- **Warme mediaan:** ~171 ms
- **x-feed-cache-tier:** A
- **Item IDs & order:** exact match with no-coords URL
- **Only difference:** `distanceKm` labels on items

---

## Classification

| Area | Status |
|------|--------|
| CDN cache | **GROEN** — HIT runs 2–5, warm ~170 ms |
| Tier A + coords | **GROEN** |
| Parity (IDs/order) | **GROEN** |
| Security | **GROEN** — validators pass |
| Origin-cache observability | **Aandachtspunt** — `X-Feed-Origin-Cache` not separately confirmed; not blocking |
| Revalidation | **Statisch GROEN** (19/19); live fixture not tested |
| Merge to main | **GO** |
| Production | **GO** after post-merge checks |

---

## Baseline comparison

| Metric | Pre-3F warm origin | Post-3F CDN HIT |
|--------|-------------------|-----------------|
| Feed TTFB/client | ~2290 ms server p50 | ~171 ms warm median |
| Improvement | — | **~92% faster** |

---

## Manual checklist (completed)

- [x] Tier A headers on anonymous national feed
- [x] CDN HIT on repeated identical URL
- [x] National + coords same IDs/order
- [x] distanceKm only presentation delta with coords
- [ ] Origin cache HIT header (optional follow-up)
- [ ] Live revalidation fixture (optional follow-up)
