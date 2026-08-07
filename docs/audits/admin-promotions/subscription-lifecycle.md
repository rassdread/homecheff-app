# Subscription Lifecycle (Post-Promotion)

## CONTINUE

1. Promo applies for N billing cycles.
2. Customer sees “Daarna: €X / maand tot je opzegt” before activation.
3. 100%: Stripe trial covering N×30 days, then normal billing (consent at Checkout).
4. Paid %: repeating coupon ends → catalog price continues.
5. No duplicate subscriptions; no silent charge outside Stripe Checkout consent.

## END

1. Promo applies for N cycles.
2. Customer sees “Daarna eindigt het abonnement automatisch”.
3. 100%: free entitlement with `validUntil` / `promoPeriodEndsAt`; no Stripe invoice.
4. Paid %: Stripe `cancel_at` after promo window — no invoice after cancel.
5. Account remains; user may subscribe again manually.

## Authority

Client never chooses action. Subscribe revalidates promo including `postPromotionAction`.
