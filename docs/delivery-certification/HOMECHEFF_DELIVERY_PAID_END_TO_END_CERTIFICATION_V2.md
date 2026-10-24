# HOMECHEFF_DELIVERY_PAID_END_TO_END_CERTIFICATION_V2

Date: 2026-10-24
Repository: rassdread/homecheff-app
Branch: fix/delivery-financial-blockers
Base head: 2e49dac2356a545dee021374b8555e00b9c264fc
Environment: local Next.js on 127.0.0.1:3010, preview Neon, Stripe TEST account acct_1S6D3DRpYdPVF6LP
Marker: DELIVERY_E2E_CERT_V2

No production database, live Stripe key, production Google key, deploy, push, or merge was used.

## Isolation

| Check | Result |
|---|---|
| Preview database host | ep-green-wind-a2cspmqw-pooler.eu-central-1.aws.neon.tech |
| Direct host | ep-green-wind-a2cspmqw.eu-central-1.aws.neon.tech |
| Database name | neondb |
| Production host present | no |
| Stripe account | acct_1S6D3DRpYdPVF6LP |
| Stripe secret prefix | sk_test |
| Balance livemode | false |
| Public IP | 92.254.124.70, matching the restricted Distance Matrix key |
| Local delivery flag | true |
| Production https://homecheff.eu delivery flag | false |

Baseline before synthetic writes: 15 users, 11 delivery profiles (all `distanceSemanticsVersion` null), 1 delivery order, 0 marketplace orders, 1 payout, 1 transaction.

After the test: 18 users, 12 profiles, 2 delivery orders, 1 marketplace order, 3 payouts. The original 11 profiles are still null. Historical delivery order `cmvi3fz3300012j4fhrtq2p2x` was not modified. Historical payout `payout_delivery_cmvi3fz3300012j4fhrtq2p2x` is still 880 cents with `providerRef` null. Historical transfer `tr_3UTNroRpYdPVF6LP08CZ24LX` is still 880 cents, not reversed, livemode false.

## Commercial road-distance guard

`getRouteDistance` still returns a labeled haversine result when Google is missing, times out, or returns an unusable payload. That result now has `distanceSource: "haversine"`. A payable quote requires `distanceSource: "google"` and a positive finite distance and duration.

Marketplace checkout, the delivery-fee quote, standalone quotes, booking quotes, and financially relevant courier matching refuse a haversine result. The customer message is:

- Dutch: De bezorgafstand kan momenteel niet betrouwbaar worden berekend. Probeer het later opnieuw.
- English: The delivery distance cannot currently be calculated reliably. Please try again later.

Code: `DELIVERY_ROUTE_UNRELIABLE`.

Focused mocked tests in `lib/delivery/commercial-road-distance.test.ts` cover Google success, timeout, HTTP 500, API error, ZERO_RESULTS, a zero-distance payload, a missing key, and the rule that haversine cannot price a delivery. Those tests do not call Google. Result: 4/4, together with the existing payout safety file, 10/10.

## Synthetic participants

| Role | Id | Email domain |
|---|---|---|
| Buyer | 26635be2-44ca-4c08-98dd-bf9a293a2575 | example.com |
| Seller user | 5a6ec613-ce98-4df9-a171-3312eb2cb2e4 | example.com |
| Seller profile | f01dc2f5-f1a0-4da3-8373-0654266d577f | |
| Listing | 1579b5a2-45d0-4cde-8396-a63aba49c81f | DESIGNER, 500 cents |
| Courier user | eed1c8dc-b524-4baa-bc70-62ee7d73df4e | example.com |
| Courier profile | cmvlrvoyd00012jzm871i7ezq | version 1, CAR, radius 50 km |

Courier date of birth is 1990-01-01. `isVerified` was set as the existing profile-completion flag. No government identity check was performed. The courier accepted the current delivery agreement through `POST /api/delivery/agreement/accept`.

## Connect accounts

Both accounts are new custom TEST accounts on acct_1S6D3DRpYdPVF6LP. Neither is the historical `acct_1US` account. Test onboarding used Stripe test address and test id tokens, not real identity documents.

| Role | Account | transfers | payouts_enabled |
|---|---|---|---|
| Courier | acct_1UTubCRr8meL3ugc | active | true |
| Seller | acct_1UTucr2L2fozBQ8p | active | true |

The seller account was required by the existing checkout gate `PAYMENTS_NOT_READY`. Without it the Marketplace checkout route refuses to create a session. No bank payout was created.

## Quote and order

Route: Coolsingel 40, Rotterdam (51.9225, 4.47917) to Nieuwstraat 38, Delft (52.0116, 4.3571).

The booking route calculated the fee. It was not hardcoded.

| Field | Value |
|---|---|
| Distance source | Google road distance |
| Distance | 16.1 km |
| Locked fee | 955 cents |
| Courier rate card | base 150, per km 50, minimum 200 |
| Booking | cmvlrxokg00032jpkxn8fuc7t |
| Booking status | ACCEPTED through `POST /api/delivery/booking-requests/{id}/accept` |

Checkout `POST /api/checkout` created session `cs_test_b1K6r0i5uIrq9oKOlmYCeZ77NZfNz2MsPPCsxqhXlLGaKev9CeCHMcwDCJ` for 1502 cents. The hosted Checkout Session did not expose a PaymentIntent until confirmation. The same session was confirmed with Stripe test token `tok_visa`. No real card was used.

| Object | Id | State |
|---|---|---|
| Checkout Session | cs_test_b1K6r0i5uIrq9oKOlmYCeZ77NZfNz2MsPPCsxqhXlLGaKev9CeCHMcwDCJ | complete / paid |
| PaymentIntent | pi_3UTufXRpYdPVF6LP1rIMSGJ3 | succeeded, 1502 eur, livemode false |
| Charge | ch_3UTufXRpYdPVF6LP1sozRYAV | succeeded, 1502 eur, livemode false, amount_refunded 0 |
| Marketplace order | ece80bec-f1f6-434f-b461-0ad3eac1493c | buyer 26635be2-44ca-4c08-98dd-bf9a293a2575 |
| Delivery order | cmvls2zc000072jpk5tery1hq | profile cmvlrvoyd00012jzm871i7ezq, fee 955, 16.1 km, PROVIDER |

Webhook event `evt_1UTufYRpYdPVF6LPaWj29q0E` (`checkout.session.completed`, livemode false) reached `POST /api/stripe/webhook` and returned 200. The local server log records that event id, the session id, and creation of order `ece80bec-f1f6-434f-b461-0ad3eac1493c`. One order was created.

## Delivery lifecycle

| Step | Route | Result |
|---|---|---|
| Courier accept | POST /api/delivery/orders/cmvls2zc000072jpk5tery1hq/accept | 200, status ACCEPTED |
| Pickup | POST /api/delivery/orders/cmvls2zc000072jpk5tery1hq/update-status | 200, PICKED_UP at 2026-10-24T02:28:51.816Z |
| Completion | same update-status route | 200, DELIVERED at 2026-10-24T02:28:54.837Z |

Status was not written with SQL.

## Settlement

Charge 1502 cents:

| Component | Cents | Evidence |
|---|---|---|
| Product | 500 | listing price |
| Delivery fee | 955 | locked quote |
| Buyer Stripe surcharge | 47 | 1502 - 500 - 955 |
| Stripe processing fee | 72, pending | balance transaction txn_3UTufXRpYdPVF6LP1hheQ5vd, net 1430, status pending |
| Seller gross | 500 | transfer metadata |
| Marketplace fee | 60 (1200 bps) | transfer metadata |
| Seller transfer | 440 | tr_3UTufXRpYdPVF6LP1FGeGbEd |
| Courier share | 840 | round(955 * 0.88) |
| Platform delivery share | 115 | round(955 * 0.12) |
| Courier transfer | 840 | tr_3UTufXRpYdPVF6LP1v5zMvXd |

Seller destination `acct_1UTucr2L2fozBQ8p`. Courier destination `acct_1UTubCRr8meL3ugc`. Both transfers use `source_transaction` `ch_3UTufXRpYdPVF6LP1sozRYAV`. Neither transfer is reversed. Livemode is false. No bank payout was created.

840 + 115 = 955. 440 + 60 = 500. Transfers out are 440 + 840 = 1280. Charge net after the pending Stripe fee is 1430. Platform remainder after both transfers is 150 cents. Platform entitlement before the Stripe-fee gap is 60 + 115 = 175. The 25 cent difference is the pending Stripe fee (72) minus the 47 cent buyer surcharge. The Stripe fee is not final until the balance transaction leaves `pending`.

A second call to `ensureDeliveryPayout` for the same delivery order returned `ALREADY_DONE` and transfer `tr_3UTufXRpYdPVF6LP1v5zMvXd`. Payout rows with that provider ref stayed at 1. Stripe lists one transfer to the courier account.

No affiliate was attached to the order. The product attribution path logged no attribution. A later delivery-platform affiliate import threw a Turbopack hot-reload error and did not write a commission. Actual affiliate settlement is not tested.

The same checkout event was not resent. The test account has an enabled webhook endpoint on a Vercel preview host. Resending the event would deliver it there, outside this local listener. Replay safety is therefore partial: the original event created one order, and the settlement function is idempotent, but the same event was not replayed.

Missing-charge, wrong-order charge, and fully refunded charge rejection are covered by `lib/delivery/delivery-financial-blockers.test.ts` (`marketplace payouts require the original charge and never use the platform balance`). No second paid charge was created for those cases.

## Certification matrix

01 Repository preflight — PASS
02 Preview database isolation — PASS
03 Stripe TEST account isolation — PASS
04 Google road-distance availability — PASS
05 Commercial haversine fallback safety — PASS
06 Synthetic buyer — PASS
07 Synthetic seller — PASS
08 Synthetic courier — PASS
09 New TEST Connect account — PASS
10 Courier eligibility — PASS
11 Courier verification — PARTIAL (profile-completion flag and Stripe test onboarding; no government identity check)
12 Marketplace listing — PASS
13 Marketplace order — PASS
14 Delivery quote — PASS
15 Real Stripe TEST checkout — PASS
16 PaymentIntent succeeded — PASS
17 Original charge verified — PASS
18 Genuine payment webhook — PASS
19 Webhook signature verification — PASS
20 Marketplace payment linkage — PASS
21 Delivery order creation — PASS
22 Courier matching — PASS (named-provider booking eligibility, 16.1 km road distance)
23 Courier acceptance — PASS
24 Pickup — PASS
25 Completion — PASS
26 Courier entitlement — PASS
27 Courier 88% calculation — PASS
28 Platform 12% calculation — PASS
29 Stripe source_transaction — PASS
30 Real TEST courier transfer — PASS
31 Seller entitlement — PASS
32 Seller settlement — PASS
33 Affiliate attribution — NOT_TESTED
34 Affiliate accounting — NOT_TESTED
35 Financial ledger reconciliation — PASS
36 Stripe fee reconciliation — PASS (72 cents, balance transaction pending)
37 Transfer idempotency — PASS
38 Webhook replay safety — PARTIAL
39 Missing-charge rejection — PASS (focused test, no second charge)
40 Wrong-charge rejection — PASS (focused test, no second charge)
41 Refunded-charge rejection — PASS (focused test, no refund of this charge)
42 Historical record preservation — PASS
43 Historical transfer preservation — PASS
44 Production Delivery disabled — PASS
45 No production changes — PASS
46 No deployment — PASS
47 No real-money operations — PASS
48 Complete paid lifecycle — PASS

TOTAL_PASS = 44
TOTAL_PARTIAL = 2
TOTAL_BLOCKED = 0
TOTAL_FAIL = 0
TOTAL_NOT_TESTED = 2

FINAL_STATUS = PASS

The paid Marketplace delivery lifecycle, original charge, courier transfer, and seller transfer were executed on the approved Stripe TEST account. Affiliate settlement was not part of this order. The same webhook event was not replayed.
