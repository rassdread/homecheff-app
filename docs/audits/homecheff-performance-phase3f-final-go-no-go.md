# Phase 3F — Final GO / NO-GO

**Commit:** `04775f6`  
**Date:** 2026-07-14

---

## Decision summary

| Gate | Status |
|------|--------|
| 3F.1 Tier A + coords | **GO** |
| 3F.2 CDN headers | **GO** |
| 3F.3 Origin cache | **GO** (functional; observability header optional) |
| 3F.4 Revalidation | **GO** static (19/19) |
| Preview CDN HIT | **GO** — warm ~171 ms |
| Parity national±coords | **GO** |
| Security validators | **GO** |
| **Merge to main** | **GO** |
| **Production deploy** | **GO** after post-merge validation |

---

## Preview evidence (manual)

- CDN HIT: runs 2–5 on both URL variants
- Warm median ~171 ms vs ~2290 ms pre-3F warm origin (**~92% improvement**)
- Tier A with and without coords
- Identical item IDs and order; only `distanceKm` differs with coords

---

## Non-blocking follow-ups

1. **Origin-cache observability** — confirm `X-Feed-Origin-Cache: hit|miss` on production
2. **Revalidation live test** — safe preview fixture for publish → feed refresh
3. **Phase 13L** — 4 pre-existing inline data URLs in live DB payload (not 3F)

---

## Risks accepted

- Stale feed up to ~45 s CDN TTL + 90 s SWR without mutation (mitigated by `revalidateTag` on publish)
- Cross-instance origin stampede on cold MISS (mitigated by CDN SWR)

---

## Constraints

- No database / migration / Neon / Render changes required
- No query refactor in this release
