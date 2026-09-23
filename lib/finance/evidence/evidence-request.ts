/**
 * PHASE 8D — shared request-side guards for the evidence endpoints.
 */
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NEXTAUTH_SESSION_COOKIE_NAME } from '@/lib/auth/session-cookie-name';

/** Uploads per hour per user. Generous for real use, useless for abuse. */
export const EVIDENCE_UPLOADS_PER_HOUR = 60;

const buckets = new Map<string, { count: number; resetAt: number }>();

export function checkEvidenceUploadRateLimit(
  userId: string,
  maxPerHour = EVIDENCE_UPLOADS_PER_HOUR,
  now = Date.now(),
): { allowed: boolean; remaining: number } {
  const hour = 60 * 60 * 1000;
  const rec = buckets.get(userId);
  if (!rec || now >= rec.resetAt) {
    buckets.set(userId, { count: 1, resetAt: now + hour });
    return { allowed: true, remaining: maxPerHour - 1 };
  }
  if (rec.count >= maxPerHour) return { allowed: false, remaining: 0 };
  rec.count += 1;
  return { allowed: true, remaining: maxPerHour - rec.count };
}

export function _resetEvidenceRateLimitForTests(): void {
  buckets.clear();
}

/**
 * The owner of the current request, resolved from the session alone.
 *
 * No endpoint in this phase accepts an owner id from the client, so this is the
 * only way an owner is ever established.
 */
export async function evidenceOwnerId(): Promise<string | null> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return null;
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  return user?.id ?? null;
}

/**
 * The owner, for the route that streams bytes.
 *
 * `auth()` runs HomeCheff's session callback, which refetches the user with its
 * relations on every call; combined with the email lookup above that is three
 * database round trips before a single byte moves, and a receipt viewer issues
 * one request per image. Measured against production this route spent most of
 * its time there, occasionally over ten seconds.
 *
 * So this reads the signed session token directly. It is the same credential
 * `auth()` starts from and the same one middleware trusts, verified the same
 * way — the request simply stops paying for profile data it does not use. The
 * id still comes from the server's own signature, never from the request body,
 * and the evidence lookup still matches on `ownerUserId`, so the authorization
 * boundary is unchanged.
 *
 * Deleted accounts need no special case here: account deletion purges their
 * evidence, so the row lookup finds nothing and the route answers 404.
 */
export async function evidenceReaderId(req: NextRequest): Promise<string | null> {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: NEXTAUTH_SESSION_COOKIE_NAME,
  }).catch(() => null);
  const id = (token as { id?: string; sub?: string } | null)?.id ?? token?.sub;
  return typeof id === 'string' && id ? id : null;
}

/**
 * Rejects cross-site writes.
 *
 * NextAuth's session cookie is SameSite=Lax, so a cross-site POST already
 * arrives without credentials and fails authentication. This is a second,
 * explicit layer for the endpoint that accepts file bytes.
 */
export function isSameOriginWrite(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return true; // same-origin fetches may omit it; the cookie still gates
  try {
    return new URL(origin).host === req.headers.get('host');
  } catch {
    return false;
  }
}
