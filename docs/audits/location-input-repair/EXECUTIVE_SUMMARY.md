# Location Input Repair — Executive Summary

**Branch:** `fix/location-input-repair`  
**Base:** `origin/main` @ `b3309f19`  
**Date:** 2026-08-06

## Verdict

`HOMECHEFF_LOCATION_INPUT_CODE_PASS_OPERATOR_ACTION_REQUIRED`

Code repair is complete and validated by focused automated checks. Live Production browser DOM proof was blocked by Vercel Security Checkpoint for headless agents. Android real-device proof was not available in this environment. Formal review / merge / deploy are intentionally out of scope for this phase.

## Root cause (proven in source)

Manual place/postcode entry lived inside Discovery Filters. On the legacy homepage path those filters defaulted to **collapsed** (`filtersOpen=false`), so the place `<input>` was **unmounted**. “Wijzig locatie” / choose-place called `placeInputRef.focus()` against a null ref and only toggled an unrelated “more filters” flag — the field appeared closed/disabled and could not be typed into.

Mobile sheet additionally autofocused the close button on open, racing place focus.

## Fix

1. Default Discovery Filters open so the place field is mounted.
2. Cross-component `hc:focus-place-input` event expands filters and retries focus.
3. Mobile sheet `focusPlaceOnOpen` focuses the place field for choose-place.
4. Enter on place input applies filters (manual fallback without autocomplete).
5. Accessibility: labels, `data-testid="feed-place-input"`, `enterKeyHint`.

## GPS / Use my location (same phase)

Also repaired:

- `useGeolocation` now respects caller timeout (was overridden to 25–30s by UA sniffing).
- Structured deny/timeout/unavailable messages with immediate manual place fallback.
- 20s safety timer clears a stuck GPS spinner.
- Capacitor Geolocation path for Android (`eu.homecheff.mobile`) with FINE+COARSE only (no background).
- Best-effort reverse-geocode label after GPS success; feed uses coordinates immediately.

Validators: `npm run test:gps-location-repair` (30/30).

## Not changed

Auth, GeoFeed ownership, AvailableSpace, Workspace architecture, planners, schema, SEO/AI, geocoder provider replacement.
