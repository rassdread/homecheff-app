# AFFILIATE_ATTRIBUTION_ANALYTICS — Phase 13C Audit

**Date:** 2026-07-08  
**Scope:** Fix P0 findings from Phase 13B — affiliate attribution contract, cookie unification, subscription attribution, analytics honesty. No redesign.

---

## Executive summary

| Area | Before 13C | After 13C |
|------|------------|-----------|
| Cookie policy | Server first-touch, client last-touch (conflict) | **Unified first-touch** via `affiliate-attribution-contract.ts` |
| Business ref-link → subscription commission | Missed when no promo code | **Resolved** via `resolveSubscriptionAttributionId` in `/api/subscribe` |
| androidBeta cookie | `expires` undefined when `hc_ref` exists | **Fixed** — expiry always computed first |
| Cross-device | Undocumented in product UI | **Documented** — `tracked: false`, dashboard copy |
| Seller analytics tier | Overpromised favorites/messages/popular_listings | **Implemented** in stats API from real data |

**Verdict:** Pilot-safe for affiliate-driven growth with documented limits. Cross-device remains unsupported by design.

---

## PART 1 — Attribution contract (SSOT)

**File:** `lib/affiliate-attribution-contract.ts`

| Rule | Pilot policy |
|------|--------------|
| Touch model | **First-touch** within cookie TTL |
| Cookie name | `hc_ref` |
| Cookie duration | 30 days (`COOKIE_TTL_DAYS` from `affiliate-config.ts`) |
| Revenue window | 365 days (`ATTRIBUTION_WINDOW_DAYS`) |
| Overwrite | Later affiliate links **do not** replace existing `hc_ref` until expiry |
| Self-referral | Blocked at signup |
| Duplicate signup attribution | Blocked per user |
| QR / social / email share | Same first-touch rules via server redirect or client helper |
| Google/social login | Attribution at register / complete-social-onboarding if cookie present |
| App/deep-link | Beta path may set `hc_beta_src`; attribution still same-browser |
| Cross-device | **Unsupported** — desktop click does not follow mobile register |
| Expired cookie | New valid click may set fresh `hc_ref` |

---

## PART 2 — P0 fixes

### P0-1 — Cookie policy mismatch ✅

- **Server:** `app/api/affiliate/referral/route.ts` — sets `hc_ref` only when absent.
- **Client:** `lib/affiliate-attribution.ts` `setReferralCookie()` — returns early if `hc_ref` exists.
- **TTL:** Both use `referralCookieExpiryDate()` / `COOKIE_TTL_DAYS` from config.

### P0-2 — Business subscription attribution ✅

- **Signup:** `processAttributionOnSignup` creates `USER_SIGNUP` or `BUSINESS_SIGNUP` from cookie.
- **Subscribe:** `/api/subscribe` calls `resolveSubscriptionAttributionId(userId)` when no promo attribution.
- **Stripe:** `attribution_id` in checkout session metadata → webhook `BusinessSubscription.attributionId`.
- **Promo path:** Unchanged — promo still creates/links `BUSINESS_SIGNUP` with `PROMO_CODE` source.

### P0-3 — androidBeta expiry ✅

- `expires` computed via `referralCookieExpiryDate()` before any `cookies.set`, including `hc_beta_src`.

### P0-4 — Cross-device ✅

- Documented in contract, affiliate dashboard panel, admin command center (`crossDeviceAttribution: tracked false`).
- No device fingerprinting added.

### P0-5 — Seller analytics honesty ✅

- `app/api/seller/dashboard/stats/route.ts` now returns:
  - `totalFavorites` — `Favorite` rows on seller products in period
  - `totalMessages` — `Message` rows on seller product conversations / participant threads
  - `popularListings` — top 5 products by Stripe-paid revenue in period
- `app/api/seller/dashboard/products/route.ts` — views from `analyticsEvent` (removed `sales * 10` estimate)
- `IMPLEMENTED_ANALYTICS_METRICS` matches API output

---

## PART 3 — Commission integrity (unchanged, verified)

- Self-referral blocked at attribution creation
- `CommissionLedger.eventId` = invoice id (idempotent)
- Promo and ref-link paths converge on single `attribution_id` in subscription metadata

---

## PART 4 — UI / ops surfaces

| Surface | Change |
|---------|--------|
| Affiliate dashboard | Attribution policy panel (first-touch, cookie, cross-device, commission) |
| Seller analytics | Favorites, messages, popular listings when tier allows |
| Admin Command Center | `attributionPolicy`, `referralCookiePolicy`, `crossDeviceAttribution`, `sellerAnalyticsHonesty` |

---

## PART 5 — Out of scope (explicit)

- Cross-device claim flow (would need account-linking product design)
- QR-specific traffic persistence (`tracked: false` in 13A command center remains)
- Profile visits, export, campaign analytics (remain tier-locked / unimplemented)

---

## Validation

```bash
npx tsx scripts/validate-affiliate-attribution-analytics-phase13c.ts
npx tsx scripts/validate-operations-dashboard-phase13b.ts
npx tsx scripts/validate-follow-the-money-phase11b.ts
npm run lint
npm run build
```

---

## Files touched

- `lib/affiliate-attribution-contract.ts` (new)
- `lib/affiliate-attribution.ts`
- `app/api/affiliate/referral/route.ts`
- `app/api/subscribe/route.ts`
- `app/api/seller/dashboard/stats/route.ts`
- `app/api/seller/dashboard/products/route.ts`
- `lib/business/analytics-tier.ts`
- `app/verkoper/analytics/page-client.tsx`
- `app/affiliate/dashboard/page-client.tsx`
- `app/api/admin/command-center/route.ts`
- `public/i18n/en.json`, `public/i18n/nl.json`
