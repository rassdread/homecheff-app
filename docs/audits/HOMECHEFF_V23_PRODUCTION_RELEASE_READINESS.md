# V23 production release readiness

FINAL_STATUS = BLOCKED_WITH_EXACT_REMAINING_ACTIONS

Production was not deployed and was not written. Public Delivery on homecheff.eu remains disabled. Gate F was not executed.

## What passed

- Unknown admin routes resolve to DENY. Existing admin route files are explicitly mapped. Superadmin remains the only role allowed through that decision.
- Seven preview-database checkout integration tests passed.
- A real test-mode Checkout payment, one order, one stock decrement, and one 1320 cent seller transfer were recorded.
- A full refund before fulfillment reversed that transfer, restored stock once, and stayed idempotent when the refund event was delivered again.
- Marketplace, growth, read-only, suspended, anonymous, and normal-user HTTP checks returned the expected 200, 401, or 403.
- TypeScript ratchet: 699 current, 767 baseline, 0 new, 68 resolved. The baseline was not shrunk.
- The five previously failing source tests were rerun and now pass. The assertions were updated only where the implementation had already moved: cache version at or above 2.62, seller exclusions in the commercial-metrics helper, welcome mail after `claimed > 0`, cookie-offset signup layout, and the homepage signal split between the hero and the page client.

## What is still required

1. Re-authenticate the Vercel CLI. The stored token returns HTTP 403, so this commit has no isolated preview yet.
2. Run `node scripts/vercel-build.js` at the existing heap, or accept the isolated Vercel build of this exact commit after the token works. Do not raise the heap.
3. Execute one controlled failed seller transfer, confirm Stripe has no matching transfer, then recover it once and show the second recovery is blocked.
4. Render the Admin Center, registration, sell page, and private versus business profiles in a browser. The local dev client currently crashes on `/register` and `/sell` before those screens appear.
5. Run the subscription cases, including a 100 percent promotion for 12 months and a zero-cost activation, in Stripe test mode.
6. Reconcile the rendered dashboard numbers with fresh database queries after those writes.

Do not start another development phase for these items. The payment and refund path already works locally. The missing pieces are the Vercel login, the failed-transfer recovery, and pages that actually render.
