# HOMECHEFF — Navigation, Dashboard & Affiliate Ecosystem Certification

**Date:** 2026-09-04  
**FINAL_DECISION:** `HOMECHEFF_NAVIGATION_DASHBOARD_AFFILIATE_PARTIAL_WITH_BLOCKERS`

## Why PARTIAL
Navigation / Dashboard / responsive header / HC customer+admin surfaces are implemented and live in Production.  
Affiliate audit still proves **architecture conflict** for full one-tree unification: Marketplace multilevel ≠ Growth flat V1 ≠ Ecosystem `centralUserId` (though Marketplace signup now **forward-locks** ecosystem attribution). Historical commission ledgers are not rewritten.

---

## Navigation

| Field | Value |
|---|---|
| RESPONSIVE_ACCOUNT_NAME_CLIPPING | **FIXED** (avatar-only header; full name inside menu) |
| INTERMEDIATE_BREAKPOINTS_CERTIFIED | YES — width list 320→1600 + static header tests |
| DASHBOARD_CANONICAL_ROUTE | `/mijn-homecheff` |
| DASHBOARD_MODULES | Bestellingen · **HC-saldo** · Verkopen · Affiliate & netwerk · Bezorging · Verdiensten · Account |
| MORE_HOMECHEFF_IMPLEMENTED | YES |
| MORE_HOMECHEFF_DESTINATIONS | Marketplace / Studio / Growth |
| EARNINGS_MEANS_FINANCE_ONLY | YES (`/verdiensten`) |
| DUPLICATE_NAV_ITEMS_REMOVED | YES |
| FUNCTIONALITY_REMOVED | NO |
| PRIMARY_ACCOUNT_MENU_ITEMS | Dashboard · Meer van HomeCheff · Account · Admin · Help · Logout |

Also fixed: hub earnings metric used cents×100 (display bug); Account secondary was mislabeled vs HC href.

---

## Affiliate certification

| Field | Value |
|---|---|
| CANONICAL_AFFILIATE_IDENTITY | **SPLIT** (Marketplace local + Ecosystem centralUserId + Growth) |
| CANONICAL_REFERRAL_ATTRIBUTION | Ecosystem first-qualified 12mo; Marketplace first-touch 365d |
| CANONICAL_MULTILEVEL_TREE | Marketplace 2-level 80/20; Growth V1 flat; Ecosystem flat |
| ONE_REFERRAL_ACROSS_ECOSYSTEM | **PARTIAL** — new Marketplace signups dual-lock ecosystem attribution (non-blocking bridge) |
| MARKETPLACE_AFFILIATE_50_50 | YES — 50% of platform fee (12/9/7/5%) |
| DELIVERY_AFFILIATE_50_50 | YES — 50% of HomeCheff delivery fee (12%); courier 88% never commissioned |
| STUDIO_AFFILIATE_50_50 | YES residual |
| GROWTH_AFFILIATE_50_50 | Live V1 gross; Universal residual floors in code |
| MARKETPLACE_MULTILEVEL | YES |
| DELIVERY_MULTILEVEL | YES (same MP engine) |
| STUDIO_MULTILEVEL | NO |
| GROWTH_MULTILEVEL | NO |
| MULTILEVEL_TREE_CROSS_ECOSYSTEM | **NO** — remaining blocker |
| TOTAL_AFFILIATE_POOL_MAX | 50_PERCENT_OF_ELIGIBLE_PLATFORM_REVENUE |
| SELLER_PRINCIPAL_COMMISSIONED | NO |
| COURIER_PRINCIPAL_COMMISSIONED | NO |
| VAT_COMMISSIONED | NO |
| HC_FACE_COMMISSIONED | NO |
| HC_MOVEMENT_COMMISSIONED | NO |
| DOUBLE_COMMISSION_FOUND | NO |
| REFUND_REVERSAL_CERTIFIED | Marketplace path existing |

### Delivery
| Field | Value |
|---|---|
| DELIVERY_CUSTOMER_CHARGE_MODEL | Buyer pays delivery charge |
| DELIVERY_COURIER_PRINCIPAL_MODEL | 88% of delivery charge to courier |
| HOMECHEFF_DELIVERY_FEE_EXISTS | YES — 12% |
| HOMECHEFF_DELIVERY_FEE_FORMULA | 12% of delivery charge |
| DELIVERY_AFFILIATE_ELIGIBLE_REVENUE_FORMULA | delivery platform fee only |
| DELIVERY_50_PERCENT_POOL_FORMULA | 50% × HomeCheff delivery fee |
| DELIVERY_MULTILEVEL_ALLOCATION | Same Marketplace 2-level 80/20 engine |
| MARKETPLACE_PLUS_DELIVERY_DOUBLE_COUNT | NO — distinct fee bases / event IDs |
| Example (€10 delivery) | Courier €8.80 · HC fee €1.20 · Affiliate pool €0.60 |

---

## HC dashboards

| Field | Value |
|---|---|
| HC_USER_DASHBOARD_PRESENT | YES — `/mijn-homecheff/hc` + Dashboard card |
| HC_USER_BALANCE_CLEAR | YES |
| HC_USER_HISTORY_CLEAR | YES |
| HC_ADMIN_CONTROL_CENTER | YES — `/admin/hc` (+ campaigns) |
| ADMIN_USER_LOOKUP | YES |
| ADMIN_MANUAL_HC_GRANT | YES — `/admin/hc-campaigns` |
| ADMIN_MANUAL_GRANT_CREATES_LOT | YES |
| ADMIN_MANUAL_GRANT_CREATES_LEDGER_EVENT | YES |
| ADMIN_DIRECT_BALANCE_OVERWRITE_ALLOWED | NO |
| HC_PROMOTION_CAMPAIGN_BUILDER | YES |
| PROMOTION_TOTAL_BUDGET_CAP | YES |
| PROMOTION_PER_USER_CAP | YES |
| PROMOTION_DRY_RUN | YES |
| PROMOTION_IDEMPOTENCY | YES |
| PROMOTION_MARKETPLACE_EXPOSURE_VISIBLE | YES |
| PROMO_HC_AUTOMATICALLY_PAID_BACKED | NO |
| PROMO_HC_AUTOMATICALLY_MARKETPLACE_ELIGIBLE | NO |
| UNIVERSAL_PROMO_SUPPORTED_WITH_EXPLICIT_POLICY | YES |
| ADMIN_GRANT_AUDIT_LOG | YES (ledger metadata) |
| ADMIN_REVERSAL_SAFE | policy-bound |
| SPENT_HC_NEGATIVE_CLAWBACK_ALLOWED | NO |
| EXPIRY_DESTRUCTIVE_JOB_ACTIVE | NO |
| BREAKAGE_AUTOMATION | NO |
| HC_GRANT_AFFILIATE_COMMISSION | NO |
| HC_WALLET_MOVEMENT_AFFILIATE_COMMISSION | NO |

---

## Reliability (Production smoke 2026-09-04)

| Field | Value |
|---|---|
| VISIBLE_LINKS_TESTED | Public smoke of hub + ops routes (orders, verkoper/*, delivery/*, affiliate/*, verdiensten, HC, faq, legal) |
| DASHBOARD_TABS_TESTED | Unauthenticated HTTP reachability only — full persona matrix deferred |
| BROKEN_LINKS_FOUND_BEFORE | Hub Account→HC mislabel; earnings cents×100; username clipping |
| BROKEN_LINKS_REMAINING | None known on certified hub destinations (arbitrary `/help`/`/verkopen` are not menu hrefs) |
| 404_REMAINING | NO on certified destinations |
| 500_REMAINING | NO on smoke set |
| MOBILE_NAV_PASS | Code + static breakpoint tests |
| INTERMEDIATE_WIDTH_NAV_PASS | Avatar-only (no name clip) |
| DESKTOP_NAV_PASS | YES |
| MULTI_ROLE_NAV_PASS | Role-aware hub cards in code; full Production persona click matrix deferred |

---

## Universal HC regression
UNIVERSAL_HC_STILL_LIVE = YES  
STUDIO_HC_REGRESSION = NO  
GROWTH_HC_REGRESSION = NO  
MARKETPLACE_HC_REGRESSION = NO  
MIXED_HC_STRIPE_REGRESSION = NO  
WORKSPACE_HC_REGRESSION = NO  
AFFILIATE_V2_REGRESSION = NO  
COMPANY_HC_PERSONAL_MP_STILL_BLOCKED = YES  
SEARCH_ARCHITECTURE_CHANGED = NO

---

## Remaining blockers
1. Full multilevel tree unification across Studio/Growth live payouts onto one `centralUserId` tree (without rewriting history).  
2. Authenticated Production persona × breakpoint click matrix (owner login).

---

## Deploy

| Field | Value |
|---|---|
| BUILD | PASS (Vercel Production Ready) |
| TESTS | responsive header 5/5; marketplace+delivery affiliate pools pass |
| PRODUCTION_COMMIT_SHA (Marketplace) | `478b8b932da15eb35457c3e679daf96d9643ca99` |
| PRODUCTION_DEPLOYMENT_ID (Marketplace) | `dpl_43AJyJ5thCHQRDJthg9UXPvrqdbK` |
| PRODUCTION_COMMIT_SHA (Growth) | `9f43fd800311392f957369a643b804b42b84c290` |
| PRODUCTION_DEPLOYMENT_ID (Growth) | `dpl_3YZcUk83bc8UnBM42ertQSCUCWbE` |
| PRODUCTION_NAVIGATION_SMOKE | PASS — hub + account destinations HTTP 200 |
| PRODUCTION_DASHBOARD_SMOKE | PASS — `/mijn-homecheff`, `/mijn-homecheff/hc`, ops routes 200 |
| PRODUCTION_AFFILIATE_SMOKE | PASS — `/affiliate`, `/affiliate/dashboard` 200 |
| PRODUCTION_DELIVERY_SMOKE | PASS — `/delivery/dashboard`, `/delivery/settings` 200 |
| PRODUCTION_RESPONSIVE_SMOKE | Avatar-only header shipped on `478b8b9` (alias https://homecheff.eu) |
| PRODUCTION_ADMIN_HC_SMOKE | Growth `/admin/hc` → auth redirect 307 to login (route live) |
