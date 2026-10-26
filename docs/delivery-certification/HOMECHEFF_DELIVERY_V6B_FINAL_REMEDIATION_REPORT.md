# HomeCheff Delivery V6B — final remediation

Date: 2026-10-26  
Repository: rassdread/homecheff-app  
Branch: `fix/delivery-financial-blockers`  
Base: `51f60af9b728f72b44c3a481ae6578ee6418b2d5`

This report records the code remediation and the Stripe test-mode evidence. It does not execute production gates B through G. Those still need a separate owner authorization.

## Pre-flight

| Check | Result |
| --- | --- |
| Repository | rassdread/homecheff-app |
| Branch | `fix/delivery-financial-blockers` |
| HEAD at start | `51f60af9b728f72b44c3a481ae6578ee6418b2d5` |
| Working tree | clean |
| Production Delivery | `homeCheffDeliveryEnabled: false` on `https://homecheff.eu/api/delivery/alignment-flags` |
| Preview database | `ep-green-wind` only |
| Stripe key used for the probe | test key, balance `livemode` false |
| Production database migration status | NOT_READ. The production database credential was not opened. |
| Current production deployment id | NOT_AVAILABLE from the public response. `x-vercel-id` is a request id, not a deployment id. |

## Code changes

### Identity cache

`enforcePaidDeliveryIdentity` no longer returns success from a fresh `VERIFIED` row. A blocked profile is still denied immediately. Every other paid assignment re-reads the Stripe account. A failed or empty read stays closed. The 15-minute `delivererMatchingWhere` filter can still list a courier, but accept, match, assign, pickup, completion, company dispatch, and payout call the live check before paid work or a new transfer.

### Company accounts

`assignDriverToDeliveryOrder` now requires both the company profile and the assigned driver to pass `enforcePaidDeliveryIdentity`. A driver without a delivery profile is rejected. A Stripe company account, or any account without `individual.verification.status === verified`, stays ineligible. Dispatch does not create a payout.

### Webhook acknowledgment

A missing receipt, or a receipt that cannot be finished, returns HTTP 500 for every event, including marketplace checkout. Stripe can retry. The receipt claim is a compare-and-swap on `eventId`, `updatedAt`, and status `PROCESSING` or `FAILED`, so two workers cannot both reclaim one stale row.

### Livemode

`stripeLivemodeMatches` rejects a live object on a test key and a test object on a live key. A missing mode does not match. The webhook returns 400 before the handler runs. Courier payout returns `STRIPE_MODE_MISMATCH` when the configured secret and the source charge disagree. No second transfer is created in that case.

### Admin permission default

A missing admin permission now denies. `SUPERADMIN` still bypasses the granular check. This can lock an `ADMIN` user who has no `AdminPermissions` row out of granular routes.

### Payout recovery view

`GET /api/admin/delivery/operations` lists `CourierTransferObligation` rows in `UNKNOWN`, `FAILED`, `REQUIRES_REVIEW`, and `PROCESSING`. Each row has the delivery order, charge, state, transfer id when present, error code, last attempt, and a next action that says not to create another transfer. There is no payout button.

## Stripe test-mode evidence

Isolated preview database and the test key. Balance `livemode` was false. Destination account tail `eL3ugc`, `business_type` individual, `individual.verification.status` verified. Four new PaymentIntents of 100 cents were confirmed with `pm_card_visa`. Three transfers of 50 cents were created. One lookup-failure case created none. Certified charges and payouts were not used.

| Case | Result |
| --- | --- |
| Repeat the same settlement | `CONFIRMED`, `created: false`, one Stripe transfer, tail `pPKCKK`, charge tail `TYbXkr` |
| Two concurrent settlements | both `CONFIRMED`, one Stripe transfer, tail `8wYROL` |
| Transfer list throws a timeout | `UNKNOWN`, `LOOKUP_TIMEOUT`, zero creates, zero transfers in the group |
| Confirmed transfer id cleared locally while `stripeCreateAttemptedAt` stays set | reconciled to the same transfer, tail `7Kbd32`, `created: false`, one Stripe transfer |

These rows remain on preview under delivery order ids prefixed `v6b-`. They are probes, not certified orders.

## Regression, types, and build

Focused suite: 106 passed, 0 failed. Dummy database `127.0.0.1:1`. This covers identity, the obligation, payout blockers, revocation, locked price, platform contribution, activation, financial ops, webhook receipt, webhook persistence, webhook recovery, Stripe key separation, and standalone fulfillment.

`tsc --noEmit`, 4 GB heap: 2066 diagnostics, the same baseline. Changed files added none. Exit code 2 is the pre-existing project set. TypeScript settings were not weakened.

`node scripts/vercel-build.js` with `HOMECHEFF_DELIVERY_ENABLED=false` and a dummy database: exit 0, `Build completed successfully`. Ratchet 699 current, 767 baseline, 0 new.

## Gate A

Recommendation: APPROVE the code at the commit that contains this remediation.

Formal approval: NO. This review was made by the same implementation session. Gates B through G were not authorized and were not run.

| Severity | Unresolved |
| --- | --- |
| Critical | none |
| High | none |
| Medium | none that still bypass identity, acknowledge a failed receipt, or create a second courier transfer |
| Low | The match list can include a courier for up to 15 minutes after revocation. Acceptance re-reads Stripe and fails closed. |

## Production gates

| Gate | Status |
| --- | --- |
| A code recommendation | APPROVE, not formally accepted |
| B production migrations | NOT_STARTED |
| C production Google Maps | NOT_STARTED |
| D production webhook | NOT_STARTED |
| E monitoring | NOT_STARTED |
| F real-payment smoke test | NOT_STARTED |
| G customer activation | NOT_STARTED |

Deploying this webhook behavior before the receipt table exists will make Stripe retries return 500, including existing product checkout. Apply the preview-proven migrations before the application deploy. Keep Delivery disabled through that deploy.

Pending migrations, already on preview, in order:

1. `20261024190000_stripe_webhook_receipt`
2. `20261024220000_stripe_webhook_recovery_attempt`
3. `20261026104500_courier_stripe_identity`
4. `20261026140000_courier_transfer_obligation`

No new migration was added in this task. Rollback of the obligation table is `DROP TABLE` and does not delete charges. Do not drop it after real obligations exist unless those rows are exported. The identity columns and receipt tables have the same limitation: dropping them removes audit history, not charges.

## Owner action required

Authorize Gate B only: production backup confirmed, then `prisma migrate deploy` of the four migrations above against the production database, with Delivery still disabled. Do not deploy, change Stripe or Google, take a live payment, or enable Delivery in that same approval unless it is stated separately.
