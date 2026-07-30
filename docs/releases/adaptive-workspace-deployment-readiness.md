# Adaptive Workspace — Deployment Readiness

| Field | Value |
| --- | --- |
| Status | `DEPLOYMENT_READY_NOT_EXECUTED` |
| Production target | Vercel production (`npx vercel --prod` / `npm run deploy:quick`) |
| Expected source commit | `be42e9fd73f9dbf09d64dbbb3ccc6eb5e5413170` (AW-R6 production freeze) |
| Expected source branch | `workspace/aw-r6-production-freeze-feed-on` (or `main` only after merge of that freeze) |
| Build command | `NEXT_PUBLIC_FEED_SEALED_BASELINE=1 npm run build` (or repository production build equivalent) |
| Validation command | `npm run validate:adaptive-workspace-production-feed-on` |
| Deployment procedure | Build → push/merge per release owner → `npx vercel --prod` (BCPD) |
| Post-deployment smoke | See `docs/releases/adaptive-workspace-post-deployment-checklist.md` |
| Rollback procedure | Metadata/config rollback toward AW-R5 contract; freeze `ac34031c8e16b70593392c484902d5f007b6f916` |
| Health indicators | Feed mount 1/1/0; no remount; MetaOk; error rate; latency |
| Release-owner actions | Confirm commit SHA on deployment equals AW-R6 freeze before cutover |

## Required environment categories (names only — no values)

- Database / Prisma connection
- Auth / OAuth secrets
- Blob / media storage
- Payment / Stripe (if enabled)
- Public site URL / Vercel project linkage
- Feed sealed-baseline flag for proof environments only

## Distinction

| Statement | Status |
| --- | --- |
| Repository production contract active (AW-R6) | **true** |
| External production deployment completed | **false** |

Do not trigger Vercel or any external production deployment in Release Closure.
