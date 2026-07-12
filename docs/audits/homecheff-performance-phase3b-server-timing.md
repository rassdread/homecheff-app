# Phase 3B — Server-Timing Header

**Datum:** 2026-07-12

---

## Observatie

Preview toonde `debug.perf` in JSON-body maar **geen** `Server-Timing` response header.

---

## Oorzaken (gerangschikt)

### 1. CDN cache HIT (primair)

Wanneer `x-vercel-cache: HIT` op tier A anonymous feed:

- Edge serveert gecachte response
- Origin `Server-Timing` header wordt **niet** opnieuw gegenereerd
- `debug.perf` in body kan verouderd zijn of afwezig afhankelijk van cache variant

**3B fix:** Tier D (`FEED_PERF_TIMING=1`) forceert `private, no-store` → altijd origin MISS → header aanwezig.

### 2. Header niet exposed (secundair)

Cross-origin fetches vereisen `Access-Control-Expose-Headers: Server-Timing`.

**3B fix:** Feed route zet `Access-Control-Expose-Headers: Server-Timing` wanneer timing actief.

### 3. Timing alleen bij env flag

`createFeedApiTiming()` start alleen als `FEED_PERF_TIMING=1` of `NODE_ENV=development`.

Zonder env: geen header (by design).

### 4. Serialize bucket herordening

3B verwijdert `stats-preview` bucket uit feed critical path:

- `serialize` loopt nu `response_mapped` → `serialize_done` (niet meer via `stats_preview_done`)
- `toServerTimingHeader()` gebruikt `finalize: false` — buckets blijven geldig

---

## Nieuwe timing buckets (3B)

| Header bucket | Betekenis |
|---------------|-----------|
| `db-product` | Product findMany wall |
| `db-dish` | Dish findMany wall |
| `db-linked-media` | Linked dish media query |
| `stats-preview` | **Verwijderd uit feed** — eigen header op POST endpoint |

---

## Verificatie

1. Preview met `FEED_PERF_TIMING=1` → tier D → geen CDN HIT
2. DevTools → Network → `/api/feed` → Response Headers → `Server-Timing`
3. `POST /api/feed/stats-preview` → `Server-Timing: stats-preview;dur=…`

---

## Middleware

`middleware.ts` zet **geen** security headers op `/api/*` — geen stripping daar.

`getCorsHeaders()` zet default `Cache-Control: no-store` op API; feed overschrijft via `buildFeedResponseCacheHeaders()`.

---

## Risico

Tier A CDN cache blijft gewenst voor productie-performance; Server-Timing alleen betrouwbaar met tier D of dev.
