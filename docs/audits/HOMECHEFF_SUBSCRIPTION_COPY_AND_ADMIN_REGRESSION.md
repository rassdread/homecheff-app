# Subscription copy and Admin Center regression

Date: 2026-10-28. Worktree `fix/v23-1-final-certification-delivery-readiness`. No production deploy. The protected preview `dpl_E9cPWfHs2YtFh1yCb37bSE8P82Ja` (app commit `9e938a70`) was inspected in the browser. The copy and admin presentation changes in this worktree are not on that preview.

## Authoritative plans

Source: `lib/business/visibility-profile.ts` `PLAN_CONFIG`. These numbers were not changed.

| Plan | Monthly price | Commission |
| --- | --- | --- |
| Particulier | €0 | 12% |
| Basic | €39 | 9% |
| Pro | €99 | 7% |
| Premium | €199 | 5% |

The historical reference of 7% / 5% / 2% is not the current configuration. A legacy fee map still recognizes older basis points. The live catalog and the public pages use 9% / 7% / 5%.

## Visibility that is actually implemented

- Organic Marketplace ranking is not for sale. `BUSINESS_DISCOVERY_RANKING_WIRED` is false. A paid plan does not raise ordinary search position.
- A separate sponsored recommendation exists in `lib/sponsored/recommendation.ts`. Weights are Basic 1, Pro 2, Premium 3, and only after the offer already matches what someone is browsing. It inserts after organic items. It does not promise views, clicks, or sales.
- That recommendation runs only when `SPONSORED_RECOMMENDATIONS_ENABLED` is `1` or `true`. The key exists on production as an encrypted value. It is not set in local env files. The public copy therefore says the offer *can* be shown, not that it will be.
- Homepage spotlight, regional placement, trending, and “verified business” from a paid plan are not live public benefits. A paid plan is not identity verification.

## Subscription presentation

### Current preview (rendered)

Desktop 1280 and mobile 390 on `/sell`:

- Prices €39, €99, and €199 are visible.
- Commissions 9%, 7%, and 5% are visible, worded as “Platformfee op verkopen”.
- Each card has one benefit, then a “Dit verandert er” box that repeats it and adds “Lagere platformfee op verkopen”.
- The wording uses “distributiekansen” and “distributieprioriteit”.
- The call to action is “Kies Basic / Pro / Premium”. No “Meest gekozen” label was present. Pro receives a preview ring while hovered.
- “Heb je een promocode?” is present, with Toepassen.
- At 390 the Basic card, price, commission, benefit, and button stay inside the card. Text wraps. The button is full width.

### Working tree (not yet rendered on the preview)

Customer Dutch now leads with who the plan is for, the commission in the sentence “Betaal X% commissie per verkoop.”, and three benefits that match the live entitlement: the extra recommendation only when the offer fits, a lower commission than the previous step, and an unchanged ordinary Marketplace place. Two of those benefit translations were missing, so the card would have rendered empty lines. Pro is no longer given a stronger border than the other plans. After a promotion, the card states the discounted period and either “Daarna stopt het abonnement” or the later monthly price, without the extra English line.

`npx tsx scripts/test-business-plan-presentation.ts` passed. The local Next server on port 3010 did not respond, so the new card layout was not browser-certified.

## Admin Center

Desired shape: one center, with the existing Marketplace, Growth, and Studio work still inside it.

### What the preview still does

Rendered as superadmin.

| Viewport | What was seen |
| --- | --- |
| 390 | Platform chips and the current section are visible. The domain sidebar is `display: none`. “Order Beheer” collides with Export CSV. No horizontal page overflow. |
| 768 | Domain sidebar still `display: none`. Users, orders, and growth stay reachable by URL and by the section tabs of the current domain. |
| 1280 and 1440 | Sidebar is visible: Community, Marktplaats, Financiën, Logistiek, Trust & Safety. At 1440, `innerWidth` 1440 and no horizontal overflow. |

Actions performed:

- Orders: status filter, search, date range, and Details. Opened HC-2026-0005. Status REFUNDED, buyer total €15.47, item €15.00, payout €13.20, refund €15.00. List total 5, cancelled 1. No refund or payout was submitted.
- Users: after load, 19 real accounts, 20 test accounts, 39 total. Search, role filter, and pagination controls are present.
- Growth affiliates: the existing subnavigation is present (Overzicht, Affiliates, Inkomsten, Commissies, Uitbetalingen, Promotie Links, Promocodes, Koppelingen). The first paint briefly showed the command center in English, then settled on Groei.
- Studio desk: raw JSON for Global, Marketplace, Growth, and Studio, not a project workspace. Counts: paid orders 4, gross €60.98, transfers €60.40, refund records 2, delivery profiles 12, workspace projects 0, provider cost not stored. Stripe test mode is labeled. This is not live revenue.

### Inventory

| Section | Status |
| --- | --- |
| Order management, filters, details | PRESERVED |
| User management, real/test split, filters | PRESERVED |
| Growth affiliate workspace | PRESERVED |
| Finance, delivery, promotions, disputes | NOT_VERIFIED this pass (routes still mounted) |
| Studio project operations | MISSING as a historical screen. The repo has counts only. Provider cost and studio revenue are not stored, so they stay “Niet vastgelegd”. |
| Compact domain navigation | REPAIRED in source: domains stay visible as a horizontal row below the desktop breakpoint, instead of a hidden sidebar. Not on the preview yet. |
| Studio and overview JSON | REPAIRED in source: Dutch labeled facts. Studio shows only Studio. Overview keeps the existing cards first. Not on the preview yet. |
| Order title at 390 | REPAIRED in source: the heading and actions wrap. Not on the preview yet. |
| Permission matrix | NOT_VERIFIED this pass. The earlier HTTP matrix is unchanged and was not rerun. |

## Release gates

Do not treat these as passed.

| Gate | Result |
| --- | --- |
| ADMIN_CENTER_VISUAL_REGRESSION | FAIL on the preview at 390 (title collision, hidden domains). Source repair not rendered. |
| ADMIN_CENTER_NAVIGATION | PARTIAL. Desktop sidebar and URL tabs work. Tablet and phone hide the domain list on the preview. |
| MARKETPLACE_ADMIN_FUNCTIONS | PARTIAL. Orders and users were used. Refunds, Connect, subscriptions, and payouts were not executed. |
| GROWTH_ADMIN_FUNCTIONS | PARTIAL. Affiliate workspace opened. Campaign status was not changed. |
| STUDIO_ADMIN_FUNCTIONS | PARTIAL. Summary counts only. No project or job action exists to run. |
| ADMIN_DATA_SYNCHRONIZATION | PARTIAL. User counts and the paid-order summary match the earlier preview query. Not every table was rechecked. |
| ADMIN_PERMISSION_ENFORCEMENT | NOT_VERIFIED this pass. |
| RESPONSIVE_ADMIN_LAYOUT | FAIL on the preview at 390 and 768 for domain navigation. |
| PRODUCTION_RELEASE_READY | NO |
