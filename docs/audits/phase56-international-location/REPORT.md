# Phase 5.6 — International Location Engine

**Commit:** `91115712`  
**Production:** Ready after deploy  
**Verdict:** `HOMECHEFF_INTERNATIONAL_LOCATION_PARTIAL`

## Modes

- **point** — lat/lng + radius (city/postcode/GPS/IP approx)
- **country** — countryCode boundary, radius=0, no centroid
- **global** — no location boundary when IP unknown

## Evidence

- `api-probe.json`
- `browser-smoke.json`
- `scripts/test-phase56-international-location.ts`
