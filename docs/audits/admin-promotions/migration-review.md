# Migration Review

## Existing

`20260807111728_promo_code_platform_duration` — additive nullable columns on `PromoCode`.

## New

`20260807120000_promo_code_redemption` — creates `PromoCodeRedemption` table + indexes + FKs.

- Additive / non-destructive
- Does not delete promo data
- Safe to leave in place on rollback of app code

## Rollback

Drop table `PromoCodeRedemption` only if no production redemptions must be retained; prefer keep table and disable codes.
