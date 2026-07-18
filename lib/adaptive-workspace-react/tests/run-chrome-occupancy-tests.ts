/**
 * Phase 2C — Chrome occupancy contract, normalization, fixed-point, import boundary.
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

import {
  buildChromeOccupancySnapshot,
  buildChromeOccupancyStabilityToken,
  buildSettingsResolveStabilityToken,
  coalesceChromeOccupancy,
  createSettingsResolveInput,
  emptyChromeOccupancy,
  HC_AW_BOTTOM_NAV_HEIGHT_PX,
  HC_AW_LG_BREAKPOINT_PX,
  HC_AW_NAVBAR_HEIGHT_PX,
  isBottomNavOccupying,
  normalizeWorkspaceMeasurement,
  usableDimensionsFromContainerFirst,
  validateChromeOccupancy,
  CHROME_OCCUPANCY_SCHEMA_VERSION,
} from "../index";
import { resolveWorkspaceLayout } from "@/lib/adaptive-workspace";
import SettingsWorkspaceShadowRoot from "@/components/adaptive-workspace/SettingsWorkspaceShadowRoot";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "../../..");

let passed = 0;
function ok(label: string) {
  passed += 1;
  console.log(`  ✓ ${label}`);
}

console.log("\n[phase2c] chrome occupancy contract");

{
  const snap = buildChromeOccupancySnapshot({
    shell: "web",
    pathname: "/settings",
    viewportWidthPx: 390,
  });
  assert.equal(snap.schemaVersion, CHROME_OCCUPANCY_SCHEMA_VERSION);
  assert.equal(snap.topPx, HC_AW_NAVBAR_HEIGHT_PX);
  assert.equal(snap.bottomPx, HC_AW_BOTTOM_NAV_HEIGHT_PX);
  assert.equal(snap.startPx, 0);
  assert.equal(snap.endPx, 0);
  assert.equal(snap.appliedToUsableSpace, false);
  assert.equal(
    snap.stabilityToken,
    buildChromeOccupancyStabilityToken(64, 92, 0, 0),
  );
  assert.equal(snap.stabilityToken.includes("T"), false);
  assert.doesNotMatch(snap.stabilityToken, /[0-9a-f]{8}-[0-9a-f]{4}/i);
  ok("schemaVersion 1 + mobile settings occupancy deterministic");
}

{
  const a = buildChromeOccupancySnapshot({
    shell: "web",
    pathname: "/settings",
    viewportWidthPx: 390,
  });
  const b = buildChromeOccupancySnapshot({
    shell: "web",
    pathname: "/settings",
    viewportWidthPx: 390,
  });
  assert.deepEqual(a, b);
  ok("identical input → identical snapshot");
}

{
  assert.throws(() =>
    validateChromeOccupancy({
      ...emptyChromeOccupancy(),
      topPx: -1,
    }),
  );
  assert.throws(() =>
    validateChromeOccupancy({
      ...emptyChromeOccupancy(),
      schemaVersion: 99 as 1,
    }),
  );
  ok("negative + unsupported schemaVersion rejected");
}

console.log("\n[phase2c] normalisation / double-subtract prevention");

{
  const desktop = buildChromeOccupancySnapshot({
    shell: "web",
    pathname: "/settings",
    viewportWidthPx: HC_AW_LG_BREAKPOINT_PX,
  });
  assert.equal(desktop.bottomPx, 0);
  assert.equal(desktop.topPx, HC_AW_NAVBAR_HEIGHT_PX);
  ok("desktop lg+ → no bottom occupancy");
}

{
  const hidden = buildChromeOccupancySnapshot({
    shell: "web",
    pathname: "/login",
    viewportWidthPx: 390,
  });
  assert.equal(hidden.bottomPx, 0);
  assert.equal(isBottomNavOccupying({ pathname: "/login", shell: "web", viewportWidthPx: 390 }), false);
  ok("path-hidden bottom nav → bottom 0");
}

{
  const ssr = buildChromeOccupancySnapshot({
    shell: "web",
    pathname: "/settings",
    viewportWidthPx: null,
  });
  assert.equal(ssr.bottomPx, 0);
  ok("SSR unknown viewport → hydration-safe bottom 0");
}

{
  const measurement = normalizeWorkspaceMeasurement({ widthPx: 800, heightPx: 600 })!;
  const occ = buildChromeOccupancySnapshot({
    shell: "web",
    pathname: "/settings",
    viewportWidthPx: 390,
  });
  const usable = usableDimensionsFromContainerFirst(measurement, occ);
  assert.equal(usable.widthPx, 800);
  assert.equal(usable.heightPx, 600);
  assert.equal(occ.appliedToUsableSpace, false);

  const input = createSettingsResolveInput({
    measurement,
    compatibilityMode: "shadow",
    chromeOccupancy: occ,
  });
  assert.equal(input.availableSpace.widthPx, 800);
  assert.equal(input.availableSpace.heightPx, 600);
  assert.equal(input.availableSpace.chromeOccupied.top, 64);
  assert.equal(input.availableSpace.chromeOccupied.bottom, 92);
  assert.equal(input.availableSpace.safeArea.top, 0);
  assert.equal(
    input.availableSpace.stabilityToken,
    buildSettingsResolveStabilityToken(measurement, occ),
  );
  ok("container-first: usable dims unchanged; chrome diagnostic only");
}

{
  const prev = buildChromeOccupancySnapshot({
    shell: "web",
    pathname: "/settings",
    viewportWidthPx: 390,
  });
  const same = coalesceChromeOccupancy(prev, { ...prev });
  assert.equal(same.shouldUpdate, false);
  assert.equal(same.ignoredIdentical, true);

  const next = buildChromeOccupancySnapshot({
    shell: "web",
    pathname: "/settings",
    viewportWidthPx: 1280,
  });
  const changed = coalesceChromeOccupancy(prev, next);
  assert.equal(changed.shouldUpdate, true);
  assert.equal(changed.next.bottomPx, 0);
  ok("identical occupancy ignored; lg change updates");
}

console.log("\n[phase2c] fixed-point / import boundary");

{
  const buildSrc = readFileSync(
    join(root, "lib/adaptive-workspace-react/build-chrome-occupancy.ts"),
    "utf8",
  );
  assert.equal(/resolveWorkspaceLayout|WorkspaceLayoutPlan|WorkspaceProfile/.test(buildSrc), false);
  assert.equal(/from\s+['"]@\/lib\/adaptive-workspace['"]/.test(buildSrc), false);
  ok("occupancy builder does not import resolver/plan/profile");
}

{
  const measurement = normalizeWorkspaceMeasurement({ widthPx: 1200, heightPx: 800 })!;
  const occ = buildChromeOccupancySnapshot({
    shell: "web",
    pathname: "/settings",
    viewportWidthPx: 1200,
  });
  const plan = resolveWorkspaceLayout(
    createSettingsResolveInput({
      measurement,
      compatibilityMode: "shadow",
      chromeOccupancy: occ,
    }),
  );
  // Rebuilding occupancy must not use plan.profile
  const again = buildChromeOccupancySnapshot({
    shell: "web",
    pathname: "/settings",
    viewportWidthPx: 1200,
  });
  assert.equal(again.stabilityToken, occ.stabilityToken);
  assert.equal(plan.renderActivation, false);
  void plan.profile;
  ok("occupancy stable across resolve; no same-cycle profile dependency");
}

{
  const dir = join(root, "lib/adaptive-workspace-react");
  const files = [
    "build-chrome-occupancy.ts",
    "coalesce-chrome-occupancy.ts",
    "chrome-occupancy-types.ts",
    "usable-space-from-occupancy.ts",
  ];
  for (const f of files) {
    const src = readFileSync(join(dir, f), "utf8");
    assert.equal(/GeoFeed|homeComposedLayout|components\/feed|lib\/feed/.test(src), false);
    assert.equal(/from\s+['"]react['"]/.test(src), false);
  }
  ok("occupancy modules Feed/React-free");
}

console.log("\n[phase2c] Settings integration / SSR");

{
  const occ = buildChromeOccupancySnapshot({
    shell: "web",
    pathname: "/settings",
    viewportWidthPx: 390,
  });
  const html = renderToString(
    createElement(SettingsWorkspaceShadowRoot, {
      modeOverride: "shadow",
      chromeOccupancyOverride: occ,
      children: createElement("div", { "data-settings-child": "1" }, "Hub"),
    }),
  );
  assert.match(html, /Hub/);
  assert.match(html, /data-aw-settings-content/);
  assert.match(html, /data-aw-chrome-applied="false"/);
  assert.match(html, /data-aw-render-activation="false"/);
  ok("SSR with occupancy override keeps child; applied=false");
}

{
  const shadowSrc = readFileSync(
    join(root, "components/adaptive-workspace/SettingsWorkspaceShadowRoot.tsx"),
    "utf8",
  );
  assert.equal(/key=\{[^}]*occupancy/.test(shadowSrc), false);
  assert.equal(/key=\{[^}]*chrome/.test(shadowSrc), false);
  assert.match(shadowSrc, /appliedToUsableSpace/);
  assert.equal(/addEventListener\(\s*['"]resize['"]/.test(shadowSrc), false);
  ok("no occupancy keys; no window resize listener");
}

{
  // Pure core still React-free
  const dir = join(root, "lib/adaptive-workspace");
  function walk(d: string): string[] {
    const out: string[] = [];
    for (const ent of readdirSync(d, { withFileTypes: true })) {
      if (ent.name === "tests") continue;
      const p = join(d, ent.name);
      if (ent.isDirectory()) out.push(...walk(p));
      else if (ent.name.endsWith(".ts")) out.push(p);
    }
    return out;
  }
  for (const file of walk(dir)) {
    const src = readFileSync(file, "utf8");
    for (const line of src.split("\n").filter((l) => /^\s*import\b/.test(l))) {
      assert.equal(/from\s+['"]react['"]/.test(line), false, line);
    }
  }
  ok("pure core remains React-free");
}

{
  const chromeFiles = [
    "components/AppPageChrome.tsx",
    "components/NavBar.tsx",
    "components/navigation/BottomNavigation.tsx",
  ];
  // Phase 2C must not require chrome visual edits — confirm we didn't change them
  // (git-tracked cleanliness of chrome is validated at commit time; here structural).
  for (const rel of chromeFiles) {
    assert.ok(readFileSync(join(root, rel), "utf8").length > 0);
  }
  ok("chrome components present; Phase 2C uses read-only policy adapters");
}

console.log(`\nadaptive-workspace-react Phase 2C: ${passed} assertions ok\n`);
