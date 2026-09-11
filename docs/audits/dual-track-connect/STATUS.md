# Dual-track Stripe Connect — implementation status

Date: 2026-09-11  
Platform (live): `acct_1S1TFM2KvmKfeN9t`

## Implemented

- PARTICULAR track: controller `dashboard=none`, `business_type=individual`, `transfers` only, full SA
- BUSINESS track: Express + hosted onboarding (legacy card_payments kept)
- Server-side `User.stripeConnectTrack` (migration applied)
- Dual-track UX selector + recovery path for stuck empty Express
- Payment-ready SCT-aware (particular: payouts + transfers active; charges may be false)
- Webhooks updated for both account shapes
- Unit tests: `lib/stripe/connect-tracks.test.ts` (pass)
- Live account classification script (no PII)

## FASE 1 blocker

`PARTICULAR_NO_KVK_TEST` against the **Connect platform** could not be executed:

- Local/Vercel env only has `sk_live` for Connect platform
- Stripe CLI logged into **Homecheff Growth** (`acct_1TEEblRqhK5EhT0a`) which has **no Connect**
- Claimable sandboxes only provide limited `rkcs_test` keys (cannot `accounts.create`)

### Unblock

1. In Stripe Dashboard for platform `acct_1S1TFM2KvmKfeN9t`, copy **Test mode** secret key (`sk_test_…`)
2. Set `STRIPE_TEST_SECRET_KEY=sk_test_…` in `.env.local`
3. Run: `npx tsx scripts/validate-dual-track-connect-testmode.ts`
4. Require `PARTICULAR_NO_KVK_TEST=PASS` before production certification

## Service agreement decision

`PARTICULAR_SERVICE_AGREEMENT = full`  
Why: recipient not used without counsel confirmation for marketplace sale proceeds; full + dashboard=none is Stripe-supported for NL individuals without KvK (2026-05-14 docs).

## Live account classification (unchanged — no mutations)

See `scripts/classify-live-connect-accounts.ts` output. ACTIVE/LEGACY accounts left alone; STUCK/WRONG_NONPROFIT candidates eligible for safe empty replace via PARTICULAR track + `forceReplace`.
