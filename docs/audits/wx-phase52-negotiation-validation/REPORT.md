# HOMECHEFF — MARKETPLACE NEGOTIATION ENGINE
## PHASE 5.2 — PROPOSAL, NEGOTIATION & TRANSACTION WORKFLOW VALIDATION

**Date:** 2026-08-05  
**Branch:** `main`  
**Production:** `https://homecheff.eu`  
**Deploy after fixes:** `homecheff-ft5ykgl1x` (`82bebe3e`)  
**Evidence:** `docs/audits/wx-phase52-negotiation-validation/`

### P0 fixes shipped this phase
| Commit | Fix |
|--------|-----|
| `cabcab3b` | `SellerProfile.User` (not `user`) in proposal product binding + conversation header |
| `82bebe3e` | `Product.Image` (not `image`) in community-order checkout context |

---

## 1. Phase verdict

**NEGOTIATION_WORKFLOW_VALIDATION_PARTIAL**

## 2. Executive summary

The proposal engine is live on Production: create (money / barter / free / voluntary / service / delivery), chat-linked proposals, reject / withdraw / counter rounds, accept → Agreement + CommunityOrder, delivery-request creation, completion, and permission gates all work after two Prisma-relation regressions were fixed. Live Stripe charge for HOMECHEFF_CHECKOUT proposals, named-provider AUTO/MANUAL delivery settlement, personal service calendar booking, and automatic EXPIRED status were not fully exercised (by design / NOT_IMPLEMENTED / no live charge).

## 3. Proposal creation validation

| Scenario | Result |
|----------|--------|
| Money-only product | PASS 201 |
| Meal / product | PASS |
| Service category + schedule fields | PASS |
| Free | PASS |
| Voluntary | PASS |
| Money + barter (`MONEY_AND_VALUE`) | PASS |
| Barter-only (`VALUE_ONLY`) | PASS |
| Expiry field set | PASS (stored; auto-expire DORMANT) |
| Task / garden-style category probes | PASS |
| Owner / receiver / amount / currency / status | PASS |

## 4. Chat integration validation

Conversation start per product, list proposals in conversation, profile proposals list, seller notifications after create: **PASS**. Desktop / phone / tablet / landscape messages + agreements UI: **PASS** screenshots. Realtime reconnect depth: **PARTIAL**.

## 5. Negotiation validation

Reject, withdraw (creator cancel), counter round 1→2 (parent `COUNTERED`, children `PENDING`), accept final counter: **PASS**. Duplicate accept blocked 409: **PASS**. Auto-expire `EXPIRED`: **DORMANT** (enum only, no writer).

## 6. Barter validation

Barter-only accept and money+barter accept → CommunityOrder: **PASS**. Item↔item / service↔service deep UX variants: **PARTIAL** (taxonomy IDs exercised; no separate barter models). Listing openness gates enforced in service.

## 7. Order conversion validation

Accept → Agreement + CommunityOrder with correct buyer/seller/proposalId: **PASS**. Chat preserved. Stripe `Order` link via `checkoutOrderId`: **NOT RUN** (DIRECT_CONTACT path; no live charge). Affiliate / delivery selection on Stripe Order: **PARTIAL** (covered in Phase 5.0 commerce, not recharged here).

## 8. Delivery integration validation

`fulfillmentType: DELIVERY` accept sets `deliveryRequested`; manual `POST .../delivery-request` creates OPEN DeliveryRequest: **PASS**. Named provider AUTO/MANUAL + quote snapshot on proposal path: **PARTIAL / DORMANT** vs marketplace DeliveryOrder (separate community DeliveryRequest model).

## 9. Payment integration validation

Checkout-context after fix returns correct 400 `checkoutNotRequired` for DIRECT_CONTACT (was P0 500): **PASS**. Full Stripe Checkout + webhook + commission for proposal money leg: **NOT RUN** (no live charge this phase).

## 10. Service booking validation

`ProposalCategory.SERVICE` + `requestedDate` / `requestedTimeWindow`: **PASS**. Dedicated calendar booking: **NOT_IMPLEMENTED**.

## 11. Completion validation

Seller complete CommunityOrder: **PASS**. Mutual completion UX / dispute: **PARTIAL / NOT_IMPLEMENTED**. Deal-review unlock: surface exists; write not deep-tested.

## 12. Responsive validation

Desktop / tablet / phone / landscape messages + agreements: **PASS** (HTTP 200 + screenshots).

## 13. Security validation

| Check | Result |
|-------|--------|
| Unauthenticated GET | 401 PASS |
| Creator cannot reject/accept/counter own | 403 PASS |
| Non-creator cannot cancel | 403 PASS |
| Commitment required on accept | 400 PASS |
| Duplicate accept | 409 PASS |

## 14. Regression findings

### P0 (fixed)
- Proposal create 500: `seller.user` → `SellerProfile.User` (`cabcab3b`)
- Checkout-context 500: `Product.image` → `Product.Image` (`82bebe3e`)

### P1
- Live HOMECHEFF_CHECKOUT proposal → Stripe → webhook still outstanding (monitoring / no charge this phase)

### P2
- Counter API returns 201 (assert harness expected 200); behavior correct

### DORMANT
- `ProposalStatus.EXPIRED` auto-expire job

### NOT_IMPLEMENTED
- Personal service calendar booking product

## 15. Launch recommendation

**READY_AFTER_P0_FIXES** — P0s already shipped to Production (`82bebe3e`). Core negotiation engine confirmed; supervised live checkout on a proposal money leg remains for full confirmation.

*(If equating “P0 already fixed on Production” to green-light: operationally close to confirmed; formal label kept as READY_AFTER_P0_FIXES until one paid proposal path is supervised.)*

## 16. Scope confirmation

- no new functionality  
- no architectural redesign  
- no payment redesign  
- no database redesign  
- only regression fixes  
- no Production rollback required  

## 17. Final boundary

HOMECHEFF_NEGOTIATION_WORKFLOW_VALIDATION_COMPLETE
