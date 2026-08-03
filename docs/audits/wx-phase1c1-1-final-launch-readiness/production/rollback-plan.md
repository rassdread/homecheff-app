# Rollback Plan — WX Phase 1C.1.1

## Immediate rollback target

Git SHA: `7e09a3c9df0a13b5a92bb4ca28aade813ac8812a`  
Prior deployment: `dpl_48EnrP6ttskaC1oG2TgnwkMHsqsj`

## Steps (do not execute unless gate failure)

1. Redeploy prior Production deployment `dpl_48EnrP6ttskaC1oG2TgnwkMHsqsj` (or `vercel rollback` to that deployment) on project `homecheff-app`.
2. Optionally set `HOMECHEFF_FEED_WORKSPACE_VISIBILITY_MODE` back to prior Production value if activation must be reverted independently (pre-merge live already had workspace shell at 1b.5.9).
3. Optionally `git revert` the merge commit `1a68350d` on `main` with a new commit (no force push).
4. No DB migration / no data migration / no irreversible state for this phase.

## Risk

Low — presentation/consumer Workspace activation + chrome. GeoFeed ownership unchanged.
