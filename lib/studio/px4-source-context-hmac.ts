/**
 * PX.4 — server-only HMAC for Studio → HomeCheff context fetch.
 * Do not import this from client components.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  isPx4OpaqueId,
  PX4_CONTEXT_MAX_SKEW_SEC,
} from '@/lib/studio/px4-source-context';

export function signStudioSourceContextRequest(opts: {
  secret: string;
  timestampSec: number;
  centralUserId: string;
  sourceType: string;
  sourceId: string;
}): string {
  const body = `${opts.timestampSec}\n${opts.centralUserId}\n${opts.sourceType}\n${opts.sourceId}`;
  return createHmac('sha256', opts.secret).update(body).digest('base64url');
}

function signaturesMatch(a: string, b: string): boolean {
  try {
    const left = Buffer.from(a);
    const right = Buffer.from(b);
    return left.length === right.length && timingSafeEqual(left, right);
  } catch {
    return false;
  }
}

export function verifyStudioSourceContextRequest(opts: {
  secrets: string[];
  timestampSec: number;
  nowSec?: number;
  signature: string;
  centralUserId: string;
  sourceType: string;
  sourceId: string;
}): boolean {
  const now = opts.nowSec ?? Math.floor(Date.now() / 1000);
  if (!Number.isFinite(opts.timestampSec)) return false;
  if (Math.abs(now - opts.timestampSec) > PX4_CONTEXT_MAX_SKEW_SEC) return false;
  if (!opts.centralUserId.trim() || !isPx4OpaqueId(opts.sourceId)) return false;
  for (const secret of opts.secrets) {
    if (!secret) continue;
    const expected = signStudioSourceContextRequest({
      secret,
      timestampSec: opts.timestampSec,
      centralUserId: opts.centralUserId,
      sourceType: opts.sourceType,
      sourceId: opts.sourceId,
    });
    if (signaturesMatch(opts.signature, expected)) return true;
  }
  return false;
}

export function studioContextSecretsFromEnv(): string[] {
  return [
    process.env.STUDIO_SSO_CLIENT_SECRET?.trim() ?? '',
    process.env.STUDIO_SSO_CLIENT_SECRET_PREVIOUS?.trim() ?? '',
  ].filter(Boolean);
}
