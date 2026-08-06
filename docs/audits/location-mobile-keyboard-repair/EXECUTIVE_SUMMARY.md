# Executive Summary — Location Mobile Keyboard Repair

**Branch:** `fix/location-input-repair`  
**Date:** 2026-08-06  
**Verdict:** `HOMECHEFF_LOCATION_MOBILE_KEYBOARD_CODE_PASS_DEVICE_PROOF_REQUIRED`

## Finding

On mobile, the place/postcode field was visible, but taps did not keep DOM focus long enough for the soft keyboard to open and stay open.

## Root cause

`FeedMobileFilterSheet` focus `useEffect` depended on `[open, onClose, focusPlaceOnOpen]`. GeoFeed passed an **inline** `onClose={() => { ... }}`, so every parent re-render (including each keystroke via `setPlace`) re-ran the effect cleanup, which called `previousFocus?.focus()`. That stole focus from the place input. Follow-up programmatic `focus()`/`select()` did not reopen the Android soft keyboard (not a user gesture).

## Fix (code)

1. Sheet focus effect depends **only** on `[open]`; `onClose` / `focusPlaceOnOpen` via refs.
2. Stable `closeMobileFilterSheet` `useCallback` in GeoFeed.
3. Removed `select()` on open focus; mobile sheet path no longer runs async focus fight.
4. Synchronous `onPointerDown` → `focus()` (no `preventDefault`).
5. `type="text"`, `inputMode="search"`, `text-base` (16px).
6. Android `windowSoftInputMode="adjustResize"`.

## Device proof

**Not available in this agent environment.** Automated tests assert **focus retention**, not soft-keyboard PASS. Operator must capture Android Capacitor + Chrome portrait/landscape keyboard screenshots before Formal Review.

## Not changed

GeoFeed ownership, Workspace architecture, planners, auth, schema, GPS-mandatory policy, merge/deploy/freeze.
