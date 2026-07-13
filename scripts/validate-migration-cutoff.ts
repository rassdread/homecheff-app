/**
 * Rejects pre-cutoff migration folders in the active migration root.
 * Read-only — no database connection.
 *
 * Usage:
 *   npx tsx scripts/validate-migration-cutoff.ts          # warn if pre-promote state
 *   npx tsx scripts/validate-migration-cutoff.ts --strict   # fail on any pre-cutoff in active root
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const CONFIG_PATH = path.join(ROOT, "prisma/migration-tracks.config.json");

type TrackConfig = {
  cutoff: { baseline_migration_name: string; date: string };
  tracks: { shared: { migrations_dir: string; archive_dir: string } };
  post_cutoff_naming: { pattern: string; legacy_exceptions: string[] };
};

function loadConfig(): TrackConfig {
  if (!fs.existsSync(CONFIG_PATH)) {
    throw new Error(`Missing ${CONFIG_PATH}`);
  }
  return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8")) as TrackConfig;
}

function listMigrationFolders(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((n) => fs.existsSync(path.join(dir, n, "migration.sql")))
    .sort();
}

function main(): number {
  const strict = process.argv.includes("--strict");
  const config = loadConfig();
  const baseline = config.cutoff.baseline_migration_name;
  const migrationsDir = path.join(ROOT, config.tracks.shared.migrations_dir);
  const archiveDir = path.join(ROOT, config.tracks.shared.archive_dir);
  const errors: string[] = [];
  const warnings: string[] = [];

  const active = listMigrationFolders(migrationsDir);
  const archived = listMigrationFolders(archiveDir);
  const legacyExceptions = new Set(config.post_cutoff_naming.legacy_exceptions ?? []);
  const namePattern = new RegExp(config.post_cutoff_naming.pattern);

  const preCutoffInActive = active.filter(
    (n) => n !== baseline && n < baseline && !legacyExceptions.has(n)
  );

  if (preCutoffInActive.length > 0) {
    const msg =
      `${preCutoffInActive.length} pre-cutoff migration(s) in active root (${migrationsDir}): ` +
      `${preCutoffInActive.slice(0, 5).join(", ")}${preCutoffInActive.length > 5 ? "…" : ""}`;
    if (strict) errors.push(msg);
    else warnings.push(`${msg} (expected until archive+promote)`);
  }

  if (!active.includes(baseline)) {
    const preview = path.join(
      ROOT,
      config.cutoff.baseline_staging_dir ?? "prisma/baseline-staging/20260713_current_state",
      "promote-to-migrations",
      baseline,
      "migration.sql"
    );
    if (!fs.existsSync(preview)) {
      warnings.push(
        `Baseline migration ${baseline} not in active root (promote pending from staging)`
      );
    }
  }

  const postCutoff = active.filter((n) => n > baseline);
  for (const name of postCutoff) {
    if (legacyExceptions.has(name)) continue;
    if (!namePattern.test(name)) {
      warnings.push(
        `Post-cutoff migration "${name}" does not match naming pattern ${config.post_cutoff_naming.pattern}`
      );
    }
  }

  const preCutoffNames = new Set([...preCutoffInActive, ...archived.filter((n) => n < baseline)]);
  const duplicateInArchive = active.filter((n) => archived.includes(n) && n !== baseline);
  if (duplicateInArchive.length > 0) {
    errors.push(`Duplicate folders in active and archive: ${duplicateInArchive.join(", ")}`);
  }

  console.log("validate-migration-cutoff");
  console.log(`  cutoff baseline: ${baseline}`);
  console.log(`  active migrations: ${active.length}`);
  console.log(`  archived migrations: ${archived.length}`);
  console.log(`  pre-cutoff in active: ${preCutoffInActive.length}`);

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
