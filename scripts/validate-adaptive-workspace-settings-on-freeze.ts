/**
 * Structural validator — Phase 2G Settings ON freeze readiness artifacts.
 * Does not invent READY; requires freeze record + browser evidence JSON.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function mustExist(rel: string) {
  assert.ok(existsSync(join(root, rel)), `missing ${rel}`);
}

mustExist("docs/audits/homecheff-adaptive-workspace-phase2g-settings-on-freeze.md");
mustExist("docs/audits/artifacts/phase2g/phase2g-browser-on.json");
mustExist("docs/audits/artifacts/phase2g/phase2g-browser-shadow.json");
mustExist("docs/audits/artifacts/phase2g/phase2g-browser-off.json");
mustExist("docs/audits/artifacts/phase2g/phase2g-browser-invalid.json");
mustExist("scripts/probe-settings-workspace-on-phase2g.mjs");
mustExist("app/aw-settings-harness/page.tsx");
mustExist("components/adaptive-workspace/SettingsWorkspaceRoot.tsx");

const freeze = readFileSync(
  join(root, "docs/audits/homecheff-adaptive-workspace-phase2g-settings-on-freeze.md"),
  "utf8",
);
assert.match(freeze, /READY TO FREEZE SETTINGS ON PILOT/);
assert.match(freeze, /HOMECHEFF_SETTINGS_WORKSPACE_MODE/);
assert.match(freeze, /rollback/i);
assert.doesNotMatch(freeze, /NOT READY TO FREEZE SETTINGS ON PILOT/);

const modeSrc = readFileSync(
  join(root, "lib/adaptive-workspace-react/settings-mode.ts"),
  "utf8",
);
assert.match(modeSrc, /HOMECHEFF_SETTINGS_WORKSPACE_MODE/);
assert.doesNotMatch(modeSrc, /\blocalStorage\.|\bsessionStorage\.|document\.cookie/);

const allow = readFileSync(
  join(root, "lib/adaptive-workspace-react/validate-settings-render-plan.ts"),
  "utf8",
);
assert.match(allow, /settings\.hub/);
assert.match(allow, /notifications\./);
assert.match(allow, /messages\./);

const rootCmp = readFileSync(
  join(root, "components/adaptive-workspace/SettingsWorkspaceRoot.tsx"),
  "utf8",
);
assert.equal(/\bkey=\{[^}]*profile/.test(rootCmp), false);
assert.doesNotMatch(rootCmp, /WorkspaceProvider|createContext\(/);

const harness = readFileSync(join(root, "app/aw-settings-harness/page.tsx"), "utf8");
assert.match(harness, /HOMECHEFF_AW_SETTINGS_HARNESS/);
assert.match(harness, /notFound/);
assert.doesNotMatch(harness, /<main[\s>]/);

for (const name of ["on", "shadow", "off", "invalid"] as const) {
  const report = JSON.parse(
    readFileSync(
      join(root, `docs/audits/artifacts/phase2g/phase2g-browser-${name}.json`),
      "utf8",
    ),
  );
  assert.equal(report.pass, true, `${name} browser evidence must pass`);
  assert.equal(report.summary?.hydrationOk, true);
  assert.equal(report.summary?.isolationOk, true);
  assert.equal(report.summary?.modeOk, true);
}

const providers = readFileSync(join(root, "components/Providers.tsx"), "utf8");
assert.doesNotMatch(providers, /SettingsWorkspaceRoot|WorkspaceProvider/);

console.log("validate-adaptive-workspace-settings-on-freeze: ok");
