# HomeCheff Proposal Flow — Live E2E Certification Report

**Date:** 2026-09-04  
**Environment:** Production `https://homecheff.eu`  
**LOCAL UX baseline commit:** `a58addd4`  
**PRODUCTION commit tested:** `59846667` (a58addd4 + server Idempotency-Key dedupe)  
**Deployment:** `dpl_HB9vXvLoVzbjWQbtPjenAvvDrbNS`  
**Accounts:** disposable PropCert buyer/seller (`*@homecheff-validation.test`) — cleaned after run  
**Device context:** Playwright iPhone 13 / landscape viewport + desktop; **no physical device / PWA install attached**

---

## Verdict

**HOMECHEFF_PROPOSAL_FLOW_NOT_PRODUCTION_READY**

Buyer→seller API lifecycle and Playwright mobile-emulation/desktop UI proofs **PASS**.  
Physical mobile portrait/landscape and installed PWA remain **NOT TESTABLE** in this environment, which blocks CERTIFIED under the release gate.

---

## Matrix

| Gate | Result | Evidence |
|------|--------|----------|
| TESTED_COMMIT | `59846667` | GitHub + Vercel Production |
| PRODUCTION_COMMIT | `59846667` | Deployment status success |
| DEPLOYMENT_ID | `dpl_HB9vXvLoVzbjWQbtPjenAvvDrbNS` | Vercel |
| ENVIRONMENT | Production | homecheff.eu |
| MOBILE_PORTRAIT | NOT_TESTABLE | No physical device; iPhone 13 emulation only (sticky CTA visible in emulation) |
| MOBILE_LANDSCAPE | NOT_TESTABLE | Emulation only |
| APP_PWA | NOT_TESTABLE | No installed/PWA session |
| DESKTOP_SMOKE | PASS | Sheet + locked title + submit |
| BUYER_CREATE | PASS | API + conversation start |
| MOBILE_KEYBOARD | NOT_TESTABLE | No real device keyboard |
| STICKY_SUBMIT | PASS | `[data-hc-proposal-submit]` visible in mobile emulation |
| EXPLICIT_SUBMIT_ONLY | PASS | Enter in amount did not create proposals |
| DOUBLE_SUBMIT | PASS | Parallel POSTs same Idempotency-Key → one proposal id; replay `200` |
| CHAT_PROPOSAL_CARD | PASS | Voorstel headings in chat UI |
| VIEW_PROPOSAL | PASS | In-chat proposal card is the proposal detail |
| VIEW_ITEM | PASS | `Bekijk item` → `/product/{id}` |
| SELLER_VIEW | PASS | Seller lists same PENDING proposal |
| SELLER_ACCEPT | PASS | ACCEPTED + CommunityOrder |
| SELLER_REJECT | PASS | REJECTED persists; re-accept blocked |
| COUNTERPROPOSAL | PASS | Parent COUNTERED, child PENDING €13 |
| BUYER_WITHDRAW | PASS | Creator cancel; seller cancel 403 |
| SNAPSHOT_INTEGRITY | PASS | listingTitle/price survive listing edit |
| STALE_STATE | PASS | Clear Dutch/allergen or status response (no raw stack) |
| AUTHORIZATION | PASS | Own-accept 403; seller cancel 403 |
| PAYMENT_PATH | PASS | HC blocked with `paymentsRequired` for disposable seller (expected) |
| DIRECT_CASH_PATH | PASS | DIRECT_CONTACT accept → community order |
| BARTER_PATH | PASS | VALUE_ONLY create |
| PERSISTENCE_CHECK | PASS | GET after accept/reject/counter/cancel |
| TEST_DATA_CLEANUP | PASS | Listing deactivated; users scrubbed |
| LIVE_E2E_BUYER_TO_SELLER | PASS | Full API negotiation chain |

## Remaining blockers

1. Physical/app mobile portrait not proven (no device attached)  
2. Physical mobile landscape not proven  
3. Installed/PWA path not tested  

## Artifacts

- `docs/audits/proposal-flow-live-e2e/LIVE-E2E-REPORT.json`  
- `docs/audits/proposal-flow-live-e2e/LIVE-E2E-REPORT.md`  
- `docs/audits/proposal-flow-live-e2e/shots/*.png`  
- Runner: `scripts/live-proposal-flow-e2e-cert.mts`
