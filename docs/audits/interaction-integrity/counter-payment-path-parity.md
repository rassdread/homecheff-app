# Counter proposal payment-path parity

**Main before:** `6a31fcfea86156e883b86ba24995ac48db20421c`  
**Production before:** `dpl_GSWAaE1ummGCv39Q9zwzKTqdrnsU`

## Root cause (proven)

**H = E + C** (not listing-price eligibility):

1. `CounterProposalForm` never passed `product` into `ProposalFieldsSection`.
2. `showPaymentPath = showMoneyField && Boolean(product)` → **zero payment-path buttons**.
3. Summary still treated money settlements as needing a path → submit hit server `paymentPathRequired` (“Kies een betaalwijze.”).
4. `sellerPaymentsReady` / `canProposalHomeCheffCheckout` were unused on counter because product context was missing.

Create flow already loaded product via conversation `contextHeader` and reused `canProposalHomeCheffCheckout` (negotiated amount, not listing price).

## Role model

`counterProposal` keeps `parent.sellerId` / `parent.buyerId` (product seller = recipient of money). `createdById` only flips turn. Deal UX payer = `buyerId` via `isHomecheffCheckoutPayer`.

## Fix

- Counter loads product (conversation header → product API fallback) and passes it to fields + readiness.
- Client requires payment path for money legs with visible reason.
- Summary: Afspraak / Gelddeel / Ruildeel / Betaling gelddeel (settlement ≠ payment path).

## Freeze

No Stripe / Connect / feed / LEGAL / TRUST / barter taxonomy changes.
