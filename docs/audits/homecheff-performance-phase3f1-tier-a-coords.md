# Phase 3F.1 — Tier A National + Coords

**Branch:** `performance/phase3f-anonymous-cache`  
**Status:** GO (parity proven statically)

## Problem

Anonymous `scope=national&radius=0` with `lat/lng` was classified **Tier B**, forcing full origin render (~1.8–4.6 s) despite coordinates only affecting distance **labels**, not item selection or ranking.

Root cause: `sortFeedItemsLocalFirst` used `viewerGeo` as distance tiebreaker even when radius was unlimited (national).

## Fix

1. **`lib/geo/local-discovery.ts`** — For unlimited radius, sort with `viewerGeo: null` (recency-only). `distanceKm` still computed on items for presentation.
2. **`lib/feed/feed-cache-policy.ts`** — `isNationalLabelsOnlyCoords()` + Tier A when national + coords + radius=0 + no place.
3. **Origin cache** — Key excludes lat/lng; `applyFeedViewerDistanceLabels()` runs post-cache hit.

## Parity proof

| Check | Result |
|-------|--------|
| Same item IDs with/without coords | ✅ unit test |
| Same sort order | ✅ `sortFeedItemsLocalFirst` test |
| distanceKm stripped before cache | ✅ |
| distanceKm restored post-cache | ✅ |
| Discovery/trust unchanged | ✅ same pipeline; coords not in build URL |

## Validator

`npx tsx scripts/validate-feed-tier-a-coords-phase3f.ts`
