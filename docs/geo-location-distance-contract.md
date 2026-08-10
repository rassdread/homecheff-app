# HomeCheff location / distance contract

## Physical (non-digital) listings

When location is required for publish (`saleProductRequiresLocation`):

A publishable location **must resolve to coordinates** via:

1. `pickupLat` + `pickupLng`, or
2. `useProfileLocation` with SellerProfile / User lat/lng, or
3. another source resolved by `resolveProductCoords()`.

Place/address **text alone is not sufficient**.

City-level / area centroids are acceptable for privacy.

## Distance

- Computed only from coordinates (haversine), never from place text.
- `distanceKm >= 0` is valid (including same-point `0`).
- `null` / `undefined` / `NaN` = unknown — sort nulls-last; never exact-radius; never coerce to `0`.

## Display

- Place + distance → `Plaats · 3.2 km`
- Place + unknown → `Plaats · afstand onbekend`
