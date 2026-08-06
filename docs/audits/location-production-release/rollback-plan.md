# Rollback Plan

## Git

```bash
git revert -m 1 ae8cbb045826667ecb9c40d9d55f8a99a123a5b9
# or reset/deploy prior SHA b3309f19145676aff5ae496d9e6af6c1808cdd7c
```

## Vercel

Promote prior Ready deployment:

- Rollback deploy ID: `dpl_8hJpXL2yH1885VvDcZrKmAHr8BMs`
- Or redeploy commit `b3309f19`

## Android

Reinstall previous APK / Play build without `adjustResize` only if native regression; web remote URL apps pick up web rollback automatically when pointing at production.
