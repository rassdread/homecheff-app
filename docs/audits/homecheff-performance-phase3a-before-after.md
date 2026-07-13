# HomeCheff Performance Phase 3A — Before / After

**Datum:** 2026-07-12  
**Dataset:** zelfde preview (ingelogd, national, eerste pagina `take=10`)  
**Flags:** `FEED_PERF_TIMING=1`, `NEXT_PUBLIC_FEED_PERF_BASELINE=1`

---

## Before (gemeten preview, pre-3A)

| Metriek | Waarde |
|---------|--------|
| **Client feed-fetch** | 7.092 ms |
| **Server total** | 6.538 ms |
| auth | 6 ms |
| geo | 0 ms |
| **feed-db** | 2.733 ms |
| transform | 2 ms |
| **stats** | 775 ms |
| **trust** | 1.520 ms |
| discovery (legacy bucket) | 1.494 ms |
| mapping | 0 ms |
| serialize | 8 ms |
| Prisma query count | 7 |
| Prisma summed duration | 7.944 ms |
| Slowest query | Dish.findMany ~2.730 ms |
| Response bytes | ~34.463 |
| Item count | 10 |
| productsDb / dishesDb | 7 / 22 |
| sellerTrustLookups | 4 |
| discovery sectionBuildMs | 1.15 ms |
| discovery dedupMs | 0.16 ms |
| Cross-source duplicate in response | ja (`fcc5ff2a-…` PRODUCT + DISH) |

---

## After (3A code — hermeting vereist)

> **Status:** lokale build + static validators geslaagd. **Geen nieuwe preview-probe** in deze sessie.  
> Vul onderstaande tabel na identieke preview-run.

| Metriek | Before | After (invullen) | Δ | Streef |
|---------|--------|------------------|---|--------|
| Server total | 6.538 ms | _pending_ | — | < 2.500 ms |
| feed-db | 2.733 ms | _pending_ | — | < 1.250 ms |
| stats | 775 ms | _pending_ | — | < 350 ms |
| trust | 1.520 ms | _pending_ | — | < 500 ms |
| discovery-attach | n/a | _pending_ | — | — |
| discovery-sections | ~1.15 ms | _pending_ | — | — |
| discovery-activity | n/a | _pending_ | — | — |
| stats-preview | ~1.3 s (hidden in discovery) | _pending_ | — | < 400 ms |
| Prisma query count | 7 | _pending_ | — | — |
| Prisma summed | 7.944 ms | _pending_ | — | — |
| Slowest query | Dish.findMany | _pending_ | — | — |
| Response bytes | ~34.463 | _pending_ | — | ~gelijk |
| Item count | 10 | _pending_ | — | 10 |
| Cross-source duplicate | ja | **verwacht nee** | — | nee |

---

## Validatie uitgevoerd (zonder live probe)

| Check | Resultaat |
|-------|-----------|
| `npm run lint` | pass |
| `npm run build` | pass |
| Phase 13K validator | 23/23 |
| Phase 3A contract validator | 19/19 |

---

## Herhaal-protocol (preview)

```bash
# Zelfde preview URL + ingelogde sessie
FEED_PERF_TIMING=1 npm run perf:startup:warm -- --base-url=https://<preview>

# Browser console
window.__hcFeedPerfReport()

# Server-Timing op /api/feed — noteer nieuwe buckets:
# discovery-attach, discovery-sections, discovery-activity, stats-preview
```

Vergelijk:

1. `debug.perf.buckets` in feed response  
2. `discovery.metrics.sectionBuildMs` / `dedupMs`  
3. `debug.crossSourceDropped` (verwacht ≥ 1 voor linked dataset)  
4. Geen dubbele `fcc5ff2a-…` in `items[]`

---

## Gewijzigde bestanden (3A)

- `lib/feed/feed-candidate-window.ts` (nieuw)
- `app/api/feed/route.ts`
- `lib/discovery/trust/fetch-seller-trust-snapshots.ts`
- `lib/stats/compute-user-public-stats.ts`
- `lib/feed/feed-api-timing.ts`
- `scripts/validate-feed-contract-phase3a.ts` (nieuw)
- `docs/audits/homecheff-performance-phase3a-feed-optimization.md` (nieuw)
- `docs/audits/homecheff-performance-phase3a-before-after.md` (dit document)

---

## Conclusie (voorlopig)

3A richt zich op **bewezen paden**:

1. Dish/product overfetch + linked-id dubbel  
2. statsPreview in discovery-bucket (~1.3 s)  
3. trust orderItem findMany scan  
4. enrichment pool groter dan nodig voor pagina 10  

**Winstclaims worden definitief na preview hermeting.**
