# Marketplace Exchange Matching — Phase 4D

**Status:** Foundation contracts (no UI, no ranking, no automated suggestions)  
**Last updated:** 2026-07-06  
**Builds on:** [MARKETPLACE_VALUE_EXCHANGE_SYSTEM.md](./MARKETPLACE_VALUE_EXCHANGE_SYSTEM.md), [MARKETPLACE_ICON_LEGEND.md](./MARKETPLACE_ICON_LEGEND.md)

---

## North star

The platform must understand **what a user offers**, **what they accept**, **what they want**, and **where overlap exists** — without changing discovery ranking or rolling out recommendations.

```
Listing A profile  +  Listing B profile  →  Overlap  →  Match type  →  Score  →  Signals
                                                      ↘  Exchange graph (future chains)
```

**Code:** `lib/marketplace/exchange/`  
**Validation:** `npx tsx scripts/validate-exchange-foundation.ts`

---

## Canonical exchange model

Each listing resolves to an `ExchangeListingProfile`:

| Field | Description |
|-------|-------------|
| `offer` | Main category + subcategory ids (what is offered) |
| `acceptance` | Accepted main categories + subcategories + `BarterOpenness` |
| `desiredExchanges` | Explicit wanted items + descriptions (REQUEST / barter) |

**Example:**

| Role | Content |
|------|---------|
| Offer | 🔧 `practical.repair` (Fietsreparatie) |
| Accepts | 🍳 HomeCheff · 🌱 HomeGarden |
| Wants | 🌱 Basilicum · 🌱 Oregano |

Builder: `buildExchangeListingProfile()`.

---

## Match types

| Type | When |
|------|------|
| `DIRECT_MATCH` | A offers subcategory B wants |
| `CATEGORY_MATCH` | Main category overlap |
| `SUBCATEGORY_MATCH` | Taxonomy id overlap |
| `DESIRED_EXCHANGE_MATCH` | Explicit wanted item overlap |
| `MULTI_MATCH` | Two or more dimensions |

Resolver: `resolveExchangeMatch()` · `resolvePrimaryMatchType()`.

---

## Score model

Weighted signals (0–100, **not** feed ranking):

| Signal | Weight |
|--------|--------|
| Category overlap | 22% |
| Subcategory overlap | 28% |
| Desired exchange overlap | 25% |
| Distance | 10% |
| Availability | 5% |
| Trust eligibility | 5% |
| Recency | 5% |

**Forbidden:** views, HCP, followers, props, blended ratings, sponsored boost.

---

## Eligibility

Listings must be:

- `isActive`
- `isDiscoverable`
- `not isBlocked`
- `not expired`
- Valid barter configuration when `BarterOpenness` ≠ `MONEY`

`evaluateExchangeEligibility()` · `profileIsExchangeEligible()`.

---

## Duplicate suppression

| Rule | Reason |
|------|--------|
| Same `listingId` | `same_listing` |
| Same `userId` | `same_user` |

`shouldSuppressMatchPair()` — suppressed matches score `0`.

---

## Exchange graph

Prepares future **A → B → C → D** chains:

- `ExchangeGraph` nodes = listing profiles
- `ExchangeGraph` edges = resolved matches
- `EXCHANGE_GRAPH_MAX_CHAIN_LENGTH = 4`
- `chainMatchingEnabled: false` in 4D
- `findExchangeChainPaths()` returns `[]` until Phase 4F

`buildExchangeGraphFromMatches()` · `validateExchangeGraphIntegrity()`.

---

## Signals (future UI / 4E)

| Signal | Meaning |
|--------|---------|
| `EXACT_DESIRED_MATCH` | Offer subcategory = wanted subcategory |
| `STRONG_CATEGORY_OVERLAP` | Multiple shared main categories |
| `POTENTIAL_BARTER_OPPORTUNITY` | Both barter-open with overlap |
| `MUTUAL_EXCHANGE_READINESS` | Mutual acceptance of offers |
| `FUTURE_RECOMMENDATION_READY` | Score + trust threshold met |

`deriveExchangeSignals()` — **not** surfaced in UI in 4D.

---

## Module layout

```
lib/marketplace/exchange/
  exchange-contract.ts
  exchange-match-types.ts
  exchange-match-score.ts
  exchange-overlap.ts
  exchange-graph.ts
  exchange-eligibility.ts
  exchange-signals.ts
  exchange-resolver.ts
  index.ts
```

---

## API surface (foundation)

```typescript
buildExchangeListingProfile(input) → ExchangeListingProfile
resolveExchangeMatch({ a, b }) → ResolvedExchangeMatch | null
findExchangeMatchesForListing(source, candidates) → ResolvedExchangeMatch[]
buildExchangeGraphFromMatches(profiles, matches) → ExchangeGraph
```

---

## Out of scope (4D)

- UI matching screens
- Detail page changes
- Discovery ranking changes
- Recommendation engine rollout
- Sponsored placements
- Automated barter suggestions
- Exchange chain execution

---

## Phase sequence

| Phase | Focus |
|-------|-------|
| **4D** | Contracts + resolver *(this)* |
| **4E** | Read-only match suggestions (profile/messages) |
| **4F** | Chain detection + community scope |

---

## References

- [EXCHANGE_MATCH_TYPES.md](../audits/EXCHANGE_MATCH_TYPES.md)
- [EXCHANGE_GRAPH_READINESS.md](../audits/EXCHANGE_GRAPH_READINESS.md)
- [EXCHANGE_SIGNAL_MATRIX.md](../audits/EXCHANGE_SIGNAL_MATRIX.md)
- [MARKETPLACE_BARTER_READINESS.md](../audits/MARKETPLACE_BARTER_READINESS.md)
