# HomeCheff Delivery — Architecture

**Date:** 2026-09-04  
**Status:** Individual + company MVP (manual dispatch)

## Provider model

`DeliveryProfile` is the commercial **Delivery Provider**.

| `providerType` | Customer identity | Pricing owner | Settlement owner |
|---|---|---|---|
| `INDEPENDENT` | Person (name/avatar) | That profile | Profile `userId` Connect |
| `DELIVERY_BUSINESS` | Company (`companyDisplayName` / logo) | Company profile | Profile `userId` (owner) Connect |

Company membership:

- `DeliveryCompanyMember` — `OWNER` | `DISPATCHER` | `DRIVER`
- `DeliveryCompanyInvite` — email invite accept flow
- `DeliveryOrder.assignedDriverUserId` — operational driver (does **not** change quote/price)

## Stacks (unchanged)

1. **Checkout** — `DeliveryOrder` + `DeliveryProfile` (this product)
2. **Community** — `DeliveryRequest` + `CourierAssignment` (separate; no company fee stack)

## Status machine (checkout)

`PENDING → ACCEPTED → PICKED_UP → DELIVERED` (+ `CANCELLED`)

Company path:

`customer selects COMPANY → DeliveryOrder.deliveryProfileId = company → OWNER/DISPATCHER assigns driver → driver completes`

## Economics (certified)

See `HOMECHEFF_DELIVERY_PRICING_AND_SETTLEMENT.md` and `HOMECHEFF_DELIVERY_AFFILIATE_CERTIFICATION.md`.

## Flags

- `DELIVERY_NAMED_PROVIDER_SELECTION_ENABLED`
- `DELIVERY_PROVIDER_PRICING_ENABLED`
- `DELIVERY_BUSINESS_PROFILES_ENABLED`

Enable in Production when recruiting real supply.
