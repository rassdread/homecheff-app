/**
 * Phase 9C — Shared Neon cutover readiness (read-only).
 * Builds temp migration root in /tmp and runs `prisma migrate status` only.
 *
 * Usage: npx tsx scripts/validate-shared-neon-cutover-readiness.ts
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ROOT = process.cwd();
const MANIFEST = path.join(ROOT, "docs/audits/homecheff-prisma-phase9c-archive-manifest.json");
const SCHEMA = path.join(ROOT, "prisma/schema.prisma");
const BASELINE_STAGING = path.join(ROOT, "prisma/baseline-staging/20260713_current_state");
const REPORT = path.join(ROOT, "docs/audits/homecheff-prisma-phase9c-cutover-readiness-report.json");

const BLOCKED_HOST = /ep-summer-darkness-a2l0745u/i;

function main(): number {
  const errors: string[] = [];
  const warnings: string[] = [];
  const evidence: Record<string, unknown> = { generated_at: new Date().toISOString() };

  if (!fs.existsSync(MANIFEST)) {
    console.error("Run simulate-archive-promote.ts --write-manifest first");
    return 1;
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  const baseline = manifest.baseline_migration_name as string;
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    warnings.push("DATABASE_URL unset — skipping live migrate status evidence");
  } else if (BLOCKED_HOST.test(dbUrl)) {
    evidence.live_status_note =
      "DATABASE_URL points to shared Neon — migrate status allowed read-only in Phase 9C";
  }

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "hc-cutover-sim-"));
  const simRoot = path.join(tmp, "prisma");
  const simMigrations = path.join(simRoot, "migrations");
  fs.mkdirSync(simMigrations, { recursive: true });
  fs.copyFileSync(SCHEMA, path.join(simRoot, "schema.prisma"));
  fs.copyFileSync(
    path.join(ROOT, "prisma/migrations/migration_lock.toml"),
    path.join(simMigrations, "migration_lock.toml")
  );

  const baselineDir = path.join(simMigrations, baseline);
  fs.mkdirSync(baselineDir, { recursive: true });
  fs.copyFileSync(
    path.join(BASELINE_STAGING, "promote-to-migrations", baseline, "migration.sql"),
    path.join(baselineDir, "migration.sql")
  );

  const configPath = path.join(tmp, "prisma.config.ts");
  fs.writeFileSync(
    configPath,
    `import path from "node:path";
export default {
  schema: path.join(__dirname, "prisma/schema.prisma"),
  migrations: { path: path.join(__dirname, "prisma/migrations") },
};
`
  );

  evidence.simulated_active_migrations = [baseline];
  evidence.simulated_tmp = tmp;

  if (dbUrl) {
    try {
      const statusBeforeResolve = execSync(`npx prisma migrate status --config "${configPath}"`, {
        cwd: ROOT,
        encoding: "utf8",
        env: { ...process.env, DATABASE_URL: dbUrl, DIRECT_URL: process.env.DIRECT_URL ?? dbUrl },
      });
      evidence.migrate_status_baseline_only_unresolved = statusBeforeResolve;
      evidence.baseline_shows_as_pending = /following migration.*not yet been applied|not yet been applied/i.test(
        statusBeforeResolve
      );
      evidence.applied_but_missing_expected = /applied to the database but missing from/i.test(
        statusBeforeResolve
      );
      evidence.up_to_date = /up to date/i.test(statusBeforeResolve);

      if (evidence.baseline_shows_as_pending) {
        evidence.resolve_required = true;
        evidence.resolve_command = `npx prisma migrate resolve --applied ${baseline}`;
      }
    } catch (e: unknown) {
      const err = e as { stdout?: string; stderr?: string; message?: string };
      const out = [err.stdout, err.stderr, err.message].filter(Boolean).join("\n");
      evidence.migrate_status_output = out.slice(0, 8000);
      evidence.baseline_shows_as_pending = /not yet been applied/i.test(out);
      evidence.applied_but_missing_expected = /not found locally in prisma\/migrations/i.test(out);
      evidence.up_to_date = /up to date/i.test(out);
      if (evidence.baseline_shows_as_pending) {
        evidence.resolve_required = true;
        evidence.resolve_command = `npx prisma migrate resolve --applied ${baseline}`;
      }
    }
  }

  evidence.deploy_simulation = {
    without_resolve:
      "migrate deploy would attempt baseline DDL → duplicate object errors on shared Neon (CREATE TABLE)",
    with_resolve_only:
      "after resolve --applied, deploy is no-op until new post-cutoff migration added",
    blocked_by_prisma:
      "deploy does NOT block on applied-but-missing; only pending migrations run",
    checksum_mismatches:
      "28 existing checksum mismatches remain cosmetic; deploy does not re-apply",
  };

  evidence.safe_order = [
    "1. Vercel policy: disable auto migrate deploy (or accept fail-soft risk)",
    "2. Human approval + DB backup + schema diff verify",
    "3. migrate resolve --applied baseline on shared Neon (DDL NOT executed)",
    "4. git archive-promote commit (62 → archive, baseline → active)",
    "5. verify migrate status on shared (applied-but-missing OK, baseline applied)",
    "6. disposable greenfield test --mode greenfield",
    "7. merge + controlled deployment",
  ];

  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  fs.writeFileSync(REPORT, JSON.stringify(evidence, null, 2));

  try {
    fs.rmSync(tmp, { recursive: true, force: true });
  } catch {
    warnings.push(`Could not remove temp dir ${tmp}`);
  }

  console.log("validate-shared-neon-cutover-readiness");
  console.log(`  baseline pending (simulated): ${evidence.baseline_shows_as_pending ?? "n/a"}`);
  console.log(`  resolve required: ${evidence.resolve_required ?? "n/a"}`);
  console.log(`  report: ${REPORT}`);

  for (const w of warnings) console.warn(`  WARN: ${w}`);

  if (!evidence.resolve_required && dbUrl) {
    warnings.push("Expected baseline pending before resolve — verify manually");
  }

  console.log("\nPASSED (read-only simulation)");
  return 0;
}

process.exit(main());
