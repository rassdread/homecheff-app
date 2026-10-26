import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { financialStripePublishableKey, financialStripeSecret, stripeLivemodeMatches } from "./stripe-runtime-guard";

test("preview refuses a live secret and a live publishable key", () => {
  assert.equal(financialStripeSecret("sk_live_blocked", { VERCEL_ENV: "preview" }), null);
  assert.equal(
    financialStripePublishableKey("pk_live_blocked", { env: { VERCEL_ENV: "preview" } }),
    null,
  );
});

test("preview accepts test keys", () => {
  assert.equal(financialStripeSecret("sk_test_preview", { VERCEL_ENV: "preview" }), "sk_test_preview");
  assert.equal(
    financialStripePublishableKey("pk_test_preview", { env: { VERCEL_ENV: "preview" } }),
    "pk_test_preview",
  );
});

test("preview without a secret fails closed", () => {
  assert.equal(financialStripeSecret(null, { VERCEL_ENV: "preview" }), null);
  assert.equal(financialStripeSecret("   ", { VERCEL_ENV: "preview" }), null);
});

test("livemode must match the key, and a missing mode does not match", () => {
  assert.equal(stripeLivemodeMatches("sk_test_preview", false), true);
  assert.equal(stripeLivemodeMatches("sk_test_preview", true), false);
  assert.equal(stripeLivemodeMatches("sk_live_production", true), true);
  assert.equal(stripeLivemodeMatches("sk_live_production", false), false);
  assert.equal(stripeLivemodeMatches("sk_test_preview", null), false);
  assert.equal(stripeLivemodeMatches(null, false), false);
});

test("production still accepts a live secret", () => {
  assert.equal(financialStripeSecret("sk_live_production", { VERCEL_ENV: "production" }), "sk_live_production");
});

test("a vercel.app browser does not load a live publishable key", () => {
  assert.equal(financialStripePublishableKey("pk_live_blocked", { previewHost: true }), null);
  assert.equal(financialStripePublishableKey("pk_test_preview", { previewHost: true }), "pk_test_preview");
});

test("registration does not grant campaign HC", () => {
  const source = readFileSync(new URL("../app/api/auth/register/route.ts", import.meta.url), "utf8");
  assert.match(source, /persistHcCampaignCodeFirstTouch/);
  assert.doesNotMatch(source, /qualifyFirstListing|retryPendingCampaignGrant|HcLedgerEntry|hcWallet/);
});

test("preview Google sign-in is not enabled from the production client", () => {
  const source = readFileSync(new URL("./auth.ts", import.meta.url), "utf8");
  assert.match(source, /isPreviewDeployment\(\) \? null : resolveGoogleWebOAuthClient\(\)/);
  assert.match(source, /resolvePreviewGoogleOAuthClient\(\)/);
  assert.doesNotMatch(source, /Boolean\(googleWebClient\) && !isPreviewDeployment\(\)/);
});
