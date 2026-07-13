/**
 * Read-only validator for Phase 9 current-state greenfield baseline.
 * No database connection required.
 *
 * Usage: npx tsx scripts/validate-current-state-baseline.ts
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = process.cwd();
const BASELINE_DIR = path.join(ROOT, "prisma/baseline-staging/20260713_current_state");
const SCHEMA_PATH = path.join(ROOT, "prisma/schema.prisma");
const BASELINE_SQL = path.join(BASELINE_DIR, "schema_baseline.sql");
const MATRIX_OUT = path.join(ROOT, "docs/audits/homecheff-prisma-phase9-object-matrix.json");

type Classification = "A" | "B" | "C" | "D" | "E";

type MatrixEntry = {
  name: string;
  kind: "model" | "enum" | "index" | "extension" | "other";
  classification: Classification;
  in_schema_prisma: boolean;
  in_baseline_sql: boolean;
  notes?: string;
};

const CRITICAL_INDEXES = ["Dish_status_createdAt_idx"];
const CRITICAL_COLUMNS: { table: string; column: string }[] = [
  { table: "Product", column: "lengthCm" },
  { table: "Product", column: "widthCm" },
  { table: "Product", column: "heightCm" },
  { table: "Product", column: "weightKg" },
  { table: "PromoCode", column: "sellerId" },
  { table: "PromoCode", column: "affiliateId" },
  { table: "AdminPermissions", column: "canViewOrdersTab" },
  { table: "AdminPermissions", column: "canViewVariabelenTab" },
  { table: "DeliveryProfile", column: "gpsTrackingEnabled" },
  { table: "User", column: "passwordHash" },
];

function parseSchemaModelsAndEnums(schema: string): { models: string[]; enums: string[] } {
  const models: string[] = [];
  const enums: string[] = [];
  for (const line of schema.split("\n")) {
    const m = line.match(/^model\s+(\w+)/);
    if (m) models.push(m[1]);
    const e = line.match(/^enum\s+(\w+)/);
    if (e) enums.push(e[1]);
  }
  return { models, enums };
}

function extractSqlTables(sql: string): Set<string> {
  const tables = new Set<string>();
  for (const m of sql.matchAll(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?(?:"public"\.)?"([^"]+)"/gi)) {
    tables.add(m[1]);
  }
  return tables;
}

function extractSqlEnums(sql: string): Set<string> {
  const enums = new Set<string>();
  for (const m of sql.matchAll(/CREATE TYPE\s+(?:"public"\.)?"([^"]+)"/gi)) {
    enums.add(m[1]);
  }
  return enums;
}

function extractSqlIndexes(sql: string): Set<string> {
  const indexes = new Set<string>();
  for (const m of sql.matchAll(/CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF NOT EXISTS\s+)?"([^"]+)"/gi)) {
    indexes.add(m[1]);
  }
  return indexes;
}

function hasDestructive(sql: string): string[] {
  const hits: string[] = [];
  const patterns = [
    /\bDROP\s+TABLE\b/i,
    /\bDROP\s+COLUMN\b/i,
    /\bTRUNCATE\b/i,
    /\bDELETE\s+FROM\b/i,
    /\bDROP\s+DATABASE\b/i,
  ];
  for (const p of patterns) {
    if (p.test(sql)) hits.push(p.source);
  }
  return hits;
}

function hasSecrets(sql: string): string[] {
  const hits: string[] = [];
  if (/sk_live_|sk_test_|AKIA[0-9A-Z]{16}|postgresql:\/\/[^@]+:[^@]+@/i.test(sql)) {
    hits.push("credential-like pattern");
  }
  if (/INSERT\s+INTO\s+"User"/i.test(sql) && !sql.includes("system_seed.sql")) {
    // schema_baseline should be DDL only
    if (/INSERT\s+INTO/i.test(sql)) hits.push("INSERT in schema_baseline.sql");
  }
  return hits;
}

function columnInCreateTable(sql: string, table: string, column: string): boolean {
  const re = new RegExp(
    `CREATE TABLE\\s+(?:"public"\\.)?"${table}"[\\s\\S]*?"${column}"`,
    "i"
  );
  return re.test(sql);
}

function sha256(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

function main(): number {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!fs.existsSync(BASELINE_SQL)) {
    console.error(`Missing ${BASELINE_SQL}`);
    return 1;
  }

  const schema = fs.readFileSync(SCHEMA_PATH, "utf8");
  const sql = fs.readFileSync(BASELINE_SQL, "utf8");
  const { models, enums } = parseSchemaModelsAndEnums(schema);
  const sqlTables = extractSqlTables(sql);
  const sqlEnums = extractSqlEnums(sql);
  const sqlIndexes = extractSqlIndexes(sql);

  const matrix: MatrixEntry[] = [];

  for (const model of models) {
    const inSql = sqlTables.has(model);
    matrix.push({
      name: model,
      kind: "model",
      classification: inSql ? "A" : "E",
      in_schema_prisma: true,
      in_baseline_sql: inSql,
      notes: inSql ? undefined : "missing CREATE TABLE in baseline",
    });
    if (!inSql) errors.push(`Model ${model} missing in baseline SQL`);
  }

  for (const en of enums) {
    const inSql = sqlEnums.has(en);
    matrix.push({
      name: en,
      kind: "enum",
      classification: inSql ? "A" : "E",
      in_schema_prisma: true,
      in_baseline_sql: inSql,
    });
    if (!inSql) errors.push(`Enum ${en} missing in baseline SQL`);
  }

  for (const idx of CRITICAL_INDEXES) {
    const inSql = sqlIndexes.has(idx) || sql.includes(idx);
    matrix.push({
      name: idx,
      kind: "index",
      classification: inSql ? "A" : "E",
      in_schema_prisma: true,
      in_baseline_sql: inSql,
      notes: "Feed performance index",
    });
    if (!inSql) errors.push(`Critical index ${idx} missing`);
  }

  for (const { table, column } of CRITICAL_COLUMNS) {
    const ok = columnInCreateTable(sql, table, column);
    matrix.push({
      name: `${table}.${column}`,
      kind: "other",
      classification: ok ? "A" : "E",
      in_schema_prisma: true,
      in_baseline_sql: ok,
    });
    if (!ok) errors.push(`Critical column ${table}.${column} missing in CREATE TABLE`);
  }

  // Non-Prisma objects (classification)
  matrix.push({
    name: "pg_trgm / postgis / custom functions",
    kind: "extension",
    classification: "E",
    in_schema_prisma: false,
    in_baseline_sql: false,
    notes: "Not in Prisma schema — verify on live DB if needed (nader onderzoek)",
  });

  const destructive = hasDestructive(sql);
  if (destructive.length) errors.push(`Destructive SQL patterns: ${destructive.join(", ")}`);

  const secrets = hasSecrets(sql);
  if (secrets.length) errors.push(`Secret/data patterns in baseline: ${secrets.join(", ")}`);

  // PromoCode affiliate nullable check
  const promoBlock = sql.match(/CREATE TABLE\s+(?:"public"\.)?"PromoCode"[\s\S]*?\);/i)?.[0] ?? "";
  if (promoBlock.includes('"affiliateId" TEXT,') || promoBlock.includes('"affiliateId" TEXT\n')) {
    matrix.push({
      name: "PromoCode.affiliateId nullable",
      kind: "other",
      classification: "A",
      in_schema_prisma: true,
      in_baseline_sql: true,
    });
  } else if (promoBlock.includes('"affiliateId" TEXT NOT NULL')) {
    errors.push("PromoCode.affiliateId should be nullable in baseline");
  }

  const report = {
    generated_at: new Date().toISOString(),
    baseline_version: "20260713_current_state",
    baseline_sql_bytes: Buffer.byteLength(sql, "utf8"),
    baseline_sql_checksum: sha256(sql),
    schema_model_count: models.length,
    schema_enum_count: enums.length,
    baseline_table_count: sqlTables.size,
    baseline_enum_count: sqlEnums.size,
    baseline_index_count: sqlIndexes.size,
    matrix,
    classification_legend: {
      A: "vereist in baseline",
      B: "applicatie-optioneel",
      C: "production-only infrastructure",
      D: "legacy niet nodig",
      E: "nader onderzoek / niet in Prisma",
    },
    validation: {
      errors,
      warnings,
      passed: errors.length === 0,
    },
  };

  fs.mkdirSync(path.dirname(MATRIX_OUT), { recursive: true });
  fs.writeFileSync(MATRIX_OUT, JSON.stringify(report, null, 2));

  console.log("Phase 9 baseline validator\n");
  console.log(`Models: ${models.length} | Enums: ${enums.length}`);
  console.log(`Baseline tables: ${sqlTables.size} | enums: ${sqlEnums.size} | indexes: ${sqlIndexes.size}`);
  console.log(`Checksum: ${report.baseline_sql_checksum.slice(0, 16)}…`);
  console.log(`Wrote ${MATRIX_OUT}\n`);

  if (errors.length) {
    for (const e of errors) console.error(`✗ ${e}`);
    return 1;
  }
  console.log("✓ All baseline validation checks passed");
  return 0;
}

process.exit(main());
