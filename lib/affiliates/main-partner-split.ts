import {
  AFFILIATE_BUSINESS_COMMISSION_PCT,
  PARENT_AFFILIATE_BUSINESS_COMMISSION_PCT,
} from '@/lib/affiliate-config';

/**
 * Split one existing affiliate line between a partner and their MAIN.
 *
 * The line amount is already the product-specific affiliate base
 * (marketplace pool line, or a caller-supplied commission line).
 * Direct affiliates (no parent) keep the full line.
 * Partners keep the remainder after the MAIN override share of that same line.
 * Totals never exceed the line. This does not invent a second pool.
 */
export function splitAffiliateLineForHierarchy(input: {
  lineCents: number;
  isPartner: boolean;
}): {
  partnerOrDirectCents: number;
  mainOverrideCents: number;
  totalCents: number;
} {
  const line = Math.max(0, Math.floor(input.lineCents));
  if (!input.isPartner || line === 0) {
    return {
      partnerOrDirectCents: line,
      mainOverrideCents: 0,
      totalCents: line,
    };
  }
  const mainShareOfLine =
    PARENT_AFFILIATE_BUSINESS_COMMISSION_PCT / AFFILIATE_BUSINESS_COMMISSION_PCT;
  const mainOverrideCents = Math.floor(line * mainShareOfLine);
  const partnerOrDirectCents = line - mainOverrideCents;
  return {
    partnerOrDirectCents,
    mainOverrideCents,
    totalCents: partnerOrDirectCents + mainOverrideCents,
  };
}
