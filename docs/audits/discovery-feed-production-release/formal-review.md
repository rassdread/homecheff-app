# Formal Code Review

Independent inspection of `895cc652` (7 files).

## Root cause (confirmed)

Soft-national/discovery fetch could succeed without coords while `appliedScope` stayed Nearby. Client `locationFilterActive = nearby && radius > 0` partitioned to `local` only; items without `distanceKm` were dropped → blank grid. `isZeroResultsEligible` also suppressed empty UI when `nearbyNeedsLocation`. Logged-in startup could wait on profile coords.

## Repair (runtime-traced)

1. **Radius filter** — `locationFilterActive` requires `!nearbyNeedsLocation && hasViewerCoordsForSort`. Without location, `salePoolForRanking = filteredSaleBase` (full discovery set).
2. **Nearby with coords** — filter still applies when viewer coords exist.
3. **Soft-national fetch** — unchanged; still remaps request when `nearbyNeedsLocation`.
4. **Zero-results** — `nearbyNeedsLocation` no longer early-returns false in `isZeroResultsEligible`.
5. **Startup** — `feedStartupBlocked` is session-resolution only (removed `nearbyScopeAwaitingProfileCoords`).
6. **Inspiration / recirculation** — no longer gated on `nearbyNeedsLocation`.
7. **LocationRefineBanner** — still soft (`showNearbyLocationRequired = false`).
8. **Ownership** — GeoFeed-only change; no remount/ownership shift.

Comments/tests were not treated as proof; conditions above were read in source.
