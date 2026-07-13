/**
 * Phase 9C — Build archive-promote manifest (read-only, no file moves).
 * Usage: npx tsx scripts/simulate-archive-promote.ts [--write-manifest]
 */
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execSync } from "node:child_process";

const ROOT = process.cwd();
const CONFIG_PATH = path.join(ROOT, "prisma/migration-tracks.config.json");
const MIGRATIONS_DIR = path.join(ROOT, "prisma/migrations");
const BASELINE_STAGING = path.join(ROOT, "prisma/baseline-staging/20260713_current_state");
const MANIFEST_OUT = path.join(ROOT, "docs/audits/homecheff-prisma-phase9c-archive-manifest.json");
const SIM_REPORT_OUT = path.join(ROOT, "docs/audits/homecheff-prisma-phase9c-simulate-report.json");

const TIMESTAMP_PATTERN = /^20[0-9]{12}_[a-z0-9_]+$/i;
const LEGACY_UNPREFIXED = new Set([
  "add_admin_preferences.sql",
  "add_delivery_countdown_fields.sql",
  "add_delivery_online_status.sql",
  "add_dish_reviews",
  "add_notification_order_fields.sql",
  "add_social_onboarding.sql",
  "add_tab_permissions.sql",
  "add_user_online_status.sql",
  "manual_add_stock_reservation.sql",
]);

/** Absorbed into baseline SQL per manifest.json includes */
const ABSORBED_IN_BASELINE = new Set([
  "20260713_dish_status_created_at_feed_index",
  "add_dish_reviews",
]);

type Config = {
  cutoff: { date: string; baseline_migration_name: string };
  tracks: { shared: { archive_dir: string } };
};

type MigrationEntry = {
  name: string;
  category: "A_pre_cutoff_historical" | "B_baseline_promote" | "C_post_cutoff_active" | "D_uncertain_blocker";
  category_reason: string;
  checksum_sha256: string;
  sql_bytes: number;
  has_valid_timestamp: boolean;
  lexicographic_vs_baseline: "before" | "after" | "equal" | "n/a";
};

function loadConfig(): Config {
  return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8")) as Config;
}

function sha256File(file: string): string {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function listLooseSqlFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((n) => n.endsWith(".sql") && fs.statSync(path.join(dir, n)).isFile())
    .sort();
}

function listMigrations(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((n) => fs.existsSync(path.join(dir, n, "migration.sql")))
    .sort();
}

function classify(name: string, baseline: string): Pick<MigrationEntry, "category" | "category_reason" | "has_valid_timestamp" | "lexicographic_vs_baseline"> {
  const hasValidTs = TIMESTAMP_PATTERN.test(name);
  const lex =
    name === baseline
      ? "equal"
      : name < baseline
        ? "before"
        : name > baseline
          ? "after"
          : "n/a";

  if (name === baseline) {
    return {
      category: "B_baseline_promote",
      category_reason: "current-state baseline from staging promote-to-migrations",
      has_valid_timestamp: hasValidTs,
      lexicographic_vs_baseline: lex,
    };
  }

  if (ABSORBED_IN_BASELINE.has(name)) {
    return {
      category: "A_pre_cutoff_historical",
      category_reason: "semantic pre-cutoff; DDL absorbed in baseline SQL",
      has_valid_timestamp: hasValidTs,
      lexicographic_vs_baseline: lex,
    };
  }

  if (LEGACY_UNPREFIXED.has(name)) {
    return {
      category: "D_uncertain_blocker",
      category_reason:
        "legacy unprefixed name sorts lexicographically after baseline — MUST archive explicitly, not via cutoff string compare alone",
      has_valid_timestamp: false,
      lexicographic_vs_baseline: lex,
    };
  }

  if (name < baseline) {
    return {
      category: "A_pre_cutoff_historical",
      category_reason: "folder name lexicographically before baseline cutoff",
      has_valid_timestamp: hasValidTs,
      lexicographic_vs_baseline: lex,
    };
  }

  if (name > baseline && hasValidTs) {
    return {
      category: "C_post_cutoff_active",
      category_reason: "valid timestamp and lexicographically after baseline",
      has_valid_timestamp: true,
      lexicographic_vs_baseline: lex,
    };
  }

  return {
    category: "D_uncertain_blocker",
    category_reason: "does not match archive heuristic — manual review required",
    has_valid_timestamp: hasValidTs,
    lexicographic_vs_baseline: lex,
  };
}

function findDuplicateTimestamps(names: string[]): string[] {
  const byPrefix = new Map<string, string[]>();
  for (const n of names) {
    const m = n.match(/^(20[0-9]{12})/);
    if (!m) continue;
    const p = m[1];
    if (!byPrefix.has(p)) byPrefix.set(p, []);
    byPrefix.get(p)!.push(n);
  }
  return [...byPrefix.entries()].filter(([, v]) => v.length > 1).map(([k, v]) => `${k}: ${v.join(", ")}`);
}

function buildManifest(): object {
  const config = loadConfig();
  const baseline = config.cutoff.baseline_migration_name;
  const active = listMigrations(MIGRATIONS_DIR);
  const baselinePreview = path.join(
    BASELINE_STAGING,
    "promote-to-migrations",
    baseline,
    "migration.sql"
  );

  const entries: MigrationEntry[] = active.map((name) => {
    const sqlPath = path.join(MIGRATIONS_DIR, name, "migration.sql");
    const classified = classify(name, baseline);
    return {
      name,
      ...classified,
      checksum_sha256: sha256File(sqlPath),
      sql_bytes: fs.statSync(sqlPath).size,
    };
  });

  const baselineEntry: MigrationEntry = {
    name: baseline,
    category: "B_baseline_promote",
    category_reason: "promoted from prisma/baseline-staging/.../promote-to-migrations/",
    checksum_sha256: fs.existsSync(baselinePreview) ? sha256File(baselinePreview) : "missing",
    sql_bytes: fs.existsSync(baselinePreview) ? fs.statSync(baselinePreview).size : 0,
    has_valid_timestamp: TIMESTAMP_PATTERN.test(baseline),
    lexicographic_vs_baseline: "equal",
  };

  const looseSql = listLooseSqlFiles(MIGRATIONS_DIR);
  const looseEntries = looseSql.map((name) => {
    const sqlPath = path.join(MIGRATIONS_DIR, name);
    return {
      name,
      kind: "loose_sql_file" as const,
      category: "D_uncertain_blocker" as const,
      category_reason:
        "loose .sql file in migrations root (not a Prisma migration folder) — must relocate to archive/docs during promote",
      checksum_sha256: sha256File(sqlPath),
      sql_bytes: fs.statSync(sqlPath).size,
      has_valid_timestamp: false,
      lexicographic_vs_baseline: (name < baseline ? "before" : "after") as "before" | "after",
    };
  });

  const archiveA = entries.filter((e) => e.category === "A_pre_cutoff_historical");
  const archiveD = [
    ...entries.filter((e) => e.category === "D_uncertain_blocker"),
    ...looseEntries,
  ];
  const postCutoffC = entries.filter((e) => e.category === "C_post_cutoff_active");

  const allArchiveNames = [...archiveA, ...archiveD, ...entries].map((e) => e.name);
  const duplicateNames = allArchiveNames.filter((n, i, a) => a.indexOf(n) !== i);
  const duplicateTimestamps = findDuplicateTimestamps(active);

  const afterPromoteActive = [baseline].sort();
  const afterPromoteArchive = [...active].sort();

  const preCutoffSorted = [...archiveA, ...archiveD].map((e) => e.name).sort();

  return {
    generated_at: new Date().toISOString(),
    phase: "9C",
    cutoff_date: config.cutoff.date,
    baseline_migration_name: baseline,
    summary: {
      current_active_folder_count: active.length,
      loose_sql_files_in_migrations_root: looseSql.length,
      category_A_pre_cutoff: archiveA.length,
      category_B_baseline: 1,
      category_C_post_cutoff: postCutoffC.length,
      category_D_uncertain: archiveD.length,
      after_promote_active_count: afterPromoteActive.length,
      after_promote_archive_folder_count: afterPromoteArchive.length,
      after_promote_relocate_loose_sql_count: looseSql.length,
    },
    first_pre_cutoff: preCutoffSorted[0] ?? null,
    last_pre_cutoff_semantic: "add_dish_reviews",
    last_pre_cutoff_lex: preCutoffSorted[preCutoffSorted.length - 1] ?? null,
    migrations_after_cutoff_timestamp: active.filter((n) => n.startsWith("20260714") || n.startsWith("20260715")),
    invalid_timestamp_format: active.filter((n) => !TIMESTAMP_PATTERN.test(n)),
    loose_sql_files: looseEntries,
    duplicate_folder_names: duplicateNames,
    duplicate_timestamp_prefixes: duplicateTimestamps,
    entries: entries.sort((a, b) => a.name.localeCompare(b.name)),
    baseline_promote: baselineEntry,
    virtual_after_promote: {
      active_root: config.tracks.shared.migrations_dir,
      active_migrations: afterPromoteActive,
      archive_root: config.tracks.shared.archive_dir,
      archive_migrations: active.sort(),
      file_count_preserved: afterPromoteArchive.length === active.length,
      notes: [
        "All 62 current folders → archive",
        `${looseSql.length} loose .sql files in migrations root → archive/docs (D-class)`,
        "Baseline folder promoted from staging",
        "add_dish_reviews folder absorbed in baseline — archive explicitly",
        "No C-class folder migrations remain after promote",
      ],
    },
    blockers: [
      ...(looseSql.length > 0
        ? [`${looseSql.length} loose .sql files in prisma/migrations/ must be relocated during promote`]
        : []),
      ...(postCutoffC.length > 0
        ? [`${postCutoffC.length} unexpected C-class folders — verify before promote`]
        : []),
    ],
  };
}

function simulateFilesystem(manifest: ReturnType<typeof buildManifest> & { virtual_after_promote: { active_migrations: string[]; archive_migrations: string[] } }): object {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "hc-phase9c-sim-"));
  const simMigrations = path.join(tmp, "prisma", "migrations");
  const simArchive = path.join(tmp, "prisma", "migrations-archive", "pre-20260714-greenfield");
  fs.mkdirSync(simMigrations, { recursive: true });
  fs.mkdirSync(simArchive, { recursive: true });

  const config = loadConfig();
  const baseline = config.cutoff.baseline_migration_name;
  const sourceBaseline = path.join(
    BASELINE_STAGING,
    "promote-to-migrations",
    baseline,
    "migration.sql"
  );
  const baselineDir = path.join(simMigrations, baseline);
  fs.mkdirSync(baselineDir, { recursive: true });
  fs.copyFileSync(sourceBaseline, path.join(baselineDir, "migration.sql"));
  fs.copyFileSync(
    path.join(MIGRATIONS_DIR, "migration_lock.toml"),
    path.join(simMigrations, "migration_lock.toml")
  );

  let archived = 0;
  for (const name of manifest.virtual_after_promote.archive_migrations as string[]) {
    const src = path.join(MIGRATIONS_DIR, name);
    const dst = path.join(simArchive, name);
    fs.mkdirSync(dst, { recursive: true });
    fs.copyFileSync(path.join(src, "migration.sql"), path.join(dst, "migration.sql"));
    archived++;
  }

  const activeNames = listMigrations(simMigrations);
  const checksumsPreserved = (manifest.entries as MigrationEntry[]).every((e) => {
    const archivedSql = path.join(simArchive, e.name, "migration.sql");
    if (!fs.existsSync(archivedSql)) return false;
    return sha256File(archivedSql) === e.checksum_sha256;
  });

  fs.writeFileSync(
    path.join(simArchive, "README.md"),
    "# Archived pre-20260714-greenfield migrations\n\nRead-only Phase 9C simulation copy.\n"
  );

  const checks = {
    tmp_dir: tmp,
    active_count: activeNames.length,
    archive_count: listMigrations(simArchive).length,
    baseline_is_first: activeNames[0] === baseline,
    no_pre_cutoff_in_active: activeNames.every((n) => n >= baseline),
    all_source_files_accounted: archived === (manifest.summary as { current_active_folder_count: number }).current_active_folder_count,
    checksums_preserved: checksumsPreserved,
    git_history_note: "git mv preserves history; simulation uses copyFileSync only in /tmp",
  };

  try {
    fs.rmSync(tmp, { recursive: true, force: true });
  } catch {
    // ignore cleanup errors
  }

  return checks;
}

function main(): number {
  const writeManifest = process.argv.includes("--write-manifest");
  const manifest = buildManifest();

  const fsSim = simulateFilesystem(
    manifest as ReturnType<typeof buildManifest> & {
      virtual_after_promote: { active_migrations: string[]; archive_migrations: string[] };
    }
  );

  const report = { manifest_summary: (manifest as { summary: object }).summary, filesystem_simulation: fsSim };

  if (writeManifest) {
    fs.mkdirSync(path.dirname(MANIFEST_OUT), { recursive: true });
    fs.writeFileSync(MANIFEST_OUT, JSON.stringify(manifest, null, 2));
    fs.writeFileSync(SIM_REPORT_OUT, JSON.stringify(report, null, 2));
    console.log("Wrote", MANIFEST_OUT);
    console.log("Wrote", SIM_REPORT_OUT);
  }

  console.log(JSON.stringify(report, null, 2));
  const blockers = (manifest as { blockers: string[] }).blockers;
  if (blockers.length > 0) {
    console.warn("\nBlockers:", blockers.join("; "));
  }
  return fsSim.baseline_is_first && fsSim.checksums_preserved ? 0 : 1;
}

process.exit(main());
