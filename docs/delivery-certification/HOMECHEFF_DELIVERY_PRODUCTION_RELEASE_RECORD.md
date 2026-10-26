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
| Production Stripe | Live account `acct_1S1TFM2KvmKfeN9t`. Marketplace endpoint `we_1SQHOx2KvmKfeN9t0uwLGujx` verified. No endpoint, secret, or subscription was changed. |
| Production Google Maps | PASS. Dedicated Distance Matrix key `c32f15dd-cbdb-48df-9c6e-21557a1b4218`. Role `production`. |
| Gate D | PASS. One live `coupon.created` receipt, duplicate skipped, invalid signature rejected. |
| Gate E | BLOCKED. The operations API and its server-side guards are in place, and live recovery is off. No authorized administrator session was available, so the production view was not opened. |
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
6. Gate D: signed production webhook, one non-financial live event, receipt row with `livemode` true. Done. Invalid signatures stay 400.
7. Gate E: operations view shows receipt health, Maps readiness, and courier obligations. Live recovery stays off. Blocked until an existing superadmin opens the view. The refund subscription gap is a Gate F blocker.
8. Gate F: one authorized small live delivery. Exactly one obligation and one transfer. Stop on any mismatch.
9. Gate G: enable Delivery for a named regional pilot only.

If the application deploy breaks existing marketplace routes, roll back the Vercel deployment. Do not drop the new tables as that rollback. They are additive. Dropping them deletes receipt and obligation history.

## Gate D completed on 2026-10-26

The owner authorized one signed, non-financial live webhook. The live account is `acct_1S1TFM2KvmKfeN9t`. The deployed route is `POST /api/stripe/webhook`. The matching live endpoint is `we_1SQHOx2KvmKfeN9t0uwLGujx` at `https://homecheff.eu/api/stripe/webhook`, status enabled. A separate endpoint points at `growth.homecheff.eu` and was not used. The production signing secret is present and starts with the Stripe webhook prefix. It was not replaced. `HOMECHEFF_WEBHOOK_RECOVERY_LIVEMODE` is unset. Delivery stays disabled.

`customer.created` is not in the marketplace subscription, and subscriptions were not edited. The safe subscribed type is `coupon.created`. The handler does not bill, transfer, or create an order for that type. It stores a receipt and returns 200.

One unused coupon, `hc_gate_d_cf41694d`, was created in live mode. It is 1 cent, once, maximum one redemption, and it expires at `2026-10-26T16:49:40Z`. It had zero redemptions. Stripe event `evt_1UUqr92KvmKfeN9tT4zB4C6V`, type `coupon.created`, livemode true, was created at `2026-10-26T16:34:43Z`. Stripe reported no pending deliveries. The receipt row is the only row in `StripeWebhookReceipt`: status `PROCESSED`, HTTP 200, livemode true, attempt count 1, received `2026-10-26T16:34:44.395Z`. No recovery attempt was written.

The same event was resent once through Stripe's event retry to that endpoint. The receipt stayed one row, attempt count 1, and the update time did not move. A processed duplicate is skipped. Isolated receipt tests passed, 6 of 6. An unsigned-looking request with signature `t=1,v1=deadbeef` returned 400 `Invalid signature` and added no row.

After the test: charges 0, payment intents 0, transfers 0, refunds 0, payouts 0 in that window. Orders stayed 36. Delivery orders stayed 4. Homepage, marketplace square, seller page, login, and checkout returned 200. The delivery flag stayed false.

The marketplace endpoint subscribes to checkout, payment intent, transfer, payout, balance, account, and coupon events. It does not subscribe to `charge.refunded`. That event is on the growth endpoint. The subscription list was not changed.

## Gate E on 2026-10-26

The owner authorized inspection of production operations and monitoring. Delivery stayed disabled. No charge, transfer, refund, payout, order, role change, migration, Stripe change, Google change, or live recovery was made.

The operations surface is `GET /api/admin/delivery/operations`. There is no separate page that renders this payload. It requires `canViewDeliveryDetails`. A superadmin passes that check. An administrator without that permission is denied. `POST /api/admin/delivery/operations/recover` requires a superadmin, and live recovery runs only when `HOMECHEFF_WEBHOOK_RECOVERY_LIVEMODE` is exactly `enabled`. That variable is absent in production. The route was not called with an administrator session.

An unauthenticated GET of the operations route returned 401 `Unauthorized`. An unauthenticated POST of the recovery route, naming the Gate D event, also returned 401. `StripeWebhookRecoveryAttempt` stayed at 0 rows, so that denied request did not record or replay anything. The browser was not logged in and returned the same 401. No password was entered and no user was impersonated. Three existing users have role `SUPERADMIN`, and all three have `canViewDeliveryDetails`. No user has role `ADMIN`. Authenticated non-admin and non-superadmin requests were not sent. The denial is server-side in `getPlatformAdmin`, before the queries.

Read-only production data, endpoint `ep-summer-darkness-a2l0745u`, database `neondb`:

- `StripeWebhookReceipt` has one row: `evt_1UUqr92KvmKfeN9tT4zB4C6V`, `coupon.created`, livemode true, `PROCESSED`, HTTP 200, attempt count 1. It was not reprocessed.
- Recovery attempts: 0.
- `CourierTransferObligation`: 0. That is zero records, confirmed by a successful count. The operations response lists only `UNKNOWN`, `FAILED`, `REQUIRES_REVIEW`, and `PROCESSING`. A thrown obligation query is returned as an empty list, so a query failure is not distinguished from zero obligations. Receipt-store failure is distinguished: the response sets `webhookReceiptStoreReady` false and alert `WEBHOOK_RECEIPT_STORE_UNAVAILABLE`.
- Delivery orders: 2 `CANCELLED`, 2 `DELIVERED`. Orders: 36. The operations response does not include delivery-order status counts or a list of unassigned paid orders.
- The obligation record, when one exists, stores the delivery order, charge, transfer id, amount, currency, state, and timestamps. Once `stripeCreateAttemptedAt` is set, settlement does not create another transfer. A lookup failure or a changed destination becomes `REQUIRES_REVIEW`.

The response alerts are labels inside that JSON. They do not page anyone. The repository has no Sentry or other alerting client. Vercel production logs for the six hours ending `2026-10-26T17:28Z` can be queried. In that window there were no runtime logs for the delivery or webhook routes. Request logs show the webhook returning 200 twice and 400 five times, and `/api/distance` returning 200 four times and 400 once. The only HTTP 500s were six calls to `/api/cron/schedule-shift-notifications`. Error-level runtime lines were Node `url.parse` deprecation warnings on `/api/users/online-status`. Manual inspection of Vercel logs and the operations JSON is available. Automated alerting is not configured. Manual review is enough for one watched payment. It is not automated monitoring for a pilot.

Marketplace refund handling is implemented on `charge.refunded` in the marketplace webhook route. It reverses affiliate commission when an order can be resolved, and `observeStandaloneChargeRefund` reconciles a standalone delivery refund, including a courier-transfer reversal when a recovery client is supplied. The marketplace endpoint does not subscribe to `charge.refunded`. The growth endpoint does, at a different URL, and this repository has no handler showing that growth updates marketplace orders or courier obligations. No other subscribed marketplace event performs that refund work. A missing subscription is a financial-correctness risk for both marketplace commission reversal and delivery courier clawback. It is a Gate F blocker. Subscriptions were not changed and no refund was created.

Production deployment remains `dpl_4RUE5T9gRx8XDPmeAS2LhcZqrg4P`, commit `ca492a89385c064875f63ac4d5ef9a83d4c7293f`, READY and aliased. Stripe live account remains `acct_1S1TFM2KvmKfeN9t`. Homepage, `/dorpsplein`, `/verkoper`, `/login`, and `/checkout` returned 200. An unsigned webhook POST returned 400. `/api/delivery/alignment-flags` still reports `homeCheffDeliveryEnabled` false.

Isolated tests for recovery refusal, in-flight duplicate protection, receipt fail-closed behavior, and operations alert classification passed: 10 of 10. Live recovery was not executed.

Gate E is blocked until an existing superadmin opens `https://homecheff.eu/api/admin/delivery/operations` and the response shows one processed receipt, no unresolved receipts, no obligations, `livemodeRecoveryEnabled` false, and Maps payable. Do not POST the recovery route. Gate F also stays closed until the `charge.refunded` gap is fixed or explicitly accepted. Delivery is not operationally ready for a real payment.

## Stripe test evidence already collected

Test mode only. Destination tail `eL3ugc`. One transfer per successful obligation. A timed-out lookup created no transfer. A lost local transfer id reconciled to the original Stripe transfer.

## Activation

`PRODUCTION_DELIVERY_ENABLED = false`  
`DELIVERY_PRODUCTION_READY = false`
