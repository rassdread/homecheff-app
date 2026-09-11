# Proposal → Agreement → Afspraken + post-accept location

**Date:** 2026-09-11  
**PRODUCTION_COMMIT:** `42d3f1d6`  
**PRODUCTION_DEPLOYMENT:** `dpl_DmLNPxeSAk63dK1qah74HxX893kj`  
**Cert suite:** `scripts/live-proposal-appointments-final-cert.mts`  
**Evidence:** `docs/audits/proposal-flow-live-e2e/FINAL-CERT-REPORT.json`

---

## FINAL_DECISION

**HOMECHEFF_PROPOSAL_AGREEMENT_APPOINTMENTS_PRODUCTION_CERTIFIED**

```
MOBILE_PORTRAIT_ADDRESS = PASS
MOBILE_LANDSCAPE_ADDRESS = PASS
ADDRESS_CASE_MATRIX = PASS
TIME_CASE_MATRIX = PASS
PROPOSAL_REGRESSION = PASS
COUNTER_REGRESSION = PASS
ACCEPT_REGRESSION = PASS
AGREEMENT_REGRESSION = PASS
DEALS_REGRESSION = PASS
PRODUCTION_AUTHENTICATED_E2E = PASS
REMAINING_BLOCKERS = (none)
FINAL_DECISION = HOMECHEFF_PROPOSAL_AGREEMENT_APPOINTMENTS_PRODUCTION_CERTIFIED
```

### Covered in this run

- ADDRESS cases 2, 5, 6, 7, 11, 12
- TIME cases 2–10 (incl. superseded blocking, locked schedule on address complete)
- Proposal create / counter / accept confirm+idempotency / agreement snapshot / CommunityOrder uniqueness / notifications routing / `/profile/deals`
- Live mobile portrait + landscape address completion (sticky CTA, saved address, save → COMPLETE, chat/deals display)

### Bugs fixed during cert (proven)

1. Post-complete address correction allowed for owner (CASE 11)
2. Sticky save CTA on location form (keyboard-safe)
3. `/profile/deals?highlight=` now scrolls to the target deal (notification deep link)

---

## Architecture (unchanged)

```
LISTING_LOCATION_SOT = Product.pickupAddress / placeName / coords
BUYER_ADDRESS_SOT = User.address + postalCode + city
SELLER_ADDRESS_SOT = User.address + postalCode + city
DELIVERY_ADDRESS_SOT = CommunityOrder.deliveryAddress (+ sync DeliveryRequest)
PICKUP_ADDRESS_SOT = CommunityOrder.pickupAddress (+ sync DeliveryRequest)
AGREEMENT_LOCATION_SOT = agreementSummary.fulfillmentType + requestedDate/Time (no street)
FULFILLMENT_SOT = Proposal.fulfillmentType → Agreement snapshot → CommunityOrder.fulfillmentMode
LOCATION_SOT = CommunityOrder operational fields (post-accept)
```
