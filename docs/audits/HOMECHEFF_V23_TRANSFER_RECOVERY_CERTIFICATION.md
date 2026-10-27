# V23 seller transfer recovery

Status: NOT_VERIFIED as an end-to-end recovery. The V23 payment did not fail.

The successful transfer tr_3UVGm5RpYdPVF6LP0GAzUplB was created on the first settlement and later fully reversed by the refund. There was no failed attempt left to recover.

`POST /api/admin/orders/{orderId}/recover-seller-transfer` was not called. Calling it on this refunded charge would violate the rule that a refunded payment is not recovered. The historical V19 deactivation charge was also left untouched.

Unit tests for list-before-create, adopting an existing transfer, and refusing a new key after a cached failure passed. That is UNIT_TESTED, not a live recovery.

The remaining action is one new test-mode order whose transfer list is empty after a conclusive failure, followed by one admin recovery call and a second call that must not create another transfer.
