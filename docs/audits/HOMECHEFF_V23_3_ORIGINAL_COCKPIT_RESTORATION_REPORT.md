# HOMECHEFF V23.3 original cockpit restoration

TASK_NAME: HOMECHEFF_V23_3_ORIGINAL_ADMIN_COCKPIT_RESTORATION_AND_PROMOCODE_RELEASE

SOURCE_BRANCH: fix/v23-2-final-ui-repair-certification

SOURCE_HEAD: 4ef8f4df76bce505b9a92d27f0d10484cd87865b

FINAL_BRANCH: fix/v23-3-original-admin-cockpit-restoration

The application commit on this branch is 2a5ddec3cb95efb2f5a0e460c04ffec2fdf670b1. FINAL_HEAD and REMOTE_HEAD are the commit that contains this report, which is later than the deployed application commit.

WORKTREE_CLEAN: yes once this file is committed.

## Why the V23.2 branch head differed from the preview

V23.2 branch head `4ef8f4df` is two commits after deployed application commit `882c6eed`. `git diff --stat 882c6eed..4ef8f4df` is only `docs/audits/HOMECHEFF_V23_2_FINAL_UI_AND_RELEASE_CERTIFICATION.md` (179 lines). No application, test, or uncommitted code sat in that gap. The V23.2 preview therefore did not contain this report, and it did contain every application change on that branch.

## Original cockpit

ORIGINAL_COCKPIT_COMMIT: b2d3bc8362a5d405be9f9a81dee29cd10151ee29

That is the last application commit before the consolidation in `1643bb31` (“Add one admin center with explicit platform capabilities”). The cockpit layout itself was introduced in `068550d6` (“feat: finalize founder control center and pilot readiness”). `b2d3bc83` still has that layout, plus the later refund and admin-data fixes.

ORIGINAL_COCKPIT_ROUTES:

- `/admin?domain=&tab=` for every dashboard section
- `/admin/profile`, `/admin/beta`, `/admin/hcp`, `/admin/hcp-carousel`, `/admin/variabelen`, `/admin/clear-chat`

ORIGINAL_COCKPIT_LAYOUT_COMPONENTS:

- `components/admin/FounderControlCenterShell.tsx`
- `components/admin/AdminDashboard.tsx`
- `lib/founder-control-center/navigation.ts`

ORIGINAL_COCKPIT_NAVIGATION: one sidebar lists every domain the signed-in administrator may open. Domains at `b2d3bc83`: Command Center, Community, Marketplace, Finance, Logistics, Growth, Trust & Safety, Insights, Platform. Studio was not a domain yet.

ORIGINAL_COCKPIT_FUNCTIONAL_INVENTORY: command center, pulse, users, messages, sellers, products, orders, finance, delivery, live map, affiliates, verdien funnel, promotions, HC campaigns, notifications, disputes, moderation, analytics, promo analytics, login analytics, variabelen, geographic, settings, audit log, admin access, plus the standalone routes above. Those tab ids are unchanged in the current navigation file. Studio desk was added later and remains.

## Original versus current

The consolidation did not delete those screens. It added a platform switcher (Algemeen, Marktplaats, Groei, Studio) that showed only the domains of the selected platform. On the V23.2 preview, opening `/admin` therefore hid Community, Marketplace, Finance, Logistics, and Trust until Marktplaats was chosen. Growth and Studio replaced the cockpit as the first navigation layer.

| Feature | Status before this repair | Correction |
| --- | --- | --- |
| Command Center through Platform tabs | HIDDEN behind the platform switcher | Sidebar lists every allowed domain again |
| Community users, messages, sellers | HIDDEN | Visible as Community |
| Courier desk and live map | HIDDEN under Marktplaats | Visible as Logistiek |
| Finance, orders, products | HIDDEN under Marktplaats | Visible as Financiën and Marktplaats |
| Growth affiliate workspace | MOVED behind a Groei chip | Still the same screen, now a domain in the same sidebar |
| Studio summary | REPLACED the cockpit entry | Still the same summary, now one domain among the others |
| Authorization and fee logic | PRESERVED | Not reverted |

RESTORED_ADMIN_COMPONENTS: `FounderControlCenterShell` again renders `getVisibleDomains()`. The header badge is Founder Control Center again. The platform chips are gone. Compact widths keep a horizontal domain list so the sidebar is not hidden behind a hamburger.

PRESERVED_ADMIN_COMPONENTS: every original tab component, the capability map, order refund labels, and the Studio summary that says “Niet vastgelegd” instead of raw JSON.

MISSING_ADMIN_COMPONENTS: none of the `b2d3bc83` tab ids were absent from source. No historical screen was invented.

## Browser evidence on the new preview

Host: `homecheff-7w9ybska8-sergio-s-projects-f7b64ee1.vercel.app`

Deployment `dpl_P6Up2eeJGbpNGHaCZMyC58mtX66a`, target none, commit `2a5ddec3cb95efb2f5a0e460c04ffec2fdf670b1`.

At 1440px the sidebar showed all ten domains: Command Center, Community, Marktplaats, Financiën, Logistiek, Groei, Trust & Safety, Inzichten, Platform, Studio. Page overflow was false.

At 768px and 390px the aside stayed `display: block`, those domains were in the aside text, and page overflow was false. The compact tool viewport (about 375px) showed the same domain names before the width override.

Community at `/admin?domain=community&tab=users` showed Gebruikers, Berichten, and Verkopers.

Logistiek at `/admin?domain=logistics&tab=delivery` showed Bezorgers, Live Locaties, and Bezorger Management, with Totaal Bezorgers 12.

Studio at `/admin?domain=studio&tab=studio-desk` stayed inside the same sidebar. The summary included “Niet vastgelegd” and did not show raw JSON.

Growth at `/admin?domain=growth&tab=affiliates` showed the existing workspace: Overzicht, Inkomsten, Commissies, Uitbetalingen, Promotie Links, Promocodes, Koppelingen, plus Affiliates, Promotions, and the HCP links. Community and Studio were still in the same sidebar.

COMMUNITY_ADMIN_STATUS: PARTIAL. The users section opened. Filters, search, and moderation actions were not exercised.

COURIER_ADMIN_STATUS: PARTIAL. The courier desk rendered and counted 12 profiles. Identity documents were not opened. No courier record was changed. Public Delivery stays off.

BUSINESS_ADMIN_STATUS: PARTIAL. The Verkopers tab is present. Subscription rows were not opened one by one.

MARKETPLACE_ADMIN_STATUS: PARTIAL. Marktplaats is in the restored sidebar. Order details were certified on the previous preview and were not reopened here.

GROWTH_ADMIN_STATUS: PASS for navigation. The existing affiliate workspace opened inside the cockpit. No payout was executed.

STUDIO_ADMIN_STATUS: PASS for the summary that exists. Provider cost and customer revenue stay “Niet vastgelegd”.

ADMIN_NAVIGATION_STATUS: PASS on the widths above. The platform switcher is gone.

ADMIN_PERMISSION_STATUS: PARTIAL. Capability unit tests passed (18). A live HTTP matrix was not repeated on this deployment. Authorization was not weakened.

ADMIN_DATA_RECONCILIATION: the courier desk showed 12 profiles, matching the earlier preview count of unblocked delivery profiles. User, order, and revenue totals were not recounted on this deployment. Studio money remains “Niet vastgelegd”.

The €0.47 on HC-2026-0005 is the buyer surcharge from `calculateStripeFeeForBuyer`. For a €15.00 item (1500 cents) the function returns buyer total 1547 and surcharge 47. The formula is `ceil((subtotal + 25) / (1 - 0.014))`. The seller consideration stays €15.00. The 12% private commission on that consideration is €1.80, and the seller transfer is €13.20. Historical rows were not rewritten. The V23.2 labels remain in the deployed order detail from `882c6eed`; this commit did not change them.

## Subscriptions and public affiliate copy

SUBSCRIPTION_PRICES_STATUS: PASS. The new preview shows Particulier €0, Basic €39, Pro €99, Premium €199.

SUBSCRIPTION_COMMISSIONS_STATUS: PASS. The cards show 12%, 9%, 7%, and 5%. The old 7% / 5% / 2% rates were not restored. `PLAN_CONFIG` was not edited.

SUBSCRIPTION_COPY_STATUS: PASS on `/sell` at 1280px. Each paid card states who it is for, the monthly price, “Betaal slechts X% commissie per verkoop.”, and the conditional sponsored line. The live preview now uses that same sentence. Ordinary ranking is still described as not for sale.

PUBLIC_AFFILIATE_PAYOUT_COPY_REMOVED: YES on the public plan page and its FAQ. `/sell` did not contain “per betaalde factuur” or “19,50”. The public FAQ question about affiliate earnings was removed. `/llms.txt` no longer receives the payout lines from `businessPlanMachineBrief`. `affiliateRewardsForPlans()` still returns 1950 / 4950 / 9950 cents. The affiliate page variant still explains those amounts. Affiliate payout code was not changed.

PUBLIC_AFFILIATE_BUTTON_REMOVED: YES. “Leg dit uit als affiliate” was absent on `/sell`.

AFFILIATE_BACKEND_PRESERVED: YES. No affiliate commission, attribution, or payout function was edited. The affiliate workspace still opens.

## Promotion codes

PROMOTION_CODE_END_STATUS: NOT RE-RUN. The earlier END zero-cost activation was not repeated. END still uses the free-entitlement path in `app/api/subscribe/route.ts` and does not open Stripe.

PROMOTION_CODE_CONTINUE_STATUS: PARTIAL. On this preview, `NOPE-V233` showed “Deze actiecode bestaat niet.” `V231FULL12` showed “Eerste 12 maanden” and “Daarna betaal je”. The CONTINUE Stripe Checkout was not completed, so trial days, payment-method collection, activation, and the later €39 invoice were not observed on a Stripe subscription. Completing it would create a test-mode subscription and reserve a redemption. That was not done. `V231FULL12` is not a Dewey code.

STRIPE_TEST_CHECKOUT_STATUS: NOT RUN. Preview `STRIPE_SECRET_KEY` is `sk_test`. No checkout session was created.

DEWEY_ONBOARDING_READINESS: NOT READY for a live start. The public path is: existing or new account, sign in, open `/sell`, choose Basic, Pro, or Premium, enter the confirmed code, read the price now and the price after the promotion, then pay in Stripe test or live only when explicitly authorized. Do not create a second account for an existing user. Do not redeem a production code. The actual Dewey code, plan, and duration still need a separate confirmation. No invitation was sent.

## Preview access

PREVIEW_ACCESS_STATUS: the new preview loads. Vercel project `ssoProtection` is `all_except_custom_domains`, so `*.vercel.app` asks for a Vercel team login before HomeCheff. This browser already had that session, then the app showed its own login. Protection was not disabled.

If the owner sees a Vercel login wall before any HomeCheff page, sign in at vercel.com with the account that belongs to the team that owns `homecheff-app`, then open the preview URL again. That wall is deployment protection.

PREVIEW_DEPLOYMENT_ID: dpl_P6Up2eeJGbpNGHaCZMyC58mtX66a

PREVIEW_URL: https://homecheff-7w9ybska8-sergio-s-projects-f7b64ee1.vercel.app

DEPLOYED_APPLICATION_COMMIT: 2a5ddec3cb95efb2f5a0e460c04ffec2fdf670b1

Preview database host classification: `ep-green-wind`, not `summer-darkness`. One preview-only password hash was updated for the existing synthetic superadmin so this browser could open the cockpit. No production row was written.

DESKTOP_BROWSER_STATUS: PASS at 1440px for the full domain sidebar. 1280px was used for `/sell` and for the Growth page.

TABLET_BROWSER_STATUS: PASS at 768px for a visible domain list and no page overflow. Tables were not scrolled at 768px.

MOBILE_BROWSER_STATUS: PASS at 390px for the domain list and no page overflow. The sell cards were read at 1280px, not at 390px.

## Tests and production

FULL_TEST_SUITE_STATUS: NOT RUN.

Executed and passed:

- `scripts/test-business-plan-presentation.ts`
- `scripts/validate-promocode-e2e-integration.ts` (`HOMECHEFF_PROMOCODE_END_TO_END_PASS`)
- admin capability and route-capability tests: 18 passed, 0 failed

TYPESCRIPT_RATCHET_STATUS: PASS. 699 current, 767 baseline, 0 new, 68 resolved. The baseline was not shrunk.

PRODUCTION_BUILD_STATUS: the isolated Vercel preview build of `2a5ddec3` is READY. A local `next build` was not run.

PRODUCTION_DEPLOYMENTS: unchanged. Latest production is still `dpl_9Vm1Gy9G6w2U6S2oJCXQRWrmbRtj` at `85b11d6d4708f68760122314a1ace654591f7643`, READY.

PRODUCTION_DATABASE_WRITES: NONE.

PRODUCTION_STRIPE_WRITES: NONE.

STRIPE_CONNECT_POINTERS_PRESERVED: no Connect id was written.

PUBLIC_DELIVERY_ENABLED: NO. `https://homecheff.eu/api/delivery/alignment-flags` returned `homeCheffDeliveryEnabled: false` and the other delivery flags false.

DELIVERY_GATE_F_EXECUTED: NO.

## Gates

| Gate | Result | Evidence |
| --- | --- | --- |
| A Original cockpit identified | PASS | `b2d3bc83`, shell and navigation file |
| B Layout restored and opened | PASS | Ten domains at 1440, 768, 390, and the compact viewport |
| C Original functions preserved | PARTIAL | Tab ids remain. Users, couriers, growth, and studio opened. Not every action was clicked. |
| D Growth and Studio inside the cockpit | PASS | Both are domains in the same sidebar. The platform switcher is gone. |
| E Community, couriers, business | PARTIAL | Community and courier desks opened. Seller subscription rows were not opened. |
| F Data reconciled | PARTIAL | Courier count 12. Studio money is “Niet vastgelegd”. The €0.47 surcharge matches `calculateStripeFeeForBuyer(1500)`. |
| G Prices and commissions | PASS | €0/12%, €39/9%, €99/7%, €199/5% on the new preview |
| H Public affiliate payouts removed | PASS | No payout line and no “Leg dit uit als affiliate” on `/sell`. Backend untouched. |
| I END and CONTINUE certified | PARTIAL | Invalid Dutch and the CONTINUE price disclosure passed. Stripe Checkout was not completed. END was not repeated. |
| J Promo onboarding certified | BLOCKED | No isolated checkout was finished. Dewey’s code is not confirmed. |
| K Owner can open the preview | PARTIAL | The deployment is READY and protected. This browser opened it after an existing Vercel session plus the app login. |
| L Authorization | PARTIAL | Unit tests passed. Live HTTP matrix not repeated. |
| M Desktop, tablet, mobile | PARTIAL | Admin navigation passed at 1440, 768, and 390. Sell cards were read at 1280. |
| N Tests, ratchet, build | PARTIAL | Listed tests and the ratchet passed. Preview build READY. Full suite and local build not run. |
| O Production unchanged | PASS | Same production deployment and commit. Delivery flags false. |

REMAINING_BLOCKERS:

- CONTINUE 100% Stripe Checkout was not completed, so subscription activation and the later invoice were not observed.
- Expired, exhausted, wrong-tier, and repeated-redemption cases were not clicked on this preview.
- Dewey’s code, plan, and duration are not confirmed, and no onboarding account was created.
- Live administrator HTTP checks were not repeated.
- The full regression suite and a local production build were not run.
- Seller subscription rows and courier identity fields were not opened.

PRODUCTION_RELEASE_READY: NO
