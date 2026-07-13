# Phase 10 — Performance Before / After

**Datum:** 2026-07-13  
**Branch:** `performance/phase2-baseline` @ `4632a9b`  
**Methode:** vergelijking historische baselines + lokale cache-miss runs (geen nieuwe optimalisaties)

---

## 1. Referentiepunten

| Fase | Context | Server total (typisch) | Opmerking |
|------|---------|------------------------|-----------|
| Oorspronkelijke baseline | Preview vóór 3A | **~6–8 s** | stats+trust zwaar |
| Phase 3C | 3 cache-miss preview runs | **~4,1 s** gem. | trust ~1,37 s |
| Phase 3D-Final | 3 preview runs (user) | **2,8–4,7 s** | trust cache warm → ~188–373 ms |
| Phase 10 lokaal | prod-build, shared Neon, `perfBust` | **1,0–1,8 s** | kleinere cold-start delta lokaal |

---

## 2. Phase 10 lokale meting (3 cache-miss runs)

Omgeving: `npm run build` + `npm start -p 3010`, `FEED_PERF_TIMING=1`, `perfBust` per run, `scope=national&radius=0&take=10`.

| Run | HTTP total | Server `totalMs` | Product | Dish | Trust bucket | Trust total | Cache hits/misses | Prisma queries | Prisma total |
|-----|------------|------------------|---------|------|--------------|-------------|-------------------|----------------|--------------|
| 1 | 1952 ms | 1801 ms | 515 ms | 539 ms | 434 ms | 341 ms | 0 / 4 | 7 | 1923 ms |
| 2 | 992 ms | 984 ms | 300 ms | 508 ms | 83 ms | 0 ms | 4 / 4 | 7 | 1019 ms |
| 3 | 962 ms | 953 ms | 181 ms | 600 ms | 81 ms | 0 ms | 8 / 4 | 7 | 985 ms |

### Classificatie t.o.v. historisch

| Metriek | vs ~6–8 s baseline | vs Phase 3C ~4,1 s | vs Phase 3D 2,8–4,7 s |
|---------|-------------------|---------------------|------------------------|
| Server total (run 1) | **Verbeterd** | **Verbeterd** | **Gelijk / licht verbeterd** |
| Server total (run 2–3) | **Verbeterd** | **Verbeterd** | **Verbeterd** (trust warm) |
| Trust (warm) | **Verbeterd** | **Verbeterd** | **Gelijk** (~0–83 ms) |
| Prisma query count | **Gelijk** (7) | **Gelijk** | **Gelijk** |
| `feedFetches` / `geoFeedMounts` | 1 / 1 (guards) | — | — |

**Let op:** lokale `next start` heeft andere serverless-cold-start dan Vercel preview. Runs 2–3 tonen vooral **trust-cache warmte** (hits 4→8). Run 1 ≈ cold trust path.

---

## 3. Sub-bucket observaties

| Bucket | Phase 10 run 1 | Phase 3D preview run 1 | Trend |
|--------|----------------|------------------------|-------|
| Product | 515 ms | 1297 ms | Verbeterd (lokaal; index/query pad) |
| Dish | 539 ms | 1326 ms | Verbeterd lokaal; preview dish-index actief op Neon |
| Trust | 434 ms (341 ms enriched) | 1207 ms | Verbeterd; cache hits in run 2–3 |
| Stats | deferred (niet op critical path) | deferred | Gelijk (Phase 3B) |

---

## 4. Client / shell (instrumentatie)

Statische guards bevestigen:

- `feedFetches = 1` — `lib/feed/feed-performance-baseline.ts` + GeoFeed in-flight dedup
- `geoFeedMounts = 1` — `validate-homepage-performance` (4.5)
- Geen extra fetch bij desktop layout switch — `validate-feed-desktop-layout-phase3d`

Client `clientMs` / `shell-to-usable` / `first tile` vereisen browser + `NEXT_PUBLIC_FEED_PERF_BASELINE=1` op preview (SSO). Niet geautomatiseerd in deze audit.

---

## 5. Betrouwbaarheid per run

| Run | Betrouwbaarheid |
|-----|-----------------|
| 1 | Betrouwbaar — cold trust (0 cache hits) |
| 2 | Betrouwbaar — warm trust |
| 3 | Betrouwbaar — warm trust, dish iets hoger (variance) |

Geen runs als **onbetrouwbaar** geclassificeerd.

---

## 6. Conclusie

| Oordeel | Detail |
|---------|--------|
| **Verbeterd** | Server total vs oorspronkelijke 6–8 s baseline en vs Phase 3C |
| **Gelijk / verbeterd** | vs Phase 3D preview band (2,8–4,7 s) afhankelijk van cache-warmte |
| **Geen verslechtering** | Geen validator- of payload-regressie op feedpad |
| **Geen nieuwe optimalisaties** | Alleen meting en classificatie in Phase 10 |

Performance **niet merge-blocking** — trend consistent met Phase 3D doelen.
