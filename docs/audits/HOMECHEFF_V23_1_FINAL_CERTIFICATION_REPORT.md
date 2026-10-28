# HomeCheff V23.1 final certification

TASK_NAME: HOMECHEFF_V23_1_FINAL_CERTIFICATION_AND_DELIVERY_GATE_F_PREPARATION

SOURCE_BRANCH: fix/v23-final-execution-certification

SOURCE_HEAD: ad568df452b3a0d505fda2862de5ebb4324e5a66

FINAL_BRANCH: fix/v23-1-final-certification-delivery-readiness

FINAL_HEAD: ad568df452b3a0d505fda2862de5ebb4324e5a66

REMOTE_HEAD: not pushed in this task

WORKTREE_CLEAN: NO. Uncommitted client change in `components/sell/SellPageClient.tsx`. No commit and no deploy were made.

PRODUCTION_BASELINE: commit `85b11d6d4708f68760122314a1ace654591f7643`, deployment `dpl_9Vm1Gy9G6w2U6S2oJCXQRWrmbRtj`, target production, state READY. Rechecked at the end of this task. Unchanged.

PREVIEW_DEPLOYMENT_ID: `dpl_E9cPWfHs2YtFh1yCb37bSE8P82Ja` (existing V23 preview of application commit `9e938a70b3827927362bbc83d79ce499e57cb213`). This task did not create a new deployment.

PREVIEW_URL: `https://homecheff-6bdl7m6d0-sergio-s-projects-f7b64ee1.vercel.app`

Preview database host: `ep-green-wind-a2cspmqw`. Stripe test platform: `acct_1S6D3DRpYdPVF6LP`. Live platform `acct_1S1TFM2KvmKfeN9t` was not written.

## BROWSER_RUNTIME_STATUS

PASS for the isolated Vercel preview. FAIL for local `next dev`.

The protected preview rendered, in the browser:

- `/register` — heading "Registreren", account form, and the existing line "Wil je HomeCheff zakelijk gebruiken?" linking to `/sell`.
- `/sell` — title "HomeCheff zakelijk", plans Particulier €0 / Basic €39 / Pro €99 / Premium €199, and the promocode field.
- `/admin` — "HomeCheff Admin Center" for the synthetic superadmin. A signed-in ordinary user who opened `/admin` was sent to `/`.

Unauthenticated `GET /admin` on that host still returns 302 to Vercel Authentication. The browser session used was an existing protected preview session. Deployment protection was not disabled and no bypass secret was created.

Local `next dev` on a clean `.next` still crashes in the React Refresh webpack runtime with `Cannot read properties of undefined (reading 'call')` at `.next/static/chunks/webpack.js`. The factory is missing because the dev runtime requires a module before it is installed in `__webpack_modules__`. The production client bundle used by the preview does not use that refresh wrapper. Moving `ssr: false` dynamic imports into a client component did not remove the crash and was reverted. No frontend architecture change was kept for this.

## ADMIN_BROWSER_STATUS

PARTIAL.

Browser evidence:

- Superadmin session opened `/admin` and the Overzicht tab. Visible areas: Global, marketplace, growth, studio, Command Center, Overzicht.
- Ordinary signed-in user opening `/admin` was redirected to `/`.

The other six synthetic administrators were not each opened as a separate browser session. Their server responses are in the authorization section.

## ADMIN_AUTHORIZATION_STATUS

PASS for the authenticated HTTP matrix against the local server on the preview database. Delivery was forced off for that server.

| Identity | Orders | Affiliates | Refund execute without confirmation | Self-assign SUPERADMIN | Unknown `/api/admin/not-a-real-route` |
|---|---|---|---|---|---|
| Superadmin | 200 | 200 | 400 | 403 | 404 |
| Marketplace | 200 | 403 | 403 | 403 | 404 |
| Growth | 403 | 200 | 403 | 403 | 404 |
| Read-only | 200 | 403 | 403 | 403 | 404 |
| Suspended (`suspendedAt` set) | 403 | 403 | 403 | 403 | 404 |
| Studio | 403 | 403 | 403 | 403 | 404 |
| Multi-platform (orders + affiliates) | 200 | 200 | 403 | 403 | 404 |
| Anonymous | 401 | | | | |
| Ordinary user | 403 | | | | |

No refund confirmation flags were sent. The refunded V23 order was not refunded again. Superadmin self-promotion returned 403 `CANNOT_CHANGE_OWN_ACCESS` before any role write. A path with no route file returns 404 before the guard. The route-capability unit test still denies unknown mapped routes for every role except superadmin.

Unit tests rerun this task: `lib/admin/admin-route-capabilities.test.ts`, `lib/payments/seller-transfer-recovery.test.ts`, `lib/promo-codes/promo-limit-update.test.ts`. Result: 19 passed, 0 failed.

## ADMIN_DASHBOARD_RECONCILIATION

PASS for the figures that the Overzicht tab shows, read from the browser and recalculated with the same rules (`realUserWhere`, `paidMarketplaceOrderWhere`, current Stripe mode).

Displayed after the preview fixtures below were inserted:

| Figure | Displayed | Independent query |
|---|---|---|
| Echte gebruikers | 19 | 19 |
| Geregistreerd | 39 | 39 |
| Geverifieerd | 19 | 19 |
| Testaccounts | 20 | 20 |
| Producten | 8 | 8 |
| Betaalde marketplace-orders | 4 | 4 |
| Bruto marketplace | €60.98 | 6098 cents |
| Actieve bezorgers | 12 | 12 unblocked profiles |
| Meta-bezoekers | Niet vastgelegd | no visitor ledger |

The one `REFUNDED` order is excluded from the paid count and from the €60.98. That gross is marketplace buyer total for the current Stripe mode, and the label says it is not platform profit.

Before the three V23.1 private users were inserted, the same query returned 16 real users and 36 registered users. Those three `@preview.homecheff.test` users are classified as real because they do not match `demonstrableTestUserWhere`. The display matches the classifier. It is not a second calculation.

Active business subscriptions after the zero-cost activation: 1, price 0 cents, no Stripe subscription id. That subscription is not included in the €60.98. Business rows: 2. Verified businesses: 0. Affiliates: 5. The overview does not invent Growth or Studio revenue.

## SELLER_TRANSFER_RECOVERY_STATUS

NOT_VERIFIED.

The recovery decision unit tests pass: a cached failure is not retried automatically, an existing transfer is adopted, a refunded charge is not used to create another transfer, and an ambiguous list is refused.

No new Stripe transfer was created. The only local payout whose `providerRef` starts with `failed_` belongs to refunded order `59bfb45e` (the historical V19 charge). It was not submitted to `POST /api/admin/orders/{orderId}/recover-seller-transfer`. The refunded V23 charge `ch_3UVGm5RpYdPVF6LP0JrNpRgE` and its reversed transfer were not reused.

Exact remaining action: create one new Stripe test-mode order whose seller transfer `transfers.create` throws, confirm the Stripe transfer list for that charge is empty, then call the recovery route once and a second time with the superadmin session. Do not repair the V19 or V23 charge to manufacture that state.

## SUBSCRIPTION_CHECKOUT_STATUS

PARTIAL.

Browser on the protected preview, signed in as one existing user, showed Basic €39, Pro €99, and Premium €199, with platform fees 9%, 7%, and 5%. Those match the seeded catalog and the existing visibility profile. No plan price, fee, or benefit was edited in code.

A paid Stripe Checkout for Basic, Pro, or Premium was not completed. `STRIPE_PRICE_BASIC`, `STRIPE_PRICE_PRO`, and `STRIPE_PRICE_PREMIUM` exist on the Vercel preview and production environments and are absent from the local `.env.preview.local`, so the local server returns "Onbekend plan of ontbrekende price id" before checkout. The preview itself has the price ids. The CONTINUE 100% / 12-month code `V231FULL12` validates to final price 0, `resumesAtListPrice: true`, and duration label "12 months", but its Stripe trial checkout was not paid.

## VALID_PROMOTION_STATUS

PASS on the local validate endpoint against the preview database, and PASS in the browser for the 100% code.

Isolated preview rows, using the existing `PromoCode` fields, because the preview had zero promotion rows:

- `V231PCT20`: 20% platform, valid. Quotes Basic 3900/780/3120, Pro 9900/1980/7920, Premium 19900/3980/15920.
- `V231LEFT`: max 2, used 1, still valid at the same 20% quotes.
- `V231END12` and `V231FULL12`: valid, 100%, 12 cycles.

Repeated validate of `V231PCT20` did not increment `redemptionCount`.

## INVALID_PROMOTION_STATUS

PASS for the server. The browser on the current preview shows the English API string.

`NOPE-V231` returns HTTP 404, `valid: false`, `reason: not_found`. On the deployed preview the field then shows "Promo code not found". That is the defect fixed locally: the sell page now prefers the Dutch reason, "Deze promocode bestaat niet." That client change is not on the deployed preview, so the Dutch invalid state is not yet browser-certified.

## EXPIRED_PROMOTION_STATUS

PASS for the server. `V231EXPIRED` returns `reason: expired`. The Dutch client string "Deze promocode is verlopen." is in the uncommitted sell-page change and was not rechecked in the browser after a deploy.

## EXHAUSTED_PROMOTION_STATUS

PASS for the server. `V231USED` has `maxRedemptions` 1 and `redemptionCount` 1 and returns `reason: max_redemptions`.

## 100_PERCENT_PROMOTION_STATUS

PASS for display and for the zero-cost END activation. The CONTINUE / future-charge path is NOT_VERIFIED.

Browser, after applying `V231END12`:

- "Code geaccepteerd: originele prijs, korting, duur en actuele prijs staan bij de plannen (server-berekend)."
- Basic shows €39 struck through, €0, "per maand · 100% korting".
- "Eerste 12 maanden: FREE / €0".
- "Daarna eindigt het abonnement automatisch na de promotieperiode."
- The button label becomes "Activeer Basic gratis".

`V231FULL12` is the existing CONTINUE rule: payable now 0, then the list price until cancellation. Its Stripe trial session was not completed.

## ZERO_COST_SUBSCRIPTION_STATUS

PASS for one END activation. No Stripe subscription and no live charge.

The preview `Subscription` catalog was empty, so activation returned "Abonnement niet gevonden in database". The existing seed prices were inserted into the preview database only: `basic` 3900 cents / 900 bps, `pro` 9900 / 700, `premium` 19900 / 500, `durationDays` 365. No production catalog was touched.

Then "Activeer Basic gratis" on the preview stored:

- same user `59ea0e24-60fd-47b9-9234-3b863bfa475a`
- one `BusinessSubscription`, status `active`, `priceCents` 0, `planId` `basic`, `stripeSubscriptionId` null
- one `PromoCodeRedemption`, status `CONFIRMED`, plan BASIC, final 0, 12 cycles, post-promotion action END
- `V231END12.redemptionCount` = 1

Applying the same code again in that signed-in browser showed "Deze promotie is al gebruikt door dit account." User count stayed 39. The Connect pointer on that user stayed null. No second user was created.

Concurrent last-slot redemption was not executed over HTTP. The row lock exists and the unit test "the last available use is accepted and the next one is refused" passed. That is not a concurrent certification.

## PROMOTION_CODE_DISCOVERABILITY

PASS. On `/sell` the label "Heb je een promocode?" sits with the subscription plans, with "Voer code in" and "Toepassen". The existing wording was kept. It was not renamed to "Heb je een actiecode?".

## PROMOTION_CODE_VISUAL_QUALITY

PASS for the field itself: white input, green apply button, secondary "Wissen", same page as the plan prices. The invalid-code message on the current preview is English and is the open visual defect. The uncommitted change maps known reasons to Dutch and does not replace the field.

## PROMOTION_CODE_MOBILE_UX

PASS on the preview viewport used for the session. The field, apply, clear, and "Activeer Basic gratis" were usable. The first click on the activate button was covered by the bottom navigation; scrolling the button to the center allowed the click. That overlap is the existing mobile chrome, not a new promocode layout.

## PROMOTION_CODE_DESKTOP_UX

NOT_VERIFIED as a separate wide viewport. The same preview page was exercised in the browser session that rendered the full sell document, including the plan comparison. A dedicated desktop-width pass was not recorded.

## PRIVATE_TO_BUSINESS_UPGRADE_STATUS

PASS for the signed-in path that was tested.

The same user opened `/sell` while signed in, applied the code, and received the Basic entitlement. User id did not change. No second account was created. Seller profile, messages, orders, and Connect data on that new user were empty before the test and were not replaced by another user. The sell page, after activation, shows "Van Basic naar Pro" and "Van Basic naar Premium" for the higher plans.

The settings entry "Bekijk zakelijke abonnementen" was not opened in the browser in this task. It remains the existing link in seller settings.

## REGISTRATION_BUSINESS_ENTRY_STATUS

PASS. `/register` on the preview shows "Wil je HomeCheff zakelijk gebruiken?" and the link target is `/sell`. Private registration fields stay above that line. No registration was submitted.

## BUSINESS_PROFILE_STATUS

NOT_VERIFIED in the browser.

The sell page live preview still uses the sample tile "Jouw bedrijf". The public profile of the newly entitled Basic user was not opened. Source badge rules were not treated as certification.

## BUSINESS_BADGES_STATUS

NOT_VERIFIED in the browser.

Verified businesses in the preview database: 0. The paid subscription must not be shown as identity verification. The existing badge component says "Abonnement" for a paid plan and "Bedrijf" when there is no plan match. That was not rendered on a public profile in this task.

## REGRESSION_TEST_STATUS

PARTIAL. Targeted unit tests this task: 19/19 passed (admin route map, seller-transfer recovery decisions, promo limit edits and the last-slot simulation).

The V23 full set of 103 unit tests, 7 preview integration tests, and the broader suite were not rerun. No assertion was weakened. No test was excluded.

## TYPESCRIPT_STATUS

NOT_VERIFIED this task. The previous ratchet on the V23 commit remains 699 current, 767 baseline, 0 new. The sell-page change was not put through the ratchet. The baseline file was not shrunk and the heap was not raised.

## BUILD_STATUS

NOT_VERIFIED this task. No `npm run build` and no new Vercel deployment. The existing preview `dpl_E9cPWfHs2YtFh1yCb37bSE8P82Ja` is READY and is the build that was opened in the browser. It does not contain the uncommitted Dutch promocode messages.

## PRODUCTION_DATABASE_WRITES

NONE.

## PRODUCTION_STRIPE_WRITES

NONE. No live charge, refund, transfer, customer, or Connect account was created or changed.

## PRODUCTION_DEPLOYMENTS

NONE. Production remains `dpl_9Vm1Gy9G6w2U6S2oJCXQRWrmbRtj`.

## CONNECT_POINTERS_PRESERVED

YES for this task. No `User.stripeConnectAccountId` was updated. The V23 seller `5a6ec613-ce98-4df9-a171-3312eb2cb2e4` was not modified.

## PUBLIC_DELIVERY_ENABLED

NO. Production `https://homecheff.eu` was not switched on. The local server used for API checks was started with HomeCheff Delivery forced off. This task did not change a delivery flag.

## DELIVERY_READINESS_STATUS

NOT_CERTIFIED. Marketplace payment certification is not a delivery lifecycle. See `docs/audits/HOMECHEFF_DELIVERY_GATE_F_EXECUTION_PLAN.md`.

## DELIVERY_GATE_F_PREREQUISITES

BLOCKED_WITH_EXACT_PREREQUISITES. Gate F was not started.

## DELIVERY_GATE_F_EXECUTED

NO.

## REMAINING_BLOCKERS

1. Deploy the uncommitted Dutch promocode messages only after the typecheck ratchet and an isolated protected preview, then recheck invalid, expired, and exhausted copy in the browser.
2. Finish seller-transfer recovery with one new test-mode charge whose transfer is absent. Do not reuse V19 or V23.
3. Complete one CONTINUE 100% / 12-month Stripe test checkout and confirm the trial and the later list price, or record that the END path is the only zero-cost path being released.
4. Run the concurrent last-slot redemption against the preview.
5. Open public profiles for a private seller and for Basic, Pro, and Premium, and confirm the badge text.
6. Rerun the broader regression suite and the typecheck ratchet.
7. Delivery Gate F prerequisites below. Do not treat this report as Gate F approval.

## PRODUCTION_RELEASE_READY

NO.

Passing the items above does not approve a production deploy. Remaining production approval, separate from Delivery, is:

- A written decision to deploy the candidate commit.
- The candidate must be the commit that was built, not only the current preview of `9e938a70`, if the Dutch message change is included.
- Preview database isolation and Stripe test mode rechecked on that deployment.
- No production financial write, no production Connect pointer change, and no production target on the Vercel deployment.
- Manual confirmation of login, one subscription management screen, and the admin overview on that candidate.

Public Delivery stays off regardless of that decision.
