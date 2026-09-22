# Phase 8B.2 — Refund Source Repair

Write-path hardening → controlled data repair → recertification.

Input: [`docs/audits/seller-financial-guidance-8b1-refund/REPORT.md`](../seller-financial-guidance-8b1-refund/REPORT.md)

| | |
|---|---|
| STARTING_SHA | `851d8af4` |
| CODE_FIX_COMMIT_SHA | `960119e4c3402363485ecafa1806f4d3b3c96a4e` |
| DEPLOYMENT_ID | `dpl_6VLir25V8nWei4xcJnByuaS2nW6M` |
| DEPLOYED_SHA_MATCH | YES (`960119e4` serving production before any data was touched) |

---

## 1. Refund writers — all reverified

Five code paths touch `Refund`. The four economic writers are the ones the
forensic audit named; the fifth is a GDPR cascade.

### W1 — refund settlement engine

- FILE = `lib/payments/refund-settlement.ts`
- TRIGGER = buyer refund executed (admin `/api/admin/refunds`, HC full refund)
- AMOUNT_SEMANTICS (before) = `plan.sellerLegs.length === 1 ? plan.buyerRefundCents : leg.sellerConsiderationRefundCents`
- ECONOMIC_EVENT = seller consideration reversed on one leg
- IDEMPOTENCY_KEY = `refund_buyer_<productId>_<stripeRefundId>` (deterministic)
- AUTHORITATIVE_SOURCE = `RefundSettlement.planJson.sellerLegs[].sellerConsiderationRefundCents`
- SHOULD_WRITE_REFUND = **YES** — this is the only writer that should
- **VERDICT** = root cause 1. The single-leg branch wrote a buyer figure into a
  seller row. Fixed.

### W2 — recipient transfer reversal

- FILE = `lib/payments/recipient-reversal.ts` (`reverseRecipientTransfer`)
- TRIGGER = any Stripe transfer reversal (refund, dispute, delivery clawback)
- AMOUNT_SEMANTICS (before) = seller **net** transfer reversal
- ECONOMIC_EVENT = settlement movement, not a consideration refund
- IDEMPOTENCY_KEY = `refund_trr_<id>_<reversalId>`, errors swallowed
- AUTHORITATIVE_SOURCE = Stripe `transfer.amount_reversed`, `Payout`,
  `RefundSettlement`/`DisputeSettlement.resultJson.sellerReversals[]`
- SHOULD_WRITE_REFUND = **NO** — a reversal already has three authoritative homes
- **VERDICT** = root cause 2. Mirror removed.

### W3 — `transfer.reversed` webhook

- FILE = `app/api/stripe/webhook/route.ts`
- TRIGGER = Stripe `transfer.reversed`, at-least-once delivery
- AMOUNT_SEMANTICS (before) = seller net transfer reversal, again
- ECONOMIC_EVENT = same event W2 already recorded
- IDEMPOTENCY_KEY (before) = `findFirst({ providerRef: reversal.id })` — which
  only ever matched **the row W2 wrote**
- AUTHORITATIVE_SOURCE = Stripe
- SHOULD_WRITE_REFUND = **NO**
- **VERDICT** = root cause 3, and it was the sharpest one. The webhook was kept
  from triple-counting purely by finding W2's mirror. Removing W2 alone would
  have *activated* this writer. Both had to move together.

### W4 — HC delivery refund

- FILE = `lib/hc/marketplace-hc-delivery-refund.ts`
- TRIGGER = HC delivery order fully refunded
- AMOUNT_SEMANTICS = courier principal clawed back on `txn_delivery_*`
- ECONOMIC_EVENT = courier consideration reversed
- IDEMPOTENCY_KEY = `refund_delivery_ledger_<deliveryOrderId>` / `refund_delivery_<deliveryOrderId>`
- AUTHORITATIVE_SOURCE = `DeliveryOrder` principal + `Payout`
- SHOULD_WRITE_REFUND = **YES** — consideration-scoped, on a courier leg
- **VERDICT** = the ledger branch was already correct. The Stripe branch reached
  the same outcome only by asking W2 to persist its mirror (`persistRefundRow:
  true`), so it now writes its own consideration row explicitly.

### W5 — account deletion

- FILE = `app/api/admin/users/bulk-delete/route.ts` (`refund.deleteMany`)
- TRIGGER = GDPR erasure cascade
- SHOULD_WRITE_REFUND = N/A — deletion only, no economic meaning. Untouched.

REFUND_WRITERS_AUDITED = 5 (4 economic + 1 erasure cascade)

---

## 2. Canonical semantic

**REFUND_AMOUNT_CANONICAL_SEMANTIC = SELLER_CONSIDERATION_REFUND**

A `Refund` row means the gross consideration reversed on the linked
`Transaction` leg — for a seller leg the seller's gross, for a `txn_delivery_*`
leg the courier's principal. It is never the buyer refund and never a transfer
reversal.

Every consumer was checked for a conflict. None found:

| Consumer | Effect of the semantic |
|---|---|
| `lib/finance/seller-financial-year.server.ts` | becomes correct — this is what flagged the anomaly |
| `lib/compliance/dac7-derive.ts` | becomes correct — DAC7 subtracts refunds from consideration, so it needs consideration |
| `app/api/seller/refunds` + seller UI | becomes correct — a seller was shown €2,15 refunded on a €1,00 sale |
| `app/api/admin/refunds` (+ `totalAmount`) | rows hang off seller transactions; consideration is the right scale |
| `app/api/admin/orders` `totalRefunds` | stops double counting |
| `app/api/admin/marketplace/finance-export` `refundCents` | sits beside `sellerGrossCents`/`sellerPayoutCents`, so consideration is the consistent scale; `buyerGrossCents` is a separate column fed from Stripe metadata |
| `app/api/admin/command-center`, `app/api/admin/alerts` | sum/count for trend metrics; unaffected in kind, more accurate in degree |
| `recipient-reversal.loadAlreadyReversedCents` | still reads legacy `trr_` rows for historical reversal capacity, and already preferred Stripe's `amount_reversed` |

No consumer reads `Refund` expecting a buyer amount. The admin refund preview
already sources buyer refund and seller reversal separately from the settlement
plan, which is why the admin UI was never wrong.

CONSUMER_CONFLICT = NONE

---

## 3–5. The three fixes

SINGLE_SELLER_SHORTCUT_REMOVED = YES

The branch is gone. Row amounts now come from
`leg.sellerConsiderationRefundCents` for single- and multi-seller orders alike,
and a zero leg writes no row. The decision moved into an exported pure function,
`sellerConsiderationRefundRows`, so the invariant is directly testable rather
than buried in an execution path that needs Stripe and a database to reach.

RECIPIENT_REVERSAL_REFUND_MIRROR_REMOVED = YES

`reverseRecipientTransfer` no longer writes `Refund`, and the now-meaningless
`transactionId` / `persistRefundRow` parameters are gone so the mirror cannot be
reintroduced by passing a flag. Both call sites updated. The Stripe reversal
itself is untouched.

WEBHOOK_DUPLICATION_BLOCKED = YES

The handler writes no `Refund` row. Its idempotency marker is now the
notification it sends, matched on `payload.refundId = <reversal id>`, which is
durable, reversal-specific, and independent of any writer we removed. The seller
notification is unchanged.

---

## 6. Buyer refund evidence preserved

BUYER_REFUND_SOURCE = `RefundSettlement.buyerRefundCents` (127) +
`RefundSettlement.stripeRefundId` (`pyr_1U57Xd2KvmKfeN9t8Vgi1CuS`) +
`RefundSettlement.planJson.buyerRefundCents` + the Stripe refund object.

TRANSFER_REVERSAL_SOURCE = Stripe `trr_1U57Xc2KvmKfeN9tbtOtO8Je` +
`transfer.amount_reversed` + `Payout.providerRef` `tr_3U55jB2KvmKfeN9t1L9OEvJn`
+ `RefundSettlement.resultJson.sellerReversals[]`.

Both were read back after the repair and both survived.

---

## 7. Scope discriminator

REFUND_SCOPE_SCHEMA_CHANGE_REQUIRED_NOW = **NO**

WHY = A discriminator is only needed if one table has to carry several scopes.
It doesn't. Buyer refunds and transfer reversals each already have authoritative
homes that predate this phase, so `Refund` can hold a single scope rather than
label three. Adding an enum now would also invite the opposite failure: a column
that makes it *legitimate* to write buyer amounts into seller rows again, with
every consumer then obliged to filter correctly. The invariant is recorded as a
schema doc comment (no migration — Prisma `///` comments are client-side
documentation and produce no SQL). Deferred to 8C hardening.

---

## 8–9. Regression

`npm run test:refund-source-semantics` — 42 checks, 0 failed.

| Fixture | Result |
|---|---|
| A single seller + surcharge (buyer 127 / consideration 100 / reversal 88) | row = 100; no 127 row; no 88 row |
| B single seller, no surcharge | unchanged |
| C multi seller | 400 + 550, no buyer-total leakage, distinct legs |
| D partial refund | exact per-leg allocation; untouched leg writes nothing |
| E transfer reversal | writes no `Refund`; legacy `trr_` still read for capacity |
| F duplicate webhook | no row, durable guard, guard precedes side effects |
| G refund + reversal | 100 and 88 stay separate and separately traceable |
| H financial year | gross 100, refund 100, net 0 (not negative), COMPLETE — and the pre-repair 88+127 shape still trips `REFUND_EXCEEDS_SALE`, so the guard was not weakened to pass |
| I DAC7 | still a reader of the same rows, no write path |
| J earnings APIs | all four still derive from `deriveSellerFinancialYear`, none read `Refund` directly |

Full Phase-8B suite and the payment engines:

| Suite | Result |
|---|---|
| `test:seller-financial-year` | 18/18 fixtures PASS |
| `validate:refund-settlement-unit` | OK, 9 fixtures, UNRECONCILED 0 |
| `validate:dispute-settlement-unit` | OK, 7 fixtures, UNRECONCILED 0 |
| `validate:seller-settlement-unit` | OK |
| `validate:multi-recipient-settlement` | OK, UNRECONCILED 0, 6 ownership rows |
| `test:marketplace-checkout-floor` | 13 pass / 0 fail |
| `npm run build` | PASS |
| `tsc --noEmit` | zero new errors (error set identical before/after, line-shift aside) |

---

## 10. Pre-deploy gate

```
REFUND_WRITERS_AUDITED       = 5
REFUND_CANONICAL_SEMANTIC    = SELLER_CONSIDERATION_REFUND

SINGLE_SELLER_SURCHARGE      = PASS
SINGLE_SELLER_NO_SURCHARGE   = PASS
MULTI_SELLER                 = PASS
PARTIAL_REFUND               = PASS
TRANSFER_REVERSAL            = PASS
DUPLICATE_WEBHOOK            = PASS
REFUND_PLUS_REVERSAL         = PASS

BUYER_REFUND_PRESERVED       = YES
SELLER_REFUND_CORRECT        = YES
TRANSFER_REVERSAL_PRESERVED  = YES
NO_DOUBLE_COUNT              = YES
NO_TRIPLE_COUNT              = YES

FINANCIAL_YEAR_REGRESSION    = PASS (18/18)
DAC7_REGRESSION              = PASS
EARNINGS_API_REGRESSION      = PASS
BUILD                        = PASS
```

---

## 11–12. Deploy, then prove the anomaly survived it

Staged explicitly: the five source files, the schema comment, the new fixture
suite, its `package.json` entry, and the 8B.1 audit artifacts. No geo/feed work,
no Business DNA work, no unrelated artifacts.

Production served `960119e4` before anything was read back. The anomaly was then
confirmed still present, which is the point: deployment and repair are separate
actions and the code fix is not retroactive.

```
PRE_REPAIR_REFUNDS_CENTS   = 215   (88 mirror + 127 buyer-scoped)
PRE_REPAIR_COMPLETENESS    = DATA_INCONSISTENCY
PRE_REPAIR_WARNING         = REFUND_EXCEEDS_SALE — "Linked refunds 215 exceed sale 100."
SILENT_MUTATION_BY_DEPLOY  = NONE
```

---

## 13–14. Controlled repair

Script: [`repair.ts`](./repair.ts) — verify-only by default, `--apply` to mutate.
Evidence: [`repair-verify.json`](./repair-verify.json), [`repair-apply.json`](./repair-apply.json).

Scope: order `b7df063b-…`, transaction
`txn_b7df063b-…_fcc5ff2a-…`, created by
`APPROVE_E1_REFUND_REVERSAL_TEST controlled live`.

21 guards asserted before any write — order total 127, leg gross 100,
`platformFeeBps` 1200, status `REFUNDED`, exactly two refund rows with their
exact IDs / amounts / provider refs, settlement reason and buyer amount, plan
`sellerConsiderationRefundCents` 100 and `transferReversalCents` 88, plus
Stripe's own charge 127 / refund 127 / transfer 88 / reversal 88 re-read live.
All passed; a single mismatch aborts before the first write.

Two statements, both keyed on the immutable primary key **and** the expected
prior amount, inside one transaction, each required to affect exactly one row:

```
DELETE refund_trr_fcc5ff2a-…_trr_1U57Xc2KvmKfeN9tbtOtO8Je   (88c reversal mirror)
UPDATE refund_buyer_fcc5ff2a-…_pyr_1U57Xd2KvmKfeN9t8Vgi1CuS  127 → 100
```

No broad predicate (`amountCents = 88`, `sellerId = …`) was used anywhere. No
Stripe object, order, seller, buyer, or unrelated row was touched. Rerunning
with `--apply` returns `NO_OP_ALREADY_REPAIRED`.

---

## 15. Post-repair economic reconciliation

Confirmed from Stripe and the database:

```
BUYER_CHARGE_CENTS          = 127   Stripe charge py_3U55jB…
BUYER_REFUND_CENTS          = 127   Stripe refund pyr_1U57Xd… + RefundSettlement
SELLER_CONSIDERATION_CENTS  = 100   Transaction.amountCents
SELLER_REFUND_CENTS         = 100   the single remaining Refund row
SELLER_TRANSFER_CENTS       =  88   Stripe transfer tr_3U55jB… + Payout
SELLER_REVERSAL_CENTS       =  88   Stripe reversal trr_1U57Xc…

BUYER_NET                   =   0
SELLER_NET                  =   0
PLATFORM_NET_CENTS          = -29   unrecoverable processing economics
```

`-29` is the 27c buyer surcharge the platform refunded but could not recover
plus the 2c residual on the refunded charge. No customer or seller was
mispaid — the defect was bookkeeping, and it stayed bookkeeping.

---

## 16. Post-repair seller financial year

`deriveSellerFinancialYear('7647bf21-…', 2026)`:

| | before | after |
|---|---|---|
| POST_REPAIR_GROSS_SALES | 5813 | **5813** (unchanged) |
| POST_REPAIR_REFUNDS | 215 | **100** |
| POST_REPAIR_NET_SALES | 5598 | **5713** |
| POST_REPAIR_PLATFORM_FEES | 657 | **657** |
| POST_REPAIR_NET_PROCEEDS | 4941 | **5056** |
| transactionCount | 9 | 9 |
| POST_REPAIR_COMPLETENESS | DATA_INCONSISTENCY | **COMPLETE** |
| warnings | REFUND_EXCEEDS_SALE | none |

Platform fees are unchanged at 657 rather than hard-coded: the fee released on
this leg is capped at that leg's own 12c fee, and the refund was already at or
above the full 100c gross both before and after. Net proceeds moved only because
net sales did.

---

## 17. Production UI/API recertification

Read-only, authenticated against production, zero mutations.
Evidence: [`../seller-financial-year-8b/certification/report.json`](../seller-financial-year-8b/certification/report.json).

Seller with sales — `deriveSellerFinancialYear` = `/api/seller/earnings` =
`/api/earnings/combined` = `/api/seller/dashboard/stats` = `/api/earnings/export`
= `/verdiensten` = seller dashboard, on every canonical field including refunds.
All 18 API agreement assertions true, cross-API consistent, idempotent.

```
AUTHENTICATED_PRODUCTION_SESSION  PASS
API_MATCHES_CANONICAL_DERIVATION  PASS
CROSS_API_CONSISTENCY             PASS
YEAR_SCOPED                       PASS
IDEMPOTENT_AGAINST_PRODUCTION     PASS
NO_PENDING_LEAKAGE                PASS   0 pending legs, 0 pending orders
SURFACES_SHOW_CANONICAL_AMOUNTS   PASS
INCOMPLETENESS_DISCLOSED          PASS
NO_PRODUCTION_MUTATION            PASS   mutationsPerformed = 0
```

- `/verdiensten` now reads Bruto Omzet 2026 € 58,13, **-€ 1,00 terugbetalingen**
  (was € 2,15), Platform Fee -€ 6,57, Netto Verdiend € 50,56.
- The incompleteness notice is absent on both surfaces, and absent for the right
  reason: `noticeExpected` is false because the derivation is `COMPLETE`. The
  disclosure logic was not touched, and fixture H proves the pre-repair shape
  still triggers it.
- Historical blended fee 11.3% preserved and still distinct from the 12% current
  plan (`differsFromCurrentPlan: true`).
- Zero-sales seller remains `COMPLETE` with an all-zero year.

DAC7 parity: `deriveSellerDac7Year` reports `refundCents` 100, matching the
financial year. DAC7's narrower gross (4600) is its own activity-classification
scope and is unchanged by this phase.

PRIVACY = PASS — the certification artifact stores masked seller IDs and email
hosts only.

---

## 18. No other bad data

Evidence: [`scan.json`](./scan.json). Read-only, 0 writes.

```
REFUND_EXCEEDS_SALE_CASES_REMAINING      = 0
duplicateTransferReversalRefundRows      = 0
webhookReversalRefundRows                = 0
buyerLevelLeakageRows                    = 0
duplicateProviderRefPerTransaction       = 0
```

One refund row exists in production. It is 100c against a 100c leg, scope
`EQUALS_SELLER_GROSS`, provider ref `pyr_` (a buyer refund id, correctly used as
provenance for the seller's share). No additional records were repaired.

---

## 19. Result

```
STARTING_SHA                          = 851d8af4
CODE_FIX_COMMIT_SHA                   = 960119e4
DEPLOYMENT_ID                         = dpl_6VLir25V8nWei4xcJnByuaS2nW6M
DEPLOYED_SHA_MATCH                    = YES

REFUND_CANONICAL_SEMANTIC             = SELLER_CONSIDERATION_REFUND
BUYER_REFUND_SOURCE                   = RefundSettlement.buyerRefundCents + Stripe refund
TRANSFER_REVERSAL_SOURCE              = Stripe reversal + Payout + settlement resultJson

SINGLE_SELLER_SHORTCUT_REMOVED        = YES
RECIPIENT_REVERSAL_REFUND_MIRROR_REMOVED = YES
WEBHOOK_DUPLICATION_BLOCKED           = YES

PRE_REPAIR_SELLER_REFUND_CENTS        = 215
POST_REPAIR_SELLER_REFUND_CENTS       = 100

BUYER_CHARGE_CENTS                    = 127
BUYER_REFUND_CENTS                    = 127
SELLER_CONSIDERATION_CENTS            = 100
SELLER_REFUND_CENTS                   = 100
SELLER_TRANSFER_CENTS                 = 88
SELLER_REVERSAL_CENTS                 = 88
PLATFORM_NET_CENTS                    = -29

POST_REPAIR_GROSS_SALES               = 5813
POST_REPAIR_REFUNDS                   = 100
POST_REPAIR_NET_SALES                 = 5713
POST_REPAIR_PLATFORM_FEES             = 657
POST_REPAIR_NET_PROCEEDS              = 5056
POST_REPAIR_COMPLETENESS              = COMPLETE

REFUND_EXCEEDS_SALE_CASES_REMAINING   = 0

DAC7                                  = PASS
VERDIENSTEN                           = PASS
SELLER_DASHBOARD                      = PASS
EARNINGS_APIS                         = PASS
PRIVACY                               = PASS

P0_REMAINING                          = 0
P1_REMAINING                          = 0
P2_REMAINING                          = 2
```

P2-1 — `Refund` has no scope discriminator and no database-level constraint
preventing a future writer from storing a buyer amount. The invariant is
currently held by one write path, one schema comment and the fixture suite.
8C hardening.

P2-2 — Pre-existing and unrelated to this phase: migration
`20260708140000_phase_8c_pending_accepted_values` is present in the repository
but not applied to this database. Untouched here; it belongs to 8C.

```
READY_FOR_PHASE_8C                    = YES

FINAL_DECISION = HOMECHEFF_SELLER_REFUND_SOURCE_REPAIR_PRODUCTION_CERTIFIED
```
