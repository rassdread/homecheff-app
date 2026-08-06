# Progressive Widening Review

## Recovered model (existing constants)

| Tier | Behaviour | Mechanism |
|---|---|---|
| 1 | In-radius / local | `partitionSaleItemsByRadius` local + API local-first head |
| 2–3 | Wider eligible marketplace | `composeProgressiveNearbySalePool` wider tail; API `LOCAL_FIRST` national tail |
| 4 | Inspiration enrichment | Stride interleave + sparse → national Inspiration scope |
| Exhausted | Recirculation | Existing inventory contract |

No new radius kilometre ladder invented. Manual widen CTA (`nextWiderFeedRadiusKm`) retained.

Strict local-only Nearby sort removed from `/api/feed`.
