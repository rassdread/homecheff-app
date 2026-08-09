# HOMECHEFF ORIGINAL FEED UX — FINAL REPORT

**Date:** 2026-08-09  
**Branch:** `fix/restore-original-feed-ux`  
**PR:** https://github.com/rassdread/homecheff-app/pull/10  

## Required fields

| # | Field | Result |
|---|--------|--------|
| 1 | Exact last-known-good feed commit | `5d500f3d2e7070b311caea1af768ee9110ce1aac` |
| 2 | Exact last-known-good CTA commit/state | `5d500f3d` (CTA modules unchanged through HEAD; inserts already present) |
| 3 | Infinite-scroll known-good commit/state | `5d500f3d` (composition milestone `062e94f0` / `7887df17`) |
| 4 | Commit that removed/changed CTA | **None** — CTA source never removed; primary-pool regression `d70f8cf6` |
| 5 | Files restored | `components/feed/GeoFeed.tsx` (progressive Nearby primary pool + `progressiveWidenActive`) |
| 6 | Files intentionally NOT restored | Whole tree at `5d500f3d`; public-routes/media/SSO; pre-public href builders |
| 7 | Later safety fixes preserved | Instant radius apply; broadened discovery; search context; `getFeedItemHref` / public-hrefs; listing/profile RSC; media auth |
| 8 | CTA types restored | verticals, pulse, promo:android-beta, promo:affiliate-12-12, share, promo:werken-bij (+ activity/exchange/growth when eligible) |
| 9 | CTA insertion intervals | after indices 1 / 3 / 4 / 7 / 8 / 11 / 12 (mobile) |
| 10 | Initial feed item count | ~11 unique listing hrefs (page take 10 + mix) |
| 11 | Page-2 result | unique grew (Chromium/WebKit mobile & desktop → mid-20s) |
| 12 | Page-3 result | continued growth / stable inventory (25 unique after 2 scrolls in post-deploy probe) |
| 13 | Infinite-scroll result | **PASS** (11 → 25 unique hrefs) |
| 14 | Duplicate-item result | **PASS** for listing ids in scroll probes; note: CTA inserts can appear twice when continuity path also renders grid nodes |
| 15 | Missing-item result | Progressive primary pool restored so wider eligible sales are not local-only |
| 16 | ON_REQUEST result | Contract tests PASS (`/product/` not forced to `/recipe/` by price) |
| 17 | Genuine Dish result | Contract tests PASS; live `/recipe/...` opens logged-out |
| 18 | Chromium desktop visual | Infinite scroll **PASS**; mobile-only inserts absent (historical) |
| 19 | Chromium mobile visual | CTA inserts **PASS** + infinite scroll **PASS** |
| 20 | WebKit visual | CTA inserts **PASS** + infinite scroll **PASS** |
| 21 | Feed→listing regression | **PASS** (product/recipe/design open; no login wall) |
| 22 | Listing performance result | Not re-benchmarked this run; public-routes perf commits preserved (no revert) |
| 23 | Commit SHA | `c98ff811254c66937ae27815ba704df12aff8e75` |
| 24 | Production deployment ID | `dpl_GTqWu3BzAS9NL3xYtjDkJFXhH9Bx` |
| 25 | Remaining differences from old known-good | Broader discovery stage + search context bar kept; desktop still has no mobile interstitial inserts; continuity path can duplicate insert blocks |

## E2E connectivity (logged out)

- Feed → product listing → `/user/Lioness010` → listing again: **PASS** (public, no login redirect)
- Design listing → `/user/TonyB`: **PASS**
- Recipe route opens: **PASS**

## Final verdict

**HOMECHEFF_ORIGINAL_FEED_UX_RESTORED**
