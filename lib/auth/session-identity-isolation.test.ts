/**
 * Marketplace multi-tab session identity contracts.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function ok(msg: string) {
  console.log("  ✓", msg);
}

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

const channel = read("lib/auth/session-identity-channel.ts");
assert.match(channel, /homecheff-marketplace-auth/);
assert.match(channel, /BroadcastChannel/);
ok("MARKETPLACE_AUTH_CHANNEL");

const guard = read("components/SessionGuard.tsx");
assert.match(guard, /visibilitychange/);
assert.match(guard, /pageshow/);
assert.match(guard, /getSession/);
assert.match(guard, /Sessie gewijzigd/);
assert.match(guard, /clearSensitiveUserDataOnLogout/);
ok("CROSS_TAB_ACCOUNT_SWITCH_INVALIDATION");

const cleanup = read("lib/session-cleanup.ts");
assert.match(cleanup, /postMarketplaceAuthChannel/);
assert.match(cleanup, /type: 'logout'/);
ok("LOGOUT_BROADCAST");

const products = read("app/api/products/[id]/route.ts");
assert.match(products, /sellerProfile|ownerId|session/);
ok("MARKETPLACE_RESOURCE_AUTH_SAMPLE");

console.log("\nMarketplace session identity isolation tests: PASS");
