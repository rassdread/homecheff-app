# HomeCheff Production Cleanup Phase 1

**Date:** 2026-08-05  
**Repo:** rassdread/homecheff-app  
**Branch:** main  
**Scope:** Production data cleanup only — no architecture, SEO, Workspace, schema, or API contract changes.

## Summary

Removed Phase 51–53 validation marketplace artifacts and broken `/placeholder.png` image rows from production. Kept legitimate marketplace listings (art, food, Design Studio) and real users.

## Results

| Metric | Count |
|--------|------:|
| Products hard-deleted (QA Phase listings) | 7 |
| Products deactivated | 0 |
| Users removed (phase51 buyer/seller + demo@homecheff.app) | 3 |
| Broken / placeholder image rows removed | 6 |
| Placeholder / test dishes removed | 4 |
| Wanted/community listings removed | 0 |
| Products remaining (all active) | 7 |
| Flagged artifacts after re-inventory | 0 |

### Removed products (titles)

- Phase53 E2E Meal €1
- Phase52 Service Proposal Item
- Phase52 Free Meal
- Phase52 Barter Only Meal
- Phase51 after form
- x
- Phase51 Smoke Meal (edited)

### Removed users

- `phase51+buyer…@homecheff-validation.test`
- `phase51+seller…@homecheff-validation.test`
- `demo@homecheff.app` (Demo User)

## Image cleanup

- Deleted Image rows pointing at `https://homecheff.eu/placeholder.png`
- Remaining blob URLs verified HTTP 200 via HEAD
- Remaining `data:image/jpeg;base64,…` kept (renderable; not invented)
- UI already uses `SafeImage` for graceful failure without retry spam

## Feed quality

Live `/api/feed` after cleanup: no Phase*, placeholder.png, validation.test, or lorem matches. Titles are realistic marketplace content.

## Empty states / polish

- Homepage HTTP 200
- Feed HTTP 200
- No architecture code paths changed
- Category empty-state components left as-is (layout-stable)

## Tooling

- `scripts/production-cleanup-phase1.ts` — dry-run by default; `--apply` for execution
- Does **not** use destructive full-wipe scripts (`cleanup-test-data.js`)

## Unchanged (confirmed)

- Adaptive Workspace
- SEO / AI discoverability (`llms.txt`, `ai.txt`, robots, sitemap, structured data)
- GeoFeed / feed ownership / rendering architecture
- Auth, Stripe, messaging, delivery architecture
- Database **schema** (data only)
- API contracts

## Screenshots

See `screenshots/after-home.png` and `screenshots/after-feed-scroll.png` (post-cleanup).

Live browser proof (post-cleanup): homepage title OK; **0** console errors; **0** bad image HTTP responses for blob/placeholder paths.

## Related commits

- Data apply executed against production Neon (this report’s counts) before tooling merge.
- Follow-up tooling on `main`: `af6b269` — reusable cleanup script + feed placeholder URL sanitizer (`lib/feed/sanitize-feed-response-media.ts`). A later dry-run/apply saw **0** remaining flags because artifacts were already removed.
