/**
 * LEGAL-1 — public-facing labels only. No review/internal leakage.
 */

import type {
  SellerCommerceDeclaration,
  SellerCommercePublicLabel,
} from './seller-commerce-types';

export function resolveSellerCommercePublicLabel(input: {
  declaration: SellerCommerceDeclaration;
  verifiedBusiness: boolean;
}): SellerCommercePublicLabel {
  if (input.verifiedBusiness) return 'geverifieerd_bedrijf';
  if (input.declaration === 'SELF_DECLARED_PROFESSIONAL') {
    return 'zakelijke_aanbieder';
  }
  if (input.declaration === 'PRIVATE_OCCASIONAL') return 'particulier';
  return null;
}

/** Dutch display copy — self-declared platform labels, not legal certification. */
export function sellerCommercePublicLabelNl(
  label: SellerCommercePublicLabel,
): string | null {
  if (label === 'particulier') return 'Particulier';
  if (label === 'zakelijke_aanbieder') return 'Zakelijke aanbieder';
  if (label === 'geverifieerd_bedrijf') return 'Geverifieerd bedrijf';
  return null;
}
