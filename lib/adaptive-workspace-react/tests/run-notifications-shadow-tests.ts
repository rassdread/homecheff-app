/**
 * Phase 2D — Notifications panel shadow contract tests.
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

import {
  ADAPTIVE_WORKSPACE_SCHEMA_VERSION,
  notificationsInboxManifest,
  resolveWorkspaceLayout,
  PANEL_MODE_META,
  validateWidgetManifest,
} from "@/lib/adaptive-workspace";
import {
  buildChromeOccupancySnapshot,
  createNotificationsPanelRequest,
  createSettingsNotificationsResolveInput,
  emptyNotificationsShadowDiagnostics,
  extractNotificationsShadowDiagnostics,
  normalizeWorkspaceMeasurement,
  NOTIFICATIONS_INBOX_PRESERVATION_KEY,
  NOTIFICATIONS_INBOX_WIDGET_ID,
} from "../index";
import SettingsWorkspaceShadowRoot from "@/components/adaptive-workspace/SettingsWorkspaceShadowRoot";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "../../..");

let passed = 0;
function ok(label: string) {
  passed += 1;
  console.log(`  ✓ ${label}`);
}

function measure(w: number, h: number) {
  return normalizeWorkspaceMeasurement({ widthPx: w, heightPx: h })!;
}

function resolveWith(args: {
  w: number;
  h: number;
  open?: boolean;
  preferredMode?: "rail" | "sheet" | "overlay";
  reducedMotion?: boolean;
  chromeBottom?: boolean;
}) {
  const occupancy = buildChromeOccupancySnapshot({
    shell: "web",
    pathname: "/settings",
    viewportWidthPx: args.chromeBottom === false ? 1280 : args.w,
  });
  const { input, notificationsRequestKind } =
    createSettingsNotificationsResolveInput({
      measurement: measure(args.w, args.h),
      compatibilityMode: "shadow",
      chromeOccupancy: occupancy,
      reducedMotion: args.reducedMotion,
      notificationsPresentation: args.open
        ? {
            isRequestedOpen: true,
            preferredMode: args.preferredMode,
          }
        : null,
    });
  const plan = resolveWorkspaceLayout(input);
  return { plan, input, notificationsRequestKind };
}

console.log("\n[phase2d] manifest contract");

{
  const m = notificationsInboxManifest();
  assert.equal(m.schemaVersion, ADAPTIVE_WORKSPACE_SCHEMA_VERSION);
  assert.equal(m.id, NOTIFICATIONS_INBOX_WIDGET_ID);
  assert.equal(m.statePreservationKey, NOTIFICATIONS_INBOX_PRESERVATION_KEY);
  assert.equal(m.canBePrimary, false);
  assert.equal(m.preferredRegion, "supporting-end");
  assert.deepEqual(m.allowedPanelModes, ["rail", "sheet", "overlay"]);
  assert.equal(m.collapseBehavior, "to-sheet");
  assert.equal(m.canOverlay, true);
  assert.equal(m.canPersist, false);
  assert.equal(m.canFloat, false);
  validateWidgetManifest(m);
  assert.equal(/left|right/.test(JSON.stringify(m)), false);
  ok("notifications.inbox manifest schema + Settings-supporting defaults");
}

console.log("\n[phase2d] panel request adapter");

{
  assert.deepEqual(createNotificationsPanelRequest(null).requests, []);
  assert.deepEqual(
    createNotificationsPanelRequest({ isRequestedOpen: false }).requests,
    [],
  );
  const open = createNotificationsPanelRequest({
    isRequestedOpen: true,
    preferredMode: "sheet",
  });
  assert.equal(open.requests.length, 1);
  assert.equal(open.requests[0]!.intent, "open");
  assert.equal(open.requests[0]!.preferredMode, "sheet");
  assert.equal(open.requests[0]!.widgetId, NOTIFICATIONS_INBOX_WIDGET_ID);

  const bad = createNotificationsPanelRequest({
    isRequestedOpen: true,
    preferredMode: "modal" as "sheet",
  });
  assert.equal(bad.requests[0]!.preferredMode, undefined);
  assert.ok(bad.warnings.some((w) => /unsupported preferredMode/.test(w)));

  const pin = createNotificationsPanelRequest({
    isRequestedOpen: false,
    isPinned: true,
  });
  assert.equal(pin.requests.length, 0);
  assert.ok(pin.warnings.some((w) => /pin unsupported/.test(w)));

  const close = createNotificationsPanelRequest({
    isRequestedOpen: false,
    isRequestedClose: true,
  });
  assert.equal(close.requests[0]!.intent, "close");

  const intent = { isRequestedOpen: true, preferredMode: "rail" as const };
  const a = createNotificationsPanelRequest(intent);
  const b = createNotificationsPanelRequest(intent);
  assert.deepEqual(a.requests, b.requests);
  assert.equal(intent.isRequestedOpen, true);
  ok("panel request open/close/pin/unsupported/deterministic");
}

console.log("\n[phase2d] profile × mode matrix");

{
  const closed = resolveWith({ w: 390, h: 800, open: false });
  assert.equal(closed.plan.primaryWidgetId, "settings.hub");
  assert.equal(
    closed.plan.placements.some((p) => p.widgetId === NOTIFICATIONS_INBOX_WIDGET_ID),
    false,
  );
  assert.equal(closed.plan.renderActivation, false);
  ok("COMPACT closed — no notifications panel");
}

{
  const r = resolveWith({ w: 390, h: 800, open: true, preferredMode: "rail" });
  const n = r.plan.placements.find((p) => p.widgetId === NOTIFICATIONS_INBOX_WIDGET_ID)!;
  assert.ok(n);
  assert.equal(n.mode === "sheet" || n.mode === "overlay", true);
  assert.equal(PANEL_MODE_META[n.mode].isTransient, true);
  assert.equal(PANEL_MODE_META[n.mode].takesStructuralSpace, false);
  assert.equal(r.plan.primaryWidgetId, "settings.hub");
  assert.equal(r.plan.panels.filter((p) => p.mode === "stage").length, 1);
  ok("COMPACT open — transient sheet/overlay; primary settings.hub");
}

{
  const r = resolveWith({ w: 800, h: 800, open: true, preferredMode: "rail" });
  const n = r.plan.placements.find((p) => p.widgetId === NOTIFICATIONS_INBOX_WIDGET_ID)!;
  assert.equal(n.mode, "rail");
  assert.equal(n.regionId, "supporting-end");
  assert.equal(r.plan.primaryWidgetId, "settings.hub");
  ok("COMFORT open — rail supporting-end");
}

{
  const r = resolveWith({ w: 1200, h: 800, open: true, preferredMode: "rail" });
  const n = r.plan.placements.find((p) => p.widgetId === NOTIFICATIONS_INBOX_WIDGET_ID)!;
  assert.equal(n.mode, "rail");
  assert.equal(n.regionId, "supporting-end");
  assert.equal(r.plan.profile, "EXPANDED");
  ok("EXPANDED open — rail");
}

{
  const r = resolveWith({ w: 1500, h: 800, open: true, preferredMode: "rail" });
  const n = r.plan.placements.find((p) => p.widgetId === NOTIFICATIONS_INBOX_WIDGET_ID)!;
  assert.equal(n.mode, "rail");
  assert.equal(r.plan.profile, "PROFESSIONAL");
  assert.equal(r.plan.primaryWidgetId, "settings.hub");
  ok("PROFESSIONAL open — rail; does not displace primary");
}

{
  const r = resolveWith({ w: 1200, h: 400, open: true, preferredMode: "rail" });
  // height demote EXPANDED→COMFORT; rail still allowed on COMFORT
  assert.ok(["COMFORT", "COMPACT"].includes(r.plan.profile));
  const n = r.plan.placements.find((p) => p.widgetId === NOTIFICATIONS_INBOX_WIDGET_ID);
  assert.ok(n);
  assert.equal(n!.statePreservationKey, NOTIFICATIONS_INBOX_PRESERVATION_KEY);
  assert.equal(r.plan.primaryWidgetId, "settings.hub");
  ok("H_SHORT open — primary kept; preservation key stable");
}

{
  const a = resolveWith({ w: 1200, h: 800, open: true, preferredMode: "rail" });
  const b = resolveWith({
    w: 1200,
    h: 800,
    open: true,
    preferredMode: "rail",
    reducedMotion: true,
  });
  const pa = a.plan.placements.find((p) => p.widgetId === NOTIFICATIONS_INBOX_WIDGET_ID)!;
  const pb = b.plan.placements.find((p) => p.widgetId === NOTIFICATIONS_INBOX_WIDGET_ID)!;
  assert.equal(pa.mode, pb.mode);
  assert.equal(pa.regionId, pb.regionId);
  assert.equal(b.plan.transitionIntent, "none");
  assert.notEqual(a.plan.transitionIntent, "none");
  ok("reduced motion — placements equal; transition none");
}

console.log("\n[phase2d] focus / transition / lifecycle / decisiontrace");

{
  const sheet = resolveWith({ w: 390, h: 800, open: true, preferredMode: "sheet" });
  const panel = sheet.plan.panels.find((p) => p.widgetId === NOTIFICATIONS_INBOX_WIDGET_ID)!;
  assert.equal(panel.requiresFocusTrap, true);
  assert.equal(PANEL_MODE_META.sheet.requiresFocusTrap, true);
  // Plan-level trap only forced for modal in pure core
  assert.equal(sheet.plan.focusIntent.trap, false);
  assert.ok(panel.closeContract?.escape);
  ok("sheet focus trap on panel; plan trap not forced (non-modal)");
}

{
  const rail = resolveWith({ w: 1200, h: 800, open: true, preferredMode: "rail" });
  const panel = rail.plan.panels.find((p) => p.widgetId === NOTIFICATIONS_INBOX_WIDGET_ID)!;
  assert.equal(panel.requiresFocusTrap, false);
  assert.equal(rail.plan.focusIntent.trap, false);
  ok("rail — no focus trap");
}

{
  const open = resolveWith({ w: 1200, h: 800, open: true, preferredMode: "rail" });
  const life = open.plan.lifecycleIntents.find(
    (l) => l.widgetId === NOTIFICATIONS_INBOX_WIDGET_ID,
  )!;
  assert.equal(life.intent, "VISIBLE");
  assert.equal(life.statePreservationKey, NOTIFICATIONS_INBOX_PRESERVATION_KEY);
  assert.notEqual(String(life.intent), "DESTROYED");

  const compact = resolveWith({ w: 390, h: 800, open: true, preferredMode: "rail" });
  const life2 = compact.plan.lifecycleIntents.find(
    (l) => l.widgetId === NOTIFICATIONS_INBOX_WIDGET_ID,
  )!;
  assert.equal(life2.statePreservationKey, NOTIFICATIONS_INBOX_PRESERVATION_KEY);
  assert.notEqual(String(life2.intent), "DESTROYED");
  ok("lifecycle VISIBLE; mode change does not DESTROY");
}

{
  const r = resolveWith({ w: 1200, h: 800, open: true, preferredMode: "rail" });
  const placed = r.plan.diagnostics.placed.find(
    (p) => p.widgetId === NOTIFICATIONS_INBOX_WIDGET_ID,
  );
  assert.ok(placed?.reason);
  assert.equal(r.plan.diagnostics.compatibilityMode, "shadow");
  const diag = extractNotificationsShadowDiagnostics(r.plan, "open");
  assert.equal(diag.placement, "placed");
  assert.equal(diag.preservationKey, NOTIFICATIONS_INBOX_PRESERVATION_KEY);
  assert.equal(/unread|notificationRecords|userId|session/i.test(JSON.stringify(diag)), false);
  ok("decision trace + diagnostics free of Domain State");
}

console.log("\n[phase2d] domain boundary + import boundary");

{
  const payload = createSettingsNotificationsResolveInput({
    measurement: measure(800, 600),
    compatibilityMode: "shadow",
    notificationsPresentation: { isRequestedOpen: true, preferredMode: "sheet" },
  }).input;
  const json = JSON.stringify(payload);
  for (const forbidden of [
    "notificationRecords",
    "unreadCount",
    "markAsRead",
    "apiResponse",
    "requestKey",
    "nativePaintKey",
    "userId",
    "session",
  ]) {
    assert.equal(json.includes(`"${forbidden}"`), false, forbidden);
  }
  ok("ResolveInput has no Domain State fields");
}

{
  const files = [
    "lib/adaptive-workspace-react/notifications/create-notifications-panel-request.ts",
    "lib/adaptive-workspace-react/notifications/create-settings-notifications-resolve-input.ts",
    "lib/adaptive-workspace/registry/settings-manifests.ts",
  ];
  for (const rel of files) {
    const src = readFileSync(join(root, rel), "utf8");
    const imports = src.split("\n").filter((l) => /^\s*import\b/.test(l));
    for (const line of imports) {
      assert.equal(
        /GeoFeed|homeComposedLayout|components\/feed|lib\/feed|NotificationBell|useNotifications|\/api\/notifications/.test(
          line,
        ),
        false,
        `${rel}: ${line}`,
      );
    }
  }
  ok("no Feed / Notifications UI / API imports in adapters");
}

{
  const shadowSrc = readFileSync(
    join(root, "components/adaptive-workspace/SettingsWorkspaceShadowRoot.tsx"),
    "utf8",
  );
  assert.equal(/key=\{[^}]*notifications/.test(shadowSrc), false);
  assert.equal(/addEventListener\(\s*['"]resize['"]/.test(shadowSrc), false);
  assert.match(shadowSrc, /data-aw-notifications-/);
  assert.match(shadowSrc, /renderActivation = false/);
  // Exactly one ResizeObserver construction for container
  assert.equal((shadowSrc.match(/new ResizeObserver/g) || []).length, 1);
  ok("no notifications keys; single RO; diagnostics attrs");
}

console.log("\n[phase2d] SSR + Settings integration");

{
  const html = renderToString(
    createElement(SettingsWorkspaceShadowRoot, {
      modeOverride: "shadow",
      notificationsPresentationOverride: {
        isRequestedOpen: true,
        preferredMode: "sheet",
      },
      children: createElement("div", { "data-settings-child": "1" }, "Settings Hub"),
    }),
  );
  assert.match(html, /Settings Hub/);
  assert.match(html, /data-aw-settings-content/);
  assert.match(html, /data-aw-render-activation="false"/);
  assert.match(html, /data-aw-notifications-preservation-key/);
  ok("SSR keeps Settings child; no measurement gate");
}

{
  assert.equal(emptyNotificationsShadowDiagnostics().placement, "none");
  ok("empty notifications diagnostics baseline");
}

{
  // Pure core React-free
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
  ok("pure core remains React-free after Phase 2D");
}

{
  // Existing Notifications UI files untouched by Phase 2D imports from workspace
  const bell = readFileSync(
    join(root, "components/notifications/NotificationBell.tsx"),
    "utf8",
  );
  assert.equal(/adaptive-workspace/.test(bell), false);
  ok("NotificationBell does not import adaptive-workspace");
}

console.log(`\nadaptive-workspace-react Phase 2D: ${passed} assertions ok\n`);
