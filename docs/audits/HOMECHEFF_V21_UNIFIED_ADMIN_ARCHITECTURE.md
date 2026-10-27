# HomeCheff V21 unified admin architecture

Date: 2026-10-27

Branch: `feat/unified-admin-center-v21`

Source: `fix/financial-recovery-admin-alignment-v20` at `7591a5ea95e55f4a247d4df0c92abd2f57051d3f`

## What was extended

The Founder Control Center remains the admin shell. V21 did not add a second application, a second user table, or a second financial ledger.

`components/admin/FounderControlCenterShell.tsx` now shows four platform switches: Global, Marketplace, Growth, and Studio. Each switch filters the existing domains:

| Platform | Existing domains |
| --- | --- |
| Global | Command Center, Platform |
| Marketplace | Community, Marketplace, Finance, Logistics, Trust |
| Growth | Growth, Insights |
| Studio | New `studio` domain with the `studio-desk` tab |

Existing tabs, pages, and APIs stay in place. Marketplace orders, payments, promotions, delivery, affiliates, and campaigns still render their current components.

## Studio

There is no separate Studio customer application or Studio billing ledger in this repository. The public `/studio` route is a participation landing page. The admin desk reports two existing record sets:

- `WorkspaceContent` project count
- `MarketplaceVideoJob` counts by status

It does not return media URLs. Provider cost and customer revenue are reported as unavailable because those ledgers do not exist. They are not shown as zero revenue.

## Global summary

`GET /api/admin/center/summary` returns only the sections the caller may see. Marketplace gross uses `paidMarketplaceOrderWhere` and `sumCurrentModeGrossCents`. The response includes the current Stripe mode. Test-mode amounts are labeled as test mode.

## User identity

One `User` row remains the account. Buyer, seller, delivery, and affiliate participation still come from the V20 relation checks. The user overview now hides marketplace, growth, payment, and studio sections when the caller lacks the matching capability.

## Database

No Prisma migration. Explicit grants are stored in the existing `User.adminRoles` array with the prefix `cap:` plus the marker `cap:SCOPED`. Legacy role names in that array are preserved.

## Not rebuilt

Marketplace checkout, Growth campaigns, Studio customer pages, subscription prices, and commission rates were not changed.
