# Phase 3D-Final — Trust Observability, Product Diagnosis & Main Readiness

**Datum:** 2026-07-13  
**Branch:** `performance/phase2-baseline`  
**Status:** code-fix lokaal (uncommitted); geen merge/deploy/DB-wijziging in deze stap

---

## 1. Previewmeting (geldig — gebruiker)

| Run | Server | Product | Dish | Trust |
|-----|--------|---------|------|-------|
| 1 | 4315 ms | 1297 ms | 1326 ms | 1207 ms |
| 2 | 3000 ms | 1297 ms | 952 ms | 373 ms |
| 3 | 2822 ms | 1395 ms | 951 ms | 188 ms |

Observaties: `feedFetches=1`, `geoFeedMounts=1`, trust daalt sterk (cache werkt), maar `perf.trustTiming.cacheStats` was **null** in preview JSON.

---

## 2. Root cause — `cacheStats` null

### Probleem

Documentatie en meetworkflow lazen:

```text
debug.perf.trustTiming.cacheStats
```

De code plaatste `trustTiming` alleen op **`debug.trustTiming`** (sibling van `perf`), niet genest onder `debug.perf`.

`debug.perf` = alleen `apiPerf.toPayload()` (totalMs, buckets, counts, prisma) — **zonder** trustTiming.

### Fix (Phase 3D-Final)

| Bestand | Wijziging |
|---------|-----------|
| [lib/feed/trust-timing-debug.ts](lib/feed/trust-timing-debug.ts) | **Nieuw** — stabiel contract + normalisatie |
| [app/api/feed/route.ts](app/api/feed/route.ts) | `perfPayload.trustTiming = buildTrustTimingDebugPayload(...)` |
| [lib/feed/feed-api-timing.ts](lib/feed/feed-api-timing.ts) | `FeedApiTimingPayload.trustTiming` type |
| [lib/discovery/trust/trust-snapshot-cache.ts](lib/discovery/trust/trust-snapshot-cache.ts) | `expired` counter |
| [lib/feed/trust-enrichment-timing.ts](lib/feed/trust-enrichment-timing.ts) | cacheStats altijd mee bij perf-enabled fetch |

### Stabiel contract

```ts
debug.perf.trustTiming = {
  mode: 'minimal',
  totalMs: number,
  bundlesMs: number,
  sellerCount: number,
  cacheStats: {
    hits, misses, expired, entries, ttlMs,
    version, missSellerCount, evictions
  } | null,
  snapshotTiming: object | null
}
```

`debug.trustTiming` blijft **mirrored** (zelfde shape) voor backward compat.

### Lokaal geverifieerd (na rebuild)

| Run | `perf.trustTiming.cacheStats.hits` | trust totalMs |
|-----|-------------------------------------|---------------|
| 1 | 0 (4 misses) | 320 ms |
| 2 | 4 | 0 ms |
| 3 | 8 | 2 ms |

---

## 3. Product.findMany — diagnose (1,3–1,4 s op Vercel)

### Query (feed critical path)

- `OR`: `isActive=true` **of** inactive + `orderItems.some(Order.stripeSessionId not null)`
- `orderBy createdAt desc`, `take 40`
- Brede `select` + `seller.User` + `Image { sortOrder }` + `Video`
- Metadata-images via aparte raw SQL (niet in hoofdquery)

### Lokaal EXPLAIN (Neon `ep-summer-darkness`, 7 producten)

| Plan | SQL execution |
|------|---------------|
| Active-only | Seq Scan + Sort (~0,06 ms) |
| Feed OR | Seq Scan + Sort + hashed SubPlan (never executed bij 0 inactive) | ~0,07 ms |

Index `Product_isActive_createdAt_idx` **bestaat**.

### Prisma wall-clock lokaal (5 runs, volledige select)

p50 **195 ms**, p95 **291 ms** — netwerk/Neon-pooler dominant.

### Oorzaak 1,3–1,4 s op Vercel (niet index-ontbrekend)

| Factor | Impact | Bewijs |
|--------|--------|--------|
| **Neon serverless RTT** | Hoog | Lokaal 195 ms vs preview 1297–1395 ms |
| **Brede select + nested seller.User** | Hoog | ~15+ kolommen + join per row |
| **Pooler cold connection** | Medium | Run 1 vaak trager |
| **OR EXISTS plan** | Laag op huidige data | 0 inactive products lokaal |
| **Page cache** | Medium | Product stabiel ~1297 ms run 1–2 |

**Geen Product-optimalisatie in deze fase** — geen bewezen plan-flip; winst vereist preview EXPLAIN op grotere dataset of select-trimming met contract-review.

### Aanbeveling post-merge (optioneel)

1. Preview EXPLAIN met `BUFFERS` op productie-achtige row count.
2. Evalueer `seller.User` select-minimalisatie (alleen feed-tile velden).
3. Overweeg prepared-statement warm-up alleen bij bewezen cold-connection winst.

---

## 4. Preview vs Production database

### Fingerprint (`.env.local` / Neon)

| | DATABASE_URL (pooler) | DIRECT_URL |
|--|----------------------|------------|
| Endpoint | `ep-summer-darkness-a2l0745u-pooler` | `ep-summer-darkness-a2l0745u` |
| Database | `neondb` | `neondb` |

### Live counts (zelfde endpoint)

| Product | Dish | User |
|---------|------|------|
| 7 | 22 | 41 |

### `homecheff.eu` feed debug (zonder FEED_PERF_TIMING)

Zelfde counts: products 7, dishes 22 → **zelfde Neon-endpoint** als lokaal/preview `.env`.

### Index status

`Dish_status_createdAt_idx` **aanwezig** op dit endpoint (Phase 3D preview-index).

### Conclusie omgeving

| Omgeving | Endpoint | Opmerking |
|----------|----------|-----------|
| Lokaal `.env.local` | `ep-summer-darkness-a2l0745u` | Dev/preview Neon branch |
| Vercel Preview (vermoed) | Zelfde* | Zelfde row counts in metingen |
| `homecheff.eu` productie-deploy | Zelfde DB* | Geen aparte prod-branch in fingerprint |

\*Vercel Preview `DATABASE_URL` niet via CLI geverifieerd (geen login); row-count match + endpoint uit lokale env is sterk bewijs.

**Risico:** DB-index op `ep-summer-darkness` geldt voor **alle** connectors (preview + homecheff.eu). Geen aparte prod-only migratie uitgevoerd in Final-fase.

---

## 5. Functionele eindcontrole

| Check | Resultaat |
|-------|-----------|
| `npm run lint` | ✅ |
| `npm run build` | ✅ |
| `npm run smoke-check` | ✅ |
| Phase 3D-Final trust debug validator | ✅ 9/9 |
| Phase 3D trust cache validator | ✅ 13/13 |
| Trust equivalence | ✅ (eerder) |
| Feed contract / cache safety | ✅ |
| `feedFetches=1` / `geoFeedMounts=1` | ✅ (preview gebruiker) |
| Trust cache wall-clock | ✅ 1207 → 373 → 188 ms |
| `perf.trustTiming.cacheStats` | ✅ fix lokaal geverifieerd |

---

## 6. GO / HOLD — merge naar `main`

| Criterium | Status | Besluit |
|-----------|--------|---------|
| Trust-cache functioneel | ✅ | GO |
| Trust observability (`perf.trustTiming`) | ✅ fix klaar, **nog niet op preview** | GO na commit+deploy |
| Dish-index | ✅ op Neon endpoint | GO |
| Server p50 < 3000 ms | ✅ run 3: 2822 ms | GO (trend) |
| Product p50 < 800 ms | ❌ 1297–1395 ms | **HOLD** voor productie-merge |
| Dish p50 < 700 ms | ⚠️ 951–1326 ms | **HOLD** — index op kleine data nog seq scan; grotere dataset hermeten |
| Preview ≠ prod DB gescheiden | ⚠️ zelfde endpoint | **HOLD** voor prod-index strategie |
| Geen regressie contract/media/trust | ✅ validators | GO |

### Eindbesluit

| Actie | Besluit |
|-------|---------|
| **Commit + push naar `performance/phase2-baseline`** | **GO** — observability-fix + scripts |
| **Merge naar `main`** | **HOLD** — tot Product-bottleneck onderzocht op preview met fix-deploy + hermeting 3 runs |
| **Productie DB-index apart** | **HOLD** — endpoint is gedeeld; bewuste prod-rollout nodig |

---

## 7. Gewijzigde bestanden (uncommitted)

- `lib/feed/trust-timing-debug.ts` (nieuw)
- `app/api/feed/route.ts`
- `lib/feed/feed-api-timing.ts`
- `lib/feed/trust-enrichment-timing.ts`
- `lib/discovery/trust/trust-snapshot-cache.ts`
- `scripts/validate-feed-trust-timing-debug-phase3d-final.ts` (nieuw)
- `scripts/diagnose-feed-product-query-phase3d-final.ts` (nieuw)
- `scripts/fingerprint-database-env-phase3d-final.ts` (nieuw)
- `scripts/validate-feed-trust-cache-phase3d.ts`

---

## 8. Volgende stap (op akkoord)

1. Commit observability-fix naar `performance/phase2-baseline`.
2. Preview deploy → bevestig `debug.perf.trustTiming.cacheStats` in browser.
3. 3 cache-miss runs → Product EXPLAIN op preview Neon.
4. Daarna opnieuw GO/HOLD voor `main`.
