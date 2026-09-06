import { createHmac, timingSafeEqual } from 'node:crypto';

export type EctaroShipSignatureResult =
  | { ok: true }
  | { ok: false; reason: 'missing_secret' | 'missing_signature' | 'invalid_signature' };

/**
 * Fail-closed EctaroShip webhook HMAC verification (sha256 hex).
 * Missing secret, missing signature, or mismatch → reject (no side effects).
 */
export function verifyEctaroShipWebhookSignature(
  payload: string,
  signature: string | null | undefined,
  secret: string | null | undefined = process.env.ECTAROSHIP_WEBHOOK_SECRET
): EctaroShipSignatureResult {
  const sec = typeof secret === 'string' ? secret.trim() : '';
  if (!sec) {
    return { ok: false, reason: 'missing_secret' };
  }

  const sig = typeof signature === 'string' ? signature.trim() : '';
  if (!sig) {
    return { ok: false, reason: 'missing_signature' };
  }

  try {
    const expectedHex = createHmac('sha256', sec).update(payload, 'utf8').digest('hex');
    // Accept raw hex or sha256=<hex>
    const provided = sig.toLowerCase().startsWith('sha256=')
      ? sig.slice('sha256='.length).trim()
      : sig.trim();

    const a = Buffer.from(expectedHex, 'utf8');
    const b = Buffer.from(provided, 'utf8');
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { ok: false, reason: 'invalid_signature' };
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: 'invalid_signature' };
  }
}

/** @deprecated Use verifyEctaroShipWebhookSignature — kept for call-site migration */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret?: string
): boolean {
  return verifyEctaroShipWebhookSignature(payload, signature, secret).ok;
}
