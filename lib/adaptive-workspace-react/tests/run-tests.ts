/**
 * Phase 2B Settings shadow — pure adapter + structural contract tests (Node/tsx).
 * No jsdom/RTL dependency; React remount continuity is enforced via source contracts
 * + measurement coalesce proofs that prevent needless re-resolves.
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

import {
  coalesceMeasurement,
  coerceAdaptiveWorkspaceSettingsMode,
  createSettingsResolveInput,
  normalizeWorkspaceMeasurement,
  resolveAdaptiveWorkspaceSettingsMode,
  buildSettingsStabilityToken,
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

console.log("\n[adaptive-workspace-react] mode");

{
  assert.equal(coerceAdaptiveWorkspaceSettingsMode("off"), "off");
  assert.equal(coerceAdaptiveWorkspaceSettingsMode("shadow"), "shadow");
  assert.equal(coerceAdaptiveWorkspaceSettingsMode("on"), "shadow");
  assert.equal(coerceAdaptiveWorkspaceSettingsMode("weird"), resolveAdaptiveWorkspaceSettingsMode());
  ok("ON fails closed to shadow; off/shadow preserved");
}

console.log("\n[adaptive-workspace-react] measurement normalize / coalesce");

{
  assert.equal(normalizeWorkspaceMeasurement({ widthPx: 0, heightPx: 100 }), null);
  assert.equal(normalizeWorkspaceMeasurement({ widthPx: 100.9, heightPx: 200.2 })?.widthPx, 100);
  assert.equal(
    buildSettingsStabilityToken(1280, 720),
    "settings:1280x720:v1",
  );
  assert.equal(buildSettingsStabilityToken(1280, 720).includes("T"), false);
  ok("normalize floors; stability token deterministic");
}

{
  const first = coalesceMeasurement(null, { widthPx: 800, heightPx: 600 });
  assert.equal(first.shouldResolve, true);
  assert.equal(first.next?.stabilityToken, "settings:800x600:v1");

  const same = coalesceMeasurement(first.next, { widthPx: 800.4, heightPx: 600.9 });
  assert.equal(same.shouldResolve, false);

  const changed = coalesceMeasurement(first.next, { widthPx: 900, heightPx: 600 });
  assert.equal(changed.shouldResolve, true);
  assert.equal(changed.next?.widthPx, 900);
  ok("identical floored measurements do not re-resolve");
}

console.log("\n[adaptive-workspace-react] ResolveInput + shadow plan");

{
  const measurement = normalizeWorkspaceMeasurement({ widthPx: 1200, heightPx: 800 })!;
  const input = createSettingsResolveInput({
    measurement,
    compatibilityMode: "shadow",
  });
  assert.equal(input.surfaceId, "settings");
  assert.equal(input.compatibility.mode, "shadow");
  assert.equal(input.availableSpace.chromeOccupied.top, 0);
  assert.equal(input.availableSpace.widthPx, measurement.widthPx);
  assert.match(input.availableSpace.stabilityToken, /^settings:1200x800:chrome-0-0-0-0:v1$/);

  const plan = resolveWorkspaceLayout(input);
  assert.equal(plan.renderActivation, false);
  assert.equal(plan.primaryWidgetId, "settings.hub");
  assert.equal(plan.surfaceId, "settings");
  ok("shadow ResolveInput → renderActivation false");
}

{
  const measurement = normalizeWorkspaceMeasurement({ widthPx: 390, heightPx: 800 })!;
  const plan = resolveWorkspaceLayout(
    createSettingsResolveInput({ measurement, compatibilityMode: "shadow" }),
  );
  assert.equal(plan.profile, "COMPACT");
  assert.equal(plan.renderActivation, false);
  ok("COMPACT shadow plan still non-activating");
}

console.log("\n[adaptive-workspace-react] SSR render (no browser globals required)");

{
  const html = renderToString(
    createElement(SettingsWorkspaceShadowRoot, {
      modeOverride: "off",
      children: createElement(
        "div",
        { "data-settings-child": "1" },
        "Settings content",
      ),
    }),
  );
  assert.match(html, /Settings content/);
  assert.match(html, /data-aw-settings-shadow-root/);
  assert.match(html, /data-aw-settings-content/);
  assert.match(html, /data-aw-mode="off"/);
  assert.doesNotMatch(html, /data-aw-mode="on"/);
  ok("SSR HTML contains Settings child without measurement gate");
}

{
  const html = renderToString(
    createElement(SettingsWorkspaceShadowRoot, {
      modeOverride: "shadow",
      children: createElement("main", null, "Hub"),
    }),
  );
  assert.match(html, />Hub</);
  assert.match(html, /data-aw-render-activation="false"/);
  ok("SSR shadow root keeps child + renderActivation false attr");
}

console.log("\n[adaptive-workspace-react] source contracts");

{
  const shadowSrc = readFileSync(
    join(root, "components/adaptive-workspace/SettingsWorkspaceShadowRoot.tsx"),
    "utf8",
  );
  assert.equal(/key=\{[^}]*profile/.test(shadowSrc), false);
  assert.equal(/key=\{[^}]*width/.test(shadowSrc), false);
  assert.equal(/key=\{[^}]*layoutPlan/.test(shadowSrc), false);
  assert.equal(/key=\{[^}]*compatibilityMode/.test(shadowSrc), false);
  assert.match(shadowSrc, /data-aw-settings-content/);
  assert.match(shadowSrc, /ResizeObserver/);
  assert.match(shadowSrc, /compatibilityMode:\s*"shadow"/);
  assert.match(shadowSrc, /renderActivation = false/);
  assert.equal(/addEventListener\(\s*['"]resize['"]/.test(shadowSrc), false);
  assert.equal(/\blocalStorage\b/.test(shadowSrc), false);
  assert.equal(/\bsearchParams\b/.test(shadowSrc), false);
  ok("no profile/width keys; no window resize; no storage/query flags");
}

{
  const pageSrc = readFileSync(join(root, "app/settings/page.tsx"), "utf8");
  assert.match(pageSrc, /SettingsWorkspaceShadowRoot/);
  assert.match(pageSrc, /SettingsHubClient/);
  ok("Settings page wraps hub with shadow root");
}

{
  const providers = readFileSync(join(root, "components/Providers.tsx"), "utf8");
  assert.equal(/adaptive-workspace|WorkspaceProvider|SettingsWorkspaceShadowRoot/.test(providers), false);
  ok("no global WorkspaceProvider in Providers.tsx");
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
    const imports = src.split("\n").filter((l) => /^\s*import\b/.test(l));
    for (const line of imports) {
      assert.equal(
        /from\s+['"]react['"]|from\s+['"]@\/components\//.test(line),
        false,
        line,
      );
    }
  }
  ok("pure core still does not import React/components");
}

{
  const feedTouched = [
    "components/feed/GeoFeed.tsx",
    "components/home/HomePageClient.tsx",
  ];
  // Ensure we didn't stage accidental edits — files may exist; just confirm Phase 2B files don't import feed
  const phase2bFiles = [
    join(root, "components/adaptive-workspace/SettingsWorkspaceShadowRoot.tsx"),
    join(root, "lib/adaptive-workspace-react/create-settings-resolve-input.ts"),
  ];
  for (const f of phase2bFiles) {
    const src = readFileSync(f, "utf8");
    assert.equal(/lib\/feed|components\/feed|GeoFeed|homeComposedLayout/.test(src), false);
  }
  void feedTouched;
  ok("Phase 2B files do not import Feed");
}

console.log(`\nadaptive-workspace-react Phase 2B: ${passed} assertions ok\n`);
