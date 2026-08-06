# Discovery continuity — executive summary (adaptive)

**Verdict:** `HOMECHEFF_DISCOVERY_CONTINUITY_ADAPTIVE_PASS`  
**Gate:** `READY_FOR_FORMAL_REVIEW`  
**Branch:** `fix/feed-composition-progressive-discovery`  
**Status:** Feature-complete on branch — not merged / not deployed / not frozen.

## Product rule

Continuity is **composition-driven**. The feed composition layer decides whether the exact constrained result set is sufficient for a natural HomeCheff experience. No fixed result-count threshold (e.g. “&lt; 5”).

## Decision ownership

| Layer | Role |
|-------|------|
| `isExactDiscoveryCompositionSufficient` (`feed-composition-policy.ts`) | Owns sufficiency using inventory modes, stride, creator/kind diversity, locality, progressive widen, inspiration sparse-local widening |
| `discovery-continuity.ts` | Constraint detection + UI band/feed gates consuming that decision |
| GeoFeed / `DiscoveryContinuityBand` | Presentation only |

## Behaviour

- Exact matches always first.
- Healthy exact composition → continue normally (no band).
- Insufficient exact composition → honest band + CTAs → mixed discovery continues underneath.

## Validators

```text
npm run test:discovery-continuity            # 23/23
npm run test:feed-composition-progressive    # 24/24
```
