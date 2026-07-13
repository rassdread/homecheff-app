# Phase 3F — Final GO / NO-GO (Implementation)

**Branch:** `performance/phase3f-anonymous-cache`  
**Date:** 2026-07-14

## Summary

| Item | Decision |
|------|----------|
| 3F.1 Tier A + coords | **GO** — sort parity fixed; static tests pass |
| 3F.2 CDN headers | **GO** |
| 3F.3 Origin cache | **GO** — pending preview latency proof |
| 3F.4 Revalidation | **GO** — wired to product/dish/listing mutations |
| Preview commit | **GO** (after lint/build/smoke + validators) |
| Production merge | **HOLD** — user instruction: no merge/deploy |

## Risks

1. **Cross-instance stampede** on cold origin — mitigated by CDN SWR, not eliminated
2. **Stale feed up to ~45s** without mutation — acceptable with tag invalidation on publish
3. **Live parity** — static proofs only; recommend preview probe before prod merge

## Not done (per scope)

- No DB/migration/schema changes
- No commit/push/merge/deploy
- No homepage SSR defer, cron warm, Prisma Accelerate

## Validators

```bash
npx tsx scripts/validate-feed-tier-a-coords-phase3f.ts
npx tsx scripts/validate-feed-cdn-headers-phase3f.ts
npx tsx scripts/validate-feed-origin-cache-phase3f.ts
npx tsx scripts/validate-feed-revalidation-phase3f.ts
npx tsx scripts/validate-feed-cache-security-phase3f.ts
npx tsx scripts/validate-feed-cache-safety-phase3b.ts
```
