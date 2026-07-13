# Phase 3E — Before / After

**Datum:** 2026-07-13

---

## Productiebaseline (homecheff.eu — huidige deploy, user + probe 3E)

| Run | clientMs | serverMs | Product | Dish | Trust | bytes |
|-----|----------|----------|---------|------|-------|-------|
| 1 | 6211 | 5771 | 1866 | 1410 | 1533 | 44637 |
| 2 | 3181 | 2998 | 1204 | 949 | 370 | 40674 |
| 3 | 3238 | 3066 | 1328 | 973 | 379 | 40674 |

**Warm avg client:** ~3210 ms  
**vs ~7000–8000 ms oorspronkelijk:** **~50–55% sneller**

---

## Lokaal na 3E code (prod-build, perfProbe=1, kleine DB)

| Run | serverMs | Product | Dish | prodMeta | dishMeta | Trust |
|-----|----------|---------|------|----------|----------|-------|
| 1 | 1835 | 686 | 480 | 46 | 522 | 401 |
| 2 | 1310 | 679 | 443 | 39 | 483 | 88 |
| 3 | 934 | 334 | 472 | 21 | 514 | 41 |

**Niet vergelijkbaar 1:1 met productie** (7 products / 22 dishes vs volledige productiedataset + serverless cold).

---

## Verwachte productie-impact 3E (schatting, te verifiëren op preview)

| Metriek | Before warm | After (schatting) | Classificatie |
|---------|-------------|-------------------|---------------|
| serverMs | ~3030 | **2400–2700** | Verbeterd (matig) |
| Product | ~1260 | **1000–1150** | Verbeterd |
| Dish | ~960 | **750–850** | Verbeterd |
| dish metadata wall | sequential | overlapped | Verbeterd |
| debug zonder flags | exposed* | **hidden** | Veiliger |

\*Huidige productie heeft `FEED_PERF_TIMING=1` zonder probe-gate (pre-3E).

---

## Targets

| Target | Before warm | 3E verwacht | Gap |
|--------|-------------|-------------|-----|
| < 2000 ms warm | ❌ ~3210 | Mogelijk ❌ ~2500 | Nog ~500 ms — vereist 3E+ of CDN |
| < 3000 ms cold | ❌ ~4759 user / ~6211 probe | Mogelijk ✅ ~3500 | Depends cold start |

**Geen winstclaim zonder post-deploy production preview met `perfProbe=1`.**

---

## Response bytes

| Context | bytes |
|---------|-------|
| Productie cold | 44637 |
| Productie warm | 40674 |
| 3E lokaal | ~40000 (10 items) |

Geen responsevelden verwijderd in 3E. Compactie niet uitgevoerd (consumer audit vereist).

---

## Frontend critical path (bestaand instrumentatie)

| Mark | Bron | 3E wijziging |
|------|------|--------------|
| feedFetches=1 | GeoFeed in-flight dedup | Geen |
| geoFeedMounts=1 | baseline | Geen |
| stats deferred | Phase 3B | Geen |
| session blokkeert anonieme feed niet | national default | Geen |
| skeleton / return cache | HomePageClient | Geen |

Client `shell-to-usable` / `first tile` — meet op preview met `NEXT_PUBLIC_FEED_PERF_BASELINE=1`.
