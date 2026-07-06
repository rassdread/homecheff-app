# Discovery Opportunity Phase 3I — Progress

**Phase:** 3I — Opportunity Economy Foundation  
**Status:** Implemented  
**Last updated:** 2026-07-06  
**Depends on:** 3F Sidebar Stack, 3G Real-World Activations

---

## Goal

Create the **Opportunity Economy** layer — canonical contracts, eligibility, rewards framework, lifecycle, and resolver for growth/participation paths. Foundation only; no payments or ranking.

---

## Deliverables

| Item | Status |
|------|--------|
| 10 canonical opportunity types | Done |
| `OpportunityContract` | Done |
| Eligibility system (11 signals) | Done |
| `resolveOpportunityContracts()` | Done |
| 6 opportunity categories | Done |
| Reward framework | Done |
| Lifecycle (6 states) | Done |
| `lib/discovery/opportunities/` | Done |
| `scripts/validate-opportunity-economy.ts` | Done |
| i18n `opportunities.economy.*` (nl + en) | Done |
| Architecture + audit docs | Done |

---

## Resolver outputs

| Function | Target | Cap |
|----------|--------|-----|
| `resolveDesktopSidebarOpportunities` | `desktop_sidebar` | 1 |
| `resolveMobileInsertOpportunities` | `mobile_insert` | 1 |
| `resolveProfileModuleOpportunities` | `profile_module` | 3 |
| `resolveOpportunitySurfaceBundle` | all three | per-cap |

---

## Not in scope (3I)

- Payments, commissions, affiliate calculations
- Ranking / trust engine changes
- Sponsored implementation
- Discovery section changes
- SurfaceRouter UI wiring (follow-up)

---

## Validation

```bash
npx tsx scripts/validate-opportunity-economy.ts
npm run lint
npm run build
```

---

## References

- [OPPORTUNITY_ECONOMY.md](../architecture/OPPORTUNITY_ECONOMY.md)
- [OPPORTUNITY_TYPES.md](../audits/OPPORTUNITY_TYPES.md)
- [OPPORTUNITY_ELIGIBILITY.md](../audits/OPPORTUNITY_ELIGIBILITY.md)
- [DISCOVERY_SURFACE_PHASE3F.md](./DISCOVERY_SURFACE_PHASE3F.md)
- [DISCOVERY_ACTIVATION_PHASE3G.md](./DISCOVERY_ACTIVATION_PHASE3G.md)
