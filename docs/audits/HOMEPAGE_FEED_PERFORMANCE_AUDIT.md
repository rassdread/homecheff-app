# Homepage & Feed Performance Audit (UX-FIN Phase 4)

Read-only performance audit of the HomeCheff homepage feed and its navigation
transitions. Scope: performance and perceived performance only — no new
functionality, no redesign, no ranking / business-logic / search changes.

Legend: ✅ already optimal · 🟡 improved this phase · ⏭️ deliberately deferred.

---

## 1. Render chain (UX-FIN-4.1)

### 1.1 Entry — `app/page.tsx` (Server Component, `revalidate = 60`)

1. `await getInspiratieItems({ take: 24, skip: 0, sortBy: 'newest' })` runs on the
   server (ISR, 60s). The **first batch of inspiration content is server-rendered**
   and streamed to the client as `initialInspiratieItems`. ✅
2. Query-string chips/vertical/place are normalized server-side and passed as
   `initialFeedChip` / `initialFeedCategory` / `initialFeedPlace`.
3. Renders `<HomePageClient>` with the seed data. No client round-trip is needed
   for the first meaningful paint of inspiration cards.

### 1.2 Shell — `components/home/HomePageClient.tsx` (Client Component)

- Renders **immediately**: `StructuredData`, `PostAuthPersonaBanner`,
  `HomeHeroSection`, and the layout shell.
- `useNarrowViewportResolved()` gates which single feed tree mounts:
  `showMobileHomeFeed` **XOR** `showDesktopHomeFeed` (both require
  `viewportResolved`). → **exactly one `<GeoFeed>` tree**, no double mount. ✅
- Non-blocking effects: domain detection (`data-domain`), and a hash
  scroll-to-feed that is **skipped when a saved scroll position exists**.
- `OnboardingTour` (home + inspiratie) render with `autoStart={false}` → never
  block or interrupt the first feed paint. ✅

### 1.3 Feed core — `components/feed/GeoFeed.tsx` (~2.4k lines)

The feed uses a **context split** (`GeoFeedHomeLayoutContext`) so the desktop
layout renders `FeedFiltersPanel`, `FeedContent`, and the sidebar as independent
consumers of one provider (avoids prop-drilling; one data owner).

Startup sequence:

1. Local state seeded from props (`initialInspiratieItems`, chip/category/place).
2. Filter/surface state restored from `sessionStorage` (`feedSurfaceState`).
3. **Return-cache probe** (`peekFreshHomeFeedReturnCache` /
   `readHomeFeedReturnCache`): if a warm in-tab feed exists, items render
   **instantly** with `loading = false`.
4. Otherwise a **single**, abortable `fetch('/api/feed')` runs **in parallel**
   with `fetch('/api/inspiratie')` via `Promise.all`.
5. On unmount the current items are written back to the return cache.

### 1.4 What renders after the feed vs. in parallel

| Work | Timing | Blocks feed? |
|---|---|---|
| Inspiration seed (SSR) | first paint | no (already present) |
| `/api/feed` + `/api/inspiratie` | parallel, aborted on nav | no (cache shows first) |
| Profile location (logged-in) | `requestIdleCallback` / 1.2s fallback | no ✅ |
| GPS geolocation | **only on explicit user action** | no ✅ |
| Native push debug listeners | gated flags, native only | no |
| User stats preview | seeded from `statsPreview` in feed response | no (piggybacks) |
| Onboarding tours | `autoStart={false}` | no |

### 1.5 Blocking `useEffect` / `await` review

- No blocking top-level `await` in the client path; the only `await`s are inside
  the async `run()` fetch, which is fire-and-forget with `AbortController`. ✅
- No effect waits on another effect's network result before painting; the feed
  paints from cache/seed first, then reconciles. ✅

### 1.6 Duplicate renders / rebuilt data

- Feed item normalization (`safeNormalizeFeedItem` + distance enrichment) runs
  once per fetch response, not per render. ✅
- Interleave/sort pipelines are computed in `useMemo` blocks keyed on inputs. ✅
- 🟡 Previously a **cache hit returned early and never revalidated** — the only
  meaningful rebuild gap. Fixed via stale-while-revalidate (see §3).

---

## 2. Existing optimizations confirmed (baseline is already strong)

- ✅ **SSR seed** of first inspiration batch (no empty first paint).
- ✅ **In-tab memory return cache** (`lib/feed/home-feed-return-cache.ts`) —
  instant homepage when navigating back within a session.
- ✅ **Filter/surface persistence** (`lib/feed/feedSurfaceState.ts`,
  sessionStorage, small payloads only).
- ✅ **Scroll restore** (`lib/appResumeCache.ts`, window + desktop feed column
  keys, TTL-bounded).
- ✅ **Single, abortable, parallel** feed + inspiration fetch.
- ✅ **Idle-deferred** profile location; **no auto-GPS** on the homepage.
- ✅ **Media**: `loading="lazy"`, `decoding="async"`, responsive `sizes`,
  deferred `<video>` mount via `IntersectionObserver` (rootMargin 260px), and a
  **shared** feed interaction/audio store (no N× `matchMedia` per card).
- ✅ **Single feed tree** per resolved viewport (no double mount).

---

## 3. Bottleneck found & fixed this phase

### 🟡 Cache hits never revalidated (UX-FIN-4.3 / 4.4 / 4.9)

**Before:** on a return-cache hit the feed effect set items and `return`ed
immediately — instant, but the feed could stay stale for up to the 8-minute cache
TTL with no background refresh.

**After — stale-while-revalidate:**
- `HOME_FEED_STALE_MS = 60s` freshness window added to the return cache, plus
  `isHomeFeedReturnCacheStale()`.
- Cache hit **younger than 60s** → served instantly, **no network** (unchanged,
  cheapest path).
- Cache hit **older than 60s** (but within the 8-min TTL) → served instantly
  **and** a background refresh runs. The refresh **never sets `loading = true`**
  (`feedInteractionStartedRef.current && !backgroundRefresh`), so there is no
  skeleton flash, the feed stays visible, and new data replaces the array by key
  (calm update — UX-FIN-4.9).

Net effect: returning to the homepage stays instant, but content is now quietly
kept fresh instead of potentially showing a minutes-old feed.

---

## 4. Navigation transition audit (UX-FIN-4.8 / 4.11)

| Transition | Behaviour | Rating |
|---|---|---|
| Home → Detail | client nav; feed unmounts, items saved to return cache | ✅ |
| Detail → Home | return cache hydrates feed instantly + scroll restore + SWR refresh | ✅ (improved) |
| Home → Chat / Chat → Home | client nav; home warm on return | ✅ |
| Profile → Home | return cache + scroll restore | ✅ |
| Deals → Home | return cache + scroll restore | ✅ |
| Home → Checkout | checkout intentionally **not** persisted for scroll/route (money path) | ✅ intentional |
| Home → Settings / Delivery / Seller | standard client nav; home warm on return | ✅ |

Checked per transition: full reload avoided (SPA client nav), existing data
retained (return cache + surface state), scroll & UI state preserved, background
data refreshed lazily. No unnecessary remounts, no skeletons when data is known,
no duplicate fetch inside the freshness window.

---

## 5. Deliberately deferred (⏭️)

- **Persisting feed items to `sessionStorage`/`localStorage`** across full page
  reloads. The in-memory cache already covers SPA navigation (the common case);
  a serialized item cache adds quota/staleness risk for little gain. Deferred.
- **List virtualization** for very long feeds. Current feed length + lazy media
  keep it smooth; virtualization is a larger structural change. Deferred.
- **`next/image` migration** for feed media. Current `<img>` already ships lazy +
  async + responsive `sizes`; migration is a design-system-level change. Deferred.
- **Route/data prefetch on hover/intersection** for detail links. Nice-to-have;
  deferred to avoid speculative load on the feed. Deferred.
- **Cross-surface return cache** (discover/dorpsplein). Out of homepage scope.

---

## 6. Regression guard

`scripts/validate-homepage-performance.ts` encodes the invariants above
(25 static checks). Run: `npx tsx scripts/validate-homepage-performance.ts`.
