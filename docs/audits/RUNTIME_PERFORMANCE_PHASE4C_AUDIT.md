# Runtime, Smart Caching & Instant Navigation Audit — UX-FIN Phase 4C

**Date:** 2026-07-07  
**Scope:** Runtime, caching, revisit performance, tab-switches, background refresh, smart state restore across the whole app. No new functionality; no changes to marketplace/economy/ranking/AI/payments/notifications-system/design-system/SEO/business logic.

Companion progress doc: [`docs/progress/UX_FINALIZATION_PHASE4C_RUNTIME_CACHING.md`](../progress/UX_FINALIZATION_PHASE4C_RUNTIME_CACHING.md).

---

## Goal

Make HomeCheff behave like a premium native app: the user rarely waits when data
was already loaded before. Phase 4 made the homepage instant; Phase 4B fixed the
biggest interaction-time gaps; **Phase 4C unifies the cache architecture** and
executes the deferred SWR / revisit optimizations across surfaces.

---

## Unified architecture (extra aandachtspunt: consistent cache strategy)

A single, consistent "instant show → background refresh" primitive now backs the
revisit-heavy surfaces, mirroring the homepage return cache:

- `lib/runtime/sessionSwrCache.ts` — per-tab (sessionStorage) SWR cache with a
  freshness window (`SWR_FRESH_MS = 45s`), hard TTL (30m), size-bounded, pruned.
- `hooks/useSessionSwr.ts` — cache-first hydrate (no skeleton on revisit),
  abortable background refresh only when stale, `mutate()` for optimistic writes,
  `refresh()` for post-mutation reconcile.

This is the same mental model as `lib/feed/home-feed-return-cache.ts` and
`lib/feed/feedSurfaceState.ts`, so every surface now reasons about revisit
performance identically.

---

## Report (14 points)

### 1. Deferred optimizations executed
- Chat deep-link fetch de-duplicated (4C.5)
- Notifications instant reopen via SWR (4C.6)
- Profile fans/follows/favorites parallelized + abortable (4C.7)
- Seller orders `useMemo` filtering + background reconcile (4C.8)
- Delivery poll diffing (4C.9)
- Checkout parallel product fetch + debounced fee (4C.10)
- Operations client-side filtering + hub cache (4C.11)

### 2. Caches added
- Unified `sessionSwrCache` (notifications, operations hub).
- (Homepage return cache, feed surface state, chat/seller native caches preserved.)

### 3. SWR strategies added
- Notifications list and operations hub now: **cache first, background refresh,
  no skeleton, no flicker, no layout jump** — same rules as the homepage.

### 4. Pages that now open instantly (from warm cache)
- Notifications (revisit) — was cold refetch + skeleton every time.
- Operations "Mijn Afspraken" (revisit) — was skeleton + refetch.
- (Homepage already instant since Phase 4.)

### 5. Faster revisits
- Notifications, operations: instant from session cache + silent refresh.
- Seller orders: status change no longer flips the whole list to a skeleton.

### 6. Faster tab-switches
- Operations filter chips: **instant** (client-side filter, no API call).
- Seller orders status tabs/search: no extra render pass (derived `useMemo`).

### 7. Rerenders removed
- Delivery dashboard: no full-tree re-render on unchanged 30s poll.
- Seller orders: removed the `filteredOrders` state+effect duplicate pass.
- (Chat row memoization from 4B preserved.)

### 8. Polling improved
- Delivery `/api/delivery/dashboard` 30s poll now diffs the payload and **skips
  all setState** when nothing changed — updates only when data actually changes.

### 9. API calls reduced
- Operations: N filter switches → **1** unfiltered fetch (then client filter).
- Chat deep-link: 2 identical `/api/conversations/{id}` → **1**.
- Notifications/operations revisits within 45s: **0** extra fetches (cache fresh).

### 10. Network optimizations
- Checkout product locations: serial loop → `Promise.all` (+ AbortController).
- Profile fans/follows/favorites: serial → `Promise.all` (+ AbortController).
- Checkout delivery-fee POST: debounced 300ms (no per-keystroke request).
- All new fetch paths carry abort signals (request cancellation on unmount/nav).

### 11. Native-app improvements
- Consistent instant-open + background-refresh across more surfaces → fewer
  "page starts over" moments; state/scroll/filters retained on revisit.

### 12. Deliberately deferred
- Serialized reload-surviving feed cache; list virtualization; `next/image`
  migration; route prefetch on hover; extend SWR to seller dashboard/analytics &
  chat list (already have their own caches); revenue double-earnings dedupe
  (cross-component coordination); profile `MyDishesManager` per-role cache;
  thread scroll restore; dead chat component cleanup.

### 13. New platform performance score
| Area | Phase 4 | Phase 4B | Phase 4C |
|---|---|---|---|
| Homepage / feed | ★★★★★ | ★★★★★ | ★★★★★ |
| Navigation back to home | ★★★★★ | ★★★★★ | ★★★★★ |
| Notifications | ★★☆☆☆ | ★★★☆☆ | ★★★★★ |
| Operations filter/revisit | ★★★☆☆ | ★★★☆☆ | ★★★★★ |
| Seller orders | ★★☆☆☆ | ★★★☆☆ | ★★★★☆ |
| Seller dashboard | ★★☆☆☆ | ★★★★☆ | ★★★★☆ |
| Delivery polling UX | ★★★☆☆ | ★★★☆☆ | ★★★★☆ |
| Checkout open | ★★★☆☆ | ★★★☆☆ | ★★★★☆ |
| Profile community tab | ★★☆☆☆ | ★★☆☆☆ | ★★★★☆ |
| Chat | ★★★☆☆ | ★★★★☆ | ★★★★☆ |
| Cache consistency | ★★☆☆☆ | ★★★☆☆ | ★★★★★ |

### 14. Comparison with Phase 4 and 4B
- **Phase 4:** homepage instant (return cache, SWR, scroll/filter restore).
- **Phase 4B:** biggest interaction gaps (chat typing memo, seller parallel load,
  optimistic notifications, no full-reload settings) + real perf timings.
- **Phase 4C:** **unified** the cache architecture and rolled instant-open +
  background-refresh out to notifications and operations, parallelized/deduped
  the remaining serial and duplicate fetches, and stopped the delivery poll from
  re-rendering unchanged data. The app now feels consistently instant on revisit.

---

## Files changed

- `lib/runtime/sessionSwrCache.ts` (new)
- `hooks/useSessionSwr.ts` (new)
- `app/notifications/page.tsx`
- `components/profile/ProfileDealsClient.tsx`
- `components/FansAndFollowsList.tsx`
- `app/checkout/page.tsx`
- `components/delivery/DeliveryDashboard.tsx`
- `app/messages/page.tsx`
- `app/verkoper/orders/page-client.tsx`
- `scripts/validate-runtime-performance-phase4c.ts` (new)
- docs (this + progress)

## Validation

```
npx tsx scripts/validate-runtime-performance-phase4c.ts   # 26/26
npx tsx scripts/validate-platform-performance-phase4b.ts  # 20/20
npx tsx scripts/validate-homepage-performance.ts          # 25/25
npm run build                                             # pass
```
