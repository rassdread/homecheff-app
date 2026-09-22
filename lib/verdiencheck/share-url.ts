/**
 * Canonical VerdienCheck share URL.
 * Always a clean /verdiencheck; affiliate ?ref= once via appendPersonalRef.
 * Never copies wizard/financial state into the shared URL.
 */

import { MAIN_DOMAIN } from '@/lib/seo/constants';
import { appendPersonalRef } from '@/lib/share/resolve-marketplace-share-url';
import {
  buildExactlyOnceWebShareData,
  buildSingleUrlWhatsAppHref,
  countDestinationUrlsInNativePayload,
  countHttpUrls,
} from '@/lib/share/exactly-once-share';

export const VERDIENCHECK_PATH = '/verdiencheck';

const FINANCIAL_QUERY_KEYS = [
  'income',
  'inkomen',
  'partner',
  'partnerincome',
  'allowances',
  'toeslag',
  'rent',
  'huur',
  'assets',
  'vermogen',
  'children',
  'kinderen',
  'childcare',
  'kinderopvang',
  'revenue',
  'omzet',
  'costs',
  'kosten',
  'scenario',
  'result',
  'bedrag',
  'amount',
  'pension',
  'pensioen',
  'deduction',
  'inhouding',
  'bank_net',
  'banknet',
  'payroll_deduction',
  'bonus',
  'commission',
  'commissie',
  'overtime',
  'overwerk',
  'thirteenth',
  'dertiende',
  'eindejaarsuitkering',
  'extra_wage',
  'extra_pay',
] as const;

export function canonicalVerdienCheckUrl(origin = MAIN_DOMAIN): string {
  return `${origin.replace(/\/$/, '')}${VERDIENCHECK_PATH}`;
}

/** Outbound share URL: clean path + optional personal ?ref= exactly once. */
export function buildVerdienCheckShareUrl(input: {
  referralCode?: string | null;
  origin?: string;
}): string {
  const clean = canonicalVerdienCheckUrl(input.origin);
  return appendPersonalRef(clean, input.referralCode || null, input.origin || MAIN_DOMAIN);
}

export function shareUrlContainsFinancialState(url: string): boolean {
  try {
    const parsed = new URL(url, MAIN_DOMAIN);
    if (parsed.pathname.replace(/\/+$/, '') !== VERDIENCHECK_PATH && !parsed.pathname.startsWith('/p/')) {
      /* promo landings may share /p/slug; still reject financial keys */
    }
    for (const key of parsed.searchParams.keys()) {
      const compact = key.toLowerCase().replace(/[^a-z0-9]+/g, '');
      if (FINANCIAL_QUERY_KEYS.some((needle) => compact === needle || compact.includes(needle))) {
        return true;
      }
    }
    const blob = `${parsed.search}${parsed.hash}`.toLowerCase();
    return FINANCIAL_QUERY_KEYS.some((needle) => blob.includes(needle) && needle.length > 4);
  } catch {
    return true;
  }
}

export function countRefAttribution(url: string): number {
  try {
    const parsed = new URL(url, MAIN_DOMAIN);
    return parsed.searchParams.getAll('ref').filter(Boolean).length;
  } catch {
    return (url.match(/[?&]ref=/gi) || []).length;
  }
}

export function countUrlOccurrences(haystack: string, url: string): number {
  if (!haystack || !url) return 0;
  let count = 0;
  let from = 0;
  while (from <= haystack.length) {
    const at = haystack.indexOf(url, from);
    if (at < 0) break;
    count += 1;
    from = at + url.length;
  }
  return count;
}

export function verdienCheckNativeShareData(input: {
  title: string;
  text: string;
  url: string;
}): ShareData {
  return buildExactlyOnceWebShareData(input);
}

export function verdienCheckWhatsAppHref(input: {
  title: string;
  text: string;
  url: string;
}): string {
  return buildSingleUrlWhatsAppHref(input.url, input.title, input.text);
}

export function verdienCheckShareUrlOccurrenceGuards(input: {
  url: string;
  copyBody: string;
  native: ShareData;
  whatsappHref: string;
}): {
  copyUrlCount: number;
  nativeUrlCount: number;
  whatsappUrlCount: number;
  refCount: number;
} {
  return {
    copyUrlCount: countUrlOccurrences(input.copyBody, input.url),
    nativeUrlCount: countDestinationUrlsInNativePayload(input.native),
    whatsappUrlCount: countHttpUrls(decodeURIComponent(input.whatsappHref.split('text=')[1] || '')),
    refCount: countRefAttribution(input.url),
  };
}
