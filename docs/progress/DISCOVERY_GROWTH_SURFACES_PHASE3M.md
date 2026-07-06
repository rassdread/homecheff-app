# Discovery Growth Surfaces — Phase 3M Progress

**Phase:** 3M — Growth Surface Integration  
**Status:** Implemented  
**Last updated:** 2026-07-06  
**Depends on:** 3K HCP Economy, 3L Community Progress, 3J Opportunity Surfaces, 3F Sidebar Stack

---

## Goal

Create the first complete **Growth & Action** experience — desktop sidebar, mobile inserts, and profile modules exposing activity, opportunity, progress, HCP, and community growth as one unified system.

---

## Deliverables

| Item | Status |
|------|--------|
| `GrowthSurfaceBundle` | Done |
| `GrowthActionStack` (desktop, 7 slots) | Done |
| Growth mobile inserts via SurfaceRouter | Done |
| `GrowthProgressProfileModule` | Done |
| `resolveRecommendedActionPair` (primary + secondary) | Done |
| Community achievement feed (5 kinds) | Done |
| `scripts/validate-growth-surfaces.ts` | Done |
| Audit docs | Done |

---

## Integration points

| Surface | Component / resolver |
|---------|---------------------|
| Desktop sidebar | `GrowthActionStack` via `plan.growthSurfaces.desktopStack` |
| Mobile feed | `interleaveMobileGrowthSurfaces` + `GrowthMobileInsertCard` |
| Profile | `GrowthProgressProfileModule` via `plan.growthSurfaces.profile` |
| SurfaceRouter | `resolveGrowthSurfaces()` in `surface-router.ts` |

---

## Desktop stack order

1. Current Action  
2. Opportunity  
3. Progress (level)  
4. Current Streak  
5. Next Milestone  
6. Community Achievement  
7. HCP Progress  

---

## Not in scope

- Ranking / trust changes  
- Sponsored placements  
- Recommendation ML engine  
- Discovery section changes  

---

## Validation

```bash
npx tsx scripts/validate-growth-surfaces.ts
npx tsx scripts/validate-surface-router.ts
npm run lint
npm run build
```

---

## References

- [GROWTH_SURFACE_AUDIT.md](../audits/GROWTH_SURFACE_AUDIT.md)
- [RECOMMENDED_ACTION_AUDIT.md](../audits/RECOMMENDED_ACTION_AUDIT.md)
- [COMMUNITY_PROGRESS_SYSTEM.md](../architecture/COMMUNITY_PROGRESS_SYSTEM.md)
- [HCP_ECONOMY.md](../architecture/HCP_ECONOMY.md)
