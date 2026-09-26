/**
 * Countries where an affiliate can finish normal onboarding today.
 *
 * There is no older commercial-country catalog in this app. Account country
 * defaults to NL, and the live shipping lane is domestic Netherlands.
 * NL / BE / SR in ecosystem-locale are language defaults, not market activation.
 * Add a code here only when that country is actually opened.
 */
export const AFFILIATE_FULLY_ACTIVE_COUNTRY_CODES = ['NL'] as const;

export type AffiliateMarketDecision = 'SUPPORTED' | 'INTEREST';

export function normalizeCountryCode(input: string | null | undefined): string | null {
  const code = (input ?? '').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return null;
  try {
    const name = new Intl.DisplayNames(['en'], { type: 'region' }).of(code);
    if (!name || name.toUpperCase() === code) return null;
    return code;
  } catch {
    return null;
  }
}

export function countryDisplayName(code: string, locale: 'nl' | 'en'): string {
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(code) || code;
  } catch {
    return code;
  }
}

export function decideAffiliateMarket(countryCode: string | null | undefined): AffiliateMarketDecision {
  const code = normalizeCountryCode(countryCode);
  if (!code) return 'INTEREST';
  return (AFFILIATE_FULLY_ACTIVE_COUNTRY_CODES as readonly string[]).includes(code)
    ? 'SUPPORTED'
    : 'INTEREST';
}
