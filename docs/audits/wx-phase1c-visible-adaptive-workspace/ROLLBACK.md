# WX Phase 1C — Rollback Plan

## Scope

Feature branch only. Not merged. Not deployed.

## Rollback steps

1. Do not merge `wx/phase-1c-visible-adaptive-workspace`.
2. If already merged (future): revert Commit A then Commit B, or `git revert` the merge commit.
3. Production remains at WX 1B.5.9 (`afeaa867` / freeze tip on `main`).
4. No database / Prisma / env migration required for rollback.
5. Flag `HOMECHEFF_FEED_WORKSPACE_VISIBILITY_MODE` unchanged in meaning; 1C only affects presentation when layout is visible.

## Risk

Low — presentation-only. GeoFeed ownership and Host state machine untouched.
