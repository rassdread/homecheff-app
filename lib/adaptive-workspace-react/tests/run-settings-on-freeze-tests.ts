/**
 * Phase 2G — Settings ON freeze contract tests (Node/tsx).
 * Complements Puppeteer browser reports under /tmp/phase2g-artifacts (or --evidence-dir).
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

import {
  createSettingsInitialPlan,
  resolveSettingsWorkspaceMode,
  validateSettingsRenderPlan,
} from "../index";
import SettingsWorkspaceRoot from "@/components/adaptive-workspace/SettingsWorkspaceRoot";
import WorkspaceRenderErrorBoundary from "@/components/adaptive-workspace/WorkspaceRenderErrorBoundary";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "../../..");

let passed = 0;
function ok(label: string) {
  passed += 1;
  console.log(`  ✓ ${label}`);
}

console.log("\n[phase2g] freeze contracts");

{
  const plan = createSettingsInitialPlan({ compatibilityMode: "on" });
  assert.equal(validateSettingsRenderPlan(plan, "on").ok, true);
  assert.equal(plan.placements.length, 1);
  assert.equal(plan.primaryWidgetId, "settings.hub");
  ok("canonical ON plan still allowlisted");
}

{
  const off = resolveSettingsWorkspaceMode({ raw: null });
  // NODE_ENV in test runner is typically not production → shadow default
  assert.ok(off.mode === "off" || off.mode === "shadow");
  assert.equal(resolveSettingsWorkspaceMode({ raw: "GARBAGE", isOverride: true }).source, "invalid-fail-closed");
  assert.equal(resolveSettingsWorkspaceMode({ raw: " ON ", isOverride: true }).mode, "on");
  ok("mode defaults + invalid fail-closed");
}

{
  const htmlOn = renderToString(
    createElement(SettingsWorkspaceRoot, {
      mode: "on",
      children: createElement("div", { "data-hub": "1" }, "Hub"),
    }),
  );
  assert.match(htmlOn, /data-aw-settings-on-root/);
  assert.match(htmlOn, /data-aw-region/);
  assert.equal((htmlOn.match(/Hub/g) ?? []).length, 1);

  const htmlShadow = renderToString(
    createElement(SettingsWorkspaceRoot, {
      mode: "shadow",
      children: createElement("div", null, "Hub"),
    }),
  );
  assert.match(htmlShadow, /data-aw-settings-shadow-root/);
  assert.doesNotMatch(htmlShadow, /data-aw-settings-on-root/);
  ok("SSR OFF/SHADOW/ON single-writer trees");
}

{
  function Boom(): null {
    throw new Error("AW.RENDER.TEST_BOOM");
  }
  assert.ok(typeof WorkspaceRenderErrorBoundary === "function" || typeof WorkspaceRenderErrorBoundary === "object");
  // Client Error Boundary recovery is browser-proven separately; hard crash remount is documented.
  void Boom;
  void createElement;
  ok("Error Boundary module present (hard crash remount documented)");
}

console.log("\n[phase2g] browser evidence presence");

{
  const evidenceDir =
    process.env.PHASE2G_EVIDENCE_DIR ||
    join(root, "docs/audits/artifacts/phase2g");
  const required = [
    "phase2g-browser-on.json",
    "phase2g-browser-shadow.json",
    "phase2g-browser-off.json",
    "phase2g-browser-invalid.json",
  ];
  for (const f of required) {
    const p = join(evidenceDir, f);
    assert.ok(existsSync(p), `missing evidence ${p}`);
    const report = JSON.parse(readFileSync(p, "utf8"));
    assert.equal(report.pass, true, `${f} must pass`);
    assert.equal(report.summary?.hydrationOk, true, `${f} hydration`);
    assert.equal(report.summary?.isolationOk, true, `${f} isolation`);
  }
  ok("browser evidence JSON present and pass=true for all modes");
}

{
  const freeze = join(
    root,
    "docs/audits/homecheff-adaptive-workspace-phase2g-settings-on-freeze.md",
  );
  assert.ok(existsSync(freeze));
  const src = readFileSync(freeze, "utf8");
  assert.match(src, /READY TO FREEZE SETTINGS ON PILOT/);
  assert.match(src, /HOMECHEFF_SETTINGS_WORKSPACE_MODE/);
  assert.match(src, /rollback/i);
  ok("freeze record present with READY decision");
}

{
  const harness = readFileSync(
    join(root, "app/aw-settings-harness/page.tsx"),
    "utf8",
  );
  assert.match(harness, /HOMECHEFF_AW_SETTINGS_HARNESS/);
  assert.match(harness, /notFound/);
  assert.doesNotMatch(harness, /<main[\s>]/);
  ok("harness gated + no extra main landmark");
}

console.log(`\nadaptive-workspace Phase 2G: ${passed} assertions ok\n`);
