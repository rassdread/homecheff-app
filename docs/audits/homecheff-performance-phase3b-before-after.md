# Phase 3B — Before / After

**Datum:** 2026-07-12  
**Status:** lokaal, niet gecommit

---

## Server timings (referentie → verwachting)

| Bucket | Baseline | Na 3A (gemeten) | Na 3B (verwacht) |
|--------|----------|-----------------|------------------|
| total | 6.538 ms | 6.095 ms | **~4.6 ms** |
| feed-db | 2.733 ms | ~3.012 ms | ~3.0 ms (sub-metrics toegevoegd) |
| trust | 1.520 ms | 1.297 ms | ~1.3 ms |
| stats-preview (in feed) | — | **~1.485 ms** | **0 ms** (deferred) |
| stats-preview (POST) | — | — | ~1.5 ms async |
| discovery | ~1.494 ms | ~1.2 ms | ~1.2 ms |
| serialize | 8 ms | ~8 ms | ~8 ms |

**Hermeting vereist** met `FEED_PERF_TIMING=1` op preview na deploy van 3B.

---

## Client

| Metriek | Na Fix2 | Na 3B |
|---------|---------|-------|
| feedFetches | 1 | 1 |
| geoFeedMounts | 1 | 1 |
| Images | OK | OK (geen extra `/api/feed/media` door stats defer) |
| Stats cache | tijdens feed | na idle POST |
| Nieuwe marks | — | `feed:stats-preview-request-start`, `feed:stats-preview-seeded` |

---

## Nieuwe bottlenecks (verwacht)

1. **trust** ~1.3 s — grootste resterende server bucket
2. **feed-db** ~3.0 s — Dish ~1.5 s + Product ~1.5 s
3. **discovery-activity** — user eligibility bij ingelogde sessie

---

## Roadmap richting &lt;4 s en &lt;2 s server

### Fase 3C (kort)

- Trust minimal tile path / snapshot cache
- Dish `(status, createdAt)` index + migratie
- Trust query dedup (seller products éénmalig)

### Fase 3D (middel)

- Discovery activity cards async (zoals stats)
- Product OR-query vereenvoudigen
- Geo-index dish bbox

### Fase 3E (lang)

- Materialized feed candidate snapshot
- Edge cache tier A met stale-while-revalidate 5 min
- Read replica voor feed-db

---

## Validatie

| Script | Resultaat |
|--------|-----------|
| `validate-feed-contract-phase3a.ts` | 68/68 |
| `validate-feed-stats-defer-phase3b.ts` | 9/9 |
| `validate-feed-cache-safety-phase3b.ts` | 11/11 |
| `validate-feed-trust-phase3b.ts` | 10/10 |
| `validate-feed-performance-baseline-phase13k.ts` | 23/23 |
| `npm run lint` | pass |
| `npm run build` | pass |

---

## Git

**Geen commit. Geen push.**
