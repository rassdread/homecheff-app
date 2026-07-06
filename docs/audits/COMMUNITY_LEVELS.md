# Community Levels Audit

**Phase:** 3L  
**Last updated:** 2026-07-06

---

## Level ladder

| ID | Title key | Min milestones | Benefits |
|----|-----------|----------------|----------|
| `NEIGHBOR` | `community.progress.levels.neighbor` | 0 | Recognition only |
| `CONTRIBUTOR` | `community.progress.levels.contributor` | 1 | Recognition only |
| `COMMUNITY_BUILDER` | `community.progress.levels.communityBuilder` | 3 | Recognition only |
| `CONNECTOR` | `community.progress.levels.connector` | 5 | Recognition only |
| `AMBASSADOR` | `community.progress.levels.ambassador` | 8 | Recognition only |
| `COMMUNITY_LEADER` | `community.progress.levels.communityLeader` | 12 | Recognition only |

---

## Explicit exclusions

Levels do **not** grant:

- Feed ranking boost
- Trust tier changes
- Seller reputation changes
- Listing visibility
- Review weight
- Recommendation priority

`recognitionOnly: true` on every level contract.

---

## Progress to next

`progressToNext` = 0–100% between current level `minMilestones` and next level threshold.

At `COMMUNITY_LEADER`, `progressToNext` = 100.

---

## Resolver

`resolveCommunityLevel(milestonesCompleted)` — driven by completed milestone count from verified actions only.
