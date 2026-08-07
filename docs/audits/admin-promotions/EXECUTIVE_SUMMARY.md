# Admin Promotions — Executive Summary

**Verdict:** `HOMECHEFF_ADMIN_PROMOTIONS_PASS`  
**Status:** `READY_FOR_FORMAL_REVIEW`  
**Branch:** `feat/admin-platform-promotions`  
**Scope:** Dedicated Admin → Promotions for platform-owned subscription codes (not Affiliates).

## What shipped

- Separate **Promotions** admin nav tab (Gift icon), not nested under Affiliates/Partners/Referrals.
- `AdminPromotionsPanel` — create, list, activate/deactivate, copy code, usage/redemption/duration.
- Extended `PromoCode` with `name`, `discountDurationCycles`, `maxRedemptionsPerUser`, `createdByAdminId` (platform: `affiliateId = null`).
- Duration-aware server quotes + `/sell` UX (“Heb je een promocode?”) showing original / promo period / list price resume.
- 100% discount → free entitlement (no fake €0.01 Stripe); timed % → Stripe repeating coupon on catalog price.
- Affiliate commission caps unchanged; admin 0–100% on full price.

## Explicitly out of scope

- Merge to main, production deploy, Formal Review execution.
- Changing affiliate promocode UX or commission math.
- Enforcing `maxRedemptionsPerUser` at redeem time (column stored; global max already enforced).
