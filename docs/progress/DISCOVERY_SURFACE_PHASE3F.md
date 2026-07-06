# Discovery Surface Phase 3F — Progress

**Phase:** 3F — Sidebar Stack Completion  
**Status:** Implemented  
**Last updated:** 2026-07-06  
**Depends on:** 3E SurfaceRouter

---

## Goal

Complete the first **production-ready sidebar stack** for desktop and mobile with canonical ordering, visibility resolver, community/workshop modules, profile stack, and mobile mapping.

---

## Deliverables

| Item | Status |
|------|--------|
| Canonical `sidebarStack` (8 slots) | Done |
| `resolveSidebarSlotVisibility` | Done |
| `OpportunityModuleStack` (max 1, 14d) | Done |
| `resolveCommunityModules` (5 modules) | Done |
| `resolveWorkshopModules` (4 modules) | Done |
| `buildMobileSurfaceMapping` | Done |
| `buildProfileStack` (4 sections) | Done |
| `DesktopRightSidebarSurfaceStack` | Done |
| `ProfileSurfaceStack` | Done |
| `scripts/validate-sidebar-stack.ts` | Done |

---

## Spec bump

`ResolvedSurfacePlan.specVersion` → **2**  
New fields: `sidebarStack`, `mobileMapping`, `profileStack`  
New kind: `WORKSHOP`

---

## Desktop wiring

`HomeDesktopSidebar`:
1. `CommunityPulseBar` (component)
2. `DesktopRightSidebarSurfaceStack` (surface modules)
3. `HomeRecommendedPromotions` (platform)
4. Sponsored placeholder (unchanged)

---

## Pool signals (feed route)

`activeNeighboursCount`, `newMakersNearbyCount`, `upcomingWorkshopCount`, `nearbyWorkshopCount` from feed pool — **not ranking**.

---

## Out of scope

- Sponsored implementation  
- Recommendations  
- Discovery ranking / sections  
- Marketplace tiles  

---

## Validation

```bash
npx tsx scripts/validate-sidebar-stack.ts
npx tsx scripts/validate-surface-router.ts
npm run lint
npm run build
```

---

## References

- [SIDEBAR_STACK_AUDIT.md](../audits/SIDEBAR_STACK_AUDIT.md)
- [MOBILE_SURFACE_MAPPING.md](../audits/MOBILE_SURFACE_MAPPING.md)
- [DISCOVERY_SURFACE_PHASE3E.md](./DISCOVERY_SURFACE_PHASE3E.md)
