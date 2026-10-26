# HomeCheff Delivery production release record

Date: 2026-10-26  
Repository: rassdread/homecheff-app  
Branch: `fix/delivery-financial-blockers`  
Production application: https://homecheff.eu

## Status

The Gate A application is deployed. Customer-facing Delivery stays disabled.

| Item | State |
| --- | --- |
| Gate A | APPROVED for `490945c39fc92a7139eac05f981828cab68a930c` |
| Gate B | PASS. Five migrations applied on 2026-10-26. |
| Production Delivery flag | VERIFIED false on `/api/delivery/alignment-flags` after the deploy |
| Production deployment of the Gate A code | DEPLOYED as `ca492a89385c064875f63ac4d5ef9a83d4c7293f`. That commit contains `490945c3` plus the Gate B record and a build-memory fix. |
| Current production deployment | `dpl_4RUE5T9gRx8XDPmeAS2LhcZqrg4P`, project `homecheff-app`, domains `homecheff.eu`, `www.homecheff.eu`, `homecheff.nl`, and `www.homecheff.nl`, commit `ca492a89385c064875f63ac4d5ef9a83d4c7293f` on `main`, state READY. Created `2026-10-26T16:13:48Z`. Ready `2026-10-26T16:18:16Z`. Same application commit as the previous production deployment, rebuilt so the Maps environment is active. |
| Previous production deployment | `dpl_4XmVR5L2r631aVsPS1XQncQ7VJzL`, commit `4ee318ae1fbd01b1e77ccbbec9b5b672553174e2`, remains READY and is the rollback target. It was not promoted again. |
| Production database | MIGRATED. Endpoint `ep-summer-darkness-a2l0745u`, database `neondb`, Neon project `snowy-breeze-08059562` (`app homecheff`), branch `br-fragrant-frost-a2sm13lm` named `production`. Vercel production `DATABASE_URL` uses the pooler on that endpoint. `DIRECT_URL` uses the direct host. Preview endpoint `ep-green-wind-a2cspmqw` is a different branch. |
| Production Stripe | Live key prefix confirmed. No Stripe configuration was changed. |
| Production Google Maps | PASS. Dedicated Distance Matrix key `c32f15dd-cbdb-48df-9c6e-21557a1b4218`. Role `production`. |
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

The deploy itself was not part of Gate B. It was authorized afterward and is recorded below. Gate C, the production Maps key, stays closed until that approval is given on its own.

## Application deploy on 2026-10-26

The owner authorized deployment of the Gate A code to project `homecheff-app`. `main` was a fast-forward from `4ee318ae` to the release. No history was rewritten.

The first production build, `dpl_HE8AXpEnWWSZP38RXEsNf3EkDTeB`, failed because the standard 8 GB builder killed the Next.js process. Its alias was not assigned, so `homecheff.eu` stayed on `dpl_4XmVR5L2r631aVsPS1XQncQ7VJzL`. The build script now uses a 4 GB heap, and Vercel builds use one worker. That change is `ca492a89385c064875f63ac4d5ef9a83d4c7293f`.

`dpl_Hx4RMgXYA4xDYmEjEfVGhVL7LroH` is READY and serves `homecheff.eu`. The deployment URL is `homecheff-muxatuzuf-sergio-s-projects-f7b64ee1.vercel.app`. No migration ran during the build. `HOMECHEFF_DELIVERY_ENABLED` is absent, which the application reads as disabled. `HOMECHEFF_WEBHOOK_RECOVERY_LIVEMODE` is absent. Stripe remains the existing live key. `GOOGLE_MAPS_KEY_ROLE` is absent, so Distance Matrix stays closed.

Checks after the alias moved:

- Homepage, marketplace feed, seller page, login, and checkout return 200.
- The marketplace feed returned active listings from the production database.
- Login shows the email and password form. Checkout asks an anonymous visitor to log in before an order.
- `/api/auth/session` returns an empty session.
- An unsigned webhook POST returns 400, `Missing signature`.
- Standalone delivery quote returns 403, `DELIVERY_DISABLED`.
- A distance request returns `PRODUCTION_ROLE_REQUIRED` and does not produce a price.
- The delivery flag is false.
- Existing delivery orders are only `DELIVERED` or `CANCELLED`, so there is no in-flight order that can be completed into a new courier transfer.

Seller local-delivery pricing stays fail-closed until Gate C. Pickup listings and the checkout page do not depend on that key. No charge or transfer was created.

Rollback remains the previous READY deployment `dpl_4XmVR5L2r631aVsPS1XQncQ7VJzL`. It was not needed. The additive schema from Gate B stays compatible with that older application.

## Gate C completed on 2026-10-26

The owner authorized a dedicated production Distance Matrix key in Google Cloud project `homecheff-auth` (`615612462371`). Billing is enabled. The application calls the legacy Distance Matrix endpoint `maps.googleapis.com/maps/api/distancematrix/json`. That API is `distance-matrix-backend.googleapis.com`, and it was already enabled. The Routes API was not substituted.

The production key is named `HomeCheff Delivery - Production Distance Matrix`. Its identifier is `c32f15dd-cbdb-48df-9c6e-21557a1b4218`. It allows only `distance-matrix-backend.googleapis.com`. It has no IP, referrer, Android, or iOS restriction. Vercel does not provide a stable outbound address, so an IP allowlist would break the server call. The key is therefore not fully restricted: the API restriction is the control, and usage is visible in the project quota. An earlier key with the same name was deleted before it was stored in Vercel, because the CLI wrote its material into the local command log.

The shared project quota was left unchanged. The daily element quota is the Google default maximum. The per-minute project cap is 60,000 elements. The existing browser key and the general Maps key also list this API, so a lower project quota could affect them. Each successful element is billable to the existing billing account. The controlled test used two successful elements and one unroutable request.

Vercel production `GOOGLE_MAPS_API_KEY` is the new sensitive value, environment id `h0FEs6P19ukBgiEM`, production target only. The previous variable `VEExhg0uwYqkfgAR` now targets preview only, so the preview key was not replaced. `GOOGLE_MAPS_KEY_ROLE` is `production` on production only, environment id `Dudkwzm1HQmcC9io`. `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` was not changed. `HOMECHEFF_DELIVERY_ENABLED` remains absent.

The approved commit was rebuilt as `dpl_4RUE5T9gRx8XDPmeAS2LhcZqrg4P`. It serves the production domains.

Distance evidence, Amsterdam coordinates `52.379189,4.899431` to Rotterdam `51.9225,4.47917`, driving:

- Direct Google response: status `OK`, 84.1 km, 84,113 meters, 1 hour 11 minutes.
- `POST /api/distance` on `homecheff.eu`: 84.1 km and 71 minutes. A client-supplied distance of 1 km was ignored.
- Coordinates in the ocean returned `DISTANCE_MATRIX_UNAVAILABLE` and no straight-line price.

The server key was absent from the homepage HTML, the nine initial JavaScript chunks, the checked build-log page, the distance response, and the Git tree. Delivery quote still returns 403 `DELIVERY_DISABLED`. The flag is false. Homepage listings, login, seller page, and checkout still load. No Stripe object and no database row was written.

## Code deployed with Delivery disabled

The deployed commit contains the V6A obligation table and the V6B identity, webhook, and livemode fixes. `HOMECHEFF_DELIVERY_ENABLED` stays false.

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
3. Deploy this commit to the production Vercel project. Delivery stays disabled. Done.
4. Confirm marketplace home, authentication, and checkout still load. Done after Gate C.
5. Gate C: production Maps key and role. Done. Road distance works. Delivery stays disabled.
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
