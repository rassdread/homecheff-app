# HomeCheff Performance Phase 2 — Instrumentation

**Datum:** 2026-07-12  
**Scope:** Opt-in meetinstrumentatie. Geen structurele optimalisaties.

---

## 1. Bestaande instrumentatie (Phase 1 / 13K)

| Instrument | Bestand | Flag | Bruikbaar? |
|------------|---------|------|------------|
| Feed server timing | `lib/feed/feed-api-timing.ts` | `FEED_PERF_TIMING=1` | ✅ Uitgebreid in Phase 2 |
| Client feed baseline | `lib/feed/feed-performance-baseline.ts` | `NEXT_PUBLIC_FEED_PERF_BASELINE=1` | ✅ Uitgebreid in Phase 2 |
| Feed route wiring | `app/api/feed/route.ts` | `FEED_PERF_TIMING=1` | ✅ Server-Timing + debug.perf |
| GeoFeed marks | `components/feed/GeoFeed.tsx` | client flag | ✅ Uitgebreid |
| HomePageClient marks | `components/home/HomePageClient.tsx` | client flag | ✅ |
| PerformanceMonitor | `components/PerformanceMonitor.tsx` | `NEXT_PUBLIC_APP_DIAG=1` | ✅ LCP/FID/CLS (apart kanaal) |
| Phase 13K validator | [validate-feed-performance-baseline-phase13k.ts](../../scripts/validate-feed-performance-baseline-phase13k.ts) | — | ✅ Static guards |
| Vercel Analytics | `ConsentAwareAnalytics` | consent + prod | ✅ Niet voor feed breakdown |
| OpenTelemetry | — | — | ❌ Niet aanwezig |
| `instrumentation.ts` | — | — | ❌ Niet aanwezig |
| Middleware timing | `middleware.ts` | — | ❌ Niet geïmplementeerd |
| Prisma global query log | `lib/prisma.ts` | — | ❌ Alleen error/warn log |
| React Profiler | — | — | ❌ Niet ingebouwd |
| Android native timing | Capacitor splash config | — | ⚠️ Alleen splash duur in config |

**Conclusie:** Hergebruik Phase 13K-patronen; geen parallel meetsysteem toegevoegd.

---

## 2. Nieuwe / uitgebreide server-instrumentatie

### Feature flags

| Flag | Scope | Effect |
|------|-------|--------|
| `FEED_PERF_TIMING=1` | Server | Feed API timing + Server-Timing + `debug.perf` |
| `PRISMA_PERF_TIMING=1` | Server | Prisma query teller (alleen binnen `runWithPrismaPerfContext`) |

`FEED_PERF_TIMING=1` activeert ook Prisma-extensie (via `isPrismaPerfEnabled()`).

### `/api/feed` Server-Timing buckets

| Bucket | Fase |
|--------|------|
| `auth` | params → session |
| `geo` | session → viewer geo |
| `feed-db` | geo → db parallel |
| `transform` | db → transform |
| `stats` | transform → stats enrichment |
| `trust` | stats → trust/DNA |
| `discovery` | trust → discovery |
| `mapping` | discovery → response mapped |
| `serialize` | mapped → serialize |
| `prisma` | Totale Prisma-tijd (extensie) |
| `prisma-count` | Query-aantal (desc) |
| `total` | End-to-end |

### Prisma per-request attributie

**Bestand:** `lib/performance/prisma-perf-context.server.ts` + `lib/performance/perf-prisma.server.ts`

- `AsyncLocalStorage` + Prisma `$extends` — **alleen server-only** (niet via `lib/prisma.ts`)
- Feed route gebruikt `getPerfPrisma()` binnen `runWithPrismaPerfContext()`

**Beperking:** Queries buiten feed-handler (bijv. in gedeelde lib zonder context) worden niet geteld. Geen global productie-logging.

---

## 3. Client-instrumentatie (Phase 2)

### Feature flag

`NEXT_PUBLIC_FEED_PERF_BASELINE=1`

### Nieuwe milestones

| Milestone | Betekenis |
|-----------|-----------|
| `feed:blocked-start/end` | Session/bootstrap gate |
| `cache:restore-start/end` | Return cache peek |
| `location:init-start` | Locatie-init begint |
| `feed:request-end` | Fetch afgerond |
| `vitals:fcp/lcp/dom-content-loaded/load` | Web Vitals |
| `pusher:init` | Pusher client aangemaakt |
| `sw:ready/sw:none` | Service worker status |
| `app:usable` | Feed stable |

### `performance.measure()` paren

- `session`, `feed-blocked`, `feed-fetch`, `first-tile`, `cache-restore`, `shell-to-usable`

### Duplicate request detector

**Bestand:** `lib/performance/duplicate-request-detector.ts`

Observeert `fetch` voor:

- `/api/feed`
- `/api/profile/me`
- `/api/auth/session`
- `/api/inspiratie`
- `/api/marketplace/pending-accepted-values`
- `/api/user/me`
- `/api/i18n/*`
- `/api/home/community-pulse`

Rapporteert via `getDuplicateRequestReport()` en debug panel.

### Debug UI

**Bestand:** `components/performance/FeedPerfDebugPanel.tsx`

- Alleen zichtbaar met `NEXT_PUBLIC_FEED_PERF_BASELINE=1`
- Geen console-spam in productie (alleen `[HC-PERF]` via `feedPerfLogcat` bij baseline flag)

### Logcat (Capacitor)

`feedPerfLogcat()` → `console.info('[HC-PERF] ...')` — zichtbaar in Chrome remote debugging / Logcat.

---

## 4. CLI meetscript

**Bestand:** [Startup meettool](../../scripts/performance/measure-homecheff-startup.mjs)

```bash
npm run perf:startup -- --help
npm run perf:startup:cold -- --base-url=http://127.0.0.1:3000
npm run perf:startup:warm -- --base-url=https://<preview-url>
```

Meet: homepage + `/api/feed` TTFB, total, bytes, Server-Timing, status.

**Beperking:** HTTP cold ≠ Vercel function cold start.

---

## 5. Bundle-analyse

```bash
ANALYZE=true npm run build
# of
npm run analyze
```

- `@next/bundle-analyzer` — alleen actief met `ANALYZE=true`
- Normale build ongewijzigd zonder flag

---

## 6. Gewijzigde bestanden (Phase 2)

| Bestand | Wijziging |
|---------|-----------|
| `lib/feed/feed-api-timing.ts` | Server-Timing buckets + Prisma snapshot |
| `lib/feed/feed-performance-baseline.ts` | Vitals, measures, logcat, blocked marks |
| `lib/performance/prisma-perf-context.server.ts` | **Nieuw** (server-only) |
| `lib/performance/perf-prisma.server.ts` | **Nieuw** (feed-only Prisma accessor) |
| `lib/performance/prisma-perf-types.ts` | **Nieuw** (shared types) |
| `lib/performance/duplicate-request-detector.ts` | **Nieuw** |
| `lib/performance/install-client-baseline.ts` | **Nieuw** |
| `lib/prisma.ts` | Ongewijzigd singleton (geen perf-extensie) |
| `app/api/feed/route.ts` | Prisma context + categorieën + serialize mark |
| `components/Providers.tsx` | Baseline install + debug panel |
| `components/performance/*.tsx` | **Nieuw** |
| `components/feed/GeoFeed.tsx` | Extra marks |
| `lib/pusher.ts` | Pusher init mark |
| [Startup meettool](../../scripts/performance/measure-homecheff-startup.mjs) | **Nieuw** |
| `next.config.mjs` | Bundle analyzer wrapper |
| `package.json` | Scripts + devDependency |

---

## 7. Productie-gedrag zonder flags

| Check | Status |
|-------|--------|
| Server-Timing header | ❌ Niet gezet |
| `debug.perf` in feed response | ❌ Niet gezet |
| Prisma extensie overhead | ❌ Niet geladen |
| Fetch interceptor | ❌ Niet geïnstalleerd |
| Debug panel | ❌ Niet zichtbaar |
| `[HC-PERF]` logcat | ❌ Niet geëmitteerd |
| Response body structuur | ✅ Ongewijzigd |

---

## 8. Niet betrouwbaar meetbaar (documented limitations)

| Onderdeel | Reden |
|-----------|-------|
| Exacte Vercel cold start | Vereist Vercel dashboard / prod flag window |
| Per-query Prisma op shared lib calls | Geen ALS context buiten feed handler |
| Hydration start exact | React geen publieke hook — proxy via shell/viewport marks |
| INP in baseline | Vereist interactie of CrUX |
| Service worker impact | SW niet geregistreerd in app |
| Initiator per fetch | Stack parsing — bij benadering |

---

## Acceptatiecriteria Phase 2 instrumentation

- [x] Feed Server-Timing opt-in
- [x] Prisma query teller opt-in (feed route)
- [x] Client marks + measures opt-in
- [x] Duplicate request detectie opt-in
- [x] Cold/warm script
- [x] Bundle analyzer opt-in
- [x] Geen structurele optimalisatie
- [x] Geen env/deployment wijzigingen
