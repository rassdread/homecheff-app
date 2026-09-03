# HOMECHEFF — Navigation, Dashboard & Affiliate Ecosystem Certification

**Date:** 2026-09-04  
**FINAL_DECISION:** `HOMECHEFF_NAVIGATION_DASHBOARD_AFFILIATE_PARTIAL_WITH_BLOCKERS`

## Why PARTIAL
Navigation / Dashboard / responsive header simplification is implemented.  
Affiliate audit proves **architecture conflict**: Marketplace multilevel tree ≠ Growth flat V1 ≠ Ecosystem `centralUserId` attribution. Full one-tree unification is **not** completed in this cut (would rewrite historical ledger semantics). Delivery HomeCheff fee **is** now commissionable (50% of delivery platform fee only).

---

## Navigation

| Field | Value |
|---|---|
| RESPONSIVE_ACCOUNT_NAME_CLIPPING | **FIXED** (avatar-only header; full name inside menu, no `truncate max-w-32`) |
| INTERMEDIATE_BREAKPOINTS_CERTIFIED | PARTIAL — code rule enforced + static tests; full Playwright matrix deferred |
| DASHBOARD_CANONICAL_ROUTE | `/mijn-homecheff` |
| DASHBOARD_MODULES | Bestellingen · Verkopen · Affiliate & netwerk · Bezorging (role) · Verdiensten (finance) · Account |
| MORE_HOMECHEFF_IMPLEMENTED | YES (submenu: Marketplace / Studio / Growth) |
| MORE_HOMECHEFF_DESTINATIONS | Marketplace `/` · Studio SSO · Growth SSO |
| EARNINGS_MEANS_FINANCE_ONLY | YES (`/verdiensten`) |
| DUPLICATE_NAV_ITEMS_REMOVED | YES (ecosystem + role ops removed from top-level account menu) |
| FUNCTIONALITY_REMOVED | NO |
| PRIMARY_ACCOUNT_MENU_ITEMS | Dashboard · Meer van HomeCheff · Account (profiel/berichten/favorieten/reputatie/afspraken/instellingen) · Admin · Help · Logout |

Work modules live on **Dashboard cards**, not as competing top-level account links.

---

## Affiliate certification (audit)

| Field | Value |
|---|---|
| CANONICAL_AFFILIATE_IDENTITY | **SPLIT** — Marketplace `Affiliate`/`Attribution` (local User) · Ecosystem `EcosystemAffiliateAttribution` (`centralUserId`) · Growth `GrowthAffiliate` |
| CANONICAL_REFERRAL_ATTRIBUTION | Marketplace first-touch cookie + 365d · Ecosystem first-qualified 12mo lock |
| CANONICAL_MULTILEVEL_TREE | Marketplace only: 2 levels (80/20 of line) · Growth live V1 flat · Ecosystem flat |
| ONE_REFERRAL_ACROSS_ECOSYSTEM | **NO** (design intent exists; live dual/triple trees) |
| MARKETPLACE_AFFILIATE_50_50 | YES — 50% of seller platform fee (12/9/7/5%) |
| DELIVERY_AFFILIATE_50_50 | YES after this change — 50% of HomeCheff delivery fee (12% of delivery charge); courier 88% never commissioned |
| STUDIO_AFFILIATE_50_50 | YES residual after VAT/Stripe/HC treasury (V2 math) |
| GROWTH_AFFILIATE_50_50 | Live V1 gross 50/50; Universal residual floors certified in code (1687/2675/5150/11700¢) |
| MARKETPLACE_MULTILEVEL | YES (2-level 80/20) |
| DELIVERY_MULTILEVEL | YES via Marketplace commission engine (same tree as MP buyer attribution) |
| STUDIO_MULTILEVEL | NO (flat ecosystem / reserve) |
| GROWTH_MULTILEVEL | NO (live V1 flat) |
| MULTILEVEL_TREE_CROSS_ECOSYSTEM | **NO** — blocker |
| TOTAL_AFFILIATE_POOL_MAX | 50_PERCENT_OF_ELIGIBLE_PLATFORM_REVENUE |
| SELLER_PRINCIPAL_COMMISSIONED | NO |
| COURIER_PRINCIPAL_COMMISSIONED | NO |
| VAT_COMMISSIONED | NO |
| HC_FACE_COMMISSIONED | NO |
| HC_MOVEMENT_COMMISSIONED | NO |
| DOUBLE_COMMISSION_FOUND | NO (product fee + delivery fee are separate bases; distinct eventIds) |
| REFUND_REVERSAL_CERTIFIED | Marketplace path existing; delivery path inherits processCommissionForOrder idempotency — full cross-product refund suite not expanded this cut |

### Delivery economics
| Field | Value |
|---|---|
| DELIVERY_CUSTOMER_CHARGE_MODEL | quoted `deliveryFeeCents` |
| DELIVERY_COURIER_PRINCIPAL_MODEL | 88% of delivery fee |
| HOMECHEFF_DELIVERY_FEE_EXISTS | YES — 12% |
| HOMECHEFF_DELIVERY_FEE_FORMULA | `round(fee × 0.12)` / `homecheffCut` |
| DELIVERY_AFFILIATE_ELIGIBLE_REVENUE_FORMULA | HomeCheff delivery platform fee only |
| DELIVERY_50_PERCENT_POOL_FORMULA | `floor(deliveryPlatformFee × 0.50)` via `processCommissionForOrder` |
| DELIVERY_MULTILEVEL_ALLOCATION | Marketplace 2-level engine |
| MARKETPLACE_PLUS_DELIVERY_DOUBLE_COUNT | NO — distinct event IDs |
| Example (€10 delivery) | Buyer €10 · Courier €8.80 · HC fee €1.20 · Affiliate pool €0.60 |

---

## Reliability (this cut)
| Field | Value |
|---|---|
| VISIBLE_LINKS_TESTED | Nav completeness validator 61/61 + static header tests |
| DASHBOARD_TABS_TESTED | PARTIAL — OperationsSectionNav role-gated; full persona click matrix deferred |
| BROKEN_LINKS_REMAINING | Unknown without Production authenticated smoke |
| MOBILE_NAV_PASS / TABLET / INTERMEDIATE / DESKTOP | Code-level avatar-only rule; Production smoke pending deploy |

---

## Universal HC regression
UNIVERSAL_HC_STILL_LIVE = YES (untouched catalogs/economics)  
STUDIO_HC_REGRESSION = NO  
GROWTH_HC_REGRESSION = NO  
MARKETPLACE_HC_REGRESSION = NO  
MIXED_HC_STRIPE_REGRESSION = NO  
WORKSPACE_HC_REGRESSION = NO  
AFFILIATE_V2_REGRESSION = NO (no historical rewrite)  
COMPANY_HC_PERSONAL_MP_STILL_BLOCKED = YES  
SEARCH_ARCHITECTURE_CHANGED = NO

---

## Blockers remaining
1. Unify Marketplace + Growth + Ecosystem into **one** multilevel attribution tree on `centralUserId` without rewriting historical commissions.  
2. Wire Studio/Growth live payout paths fully onto that tree (beyond attribution lock).  
3. Full automated persona × breakpoint matrix in CI + Production authenticated smoke after deploy.

---

## Deploy status
Filled after Production push:
- BUILD =
- TESTS = nav validator 61/61; affiliate pool 8/8; responsive header static 3/3
- PRODUCTION_COMMIT_SHA =
- PRODUCTION_DEPLOYMENT_ID =
