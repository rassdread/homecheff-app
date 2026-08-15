/**
 * LEGAL-4A — when ARTICLE_30_APPLIES, check existing reusable fields before asking for new data.
 * Does not collect ID copies / BSN / TIN / IBAN.
 */

import {
  ARTICLE_30_REUSABLE_FIELD_KEYS,
  type DsaApplicabilityState,
  article30OnboardingRequired,
} from '@/lib/compliance/dsa-applicability';

export type Article30ExistingFieldInput = {
  name?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  companyName?: string | null;
  kvk?: string | null;
  vat?: string | null;
  hasBusinessRecord?: boolean;
  commerceDeclaration?: string | null;
  stripeConnectAccountId?: string | null;
};

function present(v: unknown): boolean {
  if (typeof v === 'boolean') return v;
  if (v == null) return false;
  if (typeof v === 'string') return v.trim().length > 0;
  return Boolean(v);
}

export function assessArticle30ExistingCoverage(
  dsaState: DsaApplicabilityState,
  input: Article30ExistingFieldInput,
): {
  onboardingRequired: boolean;
  presentKeys: string[];
  missingReusableKeys: string[];
  /** New sensitive collection blocked in LEGAL-4A */
  blockedNewCollection: readonly string[];
} {
  const onboardingRequired = article30OnboardingRequired(dsaState);
  const map: Record<(typeof ARTICLE_30_REUSABLE_FIELD_KEYS)[number], boolean> =
    {
      name: present(input.name),
      address: present(input.address),
      phone: present(input.phone),
      email: present(input.email),
      companyName: present(input.companyName),
      kvk: present(input.kvk),
      vat: present(input.vat),
      businessRecord: Boolean(input.hasBusinessRecord),
      commerceDeclaration: present(input.commerceDeclaration),
      stripeConnectStatus: present(input.stripeConnectAccountId),
    };
  const presentKeys = ARTICLE_30_REUSABLE_FIELD_KEYS.filter((k) => map[k]);
  const missingReusableKeys = ARTICLE_30_REUSABLE_FIELD_KEYS.filter(
    (k) => !map[k],
  );
  return {
    onboardingRequired,
    presentKeys: [...presentKeys],
    missingReusableKeys: [...missingReusableKeys],
    blockedNewCollection: [
      'PASSPORT_OR_ID_COPY',
      'BSN',
      'TIN',
      'LOCAL_IBAN_FOR_DSA',
    ],
  };
}
