# HomeCheff Delivery V6A — courier transfer idempotency

Date: 2026-10-26  
Repository: rassdread/homecheff-app  
Branch: `fix/delivery-financial-blockers`  
Base: `d5fc469cd0e01d304207d8d676710fa56f19f6bb`  
Scope: the Gate A HIGH finding that a failed Stripe transfer lookup could be treated as “no transfer exists”, after which a new idempotency key could create a second courier transfer.

This report does not approve Gate A and does not make Delivery production-ready.

## 1. Original defect

`ensureDeliveryPayout` listed transfers for a transfer group. Any thrown lookup (timeout, auth, rate limit, network, unexpected body) returned null. The code then treated that null as “nothing exists” and created a transfer. The idempotency key included `transferFailureAt` or `transferFailureCode`, so a retry did not reuse the first key. Stripe idempotency keys also expire, so a later retry with a new key can pay the same delivery and charge twice.

## 2. Root cause

Two mistakes compounded:

- A failed lookup was collapsed into the same result as a definitive not-found.
- The Stripe idempotency key was not a stable identity of the financial obligation.

There was no database row that could reject a second obligation for the same delivery order, charge, and purpose.

## 3. Transfer-path inventory

Courier principal (`delivery_provider_principal`) creation:

| Path | Role |
| --- | --- |
| `lib/delivery/delivery-payout.ts` `ensureDeliveryPayout` | Only application entry that settles this obligation. |
| `app/api/delivery/orders/[orderId]/update-status/route.ts` | Calls `ensureDeliveryPayout` on completion with server-side ids. No client amount. |
| `lib/hc/marketplace-hc-delivery.ts` | Re-exports `ensureDeliveryPayout`. Does not create a transfer itself. |
| `scripts/delivery-controlled-e2e-finalize-from-pi.ts` | Calls the same function. Not executed in this task. |

Not courier-principal creation, left unchanged:

- `lib/stripe.ts`, seller settlement, affiliate payout, escrow release, treasury transfer, and seller payout request. These move other money.
- `transfers.createReversal` in the webhook, refund review, recipient reversal, and admin full-refund route. A reversal is not a second courier payment.
- `recordDeliveryTransferCreated` records a transfer Stripe already created. It does not call `transfers.create`.

After this change, the only `transfers.create` for the courier principal is inside `settleCourierTransferObligation`.

## 4. Implemented fix

`ensureDeliveryPayout` still validates the source charge, refund marker, amount, currency, and courier eligibility. It then calls `settleCourierTransferObligation`. That function:

1. Inserts or reads one `CourierTransferObligation` for delivery order, charge, and purpose `delivery_provider_principal`.
2. Refuses the call when amount, currency, destination, or recipient differs from the stored obligation.
3. Takes a two-minute processing lease with a conditional update.
4. Lists existing Stripe transfers before any create.
5. Creates at most once, and only after a definitive not-found, using one stable idempotency key.
6. Never creates again after `stripeCreateAttemptedAt` is stored.

The database transaction is not held open across the Stripe call. The lease is the concurrency control.

## 5. Durable obligation

Table `CourierTransferObligation`, no foreign key, so a later delete of a delivery row cannot cascade away the financial history.

States used: `PENDING`, `PROCESSING`, `CONFIRMED`, `UNKNOWN`, `FAILED`, `REQUIRES_REVIEW`.

An expired `PROCESSING` lease with no create attempt can be reclaimed. A lease that already recorded a create attempt is only reconciled.

## 6. Database constraints

- Unique `(deliveryOrderId, chargeId, purpose)`.
- Unique `idempotencyKey`.
- Index on `(state, processingLeaseUntil)`.

Migration: `prisma/migrations/20261026140000_courier_transfer_obligation`. Applied to the isolated preview database (`ep-green-wind`) only. A probe row `v6a-idempotency-probe` / `ch_v6a_probe` was inserted, the second insert was rejected with `P2002`, and the probe was deleted. Certified payout rows were not modified. Production was not migrated.

Rollback of this table is `DROP TABLE "CourierTransferObligation"`. That does not delete charges, payouts, or Stripe transfers. It does remove the new reservation history, so it must not be used after real obligations exist unless those rows have been exported.

Deployment order when this is later approved: apply the migration before running application code that writes the table. The previous application does not read the table, so the migration can land first.

## 7. Stripe idempotency strategy

Key: `homecheff:delivery:courier-transfer:<deliveryOrderId>:<chargeId>:v1`.

It is derived from the delivery order id and the source charge id. It does not contain a timestamp, webhook id, retry count, request id, or secret.

Every attempt for that obligation uses the same account context, destination, amount (`eur`), transfer group `order_<orderId>`, source charge, and key. A changed recipient, destination, amount, or currency marks `REQUIRES_REVIEW` and does not create another transfer.

## 8. Unknown-outcome handling

Lookup failures are classified as `LOOKUP_TIMEOUT`, `LOOKUP_AUTH`, `LOOKUP_RATE_LIMIT`, `LOOKUP_FAILED`, or `LOOKUP_INCOMPLETE`. Incomplete means `has_more` is true, or a page of 20 or more is returned without `has_more`. Those results set `UNKNOWN` and do not set `stripeCreateAttemptedAt`, so a later definitive not-found can still create once.

A create attempt sets `stripeCreateAttemptedAt` before `transfers.create`. If the response is lost, the database update fails, or the process restarts, the next call lists Stripe and confirms only when a matching non-reversed transfer is found. If none is found, the state is `REQUIRES_REVIEW` (`TRANSFER_NOT_FOUND_AFTER_ATTEMPT`). There is no automatic second create. Stripe’s idempotency retention window is not treated as a permanent lock.

## 9. Concurrent requests

The claim is one conditional `updateMany`. The loser waits up to about two seconds. If the winner confirms, both callers return that transfer id. An open lease returns `TRANSFER_IN_FLIGHT` and does not create. Repeated completion and a second settlement call reuse the confirmed row.

## 10. Reassignment

The obligation is per delivery and charge, not per courier. Changing the recipient or destination on an existing row is `TRANSFER_RECIPIENT_CHANGED` or `TRANSFER_DESTINATION_CHANGED`. The new courier is not paid automatically. An administrator must reconcile that case. No new admin payout action was added.

## 11. Refund implications

`HC_DELIVERY_REFUNDED` still blocks settlement before the obligation is created. A refund after a confirmed transfer is not reversed by this change. Existing reversal routes were not modified and are not assumed to have succeeded. A refund does not authorize a second courier transfer.

## 12. Security review

Settlement parameters come from the delivery order, the verified source charge, and the courier profile. The completion route does not accept a client amount. Couriers do not set the destination account or the payout amount in this path. Admin screens do not call `transfers.create`. Metadata is order id, delivery order id, purpose, provider user id, and charge id. The idempotency key contains no credentials. Logs in this path were not given secrets.

This review did not re-test the 15-minute identity cache, company-driver dispatch, or marketplace webhook fail-open behavior. Those remain outside this fix.

## 13. Test evidence

Mocked, in `lib/delivery/courier-transfer-obligation.test.ts` and the existing payout suites:

| Case | Result |
| --- | --- |
| A normal create | PASS |
| B duplicate returns the same transfer | PASS |
| C two concurrent callers, one create | PASS |
| D lookup timeout | PASS |
| E lookup authentication failure | PASS |
| F lookup rate limit | PASS |
| G database update fails after Stripe returns an id | PASS |
| H lost network response, second call does not create | PASS |
| I restart after an attempt, no second create | PASS |
| J repeated settlement | PASS |
| K settlement while another lease is open | PASS |
| L recipient change | PASS |
| M amount change | PASS |
| N currency change | PASS |
| O existing matching transfer adopted, zero creates | PASS |
| P expired idempotency window is not a reason to create again | PASS |
| Q reservation failure | PASS |
| R unique constraint | PASS in memory and on preview |
| S refund marker still blocks before settlement | PASS by source assertion and existing payout tests |
| T suspended or unverified courier still blocked | PASS in existing payout tests |
| U completion route does not take a client fee | PASS by source assertion |
| V payout path still uses the financial Stripe secret and contains no live key literal | PASS by source assertion |

Stripe test-mode integration that would create a transfer: NOT_TESTED. No test charge or transfer was created.

Focused regression command, dummy database, 48/48 pass for the obligation, financial-blocker, payout-verification, and revocation suites. A broader focused run earlier in the task, before the last lease edit, was 76/76 and included activation, financial-ops, identity, locked price, and platform contribution. Those files were not changed again after that run except assertion updates that were included in the 48.

## 14. Production build

`node scripts/vercel-build.js` with a dummy database and `HOMECHEFF_DELIVERY_ENABLED=false`.

Result: PASS. Log ends with `Build completed successfully` and exit 0. Ratchet: 699 current, 767 baseline, 0 new.

Prisma client errors and NextAuth missing-secret lines during page-data collection come from the dummy database and are the same class of local-build noise as the previous passing build. They did not fail the build.

## 15. TypeScript

`tsc --noEmit --pretty false --incremental false` with a 4 GB heap.

Baseline: 2066 diagnostics. Final: 2066 diagnostics. New diagnostics in `delivery-payout.ts` and `courier-transfer-obligation.ts`: none. TypeScript configuration was not weakened. Exit code remains 2 because of the pre-existing project diagnostics.

## 16. Remaining risks

- After a create attempt, a definitive not-found becomes `REQUIRES_REVIEW` and stays unpaid until a person reconciles it. That is intentional. It is also an operational gap: a rejected create is not retried automatically after Stripe’s idempotency window.
- A transfer in the same group with the same delivery id and amount, and with no purpose metadata, is adopted so it is not paid again. A transfer with a different purpose is not adopted.
- Reassignment does not pay the replacement courier.
- Refunds after a confirmed transfer are not auto-reversed here.
- The full settle function was not executed against preview Postgres. Only the unique constraint was.
- No Stripe test-mode transfer was created, so live Stripe pagination and error bodies were not exercised.
- Prior medium findings remain: 15-minute identity cache, company driver dispatch, marketplace webhook fail-open, and livemode compared with the API key. They are not fixed here.
- Production does not have this table yet. Deploying the code before the migration would fail closed on reservation (`RESERVATION_FAILED`) rather than create a transfer, but that deploy is not authorized.

Adversarial search of `transfers.create` found no second courier-principal creator. No remaining application path appends a timestamp or failure code to this idempotency key. Verdict for the duplicate-payout defect: no remaining automatic duplicate path was found.

## 17. Gate A re-review

Recommendation: ready for a new independent review of this commit.

Formal Gate A approval: NO.  
Production Delivery: disabled (`homeCheffDeliveryEnabled: false` on `https://homecheff.eu/api/delivery/alignment-flags`, read 2026-10-26).  
Delivery production-ready: NO.
