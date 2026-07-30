/**
 * Structural validator for Phase 2D Notifications shadow contract.
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
  "lib/adaptive-workspace-react/notifications/create-notifications-panel-request.ts",
);
mustExist(
  "lib/adaptive-workspace-react/notifications/create-settings-notifications-resolve-input.ts",
);
mustExist("docs/audits/homecheff-adaptive-workspace-phase2d-notifications-shadow.md");

const manifests = readFileSync(
  join(root, "lib/adaptive-workspace/registry/settings-manifests.ts"),
  "utf8",
);
assert.match(manifests, /notificationsInboxManifest/);
assert.match(manifests, /id:\s*"notifications\.inbox"/);
assert.match(manifests, /statePreservationKey:\s*"notifications\.inbox"/);
assert.match(manifests, /canBePrimary:\s*false/);
assert.match(manifests, /collapseBehavior:\s*"to-sheet"/);
assert.doesNotMatch(manifests, /from\s+['"]react['"]/);
assert.doesNotMatch(manifests, /NotificationBell|useNotifications|\/api\/notifications/);

const adapter = readFileSync(
  join(
    root,
    "lib/adaptive-workspace-react/notifications/create-notifications-panel-request.ts",
  ),
  "utf8",
);
assert.doesNotMatch(adapter, /unreadCount|notificationRecords|markAsRead/);
assert.doesNotMatch(adapter, /from\s+['"]react['"]/);

const compose = readFileSync(
  join(
    root,
    "lib/adaptive-workspace-react/notifications/create-settings-notifications-resolve-input.ts",
  ),
  "utf8",
);
assert.match(compose, /settingsHubManifest/);
assert.match(compose, /notificationsInboxManifest/);
assert.doesNotMatch(compose, /unreadCount|notificationRecords/);

const shadow = readFileSync(
  join(root, "components/adaptive-workspace/SettingsWorkspaceShadowRoot.tsx"),
  "utf8",
);
assert.match(shadow, /createSettingsNotificationsResolveInput/);
assert.match(shadow, /data-aw-notifications-/);
assert.match(shadow, /renderActivation = false/);
assert.doesNotMatch(shadow, /compatibilityMode:\s*["']on["']/);
assert.equal((shadow.match(/new ResizeObserver/g) || []).length, 1);
assert.doesNotMatch(shadow, /GeoFeed|homeComposedLayout/);

const providers = readFileSync(join(root, "components/Providers.tsx"), "utf8");
assert.doesNotMatch(
  providers,
  /WorkspaceProvider|NotificationsWorkspace|SettingsWorkspaceShadowRoot/,
);

console.log("validate-adaptive-workspace-notifications-shadow: ok");
