# HomeCheff V21 production release readiness

PRODUCTION_RELEASE_READY = NO

FINAL_STATUS = BLOCKED_WITH_EXACT_REMAINING_ACTIONS

Production deployment and merge to `main` were not requested and were not done.

## Gates

| Gate | Result |
| --- | --- |
| Financial recovery certified on a new Stripe test payment | NO |
| Real Stripe refund certified | NO |
| Stock restoration certified on that payment | NO |
| Seller transfer recovery certified on a new transfer | NO |
| Seven preview database integration tests | NOT RERUN |
| Unified admin shell | Implemented, not signed-in certified |
| Marketplace, Growth, and Studio tabs | Implemented on the existing shell, not signed-in certified |
| Global dashboard | API implemented, values not reconciled to the database |
| Central user management | Existing users plus a section-filtered overview |
| Superadmin protection | Unit-tested decision function |
| Subadmin permissions | Unit-tested; older admin routes can still authorize by `ADMIN` role |
| Server-side authorization | Applied to refunds, transfer recovery, promotion edits, summary, overview, and capability assignment |
| Permission revocation | Decision and API implemented, not exercised against the preview database |
| Audit logging | Capability changes call `logAdminAction` |
| Promotion limit edit in the admin UI | Not signed-in certified |
| Dashboard values match the database | NOT_COMPARED |
| Authenticated preview UI | NOT COMPLETE |
| Regression | V20 financial and capability unit tests pass. A broader local run had 5 failures in unrelated source-content tests. |
| TypeScript | Ratchet passed: 699 current, 767 baseline, 0 new. Baseline was not shrunk. |
| Local preview build | Failed at the existing 4096 MB heap during `next build`. Heap was not raised. |
| Production unchanged | Required |
| Public Delivery | Remains off. Gate F was not executed. |

## Remaining actions

1. Obtain the isolated preview database URL in the certification environment and rerun the seven checkout integration tests.
2. Reach the preview with an authorized session without making the deployment public, create synthetic administrators only in that database, and complete the permission matrix in the UI and by direct API calls.
3. Complete one fresh Stripe test payment, webhook, full refund, stock restoration, idempotent replay, and the duplicate, partial, fulfilled, and concurrent cases.
4. Complete one failed-transfer recovery that lists Stripe transfers before creating, and prove the ambiguous and refunded cases do not create a second transfer.
5. Reconcile every summary number to an independent query on the preview database.
6. Close the remaining admin routes that still allow any `ADMIN` role so a scoped subadmin cannot bypass the capability catalog.
7. Run the typecheck ratchet and an isolated preview build of the final application commit.
