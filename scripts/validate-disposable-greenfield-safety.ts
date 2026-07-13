/**
 * Read-only safety validator for disposable greenfield test script and bootstrap files.
 * No database connection.
 *
 * Usage: npx tsx scripts/validate-disposable-greenfield-safety.ts
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const TEST_SCRIPT = path.join(ROOT, "scripts/run-disposable-greenfield-test.ts");
const REGISTER = path.join(
  ROOT,
  "prisma/baseline-staging/20260713_current_state/register_migration.sql"
);
const MIGRATIONS_DIR = path.join(ROOT, "prisma/migrations");
const PHASE8_ARCHIVE = path.join(ROOT, "docs/baseline-history/phase8-reconstructed");
const BASELINE_CUTOFF = "20260714_greenfield_current_state_baseline";

const errors: string[] = [];
const warnings: string[] = [];

function fail(msg: string) {
  errors.push(msg);
}

function warn(msg: string) {
  warnings.push(msg);
}

function main(): number {
  const testSrc = fs.readFileSync(TEST_SCRIPT, "utf8");
  const registerSrc = fs.readFileSync(REGISTER, "utf8");

  // No manual _prisma_migrations INSERT in register file
  if (/INSERT\s+INTO\s+"_prisma_migrations"/i.test(registerSrc)) {
    fail("register_migration.sql still contains INSERT INTO _prisma_migrations");
  }

  // Test script must not INSERT into _prisma_migrations
  if (/INSERT\s+INTO\s+"_prisma_migrations"/i.test(testSrc)) {
    fail("run-disposable-greenfield-test.ts contains manual _prisma_migrations INSERT");
  }

  // Must use migrate resolve or migrate deploy
  if (
    !testSrc.includes("migrate resolve") &&
    !testSrc.includes("migrate deploy") &&
    !testSrc.includes("migrate resolve")
  ) {
    warn("Test script should reference prisma migrate resolve or deploy");
  }

  const requiredPatterns: { pattern: RegExp; label: string }[] = [
    { pattern: /GREENFIELD_TEST_ACK/, label: "GREENFIELD_TEST_ACK gate" },
    { pattern: /GREENFIELD_DATABASE_URL/, label: "GREENFIELD_DATABASE_URL explicit env" },
    { pattern: /ep-summer-darkness-a2l0745u/i, label: "blocked shared Neon host" },
    { pattern: /homecheff\\\.eu/, label: "blocked homecheff.eu" },
    { pattern: /--execute/, label: "--execute flag" },
    { pattern: /DRY-RUN|dry-run/i, label: "dry-run default" },
  ];

  for (const { pattern, label } of requiredPatterns) {
    if (!pattern.test(testSrc)) fail(`Missing safety pattern: ${label}`);
  }

  const withoutEnvLocalDisclaimer = testSrc.replace(/do not rely on \.env\.local/gi, "");
  if (/loadEnvLocal|readFileSync\([^)]*\.env\.local/i.test(withoutEnvLocalDisclaimer)) {
    fail("Test script must not load .env.local");
  }

  if (/DATABASE_URL(?![\w_])/ .test(testSrc) && !testSrc.includes("GREENFIELD_DATABASE_URL")) {
    warn("Script references DATABASE_URL — ensure GREENFIELD_DATABASE_URL is primary");
  }

  if (/DROP\s+DATABASE/i.test(testSrc)) {
    fail("DROP DATABASE not allowed in test script");
  }

  if (/--cleanup/.test(testSrc) && !/GREENFIELD_CLEANUP_ACK/.test(testSrc)) {
    fail("Cleanup requires separate GREENFIELD_CLEANUP_ACK");
  }

  if (/migrate reset/i.test(testSrc)) {
    fail("migrate reset not allowed");
  }

  // Phase 8 reconstructed must not be in active migrations
  if (fs.existsSync(PHASE8_ARCHIVE)) {
    for (const name of fs.readdirSync(PHASE8_ARCHIVE)) {
      const active = path.join(MIGRATIONS_DIR, name);
      if (fs.existsSync(active)) {
        fail(`Phase 8 migration still in active chain: ${name}`);
      }
    }
  }

  // Count pre-cutoff migrations still active
  const activeMigrations = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((n) => fs.existsSync(path.join(MIGRATIONS_DIR, n, "migration.sql")))
    .sort();

  const preCutoff = activeMigrations.filter((n) => n < BASELINE_CUTOFF);
  if (preCutoff.length > 0) {
    warnings.push(
      `${preCutoff.length} pre-cutoff migrations still in prisma/migrations/ — ` +
        `greenfield --execute will refuse until archived (expected pre-promote)`
    );
  }

  const previewBaseline = path.join(
    ROOT,
    "prisma/baseline-staging/20260713_current_state/promote-to-migrations",
    BASELINE_CUTOFF,
    "migration.sql"
  );
  if (!fs.existsSync(previewBaseline)) {
    fail("Missing promote-to-migrations baseline preview");
  }

  console.log("Disposable greenfield safety validator\n");
  if (warnings.length) {
    for (const w of warnings) console.log(`○ ${w}`);
  }
  if (errors.length) {
    for (const e of errors) console.error(`✗ ${e}`);
    return 1;
  }
  console.log("✓ Disposable greenfield safety checks passed");
  return 0;
}

process.exit(main());
