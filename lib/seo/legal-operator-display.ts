/**
 * Display helpers for the canonical legal operator.
 * Values come from organization-identity.ts — do not hardcode KvK/city/name here.
 */

import { HOMECHEFF_BRAND_NAME, LEGAL_OPERATOR } from '@/lib/seo/organization-identity';

export type LegalOperatorDisplay = {
  brandName: typeof HOMECHEFF_BRAND_NAME;
  brandMark: string;
  legalName: typeof LEGAL_OPERATOR.legalName;
  kvk: typeof LEGAL_OPERATOR.kvk;
  vat: typeof LEGAL_OPERATOR.vat;
  locality: typeof LEGAL_OPERATOR.locality;
  addressCountry: typeof LEGAL_OPERATOR.addressCountry;
};

export function getLegalOperatorDisplay(): LegalOperatorDisplay {
  return {
    brandName: HOMECHEFF_BRAND_NAME,
    brandMark: `${HOMECHEFF_BRAND_NAME}®`,
    legalName: LEGAL_OPERATOR.legalName,
    kvk: LEGAL_OPERATOR.kvk,
    vat: LEGAL_OPERATOR.vat,
    locality: LEGAL_OPERATOR.locality,
    addressCountry: LEGAL_OPERATOR.addressCountry,
  };
}

/** Compact registry line for footers (operator · KvK · city). */
export function formatLegalOperatorRegistryLine(): string {
  return `${LEGAL_OPERATOR.legalName} · KvK ${LEGAL_OPERATOR.kvk} · ${LEGAL_OPERATOR.locality}`;
}
