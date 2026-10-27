# HomeCheff V20 admin data reconciliation

These comparisons are definitions, not a production database write. Production counts were not queried in this pass. The V19 read-only baseline remains the comparison point until a new read-only check is recorded.

| Metric | Previous admin value | Corrected definition |
| --- | --- | --- |
| Marketplace order count | Every order with a Checkout Session except `SUB-` | Same sessions, but only `CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, and only the current Stripe mode |
| Marketplace gross | Sum of those order totals, including refunded orders | Sum of the corrected set, in cents. Refunded and cancelled orders are excluded. This is buyer gross, not platform earnings |
| Payout total | Payouts whose transaction points at a current-mode session, including `failed_` refs | Those payouts only when `providerRef` starts with `tr_` |
| Delivery profiles | Every DeliveryProfile, labeled as online | DeliveryProfile rows with `isBlocked = false` |
| User role | One of Admin, seller, or buyer from `User.role` | Capability labels from orders, SellerProfile, DeliveryProfile, commercial Affiliate, and Connect onboarding |
| Promotion usage | `redemptionCount` and max, with no edit | Active redemptions are `RESERVED` plus `CONFIRMED`. Remaining is max minus that count, or unlimited |

No preview rows were updated to force a match. The user list total is `prisma.user.count` on the same filter as the page.
