# Marketplace Barter Readiness — Phase 4A Audit

**Date:** 2026-07-06  
**Scope:** Future barter/matching architecture readiness — no implementation

---

## Current state

| Layer | Barter support | Status |
|-------|----------------|--------|
| Prisma `BarterOpenness` | `MONEY`, `MONEY_AND_BARTER`, `BARTER_ONLY` | Schema ready |
| Taxonomy `allowedAsAcceptedValue` | Per-item flags | Registry ready |
| Tile price line | Barter openness display | T1 implemented |
| Preview accepted values | Taxonomy badges (max 6) | T3 implemented |
| Value exchange contracts | Main categories + mapping | **4A added** |
| Barter settlement engine | — | **Not built** |
| Matching / recommendations | — | **Not built** |

---

## Phase 4A deliverables (readiness)

| Contract | File | Purpose |
|----------|------|---------|
| Main categories (8) | `main-categories.ts` | Icon taxonomy for offers + acceptance |
| Payment methods (5) | `payment-methods.ts` | Canonical settlement vocabulary |
| Taxonomy map | `category-taxonomy-map.ts` | Subcategory → main category |
| Barter acceptance | `barter-models.ts` | Accepted category icon sets |
| Desired exchange | `barter-models.ts` | Request/barter detail model |
| Surface rules | `tile-display-rules.ts` | Tile vs preview vs detail |

---

## Future capabilities (prepared, not implemented)

### 1. Barter matching

**Input:** `BarterAcceptanceModel` on offer A + `DesiredExchangeDetail` on request B  
**Match criteria:**

- Main category overlap
- Subcategory compatibility (taxonomy id intersection)
- Geographic proximity (existing feed scope — not ranking)
- `BarterOpenness` compatibility

**Out of scope for matching:** trust tier weighting, sponsored boost, ML scoring.

### 2. Exchange recommendations

Suggest complementary listings where:

- Accepted values on A ⊆ specializations on B
- Payment method allows barter
- No circular self-trade (same `userId`)

Delivery surface: profile module or messages — **not** discovery feed inserts.

### 3. Multi-party exchanges

Architecture hook: `ValueExchangeListingContext` extended with `chainId` and `partyRole` (future).

```
A offers meal → wants garden produce
B offers tomatoes → wants design logo
C offers logo → wants meal
```

Settlement remains off-platform until dedicated engine (Phase 5+).

### 4. Community exchange chains

Neighborhood-scoped circular trade detection:

- Graph nodes = listings with barter openness
- Edges = accepted ↔ desired taxonomy compatibility
- Cap: 4 parties per chain suggestion
- Anti-gaming: no self-loops, no duplicate listings in chain

---

## Data prerequisites (Phase 4B–4F)

| Field | Storage | Status |
|-------|---------|--------|
| `acceptedSpecializations` | Product/Listing JSON | Exists |
| `barterOpenness` | Product/Listing | Exists |
| `desiredExchange` block | Request listings | **Needs API field** |
| Main category cache | Derived at read | Contract only |

---

## Forbidden in barter future work

- Feed ranking changes for barter-open listings
- Trust tier boosts for barter participants
- Discovery section reordering
- Sponsored barter placements
- Recommendation ML without explicit user opt-in

---

## Validation

```bash
npx tsx scripts/validate-value-exchange-system.ts
```

---

## Recommended phase sequence

| Phase | Focus |
|-------|-------|
| **4A** | Contracts + legend *(this audit)* |
| **4B** | Tile offer-category icon |
| **4C** | Preview accepted-category row |
| **4D** | Detail exchange + desired form |
| **4E** | Read-only barter match suggestions |
| **4F** | Multi-party chain detection (community scope) |
