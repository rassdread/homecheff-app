# Phase 3D-Final — Before / After (preview bevestigd)

**Datum:** 2026-07-13  
**Branch:** `performance/phase2-baseline` @ `1587374`  
**Preview:** Vercel preview met `FEED_PERF_TIMING=1` (ingelogde browser, national feed)

---

## Baseline (Phase 3C preview, vóór 3D)

| Bucket | Gem 3 runs |
|--------|------------|
| Server total | **4102 ms** |
| Product.findMany | **1166 ms** |
| Dish.findMany | **1424 ms** |
| Trust | **1097 ms** |
| Linked media | **0 ms** |

*(3C na text[]-fix; runs 4471 / 4164 / 3670)*

---

## Phase 3D + observability-fix (preview bevestigd)

| Run | Server | Product | Dish | Trust | cache hits | missSellerCount |
|-----|--------|---------|------|-------|------------|-----------------|
| 1 (cold) | 4713 | 1504 | 1410 | 1299 | 0 | 4 |
| 2 (warm) | **2993** | 1302 | 941 | 372 | 4 | 0 |
| 3 (warm) | 3357 | 1296 | 1495 | **188** | 8 | 0 |

| Metriek | Cold (run 1) | Warm (run 2–3 gem) | Δ vs 3C-baseline |
|---------|--------------|---------------------|------------------|
| Server | 4713 ms | **3175 ms** | −23% warm / +14% cold |
| Product | 1504 ms | **1299 ms** | +12% cold / +11% gem |
| Dish | 1410 ms | **1218 ms** | −1% / −15% warm |
| Trust | 1299 ms | **280 ms** | +18% cold / **−74% warm** |

---

## Observability (1587374)

| Check | Resultaat |
|-------|-----------|
| `debug.perf.trustTiming.cacheStats` niet null | ✅ |
| Cold: `hits: 0`, `missSellerCount: 4` | ✅ |
| Warm: `hits: 4→8`, `missSellerCount: 0` | ✅ |
| `debug.trustTiming` mirrored (zelfde shape) | ✅ |
| Trust wall-clock 1299 → 372 → 188 ms | ✅ |

---

## Functioneel (preview)

| Check | Status |
|-------|--------|
| feedFetches = 1 | ✅ |
| geoFeedMounts = 1 | ✅ |
| Geen regressies gemeld | ✅ |
| Afbeeldingen / media | ✅ |
| Desktop één kolom | ✅ (3C validators) |

---

## Niet bereikt (targets)

| Target | Actueel warm | Status |
|--------|--------------|--------|
| Server p50 < 3000 ms | 3175 ms gem run 2–3; run 2 **2993** | ⚠️ grens |
| Product p50 < 800 ms | **~1299 ms** | ❌ |
| Dish p50 < 700 ms | **~1218 ms** | ❌ |
| Trust < 600–700 ms cold | 1299 ms cold | ❌ cold / ✅ warm |

---

## Conclusie

- **Trust-cache + observability:** productie-klaar op preview.
- **Server totaal:** verbetering bij warme traffic; cold nog ~4,7 s.
- **Product:** structurele bottleneck → Phase 3E handoff.
