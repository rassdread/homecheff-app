/**
 * Structural validator for Phase 2B Settings shadow integration.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function mustExist(rel: string) {
  assert.ok(existsSync(join(root, rel)), `missing ${rel}`);
}

mustExist("components/adaptive-workspace/SettingsWorkspaceShadowRoot.tsx");
mustExist("lib/adaptive-workspace-react/create-settings-resolve-input.ts");
mustExist("lib/adaptive-workspace-react/normalize-workspace-measurement.ts");
mustExist("docs/audits/homecheff-adaptive-workspace-phase2b-settings-shadow.md");

const shadow = readFileSync(
  join(root, "components/adaptive-workspace/SettingsWorkspaceShadowRoot.tsx"),
  "utf8",
);
assert.match(shadow, /renderActivation = false/);
assert.doesNotMatch(shadow, /modeOverride === ["']on["']/);
assert.doesNotMatch(shadow, /compatibilityMode:\s*["']on["']/);
assert.match(shadow, /ResizeObserver/);
assert.doesNotMatch(shadow, /addEventListener\(\s*['"]resize['"]/);

const page = readFileSync(join(root, "app/settings/page.tsx"), "utf8");
assert.match(page, /SettingsWorkspaceShadowRoot/);

const providers = readFileSync(join(root, "components/Providers.tsx"), "utf8");
assert.doesNotMatch(providers, /SettingsWorkspaceShadowRoot|WorkspaceProvider/);

console.log("validate-adaptive-workspace-settings-shadow: ok");
