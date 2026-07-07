# UX Finalization Phase 4 — Homepage, Feed & Navigation Performance

Focus: real and **perceived** performance of the homepage feed and the
navigation transitions users repeat dozens of times per session. No new
functionality, no redesign, no changes to ranking / business logic / economy /
search. Every change is transparent to the user except that the app feels faster.

Companion audit: [`docs/audits/HOMEPAGE_FEED_PERFORMANCE_AUDIT.md`](../audits/HOMEPAGE_FEED_PERFORMANCE_AUDIT.md).

---

## Summary

The homepage feed was **already heavily optimized** in earlier phases (SSR seed,
in-tab return cache, filter persistence, scroll restore, single abortable
parallel fetch, idle-deferred work, lazy/deferred media, single feed mount). This
phase **audited and verified** that architecture and closed the one meaningful
remaining gap — cache hits that never revalidated — with a stale-while-revalidate
background refresh, plus a regression guard to keep the wins from eroding.

---

## Report (as requested)

### 1. Bottlenecks found
- **Cache hits never revalidated.** A warm return-cache render was instant but
  could remain stale for up to the 8-minute cache TTL with no background refresh.
- Everything else audited (blocking effects/awaits, double mounts, serial
  fetches, media blocking, auto-GPS) was **already handled** — documented in the
  audit so it is protected rather than "re-fixed".

### 2. Renders removed
- No redundant render was newly introduced. Confirmed item normalization, sort,
  and interleave run once per fetch (memoized), and exactly **one** `GeoFeed`
  tree mounts per resolved viewport (mobile XOR desktop).

### 3. Fetches merged
- Feed + inspiration were already fetched in **parallel** (`Promise.all`).
- The stale-while-revalidate change **avoids** an entire fetch for cache hits
  younger than 60s (cheapest path preserved) while still refreshing stale ones.

### 4. Caching improved
- Added `HOME_FEED_STALE_MS` (60s) + `isHomeFeedReturnCacheStale()` to the in-tab
  return cache.
- GeoFeed now does **stale-while-revalidate**: instant cached feed, background
  refresh only when stale, and **never** a loading flash during that refresh.

### 5. Navigations that got faster
- **Detail/Profile/Chat/Deals → Home**: still instant from the return cache, and
  now the shown feed is quietly kept fresh instead of potentially minutes old —
  faster *and* more correct-feeling.

### 6. Perceived-performance improvements
- Returning to the homepage remains instant (no skeleton), and content updates
  "calmly" in place (no jump/flicker) when a background refresh lands.

### 7. Optimizations deliberately deferred
- Serialized (reload-surviving) feed item cache, list virtualization,
  `next/image` migration, hover/intersection route prefetch, cross-surface return
  cache. Rationale in the audit §5.

---

## Changes in this phase

| File | Change |
|---|---|
| `lib/feed/home-feed-return-cache.ts` | Added `HOME_FEED_STALE_MS` + `isHomeFeedReturnCacheStale()` (stale-while-revalidate window). |
| `components/feed/GeoFeed.tsx` | Cache hit now revalidates in the background when stale, without a loading flash (`backgroundRefresh` guard). |
| `scripts/validate-homepage-performance.ts` | New regression guard — 25 static architecture checks. |
| `docs/audits/HOMEPAGE_FEED_PERFORMANCE_AUDIT.md` | New — full render chain + navigation audit. |
| `docs/progress/UX_FINALIZATION_PHASE4_HOMEPAGE_PERFORMANCE.md` | This document. |

---

## UX-FIN-4.12 — Perceived Performance Score

### Transitions that now feel faster
- Detail ↔ Home, Profile ↔ Home, Chat ↔ Home, Deals ↔ Home — instant from cache,
  now with silent freshness.

### Pages that are fully instant (from warm state)
- Homepage on back-navigation within a session (return cache + scroll + filters).

### Pages still waiting on data
- First-ever homepage visit (cold): SSR inspiration shows instantly; the geo/sale
  feed still needs its first `/api/feed` round-trip.
- Cross-surface hubs (discover/dorpsplein) rely on their own surface state, not
  the homepage return cache.

### Future optimizations still possible
- Serialized feed cache to make even a full reload instant.
- Route/data prefetch on link intersection for detail pages.
- List virtualization for very long feeds.
- Extend the return-cache pattern to discover/dorpsplein.

---

## Validation

```
npx tsx scripts/validate-homepage-performance.ts   # 25/25 passed
```

- Static architecture guard: **25/25 passed**.
- `npm run build`: pass.
- No behavioural change: same data, same ranking, same filters — only timing.
