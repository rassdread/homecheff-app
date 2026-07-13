# Phase 3F — Anonymous First Paint Analysis

**Datum:** 2026-07-14  
**Baseline:** main @ `7575fae` (3E+ live)  
**Modus:** read-only onderzoek — geen code gewijzigd

---

## Doel

Eerste anonieme bezoeker ziet feed-content zo snel mogelijk, **zonder** DB-query-optimalisatie. Focus: cache, CDN, renderpad.

---

## Gemeten productiesituatie

| Scenario | Meting | Bron |
|----------|--------|------|
| Warm server p50 | **~2290 ms** | Handmatige prod `perfProbe` |
| Warm client p50 | **~2545 ms** | Idem |
| Cold client | **4680–5376 ms** | Idem |
| Tier A CDN **HIT** TTFB | **55–121 ms** (p50 ~62) | Geautomatiseerd prod, identieke URL |
| Tier A CDN **MISS** TTFB | **1788–4571 ms** | Geautomatiseerd prod, unieke URL |
| Homepage HTML download | **~4,25 MB**, total **3095–6028 ms** | `measure-homecheff-startup.mjs` cold |
| Feed JSON (Tier A) | **~32 KB** | Prod |

**Conclusie:** CDN werkt (Tier A HIT ≈ 60 ms). De **eerste MISS** en het **client renderpad** domineren cold UX.

---

## Kritiek renderpad (anonymous national, cold)

```text
1. GET /                    ISR shell + SSR inspiratie×24     (~4,2 MB HTML)
2. JS bundle download + parse + React hydrate
3. HomePageClient: viewport breakpoint resolve (skeleton)
4. NextAuth sessionStatus === 'loading'  → feedStartupBlocked
5. GeoFeed mount → fetch /api/feed?scope=national&radius=0&take=10
   └─ fetch(..., { cache: 'no-store' })   → geen browser HTTP cache
6. CDN MISS → origin full pipeline (~2–5 s TTFB)
7. JSON parse → setItems → first tile render
8. First image: priorityMedia eager; rest lazy
9. [idle] stats-preview, inspiratie refresh, discovery deferred parts
```

**Bestanden:** `app/page.tsx`, `components/home/HomePageClient.tsx`, `components/feed/GeoFeed.tsx`

---

## Wat blokkeert “content zonder origin-render”?

| Blok | Impact | Contract-safe fix richting |
|------|--------|---------------------------|
| CDN MISS op cold edge | Hoog | Origin cache + CDN warm; Tier A URL stabiliteit |
| Client `cache: 'no-store'` | Medium | Browser cache niet gebruikt; edge CDN blijft wel werken |
| Session gate vóór fetch | Medium | Anonieme fast-path zonder session wait (parity check) |
| Viewport resolve gate | Laag–medium | SSR feed skeleton of vaste layout zonder breakpoint wait |
| 4,2 MB homepage HTML | Hoog (LCP) | Defer inspiratie SSR; code-split |
| Tier B bij national+lat/lng | Hoog (ingelogd/profiel) | Tier A uitbreiden als response identiek (zie cache-matrix) |
| Geen origin `unstable_cache` | Hoog op MISS | Tier A core 45 s (Next.js Data Cache) |

---

## First Paint / LCP componenten

| Fase | Geschatte bijdrage cold | Meetbaar via |
|------|-------------------------|--------------|
| HTML TTFB | ~240–300 ms | Startup script |
| HTML body (4,2 MB) | **2–6 s** download | responseBytes |
| Hydration + viewport | ~100–400 ms | `feed-performance-baseline` marks |
| Session resolve | ~50–200 ms | `feedStartupBlocked` |
| Feed API (MISS) | **~2–5 s** | TTFB prod |
| Feed API (HIT) | **~60 ms** | `x-vercel-cache: HIT` |
| First tile LCP (image) | +200–800 ms na JSON | browser Performance API |

**Niet gemeten in CI:** browser FP/LCP — vereist handmatige Lighthouse of RUM op desktop.

---

## Officiële documentatie (relevant)

- **Vercel Edge Cache:** `Cache-Control: s-maxage` + `stale-while-revalidate`; client krijgt `max-age=0, must-revalidate` wanneer CDN cache actief ([Vercel Response headers](https://vercel.com/docs/headers/response-headers)).
- **Next.js `unstable_cache`:** cache DB-werk buiten `fetch`; `revalidate` + `tags` voor invalidatie ([Next.js docs](https://nextjs.org/docs/app/api-reference/functions/unstable_cache)).
- **`force-dynamic` op route:** blokkeert Next Data Cache route segment, **niet** per se Vercel CDN — bevestigd door prod HIT met Tier A headers.

---

## Prioriteit 1 — aanbevelingen (onderzoek, geen implementatie)

1. **Maximaliseer Tier A CDN hits** — stabiele URL, geen onnodige query-params, fix national+coords tier (zie cache-matrix).
2. **Origin `unstable_cache` Tier A** — MISS → ~200–800 ms i.p.v. volledige pipeline (schatting op basis warm origin ~1900 ms).
3. **Client fast-path anonymous** — start feed fetch parallel aan session wanneer geen cookie.
4. **Homepage payload** — inspiratie SSR uit critical path (revalidate shell blijft).
5. **Streaming shell** — feed skeleton in HTML vóór JS (optioneel, hogere complexiteit).

---

## Verwachting na Phase 3F-implementatie (conservatief)

| Metriek | Nu (cold) | Na 3F (schatting) |
|---------|-----------|-------------------|
| Feed TTFB anonymous (CDN HIT) | ~60 ms | ~50–80 ms |
| Feed TTFB anonymous (CDN MISS + origin cache) | ~2500 ms | **~400–900 ms** |
| Feed TTFB anonymous (volledige cold instance) | ~4700 ms | **~1500–2500 ms** |
| Client cold tot first tile | ~5000 ms | **~2000–3500 ms** |
| Warm server p50 | ~2290 ms | ~1800–2200 ms (marginale winst) |

Warm blijft grotendeels origin-bound; 3F wint vooral op **cold/first visitor**.
