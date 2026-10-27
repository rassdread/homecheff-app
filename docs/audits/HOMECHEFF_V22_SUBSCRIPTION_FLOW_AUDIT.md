# HomeCheff V22 subscription flow audit

## What already existed

Business plans are Basic, Pro, and Premium in `lib/business/visibility-profile.ts`. Prices in that file are 3900, 9900, and 19900 cents. This change does not alter prices, fees, or benefits.

`components/sell/SellPageClient.tsx` is the subscription screen. It already has a promo field labeled "Heb je een promocode?", a Toepassen action, and plan cards that show the server quote. The label was left in place because a source test looks for that string.

`lib/promo-codes/activate-free-subscription.ts` activates a zero-cost entitlement without creating a fake card charge. It updates the existing seller profile and the existing `BusinessSubscription` row for that user.

Registration stays a private account form. A link was added under the register button: "Wil je HomeCheff zakelijk gebruiken?" It goes to `/sell` and does not add a step. Seller settings now link to "Bekijk zakelijke abonnementen".

## What was not executed

No Stripe subscription checkout, webhook, cancellation, renewal, or 100% promo redemption was run in this pass. Those items stay NOT_VERIFIED. The existing promo and free-activation code was inspected, not replayed against Stripe.
