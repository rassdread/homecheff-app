# HomeCheff V22 production release readiness

PRODUCTION_RELEASE_READY = NO

FINAL_STATUS = BLOCKED_WITH_EXACT_REMAINING_ACTIONS

Production was not deployed and `main` was not merged.

## Gates

| Gate | Result |
| --- | --- |
| Real Stripe refund | NOT RUN. Preview webhook secret is unreadable and the preview is behind Vercel Authentication. |
| Stock restoration on a fresh payment | NOT RUN |
| Seller transfer recovery on a fresh transfer | NOT RUN |
| Seven preview database tests | PASS |
| Legacy admin routes | API handlers call the capability map. Not proven with signed-in HTTP calls. |
| Scoped subadmin permissions | Policy tests pass. No scoped user was created in the preview database. |
| Signed-in Admin Center | NOT COMPLETE. Preview has 0 administrators and the deployment requires Vercel Authentication. |
| Admin metrics reconciled to the screen | NOT_OBSERVED. Database counts are recorded separately. |
| Promotion limit editing in the admin UI | NOT COMPLETE in a browser. Unit tests pass. |
| Subscription promo field | Present in the sell page. Not exercised in a browser or in Stripe. |
| 100% promotion and zero-cost activation | Code exists. Not executed. |
| Private-to-business entry | Links added on registration and seller settings. Not clicked through. |
| Business badge | Paid plans no longer say Verified. Not checked in a browser. |
| TypeScript | Ratchet passed: 699 current, 767 baseline, 0 new. |
| Local production build | Same 4096 MB heap failure mode as V21 if `next build` is run locally. Isolated Vercel preview is the build certificate when it matches this commit. |
| Production unchanged | Required |
| Public Delivery | `HOMECHEFF_DELIVERY_ENABLED` is not set. Gate F was not run. |

## Five older test failures

These failed in the V21 broader run and were not introduced by the V22 diff. They were not re-run as a full suite in this pass. Classification from the assertions and the current source:

| Failure | Classification |
| --- | --- |
| Delivery signup layout expects classes the page no longer has | PRE_EXISTING source-contract drift |
| Email verification test expects `claimed.count > 0` in a file that no longer contains that expression | PRE_EXISTING source-contract drift |
| i18n test expects `CACHE_VERSION` `2.62`; the hook is `2.64` | PRE_EXISTING stale assertion. The higher version is the stricter cache. |
| Seller stats test expects an inline status filter; the filter lives in `sellerCommercialOrderWhere` | PRE_EXISTING assertion aimed at the wrong file. The exclusion of CANCELLED and REFUNDED is present in the helper. |
| SEO test expects a homepage ecosystem attribute that is not in `HomeHeroSection.tsx` | PRE_EXISTING source-contract drift |

None of those product files were edited for V22.
