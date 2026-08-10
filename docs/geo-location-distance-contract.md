# HomeCheff location / distance contract

## Physical (non-digital) listings

When location is required for publish (`saleProductRequiresLocation`):

A publishable location **must resolve to coordinates** via:

1. Custom place mode: `pickupLat` + `pickupLng` (required — seller profile coords are not a silent fallback), or
2. `useProfileLocation=true` with resolvable SellerProfile / User lat/lng (and optional pickup override).

Place/address **text alone is not sufficient**.

City-level / area centroids are acceptable for privacy.

## Write-time place → coordinates

Create/edit/profile resolve human place input to coordinates **before** persist:

- Provider path: existing Google Maps (+ Nominatim fallback) via `resolvePlaceInput` / `/api/geocoding/resolve-place`
- Unambiguous single match (e.g. Vlaardingen + NL) → auto-accept
- Ambiguous / known-risk names (e.g. Sint Maarten) → user must confirm; never silent guess
- Changing place text invalidates previous coordinates until re-resolved
- **Never** geocode listing places during `/api/feed`, GeoFeed, card render, sort, or radius

## Distance

- Computed only from coordinates (haversine), never from place text.
- `distanceKm >= 0` is valid (including same-point `0`).
- `null` / `undefined` / `NaN` = unknown — sort nulls-last; never exact-radius; never coerce to `0`.

## Display

- Place + distance → `Plaats · 3.2 km`
- Place + unknown → `Plaats · afstand onbekend`
