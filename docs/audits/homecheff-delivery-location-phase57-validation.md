# Phase 5.7 — Delivery Location Engine Validation

**Date:** 2026-08-05  
**Branch tip:** (see git after commit)  
**Verdict:** `HOMECHEFF_DELIVERY_LOCATION_VALIDATION_PARTIAL`  
**Production recommendation:** `READY_AFTER_P0_FIXES`

## Fixes shipped

| Severity | Defect | Fix |
|---|---|---|
| P0 | Pickup anchor split (User.lat only in fee/checkout; SellerProfile in match) | `resolveDeliveryPickupCoords`: listing → SellerProfile → User |
| P0 | Booking trusted client `routeDistanceKm` / `quotedFeeCents` | Server recompute via Google route + provider pricing |
| P1 | `update-gps` omitted `lastGpsUpdate` and overwrote `User.lat/lng` | Write profile current* + `lastGpsUpdate` only |
| P1 | `nationalCoverage` treated as global distance bypass | Same-country gate in `calculateProviderDeliveryPrice` |
| P1 | Match response leaked seller lat/lng | Stripped from public payload |
| P1 | Ambiguous selector “Afstand” | Labels: route ophalen→bezorgen vs bezorger→ophalen |
| P2 | check-availability no country filter | Optional `sellerCountry` filter |

## Tests

```bash
npx tsx scripts/test-delivery-location-phase57.ts
npx tsx scripts/test-delivery-marketplace-phase2.ts
```

## Schema

No migration applied. Cross-border / multi-country provider coverage still fail-closed. Additive model (authorize separately): `baseCountryCode`, `supportedCountryCodes`, `crossBorderEnabled`.

## Scope confirmation

- No delivery architecture / dispatch / payment / feed / Workspace redesign
- No unauthorized schema migration
- Exact provider/seller coords remain non-public in match payload
