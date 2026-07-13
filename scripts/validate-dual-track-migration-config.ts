/**
 * Validates dual-track migration layout (shared vs greenfield paths).
 * Read-only — no database connection.
 *
 * Usage: npx tsx scripts/validate-dual-track-migration-config.ts
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const CONFIG_PATH = path.join(ROOT, "prisma/migration-tracks.config.json");
const BASELINE_STAGING = path.join(ROOT, "prisma/baseline-staging/20260713_current_state");
const PHASE8_ARCHIVE = path.join(ROOT, "docs/baseline-history/phase8-reconstructed");

type Config = {
  version: string;
  cutoff: {
    baseline_migration_name: string;
    baseline_staging_dir: string;
  };
  tracks: {
    shared: { schema: string; migrations_dir: string; archive_dir: string };
    greenfield: { schema: string; migrations_dir: string; blocked_hosts: string[] };
  };
};

function mustExist(rel: string, errors: string[]): void {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) errors.push(`Missing path: ${rel}`);
}

function countMigrations(dir: string): number {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return 0;
  return fs
    .readdirSync(full)
    .filter((n) => fs.existsSync(path.join(full, n, "migration.sql"))).length;
}

function main(): number {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!fs.existsSync(CONFIG_PATH)) {
    console.error(`Missing ${CONFIG_PATH}`);
    return 1;
  }

  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8")) as Config;
  const baseline = config.cutoff.baseline_migration_name;

  mustExist(config.tracks.shared.schema, errors);
  mustExist(config.tracks.greenfield.schema, errors);
  mustExist(config.tracks.shared.migrations_dir, errors);

  if (config.tracks.shared.schema !== config.tracks.greenfield.schema) {
    errors.push("Shared and greenfield must use the same schema.prisma (single client)");
  }

  if (config.tracks.shared.migrations_dir !== config.tracks.greenfield.migrations_dir) {
    warnings.push(
      "Different migrations_dir for shared/greenfield — requires prisma.config.ts path switch (not yet in repo)"
    );
  }

  const activeCount = countMigrations(config.tracks.shared.migrations_dir);
  const archiveExists = fs.existsSync(path.join(ROOT, config.tracks.shared.archive_dir));
  const archiveCount = archiveExists
    ? countMigrations(config.tracks.shared.archive_dir)
    : 0;

  const stagingManifest = path.join(BASELINE_STAGING, "manifest.json");
  const stagingSql = path.join(BASELINE_STAGING, "schema_baseline.sql");
  const promotePreview = path.join(
    BASELINE_STAGING,
    "promote-to-migrations",
    baseline,
    "migration.sql"
  );

  mustExist("prisma/baseline-staging/20260713_current_state/manifest.json", errors);
  mustExist("prisma/baseline-staging/20260713_current_state/schema_baseline.sql", errors);
  if (!fs.existsSync(promotePreview)) {
    errors.push(`Missing promote preview: promote-to-migrations/${baseline}/migration.sql`);
  }

  const registerSql = path.join(BASELINE_STAGING, "register_migration.sql");
  if (fs.existsSync(registerSql)) {
    const reg = fs.readFileSync(registerSql, "utf8");
    if (/INSERT\s+INTO\s+"_prisma_migrations"/i.test(reg)) {
      errors.push("register_migration.sql must not INSERT into _prisma_migrations");
    }
  }

  if (fs.existsSync(PHASE8_ARCHIVE)) {
    const phase8Count = countMigrations("docs/baseline-history/phase8-reconstructed");
    if (phase8Count > 0) {
      const inActive = fs
        .readdirSync(path.join(ROOT, config.tracks.shared.migrations_dir))
        .filter((n) => n.startsWith("202602"));
      if (inActive.length > 0) {
        warnings.push(
          `${inActive.length} Phase-8-style folders still in active migrations (expected in docs/baseline-history only)`
        );
      }
    }
  }

  const disposableScript = path.join(ROOT, "scripts/run-disposable-greenfield-test.ts");
  if (fs.existsSync(disposableScript)) {
    const src = fs.readFileSync(disposableScript, "utf8");
    if (!src.includes("migration-tracks.config.json") && !src.includes("BASELINE_MIGRATION")) {
      warnings.push("Disposable script should reference migration-tracks config or baseline constant");
    }
    for (const host of config.tracks.greenfield.blocked_hosts) {
      const escaped = host.replace(/\./g, "\\.");
      if (!src.includes(host) && !src.includes(escaped)) {
        warnings.push(`Disposable script missing blocked host pattern: ${host}`);
      }
    }
  }

  console.log("validate-dual-track-migration-config");
  console.log(`  config version: ${config.version}`);
  console.log(`  active migrations: ${activeCount}`);
  console.log(`  archive migrations: ${archiveCount} (${archiveExists ? "present" : "not created"})`);
  console.log(`  baseline: ${baseline}`);

  if (activeCount > 1 && archiveCount === 0) {
    warnings.push(
      `Dual-track promote not done: ${activeCount} folders in active root, archive empty — greenfield --execute blocked`
    );
  }

  for (const w of warnings) console.warn(`  WARN: ${w}`);
  for (const e of errors) console.error(`  FAIL: ${e}`);

  if (errors.length > 0) {
    console.error(`\nFAILED (${errors.length} error(s))`);
    return 1;
  }
  console.log("\nPASSED");
  return 0;
}

process.exit(main());
