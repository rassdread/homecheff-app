# HomeCheff V21 financial certification

## Result

Real Stripe refund certification: NOT RUN.

Seller transfer recovery certification: NOT RUN.

Stock restoration on a fresh payment: NOT RUN.

Seven preview database integration tests: NOT RERUN.

## Why

This worktree has no `CHECKOUT_TX_DATABASE_URL` and no preview database URL. The production database and the production Stripe account were not used.

The existing V20 preview is behind Vercel Authentication. Stripe cannot deliver a webhook to that host. Opening the host with a deployment protection exception would make that preview reachable without authentication. This task does not allow that.

The Stripe CLI is installed. It was not pointed at a database and it was not used to create a charge, refund, or transfer.

## What still passes locally

The V20 decision tests pass:

- full unfulfilled refund restores stock once
- duplicate and partial refunds do not restore stock
- fulfilled or picked-up orders do not restore stock
- a second restoration is refused
- a cached failed transfer is not retried with a new key
- an existing transfer is adopted
- an empty transfer list is required before a new recovery key
- a refunded charge and an ambiguous lookup do not create a transfer

No new order, refund, transfer, or stock row was written.

## Promotion limit

The V20 limit editor and its unit tests remain. This run did not sign in to the admin UI, so the promotion form was not certified in a browser.
