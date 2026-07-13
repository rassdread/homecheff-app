# Phase 3E+ — Before / After

**Datum:** 2026-07-13  
**Baseline commit:** `2c91ef1` (Phase 3E, gepusht)  
**3E+ status:** lokaal op branch, **niet gecommit/gepusht**

---

## Referentie — Phase 3E Vercel preview (handmatig, warm runs 2–5)

| Metriek | p50 |
|---------|-----|
| **Server** | **3234 ms** |
| **Client** | **3557 ms** |
| Product (`dbProductMs`) | 1292 ms |
| Dish (`dbDishMs`) | 1205 ms |
| Trust | 279 ms |
| Query count | 8 |

**15%-drempel server:** ≤ **2749 ms** (voor commit/push toegestaan)

---

## Phase 3E+ — Lokaal prod-mode probe

**Setup:** `npm run build` → `FEED_PERF_TIMING=1 NODE_ENV=production PORT=3099 npx next start`  
**URL:** `/api/feed?scope=national&radius=0&take=10&perfProbe=1&perfBust=*`  
**DB:** Neon (zelfde als dev)

### Alle runs

| Run | clientMs | serverMs | Product | Dish | Trust | prismaQ | bytes |
|-----|----------|----------|---------|------|-------|---------|-------|
| 1 cold | 1541 | 1403 | 681 | 485 | 449 | 13 | 44729 |
| 2 warm | 813 | 805 | 441 | 509 | 81 | 13 | 40790 |
| 3 warm | 724 | 714 | 380 | 416 | 82 | 13 | 40790 |
| 4 warm | 934 | 925 | 632 | 644 | 88 | 13 | 40792 |
| 5 warm | 969 | 957 | 767 | 684 | 83 | 13 | 40790 |

### Warm p50 (runs 2–5)

| Metriek | 3E Vercel | 3E+ lokaal | Δ |
|---------|-----------|------------|---|
| **Server** | 3234 ms | **865 ms** | **−73%** |
| **Client** | 3557 ms | **873 ms** | **−75%** |
| Product | 1292 ms | **537 ms** | **−58%** |
| Dish | 1205 ms | **577 ms** | **−52%** |
| Trust | 279 ms | **83 ms** | **−70%** |
| Query count | 8 | **13** | +5 |
| Prisma total p50 | n.v.t. | **~1460 ms** | — |
| Response bytes | n.v.t. | **~40800** | — |

### Nieuwe sub-fasen (warm voorbeeld)

| Counter | ms |
|---------|-----|
| `dbProductIdsMs` | 148 |
| `dbProductHydrateMs` | 325 |
| `sellerHydrateMs` | 43 |
| `dbDishUserHydrateMs` | 553 |
| `productMetadataMs` | 42 |
| `dishMetadataMs` | 600 |

---

## Query graph (13 queries, 3E+ route)

```text
1–2.  product.findMany (active IDs)     } parallel ID-fase
      product.findMany (inactive+paid IDs)}
3.    listing.findMany                    } parallel met ID-fase start
4.    product.findMany (body IN ids)      } hydrate-fase
5.    sellerProfile.findMany (IN sellers) } seller batch
6.    dish.findMany (minimal IDs)         } dish ID-fase
7.    user.findMany (IN dish userIds)     } parallel dish hydrate
8.    dishPhoto.findMany (IN dishIds)
9.    dishVideo.findMany (IN dishIds)     ← slowest (apart gemeten via prisma.slowestKey)
10.   product image metadata SQL
11.   dish photo metadata SQL (donors)
12.   dish photo metadata SQL (published)
13.   dish.findMany (linked donor videos) — alleen als linkedIdsNeedingDonor.length > 0
```

Trust/discovery/stats queries lopen **buiten** bovenstaande Prisma feed-db batch (niet in `queryCount` van 13).

**Geen N+1:** geen per-item findUnique; alle hydration via `IN (...)`.

---

### Product p50

| Strategie | ms |
|-----------|-----|
| split_or (3E) | 237 |
| ids_first (3E+) | 334 |

### Dish p50

| Strategie | ms |
|-----------|-----|
| trimmed_user (3E) | 758 |
| ids_first (3E+) | **501** |

---

## Response compactheid (DEEL 6)

| Observatie | Status |
|------------|--------|
| Dubbele seller in JSON | Geen — één seller per tile |
| Dubbele trust blocks | Geen regressie |
| Dubbele discovery | Ongewijzigd |
| Payload ~40 KB (10 items) | Geen compacting toegepast (contract-first) |

**Geen response-compactie uitgevoerd** — alleen gemeten.

---

## Vergelijking classificatie

| Oordeel | Status |
|---------|--------|
| Lokaal ≥15% vs 3E Vercel server | **JA** (−73%) |
| Vercel preview ≥15% vs 3E | **NIET GEMETEN** (geen deploy zonder commit) |
| Functionele regressie | **NEE** (validators 100%) |
| Query-count regressie | **Meer queries, minder wall-clock** |

---

## Omgevingscaveat

Lokaal prod-mode mist Vercel edge RTT, function cold start variance en SSO-preview auth. **Definitieve GO-meting vereist Vercel preview na push** met dezelfde handmatige `perfProbe=1` browserflow als 3E.

---

## Validators (DEEL 8)

| Script | Resultaat |
|--------|-----------|
| `npm run lint` | ✅ |
| `npm run build` | ✅ |
| `npm run smoke-check` | ✅ |
| `npx prisma validate` | ✅ |
| `validate-feed-phase3ep-ids-first-parity` | 7/7 ✅ |
| `validate-feed-product-query-parity-phase3e` | ✅ |
| `validate-feed-dish-query-parity-phase3e` | ✅ |
| `validate-feed-phase3e-query-fixtures` | 31/31 ✅ |
| `validate-feed-phase3e-contract` | 8/8 ✅ |
| `validate-feed-perf-probe-gating-phase3e` | 10/10 ✅ |
