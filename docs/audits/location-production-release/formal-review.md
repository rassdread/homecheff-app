# Formal Review

Reviewed tip `ccdf0f30` / merge `ae8cbb04` against production predecessor `b3309f19`.

## Manual entry

- Discovery filters default open; `hc:focus-place-input` bridge.
- Mobile sheet `focusPlaceOnOpen`; Enter applies place.
- Place inputs not disabled/readOnly.

## GPS flow

- Explicit user action only; timeout bounded; safety spinner clear.
- Structured errors; denial opens manual fallback.
- Capacitor Geolocation FINE+COARSE; no BACKGROUND.

## Reverse geocoding

- Best-effort label; non-blocking on failure (`lib/geo/reverse-geocode-label.ts`).

## Mobile focus lifecycle

- Sheet effect deps=`[open]` only; `onCloseRef` / `focusPlaceOnOpenRef`.
- Stable `closeMobileFilterSheet` useCallback.
- No `select()` on open; `onPointerDown` sync focus without preventDefault.
- No stale cleanup focus theft on keystroke re-renders.

## Android manifest

- `windowSoftInputMode="adjustResize"` present in source and in built debug APK (`0x10`).

## Ownership / regressions

| Area | Result |
|---|---|
| GeoFeed ownership | Unchanged SSOT |
| Auth | Untouched |
| Workspace / planners | Untouched (AW GeoFeed authority tests PASS) |
| Database / schema | Untouched (`prisma validate` PASS) |
| Dorpsplein / Inspiratie | Only removed obsolete `fallbackToManual` option |

## Conclusion

Code formal review: **PASS**. Device proof still required for production freeze.
