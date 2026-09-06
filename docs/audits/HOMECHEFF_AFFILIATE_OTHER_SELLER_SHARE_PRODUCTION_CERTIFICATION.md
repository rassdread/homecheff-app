# HOMECHEFF_AFFILIATE_OTHER_SELLER_SHARE_PRODUCTION_CERTIFIED

**Date:** 2026-09-06  
**Feature SHA (unchanged):** `54032c56656ef870b15b02e159e7b7a88b59d68f`  
**Code changes this cert:** none (policy verified; no defect)

**Evidence:** `docs/audits/evidence-affiliate-other-seller-share/certification.json`  
**Script:** `scripts/affiliate-other-seller-share-cert.ts`

---

## Policy (code)

| Field | Value |
|-------|-------|
| `TILE_SHARE_URL_HELPER` | `TileShareAction` → `toAbsolutePublicUrl(href)` → `useAffiliateLink.addAffiliateToUrl` |
| `DETAIL_SHARE_URL_HELPER` | `ShareButton` → `useAffiliateLink.addAffiliateToUrl` |
| `AFFILIATE_URL_POLICY` | Current session user’s personal `Affiliate.referralLinks[0].code` as `?ref=` |
| `CURRENT_USER_AFFILIATE_SOURCE` | `GET /api/affiliate/referral-link` (session email) |
| `LISTING_OWNER_USED_IN_SHARE_ATTRIBUTION` | **NO** |
| `SHARER_AFFILIATE_WINS` | **YES** |
| `AFFILIATE_PARAM_NAME` | `ref` |

Listing owner identity is never read when building share URLs.

---

## Production captures (sharer = active Marketplace Affiliate)

Sharer account: `r.sergioarrias@gmail.com` (`7647bf21-…`)  
Referral code: `REF7647BF21907E`

| Case | Result |
|------|--------|
| A Own listing tile | `…/product/homecheff-design-studio-…?ref=REF7647BF21907E` |
| B Other seller tile | `…/product/pastas-rotterdam-…?ref=REF7647BF21907E` (seller: Farieda; no seller `ref`) |
| C Non-affiliate | plain listing URL — no `ref` |
| D Anonymous | plain listing URL — no `ref` |
| E Tile + F Detail | same helper/policy |

**Other listing:** `6903370f-ad45-49d6-b6c1-3d7332a100d9` · seller user `72582f0c-…` · owner display “Farieda Kartoikromo”

---

## E2E lock (other-seller share → new signup)

1. Shared URL carried sharer `ref=REF7647BF21907E` (not seller).  
2. New cert user registered with `hc_ref` cookie set from that code.  
3. Marketplace `Attribution.affiliateId` = sharer’s Affiliate `a60bafc0-…`.  
4. Seller was **not** the referrer.

| Field | Value |
|-------|-------|
| `E2E_OTHER_SELLER_REFERRAL_LOCK` | **PASS** |
| `CANONICAL_REFERRER_AFTER_E2E` | `7647bf21-e9ab-4e3a-af83-eeec23e24dcb` |
| `SELLER_AUTO_ATTRIBUTION` | **NO** |
| `FUTURE_ELIGIBLE_REVENUE_AFFILIATE` | SERGIO (sharer) |
| `EXISTING_RECIPIENT_ATTRIBUTION_OVERRIDDEN` | **NO** (`setReferralCookie` first-touch; share click does not mutate recipient locks) |

---

## Surfaces

Feed / search / category / profile grid all use `TileMedia` → `TileShareAction` → same helper → **PASS**.

Native share and clipboard receive the **same** URL string → `URL_POLICY_MATCH = YES`.

---

## Company marketer note

Tile/detail share injects **personal** Marketplace `?ref=` only. Company `aff_track` is a separate acquisition path (Growth/company binder).  
`COMPANY_MARKETER_SHARE_SUPPORTED = NO` for automatic company economic-owner identity on listing share.

---

## Identity note (not a share-policy defect)

`sergio@homecheff.eu` (`6c004e0d-…`) has **no** Marketplace `Affiliate` row.  
Active personal affiliate seat used for share `?ref=` is `r.sergioarrias@gmail.com`.  
Logged-in as `sergio@homecheff.eu`, share correctly emits a plain listing URL (no fabricated affiliate).

---

## Final matrix

| Field | Value |
|-------|-------|
| `AFFILIATE_SHARING_USES_CURRENT_SHARER` | YES |
| `OWN_LISTING_SHARE_USES_SHARER` | YES |
| `OTHER_SELLER_LISTING_SHARE_USES_SHARER` | YES |
| `OTHER_SELLER_LISTING_SHARE_USES_SELLER` | NO |
| `NON_AFFILIATE_SHARE_HAS_AFFILIATE_PARAM` | NO |
| `ANONYMOUS_SHARE_HAS_AFFILIATE_PARAM` | NO |
| `TILE_AND_DETAIL_POLICY_MATCH` | YES |
| `COMPANY_MARKETER_COMPANY_OWNERSHIP` | NO (personal `?ref=` only) |
| `E2E_OTHER_SELLER_REFERRAL_LOCK` | PASS |
| `CANONICAL_REFERRER_AFTER_E2E` | `7647bf21-…` (Sergio Marketplace affiliate) |

---

## FINAL_DECISION

```
HOMECHEFF_AFFILIATE_OTHER_SELLER_SHARE_PRODUCTION_CERTIFIED
```

Anne (seller) remains seller. Sergio (sharer) is affiliate/referrer when he shares her listing. New signup via that URL locks to Sergio — not to the listing owner.
