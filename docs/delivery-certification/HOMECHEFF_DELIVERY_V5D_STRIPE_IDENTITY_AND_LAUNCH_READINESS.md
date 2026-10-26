# HOMECHEFF_DELIVERY_V5D_STRIPE_IDENTITY_AND_LAUNCH_READINESS

Date: 2026-10-26
Repository: rassdread/homecheff-app
Worktree: /Users/sergioarrias/hc-delivery-financial-fix-v1
Branch: fix/delivery-financial-blockers
Base: c780958ef5c2a4cac64689666b93b0cf9deb9845

Production Delivery was not enabled. No production database, Stripe, Google Cloud, or Vercel setting was changed. Nothing was pushed, merged, or deployed.

## 1. Executive summary

Paid delivery now waits for Stripe Connect `individual.verification.status` to be exactly `verified`. Payouts being enabled, charges being enabled, details being submitted, or an empty requirements list do not count. HomeCheff does not store identity documents and does not claim that a passport or identity card was inspected.

A courier can still register, finish a profile, set availability and radius, and open Stripe onboarding before that status exists. Accepting a paid delivery, automatic assignment, administrative assignment, pickup, and completion all use the same server check. A stale `VERIFIED` flag expires after 15 minutes and is refreshed from Stripe. If Stripe cannot be read, the courier stays ineligible.

This is not a production launch approval. Gate A remains unapproved. Explicit government-document proof is not available from the current Connect account object.

## 2. Existing Stripe Connect architecture

HomeCheff uses Stripe Connect accounts. Courier onboarding already creates or resumes an account and sends the courier to Stripe-hosted onboarding. The platform stores `User.stripeConnectAccountId` and `User.stripeConnectOnboardingCompleted`. It does not store document file ids.

`account.updated` was already handled. The handler finds the user by that account id, updates transfer capability and `payouts_enabled`, and now also stores the identity classification. If the same account id is on more than one user, it updates nobody.

Country and business type stay whatever Stripe collected during onboarding. Individual accounts expose `individual.verification`. Company accounts on this integration do not expose that object on the account, so they stay `UNKNOWN`.

## 3. Available Stripe verification evidence

Read from the Account object, and not stored beyond the classification:

| Field | What it means here |
|---|---|
| `requirements.disabled_reason` or `future_requirements.disabled_reason` | `RESTRICTED`. Paid delivery is closed even if verification says verified. |
| `individual.verification.status` `verified` | `VERIFIED`. This is Stripe's identity-check status. |
| `individual.verification.status` `pending` | `PENDING` |
| `individual.verification.status` `unverified` | `NOT_STARTED` |
| `individual.verification.details_code` matching `failed_`, `document_`, or `scan_` while not verified | `FAILED` |
| Missing `individual.verification`, including a company account | `UNKNOWN` |
| No Connect account | `NOT_STARTED` |

`charges_enabled`, `payouts_enabled`, `details_submitted`, and an empty `currently_due` list were inspected and are not used as identity proof.

`individual.verification.document` is not read and not stored. Stripe does not give HomeCheff a separate boolean that names the government document. `explicitDocumentVerified` is always false.

The two certified test balance transactions were read again in test mode. `livemode` on the platform balance was false. Fees remain pending: 72 cents on 1502, and 56 cents on 994. No charge, transfer, refund, or payout was created.

## 4. Implemented verification policy

A courier may register, complete a profile, set availability, set radius, and complete Stripe onboarding before identity verification.

A courier may not accept a paid delivery, receive an automatic paid assignment, receive an administrative paid assignment, start pickup, or complete a paid delivery unless the stored classification is `VERIFIED` and the check is younger than 15 minutes. The client cannot send that flag.

Missing evidence stays `UNKNOWN`, `PENDING`, `FAILED`, `RESTRICTED`, or `NOT_STARTED`. It is never treated as verified.

If Stripe later restricts an account, the next refresh removes paid eligibility. An order already picked up is not cancelled and is not marked delivered. An administrator can assign it to another courier whose identity check is current. That assignment returns the order to `ACCEPTED` and clears `pickedUpAt`, so the new courier must pick it up. A delivered order is not reassigned. If Stripe cannot be reached, pickup and completion stay blocked and the order remains on its current status until a fresh verified check exists.

## 5. Courier eligibility enforcement

The same `enforcePaidDeliveryIdentity` check runs after the existing age, profile, active, and suspension gate for:

- courier accept
- automatic booking confirmation
- booking accept
- match-orders
- courier assign-order
- community assign, claim, accept, and complete
- administrative assignment
- pickup and completion
- webhook creation of a paid delivery order

Automatic matching also requires `stripeIdentityState` `VERIFIED` and a check inside the 15-minute window. If the named courier on a paid checkout is not eligible, the paid order is created as `PENDING` with no courier, so the captured payment is not dropped and is not stuck on an ineligible courier.

Age remains 18 from `User.dateOfBirth`. Profile completion remains `DeliveryProfile.isVerified`. Suspension remains `isBlocked`. Those checks are not replaced by the Stripe status.

## 6. Stripe webhook synchronization

`account.updated` still requires the existing signature check before any handler runs. The sync writes only the classification, reason code, and timestamp, plus the existing transfer and payouts flags. It does not write another user's profile when the account id is ambiguous.

A paid action does not trust that row after 15 minutes. It retrieves the account again. A retrieved id that does not match the courier's stored account id is rejected and is not saved. A failed retrieval does not mark the courier verified.

Standalone delivery webhook events still fail closed when the receipt table cannot be written. Marketplace checkout still continues if that table is missing. Recovery stays superadmin-only, and live recovery stays off unless `HOMECHEFF_WEBHOOK_RECOVERY_LIVEMODE=enabled`.

## 7. Onboarding experience

The courier payment settings page shows Dutch and English text for the current classification. The `VERIFIED` text says Stripe reports that its identity check is complete and that HomeCheff does not store an identity document. It does not say a government document was verified. Other states say paid delivery stays closed and point the courier back to the existing Stripe onboarding flow. There is no HomeCheff document upload.

## 8. Financial regression

Locked booking checkout still charges the stored `quotedFeeCents` and rejects a moved destination or a different fee. Courier and platform shares were not changed. Affiliate accrual was not changed. The payout path still requires the original charge. Realized profit stays null while the Stripe fee is pending or affiliate liability is unpaid. The certified test charges were not modified.

Focused tests: 88 passed, 0 failed, against `127.0.0.1:1`.

## 9. Security regression

Covered by unit tests:

- no Stripe account
- payouts, charges, and an empty due list without verification status
- pending, failed, and restricted accounts
- verified individual status, without a document claim
- a previously verified row becoming restricted
- a suspended courier
- a stale verified timestamp
- Stripe unavailable
- an account id that does not match
- one Stripe account attached to two users
- accept, match, assign, admin assign, pickup, completion, booking, and webhook all call the server gate

An underage date of birth is still rejected by the age gate before the identity result can matter.

## 10. Production build result

`node scripts/vercel-build.js` completed with exit 0 after Prisma generate, the unbound-hook check, and the typecheck ratchet. The Next.js production build finished and printed the route table. The command used a dummy database URL on `127.0.0.1:1`, `HOMECHEFF_DELIVERY_ENABLED=false`, and no live Stripe or Google credential. Page-data collection logged database connection errors against that dummy host. Those errors did not fail the build. Pre-existing import warnings outside Delivery also did not fail the build. This build was not deployed.

## 11. TypeScript result

| Check | Result |
|---|---|
| Baseline recorded by V5C | 2068 diagnostics |
| Final `tsc --noEmit` with a 4 GB heap | 2066 diagnostics, exit 2 |
| Diagnostics in files changed in this pass | 0 |
| Typecheck ratchet | 699 current, 767 baseline, 0 new, 68 resolved |

TypeScript settings were not weakened. The baseline file was not rewritten.

## 12. Database migration readiness

Preview host `ep-green-wind-a2cspmqw` applied `20261026104500_courier_stripe_identity`. It adds three nullable columns and one index on `DeliveryProfile`: `stripeIdentityState`, `stripeIdentityReason`, and `stripeIdentityCheckedAt`. It does not store documents and does not update orders or payouts.

Deploy order on a database that does not have them yet:

1. `20261024190000_stripe_webhook_receipt`
2. `20261024220000_stripe_webhook_recovery_attempt`
3. `20261026104500_courier_stripe_identity`

Prisma applies each folder once. Do not paste the SQL a second time. Production was not migrated. Until this migration exists, paid delivery stays closed because a missing identity status is not treated as verified. A production deploy of this code before the migration will fail the identity read rather than mark couriers verified.

## 13. Remaining production dependencies

| Gate | Status | Why |
|---|---|---|
| A Code review | BLOCKED | `c5a89369` rejected the earlier commit. This commit does not approve itself. |
| B Production migration | BLOCKED | Production migrate was not run. |
| C Production Maps key | BLOCKED | `GOOGLE_MAPS_KEY_ROLE=production` and a separate production server key do not exist. Production calls still fail closed. |
| D Production webhook | BLOCKED | No signed production receipt was observed. |
| E Monitoring | BLOCKED | The admin view is not deployed. |
| F Production smoke test | NOT_TESTED | No production smoke was authorized. |
| G Customer activation | BLOCKED | `https://homecheff.eu/api/delivery/alignment-flags` still reports Delivery disabled. |

## 14. Owner decisions

These need a decision. This pass does not buy Stripe Identity and does not add an exception path.

1. Is Stripe `individual.verification.status` `verified` enough for a courier to take paid work, given that HomeCheff cannot see which document Stripe checked?
2. Is explicit government-document proof mandatory? The current Account object does not expose that proof without reading document files. Those files are not stored. If that proof is mandatory, paid delivery for every courier stays blocked until a separate approved integration exists.
3. Should company Connect accounts be allowed? They currently stay `UNKNOWN` because verification is not on `account.individual`. Listing persons would read more personal data and was not added.
4. Should any operator be able to override a missing Stripe status? No override exists. An already picked-up order can be reassigned only to a courier who passes the same check.
5. Gate A is still not approved. Do not migrate production, create the production Maps key, or enable Delivery before that review.

## 15. Final launch recommendation

PARTIAL

The selected rule, no paid delivery without Stripe's reported identity verification, is implemented for individual Connect accounts and is fail-closed when the evidence is missing. Explicit document verification is not marked pass. Production Delivery stays off.

FINAL_STATUS = PARTIAL
DELIVERY_PRODUCTION_READY = NO
GATE_A_FORMALLY_APPROVED = NO
PRODUCTION_DELIVERY_ENABLED = NO
