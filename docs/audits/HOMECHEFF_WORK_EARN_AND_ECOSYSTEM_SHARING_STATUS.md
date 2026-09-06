# HOMECHEFF WORK / EARN / SHARE — GAP CLOSURE CERTIFICATION

**Date:** 2026-09-06  
**FINAL_DECISION:** `HOMECHEFF_WORK_EARN_AND_ECOSYSTEM_SHARING_PRODUCTION_CERTIFIED`

## Deployments

| Runtime | SHA | Deployment |
|---------|-----|------------|
| Marketplace | `bebf86a6` | `dpl_BEVUnr4VZkBueZV7LHaSAiYqWRF3` |
| Growth | `4d75f89` | `dpl_DcS7L4VfzLR7LbUzVPrPwv1gCzZ4` |
| Studio | `5f384d94` (unchanged; binders already live) | prior |

Evidence: Growth `docs/audits/evidence-work-earn-gap-closure/gap-closure-cert.json`

## Binder audit

| Key | Value |
|-----|-------|
| HOMECHEFF_PERSONAL_BINDER | middleware `?ref=` → `/api/affiliate/referral` → `hc_ref` → `processAttributionOnSignup` |
| HOMECHEFF_COMPANY_BINDER | `?aff_track=` → `hc_aff_track` → `processCompanyTrackingOnSignup` |
| GROWTH_PERSONAL_BINDER | `/r/[slug]` + new `GrowthEcosystemPersonalRefBinder` / register bind |
| GROWTH_COMPANY_BINDER | `/a/[slug]` → `aff_track` handoff |
| STUDIO_PERSONAL_BINDER | `StudioAffiliateReferralBinder` → bind-referral |
| STUDIO_COMPANY_BINDER | same + `aff_track` |
| PERSONAL_REF_COOKIE | MP `hc_ref`; Studio `hc_studio_aff_ref`; Growth `hc_growth_ecosystem_ref` |
| COMPANY_TRACK_COOKIE | `hc_aff_track` (+ slug companion) |
| CROSS_DOMAIN_HANDOFF_MECHANISM | Growth `/a/[slug]` 302 with `?aff_track=` (no host cookie trust) |
| CANONICAL_LOCK_ENDPOINT | Growth `POST /api/internal/ecosystem/affiliate/attribution/lock` |
| COOKIE_CROSS_HOST_ASSUMPTION | **NONE** |
| ACTIVE_ATTRIBUTION_OVERWRITE | **NO** |

## Cross-domain matrix

All 12 company + personal paths **PASS**. `CROSS_DOMAIN_ATTRIBUTION_LOSS = 0`.

## Delivery

| Key | Value |
|-----|-------|
| REFERRED_DELIVERY_PROVIDER_E2E | **PASS** (share → `/delivery/signup` → self-service profile → org economic lock) |
| DELIVERY_PROFILE_CREATED_SELF_SERVICE | **YES** |
| ORIGINAL_REFERRER_PRESERVED | **YES** |
| PROVIDER_SELF_REFERRAL_CREATED | **NO** |
| REFERRED_DELIVERY_COMPANY_LOCK | **PASS** (lock at signup; company profile create remains session self-service) |
| FIRST_REAL_EXTERNAL_DELIVERY_* | **NO** (controlled cert only) |

## UI / BI

| Key | Value |
|-----|-------|
| AANGEBRACHTE_BEZORGERS_UI | Live on affiliate dashboard |
| Classification | Delivery intent metadata OR DeliveryProfile OR Delivery commission — not all referrals |
| OPPORTUNITY_FUNNEL_BI | Admin tab `opportunity-funnel` + `/api/admin/opportunity-funnel` |
| SHARE_TO_ATTRIBUTION_RATE_AVAILABLE | **CONDITIONAL** — shown only when company `OPPORTUNITY_SHARE_LINK_CREATED` denominator > 0; else “Attributed signups from shares” |
| SHARE_TO_ATTRIBUTION_RATE_DENOMINATOR_RELIABLE | **YES for company share assets only** |
| NO_MOCK_BI | **YES** |
| CERT_EVENTS_EXCLUDED_FROM_COMMERCIAL_BI | **YES** (`metadata.isCertification`) |

## Readiness

- HOMECHEFF_VERDIEN_HUB_PRODUCTION_READY = **YES**
- DELIVERY_RECRUITMENT_SHARING_PRODUCTION_CERTIFIED = **YES**
- ECOSYSTEM_PRODUCT_SHARING_PRODUCTION_CERTIFIED = **YES**
- PERSONAL_CROSS_ECOSYSTEM_SHARE_CERTIFIED = **YES**
- COMPANY_CROSS_ECOSYSTEM_SHARE_CERTIFIED = **YES**
- REFERRED_DELIVERY_PROVIDER_ONBOARDING_CERTIFIED = **YES**
- REFERRED_DELIVERY_COMPANY_ONBOARDING_CERTIFIED = **PARTIAL** (lock certified; authenticated company profile create path ready, not fully session-jar E2E’d)
- AANGEBRACHTE_BEZORGERS_PRODUCTION_READY = **YES**
- MEASUREMENT_PRODUCTION_READY = **YES**
