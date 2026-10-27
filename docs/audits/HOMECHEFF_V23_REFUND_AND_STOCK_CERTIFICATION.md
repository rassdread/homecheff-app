# V23 refund and stock certification

Status: STRIPE_TESTED for one unfulfilled full refund and one webhook replay. The other refund shapes remain UNIT_TESTED.

## Full refund before fulfillment

`POST /api/admin/refunds/execute` was called by synthetic superadmin a30b5404-f002-44a3-94c3-b87df468c359 with the existing confirm flags. The Stripe client was the test key.

| Check | Result |
|---|---|
| REFUND_SUCCEEDED | YES. re_3UVGm5RpYdPVF6LP0wSFLLWo, 1547 cents |
| REFUND_RECORDED_ONCE | Stripe has one refund. The settlement table also has one zero-cent FULL_BUYER_GROSS row from the duplicate call |
| ORDER_STATE_RECONCILED | YES. Order status REFUNDED, shippedAt and deliveredAt null |
| INVENTORY_RESTORED_ONCE | YES. Stock returned from 4 to 5. One INVENTORY_RESTORE row, hc_inventory_restore_55b35804-316c-442c-9c3b-321e5ae3e70b |
| NO_DUPLICATE_STOCK_RESTORATION | YES after redelivery of evt_3UVGm5RpYdPVF6LP0T24KGXD. Stock stayed 5 |
| NO_DUPLICATE_REFUND | YES for Stripe money. The second execute returned HTTP 200 COMPLETED and wrote a local row with buyerRefundCents 0 and no stripeRefundId |
| NO_INCORRECT_SELLER_TRANSFER | YES. Transfer tr_3UVGm5RpYdPVF6LP0GAzUplB amount 1320, amount_reversed 1320, livemode false |

Seller reversal was 1320. Platform economic impact recorded by the settlement was 227, which is the retained 180 plus the 47 cent buyer surcharge.

## Other cases

Partial refund, duplicate-payment refund, already fulfilled, already refunded, concurrent processing, and a listing deactivated after checkout are covered by the existing refund-stock and checkout unit tests. They were not repeated as new Stripe charges in this pass. Those tests passed.
