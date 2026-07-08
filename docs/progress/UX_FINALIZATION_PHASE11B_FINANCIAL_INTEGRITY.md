# UX Finalization — Phase 11B Financial Integrity

**Date:** 2026-07-08

## Goal

Follow every euro from payment through payout, subscription, affiliate commission, and reporting. Verify financial integrity for real-money pilot launch. No architecture changes.

## Delivered

| Artifact | Purpose |
|----------|---------|
| `docs/audits/FOLLOW_THE_MONEY_PHASE11B_AUDIT.md` | Full financial flow audit |
| `scripts/validate-follow-the-money-phase11b.ts` | Financial integrity guard |
| Code fixes (P0/P1) | See below |

## Fixes applied

| Fix | Severity | File |
|-----|----------|------|
| Missing `requiresStripeForHomecheffCheckout` import | P0 | `app/api/checkout/route.ts` |
| Remove corrupt `subscription.upsert` in payment webhook | P0 | `app/api/stripe/webhook/route.ts` |
| Session ownership on subscribe | P1 | `app/api/subscribe/route.ts` |
| Session ownership on subscribe confirm | P1 | `app/api/subscribe/confirm/route.ts` |
| Resolve `payment_intent` from checkout session on admin refund | P1 | `app/api/admin/refunds/route.ts` |
| Escrow atomic lock before transfer | P1 | `lib/releaseEscrowOnDelivered.ts` |

## Architecture

Unchanged — settlement router, canonical model, checkout settlement gate, fee model, affiliate ledger SSOT.

## Pre-launch ops (not code)

1. Stripe webhook + Connect webhook secrets in production
2. Schedule affiliate crons (`update-status` daily, `process` weekly) with `CRON_SECRET`
3. Test Connect onboarding → checkout → payout end-to-end

## Validation

```bash
npx tsx scripts/validate-follow-the-money-phase11b.ts
npm run lint
npm run build
```

## Verdict

| Question | Answer |
|----------|--------|
| Safely receive money? | **Yes** |
| Safely distribute money? | **Yes** (refund clawback P2) |
| Safely manage subscriptions? | **Yes** (no grace period P1) |
| Safely manage affiliate commissions? | **Accrual yes; auto-payout needs cron** |
| Safely scale financially? | **Yes for 100–500 users** |
| Financially ready for pilot? | **Yes** for marketplace checkout |

## Deferred (post-pilot)

- Affiliate payout crons in `vercel.json` (needs wrapper or external scheduler)
- `invoice.payment_failed` grace period
- Marketplace `charge.refunded` order handler + seller clawback
- Stripe Tax / VAT engine
- True MRR reporting
- Remove legacy mock `PaymentButton` path
