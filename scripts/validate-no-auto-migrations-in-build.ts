/**
 * Fails when prisma migrate deploy (or similar) appears in automated build paths.
 * Read-only — no database connection.
 *
 * Usage: npx tsx scripts/validate-no-auto-migrations-in-build.ts
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const MIGRATION_PATTERNS = [
  /prisma\s+migrate\s+deploy/i,
  /prisma\s+migrate\s+resolve/i,
  /prisma\s+db\s+push/i,
  /prisma\s+db\s+execute/i,
];

/** Paths allowed to mention migrations (explicit manual / docs / tests). */
const ALLOWLIST_PATHS = [
  "scripts/run-disposable-greenfield-test.ts",
  "scripts/validate-shared-neon-cutover-readiness.ts",
  "scripts/simulate-shared-neon-migration-options.ts",
  "scripts/validate-disposable-greenfield-safety.ts",
  "scripts/apply-preview-dish-index-phase3d.ts",
  "scripts/audit-prisma-migration-drift.ts",
  "scripts/validate-archive-promote-plan.ts",
  "scripts/validate-no-auto-migrations-in-build.ts",
  "docs/",
  "prisma/baseline-staging/",
];

type ScanTarget = {
  label: string;
  rel: string;
  kind: "file" | "package_scripts";
  scriptKeys?: string[];
};

const PACKAGE_BUILD_KEYS = ["build", "prebuild", "postinstall", "build:full", "start", "dev"];

function isAllowlisted(rel: string): boolean {
  return ALLOWLIST_PATHS.some((p) => rel.startsWith(p) || rel === p);
}

function findMigrationRefs(content: string): string[] {
  const hits: string[] = [];
  for (const pattern of MIGRATION_PATTERNS) {
    if (pattern.test(content)) hits.push(pattern.source);
  }
  return hits;
}

function scanFile(target: ScanTarget): string[] {
  const full = path.join(ROOT, target.rel);
  if (!fs.existsSync(full)) return [];

  if (target.kind === "package_scripts") {
    const pkg = JSON.parse(fs.readFileSync(full, "utf8")) as { scripts?: Record<string, string> };
    const errors: string[] = [];
    for (const key of target.scriptKeys ?? []) {
      const script = pkg.scripts?.[key];
      if (!script) continue;
      if (key === "build:vercel-old") continue; // legacy reference, not used by Vercel
      const hits = findMigrationRefs(script);
      if (hits.length > 0) {
        errors.push(`package.json scripts.${key} references migration command`);
      }
    }
    for (const [key, script] of Object.entries(pkg.scripts ?? {})) {
      if (key === "db:migrate:greenfield") {
        if (/process\.env\.DATABASE_URL|\$DATABASE_URL|--url\s*["']?\$?DATABASE_URL/i.test(script)) {
          errors.push(`db:migrate:greenfield must not use DATABASE_URL`);
        }
      }
    }
    return errors;
  }

  const content = fs.readFileSync(full, "utf8");
  if (isAllowlisted(target.rel)) return [];

  const hits = findMigrationRefs(content);
  if (hits.length === 0) return [];

  return [`${target.rel} contains migration command (${hits.join(", ")})`];
}

function scanCiWorkflows(): string[] {
  const ciDir = path.join(ROOT, ".github/workflows");
  if (!fs.existsSync(ciDir)) return [];
  const errors: string[] = [];
  for (const file of fs.readdirSync(ciDir).filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"))) {
    const rel = `.github/workflows/${file}`;
    const content = fs.readFileSync(path.join(ROOT, rel), "utf8");
    if (findMigrationRefs(content).length > 0) {
      errors.push(`${rel} references migration commands in workflow`);
    }
  }
  return errors;
}

function scanLegacyWarnings(): string[] {
  const warnings: string[] = [];
  const legacy = [
    "scripts/build.sh",
    "scripts/update-vercel-build-command.js",
    "package.json",
  ];
  for (const rel of legacy) {
    if (rel === "package.json") {
      const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
      if (pkg.scripts?.["build:vercel-old"]?.includes("migrate deploy")) {
        warnings.push("build:vercel-old still references migrate deploy (legacy only — not on Vercel path)");
      }
      continue;
    }
    const full = path.join(ROOT, rel);
    if (fs.existsSync(full) && findMigrationRefs(fs.readFileSync(full, "utf8")).length > 0) {
      warnings.push(`${rel} contains migration refs but is NOT the active Vercel build path`);
    }
  }
  return warnings;
}

function main(): number {
  const errors: string[] = [];
  const warnings: string[] = [];

  const targets: ScanTarget[] = [
    { label: "Vercel build", rel: "scripts/vercel-build.js", kind: "file" },
    { label: "Vercel wrapper", rel: "scripts/build.js", kind: "file" },
    { label: "vercel.json", rel: "vercel.json", kind: "file" },
    {
      label: "package.json build hooks",
      rel: "package.json",
      kind: "package_scripts",
      scriptKeys: [...PACKAGE_BUILD_KEYS, "build:full"],
    },
  ];

  for (const t of targets) {
    errors.push(...scanFile(t));
  }
  errors.push(...scanCiWorkflows());

  warnings.push(...scanLegacyWarnings());

  // vercel.json must point at vercel-build.js
  const vercel = JSON.parse(fs.readFileSync(path.join(ROOT, "vercel.json"), "utf8"));
  if (vercel.buildCommand !== "node scripts/vercel-build.js") {
    warnings.push(`vercel.json buildCommand is "${vercel.buildCommand}"`);
  }

  console.log("validate-no-auto-migrations-in-build");
  for (const w of warnings) console.warn(`  WARN: ${w}`);
  for (const e of errors) console.error(`  FAIL: ${e}`);

  if (errors.length > 0) {
    console.error(`\nFAILED (${errors.length})`);
    return 1;
  }
  console.log("\nPASSED — no automatic migrations in active build paths");
  return 0;
}

process.exit(main());
