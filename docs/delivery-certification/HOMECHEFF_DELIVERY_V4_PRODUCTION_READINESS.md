# HOMECHEFF_DELIVERY_V4_PRODUCTION_READINESS

Date: 2026-10-24
Repository: rassdread/homecheff-app
Branch: fix/delivery-financial-blockers
Baseline: 2e6b89a38b69acd69701be841cd8fbe5a0c62b68

Production Delivery stays disabled. No live Stripe action was taken. The V3 paid orders and transfers were not modified.

## 1. Executive summary

The V3 Marketplace, affiliate, and Standalone payments remain the financial evidence. This pass adds server-side controls and records that were missing from that certification:

- Manual courier assignment now uses the same age, profile, and suspension gate as acceptance.
- A Stripe webhook receipt records whether a verified event was processed, failed, or rejected, without storing the payload.
- Distance pricing reads only the server Maps key.
- The certified charges are split into contractual transfers, affiliate liability, and the still-pending Stripe fee.

These changes do not make Delivery ready for customers. The production webhook endpoint was not changed, the production Maps key was not created, and courier identity is still Stripe Connect plus a completed profile. It is not a separate government-document check.

GO/NO-GO: PRODUCTION_NOT_READY

## 2. Baseline

Worktree was clean at `2e6b89a38b69acd69701be841cd8fbe5a0c62b68`. The preview database host is `ep-green-wind-a2cspmqw`. Production `https://homecheff.eu/api/delivery/alignment-flags` still reports Delivery disabled.

V3 evidence that this pass does not repeat:

- Affiliate order `62f336cb-93e8-4234-a15d-bb2b7b13588e`, charge `ch_3UU7vzRpYdPVF6LP0DQgM7yZ`, 1502 cents.
- Standalone request `a54a0e88-d45f-4855-af5d-69bad86b060d`, charge `ch_3UU82JRpYdPVF6LP1vWgILsm`, 994 cents.
- Courier transfers stayed on the original charges. Seller transfer exists only for the Marketplace order.

## 3. Changes implemented

- `assertDelivererCanAccept` now runs before an administrator assigns a courier.
- `StripeWebhookReceipt` stores event id, type, livemode, status, HTTP status, and attempt count. The payload is not stored.
- A verified duplicate that already finished returns HTTP 200 and does not run the handler again.
- A second delivery while the first is still in progress returns HTTP 500 so Stripe can retry.
- A failed receipt can be processed again. A rejected 4xx receipt is not processed again.
- If the receipt table is unavailable, the webhook still runs and logs the failure. That keeps checkout alive before the migration is deployed. It also means monitoring is not proven until the migration is applied in that environment.
- Invalid signatures return `Invalid signature` and are not written to the receipt table, because the body is not trusted.
- The verified handler is a separate function so the receipt can be finished from the response status. Its body matches the certified baseline.
- `GET /api/admin/delivery/operations` is admin-only. It lists unresolved receipts and delivery payouts that do not yet have a `tr_` transfer. It does not show secrets.
- Distance Matrix uses `GOOGLE_MAPS_API_KEY` only.

The 88/12 split, the 12 percent product fee, and the 50 percent affiliate pool are unchanged.

## 4. Courier identity and eligibility

| Stage | Meaning | Can accept | Can receive a transfer | Bank payout |
|---|---|---|---|---|
| REGISTERED | No delivery profile | No | No | No |
| VERIFICATION_PENDING | Profile incomplete, inactive, or under 18 | No | No | No |
| ELIGIBLE_TO_ACCEPT | Adult, active, profile complete, not blocked | Yes | No | No |
| ELIGIBLE_FOR_TRANSFER | Stripe `transfers` capability is active | Yes | Yes | No |
| ELIGIBLE_FOR_EXTERNAL_PAYOUT | Stripe `payouts_enabled` is true | Yes | Yes | Stripe, not HomeCheff |
| SUSPENDED | `isBlocked` | No | No | No |

`DeliveryProfile.isVerified` means the profile is complete. It is not a government identity document. HomeCheff does not collect those documents. Stripe Connect is the payout identity check that already exists: an active transfers capability and `payouts_enabled`. This pass does not add Stripe Identity and does not claim a legal opinion.

Acceptance, payout, and manual assignment reject an underage, incomplete, or blocked courier. A courier who can accept work is not automatically allowed to receive a transfer. Pausing availability (`isActive` false) blocks new acceptance. An admin block also blocks a transfer.

## 5. Stripe Connect

Test Connect accounts from V3 remain the evidence that a payable courier can receive a transfer with `source_transaction` set to the original charge. This pass did not create a Connect account or a transfer.

A transfer is refused when the capability is missing, stale, or when payouts are not enabled. That check is unchanged.

## 6. Production webhook architecture

The handler verifies `Stripe-Signature` before any receipt is written. The local listener is not production infrastructure. The live Stripe webhook endpoint was not read or changed.

The preview database now has `StripeWebhookReceipt` from migration `20261024190000_stripe_webhook_receipt`. That migration was not applied to production.

## 7. Monitoring and recovery

Administrators with `canViewDeliveryDetails` can open `/api/admin/delivery/operations`.

It shows:

- Receipts in `FAILED`, `PROCESSING`, or `REJECTED`.
- Delivery payout rows whose `providerRef` is not a `tr_` transfer.
- Whether a server Maps key is configured, without showing the key.

Recovery for a failed receipt is a later Stripe retry of the same event id. Completed and rejected events are not run again. There is no paging provider. Production will not show these rows until the migration is deployed and the production app is running this code.

## 8. Google Maps production configuration

Pricing calls Distance Matrix on the server. `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is not used for that call. A missing server key still fails closed for a payable quote.

The current test key is restricted to one public IP and to the Distance Matrix API. Vercel does not have a stable outbound IP, so that allowlist cannot be the production control. A residential address must not be added to a production key.

Production setup, not performed here:

1. Create a separate key in `homecheff-auth`.
2. Restrict it to `distance-matrix-backend.googleapis.com` only.
3. Do not leave it unrestricted.
4. Store it only as `GOOGLE_MAPS_API_KEY` on the production server.
5. Do not copy the preview key into production.
6. Keep the preview key on its current IP allowlist.

No Google Cloud resource was changed in this pass.

## 9. Financial reconciliation

Buyer surcharge is `ceil((subtotal + 25) / 0.986) - subtotal`. It is an estimate collected from the buyer. The Stripe balance transaction is the actual fee. Both V3 fees are still pending, so they are not final profit.

Affiliate Marketplace charge, 1502 cents:

| Item | Cents |
|---|---|
| Product | 500 |
| Delivery fee | 955 |
| Buyer surcharge | 47 |
| Seller transfer | 440 |
| Courier transfer | 840 |
| Platform product fee | 60 |
| Platform delivery share | 115 |
| Affiliate liability | 30 + 57 = 87, pending, not paid |
| Stripe fee | 72, pending |
| Retained before the Stripe fee | 222 |
| After pending fee and affiliate liability | 63 |

Standalone charge, 994 cents:

| Item | Cents |
|---|---|
| Delivery fee | 955 |
| Buyer surcharge | 39 |
| Seller transfer | 0 |
| Courier transfer | 840 |
| Platform delivery share | 115 |
| Affiliate liability | 57, pending, not paid |
| Stripe fee | 56, pending |
| Retained before the Stripe fee | 154 |
| After pending fee and affiliate liability | 41 |

Affiliate commission is calculated on the platform fee, not on the courier or seller transfer. No other processor costs were available.

## 10. Typecheck and regression

The default TypeScript heap ran out of memory (exit 134). With a 4 GB heap, `tsc --noEmit` exited 2 and reported 2081 `error TS` diagnostics. None of those diagnostics are in the new receipt, readiness, contribution, Maps-key, or operations files. Eleven of them are in `app/api/stripe/webhook/route.ts` on the standalone and seller-settlement branches. Those statements are unchanged from the certified baseline, so they are pre-existing and were not rewritten. The project typecheck stays FAIL.

Focused regression after the changes: 57 passed, 0 failed. That run covers webhook receipts, courier readiness, certified contribution, Maps key placement, road-distance failure, payout source checks, courier revocation, both affiliate pools, delivery age, and attribution precedence. Tests used a dummy database URL and did not write to preview or production.

## 11. Security findings

- Webhook signatures are checked before a receipt is stored.
- The signature failure body no longer includes the verifier text.
- The operations route requires an admin permission on the server.
- The receipt table does not store the event payload.
- Manual assignment can no longer skip the courier age and profile gate.
- The browser Maps key is not a pricing secret.

No new identity-document collection was added.

## 12. Remaining external dependencies

- Apply `20261024190000_stripe_webhook_receipt` to production only when a deployment is authorized.
- Point the production Stripe webhook at this application and confirm one signed test event there. Do not do that until the owner asks.
- Create the separate production Distance Matrix key described above.
- Decide whether Stripe Connect remains the only identity check. A government-document product was not purchased.
- Leave production Delivery disabled until those steps and an explicit activation approval exist.

## 13. Production readiness matrix

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

PASS for payment, pricing, matching, and pickup uses the V3 paid evidence. This pass did not create another charge.

## 14. GO/NO-GO

PRODUCTION_NOT_READY

Do not enable Delivery for customers.

## 15. Exact remaining actions

1. Owner approval before any production deploy.
2. Deploy this branch only after that approval, then apply the webhook receipt migration to production.
3. Confirm the production webhook endpoint and one signed event after deploy.
4. Create the separate server-only Distance Matrix key. Do not reuse the preview IP allowlist.
5. Record the identity decision: Stripe Connect remains the payout check unless a separate identity product is approved.
6. Turn the production Delivery flag on only after those checks, and only with an explicit instruction.

## 16. Final certification status

FINAL_STATUS = PRODUCTION_NOT_READY
DELIVERY_PRODUCTION_READY = NO

## Operational activation checklist

Already completed:

- Preview isolation and Stripe test payments from V3.
- Courier age, block, and profile gates, including manual assignment.
- Webhook signature check and receipt logic.
- Preview migration for webhook receipts.
- Server-only Distance Matrix key selection.
- Financial split of the two certified charges, with pending Stripe fees labeled pending.

Needs HomeCheff approval:

- Production deploy.
- Production Delivery flag.
- Whether any identity product beyond Stripe Connect is required.

Needs external configuration:

- Production Distance Matrix key and API restriction.
- Production webhook endpoint and signing secret in the production environment, not in this repository.

Needs production deployment:

- Shipping this code.
- Applying the receipt migration.

Needs post-deployment verification:

- One signed production webhook written to `StripeWebhookReceipt`.
- A payable quote that uses the production key and fails closed when that key is missing.
- The operations view showing no unresolved payout for a new test order.
- The public Delivery flag still off until the explicit activation step.
