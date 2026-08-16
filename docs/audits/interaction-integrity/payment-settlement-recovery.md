# P0 Payment Settlement Recovery

**Main before:** `251bb3aaec41ad3143a8ea6ea7385e1377d3c8cb`  
**Production before:** `dpl_BWf8ZZBRZU9x3wfbMbx32PAZ8dgk`

## Fixes

1. Middleware: `/api/stripe/webhook` bypasses `.nl→.eu` 307
2. Canonical Stripe endpoint target: `https://homecheff.eu/api/stripe/webhook`
3. `Transaction.reservationId` optional (migration)
4. Idempotent `lib/payments/seller-settlement.ts` with Stripe idempotency keys
5. Webhook returns 2xx only when seller settlement complete (never Order-exists alone)
6. Seller UI: only `tr_` = success; pending_transfer ≠ paid
7. Admin alert: `SETTLEMENT_PENDING`

## Controlled €1 redrive

**Blocked until owner approval** after production deploy + Stripe endpoint cutover.

Expected: 88¢ → `acct_1Sj52gRyMYBvOmov`, event `evt_1U55lY2KvmKfeN9t8wI5TEIP`
