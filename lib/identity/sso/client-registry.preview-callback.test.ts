import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  STUDIO_SSO_APPROVED_PREVIEW_CALLBACK,
  approvedPreviewRedirectUri,
  assertRedirectAllowed,
  authenticateSsoClient,
  resolveStudioClient,
} from "./client-registry";
import { SsoError } from "./constants";

const PRODUCTION_CALLBACK = "https://studio.homecheff.eu/auth/sso/callback";
const MOTION_CALLBACK = "https://motion.homecheff.eu/auth/sso/callback";
const UNRELATED_VERCEL =
  "https://homecheff-motion-example-not-this-preview.vercel.app/auth/sso/callback";
const WILDCARD = "https://*.vercel.app/auth/sso/callback";

const ENV_KEYS = [
  "VERCEL_ENV",
  "STUDIO_SSO_CLIENT_ID",
  "STUDIO_SSO_CLIENT_SECRET",
  "STUDIO_SSO_REDIRECT_URI",
  "STUDIO_SSO_PREVIEW_REDIRECT_URI",
] as const;

const previous: Record<string, string | undefined> = {};

function rememberEnv() {
  for (const key of ENV_KEYS) previous[key] = process.env[key];
}

function restoreEnv() {
  for (const key of ENV_KEYS) {
    if (previous[key] == null) delete process.env[key];
    else process.env[key] = previous[key];
  }
}

function useStudioEnv(input: { redirectUri: string; preview?: string }) {
  process.env.VERCEL_ENV = "production";
  process.env.STUDIO_SSO_CLIENT_ID = "studio-test-client";
  process.env.STUDIO_SSO_CLIENT_SECRET = "studio-test-secret";
  process.env.STUDIO_SSO_REDIRECT_URI = input.redirectUri;
  if (input.preview == null) delete process.env.STUDIO_SSO_PREVIEW_REDIRECT_URI;
  else process.env.STUDIO_SSO_PREVIEW_REDIRECT_URI = input.preview;
}

describe("append-only Studio Preview SSO callback", () => {
  rememberEnv();
  afterEach(() => restoreEnv());

  it("accepts the existing production callback and preserves the CSV", () => {
    useStudioEnv({
      redirectUri: `${PRODUCTION_CALLBACK},${MOTION_CALLBACK}`,
      preview: STUDIO_SSO_APPROVED_PREVIEW_CALLBACK,
    });
    const client = resolveStudioClient();
    assert.ok(client);
    assert.deepEqual(client.allowedRedirectUris, [
      PRODUCTION_CALLBACK,
      MOTION_CALLBACK,
      STUDIO_SSO_APPROVED_PREVIEW_CALLBACK,
    ]);
    assert.equal(client.clientId, "studio-test-client");
    assertRedirectAllowed(client, PRODUCTION_CALLBACK);
    assertRedirectAllowed(client, MOTION_CALLBACK);
  });

  it("accepts the Preview callback only when the new variable is the approved URI", () => {
    useStudioEnv({
      redirectUri: PRODUCTION_CALLBACK,
      preview: STUDIO_SSO_APPROVED_PREVIEW_CALLBACK,
    });
    const client = resolveStudioClient();
    assert.ok(client);
    assertRedirectAllowed(client, STUDIO_SSO_APPROVED_PREVIEW_CALLBACK);
    assert.equal(approvedPreviewRedirectUri(), STUDIO_SSO_APPROVED_PREVIEW_CALLBACK);
  });

  it("rejects the Preview callback when the variable is absent", () => {
    useStudioEnv({ redirectUri: PRODUCTION_CALLBACK });
    const client = resolveStudioClient();
    assert.ok(client);
    assert.deepEqual(client.allowedRedirectUris, [PRODUCTION_CALLBACK]);
    assert.throws(
      () => assertRedirectAllowed(client, STUDIO_SSO_APPROVED_PREVIEW_CALLBACK),
      (error: unknown) => error instanceof SsoError && error.code === "REDIRECT_MISMATCH",
    );
  });

  it("rejects an unrelated Vercel callback and does not append it", () => {
    useStudioEnv({
      redirectUri: PRODUCTION_CALLBACK,
      preview: STUDIO_SSO_APPROVED_PREVIEW_CALLBACK,
    });
    const client = resolveStudioClient();
    assert.ok(client);
    assert.equal(client.allowedRedirectUris.includes(UNRELATED_VERCEL), false);
    assert.throws(
      () => assertRedirectAllowed(client, UNRELATED_VERCEL),
      (error: unknown) => error instanceof SsoError && error.code === "REDIRECT_MISMATCH",
    );

    useStudioEnv({ redirectUri: PRODUCTION_CALLBACK, preview: UNRELATED_VERCEL });
    const ignored = resolveStudioClient();
    assert.ok(ignored);
    assert.deepEqual(ignored.allowedRedirectUris, [PRODUCTION_CALLBACK]);
  });

  it("rejects a wildcard callback and ignores a wildcard variable", () => {
    useStudioEnv({
      redirectUri: PRODUCTION_CALLBACK,
      preview: WILDCARD,
    });
    const client = resolveStudioClient();
    assert.ok(client);
    assert.deepEqual(client.allowedRedirectUris, [PRODUCTION_CALLBACK]);
    assert.equal(approvedPreviewRedirectUri(WILDCARD), null);
    assert.throws(
      () => assertRedirectAllowed(client, WILDCARD),
      (error: unknown) => error instanceof SsoError && error.code === "REDIRECT_MISMATCH",
    );
  });

  it("keeps the existing Studio client secret check and rejects open redirects", () => {
    useStudioEnv({
      redirectUri: PRODUCTION_CALLBACK,
      preview: STUDIO_SSO_APPROVED_PREVIEW_CALLBACK,
    });
    const client = authenticateSsoClient({
      authorizationHeader: "Bearer studio-test-secret",
      clientIdHeader: "studio-test-client",
      product: "studio",
    });
    assert.equal(client.product, "studio");
    assert.throws(
      () =>
        authenticateSsoClient({
          authorizationHeader: "Bearer wrong-secret",
          clientIdHeader: "studio-test-client",
          product: "studio",
        }),
      (error: unknown) => error instanceof SsoError && error.code === "UNAUTHORIZED_CLIENT",
    );
    for (const bad of [
      "https://studio.homecheff.eu.evil/auth/sso/callback",
      "https://evil.example/auth/sso/callback",
      "//evil.example/auth/sso/callback",
      "javascript:alert(1)",
      `${PRODUCTION_CALLBACK}/extra`,
    ]) {
      assert.throws(
        () => assertRedirectAllowed(client, bad),
        (error: unknown) => error instanceof SsoError && error.code === "REDIRECT_MISMATCH",
      );
    }
  });
});
