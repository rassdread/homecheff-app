# Affiliate Regression

| Check | Result |
|-------|--------|
| Main cap 80% of commission share | PASS |
| Sub cap 75% | PASS |
| No platform 100% leakage via affiliate path | PASS |
| Attribution intact | PASS (affiliateId path unchanged) |
| Platform promos `affiliateId = null` | PASS |
| No affiliate commission on platform | PASS |

Suite: `validate-admin-promocode-regression.ts` → PASS
