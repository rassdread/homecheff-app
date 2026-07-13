# HomeCheff Database & Prisma Performance Audit

**Datum:** 2026-07-12  
**Scope:** Read-only. Geen schema-wijzigingen, geen migraties, geen query-optimalisaties uitgevoerd.

---

## 1. PrismaClient-instantiatie

**Bestand:** `lib/prisma.ts`

```typescript
export const prisma = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

| Aspect | Bevinding | Risico |
|--------|-----------|--------|
| Singleton (dev) | ✅ `global` pattern correct voor HMR | Laag |
| Singleton (prod) | Module reuse per warm instance; **geen** expliciete `global` assignment | Middel bij instance churn |
| Connection pooling | Comments verwijzen naar Neon `?pgbouncer=true` | **Niet verifieerbaar** zonder env |
| Logging | `error` (+ `warn` in dev) | OK |
| Meerdere instanties | Geen tweede `new PrismaClient()` gevonden buiten `lib/prisma.ts` | Laag |
| Startup connect | Lazy — eerste query op eerste request | Cold-start overhead |

**Schema pooling:**

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

---

## 2. Query-patronen (repo-breed)

| Patroon | Voorkomen | Impact |
|---------|-----------|--------|
| `findMany` zonder `take` | Admin analytics, messages/all, messages/personal, admin/financial | **Hoog** — geheugen + latency |
| Diepe `include` / `select` | Chat conversations, delivery dashboard, profile page | **Hoog** — payload size |
| N+1 via `Promise.all(ids.map(...))` | `batchComputeUserStatsPreview` → `computeUserPublicStats` | **Kritiek** op feed |
| Batched `groupBy` | Feed stats, inspiratie stats | ✅ Goed patroon |
| `$transaction` | Checkout, webhooks, proposals | Correctness — kort scoped |
| `$queryRaw` | Gamification leaderboard, notification-service | Mix — sommige efficiënt, sommige per-send |
| Geo bbox queries | Feed listings/dishes | **Dish mist `@@index([lat,lng])`** |
| `unstable_cache` | 2 gamification routes alleen | Gemiste kansen |

---

## 3. Feed route analyse (`app/api/feed/route.ts`)

**Config:** `force-dynamic` · default Node runtime · optionele `Server-Timing` via `FEED_PERF_TIMING=1`

### Typische query-waterfall (eerste pagina, ingelogd)

| Fase | Queries (geschat) | Details |
|------|-------------------|---------|
| Session + geo | 0–2 | `user.findUnique` voor coords; optioneel geocode |
| Parallel fetch | 3 | `product.findMany(100)`, `listing.findMany(50)`, `dish.findMany(50)` |
| Follows | 1 | `follow.findMany(take:400)` |
| Stats enrichment | 4 | `groupBy` op analytics, reviews, favorites |
| Trust bundles | ~15+ | `fetchSellerTrustSnapshots` per unieke seller |
| Stats preview | ~72 | `batchComputeUserStatsPreview` — 9 sellers × ~8 queries |
| Discovery extras | 1–2 | Activity cards, surfaces |
| **Totaal** | **25–40+** | Worst case met stats preview |

### Specifieke problemen

1. **Product `findMany` met `OR` + `orderItems.some`** — dure relation filter op hot path
2. **Over-fetch → JS sort** — 200 rows opgehaald, 40 teruggegeven
3. **Products zonder geo bbox** — 100 nationale producten altijd; afstand in JS
4. **CDN cache alleen public default** — `Cache-Control: s-maxage=45` (L974); gepersonaliseerde feeds altijd cold execution
5. **`force-dynamic`** — Next Data Cache uitgeschakeld ondanks CDN headers

---

## 4. Homepage SSR (`getInspiratieItems`)

**Bestand:** `lib/getInspiratieItems.ts` · aangeroepen vanuit `app/page.tsx` (`revalidate = 60`)

| Stap | Queries |
|------|---------|
| `dish.findMany(take:24)` | 1 |
| Parallel groupBy (views, props, reviews, avg) | 4 |
| `fetchAuthorBadgeSummariesByUserIds` | 1+ |
| `fetchSellerTrustBundles` | ~15+ |
| **Totaal cache miss** | **~20** |

**Extra:** `sortBy: 'popular'` sorteert in memory na DB fetch op `createdAt` — populariteit niet in SQL.

---

## 5. Layouts met dubbele queries

| Bestand | Probleem |
|---------|----------|
| `app/product/[id]/layout.tsx` | `generateMetadata` + layout = 2× `product.findUnique` |
| `app/seller/[sellerId]/layout.tsx` | 2× `sellerProfile.findUnique` (metadata include 100 products) |
| `app/request/[slug]/layout.tsx` | 2× `product.findUnique` |

---

## 6. Queries vanuit layouts / server components / client

| Bron | Voorbeelden | Wanneer |
|------|-------------|---------|
| Server components | `app/page.tsx` → inspiratie | Eerste HTML |
| Layouts | Product/seller metadata | Elke detail-navigatie |
| API routes | `/api/feed`, `/api/profile/me` | Client fetch na hydration |
| Client effects | GeoFeed, UserBootstrapProvider | Na session resolve |
| Middleware | Suspend check fetch | API mutations only |

**Dubbele paden op homepage:**
- SSR inspiratie (24 items) + client `/api/inspiratie?take=48` na `feedHydrated`
- `/api/profile/me` via UserBootstrapProvider + useUserValidation (3s later)

---

## Top 20 verdachte database-paden

| # | P | Bestand | Functie / route | Oorzaak | Vermoedelijk effect | Meetmethode | Veilige oplossing | Risico |
|---|-----|---------|-----------------|--------|---------------------|-------------|-------------------|--------|
| 1 | P0 | `app/api/feed/route.ts` | `GET` | 25–40+ queries; trust + stats preview; `force-dynamic` | Hoogste TTFB op homepage | `FEED_PERF_TIMING=1`, `Server-Timing` | Batch stats; optionele trust; `unstable_cache` public slice | Middel |
| 2 | P0 | `lib/discovery/trust/fetch-seller-trust-snapshots.ts` | `countDeliveredOrderItemsByProductId` | `findMany` alle orderItems, count in JS | Row scan groeit met orders | Prisma query log + EXPLAIN | `groupBy` op productId | Laag |
| 3 | P0 | `lib/userStatsBatchPreview.ts` | `batchComputeUserStatsPreview` | N×`computeUserPublicStats` parallel | ~72 extra queries op feed | Feed timing marks | Eén SQL aggregate of feature-flag uitzetten | Laag |
| 4 | P0 | `app/api/feed/route.ts` | product query | `OR` + `orderItems.some` nested Order | Index/table scan | DB slow query log | Precomputed flag / view | Middel |
| 5 | P1 | `app/api/admin/financial/route.ts` | `GET` | Unbounded `transaction.findMany` | Admin timeout | Admin page load time | Date bounds + `take` + SQL aggregate | Laag |
| 6 | P1 | `app/api/admin/analytics/route.ts` | `GET` | `order.findMany` zonder `take` voor periode | Memory spike | Admin profiling | Pagination + aggregates | Laag |
| 7 | P1 | `app/api/admin/command-center/route.ts` | `GET` | ~35 parallel counts + all sellers | Admin dashboard slow | Server timing | Lazy load widgets | Laag |
| 8 | P1 | `lib/chat/loadConversationsForSessionUser.ts` | loader | Alle participants + deep graph, geen paginatie | Grote payloads power users | API response size | Cursor pagination | Middel |
| 9 | P1 | `app/api/messages/all/route.ts` | `GET` | `message.findMany` zonder `take` | Unbounded history | Response bytes | `take` + cursor | Laag |
| 10 | P1 | `app/api/messages/personal/route.ts` | `GET` | Zelfde patroon | Zelfde | Zelfde | Zelfde | Laag |
| 11 | P1 | `lib/getInspiratieItems.ts` | `getInspiratieItems` | ~20 queries per cache miss | SSR TTFB homepage | Lighthouse + server timing | Cache trust slice; ISR verhogen | Laag |
| 12 | P1 | `app/api/delivery/dashboard/route.ts` | `GET` | Deep includes + N Stripe calls | Dashboard slow | Route timing | Select minimal; batch Stripe | Middel |
| 13 | P1 | `lib/discovery/trust/fetch-seller-trust-snapshots.ts` | `fetchSellerTrustSnapshots` | 13+ parallel queries per seller batch | Feed trust fase | `trust_business_dna_done` mark | Materialized trust scores | Middel |
| 14 | P2 | `app/product/[id]/layout.tsx` | metadata + layout | Dubbele `findUnique` | 2× product load | Network duplicate | React `cache()` wrapper | Laag |
| 15 | P2 | `app/seller/[sellerId]/layout.tsx` | metadata + layout | Dubbele seller query | 2× seller load | Zelfde | Zelfde | Laag |
| 16 | P2 | `prisma/schema.prisma` | `Dish`, `SellerProfile` | Geen `@@index([lat,lng])` | Sequential scans geo | EXPLAIN op bbox query | Index toevoegen (Fase 2) | Laag |
| 17 | P2 | `lib/gamification/leaderboard-scoped.ts` | `nearbyUserIds` | `user.findMany(take:5000)` + haversine JS | CPU + rows | Query duration | SQL distance filter | Middel |
| 18 | P2 | `lib/stats/compute-user-public-stats.ts` | `computeUserPublicStats` | `findMany` ratings vs `_avg` | Extra rows | Query count | Aggregate | Laag |
| 19 | P2 | `app/api/products/route.ts` | `GET` | `revalidate=0`, feed-achtige enrichment | Client list slow | API latency | Cache public reads | Laag |
| 20 | P2 | `lib/notifications/notification-service.ts` | send paths | Meerdere `$queryRaw` per notification | Per-send latency | Notification trace | Batch preference lookup | Middel |

---

## 7. Ontbrekende indexen (uit schema-analyse — niet gemeten in productie)

| Model | Veld(en) | Gebruikt in | Prioriteit |
|-------|---------|-------------|------------|
| `Dish` | `lat`, `lng` | Feed bbox | P1 |
| `SellerProfile` | `lat`, `lng` | Ecosystem hub | P2 |
| `AnalyticsEvent` | `entityId`, `eventType` | Feed stats groupBy | P2 |

**Niet uit code alleen:** daadwerkelijke index-gebruik in productie — vereist `EXPLAIN ANALYZE` op Neon.

---

## 8. Connection pooling aanbevelingen (documentatie only)

1. Verifieer `DATABASE_URL` = Neon pooler endpoint
2. Overweeg `globalForPrisma.prisma = prisma` ook in productie
3. Monitor connection count tijdens feed load tests (Fase 2)
4. Geen Prisma Data Proxy in codebase — niet vereist als Neon pooling correct is

---

## Acceptatiecriteria

- [x] Prisma singleton onderzocht
- [x] Top 20 verdachte paden met prioriteit
- [x] Feed + homepage paden gedetailleerd
- [x] Geen databasewijzigingen uitgevoerd
