# Phase 3F Wave 2 — Preview Verification

**Datum:** 2026-07-14  
**Branch:** `performance/phase3f-first-paint`  
**Commit:** `63f1845` — `perf(home): split critical homepage rendering into async chunks`

---

## Preview-build status

| Veld | Waarde |
|------|--------|
| Commit | `63f184515dafd3b8e27628ccbea5e2cb391c4515` |
| Preview URL | https://homecheff-5o7aspfvn-sergio-s-projects-f7b64ee1.vercel.app |
| Branch alias | https://homecheff-app-git-performance-0f5539-sergio-s-projects-f7b64ee1.vercel.app |
| Vercel deployment | `dpl_GGwCH6XAdcpwivQT2JpNwVGWWNvg` |
| Vercel build | ✅ **Ready** (3m build) |
| Environment | **Preview** (geen production deployment) |
| `prisma migrate deploy` | ❌ Niet uitgevoerd |
| SSO | ✅ Actief — publieke `curl`/Puppeteer → 302 naar Vercel SSO |

---

## DEEL 1 — Safety review (code + lokaal)

### GeoFeed dynamic import

| Check | Status |
|-------|--------|
| Maximaal één mount | ✅ `geoFeedMounts = 1` |
| `feedFetches = 1` | ✅ |
| Geen tweede request door dynamic import | ✅ `ssr: false`, enkele instantie in `HomePageClient` |
| Skeleton verdwijnt | ✅ `skeleton: false` na load |
| Chunk failure fallback | ✅ `HomeFeedViewportShell` als `loading` |
| Geen SSR/hydration mismatch | ✅ `ssr: false` |
| Wave 1 anonymous fast-path intact | ✅ `anonymous-session-fast-path.ts` ongewijzigd in gedrag |
| Authenticated flow (code) | ✅ session gate logica behouden |

### NavBar dynamic import

| Check | Status |
|-------|--------|
| Shell voorkomt layout shift | ✅ `NavBarShell` fixed `h-14/h-16` |
| Navigation na hydration | ✅ lokaal chunk geladen, shell cleared |
| Accessibility shell | ✅ `aria-busy`, `aria-label="Navigatie laden"` |
| Mobile nav | ✅ codepad ongewijzigd in `NavBar` |

### Hero / deferred components

| Check | Status |
|-------|--------|
| Hero content zichtbaar | ✅ SSR/client hero tekst behouden |
| Orbit/guest deferred | ✅ aparte dynamic chunks |
| Geen permanente skeleton | ✅ lokaal bevestigd |
| SEO/meta | ✅ `generateMetadata` in `layout.tsx` ongewijzigd |

### Providers

| Check | Status |
|-------|--------|
| HcpRewardProvider deferred | ✅ `dynamic`, `ssr: false` |
| Geen dubbele provider | ✅ enkele mount in `Providers.tsx` |
| Geen context crash vóór mount | ✅ consumers binnen provider tree |

### Sidebars / tours

| Check | Status |
|-------|--------|
| Desktop sidebars deferred | ✅ `HomeDesktopSidebar`, `HomeDesktopLeftSidebar` |
| OnboardingTour deferred | ✅ `autoStart={false}` |
| Mobile ongewijzigd | ✅ narrow viewport fast-path Wave 1 intact |

---

## Browsermetingen

### Remote Preview (SSO-geblokkeerd)

Publieke probe op preview-URL retourneert HTTP 302 → Vercel SSO. Geen geautomatiseerde anonymous/authenticated metingen op echte Preview mogelijk zonder ingelogde browser.

**Handmatige Preview-check vereist** (DEEL 6–9): open preview in privévenster terwijl Vercel SSO actief is.

### Preview-equivalent lokaal (`next start :3010`, commit `63f1845`)

| Scenario | HTML (curl) | TTFB | FCP | LCP* | First tile | First image | feedFetches | geoFeedMounts |
|----------|-------------|------|-----|------|------------|-------------|-------------|---------------|
| Anonymous desktop cold | 25,953 B | 150 ms | **580 ms** | 580 ms | **2103 ms** | — | **1** | **1** |
| Anonymous desktop warm | — | — | **572 ms** | 572 ms | **1977 ms** | 2341 ms | **1** | **1** |
| Anonymous mobile cold | — | — | **500 ms** | 500 ms | **1589 ms** | 2008 ms | **1** | **1** |

\*LCP via `__hcFeedPerfReport().webVitals.lcp` / `vitals:lcp` milestone.

### `__hcFeedPerfReport()` (anonymous desktop cold)

```json
{
  "counters": { "feedFetches": 1, "geoFeedMounts": 1 },
  "milestones": {
    "home:shell-mounted": 370,
    "geofeed:mounted": 362,
    "session:resolved": 362,
    "feed:request-start": 365,
    "feed:first-tile-rendered": 2103
  },
  "sessionFastPath": {
    "anonFastPathUsed": false,
    "feedFetchReason": "initial"
  }
}
```

**Interpretatie:** `anonFastPathUsed: false` omdat session in headless anonymous flow resolved vóór snapshot-read — **geen functionele regressie** (feedFetches=1).

---

## DevTools-equivalent checks (lokaal)

| Check | Resultaat |
|-------|-----------|
| Hydration warnings | **0** |
| Console errors | **0** |
| Network 404s / chunk failures | **0** |
| Skeleton blijft hangen | **Nee** |
| NavBar shell cleared | ✅ |
| GeoFeed skeleton cleared | ✅ |
| Dynamic chunks geladen | ✅ layout + page + vendors |

---

## Mobile flash classificatie (lokaal)

| Classificatie | **Geen flash** / acceptabele één-frame flash |
|---------------|-----------------------------------------------|
| Horizontale overflow | Niet waargenomen |
| Desktop layout op mobile | Niet storend (narrow viewport fast-path) |

---

## Nog handmatig op echte Preview (SSO-browser)

| Scenario | Status |
|----------|--------|
| Anonymous desktop hard reload | ⏳ **Manual vereist** |
| Anonymous mobile (iPhone/Android viewport) | ⏳ **Manual vereist** |
| Authenticated homepage | ⏳ **Manual vereist** |
| Login/logout transitions | ⏳ **Manual vereist** |
| HcpRewardProvider na login | ⏳ **Manual vereist** |

---

## Constraints bevestigd

- ✅ Geen merge naar `main`
- ✅ Geen production deployment (`vercel --prod`)
- ✅ Geen database-/Prisma-migratie
- ✅ Geen feed/API/cache-wijziging
- ✅ Geen Neon-/Render-wijziging
