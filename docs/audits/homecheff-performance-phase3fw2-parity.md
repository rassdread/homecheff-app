# Phase 3F Wave 2 — Functional Parity

**Date:** 2026-07-14

---

## GeoFeed dynamic

| Check | Status |
|-------|--------|
| Single mount | ✅ `geoFeedMounts = 1` |
| Single fetch | ✅ `feedFetches = 1` |
| Skeleton clears | ✅ local probe |
| Wave 1 anonymous fast-path | ✅ code preserved |
| SSR/hydration | ✅ `ssr: false` on GeoFeed |

---

## NavBar dynamic

| Check | Status |
|-------|--------|
| Shell prevents CLS | ✅ fixed h-14/h-16 |
| Nav loads after chunk | ✅ local probe |
| Accessibility shell | ✅ `aria-busy` |

---

## Hero / providers / sidebars

| Check | Status |
|-------|--------|
| Hero text visible (SSR/client) | ✅ |
| Orbit/guest deferred | ✅ separate chunks |
| HcpRewardProvider deferred | ✅ dynamic, no crash |
| Desktop sidebars deferred | ✅ dynamic |
| OnboardingTour deferred | ✅ `autoStart={false}` |

---

## Manual preview (post-push @ `63f1845`)

| Check | Status |
|-------|--------|
| Preview build Ready | ✅ https://homecheff-5o7aspfvn-sergio-s-projects-f7b64ee1.vercel.app |
| Anonymous desktop (preview) | ⏳ SSO manual browser |
| Anonymous mobile (preview) | ⏳ SSO manual browser |
| Authenticated (preview) | ⏳ SSO manual login |
| Login/logout (preview) | ⏳ SSO manual |
| Local equiv. anonymous | ✅ feedFetches=1, geoFeedMounts=1, 0 errors |
