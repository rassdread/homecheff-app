import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { HC_ECO_EPOCH_LOGGED_OUT } from "@/lib/ecosystem-session/epoch";
import { resolveAuthorizeEcoEpoch } from "./authorize-epoch";

describe("resolveAuthorizeEcoEpoch", () => {
  it("reuses existing parent-domain epoch from cookie", () => {
    const epoch = "11111111-2222-4333-8444-555555555555";
    const r = resolveAuthorizeEcoEpoch(`hc_eco_epoch=${epoch}; other=1`);
    assert.equal(r.ecoEpoch, epoch);
    assert.equal(r.shouldSetCookie, false);
  });

  it("mints when cookie absent", () => {
    const r = resolveAuthorizeEcoEpoch(null);
    assert.match(r.ecoEpoch, /^[0-9a-f-]{36}$/i);
    assert.equal(r.shouldSetCookie, true);
  });

  it("mints when logged-out sentinel", () => {
    const r = resolveAuthorizeEcoEpoch(
      `hc_eco_epoch=${HC_ECO_EPOCH_LOGGED_OUT}`,
    );
    assert.notEqual(r.ecoEpoch, HC_ECO_EPOCH_LOGGED_OUT);
    assert.equal(r.shouldSetCookie, true);
  });
});
