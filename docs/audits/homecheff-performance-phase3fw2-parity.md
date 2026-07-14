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

## Manual preview (post-push)

| Check | Status |
|-------|--------|
| Anonymous desktop | Pending SSO browser |
| Anonymous mobile | Pending SSO browser |
| Authenticated | Pending manual login |
| Login/logout | Pending manual |
