# Controlled Production Delivery Financial E2E

**Date:** 2026-09-04  
**Production SHA (code):** `13c8a576aa1e2f8e3611aa49e78c15fccb523dcb`  
**Production deployment:** `6272199577`

## Actors

| Role | Account |
| --- | --- |
| Buyer | Steve (`c54bbbcf…`) |
| Delivery provider / Connect | r.sergio (`7647bf21…` → `acct_1Sj…`) |

## Stripe-only controlled proof (PASS)

| Field | Value |
| --- | --- |
| STRIPE_ONLY_PAYMENT_INTENT | `pi_3UC3e52KvmKfeN9t1pEGYwrL` |
| STRIPE_ONLY_CUSTOMER_GROSS | 1243 (€4.50 + €7.50 + €0.43 surcharge) |
| STRIPE_ONLY_ORDER_ID | `6b4b32cc-1fb6-4bbc-b5c1-d1862a245e09` |
| STRIPE_ONLY_DELIVERY_ORDER_ID | `cmtneowsx00012jozpa3f1l1w` |
| STRIPE_ONLY_DELIVERY_GROSS | 750 |
| STRIPE_ONLY_PROVIDER_PRINCIPAL | 660 |
| STRIPE_ONLY_HOMECHEFF_FEE | 90 |
| STRIPE_ONLY_DELIVERY_COMPLETED | YES |
| STRIPE_ONLY_PAYOUT_CREATED | YES (`payout_delivery_*`) |
| STRIPE_ONLY_TRANSFER_ID | `tr_1UC3ik2KvmKfeN9tcirfJaNm` |
| STRIPE_ONLY_RSERGIO_CONNECTED_ACCOUNT_CREDITED | YES (Stripe Connect balance; bank async) |
| PAYOUT_TRIGGER | DELIVERED |
| MANUAL_ADMIN_PAYOUT_REQUIRED | NO |

## Visibility

| Gate | Value |
| --- | --- |
| CERT_PROVIDER_PUBLIC_TO_NORMAL_USERS | NO |
| CERT_PROVIDER_VISIBLE_TO_STEVE | YES |
| PUBLIC_FAKE_DELIVERY_SUPPLY_AFTER | NO |
| CERT_TEST_LISTING_PUBLIC_AFTER | NO |
| CERT_TEST_REVIEW_CREATED | NO |

## Not executed in this run

| Gate | Reason |
| --- | --- |
| HC_TEST_TYPE | NOT_EXECUTED — Steve Growth `HcWallet` availableHc = 0; no fake PAID_BACKED grant |
| REFUND_TEST_EXECUTED | NO — preserved successful payout proof; refund fixture-certified earlier |
| DELIVERY_AFFILIATE_TEST_EXECUTED | NO — no manufactured referral |
| POST_PAYOUT_REFUND_LIVE_TESTED | NO — fixture-certified (transfer reversal / ledger clawback) |

## Architecture shipped for this E2E

- Private cert allowlist (`lib/delivery/delivery-cert-scope.ts`)
- Activate sets `isVerified` for self-service matching
- `ensureDeliveryPayout` creates Stripe Connect transfer when Connect ready
- Named-provider checkout skips public pool availability gate

## Decision

`HOMECHEFF_DELIVERY_CONTROLLED_PRODUCTION_FINANCIAL_E2E_PARTIAL_WITH_BLOCKERS`

**Blockers for full closeout:** HC/mixed live funding (Steve HC=0), live refund of a separate cert order, affiliate live attribution.

**Proven:** real Stripe customer payment → locked 12/88 → DELIVERED → automatic Connect transfer €6.60 to r.sergio.

`REAL_EXTERNAL_PROVIDER_E2E_CERTIFIED = NO`  
`FIRST_REAL_RECRUITED_PROVIDER_E2E_CERTIFIED = NO`
