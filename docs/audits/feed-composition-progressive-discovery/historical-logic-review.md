# Historical Feed Logic Review

| Mechanism | Status before repair | Source |
|---|---|---|
| Stride interleave (`FEED_SALE_INSPIRATION_STRIDE=4`) | Intact | `89fe7423` composition policy |
| Recirculation inventory 0/1/2/3+ | Intact | composition-state |
| Soft-national no-location sales | Intact | discovery-feed fix |
| Inspiration hard `nearbyNeedsLocation` empty | Removed earlier | `895cc652` |
| Inspiration Nearby eligibility during soft-national | **Still active (bug)** | `inspirationEligibleForFeedScope` |
| `FEED_RADIUS_MODE_LOCAL_FIRST` | Exists; API used STRICT for Nearby+coords | `local-discovery.ts` |
| Auto radius ladder loop | Never wired (`broadened` reserved) | composition-state |
| Manual widen CTA | Intact | `nextWiderFeedRadiusKm` |

Reconnect used existing LOCAL_FIRST + composition helpers — no new algorithm invented.
