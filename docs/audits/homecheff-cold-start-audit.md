# HomeCheff Performance Phase 1 — Cold Start & Infrastructure Audit

**Datum:** 2026-07-12  
**Scope:** Read-only audit. Geen productie-, database- of deployment-wijzigingen.  
**Stack:** Next.js 14.2.35 · React 18 · Prisma 6 · Vercel · PostgreSQL (Neon) · Capacitor Android

---

## Executive summary

HomeCheff is een **monolithische Next.js App Router-applicatie** op Vercel. Er is **geen** aparte `server/` of `services/` laag; domeinlogica zit in `app/` + `lib/`. De traagheid bij het eerste openen wordt **niet** primair veroorzaakt door het ontbreken van een always-on server — cold starts spelen mee, maar de **zwaarste bewezen bottlenecks** zitten in:

1. **Client bundle + hydration** — `GeoFeed.tsx` (4.224 LOC) statisch op de homepage
2. **API `/api/feed`** — 25–40+ Prisma-queries per request, altijd `force-dynamic`
3. **Request waterfall** — session → viewport gate → feed fetch → inspiratie refetch
4. **Globale provider-stack** — 15+ sync client providers op elke route

**Render is niet de eerste oplossing.** Scenario A (optimaliseren op Vercel) + gerichte metingen (Fase 2) wordt aanbevolen vóór hybride migratie.

---

## Deel 1 — Repository-inventarisatie

### Architectuuroverzicht

```
Gebruiker (browser / Capacitor WebView)
    → Vercel Edge CDN + middleware.ts
    → Next.js 14 App Router (app/)
    → 324 API route handlers (app/api/**/route.ts)
    → lib/ (domeinlogica)
    → Prisma singleton → PostgreSQL (Neon, pooled DATABASE_URL)
    → Externe services: Stripe, Pusher, Firebase FCM, Vercel Blob, Resend, Twilio, EctaroShip, Google APIs
```

| Map / bestand | Functie | Runtime | Afhankelijkheden | Database | Externe API's | Perf-impact | Vercel | Render |
|---------------|---------|---------|------------------|----------|---------------|-------------|--------|--------|
| `app/` | Pages, layouts, 324 API routes | Node serverless (default) | next, next-auth, react | Via Prisma in routes/SSR | Stripe, Pusher, Blob, etc. | **Kritiek** — alles draait hier | ✅ Primair | ⚠️ Alleen geselecteerde workloads |
| `pages/` | Legacy stub (`pages/api/` leeg) | — | — | — | — | Geen | — | — |
| `lib/` (~165 modules) | Auth, feed, marketplace, notifications, native, geo | Geïmporteerd door API/SSR | prisma, pusher, stripe, firebase-admin | Ja | Ja | **Hoog** — hot paths in feed/trust | ✅ | Deels |
| `prisma/` | Schema (~84KB), 72 migraties | Build + runtime | @prisma/client | PostgreSQL | — | Connection pool druk | ✅ (via Neon) | ✅ (zelfde DB) |
| `middleware.ts` | CORS, .nl→.eu, suspend-guard, affiliate ref, security headers | **Edge** | next-auth/jwt | Fetch naar internal API (suspend check) | — | Laag op `/` | ✅ Edge | ❌ Niet 1:1 |
| `next.config.mjs` | standalone, optimizePackageImports, image cache, webpack splits | Build | — | — | — | Bundle size | ✅ | ✅ |
| `vercel.json` | Build script, crons, function limits, CORS headers | Vercel infra | — | — | — | maxDuration 30s default | ✅ | N.v.t. |
| `instrumentation.*` | **Niet aanwezig** | — | — | — | — | Geen server startup hooks | — | — |
| `components/` (62 domeinen) | UI, GeoFeed, NavBar, chat | Client (`'use client'`) | lucide, zustand, pusher-js | — | Pusher client | **Kritiek** op homepage | ✅ CDN | ✅ |
| `hooks/` | Session, comms, geolocation | Browser | next-auth/react | — | — | Middel | ✅ | ✅ |
| `scripts/` (~280) | Build, validatie, probes | Node CLI | — | — | — | Buildtijd | CI | CI |
| `android/` + `capacitor.config.ts` | Native shell, WebView → `https://homecheff.eu` | Capacitor | @capacitor/* | — | FCM, Google login | App cold launch + WebView | ✅ (remote URL) | ⚠️ Zelfde URL |
| `public/manifest.json` | PWA metadata | Static | — | — | — | Laag | ✅ CDN | ✅ |
| `public/sw.js` | Service worker | **Niet geregistreerd** | — | — | — | Geen effect | — | — |
| `dist/` | Capacitor webDir placeholder | Static | — | — | — | Minimaal | — | — |

### Realtime & background

| Onderdeel | Bestand | Status | Vercel | Render |
|-----------|---------|--------|--------|--------|
| **Pusher** | `lib/pusher.ts`, `app/api/pusher/auth/route.ts` | Actief — channels voor chat, delivery, comms | ✅ | ✅ (zelfde SDK) |
| **Socket.IO** | `package.json` dependency | **0 imports in codebase** — dead dependency | — | — |
| **Firebase FCM** | `lib/firebase/admin.ts` | Server-only push | ✅ | ✅ |
| **Vercel Cron** | `vercel.json` — 2 actieve jobs | `send-notifications` (elke minuut), `schedule-shift-notifications` (uur) | ✅ | Vervanging nodig bij migratie |
| **Cron endpoints (niet in vercel.json)** | `cleanup-stock-reservations`, `delivery-warnings`, affiliate payouts | Vereisen externe scheduler of vercel.json uitbreiding | ✅ | Render cron |

### Database client

- **Singleton:** `lib/prisma.ts` — dev gebruikt `global`; productie vertrouwt op module reuse per warm instance
- **Pooling:** Neon pattern (`DATABASE_URL` pooled + `DIRECT_URL` voor migraties)
- **Niet verifieerbaar uit code:** of productie-`DATABASE_URL` daadwerkelijk `?pgbouncer=true` bevat (env niet in repo)

### Caching helpers (inventaris)

| Bestand | Laag | Status |
|---------|------|--------|
| `lib/cache.ts` | Server in-memory | **Ongebruikt** |
| `lib/runtime/sessionSwrCache.ts` | Client sessionStorage | Actief |
| `lib/feed/home-feed-return-cache.ts` | Client in-tab memory | Actief |
| `lib/feed/feedSurfaceState.ts` | sessionStorage | Actief |
| `lib/chat/sessionChatCache.ts` | Client | Actief |
| `lib/native/nativePersistedCache.ts` | localStorage (native) | Actief |
| `unstable_cache` | 2 gamification routes | Minimaal |

### Build & deploy scripts (`package.json`)

| Script | Functie |
|--------|---------|
| `build` | `NODE_OPTIONS=--max-old-space-size=4096`, prisma generate |
| `prebuild` / `postinstall` | prisma generate, patch-package |
| Vercel build | `node scripts/vercel-build.js` (generate → migrate deploy → next build) |
| `smoke-check` | Prisma, env, DB ping, route sanity |
| `cap:sync` / `release:android` | Capacitor Android pipeline |

### Environment variables (gebruikspatronen — geen waarden)

| Categorie | Voorbeelden | Server-only |
|-----------|-------------|-------------|
| Database | `DATABASE_URL`, `DIRECT_URL` | ✅ |
| Auth | `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, Google OAuth | ✅ / public client ID |
| Stripe | `STRIPE_*`, webhook secrets | ✅ |
| Pusher | `PUSHER_*`, `NEXT_PUBLIC_PUSHER_*` | Mixed |
| Firebase | Service account JSON / env | ✅ |
| Blob | `BLOB_READ_WRITE_TOKEN` | ✅ |
| Email/SMS | Resend, Twilio keys | ✅ |
| Cron | `CRON_SECRET` | ✅ |
| Diagnostics | `FEED_PERF_TIMING`, `NEXT_PUBLIC_FEED_PERF_BASELINE` | Mixed |

**Niet uit code vast te stellen:** actuele Vercel function cold-start percentiles, Neon connection limits, productie bundle sizes (vereist build-analyse of RUM).

---

## Cold start vs. andere latency-types

| Type | Definitie in HomeCheff-context | Bewijs |
|------|-------------------------------|--------|
| **Cold start** | Eerste Vercel serverless invocation na idle — Prisma init + module load | `force-dynamic` op 332 bestanden; geen `instrumentation.ts` |
| **Buildtijd** | `vercel-build.js` + Next compile (~4GB heap) | `package.json` build script |
| **Server response time (TTFB)** | SSR `app/page.tsx` + API `/api/feed` | Feed route ~1008 LOC, 25–40+ queries |
| **Database latency** | Neon round-trips via Prisma | Trust/stats enrichment chains |
| **Client hydration** | `Providers` + `GeoFeed` + `NavBar` | 4.224 LOC GeoFeed sync import |
| **JS bundle** | Webpack vendor/react/ui/maps chunks | `next.config.mjs` splitChunks |
| **Afbeeldingen** | Raw `<img>` in feed, Blob CDN | `feedMedia.tsx` — geen `next/image` |
| **Netwerkrequests** | Session + feed + profile burst | Zie first-load graph |
| **Caching** | ISR homepage 60s; feed CDN 45s alleen public default | `app/page.tsx`, feed route L974 |
| **Herhaalde requests** | `home-feed-return-cache` 60s SWR | Client cache actief |
| **Mobiele app-start** | Capacitor splash 3.25s + WebView load remote URL | `capacitor.config.ts` |
| **Eerste websitebezoek** | Geen SW; geen service worker cache | `sw.js` niet geregistreerd |

---

## Gerelateerde audit-documenten

| Document | Inhoud |
|----------|--------|
| [homecheff-api-route-inventory.md](./homecheff-api-route-inventory.md) | Alle 324 API routes |
| [homecheff-database-performance-audit.md](./homecheff-database-performance-audit.md) | Top 20 DB-paden |
| [homecheff-first-load-request-graph.md](./homecheff-first-load-request-graph.md) | Homepage laadpad |
| [homecheff-render-suitability.md](./homecheff-render-suitability.md) | Scenario A/B/C |
| [homecheff-performance-measurement-plan.md](./homecheff-performance-measurement-plan.md) | Meetplan Fase 2 |
| [homecheff-performance-phase1-summary.md](./homecheff-performance-phase1-summary.md) | Samenvatting & roadmap |

---

## Acceptatiecriteria Deel 1

- [x] Architectuur in kaart gebracht
- [x] Runtime per onderdeel benoemd
- [x] Externe afhankelijkheden uit code afgeleid
- [x] Onderscheid cold start vs. andere latency-types
- [x] Geen productiewijzigingen
