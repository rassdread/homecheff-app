# Phase 3F — CDN Strategy

**Datum:** 2026-07-14  
**Modus:** read-only onderzoek

---

## Huidige staat (productie @ `7575fae`)

### Tier A — anonieme national feed

**Classificatie:** `lib/feed/feed-cache-policy.ts`

```http
Cache-Control: public, s-maxage=45, stale-while-revalidate=90
Vary: Origin
X-Feed-Cache-Tier: A
```

**Gemeten op https://homecheff.eu (2026-07-14):**

| Request | x-vercel-cache | TTFB |
|---------|----------------|------|
| Identieke URL ×8 | **HIT** (age 23–27) | **55–121 ms** |
| Unieke bust-param | MISS | 1788–4571 ms |
| national + lat/lng | MISS (Tier B) | ~2969 ms |

**Bevestiging:** Vercel Edge Cache werkt voor Tier A. Probleem is **MISS-rate**, niet ontbrekende headers.

---

## Vercel header-lagen (officieel)

Per [Vercel Cache-Control docs](https://vercel.com/docs/headers/cache-control-headers):

| Header | Doel |
|--------|------|
| `Cache-Control` | Fallback voor browser + CDN |
| `CDN-Cache-Control` | Alle CDNs, browser apart |
| `Vercel-CDN-Cache-Control` | Alleen Vercel Edge |

**Aanbeveling 3F:** Tier A scheiden:

```http
Cache-Control: public, max-age=0, must-revalidate
Vercel-CDN-Cache-Control: public, s-maxage=45, stale-while-revalidate=90
```

Voorkomt dat `stale-while-revalidate` browsergedrag beïnvloedt (cf. Next.js PR #86554). **Geen contractwijziging** aan JSON-body.

---

## Wat CDN níet cached

| Conditie | Tier | Reden |
|----------|------|-------|
| Ingelogde sessie | C | Personalisatie, discovery |
| Filters / zoek / skip>0 | C | Unieke responses |
| lat/lng of place | B | Locatie-afhankelijk (zie nuance) |
| perfProbe / perfBust | D | Diagnostiek |
| Auth cookies op Tier C | — | `Vary: Cookie` |

---

## Tier B nuance — national + coords

**Feit:** `buildGeoFeedApiParams` stuurt lat/lng op national voor **afstandslabels** (`feed-query-params.ts` L61–63). Server filtert **niet** op bbox bij `radius=0` + national. `distanceKm` wordt **client-side** berekend (`GeoFeed.tsx`).

**Gemeten:** national+lat/lng → Tier B → **geen CDN** (~3 s TTFB vs ~60 ms HIT).

**3F-voorstel (GO na parity-test):** Tier A wanneer `scope=national`, `radius=0`, geen place, geen filters — **ook met lat/lng**. Response-body parity validator verplicht.

**Risico:** Laag–medium als server toch viewerGeo gebruikt in discovery/trust op national (audit route transform).

---

## Media CDN (apart van feed JSON)

`/api/feed/media` inline data:

```http
public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400
```

Feed JSON (~32 KB) vs media (CDN 7 d) — first paint hangt aan **eerste tile image URL**, niet feed JSON cache alleen.

---

## Invalidatie-strategie (voorstel)

| Event | Actie |
|-------|--------|
| Nieuw product/dish publish | `revalidateTag('feed-national-v1')` |
| Tier A TTL | 45 s natuurlijke expiry |
| Deploy | Vercel SWR regenereert achtergrond |
| Admin content fix | Tag invalidation |

Vereist origin `unstable_cache` + publish hooks — **Phase 3F implementatie**, niet nu.

---

## CDN warm houden (operationeel)

| Maatregel | Winst | Risico |
|-----------|-------|--------|
| Vercel Cron GET `/api/feed?scope=national&radius=0&take=10` elke 30 s | Edge HIT voor echte users | Kosten, synthetic traffic |
| Langere `s-maxage` (60–120 s) | Minder MISS | Stale tiles max TTL |

**GO:** Cron warm Tier A (monitoring). **HOLD:** TTL >90 s zonder tag invalidation.

---

## Verwachte CDN-impact

| Scenario | Nu | Na header-split + Tier A fix |
|----------|-----|------------------------------|
| Anoniem national zonder GPS | HIT ~60 ms na warm edge | Zelfde |
| Anoniem national mét profiel-coords | ~3000 ms (Tier B) | **~60 ms HIT** |
| CDN MISS + origin cache | ~2500 ms | **~400–900 ms** |
