# Phase 13K Audit — Feed Performance Measurement Baseline

**Date:** 2026-07-10  
**Scope:** Instrumentation and measurement only. **Do not optimize** in this phase — no caching, refactors, query changes, or feed behavior changes beyond dev-safe timing hooks.

---

## Goal

Establish a reliable baseline for the complete HomeCheff feed loading pipeline and identify the actual bottleneck before any performance work.

---

## Instrumentation Added (retain after baseline)

| File | Purpose | Enable |
|------|---------|--------|
| `lib/feed/feed-api-timing.ts` | Server phase marks, counts, `Server-Timing` | `NODE_ENV=development` or `FEED_PERF_TIMING=1` |
| `lib/feed/feed-performance-baseline.ts` | Client `performance.mark`, counters, `window.__hcFeedPerfReport()` | `NODE_ENV=development` or `NEXT_PUBLIC_FEED_PERF_BASELINE=1` |
| `app/api/feed/route.ts` | Wires server timing into response + `Server-Timing` header | same as server module |
| `components/feed/GeoFeed.tsx` | Session, cache, fetch, tile, stable milestones | client flag |
| `components/home/HomePageClient.tsx` | Shell mount, viewport/hydration milestones | client flag |
| `components/feed/feedMedia.tsx` | First image `onLoad` milestone | client flag |
| `scripts/validate-feed-performance-baseline-phase13k.ts` | Static guards + optional live API probe | always |

### Temporary / remove after measurement?

**None.** All hooks are gated behind dev or explicit env flags and add no production overhead when disabled.

---

## Pipeline Map (unchanged behavior)

```
app/page.tsx
  → HomePageClient (viewport split, hero, session)
    → GeoFeed
      → session/bootstrap gate (feedStartupBlocked)
      → filter restore (feedSurfaceState / native prefs)
      → return cache peek (home-feed-return-cache)
      → parallel fetch /api/feed + /api/inspiratie
      → client sort/filter/ranking
      → FeedMarketplaceCard → TileMedia → FeedCardPrimaryMedia (<img loading="lazy">)
```

**API:** `app/api/feed/route.ts` — parallel Prisma (products, listings, dishes), stats groupBy, seller trust + Business DNA, discovery build, response mapping.

---

## Part 1 — Milestone Timeline (relative to navigation start)

| # | Milestone | Instrumented | Notes |
|---|-----------|--------------|-------|
| 1 | App / homepage starts | `nav:start` | Client |
| 2 | React shell mounted | `home:shell-mounted` | HomePageClient |
| 3 | Session request started | `session:loading` | GeoFeed |
| 4 | Session resolved | `session:resolved` | GeoFeed |
| 5 | Location state available | `location:available` | profile/GPS/manual |
| 6 | Filter state restored | `filter:restored` | feedSurfaceState |
| 7 | Feed request started | `feed:request-start` | fetch counter |
| 8 | Feed API request received | `request_received` | server timing |
| 9 | DB queries started | (within `db_parallel_done`) | single `Promise.all` batch |
| 10 | DB queries completed | `db_parallel_done` | server |
| 11 | Trust / Business DNA done | `trust_business_dna_done` | server |
| 12 | Feed mapping completed | `response_mapped` | server |
| 13 | API response sent | `response_sent` | server |
| 14 | Feed JSON received | `feed:json-received` | client |
| 15 | First tile rendered | `feed:first-tile-rendered` | items + hydrated |
| 16 | First tile image request | browser Network tab | not separately marked |
| 17 | First tile image visible | `feed:first-image-visible` | img onLoad |
| 18 | First screen stable | `feed:stable` | idle + 800ms fallback |
| 19 | Second feed request | `feed:second-request` | fetch counter > 1 |
| 20 | Hydration/layout change | `layout:hydration-complete` | viewport resolved |

Capture in browser: `window.__hcFeedPerfReport()` (dev / `NEXT_PUBLIC_FEED_PERF_BASELINE=1`).

---

## Part 2 — Scenario Measurements

### Measurement method legend

| Label | Meaning |
|-------|---------|
| **Measured (production API)** | Live `fetch` to `https://homecheff.eu/api/feed` from dev machine, 2026-07-10 |
| **Measured (browser)** | Requires DevTools Performance / `__hcFeedPerfReport` — not run in this session |
| **Device test required** | Android Capacitor WebView — not executed here |

### Scenario summary table

| Scenario | Feed request start | API time | First tile | First image | Stable | Requests | Source |
|----------|-------------------:|---------:|-----------:|------------:|-------:|---------:|--------|
| A — Cold Android | — | — | — | — | — | — | **Device test required** |
| B — Warm Android | — | — | — | — | — | — | **Device test required** |
| C — Mobile web refresh | — | 6067 ms (cold MISS) | — | — | — | ≥2 (feed+inspiratie) | API measured; client **browser required** |
| D — Desktop first load | — | 6067 ms (cold MISS) | — | — | — | ≥2 | API measured; client **browser required** |
| E — Detail → back | — | ~173 ms TTFB (edge HIT) | — | — | — | 0–1 if cache fresh | **Browser + device required** |
| F — Change one filter | — | ~4–6 s (MISS typical) | — | — | — | 1 feed + 1 inspiratie | **Browser required** |
| G — Geo after first render | N/A on homepage | — | — | — | — | 0 on load (GPS not auto) | **Code audit** — no auto GPS on homepage |

### Production API probe (national scope, 29 items)

| Metric | Cold (`x-vercel-cache: MISS`) | Warm (`x-vercel-cache: HIT`) |
|--------|-------------------------------:|------------------------------:|
| TTFB | **4778 ms** | **173 ms** |
| Total download | **6067 ms** | **1077 ms** |
| Response size | **8872 KB** (~8.7 MB) | same payload |
| HTTP status | 200 | 200 |
| Items returned | 29 | 29 |
| `Server-Timing` | null (prod env flag off) | null |

Nearby scope (`scope=nearby&radius=25`): **4764 ms TTFB**, **6341 ms total**, same **8872 KB** payload (MISS).

### Client counters (expected from code audit, not timed)

| Check | Finding |
|-------|---------|
| GeoFeed mounts | 1 per home layout branch after viewport resolves |
| Initial feed fetches | 1 pair (`/api/feed` + `/api/inspiratie`) unless fresh return cache |
| Session blocks feed | Yes — `feedStartupBlocked` until session + bootstrap ready |
| Geolocation second request | No on homepage load (GPS manual only) |
| Filter restoration re-fetch | Possible if restored `applied*` differs from initial defaults |
| Cached feed used | `peekFreshHomeFeedReturnCache` / `readHomeFeedReturnCache` |
| Duplicate fetch | Logged via `feed:second-request` when counter > 1 |

---

## Part 3 — Feed API Timing (server)

Phases instrumented in `lib/feed/feed-api-timing.ts`:

| Phase | Covers |
|-------|--------|
| `params_parsed` | Query parsing, scope/radius |
| `session_resolved` | `getServerSession` |
| `viewer_geo_resolved` | Viewer coordinates |
| `db_parallel_done` | Products + listings + dishes parallel query |
| `transform_done` | Row → feed item transform |
| `stats_enrichment_done` | Order stats groupBy |
| `trust_business_dna_done` | `fetchSellerTrustBundles` |
| `discovery_done` | `buildDiscoveryFeed` |
| `response_mapped` | Filter/sort/map response |
| `response_sent` | Serialization |

**Production probe (no server timing header):** total wall time **6067 ms** on cold MISS; local dev with `FEED_PERF_TIMING=1` required for phase breakdown.

| Report field | Production (measured) |
|--------------|----------------------|
| Query batches | 3 logical batches (parallel DB, stats, trust) — from code |
| Slowest segment | Entire handler on cold path (~6 s) — phase split needs dev probe |
| N+1 pattern | No classic N+1 in main product query; trust bundle is batched by seller IDs |
| Products / dishes count | 29 items total in national response |
| Response JSON size | **9085093 bytes (~8872 KB)** |
| Base64 inline images | **12 / 29 items**, ~**2.08 MB** of base64 in JSON alone |

---

## Part 5 — Network & Payload Audit (first feed request)

| Field | Value |
|-------|-------|
| Endpoint | `GET /api/feed?scope=national&radius=0` |
| Status | 200 |
| TTFB (cold) | 4778 ms |
| Download | ~1290 ms after TTFB (6067 total) |
| Response size | 8872 KB uncompressed JSON |
| Compressed size | Not reported by probe (no `content-encoding` on sample) |
| Rows returned | 29 |
| First image URLs | Mix of Vercel Blob HTTPS + **`data:image/jpeg;base64,...`** inline |
| Next/Image optimized URLs | **No** — raw `<img src>` in `FeedCardPrimaryMedia` |
| First image priority | **No** — all tiles use `loading="lazy"` |
| Below-fold lazy | Yes — lazy on all including first tile |

### Requests in first 5 s (typical cold homepage — inferred from architecture)

| Request | Classification |
|---------|----------------|
| `/api/auth/session` | Required |
| `/api/feed` | Required |
| `/api/inspiratie` | Required (parallel startup) |
| User bootstrap / profile | Required when logged in |
| Hero / i18n / fonts | Required or deferrable |
| Second `/api/feed` after filter restore | Duplicate (if triggered) |
| Analytics | Deferrable |

---

## Part 6 — Rendering Audit (code inspection)

| Check | Finding |
|-------|---------|
| Virtualization | **None** — all visible rows rendered |
| Tile components mounted | One `FeedMarketplaceCard` per row in feed grid |
| Expensive per-tile work | Taxonomy derive, distance enrich, trust badges (client-side from payload) |
| Repeated settlement resolution | Per-item in mapping pipeline |
| Context rerenders | GeoFeed large state tree — filter changes rerender full feed |
| Layout shifts | Viewport split (`showMobileHomeFeed`) after `viewportResolved` — single layout switch |
| Aspect ratio | `aspect-[4/3]` / configurable ratio on tiles |
| Below viewport fully rendered | Yes — no windowing |

---

## Part 7 — Baseline Results (real values only)

See scenario table in Part 2. **Android scenarios A/B not measured.** Desktop/mobile **client** milestones require browser capture with `NEXT_PUBLIC_FEED_PERF_BASELINE=1`.

Stored probe artifact: `docs/audits/feed-performance-baseline-probe-latest.json` (regenerated by validator when probe succeeds).

---

## Part 8 — Bottleneck Ranking

### 1. Largest — Feed JSON payload size (~8.7 MB)

- **Evidence:** Production response **9085093 bytes**; **12 items** embed **~2.08 MB** base64 images in JSON.
- **Measured:** 6067 ms total cold download; 1077 ms even on edge cache HIT (payload still full size).
- **Scenarios:** C, D, F; back navigation mitigated by return cache.
- **Improvement potential:** High — strip inline base64, paginate, slim discovery payload.
- **Risk:** Medium — must preserve listing media fidelity.
- **Future class:** **Architecture change**

### 2. Second — Cold server / origin time (~4.8 s TTFB)

- **Evidence:** `x-vercel-cache: MISS` → **4778 ms TTFB** vs **173 ms HIT**.
- **Scenarios:** Cold Android, mobile refresh, desktop first load, filter change.
- **Improvement potential:** High for cold path (DB + trust + discovery).
- **Risk:** Medium–high for query changes.
- **Future class:** **Medium change** (phase timing in dev will show DB vs trust split)

### 3. Third — Session/bootstrap gate before first fetch

- **Evidence:** `feedStartupBlocked` blocks fetch until session + bootstrap complete.
- **Scenarios:** All cold starts; logged-in users wait longer.
- **Improvement potential:** Medium — anonymous-first fetch vs logged-in enrichment.
- **Risk:** Medium — radius/location correctness.
- **Future class:** **Medium change**

### 4. Minor contributors

| Contributor | ms (est.) | Class |
|-------------|-----------|-------|
| Parallel `/api/inspiratie` on startup | Adds network contention | Quick win to defer |
| First tile `loading="lazy"` | Delays first image vs pilot target | Quick win |
| No feed virtualization | Main-thread/DOM cost on long feeds | Architecture change |
| Viewport hydration layout pick | One-time layout switch | Minor |
| Full-size blob images (no resize param) | Image bytes after JSON parse | Medium change |

**Not worth changing for pilot:** Hero/i18n bundle order, onboarding banners.

---

## Part 9 — Pilot Target Comparison

| Target | Threshold | Status | Evidence |
|--------|-----------|--------|----------|
| Cached feed visible | < 300 ms | **Not verified** | Return cache exists; client timing not measured |
| Warm first tile | < 500 ms | **Not verified** | Browser/device required |
| Cold first tile | < 1500 ms | **Fail (likely)** | API alone 6067 ms on cold MISS |
| First image visible | < 2000 ms | **Fail (likely)** | 8.7 MB JSON + lazy first image |
| Back navigation | Near-instant | **Partial** | Return cache + stale-while-revalidate; not timed |
| One initial feed request | 1 unless justified | **At risk** | Feed + inspiratie always parallel; possible second on filter restore |

---

## Verdict

**Baseline instrumentation complete.** Production measurement proves the dominant issue is **multi‑megabyte feed JSON** (inline base64 media + full discovery payload) combined with **multi‑second cold origin time**. Client-side scenario timings and Android cold/warm starts remain **device/browser tests** using the added milestones.

**Do not optimize in Phase 13K** — use this baseline to prioritize Phase 13L+ work.

---

## Phase 13L after measurements (2026-07-10)

Implemented in Phase 13L — see `docs/audits/FEED_PAYLOAD_REDUCTION_PHASE13L_AUDIT.md`.

| Metric | 13K before (production) | 13L after (local `npm run start`) |
|--------|------------------------:|----------------------------------:|
| First-page JSON size | 8872 KB (~29 items) | **32 KB** (10 items, `take=10`) |
| Full slim pool | 8872 KB | **58 KB** (29 items, `take=40`) |
| Inline `data:image` count | 12 items | **0** |
| Inspiratie on critical path | Parallel with feed | **Deferred** after first page |
| First tile image | `lazy` | **`eager`** |

Production TTFB/size re-measurement pending deploy; payload structure changes are server-side and apply on next release.
