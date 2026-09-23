#!/usr/bin/env bash
#
# PHASE 8D — rehearse the migration against the real database and roll it back.
#
# Applies the migration inside a transaction, asserts the new objects exist and
# that nothing in the financial surface moved, then aborts. Nothing is kept.
#
# Usage: DIRECT_URL=... bash docs/audits/private-receipt-vault-8d/migration-dryrun.sh
set -euo pipefail

MIGRATION="prisma/migrations/20260922210000_phase_8d_private_receipt_vault/migration.sql"
: "${DIRECT_URL:?DIRECT_URL must be set}"

echo "== Phase 8D migration dry-run =="

psql "$DIRECT_URL" -v ON_ERROR_STOP=1 <<SQL
BEGIN;

-- Baseline: the tables 8B/8B.2/8C depend on must be untouched by this migration.
CREATE TEMP TABLE _before AS
SELECT
  (SELECT count(*) FROM "SellerExpense")                                    AS seller_expense_rows,
  (SELECT count(*) FROM information_schema.columns
     WHERE table_name = 'SellerExpense')                                    AS seller_expense_cols,
  (SELECT count(*) FROM information_schema.columns
     WHERE table_name = 'Refund')                                           AS refund_cols,
  (SELECT count(*) FROM information_schema.columns
     WHERE table_name = 'Order')                                            AS order_cols,
  (SELECT count(*) FROM information_schema.columns
     WHERE table_name = 'Transaction')                                      AS transaction_cols;

\echo '-- applying migration --'
\i $MIGRATION

\echo '-- applying a second time (idempotency) --'
\i $MIGRATION

\echo '-- assertions --'
DO \$\$
DECLARE
  b RECORD;
BEGIN
  SELECT * INTO b FROM _before;

  IF (SELECT count(*) FROM information_schema.tables
        WHERE table_name = 'SellerFinancialEvidence') <> 1 THEN
    RAISE EXCEPTION 'SellerFinancialEvidence was not created';
  END IF;

  IF (SELECT count(*) FROM information_schema.columns
        WHERE table_name = 'SellerFinancialEvidence') <> 19 THEN
    RAISE EXCEPTION 'unexpected column count: %',
      (SELECT count(*) FROM information_schema.columns WHERE table_name = 'SellerFinancialEvidence');
  END IF;

  IF (SELECT count(*) FROM pg_indexes
        WHERE tablename = 'SellerFinancialEvidence') < 5 THEN
    RAISE EXCEPTION 'indexes missing';
  END IF;

  IF (SELECT count(*) FROM pg_constraint
        WHERE conname IN ('SellerFinancialEvidence_ownerUserId_fkey',
                          'SellerFinancialEvidence_linkedExpenseId_fkey')) <> 2 THEN
    RAISE EXCEPTION 'foreign keys missing';
  END IF;

  -- The expense link must be SET NULL (confdeltype 'n'), never CASCADE:
  -- unlinking evidence may not be able to delete the expense.
  IF (SELECT confdeltype FROM pg_constraint
        WHERE conname = 'SellerFinancialEvidence_linkedExpenseId_fkey') <> 'n' THEN
    RAISE EXCEPTION 'linkedExpenseId FK must be ON DELETE SET NULL';
  END IF;

  IF (SELECT count(*) FROM "SellerFinancialEvidence") <> 0 THEN
    RAISE EXCEPTION 'migration inserted rows';
  END IF;

  -- Nothing else moved.
  IF (SELECT count(*) FROM "SellerExpense") <> b.seller_expense_rows THEN
    RAISE EXCEPTION 'SellerExpense row count changed';
  END IF;
  IF (SELECT count(*) FROM information_schema.columns WHERE table_name = 'SellerExpense')
       <> b.seller_expense_cols THEN
    RAISE EXCEPTION 'SellerExpense columns changed';
  END IF;
  IF (SELECT count(*) FROM information_schema.columns WHERE table_name = 'Refund')
       <> b.refund_cols THEN
    RAISE EXCEPTION 'Refund columns changed';
  END IF;
  IF (SELECT count(*) FROM information_schema.columns WHERE table_name = 'Order')
       <> b.order_cols THEN
    RAISE EXCEPTION 'Order columns changed';
  END IF;
  IF (SELECT count(*) FROM information_schema.columns WHERE table_name = 'Transaction')
       <> b.transaction_cols THEN
    RAISE EXCEPTION 'Transaction columns changed';
  END IF;

  RAISE NOTICE 'ALL ASSERTIONS PASSED';
END
\$\$;

ROLLBACK;
SQL

echo "== rolled back; verifying the table is absent again =="
psql "$DIRECT_URL" -v ON_ERROR_STOP=1 -tAc \
  "SELECT count(*) FROM information_schema.tables WHERE table_name = 'SellerFinancialEvidence';"
echo "(0 = clean rollback)"
