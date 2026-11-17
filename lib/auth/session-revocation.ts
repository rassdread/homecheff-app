/**
 * A session request that started before Uitloggen still finishes afterwards.
 * NextAuth then rewrites the session cookie from that response.
 * Record the browser session when logout starts, and strip it from any token
 * that is still being written.
 */

import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { NEXTAUTH_SESSION_COOKIE_NAME } from "@/lib/auth/session-cookie-name";

/** Cookies issued before browser session ids existed. */
export const LEGACY_AUTH_SESSION_SID = "*";

export type AuthTokenClaims = Record<string, unknown>;

export function browserSessionKey(token: { sid?: unknown } | null | undefined): string {
  const sid = typeof token?.sid === "string" ? token.sid.trim() : "";
  return sid || LEGACY_AUTH_SESSION_SID;
}

export function isBrowserSessionRevoked(
  key: string,
  revokedKeys: readonly string[],
): boolean {
  return revokedKeys.includes(key);
}

export function stripAuthTokenClaims(token: AuthTokenClaims): void {
  for (const key of Object.keys(token)) delete token[key];
  token.revoked = true;
}

export async function revokePresentedAuthSession(req: NextRequest): Promise<void> {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
      cookieName: NEXTAUTH_SESSION_COOKIE_NAME,
    });
    const userId = String(token?.id || token?.sub || "").trim();
    if (!userId) return;
    const sid = browserSessionKey(token);
    await prisma.authSessionRevocation.upsert({
      where: { userId_sid: { userId, sid } },
      create: { userId, sid },
      update: { createdAt: new Date() },
    });
  } catch (error) {
    console.error("auth session revoke failed", error);
  }
}

export async function presentedAuthSessionIsRevoked(
  token: AuthTokenClaims | null | undefined,
): Promise<boolean> {
  if (!token || token.revoked === true) return token?.revoked === true;
  const userId = String(token.id || token.sub || "").trim();
  if (!userId) return false;
  try {
    const row = await prisma.authSessionRevocation.findUnique({
      where: { userId_sid: { userId, sid: browserSessionKey(token) } },
      select: { id: true },
    });
    return Boolean(row);
  } catch (error) {
    console.error("auth session revoke lookup failed", error);
    return false;
  }
}

/** Mutates the token NextAuth is about to write back into the cookie. */
export async function stripRevokedAuthToken(token: AuthTokenClaims): Promise<boolean> {
  const revoked = await presentedAuthSessionIsRevoked(token);
  if (!revoked) return false;
  stripAuthTokenClaims(token);
  return true;
}
