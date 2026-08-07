# Remaining Warnings

1. **CONTINUE 100%** uses Stripe Checkout trial (consent). Live card charge through paid continuation was not executed in this window; routing + code path verified.
2. **TESTCONTINUE / TESTEND / TESTADMIN** remain in DB as **DISABLED** for audit.
3. **Validate path name** still `/api/affiliate/validate-promo-code` (compat).
4. TTL cron auth OK (401 without secret). Optional `PROMO_RESERVATION_TTL_MINUTES` (default 60).
