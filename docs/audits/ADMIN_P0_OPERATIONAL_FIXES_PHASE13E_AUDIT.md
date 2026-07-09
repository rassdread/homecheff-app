# ADMIN_P0_OPERATIONAL_FIXES — Phase 13E Audit

**Date:** 2026-07-09  
**Scope:** Fix Phase 13D P0 operational blockers. No admin IA redesign.

---

## Executive verdict

**After 13E:** Admin is **significantly closer** to pilot-safe founder operations. Sergio can suspend users, manage delivery status, override promos, adjust commissions, inspect subscriptions, and review a unified trust queue — without Prisma Studio for those paths.

**Still requires engineering/Stripe dashboard for:** plan upgrades with price changes, full SEO admin, feature flags, automated fraud scoring.

---

## P0 fixes

| ID | Phase 13D issue | 13E fix |
|----|-----------------|--------|
| P0-1 | Delivery toggle API missing | `PATCH /api/admin/delivery/[profileId]/status` + block route |
| P0-2 | `prisma.dispute` invalid | Command Center uses open `Report` count |
| P0-3 | AdminPermissions UI-only | `lib/admin-guard.ts` on sensitive routes |
| P0-4 | No subscription lifecycle admin | `GET/POST /api/admin/business-subscriptions/[userId]` |
| P0-5 | USER_REPORT not in moderation | Trust queue includes analytics events |
| P0-6 | No account suspend | User `suspendedAt` + suspend/restore API + checkout block |
| P0-7 | No promo admin override | `GET/PATCH /api/admin/promo-codes` |
| P0-8 | Sparse audit logging | `lib/admin-audit.ts` on new + critical actions |
| P0-9 | clear-chat unprotected | SUPERADMIN page + API + reason required |

---

## Part 1 — Admin guard

**File:** `lib/admin-guard.ts`

- `requirePlatformAdmin()` — ADMIN \| SUPERADMIN \| adminRoles
- `requireSuperAdmin()` — destructive ops
- `requireAdminPermission(key)` — checks `AdminPermissions` (SUPERADMIN bypass)

Applied to: suspend, delivery, subscriptions, promo, commission adjustment, clear-messages, affiliate status.

---

## Part 2 — User suspend / restore

**Schema:** `User.suspendedAt`, `suspendedById`, `suspendReason`

**API:** `POST/DELETE /api/admin/users/[id]/suspend`

**Blocks:** checkout (`assertNotSuspended`)

**UI:** UserManagement suspend/restore buttons

---

## Part 3 — Business subscription admin

**API:** `/api/admin/business-subscriptions/[userId]`

- GET: plan, DNA via `getBusinessVisibilityProfile()`, Stripe state, `BusinessSubscription` row
- POST actions: `cancel_at_period_end`, `reactivate`, `extend_valid_until`, `force_expire`

No duplicate pricing logic.

---

## Part 4 — Delivery admin

- `PATCH .../status` — `isActive`
- `PATCH .../block` — block/unblock with reason
- `POST .../orders/[orderId]/assign` — manual assign when `DeliveryOrder` exists

**Schema:** `DeliveryProfile.isBlocked`, `blockedAt`, `blockedById`, `blockReason`

---

## Part 5 — Promo override

- List all affiliate `PromoCode` rows
- Admin disable/restore with reason + audit

---

## Part 6 — Commission adjustment

- `POST /api/admin/affiliates/commission-adjustment` (SUPERADMIN)
- New ledger rows `ADMIN_ADJUSTMENT`, `eventId` prefix `admin_adj_`
- Non-destructive; preserves idempotency

---

## Part 7 — Trust queue

- `GET /api/admin/trust-queue` — reports, moderation events, USER_REPORT, suspended users, blocked couriers
- `tracked: false` for refund requests, affiliate fraud scoring, Stripe disputes aggregate
- UI: `TrustQueuePanel` on Disputes tab

---

## Part 8 — Audit logging

**File:** `lib/admin-audit.ts` — structured JSON in `AdminAction.notes`

Logged: suspend, restore, delivery, promo, subscription actions, commission adjustment, clear-messages, affiliate status.

---

## Part 9 — clear-chat

- Page: server SUPERADMIN check → `ClearChatClient`
- API: `requireSuperAdmin` + reason + audit
- Confirmation phrase required

---

## SSOT (no duplicates)

| Domain | SSOT |
|--------|------|
| Business DNA / fees | `lib/business/visibility-profile.ts` |
| Affiliate commission math | `lib/affiliate-config.ts`, `lib/affiliate-commission.ts` |
| Attribution | `lib/affiliate-attribution-contract.ts` |
| Settlement | `lib/marketplace/settlement/settlement-router.ts` |

**No fake metrics** in trust queue — explicit `tracked: false` for unavailable sources.

---

## Validation

```bash
npx tsx scripts/validate-admin-p0-fixes-phase13e.ts
npx tsx scripts/validate-admin-operations-phase13d.ts
npx tsx scripts/validate-affiliate-attribution-analytics-phase13c.ts
npm run lint
npm run build
```
