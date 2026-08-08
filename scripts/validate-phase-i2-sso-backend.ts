/**
 * Phase I.2 — SSO authorize/exchange validation suite.
 * Pure unit tests always run. DB integration runs when DATABASE_URL is set
 * (cleans up only rows tagged with correlationId prefix i2test:).
 *
 * Usage: npx tsx scripts/validate-phase-i2-sso-backend.ts
 */
import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

function loadEnv(path: string) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    let v = m[2]!;
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (process.env[m[1]!] == null) process.env[m[1]!] = v;
  }
}

loadEnv(".env.local");
loadEnv(".env");

function ok(msg: string) {
  console.log("  ✓", msg);
}

function base64Url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function main() {
  // --- Isolate SSO env for tests ---
  const prev = { ...process.env };
  process.env.CENTRAL_IDENTITY_ENABLED = "false";
  process.env.CENTRAL_SSO_ENABLED = "false";
  process.env.GROWTH_SSO_CLIENT_ID = "growth-i2-test";
  process.env.GROWTH_SSO_CLIENT_SECRET = "growth-i2-secret-do-not-use-in-prod-32b";
  process.env.GROWTH_SSO_REDIRECT_URI = "http://localhost:3000/auth/sso/callback";
  process.env.VERCEL_ENV = "development";
  delete process.env.SSO_CODE_PEPPER;

  const { isCentralSsoEnabled } = await import("../lib/identity/sso/flags");
  assert.equal(isCentralSsoEnabled(), false);
  ok("flag OFF by default pair");

  process.env.CENTRAL_IDENTITY_ENABLED = "true";
  process.env.CENTRAL_SSO_ENABLED = "true";
  // re-import won't re-read if cached — flags read process.env live each call
  assert.equal(isCentralSsoEnabled(), true);
  ok("flag ON when both identity+sso true");

  process.env.CENTRAL_SSO_ENABLED = "false";
  assert.equal(isCentralSsoEnabled(), false);
  ok("SSO alone false keeps gate closed");
  process.env.CENTRAL_SSO_ENABLED = "true";

  const {
    generateAuthorizationCode,
    hashAuthorizationCode,
    verifyPkceS256,
    base64UrlEncode,
  } = await import("../lib/identity/sso/code");
  const { SSO_ERROR_HTTP, SsoError, SSO_CODE_TTL_SECONDS } = await import(
    "../lib/identity/sso/constants"
  );
  const {
    authenticateGrowthClient,
    getSsoClient,
    assertRedirectAllowed,
  } = await import("../lib/identity/sso/client-registry");
  const {
    __resetSsoRateLimitsForTests,
    assertAuthorizeRateLimit,
    SSO_RATE_LIMITS,
  } = await import("../lib/identity/sso/rate-limit");
  const { resolveAccountStatus, toMinimalClaims } = await import(
    "../lib/identity/sso/account-status"
  );

  assert.equal(SSO_CODE_TTL_SECONDS, 60);
  assert.equal(SSO_ERROR_HTTP.USED_CODE, 409);
  assert.equal(SSO_ERROR_HTTP.EXPIRED_CODE, 410);
  assert.equal(SSO_ERROR_HTTP.SSO_DISABLED, 404);
  assert.equal(SSO_ERROR_HTTP.UNAUTHORIZED_CLIENT, 401);
  ok("TTL + HTTP status contract");

  const code = generateAuthorizationCode();
  assert.ok(code.length >= 40);
  const h1 = hashAuthorizationCode(code);
  const h2 = hashAuthorizationCode(code);
  assert.equal(h1, h2);
  assert.notEqual(h1, code);
  assert.equal(h1.length, 64);
  ok("256-bit code + deterministic SHA-256 hash-at-rest");

  const verifier = base64Url(randomBytes(32));
  const challenge = base64UrlEncode(createHash("sha256").update(verifier).digest());
  assert.equal(verifyPkceS256(verifier, challenge), true);
  assert.equal(verifyPkceS256(verifier + "x", challenge), false);
  assert.equal(verifyPkceS256("short", challenge), false);
  ok("PKCE S256 verify");

  const client = getSsoClient("growth");
  assert.equal(client.clientId, "growth-i2-test");
  assertRedirectAllowed(client, "http://localhost:3000/auth/sso/callback");
  assert.throws(
    () => assertRedirectAllowed(client, "https://evil.example/callback"),
    (e: unknown) => e instanceof SsoError && e.code === "REDIRECT_MISMATCH",
  );
  assert.throws(
    () => getSsoClient("studio"),
    (e: unknown) => e instanceof SsoError && e.code === "INVALID_REQUEST",
  );
  ok("client registry + redirect allowlist (no wildcards)");

  authenticateGrowthClient({
    authorizationHeader: `Bearer ${process.env.GROWTH_SSO_CLIENT_SECRET}`,
    clientIdHeader: "growth-i2-test",
    product: "growth",
  });
  assert.throws(
    () =>
      authenticateGrowthClient({
        authorizationHeader: "Bearer wrong-secret",
        clientIdHeader: null,
        product: "growth",
      }),
    (e: unknown) => e instanceof SsoError && e.code === "UNAUTHORIZED_CLIENT",
  );
  assert.throws(
    () =>
      authenticateGrowthClient({
        authorizationHeader: null,
        clientIdHeader: null,
        product: "growth",
      }),
    (e: unknown) => e instanceof SsoError && e.code === "UNAUTHORIZED_CLIENT",
  );
  ok("client secret Bearer auth (timing-safe)");

  // Open redirect / host spoof style URIs
  for (const bad of [
    "https://growth.homecheff.eu.evil/auth/sso/callback",
    "http://localhost:3000/auth/sso/callback/../../evil",
    "//evil.example/callback",
    "javascript:alert(1)",
  ]) {
    assert.throws(() => assertRedirectAllowed(client, bad));
  }
  ok("redirect security rejects lookalikes / schemes");

  assert.equal(
    resolveAccountStatus({ accountDeletedAt: null, suspendedAt: null }),
    "active",
  );
  assert.equal(
    resolveAccountStatus({ accountDeletedAt: null, suspendedAt: new Date() }),
    "suspended",
  );
  const claims = toMinimalClaims(
    {
      id: "u1",
      email: "a@b.c",
      emailVerified: new Date(),
      name: "Ada",
      image: null,
      profileImage: null,
      accountDeletedAt: null,
      suspendedAt: null,
    },
    "growth",
  );
  assert.equal(claims.aud, "growth");
  assert.ok(!("passwordHash" in claims));
  ok("minimal claims + account status");

  __resetSsoRateLimitsForTests();
  for (let i = 0; i < SSO_RATE_LIMITS.authorizeUser; i++) {
    assertAuthorizeRateLimit("1.1.1.1", "user-rate");
  }
  assert.throws(
    () => assertAuthorizeRateLimit("1.1.1.1", "user-rate"),
    (e: unknown) => e instanceof SsoError && e.code === "RATE_LIMITED",
  );
  ok("authorize rate limit");

  // --- DB integration ---
  if (!process.env.DATABASE_URL) {
    console.log("\n(skip DB integration — no DATABASE_URL)");
  } else {
    const { prisma } = await import("../lib/prisma");
    const { issueSsoAuthorizationCode } = await import("../lib/identity/sso/authorize");
    const { exchangeSsoAuthorizationCode } = await import("../lib/identity/sso/exchange");
    const { hashAuthorizationCode: hashCode } = await import("../lib/identity/sso/code");

    const user = await prisma.user.findFirst({
      where: { accountDeletedAt: null, suspendedAt: null },
      select: { id: true, email: true },
      orderBy: { createdAt: "asc" },
    });
    assert.ok(user?.id && user.email, "need at least one active HC user for integration");

    const corr = `i2test:${Date.now()}`;
    const v = base64Url(randomBytes(32));
    const ch = base64UrlEncode(createHash("sha256").update(v).digest());

    const issued = await issueSsoAuthorizationCode({
      centralUserId: user!.id,
      product: "growth",
      redirectUri: "http://localhost:3000/auth/sso/callback",
      state: "state-i2-test-abcdef",
      codeChallenge: ch,
      codeChallengeMethod: "S256",
      ip: "9.9.9.9",
      correlationId: corr,
    });

    const stored = await prisma.ssoAuthorizationCode.findUnique({
      where: { codeHash: hashCode(issued.authorizationCode) },
    });
    assert.ok(stored);
    assert.equal(stored!.codeHash, hashCode(issued.authorizationCode));
    assert.notEqual(stored!.codeHash, issued.authorizationCode);
    ok("authorize stores hash only");

    const exchanged = await exchangeSsoAuthorizationCode({
      code: issued.authorizationCode,
      product: "growth",
      redirectUri: "http://localhost:3000/auth/sso/callback",
      codeVerifier: v,
      authorizationHeader: `Bearer ${process.env.GROWTH_SSO_CLIENT_SECRET}`,
      clientIdHeader: "growth-i2-test",
      ip: "9.9.9.9",
      correlationId: corr,
    });
    assert.equal(exchanged.centralUserId, user!.id);
    assert.equal(exchanged.email, user!.email);
    assert.equal(exchanged.accountStatus, "active");
    ok("exchange returns minimal claims");

    await assert.rejects(
      () =>
        exchangeSsoAuthorizationCode({
          code: issued.authorizationCode,
          product: "growth",
          redirectUri: "http://localhost:3000/auth/sso/callback",
          codeVerifier: v,
          authorizationHeader: `Bearer ${process.env.GROWTH_SSO_CLIENT_SECRET}`,
          clientIdHeader: "growth-i2-test",
          ip: "9.9.9.9",
          correlationId: corr,
        }),
      (e: unknown) => e instanceof SsoError && e.code === "USED_CODE",
    );
    ok("sequential replay → USED_CODE");

    // Concurrent replay
    const v2 = base64Url(randomBytes(32));
    const ch2 = base64UrlEncode(createHash("sha256").update(v2).digest());
    const issued2 = await issueSsoAuthorizationCode({
      centralUserId: user!.id,
      product: "growth",
      redirectUri: "http://localhost:3000/auth/sso/callback",
      state: "state-i2-concurrent-xyz",
      codeChallenge: ch2,
      codeChallengeMethod: "S256",
      ip: "8.8.8.8",
      correlationId: corr,
    });

    const results = await Promise.allSettled([
      exchangeSsoAuthorizationCode({
        code: issued2.authorizationCode,
        product: "growth",
        redirectUri: "http://localhost:3000/auth/sso/callback",
        codeVerifier: v2,
        authorizationHeader: `Bearer ${process.env.GROWTH_SSO_CLIENT_SECRET}`,
        clientIdHeader: null,
        ip: "8.8.8.8",
        correlationId: corr,
      }),
      exchangeSsoAuthorizationCode({
        code: issued2.authorizationCode,
        product: "growth",
        redirectUri: "http://localhost:3000/auth/sso/callback",
        codeVerifier: v2,
        authorizationHeader: `Bearer ${process.env.GROWTH_SSO_CLIENT_SECRET}`,
        clientIdHeader: null,
        ip: "8.8.8.8",
        correlationId: corr,
      }),
    ]);
    const wins = results.filter((r) => r.status === "fulfilled");
    const losses = results.filter((r) => r.status === "rejected");
    assert.equal(wins.length, 1, `expected 1 success, got ${wins.length}`);
    assert.equal(losses.length, 1);
    assert.ok(
      losses[0]!.status === "rejected" &&
        losses[0].reason instanceof SsoError &&
        losses[0].reason.code === "USED_CODE",
    );
    ok("concurrent replay → exactly one success");

    // Wrong redirect / wrong secret / expired
    const v3 = base64Url(randomBytes(32));
    const ch3 = base64UrlEncode(createHash("sha256").update(v3).digest());
    const issued3 = await issueSsoAuthorizationCode({
      centralUserId: user!.id,
      product: "growth",
      redirectUri: "http://localhost:3000/auth/sso/callback",
      state: "state-i2-negatives",
      codeChallenge: ch3,
      codeChallengeMethod: "S256",
      correlationId: corr,
    });
    await assert.rejects(
      () =>
        exchangeSsoAuthorizationCode({
          code: issued3.authorizationCode,
          product: "growth",
          redirectUri: "https://evil.example/callback",
          codeVerifier: v3,
          authorizationHeader: `Bearer ${process.env.GROWTH_SSO_CLIENT_SECRET}`,
          clientIdHeader: null,
          correlationId: corr,
        }),
      (e: unknown) => e instanceof SsoError && e.code === "REDIRECT_MISMATCH",
    );
    await assert.rejects(
      () =>
        exchangeSsoAuthorizationCode({
          code: issued3.authorizationCode,
          product: "growth",
          redirectUri: "http://localhost:3000/auth/sso/callback",
          codeVerifier: v3,
          authorizationHeader: "Bearer totally-wrong",
          clientIdHeader: null,
          correlationId: corr,
        }),
      (e: unknown) => e instanceof SsoError && e.code === "UNAUTHORIZED_CLIENT",
    );
    // Force expiry
    await prisma.ssoAuthorizationCode.updateMany({
      where: { codeHash: hashCode(issued3.authorizationCode) },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    await assert.rejects(
      () =>
        exchangeSsoAuthorizationCode({
          code: issued3.authorizationCode,
          product: "growth",
          redirectUri: "http://localhost:3000/auth/sso/callback",
          codeVerifier: v3,
          authorizationHeader: `Bearer ${process.env.GROWTH_SSO_CLIENT_SECRET}`,
          clientIdHeader: null,
          correlationId: corr,
        }),
      (e: unknown) => e instanceof SsoError && e.code === "EXPIRED_CODE",
    );
    ok("security negatives: redirect / secret / expired");

    // Cleanup test artifacts
    const audits = await prisma.ssoAuditEvent.findMany({
      where: {
        metadata: { path: ["correlationId"], equals: corr },
      },
      select: { codeId: true, id: true },
    });
    const codeIds = audits.map((a) => a.codeId).filter(Boolean) as string[];
    if (codeIds.length) {
      await prisma.ssoAuthorizationCode.deleteMany({ where: { id: { in: codeIds } } });
    }
    await prisma.ssoAuditEvent.deleteMany({
      where: { metadata: { path: ["correlationId"], equals: corr } },
    });
    ok("cleaned i2test artifacts");
  }

  Object.assign(process.env, prev);
  console.log("\nPhase I.2 SSO backend tests: PASS");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
