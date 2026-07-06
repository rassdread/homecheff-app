# Real-World Activation Expansion

**Phase:** 3G  
**Last updated:** 2026-07-06  
**Builds on:** Activation System 3C, Surface System 3F

---

## North star

Expand HomeCheff activations from **platform actions** to **real-world neighborhood actions** — meeting people, supporting neighbors, local commerce, workshops, and community participation.

**Not the goal:** more screen time, engagement loops, or feed ranking.

---

## Three expansion categories

| Category | Intent | Count (3G) |
|----------|--------|------------|
| `PRACTICAL_NEIGHBORHOOD` | Mutual aid & practical help | 12 (PN01–PN12) |
| `LOCAL_DISCOVERY` | In-person local exploration | 8 (LD01–LD08) |
| `COMMUNITY_SUPPORT` | Support, time, events | 8 (CS01–CS08) |

Additive to 3C taxonomy — maps to HELP, LOCAL, DISCOVERY, COMMUNITY via `libraryRef`.

---

## Module layout

```
lib/discovery/activations/
├── activation-contract.ts
├── activation-signals.ts
├── activation-safety.ts
├── activation-virality.ts
├── activation-rewards.ts
├── activation-anti-spam.ts
├── activation-library-practical-neighborhood.ts
├── activation-library-local-discovery.ts
├── activation-library-community-support.ts
├── activation-registry.ts
├── resolve-real-world-activations.ts
└── index.ts
```

---

## Resolver pipeline

```
ActivationEligibilityInput
  → evaluate ALL_REAL_WORLD_ACTIVATIONS
  → safety filter
  → cooldown filter
  → session dedup
  → libraryRef dedup
  → category cap (1/session/category)
  → priority sort (local boost + role + virality)
  → slice limit
```

**Forbidden inputs:** `view_count`, `follower_count`, `hcp_gate`, `recommendation_ml`, feed rank.

**Allowed inputs:** distance/geo, orders, favorites, workshops, trust tiers (activation only), community pool signals.

---

## Safety charter

No harassment · no romantic targeting · no manipulation · no unsafe challenges · no legal-risk activities · no public shaming · no pressure mechanics.

---

## Virality framework

Encourage: conversations, local stories, real-world actions, community building.  
Never: screen time optimization, challenge chains, leaderboards in feed.

---

## Reward framework

Allowed after completion: recognition, trust badges, community badges, milestones, optional HCP.  
Forbidden: pay-to-win, activation spam, trust bypasses.

---

## Surface integration (future)

`resolveRealWorldActivations()` output feeds SurfaceRouter / ActivityCard mapping in 3H — **not wired in 3G**.

---

## References

- [ACTIVATION_SYSTEM_VISION.md](./ACTIVATION_SYSTEM_VISION.md)
- [PRACTICAL_NEIGHBORHOOD_ACTIVATIONS.md](../audits/PRACTICAL_NEIGHBORHOOD_ACTIVATIONS.md)
- [LOCAL_DISCOVERY_ACTIVATIONS.md](../audits/LOCAL_DISCOVERY_ACTIVATIONS.md)
- [COMMUNITY_SUPPORT_ACTIVATIONS.md](../audits/COMMUNITY_SUPPORT_ACTIVATIONS.md)
