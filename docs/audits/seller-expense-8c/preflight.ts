/**
 * PHASE 8C §0 — migration state pre-flight. READ ONLY. No DDL, no writes.
 *   npx tsx --env-file=.env.local docs/audits/seller-expense-8c/preflight.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { prisma } from '../../../lib/prisma';

const OUT = 'docs/audits/seller-expense-8c';
const LOCAL_DIR = 'prisma/migrations';

async function main() {
  const localMigrations = fs
    .readdirSync(LOCAL_DIR)
    .filter((f) => fs.statSync(path.join(LOCAL_DIR, f)).isDirectory())
    .sort();

  const dbRows = await prisma.$queryRawUnsafe<
    Array<{
      migration_name: string;
      finished_at: Date | null;
      rolled_back_at: Date | null;
      applied_steps_count: number;
    }>
  >(
    `SELECT migration_name, finished_at, rolled_back_at, applied_steps_count
       FROM "_prisma_migrations" ORDER BY started_at ASC`,
  );

  const dbNames = dbRows.map((r) => r.migration_name);
  const dbSet = new Set(dbNames);
  const localSet = new Set(localMigrations);

  const unapplied = localMigrations.filter((m) => !dbSet.has(m));
  const notLocal = dbNames.filter((m) => !localSet.has(m));
  const failed = dbRows.filter((r) => !r.finished_at || r.rolled_back_at);

  // Does the one unapplied migration's target schema already exist?
  const communityOrderCols = await prisma.$queryRawUnsafe<
    Array<{ column_name: string; data_type: string }>
  >(
    `SELECT column_name, data_type FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'CommunityOrder'
        AND column_name IN ('pickupAddress','deliveryAddress','confirmedScheduleDate',
                            'confirmedScheduleTimeWindow','locationCompletedAt','locationCompletedById')
      ORDER BY column_name`,
  );

  // Does anything already claim the Phase 8C expense namespace?
  const expenseTables = await prisma.$queryRawUnsafe<Array<{ table_name: string }>>(
    `SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND (table_name ILIKE '%expense%' OR table_name ILIKE '%cost%')
      ORDER BY table_name`,
  );

  const out = {
    readOnly: true,
    writes: 0,
    localMigrationCount: localMigrations.length,
    dbMigrationCount: dbRows.length,
    unappliedLocally: unapplied,
    inDbButNotLocal: notLocal,
    inDbButNotLocalCount: notLocal.length,
    failedOrRolledBack: failed.map((f) => f.migration_name),
    archivedBaseline: {
      baselinePresentLocally: localSet.has('20260714_greenfield_current_state_baseline'),
      baselineAppliedInDb: dbSet.has('20260714_greenfield_current_state_baseline'),
      archivedFolderExists: fs.existsSync(
        'prisma/migrations-archive/pre-20260714-greenfield',
      ),
    },
    communityOrderFulfillmentColumnsPresent: communityOrderCols,
    communityOrderColumnsAllPresent: communityOrderCols.length === 6,
    existingExpenseOrCostTables: expenseTables.map((t) => t.table_name),
  };

  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'preflight.json'), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
