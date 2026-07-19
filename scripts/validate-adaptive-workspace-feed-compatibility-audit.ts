/**
 * Phase 3A validator — Feed compatibility audit artifacts + activation absence.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function mustExist(rel: string) {
  assert.ok(existsSync(join(root, rel)), `missing ${rel}`);
}

mustExist("docs/architecture/homecheff-adaptive-workspace-platform-contract-v1.md");
mustExist("docs/audits/homecheff-adaptive-workspace-phase3a-feed-compatibility.md");
mustExist("docs/audits/homecheff-adaptive-workspace-phase3a-feed-inventory.json");
mustExist("docs/audits/homecheff-adaptive-workspace-phase2g-settings-on-freeze.md");
mustExist("scripts/validate-adaptive-workspace-feed-compatibility-audit.ts");

const contract = readFileSync(
  join(root, "docs/architecture/homecheff-adaptive-workspace-platform-contract-v1.md"),
  "utf8",
);
assert.match(contract, /Adaptive Workspace Platform Contract v1/);
assert.match(contract, /Universal platform contracts/);
assert.match(contract, /Settings-specific/);
assert.match(contract, /Sealed widget/);

const audit = readFileSync(
  join(root, "docs/audits/homecheff-adaptive-workspace-phase3a-feed-compatibility.md"),
  "utf8",
);
assert.match(audit, /READY FOR PHASE 3B WITH PRECONDITIONS/);
assert.match(audit, /feed\.discovery/);
assert.match(audit, /GeoFeed/);
assert.match(audit, /requestKey/);
assert.match(audit, /homeComposedLayout/);
assert.match(audit, /Phase 3B/);
assert.doesNotMatch(audit, /IMPLEMENTED FEED WORKSPACE ROOT/i);

const inv = JSON.parse(
  readFileSync(
    join(root, "docs/audits/homecheff-adaptive-workspace-phase3a-feed-inventory.json"),
    "utf8",
  ),
);
assert.equal(inv.schemaVersion, 1);
assert.equal(inv.decision, "READY_FOR_PHASE_3B_WITH_PRECONDITIONS");
assert.equal(inv.proposedFirstWidget, "feed.discovery");
assert.ok(Array.isArray(inv.preconditionsForPhase3B));
assert.ok(inv.preconditionsForPhase3B.length >= 4);

const freeze = readFileSync(
  join(root, "docs/audits/homecheff-adaptive-workspace-phase2g-settings-on-freeze.md"),
  "utf8",
);
assert.match(freeze, /READY TO FREEZE SETTINGS ON PILOT/);

assert.equal(existsSync(join(root, "lib/adaptive-workspace-react/feed-mode.ts")), false);
assert.equal(
  existsSync(join(root, "components/adaptive-workspace/FeedWorkspaceRoot.tsx")),
  false,
);
assert.equal(
  existsSync(join(root, "components/adaptive-workspace/FeedWorkspaceShadowRoot.tsx")),
  false,
);

const geo = readFileSync(join(root, "components/feed/GeoFeed.tsx"), "utf8");
assert.doesNotMatch(geo, /from ['"]@\/lib\/adaptive-workspace/);
assert.doesNotMatch(geo, /from ['"]@\/components\/adaptive-workspace/);

const page = readFileSync(join(root, "app/page.tsx"), "utf8");
assert.doesNotMatch(page, /adaptive-workspace|FeedWorkspace|renderActivation/);

const providers = readFileSync(join(root, "components/Providers.tsx"), "utf8");
assert.doesNotMatch(providers, /WorkspaceProvider|FeedWorkspace/);

console.log("validate-adaptive-workspace-feed-compatibility-audit: ok");
