# Delivery Marketplace Foundation V1

Operational layer between **CommunityOrder** and future courier automation.

## Scope (V1)

- `DeliveryRequest` — manual creation from community orders with delivery
- `CourierAvailability` — structured weekday/time windows per user
- `CourierAssignment` — manual assign → accept → complete
- `CourierScheduleService` — aggregates availability + assigned jobs
- `resolveCourierProfileFoundation()` — bridges legacy `DeliveryProfile` + new availability

**Not in scope:** route planning, live tracking, navigation, pricing, payment settlement, automatic matching.

## Flow

```
CommunityOrder (DELIVERY + deliveryRequested)
  → POST /api/community-orders/[id]/delivery-request  → DeliveryRequest OPEN
  → POST /api/delivery-requests/[id]/assign            → CLAIMED + assignment PENDING
  → POST /api/delivery-requests/[id]/accept (courier)    → ASSIGNED + CommunityOrder.deliveryAssigned
  → POST /api/delivery-requests/[id]/complete          → COMPLETED
```

## Checkout boundary

Checkout `DeliveryOrder` remains Stripe-only. Community deliveries use `DeliveryRequest` + `CourierAssignment`.

## Future reuse

| Capability | V1 anchor |
|------------|-----------|
| Automatic courier matching | `CourierAvailability` + `lib/delivery/delivery-eligibility.ts` + geo from `delivery-position.ts` |
| Courier proposals / bidding | `DeliveryRequest.status` OPEN → multiple claim attempts before assign lock |
| Courier affiliate rewards | `CourierAssignment.id` + future fee ledger |
| Delivery fees | `DeliveryRequest` extension fields (not in V1) |
| Scheduled future deliveries | `pickupDate` / `deliveryDate` + `CourierScheduleService` reserved slots |
| Live tracking | `DeliveryProfile` GPS fields (existing) + assignment status FSM |

## Reused from Phase 5A

- `DeliveryProfile` — vehicle (`transportation`), radius (`maxDistance`), regions
- `assertDelivererCanAccept` — wire in matching sprint
- `NotificationService.sendDeliveryRequestNotification`

## Profile bridge

`resolveCourierProfileFoundation(userId)` exposes:

- Legacy: `availableDays`, `availableTimeSlots`, `deliveryRegions`, `transportation`
- Structured: `CourierAvailability` rows (preferred for V2 matching)
