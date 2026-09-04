# HOMECHEFF — MAIN / PARTNER Affiliate Model (Ecosystem-wide)

**Date:** 2026-09-04  
**FINAL_DECISION:** `HOMECHEFF_MAIN_PARTNER_AFFILIATE_MODEL_ECOSYSTEM_WIDE_PRODUCTION_READY`

## Audit verdict

| Field | Value |
|---|---|
| ORIGINAL_HOMECHEFF_AFFILIATE_MODEL_FOUND | YES — `homecheff-app/lib/affiliate-config.ts` business rules |
| AFFILIATE_STRUCTURE_TYPE | TWO_LEVEL_MAIN_PARTNER |
| MAIN_AFFILIATE_PERCENTAGE | 10% of eligible platform revenue |
| SUB_PARTNER_PERCENTAGE | 40% of eligible platform revenue |
| TOTAL_AFFILIATE_POOL_MAX | 50% of eligible |
| DIRECT_AFFILIATE_NO_SUB_PERCENTAGE | 50% of eligible |
| CURRENT_80_20_MATCHES_ORIGINAL | YES (economically: 80/20 of 50% pool ≡ 40%/10% of eligible; ≤1¢ rounding) |
| CURRENT_80_20_DISABLED_FOR_NEW_EVENTS | YES — new events stamp `MAIN10_SUB40` via `allocateMainPartnerShares` |

### Partner codes / discount (original)
| Field | Value |
|---|---|
| PARTNER_CODE_CREATION | YES (`/affiliate/promo-codes`) |
| PARTNER_MAX_DISCOUNT | 75% of partner's 40% share = **30% of list/eligible price** |
| DISCOUNT_BASE | Affiliate commission share (subscription/platform economics) |
| DISCOUNT_FUNDED_BY | PARTNER (or direct) commission only |
| DISCOUNT_REDUCES_PARTNER_COMMISSION | YES |
| DISCOUNT_REDUCES_MAIN_COMMISSION | NO (main protected) |
| DISCOUNT_REDUCES_HOMECHEFF_REVENUE | NO (HC keeps 50% of base) |
| DISCOUNT_TOUCHES_SELLER_PRINCIPAL | NO |
| DISCOUNT_TOUCHES_COURIER_PRINCIPAL | NO |
| DISCOUNT_TOUCHES_VAT | NO |
| DISCOUNT_APPLIES_TO | SUBSCRIPTION_ONLY (Marketplace config) |

### Ecosystem application
| Field | Value |
|---|---|
| CANONICAL_AFFILIATE_SSOT | EcosystemAffiliateEdge (MAIN→PARTNER) + MAIN10_SUB40 allocator |
| ONE_REFERRAL_ACROSS_ECOSYSTEM | YES |
| MARKETPLACE_MAIN_SUB_MODEL | YES |
| DELIVERY_MAIN_SUB_MODEL | YES (same fee path) |
| STUDIO_MAIN_SUB_MODEL | YES (residual eligible → MAIN10_SUB40) |
| GROWTH_MAIN_SUB_MODEL | YES (prospective; historical V1 immutable) |
| ONE_MAIN_SUB_MODEL_ACROSS_ECOSYSTEM | YES |
| NEW_MODEL_CUTOVER_AT | 2026-09-04T01:00:00.000Z (`MAIN10_SUB40_CUTOVER_AT`) |
| HISTORICAL_LEDGER_REWRITTEN | NO |
| HISTORICAL_COMMISSIONS_RECALCULATED | NO |
| DOUBLE_ACCRUAL | NO |
| SELLER_PRINCIPAL_COMMISSIONED | NO |
| COURIER_PRINCIPAL_COMMISSIONED | NO |
| UNIVERSAL_HC_REGRESSION | NO |
| SEARCH_ARCHITECTURE_CHANGED | NO |

Partners cannot create further partners (`PARENT_IS_PARTNER` / create-sub guard).

## Deploy

| Field | Value |
|---|---|
| BUILD | PASS (Growth + Marketplace) |
| TESTS | MAIN10_SUB40 8/8 Growth + 3/3 Marketplace |
| GROWTH_PRODUCTION_SHA | `65701b9` |
| GROWTH_DEPLOYMENT_ID | `dpl_3NsDfcEt9n7hhN5TdwDauWffDj3H` |
| MARKETPLACE_PRODUCTION_SHA | `86bb24ee` |
| MARKETPLACE_DEPLOYMENT_ID | `dpl_FPHCKATr9LcT75eDWkzcZvbW1Rkw` |
| PRODUCTION_SMOKE | LIVE_UNEXERCISED (prospective allocation; no new money) |

