# Universal HC × Full Delivery Payment Certification

**Date:** 2026-09-04  
**Policy:** Eligible personal HC may fund the **complete** Marketplace checkout including **full delivery gross** (provider principal + HomeCheff fee). Payment method is neutral for 12/88 split and affiliate base.

## Rules

| Rule | Value |
| --- | --- |
| HC pays complete delivery gross | YES |
| Provider settlement | EUR 88% of locked delivery gross |
| HomeCheff fee | 12% of locked delivery gross |
| Affiliate base | HomeCheff fee only |
| HC debit affiliate | NO |
| Provider principal affiliate | NO |
| Events per delivery fee | 1 |
| Company driver second settlement/affiliate | NO |

## €7.50 worked example

| Field | Amount |
| --- | --- |
| CUSTOMER_HC_SPEND (full HC) | 750 HC |
| CUSTOMER_STRIPE_SPEND (full HC) | €0 |
| PROVIDER_PRINCIPAL | €6.60 |
| HOMECHEFF_DELIVERY_FEE | €0.90 |
| AFFILIATE_BASE | €0.90 |
| DIRECT_AFFILIATE | €0.45 |
| PARTNER / MAIN (MAIN10_SUB40) | €0.36 / €0.09 |
| PROVIDER_SETTLEMENT | €6.60 |

Mixed (500 HC + €2.50 Stripe) keeps the same economic split.

## Implementation

- `lib/hc/marketplace-hc-delivery.ts` — split, DeliveryOrder attach, affiliate accrual
- HC_ONLY + MIXED reserve use **seller GMV = products only** for fee snapshot
- Checkout passes `deliveryFeeCents` into HC_ONLY
- Provider EUR payout remains on DELIVERED via `ensureDeliveryPayout`

## Decision

`HOMECHEFF_HC_FULL_DELIVERY_CIRCULAR_PAYMENT_PRODUCTION_CERTIFIED`
