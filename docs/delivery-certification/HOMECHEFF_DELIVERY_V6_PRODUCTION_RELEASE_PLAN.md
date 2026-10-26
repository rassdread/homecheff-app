# HOMECHEFF_DELIVERY_V6_PRODUCTION_RELEASE_PLAN

Date: 2026-10-26
Repository: rassdread/homecheff-app
Branch: fix/delivery-financial-blockers
Reviewed commit: bcc1c75a365aae49e6ba31a05861d36caac9c5ef

This plan does not approve any gate. The Gate A review of this commit is REJECT. Do not start Gate B until a later review accepts a commit that closes the high transfer-idempotency defect. Approving a later Gate A does not authorize Gates B through G. Each gate needs its own written approval. Production Delivery stays off through Gate F.

Preview database host: `ep-green-wind-a2cspmqw`. Do not run these commands against that host when the step says production. Production host must be confirmed by the operator before Gate B. Do not print connection strings or keys into tickets.

## Environment that must already be true

- The deployed commit is the commit a reviewer accepted at Gate A.
- `HOMECHEFF_DELIVERY_ENABLED` is not true in production.
- `HOMECHEFF_WEBHOOK_RECOVERY_LIVEMODE` is unset.
- Production `STRIPE_SECRET_KEY` is a live secret and is not the preview test secret.
- Production `STRIPE_WEBHOOK_SECRET` matches the live endpoint only.
- Production `GOOGLE_MAPS_API_KEY` is not the preview key and is not `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.
- `GOOGLE_MAPS_KEY_ROLE` is not set until Gate C.

## Gate A — code review

Preconditions: clean tree, production Delivery still disabled, and the high payout idempotency defect fixed in a commit after `bcc1c75a`.

Approval: a named reviewer accepts that later commit in writing. This document does not do that.

Actions: read the diff for checkout price lock, assignment status, identity gate, webhook receipt, and the transfer idempotency key.

Expected result: one idempotency key per delivery order and charge, and no transfer create when the lookup fails. Identity still requires `individual.verification.status` `verified`. No admin bypass.

Failure: stop. Do not migrate or deploy.

Rollback: not applicable. No production change has been made.

## Gate B — production database migration

Preconditions: Gate A approved for the deployed commit. A backup or point-in-time window exists. The operator has confirmed the host is production, not `ep-green-wind-a2cspmqw`.

Approval: a separate written approval to migrate production during that window.

Commands, with production `DATABASE_URL` and `DIRECT_URL` only:

```bash
npx prisma migrate status
npx prisma migrate deploy
```

Expected result before deploy: only these three are pending, in this order:

1. `20261024190000_stripe_webhook_receipt`
2. `20261024220000_stripe_webhook_recovery_attempt`
3. `20261026104500_courier_stripe_identity`

Expected result after deploy: `prisma migrate status` says the schema is up to date. `StripeWebhookReceipt` exists with primary key `eventId`. `StripeWebhookRecoveryAttempt` exists. `DeliveryProfile` has the three nullable identity columns. Order count and payout count are unchanged.

Failure: stop. Do not enable Delivery. If a migration fails halfway, do not paste its SQL again. Prisma records each folder in `_prisma_migrations`.

Rollback, only with another written approval:

```sql
ALTER TABLE "DeliveryProfile" DROP COLUMN IF EXISTS "stripeIdentityCheckedAt";
ALTER TABLE "DeliveryProfile" DROP COLUMN IF EXISTS "stripeIdentityReason";
ALTER TABLE "DeliveryProfile" DROP COLUMN IF EXISTS "stripeIdentityState";
DROP TABLE IF EXISTS "StripeWebhookRecoveryAttempt";
DROP TABLE IF EXISTS "StripeWebhookReceipt";
```

That deletes receipt history and the cached identity classification. It does not delete charges. Leave Delivery disabled. Standalone events then return HTTP 500 until the receipt table exists again.

## Gate C — production Google Maps credentials

Preconditions: Gate A approved. Gate B is not required for this key, but do not activate Delivery yet.

Approval: written approval to create one new key in Google Cloud project `homecheff-auth`.

Actions:

1. Create a new API key. Do not copy the preview key.
2. Restrict it to `distance-matrix-backend.googleapis.com` only.
3. Do not use a home or office IP allowlist. Vercel outbound addresses change.
4. Store it only as production `GOOGLE_MAPS_API_KEY`.
5. Set production `GOOGLE_MAPS_KEY_ROLE=production`.
6. Do not put that key in `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.
7. Leave the preview key unchanged.

Expected result: a production quote attempt without those two values fails closed and does not return a straight-line price. After both values exist, one server-side Distance Matrix call can succeed. Do not make that call until this gate is approved.

Failure: remove the new key from Vercel and delete or disable it in Google Cloud. Delivery stays off.

## Gate D — signed production Stripe webhook

Preconditions: the accepted commit is deployed. Delivery is still disabled. Gate B has been applied, so the receipt table exists. The live endpoint URL is confirmed. `STRIPE_WEBHOOK_SECRET` matches that endpoint and is not the preview listener secret.

Approval: written approval for one signed non-financial live event.

Actions:

1. Confirm the live endpoint subscriptions include `account.updated`, `checkout.session.completed`, and the charge, transfer, and refund events the handler already uses.
2. Send one signed non-financial live event, such as a customer event.
3. Read the `StripeWebhookReceipt` row for that event id.

Expected result: the row exists, `livemode` is true, and the status is `PROCESSED` or `REJECTED` according to the handler. An invalid signature returns 400 and writes no row. `HOMECHEFF_WEBHOOK_RECOVERY_LIVEMODE` stays unset.

Failure: disable the new endpoint in Stripe rather than pointing it at the preview listener. Do not run live recovery.

## Gate E — operational monitoring

Preconditions: Gates B and D done. An administrator with delivery visibility and a separate superadmin account are available.

Approval: written approval to open the admin session.

Checks:

- `GET /api/admin/delivery/operations` loads for an admin who may view delivery details.
- A user who is not a superadmin receives 403 from `POST /api/admin/delivery/operations/recover`.
- `livemodeRecoveryEnabled` is false.
- The response may include `WEBHOOK_RECEIPT_STORE_UNAVAILABLE`, `WEBHOOK_FAILED_REPEATED`, `WEBHOOK_PROCESSING_STALE`, `WEBHOOK_REJECTED`, `PAYOUT_MISSING_TRANSFER`, and `MAPS_PRODUCTION_NOT_READY`.
- There is still no list of unassigned paid orders in that response. A pilot also needs a written way to find those order ids before Gate G.

Failure: do not continue to a real charge. Delivery stays off.

## Gate F — controlled real-payment smoke test

Preconditions: Gates A through E accepted. One adult test buyer, one individual courier whose live `individual.verification.status` is `verified`, and one seller are named in the approval. The courier is not a company account. Amounts are the smallest live amounts the reviewer allows.

Approval: a separate written approval that names the people, the maximum charge, and the refund plan. This plan does not authorize the charge.

Actions:

1. Keep Delivery disabled for every customer except the named test accounts if the pilot flag can express that. If it cannot, do not run this gate by turning Delivery on for everyone.
2. Accept a booking, pay one marketplace order, pick it up, and complete it.
3. Read the Checkout amount, the stored `quotedFeeCents`, the courier transfer, the seller transfer, the balance-transaction fee status, and any affiliate ledger row.

Expected result: the charge equals the accepted booking fee plus the existing buyer surcharge. One courier transfer uses one idempotency key. Fee status may be `pending`. Realized profit stays null while it is pending. Affiliate rows stay unpaid until their own payout process, which this gate does not run.

Failure: refund the smoke charge from Stripe using the existing refund review. Do not create a second transfer. Leave Delivery disabled for customers.

## Gate G — customer-facing activation

Preconditions: Gate F evidence is written down. The owner gives a separate instruction to enable Delivery for a named region or named users. There is a way to see paid orders that have no eligible courier.

Approval: that instruction is the only approval for this gate.

Actions: set production `HOMECHEFF_DELIVERY_ENABLED` to the value the accepted build reads as on, for the approved scope only.

Expected result: `https://homecheff.eu/api/delivery/alignment-flags` shows Delivery enabled only after this gate. A courier without `individual.verification.status` `verified` cannot accept, be assigned, pick up, or complete.

Failure and rollback: set `HOMECHEFF_DELIVERY_ENABLED` back to off. Do not drop the webhook tables and do not reverse live transfers as part of the flag rollback. In-flight paid orders stay in the database and follow the reassignment rule: another verified courier, or completion by the same courier after Stripe returns `verified`.

## Required owner approvals

| Gate | Who must approve before it runs |
|---|---|
| A | Named reviewer, after the transfer idempotency defect is fixed. Not this document. |
| B | Operator plus owner, during a backup window, on the production host. |
| C | Owner, before the new Maps key is created. |
| D | Owner, before the one live non-financial event. |
| E | Owner, before the admin session is used as evidence. |
| F | Owner, naming the people and the maximum charge. |
| G | Owner, as a separate activation instruction. |
