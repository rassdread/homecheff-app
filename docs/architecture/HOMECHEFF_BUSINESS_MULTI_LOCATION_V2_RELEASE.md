# HOMECHEFF_BUSINESS_MULTI_LOCATION_V2 release plan

Release candidate only. Production activation needs a separate explicit order. Do not run `prisma migrate deploy` against production and do not start a Vercel deployment from this branch until that order exists.

## Baseline

Live homecheff.eu and homecheff.nl alias deployment `dpl_6wuUFdm6gzqWr96FHA8Qdm4kytE2`. Its recorded git commit is `34ca3c8644abad863eb4544f9acac7cda6cbb667`. This branch starts there and contains only the multi-location port plus the pickup-address integrity check.

## Database

Migration `20261029120000_seller_sales_locations` runs after `20261026140000_courier_transfer_obligation`. It creates `SellerSalesLocation` and `ProductSalesLocation` only.

- Primary keys: location id, and `(productId, locationId)`.
- Foreign keys cascade on delete from `User`, `Product`, and `SellerSalesLocation`.
- Indexes: `(userId, isActive)`, `(userId, isPrimary)`, `(locationId)`.
- No backfill. A product with zero join rows keeps `Product.pickupAddress` / `pickupLat` / `pickupLng`.
- Deleting a stall removes the join rows. It does not delete the product or existing orders.
- There is no seller-facing delete. Deactivate is the supported action. Orders store the stall text in the existing `pickupAddress` column and are not updated later.

Apply on production only after a backup and only when explicitly ordered:

```bash
npx prisma migrate deploy
```

## Downgrade

`DOWNGRADE_KEEPS_STORED_LOCATIONS` is true. A lower or expired plan does not delete stalls, products, links, or orders. Expired subscriptions resolve to `individual` (1 location) through the existing `resolveBusinessPlanId` check on `subscriptionValidUntil`.

Public listing, product selection, and new activation use `entitledActiveLocationIds`: primary first, then oldest, up to the current cap. Extra stored stalls remain visible in settings so the seller can deactivate them. They are not selectable and not used for marketplace distance until the plan allows them again. VIP26 is not referenced or changed; an active subscription named `premium` still receives 25 locations.

## Pickup snapshot

The order does not gain a new location column. For pickup, the server loads the chosen active, entitled stall and writes that address into the existing checkout `address` field, which the current order path stores as `pickupAddress`. A forged address or another seller's location id is rejected. Delivery and shipping keep the buyer address. Fees, Stripe Connect, and webhooks are unchanged.

## Stock

One `Product.stock` is shared across stalls.

## Activation checklist

1. Confirm production is still `34ca3c8644abad863eb4544f9acac7cda6cbb667` or a descendant that already contains this branch.
2. Backup the database.
3. `npx prisma migrate deploy` on production.
4. Deploy this release commit.
5. Smoke-test one seller settings page, one multi-location product, and one pickup order on a non-production account first if a staging database exists.
