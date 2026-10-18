import assert from "node:assert/strict";
import test from "node:test";
import {
  HC_CAMPAIGN_COOKIE,
  normalizeHcCampaignCode,
  parseHcCampaignCodeFromCookieHeader,
  readHcCampaignCodeFromSearch,
} from "./hc-campaign-code";

test("reads campaign= and ignores the short app download flag", () => {
  assert.equal(readHcCampaignCodeFromSearch(new URLSearchParams("campaign=vlaardingen10")), "VLAARDINGEN10");
  assert.equal(readHcCampaignCodeFromSearch(new URLSearchParams("campaign=app")), null);
  assert.equal(readHcCampaignCodeFromSearch(new URLSearchParams("utm_campaign=spring&hc_ref=AFF1")), null);
});

test("cookie parse does not read the affiliate cookie", () => {
  const header = `hc_ref=AFF1; ${HC_CAMPAIGN_COOKIE}=VLAARDINGEN10`;
  assert.equal(parseHcCampaignCodeFromCookieHeader(header), "VLAARDINGEN10");
  assert.equal(parseHcCampaignCodeFromCookieHeader("hc_ref=AFF1"), null);
  assert.equal(normalizeHcCampaignCode("bad code!"), null);
});
