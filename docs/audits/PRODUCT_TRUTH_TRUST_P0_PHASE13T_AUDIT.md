# Product Truth & Trust P0 — Phase 13T Audit

**Date:** 2026-07-11  
**Scope:** Close Phase 13O P0 gaps — GDPR export, global suspension, Business DNA discovery truth.  
**Status:** Implemented (Option B for Business DNA).

---

## Part 1 — GDPR data export

### Root cause (13O P0 #1)

`components/profile/DeleteAccount.tsx` used a **UI stub** (`setTimeout` + success toast) with no backend. Phase 13Q softened copy to say export was “still being rolled out” but did not implement export.

### Implementation

| Layer | Path |
|-------|------|
| Export builder | `lib/profile/gdpr-data-export.ts` |
| Rate limit | `lib/profile/gdpr-export-rate-limit.ts` (3/user/24h prod) |
| API | `GET /api/profile/export-data` |
| UI | `components/profile/DeleteAccount.tsx` — real download |
| Audit | `AuditLog.action = GDPR_DATA_EXPORT` |

### Data included

- Account/profile (secrets stripped)
- Seller profile, business profile, delivery profile, affiliate
- Listings (up to 500), orders as buyer/seller, transactions, payouts summary
- Reviews given/received, favorites, follows, fan requests
- Notification preferences + notification summary
- Reports **submitted by user**, HCP stats/badges/rewards/events
- Consent/privacy settings, proposals, reservations
- Messages **sent by user** (encrypted bodies omitted with note)
- Conversations participated (metadata only)
- CSV summary counts in `csvSummaries.overview`

### Data omitted (documented in `omissions`)

- Password hashes, OAuth/push tokens, verification secrets
- Encryption keys and encrypted message plaintext
- Third-party private profile data
- Reports filed **against** the user, internal moderation notes
- Full IBAN / Stripe identifiers (summarized as “configured”)
- Platform audit logs (separate retention)
- Embedded binary media

### Security

- Authenticated session only; export scoped to `session.user.id`
- Rate limited; audit logged; safe filename; `Cache-Control: no-store`
- Errors sanitized (no stack traces to client)

---

## Part 2 — Global suspension enforcement

### Root cause (13O P0 #2)

`User.suspendedAt` existed and `lib/user-suspend.ts` provided `assertNotSuspended`, but enforcement was **route-local** (checkout + partial admin). Login worked; messaging, listings, proposals, delivery, affiliate mutations, and most API routes were unguarded.

### SSOT

| File | Role |
|------|------|
| `lib/user-suspend-middleware.ts` | Mutation rules, allowlist, exempt prefixes, public listing policy |
| `lib/user-suspend.ts` | DB check + reason messages |
| `lib/api/user-mutation-guard.ts` | Server-side helper for defense in depth |
| `middleware.ts` | Blocks `/api/*` POST/PUT/PATCH/DELETE when JWT `suspended` |
| `lib/auth.ts` | JWT `suspended` flag + session `isSuspended`, `suspendReason`, `suspendedAt` |

### Mutation routes protected

**All authenticated API mutations** except documented allowlist:

- Default: **blocked** at middleware when JWT indicates suspension
- Defense in depth: checkout retains `assertNotSuspended`
- Admin mutations: blocked via existing `lib/admin-guard.ts` for suspended admins

### Intentionally allowed while suspended

| Action | Why |
|--------|-----|
| GET (read) API and pages | View suspension notice, profile, support info |
| `GET /api/profile/export-data` | GDPR portability |
| `/api/auth/signout`, session, csrf | End session |
| Public webhooks/cron/auth callbacks | System paths (exempt prefix list) |

### Public listings while suspended

Existing public listings **remain visible** (no automatic delisting). Suspended users **cannot create or edit** listings until admin restore (`DELETE /api/admin/users/[id]/suspend`).

### UI

- `components/profile/SuspensionNotice.tsx` on account settings with appeal link to `/contact`

---

## Part 3 — Business DNA discovery truth

### Root cause (13O P0 #3)

`lib/discovery/ranking/business-visibility-boost.ts` and `rankingBoost` in `visibility-profile.ts` existed but **`baseline` ranking profile was never used in live feed** (`app/api/feed/route.ts`, `lib/feed/build-discovery-feed.ts`). UI/pricing still implied paid discovery priority.

### Decision: **Option B — Remove boost promise**

- Added `BUSINESS_DISCOVERY_RANKING_WIRED = false` in `visibility-profile.ts`
- Removed ranking boost from `computeVisibilityScore` and upgrade deltas
- Removed unproven growth benefits (`discoveryBoost`, `localSearch`) from plan cards
- Updated NL/EN i18n: compare table, preview tiers, delta copy — **no guaranteed feed ranking**

### Fairness safeguards

- No paid ranking multiplier applied to live feed
- New-creator/diversity sections unchanged (no regression path introduced)
- Paid plans retain **proven** benefits: lower commission, badges, verified profile, analytics tier labels

---

## Part 4 — Truth and policy consistency

Updated after implementation:

- Account delete/export flow (`deleteAccountFlow.*`)
- Account suspension notice (`accountSuspension.*`)
- Business DNA preview, compare table, delta strings (NL + EN)

Not reintroduced: “full data portability”, “global suspension” marketing claims, or “ranking visibility” promises.

---

## Part 5 — Security review

| Control | GDPR export | Suspension | Business DNA |
|---------|-------------|------------|--------------|
| Authentication | Session required | JWT + DB | N/A (copy/config) |
| Authorization | Own userId only | Own session mutations blocked | SSOT flag |
| Rate limit | 3/24h/user | Middleware + 429 on export | N/A |
| Audit log | GDPR_DATA_EXPORT | Admin suspend/restore (existing) | Documented decision |
| Client-only enforcement | No — API generates file | No — middleware + API | No — config + i18n |
| Capacitor/web | Same `/api/profile/export-data` | Same middleware | Same UI strings |

---

## Part 6 — Testing matrix (manual + validator)

Validator: `npx tsx scripts/validate-product-truth-trust-phase13t.ts`

Manual scenarios recommended before deploy:

- Export: normal/seller/business/affiliate/courier/empty user; 401 unauthenticated; no cross-user leakage
- Suspension: checkout/message/listing/proposal/affiliate/delivery mutations → 403; GET export + contact OK; restore → mutations work
- Business DNA: individual/Basic/Pro/Premium UI shows no live ranking boost; feed fairness unchanged

---

## Files changed (summary)

**New:** `lib/profile/gdpr-data-export.ts`, `lib/profile/gdpr-export-rate-limit.ts`, `app/api/profile/export-data/route.ts`, `lib/user-suspend-middleware.ts`, `lib/api/user-mutation-guard.ts`, `components/profile/SuspensionNotice.tsx`, docs, validator.

**Modified:** `middleware.ts`, `lib/auth.ts`, `lib/user-suspend.ts`, `components/profile/DeleteAccount.tsx`, `components/profile/AccountSettings.tsx`, `lib/business/dna-preview.ts`, `lib/business/subscription-comparison.ts`, `lib/business/visibility-profile.ts`, `public/i18n/nl.json`, `public/i18n/en.json`.

---

## Verdict

Phase 13O P0 product gaps are **closed with honest behavior**. Safe to commit after lint/smoke-check/build pass.
