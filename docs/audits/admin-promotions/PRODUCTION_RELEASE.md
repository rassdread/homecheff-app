# Admin Promotions — Production Release Freeze

**Date:** 2026-08-07  
**Verdict:** `HOMECHEFF_ADMIN_PROMOTIONS_PRODUCTION_SUCCESS`  
**Frozen:** YES

## Merge

- Feature: `feat/admin-platform-promotions`
- Tip merged to `main`: `e095563c` — `fix(promotions): expire abandoned RESERVED redemptions by TTL`
- Includes: platform promotions, per-user atomic limits, TTL cron, merge of prior notification main

## Migrations (Production Neon)

Applied via `prisma migrate deploy`:

1. `20260807111728_promo_code_platform_duration`
2. `20260807120000_promo_code_redemption`

Status after: **Database schema is up to date**

## Deployment

| Field | Value |
|-------|--------|
| Deployment ID | `dpl_Gwnj8d4mrDeVSk7HQDY7cyZZTzyz` |
| Alias | https://homecheff.eu |
| ReadyState | READY |
| Target | production |

## Live validation

Script: `scripts/live-validate-admin-promotions-production.ts`

- Created `TESTADMIN` (100%, 1 month, per-user=1)
- Quote Premium → €0 / 1 cycle
- First reserve PASS; same user second → `max_redemptions_per_user`
- Other user PASS
- Promo **DISABLED** after test; redemption rows cleaned

HTTP probes:

| Check | Result |
|-------|--------|
| GET /sell | 200, promo copy present |
| POST validate TESTADMIN | valid=false, reason=disabled (expected after cleanup) |
| GET /api/admin/promo-codes?platformOnly=1 | 401 Unauthorized |
| GET /api/cron/expire-promo-reservations | 401 |
| POST /api/subscribe (no auth) | Niet ingelogd |

## TTL

- Cron: `/api/cron/expire-promo-reservations` every 15 minutes
- Env: `PROMO_RESERVATION_TTL_MINUTES` (default 60)
- Releases RESERVED → restores counts → AuditLog `PROMO_RESERVATION_EXPIRED`

## Freeze scope

Admin-controlled business subscription promotions (platform-owned).  
Affiliate promotions unchanged. No marketplace seller coupons in this freeze.
