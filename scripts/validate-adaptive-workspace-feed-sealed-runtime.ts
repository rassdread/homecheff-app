/**
 * Phase 3B.1 — Feed sealed-runtime shadow baseline static safety validator.
 *
 * Proves: single GeoFeed production mount, no Feed Workspace renderer,
 * no Workspace input in requestKey / nativePaintKey, renderActivation false,
 * legacy single writer, no forbidden keys around GeoFeed.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, sep } from "node:path";

const root = process.cwd();

function mustExist(rel: string) {
  assert.ok(existsSync(join(root, rel)), `missing ${rel}`);
}

function walkTs(dir: string, skip = new Set(["tests", "node_modules"])): string[] {
  const out: string[] = [];
  if (!existsSync(dir)) return out;
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(ent.name)) continue;
    const p = join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walkTs(p, skip));
    else if (/\.(ts|tsx)$/.test(ent.name)) out.push(p);
  }
  return out;
}

mustExist("lib/adaptive-workspace/sealed/feed-discovery-sealed-contract.ts");
mustExist("lib/adaptive-workspace/sealed/validate-sealed-runtime-contract.ts");
mustExist("lib/adaptive-workspace/sealed/feed-discovery-invariants.ts");
mustExist("lib/adaptive-workspace-react/feed/evaluate-feed-discovery-shadow.ts");
mustExist("lib/adaptive-workspace-react/feed/feed-discovery-diagnostics.ts");
mustExist("lib/feed/feed-sealed-runtime-instrumentation.ts");
mustExist(
  "docs/audits/homecheff-adaptive-workspace-phase3b1-feed-sealed-runtime.md",
);

const manifests = readFileSync(
  join(root, "lib/adaptive-workspace/registry/settings-manifests.ts"),
  "utf8",
);
assert.match(manifests, /feedDiscoveryManifest/);
assert.match(manifests, /id:\s*"feed\.discovery"/);
assert.doesNotMatch(manifests, /from\s+['"]react['"]/);
assert.doesNotMatch(manifests, /from\s+['"]@\/components\/feed/);

const sealed = readFileSync(
  join(
    root,
    "lib/adaptive-workspace/sealed/feed-discovery-sealed-contract.ts",
  ),
  "utf8",
);
assert.match(sealed, /FEED_DISCOVERY_WIDGET_ID\s*=\s*"feed\.discovery"/);
assert.match(sealed, /renderActivation:\s*false/);
assert.match(sealed, /shadowActivation:\s*true/);
assert.match(sealed, /activeWriter:\s*"legacy"/);
assert.match(sealed, /runtimeClassification:\s*"sealed-runtime"/);

const shadow = readFileSync(
  join(
    root,
    "lib/adaptive-workspace-react/feed/evaluate-feed-discovery-shadow.ts",
  ),
  "utf8",
);
assert.match(shadow, /renderActivation:\s*false/);
assert.match(shadow, /shadowActivation:\s*true/);
assert.match(shadow, /workspaceRendererRegistered:\s*false/);
assert.doesNotMatch(shadow, /from\s+['"]react['"]/);
assert.doesNotMatch(
  shadow,
  /from\s+['"][^'"]*GeoFeed[^'"]*['"]|homeComposedLayout/,
);

// No Feed Workspace renderer components
assert.equal(
  existsSync(join(root, "components/adaptive-workspace/FeedWorkspaceRoot.tsx")),
  false,
);
assert.equal(
  existsSync(
    join(root, "components/adaptive-workspace/FeedWorkspaceShadowRoot.tsx"),
  ),
  false,
);
assert.equal(
  existsSync(join(root, "lib/adaptive-workspace-react/feed-mode.ts")),
  false,
);

// Single production GeoFeed JSX mount
const homeClient = readFileSync(
  join(root, "components/home/HomePageClient.tsx"),
  "utf8",
);
const geoMounts = homeClient.match(/<GeoFeed\b/g) ?? [];
assert.equal(geoMounts.length, 1, "exactly one GeoFeed JSX mount in HomePageClient");

// Forbidden keying around GeoFeed mount site
const geoBlock = homeClient.slice(
  homeClient.indexOf("<GeoFeed"),
  homeClient.indexOf("<GeoFeed") + 400,
);
assert.doesNotMatch(geoBlock, /\bkey=\{/);
assert.doesNotMatch(
  geoBlock,
  /profile|AvailableSpace|regionId|slotId|panelId|shadowActivation|renderActivation|workspaceMode/i,
);

// Dynamic import single site
const geoDynamic = readFileSync(
  join(root, "components/home/HomeGeoFeedDynamic.tsx"),
  "utf8",
);
assert.match(
  geoDynamic,
  /dynamic\(\s*\(\)\s*=>\s*import\(['"]@\/components\/feed\/GeoFeed['"]\)/,
);
assert.equal(
  (geoDynamic.match(/import\(['"]@\/components\/feed\/GeoFeed['"]\)/g) ?? [])
    .length,
  2,
  "GeoFeed + FeedContent dynamic imports only (2)",
);

// No second production render import of GeoFeed component default outside home
const productionDirs = [
  "app",
  "components",
];
const forbiddenMountFiles: string[] = [];
for (const dir of productionDirs) {
  for (const file of walkTs(join(root, dir))) {
    if (file.includes(`${join("components", "feed")}${sep}`)) {
      continue;
    }
    if (file.endsWith("HomeGeoFeedDynamic.tsx")) continue;
    if (file.endsWith("HomePageClient.tsx")) continue;
    const src = readFileSync(file, "utf8");
    if (/<GeoFeed\b/.test(src)) forbiddenMountFiles.push(file);
    if (
      /from\s+['"]@\/components\/feed\/GeoFeed['"]/.test(src) &&
      /<GeoFeed\b/.test(src)
    ) {
      forbiddenMountFiles.push(file);
    }
  }
}
assert.deepEqual(
  forbiddenMountFiles,
  [],
  `extra GeoFeed mounts: ${forbiddenMountFiles.join(", ")}`,
);

// requestKey / nativePaintKey free of Workspace metadata
const geoFeed = readFileSync(join(root, "components/feed/GeoFeed.tsx"), "utf8");
assert.match(geoFeed, /feedSealedNoteGeoFeedMount/);
assert.match(geoFeed, /feedSealedNoteGeoFeedUnmount/);
assert.match(geoFeed, /feedSealedNoteRequestKey/);
assert.match(geoFeed, /feedSealedNoteRequestStart/);
assert.doesNotMatch(geoFeed, /from\s+['"]@\/lib\/adaptive-workspace['"]/);
assert.doesNotMatch(geoFeed, /from\s+['"]@\/components\/adaptive-workspace/);
assert.doesNotMatch(
  geoFeed,
  /from\s+['"]@\/lib\/adaptive-workspace-react/,
);

const queryParams = readFileSync(
  join(root, "lib/feed/feed-query-params.ts"),
  "utf8",
);
assert.doesNotMatch(
  queryParams,
  /adaptive-workspace|AvailableSpace|WorkspaceProfile|renderActivation|shadowActivation|feed\.discovery/,
);

assert.doesNotMatch(
  geoFeed,
  /requestKey[^\n]{0,120}(AvailableSpace|WorkspaceProfile|renderActivation|shadowActivation|feed\.discovery)/,
);

// nativePaintKey is denylist-only in AW; must not appear as Feed request identity
assert.doesNotMatch(geoFeed, /\bnativePaintKey\b/);
assert.doesNotMatch(queryParams, /\bnativePaintKey\b/);

// Workspace feed package must not call /api/feed
for (const file of walkTs(join(root, "lib/adaptive-workspace-react/feed"))) {
  const src = readFileSync(file, "utf8");
  assert.doesNotMatch(src, /\/api\/feed|fetch\(/);
  assert.doesNotMatch(src, /from\s+['"]react['"]/);
  assert.doesNotMatch(src, /GeoFeed/);
}
for (const file of walkTs(join(root, "lib/adaptive-workspace/sealed"))) {
  const src = readFileSync(file, "utf8");
  assert.doesNotMatch(src, /\/api\/feed|from\s+['"]react['"]/);
  assert.doesNotMatch(src, /GeoFeed|@\/components\/feed/);
}

// Homepage / page still free of Feed Workspace activation
const page = readFileSync(join(root, "app/page.tsx"), "utf8");
assert.doesNotMatch(page, /FeedWorkspace|feed\.discovery|renderActivation/);
assert.doesNotMatch(homeClient, /FeedWorkspace|evaluateFeedDiscoveryShadow/);

const providers = readFileSync(join(root, "components/Providers.tsx"), "utf8");
assert.doesNotMatch(providers, /FeedWorkspace|evaluateFeedDiscoveryShadow/);

console.log("validate-adaptive-workspace-feed-sealed-runtime: ok");
