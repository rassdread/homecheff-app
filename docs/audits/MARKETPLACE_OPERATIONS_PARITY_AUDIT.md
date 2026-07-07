# Marketplace Operations Parity Audit (Phase 5G-D)

**Date:** 2026-07-07  
**Scope:** `/profile/deals` operations parity with chat deal flow — no new payment rails, notifications, or tile redesign.

---

## 1. Executive summary

Phase 5G-D closes the gap identified in the reconciliation audit: **deal operational status was chat-only**. The profile deals API and dashboard now expose payment, exchange, and delivery status using the **same `resolveDealUxState` helper** as `DealCard`.

`DelivererSelector` remains **unwired** (documented deferral) — community courier discovery uses self-claim (5G-C), not checkout pre-select.

---

## 2. Fields added to `/profile/deals`

| Field | Example values | Notes |
|-------|----------------|-------|
| `paymentStatus` | `WAITING_HOMECHEFF`, `PAID`, `DIRECT_CONTACT` | Derived from settlement + `checkoutOrderId` |
| `settlementMode` | `MONEY`, `VALUE_ONLY`, `MONEY_AND_VALUE` | From proposal |
| `paymentPath` | `HOMECHEFF_CHECKOUT`, `DIRECT_CONTACT`, `NONE` | From proposal summary |
| `deliveryRequired` | `true` / `false` | `fulfillmentMode === DELIVERY` or `deliveryRequested` |
| `deliveryStatus` | `REQUESTED_PENDING`, `IN_PROGRESS`, `COMPLETED` | Maps request + assignment |
| `deliveryRequestId` | UUID or `null` | Latest non-cancelled request |
| `courierAssignmentStatus` | `PENDING`, `ACCEPTED`, `null` | Active assignment |
| `courierName` | string or `null` | When assigned/claimed |
| `courierUserId` | string or `null` | Courier user id |
| `pickupLabel` | address string or `null` | From delivery request |
| `dropoffLabel` | address string or `null` | From delivery request |
| `requestedWindowLabel` | time window or `null` | Proposal or delivery windows |
| `userRoleInDeal` | `BUYER` / `SELLER` | Viewing user |
| `dealUx` | full `DealUxState` | Same object shape as chat |
| `statusBlocks` | array of 3–5 chips | Dashboard presentation |

**Backward compatible:** all original `CommunityOrderDTO` fields preserved.

---

## 3. Delivery statuses visible on dashboard

| `deliveryStatus` | User-facing label (NL) |
|------------------|------------------------|
| `NOT_APPLICABLE` | (hidden) |
| `AVAILABLE` | Bezorging mogelijk |
| `REQUESTED_PENDING` | Bezorging aangevraagd — wacht op koppeling |
| `OPEN` / `CLAIMED` | Bezorging aangevraagd |
| `ASSIGNED` | Bezorger toegewezen / Bezorger: {{name}} |
| `IN_PROGRESS` | Bezorging onderweg / Onderweg — {{name}} |
| `COMPLETED` | Bezorging afgerond |
| `CANCELLED` | Bezorging geannuleerd |

CTA **Bezorging aanvragen** shown when `dealUx.primaryCta.kind === 'REQUEST_DELIVERY'` (same gate as chat).

---

## 4. Chat vs dashboard consistency

| Concern | Implementation |
|---------|----------------|
| Next action / CTA | `resolveDealUxState` → `dealUx.primaryCta` |
| Payment waiting | `showPaymentRequired` + `WAITING_HOMECHEFF` payment status |
| Direct contact risk | `DEAL_COMMITMENT_I18N.directRisk` on both surfaces |
| Delivery request | Same `POST /api/community-orders/[id]/delivery-request` |
| Mark complete | Same `POST /api/community-orders/[id]/complete` |
| Status label keys | Dashboard blocks use `marketplace.deals.status.*`; chat uses `deal.status.*` for header — **same underlying `dealUx.statusLabelKey` available on API** |

No duplicate status FSM — single source in `deal-ux-state.ts`.

---

## 5. DelivererSelector decision

| Option | Chosen |
|--------|--------|
| A. Wire `DelivererSelector` in deal flow | ❌ |
| B. Document deferral | ✅ |

**Rationale:**

- `DelivererSelector` calls `/api/delivery/match-deliverers` with `productId` — teen/platform stack
- Community `DeliveryRequest` uses claim flow (`CommunityDeliveryPanel`, 5G-C)
- Party-assign at `POST /api/delivery-requests/[id]/assign` requires buyer/seller to pick `courierId` — no UI spec in 5G-D
- Half-wiring would create two conflicting courier selection paths

Deferral comment added to `components/checkout/DelivererSelector.tsx`.

---

## 6. Remaining P1 gaps (post 5G-D)

| # | Gap | Notes |
|---|-----|-------|
| 1 | Counter-proposal barter UX | Money-only counter UI |
| 2 | E2E validator proposal→checkout | Per-deal validators exist |
| 3 | Exchange suggestion → proposal CTA | Discovery polish |
| 4 | Buurthulp closed transaction loop | Community economy |
| 5 | DelivererSelector / party-assign UI | Future 5G-E or roster matching phase |
| 6 | Delivery intermediate steps (PICKED_UP) | Community FSM is OPEN→ASSIGNED→COMPLETED |
| 7 | Seller dashboard CommunityOrder parity | Still `/profile/deals` + chat only |

---

## 7. Validation

| Check | Result |
|-------|--------|
| `validate-marketplace-operations-parity.ts` | Run at commit |
| No Tikkie/escrow/ranking changes | Asserted in validator |
| i18n nl + en parity | `marketplace.deals.*` |

---

*Phase 5G-D complete — operations parity for profile deals dashboard.*
