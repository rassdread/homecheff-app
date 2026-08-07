# Architecture — Admin Platform Promotions

## Separation

| System | Owner | Cap | Commission |
|--------|-------|-----|------------|
| Affiliates | Affiliate user | % of commission share (80/75) | Yes |
| Admin Promotions | HomeCheff admin | 0–100% of list price | No (`affiliateId = null`) |

## Data

Reuses `PromoCode` (no duplicate table):

- Platform row: `affiliateId = null`, `appliesTo` like `PLATFORM:launch` or `PLATFORM_FIXED:<cents>`
- `discountDurationCycles` — billing months the discount applies (null = legacy forever)
- `createdByAdminId` — admin audit

## Runtime path

1. Admin creates via `POST /api/admin/promo-codes` (`requireAdminPermission`)
2. User validates via `POST /api/affiliate/validate-promo-code` → `resolveSubscriptionPromo` (shared resolver; platform + affiliate)
3. Subscribe revalidates same resolver; applies entitlement or Stripe checkout

## Key modules

- `lib/promo-codes/platform-promo-duration.ts`
- `lib/promo-codes/discount-policy.ts`
- `lib/promo-codes/resolve-subscription-promo.ts`
- `lib/promo-codes/activate-free-subscription.ts`
- `components/admin/AdminPromotionsPanel.tsx`
- `app/api/subscribe/route.ts`
