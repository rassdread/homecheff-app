# Dispute / chargeback after recipient transfer

**Date:** 2026-08-16  
**Baseline SHA:** `c44e1abb192a610e8fa3c94d1759e804c276afc5` (refund finalize fix preserved on origin/main)

## Official Stripe sources

| Fact | Source |
|---|---|
| SCT: platform debited for dispute amount + fees | https://docs.stripe.com/connect/disputes |
| Recover via transfer reversal (not automatic) | same + https://docs.stripe.com/connect/charges |
| source_transaction / transfer_group do **not** auto-reverse | Stripe SCT docs |
| NL dispute received fee €20 list | https://stripe.com/en-nl/pricing |
| Countered fee €20 returned if won | same |

## Phase 1 — legacy exposure (proven from code)

Before this change, `charge.dispute.created` only ran `processCommissionReversal`.

Hypothetical at post-transfer / pre-refund economics (127 paid, 88 transferred):

| Field | Value |
|---|---|
| PLATFORM_DEBIT | 127 (+ dispute fee) |
| SELLER_RECOVERY | **0** |
| P0_EXPOSURE | **YES** |

## Engine

- Shared: `lib/payments/recipient-reversal.ts`
- Dispute: `lib/payments/dispute-settlement.ts`
- Schema: `DisputeSettlement`
- Webhook: created / updated / closed / funds_withdrawn / funds_reinstated
- Recovery trigger default: `ON_DISPUTE_CREATED` (Stripe recommendation); POLICY_REQUIRED alternatives flagged
- Admin: `GET/POST /api/admin/disputes/stripe` + DisputeResolution preview panel

## Historical €1.27 (fully refunded)

`amount_reversed=88` → **ADDITIONAL_SELLER_REVERSAL_CAPACITY = 0** (proven dry-run).

## Live gate

`LIVE_DISPUTE_TEST_REQUIRED = YES` (optional controlled test) — **not authorized by this phase**.

No live dispute / reversal / refund mutation in this phase.
