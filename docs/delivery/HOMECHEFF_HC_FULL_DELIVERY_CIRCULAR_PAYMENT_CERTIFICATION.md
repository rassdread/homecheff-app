# Universal HC × Full Delivery Circular Payment — Certification

**Date:** 2026-09-04  
**Scope:** Full delivery gross payable with eligible HC + full economic refund closeout.

## Payment (live)

| Gate | Value |
| --- | --- |
| HC_CAN_PAY_COMPLETE_DELIVERY_GROSS | YES |
| HC_DELIVERY_PAYMENT_SOURCE_NEUTRAL | YES |
| PROVIDER_SETTLEMENT_EUR_88 | YES (`ensureDeliveryPayout` on DELIVERED) |
| HOMECHEFF_FEE_12 | YES |
| AFFILIATE_ON_FEE_ONLY | YES |
| AFFILIATE_EVENT_COUNT_PER_DELIVERY_FEE | 1 |
| COMPANY_DRIVER_SEPARATE_SETTLEMENT | NO |

## Refund architecture audit

| Field | Value |
| --- | --- |
| CURRENT_HC_REFUND_ENTRYPOINT | `app/api/admin/orders/[orderId]/hc-full-refund/route.ts` |
| CURRENT_DELIVERY_REFUND_ENTRYPOINT | `lib/hc/marketplace-hc-delivery-refund.ts` (wired into HC full refund) |
| CURRENT_PROVIDER_LIABILITY_MODEL | Locked `quotedFeeCents` → 88% principal on `txn_delivery_*` / `payout_delivery_*` |
| CURRENT_PROVIDER_PAYOUT_MODEL | `ensureDeliveryPayout` (ledger; Stripe transfer only if `providerRef` present) |
| CURRENT_AFFILIATE_REVERSAL_MODEL | `processCommissionReversal` ACCRUAL → REVERSAL rows; original ledger amounts |
| CURRENT_HC_PROVENANCE_RESTORE_MODEL | Growth `growthRefundMarketplaceHc` / origin-aware lots |
| CURRENT_STRIPE_REFUND_MODEL | Mixed: PaymentIntent refund idempotency key `marketplace:hc:stripe-refund:{orderId}:v1` |
| CURRENT_DELIVERY_ECONOMIC_SNAPSHOT | `DeliveryOrder.quotedFeeCents` (+ notes `hcDeliveryRefund` marker) |
| DELIVERY_ONLY_REFUND_SUPPORTED | NO (full order HC refund only; no new partial product) |
| POST_PAYOUT_REFUND_RECOVERY_MODEL | Stripe transfer reversal when `providerRef` is a live transfer; else **LEDGER_CLAWBACK** on DeliveryProfile earnings + Transaction `REFUNDED` |

## Refund closeout

| Gate | Value |
| --- | --- |
| HC_DELIVERY_REFUND_COMPLETE | YES |
| CUSTOMER_HC_PROVENANCE_RESTORED | YES (existing Growth refund path) |
| MIXED_HC_STRIPE_REFUND_COMPLETE | YES |
| PROVIDER_PRINCIPAL_REVERSED | YES |
| PROVIDER_POST_PAYOUT_RECOVERY_SUPPORTED | YES (transfer reversal **or** ledger clawback) |
| HOMECHEFF_DELIVERY_FEE_REVERSED | YES (via full delivery economic reverse + affiliate base) |
| DELIVERY_AFFILIATE_REVERSED | YES |
| AFFILIATE_REFUND_USES_ORIGINAL_SNAPSHOT | YES |
| COMPANY_DRIVER_SEPARATE_REVERSAL | NO |
| TREASURY_RECONCILIATION | PASS |

### Idempotency

| Gate | Value |
| --- | --- |
| HC_REFUND_IDEMPOTENT | YES (`full-{orderId}`) |
| STRIPE_REFUND_IDEMPOTENT | YES |
| PROVIDER_REVERSAL_IDEMPOTENT | YES (txn REFUNDED + refund row / marker COMPLETE) |
| AFFILIATE_REVERSAL_IDEMPOTENT | YES (`hc_full_refund_{orderId}_{ledgerId}`) |
| RETRY_AFTER_PARTIAL_FAILURE_SAFE | YES (ALREADY_REFUNDED retries delivery reverse) |

### €7.50 full HC refund

| Field | Value |
| --- | --- |
| ORIGINAL_HC_SPEND | 750 |
| HC_RESTORED | 750 |
| ORIGINAL_PROVIDER_PRINCIPAL | 660 |
| PROVIDER_PRINCIPAL_REVERSED | 660 |
| ORIGINAL_HOMECHEFF_FEE | 90 |
| HOMECHEFF_FEE_REVERSED | 90 |
| ORIGINAL_AFFILIATE (direct) | 45 |
| AFFILIATE_REVERSED | 45 |
| NET_OUTSTANDING_PROVIDER_LIABILITY | 0 |
| NET_OUTSTANDING_AFFILIATE_LIABILITY | 0 |

## Implementation

- `lib/hc/marketplace-hc-delivery-refund-pure.ts` — snapshot economics + notes marker
- `lib/hc/marketplace-hc-delivery-refund.ts` — provider + affiliate reverse orchestration
- `lib/delivery/delivery-payout.ts` — blocks payout after refund marker / CANCELLED
- Admin HC full refund route — orchestrates seller, delivery, Stripe, HC restore

## Decision

`HOMECHEFF_HC_FULL_DELIVERY_CIRCULAR_PAYMENT_PRODUCTION_CERTIFIED`
