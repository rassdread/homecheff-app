# Surface Router Audit

**Phase:** 3E  
**Last updated:** 2026-07-06

---

## Scope

| In scope | Out of scope |
|----------|--------------|
| `SurfaceRouter` orchestration | Sponsored placements |
| Activity / Opportunity / Community / Partner / Event modules | Recommendations |
| `discovery.futureSlots.surfaces` | Discovery ranking |
| Desktop `ActivityCardSidebarStack` | UI redesign |
| Mobile insert resolver (lib) | Personalization engine |

---

## Module inventory

| Kind | Resolver | Desktop sidebar | Mobile insert | Profile |
|------|----------|-----------------|---------------|---------|
| ACTIVITY | `resolveActivityCardContracts` + router split | Up to 3 | Via activity_cards slot | Up to 4 |
| OPPORTUNITY | `resolveOpportunityModules` | Max 1 | Max 1 (non-partner) | Partner paths |
| PARTNER | Opportunity subtype | Max 1 | — | Max 1 |
| EVENT | `WORKSHOP_NEARBY` when pool signal | Max 1 | Max 1 | — |
| COMMUNITY | Reserved (pulse stays component) | Max 1 | — | — |
| PLATFORM | Not enabled 3E | — | — | — |

---

## Opportunity modules

| ID | Linked activity dedup | Cooldown |
|----|----------------------|----------|
| `BECOME_PARTNER` | `UPLOAD_FIRST_LISTING` | 14d |
| `BECOME_AMBASSADOR` | `INVITE_FRIEND` | 14d |
| `HOST_WORKSHOP` | `ADD_WORKSHOP` | 14d |
| `INVITE_LOCAL_BUSINESS` | — | 30d |
| `INVITE_SPORTS_CLUB` | — | 30d |
| `SUPPORT_NEARBY` | `NEARBY_HELP_REQUEST` | 7d |

---

## Routing rules verified

1. Feed activity cards consume first `ACTIVITY_CARD_SESSION_MAX` contracts.  
2. Sidebar activity pool excludes feed-assigned types.  
3. One opportunity module per desktop session.  
4. Mobile inserts skip platform-reserved sale indices `{1,3,4,7,8,11,12}`.  
5. Guest → empty surfaces slot.  
6. Organic `discovery.sections` untouched.

---

## Files

```
lib/discovery/surfaces/
├── surface-contract.ts
├── surface-context.ts
├── surface-priority.ts
├── surface-visibility.ts
├── surface-router.ts
├── resolve-opportunity-modules.ts
├── resolve-mobile-surface-inserts.ts
├── build-surfaces-feed-slot.ts
├── build-server-surface-context.ts
├── surface-discovery-helpers.ts
├── surface-client-storage.ts
└── index.ts

components/discovery/surfaces/
├── ActivityCardSidebarStack.tsx
├── OpportunityModuleCard.tsx
└── index.ts
```

---

## Validation

`npx tsx scripts/validate-surface-router.ts` — surface ordering, cooldowns, visibility, desktop/mobile routing.

---

## References

- [SURFACE_SYSTEM_VISION.md](../architecture/SURFACE_SYSTEM_VISION.md)
- [SIDEBAR_ARCHITECTURE.md](../architecture/SIDEBAR_ARCHITECTURE.md)
- [DISCOVERY_SURFACE_PHASE3E.md](../progress/DISCOVERY_SURFACE_PHASE3E.md)
