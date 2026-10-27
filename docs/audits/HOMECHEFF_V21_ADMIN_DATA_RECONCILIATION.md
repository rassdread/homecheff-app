# HomeCheff V21 admin data reconciliation

The preview database URL was not available in this worktree. No production database was queried. Displayed values were therefore not compared with an independent database read in this run.

| Name | Definition | Source | Match |
| --- | --- | --- | --- |
| Users | Non-deleted `User` rows | `GET /api/admin/center/summary` | NOT_COMPARED |
| Verified users | `emailVerified` is set and the account is not deleted | same | NOT_COMPARED |
| Administrators | Role `ADMIN` or `SUPERADMIN`, not deleted | same | NOT_COMPARED |
| Paid orders | V20 paid-marketplace filter, current Stripe mode | `paidMarketplaceOrderWhere` | NOT_COMPARED |
| Gross merchandise | Sum of `Order.totalAmount` for those orders | `sumCurrentModeGrossCents` | NOT_COMPARED |
| Seller transfers | Sum of `Payout.amountCents` whose `providerRef` starts with `tr_` | `isSuccessfulTransferRef` | NOT_COMPARED |
| Refund records | `Refund` row count, not a computed money total | `prisma.refund.count` | NOT_COMPARED |
| Delivery profiles | `DeliveryProfile` where `isBlocked` is false | existing delivery rule | NOT_COMPARED |
| Commercial affiliates | `Affiliate.populationClass = COMMERCIAL` | Growth section | NOT_COMPARED |
| Promotions | `PromoCode` row count | Growth section | NOT_COMPARED |
| Growth collected revenue | No growth cash ledger is queried | Returned as null | UNAVAILABLE |
| Studio projects | `WorkspaceContent` count | Studio section | NOT_COMPARED |
| Generation jobs | `MarketplaceVideoJob` grouped by status | Studio section | NOT_COMPARED |
| Studio provider cost | No ledger | Returned as null | UNAVAILABLE |
| Studio customer revenue | No ledger | Returned as null | UNAVAILABLE |

Gross merchandise is not labeled as platform profit. A test-mode Stripe key makes the summary say the amounts are not live revenue. Platform fee rates were not changed.
