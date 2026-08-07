# Per-User Enforcement

## Implementation

- Table: `PromoCodeRedemption` (promoId, userId, plan, path FREE|PAID, status, discount terms, timestamps)
- Quote: counts user active rows when `maxRedemptionsPerUser` set and `userId` known (auth)
- Subscribe: `reservePromoRedemption` re-checks under row lock

## Messages

- EN: “This promotion has already been used by this account.”
- NL: “Deze promotie is al gebruikt door dit account.”

## Example

`maxRedemptionsPerUser = 1`  
User A first → PASS; User A second → REJECT; User B first → PASS (if global allows).
