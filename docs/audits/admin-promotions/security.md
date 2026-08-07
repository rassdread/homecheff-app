# Security Review

## Server authority

- Create/update/disable: `requireAdminPermission('canViewPaymentInfo')` + `logAdminAction`
- Discount % / duration / final price computed only in `resolveSubscriptionPromo` / subscribe
- Client may send code only; subscribe revalidates

## Role

- UI tab hiding is not the security boundary
- Non-admin cannot call admin promo APIs successfully
- Platform promos never use affiliate `assertDiscountWithinCap` affiliate branch for creation (actor: `admin`)

## Affiliate isolation

- Platform rows: `affiliateId = null`
- Affiliate max caps (80/75) unchanged
- No commission ledger attribution required for platform-funded discounts

## Warnings

- `maxRedemptionsPerUser` is stored but not yet enforced at redeem time (global `maxRedemptions` is)
- Validate endpoint remains under `/api/affiliate/validate-promo-code` path name for compatibility; it resolves both platform and affiliate codes
