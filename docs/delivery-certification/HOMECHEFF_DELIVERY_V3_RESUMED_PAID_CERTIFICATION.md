# HOMECHEFF_DELIVERY_V3_RESUME_GOOGLE_IP_AND_PAID_CERTIFICATION

Date: 2026-10-24
Repository: rassdread/homecheff-app
Branch: fix/delivery-financial-blockers
Base head: 79d5142984de3e427dc36dea1079408162d6b373

The V2 Marketplace order was not rebuilt. Two new Stripe TEST charges were created: one affiliate Marketplace delivery and one commercial Standalone delivery.

## Google test key

Project `homecheff-auth`. Dedicated key uid `44aedf7e-bd37-4e89-b714-388c7ff791d0`, display name "HomeCheff Delivery preview Distance Matrix".

The public IPv4 stayed `109.38.141.21` on two lookups before the change. The previous allowlist entry `92.254.124.70` was replaced. It was not kept, because it is no longer this machine.

After the update the key allows only `109.38.141.21` and only `distance-matrix-backend.googleapis.com`. No browser restriction was added. No other key was changed.

One direct Distance Matrix request, Rotterdam `51.9225,4.47917` to Delft `52.0116,4.3571`:

| Field | Value |
|---|---|
| HTTP | 200 |
| status | OK |
| element | OK |
| distance | 16094 m (16.1 km) |
| duration | 1437 s (24 min) |
| elements | 1 |

Later application quotes for the same coordinates returned 16.1 km through the road-distance gate. One courier-to-pickup ETA log fell back to haversine after a same-point response. That call does not set the price. Both paid fees stayed at the locked 955 cents.

## Affiliate Marketplace order

Attribution used the real register path. The buyer cookie was `hc_ref`. Signup created attribution `aa28242d-0669-482e-aba4-d13b8f57ef76`, type `USER_SIGNUP`, source `REF_LINK`, affiliate `ce13cf21-c373-4266-9793-f145bca0b50c`. The buyer is not the affiliate.

The existing synthetic seller and courier were reused. Their Connect accounts were not replaced. A new password was set on those two preview users because the earlier local password file was gone. The V2 order and its transfers were not edited.

| Record | Value |
|---|---|
| Order | 62f336cb-93e8-4234-a15d-bb2b7b13588e |
| Buyer | fa28b522-baac-48e1-a0d9-4a21dd0e6232 |
| Delivery order | cmvmmfydk00052jedrhvc57tl |
| Checkout | cs_test_b1M6CeCxMsNMuNBD1zkqfEXiMhXx1ugGCDGPQIxSDrWYkzPGgUmz4lc7Px |
| PaymentIntent | pi_3UU7vzRpYdPVF6LP0byq0zXL |
| Charge | ch_3UU7vzRpYdPVF6LP0DQgM7yZ |
| Event | evt_1UU7w1RpYdPVF6LPi5UgXyOj |
| Distance | 16.1 km |
| Delivery fee | 955 cents |
| Gross | 1502 cents, eur, livemode false, succeeded, refunded 0 |

Courier share is `round(955 * 0.88) = 840`. Platform delivery share is `round(955 * 0.12) = 115`. Product price is 500. Marketplace fee is 60 (1200 bps). Seller net is 440. Buyer surcharge is 47.

Affiliate pool is 50 percent of the platform fee, not of the courier share.

| Ledger | Basis | Amount | Status |
|---|---|---|---|
| f6dc33b1-f015-4208-b6fc-fe11b1a7f40f | 60 cent product fee | 30 | PENDING |
| 27d42816-419d-468d-9f54-7ba00616121e | 115 cent delivery platform share | 57 | PENDING |

`floor(115 * 50 / 100) = 57`. No affiliate Stripe transfer was created.

Seller transfer `tr_3UU7vzRpYdPVF6LP05JogJtc` is 440 cents to `acct_1UTucr2L2fozBQ8p`, source transaction the charge above. Courier transfer `tr_3UU7vzRpYdPVF6LP0keVOpX1` is 840 cents to `acct_1UTubCRr8meL3ugc`, same source transaction. A second `ensureDeliveryPayout` returned `ALREADY_DONE` for that same transfer.

Stripe balance transaction `txn_3UU7vzRpYdPVF6LP0ncKVZA5` is fee 72, net 1430, status pending. Transfers out are 1280. Remainder after the pending fee is 150. Accrued affiliate liability inside that remainder is 87. This is not a bank payout and the fee is not final.

The delivery lifecycle used the courier session: pickup before acceptance was rejected, a buyer accept was rejected, completion before pickup was rejected, then acceptance, pickup, and completion succeeded. A second completion was rejected.

The genuine event was signed again locally and posted only to `127.0.0.1:3010/api/stripe/webhook`. HTTP 200. Orders stayed 2, delivery orders 3, payouts 5, commission rows 4. Courier and seller transfer counts stayed 2 each. This replay was not a second delivery from Stripe.

## Standalone delivery

Request `a54a0e88-d45f-4855-af5d-69bad86b060d`, marker `DELIVERY_V3_STANDALONE_CERT`. Same Rotterdam to Delft route, 16.1 km, fee 955. Checkout was refused until the courier accepted the booking. After acceptance the session was `cs_test_b1C9npV5Fl7u5TNLTzpInY7qxuFJzFBD3kSmR8uujEWtV6fh2JOSzM4nMs`.

| Record | Value |
|---|---|
| PaymentIntent | pi_3UU82JRpYdPVF6LP146YgUzF |
| Charge | ch_3UU82JRpYdPVF6LP1vWgILsm |
| Gross | 994 cents, eur, succeeded, livemode false, refunded 0 |
| Delivery order | cmvmmo6ba000b2jed9lf40b82 |
| Marketplace order | none |

Buyer surcharge is 39. Courier transfer `tr_3UU82JRpYdPVF6LP1SCx9Q53` is 840 cents to the same courier account, source transaction this charge. Platform share is 115. No seller transfer was created for this charge. A second payout call returned `ALREADY_DONE`.

The buyer is the attributed affiliate buyer, so the existing delivery rule accrued ledger `6a0edd3f-39ad-4d72-bdaa-b3c2aa140cb4` for 57 cents, status PENDING. That is not an affiliate payout.

Stripe balance transaction `txn_3UU82JRpYdPVF6LP1saTnPlJ` is fee 56, net 938, status pending. After the courier transfer and the pending fee, 98 cents remain on the platform side of this charge. The 57 cent affiliate accrual is still unpaid inside that remainder.

Pickup before acceptance and completion before pickup were rejected. Acceptance, pickup, and completion succeeded. The request status is `COMPLETED` and payment status is `PAID`. A second completion was rejected.

## Historical records

| Transfer | Amount | Reversed |
|---|---|---|
| tr_3UTufXRpYdPVF6LP1v5zMvXd | 840 | no |
| tr_3UTufXRpYdPVF6LP1FGeGbEd | 440 | no |
| tr_3UTNroRpYdPVF6LP08CZ24LX | 880 | no |

V2 order `ece80bec-f1f6-434f-b461-0ad3eac1493c` is still `DELIVERED`.

## Production readiness

Both paid test lifecycles completed on the preview database and the Stripe TEST account. Production Delivery on https://homecheff.eu remains disabled. That is not production activation.

| Area | Status | Why it is not activation |
|---|---|---|
| Marketplace and Standalone payment | PASS in TEST | Live mode was not used |
| Connect transfers | PASS in TEST | `source_transaction` was the original charge |
| Affiliate accounting | PASS as accrual | No affiliate bank payout was made |
| Webhook idempotency | PASS for these events | There is still no stored event-id table |
| Courier identity | PARTIAL | Age is a declared date of birth. `isVerified` is profile completion. No government identity check |
| Google | PARTIAL | The test key follows this machine's current IP. A production server needs its own restricted key |
| Operations | BLOCKED | Failure paging and a production webhook endpoint were not demonstrated |

Do not enable Delivery for customers from this result.

## Tests

Focused unit tests: 47 passed, 0 failed. Typecheck was not run. A full project typecheck is too large for this machine and was not used as evidence.

## Certification matrix

01 Repository preflight — PASS
02 Preview database isolation — PASS
03 Stripe TEST isolation — PASS
04 Google Cloud project verified — PASS
05 Dedicated Google key verified — PASS
06 Current public IP verified — PASS
07 Google IP restriction updated — PASS
08 Google API restriction preserved — PASS
09 Real Google road distance — PASS
10 Local Delivery server healthy — PASS
11 Stripe CLI listener healthy — PASS
12 Genuine Stripe webhook transport — PASS
13 Affiliate business rules — PASS
14 Affiliate attribution — PASS
15 Affiliate paid checkout — PASS
16 Affiliate original charge — PASS
17 Affiliate payment webhook — PASS
18 Affiliate Delivery order — PASS
19 Affiliate courier matching — PASS
20 Affiliate courier acceptance — PASS
21 Affiliate pickup — PASS
22 Affiliate completion — PASS
23 Affiliate seller settlement — PASS
24 Affiliate courier settlement — PASS
25 Affiliate commission calculation — PASS
26 Affiliate ledger entry — PASS
27 Affiliate idempotency — PASS
28 Affiliate webhook replay — PARTIAL
29 No duplicate affiliate effects — PASS
30 Standalone request — PASS
31 Standalone road-distance quote — PASS
32 Standalone checkout — PASS
33 Standalone successful charge — PASS
34 Standalone payment webhook — PASS
35 Standalone courier matching — PASS
36 Standalone courier acceptance — PASS
37 Standalone pickup — PASS
38 Standalone completion — PASS
39 Standalone courier entitlement — PASS
40 Standalone 88/12 calculation — PASS
41 Standalone source_transaction — PASS
42 Standalone real TEST transfer — PASS
43 Standalone transfer idempotency — PASS
44 Standalone ledger reconciliation — PASS
45 Stripe fee reconciliation — PARTIAL
46 Historical transfer preservation — PASS
47 Historical order preservation — PASS
48 Courier authorization — PASS
49 Courier verification assessment — PARTIAL
50 Production webhook assessment — PARTIAL
51 Production Google Maps assessment — PARTIAL
52 Production payment assessment — PARTIAL
53 Production operational assessment — BLOCKED
54 Production Delivery disabled — PASS
55 No production database changes — PASS
56 No production Stripe changes — PASS
57 No production Google key changes — PASS
58 No deployment — PASS
59 No push — PASS
60 No merge — PASS
61 No real-money transactions — PASS
62 Complete affiliate paid lifecycle — PASS
63 Complete Standalone paid lifecycle — PASS

TOTAL_PASS = 56
TOTAL_PARTIAL = 6
TOTAL_BLOCKED = 1
TOTAL_FAIL = 0
TOTAL_NOT_TESTED = 0

MARKETPLACE_PAID_LIFECYCLE = PASS
AFFILIATE_PAID_LIFECYCLE = PASS
STANDALONE_PAID_LIFECYCLE = PASS
DELIVERY_PRODUCTION_READY = NO
