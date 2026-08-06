# Reverse-Geocoding Review

- After GPS success, `reverseGeocodeDisplayLabel` runs best-effort (5s timeout).
- Feed refresh does **not** wait on reverse geocode — coordinates are enough for nearby.
- Chip shows city/postcode label when available, else “Mijn locatie”.
- Failure → null label; no eternal loading; coords remain.
