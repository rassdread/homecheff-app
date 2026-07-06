# Discovery HCP Phase 3K — Progress

**Phase:** 3K — HCP Growth & Activation Economy  
**Status:** Implemented  
**Last updated:** 2026-07-06  
**Depends on:** Activations 3G, Opportunity Economy 3I–3J

---

## Goal

Create the **HCP reward layer** for activations and opportunities — participation rewards without ranking, trust, review, reputation, or visibility effects.

---

## Deliverables

| Item | Status |
|------|--------|
| `lib/hcp/economy/` (8 modules) | Done |
| 7 reward categories | Done |
| 12 reward actions | Done |
| Daily / weekly caps + cooldowns | Done |
| Anti-gaming framework | Done |
| Recognition framework | Done |
| `HcpSidebarIntegrationPlan` | Done |
| `scripts/validate-hcp-economy.ts` | Done |
| Architecture + audit docs | Done |

---

## Resolvers

| Function | Purpose |
|----------|---------|
| `resolveActivationHcpReward()` | Per activation category |
| `resolveOpportunityHcpReward()` | Per opportunity type |
| `resolveHcpEconomy()` | Combined + sidebar plan |
| `buildHcpSidebarIntegrationPlan()` | Progress / milestones / streak |

---

## Not in scope (3K)

- `award-hcp` / Prisma ledger wiring
- Ranking, trust, recommendation changes
- Sponsored placements
- Discovery section changes
- `/mijn-hcp` UI wiring (follow-up)

---

## Validation

```bash
npx tsx scripts/validate-hcp-economy.ts
npm run lint
npm run build
```

---

## References

- [HCP_ECONOMY.md](../architecture/HCP_ECONOMY.md)
- [HCP_REWARD_MATRIX.md](../audits/HCP_REWARD_MATRIX.md)
- [HCP_ANTI_GAMING.md](../audits/HCP_ANTI_GAMING.md)
