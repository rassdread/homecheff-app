# Proposal → Agreement → Afspraken + post-accept location

**Status:** `HOMECHEFF_PROPOSAL_AGREEMENT_APPOINTMENTS_NOT_CERTIFIED`

Previous proposal/agreement cert (`eb5551b4`) remains valid for negotiation/accept basics.
This addendum adds post-accept **exact address + schedule completion** and **must pass** before re-certifying.

---

## Architecture audit (reuse)

```
LISTING_LOCATION_SOT = Product.pickupAddress / placeName / coords (+ useProfileLocation)
BUYER_ADDRESS_SOT = User.address + postalCode + city/place
SELLER_ADDRESS_SOT = User.address + postalCode + city/place (+ SellerProfile geo)
DELIVERY_ADDRESS_SOT = CommunityOrder.deliveryAddress → sync DeliveryRequest.deliveryAddress
PICKUP_ADDRESS_SOT = CommunityOrder.pickupAddress → sync DeliveryRequest.pickupAddress
AGREEMENT_LOCATION_SOT = fulfillmentType + requestedDate/Time in agreementSummary (no street)
DELIVERY_PROVIDER_ADDRESS_SOT = DeliveryProfile.homeAddress / current*
```

No second address book. Profile `User` reused via “Dit adres gebruiken”.

---

## Implemented in this pass

1. `CommunityOrder` operational fields: pickup/delivery address, confirmed schedule, completed markers
2. Derive states: `LOCATION_NOT_REQUIRED | LOCATION_AND_SCHEDULE_PENDING | LOCATION_PENDING | SCHEDULE_PENDING | COMPLETE`
3. API `GET/POST /api/community-orders/[id]/fulfillment-location` (owner auth, idempotent)
4. UI `FulfillmentLocationPanel` in DealCard + ProfileDealCard
5. Proposal date/time remain optional; physical completion requires address + date + time
6. Accepted proposal schedule is locked during address completion
7. Fulfillment-aware date/time labels (afhaal/bezorg)
8. Notification route for location confirmed → `/profile/deals?highlight=`

---

## Still required for CERTIFIED

- Deploy this patch (BCPD)
- `scripts/live-fulfillment-location-e2e-cert.mts` green on production
- Mobile portrait/landscape address completion smoke
- Full TIME CASE / ADDRESS CASE matrix beyond the core API cases
