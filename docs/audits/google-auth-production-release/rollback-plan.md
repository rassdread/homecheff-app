# Rollback plan

| Item | Value |
|------|--------|
| Pre-merge origin/main | `30e88af2c01928822740b3f9a1deddd1e1681b99` |
| Previous Production deployment | `dpl_7Lh7iTj8ZFo9fmRCAxcyxL8RZj5J` |
| Current merge | `5b1865411d4bb22784a9c1ae5d500c0b65575efc` |
| Current Production deployment | `dpl_zRG9nbxeYafiuk5nYHdncD6jZPGr` |
| Previous Android build | unchanged (no new build shipped) |
| DB migration | none |
| Data migration | none |
| Risk | low code rollback |

## Git

```bash
git checkout main
git revert -m 1 5b1865411d4bb22784a9c1ae5d500c0b65575efc
# or redeploy previous known-good commit / Vercel rollback to dpl_7Lh7iTj8ZFo9fmRCAxcyxL8RZj5J
```

## Vercel

Promote/rollback to `dpl_7Lh7iTj8ZFo9fmRCAxcyxL8RZj5J` (or redeploy `30e88af2…`).

## Env

Do **not** remove `NEXT_PUBLIC_GOOGLE_NATIVE_CLIENT_ID` during a normal code rollback unless specifically required.

## Android

Keep prior internal APK; do not publish unproven new builds.
