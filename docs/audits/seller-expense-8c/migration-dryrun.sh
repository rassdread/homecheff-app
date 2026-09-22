#!/usr/bin/env bash
# PHASE 8C §32 — controlled migration rehearsal.
#
# No separate staging database exists, so the controlled environment is a
# transaction. Postgres DDL is transactional: the real migration file is applied
# against the real schema, verified, applied a second time to prove it is
# idempotent, and then rolled back. Nothing is persisted.
#
# ON_ERROR_STOP makes any failure abort before COMMIT could ever be reached,
# and the script contains no COMMIT at all.
set -euo pipefail

cd "$(dirname "$0")/../../.."
set -a && . ./.env.local && set +a

MIGRATION="prisma/migrations/20260922180000_phase_8c_seller_expense/migration.sql"
OUT="docs/audits/seller-expense-8c/migration-dryrun.txt"

{
  echo "BEGIN;"
  echo "\\echo '--- financial tables BEFORE ---'"
  cat <<'SQL'
SELECT table_name, (SELECT count(*) FROM information_schema.columns c
                     WHERE c.table_schema='public' AND c.table_name=t.table_name) AS columns
  FROM (VALUES ('Transaction'),('Refund'),('RefundSettlement'),('Payout'),('Order'),('OrderItem'),('DisputeSettlement')) AS t(table_name);
SELECT 'Transaction' AS t, count(*) FROM "Transaction"
UNION ALL SELECT 'Refund', count(*) FROM "Refund"
UNION ALL SELECT 'RefundSettlement', count(*) FROM "RefundSettlement"
UNION ALL SELECT 'Payout', count(*) FROM "Payout"
UNION ALL SELECT 'Order', count(*) FROM "Order";
SQL
  echo "\\echo '--- applying migration (first run) ---'"
  cat "$MIGRATION"
  echo "\\echo '--- applying migration (second run, must be a no-op) ---'"
  cat "$MIGRATION"
  echo "\\echo '--- SellerExpense structure ---'"
  cat <<'SQL'
SELECT column_name, data_type, is_nullable, column_default
  FROM information_schema.columns
 WHERE table_schema='public' AND table_name='SellerExpense' ORDER BY ordinal_position;
SELECT indexname FROM pg_indexes WHERE schemaname='public' AND tablename='SellerExpense' ORDER BY indexname;
SELECT conname, confdeltype FROM pg_constraint WHERE conname='SellerExpense_sellerUserId_fkey';
SQL
  echo "\\echo '--- financial tables AFTER (must be identical) ---'"
  cat <<'SQL'
SELECT 'Transaction' AS t, count(*) FROM "Transaction"
UNION ALL SELECT 'Refund', count(*) FROM "Refund"
UNION ALL SELECT 'RefundSettlement', count(*) FROM "RefundSettlement"
UNION ALL SELECT 'Payout', count(*) FROM "Payout"
UNION ALL SELECT 'Order', count(*) FROM "Order";
SQL
  echo "\\echo '--- ROLLING BACK ---'"
  echo "ROLLBACK;"
  echo "\\echo '--- SellerExpense must NOT exist after rollback ---'"
  cat <<'SQL'
SELECT count(*) AS seller_expense_tables_remaining FROM information_schema.tables
 WHERE table_schema='public' AND table_name='SellerExpense';
SQL
} | psql "$DATABASE_URL" -v ON_ERROR_STOP=1 --no-psqlrc 2>&1 | tee "$OUT"

echo
echo "rehearsal output written to $OUT"
