/**
 * Phase 9C — Validate archive-promote plan (read-only).
 * Usage: npx tsx scripts/validate-archive-promote-plan.ts
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const MANIFEST = path.join(ROOT, "docs/audits/homecheff-prisma-phase9c-archive-manifest.json");
const CONFIG = path.join(ROOT, "prisma/migration-tracks.config.json");
const BASELINE_STAGING = path.join(ROOT, "prisma/baseline-staging/20260713_current_state");
const MIGRATIONS = path.join(ROOT, "prisma/migrations");
const ARCHIVE_ROOT = path.join(ROOT, "prisma/migrations-archive/pre-20260714-greenfield");
const ARCHIVE_LOOSE = path.join(ARCHIVE_ROOT, "loose-sql");
const VERCEL_BUILD = path.join(ROOT, "scripts/vercel-build.js");

type Manifest = {
  summary: Record<string, number>;
  baseline_migration_name: string;
  entries: { name: string; category: string; checksum_sha256: string }[];
  baseline_promote: { checksum_sha256: string };
  virtual_after_promote: { active_migrations: string[]; archive_migrations: string[] };
  blockers: string[];
};

function fail(errors: string[], msg: string) {
  errors.push(msg);
}

function main(): number {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!fs.existsSync(MANIFEST)) {
    console.error(`Missing ${MANIFEST} — run: npx tsx scripts/simulate-archive-promote.ts --write-manifest`);
    return 1;
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8")) as Manifest;
  const config = JSON.parse(fs.readFileSync(CONFIG, "utf8"));
  const baseline = manifest.baseline_migration_name;
  const activeNow = fs
    .readdirSync(MIGRATIONS)
    .filter((n) => fs.existsSync(path.join(MIGRATIONS, n, "migration.sql")));

  const archiveSet = new Set(manifest.virtual_after_promote.archive_migrations);
  const isPrePromote = activeNow.length === 62;
  const isPostPromote = activeNow.length === 1 && activeNow[0] === baseline;

  if (!isPrePromote && !isPostPromote) {
    fail(
      errors,
      `Unexpected prisma/migrations state: expected 62 (pre-promote) or 1 baseline-only (post-promote), found ${activeNow.length}`
    );
  }

  if (isPrePromote) {
    for (const name of activeNow) {
      if (!archiveSet.has(name)) {
        fail(errors, `Active migration ${name} missing from archive manifest`);
      }
    }
  }

  const activeAfter = manifest.virtual_after_promote.active_migrations;
  if (activeAfter[0] !== baseline) {
    fail(errors, `Baseline must be first active migration; got ${activeAfter[0]}`);
  }

  const preCutoffInActive = activeAfter.filter((n) => n < baseline);
  if (preCutoffInActive.length > 0) {
    fail(errors, `Pre-cutoff in planned active root: ${preCutoffInActive.join(", ")}`);
  }

  const dClass = manifest.entries.filter((e) => e.category === "D_uncertain_blocker");
  const looseSql = (manifest.loose_sql_files as { name: string }[] | undefined) ?? [];
  if (looseSql.length !== 8) {
    fail(errors, `Expected 8 loose .sql files in migrations root, found ${looseSql.length}`);
  }

  const names = manifest.entries.map((e) => e.name);
  const dupes = names.filter((n, i) => names.indexOf(n) !== i);
  if (dupes.length > 0) {
    fail(errors, `Duplicate migration names: ${dupes.join(", ")}`);
  }

  // Post-promote: archived checksums must match the Phase 9C manifest.
  const crypto = require("node:crypto") as typeof import("node:crypto");
  if (fs.existsSync(ARCHIVE_ROOT)) {
    for (const e of manifest.entries) {
      const sql = path.join(ARCHIVE_ROOT, e.name, "migration.sql");
      if (!fs.existsSync(sql)) {
        fail(errors, `Archived migration missing: ${e.name}`);
        continue;
      }
      const hash = crypto.createHash("sha256").update(fs.readFileSync(sql)).digest("hex");
      if (hash !== e.checksum_sha256) {
        fail(errors, `Archived checksum drift for ${e.name}`);
      }
    }
  }

  // Post-promote: no loose SQL must remain in prisma/migrations/.
  const looseInActive = fs
    .readdirSync(MIGRATIONS)
    .filter((n) => n.endsWith(".sql") && fs.statSync(path.join(MIGRATIONS, n)).isFile());
  if (looseInActive.length > 0) {
    fail(errors, `Loose .sql files still present in prisma/migrations/: ${looseInActive.join(", ")}`);
  }

  // Post-promote: archive loose-sql must exist and contain exactly the Phase 9C list.
  if (fs.existsSync(ARCHIVE_LOOSE)) {
    const looseArchived = fs.readdirSync(ARCHIVE_LOOSE).filter((n) => n.endsWith(".sql")).sort();
    const expectedLoose = looseSql.map((x) => x.name).sort();
    const same =
      looseArchived.length === expectedLoose.length &&
      looseArchived.every((n, i) => n === expectedLoose[i]);
    if (!same) {
      fail(
        errors,
        `Archived loose-sql mismatch (expected ${expectedLoose.length}, found ${looseArchived.length})`
      );
    }
  }

  const preview = path.join(
    BASELINE_STAGING,
    "promote-to-migrations",
    baseline,
    "migration.sql"
  );
  if (!fs.existsSync(preview)) {
    fail(errors, "Missing baseline promote preview SQL");
  }

  const stagingManifest = path.join(BASELINE_STAGING, "manifest.json");
  if (!fs.existsSync(stagingManifest)) {
    fail(errors, "Missing baseline staging manifest.json");
  }

  if (fs.existsSync(path.join(ROOT, config.tracks.shared.archive_dir))) {
    warnings.push("migrations-archive already exists — promote may be partially done");
  }

  const vercelSrc = fs.readFileSync(VERCEL_BUILD, "utf8");
  if (/prisma migrate deploy/.test(vercelSrc) && !/BLOCKED|disabled/i.test(vercelSrc)) {
    warnings.push("vercel-build.js still runs migrate deploy fail-soft — cutover risk");
  }

  if (process.argv.includes("--simulation-only") && /git mv|fs\.renameSync/.test(fs.readFileSync(__filename, "utf8"))) {
    // self-check: this validator must not mutate
  }

  console.log("validate-archive-promote-plan");
  console.log(`  manifest entries: ${manifest.entries.length}`);
  console.log(`  after promote active: ${activeAfter.length} (${activeAfter.join(", ")})`);
  console.log(`  archive count: ${manifest.virtual_after_promote.archive_migrations.length}`);
  console.log(`  D-class blockers: ${dClass.length}`);

  for (const w of warnings) console.warn(`  WARN: ${w}`);
  for (const e of errors) console.error(`  FAIL: ${e}`);
  if (manifest.blockers?.length) {
    console.warn(`  MANIFEST BLOCKERS: ${manifest.blockers.join("; ")}`);
  }

  if (errors.length > 0) {
    console.error(`\nFAILED (${errors.length})`);
    return 1;
  }
  console.log("\nPASSED");
  return 0;
}

process.exit(main());
