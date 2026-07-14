# Phase 3F.6 — Homepage HTML Reduction

**Branch:** `performance/phase3f-first-paint`  
**Modus:** ~~read-only~~ → **Wave 1 implemented** (see `homecheff-performance-phase3f6-html-reduction-implementation.md`)

---

## Gemeten productie (2026-07-14)

| Metric | Waarde |
|--------|--------|
| Homepage HTML bytes | **4.247.724** (~4,25 MB) |
| TTFB | **777 ms** |
| Total download | **6,47 s** (cold) |
| RSC `__next_f.push` chunks | **56** |
| `<script>` tags | **71** |
| `rel=preload` links | **3** |
| Blob photo URLs embedded | **82** |

Ter vergelijking: `/api/feed` JSON ≈ **32 KB** (CDN HIT ~111 ms).

---

## Root cause: SSR inspiratie payload

**`app/page.tsx` L67:**

```typescript
const res = await getInspiratieItems({ take: 24, skip: 0, sortBy: 'newest' });
```

**`lib/getInspiratieItems.ts`** haalt per item op:
- Dish metadata + user profile
- Photos (full blob URLs)
- Videos (url + thumbnail)
- Trust bundles (`fetchSellerTrustBundles`)
- Badge summaries
- Analytics aggregates (views, props, reviews)

Dit wordt geserialiseerd als `initialInspiratieItems` → `HomePageClient` → `GeoFeed` state.

**Kritiek:** SSR inspiratie wordt **niet getoond** vóór feed hydration. GeoFeed toont skeleton tot `/api/feed` completes (`showFeedSkeleton = loading && !feedHydrated`, GeoFeed L3748).

→ **4,25 MB HTML zonder first-paint voordeel.**

---

## Payload breakdown (geschat)

| Component | Geschat % HTML | Bron |
|-----------|----------------|------|
| Inspiratie 24× (photos, user, discovery) | **~85–90%** | RSC props |
| Next.js runtime + RSC flight | ~5–8% | 56 push chunks |
| Layout chrome (NavBar SSR parts) | ~2–5% | `app/layout.tsx` |
| Capacitor detector script | <0,1% | layout L175 |

---

## Onnodige serialized state (audit)

| State | Nodig voor first paint? | Actie |
|-------|-------------------------|-------|
| `initialInspiratieItems` (24 full items) | **Nee** | Defer → client fetch na feedHydrated (al gedeeltelijk L2009+) |
| Trust/badge op inspiratie SSR | **Nee** | Strip from SSR; lazy per tile |
| Full photo URLs in SSR | **Nee** | IDs only of lazy |
| `initialFeedChip/Category/Place` | Ja (deep links) | Behouden (~bytes) |
| Session in HTML | **Nee** | Al client-only ✅ |

---

## Script & preload audit

| Item | Count | Critical? |
|------|-------|-----------|
| Next.js chunks (nextjs + vendors + common) | 3 shared + page | Ja — maar te groot |
| Dynamic `ssr:false` scripts | ~15 in layout | **Nee** — al deferred ✅ |
| Font preloads | 3 | Review — mogelijk render-block |
| Third-party analytics | Consent-gated | OK |

---

## Client JS (related to HTML parse time)

Homepage route chunks (build @ main):

| Chunk | Size (raw) |
|-------|------------|
| `vendors-*.js` | **1.507 KB** |
| `common-*.js` (includes GeoFeed) | **1.230 KB** |
| `nextjs-*.js` | **917 KB** |
| `app/page-*.js` | **220 KB** |
| First Load JS (shared, gzip est.) | **637 KB** |

GeoFeed + marketplace tiles zitten in `common` chunk — niet code-split.

---

## Voorgestelde reducties (implementatie)

### P0 — GO (~4 MB HTML win)

1. **Remove inspiratie SSR from `app/page.tsx`** — return empty `initialInspiratieItems=[]`.
2. **Keep ISR shell** — `revalidate=60` voor statische hero/layout.
3. **Client inspiratie fetch** — already exists post-hydration; enable earlier alleen na feed tiles.

### P1 — GO (~200–500 KB SSR win)

4. **Split deep-link props** — minimal searchParams serialization.
5. **Trust/badge lazy** — no SSR enrichment for homepage.

### P2 — ORANJE

6. **Streaming RSC** — stream hero first, defer feed shell.
7. **Move photos to `/api/inspiratie` only** — never inline blob URLs in HTML.

---

## Verwachte winst

| Metric | Nu | Na P0 | Δ |
|--------|-----|-------|---|
| HTML bytes | 4,25 MB | **~150–400 KB** | **~90%** |
| HTML download | 2–6 s | **~200–800 ms** | **~70–85%** |
| SSR TTFB | ~777 ms | **~150–300 ms** | **~60–80%** (geen Prisma in page) |
| First tile | unchanged API path | +200–500 ms earlier effective paint | Combined with 3F.5 |

**Geen functionaliteit verwijderd** — inspiratie verschijnt na feed hydrate (huidige UX) of kort erna via deferred fetch.

---

## GO/HOLD

| Maatregel | Besluit |
|-----------|---------|
| Remove SSR inspiratie×24 | **GO** |
| ISR shell behouden | **GO** |
| Inline blob URLs elimineren | **GO** |
| Feed contract wijzigen | **HOLD** — geen API changes |
| Prisma in page.tsx | **GO remove** (defer to client) |

---

## Risico's

- Inspiratie tiles in mixed feed iets later (was al na feed hydrate)
- SEO: inspiratie content niet in initial HTML — mitigatie via `/inspiratie` route (bestaat)
- Deep-link chip/category blijft werken via URL params
