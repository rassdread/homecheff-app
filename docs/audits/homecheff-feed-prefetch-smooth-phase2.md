# HomeCheff — Feed Performance Phase 2

**Predictive Prefetch, Smooth Infinite Scroll & Background Preparation**

| Field | Value |
| --- | --- |
| Branch | `fix/feed-prefetch-smooth` |
| Base production tip | `400a86d` (Android infinite scroll) |
| Scope | Timing only — no composition / geo / pagination redesign |

## Architecture changes

Unchanged pipeline:

Unified Feed → Marketplace + Inspiration → Composer → Display → Recirculation → Infinite Scroll

Added:

1. **`FeedPrefetchCache`** (`lib/feed/feed-prefetch-cache.ts`) — bounded in-memory page cache (max 2 batches), requestKey invalidation, adaptive rootMargin, idle helper, diagnostics counters.
2. **GeoFeed wiring** — dual observers + idle + recirculation prep; spinner only on cache miss at near-end.

## Prefetch strategy

| Trigger | Action |
| --- | --- |
| ~2–3 viewport heights from end (adaptive) | Background `fetch` next `/api/feed` page into cache — **no spinner** |
| After first feed visible (`requestIdleCallback` / timeout fallback) | Prepare next marketplace page + recirculation seeds if approaching exhaustion |
| ~480px from sentinel (near-end) | `loadMoreFeed` — **take cache first**; network + spinner only on miss |
| After successful append | Kick next silent prefetch (keep pipeline warm) |

Adaptive distance uses scroll velocity, `navigator.connection` (downlink / saveData), and `deviceMemory` when available. Same timing on Desktop, Chrome Android, and Capacitor WebView.

## Cache strategy

- Identity: existing **requestKey** (filters / scope / search / location).
- Store: current-next and optionally second-next page (`skip` cursor).
- Cap: **2** prepared batches (+ in-flight counted toward cap).
- Invalidate: immediately on requestKey change, nearby short-circuit, filter/scope change.
- No unbounded history; recirculation prep holds **one** prepared batch in a ref.

## Spinner behaviour

- Prefetch hit → append immediately, **no** `feedLoadingMore`.
- Prefetch miss at near-end → spinner → hide in `finally` as soon as append finishes (no artificial delay).
- Diagnostics (non-UI): `spinnerVisibleDuration`, `batchAppendLatency`, hit/miss, etc. via `__hcFeedPrefetchDiag()` when geo diagnostics enabled.

## Android behaviour

- Observer / prefetch / state updates use the same margins and cache as Desktop.
- Preserves Android infinite-scroll fix: paint keyed by `nativePaintKey`; observer does not disconnect on `feedLoadingMore`.
- Capacitor still loads Production WebView for installed apps — Preview certifies Web Android / Desktop; native shell needs Production cut for full device cert.

## Safety

- Max 2 prepared pages; in-flight gated.
- Duplicate skip prevented via `hasInFlight` / `peek`.
- Stale responses discarded when requestKey changes mid-flight.
- No change to API pagination size or server composition.

## Validation (local)

- `scripts/validate-feed-prefetch-smooth.ts` — pass
- `scripts/validate-feed-composition-endless.ts` — pass
- `scripts/validate-geo-feed-contract.ts` — pass
- `scripts/validate-homepage-performance.ts` — pass

## Before vs after (expected)

| Metric | Before (`400a86d`) | After (this phase) |
| --- | --- | --- |
| Spinner on load-more | Common when scrolling into sentinel | Exceptional (cache miss / slow net) |
| Append latency | Full network RTT at sentinel | ~0 ms when prefetch hit |
| Network volume | One page per sentinel | Same pages, shifted earlier (bounded ≤ +2 warm pages) |
| Memory | Display list only | + ≤2 page batches in memory |
| Server load | Per scroll demand | Slightly earlier; not more pages overall for same scroll depth |

Exact Preview measurements to fill after deploy: spinner ms avg, prefetch hit rate, duplicate request count.

## Remaining risks

1. Double observer on same sentinel — intentional; early = prefetch only, near = append.
2. Very fast fling on slow 3G may still briefly show spinner (acceptable).
3. Capacitor Production WebView not certified until Production deploy.
4. Recirculation prep is client-side only (no extra API) — seamless only when seed inventory ≥ min.

## Recommendation

**HOLD** for Production until Preview + Android Web scroll UX confirms spinner rarity. GO for Preview soak.

| Preview | Value |
| --- | --- |
| Commit | `c7dfe88` |
| Branch | `fix/feed-prefetch-smooth` |
| Deployment | `dpl_4r7YXMrD8NdwvBwH6QsgW2r56TGu` |
| Preview URL | https://homecheff-hfcqv62i3-sergio-s-projects-f7b64ee1.vercel.app |
| Inspect | https://vercel.com/sergio-s-projects-f7b64ee1/homecheff-app/4r7YXMrD8NdwvBwH6QsgW2r56TGu |

---

## Controlled Production promotion (2026-07-17)

| Field | Value |
| --- | --- |
| Production commit | `2b66362` |
| Merged commits | `c7dfe88`, `2b66362` (only `fix/feed-prefetch-smooth`) |
| Production deployment | `dpl_23FvEVUFzoFHBCcQiFnPKtivyut8` |
| Production URL | https://homecheff-qly8xs4b6-sergio-s-projects-f7b64ee1.vercel.app |
| Aliases | `homecheff.eu`, `homecheff.nl`, `www.homecheff.eu`, `www.homecheff.nl` |
| Inspect | https://vercel.com/sergio-s-projects-f7b64ee1/homecheff-app/23FvEVUFzoFHBCcQiFnPKtivyut8 |
| Rollback deployment | `dpl_HAouUVEUatv2QrYGxx3Fn45W2SUW` |
| Rollback commit | `400a86d` |
| Rollback URL | https://homecheff-6hnw9wcy7-sergio-s-projects-f7b64ee1.vercel.app |

### Promotion verdict

- **Production promotion:** successful (web smoke OK)
- **Full GO (incl. installed Android):** **HOLD** until checklist A–K confirmed on Capacitor Production WebView
