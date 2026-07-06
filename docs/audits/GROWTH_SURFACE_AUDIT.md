# Growth Surface Audit — Phase 3M

**Date:** 2026-07-06  
**Scope:** Unified growth layer (activity + opportunity + progress + HCP)

---

## Bundle composition

`GrowthSurfaceBundle` combines:

| Slice | Source |
|-------|--------|
| Activity | Top activity card from SurfaceRouter |
| Opportunity | `opportunityEconomy.desktopSidebar` |
| Community progress | `resolveCommunityProgress()` |
| HCP progress | `resolveHcpEconomy().sidebarPlan` |
| Recommended actions | `resolveRecommendedActionPair()` |
| Achievements | `buildCommunityAchievementFeed()` |

---

## Desktop — GrowthActionStack

| Slot | Visible when |
|------|----------------|
| `current_action` | Primary recommended action exists |
| `opportunity` | Economy opportunity on sidebar |
| `progress` | Logged-in level state |
| `current_streak` | Active verified streak |
| `next_milestone` | Incomplete milestone |
| `community_achievement` | Earned achievement in feed |
| `hcp_progress` | HCP recommended action present |

**Caps:** No ranking or trust effects. Recognition only.

---

## Mobile

| Kind | Slot indices | Max |
|------|--------------|-----|
| `growth_action` | 12 (after activity/opportunity) | 1 |
| `growth_progress` | 24 | 1 |

Occupied slots from activity/opportunity inserts are skipped — no duplicate logic in GeoFeed.

---

## Profile

`GrowthProfileModulePlan` shows:

- Current level + progress  
- Primary streak  
- Next milestone  
- Active opportunities (≤3)  
- Recent achievements (≤5)  
- Recommended actions (≤3)  

---

## Forbidden effects

No `feed_rank_boost`, `trust_tier_boost`, `visibility_boost`, `recommendation_ml_boost`, or `sponsored_placement` in growth contracts.

---

## Files

- `lib/discovery/growth/*`
- `lib/feed/growth-surface-feed-rows.ts`
- `components/discovery/surfaces/GrowthActionStack.tsx`
- `components/discovery/surfaces/GrowthProgressProfileModule.tsx`
- `components/discovery/surfaces/GrowthMobileInsertCard.tsx`
