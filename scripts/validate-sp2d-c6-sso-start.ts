/**
 * SP.2D-C6 — HomeCheff /auth/sso/start latency + security regressions.
 * Does not hit live Production.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SsoStartTimer } from "../lib/identity/sso/start-timing";
import {
  parseSsoInteraction,
  requiresInteractiveConfirmation,
} from "../lib/identity/sso/interaction";
import { resolveAccountStatus } from "../lib/identity/sso/account-status";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function ok(msg: string) {
  console.log("  ✓", msg);
}

function main() {
  const timer = new SsoStartTimer();
  timer.mark("parse");
  timer.setDuration("user", 12);
  timer.setDuration("persist", 34);
  const header = timer.toHeaderValue();
  assert.match(header, /parse;dur=\d+/);
  assert.match(header, /user;dur=12/);
  assert.match(header, /persist;dur=34/);
  assert.match(header, /total;dur=\d+/);
  assert.doesNotMatch(header, /code=|email|@|token|state=/i);
  ok("Server-Timing durations only");

  const startSrc = readFileSync(resolve(root, "app/auth/sso/start/route.ts"), "utf8");
  assert.match(startSrc, /resolveCentralUserIdFromRequest/);
  assert.match(startSrc, /applySsoStartServerTiming|SsoStartTimer/);
  assert.doesNotMatch(startSrc, /await auth\(\)/);
  assert.doesNotMatch(startSrc, /from \"@\/lib\/auth\"/);
  assert.match(startSrc, /import\(\"@\/lib\/identity\/sso\/authorize\"\)/);
  assert.doesNotMatch(startSrc, /import \{ issueSsoAuthorizationCode \}/);
  ok("start uses JWT resolve; dynamic authorize; no auth() marketplace hydrate");

  const authorizeSrc = readFileSync(resolve(root, "lib/identity/sso/authorize.ts"), "utf8");
  assert.match(authorizeSrc, /loadCentralUserForAuthorizeOrThrow/);
  assert.match(authorizeSrc, /void writeSsoAudit/);
  ok("authorize narrow user select + non-blocking success audit");

  const accountSrc = readFileSync(resolve(root, "lib/identity/sso/account-status.ts"), "utf8");
  assert.match(accountSrc, /loadCentralUserForAuthorizeOrThrow/);
  assert.match(accountSrc, /accountDeletedAt/);
  assert.match(accountSrc, /suspendedAt/);
  ok("authorize active-check still loads deletion/suspension flags");

  assert.equal(parseSsoInteraction("silent"), "silent");
  assert.equal(requiresInteractiveConfirmation("silent"), false);
  assert.equal(requiresInteractiveConfirmation("select_account"), true);
  assert.equal(requiresInteractiveConfirmation("login"), true);
  ok("silent skips continue; select_account still interactive");

  assert.equal(resolveAccountStatus({ accountDeletedAt: null, suspendedAt: null }), "active");
  assert.equal(
    resolveAccountStatus({ accountDeletedAt: new Date(), suspendedAt: null }),
    "deleted",
  );
  assert.equal(
    resolveAccountStatus({ accountDeletedAt: null, suspendedAt: new Date() }),
    "suspended",
  );
  ok("account status gates");

  const resolveSrc = readFileSync(
    resolve(root, "lib/identity/sso/resolve-central-user-id.ts"),
    "utf8",
  );
  assert.match(resolveSrc, /getToken/);
  assert.match(resolveSrc, /NEXTAUTH_SESSION_COOKIE_NAME/);
  assert.match(resolveSrc, /UUID_RE/);
  ok("JWT resolve uses shared cookie name + UUID check");

  console.log("\nSP.2D-C6 HC SSO start tests: PASS");
}

main();
