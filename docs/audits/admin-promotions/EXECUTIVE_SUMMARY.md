# Admin Promotions — Executive Summary (Formal Review)

**Verdict:** `HOMECHEFF_ADMIN_PROMOTIONS_FORMAL_REVIEW_PASS`  
**Status:** `READY_FOR_PRODUCTION_PROMOTION`  
**Branch:** `feat/admin-platform-promotions`

## Closed gap

`maxRedemptionsPerUser` is now an **authoritative server-side** rule, enforced at quote and subscribe, with **atomic** reservation via `SELECT … FOR UPDATE` + `PromoCodeRedemption` ledger.

## System capabilities

- Platform-owned promotions (`affiliateId = null`)
- 0–100% and fixed discounts
- Configurable billing-cycle duration
- Global + per-user redemption limits
- Start/end dates, disabled codes
- BASIC / PRO / PREMIUM server quotes
- 100% → free entitlement (no micro-charge)
- Timed paid → Stripe repeating coupon → list price resumes
- Affiliate system unchanged

## Do not

Merge / deploy / freeze from this review alone — operator promotion decision remains separate.
