# HOMECHEFF_DELIVERY_V5C_OWNER_ACTION_PLAN

Date: 2026-10-24
Repository: rassdread/homecheff-app
Branch: fix/delivery-financial-blockers

This document does not approve any production gate. Production Delivery stays off until Gate G is a separate written instruction.

## A. Completed locally, without production credentials

- Standalone Delivery webhook events fail closed when the receipt table is missing. Marketplace checkout is unchanged.
- Booking accept uses the server age, profile, and suspension gate before the row is accepted.
- Production Maps calls reject a caller-supplied key and a batch straight-line fallback when the production role is missing.
- Operations view reports a missing receipt store and whether live recovery is enabled.
- Focused tests: 59 passed, 0 failed.
- Typecheck: 2070 diagnostics at the V5 start, 2068 after this pass, none in the files changed here.
- Preview `prisma migrate status` on `ep-green-wind-a2cspmqw` says the schema is up to date. No migration was applied by this pass.
- The two certified test charges were read again. Fees are still pending: 72 cents and 56 cents. Realized profit stays null.

## B. Actions that need production credentials

These commands are the procedure. Do not run them until Gate A is approved and the operator has confirmed the host is production, not `ep-green-wind-a2cspmqw`.

### Gate B — migrate

1. Confirm a backup or point-in-time window.
2. Point `DATABASE_URL` and `DIRECT_URL` at the production direct host for this command only.
3. `npx prisma migrate status`
4. Confirm `20261024190000_stripe_webhook_receipt` and `20261024220000_stripe_webhook_recovery_attempt` are pending, and that no other migration is pending.
5. `npx prisma migrate deploy`
6. Confirm both tables exist, the receipt primary key is `eventId`, and order and payout counts are unchanged.

Do not paste the SQL a second time. Prisma records each migration in `_prisma_migrations`.

Rollback, only with a separate approval: `DROP TABLE "StripeWebhookRecoveryAttempt";` then `DROP TABLE "StripeWebhookReceipt";`. That deletes receipt history, not charges. Leave Delivery disabled afterwards. Standalone events will return HTTP 500 until the tables exist again. Marketplace checkout continues.

### Gate C — Maps key

In Google Cloud project `homecheff-auth`:

1. Create a new API key. Do not copy the preview key.
2. Restrict it to `distance-matrix-backend.googleapis.com` only.
3. Do not use a home or office IP allowlist. Vercel outbound addresses change.
4. Store it only as production `GOOGLE_MAPS_API_KEY`.
5. Set production `GOOGLE_MAPS_KEY_ROLE=production`.
6. Do not put that key in `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.
7. Leave the preview key unchanged.

Until both the key and the role exist, production quotes fail closed. That is the expected state.

### Gate D — webhook

1. Deploy the reviewed commit first. Do not enable Delivery in that deploy.
2. Confirm the live Stripe endpoint URL and that `STRIPE_WEBHOOK_SECRET` matches that endpoint. Do not reuse the preview listener secret.
3. Send one signed non-financial live event, such as a customer event.
4. Confirm a `StripeWebhookReceipt` row for that event id with `livemode` true.
5. Confirm an invalid signature returns 400 and writes no row.

Do not set `HOMECHEFF_WEBHOOK_RECOVERY_LIVEMODE`.

### Gate E — monitoring

After Gate D:

- A platform admin with delivery visibility opens `GET /api/admin/delivery/operations`.
- A user who is not a superadmin receives 403 from `POST /api/admin/delivery/operations/recover`.
- The response may include `WEBHOOK_RECEIPT_STORE_UNAVAILABLE`, `WEBHOOK_FAILED_REPEATED`, `WEBHOOK_PROCESSING_STALE`, `WEBHOOK_REJECTED`, `PAYOUT_MISSING_TRANSFER`, and `MAPS_PRODUCTION_NOT_READY`.
- `livemodeRecoveryEnabled` must be false.

There is no external pager. An operator reads this response.

## C. Actions that need owner approval

| Gate | Approval needed before |
|---|---|
| A | A named reviewer accepts the commit that follows `c5a89369`. That audit rejected `7bda45a1`. This plan does not reverse that rejection. No migrate, deploy, or key creation before the new review. |
| B | Production migrate during a backup window. |
| C | Creating the production Distance Matrix key and the two environment values. |
| D | One signed live webhook after the deploy. |
| E | An admin session checking the operations response. |
| F | A smoke test on an agreed internal account. This plan does not authorize a live charge. |
| G | A separate instruction to set the production Delivery flag on. |

Gate F, only after A–E:

- Remove the Maps role and confirm the quote fails closed, then restore the production role and confirm `distanceSource` is `google`.
- Confirm a courier under 18, blocked, or without a complete profile cannot accept.
- Confirm a courier without active transfers cannot be paid.
- Do not change the certified preview orders.

Rollback for Gate G is turning the flag off. Existing paid orders stay as they are.

## D. Legal and compliance decisions

These are not decided by this code:

- Whether a courier may accept work before Stripe reports `individual.verification.status` `verified`.
- Whether HomeCheff must store a government identity document. The code does not store one, and no such requirement was added.
- Whether Stripe's `verified` status is enough for the business. It means Stripe accepted the information it requested. It does not tell HomeCheff which document was reviewed.

Until an owner decides otherwise, assignment stays on age 18, a complete active profile, and no suspension. Money movement stays on transfers capability and `payouts_enabled`.

## E. Final release authorization

Do not treat this file, the V5 report, or a green local test run as permission to enable Delivery.

Production is ready for customers only when Gates A–F have written evidence and a separate instruction sets the production flag. The live flag at `https://homecheff.eu/api/delivery/alignment-flags` was `homeCheffDeliveryEnabled: false` on 2026-10-24. Leave it false.
