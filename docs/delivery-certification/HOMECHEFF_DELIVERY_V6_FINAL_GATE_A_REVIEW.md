# HOMECHEFF_DELIVERY_V6_FINAL_GATE_A_REVIEW

Date: 2026-10-26
Repository: rassdread/homecheff-app
Worktree: /Users/sergioarrias/hc-delivery-financial-fix-v1
Branch: fix/delivery-financial-blockers
Reviewed commit: bcc1c75a365aae49e6ba31a05861d36caac9c5ef

This review does not approve Gate A. Production Delivery was not enabled. No production database, Stripe, Google Cloud, or Vercel setting was changed. Nothing was pushed, merged, or deployed. No critical defect was edited during this review.

The earlier independent review of `7bda45a1` is `docs/delivery-certification/HOMECHEFF_DELIVERY_V6_INDEPENDENT_GATE_A_AUDIT.md`. It rejected Gate A. This review checks that rejection against `bcc1c75a` instead of assuming the findings are gone.

## 1. Executive summary

Individual Connect accounts on the current test API do expose `individual.verification.status`. The paid accept, match, assign, pickup, and completion paths use that status and do not treat payouts or an empty requirements list as identity. The previous checkout price hole and the `ASSIGNED` status hole are fixed in this commit.

Gate A is still **REJECT**. `lib/delivery/delivery-payout.ts` still changes the Stripe idempotency key after a recorded transfer failure. If the following transfer list fails, the code treats that as "no transfer" and can create a second courier transfer. That high finding from the earlier rejection is still present. It was not changed in this review.

## 2. Identity policy verification

Owner policy used for this review:

- `individual.verification.status` exactly `verified` is the technical identity requirement for an individual courier.
- HomeCheff does not need to see which government document Stripe used.
- Stripe remains responsible for its own check.
- A company account stays blocked until the natural person who performs the delivery is verified.
- No administrator may skip the check.
- No paid delivery is accepted, assigned, picked up, or completed without the check.
- This is a product rule, not a legal certification.

Stripe test mode, API version `2025-08-27.basil`, balance `livemode` false. Two existing individual accounts in the Netherlands were read and not modified. Both are `business_type` `individual`. Both return `individual.verification.status` `verified`. Both have payouts and charges enabled, details submitted, and an empty `currently_due` list. The response did not include document file ids. That is enough to show the required field exists for this account type and API version. It is not a document inspection.

The classifier marks `VERIFIED` only for that status. `payouts_enabled`, `charges_enabled`, `details_submitted`, and an empty requirements list stay unverified. A `disabled_reason` forces `RESTRICTED` even when the status is `verified`. A company account, or any account without `individual.verification`, stays `UNKNOWN` and cannot take paid work. No document is stored.

A stored `VERIFIED` row is trusted for 15 minutes. `account.updated` rewrites the row when Stripe sends it. If that event has not arrived, a courier who was just restricted can still pass until the row is older than 15 minutes. After that, the next paid action retrieves the account again. A failed retrieve or a mismatched account id does not mark the courier verified.

Administrative assignment calls the same check. There is no override flag.

Company driver dispatch (`assignDriverToDeliveryOrder`) does not check the driver's own Stripe status. It can only attach a driver to an order the company profile already owns. A Stripe company account cannot become that owner while verification is missing. The gap is that a verified individual business profile can name another member as the driver. Severity medium.

Courier compensation (`ensureDeliveryPayout`) checks age, suspension, and Connect payout readiness. It does not repeat the identity classification. Completion itself does require identity. Severity medium.

## 3. Financial review

The previous critical checkout hole is closed for the default named-provider path. `namedProviderSelectionEnabled` defaults to true. Checkout loads the accepted booking and `lockedBookingCheckoutPrice` rejects a moved destination or a different client quote. The charged provider fee is then the stored `quotedFeeCents`, not a newly calculated lower fee. Standalone checkout still charges the stored quote. Seller-delivery and legacy platform pricing still calculate a fee when provider pricing is off. That flag defaults to on.

The previous high `ASSIGNED` defect is closed. Manual assignment writes `ACCEPTED`. `PENDING`, legacy `ASSIGNED`, `ACCEPTED`, and `PICKED_UP` can move to `ACCEPTED` for another courier who passes the same identity check. `pickedUpAt` is cleared on a picked-up reassignment. `DELIVERED` cannot be reassigned. A paid order whose courier loses verification stays on its current status and can be given to another verified courier. It is not cancelled by the identity check.

Shares are unchanged: courier 88 percent, platform 12 percent of the delivery fee, affiliate pool 50 percent of the platform fee. Realized profit stays null unless the fee source is a Stripe balance transaction, the fee is final, and affiliate liability is settled.

Read again in Stripe test mode, with no write:

| Balance transaction | Amount | Fee | Status |
|---|---|---|---|
| txn_3UU7vzRpYdPVF6LP0ncKVZA5 | 1502 | 72 | pending |
| txn_3UU82JRpYdPVF6LP1saTnPlJ | 994 | 56 | pending |

Preview affiliate ledger rows whose event id contains `62f336cb` or `a54a0e88`: three `PENDING` rows, 30, 57, and 57 cents. None are paid. The earlier estimates of 63 and 41 cents are not realized profit.

The remaining high defect is the transfer idempotency key. After `transferFailureAt` or `transferFailureCode` is stored, the next `transfers.create` uses a different key. `findConfirmedDeliveryTransfer` returns null when `transfers.list` throws. The early return that blocks a second transfer only runs when `providerRef` already starts with `tr_`. A transfer that Stripe created, but HomeCheff did not save, can be created again. The focused payout test expects the retry key to differ. Smallest correction: if the list throws, do not create a transfer. Use one idempotency key per delivery order and charge.

## 4. Webhook review

Invalid signatures return 400 before a receipt is written. The handler does not log the payload. `event.livemode` is stored on the receipt. The handler does not reject a live event when the API key is a test key. A live signing secret next to a test key could still verify a live event. Severity medium. Preview `financialStripeSecret` returns null for a non-test key, so that process returns 503 before verification.

Receipt primary key is `eventId`. `PROCESSED` and `REJECTED` are skipped. A fresh `PROCESSING` row returns 500 so Stripe retries. Standalone delivery events return 500 when the receipt table cannot be written or the finish update fails, so Stripe is not told those events succeeded. Marketplace checkout still continues if the receipt table is missing. That can acknowledge a marketplace event that has no receipt. Severity medium, and it is why Gate B has to run before any production traffic.

Recovery is superadmin-only, accepts only an `evt_` id, replays `FAILED` receipts, refuses live receipts unless `HOMECHEFF_WEBHOOK_RECOVERY_LIVEMODE=enabled`, and checks that the Stripe key mode matches the receipt. Retrieved id, type, and livemode must match. Five attempts per event per hour are stored without the payload. That flag is unset. Live recovery was not run.

Two workers can both pass a `PROCESSING` row older than five minutes because the update is not compare-and-swap. Money safety then depends on the payout idempotency gap above. Severity medium.

## 5. Migration review

Preview `ep-green-wind-a2cspmqw` reports the schema is up to date for 49 local migrations. Production was not contacted.

| Order | Migration | Effect |
|---|---|---|
| 1 | `20261024190000_stripe_webhook_receipt` | Creates `StripeWebhookReceipt`. Primary key `eventId`. No payload. No foreign key. |
| 2 | `20261024220000_stripe_webhook_recovery_attempt` | Creates `StripeWebhookRecoveryAttempt`. Index on event id and time. No foreign key. |
| 3 | `20261026104500_courier_stripe_identity` | Adds nullable `stripeIdentityState`, `stripeIdentityReason`, and `stripeIdentityCheckedAt` on `DeliveryProfile`, plus one index. |

None of these update orders, payouts, or transfers. Prisma applies each folder once. Do not paste the SQL again.

Rollback limits: dropping the two webhook tables deletes receipt history, not charges. Dropping the three identity columns deletes the cached classification, not Stripe's own status. After that drop, this code cannot read the classification and paid delivery fails closed rather than becoming verified. Production rollback still needs its own approval.

## 6. Maps review

Production calls Google only when `VERCEL_ENV` is `production`, `GOOGLE_MAPS_API_KEY` is set, `GOOGLE_MAPS_KEY_ROLE` is exactly `production`, and that key is not equal to `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`. Otherwise production does not call Google and does not return a straight-line distance. Payable quotes still require a Google distance. A caller-supplied key does not bypass the production role. Preview has a server key, no browser key, and no production role. The production key was not created.

## 7. Build and TypeScript

The tree was clean at `bcc1c75a` before these documents. No package was installed or removed.

| Check | Result |
|---|---|
| V5D baseline on this commit | 2066 diagnostics |
| This review, `tsc --noEmit`, 4 GB heap | 2066 diagnostics, exit 2 |
| New diagnostics | 0 |
| Typecheck ratchet | 699 current, 767 baseline, 0 new |
| `node scripts/vercel-build.js` | Exit 0 |

Delivery files still contain 43 pre-existing diagnostics, including checkout session typing and company routes. `delivery-payout.ts`, the webhook route, and the identity modules added no diagnostics in this count. Payment and authorization files were not given a weaker compiler setting. The build used a dummy database on `127.0.0.1:1` and `HOMECHEFF_DELIVERY_ENABLED=false`. It was not deployed. Page collection logged connection errors against that dummy host and continued. The same build command completed earlier on this commit, so this run is a second completion, not a new code change.

## 8. Security findings

| Severity | Item | Evidence | Smallest correction |
|---|---|---|---|
| High | Second courier transfer | `delivery-payout.ts` appends `transferFailureAt` or the failure code to the idempotency key. `findConfirmedDeliveryTransfer` returns null on a list error. | Do not create a transfer when the list fails. Keep one key per delivery order and charge. |
| Medium | 15-minute verified cache | `enforcePaidDeliveryIdentity` returns success without a Stripe read while the row is fresh. | Re-read Stripe for every new assignment, or treat `account.updated` as mandatory before the cache is trusted. |
| Medium | Company driver | `company-dispatch.ts` sets `assignedDriverUserId` with no Stripe check on that person. | Block dispatch until that person has `individual.verification.status` `verified`, or keep company dispatch off. |
| Medium | Compensation skips identity | `ensureDeliveryPayout` uses payout readiness, not the identity classification. | Call the same identity gate before creating a new transfer. |
| Medium | Marketplace receipt fail-open | A missing receipt table still processes marketplace checkout and can return 200. | Migrate before traffic. Do not treat this as safe without Gate B. |
| Medium | Webhook livemode | `constructEvent` does not compare `event.livemode` with the API key mode. | Reject a live event on a test key and the reverse. |
| Medium | Receipt update race | Two workers can process one stale `PROCESSING` row. | Compare-and-swap the receipt status. |
| Low | Missing admin permission defaults to allow | `admin-guard.ts` uses `perms?.[permission] ?? true`. Recovery itself is superadmin-only. | Default missing permissions to deny. |
| Low | Signature failures log `err.message` | Webhook route. The payload is not stored. | Log only the error name. |

No identity bypass was found on accept, match, admin assign, pickup, or completion. Suspended and underage couriers still fail the earlier gate. An account id that does not match is not saved.

## 9. Operational readiness

| Gap | Class |
|---|---|
| No admin queue of paid orders left `PENDING` after a courier restriction | BLOCKING_BEFORE_PILOT |
| Transfer idempotency can pay a courier twice | BLOCKING_BEFORE_PILOT |
| Operations view shows failed receipts, stale processing, payouts without `tr_`, Maps readiness, and that live recovery is off. It does not show unpaid affiliate rows or identity `UNKNOWN` couriers | RECOMMENDED_BEFORE_SCALE |
| External paging | OPTIONAL |

Administrators can reassign a picked-up order to another verified courier. They need an order id. The operations response does not list those orders.

## 10. Regression evidence

Focused tests: 93 passed, 0 failed, against `127.0.0.1:1`. These are mocked or local unit tests, including identity classification, locked booking price, payout source-charge checks, webhook receipt and recovery, Maps fail-closed behavior, and pending-fee profit. They are not a new end-to-end payment certification.

Real Stripe test-mode reads, with no write: verification status on two individual accounts, and the two certified fees still pending. Preview ledger rows for the certified orders are still `PENDING`. No production check was run.

## 11. Gate A recommendation

REJECT

The identity policy for individual accounts is implemented and the required Stripe field is present on the tested account type. The earlier checkout and `ASSIGNED` blockers are fixed. One high financial defect remains, so this review cannot recommend approval. Gate A is not formally approved. Gates B through G stay closed.

## 12. Remaining blockers

- One stable transfer idempotency key, and no create when the existing-transfer lookup fails.
- Gate A is not approved.
- Production migration, production Maps key, signed production webhook, monitoring, smoke test, and customer activation are not done.
- Production Delivery remains disabled.
