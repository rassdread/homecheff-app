# Phase 3F — Cache Security

**Branch:** `performance/phase3f-anonymous-cache`

## Checks

| Risk | Mitigation |
|------|------------|
| userId in public cache | Origin path only when `userId === null` |
| Cross-user CDN leak | Tier C/D no CDN; Tier A no Cookie Vary |
| Cache poisoning via lat/lng | Coords excluded from origin key |
| Unknown query params | Classifier ignores unknown; perfBust/_bust → Tier D |
| Error responses cached | Builder throws; no empty/error payload |
| Private listings | Existing visibility filters unchanged |
| Set-Cookie on cached response | Route does not set session cookies |

## Validator

`npx tsx scripts/validate-feed-cache-security-phase3f.ts`
