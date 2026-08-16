# Refund behaviour (code + pending fixtures)

## Code-proven

| Scenario | Status | Notes |
|---|---|---|
| Admin refund PI | `IMPLEMENTED` via `lib/payments/refund-settlement.ts` | preview + execute; no silent PI-only |
| Partial amount | `IMPLEMENTED` | cumulative proportional transfer reversal |
| Auto transfer reversal on refund | `IMPLEMENTED` | `stripe.transfers.createReversal` on original `tr_` |
| Auto `refund_application_fee` | N/A / unused | no application_fee on Checkout |
| DB `Refund` + `RefundSettlement` | `IMPLEMENTED` | durable plan + Stripe IDs |
| Order status sync on refund | `IMPLEMENTED` | full → REFUNDED; partial stays non-REFUNDED |
| Payout / transfer clawback | `IMPLEMENTED` | seller legs; courier when Stripe transfer exists |
| `transfer.reversed` webhook | `PARTIAL` | reactive bookkeeping retained |

See also: `docs/audits/interaction-integrity/refund-transfer-reversal.md`

## Fixtures

| Test | Status |
|---|---|
| Unit math (full/partial/sequential/idempotency) | `PASS` — `validate-refund-settlement-unit.ts` |
| Controlled €1.27 dry-run | `PASS` — no Stripe mutation |
| Live refund after transfer | **BLOCKED** until `APPROVE_E1_REFUND_REVERSAL_TEST` |

## Economic allocation

`REFUND_ECONOMICS` = engine calculates components; Terms surcharge entitlement = **POLICY_REQUIRED**  
`LEGAL_REFUND_ALLOCATION = COUNSEL_REQUIRED` (surcharge / platform fee optics)
