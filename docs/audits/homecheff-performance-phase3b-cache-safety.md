# Phase 3B — Feed Cache Safety

**Datum:** 2026-07-12

---

## Classificatie

| Tier | Wanneer | CDN | Cache-Control |
|------|---------|-----|---------------|
| **A** | Anoniem, national, geen q/filters/locatie/skip | **Ja** | `public, s-maxage=45, stale-while-revalidate=90` |
| **B** | Locatie: lat/lng, place, nearby scope | **Nee** | `private, max-age=0, must-revalidate` |
| **C** | User: session, follows, activity cards, discovery personalisatie, filters, paginatie | **Nee** | `private, no-store` |
| **D** | Diagnostiek: `FEED_PERF_TIMING`, `perfBust`, `_perf`, `debug=1` | **Nee** | `private, no-store, no-cache` |

Implementatie: `lib/feed/feed-cache-policy.ts` → `classifyFeedCachePolicy()`.

---

## Factor-analyse

| Factor | Beïnvloedt response? | Tier |
|--------|---------------------|------|
| Session / userId | Ja — follows, activity cards, eligibility | C |
| lat/lng / place | Ja — sorteer, bbox, discovery context | B |
| Favorites in feed JSON | Nee (counts via enrichment, user-agnostic pool) | — |
| Blocked users | Niet in feed route | — |
| Private producten | Uitgesloten via `isActive`/visibility | — |
| Paid inactive products | In pool via OR-clause | A/C afhankelijk van user |
| Eigen listings | Geen speciale feed variant | — |
| Discovery personalisatie | Ja bij userId (activity/surfaces) | C |
| Cookies | Impliciet via session | C → `Vary: Cookie` |

---

## Risico vóór 3B

`isPublicDefaultFeed` was te smal maar **correct voor tier A**. Probleem: **tier C requests** kregen soms geen expliciete `no-store` → CDN kon HIT geven met cookies aanwezig.

---

## 3B fix

- Elke request krijgt expliciete tier via `classifyFeedCachePolicy`
- Tier C/D: altijd `private, no-store`
- Tier D bij perf: voorkomt CDN HIT die `Server-Timing`/`debug.perf` maskeert
- `Vary: Origin` (+ `Cookie` voor B/C)

---

## Contract tests

`scripts/validate-feed-cache-safety-phase3b.ts` — 11 checks.

---

## Aanbevelingen

1. **Nooit** tier A cacheen wanneer `Cookie` header aanwezig is — overweeg Vercel `Vary: Cookie` op tier A (nu alleen Origin).
2. Monitor `x-vercel-cache` per tier in preview.
3. Geen `public` cache op responses met `discovery` activity_cards voor ingelogde users (tier C afgedekt).
