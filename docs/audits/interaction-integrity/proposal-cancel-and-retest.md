# Proposal cancel + clean negotiation retest

**Main before:** `62673a535b38539b67cc3efdd8f4efe9ea5c5b5a`  
**Production before:** `dpl_Hp1v6kUAJnkY366soQ9dqcMtmwZi`

## Existing €2 Design Studio (before → after)

| Record | Before | After |
|--------|--------|-------|
| Proposal `da33d3d8-fde2-4579-8661-ab450c2a464c` | ACCEPTED €2 | **CANCELLED** (retained) |
| Agreement `5d7ba4a1-…` | exists | **retained** |
| CommunityOrder `463d3671-…` | OPEN unpaid | **CANCELLED** |
| Product Design Studio | stock 0 | unchanged |
| Stripe | none | no mutation |

Cancellation via `cancelCommunityOrder` (buyer party). No hard delete. No refund.

## Canonical paths

- **Pending sender withdraw:** `ProposalService.cancelProposal` → `CANCELLED` (creator only) + confirm “Voorstel intrekken”
- **Accepted unpaid:** `cancelCommunityOrder` → CO `CANCELLED` + unpaid Proposal soft-`CANCELLED`; Agreement kept
- **UI:** Profile + chat DealCard “Afspraak annuleren”; ProposalCard “Voorstel intrekken”
- **Recipient actions (NL):** Accepteren / Tegenbod doen / Weigeren

## Service retest (prod DB)

Create stayed **PENDING** → seller counter €2→€3 → parent **COUNTERED** / child **PENDING** → no Agreement until buyer accept → CO OPEN unpaid → cancelled cleanly.

Live PENDING left for seller UI: `63a5bf61-2b09-4317-b01c-f228ea903fbb`.

## Freeze

No Stripe / Connect / feed / LEGAL / TRUST / Product stock changes beyond soft status.
