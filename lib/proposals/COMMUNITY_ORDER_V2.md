# Community Order Foundation V2

Extends Proposal → Agreement → CommunityOrder for money, alternative value, and mixed agreements.

## Current scope (V2)

- `Proposal.acceptedValueTaxonomyIds` / `requestedValueTaxonomyIds` / `proposalSummary`
- `Agreement.agreementSummary` — frozen snapshot at accept
- `CommunityOrder.fulfillmentMode`, `deliveryRequested`, `deliveryAssigned`
- Chat UI: settlement mode, value badges, community order summary
- Notifications for alternative value, mixed accept, community order created

**Not in scope:** courier matching, delivery marketplace, Stripe checkout changes, barter settlement engine.

## Future reuse

| Capability | How V2 prepares |
|------------|-----------------|
| Courier assignment | `deliveryRequested` + `deliveryAssigned` flags; `fulfillmentMode` |
| Alternative payment settlement | `agreementSummary.settlementMode` + value taxonomy ids |
| Barter marketplace | GIN indexes on proposal value ids; product `acceptedSpecializations` prefill |
| Proposal matching | `requestedValueTaxonomyIds` vs listing `specializations` |
| Delivery scheduling | `CommunityOrderFulfillmentMode` + conversation thread link |
| Affiliate logistics | `CommunityOrder.id` as operational anchor (separate from checkout `Order`) |

## Checkout boundary

Stripe `Order` remains checkout-only. `CommunityOrder.checkoutOrderId` may link a money leg later — not wired in V2.
