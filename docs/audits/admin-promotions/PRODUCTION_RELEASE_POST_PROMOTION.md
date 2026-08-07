# Admin Promotions — Post-Promotion Lifecycle Production Freeze

**Date:** 2026-08-07  
**Verdict:** `HOMECHEFF_ADMIN_PROMOTIONS_PRODUCTION_SUCCESS`  
**Frozen:** YES

## Merge

- Branch: `feat/promotions-post-promotion-behaviour`
- `origin/main` tip: `7208aa92`
- Commits included:
  - `5f51dd81` feat(promotions): support configurable post-promotion subscription behaviour
  - `aab11193` docs(promotions): add post-promotion lifecycle evidence
  - `7208aa92` fix(promotions): clarify bilingual post-promotion UX for Formal Review

## Migration

Applied: `20260807124000_promo_post_promotion_action`  
Status: Database schema is up to date

## Deployment

| Field | Value |
|-------|--------|
| Deployment ID | `dpl_9ST993cdXbjw25EgyBM5s8w5ioFx` |
| Alias | https://homecheff.eu |
| ReadyState | READY |

## Live validation

`TESTCONTINUE` / `TESTEND` (100%, 1 month):

- Created → quotes + lifecycle routing verified
- CONTINUE → Stripe trial plan
- END → free entitlement plan; redemption snapshot `END`
- Both disabled after test

HTTP: `/sell` 200; validate disabled; admin 401; cron 401

## Freeze scope

Admin Promotions including post-promotion CONTINUE/END lifecycle, bilingual UX, redemption limits, TTL.
