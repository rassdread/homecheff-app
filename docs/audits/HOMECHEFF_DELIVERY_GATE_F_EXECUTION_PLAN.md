# HomeCheff Delivery Gate F execution plan

Status: BLOCKED_WITH_EXACT_PREREQUISITES

This document prepares Gate F. It does not execute it, does not enable public Delivery, and does not approve a production deploy.

Marketplace certification, including the V23 test payment and the V23.1 zero-cost subscription, is not evidence that a delivery order was paid, picked up, completed, or settled.

## What stays off

- Production deployment remains `dpl_9Vm1Gy9G6w2U6S2oJCXQRWrmbRtj` at `85b11d6d4708f68760122314a1ace654591f7643`.
- `HOMECHEFF_DELIVERY_ENABLED` stays false for customers.
- No production charge, transfer, refund, or Connect pointer change is part of this plan.
- Gates A through E in `docs/delivery-certification/HOMECHEFF_DELIVERY_V6_PRODUCTION_RELEASE_PLAN.md` are not reopened here and are not marked accepted.

## Current code position

Delivery assignment, pickup, completion, pricing, and settlement already exist. This plan does not add a second delivery implementation.

The recovery and refund rules that Gate F must keep:

- One courier transfer per delivery order and source charge. A failed lookup is not permission to create another transfer.
- Seller transfer recovery lists Stripe transfers first and creates only when the list is empty, from the admin route, with a new generation key.
- Refunded, disputed, reversed, and already settled transfers are refused.
- Public Delivery is a separate flag from a restricted pilot. Turning the flag on for everyone is not an allowed way to run Gate F.

## Exact prerequisites still missing

Do not start the charge until every line has a named value in the written approval.

| Prerequisite | Required state | Current state |
|---|---|---|
| Written Gate F approval | Names the buyer, seller, courier, listing, maximum charge, and refund plan | Not given |
| Buyer | One adult test buyer in the approved Stripe context | Not named for Gate F |
| Seller | One seller with an existing Connect account that can receive the seller net | Not re-checked. Do not create or replace a Connect account |
| Listing | One paid listing that is deliverable, with stock, allergens confirmed where required, and a delivery mode that includes delivery | Not selected |
| Courier | One individual courier, not a company account, whose live or explicitly approved test `individual.verification.status` is `verified`, and who meets the age rule | Not re-checked. Historical pilot rows are not assumed eligible. Do not bypass identity |
| Destination | One delivery address inside the approved distance | Not selected |
| Stripe context | Stripe test mode, or one explicitly authorized restricted production charge | Test platform is `acct_1S6D3DRpYdPVF6LP`. Live platform `acct_1S1TFM2KvmKfeN9t` is not authorized by this plan |
| Google Distance Matrix | Production-only key available to the approved runtime, not a preview key reused as production | Not confirmed in this task |
| Feature flags | Delivery off for everyone except the named pilot if the allowlist can express that | If the flag cannot limit the charge to the named accounts, stop |
| Webhook | The approved runtime receives the signed test or authorized live events exactly once | Do not retarget `we_1U0plW` and do not overwrite the preview or production webhook secret to make this easier |
| Financial reader | One person who can read the charge, quoted fee, seller transfer, courier transfer, and platform fee after the run | Not assigned |

## Execution steps, only after the table is filled

1. Record the named buyer, seller, courier, listing, destination, maximum amount, and Stripe mode in the approval note.
2. Read `https://homecheff.eu/api/delivery/alignment-flags` if the context is production, or the approved preview flags if the context is test mode. Delivery must still be off for ordinary customers.
3. Confirm the courier cannot accept while unverified, using the existing accept route, before the verified courier is used.
4. As the buyer, accept one booking and pay one marketplace order in the approved Stripe context. The charge must equal the accepted booking fee plus the existing buyer surcharge. Do not invent a second fee.
5. As the verified courier, confirm pickup and then completion through the existing routes.
6. Read, without creating anything new:
   - Checkout amount and stored `quotedFeeCents`
   - one seller transfer and its idempotency key
   - one courier transfer and its idempotency key
   - platform fee
   - balance-transaction fee status
   - affiliate ledger, if a row exists; leave it unpaid
7. Replay the same webhook event once and confirm there is still one order, one seller transfer, and one courier transfer.

## Pass condition

The paid amount matches the quoted delivery fee plus the existing surcharge. Seller and courier each have one transfer. Fee status may be `pending`. Realized profit stays null while the fee is pending. Delivery remains off for everyone who was not named.

## Fail and rollback

- Refund that smoke charge with the existing refund review.
- Do not create a second seller or courier transfer.
- Set `HOMECHEFF_DELIVERY_ENABLED` back to off if it was enabled for the pilot.
- Do not drop webhook tables.
- Do not reverse an unrelated historical transfer.
- Leave any in-flight paid order in the database. Reassignment stays on the existing rule: another verified courier, or the same courier after Stripe returns `verified`.

## What this plan does not approve

- Production deploy of the marketplace or subscriptions.
- Public Delivery.
- Gate G.
- A second recovery of the refunded V19 order `59bfb45e` or the refunded V23 charge `ch_3UVGm5RpYdPVF6LP0JrNpRgE`.

DELIVERY_GATE_F_EXECUTED: NO
