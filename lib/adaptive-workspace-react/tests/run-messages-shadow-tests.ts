/**
 * Phase 2E — Messages split/stage shadow contract tests.
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

import {
  ADAPTIVE_WORKSPACE_SCHEMA_VERSION,
  messagesChatManifest,
  messagesListManifest,
  resolveWorkspaceLayout,
  validateWidgetManifest,
  validateWidgetManifestSet,
} from "@/lib/adaptive-workspace";
import {
  buildChromeOccupancySnapshot,
  createMessagesPanelRequests,
  createMessagesShadowResolveInput,
  extractMessagesShadowDiagnostics,
  MESSAGES_CHAT_PRESERVATION_KEY,
  MESSAGES_CHAT_WIDGET_ID,
  MESSAGES_LIST_PRESERVATION_KEY,
  MESSAGES_LIST_WIDGET_ID,
  MESSAGES_PRESENTATION_SCHEMA_VERSION,
  normalizeWorkspaceMeasurement,
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

function intent(partial: {
  hasActiveConversation: boolean;
  listRequestedVisible?: boolean;
  preferredListMode?: "split" | "rail";
  reducedMotion?: boolean;
  localeDir?: "ltr" | "rtl";
  keyboardOcclusionFixture?: boolean;
}) {
  return {
    schemaVersion: MESSAGES_PRESENTATION_SCHEMA_VERSION,
    ...partial,
  };
}

function resolveMsg(
  w: number,
  h: number,
  presentation: ReturnType<typeof intent>,
) {
  const occupancy = buildChromeOccupancySnapshot({
    shell: "web",
    pathname: "/settings",
    viewportWidthPx: w,
  });
  const { input, primaryTask } = createMessagesShadowResolveInput({
    measurement: measure(w, h),
    compatibilityMode: "shadow",
    chromeOccupancy: occupancy,
    messagesPresentation: presentation,
  });
  const plan = resolveWorkspaceLayout(input);
  return { plan, input, primaryTask };
}

console.log("\n[phase2e] manifests");

{
  const list = messagesListManifest();
  const chat = messagesChatManifest();
  assert.equal(list.id, MESSAGES_LIST_WIDGET_ID);
  assert.equal(chat.id, MESSAGES_CHAT_WIDGET_ID);
  assert.equal(list.statePreservationKey, MESSAGES_LIST_PRESERVATION_KEY);
  assert.equal(chat.statePreservationKey, MESSAGES_CHAT_PRESERVATION_KEY);
  assert.equal(list.canBePrimary, true);
  assert.equal(chat.canBePrimary, true);
  assert.equal(list.preferredRegion, "supporting-start");
  assert.equal(chat.preferredRegion, "primary-stage");
  validateWidgetManifest(list);
  validateWidgetManifest(chat);
  validateWidgetManifestSet([list, chat]);
  ok("messages.list + messages.chat manifests valid");
}

console.log("\n[phase2e] presentation intent adapter");

{
  const closed = createMessagesPanelRequests(
    intent({ hasActiveConversation: false }),
  );
  assert.equal(closed.primaryTask, "messages.list");
  assert.equal(closed.requests.length, 0);

  const open = createMessagesPanelRequests(
    intent({ hasActiveConversation: true, preferredListMode: "rail" }),
  );
  assert.equal(open.primaryTask, "messages.chat");
  assert.equal(open.requests[0]!.widgetId, MESSAGES_LIST_WIDGET_ID);
  assert.equal(open.requests[0]!.preferredMode, "rail");

  const compactHide = createMessagesPanelRequests(
    intent({ hasActiveConversation: true, listRequestedVisible: false }),
  );
  assert.equal(compactHide.primaryTask, "messages.chat");
  assert.equal(compactHide.requests.length, 0);

  const bad = createMessagesPanelRequests(
    intent({
      hasActiveConversation: true,
      preferredListMode: "modal" as "rail",
    }),
  );
  assert.ok(bad.warnings.some((w) => /unsupported/.test(w)));
  assert.equal(bad.requests[0]!.preferredMode, "split");

  const i = intent({ hasActiveConversation: true });
  assert.deepEqual(
    createMessagesPanelRequests(i).requests,
    createMessagesPanelRequests(i).requests,
  );
  assert.equal(i.hasActiveConversation, true);
  ok("intent → primaryTask + requests deterministic");
}

console.log("\n[phase2e] topology / profile × mode");

{
  const { plan, primaryTask } = resolveMsg(
    390,
    800,
    intent({ hasActiveConversation: false }),
  );
  assert.equal(primaryTask, "messages.list");
  assert.equal(plan.primaryWidgetId, MESSAGES_LIST_WIDGET_ID);
  assert.equal(plan.panels.filter((p) => p.mode === "stage").length, 1);
  assert.equal(
    plan.placements.some((p) => p.widgetId === MESSAGES_CHAT_WIDGET_ID),
    false,
  );
  assert.equal(plan.renderActivation, false);
  ok("COMPACT no conversation → list primary; one stage");
}

{
  const { plan } = resolveMsg(
    390,
    800,
    intent({ hasActiveConversation: true, listRequestedVisible: false }),
  );
  assert.equal(plan.primaryWidgetId, MESSAGES_CHAT_WIDGET_ID);
  assert.equal(plan.panels.filter((p) => p.mode === "stage").length, 1);
  assert.equal(
    plan.placements.some((p) => p.widgetId === MESSAGES_LIST_WIDGET_ID),
    false,
  );
  const diag = extractMessagesShadowDiagnostics(
    plan,
    intent({ hasActiveConversation: true, listRequestedVisible: false }),
    "messages.chat",
  );
  assert.equal(diag.listPlacement, "hidden");
  assert.equal(diag.stageCount, 1);
  ok("COMPACT active → chat primary; list hidden; one stage");
}

{
  const { plan } = resolveMsg(
    800,
    800,
    intent({ hasActiveConversation: true, preferredListMode: "rail" }),
  );
  assert.equal(plan.primaryWidgetId, MESSAGES_CHAT_WIDGET_ID);
  const list = plan.placements.find((p) => p.widgetId === MESSAGES_LIST_WIDGET_ID)!;
  assert.ok(list);
  assert.equal(list.regionId, "supporting-start");
  assert.ok(list.mode === "rail" || list.mode === "split");
  assert.equal(plan.panels.filter((p) => p.mode === "stage").length, 1);
  ok("COMFORT active → chat primary; list supporting-start");
}

{
  const { plan } = resolveMsg(
    1200,
    800,
    intent({ hasActiveConversation: true, preferredListMode: "split" }),
  );
  assert.equal(plan.profile, "EXPANDED");
  assert.equal(plan.primaryWidgetId, MESSAGES_CHAT_WIDGET_ID);
  const list = plan.placements.find((p) => p.widgetId === MESSAGES_LIST_WIDGET_ID)!;
  assert.equal(list.regionId, "supporting-start");
  assert.equal(list.mode, "split");
  assert.equal(
    plan.placements.find((p) => p.widgetId === MESSAGES_CHAT_WIDGET_ID)!.mode,
    "stage",
  );
  const diag = extractMessagesShadowDiagnostics(
    plan,
    intent({ hasActiveConversation: true }),
    "messages.chat",
  );
  assert.equal(diag.split, true);
  assert.equal(diag.stageCount, 1);
  ok("EXPANDED active → split; exactly one stage");
}

{
  const { plan } = resolveMsg(
    1500,
    800,
    intent({ hasActiveConversation: true, preferredListMode: "rail" }),
  );
  assert.equal(plan.profile, "PROFESSIONAL");
  assert.equal(plan.primaryWidgetId, MESSAGES_CHAT_WIDGET_ID);
  assert.ok(plan.placements.find((p) => p.widgetId === MESSAGES_LIST_WIDGET_ID));
  assert.equal(plan.panels.filter((p) => p.mode === "stage").length, 1);
  ok("PROFESSIONAL active → chat primary + list supporting; one stage");
}

{
  const { plan } = resolveMsg(
    1200,
    400,
    intent({ hasActiveConversation: true, preferredListMode: "split" }),
  );
  assert.equal(plan.primaryWidgetId, MESSAGES_CHAT_WIDGET_ID);
  assert.equal(plan.panels.filter((p) => p.mode === "stage").length, 1);
  const chat = plan.placements.find((p) => p.widgetId === MESSAGES_CHAT_WIDGET_ID)!;
  assert.equal(chat.statePreservationKey, MESSAGES_CHAT_PRESERVATION_KEY);
  ok("H_SHORT → conversation primary preserved");
}

console.log("\n[phase2e] preservation / transition / lifecycle / keyboard");

{
  const a = resolveMsg(
    390,
    800,
    intent({ hasActiveConversation: true, listRequestedVisible: false }),
  );
  const b = resolveMsg(
    1200,
    800,
    intent({ hasActiveConversation: true, preferredListMode: "split" }),
  );
  const keyA = a.plan.placements.find(
    (p) => p.widgetId === MESSAGES_CHAT_WIDGET_ID,
  )!.statePreservationKey;
  const keyB = b.plan.placements.find(
    (p) => p.widgetId === MESSAGES_CHAT_WIDGET_ID,
  )!.statePreservationKey;
  assert.equal(keyA, keyB);
  assert.equal(keyA, MESSAGES_CHAT_PRESERVATION_KEY);
  assert.equal(MESSAGES_LIST_PRESERVATION_KEY.includes("id"), false);
  ok("COMPACT↔EXPANDED preservation keys stable; no conversation id");
}

{
  const a = resolveMsg(
    1200,
    800,
    intent({ hasActiveConversation: true, preferredListMode: "split" }),
  );
  const b = resolveMsg(
    1200,
    800,
    intent({
      hasActiveConversation: true,
      preferredListMode: "split",
      reducedMotion: true,
    }),
  );
  const pa = a.plan.placements.map((p) => `${p.widgetId}:${p.mode}:${p.regionId}`).sort();
  const pb = b.plan.placements.map((p) => `${p.widgetId}:${p.mode}:${p.regionId}`).sort();
  assert.deepEqual(pa, pb);
  assert.equal(b.plan.transitionIntent, "none");
  ok("reduced motion — placements equal; transition none");
}

{
  const { plan } = resolveMsg(
    1200,
    800,
    intent({ hasActiveConversation: true, preferredListMode: "split" }),
  );
  for (const life of plan.lifecycleIntents) {
    assert.notEqual(String(life.intent), "DESTROYED");
  }
  const chatLife = plan.lifecycleIntents.find(
    (l) => l.widgetId === MESSAGES_CHAT_WIDGET_ID,
  )!;
  assert.equal(chatLife.intent, "VISIBLE");
  ok("lifecycle VISIBLE; no DESTROYED on split place");
}

{
  const { plan, input } = resolveMsg(
    800,
    800,
    intent({
      hasActiveConversation: true,
      listRequestedVisible: false,
      keyboardOcclusionFixture: true,
    }),
  );
  assert.equal(input.availableSpace.occlusions[0]?.kind, "keyboard");
  assert.equal(plan.primaryWidgetId, MESSAGES_CHAT_WIDGET_ID);
  assert.equal(plan.panels.filter((p) => p.mode === "stage").length, 1);
  ok("keyboard occlusion fixture — chat primary retained; no detector");
}

{
  const { plan } = resolveMsg(
    1200,
    800,
    intent({
      hasActiveConversation: true,
      preferredListMode: "split",
      localeDir: "rtl",
    }),
  );
  assert.equal(plan.primaryWidgetId, MESSAGES_CHAT_WIDGET_ID);
  const list = plan.placements.find((p) => p.widgetId === MESSAGES_LIST_WIDGET_ID)!;
  assert.equal(list.regionId, "supporting-start");
  ok("RTL — logical supporting-start; widgetset unchanged");
}

console.log("\n[phase2e] domain / import boundary");

{
  const { input } = createMessagesShadowResolveInput({
    measurement: measure(800, 600),
    compatibilityMode: "shadow",
    messagesPresentation: intent({ hasActiveConversation: true }),
  });
  const json = JSON.stringify(input);
  for (const forbidden of [
    "conversationId",
    "threadId",
    "messageId",
    "messageBody",
    "draftBody",
    "unreadCount",
    "userId",
    "requestKey",
    "nativePaintKey",
  ]) {
    assert.equal(json.includes(`"${forbidden}"`), false, forbidden);
  }
  ok("ResolveInput free of Domain State fields");
}

{
  const files = [
    "lib/adaptive-workspace-react/messages/create-messages-panel-requests.ts",
    "lib/adaptive-workspace-react/messages/create-messages-shadow-resolve-input.ts",
    "lib/adaptive-workspace/registry/settings-manifests.ts",
  ];
  for (const rel of files) {
    const src = readFileSync(join(root, rel), "utf8");
    for (const line of src.split("\n").filter((l) => /^\s*import\b/.test(l))) {
      assert.equal(
        /ChatBox|ConversationsList|\/api\/conversations|\/api\/messages|GeoFeed|lib\/feed/.test(
          line,
        ),
        false,
        line,
      );
    }
  }
  ok("no Messages UI/API or Feed imports in adapters");
}

{
  const shadowSrc = readFileSync(
    join(root, "components/adaptive-workspace/SettingsWorkspaceShadowRoot.tsx"),
    "utf8",
  );
  assert.equal(/key=\{[^}]*messages/.test(shadowSrc), false);
  assert.equal((shadowSrc.match(/new ResizeObserver/g) || []).length, 1);
  assert.equal(/visualViewport|addEventListener\(\s*['"]resize['"]/.test(shadowSrc), false);
  assert.match(shadowSrc, /data-aw-messages-/);
  ok("single RO; no keyboard/viewport listeners; diagnostics attrs");
}

console.log("\n[phase2e] SSR + Settings continuity");

{
  const html = renderToString(
    createElement(SettingsWorkspaceShadowRoot, {
      modeOverride: "shadow",
      messagesPresentationOverride: intent({
        hasActiveConversation: true,
        preferredListMode: "split",
      }),
      children: createElement("div", null, "Settings Hub"),
    }),
  );
  assert.match(html, /Settings Hub/);
  assert.match(html, /data-aw-settings-content/);
  assert.match(html, /data-aw-render-activation="false"/);
  assert.match(html, /data-aw-messages-preservation-keys/);
  ok("SSR Settings child + messages diagnostic attrs; no gate");
}

{
  const page = readFileSync(join(root, "app/messages/page.tsx"), "utf8");
  assert.equal(/adaptive-workspace/.test(page), false);
  ok("real Messages route untouched by adaptive-workspace");
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
      assert.equal(/from\s+['"]react['"]/.test(line), false, line);
    }
  }
  ok("pure core remains React-free");
}

console.log(`\nadaptive-workspace-react Phase 2E: ${passed} assertions ok\n`);
