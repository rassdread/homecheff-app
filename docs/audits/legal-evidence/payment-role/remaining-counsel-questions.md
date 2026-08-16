# Remaining counsel questions (post payment certification + copy alignment)

Updated: 2026-08-16 — after `HOMECHEFF_MULTI_RECIPIENT_SETTLEMENT_PRODUCTION_READY` and post-payment legal/copy pass (Terms 1.2).

## Still genuine legal (not eliminated by code or copy alone)

1. Civil-law seller / MoR of underlying goods vs platform settlement account  
2. PSD2 / payment-services characterisation  
3. Invoice / VAT supplier identity for marketplace sales  
4. Buyer surcharge policy in Terms (neutral “betaalkosten” shipped; pass-through policy open)  
5. Dispute-win seller repayment policy  
6. Courier performed-delivery refund policy  
7. Affiliate Connect batch / `source_transaction` funding model for live Connect payouts  

## Narrowed by technical certification (still not legal conclusions)

| Topic | Technical status |
|---|---|
| SCT without on_behalf_of | PROVEN |
| Who creates Checkout | PROVEN (HomeCheff) |
| Who receives charge | PROVEN (platform) |
| Seller Connect settlement + refund reversal | LIVE PROVEN |
| Dispute recovery engine | PRODUCTION_READY (no live dispute) |
| Affiliate funded from platform fee | PROVEN in waterfall |
| Courier Stripe Transfer | Ledger-only today |

## Public copy actions completed (do not reopen as architecture)

| Former risk | Copy result |
|---|---|
| Terms “geen partij” absolute | Replaced with facilitation + counsel-safe qualifier (Terms 1.2) |
| “Stripe-kosten” surcharge label | → “Transactiekosten” / “Betaalkosten” |
| Public “escrow” / derdenrekening | → gereserveerd voor uitbetaling; not regulated escrow |
| DAC7 “we already file” | → collect/report when required |

## Do not invent

`HOMECHEFF_IS_MOR` — forbidden without qualified counsel.
