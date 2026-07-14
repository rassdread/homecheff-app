# Phase 3F Wave 2 — Critical Render Path Implementation

**Branch:** `performance/phase3f-first-paint` (uncommitted)  
**Baseline:** Wave 1 @ `d19b107`

---

## Bottleneck ranking (pre-Wave 2)

| # | Bottleneck | Cause | Expected win |
|---|------------|-------|--------------|
| 1 | **GeoFeed** (~4.3k LOC in common chunk) | Static import in HomePageClient | Defer parse/hydration; skeleton first paint |
| 2 | **NavBar** (~1k LOC, static layout import) | Eager in `app/layout.tsx` | ~100–200ms parse deferral |
| 3 | **Hero orbit + guest panels** | Desktop visual + GuestSalesInfoPanel | Smaller initial hero JS |
| 4 | **Homepage sidebars / tours** | Desktop sidebars, OnboardingTour | Deferred async chunks |
| 5 | **HcpRewardProvider** | Gamification fetch on provider mount | Idle defer for anonymous |

---

## Changes

| File | Change |
|------|--------|
| `components/home/HomeGeoFeedDynamic.tsx` | **new** — `dynamic(GeoFeed)` + `HomeFeedViewportShell` |
| `components/home/HomePageClient.tsx` | Split imports; deferred sidebars/tours |
| `app/layout.tsx` | `dynamic(NavBar)` + `NavBarShell` |
| `components/navigation/NavBarShell.tsx` | **new** — nav skeleton |
| `components/home/HomeHeroSection.tsx` | Deferred visual + guest panel |
| `components/home/HomeHeroVisualCluster.tsx` | **new** — extracted orbit visual |
| `components/Providers.tsx` | `dynamic(HcpRewardProvider)` |

---

## Measured (local `next build` + `next start`)

| Metric | Wave 1 (before) | Wave 2 (after) | Δ |
|--------|-----------------|----------------|----|
| Homepage HTML | 146,275 B | **25,869 B** | **-82%** |
| Homepage server `page.js` | 206 KB | **35 KB** | **-83%** |
| Common chunk (raw) | 1,202 KB | 1,368 KB | +166 KB* |
| First Load JS shared | 637 KB | 637 KB | 0 |
| TTFB (local) | ~289 ms | ~199 ms | -90 ms |

\* Common chunk grew slightly (dynamic import graph); GeoFeed execution is **deferred** (`ssr: false`) so critical-path **parse/hydration** is reduced even when shared vendors load.

---

## Async chunks created (react-loadable)

- `HomeHeroVisualCluster` → dedicated chunk (~6444)
- `GuestSalesInfoPanel` → chunk (~8739)
- `HomeMobileEcosystemStrip` → chunk (~1748)
- `PostAuthPersonaBanner` → chunk (~8382)
- GeoFeed via `HomeGeoFeedDynamic` → deferred load boundary

---

## Invariants

- `feedFetches = 1` — preserved
- `geoFeedMounts = 1` — preserved
- Wave 1 session/viewport fast-paths — preserved
- No feed/API/cache/DB changes

---

## Validator

`npx tsx scripts/validate-homepage-critical-render-path-phase3fw2.ts`
