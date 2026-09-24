# Production regression gate

A certification attached to an older SHA is `FEATURE_CERTIFIED_AT_SHA`.
It is not evidence that the feature is `CURRENTLY_HEALTHY_ON_PRODUCTION`.

Re-test the journey against the deployment that is actually aliased to homecheff.eu.
HTTP 200 is not a pass. The profile crash (15 Sep 2026) and the reservations crash
(17 Sep 2026) both returned 200 and then rendered `app/error.tsx`.

## Why `next build` did not stop the profile crash

`next.config.mjs` sets `typescript.ignoreBuildErrors: true` (commit `94969ae2`, 10 Feb 2026)
and `eslint.ignoreDuringBuilds: true` (commit `a8c183363`, 28 Aug 2025).

Next compiles with SWC, which does not typecheck. An unbound identifier such as
`useUserBootstrap()` or `useState()` becomes a runtime `ReferenceError`.
The build exits 0. There is no `npm test` script. At that time GitHub Actions
deploy only ran a bare `next build`. `scripts/smoke-check.mjs` checks that route files
exist; it does not open a browser.

`tsconfig.json` has `strict: false` and `noImplicitAny: false`. Those settings do
not suppress `TS2304` Cannot find name. `tsc` would have reported the missing import.
Nothing in the deploy path ran `tsc`.

`package.json` `prebuild` appends `|| true` to `prisma generate`. Vercel does not
use that script. Production builds run `scripts/vercel-build.js`.

## One production build

`npm run build` and Vercel both run `scripts/vercel-build.js`.
GitHub Actions "Deploy to Vercel" runs `npm run build`, so it cannot skip the gate.
`node scripts/vercel-build.js` is the same script Vercel calls directly, so the
Vercel image does not also run the local `prebuild` hook.

`/feed` is not a page and nothing in the app links to it. Discovery is `/` and
`/?chip=sale` (`/dorpsplein` redirects there). A 404 on `/feed` is a legacy
expectation, not a broken route.

App resume restores the last route only inside the native shell. A normal
browser visit to `https://homecheff.eu/` stays on the homepage.

## What blocks a deploy now

`scripts/vercel-build.js` runs, before `next build`:

1. `scripts/check-unbound-hooks.mjs` — zero tolerance for a hook call with no import.
2. `scripts/typecheck-ratchet.mjs` — `tsc` must finish. Any error not listed in
   `scripts/typecheck-baseline.txt` fails the build. Any `TS2304` fails even if
   someone adds it to the baseline. Absolute paths inside error messages are
   stripped before comparison, so the same error matches on a laptop and on Vercel.

`ignoreBuildErrors` stays on until the baseline is empty. Turning it off today
would reject the deploy for the existing type debt, not only for new crashes.
The ratchet is the block for new errors. Shrink `scripts/typecheck-baseline.txt`
when an old error is fixed; do not add lines to make a new error pass.

`npm run smoke-check` also runs the unbound-hook check.

## Critical browser smoke

`npm run smoke:journeys` runs `e2e/critical-journeys.spec.ts` against
`SMOKE_BASE_URL` (default `https://homecheff.eu`). It fails on `pageerror`,
the generic Dutch error heading, and console errors that look like exceptions.
`npm run smoke:journeys` may skip authenticated steps when `SMOKE_EMAIL` and
`SMOKE_PASSWORD` are absent. `npm run smoke:release` sets `SMOKE_RELEASE=1` and
fails if those credentials are missing. A release run must not pass while
signed-in checks were skipped.

The suite is not part of the Vercel build: the build image has no browser, and
the deploy would otherwise certify the previous production.
