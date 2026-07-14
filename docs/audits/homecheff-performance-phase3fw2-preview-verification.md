# Phase 3F Wave 2 — Preview Verification

**Datum:** 2026-07-14  
**Branch:** `performance/phase3f-first-paint`  
**Modus:** verificatie only — geen commit/push/deploy

---

## Preview-build status

| Veld | Waarde |
|------|--------|
| Remote preview commit | `d19b107` (**Wave 1 only**) |
| Remote preview URL | https://homecheff-psnrhvz2y-sergio-s-projects-f7b64ee1.vercel.app |
| Vercel build | ✅ Ready |
| Wave 2 op preview | ❌ **Niet deployed** (Wave 2 uncommitted) |
| SSO | Preview URL SSO-beschermd — geautomatiseerde remote probe geblokkeerd |

**Preview-equivalent:** lokaal `NEXT_PUBLIC_FEED_PERF_BASELINE=1 npm run build && npm start -p 3010` met Wave 2 working tree.

---

## Browsermetingen (Puppeteer + Chrome, anonymous)

| Scenario | FCP | First tile | First image | feedFetches | geoFeedMounts |
|----------|-----|------------|-------------|-------------|---------------|
| Desktop cold | **732 ms** | 2247 ms | 2470 ms | **1** | **1** |
| Desktop warm | **528 ms** | 2036 ms | 2313 ms | **1** | **1** |
| Mobile cold | **460 ms** | 1826 ms | 2230 ms | **1** | **1** |

| Metric | Desktop cold | Opmerking |
|--------|--------------|-----------|
| First Paint | 732 ms | = FCP |
| LCP | n.v.t. | PerformanceObserver LCP niet vastgelegd in headless snapshot |
| App usable | n.v.t. | `app:usable` idle mark niet in snapshot |
| DOMContentLoaded | 88 ms | |
| Load event | 169 ms | |

---

## `__hcFeedPerfReport()` (anonymous desktop)

```json
{
  "counters": { "feedFetches": 1, "geoFeedMounts": 1 },
  "sessionFastPath": {
    "anonFastPathUsed": false,
    "sessionGateBypassed": false,
    "sessionResolvedBeforeFetch": false,
    "feedFetchReason": "initial"
  },
  "milestones": {
    "geofeed:mounted": 464,
    "session:resolved": 464,
    "feed:request-start": 466
  }
}
```

**Interpretatie:** Session resolved en feed-fetch start vrijwel gelijktijdig (2 ms). In headless anonymous flow is `sessionStatus === 'loading'` te kort om `anonFastPathUsed` te flaggen — **geen functionele regressie** (feedFetches=1, geen dubbele fetch).

---

## DevTools-equivalent checks

| Check | Resultaat |
|-------|-----------|
| Hydration warnings | **0** |
| Console errors | **0** |
| Network 404s | **0** |
| Missing chunks | **0** |
| Skeleton blijft hangen | **Nee** (nav + feed shell cleared) |
| Dynamic chunks geladen | **18–24** async chunks (layout, page, common, vendors, numbered splits) |
| NavBar lazy | ✅ `layout-*.js` + geen nav-shell na load |
| GeoFeed dynamic | ✅ `page-*.js` + feed tiles na skeleton |
| Hero lazy | ✅ orbit/guest in aparte chunks |
| RSC prefetch abort | 1× `ERR_ABORTED` op product `_rsc` (normaal Next prefetch) |

---

## Niet getest (manual vereist)

| Scenario | Reden |
|----------|-------|
| Ingelogde gebruiker | Geen test-credentials in geautomatiseerde probe |
| Login/logout overgang | Manual op preview na Wave 2 deploy |
| Vercel preview Wave 2 | Wave 2 niet gepusht |
| LCP / CLS exact | Headless snapshot beperkt; manual DevTools Performance |

---

## Besluit

| | |
|--|--|
| **Lokaal Wave 2** | **GROEN** — FCP 460–732ms, feedFetches=1, geoFeedMounts=1, geen errors |
| **Remote preview Wave 2** | **HOLD** — niet deployed; SSO blokkeert remote |
| **Logged-in flow** | **HOLD** — manual vereist |

---

## Constraints bevestigd

- ❌ Geen commit, push, merge, deploy
- ❌ Geen database-/Prisma-wijzigingen
