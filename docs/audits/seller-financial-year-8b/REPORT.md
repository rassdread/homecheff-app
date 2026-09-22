# PHASE 8B — CANONICAL SELLER FINANCIAL YEAR

```
STARTING_SHA  = fb8dc070
AUDIT_INPUT   = docs/audits/seller-financial-guidance-8a/REPORT.md (Revision 2)
DATE          = 2026-09-22
SCOPE         = lib/finance/**, lib/compliance/dac7-derive.ts,
                lib/orders/seller-commercial-metrics.ts,
                /api/seller/earnings, /api/earnings/combined,
                /api/earnings/export, /api/seller/dashboard/stats,
                /verdiensten, /verkoper/dashboard
```

## HEADLINE

The blocking question from §11 resolved **favourably**: every paid HomeCheff
offer type already reaches a `Product`, so no schema change is required and the
financial year is structurally complete.

```
FINANCIAL_YEAR_COMPLETENESS_BLOCKED_BY_ORDER_MODEL = NO
```

---

## 1. CURRENT_SOURCE_MAP

| Source | What it actually is | Verdict for accounting |
|---|---|---|
| `Transaction` (`txn_{orderId}_{productId}`) | Written by `settleSellerOrderItem` at Stripe payment success. One row per seller leg. `amountCents` = `OrderItem.priceCents × quantity`. `platformFeeBps` snapshotted at settlement. Deterministic id. | **Authoritative recognition record** |
| `Transaction` (`txn_delivery_*`) | Courier leg. `sellerId` = courier user, `amountCents` = gross delivery fee. | Different activity — separated |
| `Refund` | Rows hanging off `Transaction`, with `createdAt`. No type discriminator. | Authoritative refund fact |
| `Order` / `OrderItem` | Exist before payment; `status` is mutable; no `sellerId`, no `paidAt`, no currency. | Source of item data, **not** recognition |
| `MarketplaceHcSettlementExposure` | Per-order HC entitlement. HC_ONLY orders are refused by Connect settlement (`HC_ONLY_CONNECT_FORBIDDEN`) so they produce **no** `Transaction`. | Authoritative for the HC pilot |
| `Payout` / `PaymentEscrow` | Cash movement to the seller. | Never revenue |
| `DisputeSettlement` | Dispute recovery reverses the transfer, which lands as a `Refund` row. | Visible as REFUND only |
| `deriveSellerDac7Year` | Year-scoped, PENDING-excluded, refund-reconciling. Had `take: 5000` on both queries. | Good, but reporting-specific |
| `seller-commercial-metrics.ts` | Lifetime `OrderItem` sum, `take: 1000`. | Not accounting-safe |
| `/api/seller/earnings` | Second copy. `take: 1000`, **no status exclusion at all**, fee from current tier. | Not accounting-safe |
| `/api/earnings/combined` | Third copy, via the metrics lib, fee from current tier. | Not accounting-safe |
| `/api/earnings/export` | **Fourth copy**, found during this phase. `take: 1000`, fee from current tier — and it is the figure most likely to reach an accountant. | Not accounting-safe |

### Payment architecture (confirmed from code)

Separate Charges and Transfers, platform as merchant of record.
`settleSellerOrderItem` creates the `Transaction`, then `transfers.create` with
`source_transaction`. No `application_fee_amount` at charge time. Commission is
computed at settlement from the tier then in force and written to
`Transaction.platformFeeBps`. The Stripe processing fee is grossed up onto the
buyer in `lib/fees.ts`, so it is neither seller revenue nor seller cost.
`refund-settlement.ts` releases the commission share proportionally on refund
(`floor(refund × feeCents / sellerGross)`).

---

## 2. §11 — OFFER TYPE COVERAGE

| Offer type | CAN_CREATE_PAID_ORDER | ORDER_MODEL | SELLER_ID | ITEM_REF | TRANSACTION | FINANCIAL_EVENT |
|---|---|---|---|---|---|---|
| CREATE / GROW / DESIGN | YES | Order + OrderItem | Product.sellerId | Product | YES | YES |
| ARTISTIC_SERVICE | YES | Order + OrderItem | Product.sellerId | Product | YES | YES |
| PRACTICAL_SERVICE | YES | Order + OrderItem | Product.sellerId | Product | YES | YES |
| KNOWLEDGE | YES | Order + OrderItem | Product.sellerId | Product | YES | YES |
| ON_REQUEST / HOURLY / VOLUNTARY | YES | Order + OrderItem | Product.sellerId | Product | YES | YES |
| Negotiated proposal / appointment | YES | CommunityOrder → checkout Order | Product.sellerId | Product | YES | YES |
| Dish (recipe / inspiration) | **NO — by design** | none | n/a | n/a | n/a | n/a |
| `orderMethod = CONTACT` | **NO — by design** | none | n/a | n/a | n/a | n/a |

The 8A audit read "`OrderItem` links only to `Product`" as a coverage gap. It is
not. `Product` is the generic sellable listing: services are
`Product.marketplaceCategory`, and on-request pricing is `Product.priceModel`.
Negotiated deals cannot check out without one —
`community-order-checkout.ts` returns `communityOrder.checkoutMissingProduct`
(400) when `proposal.productId` is absent, and the negotiated amount overrides
the list price on the resulting `OrderItem`.

`Dish` is content, not commerce: `CartItem` carries only `productId`,
`DishReview.orderId` is never written, and `sync-linked-product-dish.ts` shows a
Dish is the inspiration mirror of a sellable Product. `orderMethod = CONTACT`
listings deliberately take no HomeCheff payment, so there is correctly no
financial event to derive.

---

## 3. PRE-DEPLOY REPORT

```
REVENUE_RECOGNITION_EVENT  = PAYMENT SUCCESS — existence of a settlement
                             Transaction row (status CAPTURED/REFUNDED),
                             dated Transaction.createdAt.
WHY                        = It is the only immutable, per-seller-leg,
                             payment-gated fact. It is written once by the
                             webhook, carries its own fee snapshot, and one rule
                             covers goods, services, on-request and negotiated
                             deals identically.
ALTERNATIVES_REJECTED      = Order creation (exists before payment);
                             Order.status CONFIRMED (mutable, no transition
                             guard, no paidAt); delivery/completion (defers
                             revenue by fulfilment mode, not a payment fact);
                             payout/transfer (cash movement, not revenue).

REFUND_SEMANTICS           = Dated reversal. The sale event is never deleted or
                             reduced; a REFUND event is emitted alongside it.
CROSS_YEAR_REFUND_SEMANTICS= Booked in the refund year, carrying saleYear as
                             provenance. The sale year additionally exposes
                             laterYearRefundOnThisYearSalesCents, so a future
                             year-end close can reconcile on either basis
                             without this layer hard-coding a tax answer.
PLATFORM_FEE_SOURCE        = Transaction.platformFeeBps (settlement snapshot),
                             released proportionally on refund. The loader
                             contains no subscription lookup at all.
STRIPE_FEE_SELLER_TREATMENT= EXCLUDED. Grossed up onto the buyer in lib/fees.ts,
                             so neither seller revenue nor seller cost.
SHIPPING_TREATMENT         = EXCLUDED from seller sales. Seller consideration is
                             the item total in every fulfilment mode; the buyer
                             shipping charge funds the carrier label and courier
                             fees are a separate activity, reported separately
                             and never summed in.

PAID_SALE_FIXTURE          = PASS
PENDING_FIXTURE            = PASS (no Transaction exists; an unsettled one is
                             withheld and flagged DATA_INCONSISTENCY)
FULL_REFUND_FIXTURE        = PASS
PARTIAL_REFUND_FIXTURE     = PASS
CROSS_YEAR_REFUND_FIXTURE  = PASS
HISTORICAL_COMMISSION_FIXTURE = PASS
OVER_1000_FIXTURE          = PASS (2.500 legs, no truncation)
CANCELLED_FIXTURE          = PASS
CHARGEBACK_FIXTURE         = PASS with documented limitation — the source model
                             has no discriminator, so a dispute recovery is
                             reported as REFUND and no CHARGEBACK type is
                             claimed.
SHIPPING_FIXTURE           = PASS
CURRENCY_FIXTURE           = PASS (non-EUR ⇒ UNSUPPORTED_SOURCE, never summed)
NON_PRODUCT_OFFER_FIXTURE  = PASS — service and negotiated-price sales derive
                             identically; structural proof included.

DAC7_PARITY_SHARED_EVENTS  = PASS
DAC7_SPECIFIC_LOGIC_PRESERVED = PASS

CANONICAL_FINANCIAL_DERIVATION = lib/finance/seller-financial-year.ts (pure)
                                 + .server.ts (Prisma loader)
YEAR_SCOPING               = PASS (UTC calendar year; 2025 and 2026 verified
                             against live data)
EVENT_PROVENANCE           = PASS (SALE / REFUND / PLATFORM_FEE /
                             PLATFORM_FEE_RELEASED, deterministic ids)
IDEMPOTENCY                = PASS (byte-identical twice, locally and live)
COMPLETENESS_SIGNAL        = PASS (COMPLETE / PARTIAL / UNSUPPORTED_SOURCE /
                             DATA_INCONSISTENCY + typed warnings)
NO_CURRENT_TIER_RECALCULATION = PASS (asserted by test against the loader source)
NO_TRANSACTION_CAP         = PASS (cursor pagination; DAC7's take: 5000 also
                             removed)

VERDIENSTEN_MIGRATED       = PASS (year-scoped, year label, refunds disclosed)
SELLER_DASHBOARD_MIGRATED  = PASS (money block canonical; rolling-period
                             analytics retained and relabelled)
EARNINGS_API_CONSOLIDATED  = PASS (all four revenue copies retired; the
                             lifetime helper is deleted, not left dormant)

VERDIENCHECK_ZERO_PERSISTENCE_PRESERVED = PASS
RECEIPT_VAULT_UNTOUCHED    = PASS
PRIVACY                    = PASS (no new analytics, no financial values in URL
                             or share payloads; ?year= is not a financial value)

P0_REMAINING = none
P1_REMAINING = Live data contains a refund of 215c against a 100c seller leg
               (see §5). Surfaced as DATA_INCONSISTENCY rather than hidden.
P2_REMAINING = Chargebacks indistinguishable from refunds in the source model.
               The webhook delivery transaction id embeds Date.now(), unlike the
               stable id used by delivery-payout.ts.

BLOCKERS = none
```

---

## 4. WHAT CHANGED

- **New** `lib/finance/seller-financial-year.ts` — pure, clock-free,
  jurisdiction-neutral derivation with explicit named semantics.
- **New** `lib/finance/seller-financial-year.server.ts` — Prisma loader,
  cursor-paged, Stripe test/live aware, HC settlements folded in.
- **New** `scripts/test-seller-financial-year.ts` — 17 fixtures (A–L plus
  idempotency, UTC year scoping, DAC7 parity, and a guard that no fiscal logic
  leaks into the finance layer). Registered as `npm run test:seller-financial-year`.
- `lib/compliance/dac7-derive.ts` — shares `utcYearBounds`, gains the
  DAC7 ≠ TAX architecture boundary comment, and its two `take: 5000` caps are
  replaced with pagination.
- `/api/earnings/combined`, `/api/seller/earnings`, `/api/earnings/export`,
  `/api/seller/dashboard/stats` — money now from the canonical derivation, with
  a `financialYear` block exposing basis, refunds and completeness.
- `/verdiensten` and `/verkoper/dashboard` — year label, refunds shown, and the
  commission subtext now derives the effective rate from the figures actually
  charged rather than the seller's current plan.
- `lib/orders/seller-commercial-metrics.ts` — `getSellerCommercialLifetimeMetrics`
  deleted; the module is relabelled as commercial analytics.

`lib/compliance/dac7-threshold.ts` is an architecturally frozen certified module
(`validate:verdiencheck-architecture` enforces it), so the fee maths is
duplicated rather than shared. A fixture proves the two implementations agree
across 60 amount/rate combinations, so they cannot drift.

---

## 5. DEFECTS FOUND

**Fixed during this phase — fee over-release on multi-row refunds.**
The first implementation capped each refund's commission release against the
sale individually, so two refund rows on one sale could release more commission
than was ever charged. Caught by running the loader against live data: the only
production seller with transactions has a 100c leg carrying 215c of refunds
across multiple rows, which produced 647c of net fees instead of 657c. Releases
are now capped cumulatively per leg, in refund-date order.

**Pre-existing, disclosed not hidden — refund exceeds seller leg.**
That same production row records more refund than the seller's consideration,
most likely because the refund was booked against the buyer total including
shipping and surcharge. The derivation reports it as `REFUND_EXCEEDS_SALE` and
marks the year `DATA_INCONSISTENCY` rather than showing a confident total. It
needs a data investigation, not a code change.

**Pre-existing, unrelated** — three type errors in
`app/api/seller/dashboard/stats/route.ts` (`getStatsForPeriod`) are present on
`HEAD` and untouched by this phase.

---

## 6. PERFORMANCE

Three queries per seller-year: transactions (cursor-paged, 500/page, indexed on
`sellerId`), their refunds via `include`, and HC exposures. No N+1. Measured
241 ms for the live seller. The `OR` on `Refund.some` widens the transaction
scan to pull cross-year refunds; that is the cost of not letting a later refund
rewrite a closed year.

---

## 7. EXPLICITLY NOT DONE

Per the brief: no ledger table, no migration, no receipt or expense tables, no
upload changes, no VAT, no external revenue, no tax deductibility. Platform fee
is exposed as a financial fact ("HomeCheff charged €X"), never as a deduction.
`VERDIENCHECK_PERSISTENCE_ENABLED` and `VERDIENCHECK_RECEIPT_VAULT_ENABLED`
remain false with no implementation behind them.
