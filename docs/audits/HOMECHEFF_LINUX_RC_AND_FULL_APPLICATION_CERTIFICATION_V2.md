# HOMECHEFF_LINUX_RC_AND_FULL_APPLICATION_CERTIFICATION_V2

**Date:** 2026-11-02  
**Production (unchanged):** `dpl_2KbkFaNaAfMg26tbNWnc3whjKNdj` @ https://homecheff.eu  
**RC tip:** `6fdef39c` (includes `a28afde1` + build/cert hardening)  
**Linux preview:** `https://homecheff-i7917xzmg-sergio-s-projects-f7b64ee1.vercel.app` (`dpl` Ready, 6m Linux build)  
**PRODUCTION_DEPLOYED = NO**

---

## Phase 1 — Linux RC

| Check | Result |
|---|---|
| Git source build (no Mac `--prebuilt`) | PASS |
| First preview `a28afde1` | FAIL OOM @ 4096 MB heap (cold) |
| Follow-up `6fdef39c` heap 7168 | PASS Ready in 6m |
| `assert-prisma-binary-targets` | PASS in build log |
| `assert-prisma-runtime-engines` | PASS — Linux engines present |
| Prisma Query Engine on preview | PASS (`vercel curl` `/api/feed` nearby+national JSON) |
| Preview DB isolation | PASS — synthetic cert fixtures only (not prod Krentenbol set) |
| Stripe live keys on preview | Guarded by existing `stripe-runtime-guard` (8/8 unit PASS) |

---

## Phase 2 — Inventory

| Metric | Count |
|---|---|
| `app/**/page.tsx` routes | **193** |
| `app/api/**/route.ts` | **440** |
| Public static HTTP probes (prod) | **128** |

Inventory: `docs/audits/HOMECHEFF_LINUX_RC_ROUTE_INVENTORY_V2.md`  
Matrix JSON: `docs/audits/HOMECHEFF_LINUX_RC_ROUTE_MATRIX_V2.json`

**Not claimed:** exhaustive per-button/per-modal interaction inventory across all roles. That remains incomplete.

---

## Phase 3–4 — Browser / journeys

### Stable production (rollback deploy) — Playwright

| Project | Passed | Skipped | Failed |
|---|---|---|---|
| mobile | 37 | 3 | 0 |
| desktop | 37 | 3 | 0 |

Skipped = authenticated tests (`SMOKE_EMAIL` / `SMOKE_PASSWORD` unset).

Covered without credentials: home, login/register pages, feed API, Krentenbol search, public profile from feed, product detail, homepage feed results, category filter, dorpsplein, inspiratie, pricing/contact/faq/privacy/terms, delivery start gate, checkout/messages/profile gates, seller/affiliate dashboard gates, listing public smoke.

### Linux preview — browser

**BLOCKED** by Vercel Deployment Protection (SSO). API certified via `vercel curl` (Protection bypass for CLI only).

### Authenticated / financial journeys

| Journey | Status |
|---|---|
| Registration / login / logout / email verify / password recovery (full) | NOT_TESTED (no test credentials / no mailbox) |
| Profile edit / photo upload | NOT_TESTED (auth) |
| Product/inspiration create-edit | NOT_TESTED (auth) |
| Chat / offers / appointments | NOT_TESTED (auth) |
| Checkout / Stripe Connect live | NOT_TESTED (explicitly forbidden) |
| Subscriptions / VIP26 | NOT_TESTED (auth + no charge) |
| Multi-location | NOT_TESTED |
| Delivery pilot | NOT_TESTED (restricted; public Delivery remains off) |

---

## Phase 5 — Regression protection

| Fix | Status |
|---|---|
| NULL-bio listings unit tests | **21/21 PASS** |
| Krentenbol on production feed | PASS |
| Marketplace feed / profiles after rollback | PASS |
| Linux Prisma engines on RC preview | PASS |
| Feed ERROR UX + JSON 500 | In RC (`a28afde1`); not yet on production tip |
| Infinite scroll / inspiration templates / Connect / checkout deep | NOT_TESTED this gate |

---

## Phase 6 — Deployment safety

| Safeguard | Location |
|---|---|
| Schema `binaryTargets` Linux engines | `prisma/schema.prisma` |
| Assert targets in smoke + vercel-build | `assert-prisma-binary-targets.mjs` |
| Assert generated engine files post-`prisma generate` | `assert-prisma-runtime-engines.mjs` |
| Refuse `vercel --prebuilt` on darwin | `vercel-safe-deploy.mjs` |
| `deploy` / `deploy:quick` / `deploy:preview` use safe wrapper | `package.json` |
| Cold-build heap default 7168 | `scripts/vercel-build.js` |

Root cause of outage: Mac `vercel --prebuilt` from `gate-h-delivery-release` with darwin-only Prisma Client.

---

## Phase 7 — Counts (evidence-based)

```
TOTAL_ROUTES = 193 (pages) + 440 (API) = 633 inventoried
ROUTES_TESTED = 128 HTTP public static on production PASS
              + preview API feed/products via vercel curl PASS
              + ~30 Playwright page journeys × 2 viewports
TOTAL_INTERACTIONS = NOT FULLY INVENTORIED (honest gap)
INTERACTIONS_TESTED = homepage filter click + feed hydrate + profile/product navigation (Playwright)
TOTAL_TEST_CASES ≈ 128 HTTP + 74 Playwright (37×2) + 21 eligibility + 8 stripe-guard + 3 preview API ≈ 234
PASSED ≈ 234 (of executed)
FAILED = 0 (of executed after Playwright browser install)
BLOCKED = preview browser E2E (Deployment Protection); authenticated/financial suites
NOT_TESTED = full role matrix, every interactive element, payments, VIP26 activation, multi-location, delivery pilot E2E

CRITICAL_BUGS = 0 open on stable production after rollback
HIGH_PRIORITY_BUGS = preview SSO blocks public RC browser cert; cold OOM required heap bump
BUGS_FIXED = Mac-prebuilt class (safeguards); feed empty-500 UX in RC; NULL-bio on RC
REGRESSIONS_FOUND = none on stable production smoke

LINUX_BUILD = PASS (6fdef39c preview Ready)
PRISMA_LINUX = PASS (build assert + preview feed)
BROWSER_E2E = PASS on production stable; BLOCKED on preview UI
MOBILE_E2E = PASS (37/37 non-auth)
AUTHENTICATED_JOURNEYS = NOT_TESTED
CHECKOUT_TESTS = NOT_TESTED
SUBSCRIPTION_TESTS = NOT_TESTED

RELEASE_CANDIDATE_READY = PARTIAL
PRESS_LAUNCH_READINESS = PARTIAL
  - Production stable for guest marketplace + public profiles (rollback)
  - RC Linux-buildable with Prisma engines; not production-promoted
  - Full click-by-click / authenticated certification incomplete

PRODUCTION_DEPLOYED = NO
```

---

## Recommended next actions (need separate approvals)

1. Provide `SMOKE_EMAIL` / `SMOKE_PASSWORD` (and optional bypass secret) for authenticated RC cert on preview.  
2. Optionally disable Deployment Protection on the RC preview alias for Playwright.  
3. Complete authenticated + safe test-mode checkout/subscription cert.  
4. Only then request production promote of `6fdef39c` (or a later tip) — **never** Mac `--prebuilt`.
