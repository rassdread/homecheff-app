# Phase 13D Audit — Admin Operations & Control Center

**Date:** 2026-07-08  
**Scope:** Founder-level audit of everything ADMIN and SUPERADMIN can manage. Phases 13A (Command Center), 13B (ops dashboards), 13C (attribution integrity) are inputs — this phase audits the **full admin control plane**.  
**Rules:** No redesign. No duplicate SSOT. No fake metrics. No code changes in this phase.

---

## Executive verdict

| Question | Answer |
|----------|--------|
| **Can Sergio operate HomeCheff entirely from admin without Prisma Studio, SQL, env edits, or code?** | **No — not yet** |
| **Is the admin environment strong enough to run a pilot with founder oversight?** | **Yes** |
| **Is it complete enough to scale without engineering intervention?** | **No** |

**Summary:** HomeCheff has a **substantial** admin surface (1 main dashboard with 21 tabs, 6 standalone routes, 47 admin API routes, Phase 13A Command Center). Core marketplace ops — users, orders, refunds, escrow release, disputes, affiliate status, financial readouts, moderation, notifications — are **partially manageable**. Critical gaps block **fully autonomous** founder ops: no user suspend/restore, no subscription lifecycle admin, no delivery profile control APIs, no SEO/feature-flag admin, sparse audit logging, permissions not enforced on APIs, and several SSOT knobs still require deploy (`affiliate-config`, `visibility-profile`, `deliveryPricing`).

**Pilot autonomy (admin):** Sergio can **monitor and intervene** on most day-one incidents from `/admin` but will still need **Stripe Dashboard**, **Vercel/env**, **Prisma Studio**, or **code deploy** for ~15% of founder tasks.

---

## SSOT reference map (reuse only — do not duplicate)

| Domain | SSOT | Admin reads it? | Admin can edit it? |
|--------|------|-----------------|-------------------|
| Business plan / DNA / fees | `lib/business/visibility-profile.ts` | Command Center, seller views | **No** (DB `Subscription.feeBps` only via Settings) |
| Platform & Stripe fees | `lib/fees.ts` | Settings (display) | **No** (code) |
| Delivery pricing | `lib/deliveryPricing.ts` | Settings (hardcoded display) | **No** (code) |
| Affiliate economics | `lib/affiliate-config.ts` | Affiliate tab (derived) | **No** (code) |
| Attribution policy | `lib/affiliate-attribution-contract.ts` | Command Center (13C) | **No** (code) |
| SEO pages | `lib/seo/homecheffSeoPages.data.ts` | Command Center counts | **No** (code) |
| Settlement / checkout | `lib/marketplace/settlement/settlement-router.ts` | Indirect via orders | **No** |
| Admin tab mapping | `lib/admin-role-mapping.ts` | Dashboard UI | SUPERADMIN assign-role |
| Permission catalog | `lib/admin-preferences.ts` | AdminManagement UI | SUPERADMIN permissions API |

---

# PART 1 — Admin surface inventory

## Routes (`app/admin/`)

| Route | Component | Purpose | Page auth |
|-------|-----------|---------|-----------|
| `/admin` | `AdminDashboard.tsx` | Main tabbed hub (default: Command Center) | ADMIN \| SUPERADMIN \| `adminRoles[]` |
| `/admin/profile` | `AdminProfileClient.tsx` | Admin's own profile | ADMIN \| SUPERADMIN |
| `/admin/beta` | `AdminBetaInsightsClient.tsx` | Android beta download/signup metrics | ADMIN \| SUPERADMIN |
| `/admin/hcp` | Server + `HcpPromoDisableButton` | HCP V3 lifecycle overview | ADMIN \| SUPERADMIN \| `adminRoles[]` |
| `/admin/hcp-carousel` | `HcpCarouselAdminClient.tsx` | Carousel slide CRUD | ADMIN \| SUPERADMIN \| `adminRoles[]` |
| `/admin/variabelen` | `VariabelenDashboard.tsx` | Cross-tab analytics explorer | ADMIN \| SUPERADMIN |
| `/admin/clear-chat` | Inline page | DELETE all messages | **No page-level auth** |

Deep links: `/admin?tab=<tabId>`.

## Main dashboard tabs (`AdminDashboard.tsx`)

| Tab ID | Component | Domain |
|--------|-----------|--------|
| `command-center` | `AdminCommandCenter` | Founder ops summary (13A) |
| `overview` | Inline stats + `FinancialAlerts` + `MigrateOrdersButton` | Legacy overview |
| `orders` | `OrderManagement` | Orders + escrow |
| `financial` | `FinancialManagement` | Money (5 sub-tabs) |
| `disputes` | `DisputeResolution` | Trust / orders |
| `settings` | `PlatformSettings` | Platform config (SUPERADMIN) |
| `audit` | `AuditLog` | Admin action trail |
| `users` | `UserManagement` | User CRUD |
| `messages` | `AdminChatManagement` | Conversation oversight |
| `sellers` | `SellerManagement` | Seller profiles (read-heavy) |
| `products` | `ProductManagement` | Product list/delete |
| `delivery` | `DeliveryManagement` | Courier profiles (read) |
| `live-locations` | `LiveLocationMap` | GPS map |
| `analytics` | `AnalyticsDashboard` | Platform + GA4 |
| `promo-analytics` | `AnalyticsDashboard` | **Duplicate** — same component |
| `login-analytics` | `AnalyticsDashboard` | **Duplicate** — same component |
| `variabelen` | `VariabelenOverview` | Link to `/admin/variabelen` |
| `geographic` | `GeographicOverview` | User geography |
| `moderation` | `ContentModerationDashboard` | Image moderation |
| `notifications` | `NotificationCenter` | Broadcast push/email |
| `affiliates` | `AffiliateManagement` | 7 sub-tabs |
| `admin-management` | `AdminManagement` | SUPERADMIN only |

## Financial sub-tabs

`overview` | `transactions` | `payouts` | `refunds` | `subscriptions` (read-only list)

## Affiliate admin sub-tabs

`overview` | `affiliates` | `income` | `commissions` | `payouts` | `links` | `attributions`

## Admin API inventory (47 routes under `app/api/admin/`)

Grouped by domain — all require session unless noted.

| Domain | Routes | Methods | Notes |
|--------|--------|---------|-------|
| **Access** | `admins`, `all-users`, `assign-role`, `permissions`, `upgrade-to-superadmin`, `preferences` | R/C/U/D | SUPERADMIN except preferences (ADMIN+) |
| **Users** | `users`, `users/[id]`, `users/search`, `users/bulk-delete`, `user-contact` | R/C/U/D | Full user lifecycle except suspend |
| **Orders** | `orders`, `orders/[orderId]`, `orders/release-escrow`, `migrate-orders` | R/U/D/C | Escrow release; migrate SUPERADMIN |
| **Financial** | `financial`, `transactions`, `payouts`, `refunds`, `stripe-status`, `subscriptions` | R/C | Refund create; subs read-only |
| **Affiliates** | `affiliates`, `affiliates/[id]/status`, `affiliates/referral-link`, `affiliates/attributions` | R/U/C | No commission ledger write |
| **Analytics** | `analytics`, `analytics/unified`, `analytics/ga4`, `command-center`, `alerts`, `beta-insights` | R | Read-only ops intelligence |
| **Messages** | `messages`, `messages/[id]`, `messages/stats`, `send-message`, `send-bulk-message`, `clear-messages` | R/C/D | `clear-messages` deletes ALL |
| **Moderation** | `moderation/logs`, `moderation/review` | R/U | Image moderation only |
| **Catalog** | `products`, `sellers` | R | No admin product PATCH route |
| **Settings** | `settings` | R/PATCH | SUPERADMIN; feeBps/priceCents only |
| **HCP** | `hcp-carousel`, `hcp-carousel/[id]` | R/C/U/D | Also allows `adminRoles[]` |
| **Ops** | `disputes`, `audit-log`, `notifications/send` | R/U/C | Disputes + audit read |

## Unused / legacy admin components (not in live UI)

`EditUserModal.tsx`, `AdminMessages.tsx`, `ChatArchiver.tsx`, `AdminUserContact.tsx`, `StatTile.tsx`, `GoogleAnalyticsEmbed.tsx`, `AdminFilters.tsx` (imported but unwired).

## Modals & detail views

`CreateUserModal`, bulk message modal, contact modal (users); `OrderDetailModal`; `DisputeDetailModal`; delivery profile modal; moderation image fullscreen; `AdminChatManagement` conversation detail view.

---

# PART 2 — User administration

## What exists

| Capability | Status | Evidence |
|------------|--------|----------|
| Search users | ✅ | `GET /api/admin/users/search` |
| List all users | ✅ | `UserManagement` + `GET /api/admin/users` |
| Create user | ✅ | `CreateUserModal` + POST users |
| Edit user (API) | ✅ | `PATCH /api/admin/users/[id]` — name, email, username, role, password, profile |
| Edit user (UI) | ⚠️ Partial | `EditUserModal` exists but **not wired**; no inline edit in list |
| Delete user | ✅ | DELETE users/[id], bulk-delete |
| Bulk message | ✅ | `send-bulk-message` |
| Contact lookup | ✅ | Contact modal + `user-contact` API |
| Role assignment | ✅ | PATCH supports USER, ADMIN, SELLER, BUYER, DELIVERY — **not SUPERADMIN** via this route |
| Filters | ⚠️ | Client-side search only; `AdminFilters` unwired |

## Role coverage

| Role | Visible in admin | Manageable |
|------|------------------|------------|
| USER / BUYER | ✅ | Edit, delete |
| SELLER | ✅ | Via users + sellers tab (read stats) |
| DELIVERY | ✅ | Users tab + delivery tab |
| AFFILIATE | ⚠️ | Separate affiliates tab; not on user row |
| ADMIN | ✅ | Admin management (SUPERADMIN) |
| SUPERADMIN | ✅ | assign-role API |
| BUSINESS | ⚠️ | Not a `UserRole` enum value — inferred via seller profile + subscription |

## Missing user admin capabilities

| Gap | Priority |
|-----|----------|
| Disable / suspend account (non-destructive) | **P0** |
| Restore suspended account | **P0** |
| Reset onboarding state | **P1** |
| Verify business (KVK) from admin | **P1** |
| Verify identity (Stripe Identity) status + override | **P1** |
| Manage user Stripe Connect state | **P1** |
| Manage business subscription from user record | **P0** (see Part 5) |
| Manage affiliate status from user record | **P2** (exists in affiliate tab only) |
| Manage delivery profile activation | **P0** (see Part 8) |
| Email verification override | **P1** |
| Impersonate / login-as (support) | **P3** (not implemented — may be intentional) |
| Audit log on user edits | **P1** |

---

# PART 3 — Permission matrix

## Role model

**Top-level (`User.role`):** `USER`, `BUYER`, `SELLER`, `DELIVERY`, `ADMIN`, `SUPERADMIN`.

**Delegated scopes (`User.adminRoles[]`):** `users_management`, `products_management`, `orders_management`, `delivery_management`, `analytics_viewer`, `content_moderator`, `user_support`, `financial_viewer`, `system_admin`.

**Granular flags (`AdminPermissions` table):** 30+ booleans in `lib/admin-preferences.ts` — managed via SUPERADMIN `permissions` API.

## Who may perform key actions?

| Action | USER | SELLER | DELIVERY | AFFILIATE | ADMIN | SUPERADMIN | `adminRoles` only |
|--------|------|--------|----------|-----------|-------|------------|-------------------|
| View Command Center | — | — | — | — | ✅ | ✅ | ⚠️ Page loads, **0 tabs** |
| Delete user | — | — | — | — | ✅ | ✅ | ❌ API blocks |
| Edit platform fees | — | — | — | — | ❌ | ✅ | ❌ |
| Release escrow | — | — | — | — | ✅ | ✅ | ❌ |
| Create refund | — | — | — | — | ✅ | ✅ | ❌ |
| Suspend affiliate | — | — | — | — | ✅ | ✅ | ❌ |
| Manual attribution link | — | — | — | — | ✅ | ✅ | ❌ |
| Clear all messages | — | — | — | — | ✅ | ✅ | ❌ |
| Assign admin roles | — | — | — | — | ❌ | ✅ | ❌ |
| HCP carousel CRUD | — | — | — | — | ✅ | ✅ | ✅ |
| Image moderation review | — | — | — | — | ✅* | ✅* | ❌ |

\*Moderation API checks session role only — no DB re-fetch; no `content_moderator` enforcement.

## Route protection findings

| Finding | Severity |
|---------|----------|
| **No middleware** on `/admin/*` or `/api/admin/*` | P1 |
| **47 independent auth checks** — drift risk (`lib/guards.ts` excludes SUPERADMIN) | P1 |
| **`AdminPermissions` not enforced on APIs** — UI filtering only | **P0** |
| **`adminRoles`-only users** see empty dashboard; HCP works | P1 |
| **`/admin/clear-chat` no page auth** | **P0** |
| **`upgrade-to-superadmin`** — ADMIN can self-promote if no SUPERADMIN exists | P2 (bootstrap) |
| **User report notifications** go to `role: ADMIN` only — misses SUPERADMIN | P2 |

## Privilege escalation risks

1. Any user promoted to `ADMIN` gets **full API access** regardless of `AdminPermissions` flags.
2. Delegated `adminRoles` suggest least-privilege but **APIs ignore them** (except HCP carousel).
3. PATCH users can set `role: ADMIN` without SUPERADMIN check on users/[id] route.

---

# PART 4 — Marketplace operations

| Entity | Admin list | Admin edit | Admin delete | Without DB? |
|--------|------------|------------|--------------|-------------|
| **Products** | ✅ `ProductManagement` | ⚠️ Uses public `DELETE /api/products/[id]` | ✅ | Mostly |
| **Listings (legacy)** | ✅ In products API | ❌ | ❌ | No |
| **Requests** | ⚠️ Via products filter | ❌ | ❌ | No |
| **Services** | ⚠️ Via products/category | ❌ | ❌ | No |
| **Orders** | ✅ | ✅ status, notes, cancel | ✅ | Yes |
| **Proposals** | ❌ No admin UI | ❌ | ❌ | **No** |
| **Conversations** | ✅ read all | ❌ | ⚠️ clear ALL messages | Partial |
| **Reviews** | ❌ No dedicated admin | ❌ | ❌ | **No** |
| **Trust signals** | ⚠️ Command Center counts | ❌ | ❌ | No |
| **Escrow** | ✅ release-escrow API | ✅ | — | Yes |
| **Refunds** | ✅ financial tab | ✅ Stripe refund | — | Yes |
| **Disputes** | ✅ | ✅ resolve | — | Yes |
| **Delivery assignment** | ❌ | ❌ | ❌ | **No** |
| **Cancellation** | ✅ via order PATCH | ✅ | — | Yes |
| **Visibility / Business DNA** | ⚠️ Command Center read | ❌ plan change only via user subscribe flow | — | **No** |
| **Pending accepted values** | ✅ Command Center metric | ❌ No admin queue UI | — | **No** |

---

# PART 5 — Subscription administration

## What exists

- **Read:** `GET /api/admin/subscriptions` — seller profiles + subscription status + SUB-* revenue stats.
- **Catalog edit:** `PATCH /api/admin/settings` — `Subscription.feeBps`, `priceCents` (SUPERADMIN).
- **Command Center:** MRR estimate, catalog mismatch vs `visibility-profile` SSOT.
- **Financial tab:** subscriptions sub-tab (read).

## Missing

| Capability | Priority |
|------------|----------|
| Upgrade / downgrade individual seller plan | **P0** |
| Cancel / restore subscription | **P0** |
| Extend `subscriptionValidUntil` / comp period | **P0** |
| Force-expire subscription | **P1** |
| Inspect Stripe subscription + invoice history per seller | **P1** |
| Sync/repair Stripe ↔ DB mismatch | **P1** |
| Verify Business DNA updates after plan change | **P1** (automatic via SSOT if DB correct) |

**SSOT note:** `getBusinessVisibilityProfile()` derives fee/badge/analytics from `SellerProfile.subscriptionId` + `Subscription` row — admin plan changes **must** update both DB and Stripe or DNA drifts. Command Center surfaces `feeCatalogMismatches` but cannot fix them in UI.

**Duplicate pricing risk:** `lib/pricing.ts` (marketing) vs `visibility-profile.ts` (runtime) vs DB `Subscription` — admin can edit DB only; code SSOT requires deploy to align marketing copy.

---

# PART 6 — Promo codes

## What exists

- **Affiliate-owned CRUD:** `/api/affiliate/promo-codes` — percentage discount from affiliate commission, `SUBSCRIPTION_ONLY`, expiry, max redemptions.
- **Admin visibility:** AffiliateManagement shows promo count per affiliate; attribution source labels (13C).
- **Checkout:** `validate-promo-code`, subscribe flow with Stripe metadata.

## Schema (`PromoCode`)

Tied to `affiliateId`; discount via `discountSharePct` (affiliate commission share, not platform-wide).

## Missing admin promo capabilities

| Feature | Status |
|---------|--------|
| Platform-wide promo (non-affiliate) | ❌ **P1** |
| Fixed amount discount | ❌ Not in schema |
| Free month | ❌ Not in schema |
| Admin disable abusive affiliate code | ❌ **P0** |
| Usage statistics dashboard | ⚠️ Per-affiliate count only |
| Plan restriction beyond SUBSCRIPTION_ONLY | ❌ |
| Lifecycle audit | ❌ |
| Admin CRUD | ❌ **P1** |

**Note:** `Coupon` model exists in schema but **no admin surface** found.

---

# PART 7 — Affiliate administration

## What exists (strong)

| Area | Capability |
|------|------------|
| Referrals | List attributions; manual link user ↔ affiliate |
| Commission ledger | Read in AffiliateManagement commissions tab |
| Sub-affiliates | Hierarchy visible in affiliate list |
| Payouts | Read status (pending/available/paid/failed) |
| Status | ACTIVE / SUSPENDED via API |
| Referral link | Admin can change code |
| Attribution policy | Command Center + contract SSOT (13C) |
| Cookie contract | Documented in Command Center |

## Missing

| Gap | Priority |
|-----|----------|
| Manual commission adjustment / credit / clawback | **P0** |
| Blocked payout reason inspection (Connect missing) | **P1** — Command Center `tracked: false` |
| Fraud / duplicate detection UI | **P1** |
| Commission dispute resolution workflow | **P1** |
| Trigger affiliate payout cron from admin | **P2** — cron env only |
| Promo code admin override | **P0** |
| Sub-affiliate creation (admin on behalf) | **P2** — affiliate self-service exists |
| Attribution inspection per subscription invoice | **P2** |

Affiliate support requests **partially resolvable** — status, attribution, link changes yes; commission adjustments and payout blocks require Stripe + DB intervention.

---

# PART 8 — Delivery administration

## What exists

- **DeliveryManagement:** profile list, filters, GPS coordinates, expandable detail modal.
- **LiveLocationMap:** real-time courier positions.
- **Command Center:** delivery-related ops metrics (partial).
- **Messaging:** `send-message` to delivery profile.

## Missing

| Gap | Priority |
|-----|----------|
| Activate / deactivate courier | **P0** |
| Verification workflow (documents, background) | **P1** |
| Vehicle management | **P1** |
| Availability schedule admin | **P1** |
| Delivery zone editing | **P1** |
| Pricing override per courier | **P2** |
| Commission override | **P2** |
| Manual order assignment | **P0** |
| Blocked courier list + reason | **P1** |
| Delivery-specific dispute queue | **P2** |

**SSOT:** Delivery fees in `lib/deliveryPricing.ts` + `lib/fees.ts` — Settings tab shows **read-only hardcoded** values; not editable.

---

# PART 9 — Trust & Safety

## What exists

| Area | Surface |
|------|---------|
| Image moderation | `ContentModerationDashboard` + moderation APIs |
| Disputes | `DisputeResolution` + orders heuristic |
| Refunds | Financial tab |
| Messages oversight | `AdminChatManagement` |
| Reports | ⚠️ Dual system: legacy `Report` model + `analyticsEvent` USER_REPORT |
| Alerts | `FinancialAlerts` + `/api/admin/alerts` |

## Missing

| Gap | Priority |
|-----|----------|
| Unified trust queue (reports + disputes + moderation) | **P0** |
| Product / review moderation admin | **P1** |
| User ban / temp suspension | **P0** |
| Business verification workflow | **P1** |
| Identity verification admin | **P1** |
| Content removal (non-image) | **P1** |
| Appeals | **P2** |
| Warnings / strikes | **P2** |
| Full audit trail for moderation actions | **P1** |
| SLA / assignment for reports | **P3** |

---

# PART 10 — Notifications

## What exists

- **NotificationCenter:** broadcast push + email to audiences (`all`, `sellers`, `buyers`, `delivery`), max 5000.
- **Bulk message:** email to selected user IDs.
- **Delivery notice:** single delivery profile message.

## Missing

| Gap | Priority |
|-----|----------|
| Template management | **P2** |
| Scheduling | **P2** |
| Regional targeting | **P2** |
| Maintenance mode banner | **P1** |
| Campaign analytics (open/click) | **P2** |
| Retry / failure inspection | **P2** |
| Role-targeted beyond 4 buckets | **P2** |
| In-app system message center config | **P3** |

---

# PART 11 — SEO & growth administration

## What exists (read-only)

- Command Center `seoAndContent`: sitemap status, page counts from code SSOT.
- Analytics: GA4 proxy, internal platform metrics.
- HCP carousel + overview (growth gamification).
- Beta insights page.

## Missing (all require code deploy today)

| Area | Priority |
|------|----------|
| SEO page CRUD | **P1** |
| City landing management | **P1** |
| Meta / canonical / noindex per page | **P1** |
| Redirect admin | **P2** |
| Robots.txt editor | **P2** |
| Homepage module config | **P2** |
| Regional visibility / pilot toggles | **P1** |
| Growth campaign admin | **P2** |
| Business promotion slots | **P2** |

---

# PART 12 — Platform settings

## Editable from admin (SUPERADMIN)

- `Subscription.feeBps` and `priceCents` per plan catalog row.

## Display-only in admin

- Delivery fee structure (hardcoded in settings API response).
- Stripe env health (`stripe-status`, settings stripeConfig).
- Stripe fee % from `lib/fees.ts`.

## Requires source-code / env change

| Setting | Location |
|---------|----------|
| Business DNA benefits matrix | `lib/business/visibility-profile.ts` |
| Affiliate commission % | `lib/affiliate-config.ts` |
| Attribution policy | `lib/affiliate-attribution-contract.ts` |
| Delivery base/per-km rates | `lib/deliveryPricing.ts` |
| Feature flags | **Not implemented** |
| AI provider keys | Env vars |
| Google Maps | Env vars |
| Cron schedules | Env / Vercel |
| Escrow hold days | `lib/releaseEscrowOnDelivered.ts` |
| SEO pages | `lib/seo/homecheffSeoPages.data.ts` |
| Discovery ranking weights | `lib/discovery/ranking/*` |

---

# PART 13 — HCP administration

## What exists (relatively strong)

| Area | Surface |
|------|---------|
| Overview | `/admin/hcp` — lifecycle counts, leaderboards, rule rewards |
| Carousel | `/admin/hcp-carousel` — full CRUD |
| Quick disable promo | `HcpPromoDisableButton` |

## Missing

| Gap | Priority |
|-----|----------|
| Manual XP grant/revoke | **P1** |
| Achievement / badge override | **P1** |
| Mission / challenge config | **P2** (code-driven rules) |
| Season reset trigger | **P2** |
| Leaderboard manipulation | **P3** |
| Audit log on carousel edits | **P1** |

---

# PART 14 — Audit logging

## What exists

- **Model:** `AdminAction` — queried by `AuditLog.tsx` via `GET /api/admin/audit-log`.
- **Writes (only 5 routes):** `settings` PATCH, `disputes` resolve, `refunds` create, `orders/[orderId]` update/delete.

## Missing

| Gap | Priority |
|-----|----------|
| User edit/delete logging | **P0** |
| Affiliate status change logging | **P0** |
| Attribution manual link logging | **P0** |
| Moderation review logging | **P1** |
| HCP carousel change logging | **P1** |
| Bulk message / notification logging | **P1** |
| Before/after values | **P1** |
| Reason field (required) | **P2** |
| `AuditLog` model integration | **P2** (orphaned) |
| Export / compliance | **P3** |

**Verdict:** Important admin actions are **not fully traceable** today.

---

# PART 15 — Founder operations readiness

## Can Sergio run HomeCheff entirely from admin?

### ✅ Manageable without DB/code (day-to-day)

- Monitor platform health (Command Center)
- View users, orders, products, sellers, delivery profiles
- Update order status, release escrow, create Stripe refunds
- Resolve disputes (heuristic queue)
- Suspend affiliates, change referral codes, manual attribution
- Broadcast notifications
- Review image moderation logs
- View financial transactions, payouts, subscription list
- Edit subscription catalog fees (SUPERADMIN)
- HCP carousel management

### ❌ Still requires Prisma Studio, SQL, env, Stripe Dashboard, or deploy

| Blocker | Workaround today |
|---------|------------------|
| Suspend user without deleting | Delete user (destructive) or DB flag |
| Comp / cancel / extend business subscription | Stripe Dashboard + manual DB |
| Deactivate courier | DB / no field exposed |
| Manual delivery assignment | No tool |
| Admin disable affiliate promo code | DB or ask affiliate |
| Manual commission adjustment | DB `CommissionLedger` |
| SEO / landing page change | Code deploy |
| Affiliate % / delivery pricing change | Code deploy |
| Feature kill-switch | Deploy / env |
| Pending accepted value proposals | No admin queue |
| Proposal marketplace moderation | No admin surface |
| Review removal | No admin surface |
| Fix fee catalog ↔ SSOT mismatch | Manual DB + code awareness |
| Clear understanding of blocked affiliate payouts | Stripe Connect per user |

## Priority register

### P0 — Blocks safe founder ops

1. No user suspend/restore (only delete)
2. `AdminPermissions` not enforced on APIs — delegated admin model is illusory
3. No individual subscription lifecycle admin
4. No delivery activate/deactivate / manual assignment
5. No admin promo disable override
6. No manual commission adjustment for affiliate disputes
7. Unified trust queue missing
8. Sparse audit logging on mutating actions
9. `/admin/clear-chat` missing page-level auth

### P1 — High friction at scale

10. SEO admin entirely code-based
11. Delivery pricing not editable in settings
12. Business / identity verification admin
13. Product & review moderation beyond images
14. `adminRoles`-only users broken experience
15. Duplicate analytics tabs (promo/login)
16. User edit UI not wired (`EditUserModal`)
17. HCP manual reward override + carousel audit
18. Regional / maintenance notification controls

### P2 — Scale polish

19. Feature flag system
20. Coupon model admin surface
21. Proposal admin
22. Notification templates & scheduling
23. Affiliate payout cron trigger in admin
24. Centralized `requirePlatformAdmin()` guard
25. Report notification includes SUPERADMIN

### P3 — IA & convenience

26. Merge duplicate tabs and dead analytics paths
27. Wire unused components or remove
28. Impersonate/support login (if desired)
29. Leaderboard admin overrides
30. Navigation restructure (Part 16)

---

# PART 16 — Admin information architecture (recommendation only)

**No implementation in this phase.** Evaluation of whether current structure matches Marketplace + Business DNA + Affiliate + Delivery + Command Center architecture after Phases 1–13.

## Current navigation tree

```
/admin (flat 21-tab bar)
├── Command Center ★ default
├── Overview (legacy stats — overlaps Command Center)
├── Orders
├── Financial (+ 5 sub-tabs)
├── Disputes
├── Settings
├── Audit
├── Users
├── Messages
├── Sellers
├── Products
├── Delivery
├── Live Locations
├── Analytics
├── Promo Analytics      ← duplicate
├── Login Analytics      ← duplicate
├── Variabelen (link out)
├── Geographic
├── Moderation
├── Notifications
├── Affiliates (+ 7 sub-tabs)
└── Admin Management (SUPERADMIN)

Separate routes (disconnected from tab bar):
/admin/profile, /admin/beta, /admin/hcp, /admin/hcp-carousel,
/admin/variabelen, /admin/clear-chat
```

## Problems (WHY change is needed)

1. **Command Center + Overview duplicate** founder attention — Overview is pre-13A legacy; Command Center is strictly better for ops.
2. **21 top-level tabs** exceed cognitive load; related tools scattered (Financial vs Affiliates payouts vs Command Center money).
3. **People domain split** across Users, Sellers, Affiliates, Delivery — same human often spans roles.
4. **Analytics quadrupled** — analytics, promo-analytics, login-analytics, variabelen, geographic — same data product fragmented.
5. **Trust split** — Disputes, Moderation, Messages, Reports (no tab) — no incident workflow.
6. **Growth tools orphaned** — HCP, Beta, SEO (none) not reachable from main nav except deep links.
7. **Dangerous tools exposed** — clear-chat, migrate-orders lack prominent guardrails / SUPERADMIN-only placement.

## Proposed navigation tree

```
/admin
├── 🎯 Command Center          (default home — keep 13A)
│
├── 👥 People
│   ├── Users & roles
│   ├── Sellers & subscriptions
│   ├── Affiliates             (merge current 7 sub-tabs)
│   └── Delivery               (+ live map as sub-view)
│
├── 🛒 Marketplace
│   ├── Orders & escrow
│   ├── Products & listings
│   └── Proposals & requests   (NEW — when built)
│
├── 💰 Money
│   ├── Financial overview     (merge Command Center money + Financial overview)
│   ├── Transactions
│   ├── Payouts & refunds
│   └── Subscriptions          (promote from buried sub-tab)
│
├── 🛡️ Trust & Safety
│   ├── Incidents queue        (NEW — unify reports/disputes/moderation)
│   ├── Messages
│   └── Audit log
│
├── 📈 Growth & Intelligence
│   ├── Analytics              (single hub: internal | GA4 | unified)
│   ├── Explorer / Variabelen  (sub-mode, not top-level tab)
│   ├── Geographic
│   ├── HCP                    (link carousel as sub-page)
│   └── Beta insights
│
└── ⚙️ Platform (SUPERADMIN)
    ├── Settings & fees
    ├── Notifications
    ├── SEO & content          (when built)
    └── Admin team & permissions
```

## Merge opportunities

| Merge | Why |
|-------|-----|
| Overview → Command Center | Eliminates duplicate KPIs; Overview widgets become Command Center drill-downs |
| promo-analytics + login-analytics → Analytics | Same component today — misleading nav |
| variabelen + geographic → Analytics sub-views | One "Intelligence" hub for founders |
| Financial overview + Command Center Money | Single money SSOT view |
| Sellers tab → People > Sellers | Seller is a user capability, not separate namespace |
| Disputes + Moderation → Trust queue | One incident workflow |

## Pages that should disappear

| Page/Tab | Why |
|----------|-----|
| `overview` tab | Superseded by Command Center |
| `promo-analytics` tab | Duplicate of analytics |
| `login-analytics` tab | Duplicate of analytics |
| `/admin/clear-chat` as public route | Move to SUPERADMIN Platform > Danger zone with confirm + audit |

## Pages that should split

| Current | Split into | Why |
|---------|------------|-----|
| `AffiliateManagement` (7 tabs) | People > Affiliates with left nav | Too dense for horizontal sub-tabs on mobile |
| `FinancialManagement` | Money section with persistent sub-nav | Subscriptions buried too deep |
| `UserManagement` | Users list + User detail drawer | Edit modal exists but unwired — detail drawer hosts all role-specific actions |

## Pages that should become tabs (not standalone)

| Standalone | Become |
|------------|--------|
| `/admin/hcp-carousel` | Growth > HCP > Carousel tab |
| `/admin/beta` | Growth > Beta tab |
| `/admin/variabelen` | Analytics > Explorer mode (already linked) |

## Pages that should become dashboards

| Area | Dashboard concept |
|------|-------------------|
| Trust & Safety | Incident queue with severity, age, assignee |
| Subscriptions | Churn risk, past_due, DNA mismatch count (from Command Center signals) |
| Delivery | Active couriers, unassigned deliveries, blocked profiles |

## Pages that should move elsewhere

| Item | Move | Why |
|------|------|-----|
| Live Locations | Sub-view under Delivery | Not a top-level domain |
| MigrateOrdersButton | Platform > Maintenance (SUPERADMIN) | One-off script, not daily ops |
| Admin profile | User menu, not admin nav | Personal settings ≠ platform admin |

## Architecture alignment verdict

Current admin structure **predates** Business DNA, Affiliate attribution contract, and Command Center. It is **functional for pilot** but **not optimal** for scale: too many peer tabs, duplicate analytics, missing domain groupings that mirror how Sergio thinks about operations (People → Marketplace → Money → Trust → Growth → Platform).

**Recommendation:** Implement IA restructuring **after** P0 admin capability gaps (Part 15) are closed — otherwise reorganizing navigation will expose empty shells.

---

## Final answer

**Is HomeCheff's admin environment complete enough for Sergio to operate and scale without database or source-code intervention?**

**No.** The admin environment is **pilot-capable with founder oversight** — monitoring, orders, money movement, affiliate status, and moderation baseline work from `/admin`. Scaling without engineering requires closing **9 P0 blockers** (user suspend, subscription admin, delivery control, permission enforcement, trust queue, commission adjustments, promo override, audit coverage, dangerous route guards). The **information architecture** should be simplified (Part 16) only after those capabilities exist.

---

## Validation

```bash
npx tsx scripts/validate-admin-operations-phase13d.ts
npm run lint
npm run build
```
