# Phase 3F Wave 1 — Before / After

**Branch:** `performance/phase3f-first-paint`  
**Date:** 2026-07-14

---

## HTML & document weight

| Metric | Before (prod) | After (local `next start`) | Δ |
|--------|---------------|----------------------------|---|
| HTML bytes | 4,247,538 | 146,275 | **−96.6%** |
| TTFB | 383 ms | 289 ms | −94 ms |
| Total download | 5,489 ms | 296 ms | −5,193 ms |
| RSC push chunks | 55 | 11 | −44 |
| Script tags | 70 | 25 | −45 |
| Blob URLs | 1 | 0 | −1 |
| data:image | 22 | 0 | −22 |
| First Load JS (shared) | 637 kB | 637 kB | unchanged |

**Target:** ≥75% HTML reduction → **GROEN** (96.6%)

---

## Critical path gates

| Gate | Before | After |
|------|--------|-------|
| SSR inspiratie (24 items) | Blocking HTML serialize | **Removed** |
| Session loading | Blocks feed fetch | **Bypassed when SSR anonymous** |
| Viewport JS resolution | Blocks GeoFeed mount | **Mount immediate (`resolved: true`)** |
| GeoFeed instances | 2 (mobile OR desktop) | **1 (prop toggle)** |

---

## Feed invariants (architecture)

| Invariant | Status |
|-----------|--------|
| feedFetches = 1 (initial) | Preserved (single `fetch(feedUrl)`) |
| geoFeedMounts = 1 | Preserved (single `<GeoFeed>`) |
| Feed API contract | Unchanged |
| CDN/cache policy | Unchanged |
| Prisma / DB | Unchanged |

---

## Browser timings (FP / LCP / first tile)

Not fully automated in this pass. Use `NEXT_PUBLIC_FEED_PERF_BASELINE=1` + `window.__hcFeedPerfReport()` for:

- anonymous desktop cold/warm
- anonymous mobile viewport
- logged-in desktop

Local HTML/TTFB gains strongly indicate cold first-tile improvement; exact FP/LCP requires manual or Playwright probe.

---

## Machine-readable

See `docs/audits/homecheff-performance-phase3fw1-measurements.json`
