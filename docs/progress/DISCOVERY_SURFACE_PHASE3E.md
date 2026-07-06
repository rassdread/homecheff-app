# Discovery Surface Phase 3E — Progress

**Phase:** 3E — SurfaceRouter Foundation  
**Status:** Implemented  
**Last updated:** 2026-07-06  
**Depends on:** 3B Activity Cards, 3D Surface Architecture

---

## Goal

Implement the first **SurfaceRouter** — single orchestration layer for non-organic surfaces (activity, opportunity, community, partner, event). No sponsored, no recommendations, no ranking changes.

---

## Deliverables

| Item | Status |
|------|--------|
| `lib/discovery/surfaces/*` | Done |
| `discovery.futureSlots.surfaces` | Done |
| Opportunity module resolver (6 modules) | Done |
| `ActivityCardSidebarStack` | Done |
| Mobile insert resolver (lib) | Done |
| `scripts/validate-surface-router.ts` | Done |
| [SURFACE_ROUTER_AUDIT.md](../audits/SURFACE_ROUTER_AUDIT.md) | Done |

---

## Architecture

```mermaid
flowchart TD
  A[/api/feed eligibility] --> B[resolveActivityCardContracts]
  A --> C[buildServerSurfaceContext]
  B --> D[resolveSurfaces]
  C --> D
  D --> E[futureSlots.surfaces]
  E --> F[GeoFeed context]
  F --> G[ActivityCardSidebarStack]
  B --> H[futureSlots.activity_cards]
```

---

## Surface kinds enabled

`ACTIVITY` · `OPPORTUNITY` · `PARTNER` · `EVENT` · `COMMUNITY` (contract only) · `PLATFORM` (reserved)

---

## Wiring

| Surface | Implementation |
|---------|----------------|
| Desktop right sidebar | `HomeDesktopSidebar` → `ActivityCardSidebarStack` after `CommunityPulseBar` |
| Mobile feed | Existing `activity_cards` slot; `resolveMobileSurfaceInserts` for surface plan |
| Profile | `plan.profileModules` in payload (consumer TBD) |
| Notifications | `plan.notificationsFuture` reserved |

---

## Caps (enforced)

| Cap | Value |
|-----|-------|
| Sidebar activity stack | 3 (collapse at 2) |
| Sidebar opportunity | 1 |
| Feed activity session | 2 |
| Mobile surface inserts | 2 |

---

## Out of scope (3E)

- Sponsored placements  
- Recommendations  
- Discovery ranking / trust engine  
- Marketplace tiles  
- Full sidebar stack reorder (3F)  
- Push notification delivery  

---

## Next (3F proposal)

1. Profile owner surface consumer for `profileModules`  
2. Client opportunity cooldown sync with server  
3. Canonical sidebar stack reorder per SIDEBAR_ARCHITECTURE  
4. Community spotlight editorial module  

---

## Validation

```bash
npx tsx scripts/validate-surface-router.ts
npm run lint
npm run build
```

---

## References

- [DISCOVERY_SURFACE_PHASE3D.md](./DISCOVERY_SURFACE_PHASE3D.md)
- [SURFACE_SYSTEM_VISION.md](../architecture/SURFACE_SYSTEM_VISION.md)
- [DISCOVERY_ACTIVITY_CARDS_PHASE3B.md](./DISCOVERY_ACTIVITY_CARDS_PHASE3B.md)
