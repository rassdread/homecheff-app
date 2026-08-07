# Remaining Warnings

1. **Abandoned RESERVED slots** — paid checkout cancel does not auto-release; consider TTL job before heavy campaigns.
2. **Live Stripe E2E** — unit/policy PASS; staging Formal ops should run WELCOME3 / HALF6 once against real Stripe + DB after migrate.
3. **Validate path name** — still `/api/affiliate/validate-promo-code` for compatibility.
4. **No merge/deploy/freeze** in this step — production promotion is an operator decision.
5. **Prisma generate** required on each environment after applying `20260807120000_promo_code_redemption`.
