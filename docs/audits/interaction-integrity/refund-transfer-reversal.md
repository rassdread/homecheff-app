# Refund after seller transfer — clawback / transfer reversal

**Date:** 2026-08-16  
**Phase:** P0 REFUND_AFTER_TRANSFER_CLAWBACK (dry-run / engine only)  
**Main SHA before:** `f32ef5dcee6822f1edf11e48f24898587c9f2723`  
**Production before:** `dpl_GvmBup4gdxZdaurGeRpHwrzUurHx`  

## Official Stripe sources (verified 2026-08-16)

| Topic | Source |
|---|---|
| SCT refunds do **not** auto-reverse transfers | https://docs.stripe.com/connect/separate-charges-and-transfers#issue-refunds |
| Create transfer reversal | https://docs.stripe.com/api/transfer_reversals/create |
| Reversal requires connected available balance (or reserves) | https://docs.stripe.com/connect/separate-charges-and-transfers#reverse-transfers |
| Stripe processing fees **not** returned on refund | https://docs.stripe.com/refunds |
| Chargeback after SCT: platform debited; reverse transfer to recover | https://docs.stripe.com/connect/charges |

## Phase 0 baseline (controlled €1.27)

| Object | ID / value |
|---|---|
| Order | `b7df063b-a305-4129-a63f-3418bb6846df` |
| PI | `pi_3U55jB2KvmKfeN9t1qgoZzLL` |
| Charge | `py_3U55jB2KvmKfeN9t1Qr93icB` |
| Transfer | `tr_3U55jB2KvmKfeN9t1L9OEvJn` (88¢) |
| Seller Connect | `acct_1Sj52gRyMYBvOmov` |

Reconfirm (read-only expectation): buyer paid once; seller transfer once; **no** refund; **no** dispute; **no** transfer reversal.  
**This phase must not mutate that payment.**

## Phase 1 — refund paths (before fix)

| Path | Trigger | Stripe refund | Transfer reverse |
|---|---|---|---|
| `POST /api/admin/refunds` | Admin | `refunds.create` on PI | **NO** (P0) |
| `DELETE /api/admin/orders/[id]` + refundAmount | Admin | same | **NO** (P0) |
| Seller APIs | — | none | none |
| `charge.refunded` webhook | Stripe | n/a | affiliate ledger only |
| `transfer.reversed` webhook | Stripe inbound | n/a | bookkeeping only |

## Phase 2 — proven failure mode (calculated, not executed)

If admin refunded **127¢** with **old** code after transfer:

| Party | Result |
|---|---|
| Buyer | +127¢ refund |
| Seller | retains **88¢** transfer |
| Platform | funds 127¢; recovers 0 from seller |

**P0_EXPOSURE = YES**

Seller-consideration-only (100¢) without clawback: buyer +100, seller keeps 88, platform worse.

## Engine

Canonical module: `lib/payments/refund-settlement.ts`

- `planRefundSettlement` / `dryRunRefundSettlement` — read-only
- `persistRefundPlan` — `RefundSettlement` row
- `executeRefundSettlement` — OPTION C: persist → reverse transfers → buyer refund → affiliate ledger → status
- Idempotency keys for buyer refund + each transfer reversal
- Cumulative floor proportional seller reversal:  
  `floor(cumConsideration * transfer / gross) - alreadyReversed`
- Full consideration 100 → reverse **88** (not 100)
- Partial 50 → reverse **44**
- Multi-seller: per `productId` / original `tr_`

## Schema

`RefundSettlement` (+ migration `20260816200000_refund_settlement`)

## Admin

- `POST /api/admin/refunds/preview` — financial impact, no Stripe mutate
- `POST /api/admin/refunds/execute` — requires confirm flags; E1 order blocked without `APPROVE_E1_REFUND_REVERSAL_TEST`
- `POST /api/admin/refunds` — routes through same engine; no silent PI-only refund
- Order cancel + refundAmount → 409 pointing to settlement APIs
- FinancialManagement Refunds tab: inline preview panel

## Policy flags

| Topic | Verdict |
|---|---|
| Buyer surcharge in refund | CODE: FULL_BUYER_GROSS includes; SELLER_CONSIDERATION excludes. TERMS: **POLICY_REQUIRED** |
| Stripe fee on refund | **NOT_RETURNED** (Stripe docs) |
| Platform fee treatment | Separate from seller transfer; not reversed from seller (seller only received net) |
| Affiliate | Funded from platform fee; **ledger** proportional reversal |
| Courier | Engine supports allocation; delivery payout often ledger-only → **POLICY_REQUIRED** |
| Inventory | Not auto-restored |
| Disputes/chargebacks | Same economic exposure remains **open P0** after refunds |

## Controlled dry-run (expected)

| Mode | Buyer refund | Seller reversal | Affiliate | Courier | Platform impact (est.) |
|---|---|---|---|---|---|
| FULL_BUYER_GROSS | 127 | 88 | 0 | 0 | 39 (=127−88); Stripe 29¢ fee retained by Stripe |
| SELLER_CONSIDERATION 50¢ | 50 | 44 | 0 | 0 | 6 |

## Live gate

`LIVE_REFUND_SAFE_TO_TEST` after engine deploy + dry-run pass.  
**Do not execute** until owner sends `APPROVE_E1_REFUND_REVERSAL_TEST`.

## Regression

Seller settlement `source_transaction` path must remain unchanged (`lib/payments/seller-settlement.ts`).
