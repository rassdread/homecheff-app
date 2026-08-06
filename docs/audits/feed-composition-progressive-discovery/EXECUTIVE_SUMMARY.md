# Executive Summary — Feed Composition & Progressive Discovery

**Branch:** `fix/feed-composition-progressive-discovery`  
**Date:** 2026-08-06

## Problem

“Alles” showed marketplace-only content. Inspiration appeared only on the Inspiration chip. Nearby used strict local filtering, so wider relevant items never entered the mixed feed.

## Root cause

1. Inspiration geo eligibility used raw `appliedScope === nearby` during soft-national discovery → Inspiration emptied while sales remained.
2. `/api/feed` Nearby+coords used `STRICT_LOCAL` → no progressive national tail.
3. Client `salePoolForRanking` kept only in-radius items → local-only, not local-first.

## Repair

- `resolveInspirationCompositionScope` — national Inspiration under no-location / sparse local.
- API Nearby → `FEED_RADIUS_MODE_LOCAL_FIRST`.
- `composeProgressiveNearbySalePool` — local then wider on client.
- Existing stride interleave / recirculation unchanged.

## Verdict

`HOMECHEFF_MIXED_FEED_PROGRESSIVE_DISCOVERY_PASS`  
`READY_FOR_FORMAL_REVIEW`
