# HOMECHEFF Delivery V5 production release runbook

Date: 2026-10-24
Repository: rassdread/homecheff-app
Branch: fix/delivery-financial-blockers

Production Delivery stays disabled until Gate G is explicitly approved. No gate in this document is approved by the existence of the document.

## Current evidence

- V3 paid Marketplace, affiliate, and Standalone lifecycles remain the financial evidence.
- V4 added webhook receipts, assignment eligibility, and server-only Distance Matrix selection.
- V5 adds recovery controls, operations alerts, production Maps fail-closed checks, and fee classification.
- Preview database host: `ep-green-wind-a2cspmqw`.
- Production flag `https://homecheff.eu/api/delivery/alignment-flags` reports Delivery disabled.
- Certified Stripe fees were re-read in test mode on 2026-10-24 and are still `pending`: 72 cents on the 1502-cent charge and 56 cents on the 994-cent charge.

## Gate A — code review and approval

Preconditions:

- This branch is the reviewed commit.
- The working tree contains no secrets.
- Production Delivery is still disabled.

Actions:

- Review the V5 diff, especially webhook recovery, the operations route, and Maps fail-closed behavior.
- Confirm the 88/12 split, the 12 percent product fee, and the 50 percent affiliate pool are unchanged.

Expected result:

- A named reviewer accepts the commit.

Failure:

- Stop. Do not migrate or deploy.

Rollback:

- Do not deploy the rejected commit.

Evidence:

- Review approval recorded outside this file. This runbook does not record that approval.

## Gate B — production database migration approval

Preconditions:

- Gate A approved.
- The target database host is the production host, not `ep-green-wind-a2cspmqw`.
- A backup or point-in-time recovery window is confirmed by the operator.

Migrations, in order:

1. `20261024190000_stripe_webhook_receipt`
2. `20261024220000_stripe_webhook_recovery_attempt`

Both create new tables. They do not update orders, payouts, users, or transfers.

Before:

- `npx prisma migrate status` against the production direct URL.
- Confirm both migrations are pending.
- Confirm the command host is production.

Apply:

- `npx prisma migrate deploy` during the approved window.

After:

- Both tables exist.
- `StripeWebhookReceipt` has a primary key on `eventId` and an index on `(status, updatedAt)`.
- `StripeWebhookRecoveryAttempt` has a primary key on `id` and an index on `(eventId, createdAt)`.
- A count of orders and payouts is unchanged by the migration.

Failure:

- Stop the deploy. Do not enable Delivery.

Rollback:

- The app fails open if the receipt table is missing, so the previous application can run without these tables.
- Dropping the two new tables removes receipt and recovery history only. It does not reverse charges or transfers. Do that only with explicit approval.

Evidence:

- Migrate status showing both migrations applied on the production host.

## Gate C — production Google Maps credential

Do this in Google Cloud project `homecheff-auth`. Do not change the preview key.

1. Create a new API key. Do not copy the preview key.
2. Restrict the API to `distance-matrix-backend.googleapis.com` only.
3. Do not use an IP allowlist of a home or office address. Vercel outbound addresses change. Application restrictions for a server key should be API restrictions, not a residential IP.
4. Do not mark the key unrestricted.
5. Store it only as `GOOGLE_MAPS_API_KEY` on the production server.
6. Set `GOOGLE_MAPS_KEY_ROLE=production` on that same server.
7. Do not put the key in `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.
8. Leave the preview key on its existing Distance Matrix and IP restrictions.

Validation:

- Production runtime with a missing key, a missing role, a `preview` role, or the same value in the browser variable does not call Google and does not price from a straight-line distance.
- A payable quote still requires `distanceSource` `google` with a positive distance and duration.

Failure:

- Quotes fail closed with `DELIVERY_ROUTE_UNRELIABLE`. That is the expected failure until the key and role are both present.

Rollback:

- Remove the production key and role. Pricing stays fail-closed. Do not point production at the preview key.

Evidence:

- Key creation record in Google Cloud, and a production environment check that the role is `production` and the browser variable does not contain the server key. Do not paste the key into the evidence.

## Gate D — production Stripe webhook verification

Preconditions:

- Gate A and Gate B approved.
- The application serving production contains this code.
- `STRIPE_WEBHOOK_SECRET` in production matches the live endpoint. Do not reuse the preview listener secret.

Actions:

- Confirm the live endpoint is the production application URL and uses the live Stripe account.
- Send or receive one signed live event after deploy. A `customer.created` style non-financial event is enough for transport.
- Confirm a `StripeWebhookReceipt` row exists for that event id, with `livemode` true and status `PROCESSED` or `FAILED`.
- Confirm an invalid signature returns 400 and writes no receipt.

`HOMECHEFF_WEBHOOK_RECOVERY_LIVEMODE` stays unset. The recovery route refuses live events without that value. Do not set it in this gate.

Failure:

- Signature failures or missing receipt rows. Leave Delivery disabled.

Rollback:

- Point the endpoint back only with Stripe's own dashboard history. Do not delete financial events.

Evidence:

- One live event id, its receipt status, and `livemode` true. Do not store the payload.

## Gate E — operational monitoring verification

Preconditions:

- Gate D showed one receipt row.

Actions:

- A platform admin with delivery visibility opens `GET /api/admin/delivery/operations`.
- The response includes status counts, unresolved receipts, stale processing, repeated failures, recovery attempts, payouts missing a `tr_` transfer, and Maps readiness.
- A user who is not a superadmin receives 403 from `POST /api/admin/delivery/operations/recover`.

Expected alerts when something is wrong:

- `WEBHOOK_FAILED_REPEATED`
- `WEBHOOK_PROCESSING_STALE`
- `WEBHOOK_REJECTED`
- `PAYOUT_MISSING_TRANSFER`
- `MAPS_PRODUCTION_NOT_READY`

No paid monitoring product is added. These alerts are in the admin response for an operator to read.

Failure:

- The route returns secrets, payloads, or data to a non-admin.

Rollback:

- Disable the admin session. The route does not move money by itself.

Evidence:

- A redacted response showing counts and `maps.payable` true after Gate C. No keys and no payloads.

## Gate F — controlled production smoke test

Preconditions:

- Gates A through E approved.
- Delivery is still disabled for customers.
- The smoke test uses an agreed internal account and a live or test decision made by the operator. This runbook does not authorize a live charge.

Actions:

- Confirm a quote fails closed when the Maps role is removed, then succeeds with the production key.
- Confirm a courier under 18, blocked, or without a complete profile cannot accept.
- Confirm a courier without `transfers` active cannot be paid.
- Do not change the certified preview orders.

Failure:

- Any smoke step that prices from a straight-line distance or pays an ineligible courier. Stop.

Rollback:

- Refund only the smoke payment, through the normal Stripe refund path, if one was created under a separate approval. This gate does not create that payment.

Evidence:

- Quote source `google`, eligibility denials, and no customer-facing flag change.

## Gate G — customer-facing activation

Preconditions:

- Gates A through F approved in writing.
- A separate instruction says to enable Delivery.

Action:

- Set the production Delivery flag on.

Until that instruction exists, the flag stays off.

Rollback:

- Turn the flag off. Existing paid orders remain in their current status. Do not delete financial rows.

## Responsibility

The operator who runs a gate records the evidence for that gate. This repository does not approve the gate by being deployed.
