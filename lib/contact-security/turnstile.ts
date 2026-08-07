/**
 * Cloudflare Turnstile server verification.
 * Dev/local: missing secret → bypass with warning (graceful).
 */

export type TurnstileVerifyResult =
  | { ok: true; bypassed?: boolean }
  | { ok: false; reason: 'TURNSTILE_FAILED' | 'TURNSTILE_MISSING'; error: string };

export async function verifyTurnstileToken(params: {
  token: unknown;
  remoteip?: string;
}): Promise<TurnstileVerifyResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  const token = typeof params.token === 'string' ? params.token.trim() : '';

  // Local/dev without keys: allow through (operators set keys in Production).
  if (!secret) {
    if (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'production') {
      // Production without secret is misconfiguration — fail closed.
      return {
        ok: false,
        reason: 'TURNSTILE_MISSING',
        error: 'Turnstile is not configured',
      };
    }
    return { ok: true, bypassed: true };
  }

  if (!token) {
    return { ok: false, reason: 'TURNSTILE_FAILED', error: 'Missing Turnstile token' };
  }

  try {
    const body = new URLSearchParams();
    body.set('secret', secret);
    body.set('response', token);
    if (params.remoteip && params.remoteip !== 'unknown') {
      body.set('remoteip', params.remoteip);
    }

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const data = (await res.json()) as { success?: boolean; 'error-codes'?: string[] };
    if (!data.success) {
      return {
        ok: false,
        reason: 'TURNSTILE_FAILED',
        error: (data['error-codes'] || ['verification_failed']).join(','),
      };
    }
    return { ok: true };
  } catch (err: any) {
    // Network failure: fail closed in production, open in dev
    if (process.env.NODE_ENV === 'production') {
      return {
        ok: false,
        reason: 'TURNSTILE_FAILED',
        error: err?.message || 'Turnstile verify error',
      };
    }
    return { ok: true, bypassed: true };
  }
}

export function getTurnstileSiteKey(): string | null {
  return (
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ||
    process.env.TURNSTILE_SITE_KEY?.trim() ||
    null
  );
}
