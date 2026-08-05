# Performance Summary

- No new client polling loops added (social-success poll interval unchanged at 400ms / 15s max).
- No extra provider round-trips.
- Middleware www redirect is a single 307 (same pattern as existing .nl→.eu).
- No material bundle change beyond small auth helpers.
