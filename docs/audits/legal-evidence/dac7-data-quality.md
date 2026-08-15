# DAC7 — Derive Data Quality (Read-Only)

LEGAL-4A helpers exist (`lib/compliance/dac7-*`). This file rates **underlying data reliability** for future filing — **no filing engine**.

Legend: `READY_TO_DERIVE` | `PARTIAL` | `RECONCILIATION_REQUIRED`

---

## Matrix (required questions)

| # | Question | Rating | Notes |
|---|---|---|---|
| 1 | Every CAPTURED Transaction linkable to seller? | `READY_TO_DERIVE` | `Transaction.sellerId` required |
| 2 | Every paid OrderItem classifiable goods/service? | `PARTIAL` | Taxonomy maps CREATE/GROW→GOODS; services→PERSONAL_SERVICE; **DESIGN→REVIEW** |
| 3 | `amountCents` economically gross or net? | `PARTIAL` | Webhook sets Transaction `amountCents: itemTotal` (**gross item** before fee); transfer uses net payout — do not confuse |
| 4 | Platform fee always reconstructable? | `PARTIAL` | `platformFeeBps` on Transaction + webhook calc; default 1200 bps if missing historically |
| 5 | Every refund linked to original consideration? | `PARTIAL` | `Refund.transactionId` links; Order-path vs Transaction-path may need join care |
| 6 | Partial refunds allocatable to seller/item? | `RECONCILIATION_REQUIRED` | Refund is transaction-level; LEGAL-4A allocates proportionally across buckets — approximate |
| 7 | Cancelled payments excluded? | `READY_TO_DERIVE` | Derive skips PENDING/CANCELLED orders; non-CAPTURED statuses handled in refund helper |
| 8 | Failed checkouts excluded? | `READY_TO_DERIVE` | No Order without successful webhook path |
| 9 | Calendar quarter determinable? | `READY_TO_DERIVE` | From `createdAt` timestamps (UTC care → `COUNSEL` for TZ reporting rules) |
| 10 | Reporting country determinable? | `PARTIAL` | User/Business `country` often NL default; not proven per-reportable-seller package |
| 11 | MONEY_AND_BARTER money leg isolatable? | `PARTIAL` | Kind classifier exists; live money only if captured payment |
| 12 | BARTER_ONLY identifiable? | `READY_TO_DERIVE` | `barterOpenness` field + classifier |
| 13 | Free activity excludable? | `READY_TO_DERIVE` | Zero lines / VOLUNTARY without capture skipped |
| 14 | Delivery fees separable from seller consideration? | `PARTIAL` | Checkout metadata `deliveryFeeCents` + separate line; derive layer currently OrderItem-product focused — courier leg needs explicit split for filing |
| 15 | Courier earnings separately classifiable? | `PARTIAL` | Delivery payouts exist in webhook; DAC7 personal-service vs other needs counsel mapping |

## Model roles (freeze)

| Model | Role |
|---|---|
| Order + Transaction (+ Refund) | Canonical money truth |
| CommunityOrder | Deal lifecycle — **not** cash ledger |
| Payout | Transfer record — supports reconciliation, not substitute gross |

## Overall

Derive helpers: usable for **readiness**.  
Filing-grade: still **`PARTIAL` / `RECONCILIATION_REQUIRED`** on fees, partial refunds, delivery split, country, DESIGN ambiguity.
