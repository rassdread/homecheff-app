# Performance Summary

- No new polling endpoints.
- Single deferred Inspiration fetch retained.
- LOCAL_FIRST may return a larger Nearby payload than STRICT_LOCAL (by design for progressive discovery); still bounded by existing `take`.
- No remount / second composition owner.
