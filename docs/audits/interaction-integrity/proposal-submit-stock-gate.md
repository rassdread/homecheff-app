# Proposal submit blocker — stock gate forensic

**Before:** `cc654a8b` / `dpl_HZnFmPQ53pbA7BG9JyjEYyPmuKFx`

## Root cause (proven)

Submit button owner: `CreateProposalSheet` submit control.

Exact disable expression (BEFORE):

```ts
disabled={busy || (maxQuantity != null && maxQuantity <= 0)}
```

`maxQuantity = product.availableStock` → Design Studio `stock=0` → **silent disable**.

Same rule in `validateProposalReadiness` / server `validateProposalQuantityAgainstStock`.

Negotiated HC eligibility was unrelated (button for payment path was correctly enabled).

## Fix

- `proposalNegotiationIgnoresStockAvailability` for ON_REQUEST / VOLUNTARY / HOURLY / DAILY / service categories / digital fulfilment
- Client + server stock gate uses that policy
- Live `liveReadiness` + visible `submitBlockedReason` near submit
- FIXED stock=0 remains blocked
- Cart/checkout stock rules untouched

## Verdict path

`HOMECHEFF_PROPOSAL_SUBMIT_STOCK_GATE_VALIDATED`
