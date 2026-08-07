# Remaining Warnings

1. **`maxRedemptionsPerUser`** — persisted on create; redeem-time enforcement not wired (global max is).
2. **Validate API path** — still `/api/affiliate/validate-promo-code` for backward compatibility; resolves platform codes too.
3. **Free → paid transition** — 100% entitlement sets `subscriptionValidUntil`; converting to Stripe at promo end still follows existing subscription policy / user consent (no silent charge).
4. **Live Stripe** — repeating coupon path unit-tested by contract only; staging Formal Review should exercise HALF6 / WELCOME3 end-to-end.
5. **Prisma generate** — required after migrate on each environment before deploy.
6. **No merge / deploy** from this branch until Formal Review.
