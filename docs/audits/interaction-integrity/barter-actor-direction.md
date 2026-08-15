# Barter actor / direction semantics

**Main before:** `f665cfb9090530732ff4e63a343715057f9a36d7`  
**Production before:** `dpl_8EUKCKFE7CXLBmuvD2qgny3gFKow`

## Data audit (no migration)

| Field | Canonical meaning |
|-------|-------------------|
| `requestedValueTaxonomyIds` | **B** — barter/value consideration the **commercial buyer** provides for the target Product (form: “Wat bied je terug?” / seller counter: ask buyer for that consideration) |
| `acceptedValueTaxonomyIds` | Alternatives the proposer would also accept (listing-style), not the primary barter offer |

Stored data is **correct**. Screenshot bug was **presentation-only**: `proposal.card.seeksLabel` = “Vraagt terug” implied seller must give the cake.

## Fix

Actor-aware labels via `lib/proposals/proposal-barter-actor-labels.ts` on ProposalCard, DealCard, CommunityOrder, ProfileDeal, counter value-picker heading.

No proposal records mutated. No Stripe/LEGAL/TRUST/feed changes.
