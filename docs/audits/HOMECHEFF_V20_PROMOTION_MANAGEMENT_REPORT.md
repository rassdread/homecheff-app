# HomeCheff V20 promotion management

Subscription promotions are `PromoCode` rows. Redemption is enforced in the database with `SELECT … FOR UPDATE` and counts of `RESERVED` and `CONFIRMED` rows. `null` max redemptions means unlimited.

There is no Stripe promotion-code id on `PromoCode`. A checkout `Coupon` is a different record and is not given a new Stripe code by this edit. The admin response reports `stripeSync: LOCAL_AUTHORITATIVE`. The local maximum is the maximum that redemption enforces. This avoids a local cap of 10 beside an unlimited Stripe code.

## Edit

`PATCH /api/admin/promo-codes/{id}` accepts `maxRedemptions` (`number` or `null`) and `endsAt`. A reason is required. Discount percent, duration, code, and `appliesTo` are rejected if the request tries to send them. Existing redemptions and subscriptions are not rewritten.

The new maximum must be greater than or equal to the number of reserved and confirmed redemptions. A limit of 7 is rejected when 8 uses already exist. Empty or `null` returns the promotion to unlimited. Raising 10 to 20 and lowering 20 to 15 are allowed when completed uses are not above the new number.

The promotions screen has a Limiet action. It asks for a reason and confirms that the discount terms stay the same.

## Tests

`lib/promo-codes/promo-limit-update.test.ts` covers unlimited to 10, 10 to 20, 20 to 15, finite back to unlimited, a limit below the used count, and the last remaining use. A live Stripe coupon was not created, because this promotion type is not a Stripe coupon.
