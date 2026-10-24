# HOMECHEFF_DELIVERY_V5_PRODUCTION_READINESS

Date: 2026-10-24
Repository: rassdread/homecheff-app
Branch: fix/delivery-financial-blockers
Baseline: ce6f3a910657820715dba5763f8aeebe82659805

Production Delivery stays disabled. No live Stripe action was taken. The V3 paid orders and transfers were not modified.

## 1. Executive summary

V5 closes the code gaps that could be closed without production access. Courier assignment still does not depend on a HomeCheff copy of an identity document. Stripe's own verification status is classified and is not treated as a passport check. Failed test webhooks can be recovered by a superadmin from the Stripe event, and live recovery stays off. Production Distance Matrix calls fail closed unless a server key is marked with the production role and is not copied into the browser variable. Pending Stripe fees stay pending: realized profit is null until the fee is available and the affiliate liability is settled.

GO/NO-GO: PRODUCTION_NOT_READY

## 2. Changes implemented

- `classifyStripeConnectIdentity` reads `individual.verification.status`, `requirements.disabled_reason`, and `payouts_enabled`. `payouts_enabled` alone is not identity verification. A disabled reason is `RESTRICTED` even if Stripe says verified. HomeCheff still stores no identity document. Assignment is not blocked for a missing document.
- A restricted Stripe identity removes transfer and bank-payout readiness in the classifier. Acceptance still uses age, profile completion, and suspension.
- `POST /api/admin/delivery/operations/recover` is superadmin-only. It accepts an event id, loads the receipt, retrieves the event from Stripe, and runs the existing handler only when the receipt is `FAILED`, the id and type match, and the Stripe key mode matches the receipt. Live receipts are refused unless `HOMECHEFF_WEBHOOK_RECOVERY_LIVEMODE=enabled`. That variable is not set. Five attempts per event per hour is the cap. Each attempt is stored without the payload.
- The operations view now returns status counts, a bounded page, repeated failures, stale processing, recent recovery attempts, and alert codes. It does not return payloads or secrets.
- Production Distance Matrix pricing calls Google only when `VERCEL_ENV=production`, `GOOGLE_MAPS_API_KEY` is set, `GOOGLE_MAPS_KEY_ROLE=production`, and the server key is not also in `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`. Otherwise the call is not made and a straight-line distance is not returned.
- `observeStripeProcessingFee` accepts only a Stripe balance transaction in `pending` or `available`. A buyer surcharge is not a fee. `realizedProfitCents` is null while the fee is pending or the affiliate liability is unpaid.
- The webhook handler's unreachable failure fields were typed without changing fulfillment. Seller settlement results are explicitly typed. The handler body still acknowledges a fulfilled standalone payment with HTTP 200.

The 88/12 split, the 12 percent product fee, and the 50 percent affiliate pool are unchanged.

## 3. Tests performed

Focused suite: 67 passed, 0 failed. The database URL for that run pointed at `127.0.0.1:1` and was not the preview database.

Covered here: identity classification, restricted transfer readiness, webhook recovery refusals and one successful dispatch, receipt duplicates and in-flight locking, fee observation, contribution with pending fees, Maps production role refusal without a Google call, road-distance failure, payout source checks, revocation, both affiliate pools, delivery age, and attribution.

Not run: a live webhook, a production Maps call, a new paid checkout, and a browser session of the admin page.

## 4. Financial verification

The two certified test balance transactions were read again. `livemode` was false. No charge, transfer, refund, or payout was created.

| Charge | Amount | Stripe fee | Fee status | Affiliate liability | Provisional net | Realized profit |
|---|---|---|---|---|---|---|
| Affiliate marketplace | 1502 | 72 | pending | 87 unpaid | 63 | null |
| Standalone | 994 | 56 | pending | 57 unpaid | 41 | null |

Courier transfers stay 840. The seller transfer stays 440 on the marketplace charge and 0 on standalone. The provisional net subtracts the pending fee and the unpaid affiliate liability. It is not settled profit.

## 5. Security verification

- Webhook signatures are still checked before a receipt is written.
- Recovery does not accept a caller-supplied payload.
- Recovery of a processed, rejected, mismatched, in-flight, or over-limit event does not dispatch.
- Live recovery is off.
- The recovery route requires a superadmin. The read-only operations route requires delivery visibility.
- Recovery attempts store the actor user id and a result code, not the event body.
- Google errors log the error name, not the request URL.
- The production Maps check refuses a server key that is copied into the browser variable.
- Age and suspension gates are unchanged.
- No new rate limit was added on public checkout routes. Recovery has its own hourly cap.

## 6. Courier identity readiness

PARTIAL

Stripe exposes `individual.verification.status` values `unverified`, `pending`, and `verified`, plus `requirements.disabled_reason` and `currently_due`. Those fields are available on the Account object the webhook already receives. HomeCheff does not persist document images.

`verified` means Stripe accepted the identity information it requested for that account. It does not tell HomeCheff which document was reviewed. A separate government-document product is not required by the current assignment rules. Whether the business wants assignment blocked until Stripe reports `verified` is an owner decision. This pass does not make that change, because the certified model allows an adult with a complete profile to accept work and blocks money until transfers are active and payouts are enabled.

## 7. Stripe webhook readiness

PARTIAL

Signature checks, deduplication, failed and rejected receipts, in-flight locking, and retry of `FAILED` rows are implemented and unit-tested. The preview database has both new tables. Production does not. A signed production event has not been observed.

## 8. Webhook monitoring readiness

PARTIAL

The admin view classifies repeated failures, stale processing, rejected events, missing transfers, and a production Maps misconfiguration. There is no external pager. Production will not show rows until the migrations and this code are deployed.

## 9. Webhook recovery readiness

PARTIAL

The mechanism is implemented and tested with a fake Stripe retrieve. It was not executed against a real event, including the certified V3 events. Live recovery is refused.

## 10. Google Maps production readiness

PARTIAL

The code path for a separate production key is in place and fail-closed. The production key was not created. The preview key was not changed. Manual steps are in the V5 runbook, Gate C.

## 11. Stripe fee accounting readiness

PARTIAL

Actual fees are read from balance transactions. Both certified fees remain `pending`, so they are not final. The buyer surcharge is excluded when it is labeled as an estimate. Realized profit stays null until the fee is `available` and the affiliate liability is settled.

## 12. TypeScript verification

The default heap runs out of memory. With a 4 GB heap, `tsc --noEmit` exits 2.

| Measure | Count |
|---|---|
| Baseline at V4 | 2081 |
| Final this pass | 2070 |
| New diagnostics in V5 files | 0 |
| Webhook handler diagnostics removed | 11 |
| Remaining paths whose names contain delivery | 66 |
| Remaining paths whose names contain stripe, payment, or checkout | 20 |

The 11 removed diagnostics were the unreachable standalone failure fields and the untyped seller-settlement array. The handler behavior is unchanged. The 66 delivery-path diagnostics are outside this change set and were not rewritten. Most of the 2070 are `TS2367` comparisons in unrelated code. Full-project typecheck stays FAIL. The focused tests are the scoped check for this pass.

## 13. Database migration readiness

PARTIAL

`20261024190000_stripe_webhook_receipt` was already on preview. `20261024220000_stripe_webhook_recovery_attempt` was applied to preview host `ep-green-wind-a2cspmqw` only. It creates one table and one index. It does not update financial rows.

The receipt primary key is `eventId`, which is the idempotency key. A concurrent insert conflict is treated as an existing row. `PROCESSING` younger than five minutes is in flight. Older `PROCESSING` and `FAILED` can run again. `PROCESSED` and `REJECTED` cannot.

Production procedure is Gate B of the runbook. Production was not migrated.

Rollback of these two migrations is dropping the new tables. That deletes operational history, not charges.

## 14. Remaining blockers

- Owner approval for every production gate.
- Production migrate of the two webhook tables.
- A new production Distance Matrix key and `GOOGLE_MAPS_KEY_ROLE=production`.
- One signed production webhook receipt.
- Stripe fees still pending, so realized profit is not known.
- Courier identity policy is not a legal sign-off.
- Project typecheck is still failing on pre-existing diagnostics.
- Production Delivery stays off.

## 15. Production release gates

| Gate | Status |
|---|---|
| A Code review | NOT_TESTED |
| B Production migration | BLOCKED |
| C Production Maps key | BLOCKED |
| D Production webhook | BLOCKED |
| E Monitoring in production | BLOCKED |
| F Production smoke test | NOT_TESTED |
| G Customer activation | BLOCKED |

## 16. Readiness matrix

| Gate | Status |
|---|---|
| Courier eligibility | PASS |
| Identity requirements | PARTIAL |
| Stripe Connect | PASS |
| Payment processing | PASS |
| Financial reconciliation | PASS |
| Affiliate accounting | PASS |
| Webhook security | PASS |
| Webhook monitoring | PARTIAL |
| Webhook recovery | PARTIAL |
| Google Maps | PARTIAL |
| Delivery pricing | PASS |
| Delivery matching | PASS |
| Pickup and completion | PASS |
| Authorization | PASS |
| Database isolation | PASS |
| Production configuration | NOT_TESTED |
| Typecheck | FAIL |
| Regression tests | PASS |
| Operational procedures | PARTIAL |
| Stripe fee accounting | PARTIAL |

Payment, pricing, matching, and pickup remain the V3 evidence. This pass did not create another charge.

## 17. Final recommendation

PRODUCTION_NOT_READY

Do not enable Delivery for customers. The next safe step is Gate A review. Do not start Gate B, C, or D until that review is approved.
