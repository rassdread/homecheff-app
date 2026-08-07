/**
 * Contact form client IP resolution (proxy / Cloudflare aware).
 */

import type { NextRequest } from 'next/server';
import { createHash } from 'crypto';

export function getClientIp(req: NextRequest): string {
  const cf = req.headers.get('cf-connecting-ip')?.trim();
  if (cf) return cf.split(',')[0]!.trim();

  const real = req.headers.get('x-real-ip')?.trim();
  if (real) return real.split(',')[0]!.trim();

  const forwarded = req.headers.get('x-forwarded-for')?.trim();
  if (forwarded) return forwarded.split(',')[0]!.trim();

  // NextRequest.ip may exist on some runtimes
  const anyReq = req as NextRequest & { ip?: string };
  if (anyReq.ip) return anyReq.ip;

  return 'unknown';
}

export function hashForLog(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 16);
}
