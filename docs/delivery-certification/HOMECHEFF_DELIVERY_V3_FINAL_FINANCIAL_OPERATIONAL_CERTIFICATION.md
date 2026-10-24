# HOMECHEFF_DELIVERY_V3_FINAL_FINANCIAL_OPERATIONAL_CERTIFICATION

Date: 2026-10-24
Repository: rassdread/homecheff-app
Branch: fix/delivery-financial-blockers
Base head: 60102d79ac58da3f9a1c38041adb6fe1302cc34a
Worktree was clean at that commit before this report.

The V2 Marketplace paid lifecycle was not repeated. Its orders, charge, and transfers were only read and then used for a local webhook replay.

## Isolation

| Check | Result |
|---|---|
| Database host | ep-green-wind-a2cspmqw-pooler.eu-central-1.aws.neon.tech |
| Direct host | ep-green-wind-a2cspmqw.eu-central-1.aws.neon.tech |
| Database | neondb |
| Production database host | absent |
| Stripe account | acct_1S6D3DRpYdPVF6LP |
| Keys | sk_test and pk_test; no live key in the preview env |
| Balance livemode | false |
| Local delivery flag | true |
| Production https://homecheff.eu delivery flag | false |

The local Next process was started from the preview env file only.

## Google Maps blocker

The restricted Distance Matrix key allows server IP 92.254.124.70. The current public IPv4 is 109.38.141.21.

No Distance Matrix request was made. The key restriction was not changed. A new payable quote cannot be certified, because commercial pricing fails closed when Google does not return a road distance. The previous Rotterdam to Delft result remains 16.1 km and 24 minutes.

This blocks the new affiliate Marketplace charge and the new Standalone Delivery charge. The two-charge limit was not used.

## Stripe listener

DNS for api.stripe.com resolved and the Stripe API health check returned 200. The dedicated `homecheff-delivery-preview` listener was restarted and forwards only to `127.0.0.1:3010/api/stripe/webhook`. The new signing secret was written only to the gitignored preview env. It is not recorded here.

## Webhook replay

Event `evt_1UTufYRpYdPVF6LPaWj29q0E` is the genuine V2 `checkout.session.completed` event, livemode false, for session `cs_test_b1K6r0i5uIrq9oKOlmYCeZ77NZfNz2MsPPCsxqhXlLGaKev9CeCHMcwDCJ`.

It was not resent through Stripe dashboard endpoints. One of those endpoints is an enabled Vercel preview. The payload retrieved from the Stripe TEST API was signed locally for the isolated app and posted to `127.0.0.1:3010/api/stripe/webhook`.

| Check | Before | After |
|---|---|---|
| HTTP | | 200, body `ok` |
| Server log | | `settlement complete (idempotent)` |
| Marketplace orders | 1 | 1 |
| Delivery orders | 2 | 2 |
| Payout rows | 3 | 3 |
| Commission ledger rows | 2 | 2 |
| Order status | DELIVERED | DELIVERED |
| Delivery fee | 955 | 955 |

Stripe transfers after replay:

| Transfer | Amount | Reversed |
|---|---|---|
| tr_3UTufXRpYdPVF6LP1v5zMvXd | 840 | no |
| tr_3UTufXRpYdPVF6LP1FGeGbEd | 440 | no |
| tr_3UTNroRpYdPVF6LP08CZ24LX | 880 | no |

One transfer remains to the V2 courier account and one to the V2 seller account.

A second pair of the same signed request, sent together, both returned 200. Payout rows stayed at 3 and orders stayed at 1. An invalid signature returned 400.

This is a locally re-signed copy of the genuine event, not a second delivery created by Stripe. There is still no stored Stripe event-id ledger. Idempotency is the existing order and the existing `tr_` payout references. A first-time create race was not exercised, because that would require a new charge.

## Affiliate rules in the current code

Attribution is first-touch. Cookie `hc_ref` lasts 30 days. The revenue window is 365 days. Ledger entries stay pending 14 days. Self-referral is blocked. A second commission for the same order id is skipped.

Marketplace product commission uses the HomeCheff platform fee on the product, not the seller net and not the courier share. The current seller fee on the V2 order was 1200 bps. The affiliate pool is at most 50 percent of that platform fee:

- neither side referred: 0
- buyer only: the whole pool
- seller only: the whole pool
- both, different affiliates: 25 percent and 25 percent of the fee
- both, the same affiliate: the pool once

Delivery affiliate commission uses the 12 percent platform share of the delivery fee. The courier 88 percent is recorded as principal and is not the commission basis. An affiliate payout is a separate later transfer. Accrual is not a bank payout.

No synthetic affiliate order was paid, so attribution, ledger creation, and affiliate payout were not executed.

## Standalone Delivery

A commercial standalone request is separate from a community delivery request. The commercial path is quote, courier booking, checkout, then `fulfillStandaloneDeliveryPayment`. Statuses include `BOOKING_REQUESTED`, `AWAITING_PAYMENT`, `CHECKOUT`, and `PAID`. The paid webhook creates a delivery order in `PENDING`. Pickup and completion then use the delivery status machine: accepted to picked up to delivered. Settlement uses the standalone charge as `source_transaction`. There is no seller transfer on that path.

The quote calls Google Distance Matrix and now rejects a haversine result. With the current public IP outside the key allowlist, that quote fails closed. No standalone checkout was created.

The paid standalone cancellation test is skipped unless a charge id is supplied. It was not run against a new charge.

## Courier verification

Commercial delivery requires age 18 from `User.dateOfBirth` in the Europe/Amsterdam calendar. `DeliveryProfile.age` is not enough. The date of birth locks after the first confirmation. `isVerified` means the profile is complete, not that a government identity check occurred. Stripe Connect capabilities are a payout gate: `transfers` must be active and `payouts_enabled` must be true. `isBlocked` is the admin stop. Revoked or blocked couriers are rejected before accept and before payout. The status machine rejects pickup before acceptance and completion before pickup.

No government identity provider is implemented. Stripe test onboarding is not real identity verification. That remains a production-readiness gap. It was not bypassed.

## Production readiness

Production Delivery stays off. The local Stripe CLI listener is not production infrastructure. The webhook handler verifies `Stripe-Signature`, returns 400 for a bad signature, and returns 500 when seller settlement is incomplete so Stripe can retry. It does not keep a processed-event table. Monitoring and paging for webhook failure were not demonstrated. Rollback would be the existing production flag, which is already false.

Do not activate Delivery for customers until the Google server IP allowlist matches the server that calculates quotes, a real affiliate order and a real standalone order have been paid on the test account, and an explicit identity-verification decision is recorded.

## Focused tests

`npx tsx --test` on road distance, payout safety, revocation, marketplace affiliate pool, delivery affiliate pool, and attribution precedence: 44 passed, 0 failed.

Delivery age suite: passed. Standalone paid-cancellation test: skipped.

Typecheck was not run.

## Certification matrix

01 Repository preflight — PASS
02 Preview database isolation — PASS
03 Stripe TEST isolation — PASS
04 Google Maps isolation — PARTIAL
05 Production Delivery disabled — PASS
06 Stripe CLI connectivity — PASS
07 Genuine webhook transport — PARTIAL
08 Webhook signature verification — PASS
09 Real webhook replay — PARTIAL
10 Duplicate webhook safety — PASS
11 Concurrent webhook safety — PASS
12 Webhook failure recovery — PARTIAL
13 Affiliate business rules verified — PASS
14 Affiliate attribution — NOT_TESTED
15 Affiliate paid order — BLOCKED
16 Affiliate commission calculation — NOT_TESTED
17 Affiliate ledger entry — NOT_TESTED
18 Affiliate duplicate prevention — NOT_TESTED
19 Affiliate refund safety — NOT_TESTED
20 Affiliate payout status — NOT_TESTED
21 Standalone request creation — BLOCKED
22 Standalone road-distance quote — BLOCKED
23 Standalone checkout — BLOCKED
24 Standalone successful charge — BLOCKED
25 Standalone payment webhook — BLOCKED
26 Standalone courier matching — BLOCKED
27 Standalone courier acceptance — BLOCKED
28 Standalone pickup — BLOCKED
29 Standalone completion — BLOCKED
30 Standalone courier entitlement — BLOCKED
31 Standalone 88/12 calculation — BLOCKED
32 Standalone source_transaction — BLOCKED
33 Standalone real TEST transfer — BLOCKED
34 Standalone transfer idempotency — BLOCKED
35 Standalone ledger reconciliation — BLOCKED
36 Standalone Stripe fee reconciliation — BLOCKED
37 Standalone cancellation safety — NOT_TESTED
38 Courier age gate — PASS
39 Courier verification gate — PARTIAL
40 Courier Connect eligibility — PASS
41 Courier suspension safety — PASS
42 Courier revocation safety — PASS
43 Courier unauthorized action prevention — PASS
44 Production webhook configuration — PARTIAL
45 Production webhook retry safety — PARTIAL
46 Production financial idempotency — PARTIAL
47 Google road-distance failure safety — PASS
48 Marketplace regression safety — PASS
49 Historical financial preservation — PASS
50 Historical Delivery preservation — PASS
51 Production database untouched — PASS
52 Production Stripe untouched — PASS
53 Production Google Cloud untouched — PASS
54 No deployment — PASS
55 No push — PASS
56 No merge — PASS
57 No real-money operations — PASS
58 Functional production readiness — BLOCKED
59 Financial production readiness — BLOCKED
60 Operational production readiness — BLOCKED

TOTAL_PASS = 25
TOTAL_PARTIAL = 8
TOTAL_BLOCKED = 20
TOTAL_FAIL = 0
TOTAL_NOT_TESTED = 7

MARKETPLACE_PAID_LIFECYCLE = PASS (V2, unchanged)
AFFILIATE_PAID_LIFECYCLE = BLOCKED
STANDALONE_PAID_LIFECYCLE = BLOCKED
DELIVERY_PRODUCTION_READY = NO

No code defect was changed in this pass. The unpaid flows stopped before checkout because a reliable road distance could not be requested.
