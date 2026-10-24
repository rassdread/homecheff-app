# HOMECHEFF Delivery V6 independent Gate A audit

Date: 2026-10-24
Repository: rassdread/homecheff-app
Branch: fix/delivery-financial-blockers
Reviewed commit: 7bda45a19bd9b924076ca8d4ac1232e6979a034e

This is an independent review of that commit. Earlier PASS marks were not treated as evidence. Gate A is not approved by this document. Gates B through G stay unapproved. Production Delivery stays disabled.

## 1. Executive summary

Gate A should not be approved.

Two code defects are enough to reject a code-review gate:

1. Marketplace checkout prices the delivery from coordinates in the request body. It does not charge the fee or the coordinates stored on the accepted booking.
2. Manual admin assignment writes status `ASSIGNED`. That status is outside the delivery state machine, and the accept route only accepts `PENDING`. The order cannot be picked up or completed, so the delivery transfer that runs on `DELIVERED` does not run.

The official production build script also fails. `scripts/typecheck-ratchet.mjs` reports 3 signatures that are not in the baseline and exits 1. `npm run build` stops there. A separate `next build` was started without production credentials and did not finish.

The historical preview orders still match the certified amounts. That shows those particular checkouts were not tampered with. It does not show the code refuses a different checkout body.

## 2. Audit scope

Reviewed at `7bda45a1` on `fix/delivery-financial-blockers`. The tree was clean at the start. Remote is `rassdread/homecheff-app`.

Before this report was committed, the worktree also contained uncommitted edits in the webhook route, booking service, Maps distance helper, operations view, related tests, and the V5 runbook. Those edits were not part of the reviewed commit. They were not reviewed, reverted, or included here. The findings below are about `7bda45a1`.

In scope: pricing, eligibility, assignment, payouts, affiliate ledger behavior, webhook receipt and recovery, Maps key placement, the two webhook migrations, the typecheck ratchet, and the admin operations view.

Out of scope: production writes, a new charge, a Google Cloud change, and a customer-facing flag change.

## 3. Evidence reviewed

Safety checks this session:

- HEAD `7bda45a19bd9b924076ca8d4ac1232e6979a034e`, clean tree.
- Preview database host `ep-green-wind-a2cspmqw`. No production host in the preview env file.
- Stripe secret and publishable key are test keys. `livemode` on the test balance was false.
- `GOOGLE_MAPS_API_KEY` is set. `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is not. `GOOGLE_MAPS_KEY_ROLE` is unset. `VERCEL_ENV` is `preview`.
- `HOMECHEFF_WEBHOOK_RECOVERY_LIVEMODE` is unset.
- `https://homecheff.eu/api/delivery/alignment-flags` returned `homeCheffDeliveryEnabled: false`.

Read-only preview rows and Stripe balance transactions, re-read this session:

| Record | Observed |
|---|---|
| Marketplace orders `ece80bec-f1f6-434f-b461-0ad3eac1493c` and `62f336cb-93e8-4234-a15d-bb2b7b13588e` | `DELIVERED`, `totalAmount` 1502 |
| Delivery orders for those orders and standalone `cmvmmo6ba000b2jed9lf40b82` | fee 955, `quotedFeeCents` 955, `DELIVERED` |
| Booking `cmvmmek7700012jedtsudc4vv` | `CONSUMED`, quoted 955, 16.1 km |
| Courier payouts for the V3 delivery orders | 840 cents, `providerRef` starts with `tr_` |
| Seller payout for the affiliate order | 440 cents, `providerRef` starts with `tr_` |
| Affiliate ledger rows containing the affiliate order id | 2 rows, 87 cents, status `PENDING` |
| Standalone ledger rows containing `a54a0e88-d45f-4855-af5d-69bad86b060d` | 57 cents, status `PENDING` |
| `txn_3UU7vzRpYdPVF6LP0ncKVZA5` | amount 1502, fee 72, status `pending` |
| `txn_3UU82JRpYdPVF6LP1saTnPlJ` | amount 994, fee 56, status `pending` |

No charge, transfer, refund, or payout was created. No production database was opened.

## 4. Source-code findings

### Critical: accepted booking price is not the checkout price

`app/api/checkout/route.ts` loads the booking and checks the buyer, the courier, the status, and payout readiness (`571:605`). A search of that file finds no use of `booking.quotedFeeCents`, `booking.buyerLat`, `booking.buyerLng`, or `booking.routeDistanceKm`.

The fee is then computed from `coordinates` in the request body (`650:657`) and the courier's rate card (`760:813`). If the client sends a quote, it is compared with that new calculation (`789:802`), not with the accepted booking. Omitting the client quote, or sending the new lower quote, charges the new amount.

The booking model already stores the agreed fee and coordinates (`prisma/schema.prisma` `DeliveryBookingRequest`, `quotedFeeCents`, `routeDistanceKm`, `buyerLat`, `buyerLng`). Checkout ignores them.

Standalone checkout does not have this hole. `lib/delivery/standalone-delivery.ts` charges `row.quotedFeeCents` (`499`) and returns 409 when the client quote differs (`451:461`). Fulfillment also requires `session.amount_total` to equal `row.buyerTotalCents` (`668`).

Reproduction without a new payment: the marketplace route contains no reference to the stored booking price. A buyer with an accepted booking can post a closer `coordinates` pair. The server asks Distance Matrix for that pair and prices it. The courier accepted a different fee.

Smallest correction: price checkout from the booking's stored coordinates and `quotedFeeCents`, and reject the request when the body disagrees. Do not trust body coordinates after acceptance.

This was not fixed in this audit.

### High: manual assignment cannot be completed

`app/api/admin/delivery/orders/[orderId]/assign/route.ts` sets `status: 'ASSIGNED'` (`67`) after the eligibility check.

`lib/delivery/delivery-status.ts` allows only `PENDING`, `ACCEPTED`, `PICKED_UP`, `DELIVERED`, and `CANCELLED`. `assertDeliveryStatusTransition` rejects any move whose current status is not in that map.

`app/api/delivery/orders/[orderId]/accept/route.ts` returns before acceptance unless `status === 'PENDING'` (`127`).

An admin-assigned order cannot be accepted, picked up, or delivered. The courier transfer in `ensureDeliveryPayout` is reached from the delivered transition, so that order also stays unpaid.

Smallest correction: write `ACCEPTED` or leave `PENDING` and use the accept route. Do not invent a status the transition map does not contain.

This was not fixed in this audit.

## 5. Delivery lifecycle

| Step | Result | Evidence |
|---|---|---|
| Product selection | Implemented | Existing checkout loads products from the database. Not re-run as a browser order. |
| Delivery request and distance | Implemented, tested for fail-closed Google results | `isVerifiedRoadDistance` rejects haversine for a payable quote. Unit tests pass. |
| Price shown and charged | Financially incomplete for marketplace | See the booking-price finding. Historical orders were 955 cents because those requests used the real route. |
| Payment confirmation | Implemented for the reviewed test orders | Preview orders are `DELIVERED` with the Stripe amounts above. No new payment. |
| Courier acceptance on the normal path | Implemented | Accept route calls `assertDelivererCanAccept` and requires `PENDING`. |
| Pickup and completion | Implemented for `PENDING → ACCEPTED → PICKED_UP → DELIVERED` | State map in `delivery-status.ts`. Not re-walked in a browser. |
| Admin assignment | Blocked | `ASSIGNED` cannot move. |
| Settlement | Implemented when status reaches `DELIVERED` | Historical courier rows are 840 with a `tr_` reference. |

Customer and courier browser journeys were not repeated. The V3 rows are historical evidence only.

## 6. Financial integrity

The reviewed preview rows match the earlier arithmetic:

- Affiliate marketplace charge 1502 = 500 product + 955 delivery + 47 surcharge estimate.
- Seller 440, courier 840, platform delivery share 115, product fee 60.
- Affiliate ledger 87 cents, still `PENDING`. Stripe fee 72, still `pending`. Provisional remainder 63. Realized profit is not recognized. `platformContribution` returns `realizedProfitCents: null` unless the fee status is final and the affiliate liability is settled (`lib/delivery/platform-contribution.ts`).
- Standalone charge 994 = 955 + 39 surcharge estimate. Courier 840. Affiliate ledger 57 cents, `PENDING`. Stripe fee 56, `pending`. Provisional remainder 41.

One seller transfer and one courier transfer were present for the affiliate order. No second courier transfer was found for the V3 delivery payouts that were queried.

That does not make the marketplace checkout path safe. The charge amount can change before payment, as described above. Affiliate commission is a percentage of the platform fee on whatever was charged, so a reduced delivery fee also reduces the affiliate base. The percentages themselves were not changed.

Refund and duplicate-transfer behavior is covered by `lib/delivery/delivery-financial-blockers.test.ts`, which passed. Those tests are mocks. They are not a new refund against Stripe.

Additional payout risk: after a recorded failure, `lib/delivery/delivery-payout.ts` appends `transferFailureAt` to the Stripe idempotency key (`512:518`). A later call looks for an existing transfer (`590:609`). If that list call throws, the function returns null and can create a second transfer. This is an operational failure mode, not a buyer attack. Severity high.

## 7. Stripe webhook

`app/api/stripe/webhook/route.ts` reads the raw body and calls `stripe.webhooks.constructEvent` before any receipt write (`2240:2247`). Invalid signatures return 400 and are not stored. The verifier message is logged (`2246`). That log line can contain Stripe's error text. It should not contain the signing secret. Severity low.

Receipt rules in `lib/stripe/webhook-receipt.ts`:

- `PROCESSED` and `REJECTED` return skip.
- `PROCESSING` younger than five minutes returns in flight.
- `FAILED`, or `PROCESSING` older than five minutes, is processed again.
- The update is not conditional. Two workers that both pass the five-minute window can both run. Money safety then depends on payout idempotency, which has the gap above.

If the receipt table is missing, the route logs the error name and still processes the event (`2263:2266`). That avoids blocking checkout before the migration. It also means a production deploy of this code before the migration has no deduplication. Gate B must apply the migration in the same window as the code, or accept that window.

Recovery (`lib/stripe/webhook-recovery.ts` and `app/api/admin/delivery/operations/recover/route.ts`):

- Superadmin only (`requireSuperAdmin`).
- Body is an event id. The payload is not stored.
- Live receipts are refused unless `HOMECHEFF_WEBHOOK_RECOVERY_LIVEMODE` is exactly `enabled`. It is not set.
- The Stripe key mode must match `receipt.livemode` (`sk_live` versus not).
- Retrieved id, type, and livemode must match the receipt.
- A processed receipt is not dispatched.
- Five attempts per event per hour.
- Tests are in-memory. No real event was recovered this session.

The handler does not itself reject `event.livemode === true` when the API key is a test key. `financialStripeSecret` returns null for a live key on a preview host (`lib/stripe-runtime-guard.ts`), so the route returns 503 before verification in that case. A live signing secret placed next to a test API key would still verify a live event. That is a configuration hazard. Severity medium.

## 8. Courier identity

`lib/delivery/courier-identity.ts` reads `individual.verification.status` and `requirements.disabled_reason`. `payouts_enabled: true` with status `unverified` is `DETAILS_DUE`, not verified. A disabled reason forces `RESTRICTED` even if Stripe says verified. `governmentDocumentStoredByHomeCheff` is false. Assignment is not blocked for a missing document.

Accept, match, and admin assign call `assertDelivererCanAccept` (`accept/route.ts`, `match-orders/route.ts`, `assign-order/route.ts`, admin assign). Payout calls `assertCommercialCourierCanReceivePayout` (`delivery-payout.ts`). Underage, incomplete, and blocked couriers are rejected by those functions. The unit tests passed again.

What remains an owner decision, not a code fact: whether a courier may accept work before Stripe reports `verified`. The code allows acceptance from age, profile completion, and suspension, and blocks the transfer until Connect transfers are active and payouts are enabled. This audit does not call that a legal conclusion.

`DeliveryProfile.isVerified` is still profile completion, not a document check.

## 9. Google Maps

`serverDistanceMatrixKey` reads only `GOOGLE_MAPS_API_KEY`. `assessMapsProductionConfig` refuses a production runtime (`VERCEL_ENV=production`) unless the role is exactly `production` and the server key is not copied into `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`. `getRouteDistance` returns an error and does not call Google in that case. The unit test `does not call Google or substitute haversine when production is not configured` passed.

Limits:

- The role check does not run when `VERCEL_ENV` is anything other than `production`, including `NODE_ENV=production` on a non-Vercel host.
- Non-production Google failures still fall back to haversine. Commercial quotes reject that result. Display callers can still show it.
- `getBatchRouteDistances` does not use the production gate. A repository search finds no caller. Severity low.
- The buyer still chooses the coordinates that are sent to Distance Matrix at marketplace checkout. The server calculates the route, but it calculates the route the buyer submits. See the critical finding.

No Google Cloud resource was changed. No production key exists.

## 10. Database migrations

Both migrations only create tables:

- `20261024190000_stripe_webhook_receipt`: primary key `eventId`, index `(status, updatedAt)`. No payload column. Status is unconstrained text.
- `20261024220000_stripe_webhook_recovery_attempt`: primary key `id`, index `(eventId, createdAt)`. No foreign key.

They do not update orders, payouts, or users. Prisma migrate history makes a second apply a no-op. Rollback is dropping these tables, which deletes operational history and not charges.

They were already applied on the preview host before this audit. This audit did not migrate anything. The production schema was not compared. Gate B is not ready to run. The SQL itself is safe to review, with the deploy-order warning in section 7.

`next.config.mjs` sets `typescript.ignoreBuildErrors: true`. The real deploy gate is the ratchet, not `tsc` inside `next build`.

## 11. TypeScript and build

`node scripts/typecheck-ratchet.mjs` with a 4 GB heap exited 1:

`Typecheck ratchet: 703 current, 767 baseline, 3 new, 67 resolved.`

New signatures:

- `app/api/delivery/settings/route.ts` TS2345, `distanceSemanticsVersion` is not on `CanonicalDeliveryProfileRow`.
- `lib/delivery/booking-request-service.ts` TS2353, `message` is not on the failure result type.
- `lib/delivery/distance-semantics.test.ts` TS2353, `distanceSemanticsVersion` is not on `DeliverySignupInput`.

The V5 report's 2070 figure counted `error TS` lines. The ratchet counts unique file, code, and message signatures, so 703 is not a contradiction. Three of those signatures are new relative to `scripts/typecheck-baseline.txt`. `scripts/vercel-build.js` runs this ratchet before `next build` and exits on failure. The official production build therefore fails.

`npx next build` was started with a 4 GB heap, telemetry disabled, and without a production env file. The worktree has no `.env.local`. After about 13 minutes the compile was still on "Creating an optimized production build" and the Node process stayed near 80 MB in an uninterruptible wait. It was stopped. The Next compiler result is not a pass.

`FULL_PROJECT_TYPECHECK` is fail. `DELIVERY_SCOPED_TYPECHECK` is fail because the three new signatures are delivery files. `PRODUCTION_BUILD` is fail.

## 12. Security findings

| Severity | Component | Exploitability | Financial impact | Evidence | Action |
|---|---|---|---|---|---|
| Critical | `app/api/checkout/route.ts` | Authenticated buyer changes `coordinates` after the courier accepts | Charge and courier pay follow the new route, not the accepted quote | No reference to `booking.quotedFeeCents` in that file. Distance uses body coordinates at `650:657`. | Charge the stored booking. Do not approve Gate A first. |
| High | Admin assign | Admin, or any admin allowed by the delivery permission | Paid order stuck, courier not transferred | `ASSIGNED` vs `PENDING` and the status map | Use a status the map allows. |
| High | `delivery-payout.ts` idempotency key | Needs a failed list call after a transfer that was created but not stored | Second courier transfer | Key suffix at `512:518`. List errors return null at `608:609`. | Keep one idempotency key per delivery order and charge. |
| High | Typecheck ratchet | Deploy script | Official build does not complete | Ratchet output, 3 new signatures | Fix the three signatures or consciously update the baseline. Do not ignore the ratchet. |
| Medium | Webhook receipt | Deploy before migration, or two workers after five minutes | Duplicate handler runs | Fail-open at `2263:2266`. Non-atomic update in `decideExisting`. | Migrate with the code. Make the processing claim conditional. |
| Medium | Maps role | Production process whose `VERCEL_ENV` is not `production` | Preview key could be used, or haversine could be reached outside the gate | `mapsRuntime` checks only `VERCEL_ENV`. | Treat non-Vercel production as production. |
| Medium | Webhook livemode | Live signing secret configured on a test-key server | Live event applied to the wrong database | `constructEvent` does not compare `event.livemode` with the key mode | Reject livemode mismatches. |
| Low | `lib/admin-guard.ts` `127` | Admin with no permissions row | View and non-superadmin actions default to allowed | `perms?.[permission] ?? true` | Default to deny. Recovery is already superadmin-only. |
| Low | `getBatchRouteDistances` | No caller found | None today | Function still returns haversine | Remove it or apply the same fail-closed rule. |
| Low | Signature log | Operator log access | Error text, not the secret by itself | `2246` | Log the error name only. |

No forged webhook was sent. No destructive test was run.

## 13. Operational readiness

Administrators can see failed, rejected, and stale webhook receipts, recovery attempts, payouts without a `tr_` reference, and whether the Maps role is payable (`app/api/admin/delivery/operations/route.ts`). They cannot see unassigned orders, orders stuck in `ASSIGNED`, or unpaid affiliate liabilities from that view.

| Gap | Class |
|---|---|
| Checkout not bound to the accepted quote | Critical before any pilot |
| `ASSIGNED` orders cannot complete | Critical before any pilot |
| Official build fails the typecheck ratchet | Critical before any pilot |
| No queue of unassigned or stuck deliveries | Critical before a pilot |
| Affiliate liabilities not shown in the operations view | Recommended before scale |
| No external pager | Optional |

A small regional pilot does not have enough operational control while the quote and assignment defects remain.

## 14. Regression tests

Existing focused suite, rerun this session with a dummy database URL `127.0.0.1:1`:

67 passed, 0 failed.

That run is unit and mock coverage: receipts, recovery decisions, identity classification, contribution math, Maps role refusal, payout source checks, revocation, affiliate pools, age, and attribution. It does not execute checkout, does not create a Stripe charge, and does not walk a courier through pickup.

No new audit test was added. The critical finding is a missing check, which a passing unit suite did not cover.

## 15. Critical blockers

1. Marketplace checkout can charge a different delivery fee from the one the courier accepted.
2. Admin assignment writes a status that cannot progress to delivery or payout.
3. The official build ratchet fails on three delivery TypeScript signatures.

## 16. Non-critical improvements

- One stable transfer idempotency key, and do not treat a failed transfer list as "no transfer".
- Compare-and-swap the webhook receipt claim.
- Reject live events on a test key.
- Apply the Maps production rule whenever the process is production, not only when `VERCEL_ENV` is `production`.
- Default missing admin permissions to deny.
- Show unassigned orders and unpaid affiliate balances in the operations view.

## 17. Gate A recommendation

GATE_A_RECOMMENDATION = REJECT

This file does not approve Gate A. Only the project owner can do that. The recommendation is not to approve it until the critical blockers are fixed and reviewed again.

Gates B, C, D, E, F, and G remain unapproved. Do not migrate production, create the production Maps key, change the live webhook, or enable Delivery from this audit.

## 18. Exact next safe action

Leave production Delivery disabled. Do not start Gate B.

Correct, in this order, on this branch:

1. Bind marketplace checkout to the accepted booking's coordinates and `quotedFeeCents`.
2. Stop writing `ASSIGNED`, and prove an assigned order can reach `DELIVERED` and one transfer.
3. Clear the three ratchet signatures, then rerun `scripts/typecheck-ratchet.mjs` and the official build.

After that, commission a new independent review. Do not treat this document as that review.
