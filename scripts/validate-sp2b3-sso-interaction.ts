/**
 * SP.2B.3 — SSO interaction mode unit tests.
 * Usage: npx tsx scripts/validate-sp2b3-sso-interaction.ts
 */
import assert from "node:assert/strict";
import {
  googlePromptForInteraction,
  parseSsoInteraction,
  requiresInteractiveConfirmation,
} from "../lib/identity/sso/interaction";
import { ssoContinueRelativePath, ssoStartRelativePath } from "../lib/identity/sso/start-params";

function ok(msg: string) {
  console.log("  ✓", msg);
}

console.log("SP.2B.3 SSO interaction modes\n");

assert.equal(parseSsoInteraction(null), "silent");
assert.equal(parseSsoInteraction(""), "silent");
assert.equal(parseSsoInteraction("bogus"), "silent");
assert.equal(parseSsoInteraction("select_account"), "select_account");
assert.equal(parseSsoInteraction("CLAIM"), "claim");
ok("parseSsoInteraction defaults and aliases");

assert.equal(requiresInteractiveConfirmation("silent"), false);
assert.equal(requiresInteractiveConfirmation("login"), true);
assert.equal(requiresInteractiveConfirmation("select_account"), true);
assert.equal(requiresInteractiveConfirmation("claim"), true);
ok("interactive confirmation rules");

assert.equal(googlePromptForInteraction("silent"), undefined);
assert.equal(googlePromptForInteraction("select_account"), "select_account");
assert.equal(googlePromptForInteraction("claim"), "select_account");
ok("Google prompt mapping");

const sample = {
  product: "studio",
  redirectUri: "https://studio.homecheff.eu/auth/sso/callback",
  state: "abcdefghijklmnopqrstuvwxyz012345",
  codeChallenge: "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG",
  codeChallengeMethod: "S256",
  interaction: "select_account" as const,
  loginHint: "user@example.com" as string | null,
};
const start = ssoStartRelativePath(sample);
assert.ok(start.startsWith("/auth/sso/start?"));
assert.ok(start.includes("interaction=select_account"));
assert.ok(start.includes("login_hint="));
const cont = ssoContinueRelativePath(sample);
assert.ok(cont.startsWith("/auth/sso/continue?"));
assert.ok(cont.includes("interaction=select_account"));
ok("start/continue path builders");

console.log("\nAll SP.2B.3 interaction unit tests passed.");
