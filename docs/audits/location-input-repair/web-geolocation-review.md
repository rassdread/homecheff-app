# Web Geolocation Review

- HTTPS Production required for Geolocation API.
- Hook: `hooks/useGeolocation.ts` — no mount-time `getCurrentPosition`.
- Options respected: timeout 12s (GeoFeed), maximumAge 5 min, highAccuracy false.
- Errors mapped via `lib/geo/gps-location-errors.ts`.
- No `watchPosition` on feed path.
- Stuck spinner cleared by 20s safety timer.
