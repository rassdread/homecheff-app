/**
 * Structural validator for Phase 2E Messages split/stage shadow contract.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function mustExist(rel: string) {
  assert.ok(existsSync(join(root, rel)), `missing ${rel}`);
}

mustExist("lib/adaptive-workspace/registry/settings-manifests.ts");
mustExist(
  "lib/adaptive-workspace-react/messages/create-messages-shadow-resolve-input.ts",
);
mustExist("docs/audits/homecheff-adaptive-workspace-phase2e-messages-shadow.md");

const manifests = readFileSync(
  join(root, "lib/adaptive-workspace/registry/settings-manifests.ts"),
  "utf8",
);
assert.match(manifests, /messagesListManifest/);
assert.match(manifests, /messagesChatManifest/);
assert.match(manifests, /id:\s*"messages\.list"/);
assert.match(manifests, /id:\s*"messages\.chat"/);
assert.match(manifests, /statePreservationKey:\s*"messages\.list"/);
assert.match(manifests, /statePreservationKey:\s*"messages\.chat"/);
assert.doesNotMatch(manifests, /messages\.details/);
assert.doesNotMatch(manifests, /from\s+['"]react['"]/);

const adapter = readFileSync(
  join(
    root,
    "lib/adaptive-workspace-react/messages/create-messages-panel-requests.ts",
  ),
  "utf8",
);
assert.doesNotMatch(
  adapter,
  /conversationId|messageBody|draftBody|unreadCount/,
);
assert.doesNotMatch(adapter, /from\s+['"]react['"]/);

const resolve = readFileSync(
  join(
    root,
    "lib/adaptive-workspace-react/messages/create-messages-shadow-resolve-input.ts",
  ),
  "utf8",
);
assert.match(resolve, /surfaceId:\s*"messages"/);
assert.match(resolve, /messagesListManifest/);
assert.match(resolve, /messagesChatManifest/);
assert.doesNotMatch(resolve, /visualViewport/);

const pickPrimary = readFileSync(
  join(root, "lib/adaptive-workspace/resolver/resolve-workspace-layout.ts"),
  "utf8",
);
assert.match(pickPrimary, /taskScore/);
assert.match(pickPrimary, /Exact primaryTask/);

const shadow = readFileSync(
  join(root, "components/adaptive-workspace/SettingsWorkspaceShadowRoot.tsx"),
  "utf8",
);
assert.match(shadow, /createMessagesShadowResolveInput/);
assert.match(shadow, /data-aw-messages-/);
assert.match(shadow, /renderActivation = false/);
assert.equal((shadow.match(/new ResizeObserver/g) || []).length, 1);
assert.doesNotMatch(shadow, /visualViewport/);
assert.doesNotMatch(shadow, /GeoFeed|homeComposedLayout/);

const providers = readFileSync(join(root, "components/Providers.tsx"), "utf8");
assert.doesNotMatch(
  providers,
  /WorkspaceProvider|MessagesWorkspace|SettingsWorkspaceShadowRoot/,
);

const messagesPage = readFileSync(join(root, "app/messages/page.tsx"), "utf8");
assert.doesNotMatch(messagesPage, /adaptive-workspace/);

console.log("validate-adaptive-workspace-messages-shadow: ok");
