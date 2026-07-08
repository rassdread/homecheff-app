# Phase 13A Audit — Admin Command Center Modernization

**Date:** 2026-07-08  
**Scope:** Existing admin dashboard routes/components/tabs and safe modernization to a founder-operable command center.

## What was audited

- Admin page shell: `app/admin/page.tsx`
- Main admin UI: `components/admin/AdminDashboard.tsx`
- Existing admin metrics APIs: `app/api/admin/analytics/route.ts`, `app/api/admin/financial/route.ts`, `app/api/admin/subscriptions/route.ts`, `app/api/admin/affiliates/route.ts`, `app/api/admin/alerts/route.ts`, `app/api/admin/stripe-status/route.ts`
- Financial/trust references: `app/api/admin/refunds/route.ts`, `app/api/admin/payouts/route.ts`
- Business DNA SSOT: `lib/business/visibility-profile.ts`

## Existing state (before 13A)

- `AdminDashboard` was mostly legacy tabbed admin tooling with mixed Dutch/English labels and a legacy "products/orders/delivery" framing.
- Overview cards were not command-center oriented (missing explicit growth, marketplace intent split, subscription DNA status, affiliate operational health, backfill status).
- A number of requested signals were not persisted as first-class metrics (webhook failure history, reverse discovery empty states, attribution source taxonomy, SEO indexing telemetry).
- Multiple endpoints used valid role protection (`ADMIN`/`SUPERADMIN`), but `app/api/admin/stripe-status/route.ts` returned key prefixes and lacked explicit admin-role enforcement.
- Existing analytics endpoint (`app/api/admin/analytics/route.ts`) still contains legacy/simplified platform-fee calculation logic (`10% default`) and should not be treated as financial SSOT.

## Stale / risk findings

- **Outdated framing:** "Totaal Producten" and meal-era/admin-era wording in overview and financial tabs; not aligned to full marketplace intents (`OFFER`/`REQUEST`) and services expansion.
- **Dead/legacy assumptions:** "inspiration" and several demand/supply gap metrics were not represented in canonical DB fields and were effectively absent.
- **Hardcoded locale strings:** many direct Dutch labels in `AdminDashboard` and `FinancialManagement`.
- **Missing founder summary:** no single place answering platform health, risks, money blockages, growth progress, or pilot status.
- **Secret exposure risk:** Stripe admin status endpoint returned key prefixes.

## Phase 13A safe modernization delivered

- Added new founder-first read-only command center API: `app/api/admin/command-center/route.ts`
  - Uses only existing DB models and existing SSOT helper `getBusinessVisibilityProfile()`
  - Returns tracked metrics where available and explicit `not tracked yet` objects where unavailable
  - Includes sections: Overview, Marketplace, Money, Subscriptions, Affiliate, Growth, Discovery, Trust & Safety, Operations, SEO/Content
  - Includes production backfill status from existing Phase 10E audit artifact
  - Includes affiliate payout cron configuration warning signal
- Added new admin UI tab and page component:
  - `components/admin/AdminCommandCenter.tsx`
  - Integrated into `components/admin/AdminDashboard.tsx` as `command-center` default tab
- Hardened Stripe status endpoint:
  - `app/api/admin/stripe-status/route.ts` now enforces `ADMIN`/`SUPERADMIN`
  - Removed key prefix exposure (health flags only)

## What remains intentionally marked "not tracked yet"

- Failed webhook history as dedicated event stream table/endpoint
- Reverse-discovery empty state analytics
- Accepted-value filter usage analytics events
- Attribution source taxonomy and QR-specific traffic source events
- SEO indexing and broken-link telemetry
- Self-referral/suspicious-affiliate dedicated detectors
- Dedicated feed empty-rate event stream

## Guardrails respected

- No public app redesign
- No marketplace architecture changes
- No duplicate financial calculator introduced in command center
- No fake metrics; unavailable fields are explicitly marked
- Business DNA benefits resolved through `getBusinessVisibilityProfile()`
- Read-only admin summary endpoint only; no new write actions introduced
