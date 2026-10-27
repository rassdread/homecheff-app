# HomeCheff V20 admin audit

Source: `fix/marketplace-payment-idempotency-v18` at `4186b7bc`.
Repair branch: `fix/financial-recovery-admin-alignment-v20`.

Admin navigation is the Founder Control Center in `lib/founder-control-center/navigation.ts`. Existing tabs were kept. No public page was redesigned.

| Section | Route | Data source | Status |
| --- | --- | --- | --- |
| Command Center | `/admin?tab=command-center` | Existing command-center API | Audited, unchanged |
| Pulse | `/admin?tab=overview` | `app/admin/page.tsx` | Repaired counters |
| Users | `/admin?tab=users` | `GET /api/admin/users` | Repaired classification, search, pagination |
| User relationships | `GET /api/admin/users/[id]/overview` | User, SellerProfile, DeliveryProfile, Affiliate, BusinessSubscription, orders | Added |
| Messages | `/admin?tab=messages` | Existing messages API | Audited, unchanged |
| Sellers | `/admin?tab=sellers` | `GET /api/admin/sellers` | Audited. Seller revenue there is still a separate gross sum |
| Products | `/admin?tab=products` | Product rows, `isActive`, `integrityStatus`, payment flags | Audited. Contact-only is not treated as a failed payment |
| Orders | `/admin?tab=orders` | Order rows | Audited, unchanged |
| Finance | `/admin?tab=financial` | `GET /api/admin/financial` | Repaired paid gross and successful transfers |
| Refunds | `/api/admin/refunds` | Refund settlement engine | Stock rule added for full unfulfilled refunds |
| Seller transfer recovery | `POST /api/admin/orders/[orderId]/recover-seller-transfer` | Payout plus Stripe test transfer list | Added. Test mode only |
| Delivery | `/admin?tab=delivery` | DeliveryProfile | Repaired label. Verification is not Stripe Connect |
| Live map | `/admin?tab=live-locations` | Courier location | Audited, unchanged. Public Delivery stays off |
| Affiliates | `/admin?tab=affiliates` | Affiliate, `populationClass` | Filter uses `COMMERCIAL` only |
| Promotions | `/admin?tab=promotions` | PromoCode | Limit edit added |
| HC campaigns | `/admin?tab=hc-campaigns` | Existing campaign records | Audited, unchanged |
| Growth funnel | `/admin?tab=opportunity-funnel` | Existing funnel | Audited, unchanged |
| Studio | Studio routes outside this admin shell | Existing Studio records | Audited, no metric invented |
| Disputes | `/admin?tab=disputes` | Existing dispute API | Audited, unchanged |
| Moderation | `/admin?tab=moderation` | Integrity queue | Audited, unchanged |
| Analytics | `/admin?tab=analytics` | Existing analytics | Not recounted in this pass |
| Subscriptions | BusinessSubscription | `active` and `trialing`, plus uppercase copies | Used for the business filter |
| Stripe Connect | User connect fields and existing reset route | Pointer is not cleared from a missing livemode | Preserved |
| Settings, audit, admin access | Existing tabs | AdminAction | Promotion and transfer recovery write audit rows |

## Classification rules

These are not mutually exclusive.

- Buyer: at least one marketplace order.
- Private seller: a SellerProfile that is not a business seller.
- Business seller: SellerProfile with KvK or `SELF_DECLARED_PROFESSIONAL`.
- Delivery partner: a DeliveryProfile row. A registration-page visit is not enough.
- Affiliate: `Affiliate.populationClass = COMMERCIAL`.
- Administrator: role `ADMIN` or `SUPERADMIN`.
- Connect ready: a Connect account id and `stripeConnectOnboardingCompleted`. This is not identity verification and not courier approval.
- Subscribed business: BusinessSubscription status `active` or `trialing`.

## Dashboard definitions that changed

- Paid orders and gross marketplace volume: status `CONFIRMED`, `PROCESSING`, `SHIPPED`, or `DELIVERED`, with a Checkout Session, excluding `SUB-` orders, excluding refunded and cancelled orders, and only the current Stripe mode. The amount is buyer gross in cents, not platform profit.
- Payout total: payouts whose `providerRef` starts with `tr_`. `failed_` rows are not completed payouts.
- Delivery tile: DeliveryProfile rows that are not blocked. The previous subtitle said they were online.

## Security

User list and overview still require an admin session. A stored `canViewUserDetails = false` denies the overview. The overview does not return bank details, date of birth, identity documents, or Stripe secrets. The recovery route rejects `sk_live_` keys.
