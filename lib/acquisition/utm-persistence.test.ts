import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  readUtmFromSearchParams,
  scrubUtmValue,
  marketplaceUtmToStripeMetadata,
  utmQueryString,
  parseMarketplaceUtmFromCookieHeader,
  MARKETPLACE_UTM_COOKIE,
  type MarketplaceUtmCapture,
} from "./utm-persistence";

describe("marketplace utm persistence", () => {
  it("reads and scrubs UTM params", () => {
    const params = new URLSearchParams(
      "utm_source=google&utm_medium=cpc&utm_campaign=marketplace_nl_seller_search_v1&utm_content=ad_a&foo=1",
    );
    const cap = readUtmFromSearchParams(params, "/verkopen");
    assert.ok(cap);
    assert.equal(cap!.utm_source, "google");
    assert.equal(cap!.utm_medium, "cpc");
    assert.equal(cap!.utm_campaign, "marketplace_nl_seller_search_v1");
    assert.equal(cap!.landing_path, "/verkopen");
  });

  it("rejects empty or dangerous values", () => {
    assert.equal(scrubUtmValue("<script>"), undefined);
    assert.equal(scrubUtmValue(""), undefined);
    const params = new URLSearchParams("utm_source=<script>&utm_medium=");
    assert.equal(readUtmFromSearchParams(params), null);
  });

  it("builds query string from capture", () => {
    const capture: MarketplaceUtmCapture = {
      captured_at: "2026-09-03T00:00:00.000Z",
      utm_source: "meta",
      utm_campaign: "marketplace_test",
    };
    assert.equal(utmQueryString(capture), "utm_source=meta&utm_campaign=marketplace_test");
  });

  it("maps to Stripe metadata keys", () => {
    const meta = marketplaceUtmToStripeMetadata({
      captured_at: "2026-09-03T12:00:00.000Z",
      utm_source: "google",
      utm_medium: "cpc",
      landing_path: "/checkout",
    });
    assert.equal(meta.utm_source, "google");
    assert.equal(meta.utm_medium, "cpc");
    assert.equal(meta.landing_path, "/checkout");
    assert.equal(meta.first_touch_at, "2026-09-03T12:00:00.000Z");
    assert.equal(meta.utm_campaign, undefined);
  });

  it("parses cookie header without touching hc_ref", () => {
    const capture = {
      captured_at: "2026-09-03T00:00:00.000Z",
      utm_source: "newsletter",
      utm_campaign: "launch",
    };
    const header = `hc_ref=AFF123; ${MARKETPLACE_UTM_COOKIE}=${encodeURIComponent(JSON.stringify(capture))}; other=1`;
    const parsed = parseMarketplaceUtmFromCookieHeader(header);
    assert.ok(parsed);
    assert.equal(parsed!.utm_source, "newsletter");
    assert.equal(parsed!.utm_campaign, "launch");
  });
});
