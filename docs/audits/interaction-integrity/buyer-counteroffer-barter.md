# Buyer counter-offer barter UX

**Product:** listing `barterOpenness` = seller preference/default — not a proposal firewall.

## Changes

- `allowedBuyerProposalSettlementModes` — always MONEY / Ruilen / Geld+ruilen / Gratis / Vrijwillig
- Seller preference hint in proposal sheet
- NL/EN chip labels
- Form order: settlement → title/desc → amount/value (+ optional photos) → payment → date → fulfilment
- Counter form uses buyer modes (fixed null→MONEY gap)
- Optional barter photos via generic upload → `proposalSummary`

## Unchanged

- Direct cart / `canListingHomeCheffCheckout` / Stripe routing / LEGAL / TRUST / feed
- No `offeredProductId` (future: pick my listing)
