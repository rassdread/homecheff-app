/**
 * Phase 3A — Platform freeze + Feed compatibility boundary tests.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "../../..");

let passed = 0;
function ok(label: string) {
  passed += 1;
  console.log(`  ✓ ${label}`);
}

function walkTs(dir: string, skip = new Set(["tests", "node_modules"])): string[] {
  const out: string[] = [];
  if (!existsSync(dir)) return out;
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(ent.name)) continue;
    const p = join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walkTs(p, skip));
    else if (/\.(ts|tsx)$/.test(ent.name)) out.push(p);
  }
  return out;
}

function importLines(src: string): string[] {
  return src.split("\n").filter((l) => /^\s*import\b/.test(l));
}

console.log("\n[phase3a] platform contract artifacts");

{
  assert.ok(
    existsSync(
      join(root, "docs/architecture/homecheff-adaptive-workspace-platform-contract-v1.md"),
    ),
  );
  assert.ok(
    existsSync(
      join(root, "docs/audits/homecheff-adaptive-workspace-phase3a-feed-compatibility.md"),
    ),
  );
  assert.ok(
    existsSync(
      join(root, "docs/audits/homecheff-adaptive-workspace-phase3a-feed-inventory.json"),
    ),
  );
  assert.ok(
    existsSync(
      join(root, "docs/audits/homecheff-adaptive-workspace-phase2g-settings-on-freeze.md"),
    ),
  );
  const freeze = readFileSync(
    join(root, "docs/audits/homecheff-adaptive-workspace-phase2g-settings-on-freeze.md"),
    "utf8",
  );
  assert.match(freeze, /READY TO FREEZE SETTINGS ON PILOT/);
  const audit = readFileSync(
    join(root, "docs/audits/homecheff-adaptive-workspace-phase3a-feed-compatibility.md"),
    "utf8",
  );
  assert.match(audit, /READY FOR PHASE 3B WITH PRECONDITIONS/);
  assert.doesNotMatch(audit, /Feed Workspace Root|renderActivation\s*=\s*true/);
  ok("platform + audit + inventory + freeze record present");
}

console.log("\n[phase3a] inventory deterministic");

{
  const invPath = join(
    root,
    "docs/audits/homecheff-adaptive-workspace-phase3a-feed-inventory.json",
  );
  const raw = readFileSync(invPath, "utf8");
  const inv = JSON.parse(raw);
  assert.equal(inv.schemaVersion, 1);
  assert.equal(inv.proposedFirstWidget, "feed.discovery");
  assert.ok(Array.isArray(inv.components));
  assert.ok(inv.components.length >= 10);
  assert.deepEqual(JSON.parse(raw), inv);
  ok("inventory JSON parseable and stable");
}

console.log("\n[phase3a] pure core / settings renderer Feed-free");

{
  for (const file of walkTs(join(root, "lib/adaptive-workspace"))) {
    const src = readFileSync(file, "utf8");
    for (const line of importLines(src)) {
      assert.equal(
        /feed\/|GeoFeed|homeComposedLayout|@\/components\/feed/.test(line),
        false,
        `${file}: ${line}`,
      );
    }
  }
  ok("pure core has no Feed imports");
}

{
  const settingsFiles = [
    "components/adaptive-workspace/SettingsWorkspaceRoot.tsx",
    "components/adaptive-workspace/SettingsWorkspaceWidgetHost.tsx",
    "lib/adaptive-workspace-react/create-settings-initial-plan.ts",
    "lib/adaptive-workspace-react/validate-settings-render-plan.ts",
  ];
  for (const rel of settingsFiles) {
    const src = readFileSync(join(root, rel), "utf8");
    assert.equal(/GeoFeed|components\/feed|homeComposedLayout|\/api\/feed/.test(src), false, rel);
  }
  ok("Settings production path Feed-free");
}

console.log("\n[phase3a] Feed request identity isolated from Workspace");

{
  const feedLib = walkTs(join(root, "lib/feed"));
  const feedCmp = walkTs(join(root, "components/feed"));
  for (const file of [...feedLib, ...feedCmp]) {
    const src = readFileSync(file, "utf8");
    for (const line of importLines(src)) {
      assert.equal(
        /adaptive-workspace|WorkspaceProfile|WorkspaceLayoutPlan/.test(line),
        false,
        `${file}: ${line}`,
      );
    }
  }
  ok("Feed lib/components do not import Workspace");
}

{
  const geo = readFileSync(join(root, "components/feed/GeoFeed.tsx"), "utf8");
  assert.match(geo, /requestKey/);
  assert.equal(/from ['"]@\/lib\/adaptive-workspace/.test(geo), false);
  assert.equal(/WorkspaceProfile|primary-stage|statePreservationKey/.test(
    geo.split("requestKey").slice(0, 3).join(" "),
  ), false);
  ok("GeoFeed requestKey path not Workspace-coupled");
}

{
  const denylist = readFileSync(
    join(root, "lib/adaptive-workspace/types/workspace.ts"),
    "utf8",
  );
  assert.match(denylist, /requestKey/);
  assert.match(denylist, /nativePaintKey/);
  assert.match(denylist, /preparedBatches/);
  ok("Workspace denylist includes Feed identity keys");
}

console.log("\n[phase3a] no Feed Workspace activation in repo");

{
  const mode = existsSync(
    join(root, "lib/adaptive-workspace-react/feed-mode.ts"),
  );
  assert.equal(mode, false);
  assert.equal(
    existsSync(join(root, "components/adaptive-workspace/FeedWorkspaceRoot.tsx")),
    false,
  );
  assert.equal(
    existsSync(join(root, "components/adaptive-workspace/FeedWorkspaceShadowRoot.tsx")),
    false,
  );
  const page = readFileSync(join(root, "app/page.tsx"), "utf8");
  assert.equal(/SettingsWorkspaceRoot|adaptive-workspace|renderActivation/.test(page), false);
  const home = readFileSync(join(root, "components/home/HomePageClient.tsx"), "utf8");
  assert.equal(/adaptive-workspace|FeedWorkspace|renderActivation/.test(home), false);
  ok("no Feed modeconfig / Feed Workspace Root / homepage AW wiring");
}

console.log("\n[phase3a] single GeoFeed mount site on homepage");

{
  const home = readFileSync(join(root, "components/home/HomePageClient.tsx"), "utf8");
  const geoOpens = (home.match(/<GeoFeed\b/g) ?? []).length;
  assert.equal(geoOpens, 1);
  ok("HomePageClient renders exactly one GeoFeed JSX site");
}

console.log("\n[phase3a] Settings freeze invariants still encoded");

{
  const allow = readFileSync(
    join(root, "lib/adaptive-workspace-react/validate-settings-render-plan.ts"),
    "utf8",
  );
  assert.match(allow, /settings\.hub/);
  assert.match(allow, /notifications\./);
  const settingsMode = readFileSync(
    join(root, "lib/adaptive-workspace-react/settings-mode.ts"),
    "utf8",
  );
  assert.match(settingsMode, /HOMECHEFF_SETTINGS_WORKSPACE_MODE/);
  ok("Settings allowlist + mode env unchanged");
}

console.log(`\nadaptive-workspace Phase 3A: ${passed} assertions ok\n`);
