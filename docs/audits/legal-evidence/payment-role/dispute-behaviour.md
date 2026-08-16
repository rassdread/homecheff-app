# Dispute / chargeback behaviour

## Code-proven (after P0 dispute recovery)

| Item | Result |
|---|---|
| Webhook dispute events | created / updated / closed / funds_withdrawn / funds_reinstated |
| Primary financial owner | `lib/payments/dispute-settlement.ts` |
| Shared reversal | `lib/payments/recipient-reversal.ts` |
| Seller transfer clawback | **IMPLEMENTED** (idempotent, cumulative with refunds) |
| Affiliate | ledger `CHARGEBACK` via `processCommissionReversal` |
| Courier | capacity reserved; POLICY_REQUIRED for performed delivery |
| Admin Stripe desk | `/api/admin/disputes/stripe` + preview |
| Evidence auto-upload | **disabled** |

## Legacy exposure

Affiliate-only handling → **P0_EXPOSURE = YES** (pre-fix).

## Legal

`CHARGEBACK_ECONOMIC_ALLOCATION = COUNSEL_REQUIRED` (recovery trigger / win repayment)  
Do **not** create a real chargeback without owner approval.
