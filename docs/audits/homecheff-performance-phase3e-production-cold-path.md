# Phase 3E — Production Cold Path Optimization

**Datum:** 2026-07-13  
**Branch:** `performance/phase3e-production-cold-path` (van `main`)  
**Status:** geïmplementeerd lokaal — **geen commit/push/deploy/DB-migratie**

---

## Doel

Productiefeed van ~3,4 s warm / ~4,8 s cold (user baseline) richting:

| Metriek | Target |
|---------|--------|
| Warm p50 | < 2000 ms |
| Cold p50 | < 3000 ms |
| Ideal warm | 1200–1600 ms |

---

## Productiebaseline (homecheff.eu, huidige deploy vóór 3E)

| Run | clientMs | serverMs (debug.perf) | Product | Dish | Trust | Prisma |
|-----|----------|----------------------|---------|------|-------|--------|
| 1 (cold) | 6211 | 5771 | 1866 | 1410 | 1533 | 5337 |
| 2 (warm) | 3181 | 2998 | 1204 | 949 | 370 | 3178 |
| 3 (warm) | 3238 | 3066 | 1328 | 973 | 379 | 3140 |

**Warm gemiddelde:** ~3210 ms client / ~3032 ms server  
**vs oorspronkelijk ~7–8 s:** ~50–55% sneller (bevestigd)

---

## Bottleneckverdeling (productie warm)

| Stap | ms | % van server ~3000 |
|------|-----|-------------------|
| Product.findMany | 1204–1328 | ~40% |
| Dish.findMany | 949–973 | ~32% |
| Trust (warm) | 370–379 | ~12% |
| Overig (listing, metadata, transform, discovery, serialize) | ~400 | ~16% |

**Hoofdoorzaak:** Neon roundtrip + relationele Prisma-selects op Product en Dish, niet trust (warm) of stats (deferred).

---

## Phase 3E wijzigingen

| # | Wijziging | Bestand |
|---|-----------|---------|
| 1 | Production perf probe gating (`perfProbe=1` + `FEED_PERF_TIMING=1`) | `lib/feed/feed-perf-probe.ts`, route, cache policy |
| 2 | Product query `split_or` (parallel active + paid-inactive, merge) | `lib/feed/feed-product-query.server.ts` |
| 3 | Dish query module + `trimmed_user` select | `lib/feed/feed-dish-query.server.ts` |
| 4 | Parallel dish metadata (linked donors tijdens dish query) | `app/api/feed/route.ts` |
| 5 | Metadata timing (`productMetadataMs`, `dishMetadataMs`) | `feed-api-timing.ts`, route |
| 6 | Production probe script | `scripts/performance/probe-feed-production-phase3e.mjs` |
| 7 | Phase 3E validators | `scripts/validate-feed-*-phase3e.ts` |

---

## Verwachte winst (eerlijk)

| Optimalisatie | Lokaal | Productie verwachting |
|---------------|--------|----------------------|
| split_or Product | ~10% p50 (237→215 ms, 7 rows) | **Matig** — helpt als EXISTS-subplan zwaar is bij meer rows |
| Parallel dish metadata | Wall-clock metadata −200–400 ms op prod | **Matig** |
| Perf probe gating | 0 ms perf | **Veiligheid** — geen client overhead zonder flags |
| **Totaal 3E code** | Niet representatief (kleine DB) | **10–20% server** schatting — **onvoldoende alleen voor <2000 ms warm** |

**Region alignment** (Neon `eu-central-1` + Vercel `fra1`): al goed — grotere winst vereist query-payload reductie of CDN HIT (Tier A), niet provider-move.

---

## Targets na deploy 3E (te meten)

1. `node scripts/performance/probe-feed-production-phase3e.mjs --base-url=https://homecheff.eu --perf-probe` met `FEED_PERF_TIMING=1` tijdelijk op preview
2. 5+ runs cold/warm met `perfBust`
3. Vergelijk Product/Dish buckets vs bovenstaande baseline

---

## GO/HOLD

| Actie | Status |
|-------|--------|
| Preview commit | **GO** (na review) |
| Merge main | **HOLD** |
| Production deploy | **HOLD** |
| DB migratie | **HOLD / NIET NODIG** |

Zie `homecheff-performance-phase3e-final-go-no-go.md`.
