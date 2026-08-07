# Rollback Plan

## Code

1. Revert commits on `feat/admin-platform-promotions` or close PR without merge.
2. If merged: revert feature commits; keep migration additive if already applied.

## Database

Migration `20260807111728_promo_code_platform_duration` only **adds** nullable columns + index:

- `name`, `discountDurationCycles`, `maxRedemptionsPerUser`, `createdByAdminId`

Rollback SQL (only if needed and no dependent writes):

```sql
DROP INDEX IF EXISTS "PromoCode_createdByAdminId_idx";
ALTER TABLE "PromoCode" DROP COLUMN IF EXISTS "createdByAdminId";
ALTER TABLE "PromoCode" DROP COLUMN IF EXISTS "maxRedemptionsPerUser";
ALTER TABLE "PromoCode" DROP COLUMN IF EXISTS "discountDurationCycles";
ALTER TABLE "PromoCode" DROP COLUMN IF EXISTS "name";
```

Prefer leaving columns in place (nullable, safe) and disabling platform codes via `status = DISABLED`.

## Affiliate system

Unaffected by rollback of Admin Promotions UI/nav; affiliate paths remain.
