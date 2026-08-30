/**
 * Marketplace U5 — authorization code epoch prefix + trust inventory.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  generateAuthorizationCodeWithEpoch,
  parseEcoEpochFromAuthorizationCode,
} from "@/lib/identity/sso/code";
import {
  PARENT_DOMAIN_AUTH_TRUST_READY,
  SUBDOMAIN_TRUST_INVENTORY,
} from "@/lib/ecosystem-session/subdomain-trust";
import { HC_ECO_EPOCH_LOGGED_OUT } from "@/lib/ecosystem-session/epoch";

describe("U5 SSO code ecoEpoch prefix", () => {
  it("round-trips epoch through authorization code", () => {
    const epoch = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    const code = generateAuthorizationCodeWithEpoch(epoch);
    assert.equal(parseEcoEpochFromAuthorizationCode(code), epoch);
  });

  it("returns null for legacy codes without epoch", () => {
    assert.equal(parseEcoEpochFromAuthorizationCode("onlyRandomPartNoDotPrefix"), null);
  });
});

describe("U5 subdomain trust", () => {
  it("PARENT_DOMAIN_AUTH_TRUST_READY is certified", () => {
    assert.equal(PARENT_DOMAIN_AUTH_TRUST_READY, true);
    assert.ok(SUBDOMAIN_TRUST_INVENTORY.length >= 5);
    assert.equal(HC_ECO_EPOCH_LOGGED_OUT, "0");
  });
});
