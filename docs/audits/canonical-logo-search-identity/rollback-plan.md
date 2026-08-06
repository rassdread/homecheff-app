# Rollback Plan

## Quick rollback (revert commits)

```bash
git revert <commit-a-hash> <commit-b-hash>
git push origin feature/canonical-logo-identity
```

Or reset branch to pre-change main and redeploy.

## Partial rollback options

| Scenario | Action |
|----------|--------|
| UI only wrong | Restore previous `public/icon-192.png` bytes; bump SSOT version |
| Google logo rejected | Restore previous `public/logo.png`; keep UI on new art temporarily |
| OG previews wrong | Point `ogBrand` back to `icon-192` in layout metadata |
| Android store issue | Revert `android/res/mipmap-*` from git history; rebuild AAB |

## Regenerate previous assets

If previous PNG bytes were committed, checkout from parent commit:

```bash
git checkout HEAD~2 -- public/logo.png public/icon-192.png public/favicon.ico
npm run generate-canonical-logo-assets  # only after restoring primary source
```

## Cache bust on rollback

Increment `CANONICAL_LOGO_VERSION` in `lib/brand/canonical-logo.ts` (e.g. `hc9-revert`) so Safari/CDN pick up restored favicon.

## No database migration

Rollback is asset + frontend only — no schema changes.
