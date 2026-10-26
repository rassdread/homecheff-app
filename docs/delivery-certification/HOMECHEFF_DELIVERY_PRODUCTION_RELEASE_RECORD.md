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
| Current production deployment | `dpl_GCvxauoBqD8vDzrbvVmrXNXeBbET`, project `homecheff-app`, domain `homecheff.eu`, commit `27756cd7aea9f2a8e02ae302fe896f39c8e43896`, state READY. The first build of this commit, `dpl_7N7ZRYzxM8StJqfa2KiFHQLq3s8h`, ran out of memory and was not aliased. The retry `dpl_6aRsJShDXHxskQWP5iAUQ2zNAd4U` was ready before the pilot variables existed. The current deployment is the redeploy that loads them. |
| Previous production deployment | `dpl_BSqY98RdTuvxan2d5QE48gWYkV6p`, commit `e939a4ce9356a483010a3e5535b5935f61c3ac6c`, remains READY and is the rollback target. It was not promoted again. |
| Production database | MIGRATED. Endpoint `ep-summer-darkness-a2l0745u`, database `neondb`, Neon project `snowy-breeze-08059562` (`app homecheff`), branch `br-fragrant-frost-a2sm13lm` named `production`. Vercel production `DATABASE_URL` uses the pooler on that endpoint. `DIRECT_URL` uses the direct host. Preview endpoint `ep-green-wind-a2cspmqw` is a different branch. |
| Production Stripe | Live account `acct_1S1TFM2KvmKfeN9t`. Marketplace endpoint `we_1SQHOx2KvmKfeN9t0uwLGujx` includes `charge.refunded` after Gate E. The signing secret was not rotated. |
| Production Google Maps | PASS. Dedicated Distance Matrix key `c32f15dd-cbdb-48df-9c6e-21557a1b4218`. Role `production`. |
| Gate D | PASS. One live `coupon.created` receipt, duplicate skipped, invalid signature rejected. |
| Gate E | PASS. Owner opened the operations view. Refund routing is subscribed after the handler deploy. Partial and ambiguous refunds stop for manual review. Live recovery stays off. |
| Gate F | BLOCKED. V6J is deployed. The restricted pilot is on for one buyer and one courier. No listing is approved and no quote or payment was created. |
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
7. Gate E: operations view shows receipt health, Maps readiness, and courier obligations. Live recovery stays off. Done. The owner opened the view. `charge.refunded` is now subscribed. Partial and ambiguous refunds remain manual.
8. Gate F: one authorized small live delivery. Exactly one obligation and one transfer. Stop on any mismatch. Blocked on 2026-10-26. The flag stayed false. No live payment was created.
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

The owner later opened that view. The result, and the refund remediation, are recorded in the Gate E remediation section below.

## Gate E remediation on 2026-10-26

The owner opened `GET /api/admin/delivery/operations` in an existing authenticated production session. The response was:

- `webhookReceiptStoreReady` true
- `webhookStatusCounts.PROCESSED` 1
- `unresolvedWebhookReceipts` empty
- `repeatedFailures` empty
- `staleProcessing` empty
- `recentRecoveryAttempts` empty
- `alerts` empty
- `deliveryPayoutsMissingTransfer` empty
- `courierTransferObligations` empty
- `livemodeRecoveryEnabled` false
- `maps.runtime` production, `maps.source` server, `maps.serverKeyConfigured` true, `maps.payable` true, `maps.reason` OK

That confirms the operations endpoint for that session. It does not by itself prove every other role. Unauthenticated GET and POST recovery still return 401. No account was created or impersonated. `HOMECHEFF_WEBHOOK_RECOVERY_LIVEMODE` remains unset.

The owner then authorized the refund and monitoring remediation. The handler was deployed before the subscription change.

Production deployment `dpl_4VpwGihkircr9BMc9AVQKW9vmk1C` of `e939a4ce9356a483010a3e5535b5935f61c3ac6c` failed in the Next.js build with a JavaScript heap out of memory at the existing 4096 MB limit. It was not aliased. A rebuild of the same commit, `dpl_BSqY98RdTuvxan2d5QE48gWYkV6p`, is READY and aliased to `homecheff.eu`, `www.homecheff.eu`, `homecheff.nl`, and `www.homecheff.nl`. The previous deployment `dpl_4RUE5T9gRx8XDPmeAS2LhcZqrg4P` remains the rollback target.

After that deployment was healthy, `charge.refunded` was added to marketplace endpoint `we_1SQHOx2KvmKfeN9t0uwLGujx`. The endpoint had 21 events and now has 22. The only added event is `charge.refunded`. The URL, status, and live mode are unchanged. The signing secret was not sent or rotated. The growth endpoint was read before and after and was not modified.

Marketplace refund behavior:

- A failed order lookup, or a failed commission write, returns HTTP 500 so Stripe retries. A charge with no invoice and no order, after a successful lookup, does not change a ledger.
- The same cumulative refund does not add a second reversal. A later larger refund adds only the missing cents.
- A partial refund closes the original pending or available commission and leaves a remainder row for the unpaid portion. It does not become a full reversal.
- A commission already marked paid is not replaced with a new payable row. The reversal is recorded and the Stripe affiliate transfer is not automatically clawed back. That case is manual.
- The admin refund engine and this webhook share the original ledger as the idempotency anchor, so the two paths do not reverse the same commission twice.
- The webhook does not create a customer refund. Seller transfer reversal remains in the admin refund engine. A refund created only in the Stripe Dashboard updates affiliate and delivery books and does not by itself reverse a seller transfer.

Delivery refund behavior:

- Full refund before a courier transfer: no reversal is created, and settlement refuses `SOURCE_CHARGE_REFUNDED`.
- Partial refund before a courier transfer: settlement refuses `SOURCE_CHARGE_PARTIALLY_REFUNDED` and does not create a transfer. Manual review decides the reduced amount.
- Full or partial refund after a recorded transfer: the courier share is reversed in proportion to the refund. A repeated event adopts the existing reversal. A definite Stripe failure stays outstanding. An uncertain Stripe result fails the webhook instead of being treated as settled.
- An obligation in `UNKNOWN`, `REQUIRES_REVIEW`, or `PROCESSING` without a transfer id is recorded as manual and is not reversed or paid again.
- Two different transfer ids for the same delivery fail the webhook rather than reversing one of them.
- A failed delivery-book write fails the webhook. No obligation row is deleted.

Stripe test mode used account `acct_1S6D3DRpYdPVF6LP`, not the live account. Livemode was false. Charge `ch_3UUtLXRpYdPVF6LP0RlwmCUS` for 200 cents was refunded 50 and then the remaining 150. Replaying the 50-cent refund returned the same refund `re_3UUtLXRpYdPVF6LP0Xd1eY2y`. The final `amount_refunded` was 200. A second test charge, `ch_3UUtLdRpYdPVF6LP1gGMC1ox`, funded transfer `tr_3UUtLdRpYdPVF6LP1QLgMiLA` for 100 cents. Reversal `trr_1UUtLfRpYdPVF6LPzi2XPi5i` for 40 cents replayed as the same reversal. The customer refund after that transfer is `re_3UUtLdRpYdPVF6LP1EJQo8Uy` for 120 cents. No live charge, refund, transfer, or payout was created.

Operations monitoring now returns `courierObligationStoreReady`, `recoveryAttemptStoreReady`, and `deliveryPayoutStoreReady`. A successful empty query is `[]` with ready true. A failed query is `null`, ready false, and an alert: `COURIER_OBLIGATION_STORE_UNAVAILABLE`, `RECOVERY_ATTEMPT_STORE_UNAVAILABLE`, or `DELIVERY_PAYOUT_STORE_UNAVAILABLE`. The response is not healthy in that case. Authorization still runs before the queries. No database error text is returned.

Local typecheck stayed at 2066 diagnostics, with none in the changed files. The deploy typecheck ratchet passed at 699 current, 767 baseline, and 0 new. A local Next build at the script's 4096 MB heap ran out of memory. The same source compiled locally with a 6144 MB heap and completed on the Vercel retry.

There is still no paging service. Vercel logs and this operations response are the manual monitor. That is enough for one watched payment. It is not automated monitoring for a wider pilot. The minimum alerts before broader activation are: webhook receipt store unavailable, repeated webhook failure, courier obligation store unavailable, courier transfer needing review, and a refund left in manual review.

Marketplace health after the deploy: homepage, `/dorpsplein`, `/verkoper`, login, and checkout returned 200. An unsigned webhook POST returned 400. The delivery flag remains false. No production migration ran.

Gate E passes with those manual-review limits. It does not mean every refund reverses every Connect transfer automatically. Gate F can be one controlled live delivery only while an operator watches the operations view. It is not a regional pilot, and Delivery stays disabled until that separate decision.

## Stripe test evidence already collected

Test mode only. Destination tail `eL3ugc`. One transfer per successful obligation. A timed-out lookup created no transfer. A lost local transfer id reconciled to the original Stripe transfer.

## Gate F preparation on 2026-10-26

No live charge, order, transfer, refund, or payout was created. The public flag stayed false. No code was deployed and no production setting was changed.

The existing delivery path is one system. Checkout for `DELIVERY`, `TEEN_DELIVERY`, and `LOCAL_PROVIDER` is `POST /api/checkout`, with the same gate on `POST /api/checkout/hc-only` and `POST /api/checkout/hc-mixed`. A quote is `POST /api/delivery/standalone/quote`. Booking is `POST /api/delivery/booking-requests`. Acceptance is `POST /api/delivery/orders/[orderId]/accept`. Pickup and completion are `POST /api/delivery/orders/[orderId]/update-status`. Completion calls `ensureDeliveryPayout`, which calls `settleCourierTransferObligation`. The courier share is `splitDeliveryCommission`: 88 percent and 12 percent of the delivery fee only, each rounded with `Math.round`. The product price is not part of that split. Seller settlement stays on the existing marketplace escrow path. Webhooks stay on `POST /api/stripe/webhook`. Monitoring stays on `GET /api/admin/delivery/operations`.

`evaluateDeliveryAccess` already has a restricted allowlist. It denies everyone, including an allowlisted caller, while `HOMECHEFF_DELIVERY_ENABLED` is not exactly true, 1, or yes. Production has none of the pilot variables set. A standalone quote returns 403. There is no second test checkout and no staff bypass. Using the existing pilot requires the owner to turn the flag on and set the allowlist together. That was not authorized, and turning the flag on without the allowlist would open delivery to every caller.

Read-only production data, endpoint `ep-summer-darkness-a2l0745u`:

- 31 delivery profiles. 18 are active and not blocked. The identity, payout, and transfer caches are empty on all 31, so the match query, which requires a fresh `stripeIdentityState` of `VERIFIED`, currently lists nobody.
- Two profiles have a Stripe Connect account. One is inactive, not an adult in the stored date of birth, and Stripe reports no individual verification, inactive transfers, and payouts disabled. User `c54bbbcf-1323-4539-8e30-c2a6b7f95662`.
- The other is active, not blocked, adult, profile age 38, `isVerified` true, bike, and a 10 km radius. Live Stripe reports `individual.verification.status` verified, transfers active, and payouts enabled. The delivery agreement is not recorded. User `c2ae8bae-343f-4f59-bc0e-15562b97f87e`, profile `cmtuj15up0001gm0avj2ssuy1`. This courier can be re-read at accept time, but will not appear in the match list until the identity cache is fresh.
- The earlier certification listing `e3e5322e-fae3-4185-b047-c10205646df3` is not in the product table. The superadmin user `7647bf21-e9ab-4e3a-af83-eeec23e24dcb` has no active product and no Connect account. Active listing counts: pickup 11, both 7, shipping 6, delivery 1. No listing was selected.
- Delivery orders remain 2 cancelled and 2 delivered. None are in flight.

Existing regression tests passed, 35 of 35, including the flag, the restricted pilot, transfer idempotency, and refund reversal. No new Stripe test delivery, order, or obligation was created. The earlier test-mode charge and transfer remain payment objects only. They are not a delivery lifecycle.

The first Vercel build of `e939a4ce` ran out of memory and was not aliased. The retry `dpl_BSqY98RdTuvxan2d5QE48gWYkV6p` is still the production deployment. This preparation did not change the build.

Gate F is blocked. The smallest next authorization, if the owner wants to continue, is to name the buyer, the existing listing, and the courier above, and to approve the existing restricted pilot as the only way a new delivery can be created. Do not enable the flag by itself.

## V6J restricted pilot and matching on 2026-10-26

No production flag, allowlist, payment, order, transfer, refund, payout, or identity row was changed. This commit was not deployed.

The public flag still means public delivery. `HOMECHEFF_DELIVERY_PILOT=restricted`, together with both allowlists, now admits only those ids while the public flag stays false. An empty list denies. A user id in the request body is ignored. Checkout, quotes, booking, acceptance, and matching use the session. Pickup and completion of an order that already exists stay on `POST /api/delivery/orders/[orderId]/update-status` and are not opened to the public. `assign-order` and `match-orders` now require the signed-in user to be the courier. An administrator is not on the allowlist unless that user id is listed. The 88/12 delivery split and `ensureDeliveryPayout` were not changed.

Matching still requires `stripeIdentityState` `VERIFIED` from the last 15 minutes. That cache was empty because it is written by delivery settings, `account.updated`, or a paid identity check, and none of those had run. `refreshStaleCourierIdentityForMatching` reuses `enforcePaidDeliveryIdentity` for at most eight stale connected profiles during an authorized match or availability check. A revoked Stripe status is written back and then excluded. Production was not refreshed.

The buyer option is the existing checkout choice `local_provider`. It is shown only when `/api/delivery/alignment-flags` says this caller may use delivery. The public flag in that response stays false. The seller keeps the existing order screens. The courier uses `/delivery/driver` and the delivery dashboard for accept, pickup, and completion. Notifications already exist for a new assignment, acceptance, pickup, and completion. The assignment broadcast still uses the match cache from before the paid identity re-read, so a courier who was just refreshed by checkout is included. No new notification channel was added.

These journeys were traced in the existing interface and covered by unit tests. They were not clicked through with a signed-in production user, and no preview delivery order was created. TypeScript diagnostics remain 2066.

Before a live delivery, the owner still has to approve this commit for deploy, name the buyer and an existing listing, put that buyer and courier `c2ae8bae-343f-4f59-bc0e-15562b97f87e` on the allowlists, and approve the real quote. Do not set `HOMECHEFF_DELIVERY_ENABLED`.

## V6K deploy and restricted pilot on 2026-10-26

The reviewed commit `27756cd7aea9f2a8e02ae302fe896f39c8e43896` was fast-forwarded onto `main`. Its diff from the previous production commit is the 22-file V6J set. The first production build, `dpl_7N7ZRYzxM8StJqfa2KiFHQLq3s8h`, failed with the known 4096 MB Next.js heap limit and was not aliased. The retry `dpl_6aRsJShDXHxskQWP5iAUQ2zNAd4U` became ready. After the pilot variables were saved, `dpl_GCvxauoBqD8vDzrbvVmrXNXeBbET` was redeployed from that same commit and is the deployment aliased to `https://homecheff.eu`. Rollback remains `dpl_BSqY98RdTuvxan2d5QE48gWYkV6p`.

`HOMECHEFF_DELIVERY_ENABLED` is still unset. Production-only variables are `HOMECHEFF_DELIVERY_PILOT=restricted`, `HOMECHEFF_DELIVERY_PILOT_USER_IDS` with buyer `7647bf21-e9ab-4e3a-af83-eeec23e24dcb`, and `HOMECHEFF_DELIVERY_PILOT_COURIER_IDS` with that courier's user id and profile id `cmtuj15up0001gm0avj2ssuy1`. The seller is not part of the allowlist. The access check does not admit an administrator by role. No wildcard was used.

The buyer is the one active account whose email matches the repository operator. The role is `SUPERADMIN`. Pilot access is the allowlist entry, not the role. The courier was rechecked: active, adult, bike, 10 km radius, Stripe `individual.verification.status` verified, transfers active, payouts enabled. The agreement timestamp is still empty. The production identity cache was not edited by hand.

Seven active listings allow delivery or both, from €9.00 to €35.00, and all have pickup coordinates. None of their sellers has a completed Stripe Connect account, so none can receive a HomeCheff payout. No listing was selected. No delivery address was confirmed, and the quote route can create a stored quote, so it was not called.

Anonymous checks on the live domain: the public flag is false, a body user id does not open a quote or booking, matching returns `DELIVERY_PILOT_REQUIRED`, acceptance requires a session, operations and recovery return 401, and an unsigned webhook returns 400. Home, login, and checkout return 200. The signed-in buyer and courier screens were not clicked. No order, payment, transfer, refund, or payout was created. Live recovery stays off.

The next owner action is to choose one existing listing whose seller can be paid, confirm a delivery destination, and approve the resulting quote. Do not take a payment before that.

## Activation

`PRODUCTION_DELIVERY_ENABLED = false`  
`DELIVERY_PRODUCTION_READY = false`
