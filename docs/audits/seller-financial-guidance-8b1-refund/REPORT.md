# PHASE 8B.1 — REFUND_EXCEEDS_SALE FORENSIC AUDIT

```
MODE            = READ ONLY
PRODUCTION SHA  = 890f2d3d (runtime, unchanged by this audit)
DATE            = 2026-09-22
WRITES          = 0 (no order, transaction, refund, transfer or Stripe object
                  was created, updated or reversed)
ARTIFACTS       = forensic.json, stripe-reconcile.json, systemic.json,
                  buyer-components.json, and the read-only scripts that
                  produced them
```

## HEADLINE

The 215 cents is not one refund. It is **two economically different events that
were both written into the same column on the same row**, and then summed.

```
88c  = the seller's transfer being reversed   (seller NET cash clawback)
127c = the buyer being refunded               (buyer TOTAL, incl. 27c surcharge)
-----
215c = a number that corresponds to nothing
```

The correct seller-side figure is **100c** — the seller's gross consideration.
It is not stored anywhere in the `Refund` table. It *is* stored, correctly, in
`RefundSettlement.planJson` as `sellerConsiderationRefundCents: 100`.

Stripe is entirely correct. The refund engine is entirely correct. The defect is
confined to the legacy compatibility rows those paths write into `Refund`.

The original hypothesis was half right: the buyer-level amount did leak into the
seller leg, and it did include a surcharge — but not shipping (this order is
`PICKUP` with no shipping and no delivery leg), and the hypothesis did not
anticipate the second row, the transfer reversal.

---

## 1. THE EXACT EVENT

```
ANOMALY_ORDER       = b7df063b…#959a5662   (status REFUNDED, PICKUP, EUR_STRIPE)
ANOMALY_TRANSACTION = txn_b7df…#45b034a0   (shape: txn_<orderId>_<productId>)
SELLER              = 7647bf21…#c6b10c40
PRODUCT             = fcc5ff2a…#64ea1434   ("HomeCheff Design Studio", DESIGNER)
CREATED             = 2026-08-16T16:14:01Z
REFUNDED            = 2026-08-16T17:08:12Z (54 minutes later)
```

This order was **a deliberate controlled production refund certification**, not
organic commerce. `RefundSettlement.reason` records it verbatim:

```
"APPROVE_E1_REFUND_REVERSAL_TEST controlled live"
```

and the repo still contains the scripts that drove it
(`scripts/execute-e1-refund-reversal-live.ts`,
`scripts/finalize-e1-refund-settlement.ts`). So the anomaly was produced by a
sanctioned exercise of the refund path on a 1-euro-cent-scale order — which is
exactly what such an exercise is for. It surfaced a real bug.

Related records reconstructed: `Order`, one `OrderItem`, one `Transaction`, one
`Payout`, two `Refund` rows, one `RefundSettlement`, and the corresponding
Stripe session / payment intent / charge / refund / transfer / reversal /
balance transaction. No `PaymentEscrow`, no `DeliveryOrder`, no `ShippingLabel`,
no `MarketplaceHcSettlementExposure`, no sibling transactions on the order.

---

## 2. BUYER ECONOMICS

From the Stripe Checkout Session metadata, which is the authoritative buyer-side
breakdown at capture time:

```
ITEM_SUBTOTAL     = 100
SHIPPING          = 0      (deliveryMode PICKUP; every shipping column is null)
DELIVERY          = 0      (deliveryFeeCents = 0, no DeliveryOrder)
SERVICE/SURCHARGE = 27     (stripeFeeCents — processing fee grossed onto buyer)
PLATFORM/BUYER_FEE= 0      (HomeCheff commission is taken from the seller, not
                            added to the buyer)
OTHER             = 0      (smsNotificationCostCents = 0)
BUYER_TOTAL       = 127
```

```
100 + 0 + 0 + 27 + 0 + 0 = 127   ✅ reconciles exactly
```

Cross-checks: `Order.totalAmount = 127`, `session.amount_total = 127`,
`paymentIntent.amount = 127`, `charge.amount = 127`. No inconsistency on the
buyer side.

One incidental observation: the surcharge charged the buyer was **27c** while
Stripe's actual fee on the balance transaction was **29c**. HomeCheff
under-recovered 2c of processing cost on this micro-transaction. That is a
pricing-model rounding artefact at 1-euro scale, not part of this anomaly.

---

## 3. SELLER ECONOMICS

```
SELLER_GROSS_CONSIDERATION = 100   (OrderItem.priceCents 100 × quantity 1)
PLATFORM_FEE_BPS           = 1200  (snapshotted on the Transaction at settlement)
PLATFORM_FEE               = 12    (100 × 1200 / 10000)
SELLER_NET_PROCEEDS        = 88
TRANSFER_AMOUNT            = 88    (Stripe tr_3U55jB…, Payout row 88c)
OTHER_SELLER_ADJUSTMENT    = 0
```

How the 100c arose: the single `OrderItem` has `priceCents = 100`,
`quantity = 1`. `settleSellerOrderItem` writes `Transaction.amountCents` as the
line total, so 100. Note the `Product.priceCents` is 0 (a placeholder listing),
which confirms the transaction is driven by the order line, not the live product
price — correct behaviour.

`100 = 88 transferred + 12 commission retained` ✅

---

## 4. THE REFUND

```
REFUND_CREATED_AT               = 2026-08-16T17:08:12Z and 17:08:14Z (two rows)
REFUND_SOURCE                   = executeRefundSettlement, mode FULL_BUYER_GROSS
REFUND_GROSS_AMOUNT (as stored) = 215  ← the anomaly
REFUND_ITEM_COMPONENT           = 100  (from RefundSettlement.planJson)
REFUND_SHIPPING_COMPONENT       = 0
REFUND_SURCHARGE_COMPONENT      = 27   (refunded to buyer, borne by platform)
REFUND_PLATFORM_FEE_COMPONENT   = 12   (commission released back)
REFUND_OTHER_COMPONENT          = 0

REFUND_COMPONENT_ALLOCATION_AVAILABLE
  in the Refund table          = NO   (id, transactionId, amountCents,
                                       createdAt, providerRef — no scope, no
                                       component, no kind)
  in RefundSettlement.planJson = YES  (full allocation, self-reconciling)
```

The two rows, with the write path identified from their deterministic id
prefixes:

| Row id shape | Amount | Provider ref | What it actually is | Written by |
|---|---|---|---|---|
| `refund_trr_<txnId>_trr_…` | 88 | `trr_1U57Xc…` (Stripe **transfer reversal**) | Seller's **net** cash clawed back | `lib/payments/recipient-reversal.ts:288` |
| `refund_buyer_<productId>_pyr_…` | 127 | `pyr_1U57Xd…` (Stripe **refund**) | **Buyer's total** refunded | `lib/payments/refund-settlement.ts:1007` |

Neither row equals 100. One equals the seller's net (88), the other equals the
buyer's total (127). The gross seller consideration refund — the only figure a
seller financial year should subtract — is absent.

---

## 5. STRIPE READ-ONLY RECONCILIATION

Live key, retrieve/list calls only.

```
STRIPE_CHARGE_AMOUNT     = 127   (py_3U55jB…, refunded = true)
STRIPE_REFUND_AMOUNT     = 127   (pyr_1U57Xd…, succeeded, one refund only)
STRIPE_TRANSFER_AMOUNT   = 88    (tr_3U55jB…, amount_reversed = 88, reversed)
STRIPE_TRANSFER_REVERSAL = 88    (trr_1U57Xc…, one reversal only)
STRIPE_PLATFORM_FEE      = null  (application_fee_amount is null — consistent
                                  with Separate Charges and Transfers, where
                                  HomeCheff's commission is simply the amount it
                                  does not transfer, not a Stripe application fee)
STRIPE_PROCESSING_FEE    = 29    (balance transaction: amount 127, fee 29,
                                  net 98; not returned on refund, per Stripe)
STRIPE_BALANCE_MATCH     = YES
```

Stripe holds **exactly one** buyer refund and **exactly one** transfer reversal.
The database holds **two** refund rows. The duplication is purely local:

```
215 (db rows) = 127 (Stripe refund) + 88 (Stripe reversal)   ✅ proven
```

Whole-order cash proof, which closes cleanly:

```
platform in       +127
Stripe fee         −29   (never returned)
transfer to seller −88
buyer refund      −127
reversal in        +88
------------------------
platform net       −29   = exactly the unrecoverable Stripe processing fee
seller net           0   = received 88, returned 88
buyer net            0   = paid 127, refunded 127
```

Nobody is out of pocket except the platform, by precisely the processing fee.
That is the correct outcome for a full refund under this architecture, and it
confirms the money movement was right even though the bookkeeping row was not.

---

## 6. SEMANTIC CLASSIFICATION

Evidence-supported categories, in order of contribution:

**B. REFUND_CAPTURE_RECORDED_AT_BUYER_LEVEL — CONFIRMED (primary).**
`refund-settlement.ts:1009-1012` contains a branch that, when an order has
exactly one seller leg, stores `plan.buyerRefundCents` on the seller's
transaction instead of that leg's `sellerConsiderationRefundCents`:

```
1009|            amountCents:
1010|              plan.sellerLegs.length === 1
1011|                ? plan.buyerRefundCents
1012|                : leg.sellerConsiderationRefundCents,
```

The multi-leg path is correct. The single-leg shortcut is the bug — presumably
written on the assumption that with one seller the buyer refund *is* the seller
refund, which is false whenever any buyer-level component exists (surcharge,
shipping, delivery). Here it wrote 127 instead of 100.

**F. TRANSFER_REVERSAL_MISMATCH — CONFIRMED (secondary).**
`recipient-reversal.ts:285-292` writes a second `Refund` row whose amount is the
transfer reversal, i.e. the seller's **net** (88), not gross consideration
(100). Even alone this row would understate by the commission, and alongside the
first row it double-counts the same economic event.

**C. SELLER_REFUND_ALLOCATION_MISSING — CONFIRMED (enabling condition).**
`Refund` has no scope, kind or component discriminator, so nothing in the schema
prevents buyer-scoped, net-scoped and gross-scoped amounts from coexisting in
one column, and no consumer can tell them apart except by parsing id prefixes.

**H. LEGACY_DATA_MODEL_LIMITATION — CONFIRMED (context).**
The code comments label these writes "compatibility" — they exist to keep the
pre-settlement-engine `Refund` table populated. The authoritative record moved
to `RefundSettlement`, and the compatibility shim was never held to the same
semantic standard.

**NOT selected, with reasons:**
`A. SOURCE_DATA_CORRUPTION` — every value is internally consistent and matches
Stripe; nothing is corrupt, it is mislabelled.
`D. SHIPPING_REFUND_INCORRECTLY_ASSIGNED_TO_SELLER` — no shipping exists on this
order. `E. SURCHARGE_…` — the surcharge does reach the seller leg, but only as a
component of the buyer total captured by B; it was not separately allocated.
`G. FINANCIAL_DERIVATION_SEMANTIC_BUG` — the 8B derivation read the source
faithfully and refused to trust it; see §10.

---

## 7. CORRECT ECONOMIC TREATMENT

```
BUYER WAS REFUNDED                   = YES — 127 (full gross incl. 27 surcharge)
SELLER SHOULD ECONOMICALLY BE DEBITED= YES — 100 gross consideration,
                                       realised as 88 cash reversed + 12
                                       commission released
HOMECHEFF SHOULD ECONOMICALLY BE DEBITED = YES — 39 cash out (127 − 88), of
                                       which 27 is the surcharge returned and 12
                                       is forgone commission; all-in position
                                       −29 once the retained margin and the
                                       unreturned Stripe fee are netted
DELIVERY/SHIPPING PARTY SHOULD BE DEBITED = N/A — no courier, no label, no fee
```

The critical distinction the brief asks about holds here and must be encoded:
**buyer refund (127) ≠ seller refund (100)**, and the difference (27) is a
platform-borne buyer-level component that must never touch a seller's books.
Summing seller components to reach the buyer refund is only valid when every
buyer-level component happens to be zero, which is not a condition any code
should assume.

---

## 8. IS IT SYSTEMIC?

```
TOTAL_REFUND_EXCEEDS_SALE_CASES = 1
YEARS_AFFECTED                  = [2026]
SELLERS_AFFECTED                = 1
TOTAL_EXCESS_CENTS              = 115
```

Scanned the entire `Transaction` table (7 rows; production marketplace volume is
still very small). Exactly one transaction carries refunds at all, and it is the
anomalous one. There is one `RefundSettlement` in existence, and it is this one.

So the *incidence* is one case — but the *exposure* is the code path, and the
code path is unconditional:

```
RefundSettlements total                          = 1
  hitting the single-seller-leg branch           = 1  (100%)
  where buyerRefund ≠ sellerConsideration        = 1  (100%)
```

Every future refund of a single-seller order will reproduce this, because every
such order carries a buyer surcharge by construction. The only reason the count
is one is that only one refund has ever been executed. **Treat this as systemic
in the code, incidental in the data.**

Shared characteristics of the single case: `PICKUP` fulfilment, `EUR_STRIPE`
payment, `FULL_BUYER_GROSS` mode, Separate Charges and Transfers path,
non-legacy period, marketplace product order. No legacy-period clustering to
exclude, since there is no second case to compare against.

---

## 9. WRITE PATH TRACE

Four code paths create `Refund` rows. Three of them disagree about what the
amount means.

| # | File / function | Id prefix | Amount recorded | Scope | Correct? |
|---|---|---|---|---|---|
| 1 | `lib/payments/refund-settlement.ts:1005` in `executeRefundSettlement` | `refund_buyer_` | `buyerRefundCents` if 1 leg, else `sellerConsiderationRefundCents` | **buyer** (1 leg) / seller gross (n legs) | ❌ for 1 leg |
| 2 | `lib/payments/recipient-reversal.ts:286` in `reverseRecipientTransfer` | `refund_trr_` | transfer reversal amount | **seller net** | ❌ |
| 3 | `app/api/stripe/webhook/route.ts:562` on `transfer.reversed` | `refund_reversal_` | `transferReversal.amount` | **seller net** | ❌ |
| 4 | `lib/hc/marketplace-hc-delivery-refund.ts:143` | `refund_delivery_ledger_` | `clawbackCents` | courier principal | ✅ in its own domain |

Answering the specific questions:

- **Where the amount originates**: path 1 from the refund plan's buyer figure,
  paths 2 and 3 from the Stripe transfer reversal, path 4 from the delivery
  payout principal.
- **Buyer refund or seller reversal**: the table conflates both. Nothing in the
  row distinguishes them; only the id prefix does, and no consumer parses it.
- **Shipping**: not handled in the refund rows at all. The plan carries
  `courierLeg` separately and `includeCourierCents` gates it; shipping label
  cost lives on `Order`/`ShippingLabel`. None of it flows into `Refund`.
- **Platform fee**: handled only in the plan (`platformFeeCents`,
  and implicitly in `sellerConsiderationRefundCents = transferReversal + fee`).
  Never written to `Refund`.
- **Transfer reversal separate?**: yes in Stripe and in `Payout`, but it is
  *also* mirrored into `Refund`, which is the duplication.
- **Partial refunds preserve allocation?**: in `RefundSettlement.planJson` yes,
  per leg. In `Refund`, no — a partial refund writes a single scalar with no
  indication of which component it reduced.

**Latent triple-count risk.** Paths 2 and 3 can both fire for the same Stripe
reversal (the engine writes `refund_trr_`, then the `transfer.reversed` webhook
writes `refund_reversal_`). They did not collide here, but nothing prevents it,
and it would add a third row of 88c to the same transaction.

---

## 10. IS THE 8B DERIVATION CORRECT?

```
DERIVATION_DETECTION_CORRECT     = YES
DERIVATION_AMOUNT_SEMANTICS_CORRECT = YES, given its inputs
DERIVATION_CHANGE_REQUIRED       = NO
```

`buildSellerFinancialYear` compares linked refunds against the sale and raises
`REFUND_EXCEEDS_SALE`, downgrading the year to `DATA_INCONSISTENCY`:

```365:372:lib/finance/seller-financial-year.ts
    if (linkedRefundCents > gross + 1) {
      sawInconsistency = true;
      warnings.push({
        code: 'REFUND_EXCEEDS_SALE',
        transactionId: leg.transactionId,
        detail: `Linked refunds ${linkedRefundCents} exceed sale ${gross}.`,
      });
    }
```

This is the correct behaviour and should stay. It read the source faithfully
(215 is genuinely what the rows say), it declined to invent a clamp that would
have silently produced a plausible-looking wrong total, and it told the seller
the figures may be incomplete. The commission release was still capped at the
12c actually charged, so the fee figure never went negative.

The derivation is not the place to fix this. Clamping refunds to the sale amount
there would hide a source defect behind a correct-looking number — precisely the
failure mode Phase 8B was built to prevent. **Do not change it in 8C either
until the write path is fixed;** once the source is correct, the warning will
simply stop firing.

---

## 11. REPAIR RECOMMENDATION

```
RECOMMENDED_REPAIR      = CODE_FIX_AND_DATA_REPAIR
CODE_FIX_REQUIRED       = YES
DATA_REPAIR_REQUIRED    = YES (one order, two rows)
SCHEMA_CHANGE_REQUIRED  = NO for correctness (recommended as 8C hardening)
```

**Code fix — the invariant to establish.** A `Refund` row attached to a seller
`Transaction` means exactly one thing: *the gross seller consideration reversed
on that leg*. Concretely:

- `refund-settlement.ts:1009-1012` — delete the single-leg special case and
  always write `leg.sellerConsiderationRefundCents`. This alone turns 127 into
  100 and is a two-line change.
- `recipient-reversal.ts:286-296` — stop writing a `Refund` row for a transfer
  reversal. The reversal is already authoritative in Stripe, in `Payout`, and in
  `RefundSettlement.resultJson`; mirroring it as a "refund" is what creates the
  double count. Callers already have `persistRefundRow`, so this is a default
  change plus removal of the call-site opt-in.
- `webhook/route.ts:562` — same reasoning; it records a net-scoped amount for an
  event the settlement engine already recorded. At minimum it must not write a
  row when a `RefundSettlement` covers the transfer.

Do **not** attempt to back-derive gross from a reversal amount and a fee rate.
That is fragile against partial refunds and rounding, and the correct figure is
already computed upstream.

**Data repair — exactly which records.** One order, `b7df063b…`:

| Row | Now | Should be |
|---|---|---|
| `refund_trr_<txn>_trr_1U57Xc…` | 88 | deleted (duplicate of an event recorded in `Payout`/Stripe) |
| `refund_buyer_<product>_pyr_1U57Xd…` | 127 | 100 (`sellerConsiderationRefundCents`) |

Net effect: the seller's 2026 refunds become 100 instead of 215, net sales
become 5713, and completeness returns to `COMPLETE`. **Not performed.** No
Stripe object changes — Stripe is already right.

Prerequisite: fix the code first, otherwise the next refund recreates the
condition and the repair has to be redone.

---

## 12. FUTURE INVARIANT FOR 8C

Derived from HomeCheff's actual economics rather than assumed:

```
(1) SCOPE SEPARATION
    buyerRefund  ≠  sellerRefund
    buyerRefund  =  Σ sellerRefundGross
                  + surchargeRefund      (platform-borne)
                  + shippingRefund       (carrier/platform-borne)
                  + courierRefund        (courier-borne)
    Equality between buyerRefund and sellerRefund is a coincidence of
    all-zero buyer-level components, never an assumption.

(2) SELLER CEILING
    Σ sellerRefundGross(leg)  ≤  sellerConsideration(leg)
    cumulatively across all refund events on that leg, unless an explicitly
    classified separate seller liability (penalty, chargeback fee, negative
    adjustment) accounts for the excess — in which case it is that, and must
    not be typed as a refund.

(3) LEG DECOMPOSITION
    sellerRefundGross  =  transferReversalCents + platformFeeReleaseCents
    (here: 100 = 88 + 12). A seller row recording only the transfer reversal
    understates by the commission and is not a refund.

(4) ONE ROW PER (leg, refundEvent, scope)
    No economic event may be represented twice, and no row may exist whose
    scope cannot be named.

(5) STRIPE FEE
    Not returned on refund and not attributable to the seller. It lands on the
    platform and must stay out of seller figures in both directions.
```

Invariants 1 and 2 are the ones that would have caught this at write time.

---

## 13. OUTPUT SUMMARY

```
ANOMALY_ORDER             = b7df063b…#959a5662
ANOMALY_TRANSACTION       = txn_b7df…#45b034a0
SELLER_CONSIDERATION_CENTS= 100
BUYER_TOTAL_CENTS         = 127
BUYER_REFUND_CENTS        = 127
SELLER_REFUND_CENTS       = 100  (correct value; stored as 215 across two rows)

ITEM_COMPONENT            = 100
SHIPPING_COMPONENT        = 0
SURCHARGE_COMPONENT       = 27
PLATFORM_FEE_COMPONENT    = 12

STRIPE_RECONCILIATION     = MATCHES  (charge 127, refund 127, fee 29 unreturned)
TRANSFER_RECONCILIATION   = MATCHES  (transfer 88, reversal 88, fully reversed)

ROOT_CAUSE                = Two economically distinct events — a 127c buyer
                            refund and an 88c seller transfer reversal — are
                            both persisted as Refund rows on the same seller
                            Transaction, in a table with no scope discriminator.
                            Neither row carries the gross seller consideration
                            (100c). Summing them yields 215c.
SYSTEMIC                  = YES in the code path, NO in the data so far
OTHER_CASES               = 0
YEARS_AFFECTED            = [2026]
SELLERS_AFFECTED          = 1

DERIVATION_DETECTION_CORRECT = YES
DERIVATION_CHANGE_REQUIRED   = NO

CODE_FIX_REQUIRED         = YES  (refund-settlement.ts single-leg branch;
                            recipient-reversal.ts mirror row; webhook mirror row)
DATA_REPAIR_REQUIRED      = YES  (one order, two rows, described in §11)
SCHEMA_CHANGE_REQUIRED    = NO   (a Refund.scope discriminator is recommended
                            hardening for 8C, not needed for correctness)

RECOMMENDED_REPAIR        = CODE_FIX_AND_DATA_REPAIR

SAFE_TO_START_PHASE_8C    = YES
```

**Why yes.** The canonical derivation behaved exactly as designed: it detected
the inconsistency, refused to present a confident total, and disclosed it to the
seller. No seller was paid or charged incorrectly — Stripe's money movement is
provably correct and every party's net position closes. The defect is one
mislabelled bookkeeping row on one certification order, with a two-line primary
fix.

**Conditions to carry into 8C.** The write path must be fixed *before* any
persistent ledger is built on top of `Refund`, because a ledger would freeze the
ambiguity instead of exposing it. And the data repair should follow the code
fix, not precede it.
