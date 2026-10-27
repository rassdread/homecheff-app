# V23 Stripe payment certification

Status: STRIPE_TESTED on the local listener and the preview database. Not delivered to the Vercel preview host.

## Scenario

A new buyer and a new pickup listing were created in the preview database. The seller already had a Connect-ready test account. Checkout went through `POST /api/checkout` with a real credential session. The Checkout Session was confirmed with `tok_visa`. Stripe CLI forwarded the signed `checkout.session.completed` event to the local webhook route.

| Field | Value |
|---|---|
| Buyer | 8f161418-7381-4199-9ab8-9220ddfedf0d |
| Listing | a50415b9-4d48-4464-86ff-ebe877f52e78 |
| Session | cs_test_b17GmZKtgnm5C0nHA5LeU3NEUNw7vKucrSPim8f4gw9ofjk3XI1ddkTtQ7 |
| Payment intent | pi_3UVGm5RpYdPVF6LP0l2ZIJpu |
| Charge | ch_3UVGm5RpYdPVF6LP0JrNpRgE |
| Event | evt_1UVGm6RpYdPVF6LPwvhy0jlv |
| Order | 55b35804-316c-442c-9c3b-321e5ae3e70b |
| Transfer | tr_3UVGm5RpYdPVF6LP0GAzUplB |
| Destination | acct_1UTucr2L2fozBQ8p |
| Mode | test, livemode false |

## Results

| Check | Result |
|---|---|
| PAYMENT_SUCCEEDED | YES. Session payment_status paid, amount 1547 |
| ORDER_CREATED | YES. One order, status CONFIRMED, one line of 1500 cents |
| ORDER_CREATED_ONCE | YES. One order row for the session |
| INVENTORY_DECREMENTED_ONCE | YES. Stock moved from 5 to 4 |
| SELLER_TRANSFER_RECONCILED | YES. Payout 1320 cents, providerRef is the transfer above |
| PLATFORM_FEE_RECONCILED | YES. 1500 item, 1320 seller, 180 retained. Buyer total 1547 includes the existing 47 cent surcharge |
| DUPLICATE_FULFILLMENT | NO |
| DUPLICATE_TRANSFER | NO |
| DUPLICATE_COMMISSION | NO. No affiliate attribution, so no new commission ledger row |

The historical V19 events were not replayed.
