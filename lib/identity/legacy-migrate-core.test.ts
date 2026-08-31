import assert from "node:assert/strict";
import {
  legacyAuthStatus,
  normalizeMigrateEmail,
  resolveCentralFromSiblingLinks,
} from "./legacy-migrate-core";

assert.equal(normalizeMigrateEmail("  User@Example.COM "), "user@example.com");

assert.equal(
  legacyAuthStatus({
    centralUserId: "uuid",
    passwordHash: null,
    legacyLoginEnabled: false,
  }),
  "LEGACY_AUTH_RETIRED",
);

assert.equal(
  legacyAuthStatus({ centralUserId: "uuid", passwordHash: "x", legacyLoginEnabled: true }),
  "LEGACY_AUTH_MIGRATED",
);

assert.deepEqual(
  resolveCentralFromSiblingLinks([
    { centralUserId: "a", sourceSystem: "growth" },
    { centralUserId: "a", sourceSystem: "studio" },
  ]),
  { centralUserId: "a" },
);

assert.deepEqual(
  resolveCentralFromSiblingLinks([
    { centralUserId: "a", sourceSystem: "growth" },
    { centralUserId: "b", sourceSystem: "studio" },
  ]),
  { ambiguous: true },
);

assert.equal(resolveCentralFromSiblingLinks([]), null);

console.log("legacy-migrate-core.test.ts: ok");
