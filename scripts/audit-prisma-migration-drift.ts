/**
 * Read-only Prisma migration drift audit.
 * Does NOT run migrate deploy/resolve/reset or any DDL.
 */
import { prisma } from "../lib/prisma";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

function sha256(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

function summarizeSql(sql: string): string {
  const lines = sql
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("--"));
  const keywords: string[] = [];
  for (const line of lines.slice(0, 20)) {
    const upper = line.toUpperCase();
    if (upper.startsWith("CREATE INDEX")) keywords.push(line.slice(0, 120));
    else if (upper.startsWith("CREATE TABLE")) keywords.push(`CREATE TABLE ${line.split(/\s+/)[2] ?? ""}`);
    else if (upper.startsWith("ALTER TABLE")) keywords.push(line.slice(0, 120));
    else if (upper.startsWith("DROP ")) keywords.push(line.slice(0, 120));
    else if (upper.startsWith("CREATE TYPE")) keywords.push(line.slice(0, 120));
    else if (upper.startsWith("INSERT INTO")) keywords.push(line.slice(0, 80));
  }
  return keywords.length ? keywords.join(" | ") : lines[0]?.slice(0, 120) ?? "(empty)";
}

type DbRow = {
  migration_name: string;
  started_at: Date;
  finished_at: Date | null;
  rolled_back_at: Date | null;
  applied_steps_count: number;
  checksum_hex: string;
  logs: string | null;
};

async function main() {
  const migrationsDir = path.join(process.cwd(), "prisma/migrations");
  const localEntries: {
    name: string;
    checksum: string;
    sqlBytes: number;
    isEmpty: boolean;
    hasConcurrently: boolean;
    isDestructive: boolean;
    summary: string;
    sortKey: string;
  }[] = [];

  for (const name of fs.readdirSync(migrationsDir).sort()) {
    const sqlPath = path.join(migrationsDir, name, "migration.sql");
    if (!fs.existsSync(sqlPath)) continue;
    const sql = fs.readFileSync(sqlPath, "utf8");
    const trimmed = sql.trim();
    const upper = sql.toUpperCase();
    localEntries.push({
      name,
      checksum: sha256(sql),
      sqlBytes: Buffer.byteLength(sql, "utf8"),
      isEmpty: trimmed.length === 0,
      hasConcurrently: upper.includes("CREATE INDEX CONCURRENTLY"),
      isDestructive: /\b(DROP\s+(TABLE|COLUMN|INDEX|TYPE)|TRUNCATE|DELETE\s+FROM)\b/i.test(sql),
      summary: summarizeSql(sql),
      sortKey: name,
    });
  }

  const dbRows = (await prisma.$queryRaw`
    SELECT
      migration_name,
      started_at,
      finished_at,
      rolled_back_at,
      applied_steps_count,
      checksum::text AS checksum_hex,
      logs
    FROM _prisma_migrations
    ORDER BY started_at
  `) as DbRow[];

  const localByName = new Map(localEntries.map((e) => [e.name, e]));
  const dbByName = new Map(dbRows.map((r) => [r.migration_name, r]));

  const classifications: Record<string, unknown>[] = [];

  const allNames = new Set([...localByName.keys(), ...dbByName.keys()]);
  for (const name of [...allNames].sort()) {
    const local = localByName.get(name);
    const db = dbByName.get(name);
    let status: string;
    if (local && db) {
      const localHex = local.checksum;
      const dbHex = db.checksum_hex;
      status =
        localHex === dbHex
          ? "local_and_db_checksum_match"
          : "local_and_db_checksum_mismatch";
    } else if (local && !db) {
      status = "local_only";
    } else if (!local && db) {
      status = "db_only";
    } else {
      status = "unknown";
    }

    if (db && db.rolled_back_at) status += "_rolled_back";
    if (db && !db.finished_at) status += "_failed";

    classifications.push({
      migration_name: name,
      status,
      local_checksum: local?.checksum ?? null,
      db_checksum: db?.checksum_hex ?? null,
      started_at: db?.started_at?.toISOString() ?? null,
      finished_at: db?.finished_at?.toISOString() ?? null,
      rolled_back_at: db?.rolled_back_at?.toISOString() ?? null,
      applied_steps_count: db?.applied_steps_count ?? null,
      local_summary: local?.summary ?? null,
      is_empty: local?.isEmpty ?? null,
      has_concurrently: local?.hasConcurrently ?? null,
      is_destructive: local?.isDestructive ?? null,
      logs: db?.logs && /error|fail/i.test(db.logs) ? db.logs.slice(0, 500) : null,
    });
  }

  const lastCommon = "20260709_phase13e_admin_p0";
  const afterCommon = localEntries.filter((e) => e.name > lastCommon);

  const dishIndex = (await prisma.$queryRaw`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE tablename = 'Dish' AND indexname = 'Dish_status_createdAt_idx'
  `) as { indexname: string; indexdef: string }[];

  const schemaChecks = {
    dish_index: dishIndex[0] ?? null,
    user_password_hash: (
      await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'User' AND column_name = 'passwordHash'
      `
    ) as unknown[],
    product_dimensions: (
      await prisma.$queryRaw`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'Product' AND column_name IN ('lengthCm', 'widthCm', 'heightCm', 'weightGrams')
        ORDER BY column_name
      `
    ) as unknown[],
    role_enum: (
      await prisma.$queryRaw`
        SELECT e.enumlabel
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = 'Role'
        ORDER BY e.enumsortorder
      `
    ) as { enumlabel: string }[],
    userrole_enum: (
      await prisma.$queryRaw`
        SELECT e.enumlabel
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = 'UserRole'
        ORDER BY e.enumsortorder
      `
    ) as { enumlabel: string }[],
    conversation_context_applied_steps: dbByName.get("20260705140000_conversation_context_layer")
      ?.applied_steps_count,
    schema_drift_from_prisma_diff: [
      "Product: lengthCm, widthCm, heightCm, weightKg exist in DB, missing in schema.prisma",
      "PromoCode: sellerId + nullable affiliateId in DB; schema has required affiliateId only",
      "PromoCode_sellerId_idx + FK exist in DB",
      "HcpCarouselSlide.updatedAt default minor drift",
    ],
    migrate_status_at_audit: "Database schema is up to date (62 local, 0 pending)",
  };

  const output = {
    generated_at: new Date().toISOString(),
    branch: "performance/phase2-baseline",
    migrate_status_note: "Run separately: npx prisma migrate status",
    summary: {
      local_count: localEntries.length,
      db_count: dbRows.length,
      match: classifications.filter((c) => c.status === "local_and_db_checksum_match").length,
      mismatch: classifications.filter((c) => c.status === "local_and_db_checksum_mismatch").length,
      local_only: classifications.filter((c) => c.status === "local_only").length,
      db_only: classifications.filter((c) => c.status === "db_only").length,
      rolled_back: classifications.filter((c) => String(c.status).includes("rolled_back")).length,
      failed: classifications.filter((c) => String(c.status).includes("failed")).length,
    },
    last_common_migration: lastCommon,
    local_migrations_after_common: afterCommon.map((e) => ({
      name: e.name,
      checksum: e.checksum,
      summary: e.summary,
      is_empty: e.isEmpty,
      has_concurrently: e.hasConcurrently,
    })),
    db_only_migrations: classifications.filter((c) => c.status === "db_only"),
    local_only_migrations: classifications.filter((c) => c.status === "local_only"),
    checksum_mismatches: classifications.filter((c) => c.status === "local_and_db_checksum_mismatch"),
    all_classifications: classifications,
    local_inventory: localEntries,
    db_records: dbRows.map((r) => ({
      migration_name: r.migration_name,
      started_at: r.started_at.toISOString(),
      finished_at: r.finished_at?.toISOString() ?? null,
      rolled_back_at: r.rolled_back_at?.toISOString() ?? null,
      applied_steps_count: r.applied_steps_count,
      checksum: r.checksum_hex,
      logs: r.logs && /error|fail/i.test(r.logs) ? r.logs.slice(0, 500) : null,
    })),
    schema_checks: schemaChecks,
  };

  const outPath = path.join(process.cwd(), "docs/audits/homecheff-prisma-migration-inventory.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output.summary, null, 2));
  console.log("db_only:", output.db_only_migrations.map((m) => m.migration_name));
  console.log("local_only:", output.local_only_migrations.map((m) => m.migration_name));
  console.log("Wrote", outPath);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
