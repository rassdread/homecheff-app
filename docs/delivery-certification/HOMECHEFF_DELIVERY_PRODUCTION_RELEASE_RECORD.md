# HomeCheff Delivery production release record

Date: 2026-10-26  
Repository: rassdread/homecheff-app  
Branch: `fix/delivery-financial-blockers`  
Production application: https://homecheff.eu

## Status

Delivery code is remediated locally. It is not deployed. Customer-facing Delivery stays disabled.

| Item | State |
| --- | --- |
| Gate A | APPROVED for `490945c39fc92a7139eac05f981828cab68a930c` |
| Gate B | PASS. Five migrations applied on 2026-10-26. |
| Production Delivery flag | VERIFIED false on `/api/delivery/alignment-flags` after the migration |
| Production deployment of `490945c3` | NOT_STARTED |
| Current production deployment | `dpl_4XmVR5L2r631aVsPS1XQncQ7VJzL`, project `homecheff-app`, domains `homecheff.eu` and `homecheff.nl`, commit `4ee318ae1fbd01b1e77ccbbec9b5b672553174e2` on `main`, state READY |
| Production database | MIGRATED. Endpoint `ep-summer-darkness-a2l0745u`, database `neondb`, Neon project `snowy-breeze-08059562` (`app homecheff`), branch `br-fragrant-frost-a2sm13lm` named `production`. Vercel production `DATABASE_URL` uses the pooler on that endpoint. `DIRECT_URL` uses the direct host. Preview endpoint `ep-green-wind-a2cspmqw` is a different branch. |
| Production Stripe | Live key prefix confirmed. No Stripe configuration was changed. |
| Production Google Maps | NOT_STARTED |
| Production smoke test | NOT_STARTED |
| Regional pilot | NOT_STARTED |

## Gate B attempt on 2026-10-26

The owner approved Gate A for `490945c39fc92a7139eac05f981828cab68a930c` and authorized only these four migrations:

1. `20261024190000_stripe_webhook_receipt`
2. `20261024220000_stripe_webhook_recovery_attempt`
3. `20261026104500_courier_stripe_identity`
4. `20261026140000_courier_transfer_obligation`

None of the four is recorded in production `_prisma_migrations`. There is no unfinished migration. Three older rows are rolled back and are not pending. `StripeWebhookReceipt`, `StripeWebhookRecoveryAttempt`, and `CourierTransferObligation` do not exist. `DeliveryProfile` does not yet have `stripeIdentityState`, `stripeIdentityReason`, or `stripeIdentityCheckedAt`.

`prisma migrate deploy` was not run. It would also apply `20261023150000_delivery_distance_semantics_version`, which is not one of the four authorized migrations. That migration only adds nullable `DeliveryProfile.distanceSemanticsVersion` with no default and no backfill. The column is absent in production. It is not a prerequisite of the four later migrations. Prisma cannot apply the later four while leaving this earlier folder pending.

The four authorized files were read. They create two empty tables, add three nullable identity columns, and create the empty obligation table with two unique indexes. They contain no `DELETE`, `DROP`, `UPDATE`, or foreign key. Existing order, payout, user, and profile rows would not be rewritten. Counts read before the stop: 36 orders, 7 payouts, 331 users, 31 delivery profiles.

Backup and point-in-time recovery were not confirmed. The production compute reports three safekeepers, which is current WAL durability, not a restore window or a retention period. The Neon project history setting was not returned by the API. The stored Neon CLI session was expired. A token refresh rotated the credential and the replacement was not retained, so that local CLI login now needs `neonctl auth` again. No production data was changed by that authentication attempt.

Marketplace checks after the stop, with no schema change: homepage 200, login 200, checkout 200, delivery flag false, unsigned webhook POST 400.

Gate C through Gate G remain not started. Delivery stays disabled. The application was not deployed.

## Gate B completed on 2026-10-26

The owner then authorized the distance-semantics migration as well, on the condition that recovery was verified first.

Neon project `snowy-breeze-08059562` has `history_retention_seconds` 21600, which is 6 hours. A timestamp one day old was rejected with `retention_window: 6h0m0s`. A non-primary branch was then created from production parent `br-fragrant-frost-a2sm13lm` at parent timestamp `2026-10-26T14:38:43Z` and parent LSN `0/904DD850`. That branch was `br-little-mouse-a2ysinhr`. It was deleted immediately, HTTP 200. The production branch was not reset.

Restore procedure: create a new non-primary branch from `br-fragrant-frost-a2sm13lm` with `parent_timestamp` inside the six-hour window. Read or recover from that branch. Do not reset the primary branch without a separate approval. The pre-migration state remains inside that window until six hours after the migration.

`prisma migrate deploy` then ran against the direct production host. It applied only these five, in order:

1. `20261023150000_delivery_distance_semantics_version`
2. `20261024190000_stripe_webhook_receipt`
3. `20261024220000_stripe_webhook_recovery_attempt`
4. `20261026104500_courier_stripe_identity`
5. `20261026140000_courier_transfer_obligation`

All five are finished and not rolled back. Applied migration rows are now 120. Failed migrations: 0.

Verified after the run:

- `StripeWebhookReceipt` exists, primary key `eventId`, index on status and updated time. Row count 0.
- `StripeWebhookRecoveryAttempt` exists, primary key, index on event and created time. Row count 0.
- `CourierTransferObligation` exists. Unique indexes on the idempotency key and on delivery order, charge, and purpose. A non-unique index covers state and lease. Row count 0. No foreign key, by design.
- `DeliveryProfile.distanceSemanticsVersion` is a nullable integer. All 31 existing profiles are null. No backfill.
- `stripeIdentityState`, `stripeIdentityReason`, and `stripeIdentityCheckedAt` exist and are nullable. The identity index exists.
- Orders 36, payouts 7, users 331, and delivery profiles 31, the same counts as immediately before the migration.

Marketplace after the migration: homepage 200, `/dorpsplein` 200, `/verkoper` 200, login 200, checkout 200. An unsigned webhook POST returns 400. Delivery flag remains false. No charge or transfer was created. The running deployment is still `dpl_4XmVR5L2r631aVsPS1XQncQ7VJzL`.

The next release step is a separate approval to deploy the Gate A application commit with Delivery left disabled. Gate C, the production Maps key, stays closed until that approval is given on its own.

## Code ready for a later deploy

The commit that contains the V6B remediation is the release candidate after it is committed. It includes the V6A obligation table and the V6B identity, webhook, and livemode fixes. `HOMECHEFF_DELIVERY_ENABLED` must stay false on production during the first deploy.

Required production environment, names only:

- `DATABASE_URL` and `DIRECT_URL` for the production Neon host
- `STRIPE_SECRET_KEY` live key, matching `event.livemode`
- `STRIPE_WEBHOOK_SECRET` for the production endpoint
- `GOOGLE_MAPS_API_KEY` server key
- `GOOGLE_MAPS_KEY_ROLE=production`
- no `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` copy of that server key
- `HOMECHEFF_WEBHOOK_RECOVERY_LIVEMODE` unset
- `HOMECHEFF_DELIVERY_ENABLED` false until Gate G

## Release order

1. Gate A accepted by the owner.
2. Gate B: backup, then apply the five authorized migrations. Delivery stays disabled. Done.
3. Deploy this commit to the production Vercel project. Delivery stays disabled.
4. Confirm marketplace home, authentication, and checkout still load.
5. Gate C: production Maps key and role. Distance pricing must fail closed until this is true.
6. Gate D: signed production webhook, one test event, receipt row with `livemode` true. Invalid signatures stay 400.
7. Gate E: operations view shows receipt health, Maps readiness, and courier obligations. Live recovery stays off.
8. Gate F: one authorized small live delivery. Exactly one obligation and one transfer. Stop on any mismatch.
9. Gate G: enable Delivery for a named regional pilot only.

If the application deploy breaks existing marketplace routes, roll back the Vercel deployment. Do not drop the new tables as that rollback. They are additive. Dropping them deletes receipt and obligation history.

## Stripe test evidence already collected

Test mode only. Destination tail `eL3ugc`. One transfer per successful obligation. A timed-out lookup created no transfer. A lost local transfer id reconciled to the original Stripe transfer.

## Activation

`PRODUCTION_DELIVERY_ENABLED = false`  
`DELIVERY_PRODUCTION_READY = false`
