# Phase 3F Wave 1 — Final GO / NO-GO

**Branch:** `performance/phase3f-first-paint`  
**Date:** 2026-07-14  
**Decision:** **GROEN — GO for preview commit** (pending manual auth/browser spot-check)

---

## Criteria

| Criterion | Target | Result |
|-----------|--------|--------|
| Homepage HTML reduction | ≥75% | **96.6%** (4.25 MB → 143 KB local) |
| No SSR inspiratie on `/` | Required | ✅ |
| Anonymous session gate off critical path | Required | ✅ SSR-hint fast path |
| Viewport gate off critical path | Required | ✅ `resolved: true`, single GeoFeed |
| feedFetches = 1 | Required | ✅ |
| geoFeedMounts = 1 | Required | ✅ |
| Logged-in flow correct | Required | ✅ gated when SSR authenticated |
| Inspiratie preserved | Required | ✅ deferred client fetch |
| lint / build / smoke | Required | ✅ |
| Validators | Required | ✅ (13L known warning) |
| No feed/API/cache/DB change | Required | ✅ |

---

## ORANJE items (non-blocking)

1. **Mobile layout flash** — desktop-first SSR default until `useLayoutEffect` sets `narrow: true` (~1 frame). Acceptable for Wave 1; Wave 2 CSS-only refinement possible.
2. **Browser FP/LCP/first-tile** — not fully probed in CI; recommend preview deploy + `NEXT_PUBLIC_FEED_PERF_BASELINE=1` verification.
3. **Login/logout manual flows** — architecture-safe; spot-check on preview recommended.

---

## ROOD items

None observed.

---

## Explicitly NOT done

- ❌ Commit / push
- ❌ Merge to main
- ❌ Production deployment
- ❌ Prisma migration
- ❌ Feed API / CDN / cache changes
- ❌ Neon / Render changes
- ❌ GeoFeed dynamic import (Wave 2)
- ❌ SSR feed skeleton (Wave 2)

---

## Recommended next steps

1. Preview deploy branch
2. Manual: anonymous cold, logged-in, login/logout on preview
3. Confirm prod HTML <1 MB after deploy
4. Preview commit when manual checks pass
