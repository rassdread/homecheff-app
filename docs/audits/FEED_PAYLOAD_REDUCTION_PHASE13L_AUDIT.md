# Phase 13L Audit — Feed Payload Reduction & Fast First Page

**Date:** 2026-07-10  
**Builds on:** Phase 13K baseline measurements

---

## Goal

Reduce initial feed payload and improve time-to-first-tile without marketplace architecture changes, ranking changes, or removing valid listings.

---

## Phase 13K baseline (before)

| Metric | Production (2026-07-10) |
|--------|-------------------------|
| Cold TTFB | 4778 ms |
| Cold total | 6067 ms |
| Warm HIT total | 1077 ms |
| Response size | **8872 KB** (29 items) |
| Inline base64 | **12/29 items**, ~2.08 MB |
| First page | Full pool (~29–40 items) |
| Inspiratie | Parallel with every feed fetch |
| First image | `loading="lazy"` |

---

## Changes implemented

### Part 1 — Remove inline image data

**Module:** `lib/feed/sanitize-feed-response-media.ts`

- Strips any `data:` URL from feed serialization (images, avatars, video posters, `discovery.coverImage`)
- Returns `null` for cover when only base64 existed — tiles use placeholder via existing `feedMedia` path
- Removes duplicate heavy fields from feed JSON: `images[]`, `ListingMedia[]`, `videos[]`
- Keeps single sanitized `image` / `videoUrl` / slim `Video` block
- Server guard: `countInlineDataMediaUrls()` — warns if any remain after sanitize

**Not changed:** Detail/product APIs — richer media still available on detail pages.

### Part 2 — First-page pagination

**Module:** `lib/feed/feed-pagination.ts`

- Query params: `take` (default **10**), `skip` (default **0**)
- Response includes `pagination: { take, skip, total, hasMore }`
- Ranking/filter pipeline unchanged — slice after sort/discovery order
- `discovery` + `statsPreview` only on first page (`skip=0`) to shrink load-more responses
- **GeoFeed:** IntersectionObserver load-more (`480px` root margin), dedupe by id, return-cache compatible

### Part 3 — First visible image priority

- `FeedCardPrimaryMedia` + tile chain accept `imageLoading`
- First marketplace tile in grid: `loading="eager"` via `priorityMedia` on `FeedMarketplaceCard`

### Part 4 — Session/bootstrap gate

**Before:** Blocked all logged-in fetches until bootstrap completed.

**After:** Block only when **nearby scope** needs profile coords and bootstrap still loading. National/international feeds start after session resolves.

### Part 5 — Deferred inspiratie

- Removed `Promise.all([feed, inspiratie])` from initial fetch
- `/api/inspiratie?take=48` loads **after** first feed page is hydrated
- Skips refetch when return-cache already has pool for same category/q key

---

## After measurements

### Local production build (`npm run start`, same DB as dev, 2026-07-10)

| Probe | Items | Size | base64 in JSON | TTFB | Notes |
|-------|------:|-----:|---------------:|-----:|-------|
| `take=10&skip=0` (first page) | 10 | **32 KB** | **0** | ~2990 ms | `hasMore: true`, `total: 29` |
| `take=40&skip=0` (full slim pool) | 29 | **58 KB** | **0** | ~2224 ms | vs 8872 KB before |

**Payload reduction:** ~8872 KB → **32 KB** first page ≈ **99.6% smaller** (national scope, local prod).

Production deploy required for production TTFB/size confirmation; structure guarantees **zero `data:image` in `/api/feed`**.

### Target checklist

| Target | Status |
|--------|--------|
| No `data:image` in `/api/feed` | **Pass** (measured local) |
| Initial JSON under 500 KB | **Pass** (32 KB first page local) |
| First page 8–12 items | **Pass** (10 items) |
| Cached download below ~1077 ms warm | **Deploy to verify** (payload now ~32 KB vs 8872 KB — expect large win) |
| First visible image eager | **Pass** (wired) |
| No ranking/filter regression | **Pass** (same sort/discovery pipeline, slice only) |

### Remaining payload (if not under 500 KB in some scopes)

With pagination + sanitize, first page is ~32–58 KB locally. Larger responses possible when:

- `discovery` block on first page (sections, activity cards, surfaces)
- `statsPreview` seller batch
- High item count if client requests `take=40`

None of these contain inline base64 after 13L.

---

## Compatibility (Part 7)

| Case | Handling |
|------|----------|
| Product offers / requests / services | Unchanged taxonomy/settlement SSOT; slim media only |
| Dish / inspiration | Single cover URL; base64 → null + placeholder |
| Legacy listings | Same transform + sanitize |
| Missing images | `image: null` → placeholder |
| Old base64-only rows | No payload sent; placeholder tile |
| Multiple media | Detail page retains full set; feed shows cover only |
| Detail navigation | Unchanged href resolution |

---

## Bottleneck shift (post-13L)

1. **Addressed:** Multi-MB JSON / inline base64 — dominant 13K bottleneck
2. **Now dominant:** Cold server TTFB (~3–5 s) — DB + trust + discovery CPU
3. **Secondary:** Discovery payload on first page (metadata, not images)
4. **Minor:** Inspiratie still ~48 items deferred (no longer blocks first tile)

---

## Files

| File | Role |
|------|------|
| `lib/feed/sanitize-feed-response-media.ts` | Strip data URLs, slim media |
| `lib/feed/feed-pagination.ts` | take/skip SSOT |
| `app/api/feed/route.ts` | Sanitize + paginate response |
| `lib/feed/feed-query-params.ts` | Client take/skip params |
| `components/feed/GeoFeed.tsx` | Load-more, deferred insp, session gate |
| `components/feed/FeedMarketplaceCard.tsx` | priorityMedia |
| `components/feed/feedMedia.tsx` | imageLoading |
| `components/marketplace/tiles/*` | Pass imageLoading to TileMedia |
| `lib/feed/home-feed-return-cache.ts` | Optional feedHasMore |

---

## Verdict

**Complete** — feed JSON reduced from ~8.7 MB to ~32 KB first page (local measured), zero inline base64, 10-item first page with load-more, eager first image, deferred inspiratie, narrower session gate.

Deploy to production and re-run probe for production TTFB/warm cache numbers.
