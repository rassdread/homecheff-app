# Discovery Surface Phase 3D — Progress

**Phase:** 3D — Sidebar & Surface Architecture  
**Status:** Architecture complete (no implementation)  
**Last updated:** 2026-07-06  
**Depends on:** 3B Activity Cards, 3C Activation System, 3A-EXT Sponsored Placements

---

## Goal

Design a **unified surface architecture** for discovery, activation, community, partner growth, and real-world engagement — without UI redesign or code.

---

## Deliverables

| Document | Purpose |
|----------|---------|
| [SURFACE_SYSTEM_VISION.md](../architecture/SURFACE_SYSTEM_VISION.md) | North star, surface tiers S0–S8, desktop grid, global caps |
| [SIDEBAR_ARCHITECTURE.md](../architecture/SIDEBAR_ARCHITECTURE.md) | Left = control, right = act & grow; module types; stack order |
| [MOBILE_SURFACE_ARCHITECTURE.md](../architecture/MOBILE_SURFACE_ARCHITECTURE.md) | Feed vs cards vs sheets vs profile vs push |
| [SURFACE_OWNERSHIP_MATRIX.md](../audits/SURFACE_OWNERSHIP_MATRIX.md) | What belongs where — full audit matrix |
| [COMMUNITY_GROWTH_SURFACES.md](../audits/COMMUNITY_GROWTH_SURFACES.md) | Partner/courier/ambassador/club growth without spam |

---

## Key decisions

### 1. Two-column philosophy

- **Left (280px):** S1 only — filters, scope, sort, layout. No promos, no activations.  
- **Right (320px):** S3–S7 — activation stack, opportunities, community, sponsored, platform promos.  
- **Center:** S2 organic discovery — sections and tiles unchanged in authority.

### 2. Module type system

Seven module families on top of base `SidebarModule`:

`ActivationModule` · `OpportunityModule` · `SponsoredModule` · `CommunityModule` · `EventModule` · `PartnerModule` · (+ platform/lifecycle wrappers)

Sizes: `compact` | `standard` | `hero`. Collapse accordion **“Meer in je buurt”** when stack exceeds viewport.

### 3. Parallel resolvers preserved

Activity cards, sponsored placements, and HomePromotion remain **separate resolvers** with shared dedup rules — no merger into discovery sections.

### 4. Mobile mapping

Right sidebar modules fan out to: feed inserts (pulse, promos), activity cards, profile owner modules, or sheets — documented in mobile architecture.

### 5. Community growth

Single `OpportunityModule` slot per session; intent scoring within S5 tier only; 14d dismiss cooldowns; editorial path for municipalities/schools.

---

## Current state vs target

| Area | Current | Target (3E+) |
|------|---------|--------------|
| Left sidebar | `FeedFiltersPanel` only | + optional nav/scope modules |
| Right sidebar | Mixed utility + promos | Ordered module stack per SIDEBAR_ARCHITECTURE |
| Activity cards in sidebar | Designed (3A), not wired | Slot 8 `ActivationModule` |
| Sponsored sidebar | Placeholder “Uitgelicht” | `SponsoredModule` slots 7, 11 |
| Surface router | Implicit in GeoFeed | Explicit `SurfaceRouter` lib |
| Growth modules | Ad hoc promos | `OpportunityModule` + intent scorer |

---

## Insert collision summary

| Index (mobile) | Platform | Activity | Sponsored |
|----------------|----------|----------|-----------|
| 1, 3, 4 | Yes | No | No |
| 4, 12, 24 | After yield | Yes | No |
| 9, 16, 22 | After yield | After yield | Yes (future) |

Desktop feed: sponsored @ rows 5, 12, 20; activity cards between sections; sidebar carries band-style inventory.

---

## Global density caps

| System | Cap |
|--------|-----|
| Activity cards (feed) | 2/session, 1 visible |
| Activity cards (sidebar) | 3 stacked, collapse at 2 |
| Sponsored (feed) | 3/session |
| Sponsored (sidebar) | 3 (1 hero + 2 compact) |
| Opportunity modules | 1 visible / session |
| Push (future) | 2/week opt-in |

---

## Out of scope (3D)

- Implementation, components, API changes  
- UI redesign or visual mockups  
- Enabling `sponsored_placements` slot  
- Recommendation engine  
- Ranking / trust engine changes  
- Schema migrations  

---

## Proposed 3E implementation order

1. **`SurfaceRouter` types** — `LeftModulePlan`, `RightModulePlan`, `MobilePlan`  
2. **`ActivityCardSidebarStack`** — wire 3B cards to right slot 8  
3. **`OpportunityModule` resolver** — first 3 growth modules from COMMUNITY_GROWTH_SURFACES  
4. **Stack refactor** — reorder `HomeDesktopSidebar` to canonical order without visual redesign  
5. **Dedup store** — session-level activation + sponsored dedup  
6. **Sponsored sidebar** — when commercial slot enabled  

---

## Validation (architecture)

- [x] All surfaces audited (desktop L/R, hero, feed, inserts, cards, profile, mobile, sheets, push future)  
- [x] Ownership matrix for filters, nearby, partners, challenges, workshops, help, sponsored, recommendations, ambassador, QR, events, business  
- [x] Left/right philosophy documented  
- [x] Dynamic module catalog (10 examples)  
- [x] Module sizes, stack, collapse, rotation  
- [x] Mobile feed vs card vs drawer vs notification split  
- [x] Community growth without spam  

---

## References

- [ACTIVATION_SYSTEM_VISION.md](../architecture/ACTIVATION_SYSTEM_VISION.md)
- [ACTIVATION_TAXONOMY.md](../architecture/ACTIVATION_TAXONOMY.md)
- [DISCOVERY_SECTION_REGISTRY.md](../architecture/DISCOVERY_SECTION_REGISTRY.md)
- [DISCOVERY_SPONSORED_PLACEMENTS.md](../architecture/DISCOVERY_SPONSORED_PLACEMENTS.md)
- [DISCOVERY_ACTIVITY_CARDS_PHASE3B.md](./DISCOVERY_ACTIVITY_CARDS_PHASE3B.md)
- [DISCOVERY_ACTIVATION_PHASE3C.md](./DISCOVERY_ACTIVATION_PHASE3C.md)
