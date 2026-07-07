# Platform Performance Audit — UX-FIN Phase 4B

**Date:** 2026-07-07  
**Scope:** Runtime, navigation, rendering, caching, perceived performance across the full HomeCheff app. No business-logic, ranking, economy, or feature changes.

Companion progress doc: [`docs/progress/UX_FINALIZATION_PHASE4B_PLATFORM_PERFORMANCE.md`](../progress/UX_FINALIZATION_PHASE4B_PLATFORM_PERFORMANCE.md).

---

## Cross-cutting theme

Homepage/feed architecture is **mature** (Phase 4). Elsewhere the dominant cost is the same pattern: **cold refetch on every visit/tab-switch** and **full rerenders on interaction**, while badges, abort guards, optimistic sends, and session caches are often already solid on individual surfaces.

---

## 1. Grootste bottlenecks

| # | Bottleneck | Surface | Impact |
|---|---|---|---|
| 1 | Typing in chat re-renders entire message list (rows not memoized) | Chat | High — every keystroke |
| 2 | Seller dashboard: 3 serial API calls + refetch on every tab/focus | Seller | High — dashboard load |
| 3 | Delivery dashboard: 30s poll overwrites all 8 state slices → full tree rerender | Delivery | Medium — ongoing |
| 4 | Checkout: N serial product location fetches + undebounced fee recalc | Checkout | Medium — open checkout |
| 5 | Notifications list: cold refetch + skeleton on every open; mark-read refetched whole list | Notifications | Medium — revisit |
| 6 | Profile tabs: data refetched on every tab re-enter (UI state cached, data not) | Profile | Medium — tab switch |
| 7 | Operations hub: filter tab switch = full `/api/agreements` refetch | Operations | Medium — filter switch |
| 8 | Thread route `[conversationId]`: serial waterfall (conversation → then ChatBox messages) | Chat | Medium — deep link |

---

## 2. Grootste render-winsten

| Win | Status |
|---|---|
| `React.memo` on `ChatThreadMessageRow` | **Implemented** — isolates thread from composer keystrokes |
| Seller dashboard `Promise.all` for 3 fetches | **Implemented** — ~3× faster dashboard load |
| Notifications optimistic mark-as-read | **Implemented** — no refetch flash on tap |
| Settings `router.refresh()` vs full reload | **Implemented** — no white reload after profile save |
| Delivery poll: diff/skip-if-unchanged before setState | Deferred |
| Seller orders: `filteredOrders` as `useMemo` not effect+state | Deferred |
| Chat: isolate composer input into child component | Deferred (memo covers main case) |

---

## 3. Grootste API-winsten

| Win | Surface | Status |
|---|---|---|
| Parallel dashboard fetches | Seller | **Done** |
| Parallel checkout product fetches (`Promise.all`) | Checkout | Deferred |
| Dedupe double `/api/seller/earnings` on revenue page | Seller | Deferred |
| Dedupe deep-link `/api/conversations/{id}` (2× same id) | Chat | Deferred |
| Parallel `FansAndFollowsList` (follows/fans/favorites) | Profile | Deferred |
| Client-side operations filter (skip refetch on tab) | Operations | Deferred |
| Debounce checkout delivery-fee POST on postal keystrokes | Checkout | Deferred |

Feed API already batches stats/badges/trust (`batchComputeUserStatsPreview`, `fetchSellerTrustBundles`) — no N+1 on `/api/feed`.

---

## 4. Grootste database-winsten

No schema changes this phase. Feed route uses batched enrichment; `messages-fast` has 5s in-memory cache + lean `select`. Profile server page includes heavy Prisma select (reviews + vehiclePhotos) on every `/profile` load — deferred (server-component scope).

---

## 5. Grootste navigatie-winsten

| Transition | Behaviour |
|---|---|
| Home ↔ Detail/Profile/Chat/Deals | Return cache + scroll + SWR (Phase 4) — **instant** |
| Chat list ↔ thread (split view) | List stays mounted — **instant back** |
| Chat deep-link `[conversationId]` | Serial waterfall + double skeleton — **still waits** |
| Notifications → target → back | Cold refetch + skeleton — **mark-read now instant** |
| Settings profile save | Was full reload — **now `router.refresh()`** |

---

## 6. Grootste cache-winsten

**Preserved:** home return cache + SWR, chat sessionStorage caches, conversation list cache-then-network, seller native persisted cache, checkout draft sessionStorage, operations single-call hub.

**Implemented this phase:** PerformanceMonitor → real LCP/FID/CLS/TTFB/FCP via diagnostics channel.

**Deferred:** notifications list SWR, profile tab data cache, operations per-filter cache, seller web staleness gate on focus refetch.

---

## 7. Feed-optimalisaties (4B.3)

All Phase 4 wins preserved (validator guards). Re-audit confirmed: SSR seed, single abortable fetch, SWR background refresh, scroll/filter restore, lazy/deferred media, single GeoFeed mount.

**4B.4 Density:** Desktop default 2 (1/2/3 via localStorage external store); mobile default 1 column. Density is **not** a fetch dependency — switch causes no refetch/remount. Apparent “wrong default” = saved user preference in `homecheff.homeDesktopFeedColumns`.

**Media:** Added `dns-prefetch` for `blob.vercel-storage.com` in root layout.

---

## 8. Chat-optimalisaties (4B.6)

**Implemented:** `ChatThreadMessageRow` wrapped in `React.memo`.

**Preserved:** sessionStorage thread cache, AbortController + epoch guards, optimistic send, adaptive polling (45s/8s), near-bottom scroll, list scroll restore, messages-fast 5s server cache.

**Deferred:** dedupe deep-link conversation fetch, parallelize thread-route waterfall, debounce list resume refreshes, thread scroll restore (not just bottom), list virtualization.

---

## 9. Profiel-optimalisaties (4B.8)

**Preserved:** lazy tab panels + dynamic imports, tab/filter UI state in `feedSurfaceState`, stats/gamification once with cancel guard.

**Deferred:** parallel/lazy favorites in `FansAndFollowsList`, per-role cache in `MyDishesManager`, hoist dedupe `ProfileTrustSummaryLoader`, persist tab **data** not just UI state.

---

## 10. Meldingen-optimalisaties (4B.7)

**Implemented:** optimistic mark-as-read / mark-all-read (rollback refetch only on failure).

**Preserved:** badge uses `limit=1`, 45s visibility-gated poll, event-driven refresh, backoff.

**Deferred:** list stale-while-revalidate (instant reopen without skeleton).

---

## 11. Delivery-optimalisaties (4B.11)

**Preserved:** single `/api/delivery/dashboard` poll endpoint, `initialLoad` skeleton guard, `CardListLoadingSkeleton`.

**Deferred:** diff poll payload before setState (30s full-tree rerender), skip full refetch after optimistic accept, `gpsWatchId` → `useRef`.

---

## 12. Seller-optimalisaties (4B.10)

**Implemented:** dashboard stats/orders/products `Promise.all`.

**Preserved:** native persisted cache + TTL, analytics single fetch, loading skeletons.

**Deferred:** web focus staleness gate, drop redundant post-optimistic `loadOrders()`, revenue earnings dedupe, tab-switch in-memory cache.

---

## 13. Checkout-optimalisaties (4B.12)

**Preserved:** profile prefill AbortController, deal-checkout cancelled guard, memoized totals/fees, session draft TTL.

**Deferred:** parallel product location loop, debounce delivery-fee recalc on postal input.

---

## 14. Operations-optimalisaties (4B.13)

**Preserved:** single `/api/agreements` hub call, `useMemo` action/rest split, thin cards, courier strip cancelled guard.

**Deferred:** client-side filter tab (instant switch), skip redundant `loadHub` after optimistic patch.

---

## 15. Native-app verbeteringen (4B.19)

- Root layout: 8+ `dynamic(..., { ssr: false })` chrome pieces — feed not blocked.
- Capacitor early class in `<head>` for native styling.
- Chat + seller: native persisted caches for instant paint.
- Chat split view: list mounted while thread open — native back feels instant.

---

## 16. Perceived performance verbeteringen (4B.18)

| Improvement | Where |
|---|---|
| No skeleton on notification mark-read | Notifications |
| No white reload on profile save | Settings |
| Faster seller dashboard first paint | Seller |
| Chat typing no longer flickers thread | Chat |
| Real web-vital capture (diag-gated) | Global |

**Still flicker/skeleton:** notifications list reopen, profile tab re-enter, operations filter switch, chat deep-link route.

---

## 17. Bewust uitgesteld

List virtualization, `next/image` migration, serialized reload-surviving feed cache, route prefetch on hover, cross-surface return cache, DB/query slimming on profile SSR, dead chat components cleanup (`WorkingChat`, `CompleteChat`, `MessageList`).

---

## 18. Performance-score t.o.v. UX-FIN Phase 4

| Area | Phase 4 | Phase 4B |
|---|---|---|
| Homepage / feed | ★★★★★ | ★★★★★ (preserved + media DNS hint) |
| Navigation back to home | ★★★★★ | ★★★★★ |
| Chat (typing / open) | ★★★☆☆ | ★★★★☆ (memo) |
| Notifications | ★★☆☆☆ | ★★★☆☆ (optimistic read) |
| Seller dashboard load | ★★☆☆☆ | ★★★★☆ (parallel fetch) |
| Settings save | ★★☆☆☆ | ★★★★☆ (no reload) |
| Delivery polling UX | ★★★☆☆ | ★★★☆☆ (unchanged) |
| Checkout open | ★★★☆☆ | ★★★☆☆ (unchanged) |
| Operations filter switch | ★★★☆☆ | ★★★☆☆ (unchanged) |
| Observability | ★☆☆☆☆ | ★★★☆☆ (real vitals when diag on) |

**Overall perceived score:** Phase 4 established instant homepage; Phase 4B closes the largest **interaction-time** gaps (chat typing, seller load, notification tap, settings save) without touching business logic. Remaining wins are mostly **visit/tab-switch caching** patterns already proven on the homepage.

---

## Regression guard

```
npx tsx scripts/validate-platform-performance-phase4b.ts
npx tsx scripts/validate-homepage-performance.ts
```
