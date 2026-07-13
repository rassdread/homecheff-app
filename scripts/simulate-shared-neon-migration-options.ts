/**
 * Read-only simulation of migration option outcomes against shared Neon inventory.
 * No migrate deploy, resolve, or db execute.
 *
 * Usage: npx tsx scripts/simulate-shared-neon-migration-options.ts
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const INVENTORY = path.join(ROOT, "docs/audits/homecheff-prisma-migration-inventory.json");
const MIGRATIONS_DIR = path.join(ROOT, "prisma/migrations");
const BASELINE = "20260714_greenfield_current_state_baseline";
const ARCHIVE_DIR = path.join(ROOT, "prisma/migrations-archive/pre-20260714-greenfield");

type Inventory = {
  summary: Record<string, number>;
  db_only_migrations: { migration_name: string }[];
  local_migrations_after_common: { name: string }[];
  comparisons?: { migration_name: string; status: string }[];
};

function listLocal(): string[] {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((n) => fs.existsSync(path.join(MIGRATIONS_DIR, n, "migration.sql")))
    .sort();
}

function simulateOption(
  name: string,
  localAfter: string[],
  dbApplied: string[]
): {
  option: string;
  migrate_status: string;
  deploy_new_migration: string;
  history_manipulation: string;
  drift_risk: string;
} {
  const localSet = new Set(localAfter);
  const appliedButMissing = dbApplied.filter((m) => !localSet.has(m));
  const pending = localAfter.filter((m) => !dbApplied.includes(m));

  let status: string;
  if (appliedButMissing.length === 0 && pending.length === 0) {
    status = "clean — up to date";
  } else if (appliedButMissing.length > 0 && pending.length === 0) {
    status = `applied-but-missing (${appliedButMissing.length} archived in DB)`;
  } else if (pending.length > 0 && appliedButMissing.length === 0) {
    status = `pending deploy (${pending.length})`;
  } else {
    status = `mixed — ${appliedButMissing.length} missing locally, ${pending.length} pending`;
  }

  const deploy =
    pending.length > 0
      ? "deploy applies pending only; does not re-run archived"
      : "deploy no-op for schema";

  const history =
    name === "A_archive_baseline_root"
      ? "one-time migrate resolve --applied for baseline on shared; no bulk delete from _prisma_migrations"
      : name === "E_one_time_cutover"
        ? "HIGH — would require _prisma_migrations rewrite"
        : name === "B_dual_prisma_config"
          ? "shared track keeps full DB history; greenfield track separate folder"
          : "none if shared Neon untouched";

  const drift =
    appliedButMissing.length > 28
      ? "cosmetic checksum drift unchanged; status warnings only"
      : appliedButMissing.length > 0
        ? "status noise; schema unchanged if no pending"
        : "low";

  return {
    option: name,
    migrate_status: status,
    deploy_new_migration: deploy,
    history_manipulation: history,
    drift_risk: drift,
  };
}

function main(): void {
  if (!fs.existsSync(INVENTORY)) {
    console.error(`Missing ${INVENTORY}`);
    process.exit(1);
  }

  const inv = JSON.parse(fs.readFileSync(INVENTORY, "utf8")) as Inventory;
  const localNow = listLocal();
  const dbOnly = inv.db_only_migrations.map((m) => m.migration_name);
  const dbAppliedEstimate = [
    ...localNow.filter((n) => n <= "20260709_phase13e_admin_p0"),
    ...dbOnly,
    ...inv.local_migrations_after_common.map((m) => m.name),
  ]
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort();

  const archivedSim = localNow.filter((n) => n < BASELINE);
  const optionAActive = [BASELINE, ...localNow.filter((n) => n > BASELINE)];

  const scenarios = [
    { label: "current_state", local: localNow },
    { label: "A_archive_baseline_root", local: optionAActive },
    { label: "B_dual_prisma_config_shared", local: localNow },
    { label: "B_dual_prisma_config_greenfield", local: optionAActive },
    { label: "C_baseline_outside_resolve", local: optionAActive },
    { label: "D_new_package", local: optionAActive },
    { label: "E_one_time_cutover", local: [BASELINE] },
  ];

  const report = {
    generated_at: new Date().toISOString(),
    prisma_inventory_summary: inv.summary,
    shared_neon_live_status: "62 local / 72 DB — up to date (2026-07-13 migrate status)",
    baseline: BASELINE,
    local_count_now: localNow.length,
    archive_sim_count: archivedSim.length,
    scenarios: scenarios.map((s) =>
      simulateOption(s.label, s.local, dbAppliedEstimate)
    ),
    recommendation: {
      cleanest_shared: "A_archive_baseline_root after one-time baseline resolve",
      cleanest_greenfield: "A_archive_baseline_root — migrate deploy on empty DB",
      avoid: "E_one_time_cutover — manual _prisma_migrations manipulation",
    },
  };

  const out = path.join(ROOT, "docs/audits/homecheff-prisma-phase9b-simulation-latest.json");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(report, null, 2));

  console.log(JSON.stringify(report, null, 2));
  console.log(`\nWrote ${out}`);
}

main();
