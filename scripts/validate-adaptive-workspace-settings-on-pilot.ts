/**
 * Structural validator — Phase 2F Settings Controlled ON Pilot.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function mustExist(rel: string) {
  assert.ok(existsSync(join(root, rel)), `missing ${rel}`);
}

mustExist("components/adaptive-workspace/SettingsWorkspaceRoot.tsx");
mustExist("components/adaptive-workspace/WorkspaceRegion.tsx");
mustExist("components/adaptive-workspace/WorkspaceSlot.tsx");
mustExist("components/adaptive-workspace/WorkspacePanel.tsx");
mustExist("components/adaptive-workspace/SettingsWorkspaceWidgetHost.tsx");
mustExist("lib/adaptive-workspace-react/settings-mode.ts");
mustExist("lib/adaptive-workspace-react/create-settings-initial-plan.ts");
mustExist("lib/adaptive-workspace-react/validate-settings-render-plan.ts");
mustExist("docs/audits/homecheff-adaptive-workspace-phase2f-settings-on-pilot.md");
mustExist("scripts/validate-adaptive-workspace-settings-on-pilot.ts");

const modeSrc = readFileSync(
  join(root, "lib/adaptive-workspace-react/settings-mode.ts"),
  "utf8",
);
assert.match(modeSrc, /HOMECHEFF_SETTINGS_WORKSPACE_MODE/);
assert.match(modeSrc, /"off"\s*\|\s*"shadow"\s*\|\s*"on"/);
assert.match(modeSrc, /invalid-fail-closed/);
assert.doesNotMatch(modeSrc, /\blocalStorage\.|\bsessionStorage\.|document\.cookie/);
assert.doesNotMatch(modeSrc, /URLSearchParams|searchParams\.get/);

const allow = readFileSync(
  join(root, "lib/adaptive-workspace-react/validate-settings-render-plan.ts"),
  "utf8",
);
assert.match(allow, /settings\.hub/);
assert.match(allow, /FORBIDDEN_WIDGET|forbidden widget/i);
assert.match(allow, /notifications\./);
assert.match(allow, /messages\./);

const initial = readFileSync(
  join(root, "lib/adaptive-workspace-react/create-settings-initial-plan.ts"),
  "utf8",
);
assert.match(initial, /schemaVersion/);
assert.match(initial, /settings\.hub/);
assert.match(initial, /primary-stage/);
assert.doesNotMatch(initial, /Date\.now|Math\.random/);

const rootCmp = readFileSync(
  join(root, "components/adaptive-workspace/SettingsWorkspaceRoot.tsx"),
  "utf8",
);
assert.match(rootCmp, /mode === "off" \|\| mode === "shadow"/);
assert.match(rootCmp, /SettingsWorkspaceOnRoot|data-aw-settings-on-root/);
assert.match(rootCmp, /compatibilityMode:\s*["']on["']/);
assert.doesNotMatch(rootCmp, /WorkspaceProvider|createContext\(/);
assert.doesNotMatch(rootCmp, /display:\s*none/);
assert.equal(/\bkey=\{[^}]*profile/.test(rootCmp), false);

const host = readFileSync(
  join(root, "components/adaptive-workspace/SettingsWorkspaceWidgetHost.tsx"),
  "utf8",
);
assert.match(host, /settings\.hub/);
assert.doesNotMatch(host, /lazy\(|import\(/);

const page = readFileSync(join(root, "app/settings/page.tsx"), "utf8");
assert.match(page, /SettingsWorkspaceRoot/);
assert.match(page, /resolveSettingsWorkspaceMode/);
assert.match(page, /mode=\{settingsWorkspaceMode\}/);
assert.equal((page.match(/<SettingsHubClient\b/g) ?? []).length, 1);

const providers = readFileSync(join(root, "components/Providers.tsx"), "utf8");
assert.doesNotMatch(providers, /SettingsWorkspaceRoot|WorkspaceProvider/);

const report = readFileSync(
  join(root, "docs/audits/homecheff-adaptive-workspace-phase2f-settings-on-pilot.md"),
  "utf8",
);
assert.match(report, /rollback|ROLLBACK/i);
assert.match(report, /HOMECHEFF_SETTINGS_WORKSPACE_MODE/);
assert.match(report, /SHADOW|shadow/);

console.log("validate-adaptive-workspace-settings-on-pilot: ok");
