# Formal Review — Post-Promotion Lifecycle + Admin Promotions

**Date:** 2026-08-07  
**Branch:** `feat/promotions-post-promotion-behaviour`  
**Verdict:** `HOMECHEFF_ADMIN_PROMOTIONS_FORMAL_REVIEW_PASS` (pending production gates)

| Area | Verdict |
|------|---------|
| Admin navigation (Promotions) | PASS |
| Promotions panel + bilingual CONTINUE/END | PASS |
| Platform model (`affiliateId` null) | PASS |
| 0–100% / fixed discounts | PASS |
| Duration cycles | PASS |
| Global + per-user limits + ledger | PASS |
| TTL cleanup cron | PASS |
| CONTINUE lifecycle (trial / coupon → paid) | PASS |
| END lifecycle (entitlement / cancel_at) | PASS |
| Affiliate separation | PASS |
| Security (admin + server authority) | PASS |
| Rollback / migration additive | PASS |

Customer UX shows FREE period + explicit after-behaviour (NL + EN).
