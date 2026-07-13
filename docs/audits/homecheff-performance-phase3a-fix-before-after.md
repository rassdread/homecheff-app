# Phase 3A-Fix — Before / After

**Datum:** 2026-07-12  
**Status:** fix lokaal toegepast, niet gecommit

---

## Functioneel

| Scenario | Vóór fix (3A preview) | Na fix (3A-Fix) |
|----------|----------------------|-----------------|
| Product met `Image[]` + linked Dish met `photos` | PRODUCT tegel, productafbeelding | Zelfde — productafbeelding leidend |
| Product zonder image + linked Dish met `photos` | **Lege tegel** (DISH uitgesloten + dedup) | **Dish-cover zichtbaar** via merge + lightweight media query |
| Beide zonder media | Geen afbeelding | Geen afbeelding |
| Standalone Dish (geen linked Product in pool) | Normaal met `photos` | Ongewijzigd |
| Stripe-gefilterd Product weg + Dish in pool | Dish als DISH-tegel | Ongewijzigd (geen linked merge nodig) |
| Twee records, zelfde titel, verschillende ids | Beide zichtbaar | Beide zichtbaar |

---

## Client fetch gedrag

| Scenario | Vóór fix | Na fix |
|----------|----------|--------|
| Homepage initial load | **2×** `/api/feed` (zelfde params) | **1×** |
| Session resolve → `apiViewerCoords` | Extra fetch (effect re-run) | Geen extra fetch |
| Filter/scope/radius wijziging | Nieuwe fetch | Nieuwe fetch |
| Load more | Aparte fetch (`skip>0`) | Aparte fetch |
| Fresh cache restore | Geen netwerk (als stale niet) | Geen netwerk + inFlight cleared |

---

## Instrumentatie (preview baseline — vóór fix)

```
geoFeedMounts: 1
feedFetches: 2
feed-fetch: 8016 ms
first-tile: 8296 ms
shell-to-usable: 9140 ms
LCP: 6511 ms
```

### Referentie vóór Phase 3A

```
geoFeedMounts: 1
feedFetches: 1
feed-fetch: 7092 ms
first-tile: 7364 ms
shell-to-usable: 8213 ms
LCP: 3844 ms
```

---

## Verwachting na fix (lokaal/preview — **opnieuw meten vereist**)

| Metriek | Verwachting | Reden |
|---------|-------------|-------|
| feedFetches | **1** | deps-fix + inFlight guard |
| feed-fetch | lager dan 8016 ms | −1 identieke round-trip |
| first-tile | lager dan 8296 ms | snellere eerste response |
| shell-to-usable | lager dan 9140 ms | idem |
| LCP | verbetering mogelijk | minder wachten op tweede fetch + images terug |
| Server `Dish` queries | 2 batches (full `notIn` + light `in`) | extra light select; nog steeds minder dan pre-3A full dish load voor linked ids |

**Geen harde ms-doelen** zonder nieuwe `FEED_PERF_TIMING=1` / preview-run.

---

## Validatieresultaten (uitgevoerd tijdens fix)

| Check | Resultaat |
|-------|-----------|
| `npm run lint` | **pass** (exit 0) |
| `npm run build` | **pass** (exit 0) |
| Phase 13K validator | **23/23 pass** (live probe skipped — geen dev server) |
| Phase 3A contract validator | **46/46 pass** (incl. 7 media-merge + 6 single-fetch guards) |
| Media-merge tests (7 scenario's) | **pass** (in 3A contract validator) |
| Single-fetch static guards | **pass** (in 3A contract validator) |

*(Resultaten ingevuld na shell-run 2026-07-12.)*

---

## Commit status

**Geen commit. Geen push.**
