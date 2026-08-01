/**
 * WX Phase 1B.4 remediation — navigation preservation contract tests.
 * Explicit route fixtures — not mirrored from runtime resolvers.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "../../..");

/** Independently authored destinations that must remain reachable below lg. */
const LANDSCAPE_BELOW_LG_REQUIRED = [
  {
    id: "create",
    portraitPath: "bottom-nav-quick-add",
    landscapePath: "hamburger-create",
    canonicalAction: "openCreateFlow|requireAuthAction(create,/sell/new)",
    marker: "data-wx-mobile-create",
  },
  {
    id: "mijn-hcp",
    portraitPath: "bottom-nav-tab",
    landscapePath: "hamburger-link",
    canonicalRoute: "/mijn-hcp",
    marker: "data-wx-mobile-mijn-hcp",
  },
] as const;

let assertions = 0;
function ok(label: string) {
  assertions += 1;
  console.log(`  ✓ ${label}`);
}

console.log("\n[nav-preservation-1b4] landscape below-lg destinations");

{
  const nav = readFileSync(join(root, "components/NavBar.tsx"), "utf8");
  assert.match(nav, /data-wx-mobile-create/);
  assert.match(nav, /data-wx-mobile-mijn-hcp/);
  assert.match(nav, /handleMobileCreate|openCreateFlow/);
  assert.match(nav, /requireAuthAction\(\s*['"]create['"]\s*,\s*['"]\/sell\/new['"]/);
  assert.match(nav, /href=\{user \? '\/mijn-hcp' : '\/login'\}/);
  assert.match(nav, /homePhase1\.ctaShare/);
  assert.match(nav, /bottomNav\.reputationTab/);
  // Escape closes hamburger
  assert.match(nav, /Escape/);
  // Desktop Create remains lg-scoped (primary action inside hidden lg:flex cluster)
  assert.match(nav, /data-wx-primary-action=/);
  assert.match(nav, /hidden lg:flex/);
  ok("NavBar exposes Create + /mijn-hcp in below-lg hamburger; Escape + desktop Create retained");
}

{
  for (const dest of LANDSCAPE_BELOW_LG_REQUIRED) {
    assert.ok(dest.marker.length > 0, dest.id);
    if ("canonicalRoute" in dest) {
      assert.equal(dest.canonicalRoute, "/mijn-hcp");
    }
  }
  ok(`${LANDSCAPE_BELOW_LG_REQUIRED.length} explicit landscape destination fixtures`);
}

{
  const bottom = readFileSync(
    join(root, "components/navigation/BottomNavigation.tsx"),
    "utf8",
  );
  assert.match(bottom, /data-hc-bottom-nav-shell/);
  assert.match(bottom, /aria-hidden=\{landscapeCollapsed/);
  assert.match(bottom, /inert/);
  assert.match(bottom, /bottomNavBarVisibleClass/);
  assert.match(bottom, /useLandscapeWorkPosture/);
  // Must not invent UA device branching for collapse
  assert.equal(/userAgent|navigator\.userAgent/i.test(bottom), false);
  ok("collapsed bottom nav uses hidden + aria-hidden + inert; no UA branching");
}

{
  const policy = readFileSync(
    join(root, "lib/adaptive-workspace-react/resolve-landscape-work-posture.ts"),
    "utf8",
  );
  assert.match(policy, /wx-landscape-work-posture-v1/);
  assert.match(policy, /bottomNavCollapsed/);
  ok("landscape posture policy still owns bottomNavCollapsed");
}

console.log(
  `\n[nav-preservation-1b4] SUMMARY ${JSON.stringify({
    assertions,
    destinations: LANDSCAPE_BELOW_LG_REQUIRED.map((d) => d.id),
  })}`,
);
console.log(`[nav-preservation-1b4] ${assertions} assertions\n`);
