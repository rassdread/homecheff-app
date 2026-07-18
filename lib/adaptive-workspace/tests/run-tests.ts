/**
 * Phase 2A pure Adaptive Workspace test suite (Node / tsx).
 * No React, DOM, or Feed imports.
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  ADAPTIVE_WORKSPACE_SCHEMA_VERSION,
  HardContractViolation,
  PANEL_MODE_META,
  PROFILE_TEST_FIXTURE_BANDS,
  RESOLVE_PRECEDENCE,
  ValidationError,
  WORKSPACE_DOMAIN_DENYLIST,
  feedGeoTestManifest,
  resolveWorkspaceLayout,
  resolveWorkspaceProfile,
  sealedPrimaryManifest,
  settingsHubManifest,
  stableStringify,
  validateResolveInput,
  validateWidgetManifest,
  validateWidgetManifestSet,
  WIDGET_LIFECYCLE_TRANSITIONS,
  isAllowedLifecycleTransition,
  type ResolveInput,
  type WidgetManifest,
} from "../index";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "../../..");

let passed = 0;
function ok(label: string) {
  passed += 1;
  console.log(`  ✓ ${label}`);
}

function baseSpace(
  widthPx: number,
  heightPx = 800,
  extras?: Partial<ResolveInput["availableSpace"]>,
): ResolveInput["availableSpace"] {
  return {
    widthPx,
    heightPx,
    safeArea: { top: 0, right: 0, bottom: 0, left: 0 },
    chromeOccupied: { top: 64, bottom: 0, start: 0, end: 0 },
    occlusions: [],
    stabilityToken: `stable-${widthPx}x${heightPx}`,
    ...extras,
  };
}

function completeManifest(partial: Partial<WidgetManifest> & { id: string }): WidgetManifest {
  const base = settingsHubManifest({ id: partial.id, statePreservationKey: partial.id });
  return validateWidgetManifest({ ...base, ...partial, id: partial.id });
}

function settingsInput(
  widthPx: number,
  overrides?: Partial<ResolveInput>,
): ResolveInput {
  const hub = settingsHubManifest();
  const base: ResolveInput = {
    schemaVersion: ADAPTIVE_WORKSPACE_SCHEMA_VERSION,
    availableSpace: baseSpace(widthPx),
    capabilities: {
      pointerFine: false,
      hover: false,
      touch: false,
      reducedMotion: false,
    },
    environment: { shell: "web", localeDir: "ltr" },
    surfaceId: "settings",
    primaryTask: "settings.edit",
    manifests: [hub],
    panelRequests: [],
    preferences: {
      schemaVersion: ADAPTIVE_WORKSPACE_SCHEMA_VERSION,
      version: 1,
      pins: [],
    },
    accessibility: {},
    compatibility: { mode: "on" },
  };
  return {
    ...base,
    ...overrides,
    manifests: overrides?.manifests ?? base.manifests,
    availableSpace: overrides?.availableSpace ?? base.availableSpace,
    preferences: overrides?.preferences ?? base.preferences,
    compatibility: overrides?.compatibility ?? base.compatibility,
    capabilities: overrides?.capabilities ?? base.capabilities,
    environment: overrides?.environment ?? base.environment,
  };
}

console.log("\n[adaptive-workspace] golden / profile");

{
  const p390 = resolveWorkspaceLayout(settingsInput(390));
  assert.equal(p390.profile, "COMPACT");
  assert.equal(p390.primaryWidgetId, "settings.hub");
  assert.equal(p390.renderActivation, true);
  assert.equal(p390.panels.filter((p) => p.mode === "stage").length, 1);
  assert.equal(
    p390.panels.filter((p) => p.mode === "rail" || p.mode === "split").length,
    0,
  );
  ok("AWV-001 Settings COMPACT");
}

{
  const p = resolveWorkspaceLayout(settingsInput(820));
  assert.equal(p.profile, "COMFORT");
  ok("AWV-002 Settings COMFORT");
}

{
  const p = resolveWorkspaceLayout(settingsInput(1200));
  assert.equal(p.profile, "EXPANDED");
  ok("AWV-003 Settings EXPANDED");
}

{
  const p = resolveWorkspaceLayout(settingsInput(1600));
  assert.equal(p.profile, "PROFESSIONAL");
  assert.equal(p.primaryWidgetId, "settings.hub");
  ok("AWV-004 Settings PROFESSIONAL");
}

console.log("\n[adaptive-workspace] compatibility");

{
  const off = resolveWorkspaceLayout(settingsInput(1200, { compatibility: { mode: "off" } }));
  assert.equal(off.renderActivation, false);
  ok("AWV-031 off — no render activation");
}

{
  const shadow = resolveWorkspaceLayout(
    settingsInput(1200, { compatibility: { mode: "shadow" } }),
  );
  assert.equal(shadow.renderActivation, false);
  assert.equal(shadow.primaryWidgetId, "settings.hub");
  assert.ok(shadow.diagnostics.diagnosticCodes.includes("AW.COMPAT.SHADOW"));
  ok("AWV-030 shadow — diagnostics without render activation");
}

console.log("\n[adaptive-workspace] pins / tie-break / motion");

{
  const ai = completeManifest({
    id: "ai.assistant",
    canBePrimary: false,
    priority: 30,
    canPersist: true,
    canFloat: true,
    allowedPanelModes: ["rail", "floating"],
    preferredRegion: "utility",
  });
  const compact = resolveWorkspaceLayout(
    settingsInput(390, {
      manifests: [settingsHubManifest(), ai],
      preferences: {
        schemaVersion: ADAPTIVE_WORKSPACE_SCHEMA_VERSION,
        version: 1,
        pins: ["ai.assistant"],
      },
    }),
  );
  assert.equal(compact.primaryWidgetId, "settings.hub");
  assert.equal(
    compact.placements.some((p) => p.widgetId === "ai.assistant" && (p.mode === "rail" || p.mode === "split")),
    false,
  );
  ok("AWV-016 invalid AI pin in COMPACT does not displace primary");
}

{
  const a = completeManifest({
    id: "widget.a",
    canBePrimary: false,
    priority: 50,
    allowedPanelModes: ["rail", "sheet"],
    preferredRegion: "supporting-end",
  });
  const b = completeManifest({
    id: "widget.b",
    canBePrimary: false,
    priority: 50,
    allowedPanelModes: ["rail", "sheet"],
    preferredRegion: "supporting-end",
  });
  const sealed = feedGeoTestManifest();
  const plan = resolveWorkspaceLayout({
    schemaVersion: ADAPTIVE_WORKSPACE_SCHEMA_VERSION,
    availableSpace: baseSpace(1200),
    capabilities: { pointerFine: true, hover: true, touch: false, reducedMotion: false },
    environment: { shell: "web", localeDir: "ltr" },
    surfaceId: "home.discovery",
    primaryTask: "feed.browse",
    manifests: [sealed, b, a],
    panelRequests: [
      { widgetId: "widget.b", intent: "open" },
      { widgetId: "widget.a", intent: "open" },
    ],
    preferences: { schemaVersion: 1, version: 1, pins: [] },
    accessibility: {},
    compatibility: { mode: "on" },
  });
  const supporting = plan.placements.filter((p) => p.widgetId !== "feed.geo");
  assert.ok(supporting.length >= 1);
  // Equal priority: a before b by id when both placed; first capacity seat goes to higher source then id
  const ids = supporting.map((p) => p.widgetId);
  assert.ok(ids.includes("widget.a"));
  ok("AWV-020 equal-priority deterministic placement");
}

{
  const base = settingsInput(1200);
  const withMotion = resolveWorkspaceLayout({
    ...base,
    capabilities: { ...base.capabilities, reducedMotion: true },
  });
  const without = resolveWorkspaceLayout(base);
  assert.equal(
    stableStringify(withMotion.placements),
    stableStringify(without.placements),
  );
  assert.equal(withMotion.transitionIntent, "none");
  assert.notEqual(without.transitionIntent, "none");
  ok("AWV-021 / AWI-045 reduced motion changes transition only");
}

console.log("\n[adaptive-workspace] sealed / RTL / height / occlusion");

{
  const sealed = feedGeoTestManifest();
  const filters = completeManifest({
    id: "feed.filters",
    canBePrimary: false,
    priority: 80,
    allowedPanelModes: ["rail", "sheet"],
    preferredRegion: "supporting-start",
    collapseBehavior: "to-sheet",
  });
  const expanded = resolveWorkspaceLayout({
    schemaVersion: 1,
    availableSpace: baseSpace(1200),
    capabilities: { pointerFine: true, hover: true, touch: false, reducedMotion: false },
    environment: { shell: "web", localeDir: "ltr" },
    surfaceId: "home.discovery",
    primaryTask: "feed.browse",
    manifests: [sealed, filters],
    panelRequests: [{ widgetId: "feed.filters", intent: "open" }],
    preferences: { schemaVersion: 1, version: 1, pins: [] },
    accessibility: {},
    compatibility: { mode: "on" },
  });
  assert.equal(expanded.primaryWidgetId, "feed.geo");
  assert.equal(expanded.profile, "EXPANDED");
  const key = expanded.placements.find((p) => p.widgetId === "feed.geo")!
    .statePreservationKey;
  assert.equal(key, "feed.geo");

  const compact = resolveWorkspaceLayout({
    schemaVersion: 1,
    availableSpace: baseSpace(390),
    capabilities: { pointerFine: false, hover: false, touch: true, reducedMotion: false },
    environment: { shell: "web", localeDir: "ltr" },
    surfaceId: "home.discovery",
    primaryTask: "feed.browse",
    manifests: [sealed, filters],
    panelRequests: [{ widgetId: "feed.filters", intent: "open" }],
    preferences: { schemaVersion: 1, version: 1, pins: [] },
    accessibility: {},
    compatibility: { mode: "on" },
  });
  assert.equal(compact.primaryWidgetId, "feed.geo");
  assert.equal(
    compact.placements.find((p) => p.widgetId === "feed.geo")!.statePreservationKey,
    "feed.geo",
  );
  const life = compact.lifecycleIntents.find((l) => l.widgetId === "feed.geo")!;
  assert.notEqual(life.intent, "KEEP"); // KEEP unused here; sealed stays VISIBLE
  assert.equal(life.intent, "VISIBLE");
  const filterPlacement = compact.placements.find((p) => p.widgetId === "feed.filters");
  if (filterPlacement) {
    assert.ok(["sheet", "drawer", "overlay"].includes(filterPlacement.mode));
  }
  ok("AWV-032/033/034 sealed preservation across profiles");
}

{
  const sealed = feedGeoTestManifest();
  const filters = completeManifest({
    id: "feed.filters",
    canBePrimary: false,
    priority: 80,
    allowedPanelModes: ["rail", "sheet"],
    preferredRegion: "supporting-start",
  });
  const stack = completeManifest({
    id: "discovery.stack",
    canBePrimary: false,
    priority: 40,
    allowedPanelModes: ["rail", "sheet"],
    preferredRegion: "supporting-end",
  });
  const rtl = resolveWorkspaceLayout({
    schemaVersion: 1,
    availableSpace: baseSpace(1200),
    capabilities: { pointerFine: true, hover: true, touch: false, reducedMotion: false },
    environment: { shell: "web", localeDir: "rtl" },
    surfaceId: "home.discovery",
    primaryTask: "feed.browse",
    manifests: [sealed, filters, stack],
    panelRequests: [
      { widgetId: "feed.filters", intent: "open" },
      { widgetId: "discovery.stack", intent: "open" },
    ],
    preferences: { schemaVersion: 1, version: 1, pins: [] },
    accessibility: {},
    compatibility: { mode: "on" },
  });
  assert.ok(
    rtl.placements.some(
      (p) => p.widgetId === "feed.filters" && p.regionId === "supporting-start",
    ),
  );
  assert.ok(
    rtl.placements.some(
      (p) => p.widgetId === "discovery.stack" && p.regionId === "supporting-end",
    ),
  );
  ok("AWV-036 RTL keeps logical start/end regions");
}

{
  const short = resolveWorkspaceProfile({
    usableWidthPx: 1200,
    usableHeightPx: 400,
    bands: PROFILE_TEST_FIXTURE_BANDS,
  });
  assert.ok(short.heightDemoted);
  assert.notEqual(short.profile, "PROFESSIONAL");
  ok("AWV-025 height demotes supporting capacity band");
}

{
  const plan = resolveWorkspaceLayout(
    settingsInput(820, {
      availableSpace: baseSpace(820, 800, {
        occlusions: [{ kind: "hinge", widthPx: 40, heightPx: 800 }],
        stabilityToken: "stable-hinge",
      }),
    }),
  );
  assert.equal(plan.primaryWidgetId, "settings.hub");
  ok("AWV-026 hinge occlusion keeps primary");
}

console.log("\n[adaptive-workspace] negative / hard contracts");

{
  assert.throws(
    () =>
      validateResolveInput({
        schemaVersion: 99,
        surfaceId: "settings",
        primaryTask: "settings.edit",
        availableSpace: baseSpace(800),
        compatibility: { mode: "on" },
        manifests: [],
        preferences: { version: 1, pins: [] },
      }),
    (e: unknown) => e instanceof ValidationError && e.code.includes("SCHEMA"),
  );
  ok("unsupported schemaVersion");
}

{
  assert.throws(
    () =>
      validateWidgetManifestSet([
        settingsHubManifest(),
        settingsHubManifest({ id: "settings.hub" }),
      ]),
    (e: unknown) => e instanceof HardContractViolation,
  );
  ok("duplicate manifest id");
}

{
  assert.throws(
    () =>
      validateWidgetManifestSet([
        settingsHubManifest({ statePreservationKey: "same" }),
        sealedPrimaryManifest({
          id: "other",
          statePreservationKey: "same",
        }),
      ]),
    (e: unknown) => e instanceof HardContractViolation,
  );
  ok("duplicate statePreservationKey");
}

{
  assert.throws(
    () =>
      validateWidgetManifestSet([
        feedGeoTestManifest(),
        sealedPrimaryManifest({ id: "sealed.other", statePreservationKey: "sealed.other" }),
      ]),
    (e: unknown) => e instanceof HardContractViolation,
  );
  ok("duplicate sealed registration");
}

{
  assert.throws(
    () =>
      validateWidgetManifest({
        ...settingsHubManifest(),
        canBePrimary: false,
        allowedPanelModes: ["stage"],
      }),
    (e: unknown) => e instanceof ValidationError,
  );
  ok("stage requires canBePrimary");
}

{
  assert.throws(
    () =>
      validateWidgetManifest({
        ...settingsHubManifest({ id: "x" }),
        incompatibleWith: ["x"],
      }),
    (e: unknown) => e instanceof ValidationError,
  );
  ok("self-incompatible rejected");
}

{
  const plan = resolveWorkspaceLayout(
    settingsInput(800, {
      manifests: [
        completeManifest({
          id: "orphan.widget",
          canBePrimary: false,
          allowedPanelModes: ["rail", "sheet"],
          priority: 10,
        }),
      ],
    }),
  );
  assert.equal(plan.primaryWidgetId, null);
  assert.ok(
    plan.diagnostics.diagnosticCodes.includes("AW.FALLBACK.MISSING_PRIMARY"),
  );
  ok("AWV-028 missing primary → fallback");
}

{
  const plan = resolveWorkspaceLayout(
    settingsInput(800, {
      preferences: { schemaVersion: 1, version: 99, pins: ["nope"] },
    }),
  );
  assert.equal(plan.primaryWidgetId, "settings.hub");
  assert.ok(plan.diagnostics.preferenceWarnings.length >= 1);
  ok("AWV-029 invalid preference version soft-fallback");
}

{
  const plan = resolveWorkspaceLayout(
    settingsInput(800, {
      panelRequests: [{ widgetId: "does.not.exist", intent: "open" }],
    }),
  );
  assert.ok(plan.diagnostics.rejected.some((r) => r.widgetId === "does.not.exist"));
  ok("AWV-027 unknown widget rejected");
}

{
  assert.throws(
    () =>
      validateResolveInput({
        schemaVersion: 1,
        surfaceId: "settings",
        primaryTask: "settings.edit",
        availableSpace: baseSpace(800),
        compatibility: { mode: "on" },
        manifests: [settingsHubManifest()],
        preferences: { version: 1, pins: [] },
        requestKey: "forbidden",
      }),
    (e: unknown) => e instanceof ValidationError,
  );
  ok("domain denylist rejects requestKey on input");
}

console.log("\n[adaptive-workspace] properties / determinism");

{
  const input = settingsInput(1000);
  const a = resolveWorkspaceLayout(input);
  const b = resolveWorkspaceLayout(input);
  assert.equal(stableStringify(a), stableStringify(b));
  ok("AWI-001 same input → same canonical plan");
}

{
  const sealed = feedGeoTestManifest();
  const low = completeManifest({
    id: "low.widget",
    canBePrimary: false,
    priority: 1,
    allowedPanelModes: ["sheet", "overlay"],
    canOverlay: true,
  });
  const high = completeManifest({
    id: "high.widget",
    canBePrimary: false,
    priority: 90,
    allowedPanelModes: ["rail", "sheet"],
    preferredRegion: "supporting-end",
  });
  const mk = (manifests: WidgetManifest[]) =>
    resolveWorkspaceLayout({
      schemaVersion: 1,
      availableSpace: baseSpace(1200),
      capabilities: { pointerFine: true, hover: true, touch: false, reducedMotion: false },
      environment: { shell: "web", localeDir: "ltr" },
      surfaceId: "home.discovery",
      primaryTask: "feed.browse",
      manifests,
      panelRequests: [
        { widgetId: "high.widget", intent: "open" },
        { widgetId: "low.widget", intent: "open" },
      ],
      preferences: { schemaVersion: 1, version: 1, pins: [] },
      accessibility: {},
      compatibility: { mode: "on" },
    });
  const p1 = mk([sealed, low, high]);
  const p2 = mk([high, sealed, low]);
  assert.equal(stableStringify(p1.placements), stableStringify(p2.placements));
  ok("AWI-002 manifest order does not change placements");
}

{
  const narrow = resolveWorkspaceLayout(settingsInput(390));
  const wide = resolveWorkspaceLayout(settingsInput(1600));
  assert.equal(narrow.primaryWidgetId, "settings.hub");
  assert.equal(wide.primaryWidgetId, "settings.hub");
  ok("extra width does not remove primary");
}

{
  const input = settingsInput(800);
  const frozen = structuredClone(input);
  resolveWorkspaceLayout(input);
  assert.equal(stableStringify(input), stableStringify(frozen));
  ok("AWI-005 resolver does not mutate input");
}

{
  for (const key of WORKSPACE_DOMAIN_DENYLIST) {
    const plan = resolveWorkspaceLayout(settingsInput(800));
    assert.equal(
      JSON.stringify(plan).includes(`"${key}"`),
      false,
      `plan must not contain ${key}`,
    );
  }
  ok("AWI-006/007/008 plan has no denylisted domain keys");
}

{
  assert.ok(PANEL_MODE_META.modal.requiresFocusTrap);
  const modalWidget = completeManifest({
    id: "gate.modal",
    canBePrimary: false,
    canOverlay: true,
    allowedPanelModes: ["modal"],
    priority: 20,
  });
  const plan = resolveWorkspaceLayout(
    settingsInput(800, {
      manifests: [settingsHubManifest(), modalWidget],
      panelRequests: [{ widgetId: "gate.modal", intent: "open", preferredMode: "modal" }],
    }),
  );
  assert.equal(plan.focusIntent.trap, true);
  ok("AWI-026 modal focus trap intent");
}

{
  assert.ok(RESOLVE_PRECEDENCE[0] === "primary-task");
  assert.ok(isAllowedLifecycleTransition("VISIBLE", "HIDDEN"));
  assert.equal(isAllowedLifecycleTransition("DESTROYED", "VISIBLE"), false);
  assert.ok(WIDGET_LIFECYCLE_TRANSITIONS.HIDDEN.includes("VISIBLE"));
  ok("lifecycle + precedence contracts");
}

console.log("\n[adaptive-workspace] import boundary");

{
  const dir = join(root, "lib/adaptive-workspace");
  const forbiddenImport =
    /(?:from|require\()\s*['"](?:react|react-dom|next\/|@\/components\/|@\/app\/|@\/lib\/feed|@\/components\/feed|zustand|@prisma|next-auth|@capacitor)/i;

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
    if (file.endsWith("run-tests.ts")) continue;
    const src = readFileSync(file, "utf8");
    const importLines = src
      .split("\n")
      .filter((l) => /^\s*(import|export)\b/.test(l) || /require\s*\(/.test(l));
    for (const line of importLines) {
      assert.equal(
        forbiddenImport.test(line),
        false,
        `forbidden import in ${file}: ${line}`,
      );
    }
    assert.equal(/\bwindow\b|\bdocument\b|\bResizeObserver\b|\blocalStorage\b|\bsessionStorage\b|\bmatchMedia\b/.test(src), false, `browser global in ${file}`);
  }
  ok("lib/adaptive-workspace has no forbidden imports");
}

console.log("\n[adaptive-workspace] native / pwa shell inputs");

{
  const native = resolveWorkspaceLayout(
    settingsInput(390, {
      environment: { shell: "native", localeDir: "ltr" },
      availableSpace: baseSpace(390, 800, {
        chromeOccupied: { top: 64, bottom: 92, start: 0, end: 0 },
        stabilityToken: "stable-native",
      }),
    }),
  );
  assert.equal(native.profile, "COMPACT");
  assert.equal(native.primaryWidgetId, "settings.hub");
  ok("AWV-022 native shell uses chrome input, not UA profile");
}

{
  const pwa = resolveWorkspaceLayout(
    settingsInput(820, { environment: { shell: "pwa", localeDir: "ltr" } }),
  );
  assert.equal(pwa.profile, "COMFORT");
  ok("AWV-023 PWA shell input");
}

console.log(`\nadaptive-workspace pure core: ${passed} assertions ok\n`);
