# HomeCheff Render Suitability & Architecture Scenarios

**Datum:** 2026-07-12  
**Scope:** Read-only advies op basis van codebase. Geen migratie uitgevoerd.

---

## Kernvraag: Is Render nodig?

**Antwoord op basis van code:** **Nee, niet als eerste stap.** De bottlenecks zijn:

1. **Query-complexiteit** op `/api/feed` (25–40+ Prisma round-trips) — platform-onafhankelijk
2. **Client bundle** (`GeoFeed` 4.224 LOC statisch geïmporteerd) — platform-onafhankelijk
3. **Request waterfall** (session → feed) — architectuur/client-side
4. **332× `force-dynamic`** — bewuste caching-opt-out, niet Vercel-specifiek

Always-on Render **vermindert serverless cold starts** voor API's, maar lost **niet** automatisch op: DB-query count, bundle size, dubbele fetches, of Prisma connection gedrag bij hoge concurrency.

**Render wordt relevant** als metingen (Fase 2) aantonen dat **cold-start TTFB** >30% van totale latency is *na* query-optimalisatie — of voor **cron/background** workloads die betrouwbaarder always-on nodig hebben.

---

## Onderdelen per platform-geschiktheid

### Blijf op Vercel (bewijs)

| Onderdeel | Reden |
|-----------|-------|
| Next.js frontend + App Router | Huidige deploy pipeline (`vercel-build.js`), CDN, image optimizer |
| `middleware.ts` (Edge) | CORS, domain redirect, security headers — Edge-native |
| Statische assets + `/_next/static` | Immutable cache headers in `next.config.mjs` |
| Stripe/NextAuth webhooks op zelfde origin | Cookie domain `.homecheff.eu`, signature URLs |
| Capacitor `server.url` | Wijst naar `https://homecheff.eu` — Vercel origin |
| Pusher client auth | `/api/pusher/auth` op zelfde site — geen CORS-complexiteit |
| Vercel Blob uploads | `@vercel/blob` integratie in upload routes |
| Bestaande Vercel Cron (2 jobs) | `vercel.json` geconfigureerd |

### Mogelijk naar Render (na meting)

| Onderdeel | Reden | Voorwaarde |
|-----------|-------|------------|
| `/api/cron/send-notifications` | Elke minuut — warm instance kan stabieler zijn | Meting cold vs warm cron latency |
| `/api/feed` (alleen als API microservice) | Zware Prisma pipeline | **Alleen** met gedeelde auth + routing layer; hoog risico |
| Geocoding cache service | Geen server cache nu | Laag risico sidecar |
| Notification dispatch worker | `$queryRaw` per send in notification-service | Queue + worker pattern |

### Sterke Render-kandidaat (code)

| Onderdeel | Reden |
|-----------|-------|
| Cron jobs niet in `vercel.json` | `cleanup-stock-reservations`, `delivery-warnings`, affiliate payouts — need scheduler |
| Langlopende upload/video routes | `maxDuration: 60`, nodejs runtime — Render geen 30s cap |
| PDF generatie | `pitch-pdf` nodejs route |

### Niet blind verplaatsen (D)

| Onderdeel | Reden |
|-----------|-------|
| `auth/[...nextauth]` | Cookie domain, JWT, OAuth callbacks — cross-origin breekt sessie |
| Stripe webhooks (`/api/stripe/*`, `/api/webhooks/ectaroship`) | URL + signature endpoint moet stabiel blijven |
| `pusher/auth` | Channel auth tied to session cookie |
| Checkout/orders flow | Stripe session + redirect terug naar zelfde origin |
| Volledige Next.js op Render | Verlies Vercel Edge middleware, image CDN, bestaande deploy DX |

---

## Socket.IO & persistent connections

- **`socket.io` in package.json — 0 code imports.** Geen persistent connection server in codebase.
- **Pusher** is managed realtime — geen eigen WebSocket server nodig.
- **Conclusie:** Geen Render-voordeel voor WebSocket persistence in huidige architectuur.

---

## Scenario A — Alles blijft op Vercel

### Optimalisaties (code-only, geen platform switch)

| Optimalisatie | Verwachte winst | Inspanning | Risico |
|---------------|-----------------|------------|--------|
| Feed query reductie (trust/stats batch) | TTFB −30–50% | Groot | Middel |
| `dynamic()` import GeoFeed | TTI −20–40% | Klein | Laag |
| Session + feed parallel starten | Perceived −200–500ms | Middel | Laag |
| Verwijder dubbele inspiratie fetch | −1 API call + ~20 queries | Klein | Laag |
| `unstable_cache` public feed slice | Warm TTFB −40% anon | Middel | Middel (stale) |
| Geo indexen Dish/SellerProfile | DB fase −20% | Klein (migratie) | Laag |
| Defer Pusher/Comms tot na feed | Bundle/hydration −10% | Middel | Laag |
| Audit `force-dynamic` → `revalidate` waar veilig | CDN hit rate ↑ | Groot | Middel |

### Kosten (indicatief — niet uit code)

| Component | Schatting |
|-----------|-----------|
| Vercel Pro + usage | Bestaand contract |
| Neon PostgreSQL | Bestaand |
| Pusher, Stripe, Blob, Resend | Bestaand |
| **Extra** | $0 infra — alleen dev tijd |

### Risico: **Laag** — geen architectuurwijziging

### Complexiteit: **Laag–middel**

---

## Scenario B — Hybride Vercel + Render

### Architectuur

```
Browser / Capacitor
    → Vercel (Next.js frontend + lichte API's + webhooks + auth)
    → Render always-on (geselecteerde workers: cron, heavy feed cache warmer, notification batch)
    → Neon PostgreSQL (gedeeld)
```

### Routing

| Verkeer | Route |
|---------|-------|
| `/*` pages | Vercel |
| `/api/auth/*`, `/api/stripe/*`, `/api/checkout/*` | Vercel (cookie origin) |
| `/api/cron/*` (optioneel) | Render via scheduler |
| `/api/feed` (optioneel) | Render subdomain `api.homecheff.eu` — **vereist proxy + auth redesign** |

### Authentication (hybride risico's)

| Aspect | Huidige code | Hybride impact |
|--------|--------------|----------------|
| Session cookie | `sameSite: lax`, domain `.homecheff.eu`, `httpOnly` | Cross-origin API op Render vereist token-based auth of proxy |
| NextAuth | `trustHost: true`, `NEXTAUTH_URL=https://homecheff.eu` | Render API kan session cookie niet lezen zonder shared domain proxy |
| CSRF | NextAuth csrf token cookie | Breekt bij cross-origin POST |

**Advies:** Hybride **alleen** voor **interne workers** (cron, queue) met `CRON_SECRET` / service tokens — **niet** voor user-facing `/api/feed` zonder significant herontwerp.

### CORS

- `vercel.json` + `middleware.ts`: `Access-Control-Allow-Origin: https://homecheff.eu`
- Render worker: geen browser CORS nodig (server-to-server)
- User-facing Render API: CORS + credentials matrix vereist

### Webhooks

| Webhook | Blijft op Vercel |
|---------|------------------|
| Stripe main + Connect | ✅ URL stability |
| EctaroShip | ✅ |

### Database

- Zelfde `DATABASE_URL` op Render — connection pool **delen** met Vercel functions
- Risico: **meer concurrent connections** — Neon limits monitoren

### Environment variables

- Render: `DATABASE_URL`, `CRON_SECRET`, notification keys
- **Niet dupliceren:** `NEXTAUTH_SECRET` op Render tenzij auth daar draait

### Observability

- Vercel Analytics (bestaand, consent-gated)
- Render logs voor workers
- Geen unified APM in codebase — Fase 2 voorstel nodig

### Deployment & rollback

- Vercel: bestaande pipeline
- Render: aparte deploy; feature flag om cron target te switchen
- Rollback: DNS/proxy terug naar Vercel-only cron

### Verwachte winst

| Gebied | Winst |
|--------|-------|
| Cron betrouwbaarheid | Middel |
| Cold start user API | **Laag** tenzij feed verplaatst |
| Feed TTFB | **Geen** zonder query fixes |
| Kosten | +$7–25/maand Render worker |

### Risico: **Hoog** bij user-facing API split; **Laag** bij cron-only

### Complexiteit: **Hoog** (user API) / **Middel** (cron-only)

---

## Scenario C — Volledige Next.js op Render

### Voordelen

- Always-on Node proces — geen per-request cold start
- Langere request timeouts (upload/video)
- Eenvoudigere cron scheduling

### Nadelen (objectief, uit architectuur)

| Nadeel | Impact |
|--------|--------|
| Vercel Edge `middleware.ts` | Moet herschreven of via CDN proxy |
| `next/image` optimizer | Render heeft geen Vercel Image Optimization — alternatief nodig |
| Global CDN | Render CDN < Vercel Edge voor EU traffic (niet gemeten) |
| `vercel-build.js` + Blob integratie | Deploy pipeline herschrijven |
| Capacitor `server.url` | Wijziging + app release als domein wijzigt |
| Stripe webhook URLs | Eenmalige migratie + dual-running periode |
| NextAuth `NEXTAUTH_URL` | Env + OAuth redirect update |
| Bestaande Vercel Cron | Vervangen door Render cron |
| Rollback | Traag — DNS + dubbele infra tijdens migratie |

### Verwachte winst

- Cold start: **significant** voor admin/zeldzame routes
- Homepage feed: **beperkt** zolang DB queries zwaar blijven
- Capacitor: **geen** — zelfde WebView remote load

### Risico: **Zeer hoog**

### Complexiteit: **Zeer groot**

### Kosten

- Render web service ($7–85+/maand afhankelijk van RAM/CPU)
- Vercel mogelijk nog nodig voor CDN/DNS tijdens transit
- Dev/ops tijd >> infra kosten

---

## Aanbevolen scenario

### **Scenario A** (Vercel optimalisatie) + **selectieve Scenario B-lite** (cron workers op Render *alleen na meting*)

**Volgorde:**

1. **Fase 2 metingen** — baseline vastleggen (zie measurement plan)
2. **P0 code fixes op Vercel** — feed queries, GeoFeed dynamic import, dubbele fetches
3. **Herhaal metingen** — als cold start <20% van winst, **stop** — Render niet nodig
4. **Optioneel:** Render cron worker voor `send-notifications` als Vercel cron latency problemen toont

**Render is niet de default oplossing voor trage eerste laadtijd.**

---

## Rollbackstrategie (indien hybride getest)

| Fase | Rollback |
|------|----------|
| Cron op Render | Cron URL terug in `vercel.json` |
| Feed API op Render | DNS/proxy terug naar Vercel; geen client changes als proxy behouden |
| Volledige migratie | DNS revert + webhook URL revert in Stripe dashboard |

---

## Acceptatiecriteria

- [x] Drie scenario's vergeleken
- [x] Advies op codebewijs, niet aannames
- [x] Auth/webhook/Capacitor risico's benoemd
- [x] Geen infrastructuur gewijzigd
