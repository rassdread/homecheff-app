# Phase 13K Progress — Feed Performance Baseline

**Status:** Complete (instrumentation + production API baseline)  
**Date:** 2026-07-10

---

## Completed

- [x] Server timing module (`lib/feed/feed-api-timing.ts`)
- [x] Client milestone module (`lib/feed/feed-performance-baseline.ts`)
- [x] Wire `/api/feed` phases + optional `Server-Timing` header
- [x] Wire GeoFeed, HomePageClient, feedMedia milestones (dev/debug gated)
- [x] Validator script with optional live probe
- [x] Production API baseline captured (cold/warm)
- [x] Audit report with bottleneck ranking and pilot target comparison

---

## How to capture client baselines

1. Run dev with flags:
   ```bash
   NEXT_PUBLIC_FEED_PERF_BASELINE=1 FEED_PERF_TIMING=1 npm run dev
   ```
2. Open homepage (desktop or mobile emulation).
3. In DevTools console:
   ```javascript
   window.__hcFeedPerfReport()
   ```
4. Record milestones relative to navigation start for scenarios C–G.

### Android (scenarios A & B)

- Cold: force-stop app, clear WebView cache if testing true cold, launch via Open Testing.
- Warm: reopen within ~30 s of background.
- Use Chrome remote debugging → same `__hcFeedPerfReport()` or Performance tab.

---

## Measured production API (2026-07-10)

| Probe | TTFB | Total | Size | Cache |
|-------|-----:|------:|-----:|-------|
| Cold MISS | 4778 ms | 6067 ms | 8872 KB | MISS |
| Warm HIT | 173 ms | 1077 ms | 8872 KB | HIT |

Regenerate: `FEED_BASE_URL=https://homecheff.eu FEED_PERF_PROBE=1 npx tsx scripts/validate-feed-performance-baseline-phase13k.ts`

---

## Follow-up (not in 13K)

1. Device/browser client timings for full scenario table
2. Dev server phase breakdown (`FEED_PERF_TIMING=1`) to split DB vs trust vs discovery
3. Payload slimming proposal (base64 in feed JSON — **12/29 items**, ~2 MB)
4. Defer `/api/inspiratie` off critical path
5. First-tile image priority (pilot target < 2 s)

---

## Validation

```bash
npx tsx scripts/validate-feed-performance-baseline-phase13k.ts
npm run lint
npm run build
```

---

## Files touched

| File | Change |
|------|--------|
| `lib/feed/feed-api-timing.ts` | New |
| `lib/feed/feed-performance-baseline.ts` | New |
| `app/api/feed/route.ts` | Server timing hooks |
| `components/feed/GeoFeed.tsx` | Client milestones |
| `components/home/HomePageClient.tsx` | Shell/hydration marks |
| `components/feed/feedMedia.tsx` | First image mark |
| `scripts/validate-feed-performance-baseline-phase13k.ts` | New |
| `docs/audits/FEED_PERFORMANCE_BASELINE_PHASE13K_AUDIT.md` | New |
| `docs/progress/UX_FINALIZATION_PHASE13K_FEED_PERFORMANCE_BASELINE.md` | This file |

**Retain all instrumentation** — gated behind dev/env flags.
