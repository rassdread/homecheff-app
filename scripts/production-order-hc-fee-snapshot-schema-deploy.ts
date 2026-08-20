/**
 * Isolated Production apply of 20260820140000_order_hc_fee_snapshot only.
 *
 *   HOMECHEFF_FEE_SNAPSHOT_SCHEMA_DEPLOY=po-approved-order-hc-fee-snapshot-20260820 \
 *   npx tsx scripts/production-order-hc-fee-snapshot-schema-deploy.ts
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const DEPLOY_TOKEN = "po-approved-order-hc-fee-snapshot-20260820";
const MIGRATION = "20260820140000_order_hc_fee_snapshot";
const SQL_PATH = `prisma/migrations/${MIGRATION}/migration.sql`;

function loadEnv(p: string) {
  const o: Record<string, string> = {};
  if (!existsSync(p)) return o;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    let v = m[2]!;
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    o[m[1]!] = v;
  }
  return o;
}

function forensicSql(sql: string) {
  const stripped = sql.replace(/--.*$/gm, "");
  const banned = [/\bDELETE\s+FROM\b/i, /\bUPDATE\s+"/i, /\bDROP\s+/i, /\bTRUNCATE\b/i, /\bINSERT\s+INTO\b/i];
  return { additiveOnly: banned.every((re) => !re.test(stripped)) };
}

function main() {
  if (process.env.HOMECHEFF_FEE_SNAPSHOT_SCHEMA_DEPLOY !== DEPLOY_TOKEN) {
    console.error("Refusing: missing deploy token");
    process.exit(2);
  }
  const fileEnv = { ...loadEnv(".env"), ...loadEnv(".env.local") };
  const url = fileEnv.DIRECT_URL || fileEnv.DATABASE_URL;
  if (!url || !existsSync(SQL_PATH)) {
    console.error("Missing DIRECT_URL/DATABASE_URL or SQL");
    process.exit(2);
  }
  const sql = readFileSync(SQL_PATH, "utf8");
  const forensic = forensicSql(sql);
  if (!forensic.additiveOnly) {
    console.error("SQL forensic failed");
    process.exit(2);
  }

  const env = { ...process.env, DATABASE_URL: url, DIRECT_URL: url };
  const exec = spawnSync(
    "npx",
    ["prisma", "db", "execute", "--file", SQL_PATH, "--schema", "prisma/schema.prisma"],
    { env, encoding: "utf8" },
  );
  if (exec.status !== 0) {
    console.error(exec.stdout, exec.stderr);
    process.exit(exec.status ?? 1);
  }
  const resolve = spawnSync("npx", ["prisma", "migrate", "resolve", "--applied", MIGRATION], {
    env,
    encoding: "utf8",
  });
  if (resolve.status !== 0) {
    console.error(resolve.stdout, resolve.stderr);
    process.exit(resolve.status ?? 1);
  }
  const checksum = createHash("sha256").update(sql).digest("hex");
  const report = {
    asOf: new Date().toISOString(),
    method: "prisma db execute additive SQL + prisma migrate resolve --applied (not migrate deploy)",
    checksum,
    forensic,
    executeStdout: `${exec.stdout ?? ""}\n${exec.stderr ?? ""}`.slice(-2000),
    resolveStdout: `${resolve.stdout ?? ""}\n${resolve.stderr ?? ""}`.slice(-2000),
    ok: true,
  };
  mkdirSync("docs/audits", { recursive: true });
  writeFileSync("docs/audits/homecheff-order-hc-fee-snapshot-production-migration.json", JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ ok: true, checksum }, null, 2));
}

main();
