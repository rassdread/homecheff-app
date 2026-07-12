# HomeCheff Performance Measurement Plan (Fase 2)

**Datum:** 2026-07-12  
**Voorafgaand aan:** infrastructuurwijzigingen of Render-migratie  
**Scope:** Meetplan alleen — geen monitoringdienst toegevoegd in Fase 1.

---

## 1. Doel

Baseline vastleggen die **cold start**, **warm start**, **database**, **API**, **client hydration** en **mobiele app-start** uit elkaar houdt — zodat optimalisaties op Vercel eerst worden beoordeeld voordat Render wordt overwogen.

---

## 2. Bestaande instrumentatie (geen nieuwe dienst)

| Instrument | Env flag | Output |
|------------|----------|--------|
| `lib/feed/feed-api-timing.ts` | `FEED_PERF_TIMING=1` | `Server-Timing` header op `/api/feed` |
| `lib/feed/feed-performance-baseline.ts` | `NEXT_PUBLIC_FEED_PERF_BASELINE=1` | `window.__hcFeedPerfReport()` |
| `components/PerformanceMonitor.tsx` | `NEXT_PUBLIC_APP_DIAG=1` | LCP, FID, CLS via `reportAppDiagnostic` |
| [validate-feed-performance-baseline-phase13k.ts](../../scripts/validate-feed-performance-baseline-phase13k.ts) | — | Static + optionele live probe |

**Fase 2:** activeer flags in preview deployments; productie alleen met tijdelijke preview of 1% diag flag.

---

## 3. Te meten metrics

### Netwerk & server

| Metric | Definitie | Tool |
|--------|-----------|------|
| DNS | Lookup tijd | Chrome DevTools, WebPageTest |
| TLS | Handshake | DevTools |
| TTFB | Time to first byte HTML + API | DevTools, `Server-Timing` |
| Cold API request | Eerste call na 5+ min idle | Vercel function logs + timing |
| Warm API request | Tweede call binnen 30s | Zelfde |
| Prisma query duration | Per fase in feed | `FEED_PERF_TIMING=1` |
| DB connection time | Eerste query na cold | Neon dashboard (niet in code) |
| Server startup | Module init + Prisma | Afgeleid van cold vs warm delta |

### Web Vitals (client)

| Metric | Tool |
|--------|------|
| FCP | Lighthouse, DevTools, PerformanceMonitor |
| LCP | Lighthouse, PerformanceObserver |
| INP | Lighthouse 10+, Chrome UX (niet in repo) |
| CLS | PerformanceMonitor |
| Hydration | `layout:hydration-complete` mark |
| Bundle parse/compile | DevTools Performance tab |

### App-specifiek

| Metric | Context |
|--------|---------|
| Feed fetch latency | `feed:json-received` − `feed:request-start` |
| Session fetch | `session:resolved` − `session:loading` |
| Image load (first tile) | `feed:first-image-visible` |
| App shell load | HTML + `_next/static` |
| Android cold launch | Capacitor splash end → first tile |
| Android warm launch | Resume → first tile |

---

## 4. Meetscenario's

| # | Scenario | Auth | Locatie | Herhaal |
|---|----------|------|---------|---------|
| 1 | Homepage anoniem | Uit | National default | 3× cold + 3× warm |
| 2 | Homepage ingelogd | In | National | 3× cold + 3× warm |
| 3 | Homepage ingelogd nearby | In | Opgeslagen nearby scope | 3× |
| 4 | Feed eerste bezoek | Beide | Default | Clear site data |
| 5 | Feed herhaalbezoek | Beide | Default | Binnen 60s return cache |
| 6 | Listing detail | Anoniem | — | Product + inspiratie |
| 7 | Profiel eigen | In | — | `/profile` |
| 8 | Profiel publiek | Uit | — | `/seller/[id]` |
| 9 | Chat | In | — | `/messages` + conversation open |
| 10 | Bestelling | In | — | `/orders` of checkout flow |
| 11 | Zoeken | Beide | Met `?q=` op homepage | Feed search params |
| 12 | Locatie wijzigen | In | Manual place change | Feed refetch |

---

## 5. Uitvoering per omgeving

### Lokaal (`npm run dev` / `npm run build && npm start`)

| Actie | Commando / stappen |
|-------|-------------------|
| Server timing | `FEED_PERF_TIMING=1 npm run dev` |
| Client baseline | `NEXT_PUBLIC_FEED_PERF_BASELINE=1 npm run dev` |
| Production-like | `npm run build && FEED_PERF_TIMING=1 npm start` |
| Lighthouse | `npx lighthouse http://localhost:3000/ --view` |
| API probe | `npx tsx scripts/validate-feed-performance-baseline-phase13k.ts` |

**Beperking:** Geen echte Vercel cold start; wel representatief voor query/client waterfall.

### Preview (Vercel PR deployment)

| Actie | Details |
|-------|---------|
| Env flags | Zet `FEED_PERF_TIMING=1` + `NEXT_PUBLIC_FEED_PERF_BASELINE=1` in preview env |
| Cold start | Wacht 10 min idle → single request → note TTFB |
| Warm | Direct herhaal request |
| Vergelijk | Preview vs production (zelfde DB?) — **documenteer of preview eigen DB heeft** |

**Niet uit code:** preview DB isolatie — verifieer in Vercel project settings.

### Productie (`https://homecheff.eu`)

| Actie | Details |
|-------|---------|
| RUM | Lighthouse CI of handmatige Lighthouse op productie (read-only) |
| WebPageTest | `https://www.webpagetest.org` — EU location |
| Server timing | **Alleen** tijdelijk `FEED_PERF_TIMING=1` op prod (1 uur max) |
| Neon | Slow query log + connection count tijdens piek |
| Vercel | Functions tab — cold start % en p95 duration |
| Capacitor | Android Studio profiler + logcat op fysiek device |

**Geen zware monitoringdienst in Fase 1.** Fase 2 voorstel (optioneel): Vercel Speed Insights (al deels via Analytics) of Sentry performance — **alleen na expliciete goedkeuring**.

---

## 6. Meetformulier (per run)

```
Datum:
Omgeving: lokaal | preview | productie
Scenario: #___
Device: desktop | mobile | Android Capacitor
Network: fast 4G throttled | wifi
Cold/warm: cold | warm

DNS ms:
TLS ms:
TTFB HTML ms:
FCP ms:
LCP ms:
CLS:
INP ms:
Session resolve ms:
Feed API TTFB ms:
Feed total client ms:
Prisma phases (Server-Timing):
First tile ms:
First image ms:
Feed stable ms:
JS bundle transfer KB:
Duplicate fetches observed: Y/N
Notes:
```

---

## 7. Acceptatiecriteria Fase 2 metingen

| Criterium | Drempel |
|-----------|---------|
| Minimaal 3 cold + 3 warm runs per scenario 1–2 | Verplicht |
| Server-Timing feed fases gedocumenteerd | Verplicht |
| Cold start % van totale feed latency berekend | Verplicht |
| Neon slow queries top 5 geëxporteerd | Verplicht |
| Android cold + warm min. 3 runs | Verplicht voor Capacitor claim |
| Vergelijking anon vs ingelogd | Verplicht |

---

## 8. Beslisboom na metingen

```
Als feed API (warm) > 800ms p95
  → P0 query optimalisatie (Vercel)
  
Als cold − warm delta > 40% van TTFB
  → Onderzoek Render voor specifieke route OF Vercel Pro warming
  
Als client hydration > API wacht
  → GeoFeed dynamic import + provider defer
  
Als Neon connections > 80% limit
  → Pooling audit, geen extra Render zonder pool upgrade
  
Als alles warm < 400ms en LCP < 2.5s
  → Render niet nodig; focus P2 polish
```

---

## 9. Wat niet meten in Fase 2 (tenzij expliciet)

- Volledige 324-route profiling
- Load test > 100 concurrent users (aparte stress test fase)
- Stripe webhook latency (niet user-facing first load)

---

## Acceptatiecriteria document

- [x] Concrete meetpunten per scenario
- [x] Lokaal, preview, productie beschreven
- [x] Bestaande instrumentatie hergebruikt
- [x] Geen monitoringdienst toegevoegd
- [x] Acceptatiecriteria Fase 2 gedefinieerd
