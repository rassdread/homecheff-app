# HomeCheff V22 financial certification

Date: 2026-10-27

## Stripe test payment, refund, and transfer recovery

REAL_STRIPE_TEST: NOT RUN

The shared preview environment has a test-mode Stripe secret and a preview-host database. The preview `STRIPE_WEBHOOK_SECRET` is stored as a sensitive variable and the API does not return it. The V21 preview answers unauthenticated requests with HTTP 302 to Vercel Authentication. Stripe cannot sign in. This task does not allow opening the preview to the public. No charge, refund, transfer, or webhook replay was created.

The V20 decision tests passed again: 6 stock-policy tests and 7 transfer-recovery tests. They are not a substitute for a live Stripe payment.

## Database integration tests

DATABASE_INTEGRATION_TEST: PASS

Both preview integration files were executed against the isolated preview database host `ep-green-wind-a2cspmqw`. The production host was refused by the test itself.

| Test | Result |
| --- | --- |
| Second Prisma client waits out the transaction timeout | PASS |
| Transaction client finishes the identity lookup | PASS |
| Thrown transaction rolls back the reservation | PASS |
| One unit cannot be reserved twice; a repeat buyer reuses the hold | PASS |
| A listing deactivated while locked is visible to the waiting checkout | PASS |
| A second paid session cannot create another order for the same hold | PASS |
| Two concurrent session claims keep one payable session | PASS |

7 passed, 0 failed, 0 skipped.
