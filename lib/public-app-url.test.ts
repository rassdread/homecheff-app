import assert from "node:assert/strict";
import test from "node:test";
import { getPublicAppUrl, resolvePreviewPublicOrigin } from "./public-app-url";

const PREVIEW = "https://homecheff-app-git-hc-campaign-b320c2-sergio-s-projects-f7b64ee1.vercel.app";

test("preview ignores a production public URL and uses the Vercel host", () => {
  const origin = getPublicAppUrl({
    VERCEL_ENV: "preview",
    NEXT_PUBLIC_APP_URL: "https://homecheff.eu",
    NEXTAUTH_URL: "https://homecheff.eu",
    VERCEL_URL: "homecheff-7aeddprsm-sergio-s-projects-f7b64ee1.vercel.app",
  });
  assert.equal(origin, "https://homecheff-7aeddprsm-sergio-s-projects-f7b64ee1.vercel.app");
});

test("preview prefers the explicit preview auth URL over the deployment host", () => {
  const origin = resolvePreviewPublicOrigin({
    VERCEL_ENV: "preview",
    PREVIEW_AUTH_URL: PREVIEW,
    NEXTAUTH_URL: "https://homecheff.eu",
    VERCEL_URL: "homecheff-7aeddprsm-sergio-s-projects-f7b64ee1.vercel.app",
  });
  assert.equal(origin, PREVIEW);
});

test("preview without a safe host does not fall back to production", () => {
  assert.equal(
    getPublicAppUrl({
      VERCEL_ENV: "preview",
      NEXT_PUBLIC_APP_URL: "https://homecheff.eu",
      NEXTAUTH_URL: "https://growth.homecheff.eu",
    }),
    "",
  );
});

test("production keeps the configured public URL", () => {
  assert.equal(
    getPublicAppUrl({
      VERCEL_ENV: "production",
      NODE_ENV: "production",
      NEXT_PUBLIC_APP_URL: "https://homecheff.eu",
    }),
    "https://homecheff.eu",
  );
});
