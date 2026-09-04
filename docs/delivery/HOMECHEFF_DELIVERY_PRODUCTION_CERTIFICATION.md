# Delivery production certification notes

## Zero supply (2026-09-04 forensic)

```
REAL_ACTIVE_INDIVIDUAL_PROVIDERS = 0
REAL_ACTIVE_COMPANY_PROVIDERS = 0
REAL_ACTIVE_DRIVERS = 0
TEST_PROVIDERS_PUBLICLY_VISIBLE = NO
```

Two inactive profiles existed (internal + inactive individual) — not shown as supply.

## Required before first real courier outreach

1. Migrate `20260904160000_delivery_company_membership`
2. Enable flags as needed: named selection + provider pricing (+ business profiles)
3. Smoke: `/delivery/start`, company signup, invite, assign, zero-supply checkout copy
4. Do **not** seed fake public providers

See `HOMECHEFF_FIRST_REAL_PROVIDER_RUNBOOK.md`.
