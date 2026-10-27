# HomeCheff V20 financial recovery

## Stock

The refund engine used to say inventory was not restored. V19 showed the gap: a listing was deactivated after a Checkout Session existed, payment still created one order and consumed stock, settlement failed, the charge was refunded, and stock stayed down.

The rule now is:

- A full refund of an order that is not shipped, picked up, or delivered restores that order's item quantities once.
- A duplicate-payment refund does not restore stock. That stock belongs to the fulfilled order.
- A partial refund does not restore stock.
- A shipped, picked-up, or delivered order does not get stock back because a refund exists.
- `Order.inventoryRestoredAt` is set in the same transaction as the increment. A second webhook or a concurrent refund sees the marker and does not increment again.

The marker is a nullable column. Existing rows stay null until a qualifying refund. Production was not migrated.

## Seller transfer

`transfers.create` uses `hc_seller_xfer_{order}_{product}_stx_{charge}`. Stripe caches a failure on that key. The automatic webhook path now:

1. Lists transfers in `transfer_group = order_{orderId}`.
2. Adopts one matching transfer instead of creating another.
3. Stops when the list is ambiguous or unavailable after a previous Stripe attempt.
4. Does not call `transfers.create` again after a cached failure.

An administrator can recover explicitly with `POST /api/admin/orders/{orderId}/recover-seller-transfer` in Stripe test mode. The route lists transfers first. A new key, `hc_seller_xfer_{order}_{product}_stx_{charge}_recover_{generation}`, is used only when the list is empty. Generation 1 is reused until the administrator confirms a new generation after a recorded failure. A refunded, disputed, or closed order is not paid again. The platform Connect account is not a destination.

## What was executed

Policy tests cover the stock cases and the transfer decision. They are not live Stripe charges. The V19 paid charges were not replayed. No production order, payout, or Stripe object was written.

## Migration

`20261027170000_order_inventory_restored_at` adds `Order.inventoryRestoredAt`. It is backward compatible. It has not been applied to production. Applying it is required before this branch serves production refunds, otherwise the restore write fails.
