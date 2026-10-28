# HOMECHEFF V23.2 final UI and release certification

TASK_NAME: HOMECHEFF_V23_2_FINAL_UI_REPAIR_AND_RELEASE_CERTIFICATION

SOURCE_BRANCH: fix/v23-1-final-certification-delivery-readiness

SOURCE_HEAD: ad568df452b3a0d505fda2862de5ebb4324e5a66

FINAL_BRANCH: fix/v23-2-final-ui-repair-certification

Application commits on that branch:

- 31916b1371693c48df54aac116e22a074cbf65d1 customer Dutch and admin navigation
- 882c6eed4eb7b3bf683ae64a481980bf5361e810 buyer-refund labels

REMOTE_HEAD of this branch is the docs commit that adds this report, if that commit has been pushed. The deployed application commit is 882c6eed4eb7b3bf683ae64a481980bf5361e810.

WORKTREE_CLEAN: yes after the docs commit, aside from this report until it is committed.

UNCOMMITTED_CHANGES_RESOLVED: the V23.1 source repairs were reviewed and committed. They were not discarded.

## Subscriptions

SUBSCRIPTION_PRICES_VERIFIED: YES. `PLAN_CONFIG` is still Basic €39 (3900), Pro €99 (9900), Premium €199 (19900). The new preview renders those prices.

SUBSCRIPTION_COMMISSIONS_VERIFIED: YES. Private 12% (1200 bps), Basic 9% (900), Pro 7% (700), Premium 5% (500). The historical 7% / 5% / 2% rates were not restored. Fee snapshots still use basis points; a later program change does not rewrite an old snapshot (existing fee-snapshot tests passed).

SUBSCRIPTION_BENEFITS_VERIFIED: YES, limited to what is implemented. A paid plan lowers the commission. It can be included in a separate sponsored recommendation with weights Basic 1, Pro 2, Premium 3, only after the offer already matches, and only when `SPONSORED_RECOMMENDATIONS_ENABLED` is on. Ordinary Marketplace rank is not for sale (`BUSINESS_DISCOVERY_RANKING_WIRED` is false). Homepage placement and “verified business” are not sold with the plan.

SUBSCRIPTION_COPY_STATUS: committed. Each card states who it is for, a headline, the monthly price, “Betaal slechts X% commissie per verkoop.”, and three benefits: the conditional extra recommendation, more left from each sale than the previous step, and an unchanged ordinary Marketplace place.

SUBSCRIPTION_BROWSER_STATUS: PASS on the new preview, viewport 1280 and the page text at that width. Route `/sell`. Rendered lines include “Betaal slechts 9% / 7% / 5% commissie per verkoop.”, “Start met Basic”, “Kies Pro”, “Kies Premium”. The secondary live-preview panel on the same page still says “Platformfee: 9%”. The percentage matches. That panel was not rewritten in this deploy.

## Promotion codes

PROMOTION_CODE_FUNCTIONAL_STATUS: PARTIAL.

- Invalid code `NOPE-V232` on the new preview returned “Deze actiecode bestaat niet.”
- `V231FULL12` (100%, 12 cycles, CONTINUE) showed €39 struck through, €0 now, “Eerste 12 maanden: €0”, and “Daarna betaal je €39 per maand tot je opzegt.” Commission stayed 9%.
- The CONTINUE Stripe trial checkout was not completed. The earlier END zero-cost activation was not repeated on this deployment.
- Expired and exhausted codes were not clicked again. The promo validator and redemption-limit unit tests passed.
- No live subscription was created.

PROMOTION_CODE_UX_STATUS: the field label is now “Heb je een actiecode?”. It sits above the plan cards. Toepassen and Wissen are present. Touch height remains 44px.

PROMOTION_CODE_DUTCH_FEEDBACK: YES for an unknown code on the deployed preview.

PROMOTION_DURATION_DISPLAY: YES for the CONTINUE 12-month quote.

FUTURE_BILLING_DISCLOSURE: YES for that CONTINUE quote. It states the later €39 monthly price until cancellation. An END code was not reapplied on this deployment.

## Admin Center

ADMIN_ORIGINAL_FUNCTIONS_PRESERVED: the order desk, its filters, and the affiliate workspace are still the existing screens. They were not replaced.

ADMIN_VISUAL_REGRESSION_STATUS: the previous 390px collision is gone on the new preview. `Orderbeheer` and Export CSV do not overlap (`getBoundingClientRect` overlap false, document overflow false).

ADMIN_NAVIGATION_STATUS: PASS on the tested widths.

- 390px: domain chips visible (Community, Marktplaats, Financiën, Logistiek, Trust & Safety). Aside `display: block`. No page overflow.
- 768px: aside `display: block`. No page overflow.
- 1440px: sidebar shows “onderdelen” counts for Community, Marktplaats, Financiën, Logistiek, and Trust & Safety.
- Compact tool viewport about 375px: Groei and its section tabs were visible.
- 1280px was not captured as its own screenshot. 1440px covers the desktop sidebar.

MARKETPLACE_ADMIN_STATUS: PARTIAL. On `/admin?domain=marketplace&tab=orders`, filters and the order list loaded. Details for HC-2026-0005 opened. Users, listings, Connect, and payout execution were not re-run. No refund or payout was submitted.

GROWTH_ADMIN_STATUS: PARTIAL. `/admin?domain=growth&tab=affiliates` opened the existing affiliate desk. Visible sections include Overzicht, Inkomen, Commissies, Uitbetalingen, Promo, and Koppelingen, plus Affiliates, Verdien funnel, Promotions, HC-campagnes, and Notificaties. No campaign was changed. The page did not show Studio or Marketplace JSON.

STUDIO_ADMIN_STATUS: PASS for the summary that exists. `/admin?domain=studio&tab=studio-desk` shows only Studio: Projecten 0, Generatie-opdrachten Geen, Providerkosten Niet vastgelegd, Klantomzet Niet vastgelegd. No raw JSON. There is still no historical project-management screen to restore.

ADMIN_DATA_RECONCILIATION: fresh preview query, same definitions as the admin population helpers.

- Real users 19, demonstrable test users 20, products 8, unblocked delivery profiles 12.
- Paid marketplace orders in test mode: two DELIVERED at 1502 and two CONFIRMED at 1547. Sum 6098 cents (€60.98). Refunded orders are excluded from that sum.
- These match the earlier preview observation. They were recalculated, not hardcoded.

ADMIN_FINANCIAL_LABEL_RECONCILIATION: the amounts are different components, and the labels now say so.

HC-2026-0005, preview order, Stripe test mode, charge `ch_3UVGm5RpYdPVF6LP0JrNpRgE`, refund `re_3UVGm5RpYdPVF6LP0wSFLLWo`.

| Record | Cents | Meaning |
| --- | --- | --- |
| Stripe charge and `amount_refunded` | 1547 | Buyer paid €15.47 and was refunded €15.47. `livemode` false. |
| Order item | 1500 | Product price. |
| Transaction `amountCents` and Refund row | 1500 | Seller consideration. The €0.47 difference is the buyer surcharge, not part of this row. |
| Payout | 1320 | Seller transfer. 1500 minus 12% (180) is 1320. Fee basis points on the transaction are 1200. |
| RefundSettlement `buyerRefundCents` | 1547 | Full buyer gross. |

The detail modal on the new preview shows “Bedrag dat de koper heeft betaald €15,47”, “Koper terugbetaald: €15,47”, “Verkopersbedrag €15,00”, “Uitbetaald aan verkoper: €13,20”, and “Verkopersbedrag terug: €15,00”. Historical rows were not rewritten.

ADMIN_PERMISSION_STATUS: PARTIAL. Unit tests for scoped admins, read-only, unknown routes, and self-promotion rules passed (40 tests in the admin, fee, recovery, and promo-limit run). The live HTTP matrix was not repeated against this deployment.

MOBILE_ADMIN_STATUS: PASS at 390px for domain chips, order heading, and no overlap.

TABLET_ADMIN_STATUS: PASS at 768px for a visible domain list and no page overflow. The order table itself was not scrolled through at 768px.

DESKTOP_ADMIN_STATUS: PASS at 1440px for the sidebar and order details. 1280px was not a separate capture.

## Recovery, tests, and build

SELLER_TRANSFER_RECOVERY_STATUS: NOT CERTIFIED. Unit tests for the recovery rules passed. No safe fixture exists: the known failed transfer belongs to a refunded order, and the certified V23 transfer was later reversed. A new absent-transfer case needs a fresh Stripe test checkout and webhook. That was not created. Production Stripe was not used.

REGRESSION_TEST_STATUS: PARTIAL.

- `scripts/test-business-plan-presentation.ts` passed.
- `scripts/validate-promocode-e2e-integration.ts` passed.
- `npx tsx --test` of admin capabilities, admin routes, seller-transfer recovery, promo limits, and marketplace fee snapshots: 40 passed, 0 failed.
- Delivery deployment-gate and activation-blocker tests: 14 passed, 0 failed.
- The full repository suite and the preview database integration suite were not run.

TYPESCRIPT_STATUS: PASS. Ratchet: 699 current, 767 baseline, 0 new, 68 resolved. The baseline was not shrunk.

BUILD_STATUS: the isolated Vercel preview build of 882c6eed is READY. A local `next build` was not run. This machine has previously stopped that build at the 4096 MB heap limit.

## Deployment

PREVIEW_DEPLOYMENT_ID: dpl_3B8WdAw2Fp5FP7GdevECTJvNMSFp

PREVIEW_URL: https://homecheff-p8y926p53-sergio-s-projects-f7b64ee1.vercel.app

DEPLOYED_COMMIT: 882c6eed4eb7b3bf683ae64a481980bf5361e810

Target of that deployment: none. It is not production.

An earlier preview of 31916b13 (`dpl_5aBQ3uJc396Aj61HDuEAMGuhzRZC`) does not include the refund labels. The browser evidence above is from `dpl_3B8WdAw2Fp5FP7GdevECTJvNMSFp`.

Vercel Authentication still fronts the deployment. The app itself was reachable with the existing protected session, then a synthetic preview superadmin signed in. The password was not recorded in this report.

BROWSER_TEST_EVIDENCE:

- `/sell` at 1280px: plan facts, cards, actiecode, invalid Dutch error, CONTINUE quote.
- `/admin?domain=marketplace&tab=orders` at 390px, 768px, and 1440px.
- Order details for HC-2026-0005 at 1440px.
- `/admin?domain=studio&tab=studio-desk` at 768px.
- `/admin?domain=growth&tab=affiliates` at the compact viewport (about 375px).

## Production and Delivery

PRODUCTION_DATABASE_WRITES: NONE.

PRODUCTION_STRIPE_WRITES: NONE. The charge read was test mode.

PRODUCTION_DEPLOYMENTS: unchanged. Production remains `dpl_9Vm1Gy9G6w2U6S2oJCXQRWrmbRtj` at `85b11d6d4708f68760122314a1ace654591f7643`, READY. Rechecked after the preview deploy.

CONNECT_POINTERS_PRESERVED: no Connect account id was written.

PUBLIC_DELIVERY_ENABLED: NO on production. `https://homecheff.eu/api/delivery/alignment-flags` returned `homeCheffDeliveryEnabled: false` and the other delivery flags false. The new preview’s flag URL returned HTTP 302 from Vercel Authentication, so the preview flag was not read anonymously. The deployment did not change the flag.

DELIVERY_GATE_F_EXECUTED: NO. The existing plan was not changed.

## Gates

| Gate | Result |
| --- | --- |
| A Prices, commissions, benefits | PASS |
| B Subscription cards | PASS on the new preview. The adjacent live-preview line still says “Platformfee”. |
| C Promotion codes | PARTIAL. Invalid Dutch and the CONTINUE price disclosure passed. CONTINUE checkout was not paid. |
| D Existing admin functions | PARTIAL. Orders, growth, and studio opened. Users and finance actions were not repeated. |
| E Responsive navigation | PASS at 390, 768, and 1440. 1280 was not a separate capture. |
| F Data and financial labels | PASS for the recounted population and for HC-2026-0005. |
| G Permissions | PARTIAL. Unit tests passed. Live HTTP matrix not repeated. |
| H Seller transfer recovery | NOT CERTIFIED. No safe absent-transfer fixture. |
| I Tests, typecheck, build | PARTIAL. Ratchet and the listed tests passed. Preview build READY. Full suite and local next build not run. |
| J New protected preview | PASS for the routes named above. |

REMAINING_BLOCKERS:

- CONTINUE 100% Stripe trial checkout not completed.
- Seller transfer recovery not executed on a new absent transfer.
- Live administrator HTTP matrix not repeated on this deployment.
- Full regression suite and local production build not run.
- Live-preview panel still uses the word “Platformfee” next to the new cards.

PRODUCTION_RELEASE_READY: NO
