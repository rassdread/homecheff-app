# Cleanup Summary

## Database state (production Neon)

At apply time the production database already contained **no active Phase5x / E2E / demo listing artifacts**.

| Metric | Count |
|--------|------:|
| Active products | 7 |
| Inactive products | 0 |
| Image rows | 9 |
| Published dishes | 21 |
| Users (not deleted) | 37 |
| Products deactivated this run | 0 |
| Users soft-hidden this run | 0 |
| Invalid image rows deleted | 0 |
| Broken HEAD image URLs | 0 |

## Remaining marketplace content (kept)
Legitimate demonstration / real listings, including Design Studio, paintings, food offers from real sellers (Sergio Arrias, Camila Rijs, Sacco Van munster, Antonia Brown, etc.).

## Feed / image behaviour
- Live `/api/feed` returns real titles only (no Phase5x / lorem / dummy).
- `data:` images are remapped to `/api/feed/media` proxy (HTTP 200).
- Blob URLs return HTTP 200.
- Client `FeedCardImage` uses one-shot `onError` → `/placeholder.webp` (no retry loop).
- Sanitizer now strips development placeholder paths (`/placeholder.png`, placehold.co, etc.) from feed JSON.

## Code delivered
- `scripts/production-cleanup-phase1.ts` — reusable audit/apply tool for future cleanups
- `lib/feed/sanitize-feed-response-media.ts` — reject placeholder listing URLs
- This evidence pack
