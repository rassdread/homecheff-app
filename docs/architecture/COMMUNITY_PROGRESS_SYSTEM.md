# Community Progress System

**Phase:** 3L — Foundation  
**Status:** Implemented (contracts + resolvers; no UI wiring)  
**Last updated:** 2026-07-06  
**Builds on:** HCP Economy 3K, Activations 3G, Opportunity Economy 3I–3J

---

## North star

Users see **progress, growth, streaks, milestones, and next actions** that motivate **real-world participation** — not screen time or scrolling.

```
Verified real-world action  →  Milestone / streak  →  Community level (recognition)  →  Next recommendation
```

**Hard rules:** No ranking benefits, no trust benefits, no visibility boosts, no passive farming.

---

## Milestone categories (8)

`COMMUNITY` · `HELPER` · `PARTNER` · `AMBASSADOR` · `WORKSHOP` · `COURIER` · `LOCAL_DISCOVERY` · `SUPPORT`

13 milestone contracts in registry (first + progression targets per category).

---

## Streaks (5)

| Kind | Linked categories |
|------|-------------------|
| `weekly_helper` | HELPER |
| `workshop` | WORKSHOP |
| `community` | COMMUNITY, SUPPORT |
| `local_discovery` | LOCAL_DISCOVERY |
| `support` | SUPPORT, HELPER |

Rules: consecutive **weeks** with verified actions; max 1 inflation per week; no passive activity.

---

## Community levels (6) — recognition only

| Level | Min milestones |
|-------|----------------|
| Neighbor | 0 |
| Contributor | 1 |
| Community Builder | 3 |
| Connector | 5 |
| Ambassador | 8 |
| Community Leader | 12 |

---

## Next-action engine

10 recommendation actions including: finish profile, help neighbor, support nearby, first workshop, host workshop, invite business, invite club, become courier, request review, explore local discovery.

Priority-scored; eligibility from real signals (location, profile %, deals, listings).

---

## Integration models

### Sidebar (`CommunityProgressSidebarPlan`)

- Current level
- Primary streak
- Next milestone
- Recommended action
- Recent achievements (max 3)

### Profile (`CommunityProgressProfilePlan`)

- Current level
- Milestone history
- Achievement timeline
- Current goals (incomplete milestones)
- Active streaks

---

## Anti-gaming

`self_completion` · `fake_loop` · `passive_farming` · `streak_inflation`

Evaluated via `passesProgressAntiGaming()` and streak inflation caps.

---

## Code layout

```
lib/community/progress/
  progress-contract.ts
  progress-milestones.ts
  progress-streaks.ts
  progress-levels.ts
  progress-recommendations.ts
  progress-sidebar-integration.ts
  progress-profile-integration.ts
  resolve-community-progress.ts
  index.ts
```

---

## Boundaries

| In scope (3L) | Out of scope |
|---------------|--------------|
| Contracts, milestones, streaks, levels | Ranking / trust engine |
| Sidebar + profile **models** | Recommendation ML |
| Anti-gaming rules | Sponsored placements |
| Validation script | Discovery section changes |
| | UI components (follow-up) |

---

## References

- [COMMUNITY_LEVELS.md](../audits/COMMUNITY_LEVELS.md)
- [STREAK_SYSTEM.md](../audits/STREAK_SYSTEM.md)
- [DISCOVERY_COMMUNITY_PROGRESS_PHASE3L.md](../progress/DISCOVERY_COMMUNITY_PROGRESS_PHASE3L.md)
