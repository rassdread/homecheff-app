# Root Cause

## Inspiration missing from Alles

Soft-national / discovery sales fetch ran without requiring Inspiration coords, but client filtered Inspiration with `inspirationEligibleForFeedScope({ scope: appliedScope })` where `appliedScope` stayed `nearby`. Nearby rules require viewer + item coords → Inspiration pool empty → interleave had nothing to insert. Inspiration chip bypassed mix and showed Inspiration-only from the same filtered slots (also empty under Nearby without coords) or different path when scope national.

## Progressive widening suppressed

1. API: Nearby with viewer used `STRICT_LOCAL` → out-of-radius items removed server-side.
2. Client: `salePoolForRanking = localSalePool` only when location known → discarded wider partition.

Local-first (`sortFeedItemsLocalFirst` / `FEED_RADIUS_MODE_LOCAL_FIRST`) already encoded progressive discovery; Nearby paths bypassed it.
