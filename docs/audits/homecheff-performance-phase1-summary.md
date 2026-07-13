# HomeCheff Performance Phase 1 — Samenvatting

**Datum:** 2026-07-12  
**Status:** Audit compleet · Geen productie-, database- of deployment-wijzigingen  
**Auditor:** Code-gebaseerde analyse (read-only)

---

## Geleverde documenten

| # | Bestand | Inhoud |
|---|---------|--------|
| 1 | [homecheff-cold-start-audit.md](./homecheff-cold-start-audit.md) | Repository-inventarisatie & infrastructuur |
| 2 | [homecheff-api-route-inventory.md](./homecheff-api-route-inventory.md) | 324 API routes + classificatie A–E |
| 3 | [homecheff-database-performance-audit.md](./homecheff-database-performance-audit.md) | Prisma audit + top 20 DB-paden |
| 4 | [homecheff-first-load-request-graph.md](./homecheff-first-load-request-graph.md) | Homepage laadpad & waterfalls |
| 5 | [homecheff-render-suitability.md](./homecheff-render-suitability.md) | Scenario A/B/C + advies |
| 6 | [homecheff-performance-measurement-plan.md](./homecheff-performance-measurement-plan.md) | Fase 2 meetplan |
| 7 | [homecheff-performance-phase1-summary.md](./homecheff-performance-phase1-summary.md) | Dit document |

---

## Huidige architectuur (beknopt)

```
Browser / Capacitor Android (WebView → homecheff.eu)
  → Vercel Edge (middleware.ts)
  → Next.js 14 App Router monolith
  → 324 serverless API routes (app/api/)
  → lib/ domeinlogica
  → Prisma singleton → PostgreSQL (Neon)
  → Stripe · Pusher · Firebase FCM · Vercel Blob · Resend · Twilio · EctaroShip
```

- **Geen** aparte backend-service
- **Geen** Socket.IO server (dependency ongebruikt)
- **Geen** actieve service worker
- **332** bestanden met `force-dynamic`
- **Capacitor** laadt remote productie-URL (geen lokale bundle)

---

## Bewzen bottlenecks (uit code)

| # | Bottleneck | Bewijs | Impact |
|---|------------|--------|--------|
| 1 | `/api/feed` — 25–40+ Prisma queries per request | `app/api/feed/route.ts` (~1008 LOC), trust + stats preview chains | **Kritiek** — blokkeert feed interactiviteit |
| 2 | `GeoFeed.tsx` 4.224 LOC statisch op homepage | `HomePageClient.tsx` import | **Kritiek** — hydration & TTI |
| 3 | Session gate vóór feed fetch | `GeoFeed.tsx` `feedStartupBlocked` | **Hoog** — alle gebruikers |
| 4 | 15+ sync client providers op elke route | `Providers.tsx` | **Hoog** — hydration cost |
| 5 | SSR inspiratie ~20 queries + client refetch | `app/page.tsx` + `GeoFeed` L1973+ | **Hoog** — dubbel werk |
| 6 | `force-dynamic` op vrijwel alle API's | 332 bestanden | **Hoog** — geen Next data cache |
| 7 | `lib/cache.ts` ongebruikt | Geen imports | **Middel** — gemiste server cache |
| 8 | Trust `countDeliveredOrderItemsByProductId` — findMany niet groupBy | `fetch-seller-trust-snapshots.ts` | **Hoog** — schaalt met orders |
| 9 | `batchComputeUserStatsPreview` — N×8 queries | `userStatsBatchPreview.ts` | **Hoog** — tot ~72 extra queries |
| 10 | `sw.js` bestaat maar niet geregistreerd | Geen `serviceWorker.register` | **Laag** — geen PWA cache (ook geen risico) |

---

## Vermoedelijke bottlenecks (meten in Fase 2)

| # | Vermoeding | Waarom vermoedelijk | Meetmethode |
|---|------------|---------------------|-------------|
| 1 | Vercel serverless cold start op `/api/feed` | `force-dynamic` + zware module graph | Cold vs warm TTFB delta |
| 2 | Neon connection latency op cold Prisma | Singleton zonder prod global | Eerste query timing |
| 3 | NavBar (~999 LOC) sync in layout | `app/layout.tsx` static import | Bundle analyzer |
| 4 | Pusher-js eager init | `lib/pusher.ts` via Providers | Performance trace ingelogd |
| 5 | Capacitor splash 3.25s maskert WebView load | `capacitor.config.ts` | Android profiler |
| 6 | Feed raw `<img>` vs next/image | `feedMedia.tsx` | LCP vergelijking |
| 7 | Viewport skeleton extra frame | `useNarrowViewport.ts` | `layout:hydration-complete` mark |
| 8 | Product `findMany` OR + orderItems scan | Feed route product query | EXPLAIN ANALYZE |
| 9 | Ontbrekende geo-indexen Dish/SellerProfile | schema.prisma | DB EXPLAIN |
| 10 | Vercel function p95 > 1s onder load | Niet in code | Vercel dashboard |

---

## Top 10 quick wins

| # | P | Actie | Impact | Inspanning | Risico |
|---|-----|-------|--------|------------|--------|
| 1 | P0 | `dynamic()` import GeoFeed met bestaande skeleton | Hoog | Klein | Laag |
| 2 | P0 | Verwijder client inspiratie refetch als SSR pool voldoende | Hoog | Klein | Laag |
| 3 | P0 | Dedupliceer `/api/profile/me` (bootstrap vs validation) | Middel | Klein | Laag |
| 4 | P1 | Feature-flag stats preview uit default feed path | Hoog | Klein | Laag |
| 5 | P1 | `countDeliveredOrderItemsByProductId` → `groupBy` | Hoog | Klein | Laag |
| 6 | P1 | Defer CommsRealtimeListener/Pusher tot na eerste feed paint | Middel | Middel | Laag |
| 7 | P1 | Fix UserActionCenter dubbele mount in skeleton fase | Laag | Klein | Laag |
| 8 | P2 | React `cache()` op layout duplicate Prisma queries | Middel | Klein | Laag |
| 9 | P2 | `unstable_cache` op geocoding + pending-accepted-values GET | Middel | Middel | Laag |
| 10 | P2 | Activeer `NEXT_PUBLIC_FEED_PERF_BASELINE=1` op preview | — (meet) | Klein | Laag |

---

## Top 10 structurele verbeteringen

| # | P | Actie | Impact | Inspanning | Risico |
|---|-----|-------|--------|------------|--------|
| 1 | P0 | Feed API query budget — max 10–15 queries target | Kritiek | Groot | Middel |
| 2 | P0 | Materialized/precomputed seller trust scores | Hoog | Groot | Middel |
| 3 | P1 | Provider stack splitsen — critical vs deferred | Hoog | Groot | Middel |
| 4 | P1 | Systematische `force-dynamic` audit → `revalidate` waar veilig | Hoog | Groot | Middel |
| 5 | P1 | Geo indexen + bbox op products | Hoog | Middel | Laag |
| 6 | P1 | Batch `computeUserPublicStats` in SQL | Hoog | Middel | Laag |
| 7 | P2 | Route-level code splitting (chat, admin, seller dashboards) | Middel | Groot | Laag |
| 8 | P2 | Orders/notifications parity met sessionSwrCache | Middel | Middel | Laag |
| 9 | P2 | Verwijder ongebruikte `socket.io` dependency | Laag | Klein | Laag |
| 10 | P3 | Capacitor offline shell / lokale asset cache | Middel | Zeer groot | Hoog |

---

## Platform-beslissingen

### Blijf op Vercel

- Next.js frontend + CDN + image optimizer
- NextAuth + session cookies (`.homecheff.eu`)
- Stripe/EctaroShip webhooks
- Pusher auth op zelfde origin
- Vercel Blob uploads
- Edge middleware
- Capacitor `server.url`

### Mogelijk naar Render (na Fase 2 meting)

- Cron workers (`send-notifications`, cleanup, delivery-warnings)
- Langlopende upload/video processing (als Vercel timeouts knellen)
- Optionele notification batch worker

### Niet blind verplaatsen

- `/api/auth/*` (NextAuth)
- `/api/stripe/*` webhooks
- `/api/pusher/auth`
- `/api/checkout/*`, `/api/orders/*`
- Volledige Next.js app

---

## Geadviseerd scenario

### **Scenario A** — Optimaliseer op Vercel eerst

**Render is niet nodig** voor de eerste implementatiefase, tenzij metingen cold start >40% van feed TTFB aantonen *na* query-optimalisatie.

Optioneel later: **Scenario B-lite** — alleen cron/background workers op Render.

---

## Gefaseerde roadmap

### Fase 2 — Meten (geen architectuurwijziging)

- [ ] Baseline op preview met `FEED_PERF_TIMING=1` + `NEXT_PUBLIC_FEED_PERF_BASELINE=1`
- [ ] 3 cold + 3 warm runs per scenario (anon + ingelogd homepage)
- [ ] Neon slow query export
- [ ] Vercel function cold start %
- [ ] Android cold/warm launch (3 runs)
- [ ] Beslisboom uit measurement plan toepassen

### Fase 3 — Quick wins op Vercel (code only)

- [ ] GeoFeed dynamic import
- [ ] Dubbele inspiratie + profile fetch fix
- [ ] Stats preview feature flag
- [ ] `groupBy` fix trust order count
- [ ] Herhaal metingen

### Fase 4 — Structurele optimalisatie (code + optionele DB indexen)

- [ ] Feed query budget refactor
- [ ] Trust score precomputation
- [ ] Provider deferral
- [ ] `force-dynamic` audit
- [ ] Geo indexen (Prisma migratie — alleen na review)

### Fase 5 — Infra (alleen indien Fase 2 data het rechtvaardigt)

- [ ] Render cron worker POC
- [ ] **Niet:** user-facing feed API split zonder auth herontwerp
- [ ] **Niet:** volledige Vercel → Render migratie

---

## Kosteninschatting (indicatief)

| Component | Huidig | Scenario A | Scenario B-lite | Scenario C |
|-----------|--------|------------|-----------------|------------|
| Vercel | Bestaand | Bestaand | Bestaand | $0 (weg) |
| Render | $0 | $0 | $7–25/maand worker | $25–85+/maand web |
| Neon PostgreSQL | Bestaand | Bestaand | Bestaand (+ monitor connections) | Bestaand |
| Dev/ops tijd | — | 2–4 weken | +1 week | 2–3 maanden |
| Risico productie-uitval | — | Laag | Middel | Hoog |

*Bedragen zijn schattingen — niet uit codebase afleidbaar.*

---

## Rollbackstrategie

| Wijziging | Rollback |
|-----------|----------|
| Code quick wins | Git revert + Vercel redeploy |
| DB indexen | `DROP INDEX` migratie (Fase 4 only) |
| Render cron POC | Cron URL terug naar `vercel.json` |
| Hybride API split | DNS/proxy revert + Stripe webhook URL check |

**Principe:** elke fase moet onafhankelijk revertbaar zijn zonder dataverlies.

---

## Beveiliging & compatibiliteit (hybride risico-matrix)

| Risico | Impact | Kans | Mitigatie |
|--------|--------|------|-----------|
| NextAuth cookie cross-origin | Sessie verlies | Hoog bij API split | Blijf auth op Vercel |
| Stripe webhook URL wijziging | Gemiste payments | Hoog bij migratie | Dual webhook tijdens transit |
| CORS misconfig | API failures | Middel | Behoud `homecheff.eu` origin |
| Capacitor deep link break | App login faalt | Hoog bij domein wijziging | Geen origin wijziging Fase 3–4 |
| CSRF op cross-origin POST | Auth bypass | Middel | Geen user API op ander domein |
| Neon connection exhaustion | DB downtime | Middel bij Render toevoeging | Pool limits + monitoring |
| CRON_SECRET leak op Render | Unauthorized cron | Laag | Render secret management |
| Pusher channel auth mismatch | Geen realtime | Laag | Blijf pusher/auth op Vercel |

---

## Acceptatiecriteria Fase 2 (vervolg)

Fase 2 mag starten als:

- [x] Fase 1 audit compleet (dit document)
- [ ] Productie-eigenaar keurt meetplan goed
- [ ] Preview env flags beschikbaar
- [ ] Neon dashboard toegang voor slow queries

Fase 2 is compleet als:

- [ ] Alle scenario's 1–2 gemeten (cold + warm)
- [ ] Cold start % van feed latency berekend
- [ ] Top 3 bottlenecks bevestigd of weerlegd met data
- [ ] Go/no-go Render besluit gedocumenteerd

---

## Wat nog ontbreekt (niet uit code)

| Informatie | Bron nodig |
|------------|------------|
| Productie Vercel function p50/p95/p99 | Vercel dashboard |
| Neon connection count & slow queries | Neon console |
| Werkelijke `DATABASE_URL` pooling config | Vercel env (niet in repo) |
| Productie bundle sizes per route | `ANALYZE=true npm run build` |
| Real-user LCP/INP (CrUX) | Google PageSpeed / Search Console |
| Android cold launch op mid-range devices | Fysiek device test |
| Maandelijkse Vercel/Neon kosten | Billing |

---

## Bevestiging

| Item | Status |
|------|--------|
| Productiecode gewijzigd | ❌ Nee |
| Database / migraties | ❌ Nee |
| Environment variables | ❌ Nee |
| Deployment / Vercel / Render | ❌ Nee |
| Automatische commits / pushes | ❌ Nee |
| Destructieve wijzigingen | ❌ Nee |

**Fase 1 audit is compleet.** Start Fase 2 metingen voordat infrastructuur wordt gewijzigd.
