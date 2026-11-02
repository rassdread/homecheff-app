# HOMECHEFF_PRODUCTION_STABILITY_AND_PRESS_LAUNCH_V1

**Date:** 2026-11-02  
**Production:** https://homecheff.eu  
**Status:** FAIL for press launch until emergency rollback + RC deploy  
**Production deploy (broken):** `dpl_FuC3j4SesBK2svhwAd8kDv7XpPmj` (Mac prebuilt from `gate-h-delivery-release`, ~14h before investigation)  
**Rollback target (last known-good Linux build):** `dpl_2KbkFaNaAfMg26tbNWnc3whjKNdj` / `homecheff-23tqcx8nq-sergio-s-projects-f7b64ee1.vercel.app` (aliases previously held `homecheff.eu`)

---

## Root causes (confirmed live)

### Feed failure
`GET /api/feed` (uncached Nearby and cache-miss national) returns **HTTP 500 empty body**.

Vercel runtime log:

```
PrismaClientInitializationError:
Prisma Client could not locate the Query Engine for runtime "linux-arm64-openssl-3.0.x".
This happened because Prisma Client was generated for "darwin-arm64",
but the actual deployment required "linux-arm64-openssl-3.0.x".
… searched … /private/tmp/gate-h-delivery-release/node_modules/@prisma/client
```

Homepage GeoFeed treats non-OK as empty → UI shows **“0 resultaten”** for Rotterdam 25 km.

CDN STALE can still serve an older national `take=10` payload, which masked the outage in some probes.

### Profile failure
Same Prisma engine mismatch. `/user/Rass` renders **“This profile could not be loaded”**. Guest bottom-nav Profiel opens the expected guest panel; logged-in `/profile` and public profiles fail because DB routes crash.

---

## RC branch fixes (`fix/press-launch-stability-v1`)

1. `prisma/schema.prisma` — `binaryTargets` for native + Linux openssl 3 engines  
2. Cherry-pick NULL-bio eligibility (`7c524ce8`) onto `origin/main` tip  
3. `/api/feed` top-level try/catch → JSON 500 instead of empty body / process exit  
4. GeoFeed ERROR UI (retry) instead of fake “0 resultaten”  
5. `scripts/assert-prisma-binary-targets.mjs` wired into `smoke-check` + `vercel-build`

**Do not** ship Mac `vercel --prebuilt` after local `prisma generate`. Prefer Vercel Linux CI build.

---

## Emergency recovery (needs explicit approval)

```bash
npx vercel promote dpl_2KbkFaNaAfMg26tbNWnc3whjKNdj --scope sergio-s-projects-f7b64ee1
# or alias:
npx vercel alias set homecheff-23tqcx8nq-sergio-s-projects-f7b64ee1.vercel.app homecheff.eu
npx vercel alias set homecheff-23tqcx8nq-sergio-s-projects-f7b64ee1.vercel.app homecheff.nl
```

Then smoke: `/api/feed?radius=25&scope=nearby&lat=51.92&lng=4.48&take=10`, `/user/Rass`, homepage Nearby.

After recovery, deploy RC from Linux (`git push` + Vercel git build, or `npx vercel --prod` **without** `--prebuilt` from darwin).
