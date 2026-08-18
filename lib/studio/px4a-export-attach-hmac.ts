/**
 * PX.4A.5 — server-only HMAC for Studio → HomeCheff generated-video pointer.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  PX4A_EXPORT_ATTACH_TTL_SEC,
  canonicalExportAttachBody,
  parseExportAttachPayload,
  type Px4aExportAttachPayload,
} from '@/lib/studio/px4a-export-attach';
import { studioItemHandoffSecrets } from '@/lib/studio/px4a-item-handoff-hmac';

export { studioItemHandoffSecrets };

export function signExportAttachPayload(payload: Px4aExportAttachPayload, secret: string): string {
  const body = Buffer.from(canonicalExportAttachBody(payload), 'utf8').toString('base64url');
  const sig = createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${sig}`;
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

export function verifyExportAttachToken(
  token: string,
  secrets: string[],
  nowSec = Math.floor(Date.now() / 1000),
): Px4aExportAttachPayload | null {
  const trimmed = token.trim();
  const dot = trimmed.lastIndexOf('.');
  if (dot <= 0) return null;
  const body = trimmed.slice(0, dot);
  const sig = trimmed.slice(dot + 1);
  if (!body || !sig) return null;
  let matched = false;
  for (const secret of secrets) {
    if (!secret) continue;
    const expected = createHmac('sha256', secret).update(body).digest('base64url');
    if (signaturesMatch(sig, expected)) {
      matched = true;
      break;
    }
  }
  if (!matched) return null;
  try {
    const json = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as unknown;
    const payload = parseExportAttachPayload(json);
    if (!payload) return null;
    if (payload.e <= nowSec || payload.e > nowSec + PX4A_EXPORT_ATTACH_TTL_SEC + 60) return null;
    return payload;
  } catch {
    return null;
  }
}
