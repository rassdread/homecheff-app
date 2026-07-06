# Sidebar Stack Audit

**Phase:** 3F  
**Last updated:** 2026-07-06

---

## Canonical desktop stack (surface modules)

| Order | Slot ID | Kind | Max visible |
|-------|---------|------|-------------|
| 1 | `community_pulse` | COMMUNITY (+ CommunityPulseBar component) | 1 |
| 2 | `activity_module` | ACTIVITY | 3 (collapse at 2) |
| 3 | `opportunity_module` | OPPORTUNITY | 1 |
| 4 | `workshop_module` | WORKSHOP | 1 |
| 5 | `partner_module` | PARTNER | 1 |
| 6 | `event_module` | EVENT | 1 |
| 7 | `platform_module` | PLATFORM (HomeRecommendedPromotions) | — |
| 8 | `sponsored_placeholder` | PLATFORM placeholder | — |

Chrome modules (welcome, action center, reputation, quick actions) remain outside `sidebarStack`.

---

## Visibility resolver

| Slot | Guest | Logged-in | Notes |
|------|-------|-----------|-------|
| `community_pulse` | show | show | Pulse component always |
| `activity_module` | hide | expanded/collapsed | Courier-only → hide opportunity |
| `opportunity_module` | hide | expanded | Max 1 |
| `workshop_module` | hide | expanded | |
| `partner_module` | hide | expanded | Requires seller role |
| `event_module` | hide | expanded/collapsed | Requires location |
| `platform_module` | show | show | |
| `sponsored_placeholder` | collapsed | show | No sponsored impl 3F |

---

## Opportunity stack

Modules: `BECOME_PARTNER`, `BECOME_AMBASSADOR`, `SUPPORT_NEARBY`  
Excluded from opportunity slot: `HOST_WORKSHOP` (workshop slot), partner IDs (partner slot)  
Cooldown: **14 days** (`OPPORTUNITY_STACK_COOLDOWN_DAYS`)

---

## Community modules

`PEOPLE_NEARBY` · `NEW_MAKERS_NEARBY` · `NEW_WORKSHOPS_NEARBY` · `LOCAL_GROWTH_UPDATE` · `COMMUNITY_MILESTONE`

Pool signals: `activeNeighboursCount`, `newMakersNearbyCount`, `nearbyWorkshopCount` — no ranking.

---

## Workshop modules

`HOST_WORKSHOP` · `UPCOMING_WORKSHOP` · `NEARBY_WORKSHOP` · `WORKSHOP_WAITLIST`

No workshop ranking changes.

---

## Profile stack sections

`partner_opportunities` · `community_opportunities` · `activation_suggestions` · `trust_growth`

---

## Validation

`npx tsx scripts/validate-sidebar-stack.ts`

---

## References

- [MOBILE_SURFACE_MAPPING.md](./MOBILE_SURFACE_MAPPING.md)
- [DISCOVERY_SURFACE_PHASE3F.md](../progress/DISCOVERY_SURFACE_PHASE3F.md)
