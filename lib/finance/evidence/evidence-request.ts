/**
 * PHASE 8D — shared request-side guards for the evidence endpoints.
 */
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
