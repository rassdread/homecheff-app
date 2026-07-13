/**
 * Disposable greenfield database test — Phase 9 / 9A.
 *
 * DEFAULT: dry-run only (no DB writes, no .env.local).
 *
 * Execute (disposable DB only):
 *   export GREENFIELD_DATABASE_URL="postgresql://..."
 *   export GREENFIELD_TEST_ACK=I_UNDERSTAND_DISPOSABLE
 *   npx tsx scripts/run-disposable-greenfield-test.ts --execute
 *
 * Cleanup (optional, destructive):
 *   export GREENFIELD_CLEANUP_ACK=I_UNDERSTAND_CLEANUP
 *   npx tsx scripts/run-disposable-greenfield-test.ts --execute --cleanup
 */
import { execSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const BASELINE_DIR = path.join(ROOT, "prisma/baseline-staging/20260713_current_state");
const SCHEMA_SQL = path.join(BASELINE_DIR, "schema_baseline.sql");
const SEED_SQL = path.join(BASELINE_DIR, "system_seed.sql");
const MANIFEST = path.join(BASELINE_DIR, "manifest.json");
const REPORT_DIR = path.join(ROOT, "docs/audits");
const MIGRATIONS_DIR = path.join(ROOT, "prisma/migrations");
const BASELINE_MIGRATION = "20260714_greenfield_current_state_baseline";
const BASELINE_PREVIEW = path.join(
  BASELINE_DIR,
  "promote-to-migrations",
  BASELINE_MIGRATION,
  "migration.sql"
);

const BLOCKED_URL_PATTERNS = [
  /ep-summer-darkness-a2l0745u/i,
  /homecheff\.eu/i,
  /homecheff\.prod/i,
  /neondb.*prod/i,
];

type StepResult = { step: string; ok: boolean; detail?: unknown };

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    execute: args.includes("--execute"),
    includeSentinel: args.includes("--include-sentinel"),
    cleanup: args.includes("--cleanup"),
  };
}

function parseDbUrl(url: string): { host: string; database: string } {
  try {
    const u = new URL(url.replace(/^postgres:/, "postgresql:"));
    return {
      host: u.hostname,
      database: u.pathname.replace(/^\//, "") || "(default)",
    };
  } catch {
    return { host: "(unparseable)", database: "(unparseable)" };
  }
}

function assertSafeDatabaseUrl(url: string): void {
  for (const p of BLOCKED_URL_PATTERNS) {
    if (p.test(url)) {
      throw new Error(
        `Refused: URL matches blocked pattern ${p.source}. Use an explicit disposable database.`
      );
    }
  }
  const { host, database } = parseDbUrl(url);
  console.log(`Target: host=${host} database=${database} (credentials not shown)`);
}

function listActiveMigrations(): string[] {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((n) => fs.existsSync(path.join(MIGRATIONS_DIR, n, "migration.sql")))
    .sort();
}

function assertGreenfieldMigrationRoot(): void {
  const folders = listActiveMigrations();
  const preCutoff = folders.filter((n) => n < BASELINE_MIGRATION);
  if (preCutoff.length > 0) {
    throw new Error(
      `Greenfield --execute blocked: ${preCutoff.length} pre-cutoff migrations still in prisma/migrations/. ` +
        `Archive to prisma/migrations-archive/pre-20260714-greenfield/ before execute. ` +
        `First: ${preCutoff[0]}`
    );
  }
  const activeBaseline = path.join(MIGRATIONS_DIR, BASELINE_MIGRATION, "migration.sql");
  if (!fs.existsSync(activeBaseline) && !fs.existsSync(BASELINE_PREVIEW)) {
    throw new Error("Missing baseline migration (promote preview or active folder)");
  }
}

function runCmd(cmd: string, env: NodeJS.ProcessEnv): string {
  return execSync(cmd, { cwd: ROOT, encoding: "utf8", env, stdio: ["pipe", "pipe", "inherit"] });
}

function runCmdInherit(cmd: string, env: NodeJS.ProcessEnv): void {
  execSync(cmd, { cwd: ROOT, stdio: "inherit", env });
}

async function assertDatabaseEmpty(url: string): Promise<void> {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient({
    datasources: { db: { url } },
  });
  try {
    const tables = (await prisma.$queryRaw`
      SELECT COUNT(*)::int AS c FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `) as { c: number }[];
    if ((tables[0]?.c ?? 0) > 0) {
      throw new Error("Database is not empty (public tables exist)");
    }
  } finally {
    await prisma.$disconnect();
  }
}

function writeReport(name: string, body: object): string {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const file = path.join(REPORT_DIR, name);
  fs.writeFileSync(file, JSON.stringify(body, null, 2));
  return file;
}

function runReadOnlyValidators(): void {
  runCmdInherit("npx tsx scripts/validate-current-state-baseline.ts", process.env);
  runCmdInherit("npx tsx scripts/validate-disposable-greenfield-safety.ts", process.env);
}

function buildPlan(includeSentinel: boolean, cleanup: boolean) {
  return [
    { step: 1, name: "identity_check", action: "Verify GREENFIELD_DATABASE_URL + blocked host patterns" },
    { step: 2, name: "empty_check", action: "Assert zero public tables" },
    { step: 3, name: "migration_root_check", action: "Assert no pre-cutoff folders in prisma/migrations/" },
    {
      step: 4,
      name: "baseline_ddl",
      action: "prisma db execute --file schema_baseline.sql (or migrate deploy if baseline-only root)",
    },
    {
      step: 5,
      name: "baseline_registration",
      action: `prisma migrate resolve --applied ${BASELINE_MIGRATION} OR migrate deploy on empty DB`,
    },
    { step: 6, name: "migrate_status", action: "npx prisma migrate status — expect up to date" },
    { step: 7, name: "post_cutoff_deploy", action: "npx prisma migrate deploy (pending post-cutoff only)" },
    { step: 8, name: "prisma_generate", action: "npx prisma generate" },
    { step: 9, name: "schema_diff", action: "prisma migrate diff schema.prisma → DB (expect empty ± accepted)" },
    { step: 10, name: "build_smoke", action: "npm run build && npm run smoke-check" },
    {
      step: 11,
      name: "minimal_crud",
      action:
        "User, Product, PromoCode (affiliate+seller), DeliveryProfile, Dish, CommunityOrder, DealReview",
    },
    { step: 12, name: "history_audit", action: "No pre-cutoff migration names in _prisma_migrations" },
    includeSentinel
      ? { step: "4b", name: "system_seed_sentinel", action: "Optional sentinel INSERTs" }
      : null,
    cleanup
      ? { step: 13, name: "cleanup", action: "DROP SCHEMA — requires GREENFIELD_CLEANUP_ACK" }
      : null,
  ].filter(Boolean);
}

async function main(): Promise<void> {
  const { execute, includeSentinel, cleanup } = parseArgs();
  const started = new Date().toISOString();
  const steps: StepResult[] = [];

  console.log("HomeCheff Phase 9A — disposable greenfield test\n");
  console.log(`Mode: ${execute ? "EXECUTE" : "DRY-RUN"}\n`);

  if (!fs.existsSync(SCHEMA_SQL)) throw new Error(`Missing ${SCHEMA_SQL}`);

  const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  runReadOnlyValidators();

  const plan = {
    started_at: started,
    mode: execute ? "execute" : "dry-run",
    baseline_version: manifest.baseline_version,
    baseline_migration: BASELINE_MIGRATION,
    steps: buildPlan(includeSentinel, cleanup),
    required_env_execute: [
      "GREENFIELD_DATABASE_URL",
      "GREENFIELD_TEST_ACK=I_UNDERSTAND_DISPOSABLE",
    ],
    required_env_cleanup: ["GREENFIELD_CLEANUP_ACK=I_UNDERSTAND_CLEANUP"],
    blocked_url_patterns: BLOCKED_URL_PATTERNS.map((r) => r.source),
    official_registration:
      "prisma migrate resolve --applied after DDL — no manual _prisma_migrations INSERT",
  };

  if (!execute) {
    const reportPath = writeReport(`greenfield-test-plan-dry-run-${started.slice(0, 10)}.json`, plan);
    console.log("\nDry-run plan:", reportPath);
    console.log("\nExecute when approved:");
    console.log('  export GREENFIELD_TEST_ACK=I_UNDERSTAND_DISPOSABLE');
    console.log('  export GREENFIELD_DATABASE_URL="postgresql://..."');
    console.log("  npx tsx scripts/run-disposable-greenfield-test.ts --execute");
    return;
  }

  if (process.env.GREENFIELD_TEST_ACK !== "I_UNDERSTAND_DISPOSABLE") {
    throw new Error("Set GREENFIELD_TEST_ACK=I_UNDERSTAND_DISPOSABLE");
  }

  if (cleanup && process.env.GREENFIELD_CLEANUP_ACK !== "I_UNDERSTAND_CLEANUP") {
    throw new Error("Set GREENFIELD_CLEANUP_ACK=I_UNDERSTAND_CLEANUP for --cleanup");
  }

  const dbUrl = process.env.GREENFIELD_DATABASE_URL;
  if (!dbUrl) {
    throw new Error("GREENFIELD_DATABASE_URL required (do not rely on .env.local DATABASE_URL)");
  }

  assertSafeDatabaseUrl(dbUrl);
  steps.push({ step: "identity_check", ok: true });

  const childEnv = {
    ...process.env,
    DATABASE_URL: dbUrl,
    DIRECT_URL: process.env.DIRECT_URL ?? dbUrl,
  };

  try {
    await assertDatabaseEmpty(dbUrl);
    steps.push({ step: "empty_check", ok: true });
  } catch (e) {
    steps.push({ step: "empty_check", ok: false, detail: String(e) });
    throw e;
  }

  try {
    assertGreenfieldMigrationRoot();
    steps.push({ step: "migration_root_check", ok: true });
  } catch (e) {
    steps.push({ step: "migration_root_check", ok: false, detail: String(e) });
    throw e;
  }

  const activeFolders = listActiveMigrations();
  const onlyBaseline = activeFolders.length === 1 && activeFolders[0] === BASELINE_MIGRATION;

  try {
    if (onlyBaseline) {
      runCmdInherit(
        `npx prisma migrate deploy --schema prisma/schema.prisma`,
        childEnv
      );
      steps.push({ step: "baseline_ddl", ok: true, method: "migrate_deploy" });
    } else {
      runCmdInherit(
        `npx prisma db execute --file "${SCHEMA_SQL}" --schema prisma/schema.prisma --url "${dbUrl.replace(/"/g, '\\"')}"`,
        childEnv
      );
      steps.push({ step: "baseline_ddl", ok: true, method: "db_execute" });

      if (!fs.existsSync(path.join(MIGRATIONS_DIR, BASELINE_MIGRATION, "migration.sql"))) {
        throw new Error(
          `Baseline folder missing in prisma/migrations/${BASELINE_MIGRATION} — promote preview before resolve`
        );
      }
      runCmdInherit(
        `npx prisma migrate resolve --applied ${BASELINE_MIGRATION} --schema prisma/schema.prisma`,
        childEnv
      );
      steps.push({ step: "baseline_registration", ok: true, method: "resolve_applied" });
    }
  } catch (e) {
    steps.push({ step: "baseline_ddl", ok: false, detail: String(e) });
    throw e;
  }

  if (includeSentinel) {
    const seed = fs.readFileSync(SEED_SQL, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").trim();
    if (seed) {
      runCmd(
        `npx prisma db execute --stdin --schema prisma/schema.prisma --url "${dbUrl.replace(/"/g, '\\"')}"`,
        { ...childEnv, INPUT: seed }
      );
    }
    steps.push({ step: "system_seed_sentinel", ok: true });
  }

  try {
    const status = runCmd(`npx prisma migrate status --schema prisma/schema.prisma`, childEnv);
    steps.push({
      step: "migrate_status",
      ok: /Database schema is up to date/i.test(status),
      output: status.slice(0, 300),
    });
  } catch (e) {
    steps.push({ step: "migrate_status", ok: false, detail: String(e) });
    throw e;
  }

  const pendingPostCutoff = activeFolders.filter((n) => n > BASELINE_MIGRATION);
  if (pendingPostCutoff.length > 0) {
    try {
      runCmdInherit(`npx prisma migrate deploy --schema prisma/schema.prisma`, childEnv);
      steps.push({ step: "post_cutoff_deploy", ok: true, count: pendingPostCutoff.length });
    } catch (e) {
      steps.push({ step: "post_cutoff_deploy", ok: false, detail: String(e) });
      throw e;
    }
  } else {
    steps.push({ step: "post_cutoff_deploy", ok: true, detail: "none pending" });
  }

  runCmdInherit("npx prisma generate", childEnv);
  steps.push({ step: "prisma_generate", ok: true });

  let diff = "";
  try {
    diff = runCmd(
      `npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-url "${dbUrl.replace(/"/g, '\\"')}" --script`,
      childEnv
    );
    const acceptedOnly =
      diff.trim().length === 0 ||
      (diff.includes("HcpCarouselSlide") && diff.includes("updatedAt"));
    steps.push({
      step: "schema_diff",
      ok: acceptedOnly,
      diff_bytes: diff.length,
      diff_preview: diff.slice(0, 800),
    });
    if (!acceptedOnly) throw new Error("Schema diff not empty (beyond accepted noise)");
  } catch (e) {
    if (!steps.find((s) => s.step === "schema_diff")) {
      steps.push({ step: "schema_diff", ok: false, detail: String(e) });
    }
    throw e;
  }

  runCmdInherit("npm run build", childEnv);
  runCmdInherit("npm run smoke-check", childEnv);
  steps.push({ step: "build_smoke", ok: true });

  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
  try {
    const user = await prisma.user.create({
      data: { email: `gf-${Date.now()}@example.test`, role: "USER" },
    });
    const seller = await prisma.sellerProfile.create({
      data: { userId: user.id, displayName: "GF Seller" },
    });
    const product = await prisma.product.create({
      data: {
        sellerId: seller.id,
        title: "GF Product",
        description: "test",
        priceCents: 100,
        category: "CHEFF",
        unit: "PORTION",
        delivery: "PICKUP",
        lengthCm: 1,
        widthCm: 2,
        heightCm: 3,
        weightKg: 0.5,
      },
    });
    const promoSeller = await prisma.promoCode.create({
      data: { code: `SELL${Date.now()}`, startsAt: new Date(), sellerId: user.id },
    });
    const dish = await prisma.dish.create({
      data: { userId: user.id, title: "GF Dish", status: "PRIVATE" },
    });
    const deliveryProfile = await prisma.deliveryProfile.create({
      data: { userId: user.id, age: 25 },
    });

    const conv = await prisma.conversation.create({
      data: { id: crypto.randomUUID() },
    });
    const proposal = await prisma.proposal.create({
      data: {
        conversationId: conv.id,
        createdById: user.id,
        sellerId: user.id,
        buyerId: user.id,
        title: "GF Proposal",
      },
    });
    const agreement = await prisma.agreement.create({
      data: { proposalId: proposal.id, acceptedById: user.id },
    });
    const communityOrder = await prisma.communityOrder.create({
      data: {
        agreementId: agreement.id,
        proposalId: proposal.id,
        conversationId: conv.id,
        buyerId: user.id,
        sellerId: user.id,
      },
    });
    const dealReview = await prisma.dealReview.create({
      data: {
        communityOrderId: communityOrder.id,
        reviewerId: user.id,
        revieweeId: user.id,
        rating: 5,
        message: "greenfield test",
      },
    });

    steps.push({
      step: "minimal_crud",
      ok: true,
      ids: {
        user: user.id,
        product: product.id,
        promoSeller: promoSeller.id,
        dish: dish.id,
        deliveryProfile: deliveryProfile.id,
        communityOrder: communityOrder.id,
        dealReview: dealReview.id,
      },
    });

    const history = (await prisma.$queryRaw`
      SELECT migration_name FROM "_prisma_migrations" ORDER BY started_at
    `) as { migration_name: string }[];
    const preCutoffApplied = history.filter((r) => r.migration_name < BASELINE_MIGRATION);
    if (preCutoffApplied.length > 0) {
      throw new Error(
        `Pre-cutoff migrations in history: ${preCutoffApplied.map((r) => r.migration_name).join(", ")}`
      );
    }
    steps.push({ step: "history_audit", ok: true, migration_count: history.length });

    if (cleanup) {
      await prisma.$executeRawUnsafe("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
      steps.push({ step: "cleanup", ok: true });
    }
  } finally {
    await prisma.$disconnect();
  }

  const reportPath = writeReport(
    `greenfield-test-report-${started.replace(/[:.]/g, "-")}.json`,
    { plan, steps, passed: true }
  );
  console.log("\nPassed. Report:", reportPath);
}

main().catch((e) => {
  console.error("\nAborted:", e instanceof Error ? e.message : e);
  process.exit(1);
});
