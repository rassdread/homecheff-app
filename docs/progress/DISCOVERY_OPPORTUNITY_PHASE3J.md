# Discovery Opportunity Phase 3J — Progress

**Phase:** 3J — Opportunity Surface Integration  
**Status:** Implemented  
**Last updated:** 2026-07-06  
**Depends on:** 3I Opportunity Economy, 3F Sidebar Stack

---

## Goal

Wire the Opportunity Economy into the Surface System so users see real participation opportunities on desktop sidebar, mobile feed, and profile — without payments, ranking, or sponsored inventory.

---

## Deliverables

| Item | Status |
|------|--------|
| `resolveOpportunitySurfaceBundle()` → SurfaceRouter | Done |
| `OpportunitySurfaceStack` (desktop, max 1) | Done |
| Mobile insert pipeline (Platform → Activity → Opportunity) | Done |
| `OpportunityProfileModule` (requirements, benefits, progress) | Done |
| Community Helper expansion (8 variants) | Done |
| `OpportunityProgressContract` | Done |
| `scripts/validate-opportunity-surfaces.ts` | Done |
| Audit docs | Done |

---

## Integration points

| Surface | Component / resolver |
|---------|-------------------|
| Desktop sidebar | `OpportunitySurfaceStack` via `plan.opportunityEconomy.desktopSidebar` |
| Mobile feed | `interleaveMobileOpportunitySurfaces` + `OpportunityEconomyCard` |
| Profile | `OpportunityProfileModule` via `plan.opportunityEconomy.profileModules` |

---

## Not in scope

- Payments, commissions, affiliate calculations
- Ranking / discovery section changes
- Sponsored placements
- Service marketplace changes

---

## Validation

```bash
npx tsx scripts/validate-opportunity-surfaces.ts
npx tsx scripts/validate-opportunity-economy.ts
npx tsx scripts/validate-surface-router.ts
npm run lint
npm run build
```

---

## References

- [OPPORTUNITY_SURFACE_AUDIT.md](../audits/OPPORTUNITY_SURFACE_AUDIT.md)
- [COMMUNITY_HELPER_EXPANSION.md](../audits/COMMUNITY_HELPER_EXPANSION.md)
- [DISCOVERY_OPPORTUNITY_PHASE3I.md](./DISCOVERY_OPPORTUNITY_PHASE3I.md)
