# Negotiated proposal HomeCheff Checkout eligibility

**Before:** `a0580f68` / `dpl_4TBPQJyD6ynqiRcN8CuTPUvC5Wyp`

## Root cause

`canHomeCheffCheckout` for proposals required listing `priceCents > 0`, so ON_REQUEST (€0) disabled “Via HomeCheff afrekenen” even when the buyer entered a negotiated amount and the seller was Connect-ready.

## Contract

| Mode | Price basis | HC rules |
|---|---|---|
| Listing / cart FIXED | `listing.priceCents > 0` | unchanged |
| Proposal money leg | `proposal.amountCents > 0` | accept HC + Connect ready |

## Files

- `lib/proposals/proposal-homecheff-eligibility.ts` (canonical)
- product-binding / readiness / ProposalFieldsSection / conversation header
- checkout Connect check uses deal `item.priceCents` for ON_REQUEST deals
- Delete remains behind `cardActionBoundaryProps` + `data-owner-action="delete"`

## Freeze

No Stripe architecture / fee / transfer / LEGAL / TRUST / feed changes.
