# Phase 3D — Product Query Variatie

**Datum:** 2026-07-12  
**Branch:** `performance/phase2-baseline`

---

## 1. Query onderzocht

Bron: [app/api/feed/route.ts](app/api/feed/route.ts) (~304–389).

| Aspect | Waarde |
|--------|--------|
| **OR** | `isActive: true` **OF** inactive met `orderItems.some(Order.stripeSessionId not null)` |
| **listingIntent** | REQUEST / OFFER filter optioneel |
| **category** | optioneel |
| **q** | tekstzoek optioneel |
| **orderBy** | `createdAt desc` |
| **take** | `FEED_DB_PRODUCT_CAP` (40) |
| **select** | brede productvelden + seller.User + Image `{ sortOrder }` + Video |

National feed: OR + geen intent filter dominant.

Bestaande index: `@@index([isActive, createdAt(sort: Desc)])` op Product.

---

## 2. Metingen

### Preview (Phase 3C — cache miss, gebruiker)

| Run | ms |
|-----|-----|
| 1 | 1424 |
| 2 | 1317 |
| 3 | 756 |
| **Gem** | **1166** |
| Range | 756–1424 |

### Lokaal dev (7 runs, vereenvoudigde select, Neon)

| Run | ms |
|-----|-----|
| 1–4 | 81–83 |
| 5–6 | 85, 102 |
| 7 | 340 (outlier) |
| **p50** | **83** |
| **p95** | **340** |
| min/max | 81 / 340 |

### EXPLAIN ANALYZE — active-only subset (dev, 7 producten)

```
Limit -> Sort (createdAt DESC) -> Seq Scan on Product
  Filter: isActive
Execution Time: 0.065 ms
```

Tabel te klein voor index scan; op grotere data verwacht `Product_isActive_createdAt_idx`.

---

## 3. Oorzaak variatie (preview 756–1424 ms)

| Factor | Impact | Bewijs |
|--------|--------|--------|
| **DB page cache warm/koud** | Hoog | Run 3 (756 ms) vs run 1 (1424 ms) zelfde queryvorm |
| **OR + EXISTS subquery** | Medium | Inactive+Stripe pad triggert `orderItems` join — plan kan wisselen |
| **Neon serverless latency** | Medium | Lokaal p50 83 ms vs preview ~1166 ms |
| **Connection cold start** | Laag | 3C: geen Vercel cold-start; variatie binnen warm requests |
| **Resultaatgrootte** | Laag na 3C | Image alleen `sortOrder`; metadata apart |
| **Prepared statement** | Laag | Prisma hergebruikt; geen plan-flip gemeten lokaal |

**Geen optimalisatie toegepast** — variatie niet reproduceerbaar op dev (7 producten). OR-semantiek is business-required (inactive listings met betaalde orders).

---

## 4. Aanbevelingen (alleen bij bewezen winst)

1. **Na Dish-index:** hermeet Product p50 op preview — cache warm 3 runs.
2. Als OR-plan dominant blijft: `EXPLAIN` op preview met `Buffers` voor inactive tak.
3. Optioneel toekomstig: gedeeltelijke index `WHERE isActive` — alleen na EXPLAIN op productie-data.
4. **Niet** doen: Stripe-OR verwijderen; listingIntent index zonder dominant filter.

---

## 5. Targets

| Metriek | 3C-preview | 3D target |
|---------|------------|-----------|
| Product p50 | ~1166 ms (gem 3 runs) | < 800 ms |
| Product p95 | ~1424 ms | < 1200 ms |

Verwachte winst in 3D: vooral van Dish-index + trust-cache; Product apart valideren op preview na index.
