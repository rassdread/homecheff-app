# HomeCheff V22 admin data reconciliation

The signed-in admin dashboard was not opened. Displayed values are therefore NOT_OBSERVED. The figures below are independent read-only counts on the preview database. They are not production figures and they are not profit.

| Metric | Displayed | Database | Match | Definition |
| --- | --- | --- | --- | --- |
| Users | NOT_OBSERVED | 27 | NOT_COMPARED | `User` rows with `accountDeletedAt` null |
| Verified users | NOT_OBSERVED | 21 | NOT_COMPARED | `emailVerified` is set |
| Administrators | NOT_OBSERVED | 0 | NOT_COMPARED | Role `ADMIN` or `SUPERADMIN` |
| Business records | NOT_OBSERVED | 2 | NOT_COMPARED | `Business` rows |
| Business subscriptions | NOT_OBSERVED | 0 | NOT_COMPARED | `BusinessSubscription` rows |
| Delivery profiles | NOT_OBSERVED | 12 | NOT_COMPARED | `isBlocked` false |
| Commercial affiliates | NOT_OBSERVED | 4 | NOT_COMPARED | `populationClass` COMMERCIAL |
| Active listings | NOT_OBSERVED | 6 | NOT_COMPARED | `Product.isActive` true |
| Paid orders | NOT_OBSERVED | 4 | NOT_COMPARED | Paid statuses with a Stripe session, before the current-mode filter |
| Refund rows | NOT_OBSERVED | 1 | NOT_COMPARED | `Refund` count, not a money total |
| Payout rows | NOT_OBSERVED | 8 | NOT_COMPARED | All payout rows, including ones that are not successful transfers |
| Workspace projects | NOT_OBSERVED | 0 | NOT_COMPARED | `WorkspaceContent` |
| Generation jobs | NOT_OBSERVED | 0 | NOT_COMPARED | `MarketplaceVideoJob` |
| Growth collected revenue | NOT_OBSERVED | null | UNAVAILABLE | No separate growth cash ledger |
| Studio revenue and provider cost | NOT_OBSERVED | null | UNAVAILABLE | No studio money ledger |

Gross order value was not summed in this pass. It must not be reported as platform profit. Failed transfers were not counted as completed payouts.
