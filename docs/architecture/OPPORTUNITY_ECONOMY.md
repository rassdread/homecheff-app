# Opportunity Economy

**Phase:** 3I — Foundation  
**Status:** Implemented (contracts + resolver; no payments)  
**Last updated:** 2026-07-06  
**Builds on:** Surface System 3D–3F, Real-World Activations 3G

---

## North star

HomeCheff surfaces **opportunities** for people to participate, contribute, earn recognition, grow local communities, and expand the platform — without pay-to-win, ranking manipulation, or HCP gates.

```
Eligibility signals  →  Opportunity contracts  →  Surface bundle (sidebar / mobile / profile)
```

**Not in 3I:** payments, commissions, affiliate calculations, ranking changes, sponsored inventory.

---

## Layer position

| Layer | Role |
|-------|------|
| **Discovery sections (S2)** | Organic marketplace browse |
| **Activity cards (S3)** | Lightweight activation prompts |
| **Real-world activations (3G)** | Neighborhood action library |
| **Opportunity Economy (3I)** | Canonical growth/participation paths |
| **Surface modules (3E–3F)** | UI shells consuming resolver output |

3I defines **contracts and resolver logic**. SurfaceRouter wiring to consume `resolveOpportunityContracts()` is a follow-up phase.

---

## Canonical opportunity types (10)

| Type | Category | Primary surfaces |
|------|----------|------------------|
| `PARTNER` | GROW | Desktop sidebar, profile |
| `AMBASSADOR` | GROW | Sidebar, mobile, profile |
| `COURIER` | EARN | Sidebar, mobile, profile |
| `WORKSHOP_HOST` | LEARN | Sidebar, profile |
| `COMMUNITY_HELPER` | HELP | Sidebar, mobile |
| `LOCAL_BUSINESS_INVITER` | PARTNER | Sidebar, profile |
| `SPORTS_CLUB_INVITER` | COMMUNITY | Sidebar, profile |
| `SCHOOL_INVITER` | COMMUNITY | Profile |
| `MUNICIPALITY_INVITER` | GROW | Profile |
| `EVENT_ORGANIZER` | LEARN | Mobile, profile |

---

## OpportunityContract

Each contract includes:

- `id` / `type` — canonical opportunity type
- `titleKey` / `descriptionKey` — i18n under `opportunities.economy.*`
- `eligibility` — signal spec (seller tier, location, deals, community, workshops)
- `benefits` — user-facing benefit keys + reward type
- `requirements` — requirement keys tied to eligibility signals
- `rewardTypes` — allowed reward framework types
- `status` / `lifecycle` — lifecycle state
- `cooldowns` — show + dismiss windows
- `priority` — resolver ordering (not feed ranking)
- `surfaceTargets` — `desktop_sidebar`, `mobile_insert`, `profile_module`

---

## Categories (6)

`EARN` · `GROW` · `HELP` · `COMMUNITY` · `PARTNER` · `LEARN`

One opportunity per category per session (anti-spam).

---

## Eligibility signals (allowed)

- Seller tier
- Courier capability (absence of delivery profile)
- Location
- Completed deals
- Community activity (neighbours, makers, requests)
- Workshop history
- Account age, profile completeness, product count

**Forbidden:** HCP balance/gates, follower counts, view counts, engagement scores, feed rank boosts, affiliate tiers.

---

## Reward framework

**Allowed (contract-only in 3I):**

- Recognition
- Badges
- Community status
- Future commissions (placeholder)
- Future partner rewards (placeholder)

**Forbidden:** pay to win, trust manipulation, tier bypasses, immediate payouts.

Rewards evaluate only after lifecycle reaches `completed`.

---

## Lifecycle

```
eligible → shown → accepted → active → completed → archived
```

Surface display allowed in `eligible` and `shown` only.

---

## Resolver

`resolveOpportunityContracts()` — full eligible pool  
`resolveDesktopSidebarOpportunities()` — max 1  
`resolveMobileInsertOpportunities()` — max 1  
`resolveProfileModuleOpportunities()` — max 3  
`resolveOpportunitySurfaceBundle()` — all three targets

---

## Anti-spam

| Cap | Value |
|-----|-------|
| Desktop sidebar | 1 |
| Mobile insert | 1 |
| Profile modules | 3 |
| Per category / session | 1 |
| Default show cooldown | 14 days |

---

## Code layout

```
lib/discovery/opportunities/
  opportunity-contract.ts
  opportunity-eligibility.ts
  opportunity-rewards.ts
  opportunity-lifecycle.ts
  opportunity-anti-spam.ts
  opportunity-registry.ts
  resolve-opportunity-contracts.ts
  index.ts
```

---

## Boundaries

| In scope (3I) | Out of scope |
|---------------|--------------|
| Contracts, eligibility, rewards design | Payment / Stripe payout |
| Resolver + surface bundle | Commission / affiliate math |
| Validation script | Ranking / trust engine changes |
| Architecture + audit docs | Sponsored placements |
| i18n keys | Discovery section changes |

---

## References

- [OPPORTUNITY_TYPES.md](../audits/OPPORTUNITY_TYPES.md)
- [OPPORTUNITY_ELIGIBILITY.md](../audits/OPPORTUNITY_ELIGIBILITY.md)
- [DISCOVERY_OPPORTUNITY_PHASE3I.md](../progress/DISCOVERY_OPPORTUNITY_PHASE3I.md)
- [SURFACE_SYSTEM_VISION.md](./SURFACE_SYSTEM_VISION.md)
- [ACTIVATION_SYSTEM_VISION.md](./ACTIVATION_SYSTEM_VISION.md)
