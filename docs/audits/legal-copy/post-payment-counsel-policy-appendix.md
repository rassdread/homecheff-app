# Counsel / policy remainder (post payment certification)

Technical payment certification does **not** close these items.

## P0 legal blockers (external)

None identified as blocking marketplace operation **solely** from unpaid counsel answers, provided public copy stays conservative. Do **not** claim MoR / PSD2 / VAT supplier without counsel.

## P1 policy decisions (COUNSEL_REQUIRED / POLICY_REQUIRED)

1. Precise MoR vs intermediary legal characterisation for platform Checkout + SCT  
2. PSD2 / payment-services characterisation  
3. Invoice / VAT supplier model for marketplace sales  
4. Buyer surcharge policy wording in Terms (neutral “betaalkosten” used; exact fee-pass-through policy still open)  
5. Dispute-win seller repayment policy (engine can recover; repayment-after-win not promised)  
6. Courier performed-delivery refund policy  
7. Affiliate Connect batch funding / `source_transaction`  
8. Residual “escrow” terminology in internal code/admin vs public “uitbetalingsreservering”  
9. Whether any residual FAQ “platform only” product-disclaimer language needs counsel rewrite beyond facilitation text

## P2 future optimization

- Multi-seller 2-Connect live proof (optional)  
- Affiliate Connect batch with `source_transaction`  
- Courier Stripe Transfer path if product requires it  
- Richer recipient UX states (earned / pending / payable / paid / reversed)  
- Live dispute fixture (engine ready; no live dispute created)

## Explicit non-claims

- `HOMECHEFF_IS_MOR` — forbidden without qualified counsel  
- Live historical dispute proof — not claimed  
- DAC7 full filing product — not claimed as currently live  
- Regulated escrow / derdenrekening — not claimed  
