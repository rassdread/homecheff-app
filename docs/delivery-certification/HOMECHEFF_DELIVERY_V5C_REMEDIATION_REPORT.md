# HOMECHEFF_DELIVERY_V5C_REMEDIATION_REPORT

Date: 2026-10-24
Repository: rassdread/homecheff-app
Worktree: /Users/sergioarrias/hc-delivery-financial-fix-v1
Branch: fix/delivery-financial-blockers
Start: 7bda45a19bd9b924076ca8d4ac1232e6979a034e
V4 baseline: ce6f3a910657820715dba5763f8aeebe82659805

Production Delivery was not enabled. No production database, Stripe, Google Cloud, or Vercel setting was changed. Nothing was pushed or merged.

While this pass was in progress, commit `c5a89369` recorded an independent Gate A rejection of `7bda45a1`. That commit is kept. This pass does not approve Gate A.

## 1. What this pass changed

Standalone Delivery webhook events now fail closed when the receipt table cannot be written. Marketplace checkout still continues if that table is missing. A standalone event is not answered with HTTP 200 unless its receipt was stored. Stripe receives HTTP 500 and can retry.

Accepting a booking now runs the server eligibility gate before the request is marked accepted. Age, profile verification, active status, and suspension apply even when the request has no pickup time. A caller-supplied age does not override the date of birth.

Production Distance Matrix calls reject an explicit caller key and a batch straight-line fallback when the production role is not ready. Non-production local quotes can still use a labeled straight-line distance, and that distance still cannot price a payable quote.

The operations view adds `WEBHOOK_RECEIPT_STORE_UNAVAILABLE` when the receipt table cannot be read, and it reports whether live recovery is enabled. Live recovery stays off unless `HOMECHEFF_WEBHOOK_RECOVERY_LIVEMODE=enabled`.

The obsolete test that banned the Delivery gate from appearing in the webhook file was replaced. Unpaid standalone completion stays blocked while the flag is off. An already paid standalone session remains reconciliation, so a captured payment is not dropped. Marketplace product creation and parcel shipping stay outside that flag.

Two pre-existing type errors in the booking distance helper were corrected. Realized profit stays null while the Stripe fee is pending or the affiliate liability is unpaid.

## 2. Webhook persistence

A missing receipt table used to set the event to `PROCESS` and continue for every event. That let a standalone payment be fulfilled and then acknowledged even though no idempotency row existed.

Standalone events are those whose object metadata has `checkoutKind` `STANDALONE_DELIVERY`. Those now return HTTP 500 before the handler runs when the receipt insert fails, and HTTP 500 if the handler finished but the receipt update failed. Marketplace `checkout.session.completed` without that metadata still proceeds. That split is intentional. Existing product payments are not stopped by a Delivery table that has not been migrated.

Recovery returns HTTP 503 with `RECEIPT_STORE_UNAVAILABLE` when the receipt or recovery-attempt table is missing, and it does not retrieve the event from Stripe on that path. The route still calls `requireSuperAdmin` before it reads the Stripe secret.

## 3. Courier identity and eligibility

Implemented in code and covered by unit tests:

- Under 18, missing date of birth, incomplete profile, inactive profile, and suspension cannot accept.
- A profile age of 30 does not override an underage date of birth.
- Stripe `individual.verification.status` `verified` is recorded as `STRIPE_REPORTS_VERIFIED`. It is not a HomeCheff document check.
- `requirements.disabled_reason` forces `RESTRICTED` and removes transfer and bank-payout readiness.
- Transfers require an active transfers capability. Bank payout also requires `payouts_enabled`.

Not a legal approval: HomeCheff still does not store government identity documents, and assignment is not blocked only because that document is absent. Whether assignment should wait for Stripe `verified` is an owner decision. This pass does not make that change.

## 4. Financial state

The two certified test charges were read again from the Stripe test API. `livemode` was false. No charge, refund, transfer, or payout was created.

| Charge | Amount | Fee | Fee status | Realized profit |
|---|---|---|---|---|
| ch_3UU7vzRpYdPVF6LP0DQgM7yZ | 1502 | 72 | pending | null |
| ch_3UU82JRpYdPVF6LP1vWgILsm | 994 | 56 | pending | null |

Courier transfers stay 840. The marketplace seller transfer stays 440. Affiliate liability stays 87 and 57 unpaid. The buyer surcharge is not used as the fee. `realizedProfitCents` is null until the fee status is `available` and the affiliate liability is settled.

## 5. Google Maps

Production calls Google only when `VERCEL_ENV=production`, `GOOGLE_MAPS_API_KEY` is set, `GOOGLE_MAPS_KEY_ROLE` is exactly `production`, and the server key is not the browser key. A missing role does not call Google and does not return a straight-line distance, including for the batch helper and for a key passed by the caller. Payable quotes still require `distanceSource` `google`.

The production key was not created.

## 6. Database

Preview host `ep-green-wind-a2cspmqw` reports `Database schema is up to date!` for 48 local migrations. That check was read-only. Production was not contacted and was not migrated.

Both webhook migrations only create tables and indexes. They do not update orders, payouts, or transfers. Prisma runs each migration once. They are not safe to paste twice by hand. Rollback is dropping the two new tables, which deletes receipt history only. After a drop, standalone Delivery events fail closed until the tables exist again.

## 7. Tests and types

Focused suite: 59 passed, 0 failed, against `127.0.0.1:1`.

| Typecheck | Diagnostics |
|---|---|
| V5 baseline | 2070 |
| After this pass | 2068 |
| Diagnostics in files changed here | 0 |

The two removed diagnostics were the booking distance helper. Full-project typecheck still exits 2. A 2 GB heap run aborted. The 4 GB heap run finished.

An isolated `next build` in a temporary copy, with env files excluded, exited 0. Output was not written into this worktree. That build ran before the booking-price and assignment edits. A repeat build failed because Next's own `webpack-build` module was missing from `node_modules`. That package was restored. The repeat failure is not a Delivery compile error.

`node scripts/typecheck-ratchet.mjs` on the final tree exited 0: 699 current signatures, 767 in the baseline, 0 new, 68 resolved. The earlier audit saw 3 new signatures. Those are gone. The baseline file was not rewritten.

## 8. Gate A defects from the independent audit

The audit rejected `7bda45a1` for two code defects. Both are addressed in this pass and are not treated as approval.

Marketplace checkout now prices a confirmed booking from `quotedFeeCents`, `routeDistanceKm`, `buyerLat`, and `buyerLng`. A request body that moves the destination or sends a different fee is rejected. The charged fee stays the stored fee even if a later rate-card calculation differs.

Manual assignment no longer writes `ASSIGNED`. A `PENDING` or legacy `ASSIGNED` order becomes `ACCEPTED`, which the existing state machine can pick up and complete. `PICKED_UP` and `DELIVERED` are not reassigned.

## 9. Release gates

| Gate | Status | Why |
|---|---|---|
| A Code review | BLOCKED | `c5a89369` rejected the previous commit. This commit needs a new review. It does not approve itself. |
| B Production migration | BLOCKED | Production migrate was not run. |
| C Production Maps key | BLOCKED | The production key and role do not exist. |
| D Production webhook | BLOCKED | No signed production receipt was observed. |
| E Monitoring in production | BLOCKED | The admin view is not deployed. |
| F Production smoke test | NOT_TESTED | No production smoke was authorized. |
| G Customer activation | BLOCKED | The production flag stays off. |

## 10. Recommendation

PRODUCTION_NOT_READY

Do not enable Delivery. The next owner step is Gate A. Gates B, C, and D stay blocked until that review is approved.
