# Performance summary

- No new network calls.
- Removed async focus retry loop on the mobile sheet path (fewer timers).
- Effect no longer re-subscribes on every GeoFeed render while sheet open.
- Negligible UI cost: `text-base` on place inputs; `onPointerDown` focus guard.
