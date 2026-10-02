/**
 * Canonical personal affiliate share URL.
 * QR, copy and share must all use this string. Attribution lands on /welkom/{code}.
 */
import { buildPersonalReferralUrl } from '@/lib/affiliates/personal-referral';

export function resolveAffiliatePersonalShareUrl(input: {
  referralLink?: string | null;
  referralCode?: string | null;
  origin?: string | null;
}): string {
  const fromApi = String(input.referralLink || '').trim();
  if (fromApi) return fromApi;
  const code = String(input.referralCode || '').trim();
  if (!code) return '';
  const origin = String(input.origin || 'https://homecheff.eu').replace(/\/+$/, '');
  return buildPersonalReferralUrl(origin, code);
}

export function referralCodeFromPersonalShareUrl(url: string): string | null {
  try {
    const path = new URL(url).pathname;
    const match = path.match(/\/welkom\/([^/]+)/i);
    if (!match?.[1]) return null;
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}
