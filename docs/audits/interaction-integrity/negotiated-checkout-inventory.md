# Negotiated checkout inventory contract

**Main before:** `fdbc5a2b5ff810528e3c643588493bb7d0749aa4`  
**Production before:** `dpl_DUcGhYuuabpKnA4TVAzcLUCk5NPi`

## Production case

| Field | Value |
|-------|--------|
| Product | `fcc5ff2a-…` HomeCheff Design Studio |
| priceModel | ON_REQUEST |
| stock | 0 |
| marketplaceCategory | DESIGN |
| fulfillment | digital: true |
| CommunityOrder | `9c13e76d-…` OPEN unpaid |
| Agreement | `47daa842-…` |
| Proposal | `f1271e00-…` ACCEPTED €200 cents |
| paymentPath | HOMECHEFF_CHECKOUT |

## Root cause

`app/api/checkout/route.ts` treated any numeric `Product.stock` (including 0) as inventory for **all** checkouts, including CommunityOrder negotiated deals.

Error owner: checkout stock loop → `"Onvoldoende voorraad om deze bestelling te plaatsen."` (409).

## Fix

Reuse `proposalNegotiationIgnoresStockAvailability` via new `requiresInventoryForCheckout`:

- FIXED physical → stock gate + reservation + webhook decrement
- ON_REQUEST / service categories / digital → no stock gate, no reservation, no decrement

No Product.stock mutation/fake increase. Fees/Stripe architecture unchanged.
