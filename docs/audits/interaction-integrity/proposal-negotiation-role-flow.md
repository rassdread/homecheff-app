# Proposal negotiation / accept-counter-pay role integrity

**Before:** `766259db` / `dpl_6igfDLon1dW9ji41Y5E6nenUPT8F`

## Screenshot case (DB)

Proposal `da33d3d8…` Design Studio €2:

- status **ACCEPTED**
- Agreement exists; `acceptedById` = **seller**
- CommunityOrder OPEN; `checkoutOrderId` null
- Not auto-accept on create (accept ~46s later)

Root causes: **D** actor-blind payment CTA (+ **C** seller should see waiting copy). Accept/counter/reject existed for PENDING recipients; this deal was past that.

## Fix

- `isHomecheffCheckoutPayer` + `WAIT_FOR_PAYMENT` in `resolveDealUxState`
- DealCard / ProfileDealCard pass `currentUserId`
- PENDING recipient: “Voorstel ontvangen”; sender: waiting copy
- Production €2 deal **not** mutated

## Freeze

No Stripe / Connect / feed / LEGAL / TRUST changes.
