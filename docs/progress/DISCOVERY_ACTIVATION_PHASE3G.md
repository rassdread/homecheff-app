# Discovery Activation Phase 3G — Progress

**Phase:** 3G — Real World Activation Expansion  
**Status:** Implemented  
**Last updated:** 2026-07-06

---

## Goal

Expand activations from platform actions to **real-world neighborhood actions** with contracts, resolver, safety, virality, and rewards — no UI redesign, no ranking.

---

## Deliverables

| Item | Status |
|------|--------|
| `PRACTICAL_NEIGHBORHOOD` (12 activations) | Done |
| `LOCAL_DISCOVERY` (8 activations) | Done |
| `COMMUNITY_SUPPORT` (8 activations) | Done |
| `lib/discovery/activations/` | Done |
| Safety rules | Done |
| Virality framework | Done |
| Reward framework | Done |
| `scripts/validate-real-world-activations.ts` | Done |
| Architecture + audit docs | Done |

---

## Activation count

**28** new real-world activation contracts (PN01–PN12, LD01–LD08, CS01–CS08).

---

## Resolver

`resolveRealWorldActivations()` — eligibility, safety, cooldown, dedup, priority boost (local scope + role + virality).

`buildActivationEligibilityFromSurface()` — bridge from 3B eligibility + 3F pool signals.

---

## Not in scope (3G)

- Activity card UI wiring (3H)
- SurfaceRouter integration
- Sponsored / recommendations / ranking / tiles / sections

---

## Validation

```bash
npx tsx scripts/validate-real-world-activations.ts
npm run lint
npm run build
```

---

## References

- [REAL_WORLD_ACTIVATION_EXPANSION.md](../architecture/REAL_WORLD_ACTIVATION_EXPANSION.md)
- [DISCOVERY_ACTIVATION_PHASE3C.md](./DISCOVERY_ACTIVATION_PHASE3C.md)
- [DISCOVERY_SURFACE_PHASE3F.md](./DISCOVERY_SURFACE_PHASE3F.md)
