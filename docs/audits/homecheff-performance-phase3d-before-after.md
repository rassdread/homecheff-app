# Phase 3D — Before / After

**Datum:** 2026-07-12  
**Branch:** `performance/phase2-baseline`  
**Status:** code + schema voorstel lokaal; **geen commit/push/deploy/productiemigratie**

---

## Baseline (Phase 3C preview — 3 cache-miss runs)

| Metriek | Run 1 | Run 2 | Run 3 | **Gem** |
|---------|-------|-------|-------|---------|
| Server total | 4471 | 4164 | 3670 | **4102** |
| Product.findMany | 1424 | 1317 | 756 | **1166** |
| Dish.findMany | 1431 | 1331 | 1509 | **1424** |
| Trust | 1133 | 1131 | 1026 | **1097** |
| Linked media | 0 | 0 | 0 | **0** |
| Outside route | ~358 | ~358 | ~358 | **~358** |

---

## Phase 3D wijzigingen

| Onderdeel | Wijziging | Verwachte impact |
|-----------|-----------|------------------|
| **Dish index** | `@@index([status, createdAt(sort: Desc)])` in schema + CONCURRENTLY SQL | Dish p50 **< 700 ms** op preview na migratie |
| **Trust cache** | Bounded 60s TTL module cache per seller | Warm trust **< 50 ms**; cold ~1097 ms |
| **Trust timing** | `cacheStats` in `debug.perf.trustTiming` | Observability |
| **Product** | Geen code-wijziging | Variatie onderzocht; hermeting na Dish-index |
| **Desktop layout** | Geen wijziging (3C default bevestigd) | Geen feedfetch-impact |

---

## Lokaal gemeten (dev Neon — kleine dataset)

| Metriek | Vóór 3D code | Na 3D (trust cache warm) |
|---------|--------------|---------------------------|
| Trust 4 sellers | 504 ms cold | **0 ms** warm |
| Dish Prisma p50 | ~592 ms | ongewijzigd (index niet gemigreerd) |
| Product Prisma p50 | 83 ms | ongewijzigd |

*Dev niet vergelijkbaar met preview — tabelgrootte 22 dishes / 7 products.*

---

## Targets (preview na volledige 3D rollout)

| Metriek | 3C gem | 3D target |
|---------|--------|-----------|
| Server total p50 | 4102 | **< 3000** |
| Dish.findMany | 1424 | **< 700** |
| Product p50 | 1166 | **< 800** |
| Trust | 1097 | **< 600–700** (warm cache + bestaande minimal mode) |

---

## Gewijzigde bestanden

| Bestand | Wijziging |
|---------|-----------|
| [lib/discovery/trust/trust-snapshot-cache.ts](lib/discovery/trust/trust-snapshot-cache.ts) | **Nieuw** — bounded TTL cache |
| [lib/discovery/trust/batch-enrichment.ts](lib/discovery/trust/batch-enrichment.ts) | `useCache`, `cacheStats` |
| [lib/feed/trust-enrichment-timing.ts](lib/feed/trust-enrichment-timing.ts) | `cacheStats` in timing |
| [prisma/schema.prisma](prisma/schema.prisma) | Dish `(status, createdAt)` index voorstel |
| [scripts/validate-feed-queries-phase3c.ts](scripts/validate-feed-queries-phase3c.ts) | Index check → phase3d |
| `scripts/validate-feed-*-phase3d.ts` | **Nieuw** — 5 validators |
| `docs/audits/homecheff-performance-phase3d-*.md` | **Nieuw** — audit set |
| `docs/audits/homecheff-performance-phase3d-migrations/*.sql` | **Nieuw** — CONCURRENTLY SQL |

---

## Regressiebehoud (Phase 3D)

- ✅ Cache tiers A–D  
- ✅ Deferred stats (`POST /api/feed/stats-preview`)  
- ✅ Single feedfetch / geoFeedMounts  
- ✅ Legacy media endpoint + security  
- ✅ Product/Dish dedup  
- ✅ Raw SQL metadata `text[]`  
- ✅ Minimal trust mode  
- ✅ Feed response contract + Server-Timing  

---

## Go/no-go

| Item | Besluit |
|------|---------|
| Code naar preview | **GO** — trust cache + observability; geen DB-migratie in code deploy |
| Index op preview DB | **GO** — na review CONCURRENTLY SQL |
| Index op productie | **GO** na preview Dish < 700 ms; anders HOLD |

---

## Niet uitgevoerd

- ❌ Git commit / push  
- ❌ Vercel deploy  
- ❌ `prisma migrate` op preview/productie  
- ❌ Render-wijzigingen  
