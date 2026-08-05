# Validation

- `npx tsx scripts/production-cleanup-phase1.ts --apply --head-check` → 0 flagged artifacts
- `curl https://homecheff.eu/` → 200
- `curl https://homecheff.eu/api/feed?limit=20` → 200, 10 real items
- Feed media proxy → 200
- Blob sample → 200
- `npm run smoke-check` / `npm run build` (see commit notes)
