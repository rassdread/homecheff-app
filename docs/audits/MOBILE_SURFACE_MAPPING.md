# Mobile Surface Mapping

**Phase:** 3F  
**Last updated:** 2026-07-06

---

## Principle

Desktop `sidebarStack` slots map to mobile targets via `buildMobileSurfaceMapping()` inside `SurfaceRouter`. **No duplicated resolver logic** — mobile reads `plan.mobileMapping` from `discovery.futureSlots.surfaces`.

---

## Mapping table

| Desktop slot | Mobile target | Notes |
|--------------|---------------|-------|
| `community_pulse` | `feed_insert` | CommunityPulseBar insert @3 |
| `activity_module` | `activity_card` | Rows 4, 12, 24 |
| `opportunity_module` | `activity_card` | Max 1, deduped |
| `workshop_module` | `activity_card` | Max 1 |
| `partner_module` | `profile_module` | Partner onboarding depth |
| `event_module` | `activity_card` | Time-bound |
| `platform_module` | `feed_insert` | HomePromotion pipeline |
| Profile stack overflow | `profile_module` | `profileStack` sections |

---

## Collision rules

1. Platform reserved sale indices `{1,3,4,7,8,11,12}` — surfaces yield  
2. Activity cards max 2/session  
3. Same module ID not mapped twice  
4. Feed activity types dedup sidebar/mobile opportunity links  

---

## Future: bottom_sheet

`bottom_sheet` target reserved for tile long-press (T3) and create flows — not used for surface modules in 3F.

---

## Payload shape

```typescript
plan.mobileMapping: Array<{
  slotId: SidebarStackSlotId;
  module: ResolvedSurfaceModule | null;
  mobileTarget: 'feed_insert' | 'activity_card' | 'profile_module' | 'bottom_sheet';
  afterSaleIndex?: number;
}>
```

---

## References

- [MOBILE_SURFACE_ARCHITECTURE.md](../architecture/MOBILE_SURFACE_ARCHITECTURE.md)
- [SIDEBAR_STACK_AUDIT.md](./SIDEBAR_STACK_AUDIT.md)
