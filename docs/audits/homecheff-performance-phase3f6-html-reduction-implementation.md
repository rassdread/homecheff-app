# Phase 3F.6 — HTML Reduction Implementation

**Branch:** `performance/phase3f-first-paint`  
**Baseline:** main @ `5fa92ed`  
**Status:** implemented (Wave 1, uncommitted)

---

## Change

Removed `getInspiratieItems({ take: 24 })` from `app/page.tsx` homepage SSR.

Inspiratie now loads **only client-side** via existing GeoFeed deferred fetch (`/api/inspiratie?take=48`) after `feedHydrated`.

---

## Files

| File | Change |
|------|--------|
| `app/page.tsx` | Removed inspiratie SSR; added lightweight `getServerSession` for auth hint |
| `components/home/HomePageClient.tsx` | Removed `initialInspiratieItems` prop |
| `components/feed/GeoFeed.tsx` | Unchanged inspiratie path (deferred effect preserved) |

---

## Measured impact

| Metric | Before (prod) | After (local prod build) |
|--------|---------------|--------------------------|
| HTML bytes | 4,247,538 | **146,275** |
| Reduction | — | **96.6%** |
| RSC push chunks | 55 | 11 |
| Blob URLs in HTML | 1+ | 0 |
| data:image URLs | 22 | 0 |

---

## Parity

- `/inspiratie` route unchanged (`getInspiratieItems` still used there)
- Feed remains primary homepage content
- No second feed request introduced
- Inspiratie fetch remains single deferred request post-hydration

---

## Validator

`npx tsx scripts/validate-homepage-no-ssr-inspiratie-phase3f6.ts` — **9/9 pass**
