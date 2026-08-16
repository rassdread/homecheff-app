# Multi-recipient payment settlement certification

**Date:** 2026-08-16  
**Baseline SHA:** `74b52b151829152e024b1b55c61d36ac67ecb01c`  
**Engines preserved:** source_transaction seller settlement, refund-settlement, recipient-reversal, dispute-settlement

## Absolute safety

This certification phase performed **no** live buyer charges, transfers, refunds, reversals, or disputes.

## Canonical waterfall (actual code)

```
BUYER_GROSS = Σ(sellerConsideration) + deliveryGross + smsFees + buyerSurcharge
buyerSurcharge = ceil((subtotal + 25) / (1 - 0.014)) - subtotal   // lib/fees.ts

SELLER_CONSIDERATION = sellerNet + platformFee
platformFee = round(gross × feePercent / 100)   // plan: 12/9/7/5 via visibility-profile
sellerNet → Stripe Transfer (source_transaction = Charge) to seller Connect

AFFILIATE = round(platformFee × pct)  // FROM platform fee — does NOT reduce sellerNet twice
        → CommissionLedger; Connect batch payout later (no source_transaction)

COURIER = deliveryGross − round(deliveryGross × 12%)  // ledger-only Payout today
```

Rounding SSOT: surcharge **ceil**; fees/affiliate/delivery **round**; reversals **floor** cumulative.

## Money ownership

See `MONEY_OWNERSHIP_MATRIX` in `lib/payments/payment-waterfall.ts`.

| Leg | Stripe destination | Reversible |
|---|---|---|
| Seller net | Seller Connect `tr_` + source_transaction | Yes |
| Platform fee | Platform retained | N/A |
| Affiliate | Ledger → batch Connect | Ledger; Connect clawback gap if already paid |
| Courier | **Ledger only** (`providerRef` null) | Only if future `tr_` |
| Buyer surcharge | Platform Charge | FULL refund policy / Terms POLICY_REQUIRED |
| Stripe fee | Stripe (once per Charge) | Not returned |

## Multi-seller

- One Charge, N OrderItems → N Transactions/Payouts/Transfers
- Destination: `Product.seller.User.stripeConnectAccountId` per item
- Idempotency: `hc_seller_xfer_{order}_{product}_stx_{charge}`
- Charge capacity pre-check: `assertSourceChargeAllocationCapacity` in `settleAllSellerLegsForOrder`
- Destination snapshotted on Payout: `destinationConnectAccountId`

## Affiliate

- Funded from HomeCheff platform fee (not seller net)
- Cap enforced: commission ≤ platform fee (`affiliate-config` + waterfall asserts)
- Without Connect: ledger persists unpaid
- Refund/dispute: ledger proportional; Connect clawback if already paid = remaining P1

## Courier

- Buyer delivery fee ≠ courier entitlement (12% platform delivery cut)
- Without Connect / no Transfer: entitlement ledger; **POLICY_REQUIRED** for Stripe clawback
- Not marked paid merely because Order paid

## Proven live (prior phases)

| Path | Status |
|---|---|
| Single seller + source_transaction | LIVE PROVEN |
| Full refund + seller reversal | LIVE PROVEN |
| Dispute recovery engine | PRODUCTION READY (no live dispute) |
| Historical €1.27 additional dispute capacity | 0 (dry-run) |

## Automated fixtures

`scripts/validate-multi-recipient-settlement.ts` — single/multi seller, affiliate, courier, capacity, refund/dispute cumulative, odd cents.

## Live test gates (NOT executed)

| Path | Required? | Why |
|---|---|---|
| MULTI_SELLER | **YES** (optional) | Never proven live with two Connect destinations on one Charge |
| AFFILIATE | **NO** for ledger accrual; **YES** optional for Connect batch payout path | Accrual/cap proven in code; batch transfer lacks source_transaction |
| COURIER | **NO** for current architecture | Ledger-only by design today — live Transfer test only if product adds courier Stripe transfers |

## Remaining P1 (not P0 for seller/refund/dispute core)

- Affiliate already-PAID Connect clawback
- Courier Stripe Transfer (if product requires)
- Escrow release without source_transaction
- Terms surcharge refund POLICY_REQUIRED
- Seller repayment after dispute win POLICY_REQUIRED

## Admin

`GET /api/admin/orders/[orderId]/waterfall` — buyer paid, per-seller legs, affiliate, courier, refunds, disputes, unsettled.
