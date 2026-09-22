import { prisma } from '../../../lib/prisma';
async function main() {
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT migration_name, started_at, finished_at, rolled_back_at, applied_steps_count, logs
       FROM "_prisma_migrations"
      WHERE finished_at IS NULL OR rolled_back_at IS NOT NULL
      ORDER BY started_at ASC`,
  );
  for (const r of rows) {
    console.log(JSON.stringify({
      name: r.migration_name,
      started: r.started_at,
      finished: r.finished_at,
      rolledBack: r.rolled_back_at,
      steps: r.applied_steps_count,
      logs: r.logs ? String(r.logs).slice(0, 200) : null,
    }));
  }
}
main().catch((e)=>{console.error(e);process.exitCode=1;}).finally(()=>prisma.$disconnect());
