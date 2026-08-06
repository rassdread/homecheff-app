# Performance Summary

- No new polling.
- Removes unnecessary startup wait on profile coords (faster first discovery fetch for logged-in users without location).
- Radius filter skipped when no viewer → less empty partition work.
- Headless Chrome: no pageerrors; single primary `/api/feed` observed in probe (plus stats-preview).
- No measured bundle size delta claimed.
