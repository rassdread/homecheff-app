# Phase 3E+ — Anonymous first-page cache (voorstel)

**Datum:** 2026-07-13  
**Scope:** alleen onderzoek + voorstel — **niet geïmplementeerd** in 3E+

---

## Doelgroep (strikt)

| Criterium | Vereist |
|-----------|---------|
| `scope=national` | ✅ |
| `radius=0` | ✅ |
| Niet ingelogd | ✅ |
| Eerste pagina (`skip=0`, default `take`) | ✅ |
| Geen `q`, filters, vertical, place, lat/lng | ✅ |

**Nooit** voor: sessie, radius, locatie, filters, zoekopdrachten, `skip>0`, `perfProbe`, `debug`.

---

## Huidige situatie (Phase 3B/3E)

`lib/feed/feed-cache-policy.ts` classificeert anonymous default national als **Tier A**:

```text
Cache-Control: public, s-maxage=45, stale-while-revalidate=90
cdnAllowed: true
X-Feed-Cache-Tier: A
```

**CDN Tier A bestaat al** (45 s edge TTL). Dit dekt edge HIT/MISS; origin wordt nog per MISS volledig uitgerekend.

---

## Voorstel A — Origin `unstable_cache` (aanbevolen)

**Waar:** `app/api/feed/route.ts` — cache-key rond DB+transform fase, vóór trust/discovery personalisatie.

```typescript
// Pseudocode — alleen Tier A
const cacheKey = ['feed-national-v1', productCap, dishCap];
const cachedCore = await unstable_cache(
  () => buildAnonymousNationalFeedCore(params),
  cacheKey,
  { revalidate: 45, tags: ['feed-national'] }
);
```

| Parameter | Waarde |
|-----------|--------|
| TTL | **45 s** (align met Tier A `s-maxage`) |
| Tags | `feed-national` voor invalidatie bij publish |
| Inhoud | product+dish+listing candidates **vóór** viewer-specifieke trust |

**Voordeel:** origin HIT bij CDN MISS binnen 45 s; geen contractwijziging aan client.

**Risico:** stale tiles max 45 s — acceptabel voor anonymous national (bestaand CDN-gedrag).

---

## Voorstel B — Korte in-process LRU (fallback)

Als `unstable_cache` op serverless cold start niet deelt:

- Module-level `Map` met `{ key, expiresAt, payload }`
- TTL **30 s**
- Alleen Tier A keys
- Max 1 entry (national default)

**Nadeel:** geen cross-instance HIT op Vercel; beperkte winst.

---

## Voorstel C — CDN alleen (status quo)

Tier A 45 s is al actief. Meting op 3E preview toonde nog **~3234 ms server warm** — CDN helpt client, niet origin compute bij MISS.

**Conclusie:** origin-cache (A) nodig voor structurele origin-latency, niet alleen CDN.

---

## Meetplan (na implementatie)

| Scenario | Verwachting |
|----------|-------------|
| Origin MISS (cold) | baseline server ms |
| Origin HIT (`unstable_cache`) | −40–70% DB-fase |
| CDN HIT | client ≈ edge RTT |
| `perfProbe=1` | Tier **D**, no-store — geen cache |

Headers te loggen: `x-vercel-cache`, `X-Feed-Cache-Tier`, custom `X-Feed-Origin-Cache: HIT|MISS`.

---

## Cache safety validators

Bestaand: `scripts/validate-feed-cache-safety-phase3b.ts` — Tier B/C/D blijven `no-store`.

3E+ wijziging: **geen** cache-logica aangepast; validators ongewijzigd groen.

---

## Aanbeveling 3E+

1. **Merge 3E+ IDs-first eerst** — structurele DB-pipeline.
2. **Tier A origin cache in 3F** — als Vercel preview na 3E+ nog >2000 ms server warm.
3. TTL **45 s** (niet 60) om gelijk te lopen met CDN-semantiek.

**Status:** voorstel only — niet uitgevoerd in deze fase.
