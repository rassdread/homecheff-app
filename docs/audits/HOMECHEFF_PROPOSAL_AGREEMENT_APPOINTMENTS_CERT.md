# Proposal → Agreement → Afspraken + post-accept location

**Date:** 2026-09-11  
**PRODUCTION_COMMIT (location):** `27cef628`  
**PRODUCTION_DEPLOYMENT:** `dpl_Awz82nfwnSvmnqos2cEpyzyWC2d9`  
**Location E2E:** `HOMECHEFF_FULFILLMENT_LOCATION_E2E_PASS`

---

## FINAL_DECISION

**HOMECHEFF_PROPOSAL_AGREEMENT_APPOINTMENTS_NOT_CERTIFIED**

### Why not fully certified yet

1. Mobile portrait/landscape **address completion** not live-smoked (panel shipped; no phone-format Playwright pass for the address form yet)
2. Full ADDRESS CASE / TIME CASE matrix beyond core API cases A/D/G/unauthorized/idempotent not fully exercised in one suite

### What is green

- Exact address not required pre-accept
- Accept creates Agreement + CommunityOrder without address
- PICKUP → seller completes address + schedule; buyer sees pending
- DELIVERY → buyer completes; accepted proposal schedule locked
- Unauthorized party → 403
- Double submit → idempotent
- CommunityOrder is location SoT; DeliveryRequest synced

---

## Architecture

```
LISTING_LOCATION_SOT = Product.pickupAddress / placeName / coords
BUYER_ADDRESS_SOT = User.address + postalCode + city
SELLER_ADDRESS_SOT = User.address + postalCode + city
DELIVERY_ADDRESS_SOT = CommunityOrder.deliveryAddress (+ sync DeliveryRequest)
PICKUP_ADDRESS_SOT = CommunityOrder.pickupAddress (+ sync DeliveryRequest)
AGREEMENT_LOCATION_SOT = agreementSummary.fulfillmentType + requestedDate/Time (no street)
DELIVERY_PROVIDER_ADDRESS_SOT = DeliveryProfile.homeAddress / current*
FULFILLMENT_SOT = Proposal.fulfillmentType → Agreement snapshot → CommunityOrder.fulfillmentMode
LOCATION_SOT = CommunityOrder operational fields (post-accept)
```

---

## Report fields

```
EXACT_ADDRESS_BEFORE_ACCEPT = NO
EXACT_ADDRESS_AFTER_ACCEPT = YES (owner-confirmed)

PICKUP_ADDRESS_OWNER = SELLER
DELIVERY_ADDRESS_OWNER = BUYER
SERVICE_LOCATION_OWNER = ON_SITE_PROVIDER→SELLER / ON_SITE_CLIENT→BUYER

ACCEPT_WITHOUT_ADDRESS = YES
AGREEMENT_EXISTS_BEFORE_LOCATION_COMPLETION = YES

LOCATION_STATE_SOT = derived (LOCATION_NOT_REQUIRED|…|COMPLETE)
LOCATION_PENDING_UI = FulfillmentLocationPanel
LOCATION_COMPLETE_UI = YES

INITIAL_PROPOSAL_DATE_REQUIRED = NO
INITIAL_PROPOSAL_TIME_REQUIRED = NO
ACCEPT_WITHOUT_DATE = YES
ACCEPT_WITHOUT_TIME = YES
PHYSICAL_COMPLETION_DATE_REQUIRED = YES
PHYSICAL_COMPLETION_TIME_REQUIRED = YES
PHYSICAL_COMPLETION_ADDRESS_REQUIRED = YES
ACCEPTED_TIME_IMMUTABLE = YES (locked when present on proposal)

PRODUCTION_ADDRESS_E2E = PASS (scripts/live-fulfillment-location-e2e-cert.mts)
MOBILE_PORTRAIT_ADDRESS = NOT_TESTED
MOBILE_LANDSCAPE_ADDRESS = NOT_TESTED
DESKTOP_ADDRESS = CODE_SHIPPED
```

Evidence: `docs/audits/proposal-flow-live-e2e/LOCATION-E2E-REPORT.json`
