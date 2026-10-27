# HomeCheff V22 promotion checkout certification

## Checkout field

BROWSER_TEST: NOT COMPLETE

The sell page already shows the promo field before payment, with a 44px touch target. A valid code tells the customer that the original price, discount, duration, and current price are shown on the plan cards and come from the server. An invalid code uses the existing error text. This was confirmed by reading `components/sell/SellPageClient.tsx`, not by a signed-in browser session.

## 100% and usage limits

MOCKED_TEST / unit tests: the V20 promo limit tests passed again (5). They cover unlimited to 10, raising and lowering a finite limit, returning to unlimited, and refusing a limit below uses.

REAL_STRIPE_TEST: NOT RUN. No 100% code was redeemed and no zero-cost subscription was created in this pass.

`activateFreeSubscriptionEntitlement` is the code path for a full discount. It does not invent a card charge. It was not called against the preview database in this run.
