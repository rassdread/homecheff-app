# Opportunity Surface Audit

**Phase:** 3J  
**Last updated:** 2026-07-06

---

## Surface wiring

| Target | Source | Cap | Component |
|--------|--------|-----|-----------|
| `desktop_sidebar` | `resolveOpportunityEconomySurfaces` → `opportunityEconomy.desktopSidebar` | 1 | `OpportunitySurfaceStack` |
| `mobile_insert` | `buildPrioritizedMobileInserts` → `plan.mobileInserts` | 1 | `OpportunityEconomyCard` |
| `profile_module` | `opportunityEconomy.profileModules` | 3 | `OpportunityProfileModule` |

---

## Mobile insert priority

1. **Platform** — `MOBILE_PLATFORM_RESERVED_SALE_INDICES` + `pushInsertIfNeeded` in GeoFeed  
2. **Activity** — `interleaveMobileActivityCards`  
3. **Opportunity** — `interleaveMobileOpportunitySurfaces`  
4. **Sponsored** — future  
5. **Recommendations** — future  

---

## Module kinds

| Kind | Layer | Notes |
|------|-------|-------|
| `ECONOMY_OPPORTUNITY` | 3I + 3J | Canonical economy contracts |
| `OPPORTUNITY` | 3E legacy | Fallback when economy has no desktop match |
| `PARTNER` | 3E legacy | Invite modules when not absorbed by economy |

---

## Cooldown storage

| Key | Scope |
|-----|-------|
| `hc:surfaces:opportunity:cooldowns` | Legacy 3E module IDs |
| `hc:surfaces:opportunity:economy-cooldowns` | Economy `OpportunityType` |

---

## Visibility rules

`ECONOMY_OPPORTUNITY` visibility matches `OPPORTUNITY`: guests hidden; max 1 desktop / 1 mobile / 3 profile.

---

## Progress model

`OpportunityProgressContract` fields: `accepted`, `active`, `completed`, `milestones`, `nextAction`.

Built via `buildOpportunityProgress()` from lifecycle + requirements — no payout evaluation.
