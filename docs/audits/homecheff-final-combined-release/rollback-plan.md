# Rollback Plan

## Immediate web rollback

```bash
# Re-deploy previous Production SHA
git checkout 23043a7d84727e1a512af14e5e6bedad75646df4
# from a worktree linked to homecheff-app:
npx vercel --prod --yes
```

Or Vercel dashboard → promote prior Ready deployment `dpl_RbmTaMyNVWfDAR6ynSWeE7GsKc3N`.

## Git rollback (if needed)

```bash
git revert -m 1 7a3b24c5d1dd6f4e149c17f68e0725f76439bee2
git push origin main
```

(`-m 1` keeps first parent = pre-release main.)

## Partial

| Issue | Action |
|-------|--------|
| Logo only | Restore previous public icon bytes + bump `CANONICAL_LOGO_VERSION` |
| Founder pages only | Remove `app/sergio-arrias` etc. and sitemap entries |
| Android | Do not ship new AAB; keep store binary |

No database migration in this release.
