# Discovery Activity Cards — Phase 3B

**Status:** Complete  
**Last updated:** 2026-07-06  
**Depends on:** Phase 2E feed contract, Phase 3A taxonomy architecture

---

## Goal

Introduce **Activity Cards** as contextual community actions — not ads, recommendations, or ranking.

---

## Delivered

| Requirement | Status |
|-------------|--------|
| `lib/discovery/activity-cards/` canonical module | ✅ |
| `components/discovery/activity-cards/` UI | ✅ |
| `ActivityCardContract` + 11 types | ✅ |
| Eligibility engine | ✅ |
| `discovery.futureSlots.activity_cards` | ✅ |
| Mobile insertion rows 4, 12, 24 | ✅ |
| Desktop between sections | ✅ |
| Max 2/session, 1 visible | ✅ |
| 7-day repeat cooldown | ✅ |
| Analytics (shown/dismissed/clicked/completed) | ✅ |
| `scripts/validate-activity-cards.ts` | ✅ |
| Architecture + audit docs | ✅ |

---

## Key files

| File | Role |
|------|------|
| `activity-card-contract.ts` | Contract + types |
| `activity-card-type-registry.ts` | 11 type definitions |
| `resolve-activity-card-contracts.ts` | Eligibility selection |
| `fetch-activity-card-eligibility.ts` | Server Prisma snapshot |
| `build-activity-cards-feed-slot.ts` | futureSlots builder |
| `lib/feed/activity-card-feed-rows.ts` | Feed row interleaving |
| `app/api/feed/route.ts` | Enables slot for logged-in users |
| `components/feed/GeoFeed.tsx` | Renders activity_card rows |

---

## Out of scope (3B)

- Recommendations slot
- Sponsored placements
- Ranking / trust changes
- Full 3A taxonomy (24 cards) in feed — 3B uses 11-type contract

---

## Validation

```bash
npx tsx scripts/validate-activity-cards.ts
npm run lint
npm run build
```
