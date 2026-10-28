# HomeCheff V23.4 production release readiness

TASK_NAME: HOMECHEFF_V23_4_FINAL_PRODUCTION_RELEASE_CERTIFICATION

SOURCE_BRANCH: fix/v23-3-original-admin-cockpit-restoration

SOURCE_HEAD: bf29203c3eb79c3b061c52c6d79b956f575c6a97

EXPECTED_SOURCE_HEAD: bf29203c3eb79c3b061c52c6d79b956f575c6a97

SOURCE_HEAD_MATCHES_EXPECTED: YES

REMOTE_HEAD: bf29203c3eb79c3b061c52c6d79b956f575c6a97 (origin/fix/v23-3-original-admin-cockpit-restoration, before this release commit)

FINAL_HEAD: the documentation commit that adds this report. Its parent is the application release commit. The documentation commit does not change runtime code.

WORKTREE_CLEAN: YES after the release commits. The temporary certification script was not committed.

TARGET_TIME: 2026-10-28 09:00 Europe/Amsterdam

PRODUCTION_RELEASE: PREPARE_AND_REQUEST_APPROVAL

PRODUCTION_DEPLOYMENT: NOT_EXECUTED

PRODUCTION_DATABASE_WRITES: NONE

PRODUCTION_STRIPE_WRITES: NONE

PUBLIC_DELIVERY_ENABLED: false

## Release decision

RELEASE_DECISION: GO, for a controlled production deploy of the release commit below, only after explicit owner approval.

The application is not live on this commit. Current production remains deployment `dpl_9Vm1Gy9G6w2U6S2oJCXQRWrmbRtj`, commit `85b11d6d4708f68760122314a1ace654591f7643`, state READY.

PROMOTION_CODES: PASS

SUBSCRIPTION_CHECKOUT: PASS

ADMIN_SECURITY: PASS

PRODUCTION_BUILD_STATUS: PASS. Protected preview `dpl_5iNXZpHSGr2ifpK6y1uKyx38Hx9R` is READY, target none, commit `63c95ae4846fd58a9c6bb67e3f4f0af859b40d32`. This is not a production deployment.

RELEASE_COMMIT: 63c95ae4846fd58a9c6bb67e3f4f0af859b40d32

NEXT_REQUIRED_ACTION: The owner approves production deployment of the release commit, and confirms which existing production promotion code the business should enter. Do not redeem that code as part of the deploy.

## What was verified

Current production was read, not changed.

- Production deployment `dpl_9Vm1Gy9G6w2U6S2oJCXQRWrmbRtj` is READY on `85b11d6d4708f68760122314a1ace654591f7643`.
- `https://homecheff.eu` delivery flags are all false, including `homeCheffDeliveryEnabled`.
- `prisma/` has no net difference between that production commit and `bf29203c`. No migration is required for this release.
- Live Stripe prices configured for production are active, EUR, monthly, livemode true: Basic 3900, Pro 9900, Premium 19900 cents.
- Live webhook endpoints on `homecheff.eu` and `growth.homecheff.eu` are enabled and include `checkout.session.completed`.
- Production environment already has `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_BASIC`, `STRIPE_PRICE_PRO`, and `STRIPE_PRICE_PREMIUM`. No new variable is required.
- Intended V23.3 application changes are in `2a5ddec3`. `bf29203c` adds only the V23.3 report. This task adds one application change: the subscription webhook must not invent a catalog-price order when Stripe collected €0.

## Original admin cockpit

ORIGINAL_ADMIN_COCKPIT_PRESERVED: YES

GROWTH_INTEGRATION_STATUS: INTEGRATED

STUDIO_INTEGRATION_STATUS: INTEGRATED

The sidebar source still lists all ten domains together: Command Center, Community, Marketplace, Finance, Logistics, Growth, Trust & Safety, Insights, Platform, Studio. `ADMIN_PLATFORM_DOMAINS` remains classification only and does not filter the sidebar. This task did not redesign the cockpit and did not repeat the owner browser session. An inaccessible owner preview is not treated as an application failure.

## Subscription prices and commissions

SUBSCRIPTION_PRICES_VERIFIED: YES

SUBSCRIPTION_COMMISSIONS_VERIFIED: YES for the charge path

Authoritative plan configuration in code:

| Plan | Monthly price | Commission |
| --- | --- | --- |
| Private | €0 | 12% (1200 bps) |
| Basic | €39 (3900) | 9% (900 bps) |
| Pro | €99 (9900) | 7% (700 bps) |
| Premium | €199 (19900) | 5% (500 bps) |

Checkout and seller settlement resolve the plan by subscription name first, then use this configuration. Live Stripe prices match the monthly amounts. Obsolete 7/5/2 rates were not restored into the charge path.

The production `Subscription` rows still store older `feeBps` values: Basic 700, Pro 400, Premium 200. Those integers do not drive the charge when the row name is Basic, Pro, or Premium. The admin settings screen can display the stored integers, so it can show 7%, 4%, and 2% while checkout charges 9%, 7%, and 5%. Aligning the three stored integers is a separate approved data correction. It was not executed.

## Public subscription presentation

PUBLIC_AFFILIATE_COPY_REMOVED: YES on the public plan page

The public plan variant does not render affiliate payout lines or the button "Leg dit uit als affiliate". That string is absent from the repository. Public cards state 12/9/7/5 and €0/€39/€99/€199. The affiliate variant, the affiliate pages, referral tracking, and payout records still exist and still show affiliate earnings. That is intentional. The Dutch affiliate help text still contains an affiliate-program example of €49,50; it is not a subscription-card payout.

## Promotion code certification

Isolated preview database and Stripe test mode only. No live customer, no live charge, no production code redeemed. The certification script was deleted and is not part of the release.

Stamp `7348F9DB`, `livemode: false`.

| Case | Result |
| --- | --- |
| Invalid code | `not_found` |
| Expired code | `expired` |
| Already redeemed / exhausted | `max_redemptions` |
| Second use by the same user | `max_redemptions_per_user` |
| Incorrect tier | No per-plan gate exists. One code quotes every paid plan. This was not rebuilt. |
| 100% END | Quote €39 → €0, no Stripe subscription, Basic `feeBps` 900, business price 0, status active, valid 360 days |
| 100% CONTINUE | Checkout Session created, test price 3900, trial 360 days, amount paid now 0 |
| Discount duration | 12 cycles, 360 days |
| END behavior | Entitlement ends with the promo window. No later Stripe invoice. |
| CONTINUE behavior | Stored future catalog price 3900. Stripe subscription was trialing and resumes at the list price. It was canceled after the test so this certification left no future invoice. |
| Webhook twice | One business subscription row. Second call did not duplicate it. |
| Activation | Basic, status active, commission 900 bps |
| Immediate charge | €0 |
| False catalog order | After the fix, subscription orders recorded: 0. One false €39 order from the earlier run was deleted in the preview database. |

PROMOTION_CODE_END_CERTIFIED: YES

PROMOTION_CODE_CONTINUE_CERTIFIED: YES for billing, activation, idempotency, and cancellation

STRIPE_TEST_CHECKOUT_COMPLETED: PARTIAL

A real test Checkout Session was created (`livemode: false`, trial 360, unit amount 3900). The hosted payment-page confirm call returned HTTP 400, so the card form itself was not submitted. Completion used a real test-mode subscription on the same price and trial (`sub_1UVLgxRpYdPVF6LPNZai2QZx`), then the real webhook handler. The subscription was canceled after certification. This is not a fabricated payment. Stripe collected €0.

STRIPE_WEBHOOK_CERTIFIED: YES on the corrected handler

The handler now records a subscription order only when `amount_total` is greater than zero. A trial no longer becomes a confirmed €39 order.

SUBSCRIPTION_ACTIVATION_CERTIFIED: YES in test mode

## Dewey onboarding

DEWEY_ONBOARDING_FLOW_READY: YES for the software flow

The existing flow supports registration, subscription selection, promotion entry, server-side validation, checkout creation, webhook activation, the Basic entitlement, 9% commission, and a disclosed later catalog price on CONTINUE. No account was created for Dewey. No production code was redeemed. No live subscription was created.

Dewey's exact code was not identified. These active production platform codes exist, masked, all unused, one use per user, no end date:

| Shape | Discount | Cycles | After the promo | Uses |
| --- | --- | --- | --- | --- |
| 5-character code starting VI | 100% | 12 | END | 0 |
| 5-character code starting LO | 100% | 3 | CONTINUE | 0 |
| 5-character code starting LO | 100% | 6 | CONTINUE | 0 |
| 6-character code starting LO | 100% | 12 | CONTINUE | 0 |

PRODUCTION_PROMOTION_CODE_READINESS: READY as an engine, with an owner choice still required

The 12-cycle CONTINUE code is the one that bills the catalog price after 12 months. The 12-cycle END code does not create a Stripe subscription. Neither code is limited to one tier. The owner must say which existing code the business should use. Do not create or edit a production code without that approval. Do not print the full code.

## Admin security

ADMIN_PERMISSION_MATRIX: PASS for the automated matrix

Executed in this certification: superadmin, marketplace administrator, growth administrator, studio administrator, read-only administrator, suspended and revoked grants, ordinary and legacy users, unknown routes, financial action denial, and cross-platform denial. Default deny holds for unknown admin routes. This was the existing server-side capability matrix, not a new live HTTP session against production. Security was not weakened.

## Financial regression

FINANCIAL_REGRESSION_STATUS: PARTIAL

Passed in this run: marketplace fee snapshots (including 12% and 5%), refund stock policy, affiliate payout safety, duplicate-payment behavior, and seller-transfer recovery unit tests. Those unit tests refuse a refunded charge and do not move money.

Seller-transfer recovery was not executed against Stripe. There was no safe missing-transfer fixture. That workflow stays uncertified. It does not block subscription onboarding or the admin cockpit release. It blocks only the separate recovery action. It is not marked PASS.

No production financial record was modified. No live recovery transfer was sent.

## Tests, types, and build

Essential tests this certification:

- `scripts/test-business-plan-presentation.ts`: pass
- `scripts/validate-promocode-e2e-integration.ts`: HOMECHEFF_PROMOCODE_END_TO_END_PASS
- `scripts/validate-admin-promotions.ts`: 14 checks, HOMECHEFF_ADMIN_PROMOTIONS_VALIDATOR_PASS
- `npx tsx --test` on admin capabilities, admin routes, user capabilities, promo limits, seller-transfer recovery, marketplace fee snapshot, delivery gate, delivery activation, affiliate payout safety, and refund stock: 71 pass, 0 fail

FULL_TEST_SUITE_STATUS: NOT_RUN

The full repository suite was not executed. Unrun tests are not marked PASS.

TYPESCRIPT_STATUS: PASS. Post-fix ratchet: 699 current, 767 baseline, 0 new, 68 resolved. The baseline file was not edited.

PRODUCTION_BUILD_STATUS: PASS. Local `next build` was not run. Protected preview `dpl_5iNXZpHSGr2ifpK6y1uKyx38Hx9R` of `63c95ae4846fd58a9c6bb67e3f4f0af859b40d32` is READY with no production target.

## Area decisions

| Area | Decision | Blocks this release |
| --- | --- | --- |
| A. Business subscriptions and promotion codes | PASS | No, after owner approval to deploy and a choice of the existing code |
| B. Admin cockpit | PASS | No |
| C. Marketplace financial operations | PARTIAL | No for subscriptions. Seller-transfer recovery remains a separate uncertified workflow. |
| D. Delivery | BLOCKED for public launch | No. Public Delivery stays disabled. Gate F was not run. |

Shared-code and authorization tests that were run did not fail.

## Production release plan

Do not execute this until the owner explicitly approves it.

1. Application release commit: `63c95ae4846fd58a9c6bb67e3f4f0af859b40d32`. It changes `app/api/stripe/webhook/route.ts` so a zero `amount_total` is not stored as a catalog-price subscription order. The documentation commit after it does not change runtime behavior. Deploy the branch tip; it contains the fix. The certified preview build is of `63c95ae4`.
2. Required environment variables: none new. The live price IDs and webhook secret are already set.
3. Required migrations: none.
4. Required Stripe webhook change: none. `checkout.session.completed` is already enabled on `homecheff.eu`.
5. Deploy that commit to production with the existing Vercel project. Do not change Delivery flags. Do not disable Vercel Authentication.
6. Rollback deployment: `dpl_9Vm1Gy9G6w2U6S2oJCXQRWrmbRtj` (`85b11d6d4708f68760122314a1ace654591f7643`). Promote that deployment if the new deploy misbehaves. There is no schema rollback. Rolling back restores the old webhook, which can again record a catalog-price order for a €0 trial.
7. Smoke tests after deploy, still without redeeming a production code and without a live charge:
   - Deployment SHA matches the release commit.
   - `https://homecheff.eu` delivery flags remain false.
   - `/sell` shows €0, €39, €99, €199 and 12%, 9%, 7%, 5%, and does not show affiliate payout amounts or "Leg dit uit als affiliate".
   - An obviously invalid promotion code returns not found and creates no redemption.
   - Founder Control Center still lists the ten domains for an authorized administrator.
8. Monitoring: Stripe webhook failures, subscription checkout errors, and any new order whose note is an "Abonnement betaling" while Stripe collected €0.
9. Optional, separate approval, not part of the deploy: update production `Subscription.feeBps` from 700/400/200 to 900/700/500 so the admin settings screen matches the charge path. Do not do this by restoring 7/5/2 into checkout.

## Remaining blockers

REMAINING_BLOCKERS:

- Production deploy is waiting for explicit owner approval. This is the release gate, not a product defect.
- The owner must confirm which existing code the business uses: the 12-cycle CONTINUE code, or the 12-cycle END code. The software does not identify Dewey's code.
- Hosted Checkout card entry was not completed. The test subscription and webhook were.
- Seller-transfer recovery remains uncertified as a live action. It does not block this release.
- The full automated suite was not run.
- Public Delivery remains off on purpose.

SUBSCRIPTION_RELEASE_READY: YES, pending owner approval to deploy

ADMIN_RELEASE_READY: YES, pending the same deploy approval

OVERALL_PRODUCTION_RELEASE_READY: YES, as a prepared release. The system is not live until that deploy and the post-deploy smoke tests succeed.
