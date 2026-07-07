# Marketplace Phase 5G-D — Operations Parity

**Date:** 2026-07-07  
**Status:** Complete  
**Depends on:** 5G-C Community Courier MVP, 5G-B Deal Commitment

---

## Goal

Make `/profile/deals` the central place to track agreements, payments, and delivery status — consistent with chat `DealCard` / `deal-ux-state.ts`.

---

## Deliverables

| Item | Status |
|------|--------|
| 5G-D.1 Profile deals API enrichment | ✅ |
| 5G-D.2 Deals dashboard status blocks | ✅ |
| 5G-D.3 Community delivery visibility + CTA | ✅ |
| 5G-D.4 DelivererSelector audit (deferred) | ✅ |
| 5G-D.5 Shared status via `resolveDealUxState` | ✅ |
| 5G-D.6 i18n `marketplace.deals.*` (nl + en) | ✅ |
| 5G-D.7 Validator script | ✅ |

---

## 5G-D.1 — API fields

`GET /api/profile/deals` returns enriched `ProfileDealDTO` via `listProfileDealsForUser`:

| Field | Source |
|-------|--------|
| `paymentStatus` | `resolveProfileDealPaymentStatus` |
| `settlementMode` | Proposal |
| `paymentPath` | `paymentPathFromSummary` |
| `deliveryRequired` | `fulfillmentMode` / `deliveryRequested` |
| `deliveryStatus` | `resolveProfileDealDeliveryStatus` |
| `deliveryRequestId` | Latest non-cancelled `DeliveryRequest` |
| `courierAssignmentStatus` | Active assignment |
| `courierName` / `courierUserId` | Serialized delivery request |
| `pickupLabel` / `dropoffLabel` | Delivery request addresses |
| `requestedWindowLabel` | Proposal or delivery time windows |
| `userRoleInDeal` | `BUYER` \| `SELLER` |
| `dealUx` | `resolveDealUxState` (same as chat) |
| `statusBlocks` | `buildProfileDealStatusBlocks` |

All fields null-safe; existing clients still receive `CommunityOrderDTO` base fields.

---

## 5G-D.2 — Status blocks

Per deal, dashboard shows labeled chips for:

- Afspraak (proposal/order status)
- Betaling (when money leg applies)
- Ruil (when value leg applies)
- Bezorging (when delivery mode applies)
- Volgende stap (open deals only — reuses `dealUx.nextStepHintKey`)

---

## 5G-D.3 — Delivery on dashboard

- Pickup/dropoff/window labels when delivery request exists
- Courier name when assigned
- Primary CTA from `dealUx` — including **Bezorging aanvragen** when `REQUEST_DELIVERY`
- Inline delivery details toggle when `VIEW_DELIVERY`

---

## 5G-D.4 — DelivererSelector

**Decision B: deferred.** `DelivererSelector.tsx` targets teen/platform Stripe checkout (`match-deliverers`). Community flow uses courier self-claim (5G-C). Party-assign API exists but pre-select at deal time would be half-wired. Deferral documented in component header.

---

## 5G-D.5 — Consistency

Shared helpers in `lib/proposals/profile-deal-status.ts`:

- `resolveProfileDealPresentation` calls `resolveDealUxState`
- `buildProfileDealStatusBlocks` derives dashboard chips from same inputs as `DealCard`

---

## Key files

| File | Role |
|------|------|
| `lib/proposals/profile-deal-types.ts` | DTO types |
| `lib/proposals/profile-deal-status.ts` | Status + blocks (shared with chat logic) |
| `lib/proposals/profile-deal-service.ts` | Prisma load + serialize |
| `app/api/profile/deals/route.ts` | API |
| `components/profile/ProfileDealCard.tsx` | Rich deal row |
| `components/profile/ProfileDealsClient.tsx` | List page |
| `scripts/validate-marketplace-operations-parity.ts` | CI validation |

---

## Validation

```bash
npx tsx scripts/validate-marketplace-operations-parity.ts
npm run lint
npm run build
```

---

## Related

- [MARKETPLACE_OPERATIONS_PARITY_AUDIT.md](../audits/MARKETPLACE_OPERATIONS_PARITY_AUDIT.md)
- [MARKETPLACE_DELIVERY_ROADMAP_RECONCILIATION_AUDIT.md](../audits/MARKETPLACE_DELIVERY_ROADMAP_RECONCILIATION_AUDIT.md)
