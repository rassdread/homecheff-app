import assert from "node:assert/strict";
import test from "node:test";
import { campaignGrantAttemptSettled } from "./campaign-grant-attempt";

test("a Growth outage or pause keeps the listing reward retryable", () => {
  assert.equal(campaignGrantAttemptSettled({ ok: false, code: "GROWTH_UNAVAILABLE" }), false);
  assert.equal(campaignGrantAttemptSettled({ ok: false, code: "CAMPAIGN_NOT_ACTIVE" }), false);
  assert.equal(campaignGrantAttemptSettled({ ok: true, pending: true }), false);
});

test("a grant or a terminal refusal stops the retry", () => {
  assert.equal(campaignGrantAttemptSettled({ ok: true, pending: false }), true);
  assert.equal(campaignGrantAttemptSettled({ ok: false, code: "CAMPAIGN_BUDGET_EXCEEDED" }), true);
  assert.equal(campaignGrantAttemptSettled({ ok: false, code: "CAMPAIGN_ENDED" }), true);
});
