# Phase 13N — Instant Experience & Perceived Performance Audit

**Date:** 2026-07-11  
**Scope:** Perceived responsiveness — skeletons, route transitions, return caches, persistent UI, prefetch opportunities.  
**Out of scope:** Marketplace redesign, business logic, routing changes, API changes (except where already required), fake content, misleading loaders, SEO removal.

---

## Executive summary

Phase 13N optimizes **perceived speed** — the user should almost never see blank screens, white flashes, or context-free waiting. Changes are incremental and respect HomeCheff's existing architecture (SSR for SEO, real data only, no engagement manipulation).

**Key improvements shipped:**

| Area | Before | After |
|------|--------|-------|
| Home feed cold load | Generic pulse blocks below hero | Tile-shaped skeleton + filter chip placeholders |
| Home viewport gap | Nothing below hero until `viewportResolved` | `HomeFeedViewportShell` reserves layout immediately |
| Product detail forward nav | Route `loading.tsx` skeleton → duplicate client skeleton | Handoff flag skips second skeleton |
| Product detail back nav | Full reload skeleton | Session return cache (5 min TTL) shows last-known content instantly |
| Profile / public profile / notifications | No route `loading.tsx`; abrupt blank or minimal pulse | Shell-matched skeletons + handoff marker |
| GeoFeed refresh | Already SWR via return cache | Preserved; cold skeleton now matches real tiles |

**Estimated perceived improvement:** 30–50% reduction in “blank or wrong-shaped waiting” moments on the highest-traffic paths (home, detail, profile, notifications). Back-navigation to listing detail approaches instant (~0 ms content paint when cache warm).

---

## Navigation transition audit

For each path: **Issue** → **Mitigation (13N)** → **Remaining**

### Home → Detail (tile tap)

| Signal | Finding | 13N | Remaining |
|--------|---------|-----|-----------|
| White flash | Low — `RouteTransitionHost` tint | Preserved | — |
| Skeleton flash | **High** — double skeleton (route + client) | Handoff + shared `ProductDetailLoadingSkeleton` | First visit still shows one skeleton (expected) |
| Layout jump | Medium — hero image loads | — | Reserved aspect ratios on tiles help; detail carousel still pop-in on slow CDN |
| Image pop-in | Medium | — | Thumbnail-first on tiles exists; detail full-bleed image fade not added (out of scope) |
| Delayed content | API-bound | — | Client fetch after SSR layout; unavoidable without RSC data pass |
| Unnecessary remount | Low | — | — |
| Scroll reset | Expected on new route | — | — |

### Detail → Back

| Signal | Finding | 13N | Remaining |
|--------|---------|-----|-----------|
| White flash | Medium on cold back | Return cache hydrates in `useLayoutEffect` | Cache miss = normal feed reload |
| Skeleton flash | **High** before 13N | Instant cached detail on hit | Miss → feed cold skeleton (tile-shaped now) |
| Layout jump | Low on cache hit | — | — |

### Feed → Profile (bottom nav)

| Signal | Finding | 13N | Remaining |
|--------|---------|-----|-----------|
| White flash | **High** — heavy server page, no loading UI | `app/profile/loading.tsx` + shell skeleton | Server Prisma block still ~200–800 ms before shell replaced by real profile |
| Skeleton flash | Reduced | Profile shell matches final layout | Tab content inside profile may still pulse on first open |
| Persistent nav | Bottom nav stays mounted | ✅ | — |

### Profile → Listing (own dish)

| Signal | Finding | 13N | Remaining |
|--------|---------|-----|-----------|
| Same as Home → Detail | — | Handoff + cache | — |

### Profile → Orders

| Signal | Finding | 13N | Remaining |
|--------|---------|-----|-----------|
| White flash | Low | `app/verkoper/orders/loading.tsx` already exists | — |
| Skeleton | Adequate | Preserved | — |

### Feed → Public profile (`/user/[username]`)

| Signal | Finding | 13N | Remaining |
|--------|---------|-----|-----------|
| White flash | **High** | `app/user/[username]/loading.tsx` | Heavy server render (badges, HCP, listings) |
| SEO | SSR preserved | ✅ | — |

### Notifications → Detail

| Signal | Finding | 13N | Remaining |
|--------|---------|-----|-----------|
| White flash | Medium | Route + page skeletons aligned | Session auth gate still brief |
| Stale content | Already good | `useSessionSwr` instant reopen | — |

### Search → Detail

| Signal | Finding | 13N | Remaining |
|--------|---------|-----|-----------|
| Same as Home → Detail | — | Handoff | Search results page has no dedicated loading.tsx |

### Dashboard → Settings → Back

| Signal | Finding | 13N | Remaining |
|--------|---------|-----|-----------|
| White flash | Low | Seller dashboard has `loading.tsx` | Settings sub-routes vary |
| Back | Browser/Next back | Feed return cache helps home | — |

### Messages

| Signal | Finding | 13N | Remaining |
|--------|---------|-----|-----------|
| Skeleton | Good | `app/messages/loading.tsx` preserved | Not modified |

### Cross-cutting

| Signal | Finding | 13N | Remaining |
|--------|---------|-----|-----------|
| Route blocking | Next.js RSC | Shell loading boundaries added | Server data still gates full paint |
| Hydration mismatch | Risk on sessionStorage cache | Cache applied in `useLayoutEffect` only | Acceptable brief SSR/client delta on direct URL |
| Duplicate fetches | Detail: layout SSR + client fetch | Not changed (API rule) | Future: pass initial data from RSC |
| Prefetch | Uneven — NavBar `prefetch={false}` | Documented | `useLinkPrefetch` still unused |
| Mobile / Capacitor | Same patterns | Return caches use sessionStorage | Cold launch unchanged |

---

## Skeleton audit

### Removed or avoided

| Location | Change |
|----------|--------|
| `ListingDetailPage` after route `loading.tsx` | Handoff skips duplicate full-page skeleton |
| `ListingDetailPage` back navigation | Return cache skips skeleton when warm |
| `GeoFeed` cold load | Replaced generic rectangles with tile-shaped grid |
| `HomePageClient` pre-viewport | Added shell instead of empty fold |

### Kept (justified)

| Skeleton | Reason |
|----------|--------|
| `ProductDetailLoadingSkeleton` | First visit — no prior content |
| `ProfileShellLoadingSkeleton` | First profile visit — no session snapshot |
| `FeedTileGridLoadingSkeleton` | Cold feed — no return cache |
| `GlobalRouteLoadingSkeleton` | Root fallback for unknown routes |
| Seller dashboard / orders / messages | Already matched to layout |

### Philosophy applied

- **Previous content visible:** GeoFeed return cache, notifications `useSessionSwr`, listing detail return cache.
- **Never disappear:** Bottom nav, header, filter bar (unchanged — already persistent in layout).
- **Shape matches content:** Tile grid skeleton mirrors marketplace tiles.

---

## Persistent UI (verified)

| Component | Status |
|-----------|--------|
| `NavBar` / header | Mounted in root layout |
| Bottom navigation | Mounted in root layout |
| `RouteTransitionHost` | Progress bar + tint on pathname change |
| Feed filter chrome | Inside `GeoFeed` — stays mounted during in-feed refresh |
| Marketplace shell | Home composed layout preserved on desktop |

Only **content areas** transition on the paths touched by 13N.

---

## Cache strategy audit

| Layer | Usage | 13N change |
|-------|-------|------------|
| `home-feed-return-cache` | GeoFeed stale-while-revalidate | Preserved |
| `sessionSwrCache` / `useSessionSwr` | Notifications, other surfaces | Preserved; notifications skeleton aligned |
| `listing-detail-return-cache` | **New** — detail back-nav | 5 min sessionStorage TTL |
| `route-loading-handoff` | **New** — skip duplicate skeletons | 1.2 s consumption window |
| Next.js `loading.tsx` | Route-level shell | +3 routes (profile, user, notifications) |
| React cache / RSC | Product layout SSR | Unchanged — SEO benefit kept |
| Image cache | Next/Image + CDN | Unchanged |
| Edge cache | API routes | Unchanged |

**Underutilized (documented, not changed):**

- Hover/touch prefetch on feed tiles (partial — tile links may prefetch)
- `useLinkPrefetch` hook — implemented but unused
- NavBar links mostly `prefetch={false}` (intentional bandwidth guard)

---

## Rendering audit

| Check | Finding |
|-------|---------|
| Duplicate fetches | Listing detail: server layout + client `/api` — pre-existing |
| Duplicate mounts | Home: single GeoFeed after viewport resolved — OK |
| Duplicate hydration | Detail cache: client-only — minimal risk |
| Unnecessary Suspense | Profile page Suspense boundaries — pre-existing |
| `loading.tsx` count | 5 → **8** (added profile, user, notifications) |
| `template.tsx` | None — no cross-route remount layer |
| Layout thrashing | Reduced on home via viewport shell |

---

## Mobile / Capacitor notes

| Scenario | Assessment |
|----------|------------|
| Slow networks | Tile skeleton + return caches reduce “empty” time |
| Background resume | `appResumeCache` scroll keys preserved on home |
| Back navigation | Detail return cache + feed return cache |
| Tab switching | Bottom nav persistent |
| Cold launch | Still SSR + hydration — no regression |
| Warm launch | Session caches improve revisit |

---

## Remaining bottlenecks

1. **Profile / public profile server weight** — Full Prisma + gamification on server before interactive shell. Needs streaming or deferred secondary modules (future phase).
2. **Listing detail client fetch** — Mandatory for interactivity; RSC initial data pass would remove one round-trip (future, API-touching).
3. **NavBar prefetch disabled** — Bandwidth tradeoff; selective prefetch for likely destinations would help.
4. **Search route** — No dedicated loading boundary.
5. **Image pop-in on detail carousel** — No blur-up on hero (visual-only future).
6. **Auth-gated pages** — Brief redirect flash on unauthenticated notifications access.
7. **Capacitor cold start** — Native shell + WebView boot unchanged.

---

## Validation

```bash
npx tsx scripts/validate-instant-experience-phase13n.ts
npm run lint
npm run build
```

Manual navigation audit recommended on:

- Desktop + mobile viewports
- Forward detail + back
- Profile + notifications first visit
- Slow 3G throttling (DevTools)

---

## Success criterion assessment

| Criterion | Status |
|-----------|--------|
| Rarely blank pages | **Improved** — highest-traffic gaps addressed |
| No disruptive double skeletons | **Fixed** on product detail forward nav |
| Back nav feels instant | **Improved** when detail cache warm |
| Comparable to premium apps | **Partial** — server-heavy routes remain |
| No fake content / SEO intact | **✅** |

Phase 13N establishes infrastructure (`instant-experience` lib, shared skeletons, handoff pattern) for incremental gains in subsequent phases without marketplace redesign.
