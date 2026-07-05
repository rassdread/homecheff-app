# acceptedSpecializations — future reuse

`Product.acceptedSpecializations` stores canonical taxonomy ids for values a seller is willing to accept alongside or instead of money.

**Slice 4 (current):** optional form field + read-only badges on cards and detail. No checkout, barter, or proposal logic.

**Planned consumers (not implemented yet):**

- **Barter** — match complementary `specializations` ↔ `acceptedSpecializations`
- **Proposal system** — buyers propose items/services from accepted taxonomy
- **Alternative payment** — non-Stripe settlement flows
- **Matching engine** — discovery filters (“accepts tomatoes”)
- **Delivery marketplace** — service exchange routing

All labels and icons come from `lib/marketplace/taxonomy.ts`; normalize with `normalizeAcceptedTaxonomyIds()`.
