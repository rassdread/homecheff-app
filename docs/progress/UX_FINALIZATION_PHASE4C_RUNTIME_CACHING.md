# UX Finalization Phase 4C — Runtime, Smart Caching & Instant Navigation

**Date:** 2026-07-07

Full audit: [`docs/audits/RUNTIME_PERFORMANCE_PHASE4C_AUDIT.md`](../audits/RUNTIME_PERFORMANCE_PHASE4C_AUDIT.md).

---

## Summary

Phase 4C finishes the platform-performance track by introducing **one unified
stale-while-revalidate architecture** and executing the deferred revisit /
caching / navigation optimizations across surfaces. No new functionality, no
business-logic changes. All Phase 4 and 4B wins are preserved and guarded.

---

## Unified primitive

| File | Role |
|---|---|
| `lib/runtime/sessionSwrCache.ts` | Per-tab SWR cache: 45s freshness window, 30m TTL, size-bounded, pruned |
| `hooks/useSessionSwr.ts` | Cache-first hydrate (no revisit skeleton), abortable background refresh when stale, `mutate`/`refresh` |

Same model as the homepage return cache → consistent revisit behaviour everywhere.

---

## Implemented

| Task | Surface | Change |
|---|---|---|
| 4C.1/4C.2 | Global | Unified session SWR cache + hook |
| 4C.6 | Notifications | Instant reopen via SWR; optimistic mark-read via cache mutate |
| 4C.11 | Operations | Fetch hub once unfiltered; client-side filter chips (same predicate as server); SWR revisit |
| 4C.7 | Profile | `FansAndFollowsList` follows/fans/favorites in `Promise.all` + AbortController |
| 4C.10 | Checkout | Parallel product location fetch (was serial loop) + 300ms debounced fee recalc |
| 4C.9 | Delivery | 30s poll diffs payload signature, skips setState when unchanged |
| 4C.5 | Chat | Deep-link + header effects share one `/api/conversations/{id}` fetch |
| 4C.8 | Seller | Orders `filteredOrders` → `useMemo`; post-optimistic reconcile in background |

---

## Preserved (no regression)

Homepage return cache + SWR, feed surface/scroll/filter restore, feed density
store, chat session caches + row memoization, seller native persisted cache +
dashboard parallel fetch, checkout prefill abort + memoized totals, notification
badge polls, real perf timings (PerformanceMonitor), media DNS-prefetch.

---

## Deferred (next safe batch)

Serialized reload-surviving feed cache, list virtualization, `next/image`
migration, route prefetch on hover, SWR for seller dashboard/analytics & chat
list, revenue double-earnings dedupe, `MyDishesManager` per-role cache, thread
scroll restore, dead chat component cleanup.

---

## Validation

```
npx tsx scripts/validate-runtime-performance-phase4c.ts   # 26/26
npx tsx scripts/validate-platform-performance-phase4b.ts  # 20/20
npx tsx scripts/validate-homepage-performance.ts          # 25/25
npm run build                                             # pass
```

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
- `docs/audits/RUNTIME_PERFORMANCE_PHASE4C_AUDIT.md` (new)
- `docs/progress/UX_FINALIZATION_PHASE4C_RUNTIME_CACHING.md` (this)
