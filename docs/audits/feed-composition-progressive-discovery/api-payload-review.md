# API and Payload Review

| Layer | Change |
|---|---|
| `/api/feed` | Nearby radius mode → `LOCAL_FIRST` (was `STRICT_LOCAL`) |
| `/api/inspiratie` | Unchanged deferred fetch (category + q) |
| GeoFeed merge | Inspiration composition scope + progressive sale pool |
| Pagination / cache keys | Unchanged requestKey model |

Inspiration remains primarily from deferred `/api/inspiratie` + feed-only non-sale rows, interleaved client-side — ownership unchanged; eligibility reconnect only.
