# Phase 3C — Before / After

**Datum:** 2026-07-12  
**Status:** lokaal · **geen commit/push/deploy**

---

## Gemeten preview baseline (3B na stats-defer)

| Bucket | Gemiddelde (3 runs) |
|--------|---------------------|
| client total | ~4900 ms |
| **server total** | **~4541 ms** |
| Product.findMany | ~1466 ms |
| Dish.findMany | ~1422 ms |
| linked media | ~558 ms |
| trust | ~1370 ms |

Doelstellingen: server p50 <3000 ms, trust <700 ms, Product/Dish <800 ms, linked <200 ms.

---

## Structurele wijzigingen (3C)

| Gebied | Wijziging | Verwachte winst |
|--------|-----------|-----------------|
| Product query | Geen Image.fileUrl bytes | −200–600 ms transfer |
| Dish query | Geen DishPhoto.url bytes | −200–500 ms transfer |
| linked media | Subset IDs + metadata SQL | −300–400 ms |
| trust | Minimal mode (−5 groupBy) | −300–500 ms |
| Desktop | Single column default | UX only |

**Geen winstclaim zonder preview hermeting na deploy.**

### Verwacht na 3C (conservatief)

| Bucket | Baseline | Verwacht |
|--------|----------|----------|
| server total | ~4541 ms | **~2800–3200 ms** |
| Product | ~1466 ms | **~600–900 ms** |
| Dish | ~1422 ms | **~600–900 ms** |
| linked media | ~558 ms | **~50–200 ms** |
| trust | ~1370 ms | **~700–900 ms** |

Dish index migratie (apart) nodig voor structureel <800 ms Dish.

---

## Client guards (behouden)

| Metriek | Status |
|---------|--------|
| feedFetches | 1 |
| geoFeedMounts | 1 |
| stats deferred | ✅ |
| cache tiers A–D | ✅ |
| media endpoint | ✅ |

---

## Validatie

| Script | Resultaat |
|--------|-----------|
| lint | pass |
| build | pass |
| smoke-check | pass |
| Phase 3A | 68/68 |
| Phase 13K | 23/23 |
| Phase 3B stats | 18/18 |
| Phase 3B cache | 26/26 |
| Phase 3B trust | 10/10 |
| Phase 3C trust | 11/11 |
| Phase 3C queries | 7/7 |
| Phase 3C legacy media | 7/7 |
| Phase 3C desktop | 10/10 |

---

## Gewijzigde bestanden

| Bestand | Rol |
|---------|-----|
| [app/api/feed/route.ts](app/api/feed/route.ts) | Metadata queries, linked subset, trust minimal |
| [lib/feed/feed-media-metadata.server.ts](lib/feed/feed-media-metadata.server.ts) | Raw SQL metadata |
| [lib/feed/resolve-feed-media-url.ts](lib/feed/resolve-feed-media-url.ts) | Metadata URL resolver |
| [lib/feed/feed-candidate-window.ts](lib/feed/feed-candidate-window.ts) | linkedDishMediaFromPhotoMetadata |
| [lib/discovery/trust/fetch-seller-trust-snapshots.ts](lib/discovery/trust/fetch-seller-trust-snapshots.ts) | Minimal + timing |
| [lib/discovery/trust/trust-snapshot-timing.ts](lib/discovery/trust/trust-snapshot-timing.ts) | Timing types |
| [lib/discovery/trust/batch-enrichment.ts](lib/discovery/trust/batch-enrichment.ts) | Report wrapper |
| [lib/feed/trust-enrichment-timing.ts](lib/feed/trust-enrichment-timing.ts) | Minimal mode |
| [lib/feed/homeDesktopFeedColumns.ts](lib/feed/homeDesktopFeedColumns.ts) | Default 1 col + migration |
| [components/feed/GeoFeed.tsx](components/feed/GeoFeed.tsx) | Desktop single column |
| `scripts/validate-feed-*-phase3c.ts` | 4 validators |
| `docs/audits/homecheff-performance-phase3c-*.md` | 6 audit docs |

---

## Resterende risico's

1. **buyerTier defaults** in minimal mode — geen tile impact; activity cards kunnen conservatiever zijn.
2. **Raw SQL metadata** — legacy sentinel moet synchroon blijven met `/api/feed/media` visibility.
3. **Dish index** — zonder migratie blijft Dish >800 ms mogelijk op grote datasets.
4. **Hermeting** — preview met `FEED_PERF_TIMING=1` vereist voor exacte cijfers.

---

## Git

**Geen commit. Geen push. Geen deployment. Geen migraties. Geen Render-wijzigingen.**
