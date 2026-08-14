# LEGAL-2 — Forensic baseline + design

**Main before:** `6c91cb1b`  
**Production before (at start):** `dpl_2z2d45QCRkzJ6auamX19cNdb1hq8` (homecheff.eu; LEGAL-1 lineage)

## Food models

- **Orderable food:** `Product` (`CHEFF` / `marketplaceCategory=CREATE` prepared specializations)
- **Dish:** inspiration twin / recipe media — **not** cart-purchasable
- **Ingredients:** `Dish.ingredients String[]` only; free text ≠ allergen declaration
- **Prior allergen code:** feed filter-registry stub only; no DB field

## Canonical owner

**`Product.allergens` + `Product.allergensConfirmedAt`**

- `allergensConfirmedAt == null` → **UNKNOWN** (legacy default)
- confirmed + `allergens=[]` → none of the 14
- confirmed + ids → present

## Applicability

| Case | Rule |
|------|------|
| Prepared CREATE / CHEFF meal/baking/… | REQUIRED |
| GROW whole produce | NOT_APPLICABLE |
| CREATE craft (jewelry/…) | NOT_APPLICABLE |
| Services / DESIGN | NOT_APPLICABLE |
| Ambiguous CREATE/CHEFF | treat as REQUIRED |

## Transaction gates

Checkout (`/api/checkout`) + proposal accept. Browse/feed unaffected.

## TRUST-1

Design-only — see `docs/audits/trust-1-community-marketplace-integrity-design.md`
