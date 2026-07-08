# UX Finalization — Phase 13C: Attribution Contract & Analytics Honesty

**Status:** Complete  
**Date:** 2026-07-08

## Goal

Close Phase 13B P0 findings so affiliate attribution is predictable and seller analytics do not overpromise during the pilot.

## What shipped

1. **Attribution contract SSOT** — `lib/affiliate-attribution-contract.ts` (first-touch, 30d cookie, 365d revenue window).
2. **Unified cookies** — Server referral route and client `setReferralCookie()` both first-touch with shared TTL/name.
3. **androidBeta fix** — Cookie expiry always defined before `hc_beta_src` is set.
4. **Subscription attribution** — Ref-link signups link to `BusinessSubscription` via `resolveSubscriptionAttributionId` in `/api/subscribe`.
5. **Cross-device** — Documented as unsupported; affiliate dashboard + admin command center surfaces limitation.
6. **Seller analytics honesty** — Stats API implements favorites, messages, popular listings; products API uses real view counts.

## Pilot policy (summary)

- First valid affiliate click wins for 30 days.
- Same browser/device required at signup.
- Business subscription commission works for promo **and** normal ref-link signups.
- No fake or estimated metrics in tier-gated analytics.

## Validation

| Check | Command |
|-------|---------|
| Phase 13C | `npx tsx scripts/validate-affiliate-attribution-analytics-phase13c.ts` |
| Phase 13B chain | `npx tsx scripts/validate-operations-dashboard-phase13b.ts` |
| Phase 11B financial | `npx tsx scripts/validate-follow-the-money-phase11b.ts` |
| Lint / build | `npm run lint` · `npm run build` |

## Docs

- Audit: `docs/audits/AFFILIATE_ATTRIBUTION_ANALYTICS_PHASE13C_AUDIT.md`
- Validator: `scripts/validate-affiliate-attribution-analytics-phase13c.ts`

## Not in scope

- Cross-device claim flow
- New affiliate dashboard layout
- QR traffic analytics persistence
