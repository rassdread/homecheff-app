# Exchange Match Types — Audit

**Phase:** 4D  
**Date:** 2026-07-06

---

## Canonical types

| ID | Priority | Description |
|----|----------|-------------|
| `MULTI_MATCH` | 100 | Two or more dimensions align |
| `DIRECT_MATCH` | 90 | A offers what B explicitly wants |
| `DESIRED_EXCHANGE_MATCH` | 85 | Wanted item taxonomy overlap |
| `SUBCATEGORY_MATCH` | 70 | Shared taxonomy ids |
| `CATEGORY_MATCH` | 50 | Shared main category icons |

---

## Dimensions → type

| Dimensions present | Resolved type |
|--------------------|---------------|
| ≥ 2 of any | `MULTI_MATCH` |
| `direct_offer_wants` only | `DIRECT_MATCH` |
| `desired_exchange_overlap` only | `DESIRED_EXCHANGE_MATCH` |
| `subcategory_overlap` only | `SUBCATEGORY_MATCH` |
| `category_overlap` only | `CATEGORY_MATCH` |

---

## Examples

### DIRECT_MATCH

- **A offers:** 🔧 `practical.repair`
- **B wants:** 🌱 `grow.basil` *(no match)*
- **B wants:** 🔧 repair help *(via desired on different listing)*

When B's `desiredExchanges` includes a subcategory A offers → `DIRECT_MATCH`.

### CATEGORY_MATCH

- A accepts 🍳 HomeCheff
- B offers 🍳 `create.meal`
- Shared main category `HOME_CHEFF`

### MULTI_MATCH

- Direct offer/want on `grow.basil`
- Plus mutual barter acceptance
- Plus category overlap

---

## Suppression

Matches resolve to type but `score = 0` when:

- `same_listing`
- `same_user`
- `ineligible` (inactive, blocked, expired, invalid barter)

---

## Not used for

- Feed ranking
- Discovery section ordering
- Sponsored placement

---

## Code

`lib/marketplace/exchange/exchange-match-types.ts`
