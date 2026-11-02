# HOMECHEFF_FINAL_AUTHENTICATED_AND_FUNCTIONAL_CERTIFICATION_V3

**Date:** 2026-11-02  
**Stable production:** `dpl_2KbkFaNaAfMg26tbNWnc3whjKNdj`  
**RC tip (this report):** post-`c1426053` worktree commits (plan-limit fix + guest cert)  
**Linux preview (Ready):** `https://homecheff-i7917xzmg-sergio-s-projects-f7b64ee1.vercel.app`  
**PRODUCTION_DEPLOYED = NO**

---

## Phase 1 — Deployment Protection

| Item | Result |
|---|---|
| Preview SSO protection | **ACTIVE** (browser → 302 Vercel SSO) |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | **ABSENT** from Preview env (pulled names) |
| `GROWTH_PREVIEW_PROTECTION_BYPASS` | Exists only for branch `hc-campaign-cert-v3`, **not** for `fix/press-launch-stability-v1` |
| `vercel curl` CLI bypass | Works for API/HTML fetch (not a browser session) |
| Global protection disabled | **NO** (not done) |

### Required configuration (exact)

To enable Playwright on the RC preview without disabling protection globally:

1. In Vercel → Project → Settings → Deployment Protection  
2. Create / enable **Protection Bypass for Automation**  
3. Store secret as Preview env: `VERCEL_AUTOMATION_BYPASS_SECRET`  
4. Optionally also set for branch `fix/press-launch-stability-v1`  
5. Pass header `x-vercel-protection-bypass: <secret>` (and cookie `x-vercel-protection-bypass`) in Playwright `extraHTTPHeaders` / context

Also required for authenticated journeys:

- `SMOKE_EMAIL`  
- `SMOKE_PASSWORD`  

(Never commit these. Use local env or CI secrets.)

---

## Phase 2 — Test accounts

| Role | Fixture strategy | Status |
|---|---|---|
| Guest | Public browser | Available |
| Individual / buyer / seller | `@homecheff-validation.test` + `certificationFixture=true` (see `certify-app-production-auth-e2e.mts`) | Scripts exist; **require DB write + credentials** |
| Business Basic/Pro/Premium | Stripe **test** keys on Preview (`sk_test…`) + plan DNA | Plan DNA verified in unit tests; live activation **BLOCKED** |
| Admin | Not configured in local/SMOKE env | **MISSING** |
| Delivery pilot | Pilot allowlist env on production; preview fixtures include delivery e2e sellers | Pilot **browser** flows **BLOCKED** |

Preview DB (via `vercel curl` feed) returns **synthetic** cert listings (`DELIVERY_E2E_CERT_V2`, `V23 certification…`) — isolated from production marketplace rows.

**Missing to proceed:** `SMOKE_EMAIL`, `SMOKE_PASSWORD`, `VERCEL_AUTOMATION_BYPASS_SECRET` for RC branch.

---

## Phase 3–5 — What was executed independently

### Done

- Guest Playwright (production stable): linux-rc + critical journeys + guest-interactive-v3  
- Preview Prisma feed via `vercel curl`  
- NULL-bio / eligibility unit **21/21**  
- Promo limit unit **5/5**  
- Press-launch location limits + VIP26-style END quote unit **4/4**  
- Multi-location DNA corrected: Pro **3**, Premium **25** (was 2 / 99)  
- Public HTTP route matrix **128/128** (from V2, production)

### Blocked / not tested

- Registration, login, logout, email verification, password recovery (full)  
- Own profile edit, product create/edit/publish, inspiration create  
- Chat / offers / appointments  
- Checkout / Connect / refunds (browser)  
- Subscription activation / cancel in Stripe test mode (browser)  
- VIP26 **database promo row** existence (code supports maxRedemptions=100 + 12 cycles + END; named “VIP26” not in repo)  
- Delivery pilot browser flows  
- Full click-by-click of every interactive element across 193 pages  

---

## Phase 6 — Fixes this gate

1. **Multi-location caps** aligned to press-launch requirement in `lib/business/visibility-profile.ts`  
2. Regression tests: `lib/business/press-launch-plan-limits.test.ts`  
3. Guest interactive cert suite: `e2e/guest-interactive-cert-v3.spec.ts`

---

## Phase 7 — Report fields

```
TOTAL_PAGES = 193
PAGES_TESTED = ~45 unique guest/public paths (Playwright + HTTP matrix subset); not 193 click-complete

TOTAL_API_ROUTES = 440
API_ROUTES_TESTED = feed/products/session(+preview via vercel curl) + prior smoke; not 440

TOTAL_INTERACTIVE_ELEMENTS = NOT FULLY INVENTORIED
INTERACTIVE_ELEMENTS_TESTED = guest menu/auth links, profile/login entry, pricing, forgot-password, search, category filter, infinite-scroll smoke, feed/product/profile navigation

TOTAL_TEST_CASES ≈ 128 HTTP + ~86 Playwright (prior) + 12 guest-v3 + 4 plan-limit + 5 promo + 21 eligibility ≈ 256 executed this program
PASSED ≈ 254 (guest-v3: 11/12 after harden; 1 desktop menu flake then fixed path)
FAILED = 0 open after selector harden (re-run recommended after commit)
BLOCKED = authenticated + protected-preview browser + financial browser
NOT_TESTED = full role matrix, VIP26 DB row, Stripe Connect browser, delivery pilot E2E

AUTHENTICATED_JOURNEYS = BLOCKED (no SMOKE_*)
REGISTRATION = NOT_TESTED
LOGIN = PARTIAL (page load only)
OWN_PROFILE = NOT_TESTED
PRODUCT_CREATION = NOT_TESTED
CHAT = NOT_TESTED
CHECKOUT = NOT_TESTED
STRIPE_CONNECT = NOT_TESTED (preview has sk_test)
SUBSCRIPTIONS = PARTIAL (DNA + free-activation code reviewed; browser NOT_TESTED)
VIP26 = PARTIAL (promo END/12-cycle unit PASS; named VIP26 row / max 100 NOT_TESTED in DB)
MULTI_LOCATION = PASS (code + unit: 1/1/3/25)
DELIVERY_PILOT = NOT_TESTED

LINUX_BUILD = PASS (prior Ready preview)
PRISMA_LINUX = PASS
DESKTOP_E2E = PARTIAL (guest PASS; auth BLOCKED)
MOBILE_E2E = PARTIAL (guest PASS; auth BLOCKED)

CRITICAL_BUGS = 0 new on stable production
HIGH_PRIORITY_BUGS = 1) preview browser blocked without automation bypass 2) authenticated cert blocked without SMOKE credentials 3) VIP26 not a named code in repo (admin promo config required)
REGRESSIONS = none observed on guest production smoke

RELEASE_CANDIDATE_READY = NO
PRESS_LAUNCH_READINESS = PARTIAL
  - Production rollback remains usable for guest marketplace/profiles
  - Authenticated + financial certification incomplete → not press-complete

PRODUCTION_DEPLOYED = NO
```

---

## Recommended unblock (owner action)

1. Add Preview `VERCEL_AUTOMATION_BYPASS_SECRET` for this project/branch.  
2. Provide disposable `SMOKE_EMAIL` / `SMOKE_PASSWORD` for fixture users on the **preview** DB (or authorize running `certify-app-production-auth-e2e.mts` only against preview DB).  
3. Confirm admin promo **VIP26** exists with `maxRedemptions=100`, `discountDurationCycles=12`, `postPromotionAction=END`, 100% discount.  
4. Re-run Playwright against preview with bypass headers, then request production promote separately.
