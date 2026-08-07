# Post-Promotion Behaviour

## Field

`PromoCode.postPromotionAction` — `CONTINUE` (default) | `END`  
Snapshotted on `PromoCodeRedemption.postPromotionAction` at reserve time.

## Options

| Action | Meaning |
|--------|---------|
| CONTINUE | After promo months, subscription continues at list price (with consent) |
| END | After promo months, entitlement/subscription ends; no further charge |

## Lifecycle routing (`planPromoLifecycle`)

| Case | Path |
|------|------|
| 100% + CONTINUE + timed | Stripe checkout + `trial_period_days` → paid list price |
| 100% + END (+ timed) | Free entitlement; ends at promo window |
| % discount + CONTINUE + timed | Catalog price + repeating coupon |
| % discount + END + timed | Repeating coupon + `subscription_data.cancel_at` |

Server quote exposes `postPromotionAction`, `resumesAtListPrice`, `endsAutomatically`.
