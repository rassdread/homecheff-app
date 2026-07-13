# Phase 3E — Request Graph

**Datum:** 2026-07-13  
**Endpoint:** `GET /api/feed?scope=national&radius=0`

---

## Before (Phase 3D op main)

```mermaid
sequenceDiagram
  participant C as Client
  participant V as Vercel /api/feed
  participant N as Neon

  C->>V: GET /api/feed
  V->>V: session + geo
  par Product + Listing
    V->>N: Product.findMany (OR single)
    V->>N: Listing.findMany
  end
  par Dish path
    V->>N: loadProductImageMetadata (raw SQL)
    V->>N: Dish.findMany
    V->>N: linked Dish.findMany (conditional)
  end
  V->>N: loadDishPhotoMetadata (ALL ids) sequential
  V->>V: transform + dedup
  V->>V: stats deferred (skip)
  V->>N: trust bundles (cache warm)
  V->>N: discovery attach
  V->>V: map + sanitize + JSON
  V->>C: 200 + items
```

---

## After (Phase 3E)

```mermaid
sequenceDiagram
  participant C as Client
  participant V as Vercel /api/feed
  participant N as Neon

  C->>V: GET /api/feed
  Note over V: perf only if perfProbe=1 + FEED_PERF_TIMING=1 (prod)
  V->>V: session + geo
  par Product + Listing
    V->>N: Product active.findMany
    V->>N: Product inactive-paid.findMany
    V->>N: Listing.findMany
  end
  Note over V: merge products by createdAt
  par Parallel block
    V->>N: loadProductImageMetadata
    V->>N: Dish.findMany (trimmed select)
    V->>N: linked Dish media (conditional)
    V->>N: loadDishPhotoMetadata(linked donors only)
  end
  V->>N: loadDishPhotoMetadata(published-only ids)
  V->>V: transform + dedup
  V->>N: trust (cache)
  V->>N: discovery
  V->>V: serialize
  V->>C: 200
```

---

## Stap-tabel (productie warm, pre-3E gemeten)

| # | Stap | Wall ms | Parallel? | Cache mogelijk? |
|---|------|---------|-----------|-----------------|
| 1 | session/auth | ~5 | — | no-store logged-in |
| 2 | geo | ~0 | — | — |
| 3 | Product.findMany | **1204** | ↔ Listing | no |
| 4 | Listing.findMany | ~200* | ↔ Product | no |
| 5 | product metadata SQL | ~150* | ↔ Dish | no |
| 6 | Dish.findMany | **949** | na product ids | no |
| 7 | linked dish media | ~100* | ↔ Dish | no |
| 8 | dish metadata SQL | ~200* | **was sequential** → 3E parallel | no |
| 9 | transform | ~5 | — | — |
| 10 | stats | **0** (deferred) | — | — |
| 11 | trust | **370** | — | in-memory warm |
| 12 | discovery | ~100* | — | — |
| 13 | serialize | ~10 | — | — |

\*Geschat uit totaal minus gemeten buckets.

---

## Parallelisatie beslissingen

| Pair | Toegestaan? | 3E actie |
|------|-------------|----------|
| Product + Listing | ✅ | Behouden |
| Product active + inactive | ✅ | **Nieuw** split_or |
| Dish + product metadata + linked | ✅ | Behouden + linked meta parallel |
| Trust + stats | stats deferred | trust na transform |
| Discovery + trust | na trust | ongewijzigd |

Geen extra `Promise.all` toegevoegd die Prisma query count explosief verhoogt.
