# Phase 3D — Main Merge Readiness Audit

**Datum:** 2026-07-13  
**Branch:** `performance/phase2-baseline` @ `1587374`  
**Base:** `origin/main` @ `8038f65`  
**Commits ahead:** 10  
**Status:** audit only — **geen merge naar main uitgevoerd**

---

## 1. Executive summary

| Oordeel | **ORANJE** — merge mogelijk met expliciete voorwaarden |
|---------|------------------------------------------------------|

**Waarom niet GROEN:** Product.findMany blijft ~1,3 s; Prisma-schema bevat Dish-index zonder migratiebestand in repo; productie `FEED_PERF_TIMING` moet vóór merge geverifieerd worden.

**Waarom niet ROOD:** Trust-cache + observability bewezen op preview; geen functionele regressies; cache tiers veilig; validators 100% pass; server warm run 2 **2993 ms** onder 3000 ms target.

---

## 2. Commit & push (observability-fix)

| Veld | Waarde |
|------|--------|
| Commit | `1587374` — `fix(performance): expose trust cache timing in feed perf payload` |
| Push | ✅ `origin/performance/phase2-baseline` |
| Working tree | Schoon (alleen untracked backup/probe/log) |

*Observability-fix reeds gecommit/gepusht; geen nieuwe commit nodig.*

### Staged bestanden in `1587374` (10)

- `lib/feed/trust-timing-debug.ts`
- `app/api/feed/route.ts`
- `lib/feed/feed-api-timing.ts`
- `lib/feed/trust-enrichment-timing.ts`
- `lib/discovery/trust/trust-snapshot-cache.ts`
- `scripts/validate-feed-trust-timing-debug-phase3d-final.ts`
- `scripts/diagnose-feed-product-query-phase3d-final.ts`
- `scripts/fingerprint-database-env-phase3d-final.ts`
- `scripts/validate-feed-trust-cache-phase3d.ts`
- `docs/audits/homecheff-performance-phase3d-final.md`

---

## 3. Commits vs main (10)

| Hash | Message | Classificatie |
|------|---------|---------------|
| `e21b8f0` | chore(performance): add phase 2 baseline instrumentation | meetinstrumentatie |
| `560ffba` | fix(performance): use Next-provided webpack instance | config fix |
| `49c4454` | perf(feed): optimize phase 3a critical path | performance |
| `0f8f21e` | fix(feed): restore linked media and prevent duplicate fetch | functioneel fix |
| `2d9ea59` | fix(feed): serve legacy inline media safely | functioneel + security |
| `f8c527f` | perf(feed): defer seller stats and secure feed caching | performance + security |
| `a44fc74` | perf(feed): optimize trust media metadata and desktop layout | performance + UX |
| `7be0e08` | fix(feed): use text[] for media metadata raw SQL | bugfix |
| `901359f` | perf(feed): phase 3d trust cache and dish index proposal | performance |
| `1587374` | fix(performance): expose trust cache timing in feed perf payload | observability |

**Diff omvang:** 96 files, +10277 / −572 lines vs `main`.

---

## 4. Wijzigingen per categorie

### 4.1 Productiefunctionaliteit

| Gebied | Bestanden | Risico |
|--------|-----------|--------|
| Feed route | `app/api/feed/route.ts` | Medium — critical path |
| Stats defer | `app/api/feed/stats-preview/route.ts`, `feed-deferred-stats-preview.ts` | Low — async POST |
| Media endpoint | `app/api/feed/media/route.ts`, `feed-media-access.server.ts` | Medium — security gated |
| Raw SQL metadata | `feed-media-metadata.server.ts` | Medium — `text[]` fix |
| Trust cache | `trust-snapshot-cache.ts`, `batch-enrichment.ts` | Low — bounded TTL |
| Cache policy | `feed-cache-policy.ts` | Medium — tier A–D |
| Desktop layout | `homeDesktopFeedColumns.ts`, `GeoFeed.tsx` | Low — default 1 col |
| Linked dedup | feed route + `feed-candidate-window.ts` | Low — contract tested |

### 4.2 Performanceverbetering

- 3A: enrichment pool, parallel queries, trust batch
- 3B: stats uit critical path, cache tiers, Server-Timing
- 3C: metadata SQL, minimal trust, linked media subset, desktop
- 3D: trust snapshot cache, Dish-index schema + handmatige DB-index

### 4.3 Meetinstrumentatie (opt-in)

| Component | Flag | Default prod |
|-----------|------|--------------|
| Server feed timing | `FEED_PERF_TIMING=1` | **uit** |
| Client baseline | `NEXT_PUBLIC_FEED_PERF_BASELINE=1` | **uit** (webpack alias noop) |
| Prisma perf | `PRISMA_PERF_TIMING=1` | **uit** |
| Debug panel | `FeedPerfDebugPanel` | alleen baseline flag |
| `debug.perf` JSON | feed route | alleen dev of `FEED_PERF_TIMING=1` |

**Actie vóór merge:** controleer Vercel **Production** env — `FEED_PERF_TIMING` en `NEXT_PUBLIC_FEED_PERF_BASELINE` moeten **niet** gezet zijn. *(Eerdere probe `homecheff.eu` toonde `debug` in response — verifieer productie-env.)*

### 4.4 Documentatie

- 30+ audit docs in `docs/audits/homecheff-performance-*`
- Geen productiegedragswijziging

### 4.5 Database

| Item | main | branch | Live Neon |
|------|------|--------|-----------|
| `@@index([status, createdAt])` Dish | ❌ | ✅ schema | ✅ `Dish_status_createdAt_idx` |
| Prisma migratiebestand | — | ❌ niet in `prisma/migrations/` | index handmatig CONCURRENTLY |
| Nieuwe endpoints schema | — | geen | — |

---

## 5. Instrumentatiebeleid voor main

### Mag mee naar main ✅

- `lib/feed/feed-api-timing.ts` — gated
- `lib/performance/prisma-perf-context.server.ts` — gated
- `lib/feed/feed-performance-baseline.ts` — client gated + noop webpack
- Alle `scripts/validate-feed-*` validators
- Audit documentatie

### Mag niet lekken naar productiegedrag ❌

- `debug.perf` / `debug.trustTiming` zonder flag
- `Server-Timing` header zonder flag (tier D `perfBust` ok voor tests)
- Console logs in trust-cache (geen toegevoegd)
- Publieke PII in cacheStats (alleen counts)

### Validators bevestigen

- `validate-feed-cache-safety-phase3b.ts` — tier A–D ✅
- `validate-feed-performance-baseline-phase13k.ts` — env gates ✅
- `next.config.mjs` — noop alias zonder `NEXT_PUBLIC_FEED_PERF_BASELINE` ✅

---

## 6. Database-index & schema-drift

### Huidige staat

1. **Live DB** (`ep-summer-darkness-a2l0745u`): index `Dish_status_createdAt_idx` **bestaat** (handmatig Phase 3D).
2. **Branch schema**: `@@index([status, createdAt(sort: Desc)])` op Dish.
3. **main schema**: alleen `@@index([userId])` op Dish.
4. **Repo migrations**: geen `Dish_status_createdAt` migratie.

### Risico bij naïeve merge + `prisma migrate deploy`

- Op **bestaande** DB: nieuwe migratie met `CREATE INDEX` → **fout** (duplicate).
- Op **verse** DB: index ontbreekt → feed traag tot handmatige fix.

### Aanbevolen baseline-migratie (vóór of direct na merge)

```bash
# 1. Maak migratie op branch (na merge prep):
npx prisma migrate dev --create-only --name dish_status_created_at_feed_index_baseline
```

Vervang gegenereerde SQL door:

```sql
-- Index may already exist (manual CONCURRENTLY on preview Neon 2026-07-12)
CREATE INDEX IF NOT EXISTS "Dish_status_createdAt_idx"
  ON "Dish" ("status", "createdAt" DESC);
```

```bash
# 2. Markeer als applied op omgevingen waar index al bestaat:
npx prisma migrate resolve --applied dish_status_created_at_feed_index_baseline
```

**Geen nieuwe DB-actie in deze audit** — alleen documentatie en merge-voorwaarde.

---

## 7. Functionele eindcontrole

| Gebied | Methode | Status |
|--------|---------|--------|
| Homepage anoniem/ingelogd | Preview gebruiker + validators | ✅ geen regressie gemeld |
| National/local/radius | Feed route scope logic | ✅ unchanged contract |
| Filters / load more | GeoFeed guards | ✅ |
| Product/dish/listing dedup | `validate-feed-contract-phase3a` 68/68 | ✅ |
| Legacy media + Blob | 3C validators + media route | ✅ |
| Stats deferred | `validate-feed-stats-defer-phase3b` 18/18 | ✅ |
| Trust cache cold/warm | Preview 3 runs + equivalence | ✅ |
| Cache tiers A–D | `validate-feed-cache-safety-phase3b` 26/26 | ✅ |
| Cross-user isolatie | Tier C/D logged-in | ✅ |
| Desktop 1 kolom | 3C/3D layout validators | ✅ |
| Mobiel/tablet | GeoFeed grid unchanged | ✅ |
| Auth / payments | Geen wijzigingen in checkout/stripe routes | ✅ onaangeraakt |
| feedFetches=1 / geoFeedMounts=1 | Preview + client guards | ✅ |

**Handmatig nog op productie na merge:** checkout testkaart, upload, inloggen.

---

## 8. Validatie (2026-07-13)

| Check | Resultaat |
|-------|-----------|
| `npm run lint` | ✅ |
| `npm run build` | ✅ |
| `npm run smoke-check` | ✅ |
| Phase 13K | ✅ |
| Phase 3A | ✅ 68/68 |
| Phase 3B (3×) | ✅ |
| Phase 3C (7×) | ✅ |
| Phase 3D (5×) + Final | ✅ |

---

## 9. Performancewinst sinds baseline

| Metriek | Phase 2/3C baseline | 3D-Final preview (warm) | Δ |
|---------|---------------------|-------------------------|---|
| Server total | ~4541–4102 ms | **2993–3357 ms** (run 2 **2993**) | **−26% tot −34%** |
| Trust | ~1097–1370 ms | **188–372 ms** warm | **−74%** |
| Product | ~1166–1466 ms | **~1299 ms** | ~stabiel / geen winst |
| Dish | ~1424 ms | **941–1495 ms** | variabel |

Zie [homecheff-performance-phase3d-final-before-after.md](homecheff-performance-phase3d-final-before-after.md).

---

## 10. GO / HOLD — merge naar main

### Oordeel: **ORANJE**

| Criterium | Status |
|-----------|--------|
| Trust-cache functioneel | ✅ GO |
| Observability contract | ✅ GO |
| Geen preview-regressies | ✅ GO |
| Product bottleneck | ❌ HOLD voor performance-doelen — **niet blokkerend voor merge** |
| Schema/migratie drift Dish-index | ⚠️ voorwaarde |
| Prod instrumentation leak | ⚠️ verifieer env |

### Voorwaarden vóór merge

1. **Baseline-migratie** voor `Dish_status_createdAt_idx` met `IF NOT EXISTS` + `migrate resolve` op bestaande DB.
2. **Vercel Production env:** bevestig `FEED_PERF_TIMING` en `NEXT_PUBLIC_FEED_PERF_BASELINE` **uit**.
3. **Phase 3E** gepland voor Product-query (zie handoff doc) — geen merge-blocker maar expliciet geaccepteerd restrisico.

---

## 11. Exact mergeplan (niet uitgevoerd)

```bash
# Voorbereiding (op performance/phase2-baseline)
# 1. Baseline migratie toevoegen + resolve op Neon (zie §6)
# 2. Vercel prod env check

git checkout main
git pull origin main
git merge --no-ff performance/phase2-baseline -m "perf(feed): merge phase 2–3D feed performance work"

npm run lint
npm run build
npm run smoke-check
# alle validate-feed-* scripts

git push origin main
# Geen Vercel --prod in deze stap tenzij expliciet gevraagd (BCPD)
```

---

## 12. Bevestigingen

| Actie | Uitgevoerd? |
|-------|-------------|
| Merge naar main | ❌ **NEE** |
| Databasewijziging | ❌ **NEE** |
| Render-wijziging | ❌ **NEE** |
| Productiedeployment | ❌ **NEE** |
| Nieuwe performance-optimalisatie | ❌ **NEE** |

---

## 13. Gerelateerde documenten

- [homecheff-performance-phase3d-final-before-after.md](homecheff-performance-phase3d-final-before-after.md)
- [homecheff-performance-phase3e-product-query-handoff.md](homecheff-performance-phase3e-product-query-handoff.md)
- [homecheff-performance-phase3d-final.md](homecheff-performance-phase3d-final.md)
- [homecheff-performance-phase3d-migrations/20260712_dish_status_created_at_index.sql](homecheff-performance-phase3d-migrations/20260712_dish_status_created_at_index.sql)
