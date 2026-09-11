# Dual-track Connect — controlled production rollout report

Date: 2026-09-11

## Blocker (hard stop)

Live platform `acct_1S1TFM2KvmKfeN9t` rejected PARTICULAR account create:

> Your platform needs approval for accounts to have requested the `transfers` capability without the `card_payments` capability.

Sandbox (`acct_1S6D3DRpYdPVF6LP`) allowed transfers-only; production does not yet.

**Action taken:** `DUAL_TRACK_CONNECT_ENABLED` set back to `false` and production redeployed.
**No existing Express accounts mutated. No migration executed.**

## Pre-deploy

- Dual-track-only commit: `db8fa187`
- Unrelated WIP left unstaged
- Tests: connect-tracks + related unit suites PASS
- Lint: PASS (1 unrelated warning)
- Build: PASS
- Smoke-check: PASS

## Migration dry-run (read-only)

See `migration-dry-run-1789124719.json`

- TOTAL: 9
- KEEP: 3 (incl. 2 legacy active individuals)
- USER_CONFIRMATION_REQUIRED: 6
- AUTO_MIGRATION: 0
- MANUAL_REVIEW: 0

## Final decision

`HOMECHEFF_DUAL_TRACK_CONNECT_NOT_CERTIFIED`

Blocker: live platform lacks Stripe approval for transfers-without-card_payments.
