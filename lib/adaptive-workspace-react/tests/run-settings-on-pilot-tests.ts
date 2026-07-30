/**
 * Phase 2F — Settings Controlled ON Pilot tests (Node/tsx).
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

import {
  coerceAdaptiveWorkspaceSettingsMode,
  createSettingsInitialPlan,
  createSettingsResolveInput,
  isSettingsRenderAllowlistedWidget,
  normalizeWorkspaceMeasurement,
  parseSettingsWorkspaceMode,
  resolveSettingsWorkspaceMode,
  SETTINGS_HUB_WIDGET_ID,
  SETTINGS_PRIMARY_PANEL_ID,
  SETTINGS_PRIMARY_REGION_ID,
  SETTINGS_PRIMARY_SLOT_ID,
  SETTINGS_WORKSPACE_MODE_ENV,
  validateSettingsRenderPlan,
} from "../index";
import { resolveWorkspaceLayout } from "@/lib/adaptive-workspace";
import SettingsWorkspaceRoot from "@/components/adaptive-workspace/SettingsWorkspaceRoot";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "../../..");

let passed = 0;
function ok(label: string) {
  passed += 1;
  console.log(`  ✓ ${label}`);
}

console.log("\n[phase2f] mode config");

{
  assert.equal(parseSettingsWorkspaceMode("off"), "off");
  assert.equal(parseSettingsWorkspaceMode("SHADOW"), "shadow");
  assert.equal(parseSettingsWorkspaceMode(" on "), "on");
  assert.equal(parseSettingsWorkspaceMode("nope"), null);
  assert.equal(parseSettingsWorkspaceMode(""), null);
  assert.equal(parseSettingsWorkspaceMode(null), null);
  ok("parse accepts off/shadow/on; rejects invalid");
}

{
  const missing = resolveSettingsWorkspaceMode({ raw: null });
  assert.ok(missing.mode === "off" || missing.mode === "shadow");
  assert.match(missing.source, /default/);

  assert.equal(resolveSettingsWorkspaceMode({ raw: "on", isOverride: true }).mode, "on");
  assert.equal(resolveSettingsWorkspaceMode({ raw: "OFF", isOverride: true }).mode, "off");
  assert.equal(
    resolveSettingsWorkspaceMode({ raw: "garbage", isOverride: true }).source,
    "invalid-fail-closed",
  );
  assert.equal(SETTINGS_WORKSPACE_MODE_ENV, "HOMECHEFF_SETTINGS_WORKSPACE_MODE");
  ok("resolve fail-closed; env name fixed");
}

{
  assert.equal(coerceAdaptiveWorkspaceSettingsMode("on"), "on");
  assert.equal(coerceAdaptiveWorkspaceSettingsMode("weird"), resolveSettingsWorkspaceMode().mode);
  ok("coerce allows on; invalid → default");
}

console.log("\n[phase2f] initial plan");

{
  const plan = createSettingsInitialPlan({ compatibilityMode: "on" });
  assert.equal(plan.schemaVersion, 1);
  assert.equal(plan.surfaceId, "settings");
  assert.equal(plan.renderActivation, true);
  assert.equal(plan.primaryWidgetId, SETTINGS_HUB_WIDGET_ID);
  assert.equal(plan.regions.filter((r) => r.id === "primary-stage").length, 1);
  assert.equal(plan.slots.length, 1);
  assert.equal(plan.panels.length, 1);
  assert.equal(plan.placements.length, 1);
  assert.equal(plan.slots[0]!.id, SETTINGS_PRIMARY_SLOT_ID);
  assert.equal(plan.panels[0]!.id, SETTINGS_PRIMARY_PANEL_ID);
  assert.equal(plan.placements[0]!.statePreservationKey, SETTINGS_HUB_WIDGET_ID);
  assert.equal(plan.placements.some((p) => p.widgetId.startsWith("notifications.")), false);
  assert.equal(plan.placements.some((p) => p.widgetId.startsWith("messages.")), false);
  const json = JSON.stringify(plan);
  assert.equal(/T\d{2}:\d{2}/.test(json), false);
  assert.equal(json.includes("Math.random"), false);
  ok("canonical settings-only initial plan");
}

{
  const a = createSettingsInitialPlan({ compatibilityMode: "on" });
  const b = createSettingsInitialPlan({ compatibilityMode: "on" });
  assert.equal(JSON.stringify(a), JSON.stringify(b));
  ok("initial plan deterministic");
}

{
  const shadow = createSettingsInitialPlan({ compatibilityMode: "shadow" });
  assert.equal(shadow.renderActivation, false);
  ok("shadow initial plan renderActivation false");
}

console.log("\n[phase2f] allowlist / plan validation");

{
  const plan = createSettingsInitialPlan({ compatibilityMode: "on" });
  assert.equal(validateSettingsRenderPlan(plan, "on").ok, true);
  assert.equal(isSettingsRenderAllowlistedWidget("settings.hub"), true);
  assert.equal(isSettingsRenderAllowlistedWidget("notifications.inbox"), false);
  assert.equal(isSettingsRenderAllowlistedWidget("messages.list"), false);
  ok("allowlist only settings.hub");
}

{
  const plan = createSettingsInitialPlan({ compatibilityMode: "on" });
  const bad = {
    ...plan,
    placements: [
      ...plan.placements,
      {
        ...plan.placements[0]!,
        id: "placement:notifications.inbox",
        widgetId: "notifications.inbox",
        statePreservationKey: "notifications.inbox",
      },
    ],
  };
  const v = validateSettingsRenderPlan(bad, "on");
  assert.equal(v.ok, false);
  if (!v.ok) assert.equal(v.code, "AW.RENDER.FORBIDDEN_WIDGET");
  ok("rejects Notifications in render plan");
}

{
  const plan = createSettingsInitialPlan({ compatibilityMode: "on" });
  const bad = {
    ...plan,
    placements: [
      {
        ...plan.placements[0]!,
        id: "placement:messages.chat",
        widgetId: "messages.chat",
        statePreservationKey: "messages.chat",
      },
    ],
    primaryWidgetId: "messages.chat",
  };
  const v = validateSettingsRenderPlan(bad, "on");
  assert.equal(v.ok, false);
  ok("rejects Messages widget");
}

{
  const plan = createSettingsInitialPlan({ compatibilityMode: "shadow" });
  const v = validateSettingsRenderPlan(plan, "on");
  assert.equal(v.ok, false);
  if (!v.ok) assert.equal(v.code, "AW.RENDER.ACTIVATION_MISMATCH");
  ok("activation mismatch fail-closed");
}

{
  const plan = createSettingsInitialPlan({ compatibilityMode: "on" });
  const bad = { ...plan, schemaVersion: 99 as 1 };
  assert.equal(validateSettingsRenderPlan(bad, "on").ok, false);
  ok("unsupported schema rejected");
}

{
  const plan = createSettingsInitialPlan({ compatibilityMode: "on" });
  const bad = { ...plan, surfaceId: "messages" };
  assert.equal(validateSettingsRenderPlan(bad, "on").ok, false);
  ok("wrong surface rejected");
}

{
  assert.equal(validateSettingsRenderPlan(null, "on").ok, false);
  ok("missing plan rejected");
}

console.log("\n[phase2f] resolve ON → settings.hub only");

{
  const measurement = normalizeWorkspaceMeasurement({ widthPx: 1200, heightPx: 800 })!;
  const plan = resolveWorkspaceLayout(
    createSettingsResolveInput({ measurement, compatibilityMode: "on" }),
  );
  assert.equal(plan.renderActivation, true);
  assert.equal(plan.primaryWidgetId, "settings.hub");
  assert.equal(validateSettingsRenderPlan(plan, "on").ok, true);
  assert.equal(plan.placements.every((p) => p.widgetId === "settings.hub"), true);
  ok("ON resolve validates for Settings render");
}

{
  for (const w of [390, 800, 1200, 1600] as const) {
    const measurement = normalizeWorkspaceMeasurement({ widthPx: w, heightPx: 700 })!;
    const plan = resolveWorkspaceLayout(
      createSettingsResolveInput({ measurement, compatibilityMode: "on" }),
    );
    assert.equal(plan.primaryWidgetId, "settings.hub");
    assert.equal(
      plan.placements.find((p) => p.widgetId === "settings.hub")?.regionId,
      SETTINGS_PRIMARY_REGION_ID,
    );
    assert.equal(
      plan.placements.find((p) => p.widgetId === "settings.hub")?.statePreservationKey,
      "settings.hub",
    );
  }
  ok("all widths keep settings.hub primary + stable preservation key");
}

console.log("\n[phase2f] SSR single-writer trees");

{
  const html = renderToString(
    createElement(SettingsWorkspaceRoot, {
      mode: "off",
      children: createElement("div", { "data-settings-child": "1" }, "Settings OFF"),
    }),
  );
  assert.match(html, /Settings OFF/);
  assert.match(html, /data-aw-mode="off"/);
  assert.match(html, /data-aw-settings-shadow-root/);
  assert.doesNotMatch(html, /data-aw-settings-on-root/);
  assert.doesNotMatch(html, /data-aw-region/);
  ok("OFF: legacy shadow root writer; no ON tree");
}

{
  const html = renderToString(
    createElement(SettingsWorkspaceRoot, {
      mode: "shadow",
      children: createElement("div", null, "Settings SHADOW"),
    }),
  );
  assert.match(html, /Settings SHADOW/);
  assert.match(html, /data-aw-mode="shadow"/);
  assert.match(html, /data-aw-render-activation="false"/);
  assert.doesNotMatch(html, /data-aw-settings-on-root/);
  ok("SHADOW: legacy writer; no Workspace ON tree");
}

{
  const html = renderToString(
    createElement(SettingsWorkspaceRoot, {
      mode: "on",
      children: createElement("div", { "data-hub": "1" }, "Settings ON Hub"),
    }),
  );
  assert.match(html, /Settings ON Hub/);
  assert.match(html, /data-aw-settings-on-root/);
  assert.match(html, /data-aw-mode="on"/);
  assert.match(html, /data-aw-region-id="primary-stage"|data-aw-region/);
  assert.match(html, /data-aw-slot/);
  assert.match(html, /data-aw-panel/);
  assert.match(html, /data-aw-widget-id="settings.hub"|data-aw-widget-host/);
  assert.match(html, /data-aw-settings-content/);
  assert.doesNotMatch(html, /data-aw-settings-shadow-root/);
  // Single hub content occurrence
  assert.equal((html.match(/Settings ON Hub/g) ?? []).length, 1);
  ok("ON: Region/Slot/Panel; single Settings child; no shadow duplicate");
}

{
  const html = renderToString(
    createElement(SettingsWorkspaceRoot, {
      mode: "on",
      children: createElement("div", null, "Hub"),
    }),
  );
  assert.doesNotMatch(html, /notifications\.inbox/);
  assert.doesNotMatch(html, /messages\.list|messages\.chat/);
  assert.doesNotMatch(html, /data-aw-notifications-panel|data-aw-messages-panel/);
  ok("ON SSR does not render Notifications/Messages panels");
}

console.log("\n[phase2f] continuity contracts (source)");

{
  const rootSrc = readFileSync(
    join(root, "components/adaptive-workspace/SettingsWorkspaceRoot.tsx"),
    "utf8",
  );
  assert.equal(/\bkey=\{[^}]*profile/.test(rootSrc), false);
  assert.equal(/\bkey=\{[^}]*width/.test(rootSrc), false);
  assert.equal(/\bkey=\{[^}]*height/.test(rootSrc), false);
  assert.equal(/\bkey=\{[^}]*layoutPlan/.test(rootSrc), false);
  assert.equal(/\bkey=\{[^}]*\bmode\b/.test(rootSrc), false);
  assert.equal(/\bkey=\{[^}]*renderActivation/.test(rootSrc), false);
  assert.match(rootSrc, /SETTINGS_PRIMARY_SLOT_ID/);
  assert.match(rootSrc, /compatibilityMode:\s*["']on["']/);
  assert.equal(/addEventListener\(\s*['"]resize['"]/.test(rootSrc), false);
  assert.equal(/\blocalStorage\b/.test(rootSrc), false);
  assert.equal(/\bsearchParams\b/.test(rootSrc), false);
  assert.equal(/display:\s*none|hidden\s+legacy|visibility:\s*hidden/.test(rootSrc), false);
  ok("no remount keys; no CSS-hidden duplicate; no storage/query mode");
}

{
  const page = readFileSync(join(root, "app/settings/page.tsx"), "utf8");
  assert.match(page, /resolveSettingsWorkspaceMode/);
  assert.match(page, /mode=\{settingsWorkspaceMode\}/);
  assert.doesNotMatch(page, /localStorage|searchParams\.get\(['"]mode/);
  assert.equal((page.match(/<SettingsHubClient\b/g) ?? []).length, 1);
  ok("page: server mode prop; single SettingsHubClient");
}

console.log("\n[phase2f] import / data boundaries");

{
  const files = [
    "components/adaptive-workspace/SettingsWorkspaceRoot.tsx",
    "components/adaptive-workspace/WorkspaceRegion.tsx",
    "components/adaptive-workspace/WorkspaceSlot.tsx",
    "components/adaptive-workspace/WorkspacePanel.tsx",
    "components/adaptive-workspace/SettingsWorkspaceWidgetHost.tsx",
    "lib/adaptive-workspace-react/create-settings-initial-plan.ts",
    "lib/adaptive-workspace-react/validate-settings-render-plan.ts",
    "lib/adaptive-workspace-react/settings-mode.ts",
  ];
  for (const rel of files) {
    const src = readFileSync(join(root, rel), "utf8");
    assert.equal(/components\/feed|GeoFeed|homeComposedLayout/.test(src), false, rel);
    assert.equal(/components\/notifications|NotificationBell/.test(src), false, rel);
    assert.equal(/ChatBox|ConversationsList|components\/messages/.test(src), false, rel);
    assert.equal(/WorkspaceProvider|createContext\(|zustand|redux/i.test(src), false, rel);
    assert.equal(/prisma|@\/lib\/prisma/.test(src), false, rel);
  }
  ok("Phase 2F files: no Feed/Notifications/Messages UI/store/prisma");
}

{
  const denylist = [
    "password",
    "email",
    "session",
    "token",
    "formData",
    "billing",
    "payment",
    "notificationRecords",
    "drafts",
  ];
  const plan = createSettingsInitialPlan({ compatibilityMode: "on" });
  const json = JSON.stringify(plan).toLowerCase();
  for (const key of denylist) {
    assert.equal(json.includes(`"${key}"`), false, key);
  }
  ok("initial plan has no Domain State denylist keys");
}

{
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
      assert.equal(
        /from\s+['"]react['"]|from\s+['"]@\/components\//.test(line),
        false,
        line,
      );
    }
  }
  ok("pure core still React/component-free");
}

{
  assert.ok(existsSync(join(root, "docs/audits/homecheff-adaptive-workspace-phase2f-settings-on-pilot.md")));
  ok("Phase 2F report present");
}

console.log(`\nadaptive-workspace Phase 2F: ${passed} assertions ok\n`);
