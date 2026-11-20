import assert from "node:assert/strict";
import test from "node:test";
import {
  pathFromAppLink,
  pathFromColdStartAppLink,
  resetColdStartAppLinkForTests,
} from "./appLink";
import {
  androidAssetLinksStatement,
  sha256Fingerprint,
  DIRECT_APK_SHA256_HEX,
  PLAY_APP_SIGNING_SHA256_HEX,
} from "./androidAssetLinks";
import { GET as assetLinksGet } from "../../app/.well-known/assetlinks.json/route";
import { isSafeRestorablePath } from "./safeRoute";

const MESSAGE = "https://homecheff.eu/messages/conv_abc123/";
const NOTICE = "https://homecheff.eu/notifications/admin/camp_abc123";

test("bericht- en adminlinks worden het bestaande pad", () => {
  assert.equal(pathFromAppLink(MESSAGE), "/messages/conv_abc123/");
  assert.equal(
    pathFromAppLink(NOTICE),
    "/notifications/admin/camp_abc123/",
  );
  assert.equal(isSafeRestorablePath("/messages/conv_abc123/"), true);
  assert.equal(isSafeRestorablePath("/notifications/admin/camp_abc123"), true);
});

test("OAuth, Stripe en andere hosts worden niet onderschept", () => {
  const rejected = [
    "https://homecheff.eu/api/auth/callback/google",
    "https://homecheff.eu/api/auth/signin/google",
    "https://homecheff.eu/checkout/success/",
    "https://checkout.stripe.com/c/pay_123",
    "https://accounts.google.com/o/oauth2/v2/auth",
    "https://www.homecheff.eu/messages/conv_abc123/",
    "https://homecheff.nl/messages/conv_abc123/",
    "http://homecheff.eu/messages/conv_abc123/",
    "https://user:pass@homecheff.eu/messages/conv_abc123/",
    "https://homecheff.eu/",
    "https://evil.example/messages/conv_abc123/",
    "/messages/conv_abc123/",
  ];
  for (const url of rejected) {
    assert.equal(pathFromAppLink(url), null, url);
  }
});

test("cold start wordt één keer bewaard, een nieuwe link terwijl de app open is wel", () => {
  resetColdStartAppLinkForTests();
  assert.equal(pathFromColdStartAppLink(MESSAGE), "/messages/conv_abc123/");
  assert.equal(pathFromColdStartAppLink(NOTICE), null);
  assert.equal(pathFromAppLink(NOTICE), "/notifications/admin/camp_abc123/");
});

test("assetlinks bevat het APK-certificaat en het Play-certificaat", () => {
  const statement = androidAssetLinksStatement();
  assert.equal(statement.length, 1);
  assert.equal(statement[0].target.package_name, "eu.homecheff.mobile");
  assert.deepEqual(statement[0].target.sha256_cert_fingerprints, [
    sha256Fingerprint(DIRECT_APK_SHA256_HEX),
    sha256Fingerprint(PLAY_APP_SIGNING_SHA256_HEX),
  ]);
  assert.equal(
    statement[0].target.sha256_cert_fingerprints[0],
    "9E:99:2C:29:09:F1:6F:0A:04:9D:80:0A:BE:7E:A4:50:99:0F:72:A7:97:44:0A:F0:86:C0:77:9B:15:E9:F2:8B",
  );
  assert.equal(
    statement[0].target.sha256_cert_fingerprints[1],
    "4A:19:56:70:E4:A7:E9:25:F3:4B:D6:01:A5:D0:94:CA:E2:93:92:01:3B:44:4A:22:75:6A:CC:1A:5F:3F:A9:F2",
  );
});

test("assetlinks-route antwoordt JSON 200 zonder redirect", async () => {
  const response = await assetLinksGet();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("location"), null);
  assert.equal(response.headers.get("content-type"), "application/json");
  const body = (await response.json()) as Array<{
    target: { package_name: string; sha256_cert_fingerprints: string[] };
  }>;
  assert.equal(body[0].target.package_name, "eu.homecheff.mobile");
  assert.equal(body[0].target.sha256_cert_fingerprints.length, 2);
});
