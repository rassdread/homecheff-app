# HOMECHEFF_AFFILIATE_PERSONAL_AND_COMPANY_SHARE_ATTRIBUTION_PRODUCTION_CERTIFIED

**Date:** 2026-09-06

| Runtime | SHA | Deployment |
|---------|-----|------------|
| Marketplace | `cdff3f21389cbe30ff86a1ed359be577e49e9d6d` | `dpl_HnKDPiwigoQf74qJWhBCGU3W8u1c` |
| Growth | `180beb236f98c4a10718bc675454462cda6537ca` | `dpl_BHF2BynY7QaZBwFteY8rcEpCnaMr` |

Evidence:
- `docs/audits/evidence-affiliate-company-listing-share/` (Marketplace + Growth)
- Prior personal cert retained: `HOMECHEFF_AFFILIATE_OTHER_SELLER_SHARE_PRODUCTION_CERTIFICATION.md`

---

## Architecture

| Field | Value |
|-------|-------|
| `SHARE_CONTEXT_RESOLVER` | `resolveShareMode` + `useMarketplaceShareContext` |
| `PERSONAL_SHARE_MECHANISM` | `appendPersonalRef` → `?ref=<REF…>` |
| `COMPANY_SHARE_MECHANISM` | `ENSURE_LISTING_SHARE_ASSET` → `https://growth.homecheff.eu/a/[slug]` |
| `COMPANY_SHARE_ASSET_STRATEGY` | Idempotent reuse: org + actor + listing destinationPath + `channel=SHARE` |
| `COMPANY_ECONOMIC_OWNER` | `AffiliateOrganization.economicCentralUserId` |
| `COMPANY_ACQUISITION_ACTOR` | Current member (`marketerUserId` = sharer) |
| `DUAL_ROLE_PRECEDENCE` | Active company preference → company; personal preference → personal; else choose UI |
| `DUAL_ATTRIBUTION_IN_SHARE_URL` | **NO** |
| `DUPLICATE_ASSET_CREATION_ON_EVERY_SHARE` | **NO** |
| `NO_ACTIVE_CAMPAIGN_SHARE_CLASSIFICATION` | `campaignId = null` (organic SHARE) |

---

## Personal regression

| Field | Value |
|-------|-------|
| `PERSONAL_AFFILIATE_OTHER_LISTING` | **PASS** |
| `PERSONAL_REF_CODE_PRESERVED` | **YES** (`REF7647BF21907E`) |
| `PERSONAL_SHARE_REGRESSION` | **NO** |
| Shared URL | `…/pastas-rotterdam-…?ref=REF7647BF21907E` |

---

## Company Production proof (other seller listing)

| Field | Value |
|-------|-------|
| Org | HomeCheff Cert Growth Agency (`cmtnpffci00005u2jh773sl49`) |
| Listing | Farieda pasta `6903370f-…` (other seller) |
| Share URL | `https://growth.homecheff.eu/a/homecheff-cert-g-521b7b` |
| Reuse 2nd ensure | **same asset** |
| `/a/` redirect | 302 → listing + `aff_track=` + Growth `hc_aff_track` cookie |
| Personal `REF` on share URL | **NO** |
| IDOR forged org | **BLOCKED** |

### Canonical lock (new referred)

| Field | Value |
|-------|-------|
| `CANONICAL_ECONOMIC_OWNER` | `6c004e0d-…` (org economic seat / Sergio central) |
| `CANONICAL_ACQUISITION_ACTOR` | `7647bf21-…` (marketer / r.sergio) |
| `organizationId` / `channel` / `trackingAssetId` | preserved |
| `LISTING_OWNER_BECAME_REFERRER` | **NO** |
| `ACTIVE_ATTRIBUTION_OVERRIDE` | **NO** (second lock reuses existing) |

---

## UX / share tech

| Field | Value |
|-------|-------|
| `TILE_DETAIL_POLICY_MATCH` | **YES** (same resolver) |
| `NATIVE_CLIPBOARD_POLICY_MATCH` | **YES** (same URL) |
| `IOS_NATIVE_SHARE_USER_ACTIVATION_SAFE` | **YES** (second activation when company URL async; cached = one-tap) |
| `SHARE_CLICK_OPENS_LISTING` | **NO** |
| `NO_PER_CARD_N_PLUS_ONE` | **YES** (memberships once; ensure on share) |
| Dual-role chooser | “Delen als jezelf” / “Delen namens {bedrijf}” |

Company page org `<select>` writes share preference (`hc_aff_share_mode=company`).

---

## Roles

| Role | Company share |
|------|----------------|
| OWNER | YES |
| ADMIN | YES |
| MARKETER | YES |

Economic owner remains the organization for all three. External PARTNER path unchanged (personal/partner mechanics; not converted to employee share).

---

## Tests / build

| Suite | Result |
|-------|--------|
| Marketplace share resolver + listing-share | **12/12 PASS** |
| Growth org destination + normalize listing | **10/10 PASS** |
| Marketplace `npm run build` | **PASS** |
| Growth + Marketplace Production deploys | **READY** |

---

## FINAL_DECISION

```
HOMECHEFF_AFFILIATE_PERSONAL_AND_COMPANY_SHARE_ATTRIBUTION_PRODUCTION_CERTIFIED
```
