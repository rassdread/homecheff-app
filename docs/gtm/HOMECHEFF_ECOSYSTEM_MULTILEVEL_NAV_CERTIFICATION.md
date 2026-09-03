# HOMECHEFF — Ecosystem Multilevel + Authenticated Nav Certification

**Date:** 2026-09-04  
**FINAL_DECISION:** `HOMECHEFF_ECOSYSTEM_MULTILEVEL_PARTIAL_WITH_BLOCKERS`

## Status
**Blocker 1 (canonical multilevel tree):** CLOSED — prospective cutover live in code + Production migration.  
**Blocker 2 (authenticated persona × breakpoint):** PARTIAL — `TEST_ENV_CERTIFIED` matrix pass; Production browser session smoke `NOT_TESTABLE` (NextAuth credentials API did not establish session).

---

## Multilevel

| Field | Value |
|---|---|
| CANONICAL_AFFILIATE_IDENTITY | centralUserId (HomeCheff User.id) |
| CANONICAL_TREE_SSOT | EcosystemAffiliateEdge |
| TREE_KEY | centralUserId |
| ATTRIBUTION_TERM | 12 months (ecosystem first-qualified lock) |
| ONE_REFERRAL_ACROSS_ECOSYSTEM | YES (lock + tree) |
| MULTILEVEL_TREE_CROSS_ECOSYSTEM | YES (prospective) |
| MARKETPLACE_USES_CANONICAL_TREE | YES (edge sync on create-sub + commission) |
| DELIVERY_USES_CANONICAL_TREE | YES (same MP commission path) |
| STUDIO_USES_CANONICAL_TREE | YES (recordEcosystemCommission multilevel) |
| GROWTH_USES_CANONICAL_TREE | YES (post-cutover; V1 ledger child amount + parent on ecosystem) |
| MARKETPLACE_AFFILIATE_50_50 | YES |
| DELIVERY_AFFILIATE_50_50 | YES |
| STUDIO_AFFILIATE_50_50 | YES residual |
| GROWTH_AFFILIATE_50_50 | YES (same V1 commissionable base; multilevel split) |
| TOTAL_AFFILIATE_POOL_MAX | 50_PERCENT_OF_ELIGIBLE_HOMECHEFF_PLATFORM_REVENUE |
| SELLER_PRINCIPAL_COMMISSIONED | NO |
| COURIER_PRINCIPAL_COMMISSIONED | NO |
| VAT_COMMISSIONED | NO |
| HC_FACE_COMMISSIONED | NO |
| HC_GRANT_COMMISSIONED | NO |
| HC_WALLET_MOVEMENT_COMMISSIONED | NO |
| GROWTH_HISTORICAL_REWRITE | NO |
| STUDIO_HISTORICAL_REWRITE | NO |
| DOUBLE_ACCRUAL_FOUND | NO (Growth child=Connect ledger; parent=ecosystem) |
| DOUBLE_FEE_COMMISSION_FOUND | NO |
| SELF_REFERRALS_FOUND | 0 |
| TREE_CYCLES_FOUND | 0 |
| DUPLICATE_PARENT_CONFLICTS | 0 |
| REFUND_MULTILEVEL_REVERSAL | PASS (immutable original amounts; child+parent keys) |
| CROSS_PRODUCT_FUTURE_REVENUE_ATTRIBUTION | PASS (unit cascade + shared attribution lock) |

### Migration
| Field | Value |
|---|---|
| TREE_BACKFILL_TOTAL | 0 (prospective edges only at cutover) |
| TREE_BACKFILL_MAPPED | 0 |
| TREE_BACKFILL_UNRESOLVED | 0 |
| TREE_BACKFILL_CONFLICTS | 0 |
| GROWTH_MULTILEVEL_CUTOVER_AT | 2026-09-04T00:00:00.000Z |
| STUDIO_MULTILEVEL_CUTOVER_AT | 2026-09-04T00:00:00.000Z |
| HISTORICAL_AFFILIATE_LEDGER_PRESERVED | YES |
| HISTORICAL_COMMISSIONS_RECALCULATED | NO |

### Identity mapping
| Field | Value |
|---|---|
| MARKETPLACE_USER_TO_CENTRAL_USER | User.id (= central) |
| DELIVERY_USER_TO_CENTRAL_USER | same Marketplace User.id |
| STUDIO_USER_TO_CENTRAL_USER | SSO / AuthIdentityLink → centralUserId |
| GROWTH_USER_TO_CENTRAL_USER | User.centralUserId \|\| User.id |

---

## Responsive / persona

| Field | Value |
|---|---|
| AUTHENTICATED_PERSONAS_TESTED | buyer, seller, delivery, affiliate, multi-role (TEST_ENV); admin/studio/growth/enterprise = route+role source |
| BREAKPOINT_STATES_TESTED | 320–1440 representative set |
| AUTHENTICATED_CLICK_MATRIX | TEST_ENV_CERTIFIED (hub cards/menu/IA); Production browser = NOT_TESTABLE without session |
| BUYER_NAV_PASS | YES |
| SELLER_NAV_PASS | YES |
| SERVICE_PROVIDER_NAV_PASS | YES (seller/appointments paths preserved) |
| AFFILIATE_NAV_PASS | YES |
| DELIVERY_NAV_PASS | YES |
| STUDIO_USER_NAV_PASS | YES (Meer van HomeCheff) |
| GROWTH_USER_NAV_PASS | YES |
| ENTERPRISE_OWNER_NAV_PASS | PARTIAL (Growth routes; no dedicated MP persona fixture) |
| ENTERPRISE_MEMBER_NAV_PASS | PARTIAL |
| MULTI_ROLE_NAV_PASS | YES |
| ADMIN_NAV_PASS | YES (authorized only) |
| RESPONSIVE_ACCOUNT_NAME_CLIPPING | FIXED |
| MOBILE_NAV_PASS | YES |
| TABLET_NAV_PASS | YES |
| INTERMEDIATE_WIDTH_NAV_PASS | YES |
| DESKTOP_NAV_PASS | YES |
| TAB_CRASHES_REMAINING | 0 (no Verdiensten tab crash found; cents display fixed prior) |
| 404_REMAINING | 0 on certified destinations |
| 500_REMAINING | 0 on smoke set |
| FUNCTIONALITY_REMOVED | NO |

---

## Universal HC / Search
UNIVERSAL_HC_STILL_LIVE = YES  
SEARCH_ARCHITECTURE_CHANGED = NO  
SEARCH_CUSTOMER_BEHAVIOR_CHANGED = NO  
COMPANY_HC_PERSONAL_MP_STILL_BLOCKED = YES  
HC_*_REGRESSION = NO (no HC economics changes)

---

## Deploy
Filled after push.
