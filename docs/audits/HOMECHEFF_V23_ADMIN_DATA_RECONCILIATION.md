# V23 admin data reconciliation

Status: NOT_VERIFIED against the rendered dashboard.

The V22 snapshot is historical and was not reused as a displayed value. After the V23 preview writes, the admin orders API reported 5 paid orders while returning the orders list. That is one new paid order on top of the earlier four, and it was later refunded. The dashboard screen itself was not opened, so displayed-versus-database rows were not compared.

Growth and Studio do not have a money ledger in this pass. Their revenue stays unavailable. Gross marketplace totals were not reported as profit. The reversed transfer is not a successful payout.

A fresh reconciliation still has to be read from the Admin Center after the page renders.
