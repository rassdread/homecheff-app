# Phase 3F — Edge Strategy

**Datum:** 2026-07-14  
**Modus:** read-only onderzoek

---

## Strategische keuze

Phase 3F gebruikt **bestaande Vercel Edge + Next.js Data Cache** — geen nieuwe edge runtime voor businesslogica (contract/trust/Stripe blijven origin).

Drie lagen:

```text
┌─────────────────────────────────────────────────────────┐
│ 1. Vercel Edge CDN (Tier A JSON, media 7d)              │
│    HIT → ~60 ms TTFB (gemeten)                          │
├─────────────────────────────────────────────────────────┤
│ 2. Next.js Data Cache (unstable_cache — voorstel)       │
│    Origin MISS → cached core ~45s                       │
├─────────────────────────────────────────────────────────┤
│ 3. Origin serverless (huidige feed route)               │
│    Full pipeline ~1900–4700 ms                          │
└─────────────────────────────────────────────────────────┘
```

---

## Optie A — CDN-only (status quo+)

**Huidig:** Tier A `s-maxage=45, stale-while-revalidate=90`.

| Pro | Con |
|-----|-----|
| Al live, gemeten HIT | MISS = volledige origin |
| Geen code | Tier B blokkeert GPS/profiel users |
| Contract-safe | Cold instance elke MISS |

**GO:** behouden + header-split + Tier A fix.

---

## Optie B — Origin `unstable_cache` (aanbevolen)

Per [Next.js unstable_cache](https://nextjs.org/docs/app/api-reference/functions/unstable_cache):

```text
Tier A request →
  unstable_cache(buildAnonymousNationalCore, ['feed-national-v1', take], { revalidate: 45, tags: ['feed-national-v1'] })
  → trust/discovery alleen als nodig (Tier C blijft uncached)
```

| Pro | Con |
|-----|-----|
| Cross-instance origin cache | Invalidation hooks nodig |
| 45s aligned met CDN | Session/cookies buiten cache scope |
| Geen schema change | Testen op preview verplicht |

**Cache scope:** alleen anonieme national page-1 **zonder** userId — input expliciet als args, geen `headers()`/`cookies()` inside cache.

**GO:** Phase 3F implementatie #1 na Tier A fix.

---

## Optie C — Edge Middleware rewrite (HOLD)

Middleware serveert cached response vóór origin.

| Pro | Con |
|-----|-----|
| Zeer lage latency | Duplicatie cache logic |
| | Middleware size limits |
| | Parity risico |

**HOLD** — Vercel CDN + unstable_cache volstaat.

---

## Optie D — Pre-render / ISR feed JSON (HOLD)

Static generation van feed snapshot.

| Pro | Con |
|-----|-----|
| PRERENDER status | Stale bij elke publish |
| | Filter/variants explosie |
| | Contract drift |

**HOLD** — dynamic inventory past niet in static paths.

---

## Optie E — RSC payload cache homepage (ORANJE)

Homepage `revalidate = 60` cached al shell; feed blijft client fetch.

**Voorstel:** SSR **feed skeleton + optional embedded stale snapshot** in RSC voor LCP placeholder — tiles zonder volledige interactie.

| Winst | Risico |
|-------|--------|
| LCP −500–1500 ms | Hydration mismatch |
| | Dubbele fetch als niet careful |

**ORANJE** — alleen na CDN+origin cache; apart spike.

---

## Edge + client coördinatie

| Client gedrag | Edge effect | 3F actie |
|---------------|-------------|----------|
| `fetch(..., { cache: 'no-store' })` | Edge CDN unaffected | Optioneel: `cache: 'default'` Tier A |
| Session wait vóór fetch | Vertraagt HIT | Anon fast-path |
| GPS → Tier B URL | Geen edge | Tier A fix |
| Return cache 60s | Tab-only | Behouden |

---

## Invalidation architectuur (voorstel)

```text
publish product/dish/listing
  → revalidateTag('feed-national-v1')
  → optional: purge Vercel edge via tag (Next 15 cache tags)

Cron warm (optional)
  → GET Tier A URL every 30s per region
```

---

## Implementatievolgorde edge

1. Tier A national+coords parity + header split  
2. `unstable_cache` core + publish tags  
3. Anonymous session fast-path  
4. Cron warm (monitoring)  
5. RSC skeleton spike (optional)

---

## Verwachting

| Pad | Latency |
|-----|---------|
| Edge HIT | **~60 ms** |
| Edge MISS + Data Cache HIT | **~400–900 ms** |
| Full origin cold | **~2500–3500 ms** (was ~4700) |

Warm server **~2290 ms** → **~1800–2100 ms** (marginale); cold client **~5000 ms** → **~2500–3500 ms** (primair doel).
