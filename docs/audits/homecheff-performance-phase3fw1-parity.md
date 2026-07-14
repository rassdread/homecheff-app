# Phase 3F Wave 1 — Functional Parity Checklist

**Branch:** `performance/phase3f-first-paint`  
**Date:** 2026-07-14

---

## Homepage (static + architecture review)

| Check | Status | Notes |
|-------|--------|-------|
| Feed visible | ✅ | GeoFeed mounts immediately; deferred inspiratie unchanged |
| Inspiratie later visible | ✅ | `/api/inspiratie` post-`feedHydrated` |
| Nav works | ✅ | No NavBar changes |
| Filters work | ✅ | GeoFeed filter state preserved |
| Location/radius | ✅ | No geo API changes |
| Desktop 1 column default | ✅ | `narrow: false` SSR default |
| Mobile layout | ⚠️ | Brief desktop-first frame until `useLayoutEffect` syncs narrow; CSS `lg:hidden` on mobile chrome |

---

## Auth

| Check | Status | Notes |
|-------|--------|-------|
| Anonymous visit | ✅ | SSR `ssrAuthHint=anonymous` → fast path |
| Logged-in user | ✅ | SSR `authenticated` → session gate preserved |
| Login from homepage | ⚠️ | Manual verify recommended |
| Logout → anonymous | ⚠️ | Manual verify recommended |
| Session refresh | ✅ | No SessionProvider changes |
| Expired session | ✅ | Conservative `undefined` hint on SSR error |

---

## Feed

| Check | Status |
|-------|--------|
| feedFetches = 1 | ✅ |
| geoFeedMounts = 1 | ✅ |
| No double anon/auth fetch | ✅ (effect deps exclude sessionStatus) |
| National CDN Tier A | ✅ unchanged |
| Logged-in Tier C private/no-store | ✅ unchanged |
| Coords parity | ✅ unchanged |
| Stats defer | ✅ unchanged |
| Trust/media/listings | ✅ unchanged |

---

## Inspiratie

| Check | Status |
|-------|--------|
| No SSR payload on `/` | ✅ |
| `/inspiratie` intact | ✅ (route untouched) |
| Deferred loading | ✅ |
| No duplicate inspiratie fetch | ✅ (keyed by category/q) |

---

## Validators

All Phase 3A–3D, Wave 1, 13K: **pass**  
Phase 13L: **33/34** (4 pre-existing inline data URLs — non-blocking)
