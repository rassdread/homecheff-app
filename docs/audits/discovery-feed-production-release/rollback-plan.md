# Rollback Plan

## Git

```bash
git revert -m 1 30a15a99e58467edee3f8f540bad85d6c1783306
# or redeploy commit 02e37a6d9ad61d4a736fb66066635f833ce85125
```

## Vercel

Promote previous Ready deployment: `dpl_7pCf1YTxR1sVfVWexGtnQs2rKcXm`

## Data

- DB migration: **none**
- Data migration: **none**
- Risk: **low** (client feed filter/startup only)
