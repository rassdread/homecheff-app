# Rollback Plan

1. Revert app commits on feature branch / do not merge.
2. If migration applied: keep `PromoCodeRedemption` (safe) or:

```sql
DROP TABLE IF EXISTS "PromoCodeRedemption";
```

3. Platform duration columns may remain (nullable).
4. Disable platform codes via `status = DISABLED` as operational rollback.
5. Affiliate paths unaffected.
