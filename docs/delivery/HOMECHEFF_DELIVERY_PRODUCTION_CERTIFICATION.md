# Delivery production certification

**Date:** 2026-09-04

## Supply truth (expected until recruitment)

```
REAL_ACTIVE_INDIVIDUAL_PROVIDERS = 0
REAL_ACTIVE_COMPANY_PROVIDERS = 0
REAL_ACTIVE_DRIVERS = 0
TEST_MATCHABLE_PROVIDERS = 0
PUBLIC_FAKE_DELIVERY_SUPPLY = NO
```

## Technical readiness shipped

- Individual + company self-service signup (`/delivery/start`)
- Company invite / accept / assign / reassign
- Driver dashboard (`/delivery/driver`) + status updates for assigned drivers
- Provider activation gate (`/api/delivery/activate`)
- Named selection + provider pricing + business profiles **default ON**
- First-accept pool **default OFF**
- Zero-supply checkout copy (no fake providers)
- Settlement SSOT: 12% / 88% to commercial profile owner

## Readiness distinction

```
DELIVERY_TECHNICAL_PRODUCTION_READY = YES (product paths complete; zero real supply)
FIRST_REAL_INDIVIDUAL_PROVIDER_E2E_CERTIFIED = NO
FIRST_REAL_COMPANY_PROVIDER_E2E_CERTIFIED = NO
```

Do not seed public fake providers to flip E2E flags.

See `HOMECHEFF_FIRST_REAL_PROVIDER_RUNBOOK.md`.
