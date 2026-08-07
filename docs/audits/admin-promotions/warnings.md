# Remaining Warnings

1. **Abandoned RESERVED TTL** — cron deployed (`*/15 * * * *`); confirm `CRON_SECRET` is set on Vercel (401 without auth observed — good). Optionally set `PROMO_RESERVATION_TTL_MINUTES` if 60 is not desired.
2. **Admin UI live create** — DB/script live validation PASS; browser admin create path not re-exercised in this release window (API auth 401 as expected without session).
3. **Validate path name** — still `/api/affiliate/validate-promo-code` for compatibility.
4. **TESTADMIN** remains in DB as **DISABLED** (not deleted) for audit trail.
