/**
 * Structural validator for Phase 2C chrome occupancy adapters.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function mustExist(rel: string) {
  assert.ok(existsSync(join(root, rel)), `missing ${rel}`);
}

mustExist("lib/adaptive-workspace-react/chrome-occupancy-types.ts");
mustExist("lib/adaptive-workspace-react/build-chrome-occupancy.ts");
mustExist("lib/adaptive-workspace-react/usable-space-from-occupancy.ts");
mustExist("docs/audits/homecheff-adaptive-workspace-phase2c-chrome-occupancy.md");

const build = readFileSync(
  join(root, "lib/adaptive-workspace-react/build-chrome-occupancy.ts"),
  "utf8",
);
assert.doesNotMatch(build, /resolveWorkspaceLayout|WorkspaceLayoutPlan|WorkspaceProfile/);
assert.doesNotMatch(build, /from\s+['"]@\/lib\/adaptive-workspace['"]/);

const usable = readFileSync(
  join(root, "lib/adaptive-workspace-react/usable-space-from-occupancy.ts"),
  "utf8",
);
assert.match(usable, /usableDimensionsFromContainerFirst/);
assert.match(usable, /double-subtract|Ignore occupancy|ignore occupancy/i);

const create = readFileSync(
  join(root, "lib/adaptive-workspace-react/create-settings-resolve-input.ts"),
  "utf8",
);
assert.match(create, /chromeOccupancy/);
assert.match(create, /usableDimensionsFromContainerFirst/);
assert.match(create, /MODEL A|container-first/i);

const shadow = readFileSync(
  join(root, "components/adaptive-workspace/SettingsWorkspaceShadowRoot.tsx"),
  "utf8",
);
assert.match(shadow, /buildChromeOccupancySnapshot|chromeOccupancyOverride/);
assert.match(shadow, /data-aw-chrome-/);
assert.match(shadow, /renderActivation = false/);
assert.doesNotMatch(shadow, /compatibilityMode:\s*["']on["']/);
assert.doesNotMatch(shadow, /addEventListener\(\s*['"]resize['"]/);

const providers = readFileSync(join(root, "components/Providers.tsx"), "utf8");
assert.doesNotMatch(providers, /WorkspaceProvider|AppChromeOccupancyProvider|SettingsWorkspaceShadowRoot/);

for (const rel of [
  "lib/adaptive-workspace-react/build-chrome-occupancy.ts",
  "lib/adaptive-workspace-react/create-settings-resolve-input.ts",
  "components/adaptive-workspace/SettingsWorkspaceShadowRoot.tsx",
]) {
  const src = readFileSync(join(root, rel), "utf8");
  assert.doesNotMatch(src, /GeoFeed|homeComposedLayout|components\/feed/);
}

console.log("validate-adaptive-workspace-chrome-occupancy: ok");
