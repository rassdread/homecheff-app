import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import {
  LEGACY_AUTH_SESSION_SID,
  browserSessionKey,
  isBrowserSessionRevoked,
  stripAuthTokenClaims,
} from "./session-revocation";

test("a late response for the logged-out browser session is rejected", () => {
  const legacy = browserSessionKey({});
  const current = browserSessionKey({ sid: "browser-a" });
  const other = browserSessionKey({ sid: "browser-b" });
  const revoked = [LEGACY_AUTH_SESSION_SID, "browser-a"];

  assert.equal(legacy, "*");
  assert.equal(isBrowserSessionRevoked(legacy, revoked), true);
  assert.equal(isBrowserSessionRevoked(current, revoked), true);
  assert.equal(isBrowserSessionRevoked(other, revoked), false);
});

test("a stored revocation strips that browser session before it is written back", async () => {
  const url = process.env.DATABASE_URL ?? "";
  if (!url.includes("@127.0.0.1:5432/hc_vehicle_fit")) return;
  const { prisma } = await import("../prisma");
  const { stripRevokedAuthToken } = await import("./session-revocation");
  const userId = "logout-race-user";
  await prisma.authSessionRevocation.deleteMany({ where: { userId } });
  const other = {
    id: userId,
    email: "other@example.test",
    sub: userId,
    sid: "browser-b",
  };
  assert.equal(await stripRevokedAuthToken(other), false);
  assert.equal(other.sid, "browser-b");
  await prisma.authSessionRevocation.create({
    data: { userId, sid: "browser-a" },
  });
  const late = {
    id: userId,
    email: "a@example.test",
    sub: userId,
    sid: "browser-a",
    role: "BUYER",
  };
  assert.equal(await stripRevokedAuthToken(late), true);
  assert.deepEqual(late, { revoked: true });
  const legacy = { id: userId, email: "legacy@example.test", sub: userId };
  assert.equal(await stripRevokedAuthToken(legacy), false);
  await prisma.authSessionRevocation.create({
    data: { userId, sid: "*" },
  });
  assert.equal(await stripRevokedAuthToken(legacy), true);
  assert.equal("email" in legacy, false);
  await prisma.authSessionRevocation.deleteMany({ where: { userId } });
  await prisma.$disconnect();
});

test("a revoked token keeps no account claims to write back", () => {
  const token: Record<string, unknown> = {
    id: "user-a",
    email: "a@example.com",
    sub: "user-a",
    sid: "browser-a",
    role: "BUYER",
  };
  stripAuthTokenClaims(token);
  assert.deepEqual(token, { revoked: true });
});

test("logout records the browser session and tabs share that logout", () => {
  const root = process.cwd();
  const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");
  const logout = read("app/api/auth/ecosystem-logout/route.ts");
  const force = read("app/api/auth/force-logout/route.ts");
  const cleanup = read("lib/session-cleanup.ts");
  const guard = read("components/SessionGuard.tsx");
  const auth = read("lib/auth.ts");
  const middleware = read("middleware.ts");

  assert.match(logout, /revokePresentedAuthSession/);
  assert.match(force, /revokePresentedAuthSession/);
  assert.match(cleanup, /markBrowserLogout\(\)/);
  assert.match(cleanup, /type: 'logout'/);
  assert.ok(
    cleanup.lastIndexOf("markBrowserLogout()") >
      cleanup.indexOf("requestSessionEnd('/api/auth/ecosystem-logout')"),
  );
  assert.match(cleanup, /void Promise\.race/);
  assert.match(cleanup, /setTimeout\(resolve, 1500\)/);
  assert.ok(
    cleanup.indexOf("await requestSessionEnd('/api/auth/ecosystem-logout')") <
      cleanup.indexOf("await Promise.race"),
  );
  assert.match(auth, /stripRevokedAuthToken/);
  assert.match(auth, /minimalToken\.sid/);
  assert.ok(
    auth.lastIndexOf("stripRevokedAuthToken") >
      auth.indexOf("findUserByCanonicalEmail"),
  );
  assert.match(guard, /broadcast_logout/);
  assert.match(guard, /storage_logout/);
  assert.match(guard, /leaveStaleDocument/);
  assert.match(guard, /\/login\?callbackUrl=/);
  assert.match(guard, /fetch\('\/api\/auth\/session'/);
  assert.match(cleanup, /markBrowserLogout\(\);\s*postMarketplaceAuthChannel/);
  assert.match(guard, /readBrowserLogoutAt\(\) >= startedAt/);
  assert.match(middleware, /www\.homecheff\.eu/);
  assert.match(middleware, /homecheff\.nl/);
  assert.match(middleware, /www\.homecheff\.nl/);
  assert.match(read("app/layout.tsx"), /hc_tab_logout_at/);
});
